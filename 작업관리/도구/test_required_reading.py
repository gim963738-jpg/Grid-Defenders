"""OPS-004 workflow checks. Every task and acknowledgement lives in a temp directory."""
import copy
import importlib.util
import json
from pathlib import Path
import re
import tempfile
import unittest


SPEC = importlib.util.spec_from_file_location('required_reading_board', Path(__file__).with_name('작업대장.py'))
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class RequiredReadingTests(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        self.root = Path(temporary.name)
        self.board = MODULE.Board(self.root)
        (self.root / '양식').mkdir()
        templates = Path(__file__).resolve().parents[1] / '양식'
        for path in templates.glob('*.md'):
            (self.root / '양식' / path.name).write_bytes(path.read_bytes())
        self.worker = self.root / 'workers' / 'monsters'
        self.worker.mkdir(parents=True)
        self.agents = self.worker / 'AGENTS.md'
        self.agents.write_text('본인의 필독 문서를 읽고 임시 검사만 한다.\n', encoding='utf-8')
        self.common = self.root / '규정A.md'
        self.common.write_text('공통 기준 v1\n원본을 보존한다.\n', encoding='utf-8')
        rules = self.root / '기준' / 'monsters'
        rules.mkdir(parents=True)
        self.role_rule = rules / '규정.md'
        self.role_rule.write_text('몬스터의 신체 구조별 기준을 적용한다.\n', encoding='utf-8')
        self.method = rules / '작업진행방법.md'
        self.method.write_text('작업 방법 v1\n원본 확인 → 본문 열람 → 적용 요약 → 검증\n', encoding='utf-8')
        self.catalog = {
            'readingPolicyVersion': 'OPS-004',
            'branches': {'monsters': {
                'path': str(self.worker), 'selector': 'path:' + str(self.worker),
                'workMethod': str(self.method),
                'requiredReadings': [str(p) for p in [self.agents, self.common, self.role_rule, self.method]],
            }},
        }
        MODULE.write_json(self.root / '브랜치목록.json', self.catalog)
        self.proof = self.root / 'fixture-user-proof.txt'
        self.proof.write_text('Synthetic confirmation fixture only; no real user approval.', encoding='utf-8')
        self.report = self.root / 'fixture-result.json'
        MODULE.write_json(self.report, {'fixture': True, 'result': 'test data only'})
        self.ack_file = self.root / 'fixture-reading.json'

    def draft(self):
        task = self.board.new('main01', 'monsters', 'Synthetic reading gate', 'Temporary fixture request')
        for name in ['요청확인.md', '전문프롬프트.md', '2_사전확인.md']:
            path = self.board.folder(task['id']) / name
            path.write_text(re.sub(r'\{\{.*?\}\}', 'fixture-only value', path.read_text(encoding='utf-8')), encoding='utf-8')
        return task

    def approve_prepare(self, task):
        self.board.confirm(task['id'], 'main01', 'Synthetic user confirms fixture', self.proof)
        return self.board.prepare(task['id'], 'main01')

    def sent(self):
        task = self.draft()
        self.approve_prepare(task)
        self.board.record(task['id'], 'main01', 'sent', self.report)
        return self.board.load(task['id'], 'main01')

    def acknowledgement(self, task):
        pack = self.board.read_pack(task['id'], 'main01')
        return {
            'task': task['id'], 'iteration': pack['iteration'], 'role': 'monsters',
            'workSummary': '임시 원본을 보존하고 현재 규정에 맞춰 검사 자료만 만든다.',
            'documents': [
                {'path': row['path'], 'sha256': row['sha256'], 'applies': '이 기준을 현재 임시 검사 범위와 대조하고 게임 원본은 변경하지 않는다.'}
                for row in pack['documents']
            ],
        }

    def start(self, task, ack=None, role='monsters'):
        MODULE.write_json(self.ack_file, ack if ack is not None else self.acknowledgement(task))
        return self.board.start(task['id'], 'main01', role, self.ack_file)

    def snapshot(self, task):
        return (self.board.load(task['id'], 'main01'), self.board.leases())

    def test_read_pack_contains_exact_full_text_and_does_not_start_work(self):
        task = self.sent()
        before = self.snapshot(task)
        pack = self.board.read_pack(task['id'], 'main01')
        self.assertEqual((pack['task'], pack['iteration'], pack['role']), (task['id'], 1, 'monsters'))
        docs = {row['path']: row for row in pack['documents']}
        self.assertEqual(docs[str(self.method)]['content'], self.method.read_bytes().decode('utf-8'))
        self.assertEqual(docs[str(self.method)]['sha256'], MODULE.sha(self.method))
        self.assertEqual(self.snapshot(task), before)

    def test_missing_work_method_registration_is_blocked(self):
        task = self.draft()
        self.catalog['branches']['monsters']['requiredReadings'].remove(str(self.method))
        MODULE.write_json(self.root / '브랜치목록.json', self.catalog)
        with self.assertRaises(ValueError):
            self.board.read_pack(task['id'], 'main01')

    def test_missing_or_empty_required_file_blocks_start(self):
        task = self.sent()
        ack = self.acknowledgement(task)
        original = self.method.read_bytes()
        before = self.snapshot(task)
        self.method.unlink()
        with self.assertRaises((ValueError, OSError)):
            self.start(task, ack)
        self.method.write_text('  \n', encoding='utf-8')
        with self.assertRaises(ValueError):
            self.start(task, ack)
        self.method.write_bytes(original)
        self.assertEqual(self.snapshot(task), before)

    def test_unacknowledged_return_preserves_state_history_and_lease(self):
        task = self.sent()
        before = self.snapshot(task)
        with self.assertRaises(ValueError):
            self.board.record(task['id'], 'main01', 'returned', self.report)
        self.assertEqual(self.snapshot(task), before)

    def test_start_waits_for_delivery_record_without_claiming_approval_failure(self):
        task = self.draft()
        self.approve_prepare(task)
        before = self.snapshot(task)
        with self.assertRaisesRegex(ValueError, '발송 기록'):
            self.start(task)
        self.assertEqual(self.snapshot(task), before)

    def test_different_task_iteration_or_role_is_rejected(self):
        task = self.sent()
        original = self.acknowledgement(task)
        before = self.snapshot(task)
        for key, value in [('task', 'OTHER-TASK'), ('iteration', 2), ('role', 'ui')]:
            with self.subTest(key=key):
                ack = copy.deepcopy(original)
                ack[key] = value
                with self.assertRaises(ValueError):
                    self.start(task, ack)
        with self.assertRaises(ValueError):
            self.start(task, original, role='ui')
        self.assertEqual(self.snapshot(task), before)

    def test_omitted_document_duplicate_document_and_stale_digest_are_rejected(self):
        task = self.sent()
        original = self.acknowledgement(task)
        variants = []
        missing = copy.deepcopy(original)
        missing['documents'].pop()
        variants.append(missing)
        duplicate = copy.deepcopy(original)
        duplicate['documents'].append(copy.deepcopy(duplicate['documents'][0]))
        variants.append(duplicate)
        stale = copy.deepcopy(original)
        stale['documents'][0]['sha256'] = '0' * 64
        variants.append(stale)
        before = self.snapshot(task)
        for ack in variants:
            with self.subTest(documents=len(ack['documents'])):
                with self.assertRaises(ValueError):
                    self.start(task, ack)
        self.assertEqual(self.snapshot(task), before)

    def test_blank_or_placeholder_application_summaries_are_rejected(self):
        task = self.sent()
        original = self.acknowledgement(task)
        for field in ['workSummary', 'applies']:
            for value in ['  ', '{{apply this document}}']:
                with self.subTest(field=field, value=value):
                    ack = copy.deepcopy(original)
                    if field == 'workSummary':
                        ack[field] = value
                    else:
                        ack['documents'][0][field] = value
                    with self.assertRaises(ValueError):
                        self.start(task, ack)

    def test_normal_start_return_keeps_user_acceptance_separate(self):
        task = self.sent()
        current = self.start(task)
        self.assertEqual(current['status'], 'in_progress')
        self.assertEqual(current['history'][-1]['action'], 'start')
        self.assertTrue(Path(current['readingAcknowledgement']['path']).is_file())
        result = self.board.record(task['id'], 'main01', 'returned', self.report)
        self.assertEqual(result['status'], 'awaiting_user')
        self.assertEqual(self.board.leases(), {})
        with self.assertRaises(ValueError):
            self.board.record(task['id'], 'main01', 'accept', self.report)

    def test_input_ack_is_copied_and_later_input_edit_does_not_change_receipt(self):
        task = self.sent()
        started = self.start(task)
        receipt = Path(started['readingAcknowledgement']['path'])
        before = receipt.read_bytes()
        self.ack_file.write_text('source edited later', encoding='utf-8')
        self.assertEqual(receipt.read_bytes(), before)
        self.assertEqual(self.board.record(task['id'], 'main01', 'returned', self.report)['status'], 'awaiting_user')

    def test_utf8_bom_ack_supported_by_start_remains_readable_on_return(self):
        task = self.sent()
        ack = self.acknowledgement(task)
        self.ack_file.write_text(json.dumps(ack, ensure_ascii=False), encoding='utf-8-sig')
        self.assertEqual(self.board.start(task['id'], 'main01', 'monsters', self.ack_file)['status'], 'in_progress')
        self.assertEqual(self.board.record(task['id'], 'main01', 'returned', self.report)['status'], 'awaiting_user')

    def test_tampered_stored_ack_blocks_return_without_releasing_lease(self):
        task = self.sent()
        started = self.start(task)
        Path(started['readingAcknowledgement']['path']).write_text('{}\n', encoding='utf-8')
        before = self.snapshot(task)
        with self.assertRaises(ValueError):
            self.board.record(task['id'], 'main01', 'returned', self.report)
        self.assertEqual(self.snapshot(task), before)

    def test_changed_rules_require_reread_and_preserve_earlier_ack(self):
        task = self.sent()
        started = self.start(task)
        old_receipt = Path(started['readingAcknowledgement']['path'])
        old_bytes = old_receipt.read_bytes()
        self.method.write_text('작업 방법 v2\n새 재현 조건을 함께 검사한다.\n', encoding='utf-8')
        before = self.snapshot(task)
        with self.assertRaises(ValueError):
            self.board.record(task['id'], 'main01', 'returned', self.report)
        self.assertEqual(self.snapshot(task), before)
        restarted = self.start(task)
        self.assertNotEqual(restarted['readingAcknowledgement']['path'], str(old_receipt))
        self.assertEqual(old_receipt.read_bytes(), old_bytes)
        self.assertEqual(self.board.record(task['id'], 'main01', 'returned', self.report)['status'], 'awaiting_user')

    def test_revision_cannot_reuse_previous_acknowledgement(self):
        task = self.sent()
        previous_ack = self.acknowledgement(task)
        started = self.start(task, previous_ack)
        self.board.record(task['id'], 'main01', 'returned', self.report)
        revised = self.board.record(task['id'], 'main01', 'revise', self.proof, 'Synthetic user requests another fixture revision')
        self.assertEqual(revised['iteration'], 2)
        self.assertIsNone(revised['readingAcknowledgement'])
        self.assertTrue(Path(started['readingAcknowledgement']['path']).exists())
        self.approve_prepare(revised)
        self.board.record(task['id'], 'main01', 'sent', self.report)
        with self.assertRaises(ValueError):
            self.start(revised, previous_ack)
        self.assertEqual(self.start(revised)['status'], 'in_progress')

    def test_artifact_criteria_are_read_and_cannot_be_replaced_after_confirmation(self):
        task = self.draft()
        specific = self.root / '작품별 기준.md'
        specific.write_text('고블린 fixture의 오른손 무기를 유지한다.\n', encoding='utf-8')
        self.board.set_readings(task['id'], 'main01', [str(specific)])
        pack = self.board.read_pack(task['id'], 'main01')
        self.assertIn(str(specific), [row['path'] for row in pack['documents']])
        self.board.confirm(task['id'], 'main01', 'Synthetic user confirms fixture', self.proof)
        with self.assertRaises(ValueError):
            self.board.set_readings(task['id'], 'main01', [])
        specific.write_text('Unconfirmed changed artifact rule', encoding='utf-8')
        with self.assertRaises(ValueError):
            self.board.prepare(task['id'], 'main01')
        self.assertEqual(self.board.leases(), {})

    def test_prepared_prompt_preserves_approved_source_and_adds_required_instructions(self):
        task = self.draft()
        source = self.board.folder(task['id']) / '전문프롬프트.md'
        original = source.read_bytes()
        plan = self.approve_prepare(task)
        self.assertNotEqual(Path(plan['prompt']), source)
        self.assertEqual(source.read_bytes(), original)
        generated = Path(plan['prompt']).read_text(encoding='utf-8')
        self.assertIn(original.decode('utf-8').replace('\r\n', '\n'), generated)
        self.assertIn(str(self.method), generated)
        self.assertIn('read-pack', generated)
        self.assertIn('start', generated)
        self.assertIn(task['id'], generated)
        self.assertEqual(plan['sourcePromptSha256'], MODULE.sha(source))
        self.assertEqual(plan['promptSha256'], MODULE.sha(Path(plan['prompt'])))

    def test_tampered_generated_prompt_cannot_be_recorded_as_sent(self):
        task = self.draft()
        plan = self.approve_prepare(task)
        before = self.snapshot(task)
        Path(plan['prompt']).write_text('Missing reading instructions', encoding='utf-8')
        with self.assertRaises(ValueError):
            self.board.record(task['id'], 'main01', 'sent', self.report)
        self.assertEqual(self.snapshot(task), before)


if __name__ == '__main__':
    unittest.main(verbosity=2)

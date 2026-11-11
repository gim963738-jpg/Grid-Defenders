import importlib.util
import json
from pathlib import Path
import re
import tempfile
import unittest

SPEC = importlib.util.spec_from_file_location('taskboard', Path(__file__).with_name('작업대장.py'))
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class WorkflowTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.board = MODULE.Board(self.root)
        templates = Path(__file__).resolve().parents[1]/'양식'
        for p in templates.glob('*.md'):
            dest = self.root/'양식'/p.name
            dest.parent.mkdir(exist_ok=True)
            dest.write_bytes(p.read_bytes())
        (self.root/'규정A.md').write_text('rules v1',encoding='utf-8')
        branches = {}
        for name in ['monsters','ui']:
            folder = self.root/'workers'/name
            folder.mkdir(parents=True)
            (folder/'AGENTS.md').write_text('existing branch instructions',encoding='utf-8')
            rule = self.root/'기준'/name/'규정.md'
            rule.parent.mkdir(parents=True)
            rule.write_text('branch rules v1',encoding='utf-8')
            branches[name] = {'path':str(folder),'selector':'path:'+str(folder)}
        MODULE.write_json(self.root/'브랜치목록.json',{'branches':branches})
        self.proof = self.root/'user-evidence.md'
        self.proof.write_text('Temporary test fixture: user confirms the displayed request.',encoding='utf-8')
        self.report = self.root/'worker-result.json'
        self.report.write_text(json.dumps({'outcome':'succeeded','fixture':True}),encoding='utf-8')

    def task(self, main='main01', branch='monsters', filled=True):
        task = self.board.new(main,branch,'temporary fixture','sample request')
        if filled:
            for name in ['요청확인.md','전문프롬프트.md','2_사전확인.md']:
                path = self.board.folder(task['id'])/name
                path.write_text(re.sub(r'\{\{.*?\}\}','fixture requirement',path.read_text(encoding='utf-8')),encoding='utf-8')
        return task

    def approved(self, main='main01', branch='monsters'):
        task = self.task(main,branch)
        self.board.confirm(task['id'],main,'Confirmed by fixture user',self.proof)
        return task

    def returned(self):
        task = self.approved()
        self.board.prepare(task['id'],'main01')
        self.board.record(task['id'],'main01','sent',self.report)
        self.board.record(task['id'],'main01','returned',self.report)
        return task

    def test_unconfirmed_instruction_is_blocked(self):
        task = self.task()
        with self.assertRaises(ValueError):self.board.prepare(task['id'],'main01')
        self.assertEqual(self.board.leases(),{})

    def test_retired_main_cannot_register_work(self):
        MODULE.write_json(self.root/'메인목록.json', {
            'mains': {'main01': {'active': True}},
            'retiredMains': {'main02': {'status': 'retired'}}})
        for role in ['main02', 'main03']:
            with self.assertRaises(ValueError):
                self.task(role)
        self.assertFalse((self.root/'작업').exists())
        self.assertEqual(self.task()['main'], 'main01')

    def test_blank_confirmation_or_missing_proof_is_blocked(self):
        task = self.task()
        with self.assertRaises(ValueError):self.board.confirm(task['id'],'main01','',self.proof)
        with self.assertRaises(ValueError):self.board.confirm(task['id'],'main01','yes',self.root/'missing.md')

    def test_unfilled_precheck_is_not_a_confirmation(self):
        task = self.task(filled=False)
        with self.assertRaises(ValueError):self.board.confirm(task['id'],'main01','yes',self.proof)

    def test_confirmed_instruction_cannot_change_silently(self):
        task = self.approved()
        path = self.board.folder(task['id'])/'전문프롬프트.md'
        path.write_text('changed scope',encoding='utf-8')
        with self.assertRaises(ValueError):self.board.prepare(task['id'],'main01')

    def test_rule_changes_invalidate_confirmation(self):
        task = self.approved()
        (self.root/'규정A.md').write_text('changed rules',encoding='utf-8')
        with self.assertRaises(ValueError):self.board.prepare(task['id'],'main01')

    def test_changed_user_evidence_is_blocked(self):
        task = self.approved()
        self.proof.write_text('different statement',encoding='utf-8')
        with self.assertRaises(ValueError):self.board.prepare(task['id'],'main01')

    def test_two_mains_cannot_claim_same_branch(self):
        first = self.approved()
        second = self.approved('main02')
        self.board.prepare(first['id'],'main01')
        with self.assertRaises(ValueError):self.board.prepare(second['id'],'main02')

    def test_independent_branches_can_be_prepared_together(self):
        first = self.approved()
        second = self.approved('main03','ui')
        self.board.prepare(first['id'],'main01')
        self.board.prepare(second['id'],'main03')
        self.assertEqual(len(self.board.leases()),2)

    def test_other_main_and_path_traversal_are_blocked(self):
        task = self.approved()
        with self.assertRaises(ValueError):self.board.prepare(task['id'],'main02')
        with self.assertRaises(ValueError):self.board.folder('../outside')

    def test_return_and_user_acceptance_are_separate(self):
        task = self.returned()
        self.assertEqual(self.board.load(task['id'],'main01')['status'],'awaiting_user')
        with self.assertRaises(ValueError):self.board.record(task['id'],'main01','accept',self.proof)
        self.board.record(task['id'],'main01','accept',self.proof,'User accepts this result')
        self.assertEqual(self.board.load(task['id'],'main01')['status'],'accepted')

    def test_revision_preserves_previous_prompt_and_requires_confirmation(self):
        task = self.returned()
        self.board.record(task['id'],'main01','revise',self.proof,'User requests a revision')
        current = self.board.load(task['id'],'main01')
        self.assertEqual(current['iteration'],2)
        self.assertIsNone(current['approval'])
        self.assertTrue((self.board.folder(task['id'])/'이전차수/v001/전문프롬프트.md').exists())
        with self.assertRaises(ValueError):self.board.prepare(task['id'],'main01')

    def test_global_writer_lock_is_not_stolen(self):
        with self.board.writer():
            with self.assertRaises(ValueError):self.board.new('main02','ui','fixture','request')
            self.assertTrue((self.root/'상태/writer.lock').exists())
        self.assertFalse((self.root/'상태/writer.lock').exists())


if __name__ == '__main__':
    unittest.main(verbosity=2)

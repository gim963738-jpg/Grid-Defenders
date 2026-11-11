"""v3: synthetic click events ONLY in temp tests; no native clicks or dispatch.
Replaces archived tests that previously accepted text as user approval.
"""
import copy
import importlib.util
from pathlib import Path
import tempfile
import unittest

SPEC = importlib.util.spec_from_file_location('v3_tests', Path(__file__).with_name('워크플로우.py'))
M = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(M)


class WorkflowTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.events = {}
        self.b = M.Board(self.root, native_click_reader=lambda q: copy.deepcopy(self.events.get(q)))
        self.method = self.root/'method.md'; self.method.write_text('Read current spec.', encoding='utf-8')
        self.rules = self.root/'policy.md'; self.rules.write_text('Click only.', encoding='utf-8')
        branches = {r: {'selector': 'path:/'+r, 'path': str(self.root/r), 'workMethod': str(self.method),
                        'requiredReadings': [str(self.method), str(self.rules)]} for r in ['characters','qa']}
        M.write_json(self.root/'브랜치목록.json', {'branches': branches})
        self.source = self.root/'current.json'
        self.current = dict(goal='Fixture', deliverables=['two views'],
                            requirements=[{'id':'R1','source':'user','text':'Preserve equipment.'}],
                            professionalPrompt='Preserve equipment. Make two views.',
                            promptCoverage={'R1':'Preserve equipment.'}, keep=['equipment'], change=['angle'],
                            references=[], allowedFiles=['output/fixture'], checks=['two views'], image26={'allowed':False})
        M.write_json(self.source, self.current)
        self.proof = self.root/'evidence.json'
        M.write_json(self.proof, {'fixture':True,'result':'returned'})

    def task(self, role='characters'):
        t = self.b.new('main01',role,'Fixture','Create two views, preserve equipment.')
        return self.b.update_spec(t['id'],'main01',self.source,'Two views.','synthetic user fixture')

    def approved(self, role='characters'):
        t=self.task(role); q=self.b.approval_request(t['id'],'main01')
        self.events[q['questionId']]=dict(questionId=q['questionId'],task=t['id'],revision=t['iteration'],
                                        specSha256=q['specSha256'],actor='user',inputKind='option_click',
                                        option='진행',eventId=q['questionId']+'-event')
        return self.b.confirm(t['id'],'main01')

    def sent(self,role='characters'):
        t=self.approved(role); self.b.prepare(t['id'],'main01')
        return self.b.record(t['id'],'main01','sent',self.proof)

    def ack(self,t):
        return dict(task=t['id'],iteration=t['iteration'],role=t['branch'],workSummary='Use current spec.',
                    documents=[dict(**d,applies='Apply this document to fixture.') for d in self.b.reading_snapshot(t)],
                    requirementCoverage={'R1':'Keep equipment unchanged.'})

    def start(self,t,ack=None):
        p=self.root/'ack.json'; M.write_json(p,ack if ack is not None else self.ack(t))
        return self.b.start(t['id'],'main01',t['branch'],p)

    def returned(self):
        t=self.sent(); self.start(t)
        return self.b.record(t['id'],'main01','returned',self.proof)

    def test_one_instruction_file(self):
        t=self.task()
        self.assertEqual({p.name for p in self.b.folder(t['id']).iterdir()},{'task.json','통합작업명세.json'})
        self.assertNotIn('request',t)

    def test_no_adapter_rejects_all_text_and_forged_json(self):
        b=M.Board(self.root); t=self.task()
        M.write_json(self.proof,{'source':'button','option':'진행','actor':'user'})
        for quote in ['진행','진행해','ㅇㅇ','이 내용으로 진행','']:
            with self.subTest(quote=quote),self.assertRaisesRegex(ValueError,'클릭 출처'):
                b.confirm(t['id'],'main01',quote,self.proof)

    def test_retired_main_rejected(self):
        for main in ['main02','main03']:
            with self.assertRaises(ValueError):self.b.new(main,'characters','Fixture','Request')

    def test_owner_and_path_traversal(self):
        t=self.task()
        with self.assertRaises(ValueError):self.b.load(t['id'],'main02')
        with self.assertRaises(ValueError):self.b.folder('../other')

    def test_unapproved_prepare_has_no_lease(self):
        t=self.task()
        with self.assertRaises(ValueError):self.b.prepare(t['id'],'main01')
        self.assertEqual(self.b.leases(),{})

    def test_question_does_not_approve(self):
        t=self.task();self.b.approval_request(t['id'],'main01')
        with self.assertRaises(ValueError):self.b.confirm(t['id'],'main01')

    def test_free_text_with_exact_option_is_not_click(self):
        t=self.approved();q=t['pendingChoice'];self.events[q['questionId']]['inputKind']='free_text'
        with self.assertRaises(ValueError):self.b.prepare(t['id'],'main01')

    def test_event_identity_and_scope(self):
        t=self.task();q=self.b.approval_request(t['id'],'main01')
        good=dict(questionId=q['questionId'],task=t['id'],revision=t['iteration'],specSha256=q['specSha256'],
                  actor='user',inputKind='option_click',option='진행',eventId='fixture-click')
        for k,v in [('actor','assistant'),('inputKind','free_text'),('option','수정 요청'),
                    ('task','OTHER'),('revision',999),('specSha256','bad'),('eventId','')]:
            self.events[q['questionId']]={**good,k:v}
            with self.subTest(field=k),self.assertRaises(ValueError):self.b.confirm(t['id'],'main01')
        self.assertIsNone(self.b.load(t['id'])['approval'])

    def test_event_replay_rejected(self):
        t=self.approved();other=self.task('qa');q=self.b.approval_request(other['id'],'main01')
        self.events[q['questionId']]={**t['approval']['event'],'task':other['id'],'questionId':q['questionId'],
                                     'specSha256':q['specSha256']}
        with self.assertRaisesRegex(ValueError,'이미 사용'):self.b.confirm(other['id'],'main01')

    def test_scope_mutation_invalidates_approval(self):
        t=self.approved();p=self.b.spec_path(t);s=M.read_json(p);s['current']['goal']='Unapproved change';M.write_json(p,s)
        with self.assertRaises(ValueError):self.b.prepare(t['id'],'main01')

    def test_rule_mutation_invalidates_approval(self):
        t=self.approved();self.rules.write_text('New rule',encoding='utf-8')
        with self.assertRaises(ValueError):self.b.prepare(t['id'],'main01')

    def test_corrections_preserve_original_and_invalidate_permission(self):
        t=self.approved();t=self.b.update_spec(t['id'],'main01',self.source,'New correction','synthetic user')
        s=M.read_json(self.b.spec_path(t))
        self.assertIn('preserve equipment',s['originalRequest'])
        self.assertEqual(len(s['corrections']),2);self.assertEqual(len(s['revisionHistory']),2)
        self.assertIsNone(t['approval']);self.assertEqual(t['status'],'draft')

    def test_in_progress_spec_cannot_be_overwritten(self):
        t=self.sent()
        with self.assertRaises(ValueError):self.b.update_spec(t['id'],'main01',self.source,'change','user')

    def test_prompt_coverage_required(self):
        t=self.task();p=self.b.spec_path(t);s=M.read_json(p);s['current']['promptCoverage']={};M.write_json(p,s)
        with self.assertRaises(ValueError):self.b.approval_request(t['id'],'main01')

    def test_migration_not_automatically_dispatchable(self):
        t=self.task();p=self.b.spec_path(t);s=M.read_json(p);s['migration']={'needsReconciliation':True};M.write_json(p,s)
        with self.assertRaises(ValueError):self.b.approval_request(t['id'],'main01')

    def test_explicit_reconciliation_keeps_history_and_removes_migration_block(self):
        t=self.task();p=self.b.spec_path(t);s=M.read_json(p)
        s['migration']={'needsReconciliation':True,'records':[{'content':'historical request'}]};M.write_json(p,s)
        t=self.b.update_spec(t['id'],'main01',self.source,'Current scope reconciled','synthetic user')
        s=M.read_json(p)
        self.assertFalse(s['migration']['needsReconciliation'])
        self.assertEqual(s['migration']['records'][0]['content'],'historical request')
        self.b.approval_request(t['id'],'main01')

    def test_read_pack_omits_historical_bulk_without_changing_source(self):
        t=self.task();p=self.b.spec_path(t);s=M.read_json(p)
        s['revisionHistory']=[{'content':'UNRELATED_OLD_TEXT'}];M.write_json(p,s);before=p.read_bytes()
        view=next(d for d in self.b.read_pack(t['id'],'main01')['documents'] if d['path']==str(p))
        self.assertNotIn('UNRELATED_OLD_TEXT',view['content'])
        self.assertEqual(p.read_bytes(),before);self.assertEqual(view['sha256'],M.sha(p))

    def test_image26_evidence_required(self):
        t=self.task();p=self.b.spec_path(t);s=M.read_json(p);s['current']['image26']={'allowed':True};M.write_json(p,s)
        with self.assertRaisesRegex(ValueError,'2.6'):self.b.approval_request(t['id'],'main01')

    def test_branch_not_double_booked(self):
        a=self.approved();b=self.approved();self.b.prepare(a['id'],'main01')
        with self.assertRaises(ValueError):self.b.prepare(b['id'],'main01')

    def test_independent_branches(self):
        a=self.approved();b=self.approved('qa');self.b.prepare(a['id'],'main01');self.b.prepare(b['id'],'main01')
        self.assertEqual(len(self.b.leases()),2)

    def test_prepare_uses_same_spec_without_dispatch(self):
        t=self.approved();before=self.b.spec_path(t).read_bytes();plan=self.b.prepare(t['id'],'main01')
        self.assertEqual(plan['spec'],str(self.b.spec_path(t)));self.assertEqual(self.b.spec_path(t).read_bytes(),before)
        self.assertEqual(plan['status'],'prepared_not_sent')

    def test_tampered_spec_blocks_sent(self):
        t=self.approved();self.b.prepare(t['id'],'main01');self.b.spec_path(t).write_text('{}',encoding='utf-8')
        with self.assertRaises(ValueError):self.b.record(t['id'],'main01','sent',self.proof)

    def test_read_pack_is_scoped(self):
        t=self.task();p=self.b.read_pack(t['id'],'main01')
        self.assertNotIn('liveContext',p);self.assertNotIn('branches',p['context'])
        self.assertIn(str(self.b.spec_path(t)),[d['path'] for d in p['documents']])

    def test_start_requires_delivery_and_role(self):
        t=self.approved()
        with self.assertRaises(ValueError):self.start(t)
        t=self.sent();a=self.ack(t);a['role']='qa'
        with self.assertRaises(ValueError):self.start(t,a)

    def test_read_ack_integrity(self):
        t=self.sent();original=self.ack(t)
        for m in ['missing','stale','duplicate','placeholder','wrong_task','wrong_revision']:
            a=copy.deepcopy(original)
            if m=='missing':a['documents'].pop()
            if m=='stale':a['documents'][0]['sha256']='bad'
            if m=='duplicate':a['documents'].append(a['documents'][0])
            if m=='placeholder':a['documents'][0]['applies']='{{TODO}}'
            if m=='wrong_task':a['task']='OTHER'
            if m=='wrong_revision':a['iteration']+=1
            with self.subTest(m=m),self.assertRaises(ValueError):self.start(t,a)

    def test_requirement_ack_required(self):
        t=self.sent();a=self.ack(t);a['requirementCoverage']={}
        with self.assertRaises(ValueError):self.start(t,a)

    def test_ack_source_edit_preserves_receipt(self):
        t=self.sent();a=self.start(t);p=Path(a['readingAcknowledgement']['path']);before=p.read_bytes()
        (self.root/'ack.json').write_text('{}',encoding='utf-8');self.assertEqual(p.read_bytes(),before)
        self.b.record(t['id'],'main01','returned',self.proof)

    def test_stored_ack_tamper_keeps_lease(self):
        t=self.sent();a=self.start(t);Path(a['readingAcknowledgement']['path']).write_text('{}',encoding='utf-8')
        with self.assertRaises(ValueError):self.b.record(t['id'],'main01','returned',self.proof)
        self.assertIn(t['branch'],self.b.leases())

    def test_reread_after_rules_change(self):
        t=self.sent();self.start(t);self.method.write_text('New method',encoding='utf-8')
        with self.assertRaises(ValueError):self.b.record(t['id'],'main01','returned',self.proof)
        self.start(t);self.b.record(t['id'],'main01','returned',self.proof)

    def test_return_does_not_imply_other_stages(self):
        t=self.returned();self.assertEqual(t['status'],'returned')
        self.assertEqual({k:v['status'] for k,v in t['stages'].items()},
                         dict(production='unknown',technical='not_run',user='not_reviewed',integration='not_applied'))

    def test_technical_failure_independent(self):
        t=self.returned();before=copy.deepcopy(t['stages']);t=self.b.stage(t['id'],'main01','technical','fail',self.proof)
        for k in ['production','user','integration']:self.assertEqual(t['stages'][k],before[k])

    def test_acceptance_then_integration(self):
        t=self.returned()
        with self.assertRaises(ValueError):self.b.stage(t['id'],'main01','integration','applied',self.proof)
        with self.assertRaises(ValueError):self.b.record(t['id'],'main01','accept',self.proof)
        t=self.b.record(t['id'],'main01','accept',self.proof,'Fixture user accepts')
        self.assertEqual(t['stages']['integration']['status'],'not_applied')
        t=self.b.record(t['id'],'main01','integrated',self.proof)
        self.assertEqual(t['stages']['integration']['status'],'applied')

    def test_rejection_is_not_new_permission(self):
        t=self.returned();t=self.b.record(t['id'],'main01','revise',self.proof,'Fix wrist')
        self.assertEqual(t['stages']['user']['status'],'rejected')
        with self.assertRaises(ValueError):self.b.prepare(t['id'],'main01')
        self.assertEqual(M.read_json(self.b.spec_path(t))['corrections'][-1]['text'],'Fix wrist')

    def test_queue_waits_for_topic_close_and_actual_report(self):
        self.b.topic('current');t=self.returned()
        self.assertEqual(self.b.notifications(),{'deferred':True,'items':[]})
        self.b.topic('current',close=True);items=self.b.notifications()['items']
        self.assertEqual(len(items),1);self.assertEqual(items[0]['task'],t['id'])
        self.assertEqual(len(self.b.notifications()['items']),1)
        self.assertEqual(self.b.notifications([items[0]['eventId']])['items'],[])

    def test_queue_deduplicates(self):
        for _ in range(2):self.b._queue('event1','FIXTURE','done',M.evidence(self.proof))
        self.assertEqual(len(self.b.notifications()['items']),1)

    def test_wrong_topic_does_not_close_conversation(self):
        self.b.topic('A')
        with self.assertRaises(ValueError):self.b.topic('B',close=True)
        with self.assertRaises(ValueError):self.b.topic('B')
        self.assertTrue(self.b.notifications()['deferred'])

    def test_writer_lock_not_stolen(self):
        with self.b.writer():
            with self.assertRaises(ValueError):self.b.new('main01','qa','other','fixture')
            self.assertTrue((self.root/'상태/writer.lock').exists())
        self.assertFalse((self.root/'상태/writer.lock').exists())


if __name__=='__main__':unittest.main(verbosity=2)

"""Temporary fixtures for explicit question replies and the 12-step pipeline.
No native click authentication, generation, real user approvals or dispatches.
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
        self.b = M.Board(self.root)
        self.method = self.root/'method.md'; self.method.write_text('Read current spec.', encoding='utf-8')
        self.rules = self.root/'policy.md'; self.rules.write_text('Explicit response marker for the current question.', encoding='utf-8')
        branches = {r: {'selector': 'path:/'+r, 'path': str(self.root/r), 'workMethod': str(self.method),
                        'requiredReadings': [str(self.method), str(self.rules)]} for r in ['characters','qa']}
        M.write_json(self.root/'브랜치목록.json', {'branches': branches})
        self.source = self.root/'current.json'
        self.current = dict(goal='Fixture', outputKind='document', deliverables=['two views'],
                            requirements=[{'id':'R1','source':'user','text':'Preserve equipment.'}],
                            professionalPrompt='Preserve equipment. Make two views.',
                            promptCoverage={'R1':'Preserve equipment.'}, keep=['equipment'], change=['angle'],
                            references=[], allowedFiles=['output/fixture'], checks=['two views'], image26={'allowed':False})
        M.write_json(self.source, self.current)
        self.proof = self.root/'evidence.json'
        M.write_json(self.proof, {'fixture':True,'result':'returned'})

    def task(self, role='characters'):
        t = self.b.new('main01',role,'Fixture','Create two views, preserve equipment.')
        t = self.b.update_spec(t['id'],'main01',self.source,'Two views.','synthetic user fixture')
        return self.brief(t)

    def brief(self, t):
        path=self.root/'brief.json'
        M.write_json(path,{k:'Detailed fixture briefing: '+k for k in ['goal','inputs','deliverables','keep','change','sequence','checks','unknowns']})
        return self.b.pipeline_event(t['id'],'main01','brief',path)

    def approved(self, role='characters'):
        t=self.task(role); q=self.b.approval_request(t['id'],'main01')
        return self.answer(q)

    def answer(self, q, text=None, **overrides):
        response=dict(questionId=q['questionId'],task=q['task'],revision=q['revision'],
                      specSha256=q['specSha256'],actor='user',text=q['options'][0] if text is None else text)
        response.update(overrides)
        path=self.root/('reply-'+q['questionId']+'.json');M.write_json(path,response)
        return self.b.confirm(q['task'],'main01',source=path)

    def sent(self,role='characters'):
        t=self.approved(role); self.b.prepare(t['id'],'main01')
        return self.b.record(t['id'],'main01','sent',self.proof)

    def ack(self,t):
        coverage={'R1':'Keep equipment unchanged.'}
        if t.get('pipeline',{}).get('phase')=='revision':
            coverage.update({i['id']:'Apply exact feedback: '+i['text'] for i in M.read_json(self.b.spec_path(t))['feedback']['items']})
        return dict(task=t['id'],iteration=t['iteration'],role=t['branch'],workSummary='Use current spec.',
                    documents=[dict(**d,applies='Apply this document to fixture.') for d in self.b.reading_snapshot(t)],
                    requirementCoverage=coverage)

    def start(self,t,ack=None):
        p=self.root/'ack.json'; M.write_json(p,ack if ack is not None else self.ack(t))
        return self.b.start(t['id'],'main01',t['branch'],p)

    def returned(self):
        t=self.sent(); self.start(t)
        return self.b.record(t['id'],'main01','returned',self.proof)

    def revision_returned(self):
        t=self.returned();self.b.pipeline_event(t['id'],'main01','present',self.proof)
        self.b.record(t['id'],'main01','revise',self.proof,'Fix wrist')
        revised=copy.deepcopy(self.current);revised['professionalPrompt']+=' Fix wrist.';revised['feedbackCoverage']={'F1-1':'Fix wrist.'}
        M.write_json(self.source,revised)
        t=self.b.update_spec(t['id'],'main01',self.source,'Fix wrist','fixture user')
        q=self.b.approval_request(t['id'],'main01')
        self.answer(q)
        self.b.pipeline_event(t['id'],'main01','criteria',self.proof)
        self.b.prepare(t['id'],'main01');self.b.record(t['id'],'main01','sent',self.proof);self.start(self.b.load(t['id']))
        return self.b.record(t['id'],'main01','returned',self.proof)

    def review(self,t,status='pass'):
        path=self.root/'review.json'
        body={'task':t['id'],'iteration':t['iteration'],'specSha256':M.sha(self.b.spec_path(t)),
              'resultEvidence':t['pipeline']['lastResult'],'artifacts':[M.evidence(self.proof)],
              'checks':[{'id':i['id'],'status':status,'note':'Actual fixture comparison','evidence':M.evidence(self.proof)} for i in t['pipeline']['criteria']]}
        M.write_json(path,body)
        return self.b.pipeline_event(t['id'],'main01','self-review',path)

    def test_one_instruction_file(self):
        t=self.task()
        self.assertEqual({p.name for p in self.b.folder(t['id']).iterdir()},{'task.json','통합작업명세.json'})
        self.assertNotIn('request',t)

    def test_plain_chat_quotes_examples_and_hold_are_not_approval(self):
        t=self.task();q=self.b.approval_request(t['id'],'main01')
        for text in ['진행','진행해','ㅇㅇ','보류','이 내용으로 진행','',
                     '"'+M.PROCEED_MARKER+'"','예시: '+M.PROCEED_MARKER,
                     '그럼 이렇게 보내 '+M.PROCEED_MARKER]:
            with self.subTest(text=text),self.assertRaises(ValueError):self.answer(q,text)
        self.assertIsNone(self.b.load(t['id'])['approval'])

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

    def test_exact_marker_works_without_click_origin_or_adapter(self):
        t=self.task();q=self.b.approval_request(t['id'],'main01')
        self.assertEqual(q['options'],[M.PROCEED_MARKER,'보류'])
        t=self.answer(q,M.PROCEED_MARKER,inputKind='free_text')
        self.assertEqual(t['status'],'confirmed')
        self.assertEqual(self.b.prepare(t['id'],'main01')['status'],'prepared_not_sent')

    def test_event_identity_and_scope(self):
        t=self.task();q=self.b.approval_request(t['id'],'main01')
        for k,v in [('actor','assistant'),('text','수정 요청'),('task','OTHER'),
                    ('revision',999),('specSha256','bad'),('questionId','different-question')]:
            with self.subTest(field=k),self.assertRaises(ValueError):self.answer(q,**{k:v})
        self.assertIsNone(self.b.load(t['id'])['approval'])

    def test_event_replay_rejected(self):
        t=self.approved();other=self.task('qa');q=self.b.approval_request(other['id'],'main01')
        with self.assertRaises(ValueError):self.b.confirm(other['id'],'main01',source=t['approval']['source']['path'])
        with self.assertRaises(ValueError):self.b.confirm(t['id'],'main01',source=t['approval']['source']['path'])

    def test_reply_record_is_copied_and_stored_tamper_blocks_prepare(self):
        t=self.approved();original=Path(t['approval']['originalSource']['path'])
        original.write_text('input overwritten later',encoding='utf-8')
        self.b.validate_approval(t)  # immutable copy is authoritative
        Path(t['approval']['source']['path']).write_text('{}',encoding='utf-8')
        with self.assertRaises(ValueError):self.b.prepare(t['id'],'main01')

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
        self.brief(t);self.b.approval_request(t['id'],'main01')

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
        with self.assertRaises(ValueError):self.b.record(t['id'],'main01','accept',self.proof,'Cannot skip feedback loop')
        t=self.revision_returned();t=self.review(t)
        self.b.pipeline_event(t['id'],'main01','present',self.proof)
        t=self.b.record(t['id'],'main01','accept',self.proof,'Fixture user accepts')
        self.assertEqual(t['stages']['integration']['status'],'not_applied')
        t=self.b.record(t['id'],'main01','integrated',self.proof)
        self.assertEqual(t['stages']['integration']['status'],'applied')

    def test_rejection_is_not_new_permission(self):
        t=self.returned();self.b.pipeline_event(t['id'],'main01','present',self.proof)
        t=self.b.record(t['id'],'main01','revise',self.proof,'Fix wrist')
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

    def test_detailed_brief_must_precede_button(self):
        t=self.b.new('main01','characters','Brief fixture','User request')
        t=self.b.update_spec(t['id'],'main01',self.source,'clarification','user')
        with self.assertRaises(ValueError):self.b.approval_request(t['id'],'main01')
        path=self.root/'incomplete-brief.json';M.write_json(path,{'goal':'too short'})
        with self.assertRaises(ValueError):self.b.pipeline_event(t['id'],'main01','brief',path)

    def test_first_result_is_presentable_without_self_review(self):
        t=self.returned();self.assertEqual(t['pipeline']['step'],5)
        self.assertIsNone(t['pipeline']['review'])
        self.assertEqual(len(self.b.notifications()['items']),1)
        with self.assertRaises(ValueError):self.review(t)
        t=self.b.pipeline_event(t['id'],'main01','present',self.proof)
        self.assertEqual(t['pipeline']['step'],6)

    def test_feedback_before_user_presentation_is_rejected(self):
        t=self.returned()
        with self.assertRaises(ValueError):self.b.record(t['id'],'main01','revise',self.proof,'unseen result')

    def test_feedback_button_is_distinct_and_extra_feedback_invalidates_it(self):
        t=self.returned();self.b.pipeline_event(t['id'],'main01','present',self.proof)
        self.b.record(t['id'],'main01','revise',self.proof,'Fix wrist')
        revised=copy.deepcopy(self.current);revised['professionalPrompt']+=' Fix wrist.';revised['feedbackCoverage']={'F1-1':'Fix wrist.'}
        M.write_json(self.source,revised)
        t=self.b.update_spec(t['id'],'main01',self.source,'Fix wrist','user')
        q=self.b.approval_request(t['id'],'main01')
        self.assertEqual(q['options'][0],'피드백 받음(적용)')
        with self.assertRaises(ValueError):self.answer(q,M.PROCEED_MARKER)
        path=self.root/'extra-feedback.json';M.write_json(path,{'text':'Also preserve sword length'})
        t=self.b.pipeline_event(t['id'],'main01','feedback',path)
        self.assertEqual(t['pipeline']['step'],6)
        items=M.read_json(self.b.spec_path(t))['feedback']['items']
        self.assertEqual([i['text'] for i in items],['Fix wrist','Also preserve sword length'])
        self.assertIsNone(t['approval'])
        with self.assertRaises(ValueError):self.b.confirm(t['id'],'main01')

    def test_criteria_cannot_be_established_before_feedback_click(self):
        t=self.returned();self.b.pipeline_event(t['id'],'main01','present',self.proof)
        t=self.b.record(t['id'],'main01','revise',self.proof,'Fix wrist')
        with self.assertRaises(ValueError):self.b.pipeline_event(t['id'],'main01','criteria',self.proof)

    def test_feedback_omitted_from_revision_prompt_blocks_button(self):
        t=self.returned();self.b.pipeline_event(t['id'],'main01','present',self.proof)
        self.b.record(t['id'],'main01','revise',self.proof,'Fix wrist')
        t=self.b.update_spec(t['id'],'main01',self.source,'Fix wrist','user')
        with self.assertRaisesRegex(ValueError,'모든 피드백'):self.b.approval_request(t['id'],'main01')

    def test_revised_result_hidden_until_review(self):
        t=self.revision_returned();self.assertEqual(t['pipeline']['step'],10)
        self.assertEqual(self.b.notifications()['items'],[])
        with self.assertRaises(ValueError):self.b.pipeline_event(t['id'],'main01','present',self.proof)
        with self.assertRaises(ValueError):self.b.record(t['id'],'main01','accept',self.proof,'premature')

    def test_fail_and_warning_return_to_step9_without_reporting(self):
        for status in ['fail','warning','unknown']:
            with self.subTest(status=status):
                t=self.revision_returned();t=self.review(t,status)
                self.assertEqual(t['pipeline']['step'],9)
                self.assertEqual(t['stages']['technical']['status'],'fail')
                self.assertEqual(self.b.notifications()['items'],[])
                with self.assertRaises(ValueError):self.b.pipeline_event(t['id'],'main01','present',self.proof)

    def test_failed_review_can_retry_same_approved_criteria(self):
        t=self.revision_returned();t=self.review(t,'fail');criteria=copy.deepcopy(t['pipeline']['criteria'])
        self.b.prepare(t['id'],'main01');self.b.record(t['id'],'main01','sent',self.proof)
        self.start(self.b.load(t['id']));t=self.b.record(t['id'],'main01','returned',self.proof)
        self.assertEqual(t['pipeline']['step'],10);self.assertEqual(t['pipeline']['criteria'],criteria)
        t=self.review(t);self.assertEqual(t['pipeline']['step'],11)

    def test_all_pass_then_user_verdict_completes(self):
        t=self.revision_returned();t=self.review(t)
        self.assertEqual(t['pipeline']['step'],11)
        self.assertEqual(t['stages']['user']['status'],'not_reviewed')
        self.assertEqual(len(self.b.notifications()['items']),1)
        t=self.b.pipeline_event(t['id'],'main01','present',self.proof)
        self.assertEqual(t['pipeline']['step'],12)
        t=self.b.record(t['id'],'main01','accept',self.proof,'User final acceptance')
        self.assertTrue(t['pipeline']['completed'])

    def test_extra_feedback_after_final_presentation_restarts_at6(self):
        t=self.revision_returned();self.review(t);self.b.pipeline_event(t['id'],'main01','present',self.proof)
        t=self.b.record(t['id'],'main01','revise',self.proof,'Fix shield too')
        self.assertEqual(t['pipeline']['step'],6);self.assertEqual(t['pipeline']['round'],2)
        s=M.read_json(self.b.spec_path(t));self.assertEqual(s['feedbackHistory'][0]['items'][0]['text'],'Fix wrist')
        self.assertEqual(s['feedback']['items'][0]['text'],'Fix shield too')

    def test_missing_check_or_wrong_revision_cannot_pass(self):
        t=self.revision_returned();path=self.root/'bad-review.json'
        base={'task':t['id'],'iteration':t['iteration'],'specSha256':M.sha(self.b.spec_path(t)),
              'resultEvidence':t['pipeline']['lastResult'],'artifacts':[M.evidence(self.proof)],'checks':[]}
        M.write_json(path,base)
        with self.assertRaises(ValueError):self.b.pipeline_event(t['id'],'main01','self-review',path)
        base['iteration']+=1;M.write_json(path,base)
        with self.assertRaises(ValueError):self.b.pipeline_event(t['id'],'main01','self-review',path)

    def test_output_tamper_after_review_blocks_reporting(self):
        t=self.revision_returned();self.review(t)
        self.proof.write_text('changed output',encoding='utf-8')
        with self.assertRaises(ValueError):self.b.pipeline_event(t['id'],'main01','present',self.proof)
        self.assertEqual(self.b.notifications()['items'],[])

    def test_locked_feedback_cannot_be_weakened(self):
        t=self.revision_returned();t['pipeline']['criteria'][0]['text']='Ignore wrist';self.b.save(t)
        with self.assertRaises(ValueError):self.review(t)

    def test_stage_cannot_bypass_final_judgment(self):
        t=self.returned()
        with self.assertRaises(ValueError):self.b.stage(t['id'],'main01','user','accepted',self.proof,'premature')

    def test_preset_exception_requires_actual_preexisting_rules(self):
        self.current['firstReviewPreset']={'name':'GC9','criteria':[{'id':'G1','text':'Known style'}]}
        M.write_json(self.source,self.current);t=self.task()
        with self.assertRaises(ValueError):self.b.approval_request(t['id'],'main01')

    def test_established_preset_exception_reviews_first_result(self):
        self.current['firstReviewPreset']={'name':'GC9','criteria':[{'id':'G1','text':'Known style'}],
                                          'establishedEvidence':M.evidence(self.rules)}
        M.write_json(self.source,self.current)
        t=self.returned();self.assertEqual(t['pipeline']['step'],10)
        self.assertEqual(self.b.notifications()['items'],[])
        t=self.review(t);self.assertEqual(t['pipeline']['step'],11)

    def test_visual_results_require_common_viewer_before_approval(self):
        self.current['outputKind']='visual';M.write_json(self.source,self.current)
        t=self.task()
        with self.assertRaisesRegex(ValueError,'공통 뷰어'):self.b.approval_request(t['id'],'main01')

    def test_visual_result_presentation_requires_registered_original_bytes(self):
        public=self.root/'public';viewer=public/'dev-previews/viewer';viewer.mkdir(parents=True)
        image=viewer/'result.png';image.write_bytes(b'fixture original bytes')
        catalog=viewer/'catalog.json'
        M.write_json(catalog,{'collections':[{'id':'fixture-visual','assets':[{'id':'first','src':'/dev-previews/viewer/result.png','sha256':M.sha(image)}]}]})
        self.current.update(outputKind='visual',viewer={'entry':'/dev-previews/viewer/index.html','catalogFile':str(catalog),'collection':'fixture-visual'})
        M.write_json(self.source,self.current);t=self.returned()
        t=self.b.pipeline_event(t['id'],'main01','present',self.proof)
        self.assertEqual(t['pipeline']['presentationViewer']['collection'],'fixture-visual')

    def test_visual_result_cannot_present_a_changed_or_missing_image(self):
        public=self.root/'public';viewer=public/'dev-previews/viewer';viewer.mkdir(parents=True)
        image=viewer/'result.png';image.write_bytes(b'fixture original bytes');checksum=M.sha(image)
        catalog=viewer/'catalog.json'
        M.write_json(catalog,{'collections':[{'id':'fixture-visual','assets':[{'id':'first','src':'/dev-previews/viewer/result.png','sha256':checksum}]}]})
        self.current.update(outputKind='visual',viewer={'entry':'/dev-previews/viewer/index.html','catalogFile':str(catalog),'collection':'fixture-visual'})
        M.write_json(self.source,self.current);t=self.returned();image.write_bytes(b'changed output')
        with self.assertRaisesRegex(ValueError,'원본 해시'):self.b.pipeline_event(t['id'],'main01','present',self.proof)


if __name__=='__main__':unittest.main(verbosity=2)

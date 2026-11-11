from pathlib import Path
import hashlib,importlib.util,json

R=Path('C:/Users/user/Desktop/Grid Defenders');S=R/'작업관리';H=Path(__file__).resolve().parent;V=H/'technical-fix-v002';Q=H/'qa-v002';Q.mkdir(exist_ok=True)
if (Q/'연결.json').exists():raise SystemExit('재검증 작업이 이미 준비됐습니다. 중복 등록하지 않습니다.')
fix=json.loads((V/'연결.json').read_text(encoding='utf-8'));O=Path(fix['output']);report=O/'report.md';old=json.loads((H/'qa/연결.json').read_text(encoding='utf-8'));oldout=Path(old['output'])
W=Path('C:/Users/user/orca/workspaces/Grid Defenders/스킬-이펙트');proof=(H/'사용자확인.md').read_text(encoding='utf-8')
spec=importlib.util.spec_from_file_location('board',S/'도구/작업대장.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);b=m.Board(S)
if b.load(fix['task'],'main01')['status']=='in_progress':b.record(fix['task'],'main01','returned',report)
fix.update(state='awaiting_independent_qa',workerOutcome='succeeded',report=str(report));(V/'연결.json').write_text(json.dumps(fix,ensure_ascii=False,indent=2),encoding='utf-8')
changes=json.loads((O/'changed-files.json').read_text(encoding='utf-8-sig'));verified=[]
for row in changes:
 p=Path(row.get('path',row.get('file','')));digest=hashlib.sha256(p.read_bytes()).hexdigest()
 expected=row.get('afterSha256',row.get('sha256After',row.get('sha256',row.get('after'))))
 assert digest==expected,(str(p),row)
 verified.append({'path':str(p),'sha256':digest})
(V/'수신파일검증.json').write_text(json.dumps({'files':verified,'allMatch':True},ensure_ascii=False,indent=2),encoding='utf-8')
pre='원작업 사용자 실제 진행으로 승인된 공방 결함 수정의 독립 재검증이다. 제작팀 성공과 별개로 원래 FAIL 3항목/2원인을 실제 파일/시간축에서 재현한다. QA 최초 이력은 보존하고 새 고정SHA/ACK/start로 검사한다. 제품·사용자개인저장소·원화·게임·API·Git·현재화면 수정0. 신규 광범위 기능/검사 확대 없이 경계와 오류입력 실패보존 및 영향회귀에 집중한다.'
t=b.new('main01','qa','공방 기술수정 v002 독립 재검증 — 시간 경계·데이터 거부/이력 보존',proof);tid=t['id'];F=b.folder(tid)
out=Path('C:/Users/user/orca/workspaces/Grid Defenders/테스터/output')/('character-effect-workshop_retest_'+tid.lower()+'_v002')
prompt=f'''# {tid} / 차수1 / qa — 공방 기술수정 v002 독립 재검증
원작업 {fix['parentTask']}, 최초QA {old['task']} FAIL(49PASS/3FAIL), 수정 {fix['task']}의재검증입니다. 사용자원승인 {H/'사용자확인.md'} 범위 내부의 기술검증이며 같은 진행 질문은 하지 않습니다. 본인이 기존 두 결함을 찾은 원자료를 보존하고 새 검사문맥에서 확인합니다.

새 자동첨부 필독 본문→문서별적용/현재SHA ACK→start 후 검사. 제작팀결과를독립검사로대신하지않습니다. 최신고정본: {O/'changed-files.json'} 및 main01 {V/'수신파일검증.json'}. 제작보고 {report}, 이전본인보고 {oldout/'report.md'}, 원재현기 {oldout/'focused.mjs'}, 불량파일bad-points.json/bad-keys.json·정상exported-scene.json은같은이전output에있습니다.

기존http://127.0.0.1:5182/effect-workshop.html#actor 와격리headless/독립incognito문맥만사용합니다. 사용자개인저장소·화면/탭/서버·제작원본을조작하지않습니다. 제품코드/원본PNG/API/Git수정0. 자기 {out} 안에서만재현기·5종기록·결과/화면·버전SHA를작성합니다.

집중검사:
1. QA-01 start.2/fps10/time.3이index1/2F이고실제합성픽셀이정확다음프레임과일치. [0.1999,.2,.3,.4499,.45]→[null,0,1,2,null]. recipe/raster의다른fps·양의시작값·정확내부경계와직전/직후·시작/끝반개구간을소수오차로넘기지않는지확인. 영향받은frameAt/루프의주기경계도짧게확인합니다. 조기전환여부와마지막유지를분리합니다.
2. QA-02 실제DOM파일입력으로bad-points/bad-keys,필요한배열/원시값/null변형을선택하고비동기로드·에셋준비가끝난후명확한거부/활성문서·원본에셋·점/키·undo/redo이력이그대로인지확인. 정상빈객체/유효좌표와독립정상파일복구는계속허용해야합니다. 잘못된값을조용히지워수락하지않는지검사합니다.
3. 기존정상좌표/비균등등록/앞뒤·부착·실제전장/72CSSpx·320/390모바일·재생/정지/탐색의영향회귀를확인. 본인원래52검사는재현기에서수정된정상기대에맞게엄밀히갱신할수있으나실패를검사삭제/형식우회로숨기지않습니다. 제작팀수백검사를모두반복할필요는없습니다.
4. 검사전후고정파일/원본PNG의SHA일치,Runtime/HTTP오류를확인. 실패가남으면재현/기대·실제/심각도·파일행과한계를남겨FAIL반환하고,통과면검사한범위만PASS로반환합니다. 실기기/사용자미적합격/실게임통합까지통과했다고하지않습니다.

공식새Task/Dispatch worker_done으로main01 run_47ce1a81d7b1에원작업·수정작업·검증작업/차수·실제outcome·결과경로를반환하세요. 새결함이면임의제품수정대신status로먼저알릴수있습니다.
'''
(F/'요청확인.md').write_text(proof,encoding='utf-8');(F/'전문프롬프트.md').write_text(prompt,encoding='utf-8')
docs={'1_대화기록.md':proof,'2_사전확인.md':pre,'3_작업일지.md':'수정반환/제품두파일해시확인 후 독립QA 재검증 준비.','4_정의문서.md':'원QA-01/02 해결과 기존정상범위회귀를 새고정버전에서독립검사. 제작팀검사를합격으로대체하지않음.','5_버전관리.md':'초기FAIL·수정성공이력보존/수정본전후SHA고정. 제품수정·미술/API·Git·사용자화면변경0.'}
for name,body in docs.items():
 text='# '+tid+' / 차수1\n\n'+body+'\n';(F/name).write_text(text,encoding='utf-8');(Q/name).write_text(text,encoding='utf-8')
extras=[H/'사용자확인.md',oldout/'report.md',report,O/'changed-files.json',V/'수신파일검증.json',W/'게임/src/effect-workshop/ACTOR-README.md',S/'단일메인운영규정.md',S/'기준/characters/SD_72CSSpx_표시기준.md',R/'문서/00_개발규칙/스킬구현규약.md',S/'이미지2.6사용규칙.md',S/'저장운영규정.md']
assert all(p.is_file() for p in extras)
b.set_readings(tid,'main01',[str(p) for p in extras]);b.confirm(tid,'main01','진행',H/'사용자확인.md');plan=b.prepare(tid,'main01')
c={'task':tid,'parentTask':fix['parentTask'],'fixTask':fix['task'],'previousQa':old['task'],'iteration':1,'output':str(out),'folder':str(F),'plan':plan,'state':'prepared_not_sent','targetDispatch':'ctx_285e9785bf86'}
(Q/'연결.json').write_text(json.dumps(c,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps({'task':tid,'state':c['state'],'prompt':plan['prompt']},ensure_ascii=False))

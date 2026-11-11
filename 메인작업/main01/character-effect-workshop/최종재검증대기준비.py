from pathlib import Path
import hashlib,importlib.util,json
R=Path('C:/Users/user/Desktop/Grid Defenders');S=R/'작업관리';H=Path(__file__).resolve().parent;V=H/'technical-fix-v003';Q=H/'qa-v003';Q.mkdir(exist_ok=True)
if (Q/'연결.json').exists():raise SystemExit('최종 재검증 대기 기록이 이미 있습니다.')
c=json.loads((V/'연결.json').read_text(encoding='utf-8'));O=Path(c['output']);report=O/'report.md'
spec=importlib.util.spec_from_file_location('board',S/'도구/작업대장.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);b=m.Board(S)
if b.load(c['task'],'main01')['status']=='in_progress':b.record(c['task'],'main01','returned',report)
checked=[]
for row in json.loads((O/'changed-files.json').read_text(encoding='utf-8-sig')):
 p=Path(row['path']);digest=hashlib.sha256(p.read_bytes()).hexdigest();assert digest==row['after'],str(p);checked.append({'path':str(p),'sha256':digest})
(V/'수신파일검증.json').write_text(json.dumps({'files':checked,'allMatch':True},ensure_ascii=False,indent=2),encoding='utf-8')
c.update(state='awaiting_independent_qa_slot',workerOutcome='succeeded',report=str(report));(V/'연결.json').write_text(json.dumps(c,ensure_ascii=False,indent=2),encoding='utf-8')
proof=(H/'사용자확인.md').read_text(encoding='utf-8');old=json.loads((H/'qa-v002/연결.json').read_text(encoding='utf-8'));oldO=Path(old['output']);W=Path('C:/Users/user/orca/workspaces/Grid Defenders/스킬-이펙트')
t=b.new('main01','qa','공방 v003 최종 독립 재검증 — 루프 주기·기존 결함 보존',proof);tid=t['id'];F=b.folder(tid);out=Path('C:/Users/user/orca/workspaces/Grid Defenders/테스터/output')/('character-effect-workshop_final_'+tid.lower()+'_v003')
prompt=f'''# {tid} / 차수1 / qa — 공방 v003 독립 최종 재검증
원공방 MAIN01-20261111-47B7186F / 이전재검증 {old['task']} FAIL / 루프수정 {c['task']} 성공반환. 사용자원승인 {H/'사용자확인.md'} 범위내필수기술재검증이다. 현재 진행중 게임QA MAIN01-20261111-D8C7563C가끝나고새공식발송을받은후에만본작업read-pack/새ACK/start로착수한다. 두작업번호/증거를혼합하지않는다.
현재SHA확정 {V/'수신파일검증.json'} 및 {O/'changed-files.json'}, 제작보고 {report}, 이전본인보고 {oldO/'report.md'}·loop-repro.mjs/loop-result.json을읽는다. 대상실제품 {W/'게임'} /기존 http://127.0.0.1:5182/effect-workshop.html#actor . 자기 {{{{OUTPUT}}}} 안에만새재현기/5종기록·검사/화면·버전SHA·최종판정을작성한다.

핵심QA03: 0.1초3프레임loop에서time0.3초가index0/UI1/3F,원래첫프레임픽셀과일치해야한다. 실제합계0.30000000000000004를숨기지않고정수ms기준기대와대조한다. 가변소수기간과여러주기배수/total자체/정확경계와직전·직후1e-10초,내부프레임경계/nonloop끝유지·일시정지/배속/시간축스크럽을확인한다. 진짜끝직전시각이조기wrap하면안된다.
기존QA01 recipe/raster start.2/fps10/time.3 index1 및시작/끝반개구간,QA02의원래bad-points/bad-keys실제비동기파일거부/활성문서·undo/redo·원본에셋/점/키보존,정상빈객체/독립정상파일복구가유지되는지도집중검사한다. 관련좌표/72CSS/실제전장·모바일은영향범위에맞게확인하고이미통과한수백검사를근거없이전부반복하지않는다.
제작팀성공을독립합격으로옮기지말고본인의독립기대값과실제UI/픽셀증거로판정한다. 사용자미적합격/실기기·게임통합을대행하지않는다. 제작제품수정/사용자개인저장소·현재창·탭·기존서버/타팀/원본PNG/계정/API/Git변경0. 격리headless새문맥만사용하고원본/시험제품SHA전후를확인한다.
완료후공식새Task/Dispatch worker_done으로main01 run_47ce1a81d7b1에실제outcome/원작업·수정·재검증작업번호·차수/결과보고경로와한계를반환한다. 실패는숨기지않고재현근거를담당수정으로돌린다.
'''.replace('{{OUTPUT}}',str(out))
(F/'요청확인.md').write_text(proof,encoding='utf-8');(F/'전문프롬프트.md').write_text(prompt,encoding='utf-8')
docs={'1_대화기록.md':proof,'2_사전확인.md':'현재qa는게임검증D8C7563C수행중이다. 새검증은확정만하고prepare/발송은역할이비고현재본문·해시를다시확인한뒤한다. 수정v003두파일SHA는수신확인. 기존FAIL이력/이미지/사용자작품보존.','3_작업일지.md':'루프수정실제반환·코드SHA확인/원승인범위최종독립재검증대기등록. 아직발송·착수전.','4_정의문서.md':'QA03루프정확주기/여러배수·직전직후·UI첫프레임과기존QA01/02·정상복구보존 집중검증.','5_버전관리.md':'v001·v002·실패이력보존. 신규v003고정본·자기검사출력만사용. 제품/UI/원본/API/Git변경0.'}
for name,body in docs.items():
 v='# '+tid+' / 차수1\n\n'+body+'\n';(F/name).write_text(v,encoding='utf-8');(Q/name).write_text(v,encoding='utf-8')
extras=[H/'사용자확인.md',oldO/'report.md',report,O/'changed-files.json',V/'수신파일검증.json',W/'게임/src/effect-workshop/ACTOR-README.md',S/'단일메인운영규정.md',R/'문서/00_개발규칙/스킬구현규약.md',S/'이미지2.6사용규칙.md',S/'저장운영규정.md']
b.set_readings(tid,'main01',[str(p) for p in extras]);b.confirm(tid,'main01','진행',H/'사용자확인.md')
q={'task':tid,'parentTask':'MAIN01-20261111-47B7186F','fixTask':c['task'],'iteration':1,'folder':str(F),'output':str(out),'state':'confirmed_waiting_for_qa_slot','blockingTask':'MAIN01-20261111-D8C7563C','targetDispatch':'ctx_8237f2330ba5'}
(Q/'연결.json').write_text(json.dumps(q,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(q,ensure_ascii=False))

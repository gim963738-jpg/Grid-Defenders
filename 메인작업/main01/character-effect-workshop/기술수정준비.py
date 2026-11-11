from pathlib import Path
import hashlib,importlib.util,json,shutil

R=Path('C:/Users/user/Desktop/Grid Defenders');S=R/'작업관리';H=Path(__file__).resolve().parent;V=H/'technical-fix-v002';V.mkdir(exist_ok=True)
if (V/'연결.json').exists():raise SystemExit('수정 작업이 이미 있습니다. 중복 등록하지 않습니다.')
W=Path('C:/Users/user/orca/workspaces/Grid Defenders/스킬-이펙트');Q=H/'qa';q=json.loads((Q/'연결.json').read_text(encoding='utf-8'));report=Path(q['output'])/'report.md'
parent=json.loads((H/'연결.json').read_text(encoding='utf-8'));proof=(H/'사용자확인.md').read_text(encoding='utf-8')
spec=importlib.util.spec_from_file_location('board',S/'도구/작업대장.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);b=m.Board(S)
if b.load(q['task'],'main01')['status']=='in_progress':b.record(q['task'],'main01','returned',report)
q.update(state='awaiting_coordinator_fix',workerOutcome='failed',report=str(report),resultSummary='52항목:49PASS/3FAIL,제품결함2건');(Q/'연결.json').write_text(json.dumps(q,ensure_ascii=False,indent=2),encoding='utf-8')
snapshots=[]
for name in ['actorModel.ts','actorChecks.ts']:
 p=W/'게임/src/effect-workshop'/name;dst=V/(name+'.before');shutil.copy2(p,dst);snapshots.append({'path':str(p),'snapshot':str(dst),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
assert snapshots[0]['sha256']=='36efd7ff1b568d7376f0a025b29842d96cd518111cfa3fa7cccb7b08c1a7d6af'
(V/'입력버전.json').write_text(json.dumps(snapshots,ensure_ascii=False,indent=2),encoding='utf-8')
pre=f'원작업 {parent["task"]}의 사용자 실제 진행으로 승인된 프레임 동기/오류입력 실패보존 계약을 만족시키기 위한 같은 범위 기술 수정이다. QA {q["task"]}는 실제 failed 반환했고 현재 버전 고정 검사가 종료돼 제작 수정과 충돌하지 않는다. 수정 전 파일을 읽기 전용 증거로 보존/해시 대조했다. 새로운 미술/기능/입력포맷/UI재배치가 아니므로 같은 허락을 반복하지 않는다. 담당 effects의 이번 새 필독/ACK/start를 거친다. actorModel·집중 회귀검사와 자기 새 출력만 허용, 기존작품·타팀·게임런타임·계정·공유규정·API·Git·사용자화면 변경은 없다.'
t=b.new('main01','effects','공방 독립QA 결함 수정 — 효과 시간 경계·부착점/효과키 객체 검증',proof);tid=t['id'];F=b.folder(tid);out=W/'output'/('character-effect-workshop_fix_'+tid.lower()+'_v002')
prompt=f'''# {tid} / 차수1 / effects — 기존 승인 공방의 기술 결함 2건 수정
원작업 {parent['task']} 차수1, 독립QA {q['task']} 차수1. 사용자 원요청/실제 진행은 {H/'사용자확인.md'}. 새 미술/기능 요청이 아니라 승인한 프레임 동기·오류입력 실패보존 계약을 만족시키는 버그 수정이다. 독립QA는고정버전검사를마치고실제failed로반환했다. 같은진행질문을다시하지말고현범위수정을완성한다.

현재 자동첨부필독본문→이번문서별적용/현재SHA ACK→start 통과 후착수. QA보고 {report} 및 실제입력버전 {V/'입력버전.json'}을읽는다. 기존원작업/QAACK재사용금지. 원래공방/사용자작품/정상49항목을보존한다.

수정대상: {W/'게임/src/effect-workshop/actorModel.ts'} 및 actorChecks.ts/꼭필요한신규공방집중검사. 산출물 {out}. 다른제품파일수정은원인상불가피한경우에만근거와최소범위를보고한다. 새UI배치·스키마이름/버전·모델/원화·공용규정/본체크기·성능개편은하지않는다.

QA-01: effectFrame의 start=.2, fps=10, commonTime=.3은 내부index1이어야하지만floor부동오차로0이다. recipe 초→이산프레임 경계를 작은 수치오차에 안정적으로 처리한다. 실제경계전시간을조기재생하거나시작/종료의활성구간을늘리지않는다. 0.1999/0.2/0.3/0.4499/0.45기대는null/0/1/2/null. 시작·중간·종료정확경계와직전/직후,다른FPS/양의시작값/recipe와raster경계를추가검사하고허용오차선정근거를기록한다. 큰고정epsilon으로전부밀지않는다.

QA-02: frame.points와effect.keys는Record<string,Point>객체인데[]가입력되면활성문서를바꿔점/키를잃는다. null이아닌일반레코드형태를검사해배열/문자열/숫자/기타잘못된형태·좌표값을거부하고유효한빈객체{{}}와기존정상문서는계속허용한다. 원래구조복사·에셋SHA/디코드→전체검증완료→문서/이력교체원자성을유지한다. keys/points를조용히{{}}로바꿔수락하는우회는금지한다.

실제QA의bad-points.json/bad-keys.json,exported-scene.json,focused.mjs는 {Path(q['output'])} 에있다. 이를원본수정없이재현에사용한다. 파일선택후비동기읽기·검증이끝난시점에거부메시지/기존문서와undo/redo·원본에셋이그대로인지확인한다. 조기순간샘플만보고통과처리하지않는다.

검증: 두결함의집중모델검사+실제5182 UI/파일입력재현,유효파일의완전독립복구/앞뒤·좌표회귀,기존actor검사와영향있는공방회귀,check/build를완료한다. 기존정상49항목에서영향위험이있는것을확인하며전체402개를의미없이반복할필요는없다. 오류를숨기거나타입단언/검사삭제로통과시키지않는다. 원본PNG와기존사용자작품은보존한다.

기존5182를재사용하고격리headless/새문맥만사용한다. 사용자창/탭/개인저장소·다른프로젝트서버·실게임/타팀파일을조작하지않는다. 생성API·이미지2.6·영상·의존성설치·Git0. 기존구현원본/검증v001은덮어쓰지말고새v002수정보고·전후파일SHA·정확한변경목록·patch·회귀/빌드/화면·5종기록을취합한다.
완료시공식새Task/Dispatch worker_done으로main01 run_47ce1a81d7b1에실제결과·보고경로를반환한다. 독립QA재검증은main01이별도연결하며본인통과를독립QA합격이라고표시하지않는다.
'''
(F/'요청확인.md').write_text(proof,encoding='utf-8');(F/'전문프롬프트.md').write_text(prompt,encoding='utf-8')
docs={'1_대화기록.md':proof+'\n\n독립QA 실제 실패 보고: '+str(report),'2_사전확인.md':pre,'3_작업일지.md':'독립QA 49PASS/3FAIL·결함2건 확인,검사버전고정/종료후동일승인기능버그수정준비.','4_정의문서.md':'recipe효과프레임 소수경계 안정화 및points/keys레코드검증. 실패입력시활성문서/이력보존. 기존스키마·유효문서·원본유지.','5_버전관리.md':'원작업/QA FAIL 이력 보존,입력버전.json/수정전사본과새v002결과를연결. 신규미술/API/기능확장/Git0. 독립재검증은수정반환후별도.'}
for name,body in docs.items():
 text='# '+tid+' / 차수1\n\n'+body+'\n';(F/name).write_text(text,encoding='utf-8');(V/name).write_text(text,encoding='utf-8')
extras=[H/'사용자확인.md',H/'사전확인.md',report,V/'입력버전.json',S/'단일메인운영규정.md',S/'기준/qa/규정.md',W/'게임/src/effect-workshop/ACTOR-README.md',R/'문서/00_개발규칙/스킬구현규약.md',S/'이미지2.6사용규칙.md',S/'저장운영규정.md']
assert all(p.is_file() for p in extras)
b.set_readings(tid,'main01',[str(p) for p in extras]);b.confirm(tid,'main01','진행',H/'사용자확인.md');plan=b.prepare(tid,'main01')
c={'task':tid,'parentTask':parent['task'],'qaTask':q['task'],'iteration':1,'output':str(out),'folder':str(F),'plan':plan,'state':'prepared_not_sent','targetDispatch':'ctx_c5caed414651','needsIndependentRetest':True,'imageGenerationAllowed':False}
(V/'연결.json').write_text(json.dumps(c,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps({'task':tid,'state':c['state'],'prompt':plan['prompt']},ensure_ascii=False))

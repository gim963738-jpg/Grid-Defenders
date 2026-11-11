from pathlib import Path
import hashlib,importlib.util,json,shutil

R=Path('C:/Users/user/Desktop/Grid Defenders');S=R/'작업관리';P=R/'메인작업/main01';A=P/'blond-motion-apply';E=P/'character-effect-workshop'
spec=importlib.util.spec_from_file_location('board',S/'도구/작업대장.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);b=m.Board(S)
old=json.loads((E/'qa-v002/연결.json').read_text(encoding='utf-8'));oldreport=Path(old['output'])/'report.md'
if b.load(old['task'],'main01')['status']=='in_progress':b.record(old['task'],'main01','returned',oldreport)
old.update(state='awaiting_loop_fix',workerOutcome='failed',report=str(oldreport));(E/'qa-v002/연결.json').write_text(json.dumps(old,ensure_ascii=False,indent=2),encoding='utf-8')

def prepare(folder,branch,title,proofPath,pre,body,extra,target,outputPrefix,parent):
 folder.mkdir(exist_ok=True)
 if (folder/'연결.json').exists():raise SystemExit('기존 준비 기록: '+str(folder))
 proof=proofPath.read_text(encoding='utf-8');t=b.new('main01',branch,title,proof);tid=t['id'];F=b.folder(tid)
 work='테스터' if branch=='qa' else '스킬-이펙트';out=Path('C:/Users/user/orca/workspaces/Grid Defenders')/work/'output'/(outputPrefix+'_'+tid.lower())
 prompt=body.replace('{{TASK}}',tid).replace('{{OUTPUT}}',str(out));assert '{{' not in prompt
 (F/'요청확인.md').write_text(proof,encoding='utf-8');(F/'전문프롬프트.md').write_text(prompt,encoding='utf-8')
 docs={'1_대화기록.md':proof,'2_사전확인.md':pre,'3_작업일지.md':'실제 사용자 승인 범위/이전 반환·현 버전 근거를 확인하고 후속 지시 준비. 아직 실제 발송 전.','4_정의문서.md':title+'\n\n원작업 '+parent+'의 승인 범위 내부이며 신규미술/스키마/계정/API/Git 변경0.','5_버전관리.md':'이전실패/성공 및 원작업판정 보존. 현재차수 필독/ACK/start와실제송신영수증·반환보고를따로연결.'}
 for name,text in docs.items():
  v='# '+tid+' / 차수1\n\n'+text+'\n';(F/name).write_text(v,encoding='utf-8');(folder/name).write_text(v,encoding='utf-8')
 assert all(p.is_file() for p in extra),[str(p) for p in extra if not p.is_file()]
 b.set_readings(tid,'main01',[str(p) for p in extra]);b.confirm(tid,'main01','진행' if branch=='effects' else '마지막 연결했던 기준으로 진행해줘',proofPath);plan=b.prepare(tid,'main01')
 c={'task':tid,'parentTask':parent,'iteration':1,'output':str(out),'folder':str(F),'plan':plan,'state':'prepared_not_sent','targetDispatch':target,'branch':branch}
 (folder/'연결.json').write_text(json.dumps(c,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps({'task':tid,'branch':branch,'prompt':plan['prompt']},ensure_ascii=False))

c=json.loads((A/'연결.json').read_text(encoding='utf-8'));I=A/'integration';installed=json.loads((I/'실제반영.json').read_text(encoding='utf-8'));checked=[]
for item in installed['files']:
 f=R/'게임'/item['path'];sha=hashlib.sha256(f.read_bytes()).hexdigest();assert sha==item['afterSha256'],str(f);checked.append({'path':str(f),'sha256':sha})
(I/'현재반영해시.json').write_text(json.dumps({'files':checked,'allMatch':True},ensure_ascii=False,indent=2),encoding='utf-8')
(I/'반영검증.md').write_text('# 실게임 반영 검증\n\n제품32(소스11·에셋메타21)+관련검사39파일의기준/반환SHA확인후현재root에반영했다. 현재반영해시.json의71경로일치. 원본PNG12장바이트보존.\n\nroot npm test:1649검사/61suite/0실패. root build:PASS. root실소스를격리headless에서실행한시나리오24PASS/예외0,기존브라우저4suite207PASS. 실제진행은웨이브35/재화/모루/유닛편성·레벨/장비/runId동일을진행복구검증.json으로확인한뒤오른쪽에서이어하기로재개했다.\n\n개발자반환결과.json의rootIntegrated:false는반환당시기록이며이후 실제반영.json이통합증거다. 독립QA/사용자미적합격은아직별도다. 실제넉백판정없음/진입합성검사만,원본아트방향·알파·손/무기편차,WARN및20ms모델substep시간정밀도한계는보존한다. 사용자현재화면을검수용보스/리셋으로전환하지않았다.\n',encoding='utf-8')
c.update(state='root_validated_pending_independent_qa',rootIntegrated=True,rootValidation=str(I/'반영검증.md'));(A/'연결.json').write_text(json.dumps(c,ensure_ascii=False,indent=2),encoding='utf-8')

pre='원작업의 실제 진행 승인 범위에서 main01이 현재root에 선별 반영/검증했다. 독립qa는 현재반영해시71경로로 버전을 고정하고 모델 타격/준비·저장/실제시각·겹침/다른영웅회귀를 집중 검사한다. 현재 사용자플레이는35웨이브/재화/장비/runId를보존해재개돼있으므로 검사에서사용자프로필·현재탭·실세이브를접근/변경하지않는다. 기존 QA공방재검사는최종FAIL반환완료로잠금이해제됐다. game격리사본대신실제root제품을검사하며src수정/API/Git0.'
body=f'''# {{{{TASK}}}} / 차수1 / qa — 금발·터틀 실게임 반영본 독립 검사
원작업 {c['task']} / main01. 사용자 실제 승인 {A/'사용자승인.md'} 및 최신동작기준을읽고새필독/ACK/start를통과합니다. 현재실제제품은 {R/'게임'} 이며게임개발O/game사본으로대신하지않습니다.
반영/검사근거 {I/'반영검증.md'}, 고정버전 {I/'현재반영해시.json'}, 원제작반환 {Path(c['output'])/'검증보고.md'}. root의1649/61모델+24브라우저시나리오+관련207브라우저검사/build는이미통과했으므로기대값을그대로복사하지말고아래위험을독립집중재현합니다.

1. 웨이브금발사거리100·스킬없음·위치고정/전투대기→03/04/05첫7/새3/4 06순차평타→남은딜레이대기. hit프레임종료03-6/04-5/05-6/06-5에각1회피해,대상이탈/사망/공격자사망/큰dt/정지·배속에서도미완료/중복/잘못된타겟피해없음.
2. 보스3초준비중이동/피해/시간제한진행없음·새시작/재시도와진행세이브복구구별,이동달리기·일반피해에hurt0/명시넉백진입만hurt·HP0사망을끝까지표시. 현재넉백발생기믹없음은정직한제약으로기록하고임의넉백을요구하지않습니다.
3. 터틀실제4모션/약→약→강및접촉570/1205ms각1피해·회복대기,친위대노랑일반/파랑물방/빨강마방각1·총4적과승리조건. 원본PNG12개SHA/실좌표·72CSS본체/발점/캐릭터크기흔들림을구별합니다.
4. 실제여러유닛의초기/접근/교전/암살자돌진/경계/사망에서발밑분리·끼임/튐·영웅상단/HUD/이펙트레이어를확인합니다. 수학적원형간격만확인하고큰터틀의몸통과슬라임이과하게겹치는실제화면을놓치지마세요. 완전히겹침0이라고과장하지말고원본실루엣/돌진허용한계와정상간격을구별해화면증거와심각도를보고합니다.
5. 신규/구v1세이브의준비·타격전/후·홀드·콤보/사망상태복구,영웅/장비/재화보존·타격중복없음. 원작업사용자실세이브가아닌자기시험문서/독립브라우저저장소로검사합니다.

실제5173를격리headless새문맥에서이용하거나현재root제품을OS임시port0/127.0.0.1로검사후종료할수있습니다. source qa/entry.ts는제품연결용하네스로활용가능하나기대값은독립산정하고실제앱UI의부트/소환/보스진입도검사합니다. 사용자현재Orca탭·창·저장소·프로필/서버5173를조작하거나기존코드를수정하지않습니다. 본체/모션은기존시트그대로이며새원화·API·영상·Git0.
명암·실제필드·좁은화면/높은DPR을변경범위에맞게확인하고불필요한전체회귀반복은하지않습니다. 검사전후제품SHA를대조하고자기 {{{{OUTPUT}}}} 에만5종기록·기대/실제·재현/화면·PASS/FAIL·제약을씁니다. 결함이면고치지말고정확한파일/행·심각도로gameplay수정에돌립니다. 실제outcome으로공식새Task/Dispatch worker_done을main01 run_47ce1a81d7b1에회신합니다. 사용자미적합격/실기기검증을대행하지않습니다.
'''
extra=[A/'사용자승인.md',A/'사전확인.md',I/'반영검증.md',I/'현재반영해시.json',Path(c['output'])/'검증보고.md',S/'단일메인운영규정.md',S/'기준/characters/SD_72CSSpx_표시기준.md',R/'문서/00_개발규칙/스킬구현규약.md',S/'이미지2.6사용규칙.md',S/'저장운영규정.md']
prepare(A/'qa','qa','금발 전사·터틀드래곤 실게임 반영본 독립 검증',A/'사용자승인.md',pre,body,extra,'ctx_fa88cc40a2c1','blond-turtle-root-qa',c['task'])

V=E/'technical-fix-v003';V.mkdir(exist_ok=True);W=Path('C:/Users/user/orca/workspaces/Grid Defenders/스킬-이펙트');snaps=[]
for name in ['actorModel.ts','actorChecks.ts']:
 p=W/'게임/src/effect-workshop'/name;dst=V/(name+'.before');shutil.copy2(p,dst);snaps.append({'path':str(p),'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'snapshot':str(dst)})
(V/'입력버전.json').write_text(json.dumps(snaps,ensure_ascii=False,indent=2),encoding='utf-8')
pre='공방 원래 사용자 승인 범위의 반복재생 경계 기술결함 수정이다. 독립QA v002는기존2결함해결을확인하고추가루프경계1건을재현해FAIL최종반환했다. 새로발견한이전검사공백이며직전수정유발회귀로단정하지않는다. 현재수정전코드SHA와사본을보존하고effects의새ACK/start후최소수정한다. 기존문서/시트/UI/API/게임·사용자화면/Git변경0. 독립테스터는게임검사후수정본루프를재검증하게연결한다.'
body=f'''# {{{{TASK}}}} / 차수1 / effects — 공방 루프 주기 경계 수정
원공방 MAIN01-20261111-47B7186F / 이전수정 MAIN01-20261111-A2FBD5F6 / 독립재검증 {old['task']}의최종FAIL. 사용자원승인 {E/'사용자확인.md'} 범위내버그수정으로진행질문반복없음. 새필독본문→적용/현재SHA ACK→start 후착수합니다.
이전QA보고 {oldreport}, 재현 loop-repro.mjs/loop-result.json/loop-exact-0300.png는같은폴더에있습니다. 기존QA01시간내부경계와QA02points/keys문제는해결됐고정상회귀는PASS이므로이를보존합니다.
실제문제:sampleMotion/frameAt의loop=true,0.1초3프레임, time0.3초가합계0.30000000000000004의modulo끝으로남아기대index0대신2/UI3F를표시합니다. 원래표현오차가누적된주기끝에극히가까우면첫프레임으로매핑하되의미있는진짜종료직전시각을조기wrap하지않게피연산자크기에맞게처리합니다. 큰고정epsilon/전체시간강제정수화/프레임삭제로회피하지않습니다. nonloop마지막유지와시작/종료반개구간은보존합니다.
허용제품파일actorModel.ts와actorChecks.ts의해당구간/집중회귀만. 현재SHA {V/'입력버전.json'}를대조하고이전코드/검사보고를덮지않고자기 {{{{OUTPUT}}}} 에새v0035종기록·before/patch/afterSHA·보고/검사를남깁니다.
100ms×3과다른소수누적/가변길이루프에서정확주기와여러주기배수·직전/직후1e-10초등을독립계산한기대값으로검사합니다. total자체와입력0.3의차이를숨기지않고실제UI반복켜짐·시간축0.300에서1/3F/첫프레임픽셀일치를확인합니다. 기존recipe/raster소수경계·불량파일거부/문서이력보존·독립정상복구등관련집중검사와check/build를통과시키고새미달은정직하게보고합니다.
기존5182·격리headless새문맥만사용,사용자현재탭/개인저장소·기존작품·타팀/실게임/공유규정/원본시트/스키마/UI·API/Git변경0. 필요이상광범위회귀전체반복없음. 완료후공식새Task/Dispatch worker_done으로main01 run_47ce1a81d7b1에실제outcome/보고/원작업·차수를회신하며독립재검증은main01이별도연결합니다.
'''
extra=[E/'사용자확인.md',oldreport,V/'입력버전.json',W/'게임/src/effect-workshop/ACTOR-README.md',S/'단일메인운영규정.md',R/'문서/00_개발규칙/스킬구현규약.md',S/'이미지2.6사용규칙.md',S/'저장운영규정.md']
prepare(V,'effects','공방 루프 주기 끝 부동소수 경계 수정',E/'사용자확인.md',pre,body,extra,'ctx_86711cc780bb','character-effect-workshop_loopfix_v003','MAIN01-20261111-47B7186F')

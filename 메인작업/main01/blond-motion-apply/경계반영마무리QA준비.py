from pathlib import Path
from datetime import datetime
import hashlib, importlib.util, json, urllib.request

R=Path('C:/Users/user/Desktop/Grid Defenders'); S=R/'작업관리'; H=Path(__file__).resolve().parent
V=H/'visual-spacing-v003'; I=V/'integration'; Q=V/'qa'
T=Path('C:/Users/user/orca/workspaces/Grid Defenders/테스터')
O=Path('C:/Users/user/orca/workspaces/Grid Defenders/게임개발/output/blond-turtle-spacing-boundary_main01-20261111-dcd6b21b_v003')
old=T/'output/blond-turtle-root-qa_main01-20261111-d8c7563c'
def read(p):return json.loads(Path(p).read_text(encoding='utf-8-sig'))
def write(p,d):Path(p).parent.mkdir(parents=True,exist_ok=True);Path(p).write_text(json.dumps(d,ensure_ascii=False,indent=2),encoding='utf-8')
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def log(p):
 data=p.read_bytes();return data.decode('utf-16' if data.startswith((b'\xff\xfe',b'\xfe\xff')) else 'utf-8-sig')
if (Q/'연결.json').exists():raise SystemExit('이미 준비됨. 중복 QA 등록 금지.')
Q.mkdir(exist_ok=True)
receipt=read(I/'실제반영.json');assert receipt['state']=='applied_pending_root_checks'
assert '1733 assertions in 63 passed suites; 0 failed suites.' in log(I/'root-test.log')
assert 'built in' in log(I/'root-build.log')
current={r['path']:r['sha256'] for r in read(H/'integration/현재반영해시.json')['files']}
for row in receipt['files']:current[str(R/'게임'/row['path'])]=row['afterSha256']
for path,expected in current.items():assert sha(path)==expected,path
assert len(current)==73
before=read(I/'사용자상태-반영전.json');after=read(I/'사용자상태-반영후.json')
assert before['url']==after['url'] and before['page']==after['page'] and before['keys']==after['keys'] and after['overlays']==0
with urllib.request.urlopen('http://localhost:5173/qa/battle-landscape.html',timeout=10) as r:http=r.status
assert http==200
write(I/'현재반영해시.json',{'task':receipt['task'],'at':datetime.now().astimezone().isoformat(),'files':[{'path':p,'sha256':s} for p,s in current.items()],'allMatch':True})
validation={'task':receipt['task'],'productSourceFiles':4,'checkFiles':7,'rootVersionPaths':73,'models':{'assertions':1733,'suites':63,'failures':0,'exitCode':0},'build':{'passed':True,'exitCode':0},'http':http,'userState':{'samePage':True,'sameUrl':True,'sameStorage':True,'overlay':0,'storageWrites':0},'nativeAssetsChanged':0,'artReviewSunburst13':False,'gitWrites':0,'apiCalls':0,'independentQa':'pending'}
write(I/'반영검증.json',validation)
(I/'반영검증.md').write_text('# 터틀드래곤 v003 실제 게임 반영 검증\n\n원작업 MAIN01-20261111-1EB56391, 수정 MAIN01-20261111-DCD6B21B.\n\n현재root v001과 before SHA를 대조하고4소스·7검사만 적용했다. 제품PNG/JSON21개는 변경0이며 신규프레임 생성/재가공 없다. root 최신73경로 SHA를 현재반영해시.json으로 고정했다.\n\nmain01이 반영된 root에서 npm test를 실행해1733 assertions/63 suites/0failed, tsc+build를 실행해exit0을 확인했다. 15개 무관한전체 DOM suite는 실행하지 않았다. 독립QA는 아직 대기다.\n\n사용자 로비 페이지ID/URL/앱 localStorage값이 반영 전후 같고 오류 overlay0이다. 상태를 읽어 전용 사본으로 보존했으며 사용자 저장소/화면/탭·서버를 조작하지 않았다.\n\n후기24.5초 보스 머리/뿔·9.5초 혼잡 교전 화면을 직접 확인했다. 전투수치/금발range100·기존모션·180CSS보스 유지. 고정전체표시경계/몸통분리·상단접근 경로 보완으로 교전 시간은 달라질 수 있다. 강제최하단의 이름표 가장자리 접촉과 작은실루엣 겹침, 실기기/사용자미적합격은 별도 한계다.\n\n원본6시트 공방QA163PASS와 새Sunburst13장 생성은 별개 작업이다. 이번게임통합에 이미지API/Git없음.\n',encoding='utf-8')
with (I/'3_작업일지.md').open('a',encoding='utf-8') as f:f.write('\nroot모델1733/63 PASS와빌드exit0. 현재73SHA/원본21보존·로비저장값동일·overlay0. 독립QA준비.\n')
c=read(V/'연결.json');c.update(state='root_checks_pass_pending_independent_qa',rootIntegrated=True,rootValidation=str(I/'반영검증.md'));write(V/'연결.json',c)
parent=read(H/'연결.json');parent.update(state='root_v003_checks_pass_pending_independent_qa',spacingRevision=c['task'],rootValidation=str(I/'반영검증.md'),currentVersion=str(I/'현재반영해시.json'),rootIntegrated=True,userAccepted=False);write(H/'연결.json',parent)

spec=importlib.util.spec_from_file_location('board',S/'도구/작업대장.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);board=m.Board(S)
proof=(H/'사용자승인.md').read_text(encoding='utf-8-sig')
t=board.new('main01','qa','금발·터틀 v003 실제 반영본 시각간격·후기경계 독립 재검증',proof);tid=t['id'];F=board.folder(tid)
out=T/'output'/('blond-turtle-boundary-root-qa_'+tid.lower()+'_v001')
prompt=f'''# {tid} / 차수1 / qa — 현재 실제 root v003 독립 재검증
main01 run_47ce1a81d7b1. 원작업 MAIN01-20261111-1EB56391. 이전독립QA MAIN01-20261111-D8C7563C FAIL의 QA-VIS-01을 gameplay MAIN01-20261111-5C7D9D98 v002가 보완했지만 메인이 후기머리잘림을 발견해 미통합했다. 추가 MAIN01-20261111-DCD6B21B v003이 공식succeeded로 반환됐고 main01이 현재 root에4소스+7검사만 통합했다. 현재제품은 {R/'게임'} / 실제5173다. v001/v002나 gameplay game 사본으로 대신 검사하지 않는다.

매작업필독: 자기작업진행방법·read-pack의 실제본문·최신SHA/문서별적용 ACK→start 후 작업. 자동필독에 문서 누락이 없게 한다.
원승인 {H/'사용자승인.md'}의 각유닛 겹침방지/영웅상단·마지막연결 기준으로 진행의 내부검수다. 새범위 승인/모델/API허가는 없음.
직전공방QA B11472D8은 기술PASS로 반환·잠금해제됨. 이번은 그 담당의 새 작업으로 공방제품을 건드리지 않는다. 새Sunburst13장 아트검수 금지/대상아님.

필독근거:
- 현재반영 {I/'반영검증.md'}, 실제버전 {I/'현재반영해시.json'} 73경로, 반영 {I/'실제반영.json'}.
- gameplay결과 {O/'검증보고.md'}, {O/'변경manifest.json'}, {O/'통합.patch'} 및 alpha-envelope.json/after-visual.
- 기존 독립 실패 {old/'report.md'} 및 arena-crowd.png/arena-late.png(전체전장). 기존실패를 지우거나 통과로 덮지 말 것.
main이 실제 root모델1733/63/build PASS했으므로 무관한전수검사는 반복하지 말고 변경위험을 실제브라우저에서 독립확인한다. 제작자의141PASS를 본인검사로 복사하지 않는다.

집중검사:
1. 기존 실제앱의 소환/보스진입을 새독립문맥으로 확인하고 기존18개체·RNG1·autoSkillsfalse의 같은 초기/접근/교전/9.5/16.5/19.5/24.5초를 전체800×360에서 비교. 보스가살아있는 후기 몸통·머리·뿔·발이 전장 안에 있고 정상교전에서 큰몸통이병사/슬라임/금발을가리는 QA-VIS-01이 해결됐는지 직접화면을 열어 판정. 작은무기/실루엣교차와큰몸통가림을 구분. 모델circle PASS만으로 시각PASS하지 않는다.
2. 고정64셀 alpha최대범위와 앞발40,270/230source→180CSS 기준을 실제렌더/DPR로 대조. 이동·분리·4경계/동좌표·후기에서 전체표시경계가안전하고 프레임별자동줌/스크린축소/마스크로숨기지않았는지 확인. 명암/실제배경/320DPR2는 위험부분집중. 극단하단 기존이름표 경계접촉은 보스본체잘림과구분해서 한계/결함심각도를 정직하게 보고.
3. 새 상단/하단경계에서멈춘보스의 현재상대 접근 경로: 금발/보병 모두 실제평타피해를주고보스도공격가능, range100/80·피해/공속/타격시점은유지. 뒤몸통우회→앞접촉도 막힘/과도한순간이동 없이 공격. 기본18 및다른/최대편성·가장자리 대표검사. 전투간격변경으로 승리시간이달라지는것은전투수치조작과구별.
4. actors setter 추가의 저장회귀: 경계밖 옛 체크포인트는 정지첫프레임부터 안전; 이미유효한저장은 위치/모션/피해·준비잔여·3초재생없이재개. 앞접촉/후방우회/타격전후·사망 대표 실제save→새인스턴스/새파일문맥에서 독립확인. 원래코드JSON과실제적용경로를검사. 사용자실저장을사용하지말고자기fixture만.
5. 금발wave고정/대기/03→04→05첫7→새06모두12/160ms홀드·1.5배속/범위100·스킬없음, boss준비3초·run·일반피격hurt0/명시넉백진입·HP0death끝; 터틀weakweakstrong/570·1205ms각1피해/3색슬라임각1·영웅actor위/HUD별도효과아래 계약을 이번바뀐상태/경로와연결해대표회귀확인. 넉백발생기믹은없으므로 임의추가/자동피격요구금지.
6. 현재73파일과원본21자산의시작/끝SHA를직접대조. 제품/UI/공방/사용자창·탭/세이브/프로필/기존서버5173를변경하지않는다. 공유문서/hash 바뀌면현재기준 재필독/ACK/start 갱신. 새API/영상/원화/설치/Git0.

검사기주의: 이전단순피해fixture의보스y100/200은이번전체경계와충돌한다. 두개체를같은y350으로옮겨상대거리/수치/시간/기대피해를유지하는것은허용. 상단공격/경계복구는별도로명시검사. 제품을맞추기위한기대완화/타겟HP/사거리/크기변조 금지. 고정timeout이실제재생시간과동일하다고가정하지말 것.

자기출력 {out} 에만 검사기·실제기대/결과·전체화면·SHA·5종기록·PASS/FAIL·한계를 기록. 기존5173 새headless/profile로만 접속하거나필요시root의읽기전용서버127.0.0.1 port0/고유cacheDir를사용후자기프로세스만종료. 이전QA원본은보존.
재현기술결함이면제품수정대신정확한원인/파일/행·심각도·증거와failed 반환. 사용자미적합격·실기기전체성능을대신하지않는다. 공식 새 Task/Dispatch worker_done으로main01 run_47ce1a81d7b1에 실제outcome/작업/차수/보고경로를 반환한다.
'''
(F/'요청확인.md').write_text(proof,encoding='utf-8');(F/'전문프롬프트.md').write_text(prompt,encoding='utf-8')
docs={'1_대화기록.md':proof,'2_사전확인.md':'원승인범위의 실제v003 통합후독립재검증. main의root1733/build/73SHA/로비저장보존 확인, 이전공방QA반환으로slot해제. 새ACK/start필수. 제품/User/API/Git0.','3_작업일지.md':'현재root코드4+검사7반영 및 main검증완료. 이전QA-VIS-01/후기경계/접근·저장회귀의독립검사준비.','4_정의문서.md':'현재root v003고정73SHA. 결과는기술검증이며사용자미적합격/13장Sunburst검수와분리.','5_버전관리.md':'테스터새전용출력만작성. 제품/원본/타팀/기존사용자프로필보존. 커밋·푸시0.'}
for name,body in docs.items():
 text='# '+tid+' / 차수1\n\n'+body+'\n';(F/name).write_text(text,encoding='utf-8');(Q/name).write_text(text,encoding='utf-8')
extras=[H/'사용자승인.md',I/'반영검증.md',I/'현재반영해시.json',I/'실제반영.json',O/'검증보고.md',O/'변경manifest.json',O/'통합.patch',old/'report.md',S/'단일메인운영규정.md',S/'기준/characters/SD_72CSSpx_표시기준.md',R/'문서/00_개발규칙/스킬구현규약.md',S/'이미지2.6사용규칙.md',S/'저장운영규정.md']
assert all(p.is_file() for p in extras)
board.set_readings(tid,'main01',[str(p) for p in extras]);board.confirm(tid,'main01','마지막 연결했던 기준으로 진행해줘',H/'사용자승인.md');plan=board.prepare(tid,'main01')
write(Q/'연결.json',{'task':tid,'iteration':1,'parentTask':c['task'],'originalTask':'MAIN01-20261111-1EB56391','folder':str(F),'output':str(out),'plan':plan,'state':'prepared_not_sent','targetDispatch':'ctx_17ab62341cde','imageGenerationAllowed':False})
print(json.dumps({'task':tid,'state':'prepared_not_sent','prompt':plan['prompt'],'rootModels':1733,'currentPaths':73},ensure_ascii=False))

from pathlib import Path
from datetime import datetime
import importlib.util,json,hashlib,shutil,subprocess
ROOT=Path('C:/Users/user/Desktop/Grid Defenders');S=ROOT/'작업관리';HERE=Path(__file__).resolve().parent
receipt=HERE/'신규2채택-전달결과.json'
if receipt.exists():raise SystemExit('Already attempted; inspect receipt before recovery.')
quote='신규2안으로 채택 앞으로 SD캐릭터는 저렇게뽑으면되겠다'
adopt=S/'기준/characters/SD_승인기준.md';refs=S/'기준/characters/SD_승인참조/20261109_신규2안';refs.mkdir(parents=True,exist_ok=True)
art=Path(json.loads((HERE/'신규2방향-v004-연결.json').read_text(encoding='utf-8'))['output'])
sourceManifest=json.loads((art/'asset-manifest.json').read_text(encoding='utf-8'));selected=[]
for a in sourceManifest['compareArt']:
 src=art/a['file'];dst=refs/a['file'];assert hashlib.sha256(src.read_bytes()).hexdigest()==a['sha256']
 if dst.exists():assert dst.read_bytes()==src.read_bytes()
 else:shutil.copy2(src,dst)
 selected.append({'direction':a['direction'],'path':str(dst),'file':a['file'],'sha256':a['sha256'],'width':a['width'],'height':a['height'],'bodyHeight':a['bodyHeight'],'footX':a['footX'],'footY':a['footY'],'source':str(src)})
proof=HERE/'사용자신규2채택.md';proof.write_text('# 사용자 채택 원문\n\n'+quote+'\n\n대상은scalp_face_v03 신규2안(ID6)의정면및이를기준으로제작·전장비교한오른쪽45/90도. 신규2안을향후SD캐릭터의두상/몸비율·얼굴가독성·SD표현참조로채택한다. 이전4안의다른안이나기존구형2안을전부합격시키는뜻은아니다. 앞으로만적용하며기존전체이미지재제작·실제전투유닛교체·새그림제작·GitHub저장요청은아니다.\n',encoding='utf-8')
pre=HERE/'신규2채택-사전확인.md';pre.write_text('사용자명시채택에따른기준갱신전작성. 공통규정/main01방법/characters연결규정/기존SD문서·JSON·생성프롬프트·제작순서와카탈로그소비처를확인했다. 현재characters/sprites잠금없음. 구기준은은발비율이활성상태이므로향후생성의최신두상·체형참조를신규2안으로바꾸고이력을보존한다. 공통캔버스여백/발선/무기그립/외주원본보존기준을그림스타일채택만으로폐기하지않는다. 그림캐시·유색알파한계를새허용규격으로승격하지않는다. 채택기록과바이트검증된3방향참조를공유폴더에연결하고characters담당이자기정규문서/JSON/생성프롬프트/제작순서/카탈로그의참조일관성을갱신·검증한다. 새그림·게임런타임·창조작·커밋/푸시제외.\n',encoding='utf-8')
adopt.write_text('''# SD 승인 기준 — SD-STD-002 / 2026-11-09

상태: 사용자 채택 확정. 사용자 원문: “신규2안으로 채택 앞으로 SD캐릭터는 저렇게뽑으면되겠다”.

## 최신 제작 기준

향후 SD 캐릭터의 공통 시각·비율 참조는 **금발 전사 두상·얼굴 확대 시안의 신규2안**이다. 게임 이미지 대조의 ID6이며 구형/기존2안과 다르다. 2026-11-08 은발·날개 지팡이를 두상/체형 공통 참조로 사용하던 기준을 이 범위에서 대체한다. GC9 성인형 일러스트와 혼동하지 않는다.

같은 표시 키에서 얼굴이 읽히는 실제 두상 크기, 머리/몸통/팔다리 비중, SD 픽셀 표현·재질 묶음·카메라와 방향 간 일관성을 참조한다. 겉모발 높이와 실제 두상의 정수리~턱을 구분한다. 정수리는 모발 안에 숨은 추정점이므로 정확한 해부학적 실측이나 새 고정 등신 수치로 주장하지 않는다. 모발을 지우거나 부풀리는 것만으로 두상/얼굴 크기를 대신하지 않는다.

공통화는 같은 얼굴틀 복제가 아니다. 각 캐릭터의 얼굴형·턱/볼·이목구비·표정·헤어·성별/나이·종족·체격·체형 실루엣·의상/색상·장비/소품·인체좌우를 유지한다. 새 인물 생성 시 신규2안은 STYLE/PROPORTION 입력이고 그 금발·얼굴·갑옷·검을 다른 인물에 복사하지 않는다. 명시한 개별 키·종족 체격 예외도 유지한다.

이번 채택은 앞으로의 SD 제작에 적용한다. 기존 전체 결과물 자동 재제작·전투 유닛 자동 교체·몬스터 신체/동작 기준 변경·8방향/애니메이션 추가 제작·GitHub 저장을 자동 실행하지 않는다.

## 승인된 시각 참조

- [정면](SD_승인참조/20261109_신규2안/variant-2-front.png)
- [오른쪽 앞45도](SD_승인참조/20261109_신규2안/variant-2-right-045.png)
- [오른쪽 정측면90도](SD_승인참조/20261109_신규2안/variant-2-right-090.png)
- [구조화 승인·원본 출처/해시](SD_승인참조/20261109_신규2안/승인.json)

정면의 실제 원본은1133×1388,45도1133×1388,90도1077×1460이다. 생성 원본 크기/알파/바이트를 보존한다. 이 서로 다른 원본 해상도나 현재 작은 여백을 모든 미래 이미지의 고정 규격으로 삼지 않는다.

## 별도 유지하는 기술 기준

새 생성 시 캔버스 여백·공통 발선·인물 표시 키는 기존 별도 납품/배치 기준을 함께 적용한다. 이 스타일 채택만으로 캔버스 점유율·최종 인게임 절대 크기·수치 오차 허용치를 새로 확정하지 않는다. 비교·게임 등록은 실제 width/height/bodyHeight/footX/footY를 사용하고 장비 외곽을 본체 키로 계산하지 않는다. 픽셀을 비균일하게 늘리거나 원본을 재저장해 맞추지 않는다.

정면/45/90 등 방향에서는 같은 인물의 머리·얼굴·몸 비중과 카메라를 유지하고 실제 신체/장비 좌우로 회전한다. 없는 방향을 반전/다른 시안으로 위장하지 않는다. 원본 전체 프레임의 밝고 어두운 배경, 작은 표시에서 얼굴 가독성, 손·무기·몸 연결과 잘림을 확인한다. 지금 참조에 남은 유색 반투명 외곽·좁은 여백·미세 생성 차이는 공통 허용 결함으로 승인한 것이 아니며 납품 시 별도 검수한다.

## 적용 책임과 이력

공유 원본은 이 문서와 승인.json이다. characters 담당은 자기 SD 공통 문서/구조화 JSON/생성 프롬프트/제작 순서/카탈로그를 이 최신 승인에 맞게 연결하고 이전 은발 기준은 이력으로 보존한다. sprites 담당은 새로운 SD 원본·동작을 맡을 때 이 기준을 읽되 캐릭터별 승인 마스터를 우선한다. main01/02/03은 향후 SD 지시에 이 기준과 해당 인물의 개별 설정을 함께 첨부한다.
''',encoding='utf-8')
approval={'id':'sd_blond_scapl_variant2_standard_v2','version':2,'status':'user_confirmed','userQuote':quote,'confirmedAt':datetime.now().astimezone().isoformat(),'sourceTask':'MAIN01-20261109-DBF50341','sourceIteration':4,'selectedVariant':6,'selectedVariantLabel':'scalp_face_v03 신규2안','scope':'Future SD character style/proportions/readable face; preserve individual identities and separate technical framing','notFixedAnatomicalRatio':True,'references':selected,'sourceManifest':str(art/'asset-manifest.json'),'sourceManifestSha256':hashlib.sha256((art/'asset-manifest.json').read_bytes()).hexdigest(),'policy':str(adopt),'proof':str(proof),'gitSaveRequested':False}
(refs/'승인.json').write_text(json.dumps(approval,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
spec2=importlib.util.spec_from_file_location('board',S/'도구/작업대장.py');m=importlib.util.module_from_spec(spec2);spec2.loader.exec_module(m);b=m.Board(S)
old=b.load('MAIN01-20261109-DBF50341','main01');assert old['status']=='awaiting_user' and old['iteration']==4
b.record(old['id'],'main01','accept',proof,quote)
with b.writer():
 old=b.load(old['id'],'main01');old['acceptedScope']={'variant':6,'label':'신규2안','directions':['front','right45','right90'],'futureSDStandard':str(adopt),'unselectedVariantsNotAccepted':[1,3,4]};b.save(old)
task=b.new('main01','characters','신규2안 채택에 따른 SD 공통 제작기준 갱신',quote);folder=b.folder(task['id'])
prompt=f'''# 사용자 확정 SD 기준 정교화 — {task['id']}
main01→캐릭터 담당. 사용자 원문 “{quote}”. {proof}가 실제 채택 근거이고 {adopt}와 {refs/'승인.json'}가 공유 승인 원본이다. 신규2안(ID6)의 정면/45/90을 참조로 향후SD두상·체형·얼굴가독성·픽셀표현 기준을 갱신한다. 새 그림 제작 요청이 아니다. 사용자 합격을 다시 묻지 않는다.

자기 작업방법·공통/분야·이 채택/기존SD기준·기존카탈로그소비처를read-pack본문으로읽고새작업ACK/start후진행한다. 원작업의ACK재사용금지. Sol medium기본,저장운영규정대로커밋/푸시/예약백업금지. 실제변경은characters자기공간의 SD공통제작기준.md,SD_생성프롬프트.md,자료/캐릭터설정/SD_공통제작기준.json,SD_공통제작기준_실측.json,제작순서.json,AGENTS.md의관련SD지침과필요한카탈로그생성소스/산출물/SD기준뷰어·검증,이작업기록에한정한다. 현재파일을먼저읽고기존미커밋부분을보존한다. 게임런타임·실제유닛·창/탭/패널·다른캐릭터/그림생성은제외한다.

기존 은발 기준은 별도 이력으로 보존하고 최신 두상/비율/화풍 마스터를 신규2안으로 연결한다. 새 승인3PNG가 필요하면 자기 자료폴더에 바이트동일 사본으로 보관해 상대경로를 유효하게 한다. 다른 캐릭터는 이 마스터를 STYLE/PROPORTION으로만 사용하며 얼굴형/헤어/성별/종족/체격/장비를 복제하지 않는다. 3.3 hair-inclusive 같은 이전 탐색값을 새 확정 등신으로 쓰지 않는다. 실제 숨은 정수리는 추정임을 유지한다.
원본의 작은 여백/유색 알파·미세디테일차이는새허용결함으로승격하지않는다. 기술적인 공통키/발선/기존프레이밍의정규화기준은두상스타일채택과분리해기존별도조건으로유지한다. 신규2원본캔버스/프레이밍과 미래생성 납품템플릿을 같은 값으로 위장하지 않는다. JSON의 reference.native dimensions/측정값과generation framing의기준캔버스를명확히구분하고필드소비도함께갱신한다. 이전자료실측은역사적측정으로유지하고새승인원본3개측정/해시를추가한다.
특히 tools/character-catalog/build.mjs가sd_standard를읽고 verify-files.mjs가catalog.sd_standard/production.sd.standard_id/참조SHA/기존프레이밍을검사하므로 제작순서와카탈로그를일치시킨다. 필요한카탈로그생성·파일참조/해시검증을수행하되화면은열거나조작하지않는다. 기존다른작품선택/폐기/메타를일괄바꾸지않는다. 기존sd-standard뷰어가은발체형공통기준이라거짓표시되지않게기준설명/데이터를정리한다. 필요한변경만한다.
자신이필독문서를수정해ACK해시가바뀌면최신본문을다시읽고동일작업의새start확인을남겨반환게이트를통과한다. 이것은새사용자승인요청이아니다. 최종5종기록·전후해시/변경이유·검증/미검증·수동저장전변경상태를정리해이작업결과폴더(자기output/handoffs/SD-STD-002) report.md/결과.json으로worker_done한다. 공유규정A/다른팀/실게임소스는수정하지않는다.
'''
for name,body in [('요청확인.md',proof.read_text(encoding='utf-8')),('전문프롬프트.md',prompt),('2_사전확인.md',pre.read_text(encoding='utf-8'))]:(folder/name).write_text(body,encoding='utf-8')
b.set_readings(task['id'],'main01',[str(proof),str(adopt),str(refs/'승인.json'),str(S/'저장운영규정.md')]);b.confirm(task['id'],'main01',quote,proof);plan=b.prepare(task['id'],'main01')
(HERE/'신규2채택-기준갱신연결.json').write_text(json.dumps({'task':task['id'],'folder':str(folder),'output':'C:/Users/user/orca/workspaces/Grid Defenders/캐릭터디자인2/output/handoffs/SD-STD-002','policy':str(adopt),'plan':plan},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
# Only append to unleased SD roles' own criteria; preserve active UI/effects reading hashes.
for role in ['characters','sprites']:
 p=S/f'기준/{role}/규정.md'
 with p.open('a',encoding='utf-8') as f:f.write(f'\n\n## SD-STD-002 사용자 채택 — 2026-11-09\n공유 최신 SD 비율·얼굴가독성 기준은 `{adopt}` 및 승인.json의 신규2안(ID6)이다. 향후SD작업시본문과실제참조를읽는다. 다른캐릭터의얼굴/헤어/장비·종족체격은유지한다. 구은발체형기준은이범위에서이력으로대체한다. 사용자의저장요청없이는커밋/푸시하지않는다.\n')
# Criteria changed while the new task is only prepared: refresh confirmation/derived prompt before sending.
# Board hashes intentionally guard this; recover to draft using the prepared task's documented state only.
with b.writer():
 t=b.load(task['id'],'main01');assert t['status']=='prepared';t['status']='draft';t['approval']=None;b.save(t)
b.confirm(task['id'],'main01',quote,proof);plan=b.prepare(task['id'],'main01')
link=HERE/'신규2채택-기준갱신연결.json';data=json.loads(link.read_text(encoding='utf-8'));data['plan']=plan;link.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
exe='C:/Users/user/AppData/Local/Programs/orca/resources/bin/orca.exe';sent={}
for role,dest in [('main02','run:run_2939978c8e65'),('main03','run:run_b29b47372e51')]:
 body=f'사용자가 “{quote}”라고 확정했습니다. {adopt}와 {refs/"승인.json"}가 최신 공유 SD 기준입니다. 실제두상/몸비율·얼굴가독성·SD픽셀표현은신규2안(ID6)으로,개별얼굴/헤어/성별/종족/체격/장비는유지합니다. 기존은발체형마스터는그범위에서이력으로대체하며여백/발선같은기술조건과미적스타일채택을구분합니다. 캐릭터팀이정규문서/JSON/프롬프트/카탈로그를갱신중입니다. 앞으로SD지시에이공유기준을첨부하세요. 기존작업을임의재제작/중단하거나일러스트·몬스터기준까지바꾸지마세요. 저장요청아니므로커밋푸시없음. 본문읽고적용을회신해주세요.'
 p=subprocess.run([exe,'orchestration','send','--to',dest,'--subject','사용자 채택: 신규2안을 향후 SD 공통 비율·얼굴 기준으로','--type','status','--body',body,'--json'],capture_output=True,encoding='utf-8');sent[role]=json.loads(p.stdout[p.stdout.index('{'):])
p=subprocess.run([exe,'orchestration','send','--to','dispatch:ctx_cf22e65671df','--subject','사용자 신규2안 채택·기존 SD 정규기준 갱신 (새이미지생성없음)','--type','dispatch','--body',Path(plan['prompt']).read_text(encoding='utf-8'),'--json'],capture_output=True,encoding='utf-8')
try:r=json.loads(p.stdout[p.stdout.index('{'):])
except (ValueError,json.JSONDecodeError):r={'ok':False,'stdout':p.stdout,'stderr':p.stderr}
sent['characters']=r;receipt.write_text(json.dumps(sent,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');print(json.dumps(sent,ensure_ascii=False,indent=2),flush=True)
if p.returncode or not r.get('ok'):raise SystemExit('Inspect failed receipt; do not duplicate.')
b.record(task['id'],'main01','sent',receipt)

from pathlib import Path
import json,subprocess,hashlib,importlib.util
ROOT=Path('C:/Users/user/Desktop/Grid Defenders');S=ROOT/'작업관리';HERE=Path(__file__).resolve().parent
receipt=HERE/'실제발송영수증.json'
if receipt.exists():raise SystemExit('Already attempted; inspect receipt before recovery.')
link=json.loads((ROOT/'메인작업/main01/game-style10/연결.json').read_text(encoding='utf-8'));base=Path(link['output'])
spec=importlib.util.spec_from_file_location('board',S/'도구/작업대장.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);b=m.Board(S);task=b.load(link['task'],'main01')
if task['status']!='awaiting_user' or task['iteration']!=2:raise SystemExit('Unexpected state; do not duplicate revision.')
if 'characters' in b.leases():raise SystemExit('Character workspace leased; coordinate first.')
inputs=[base/'01_arknights/character.png',base/'04_another_eden/character.png'];assert all(p.is_file() for p in inputs)
proof=HERE/'사용자확인.md';proof.parent.mkdir(parents=True,exist_ok=True)
proof.write_text('''# 선택안 기본자세6장 제작 확인

사용자: “1,4번 적용 기준으로 정면 3/4측면 우측면 이렇게 뽑아봐 거기서 최종결정하자”.
이후 자세 정정: “기본자세로 뽑아봐”.
메인이 확인한 범위: “1번·4번을 각각 양발로 서서 장검·단검을 자연스럽게 내려 든 기본 대기 자세로 제작할까요? 정면·오른쪽 45°·90°로 총 6장이며, 최종 채택·게임 적용은 비교 후 결정합니다.”
사용자 실제 선택: “이 내용으로 진행 — 기본 자세 6장”.

실제원문으로같은범위의제작을승인했다. 전투준비자세가아닌기본입상대기이며총6장이다. 두스타일을하나로통합하지않고각1/4의그림체·비율을유지한다. 최종채택/공통기준교체/게임적용/GitHub저장은이번승인이아니다.
''',encoding='utf-8')
pre=HERE/'사전확인.md';pre.write_text('제작하달전작성. 명시적진행규칙과사용자정정/실제선택,main01방법/characters기준,원작업차수2반환·현재characters잠금없음,Orca기존담당succeeded/retained를확인했다. 새로운기본대기6장범위를차수3으로분리하고이전10안과부분40장결과를보존한다. source1/4실제파일과해시를연결한다. 이번포즈변경은사용자가명시했으므로허용하며스타일/비율/장비정체성은유지한다. 정면2장을먼저만든후각각의앞사선/정측면으로전개해안별일관성검수한다. 기준폴더와원작업기록만수정,게임/공통기준/화면/커밋푸시제외.\n',encoding='utf-8')
b.record(task['id'],'main01','revise',proof,'이 내용으로 진행 — 기본 자세 6장');task=b.load(task['id'],'main01');folder=b.folder(task['id']);out=base.parent/('idle6_style1_style4_'+task['id'].lower()+'_v003')
prompt=f'''# 사용자 선택1번·4번 기본대기3방향씩6장 — {task['id']} / 차수3

main01→기존캐릭터팀장. 사용자 실제 선택 “이 내용으로 진행 — 기본 자세 6장”. 근거 {proof}. 포즈는전투준비가아닌**양발로서서장검과단검을자연스럽게내려든기본입상대기**다. 1번과4번각정면/화면오른쪽앞3/4(45도)/화면오른쪽정측면(90도) 총6장을실제생성한다. 최종선택과게임적용은아직아니다. 같은확인재요구금지.

매새차수자기AGENTS/작업방법/공통분야/진행승인·저장규칙/최신사용자요청/기존작품자료를read-pack본문으로읽고차수3/characters새ACK/start를통과한뒤생성한다. 이전ACK재사용금지. 메인이송신직후영수증연결. 내장imagegen/해당스킬로개별생성,Sol medium기본,유료외주임의전환없음. 필요한하위담당에게도범위/방법/필독/입출력을전달한다. 커밋·푸시·예약백업/사용자창·패널·탭조작없음.

## 안별 유일 스타일·비율 마스터
1번 명일방주참고안: {inputs[0]}
4번 어나더에덴참고안: {inputs[1]}
실제view_image로두파일과사용자피드백을읽고입력SHA를기록한다. 두안의그림체/얼굴·머리/몸/팔다리비율차이는유지한다. 1번은각진헤어/색면·매트셀,4번은보다부드러운재질·중간비율이라는원작업분석을실제마스터와대조해적용한다. 두안이동일그림체로합쳐지지않게한다. 이전신규2안ID6/은발공통참조를두안의체형으로강제하지않는다;이번선택비교에한정해사용자명시마스터를우선한다. 다른게임캐릭터/의상으로바꾸지않는다.

## 기본자세와 회전
뛰기/공격/무릎을깊게굽힌전투태세/가슴앞으로교차한무기자세가아니다. 양발을바닥에딛고자연스럽게서고어깨/팔을편안히내려양손의무기를몸옆아래로든다. 같은인물/같은기본포즈를정면0→오른쪽앞45→오른쪽완전측면90으로돌린다. 두스타일사이도기본포즈/카메라높이가일치하게한다.
오른손장검/왼손짧은각진단검을유지한다. 금발·갈색눈·은갑옷·청색목도리/짧은내려진후드·청허리천·갈색벨트/주머니/바지·오른초승달견갑/판금정강이·왼청색천장화,장검청색사선/날개가드/고리보호대를보존한다. 정면에서인체오른쪽은화면왼쪽.90도먼쪽단검/팔의자연가림은허용하며보이게하려고추가팔/무기를만들지않는다.
45도는두눈과흉갑앞면일부가보이는앞사선,90도는한눈/코옆선·옆몸통·겹친어깨/발이보이는완전측면이다. 머리만돌리거나좌우반전/다른안의옆그림으로대체하지않는다. 서있는키/머리비중·얼굴인상·장비형태가방향별로튀면검수해보완한다.

## 제작 순서/형식
우선각안의정면기본자세1장씩2개를생성·실제열람해스타일/비율/기본자세/손·무기/얼굴을확인한다. 그새정면을해당안의동일인물/비율마스터로삼아45도·90도각2장을제작한다. 이내부검수는추가사용자승인대기를만들지않는다. 각안의기존전투준비45도파일을새기본자세최종본으로복사해개수를채우지않는다.
새출력 {out}에variant-1-front.png/variant-1-right-045.png/variant-1-right-090.png 및variant-4-front.png/variant-4-right-045.png/variant-4-right-090.png를생성원본바이트그대로보존한다. 실제캔버스/알파/SHA/원본경로와각프롬프트입력역할을기록한다. 투명배경·머리/발/무기끝포함·적절한안전여백요청. 부자연스러운늘림/리샘플링/알파자동정리로기준을맞춘것처럼주장하지않는다. 조정필요시후보를보존하고실제재생성한다.
asset-manifest.json에안번호1/4와방향front/right45/right90,원래치수,bodyHeight·footX/Y·측정ROI/방법/추정오차를기록한다. 모발끝/숨은두상/검끝/캔버스는구분한다. 모든방향의표시크기/발선은CSS등비등록으로비교하며개별PNG원본을수정하지않는다.

## 비교와 검수
index.html과comparison.png는2행(1번/4번)×3열(정면/45/90)로같은전체표시키·발선·배경에서한눈에비교되게한다. 각안세방향상세PNG2장,원형1/4와의표현비교,57/72CSSpx의작은표시와밝고어두운배경/개별확대를제공한다. 작은표시는미리보기이며실게임/실기기검증이라고하지않는다.
6개실제원본과전체/상세/작은표시를열어같은자세/시점회전·각안스타일/비율·얼굴·헤어·손/무기수·인체좌우·그립연결·잘림/알파·방향별발등록을검수한다. 1번과4번의선/면/비율차이가6개에서도유지되는지확인한다. 모든안이같은표정/비율로수렴하면수정한다. 정확한3D투영/해부학계측이라고과장하지않고미세한생성차이/가림을기록한다.
분석/제작기준/검수/report.md/결과.json/생성기록/manifest와원작업차수3의5종기록을제출한다. 허용편집은새출력과이작업기록뿐. 기존10안/부분40장/현재SD공통기준/카탈로그/게임/타팀/화면/모델설정은변경하지않는다. 완료시실제6파일·비교·보고절대경로를worker_done으로main01에회신한다. 최종미적선택·공통채택·게임적용은사용자판정이후이며자동실행하지않는다.
'''
for name,body in [('요청확인.md',proof.read_text(encoding='utf-8')),('전문프롬프트.md',prompt),('2_사전확인.md',pre.read_text(encoding='utf-8'))]:(folder/name).write_text(body,encoding='utf-8')
b.set_readings(task['id'],'main01',[str(proof),str(pre),str(ROOT/'메인작업/main01/game-style10/사용자피드백-4번선호.md'),str(S/'진행승인규칙.md'),str(S/'저장운영규정.md'),str(base/'report.md'),str(base/'검수.md')]);b.confirm(task['id'],'main01','이 내용으로 진행 — 기본 자세 6장',proof);plan=b.prepare(task['id'],'main01')
(HERE/'연결.json').write_text(json.dumps({'task':task['id'],'iteration':3,'folder':str(folder),'output':str(out),'inputs':[{'path':str(p),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in inputs],'plan':plan},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
exe='C:/Users/user/AppData/Local/Programs/orca/resources/bin/orca.exe'
p=subprocess.run([exe,'orchestration','send','--to','dispatch:ctx_86394ae5b02a','--subject','진행 승인: 1번·4번 기본 대기 자세 정면/45/90 총6장 / 차수3','--type','dispatch','--body',Path(plan['prompt']).read_text(encoding='utf-8'),'--json'],capture_output=True,encoding='utf-8')
try:r=json.loads(p.stdout[p.stdout.index('{'):])
except (ValueError,json.JSONDecodeError):r={'ok':False,'stdout':p.stdout,'stderr':p.stderr}
receipt.write_text(json.dumps(r,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');print(json.dumps(r,ensure_ascii=False,indent=2),flush=True)
if p.returncode or not r.get('ok'):raise SystemExit('Inspect receipt; no blind retry.')
b.record(task['id'],'main01','sent',receipt)

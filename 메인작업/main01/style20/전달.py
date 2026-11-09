from pathlib import Path
import importlib.util,json,subprocess,hashlib
ROOT=Path('C:/Users/user/Desktop/Grid Defenders');S=ROOT/'작업관리';HERE=Path(__file__).resolve().parent
receipt=HERE/'실제발송영수증.json'
if receipt.exists():raise SystemExit('Already attempted; inspect receipt before recovery.')
spec=importlib.util.spec_from_file_location('board',S/'도구/작업대장.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);b=m.Board(S)
if 'characters' in b.leases():raise SystemExit('Character workspace leased; coordinate first.')
quote='이때 AI가 진짜 별 차이도 안나는 비교하기도 힘든 비슷한 모델 뽑을수도있는데 그렇게 뽑지말라하고 누가봐도 20가지 다 다르다는 느낌이 들정도로 차별화되야함'
base=Path('C:/Users/user/orca/workspaces/Grid Defenders/캐릭터디자인2/output/characters/gc9_longsword_dagger')
inputs=[base/'combat_ready_right045_illustration_proportions_v02/sd-pose-original.png',base/'combat_ready_right045_illustration_proportions_v02/combat-ready-illustration-proportions.png']
assert all(p.is_file() for p in inputs)
proof=HERE/'사용자확인.md';proof.parent.mkdir(parents=True,exist_ok=True)
proof.write_text('''# 사용자 요청·이해 확인

최초 요청: “지금 저 두모델 기준으로 똑같은 자세로 2D 그래픽을 어떻게 표현할지 분석해보고 진짜 다양한 표현방법으로 그림체를 바꿔봐봐”.
사용자는20가지가가능한지물었다. 메인은 “두 모델의 비율·자세·시점·무기를 유지하고, 서로 다른 20가지 그림체를 각각 적용한 총 40장을 비교판으로 제작할까요?”라고범위를확인했다.
사용자는그질문을인용하며다음제작조건을직접지시했다:
'''+quote+'''

적용:20표현×두모델40장. 이번범위는원본두모델의체형차이를유지하는그림체탐색이며공통SD신규2안비율을양쪽에강제하지않는다. 의미있는스타일차이와유사결과재제작이필수다. 게임교체/공통스타일재채택/GitHub저장은포함하지않는다.
''',encoding='utf-8')
styles=[
('01_anime_cel','정돈된 애니 셀','가늘고 정돈된 외곽선, 선명한 2단 명암, 매끈한 색면'),
('02_bold_cartoon','굵은 카툰','매우 굵고 탄력있는 외곽선, 단순한 큰 색 덩어리와 그래픽 하이라이트'),
('03_flat_vector','무테 플랫','외곽선 없음, 5~7색 단색 실루엣, 그라데이션/재질텍스처 없음'),
('04_faceted','각진 기하 면분할','삼각/다각형 색면과 각진 윤곽, 2D 면분할, 둥근 셀채색과 구분'),
('05_painted_fantasy','손그림 판타지','회화적인 재질/형태 묘사, 붓으로 쌓은 면, 섬세한 금속과 천'),
('06_watercolor','투명 수채','물 번짐·안료 가장자리·색 겹침, 가벼운 반투명 채색'),
('07_impasto','두꺼운 유화','불투명한 두꺼운 붓자국과 나이프 면, 거친 질감·강한 물성'),
('08_brush_ink','먹선 붓그림','큰 검은 먹덩어리·갈필·굵기 변화, 넓은 여백, 색은 소수 강조'),
('09_manga','흑백 만화','펜 외곽/눈 표현과 스크린톤, 또렷한 만화식 흰/검 명암'),
('10_engraving','동판화 선각','가는 평행선·촘촘한 교차 해칭으로 모든 음영 형성, 큰 먹칠 대신 선'),
('11_woodcut','목판화','거칠고 두꺼운 칼자국·넓은 검은 면/흰 홈, 동판화의 미세선과 확연히 구분'),
('12_pop_art','팝아트 만화','원색 대비·큰 벤데이 도트·그래픽 면·강한 인쇄물 인상'),
('13_neon_line','네온 라인','발광하는 외곽/내부 선으로 구조 표현, 채운 몸색 최소화, 선 중심'),
('14_paper_cut','종이 오려붙임','큰 종이 조각 겹침과 절단 가장자리·층 그림자, 세부 붓묘사 없음'),
('15_stained_glass','스테인드글라스','굵은 납선으로 구획된 보석색 불규칙 유리 조각·투과광'),
('16_retro_pixel','레트로 저해상도 픽셀','큰 계단형 픽셀/제한 팔레트/의도적 클러스터, 부드러운 HD선 없음'),
('17_colored_pencil','색연필','종이결을 따라 보이는 색연필 스트로크·겹친 색선, 회화 색면과 구분'),
('18_chalk_pastel','초크 파스텔','가루감·넓은 부드러운 문지름·깨진 가장자리, 가는 연필선과 구분'),
('19_screenprint','제한색 실크스크린','2~3색 잉크층·넓은 평면/의도적 미세 어긋남·스텐실 질감, 팝아트 큰 도트 없음'),
('20_graphic_silhouette','실루엣 그래픽','진한 몸 실루엣과 극소수 네거티브 컷/테두리광으로 얼굴·장비를 읽힘, 완전 채색과 구분')]
(HERE/'스타일계획.json').write_text(json.dumps(styles,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
task=b.new('main01','characters','동일 자세 두 모델 × 확연히 다른 20그림체 탐색40장',proof.read_text(encoding='utf-8'));folder=b.folder(task['id']);out=base/('style20_two_models_'+task['id'].lower())
prompt=f'''# 실제로 구별되는 20가지 2D 표현 × 두 모델 40장 — {task['id']}

main01→캐릭터 팀장. 원문/범위확인 {proof}. 최우선 요구는 “누가봐도20가지다다르다”. 미묘한미세변형40개는실패다. 사용자가20스타일×두모델총40장제안에직접단추가검수조건을반영해진행한다. 같은확인반복금지.

자기작업방법/AGENTS/공통분야/이번지시/추가필독을read-pack본문으로읽고이새작업characters의ACK/start후생성한다. 과거ACK재사용금지. 내장imagegen과imagegen스킬을사용하고각이미지/변형마다개별생성,원본바이트보존. 유료외주/API임의전환·커밋·푸시·예약백업금지. 필요시승인범위내하위담당을써서분업가능하지만같은파일동시편집금지/역할별입출력·필독/방법/원작업번호·검수회신을전달하고상위에서결과차별화검수한다. 기본Sol medium.

## 입력과 고정
A(SD신체비율)={inputs[0]}
B(SD그림체+일러스트신체비율)={inputs[1]}
사용자스크린샷=C:/Users/user/AppData/Roaming/orca/agent-session-attachments/42e3ad22-9f06-4bd6-bb3c-858da9c8bdfe/orca-paste-1794227704133-70e07650-57d4-4dcc-8b34-aacf742f6ee5.png
위3입력을실제view_image로확인하고A/B의파일SHA를기록한다. 두모델은같은금발쌍검전사로각각원본비율을고정한다. 최신일반SD공통규정은이특정두모델의한쪽을바꾸는지시가아니다. 사용자최신요청인비율비교실험범위를우선한다.
두모델모두오른쪽앞사선전투준비자세,머리/몸방향·관절자세·발벌림·무기각도·오른손장검/왼손단검·정체성/복장·장비좌우유지. 의상/포즈/머리크기변경으로스타일차이를대신하지않는다. 스타일표현에필요한선/면단순화는허용하되신규헤어/갑옷/새소품/배경으로차이를과장하지않는다. 가능한표현에서금발/청/은/갈색배색유지,흑백인쇄계열은명도대응으로번역한다. A/B를같은비율로만들지않는다. 비교는같은표시키와발선으로하며원본을변형하지않는다.

## 20표현 계약
{json.dumps(styles,ensure_ascii=False,indent=2)}
이계획은실제렌더링차이를만들기위한제작기준이다. 각스타일마다선의존재/굵기,명암을만드는방법,색의단계,질감·재료,형태의단순화방법 중최소2축에서인접/유사스타일과큰차이를설계한다. 이축수는작업용설계기준이지사용자확정숫자규격이아니다. 팔레트/밝기/채도/작은붓자국만다르고동일한애니셀그림이반복되면실패다.
특히흑백묶음은먹그림=큰붓/갈필,만화=펜선/톤,동판화=촘촘한미세해칭,목판=두꺼운칼홈/큰검정면으로한눈에달라야한다. 컬러그래픽은무테플랫=무선단색,각진면=삼각파셋,종이=큰층/오린면,유리=납선/유리분할로구분한다. 회화도수채=물번짐,유화=두꺼운붓,판타지=재질묘사,연필=가는색선,초크=가루문지름이보여야한다.

## 중간검수와 재작업 조건
먼저극단적으로다른무테플랫/수채/먹선/종이4스타일×2모델을생성해자기연락판에서실제열람하고정체성·포즈고정과스타일거리부터확인한뒤나머지진행한다. 이중간검수는내부검수이며사용자추가승인대기를만들지않는다.
완성전20스타일을작은썸네일로도배열하고스타일라벨을가린상태에서서로다른표현처럼읽히는지검수한다. 같은애니채색으로수렴한쌍,비슷해서구별설명이미세디테일에의존하는쌍은후보를보존하고재생성/표현강화한다. 미달을20종채웠다는이유로최종본에섞지않는다. 자동이미지유사도점수나파일SHA차이를‘누가봐도다름’의증명으로쓰지않는다. 각스타일의가장가까운다른안과의차이/관찰근거를검수표에기록하고모호한쌍을솔직히알린다. 가능하면본인하위검수담당이독립적으로40개를봐서유사군을지적하게하고보완한다.

## 산출물
새출력 {out}에만작업. 각스타일폴더20개에model-a.png/model-b.png실제40PNG와생성입력/프롬프트/호출/후보/실제크기·알파·SHA를남긴다. 투명배경을요청하고재료질감은인물영역에적용해비교용배경장식으로차이를위장하지않는다. 픽셀스타일도실제제작된픽셀표현시안으로내고원본을단순최근접축소한것을생성으로보고하지않는다. 네이티브게임용도트규격납품은이번탐색과구분한다.
index.html:20스타일을한눈에볼수있는전체비교/스타일별A·B쌍/개별원본확대,각모델의원형비교,밝고어두운배경. 비교PNG는읽기쉬운5스타일×2모델씩4장+전체요약1장도제공해40개를너무작게만보여주지않는다. 파일표시만CSS등비맞춤,개별생성원본은재저장/늘림금지.
분석.md에두비율에서각표현이읽히는방식·게임작은표시가독성·개성유지관찰을정리한다. 제작기준.md에사용자‘확연한차별화/유사결과불합격’조건을작품기준으로추가하고일반SD공통마스터를미승인스타일로교체하지않는다. 검수.md에20개스타일별차별화축/유사쌍/재작업/잔여한계,포즈·비율·장비보존,밝고어두운전체프레임·작은표시검사를기록한다. report.md/결과.json/asset-manifest.json과원작업5종기록을제출한다.
편집허용은이새출력과원작업기록뿐. 기존모델/현재SD공통기준/게임/UI/카탈로그/다른작업/사용자창·탭·패널을수정하지않는다. 길어진작업은완료된스타일수와다음검수상태를간략히회신하고worker_done으로실제40파일/연락판/검수/보고절대경로를main01에보낸다. 최종사용자선택은별도이며본인이자동채택하지않는다.
'''
for name,body in [('요청확인.md',proof.read_text(encoding='utf-8')),('전문프롬프트.md',prompt),('2_사전확인.md','제작지시전작성. 두원본경로와동일자세비교자료를확인했다. characters잠금없음,직전기준갱신담당성공반환확인. 사용자20종40장범위에대한직접추가조건을제작·검수필수로반영. 비슷한스타일은재생성,색조만다른안금지. 기존SD공통채택과별개탐색이며실게임변경/그림자동채택/저장제외. 입력SHA·자세/비율고정·실제차별화눈검수·파일참조/알파/잘림검사.\n')]: (folder/name).write_text(body,encoding='utf-8')
b.set_readings(task['id'],'main01',[str(proof),str(HERE/'스타일계획.json'),str(S/'저장운영규정.md'),str(base/'combat_ready_right045_illustration_proportions_v02/report.md')]);b.confirm(task['id'],'main01',quote,proof);plan=b.prepare(task['id'],'main01')
(HERE/'연결.json').write_text(json.dumps({'task':task['id'],'folder':str(folder),'output':str(out),'inputs':[{'path':str(p),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in inputs],'plan':plan},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
exe='C:/Users/user/AppData/Local/Programs/orca/resources/bin/orca.exe'
p=subprocess.run([exe,'orchestration','send','--to','dispatch:ctx_784c56823509','--subject','두 모델×확연히다른20표현40장·유사결과재제작 필수','--type','dispatch','--body',Path(plan['prompt']).read_text(encoding='utf-8'),'--json'],capture_output=True,encoding='utf-8')
try:r=json.loads(p.stdout[p.stdout.index('{'):])
except (ValueError,json.JSONDecodeError):r={'ok':False,'stdout':p.stdout,'stderr':p.stderr}
receipt.write_text(json.dumps(r,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');print(json.dumps(r,ensure_ascii=False,indent=2),flush=True)
if p.returncode or not r.get('ok'):raise SystemExit('Inspect failed receipt; do not resend blindly.')
b.record(task['id'],'main01','sent',receipt)

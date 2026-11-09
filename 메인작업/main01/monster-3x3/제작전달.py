from pathlib import Path
import importlib.util,json,subprocess,shutil,hashlib
ROOT=Path('C:/Users/user/Desktop/Grid Defenders');S=ROOT/'작업관리';HERE=Path(__file__).resolve().parent
WORK=Path('C:/Users/user/orca/workspaces/Grid Defenders/몬스터-디자인')
CHAR=Path('C:/Users/user/orca/workspaces/Grid Defenders/캐릭터디자인2')
EXE='C:/Users/user/AppData/Local/Programs/orca/resources/bin/orca.exe'
def write(p,t):p.parent.mkdir(parents=True,exist_ok=True);p.write_text(t,encoding='utf-8')
def dump(p,d):write(p,json.dumps(d,ensure_ascii=False,indent=2)+'\n')
if (HERE/'발송시도.json').exists():raise SystemExit('Already attempted; inspect state/receipt, do not duplicate')
ps=subprocess.run([EXE,'worktree','ps','--json'],capture_output=True,encoding='utf-8',check=True)
row=next(w for w in json.loads(ps.stdout[ps.stdout.index('{'):])['result']['worktrees'] if Path(w['path']).resolve()==WORK.resolve())
dump(HERE/'담당사전상태.json',row)
if any(a.get('state') not in {'done','idle'} for a in row.get('agents',[])):raise SystemExit('Monster workspace already active or unclear; no duplicate editor')
request='''사용자 원본: C:/Users/user/Downloads/Dnd Character concept.jfif, Blue Golem Guardian.jfif, Undead Archer.jfif.
최초 요청: 몬스터 정면 측면 우측면 디자인 통일감있게 뽑아와봐.
메인 이해 확인: 원본3종(녹색 전사·푸른 골렘·언데드 전사)을 기존 몬스터 SD 화풍으로 맞추고 체형/장비/색상/디테일이 방향마다 이어지게 한다. 비대칭 장비는 단순 반전하지 않는다. Undead Archer라는 파일명과 달리 이미지의 방패·검을 유지한다. 방향은 정면·좌측면·우측면으로 몬스터당3장, 총9장인지 질문했다.
사용자 확인 원문: #네 맞습니다'''
write(HERE/'사용자확인.md',request)
spec=importlib.util.spec_from_file_location('board',S/'도구/작업대장.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);b=m.Board(S)
task=b.new('main01','monsters','몬스터3종 SD 정면·좌측면·우측면9장',request);folder=b.folder(task['id']);out=WORK/'output/monsters'/('three_types_three_views_'+task['id'].lower())
sources={}
for key,name in [('green-warrior','Dnd Character concept.jfif'),('blue-golem','Blue Golem Guardian.jfif'),('undead-warrior','Undead Archer.jfif')]:
 p=Path('C:/Users/user/Downloads')/name;q=folder/'참조'/f'{key}.jfif';q.parent.mkdir(exist_ok=True);shutil.copy2(p,q)
 sources[key]={'path':str(q),'source':str(p),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
dump(folder/'참조/원본연결.json',sources)
prompt=f'''# 몬스터 팀장 전문 제작 지시 — {task['id']} / 차수1

책임 main01 → monsters. 기존 담당/원본을 보존하며 이 작업 공간에서 단일 편집자로 실제 이미지9장을 제작한다. 사용자 확인 범위와 원문은 {HERE/'사용자확인.md'}.
사용자는 메인의 ‘정면·좌측면·우측면, 몬스터당3장 총9장, 원본장비 유지’ 해석에 “#네 맞습니다”라고 확인했다. 방향/장비를 다시 묻지 않는다. 금발 전사4안의45도추가와는 별도의 몬스터 작업이다.

## 착수 전
자기 AGENTS/작업연결/작업진행방법, 공통규정/분야기준, 추가필독을 본문으로 읽고 read-pack → 이번 작업 적용요약과 현재해시의 자기 확인서 → start 통과 후 제작한다. 영수증은 총괄이 worker-start 직후 연결한다. 아직 발송 상태만 대기면 메인에게 ask로 연결을 요청하고 사용자승인문제로 돌리지 않는다.
imagegen 스킬을 읽고 내장 image_gen을 사용해 **실제 디자인 이미지9개**를 만든다. 전용 외부 유료 API/계정 연결은 이번 작업에 필요 없다. 그래픽 코드로 캐릭터를 그리거나 단순 좌우반전/원본 사진 변형으로 제작을 대신하지 않는다.

## 입력과 화풍
원본 사본/해시 목록: {folder/'참조/원본연결.json'}
녹색전사: {sources['green-warrior']['path']}
푸른골렘: {sources['blue-golem']['path']}
언데드전사: {sources['undead-warrior']['path']}
세 원본 모두 view_image로 열어 신체/장비의 좌우와 비대칭/등 구조를 분석한다.
몬스터 공통 스타일: {WORK/'문서/00_개발규칙/몬스터디자인기준.md'}.
그 문서가 지정하는 스타일 기준: {CHAR/'output/silver-staff-8views-v1/제작기준.md'} 및 images/의 정면·정측면 선택본을 실제로 본다. 기존 몬스터 슬라임은 스타일 확인용 보조일 뿐 눈색/등신/형태를 세 원본에 복사하지 않는다. 현재 금발전사 미선택 시안을 공통 몬스터 비율로 채택하지 않는다.
큰 머리/짧은 몸 SD, 픽셀풍 외곽선/명암의 밀도, 카메라 높이/광원/재질 단순화 방식을 세 종류에 일관되게 적용한다. 원본은 개체 정체성/구성, SD 기준은 화풍/가독성의 역할이다. 세 몬스터를 똑같은 인간 체형으로 만들지 않는다.

## 개체별 유지점
녹색전사: 녹색피부·엄니·검푸른짧은헤어·육중한근육·가죽띠·허리천/사슬갑옷·무릎보호대/감긴장화·비대칭어깨의원본구성을유지. 원본의등무기손잡이와빈손/주먹을확인하고,새로운큰무기를손에쥐어주지않는다. 원본 비대칭의 인체좌우를 먼저 기록한다.
푸른골렘: 어두운파편형바위몸·매우큰어깨/팔·푸른에너지균열과중심핵·분리되어떠있는석재·푸른하부에너지. 갑옷입은인간으로 바꾸지 않는다. 관절과 몸체 분리구조가 앞/옆에서 이어지게 하며 발이실체인지에너지접지인지같은기준을유지한다. 에너지발광은투명배경의외곽을검수하고회색배경사각형을남기지않는다.
언데드전사: 해골형얼굴·훼손된가죽/천/갑옷·마른비대칭팔다리·머리뒤/등의화살·손에든방패와검을유지. 파일명이Archer라는이유로활/화살통/새궁수포즈를추가하지않는다. 방패/검의인체좌우는원본관찰후고정하고,반대방향에서보이지않는부분은가림으로처리한다.
뒤/옆의원본에안보이는구조는확인가능한부분에서최소한으로연결하며새스킬/공식이름/국가소속/스탯을만들지않는다.

## 정확한 방향과 생성 순서
각종 정면0도, **화면 왼쪽을 향한 완전한 좌측 정측면270도**, **화면 오른쪽을 향한 완전한 우측 정측면90도**. 이번9장에는3/4·후면이없다. 좌측면/우측면이사선처럼되거나얼굴만회전하지않도록 머리·몸통·발·장비가함께회전한다. 양발대기자세이고걷기/공격시트는없다.
먼저세종의정면을같은화풍으로수립한뒤각개체의생성된정면을그개체좌우방향의동일디자인입력으로실제첨부한다. 사용자가9장전체제작을확인했으므로방향마다추가승인을요구하지않되,전체화풍이명확히어긋나면무조건양산하지말고근거와수정방향을메인에게알린다.
개체별방향세트는같은캔버스/본체높이/머리크기/발선/장비크기를유지한다. 개체간에는고유체격을보존하고 비교페이지에서상대키와전시등비표시기준을밝힌다. 캔버스의투명여백과장비끝을몸키로혼동하지않는다. 실제투명PNG·전신/돌출부무잘림·밝고어두운배경검수. 생성원본을임의확대/축소/재인코딩하지말고바이트보존한다.

## 산출물과 편집 범위
허용 새 폴더: {out} 및 원작업기록 {folder}.
개별파일: green-warrior/front_000.png,left_270.png,right_090.png; blue-golem/동일3개; undead-warrior/동일3개. 각 원본생성PNG, 실제프롬프트·첨부순서·모델·생성기록, design-spec.md(고정장비/좌우/개체비율), manifest.json(해시/크기/알파/방향/본체bounds/발anchor/측정방법), 검수.md, report.md, 결과.json.
3행×3열 비교 PNG와 index.html(종/방향명,밝게/어둡게,원본확대)을제공해9장을한눈에확인가능하게한다. 기존source/게임public/공통규정/카탈로그/다른팀원본을수정하지않는다. 규정 보완은이작업의제안/확정범위를구분해기록한다.
실제검수:9장파일과내용,모든방향정확성,세종화풍통일,개체별동일성/장비좌우/표정/무기/손발/가림/잘림,투명도와밝고어두운배경,방향별본체비율·발선. 미달이있으면숨기지말고수정또는한계표기. 기술검증은사용자미적합격이아니다.
원작업5종기록중1/2는메인이사전작성한다. 자신의세부사전확인을제작전추가하고3/4/5를실제결과로완성한다.
완료하면 worker_done에결과·비교자료/개별9장/검수/manifest의절대경로와남은문제를보고한다. 사용자화면·브라우저탭·모델·패널을조작하지않는다. 게임적용과애니메이션은이번범위가아니다.
'''
write(folder/'전문프롬프트.md',prompt);write(folder/'요청확인.md',request);write(folder/'1_대화기록.md',request)
write(folder/'2_사전확인.md','# 사전확인\n실제 생성전 작성. main01/monsters. 사용자3개원본은view_image로확인했고팀장AGENTS/몬스터디자인기준/작업방법을본문으로읽었다. 정면·좌측정측면·우측정측면9장과방패/검유지를사용자가확인했다. 기존몬스터공통SD스타일을적용하되고유체격·장비좌우를보존한다. 새output/원작업기록만편집,기존원본보존. 담당현재완료상태를공식조회해동시편집이없음을확인했다. 필독/start후내장이미지생성,9장/방향/일관성/알파/밝고어두운배경을검증한다. 게임/화면조작/외부유료호출/기준전역확정은제외. 상세기준은전문지시참조.\n')
reads=[WORK/'문서/00_개발규칙/몬스터디자인기준.md',CHAR/'output/silver-staff-8views-v1/제작기준.md',HERE/'사용자확인.md']
b.set_readings(task['id'],'main01',[str(p) for p in reads]);b.confirm(task['id'],'main01','#네 맞습니다',HERE/'사용자확인.md');plan=b.prepare(task['id'],'main01')
dump(HERE/'작업연결.json',{'task':task['id'],'folder':str(folder),'output':str(out),'plan':plan})
argv=[EXE,'orchestration','worker-start','--spec-file',plan['prompt'],'--worktree',plan['selector'],'--agent','codex','--model','gpt-6.1-sol','--effort','medium','--keep-open','--task-title','몬스터3종 SD 정면·좌우측면9장','--json']
dump(HERE/'발송시도.json',argv)
p=subprocess.run(argv,capture_output=True,encoding='utf-8')
try:reply=json.loads(p.stdout[p.stdout.index('{'):])
except (ValueError,json.JSONDecodeError):reply={'ok':False,'raw':p.stdout,'stderr':p.stderr}
receipt=HERE/'실제발송영수증.json';dump(receipt,reply);print(json.dumps(reply,ensure_ascii=False,indent=2),flush=True)
if p.returncode or not reply.get('ok'):raise SystemExit('Inspect failedStage and official recovery; do not repeat')
b.record(task['id'],'main01','sent',receipt)
contract='게임개발 담당의 추가 방향 데이터API: CompareArt[]의 variant=0~4, direction=front|right45|right90, file, width,height,bodyHeight,footX,footY를 사용합니다. 신규방향 manifest에 이 값(또는 명확한 매핑)도 함께 기록해 주세요. 코드는 수정하지 말고 원본프레이밍/몸높이/발anchor측정근거만 제공하면 총괄이 연결합니다. 이전 방향제작/개체동일성/검수 조건은 유지합니다.'
notice=subprocess.run([EXE,'orchestration','send','--to','dispatch:ctx_553445b731ee','--subject','미리보기 연결 메타데이터 계약','--type','status','--body',contract,'--json'],capture_output=True,encoding='utf-8')
dump(HERE/'캐릭터메타데이터공지.json',{'stdout':notice.stdout,'stderr':notice.stderr,'returncode':notice.returncode})
print('Monster task delivery recorded: '+task['id'])

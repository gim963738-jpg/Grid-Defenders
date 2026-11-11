from pathlib import Path
import json,subprocess,hashlib,importlib.util,datetime

ROOT=Path(__file__).resolve().parents[3];S=ROOT/'작업관리';HERE=Path(__file__).resolve().parent
W=Path('C:/Users/user/orca/workspaces/Grid Defenders/스플래시-아트')
SRC=W/'output/balor-gc9-retry-20261109-v02/front.png'
receipt=HERE/'실제발송영수증.json'
if receipt.exists() or (HERE/'연결.json').exists():raise SystemExit('Existing attempt: inspect receipt before retry')
spec=importlib.util.spec_from_file_location('board',S/'도구/작업대장.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);b=m.Board(S)
assert 'splash' not in b.leases(),'Another active splash task'
assert hashlib.sha256(SRC.read_bytes()).hexdigest()=='061f23cc26b1f023918288446f9ac025de99bcf32550fb9be3e9850850f496fe'
proof=HERE/'사용자확인.md'
proof.write_text('''# 발로르 일러스트3방향 우선 제작 — 실제 승인
사용자: “에초에 발로르가 측면사진이 없어서 이렇게 나온걸수도있으니 발로르 일러스트 정면 35도 90도를 먼저 뽑고 그다음 SD작업을 진행하는방향으로 해보자”.
메인 이해확인: 승인된 정면 일러스트 기준으로0/35/90를 먼저 제작, 같은인물·체형·장비구조를 세방향 함께 검수·확정한 뒤 선택1번 그림체/비율로 SD0/35/90 제작. 이번 하달은 일러스트3방향 우선.
사용자 실제 승인: “진행”.
직전발로르SD는얼굴이과대/몸이말라짐/검이꺾였다고반려됐으며승인마스터가아니다. 일러스트에SD체형규칙을전파하지않는다. 그림체방향선택·일러스트디자인승인·신규3방향합격·SD합격은각각구분한다.
''',encoding='utf-8')
pre=HERE/'사전확인.md'
pre.write_text('''# 일러스트 제작 하달 전 사전확인
공통A/메인운영/작업대장과main01방법,일러스트분야규정/작업방법/해당AGENTS를읽고기존승인원화와보고·판정을대조했다. splash브랜치목록과실제기존 ctx_81f7538ea0a4 succeeded/settled/retained,공유잠금없음을확인했다. 기존담당을복제하지않고같은일러스트담당에공식followup. main03의기존작업과카탈로그/통합상태는수정하지않고main01소유신규작업으로원본보존제작. 승인원화SHA일치확인. 기존보고에도검축미세검토사항이있어단순원본복제로검정상주장하지않음. 최신원인분석의과도한슬림/큰머리지시를이번에는제외한다. 원본모델/4번예비/반려SD를유지,새일러스트output만편집. 일러스트사용자검수확정전SD생성/리깅/게임/Git저장/화면조작제외.
''',encoding='utf-8')
t=b.new('main01','splash','발로르 원본 일러스트0/35/90 우선제작·SD 선행자료',proof.read_text(encoding='utf-8'));folder=b.folder(t['id']);out=W/'output'/('balor-illustration-three-views-'+t['id'].lower()+'-v001')
prompt=f'''# {t['id']} 차수1 / 담당main01 / 실행splash·캐릭터일러스트
사용자 승인 원문과선후관계 {proof}. 발로르 **성인비율 일러스트 정면0도/화면오른쪽앞35도/화면오른쪽완전측면90도 총3장**을제작한다. 이번은SD가아니다. 승인정면을유지한방향별디자인자료를먼저확정하려는작업이다. 사용자가진행승인했으므로내부제작단계별허락반복없이3장·비교·검수제출까지수행.

## 참조의유일권한
정체성/얼굴/성인체형/의상·갑옷/무기/색/일러스트표현원본: {SRC}
사용자 일단합격판정 {S/'작업/MAIN03-20261109-21F94B82/사용자합격-v002.md'}, 기존보고 {W/'output/balor-gc9-retry-20261109-v02/보고.md'}. 실제원본을view_image로열고SHA확인. 기존0도파일은그대로보존하고새출력에참조사본을둔다.
이원본의머리/얼굴과성인몸비율을그대로재현한다. 금발선택1/모든반려SD/신규2안공통SD/짧은팔다리/큰머리·큰눈/임의슬림지시를이번일러스트에넣지않는다. 원래발로르의자연스럽고다부진기사체형/얼굴연령감을유지한다. '머리는크게,몸은가늘게'나'어깨폭=머리폭'같은지시금지. 일러스트의얼굴과몸을따로다른비율로바꾸지않는다.

## 보존할정체성
투구벗은짧은갈색머리/청회눈/차분한중립표정/청은갑주/층진견갑노출/가슴측면전신사자/원형은핀2개와연결끈없음/긴청색용문양망토·흰안감/검은허리벨트은버클/중앙청천흰기하문양/양다리청은갑주. 오른손검/왼팔은색큰카이트방패.
검: 파란감긴그립·둥근은폼멜·은날개가드·중앙붉은마름모보석·곧은은양날검. 손잡이중심과칼날중심이자연스럽게일직선인강체구조로연결될것. 장식가드의곡선과검자체의꺾임을구분. 기존원화보고의검축검토사항을자동정상으로복제하지말고새3방향에서는검축을정돈해정상연결을실제검수한다. 원본가드/색/문양을다른무기로리디자인하지않는다.
방패: 위장식/넓은상단/길게좁아지는아래끝/은테두리·검은긴십자와좌우검은날개. 크기·가로세로형태를원본과유지하고갑옷·방패두께/그립/팔지지연결을가능한범위에서맞춘다. 가려진모양을보이게하려추가손·무기를만들지않는다.

## 방향/자세/카메라
모두원본의동일한기본입상대기,양발지지·거의펴진무릎·검방패자연스럽게내려듦. 0도얼굴/흉갑/골반/발정면. 35도는화면오른쪽앞으로몸전체를돌려양눈·앞흉갑과우측면을함께볼수있는각도,45도파일라벨대체금지.90도는한눈/코옆윤곽/옆몸통·골반·발·겹친견갑의완전우측면. 머리만돌리거나얼굴만교체/좌우반전하지않는다. 카메라높이·원근·몸전체키·두상크기를동일하게한다.
정면을기준으로새0도후보를만들어원본디자인과검축/연결을내부확인한뒤그후보와승인원본을함께쓰고35/90으로전개한다. 기존0도를동일바이트재사용하는경우새생성으로위장하지말고출처명시. 사용자요청3종은모두제출하며원본과달라진0도후보는원본재승인으로승격하지않는다.
원본정면에서안보이는갑옷두께·뒷머리·망토고정·방패뒷지지등은새추정이필요하다. 참조에없는장식/구조를무분별하게늘리지않고최소연속구조로구성한뒤 **확인사실/새추정/가림·검증불가**를기록한다. 정확한3D투영이라고과장하지않는다. 90도방패는얇은옆면/가장자리위주가정상이며정면문양을억지로완전히보이게돌려붙이지않는다.

## 착수·도구·납품
이번splash작업번호/차수1로read-pack본문→자기AGENTS/방법/공통·분야/작품필독전부읽기→실제적용요약/해시새ACK→start통과후생성. 이전main03작업ACK재사용금지. 자기AGENTS의캐릭터스프라이트규약을읽되사용자최신'성인비율일러스트정지3장'이60프레임/픽셀시트기본값보다우선. 기존승인발로르와그제작/그립기준실제문서도읽는다. 내장imagegen/해당스킬참조첨부로실제생성하고유료API/다른모델임의전환없음. 텍스트기본Sol/medium. 하위작업필요시같은승인/방법/필독/입출력전달하고ACK검수.
허용새출력 {out} 및이신규작업기록만. front-000.png/right-035.png/right-090.png 실제개별PNG, index.html/comparison.png(0/35/90동일키·발선),얼굴/몸비율·검축/그립·장비앞뒤확대비교,밝음/어두운전체/실제원본확대,asset-manifest/생성기록/원본해시/후보/제작기준/검수/보고.md. 원본바이트그대로보존하며강제패딩/키잉/원본리샘플링/가로압축없음. 비교용CSS등비표시는원본파일변형과구분.
검수는얼굴연령·눈코입/체형·갑주층과두께/무기소유손·검길이·폼멜-그립-가드-칼날중심축/방패형태·문양·가림/방향별연속성/발선·여백·알파를실제원본배율에서각각확인한다. 이전실패처럼날씬해진수치나파일해시만으로디자인정상판정금지. 핵심검축/얼굴체형결함을미세차이로완료처리하지않는다. 내부미달은후보보존해보완하고남은문제정직하게제출.
작업5종기록은실제내용으로작성. 사용자신규합격/SD변환/파츠/리깅/애니메이션/게임적용/카탈로그추가/공통규정변경/화면조작/커밋푸시없음. 원본·예비안·반려이력·타메인작업을유지. 완성시공식worker_done으로Task를정리하고main01 run:run_47ce1a81d7b1에작업번호/보고·3파일·비교·검수절대경로회신. 네이티브coordinator가main03로남으면worker_done후main01에도공식status로완료근거전달(보고링크포함).
'''
for name,text in [('요청확인.md',proof.read_text(encoding='utf-8')),('전문프롬프트.md',prompt),('2_사전확인.md',pre.read_text(encoding='utf-8')),('1_대화기록.md',proof.read_text(encoding='utf-8')),('3_작업일지.md','하달전규정/원본SHA/기존담당완료/잠금없음대조. 새일러스트3종범위로발송준비. 실제송신과착수는각영수증으로구분한다. 담당은발생순서의실제생성/검수기록을추가한다.\n'),('4_정의문서.md','확정: 승인일러스트정체성유지한성인비율0/35/90정지3장. SD는사용자일러스트검수확정뒤후속. 기존반려SD는마스터아님. 측면미관찰구조는추정표시. 검축은미해결기준으로별도검사.\n'),('5_버전관리.md',f'원본 {SRC}, SHA검증후읽기전용. 신규 {out}. 기존작업/원본/카탈로그/게임유지. 로컬신규파일작성이며커밋푸시없음.\n')]: (folder/name).write_text(text,encoding='utf-8')
readings=[proof,pre,S/'작업/MAIN03-20261109-21F94B82/사용자합격-v002.md',W/'output/balor-gc9-retry-20261109-v02/보고.md',W/'output/balor-gc9-retry-20261109-v02/검수결과.md',W/'문서/00_개발규칙/캐릭터스프라이트제작규약.md',S/'진행승인규칙.md',S/'저장운영규정.md',ROOT/'메인작업/main01/design6-v003/재반려원인분석.md']
b.set_readings(t['id'],'main01',[str(p) for p in readings]);b.confirm(t['id'],'main01','진행',proof);plan=b.prepare(t['id'],'main01')
(HERE/'연결.json').write_text(json.dumps({'task':t['id'],'iteration':1,'folder':str(folder),'output':str(out),'plan':plan},ensure_ascii=False,indent=2),encoding='utf-8')
exe='C:/Users/user/AppData/Local/Programs/orca/resources/bin/orca.exe'
notice=f'사용자main01에서일러스트0/35/90선행제작을진행승인. 신규 {t["id"]} main01소유/splash분류로기존완료담당ctx_81f7538ea0a4에이어보냅니다. 현splash잠금없음,신규output만편집/기존카탈로그·main03작업미수정. main03중복발송없도록상태공유. 완료보고가main03로오면main01 run:run_47ce1a81d7b1로전달바랍니다. SD는일러스트검수확정전대기.'
n=subprocess.run([exe,'orchestration','send','--to','run:run_b29b47372e51','--type','status','--subject','파일담당 공유: 발로르 일러스트3방향 신규작업main01','--body',notice,'--json'],capture_output=True,text=True,encoding='utf-8');(HERE/'main03-운영영수증.json').write_text(n.stdout,encoding='utf-8')
r=subprocess.run([exe,'orchestration','send','--to','dispatch:ctx_81f7538ea0a4','--type','dispatch','--subject','진행 승인: 발로르 성인 일러스트0/35/90 우선·SD 후속대기','--body',Path(plan['prompt']).read_text(encoding='utf-8'),'--json'],capture_output=True,text=True,encoding='utf-8');receipt.write_text(r.stdout,encoding='utf-8');print(r.stdout,flush=True)
if r.returncode or not json.loads(r.stdout).get('ok'):raise SystemExit('Inspect actual receipt; no blind retry')
b.record(t['id'],'main01','sent',receipt)
print(json.dumps({'task':t['id'],'sent':True,'splashStartNotYetVerified':True,'SDStarted':False},ensure_ascii=False),flush=True)

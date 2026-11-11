from pathlib import Path
import json,subprocess,importlib.util

ROOT=Path(__file__).resolve().parents[3];S=ROOT/'작업관리';HERE=Path(__file__).resolve().parent;receipt=HERE/'실제발송영수증.json'
if receipt.exists() or (HERE/'연결.json').exists():raise SystemExit('Existing attempt; inspect actual receipt')
spec=importlib.util.spec_from_file_location('board',S/'도구/작업대장.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);b=m.Board(S)
assert 'characters' not in b.leases(),'Character workspace occupied'
W=Path('C:/Users/user/orca/workspaces/Grid Defenders/캐릭터디자인2')
ILL=Path('C:/Users/user/orca/workspaces/Grid Defenders/스플래시-아트/output/balor-illustration-three-views-main01-20261110-f6a9f332-v001')
STYLE=W/'output/characters/gc9_longsword_dagger/idle6_style1_style4_main01-20261109-e1fd458c_v003/variant-1-front.png'
proof=HERE/'사용자확인.md';proof.write_text('''# 불합격 일러스트의 잠정 사용 및 SD 제작 직접 승인
사용자 실제 원문: “일러스트 불합격인데 일단 이걸로 진행한다 SD빨리뽑아야 리깅작업 할수있으니 일단 진행”.
최신 지시로 일러스트 미달을 먼저 완전히 고쳐야 SD 착수한다는 이전 선행조건을 이번 범위에서 해제한다. 일러스트 불합격 판정은 유지하면서 원본 방향/장비 자료로 잠정 사용한다. 직전 합의한 발로르 SD 정면0/오른쪽앞35/오른쪽정측면90 총3장을 제작한다. 얼굴과 몸 균형은 선택1번 표본을 기준으로 하며 지난 SD의 얼굴과대/마른몸/검꺾임을 반복하지 않는다. 이번은 SD 신속 제작·제출 단계이며 신규 SD의 사용자 합격이나 공통규정채택/리깅/게임적용/커밋푸시 완료를 뜻하지 않는다.
''',encoding='utf-8')
pre=HERE/'사전확인.md';pre.write_text('''# 하달 전 사전확인
main01방법/캐릭터분야규정·방법과직전승인/반려원인분석·일러스트실패보고를대조했다. characters잠금없음,기존ctx_dfc91c4d19ba succeeded/settled/retained 확인. 새사용자승인으로일러스트합격대기조건을해제하되공식판정/실패기록은변경하지않는다. 새SD3장작업을characters에등록하고이전반려SD를비율마스터로쓰지않는다. 선택1번의통합된머리·얼굴·몸비율과일러스트3방향의개별디자인을역할분리한다. 과도한슬림/큰머리반복지시·어깨폭=머리폭강제등원인분석의오류를금지. 신규output/이번기록만편집,실제송신영수증후새ACK/start. 오래된공통SD비율보다최신선택1번우선. 리깅/게임/카탈로그/화면/Git제외.
''',encoding='utf-8')
t=b.new('main01','characters','잠정 일러스트 기반 발로르 SD0/35/90 신속제작',proof.read_text(encoding='utf-8'));folder=b.folder(t['id']);out=W/'output/characters/gc9_balor'/('sd_provisional_three_'+t['id'].lower()+'_v001')
prompt=f'''# {t['id']} / 차수1 / main01→캐릭터팀장
실제 사용자 최신 승인 {proof}. **일러스트불합격유지+잠정자료로사용해SD0/35/90 3장바로제작**. 일러스트보완/재합격을기다리지않는다. 이전선행대기조항보다최신직접지시우선. 동일승인재질문없음. 이번은이미지3장신속제작·필수검수·제출이며리깅/게임통합을확대착수하지않는다.

## 참조역할
STYLE/PROPORTION 유일표본: {STYLE}. 실제이미지를열어전체키에대한두상·얼굴·목·어깨/흉곽/골반·팔/다리·손발의**결합비율**과1번의선/색면/명암을읽고재현한다. 표본보다얼굴을키우거나몸만마르게하지않는다. 'LARGE HEAD','SLIM body'반복이나어깨폭=머리폭같은임의숫자/관계를추가하지않는다. 금발얼굴/헤어/의상/이중검은복제하지않고개별발로르정체성을유지한다.
IDENTITY/DIRECTION: {ILL/'front-000.png'}, {ILL/'right-035.png'}, {ILL/'right-090.png'}. 일러스트머리/몸의성인비율은SD에직접복사하지않고얼굴형태/갈색헤어/청회눈·갑주·문양/방패/검·각도별구조를참조한다. 잠정미합격자료이며검축꺾임·여백·알파등결함의복제승인이아니다. 원디자인보조: C:/Users/user/orca/workspaces/Grid Defenders/스플래시-아트/output/balor-gc9-retry-20261109-v02/front.png. 어떤참조가무엇을통제하는지생성기록에구분한다.
이전SD불합격은마스터로쓰지않음. 원인/사용자판정필독 {ROOT/'메인작업/main01/design6-v003/재반려원인분석.md'}. 얼굴형·볼/턱/눈배치와몸의연령감이매치되게하고너무부은얼굴/좁은앙상한흉곽과팔다리·과도한가로갑주덩어리모두피한다. 목표는표본같은자연스러운균형이지'더가늘게'가아니다.

## 제작범위/유지
발로르정면0·화면오른쪽앞35·화면오른쪽완전측면90,동일기본입상대기·양발지지·검방패자연내림. 우선정면을선택1번과같은표시높이로**실제로**나란히내부검수한뒤다른2방향전개. 사용자정면재승인질문으로멈추지않는다. 35라벨을45로대체/머리만회전/단순반전금지. 카메라/비율/인물고정,가림은자연스럽게허용.
갈색머리/청회눈/기사얼굴·청은갑주/층견갑/가슴측면전신사자/원형핀2개끈없음/청용망토흰안감/양다리청은갑주·오른검/왼카이트방패유지. 검의파란감긴그립·은폼멜·은날개가드·붉은마름모보석·은양날칼/방패검은날개십자보존. 손잡이중심축과칼날중심축이자연스럽게연결되는곧은검으로검수한다. 날개가드장식곡선과칼날의꺾임을구분하고단순색보존/연결여부로직선성통과라하지않는다.

## 공정/결과
이번차수read-pack본문→자기방법/공통분야/추가필독적용요약과현재해시새ACK→characters start통과후내장imagegen/자기imagegen·generate2dsprite스킬로참조첨부제작. 최신사용자정지3장/원본보존이지침의기본동작프레임/픽셀시트/자동키잉보다우선. 임의유료API/모델전환없음. 같은부분을무작정대량반복하지말고실제3장과비교를우선제출. 필수체형/얼굴/검결함은숨기지않는다.
허용신규 {out}와이작업기록만. front-000.png/right-035.png/right-090.png 생성원본바이트보존,comparison.png/index.html(세방향+선택1번동일키대조),얼굴/전체체형/검축·장비확대검수,밝고어두운전체/57·72표시,manifest(치수/알파/SHA/몸키/발점·추정오차),생성프롬프트/참조역할/후보/제작기준/검수/report.md와실질5종기록. 새3장원본을직접열어확인하고미검증/기술미달/사용자평가대기를분리해보고.
원본/4번예비/지난반려SD/일러스트/타팀/공통규정/카탈로그/게임/사용자창·탭/커밋푸시수정금지. 실제3장완료시worker_done으로main01에보고/비교/PNG절대경로·검수근거를회신. SD후리깅은이결과를사용자에게보여준후연결할후속단계로기록하고이번SD제작자체를리깅완료로보고하지않는다.
'''
for name,text in [('요청확인.md',proof.read_text(encoding='utf-8')),('전문프롬프트.md',prompt),('2_사전확인.md',pre.read_text(encoding='utf-8')),('1_대화기록.md',proof.read_text(encoding='utf-8')),('3_작업일지.md','하달전역할/필독/원본/직전미달및최신진행원문대조. 새SD3장범위등록. 실제생성/검수는착수후담당이추가기록.\n'),('4_정의문서.md','일러스트불합격유지+잠정사용은사용자직접예외승인. 발로르SD0/35/90 새3장,선택1번결합비율. 리깅은후속,이번하달SD까지만.\n'),('5_버전관리.md',f'신규 {out}만편집. 기존모델/예비/원본/반려결과유지. 로컬작성이며이번저장요청없음,커밋푸시금지.\n')]: (folder/name).write_text(text,encoding='utf-8')
readings=[proof,pre,ILL/'보고.md',ILL/'검수.md',ROOT/'메인작업/main01/design6-v003/재반려원인분석.md',S/'진행승인규칙.md',S/'저장운영규정.md',W/'문서/02_세부기획/02_영웅/한손무기그립기준.md']
b.set_readings(t['id'],'main01',[str(p) for p in readings]);b.confirm(t['id'],'main01','일러스트 불합격인데 일단 이걸로 진행한다 SD빨리뽑아야 리깅작업 할수있으니 일단 진행',proof);plan=b.prepare(t['id'],'main01')
(HERE/'연결.json').write_text(json.dumps({'task':t['id'],'iteration':1,'folder':str(folder),'output':str(out),'plan':plan},ensure_ascii=False,indent=2),encoding='utf-8')
r=subprocess.run(['C:/Users/user/AppData/Local/Programs/orca/resources/bin/orca.exe','orchestration','send','--to','dispatch:ctx_dfc91c4d19ba','--type','dispatch','--subject','최신 진행 승인: 미합격 일러스트 잠정사용·발로르SD0/35/90 신속제작','--body',Path(plan['prompt']).read_text(encoding='utf-8'),'--json'],capture_output=True,text=True,encoding='utf-8');receipt.write_text(r.stdout,encoding='utf-8');print(r.stdout,flush=True)
if r.returncode or not json.loads(r.stdout).get('ok'):raise SystemExit('Inspect receipt, no blind retry')
b.record(t['id'],'main01','sent',receipt)
print(json.dumps({'task':t['id'],'sent':True,'illustrationAcceptance':False,'workerStartNotYetVerified':True},ensure_ascii=False),flush=True)

from pathlib import Path
import json,importlib.util,subprocess,hashlib,datetime

ROOT=Path(__file__).resolve().parents[3];S=ROOT/'작업관리';HERE=Path(__file__).resolve().parent
receipt=HERE/'실제발송영수증.json'
if receipt.exists() or (HERE/'연결.json').exists():raise SystemExit('Existing dispatch attempt; inspect receipt, no blind retry')
saveplan=json.loads((ROOT/'메인작업/main01/save-20261110/plan.json').read_text(encoding='utf-8'))
savereceipt=Path('C:/Users/user/orca/backups/Grid Defenders')/saveplan['id']/'receipt.json'
saved=json.loads(savereceipt.read_text(encoding='utf-8'))
assert saved['remoteVerified'] and len(saved['roles'])==17 and all(x['remoteVerified'] for x in saved['roles'].values()),'Save first; no production dispatch before verified push'
spec=importlib.util.spec_from_file_location('board',S/'도구/작업대장.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);b=m.Board(S)
t=b.load('MAIN01-20261110-D820F076','main01')
assert t['iteration']==2 and t['status']=='awaiting_user','Review task state before revising'
assert 'characters' not in b.leases(),'Another task owns characters'
W=Path('C:/Users/user/orca/workspaces/Grid Defenders/캐릭터디자인2')
style=W/'output/characters/gc9_longsword_dagger/idle6_style1_style4_main01-20261109-e1fd458c_v003/variant-1-front.png'
combat=W/'output/characters/gc9_longsword_dagger/game_reference10_main01-20261109-e1fd458c_v002/01_arknights/character.png'
identity=Path('C:/Users/user/orca/workspaces/Grid Defenders/스플래시-아트/output/balor-gc9-retry-20261109-v02/front.png')
rejected=W/'output/characters/gc9_balor/style1_front_main01-20261110-d820f076_v002'
proof=HERE/'사용자확인.md'
proof.write_text('''# 차수3 새 범위와 저장 후 진행 승인
사용자: “1번 0도 35도 90도 발로르 0도 35도 90도 3장씩 뽑아오는데 일단 지금 뽑아온 발로르는 불합격 아직도 양옆이 더 두꺼워보인다”.
메인 이해확인: 1번은 선택한 금발전사 모델. 둘 다 동일 기본대기 자세로 정면0/화면오른쪽앞35/오른쪽정측면90 총6장. 발로르 반려본을 그대로 회전시키지 않고 어깨·몸통·상완 및 장비를 포함한 좌우두께를 더 줄이되 고유장비 디테일 유지. 진행 승인 후 절차확인 및 제작하달.
사용자 실제 승인/선행조건: “진행하기전에 저장하고 진행”.
선행 저장은 메인작업/main01/save-20261110/plan.json의17개ref 원격검증 receipt로 확인한 후 발송한다. 반려본/원본/4번예비는 보존한다. 파츠·리깅·애니메이션·게임교체는 여전히 보류. 이번 방향별 정지비교6장은 사용자가 명시한 예외다. 미래인게임 우측3/4규칙으로 이번0/90 명시요청을 취소하지 않는다.
''',encoding='utf-8')
pre=HERE/'사전확인.md';pre.write_text('''# 차수3 하달 전 사전확인
저장규정과 실제Git17공간/진행현황,직전공통/분야규정 및main01작업방법,직전차수2결과와반려원문을확인. 저장은작업기록먼저작성후빌드PASS801/운영12PASS와별도보관16ref+main을실제원격검증한상태에한해하달. 현재characters잠금없음및기존담당완료상태를발송전확인한다. 차수2는불합격으로기록하고이전ACK/승인을재사용하지않는다. 새범위는2캐릭터각0/35/90총6정지이미지. 기존기본대기/장비정체성과1번그림체유지,발로르가로두께재설계가핵심. 게임/공통기준/카탈로그/리깅/애니메이션/화면/Git추가저장제외.
''',encoding='utf-8')
b.record(t['id'],'main01','revise',proof,'1번 0도 35도 90도 발로르 0도 35도 90도 3장씩 뽑아오는데 일단 지금 뽑아온 발로르는 불합격 아직도 양옆이 더 두꺼워보인다')
with b.writer():
 current=b.load(t['id'],'main01');current['title']='1번·발로르 각0/35/90 총6장·발로르 좌우두께 수정';current['request']=proof.read_text(encoding='utf-8');b.save(current)
t=b.load(t['id'],'main01');folder=b.folder(t['id']);out=W/'output/characters'/('style1_blond_balor_three_views_'+t['id'].lower()+'_v003')
feedback=HERE/'두께반려기준.md';feedback.write_text('''# 차수2 재반려와 이번 검수
실제 사용자: 아직도 양옆이 더 두꺼워보여 불합격. 외곽폭 감소 수치나 방패 겹침만으로 통과 판정하지 않는다. 좁은 어깨/흉곽/상완/견갑 층의 가로 부피와 망토 확장을 함께 확인. 금발1번과 같은 표시높이에서 전체 덩어리·상체폭/머리폭·팔다리비중을 비교해 발로르가 두껍고 뭉툭하게 읽히지 않게 한다. 다부진 기사 고유인상은 유지하고 길쭉한 원화인체로 도망가지 않는다. 방패자체를 비정상 축소/검을 짧게/얼굴을 줄여 폭을 속이지 않는다. 장비는 원본 구조를 유지하고몸에가까운자연배치. 새0도마스터부터비율을다시확인후35/90전개. 35를45로대체하거나머리만회전하지않는다. 90의몸앞뒤두께·견갑돌출도 따로 확인한다.
''',encoding='utf-8')
prompt=f'''# {t['id']} 차수3 / main01 → characters
이번 실제 승인 {proof}. 저장후진행 선행조건은 {savereceipt}에17ref원격검증완료. 기존 차수2 불합격. 새범위는 **선택1번 금발전사와 발로르 각각 정면0°/화면오른쪽앞35°/오른쪽정측면90° 총6개 개별PNG**이다. 45가아닌35. 양발지지·무기를자연스럽게내려든같은기본대기자세/카메라높이로 비교한다. 전투애니메이션/파츠/리깅/게임통합은제작하지않는다. 같은허락재질문없이승인된6장제작·내부수정·검수납품까지실행.

## 원본역할/보존
금발1번의그림체·비율·얼굴·장비/정면주마스터 {style}; 원장비/화풍대조 {combat}. 이전원본모델/4번예비보존은 {ROOT/'메인작업/main01/balor-style1/보존목록.json'}. 실제원본/보존사본해시를검증하고 이동/덮어쓰기금지.
발로르정체성승인원본 {identity}. 사용자합격은원화디자인범위이며현재SD합격아님. 발로르차수1/2반려본 {rejected}는잘못된폭설명용만사용,승인된비율마스터로강제하지않는다. 발로르도1번과공통그림체/SD읽힘을유지하되개별갈색머리/얼굴/기사외형유지. 금발의이중검/얼굴/청스카프/비대칭부츠를복제하지않는다.
필독 {feedback}. 발로르어깨·흉곽·상완·견갑·망토및장비배치의가로두께를차수2보다더정돈한다. 정면뿐아니라35/90의앞뒤부피도검수. 전체이미지가로압축/세로늘림금지. 방패겹침만바꿔수치만감소했다고성공판정금지. 금발1번과같은본체표시높이로미리나란히확인한다. 새정면2개를먼저만들고내부비율/인상/폭을검수한뒤각각그마스터에서35/90으로전개한다. 0도기존파일을복사해새생성장수로속이지않는다. 기존선택마스터와동일유지되는원본재사용이합리적이면그사실과출처를명시하고생성완료로위장하지말것.

## 디테일정체성
금발: 갈색눈/금발/청색목도리·짧은후드/은갑주/갈색벨트주머니·바지/청허리천/오른견갑과오른판금다리·왼청장화/오른장검·왼단검. 그립/폼멜/가드/검신장식은최초원본과대조하며이미변형된디테일을화풍승인으로정당화하지않는다. 차이가있으면대조목록으로밝히고보존된원본을확인.
발로르: 짧은갈색머리·청회눈·청은갑주/층진견갑·가슴측면전신사자/원형핀2개끈없음·청용망토흰안감·오른검/왼큰카이트방패. 파란감긴그립/은폼멜/은날개형가드/중앙붉은마름모보석/은양날검,검은날개십자방패/사자문양유지. 손소유/장비비대칭은인체좌우기준. 보이지않는손이나문양을완전검증했다고하지않는다.
35도는얼굴일부·흉갑앞면이보이면서우측진행성분명,90도는얼굴한눈/코옆·몸통/골반/발전체정측면. 머리만회전/단순반전/45도라벨변경금지. 자연가림허용,보이게하려추가무기/손생성금지.

## 제작절차/납품/검수
이번차수3 read-pack필독본문→각문서의이번적용요약·해시새ACK→characters start통과후내장imagegen참조첨부로제작. 이전ACK재사용금지. 자기imagegen/generate2dsprite스킬·사용자우선지시준수. 임의유료API/외부모델전환없음. 필요한하위담당도방법/필독/입출력/작업번호를전달하고읽기확인취합.
새출력 {out}만아트편집. blond-front.png/blond-right-035.png/blond-right-090.png 및 balor-front.png/balor-right-035.png/balor-right-090.png, index.html/comparison.png(행:금발1/발로르,열0/35/90),발로르반려전후폭비교/장비확대/57·72CSSpx/밝고어두운전체비교. 모두같은본체표시높이·발선에등비표시,PNG생성원본바이트보존. 원본해상도·알파·SHA·본체키/발점·측정ROI/오차·개별호출/입력역할/후보를manifest와generation-records에기록. 수치목표를사용자확정기준으로만들지않음.
실제6장/전체/작은표시/디테일을열어2명공통작화/비율과차별정체성·방향·손그립·칼길이·방패/사자/핀·잘림/알파·폭·세로비중을검수한다. 내부미달은후보보존후보완. 사용자미적합격을대신하지않는다. report.md/제작기준/검수/차수3실질5종기록(안내템플릿아님)/검증근거를제출하고worker_done으로main01에절대경로회신. 수정결과물과재발방지기준을함께정리하되공통규정전체임의변경금지.
기존차수1/2/원본/예비/다른팀/카탈로그/게임/사용자화면을변경하지않는다. 새생성은이번저장완료이후산출물이므로다음저장요청까지커밋푸시하지않는다. 파츠·리깅·애니메이션은디자인합격/공통기준정리뒤사용자추가진행전보류.
'''
for name,body in [('요청확인.md',proof.read_text(encoding='utf-8')),('전문프롬프트.md',prompt),('2_사전확인.md',pre.read_text(encoding='utf-8'))]:(folder/name).write_text(body,encoding='utf-8')
readings=[proof,pre,feedback,ROOT/'메인작업/main01/balor-style1/디테일피드백.md',ROOT/'메인작업/main01/balor-style1/보존목록.json',ROOT/'메인작업/main01/balor-style1/v002/후속작업보류.md',rejected/'report.md',rejected/'검수.md',S/'진행승인규칙.md',S/'저장운영규정.md',S/'작업/MAIN03-20261109-21F94B82/사용자합격-v002.md',W/'문서/02_세부기획/02_영웅/한손무기그립기준.md']
b.set_readings(t['id'],'main01',[str(p) for p in readings]);b.confirm(t['id'],'main01','진행하기전에 저장하고 진행',proof);plan=b.prepare(t['id'],'main01')
(HERE/'연결.json').write_text(json.dumps({'task':t['id'],'iteration':3,'output':str(out),'folder':str(folder),'saveReceipt':str(savereceipt),'plan':plan},ensure_ascii=False,indent=2),encoding='utf-8')
r=subprocess.run(['C:/Users/user/AppData/Local/Programs/orca/resources/bin/orca.exe','orchestration','send','--to','dispatch:ctx_942c49a3b000','--type','dispatch','--subject','원격저장 검증 후 진행: 1번·발로르 각0/35/90 총6장·발로르 두께 재반려 차수3','--body',Path(plan['prompt']).read_text(encoding='utf-8'),'--json'],capture_output=True,text=True,encoding='utf-8')
receipt.write_text(r.stdout,encoding='utf-8');print(r.stdout,flush=True)
if r.returncode or not json.loads(r.stdout).get('ok'):raise SystemExit('Inspect receipt; no blind resend')
b.record(t['id'],'main01','sent',receipt)

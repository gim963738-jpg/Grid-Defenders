from pathlib import Path
import json,subprocess,importlib.util
ROOT=Path('C:/Users/user/Desktop/Grid Defenders');S=ROOT/'작업관리';HERE=Path(__file__).resolve().parent
receipt=HERE/'실제발송영수증.json'
if receipt.exists():raise SystemExit('Already attempted; inspect receipt before any retry.')
oldlink=json.loads((ROOT/'메인작업/main01/style20/연결.json').read_text(encoding='utf-8'));oldout=Path(oldlink['output'])
spec=importlib.util.spec_from_file_location('board',S/'도구/작업대장.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);b=m.Board(S)
task=b.load(oldlink['task'],'main01')
if task['iteration']!=1 or task['status']!='in_progress':raise SystemExit('Unexpected original task state; preserve it and inspect.')
proof=HERE/'사용자진행확인.md';proof.parent.mkdir(parents=True,exist_ok=True)
proof.write_text('''# 새 범위 및 실제 진행 승인

사용자 의도 정정: “서브컬쳐 게임중 인게임 캐릭터 구현을 2D로 한거 있을꺼야 케릭터 비율이 달라져도 상관없으니 분석후 참고해서 우리 케릭터 자세랑 구성요소 담아서 보여달라는거였어 이해됬어?”
추가 고정: “자세는 똑같이 전투태세 그래야 비교가 되니까 이때 비율은 달라져도 상관없고”.
범위 정리에서 사용자: “10가지”.
메인 설명: 실제 게임을 참고한10가지표현,같은전투태세/시점/무기/주요특징고정,신체비율변경허용. 진행전대기.
사용자 최종 실행 승인: “진행”.

결과는 실제서브컬처게임 인게임2D표현을분석·참고한 우리캐릭터10안이다. 두모델각10개20장/기존미술매체20종40장이아니다. 이전결과/13건반환미확인기록은보존한다. 게임적용·새공통화풍채택·GitHub저장요청은아니다.
''',encoding='utf-8')
b.record(task['id'],'main01','returned',oldout/'report.md')
b.record(task['id'],'main01','revise',proof,'진행')
task=b.load(task['id'],'main01');folder=b.folder(task['id'])
with b.writer():
 t=b.load(task['id'],'main01');t['previousTitle']=t['title'];t['title']='실제 서브컬처게임 인게임2D 참고·동일 전투태세10안';t['request']=proof.read_text(encoding='utf-8');b.save(t)
base=oldout.parent;out=base/('game_reference10_'+task['id'].lower()+'_v002')
starter=[
 {'title':'Arknights','url':'https://www.arknights.global/'},
 {'title':'Guardian Tales','url':'https://guardiantales.com/'},
 {'title':'BrownDust2','url':'https://www.browndust2.com/en-us/'},
 {'title':'Princess Connect Re:Dive','url':'https://priconne-redive.jp/'},
 {'title':'Azur Lane','url':'https://play.google.com/store/apps/details?id=com.YoStarEN.AzurLane'},
 {'title':'Reverse 1999','url':'https://re.bluepoch.com/'}
]
(HERE/'조사출발점.json').write_text(json.dumps({'note':'Main verified these source pages exist; this is not yet proof that every candidate battle sprite is 2D. Worker must inspect actual combat screenshots and sources.','sources':starter},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
pre=HERE/'사전확인.md';pre.write_text('승인후새범위하달전작성. 명시적진행규칙/최근요청/기존부분보고/Orca worker-show를확인했다. 기존담당은턴을끝내추가호출대기로회신했지만worker_done이없어Dispatch는열려있다. 같은담당/같은Task의후속지시로조정하고복제/강제중단하지않는다. 이전생성13건의백엔드종료는미확인이므로삭제/종료를추정하지않고기존폴더/기록을보존한다. 새작업은완전히다른폴더에만쓴다. 공유작업대장에는부분반환·범위수정·실제새진행원문을순서대로기록한다. 이번개수는총10안,전투태세동일/비율변경허용/실제게임참고와출처필수/소스40장재활용완성처리금지. 게임/UI/공통기준/화면/커밋푸시제외.\n',encoding='utf-8')
prompt=f'''# 사용자 승인된 새 범위: 실제 게임 인게임2D 참고10안 — {task['id']} / 차수2

main01→동일캐릭터팀장. 기존Task제목은20표현40장이었지만사용자가의도를정정하고10가지를선택한뒤명시적으로“진행”했다. 승인원문/순서 {proof}. 이번결과는**총10안**이다. 기존미술매체40장작업은부분결과로보존하며이어채우지않는다. 새범위로착수한다. 같은확인을사용자에게반복하지않는다.

## 필독/실행상태/격리
자기방법/AGENTS/공통분야/진행승인규칙/저장규칙/새원문/기존부분보고를read-pack본문으로읽고차수2/characters의새ACK→start후작업한다. 기존ACK재사용금지. 메인은송신직후영수증을연결한다. 동일기존담당을재사용하며별도동일공간편집자를복제하지않는다.
이전13건반환미확인은백엔드종료로단정하지말고기록과기존출력 {oldout}를보존한다. 이작업은새 {out}에만쓴다. 늦게오는기존결과를새10안에재활용/혼합하거나삭제하지않는다. 현재열린원래OrcaTask의명시적후속지시로작업범위를전환한다. 필요하다면상위메인에실제실행/충돌상태를보고한다.
새하위담당이필요하면같은승인범위안에서각자다른허용폴더/입출력·필독·작업방법·보고를명시해분담가능하다. Sol medium기본. 내장imagegen스킬사용,유료외주/API임의전환없음. 커밋·푸시·예약백업/사용자창·패널·탭조작금지.

## 사용자가 실제로 원하는 것
실제서브컬처게임의**플레이중2D캐릭터/전투스프라이트**를조사·분석하고,그표현원리를우리금발쌍검캐릭터에적용한다. 미술재료(수채/판화등)20종실험이아니다. 게임이름텍스트만넣고비슷한자체그림을만드는것도실패다.
공통포즈/정체성입력A: {base/'combat_ready_right045_illustration_proportions_v02/sd-pose-original.png'}
긴체형의같은자세입력B: {base/'combat_ready_right045_illustration_proportions_v02/combat-ready-illustration-proportions.png'}
사용자화면참조: C:/Users/user/AppData/Roaming/orca/agent-session-attachments/42e3ad22-9f06-4bd6-bb3c-858da9c8bdfe/orca-paste-1794227704133-70e07650-57d4-4dcc-8b34-aacf742f6ee5.png
입력들을실제열람한다. **같은오른쪽앞사선전투태세/시점/팔·다리동작/발벌림/무기방향**을고정해비교가능하게한다. 장검오른손/단검왼손·금발·청목도리/짧은후드·은갑옷·갈색벨트/바지·장화비대칭등주요특징유지. 참고게임캐릭터의복장/성별/얼굴/무기/브랜드문양을복사하지않는다.
머리크기/등신/몸통·팔다리비율은참고게임표현에맞게**변경허용**. A/B비율을각각고정해20장으로늘리지않는다. 현재일반SD신규2안공통기준보다이실험의최신사용자예외를우선한다. 장검/단검과포즈를다르게만들어차이를위장하지않는다.

## 조사와선정: 생성전에실물증거
웹조사도구로최소10개후보게임의**실제전투화면**을확인한다. 공식게임사이트/공식스토어스크린샷/제작사·퍼블리셔공식플레이영상이우선이며자료부족시신뢰가능한실제플레이출처를명시한다. 홍보일러스트/캐릭터카드/로비Live2D만으로인게임전투표현을판정하지않는다. 게임캐릭터가2D인지공식설명/실제전투자료로확인하고관찰과기술추정을구분한다. 3D셀룩캐릭터를2D사례로넣지않으며배경이2.5D여도캐릭터의실제2D표현증거가있으면그범위를명시한다. 엔진/Spine/프레임방식을화면만보고사실로단정하지않는다.
조사출발점 {HERE/'조사출발점.json'}는사이트존재확인용이며이미2D전투판정이끝난목록이아니다.
후보예시:명일방주원작,벽람항로기존전투,프린세스커넥트Re:Dive,그랑블루판타지원작(리링크와혼동금지),에픽세븐,리버스1999,가디언테일즈,어나더에덴,카운터사이드,던전앤파이터,오딘스피어등. 모두최종확정이아니다. 실제자료확보와표현차이에따라10개를선정·대체해도되며서비스존속여부를추정하지말고과거자료이면시점을적는다. 비슷한SD게임들만10개채우지말고극단SD/중간등신/긴신체·도트/선명한애니선/회화재질/면중심 등실제구현의다양성이보이도록고른다. 원래실제게임에없는과장미술효과를발명해다르다고주장하지않는다.
각게임별 references/폴더에실제전투이미지또는영상의근거프레임을확보하고직접view_image로확인한다. 출처URL/자료시점/영상타임스탬프/화면종류/확인사항·미확인사항을sources.json과분석.md에기록한다. 이미지검색썸네일/텍스트설명만으로확인했다고주장하지않는다.

## 게임당적용분석
각안마다①실제참고게임/전투근거②머리·몸비율과실루엣③선굵기/색④명암·색면/재질⑤작은표시에서생략/강조하는디테일⑥우리캐릭터에옮길구체적원리를정리해생성프롬프트에반영한다.
우리입력은POSE/IDENTITY,게임전투이미지는RENDERING/PROPORTIONS참조로역할분리해도구에실제로첨부한다. 같은마스터화풍이모든결과에수렴하지않게게임별분석을구체화한다. 각게임참고1장씩10개를내장imagegen개별호출로생성한다. 투명배경/완전한몸·무기·발/필요한여백을요청하고원본바이트·실제크기·알파보존. 단순색변환/기존미술스타일변형으로게임참고시안이라고대체하지않는다.
먼저서로가장다른2~3개를내부검수한뒤나머지를진행하되사용자추가승인대기를만들지않는다. 라벨을가려도차이를읽을수있도록검수하고비슷한쌍은실제게임특징을더정확히반영해보완한다. 파일해시차이/자동유사도점수만으로차별화합격주장금지.

## 출력/검수
새폴더에10개개별최종PNG와후보/정확한입력·생성프롬프트/실제결과/출처해시를보존한다. index.html은참고게임실제전투모습→분석요점→우리적용안을같이보는10카드,개별확대/밝고어두운배경/원형비교를지원한다. 전체10안비교PNG와5안씩상세2장을제공한다. 모든안은같은전체표시키/발선·중립배경에서비교하고57/72정도의작은전장표시도같이보인다. 게임별원래표시크기와우리비교높이는구분한다. 개별PNG의비율/픽셀을늘리거나재저장해맞추지않는다.
정확한포즈/시점/양손소유·장검과단검·주요구성요소유지,원하는비율변경과허용하지않은포즈변경을구분해검수한다. 각안의실제게임특징반영/가장유사한다른안과차이/관찰근거·잔여한계를기록한다. 밝고어두운전체프레임과작은표시를실제열람하고화면자료출처링크를검증한다.
분석.md,제작기준.md,검수.md,sources.json,asset-manifest.json,report.md,결과.json과차수2의5종기록을제출한다. 기존파일/이전부분결과/현재게임/SD공통기준/카탈로그/타팀/사용자화면을변경하지않는다. 자동게임적용·공통화풍채택·GitHub업로드없음. 조사·선정완료시선정게임과실제자료확인상태를간단히회신하고,제작중에는완료안수/검수상태를보고한다. 최종worker_done에실제10PNG/연락판/근거/보고절대경로를알린다.
'''
for name,body in [('요청확인.md',proof.read_text(encoding='utf-8')),('전문프롬프트.md',prompt),('2_사전확인.md',pre.read_text(encoding='utf-8'))]:(folder/name).write_text(body,encoding='utf-8')
b.set_readings(task['id'],'main01',[str(proof),str(pre),str(HERE/'조사출발점.json'),str(S/'진행승인규칙.md'),str(S/'저장운영규정.md'),str(oldout/'report.md')]);b.confirm(task['id'],'main01','진행',proof);plan=b.prepare(task['id'],'main01')
(HERE/'연결.json').write_text(json.dumps({'task':task['id'],'iteration':2,'folder':str(folder),'output':str(out),'oldOutputPreserved':str(oldout),'plan':plan},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
exe='C:/Users/user/AppData/Local/Programs/orca/resources/bin/orca.exe'
p=subprocess.run([exe,'orchestration','send','--to','dispatch:ctx_86394ae5b02a','--subject','명시적 진행 승인: 실제 게임 인게임2D 조사·동일전투태세10안 (새범위 차수2)','--type','dispatch','--body',Path(plan['prompt']).read_text(encoding='utf-8'),'--json'],capture_output=True,encoding='utf-8')
try:r=json.loads(p.stdout[p.stdout.index('{'):])
except (ValueError,json.JSONDecodeError):r={'ok':False,'stdout':p.stdout,'stderr':p.stderr}
receipt.write_text(json.dumps(r,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');print(json.dumps(r,ensure_ascii=False,indent=2),flush=True)
if p.returncode or not r.get('ok'):raise SystemExit('Inspect failed receipt; no blind retry.')
b.record(task['id'],'main01','sent',receipt)

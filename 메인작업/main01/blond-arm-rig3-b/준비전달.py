from pathlib import Path
import json,hashlib,subprocess,importlib.util

ROOT=Path(__file__).resolve().parents[3];S=ROOT/'작업관리';HERE=Path(__file__).resolve().parent;notice=HERE/'대기작업전달영수증.json'
if notice.exists() or (HERE/'연결.json').exists():raise SystemExit('Existing B preparation; inspect before retry')
spec=importlib.util.spec_from_file_location('board',S/'도구/작업대장.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);b=m.Board(S)
A=json.loads((ROOT/'메인작업/main01/blond-arm-rig3/연결.json').read_text(encoding='utf-8'))
W=Path('C:/Users/user/orca/workspaces/Grid Defenders/캐릭터디자인2')
SRC=W/'output/characters/style1_blond_balor_three_views_main01-20261110-d820f076_v003/blond-right-035.png'
proof=HERE/'사용자확인.md';proof.write_text('''# B안 명시적 진행 승인
사용자: 같은금발오른팔·손·장검분리/리깅시험3안을한번더만들되파츠이미지를GPT이미지2.6으로만들어비교.
크레딧경로는ChatGPT계정구독혜택이연결된OpenAI API조직. 사용자화면API잔액76달러,구독혜택이미활성화. 사용자: “GPT이미지는 유료기때문에 리깅작업이 아닌 이미지를 뽑는데에만 크레딧을 소모한다”.
기존캐릭터 tools/image-studio/.env.local 키와openai.mjs의gpt-image-2.6-sunburst·high경로발견. GET모델HTTP200확인,이미지호출0. A를유지하고동일원본/부위/공통뼈대/움직임3안으로B를별도제작한다고메인정리.
사용자 실제 승인: “B안 진행”. 이미지생성/복원만해당API사용. 리깅/클립/미리보기는로컬실행,텍스트·영상API/추가결제·자동충전/기존결과덮어쓰기/커밋푸시없음.
''',encoding='utf-8')
pre=HERE/'사전확인.md';pre.write_text(f'''# B안 작업전 사전확인
현재characters역할은 A {A['task']}가점유하며같은담당ctx_3e4dd44a42e7이진행중임을확인했다. 같은브랜치에두편집자를만들지않는다. B는신규작업으로등록·사용자확인후confirmed에대기, A의실제반환/공통rig·클립자료확정뒤main01이prepare/정식송신하여새ACK/start후실행한다. A잠금을시간경과로해제하지않는다. A의이미지/리깅코드를임의변경시키지않고같은골격·3클립을읽기전용재사용한다. API연결검증JSON과실제기존도구/문서확인완료,키비밀값은기록하지않는다. B요청을A하달의묵시적API허가로확장하지않는다. 신규Boutput만편집하고이미지모델요청/사용량·실패·재시도여부를기록. 비용이드는이미지호출전B정식착수필수.
''',encoding='utf-8')
t=b.new('main01','characters','B안 GPT Image2.6 파츠·동일오른팔리깅3안 비교',proof.read_text(encoding='utf-8'));folder=b.folder(t['id']);out=W/'output/characters/gc9_longsword_dagger'/('arm_rig3_B_'+t['id'].lower()+'_v001')
prompt=f'''# {t['id']} 차수1 / main01→characters / B별도비교
사용자 실제 “B안 진행”: {proof}. A원작업 {A['task']} / {A['output']}의실제반환후공통rig/동작3안을고정해사용한다. A가진행중이면편집충돌/착수게이트를우회하지않고대기. main01정식sent→B차수read-pack/새ACK/start후이미지API호출. 이번은A전체재작업/대체아님.

## 비교변수와범위
동일원본 {SRC} (SHA {hashlib.sha256(SRC.read_bytes()).hexdigest()}). 원본우측35도·얼굴몸비율/의상/장비를유지한다. 부위는오른위팔/아래팔/손/장검및필요견갑·정지몸체복원판으로A와같은파츠계약/영역/캔버스·pivot을사용한다. B파츠원본치수/등록이달라지면등비·회전·평행이동등록만별도메타로밝히고,파츠실루엣을강제늘려비교를속이지않음.
**B파츠이미지의생성·국소복원은 GPT Image2.6 Sunburst 이미지API로실제로요청해제작한다.** 원본마스크추출/생성복원의역할을분명히하고A의내장생성PNG를B모델결과로바꿔표시하지않는다. 캐릭터전체재디자인금지,얼굴/고정몸체영역변경최소화,관절가림·연결부복원/무기독립성검수. 동일부위·동일마스터·동일출력목적의프롬프트로모델경로차이를비교하며부위분류/마스킹을함께바꿨으면그차이를별도명시.
분리파츠로A와같은공통bone이름/계층/관절위치·같은A/B/C클립키/시간곡선/타격·복귀구간·전체길이/카메라·표시키·배경·재생속도를연결한다. **움직임은로컬본변환만** 사용하고GPT영상/매프레임이미지/텍스트API호출로리깅하지않는다. A의rig/animationデータSHA와B적용SHA를대조해같은것임을보고. 실제파츠차이때문에다른각도·보정이필요하면무단으로A/B동작을달리하지말고비교한계와보정을명시한다.

## 정확한API경로·비밀보호·비용범위
사용자키저장위치는 {W/'tools/image-studio/.env.local'} . 기존 {W/'tools/image-studio/openai.mjs'}의 requestImage/validateConfig와프리셋sunburst-2.6-high(model=gpt-image-2.6-sunburst,quality=high)를재사용할수있다. README의기존연결규칙을읽는다. 키는프로세스내에서만읽고출력/채팅/프롬프트/메타/CLI인자/소스/커밋에노출하지않음. .env.local/기존도구는읽기전용,전역OPENAI환경/공통미디어기본값을바꾸지않음.
생성/복원은이미지POST /v1/images/edits(참조첨부) 또는요청상필요할때/images/generations만. image2.6이아닌모델/내장생성/다른회사로자동대체금지. 입력이미지실제첨부와요청모델·품질·크기·프롬프트·입력SHA·API요청ID/응답사용량(있으면)을기록. 실제응답모델명이없으면요청모델과응답미보고를구분. API액세스HTTP200은이미검증됐지만이미지성공/잔액은미검증,실제이미지호출때확인.
첫납품에필요한파츠묶음부터최소호출로제작하고내부보완은필요부위에한정. 초기이미지호출6건이내+명확한실패보완2건이내를작업내관리한도로두고추가반복필요시남은문제/호출수를main01에보고. 이숫자를사용자확정예산으로기록하지않음. 요청실패/타임아웃은자동재시도하지않고불명결과/과금가능성·요청ID를보존해보고. 이미지이외리깅/비교코드는로컬만. 크레딧구매/자동충전/결제방법변경금지. 사용량/금액이응답에없으면미상,0원이나구독잔액이직접확인됐다고쓰지않는다.

## 검수·납품
새폴더 {out}만편집. A파츠/연구/rig/HTML/다른작업/원본을덮어쓰지않고공유자료는복사후SHA기록. B의개별PNG·파츠펼침/재조립·원본반투명대조/가림복원확대/관절극점·그립검증/무기길이불변/강체검축/루프접합/고스트·틈·관통/밝음어두움/57·72表示を 실제검수.
index.html은A와B를같은フレーム時刻で비교할수있게하고각각절제형/명확형/강조형3클립을동기재생. 기존같은플레이어UI/재생정지·스크럽·속도/뼈대·파츠토글/원본비교유지. user는이미지분리품질과같은모션에서의결과를선택·지적한다. 모델결과차이가곧모델우열확정이라고하지않고다른전처리/추정영역/생성변동성을표시.
모든원본PNG/API응답메타(비밀제외)/usage·호출기록/parts契約/rig·clipSHA/비교플레이어·정지/실제움직임증거/연결검수·report.md와실질5종기록제출. A의실제모델명이미보고면A를2.5또는다른특정모델이라고추정하지않음. B는요청gpt-image-2.6-sunburst/이미지API경로라고분명히표시.
새read-pack에서자기AGENTS/방법/공통분야/사용자승인/API·과금·검수자료를본문으로읽고B차수ACK/start통과. 사용자지정API경로가스킬내장기본보다우선,사용자지정Cutout본방식이video2dsprite보다우선. 완료시worker_done으로main01에실제B결과/동기비교/보고·검수/이미지호출수·usage/키미노출검증경로회신. 게임통합/다른부위리깅확대/공통규정/화면조작/커밋푸시없음.
'''
for name,text in [('요청확인.md',proof.read_text(encoding='utf-8')),('전문프롬프트.md',prompt),('2_사전확인.md',pre.read_text(encoding='utf-8')),('1_대화기록.md',proof.read_text(encoding='utf-8')),('3_작업일지.md','既存APIモデルHTTP200/キー経路とA進行中確認。Bを別記録しA完了後同rig/clip固定で送信予定。現段階B課金画像呼出0。実際の送信/開始/生成は証拠追加。\n'),('4_정의문서.md','B=GPT Image2.6で部品画像生成・復元→Aと同じローカルリギング/3モーション。Aを保持、画像以外API不使用。A完了依存、現在追加ユーザー承認待ちではなく工程待ち。\n'),('5_버전관리.md',f'B新規 {out}。A/원본/既存.env/ツール/ゲーム保護。ユーザー今回保存要求なし、commit/push禁止。\n')]: (folder/name).write_text(text,encoding='utf-8')
readings=[proof,pre,ROOT/'메인작업/main01/image-credit-connection/기존연결검증.json',W/'tools/image-studio/README.md',S/'저장운영규정.md',S/'진행승인규칙.md',ROOT/'메인작업/main01/blond-arm-rig3/사용자확인.md']
b.set_readings(t['id'],'main01',[str(x) for x in readings]);b.confirm(t['id'],'main01','B안 진행',proof)
(HERE/'연결.json').write_text(json.dumps({'task':t['id'],'iteration':1,'folder':str(folder),'output':str(out),'dependsOn':A['task'],'state':'confirmed_waiting_for_A_return','prompt':str(folder/'전문프롬프트.md')},ensure_ascii=False,indent=2),encoding='utf-8')
body=f'''사용자실제 “B안 진행”으로GPT이미지2.6별도비교작업 {t['id']}를등록/확인했습니다. B指示 {folder/'전문프롬프트.md'}、승인 {proof}. 기존A {A['task']}는그대로마무리하고A리깅/3클립을확정한뒤실제반환보고하세요. B는같은원본/부위/rig/clip을쓰고파트이미지만기존 .env.local키의 gpt-image-2.6-sunburst high 이미지API로제작합니다. .env/키출력/전역설정변경없음. B는현재confirmed·A반환의존대기이며A잠금/ACK로B를시작하거나A에과금이미지호출을섞지마세요. main01이A반환기록후B를prepare/정식send하고B새ACK/start후실행합니다. 같은편집자를복제하지않고순차수행합니다. A결과에B준비/대기를구분해회신하며현재A작품/화면/Git은보존.''' 
r=subprocess.run(['C:/Users/user/AppData/Local/Programs/orca/resources/bin/orca.exe','orchestration','send','--to','dispatch:ctx_3e4dd44a42e7','--type','status','--subject','사용자 B안 진행 승인·별도등록, A리깅확정후 동일조건 순차실행','--body',body,'--json'],capture_output=True,text=True,encoding='utf-8');notice.write_text(r.stdout,encoding='utf-8');print(r.stdout);print(json.dumps({'Btask':t['id'],'state':'confirmed_waiting_for_A_return','BImageCalls':0},ensure_ascii=False))

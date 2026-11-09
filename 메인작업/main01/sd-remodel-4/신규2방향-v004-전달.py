from pathlib import Path
import importlib.util,json,hashlib,subprocess
ROOT=Path('C:/Users/user/Desktop/Grid Defenders');S=ROOT/'작업관리';HERE=Path(__file__).resolve().parent
receipt=HERE/'신규2방향-v004-실제발송영수증.json'
if receipt.exists():raise SystemExit('Already attempted; inspect before any retry.')
spec=importlib.util.spec_from_file_location('board',S/'도구/작업대장.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);b=m.Board(S)
task=b.load('MAIN01-20261109-DBF50341','main01')
if task['status']!='awaiting_user' or task['iteration']!=3:raise SystemExit('Unexpected state; preserve existing work.')
if 'characters' in b.leases():raise SystemExit('Character workspace leased; coordinate.')
folder=b.folder(task['id']);base=Path(json.loads((HERE/'연결.json').read_text(encoding='utf-8'))['output'])
front=base/'scalp_face_v03/variant-2-front.png';out=base/'scalp_face_v03/variant2_directions_v04'
live=ROOT/'게임/public/assets/dev-image-compare/scalp_face_v03/variant-2-front.png'
assert front.read_bytes()==live.read_bytes(),'Selected new2 source mismatch'
assert hashlib.sha256(front.read_bytes()).hexdigest()=='3cb5cafa69bf23ae43b95676a9c43f410827a5b42c25481fcdd5f472a9b88e53'
if out.exists():raise SystemExit('Output already exists; preserve and inspect.')
proof=HERE/'사용자신규2방향-v004.md'
proof.write_text('''# 사용자 신규2안 방향 제작·적용 요청

사용자 직접 지시: “신규 2안 기준으로 45도 90도 만들어볼래? 적용까지”.

현재 맥락은 실제 전장에 자유 배치·이동·크기조절하는 개발자 이미지 대조에 새4안을 추가한 상태다. 최신 요청은 그 중 신규2안 정면을 디자인 마스터로 삼아 화면 오른쪽 앞사선45도와 오른쪽 정측면90도2장을 실제 제작하고, 신규2안의 방향 선택에 적용하는 것이다. 이전 2안과 혼동하지 않는다. 새로운 정면 재설계나 실제 전투 유닛 교체·전안 미적합격·공통비율 확정·다른신규안측면생성·GitHub저장을 포함하지 않는다.

main01이 사용자에게 정리한 범위: “신규 2안의 얼굴·두상 비율과 장비를 유지해 두 방향을 만들겠습니다. 완성되면 신규 2안에서 정면·45°·90°를 골라 전장에 배치할 수 있도록 적용하겠습니다.” 사용자가 대상과 두 각도·적용을 명시한 직접 요청에 근거하며 같은 허락을 다시 묻지 않는다.
''',encoding='utf-8')
pre=HERE/'신규2방향-v004-사전확인.md'
pre.write_text(f'''# 차수4 사전확인

원작업 {task['id']}의 신규2안을 선택한 사용자 직접 요청을 기록했다. 규정A/메인운영/main01작업방법/characters분야/도메인/직전작품제작기준/현재소스/잠금을 확인했다. 본문 추가방향 제외는 직전 정면4안 범위이며 이번 사용자 직접 요청으로2안 두방향에한정갱신한다.

main01은 실제 신규2안 PNG를 열어 금발헤어·갈색눈·청색목도리·은갑옷·갈색벨트/바지·장검/단검과두상비율을 확인했다. root 실행자산과 캐릭터 원본의 바이트/SHA가 일치한다. 이전2안 방향을 새2안 방향으로 위장하지 않는다. characters 담당직전task가성공반환했고현재잠금없다.

수정허용은 새 {out}와원작업차수4기록이다. 기존정면/다른안/이전방향/게임코드/사용자화면은보존한다. 원본개별PNG2장·정면사본·세방향비교·실측메타·밝고어두운전체그림/작은표시검수가완료기준이다. 게임적용은제작완료후main01이gameplay담당과연결하며, 없는방향은생성완료로꾸미지않는다. 최신저장규칙으로커밋·푸시없음.
''',encoding='utf-8')
b.record(task['id'],'main01','revise',proof,'신규 2안 기준으로 45도 90도 만들어볼래? 적용까지')
task=b.load(task['id'],'main01')
prompt=f'''# 신규2안 SD 오른쪽45/90도 실제 제작 — {task['id']} / 차수4

main01→기존 캐릭터 담당. 사용자 “신규 2안 기준으로 45도 90도 만들어볼래? 적용까지”. 원문/해석 {proof}. 선택 마스터는 **scalp_face_v03 신규2안**이며 이전차수variant2와다르다. 이미대상/각도/적용을지정한직접지시범위를실행하며새승인질문을만들지않는다. 이요청은두방향과개발자이미지대조적용에한정하며전부미적합격/기본전투유닛교체/공통체형확정이아니다.

## 필독·원본·허용
자기 AGENTS/작업진행방법/공통·분야/이번발송문/신규2안마스터제작기준/사용자요청을 read-pack본문으로다시읽고차수4/characters문서별요약ACK/start 통과후생성한다. 과거ACK재사용금지. 송신직후메인이영수증연결. 이미지생성스킬을실제로읽고내장imagegen으로2장제작한다. 필요하위담당에게도방법/범위/필독전달. 텍스트기본Sol/medium과이미지모델구분. 자동커밋·푸시·예약백업금지.
유일한디자인/두상/얼굴/체형/복장마스터: {front}. SHA3cb5cafa69bf23ae43b95676a9c43f410827a5b42c25481fcdd5f472a9b88e53. 실제view_image로열어확인한다. 현재게임새2안원본과동일하다.
원본메타/제작기준/검수: {base/'scalp_face_v03'}/asset-manifest.json,제작기준.md,검수.md,report.md. 정면은1133×1388,bodyHeight1331,foot(578,1355)이지만원래생성크기를변형해맞추지않는다. 새각도에서도같은인물의머리/몸비중·카메라높이·헤어/얼굴크기가이어져야한다. 기존3/4안큰머리·예전2안비율을섞지않는다.
출력은새 {out}와이작업차수4기록만. 기존정면·15방향·다른안·공통규정·카탈로그·게임/public·사용자창/탭/패널/설정은변경하지않는다. 생성원본과이전작업을보존한다.

## 회전 지시
1. variant-2-right-045.png: **화면 오른쪽을 향하는 앞사선 약45도**. 얼굴 앞면/두눈과앞흉갑이일부보이는3/4,몸통·골반·양발도같이돌아간양발입상대기자세.
2. variant-2-right-090.png: **화면 오른쪽을 향하는 완전90도정측면**. 코옆선과한눈,겹치는어깨/옆흉갑/옆골반·발이읽혀야한다. 사선/머리만회전/뒤사선아님.
정면의금발층진헤어/갈색눈/청년남성인상·표정·은갑옷·청색목도리/짧게내려진후드·허리천·갈색벨트/주머니/바지를회전한다. 장검은인체오른손,짧은각진단검은왼손. 오른견갑초승달과오른판금정강이,왼청색천장화. 장검청색사선/날개가드/고리보호대·단검형태유지. 단순반전금지,신체좌우바꾸지않음. 완전측면먼쪽팔/무기/발의자연가림허용,보이게하려고추가팔·추가무기/해부구조오류만들지않음. 카메라용보조가필요하면원형오른쪽각도참조를사용하되오직시점역할로구분하고그인물의체형/머리크기를상속하지않는다.
정면캐릭터의두상/얼굴이확실히유지되게하되머리카락의부피로만보정하지않는다. 두상은모발안추정정수리~턱이며추정오차를남긴다. 90도그림이작은머리/길어진몸/다른나이로바뀌면검수후보완한다. 헤어/검/장화/소품모두캔버스안여백을두고포함한다. 새무기/긴망토/문양/스탯/공격동작은추가하지않는다.

## 출력과 게임 연결 계약
신규2PNG는실제알파PNG,생성원본바이트보존. 도구반환실제크기를기록하며정면과같은캔버스를강제로만들려고리샘플링/늘림/재인코딩하지않는다. 같은본체높이/발선맞춤은비교CSS와런타임메타로한다.
variant-2-front.png는선택정면의바이트사본. index.html과comparison.png에정면/오른쪽45/오른쪽90을같은전체표시키/발선으로보여주고57/72CSSpx비교도포함하되실기기검증으로주장하지않는다.
asset-manifest.json에 compareArt 배열3개를둔다: variant=6(게임의신규2안ID),direction='front'|'right45'|'right90',file,width,height,bodyHeight,footX,footY,label='신규2안',sha256,source. 메타bodyHeight는모발끝~발바닥/footX발지지중심을실제그림에서측정하고검끝/외곽여백과분리. ROIs/측정방법/추정오차도기록한다. 새두방향파일명은앞의계약그대로다. 게임담당은이폴더를read-only로읽어새2PNG를바이트복사하고신규2안의direction메타를추가한다. 다른신규1/3/4의방향은생성/위장하지않는다.

## 검수/기준보완/제출
세그림을실제로열고동일인물/크기/얼굴/두상/장비/신체좌우/무기수/그립/앞사선과정측면구분/잘림/알파를검사한다. 밝고어두운전체캔버스와작은표시·세방향비교를실제로열고검수/한계를기록한다. 생성성공만으로모든일관성합격이라주장하지않는다.
새폴더에제작기준.md·분석.md·검수.md·report.md·결과.json과프롬프트/입출력기록/소스해시를보존한다. 최신사용자선택과정면에서방향전개할때기준을정교화하되이번원본2안의기준으로한정,공통규정은확정하지않는다. 원작업5종기록에차수4를추가하고이전차수는보존한다. worker_done에두PNG/세방향비교/manifest/report절대경로와검증/한계를main01에회신한다. 게임적용은후속통합으로연결되며당신이게임소스를수정하지않는다.
'''
(folder/'요청확인.md').write_text(proof.read_text(encoding='utf-8'),encoding='utf-8');(folder/'전문프롬프트.md').write_text(prompt,encoding='utf-8');(folder/'2_사전확인.md').write_text(pre.read_text(encoding='utf-8'),encoding='utf-8')
reads=list(dict.fromkeys([*task.get('additionalReadings',[]),str(proof),str(pre),str(S/'저장운영규정.md'),str(base/'scalp_face_v03/제작기준.md'),str(base/'scalp_face_v03/asset-manifest.json'),str(base/'scalp_face_v03/검수.md')]))
b.set_readings(task['id'],'main01',reads);b.confirm(task['id'],'main01','신규 2안 기준으로 45도 90도 만들어볼래? 적용까지',proof);plan=b.prepare(task['id'],'main01')
(HERE/'신규2방향-v004-연결.json').write_text(json.dumps({'task':task['id'],'iteration':4,'folder':str(folder),'output':str(out),'front':str(front),'plan':plan,'nextStep':'On art return, integrate right45/right90 into new2 developer image comparison via gameplay; no actual combat unit replacement; no commit/push.'},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
exe='C:/Users/user/AppData/Local/Programs/orca/resources/bin/orca.exe'
p=subprocess.run([exe,'orchestration','send','--to','dispatch:ctx_b7b65fa7d54b','--subject','신규2안 마스터 오른쪽45·90 제작 후 게임연결 / 차수4','--type','dispatch','--body',Path(plan['prompt']).read_text(encoding='utf-8'),'--json'],capture_output=True,encoding='utf-8')
try:r=json.loads(p.stdout[p.stdout.index('{'):])
except (ValueError,json.JSONDecodeError):r={'ok':False,'stdout':p.stdout,'stderr':p.stderr}
receipt.write_text(json.dumps(r,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');print(json.dumps(r,ensure_ascii=False,indent=2),flush=True)
if p.returncode or not r.get('ok'):raise SystemExit('Inspect error before recovery; no automatic duplicate.')
b.record(task['id'],'main01','sent',receipt)

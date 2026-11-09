from pathlib import Path
import json,subprocess,importlib.util
ROOT=Path('C:/Users/user/Desktop/Grid Defenders');S=ROOT/'작업관리';HERE=Path(__file__).resolve().parent
receipt=HERE/'신규4안-v002-QA실제발송영수증.json'
if receipt.exists():raise SystemExit('Already attempted; inspect receipt, no duplicate.')
spec=importlib.util.spec_from_file_location('board',S/'도구/작업대장.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);b=m.Board(S)
task=b.load('MAIN01-20261109-1DA15A51','main01')
if task['status']!='awaiting_user' or task['iteration']!=1:raise SystemExit('Unexpected QA state; inspect first.')
if 'qa' in b.leases():raise SystemExit('QA already leased; do not duplicate.')
proof=HERE/'사용자신규4안추가-v002.md';b.record(task['id'],'main01','revise',proof,'이미지 대조 추가해봐')
task=b.load(task['id'],'main01');folder=b.folder(task['id'])
out=Path('C:/Users/user/orca/workspaces/Grid Defenders/테스터/output')/task['id']/'v002-scalp'
creator=Path('C:/Users/user/orca/workspaces/Grid Defenders/게임개발/output/MAIN01-20261109-F89105C9/v002-scalp')
prompt=f'''# 독립 QA 차수2 — 실제 이미지 대조 신규4안 추가

{task['id']} / main01 / qa. 원기능 MAIN01-20261109-F89105C9 차수2. 사용자가 완성한 두상확대4안을 '이미지 대조 추가해봐'라고 직접 요청했다. 근거 {proof}. 실제 root/UI에3모듈+새4PNG+manifest 총8파일씩을 좁게 반영했고 root npm run build(tsc+Vite801모듈)가 통과했다. 이번은 그 기능 범위 안의 독립 검증이며 새 제작/새 사용자승인/저장 요청이 아니다.

자기작업방법/AGENTS/공통·분야규정/이번차수 필독을본문으로읽고 read-pack→차수2자기문서별ACK→start 통과후검사한다. 메인은send직후영수증을연결한다. 과거ACK재사용금지. 사용자요청시저장규정을읽고이번에커밋·푸시·예약백업하지않는다.

실제검사대상 {ROOT/'게임'}와http://127.0.0.1:5173/battle-landscape.html?battle=normal&from=camp. 통합해시는{HERE/'신규4안-v002-통합결과.json'}. UI사본과16파일해시일치를확인한다. 자기작업공간의오래된게임을최신본으로가정하지않는다. 실제root로새headless독립프로필에서직접조작하거나해시동일한격리사본에서검사한다. 기존사용자앱/탭/창/브라우저프로필/localStorage/서버/모델/패널을조작·종료하지않는다. 자기검사용프로세스만정리한다.

검사할변경:
- 이미지대조에기존5종(원본+이전4안)×3방향15개 +신규1~4정면4개=19실제자산. 기본신규4안묶음,기존5종묶음으로전환해9개선택모두접근가능.
- 신규4개각각클릭/필드배치/카드드래그/배치후선택/이동/50·100·200%및숫자입력·100리셋. 2안1133×1388종횡비/원래footAnchor/전체표시높이보존. 다른배치대상에영향없음.
- 신규는정면만지원하고45/90비활성. 프로그램강제change도없는자산/다른안/거짓측면으로바뀌지않아야함. 기존90도사용중신규카드를누르면정면으로선택가능. 기존안으로돌아가면45/90재사용. 혼합배치에서기존/신규대상다시선택하고묶음/방향/선택스케일일관성검사.
- 삭제/전체삭제/닫기그림유지/다시열기/배치모드해제후실제병사·영웅클릭/기존게임입력복구. 미리보기는재화·실제유닛·일반게임저장에포함되지않음.
- 웨이브/보스전환초기화,리사이즈월드발위치,800×360/320px패널접근·스크롤·최소48px. 드래그취소/터치와dispose는변경연관/시간에따라필요범위를정하고못한범위는명시.
- 새4PNG원본SHA/알파/크기·메타데이터와실행참조,기존15PNG/main.ts보존,root/UI8파일일치. 밝고어두운원본전체프레임·실전장상태를검사. 작품의미적합격/공통비율/장검각도·알파외곽잔여는원검수한계이며별도임.

제작자 {creator}/검증.md,browser-check.mjs,browser-result.json,asset-check.json는방법/기대동작참고다.49PASS를그대로인용하지말고실제로자기검사프로필에서관찰한증거를낸다. 이번rootbuild는main통과보고를참고할수있고동일조건의반복모델테스트는필요한공백이없으면하지않는다.

편집허용은새 {out}와원QA작업기록차수2에한정한다. 기존QA결과/제품/다른팀/사용자환경은수정하지않는다. 재현제품결함이있으면증거를main01에보내제작팀에서수정하게한다. report.md/result.json/항목별PASS·FAIL·미검증/해시/실제스크린샷을제출하고worker_done으로반환한다. APK/실기기/세로전투전체/미적합격은미검증일경우그대로표시한다.
'''
(folder/'요청확인.md').write_text(proof.read_text(encoding='utf-8'),encoding='utf-8')
(folder/'전문프롬프트.md').write_text(prompt,encoding='utf-8')
(folder/'2_사전확인.md').write_text('차수2 QA 착수전작성. 원사용자직접기능추가의필수독립검증이며이미root/UI에승인된8파일범위가통합됨. root build통과. 기존QA와다른새폴더에서현재실제게임/새headless프로필을검사하며제품수정/사용자화면·세이브·서버조작/커밋·푸시제외. 실제범위와못한검증을구분한다.\n',encoding='utf-8')
reads=[str(proof),str(HERE/'신규4안-v002-통합사전확인.json'),str(HERE/'신규4안-v002-통합결과.json'),str(S/'저장운영규정.md'),str(creator/'검증.md')]
b.set_readings(task['id'],'main01',reads);b.confirm(task['id'],'main01','이미지 대조 추가해봐',proof);plan=b.prepare(task['id'],'main01')
(HERE/'신규4안-v002-QA연결.json').write_text(json.dumps({'task':task['id'],'iteration':2,'folder':str(folder),'output':str(out),'plan':plan},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
exe='C:/Users/user/AppData/Local/Programs/orca/resources/bin/orca.exe'
p=subprocess.run([exe,'orchestration','send','--to','dispatch:ctx_c4e5086640a5','--subject','독립QA 차수2: 실제 게임 신규4안/기존15개 이미지 대조 검증','--type','dispatch','--body',Path(plan['prompt']).read_text(encoding='utf-8'),'--json'],capture_output=True,encoding='utf-8')
try:r=json.loads(p.stdout[p.stdout.index('{'):])
except (ValueError,json.JSONDecodeError):r={'ok':False,'stdout':p.stdout,'stderr':p.stderr}
receipt.write_text(json.dumps(r,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');print(json.dumps(r,ensure_ascii=False,indent=2),flush=True)
if p.returncode or not r.get('ok'):raise SystemExit('Inspect failure; no automatic retry.')
b.record(task['id'],'main01','sent',receipt)

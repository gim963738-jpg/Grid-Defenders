from pathlib import Path
import importlib.util,json,subprocess
ROOT=Path('C:/Users/user/Desktop/Grid Defenders');S=ROOT/'작업관리';HERE=Path(__file__).resolve().parent
link=json.loads((HERE/'연결.json').read_text(encoding='utf-8'));folder=Path(link['folder']);base=Path(link['output']);out=base/'directions_v02'
receipt=HERE/'방향추가발송영수증-v002.json'
if receipt.exists():raise SystemExit('Already sent; inspect receipt, do not duplicate')
quote='추가로 3/4 우측면, 90도 우측면 보고있는것도추가해서 만들어주고'
proof=HERE/'사용자방향추가.md';proof.write_text('# 사용자 추가 요청\n\n'+quote+'\n\n이전 맥락: 금발전사 신규4안과 기존 원본의 전장 배치 비교 도구 제작 중. 신규4안 각각 오른쪽 앞 사선 약45도와 오른쪽 정측면90도를 더 제작하고 방향 선택을 연결한다. 총 신규8장. 기존 정면과 1차 산출물은 보존한다.\n',encoding='utf-8')
spec=importlib.util.spec_from_file_location('board',S/'도구/작업대장.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);b=m.Board(S)
task=b.load(link['task'],'main01')
if task['status']=='awaiting_user':b.record(task['id'],'main01','revise',proof,quote)
task=b.load(link['task'],'main01')
if task['iteration']!=2 or task['status']!='draft':raise SystemExit('Unexpected state; no duplicate revision')
prompt=f'''# 캐릭터 팀장 후속 제작 — {task['id']} / 차수2

추가 사용자 직접 지시: {quote}
근거: {proof}. 최신 상세 요청은 기존 금발전사4안에 오른쪽 앞3/4 약45도·오른쪽 정측면90도를 더해 게임상 배치 비교하는 것이다. 새 방향8장을 실제 생성하라. 1차 시안 디자인에 대한 전체 합격이나 공통 비율 확정이 아니다. 기존 정면4안은 이번 방향 제작의 같은 인물/안별 구성 입력으로 사용한다.
자기 작업 방법과 공통/분야 규정·이번 차수 지시·1차 보고/검수/생성기록을 다시 읽고 read-pack → 차수2 자기 읽기확인 → start를 통과한 뒤 제작한다. 이전 차수 읽기확인은 재사용하지 않는다. 전송 영수증은 총괄이 send 직후 연결한다. 기존 턴의 역할과 작업 공간을 이어받고 신규 캐릭터 담당 AI를 복제하지 않는다.

출력은 새 폴더 {out}에만 저장. 1차 파일 {base}의 기존PNG/HTML/보고/검수/기록은 변경하지 않는다. 코드/규정/카탈로그/게임 public 폴더도 당신이 수정하지 않는다. 원작업 기록은 차수2임을 명시해 추가하고 이전 보고는 보존한다.

## 제작 입력과 방향
각 안의 정면 마스터는 {base}/variant-1-final.png ~ variant-4-final.png다. 실제 view_image로 모두 다시 열어 확인한다. 해당 안의 머리/얼굴/체형/표정/갑옷/목도리/벨트/천/무기/장비를 그대로 회전한다. 1안과2안의 차이를 합치거나 3안의 넓은 체형을 다른 안으로 옮기지 않는다.
3/4 우측면은 **화면 오른쪽을 향하는 앞 사선 약45도**로 앞면과 오른쪽 방향이 함께 보이는 모습. 90도 우측면은 **화면 오른쪽을 향한 완전한 정측면**, 사선과 구분한다. 머리·몸통·골반·양발·무기가 같은 방향으로 회전하며 걷기/공격이 아닌 양발 입상 대기 자세다.
인체 오른손 장검·왼손 단검, 오른 견갑 초승달과 판금 정강이·왼 청색 천 장화, 짧은 내려진 후드의 구조를 유지한다. 단순 반전으로 방향을 대신하지 않는다. 90도에서 먼쪽 장비가 가려지는 것은 허용하되 사라진 무기/팔을 추가해 보이게 조작하지 않는다. 과한 새 문양·긴 망토·새무기를 붙이지 않는다.
내장 image_gen/해당 imagegen 스킬로 개별8장을 생성. 텍스트모델Sol medium과 이미지모델은 별개다. 사용자 지정 비율의 한계와1차프레이밍미달은 기록하되 이번 추가방향에서는 같은 안의 정면과 몸 키·머리 비중·카메라/발선을 최대한 맞춘다. 전장 비교를 위해 그림이 잘리지 않아야 한다. 같은 안 방향끼리만 스케일이튀면 검수 후 보완한다. 출력PNG원본과 알파를 보존하고 이미지파일을 수학적으로 늘리거나 리샘플링하지 않는다.

## 파일 계약 (게임개발 담당과 연결)
각 variant N에 대해:
- variant-N-front.png: 기존 variant-N-final.png의 원본 바이트 사본.
- variant-N-right-045.png: 신규 앞사선.
- variant-N-right-090.png: 신규 정측면.
기존 원형은 {base}/original.png 정면 및 캐릭터디자인2/output/characters/gc9_longsword_dagger/pixel_8views_v01/images/02_front_right_045.png,03_right_090.png를 각각 original-front.png, original-right-045.png, original-right-090.png로 **그대로 복사**한다. 기존 원형의2개 방향은 이미 있어 재생성하지 않는다.
asset-manifest.json에 original/variant1~4의 front/right45/right90 파일명과 SHA256, 이미지 실제크기, 본체bounds·footAnchor·측정방법/추정 여부, 원본source를 기록한다. 메타데이터는 이미지측정을 근거로하며 검끝/캔버스여백을 몸키로 삼지 않는다. 게임개발 담당이 이 폴더를 read-only로 읽어 public에 바이트 복사할 것이다.
15개(5종×3방향) 전체를 볼 수 있는 별도 index.html과 comparison-directions.png를 만들고 각 방향을 실제 열어 검수한다. 기존 비교페이지/사용자 화면은 조작하지 않는다.

## 제출/검증
안별 동일성, 앞사선/완전측면 구분, 전 방향 오른쪽지향, 비대칭 장비 인체좌우, 손/무기/몸 잘림, 방향별 발선/몸높이, 밝고어두운 배경을 실제 검수하고 결과/한계를 기록한다. 생성 성공이나 파일존재만으로 일관성 합격을 주장하지 않는다.
새 폴더에 생성프롬프트/입력/출력기록·분석추가.md·검수.md·report.md·결과.json을 저장한다. 3/4/5 작업기록도 차수2로 추가하고 차수1이력을 보존한다. 총괄에게 실제15파일/비교/manifest절대경로를 worker_done으로 회신한다. 사용자 미적 합격/게임통합은 따로 대기다.
'''
(folder/'요청확인.md').write_text(proof.read_text(encoding='utf-8'),encoding='utf-8')
(folder/'전문프롬프트.md').write_text(prompt,encoding='utf-8')
(folder/'2_사전확인.md').write_text('# 차수2 사전확인\n추가방향 제작 전 작성. 최신 직접지시로4안 각각45/90도8장 추가, 기존정면/원본방향은바이트보존. 한안선택후방향제작이라는일반절차보다이번직접추가지시를우선한다. 기존작업합격/비율공통채택은별개다. 실제필독및새차수읽기확인후내장이미지생성,게임코드/화면조작제외. 결과와게임도구는manifest로연결한다.\n',encoding='utf-8')
reads=task.get('additionalReadings',[])+[str(proof),str(base/'검수.md'),str(base/'report.md')]
b.set_readings(task['id'],'main01',reads);b.confirm(task['id'],'main01',quote,proof);plan=b.prepare(task['id'],'main01')
exe='C:/Users/user/AppData/Local/Programs/orca/resources/bin/orca.exe'
body=Path(plan['prompt']).read_text(encoding='utf-8')
p=subprocess.run([exe,'orchestration','send','--to','dispatch:ctx_b184fbb5e644','--subject','금발전사4안 우측45/90도 추가 제작·차수2','--type','message','--body',body,'--json'],capture_output=True,encoding='utf-8')
try:reply=json.loads(p.stdout[p.stdout.index('{'):])
except (ValueError,json.JSONDecodeError):reply={'ok':False,'raw':p.stdout,'stderr':p.stderr}
receipt.write_text(json.dumps(reply,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');print(json.dumps(reply,ensure_ascii=False,indent=2),flush=True)
if p.returncode or not reply.get('ok'):raise SystemExit('Inspect failed send; no retry')
b.record(task['id'],'main01','sent',receipt)
feature=f'''사용자 추가: 금발전사 신규4안 각각 우측 앞3/4(약45도)·우측 정측면90도 추가 제작을 기존 캐릭터 팀장에게 전달했습니다. 개발자 이미지 대조 도구에 방향 front/right45/right90 선택을 추가해 같은 안의 각방향을 전장배치하고 배치 후에도 교체/크기조절 가능하게 해주세요. 방향/크기를 바꾸어도 발 기준점과 위치를 유지합니다. 생성 폴더는 {out}; 최종 asset-manifest.json에 5종×3방향15개를 기록하고 variant-N-front.png/variant-N-right-045.png/variant-N-right-090.png, original-front.png/original-right-045.png/original-right-090.png 형식입니다. 정면복사5장+기존원형측면2장+신규8장입니다. 모듈/정면 동작을 계속 구현하고 방향데이터를 분리해 추가자산을 나중에 넣을 수 있게 해주세요. 아직 생성중인 신규방향을 임의생성/반전/빈그림으로 완료처리하지 마세요. 완료시점에 파일존재를 확인해 통합가능하면포함하고,없으면구현/검증완료범위와자산대기를구분해회신하세요. 사용자 재승인은 필요없으며 작업범위내 UI추가입니다. 기존 MAIN01-20261109-F89105C9 원작업/필독기록에서 이 추가지시의 적용을 함께 기록해 주세요.'''
notice=subprocess.run([exe,'orchestration','send','--to','dispatch:ctx_90265d63e2c3','--subject','추가 기능: 정면·우측45·우측90 방향 선택','--type','message','--body',feature,'--json'],capture_output=True,encoding='utf-8')
(HERE/'게임개발방향추가공지.json').write_text(notice.stdout or notice.stderr,encoding='utf-8')
print(notice.stdout,flush=True)

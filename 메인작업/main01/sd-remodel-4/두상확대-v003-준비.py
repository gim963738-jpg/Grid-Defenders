from pathlib import Path
import importlib.util, json

ROOT=Path('C:/Users/user/Desktop/Grid Defenders'); S=ROOT/'작업관리'; HERE=Path(__file__).resolve().parent
link=json.loads((HERE/'연결.json').read_text(encoding='utf-8'))
folder=Path(link['folder']); base=Path(link['output']); out=base/'scalp_face_v03'
spec=importlib.util.spec_from_file_location('board',S/'도구/작업대장.py')
m=importlib.util.module_from_spec(spec); spec.loader.exec_module(m); board=m.Board(S)
task=board.load(link['task'],'main01')
if task['status']!='awaiting_user' or task['iteration']!=2:
    raise SystemExit('Unexpected state; inspect before any revision. No duplicate preparation.')
leases=board.leases()
if 'characters' in leases: raise SystemExit('Character workspace is leased; do not disturb another editor.')
if out.exists(): raise SystemExit('New output path already exists; preserve it and inspect.')
proof=HERE/'사용자두상확대-v003.md'
proof.write_text('''# 사용자 확인·피드백 원문 / 차수3

사용자 최초 수정 요청: “머리 크기를 대머리 기준으로 잡고 해서 다시 4안 뽑아보라해볼래?”

사용자 정정: “머리카락을 제외하는게 아니고 머리크기기준을 머리카락부터 턱 말고 머리카락부터 정수리 기준으로 해서 비율을 조정하라는거지 지금 SD치고 머리가 조금 작은느낌이라 인게임에서 얼굴 표현이 조끔 어려움을 겪고있어서”

메인 이해 확인: “금발 헤어·복장·무기를 유지하고, 모발 끝 대신 실제 두상의 정수리를 기준으로 비율을 잡아 두상과 얼굴을 키우겠습니다. 비슷한 전체 키에서 머리·얼굴 비중이 다른 4안을 기존 SD와 비교하면 맞을까요?”

사용자 추가 질문: 같은 기준이면 캐릭터들의 두상이 비슷해져 표정·소품·헤어스타일로 개성을 표현하는 데 지장이 없는가?

메인 설명: 공통화는 얼굴 가독성을 위한 크기·몸 비율이며 같은 두상 모양을 복제하는 것이 아니다. 얼굴형·이목구비·헤어·실루엣·체격의 개별 차이를 허용한다. 금발4안으로 적절한 크기를 먼저 비교하고, 공통 기준으로의 채택은 사용자 선택 이후다.

사용자 실제 실행 확인: “참고해서 4안 새로 뽑아와줘”

승인 범위: 금발전사 정면 신규4안과 기존 SD 비교 제작. 머리카락을 없애는 제작이 아니다. 금발은 유지하고 실제 두상·얼굴의 면적/비중을 키워 인게임 표정 가독성을 개선한다. 이번 정면4안 선택 전 추가 방향·애니메이션·게임 자산 교체·공통 수치 확정을 자동 실행하지 않는다.
''',encoding='utf-8')
preflight=HERE/'두상확대-v003-사전확인.md'
preflight.write_text(f'''# main01 사전확인 / 두상·얼굴 확대4안

이미지 생성·수정 지시 발송 전 작성. 규정A v2.1.0, 메인운영규정, main01 작업진행방법, characters 규정, 도메인 README·트리·characters 색인, 메인보고형식 v1.1, 직전 제작·분석·검수와 현재 차수/브랜치 잠금을 확인했다. main01 별도 규정.md는 없어 메인운영규정과 작업진행방법을 적용한다.

분류는 세계관/캐릭터, 담당은 기존 캐릭터 팀장 characters. 현재 작업 {task['id']} 차수2는 awaiting_user, characters 브랜치 잠금 없음. 실제 Orca worker-list에서 직전 ctx_553445b731ee succeeded/retained와 동일 캐릭터 담당 핸들을 확인했다. 종료 성공 근거를 사용하며 unverifiable liveness만으로 중단을 추정하지 않는다.

현재 직접 실행 확인은 {proof}다. 같은 범위의 재승인을 받지 않는다. 차수3으로 기록을 분리하고 이전 차수 지시/사용자 확인과 생성물을 보존한다. 수정 허용은 새 출력 {out} 및 해당 작업의 차수3 기록뿐이다. 게임 코드·public·현재 스티커·공통 기준·사용자 창/패널/탭은 제외한다.

완료 기준은 실제 투명PNG 정면4안, 기존+신규5열 비교, 동일 표시 키/발선 비교, 작은 표시에서 얼굴 가독성의 실제 열람, 머리카락 유지와 실제 두상 확대 구분, 인체 좌우/무기와 알파/잘림 검수, 추정 정수리의 측정 한계 표기, 새 작품 기준·생성 기록·검수 제출이다. 이 결과가 기존 일반 SD비율보다 우선하는 범위는 이번 비교 시안 제작에 한정한다. 공통 비율 채택은 사용자 판정 이후다.
''',encoding='utf-8')
task=board.record(task['id'],'main01','revise',proof,'참고해서 4안 새로 뽑아와줘')
prompt=f'''# 금발 전사: 두상·얼굴 확대 SD 신규4안 — {task['id']} / 차수3

담당 main01 → 기존 캐릭터 팀장 characters. 사용자 실행 확인: “참고해서 4안 새로 뽑아와줘”. 사용자 전체 정정과 승인 근거는 {proof}. 실제로 새 정면4장을 제작하라. 새 담당 AI를 복제하지 말고 본인의 직전 업무를 이어받는다. 모델 기본값 Sol/medium 유지, 이미지 생성 모델과 구분한다.

## 매 차수 필독과 착수
자기 AGENTS·작업진행방법·공통/분야 규정·이번 발송문·사용자 원문·작품 원본 기준을 read-pack 본문으로 다시 읽고, 차수3의 문서별 적용 요약을 작성해 start를 통과한 뒤 생성한다. 과거 ACK를 재사용하지 않는다. 직전 설명을 암기한 것으로 기준 읽기를 생략하지 않는다. 송신 영수증은 메인이 send 직후 기록한다. 이번 작업에도 이미지 생성 스킬의 실제 지침을 읽고 따른다. 필요한 임시 하위 담당은 허용 범위·작업 방법·원본 차수·필독을 전달하고 자기 읽기 확인을 받아 사용한다. 불필요하게 미리 세분화하지 않는다.

## 사용자 의도와 이번 변경
기존 분석은 hairTop~chin을 머리1단위로 계산했다. 사용자는 이를 문제로 지적했고, SD치고 머리가 작아 게임에서 얼굴/표정 표현이 어렵다고 했다. **머리카락은 그대로 유지**한다. 모발의 부풀어 오른 외곽/뾰족한 끝 대신 그 안의 실제 두개골 정수리 위치를 추정해 두상 비율을 판단하고, 실제 두상과 얼굴을 더 크게 설계한다. 모발만 부풀려 머리가 커 보이게 하거나 눈만 크게 그려 목적을 대신하지 않는다. 머리카락을 제거한 완성본을 만들지 않는다.

이 작업의 머리 단위는 추정 scalp crown~chin이며, 비교용 전체 표시 높이는 hairTop~sole로 별도 기록한다. 머리카락에 가려진 정수리는 직접 실측할 수 없으므로 추정점·방법·불확실성을 명시한다. 필요하면 scalp crown~sole도 별도로 기록하되 hair-inclusive 등신과 혼동하지 않는다. 기존3.3 hair-inclusive 목표를 새 두상 기준3.3으로 무심코 복사하거나 미확정 수치를 사용자 확정값으로 쓰지 않는다.

사용자가 동의한 개성 원칙: 공통화는 작은 게임 화면의 얼굴 가독성 기준이며 같은 얼굴틀/두상모양 복제가 아니다. 캐릭터별 턱선·볼·눈매·눈썹·헤어·체격의 차이를 허용한다. 이번4안은 모두 같은 금발전사라는 정체성은 유지하고 얼굴형/두상·몸 비중의 선택 차이를 보여준다. 아기/유아 캐릭터나 다른 성별/직업으로 바꾸지 않는다.

## 입력과 고정 요소
권위 있는 기존 SD 정면: {base}/original.png (원본 SD).
원래 비율 참고: C:/Users/user/AppData/Roaming/orca/agent-session-attachments/8b2d3738-4a80-49f0-898c-dd34d28886b3/orca-paste-1794211506995-919ec7e6-17d6-4089-a44d-65c47621e703.png
작은 캐릭터 개성 표현 참고: C:/Users/user/AppData/Roaming/orca/agent-session-attachments/b84d3f42-3a33-4ad0-8b99-33da7c6d9fc3/orca-paste-1794211568587-15927aa7-4abe-487a-8904-a9f5e6400f4f.png
직전 결과/한계: {base}/분석.md,검수.md,report.md 및 variant-1-final.png~variant-4-final.png. 이전4안은 사용자 합격 마스터가 아니라 수정 전 비교 이력이다. 이번에는 머리·얼굴 확대를 확실하게 보여주어라. 입력은 view_image로 열고 역할을 구분한다.

금발·갈색눈·청년 남성 인상·은색갑옷·청색목도리/내려진 짧은후드·청색허리천·갈색벨트/주머니/바지 유지. 인체 오른손 장검(청색사선/날개가드/고리보호대), 왼손 짧은 각진 단검. 인체 오른 견갑 초승달과 오른 판금 정강이, 왼 청색천장화 유지. 정면에서는 인체오른쪽=화면왼쪽. 긴 망토/새무기/새이름/새스탯 없음. SD 픽셀 화풍·원래 색상/장비 정체성 유지.

## 실제 신규4안 설계
동일 정면, 양발 입상 대기 자세와 유사한 중립 표정·카메라 높이·전체 표시 키로 비교하라. 안마다 대략 같은 그림을 새 파일명으로 제출하지 않는다. 1안은 절제된 확대,2안은 얼굴/몸 균형,3안은 뚜렷한 큰 두상 SD,4안은 작은 화면의 얼굴 읽기를 우선한 비중으로 차이를 만들어라. 이는 작업용 비교 설계이며 사용자 확정 수치가 아니다. 모두 기존보다 실제 얼굴과 두상이 크게 읽혀야 한다. 머리 크기만 기계적으로 붙여넣거나 원본을 수학적 변형하지 말고 목·어깨·몸통·팔다리를 자연스럽게 새로 그려 조화롭게 조정한다.

새 출력 폴더: {out}
- variant-1-front.png ~ variant-4-front.png: 각각 실제 생성한 개별 투명 PNG, 모든 머리·발·무기끝 포함.
- original.png: 기존 정면 원본 바이트 사본.
- comparison.png와 index.html: 기존+신규4안 5열 비교. 전체 몸 비교/얼굴 확대/게임 크기 비교를 구분해 한눈에 볼 수 있게 한다. 머리 확대가 아닌 캐릭터 전체 스케일 차이로 비교를 속이지 않는다.
- 원본·신규 모두 동일한 전체 표시 높이/발선으로 등비 등록. 개인 PNG를 확대 재저장하지 않는다. 원본 내보내기 바이트를 보존한다.
- 게임 크기 비교는 현재 참고값 본체57CSSpx/72CSSpx 정도의 작은 표시로 5종을 동시에 보여준다. 이는 갤러리의 작은 크기 관찰이며 실제 게임 통합·실기기 검증이라고 보고하지 않는다. 생성 원본의 표시 크기와 픽셀 리샘플링을 구분한다.
- asset-manifest.json: 파일/source/SHA256/실제픽셀/알파/bounds, hairTop, 추정scalpCrown,chin,sole, 본체높이/얼굴영역 측정과 추정오차, 각 안 설계 목적을 기록한다. 허위 정밀도와 정확히 동일한 등신 주장 금지.

## 규정 정교화와 검수
기존 머리카락포함 측정이 실제얼굴 가독성을 보증하지 못한 문제와 이번 사용자의 수정 기준을 새 폴더 제작기준.md에 반영한다. 두상/모발/얼굴/장비외곽/표시높이를 분리하고, 동일두상 복제가 아니라 개성 차이를 허용하는 것을 명시한다. 공통 SD정의/카탈로그/기존제작기준 자체는 사용자 선택 전 변경하지 않는다. 공통기준 보완 제안은 제안으로 분리한다.
실제4PNG/비교/작은표시/밝고어두운배경을 열고 확인한다. 얼굴이 전보다 커 읽히는지, 머리카락만 커졌는지, 같은 캐릭터인지, 4안차이, 손/무기개수/그립/좌우, 알파/가장자리잘림을 검사하라. 문제가 보이면 허용 범위 안에서 보완하되 초기본은 보존한다. 생성 성공 자체를 사용자 미적 합격으로 주장하지 않는다.
새 폴더에 분석.md·제작기준.md·검수.md·report.md·결과.json·생성입력/프롬프트/출력 기록을 제출하고 원작업5종기록은 차수3을 명시해 추가하되 지난 차수를 보존한다. 차수3의 생성 원본 및 비교 링크를 worker_done으로 main01에 회신한다.

허용 편집은 새 출력 폴더와 원작업 차수3 기록뿐이다. 기존PNG/정면4안/15방향/비교페이지/게임코드/public/현재스티커/공통규정/사용자창·탭·패널·모델설정은 편집·조작하지 않는다. 이번은 정면4안 선택용이며 추가방향·애니메이션·실제게임교체는 자동 수행하지 않는다. 유료 외주 계정연결은 이번 범위에 없고 내장 imagegen 경로를 사용한다.
'''
(folder/'요청확인.md').write_text(proof.read_text(encoding='utf-8'),encoding='utf-8')
(folder/'전문프롬프트.md').write_text(prompt,encoding='utf-8')
(folder/'2_사전확인.md').write_text(preflight.read_text(encoding='utf-8'),encoding='utf-8')
reads=list(dict.fromkeys([*task.get('additionalReadings',[]),str(proof),str(preflight),str(base/'분석.md')]))
board.set_readings(task['id'],'main01',reads)
board.confirm(task['id'],'main01','참고해서 4안 새로 뽑아와줘',proof)
plan=board.prepare(task['id'],'main01')
(HERE/'두상확대-v003-연결.json').write_text(json.dumps({'task':task['id'],'iteration':3,'folder':str(folder),'output':str(out),'plan':plan},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'task':task['id'],'iteration':3,'output':str(out),'prompt':plan['prompt'],'status':'prepared_not_sent'},ensure_ascii=False))

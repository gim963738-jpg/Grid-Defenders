from pathlib import Path
import importlib.util,json,subprocess
ROOT=Path('C:/Users/user/Desktop/Grid Defenders');S=ROOT/'작업관리';HERE=Path(__file__).resolve().parent
ENGINE=Path('C:/Users/user/orca/workspaces/Grid Defenders/게임개발')
UI=Path('C:/Users/user/orca/workspaces/Grid Defenders/UI-전투화면')
ART=Path('C:/Users/user/orca/workspaces/Grid Defenders/캐릭터디자인2/output/characters/gc9_longsword_dagger/sd_remodel_4_main01-20261109-dbf50341')
EXE='C:/Users/user/AppData/Local/Programs/orca/resources/bin/orca.exe'
def write(p,t):p.parent.mkdir(parents=True,exist_ok=True);p.write_text(t,encoding='utf-8')
def dump(p,d):write(p,json.dumps(d,ensure_ascii=False,indent=2)+'\n')
if (HERE/'작업연결.json').exists():raise SystemExit('Already prepared')
ps=subprocess.run([EXE,'worktree','ps','--json'],capture_output=True,encoding='utf-8',check=True)
rows=json.loads(ps.stdout[ps.stdout.index('{'):])['result']['worktrees'];row=next(w for w in rows if Path(w['path']).resolve()==ENGINE.resolve())
dump(HERE/'게임개발사전상태.json',row)
if any(a.get('state') not in {'done','idle'} for a in row.get('agents',[])):raise SystemExit('Game developer already active; do not duplicate')
request='''저거 게임화면에 바로 붙여넣어볼수있게 개발자 도구에 이미지 대조 버튼하나 만들어줄래?
메인 확인 질문: 기존 금발 전사와 신규4안 중 골라 전장에 임시로 놓고 크기·비율을 비교하는 기능으로 만들까요?
사용자 확인 및 구체화: 전장에 직접 병사나 영웅처럼 배치할수있게 해주고 배치가 되어도 캐릭터 크기조정할수있게 기능도 추가해서만들어줘'''
write(HERE/'사용자확인.md',request)
spec=importlib.util.spec_from_file_location('board',S/'도구/작업대장.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);b=m.Board(S)
task=b.new('main01','gameplay','개발자 이미지 대조·전장 배치·개별 크기 조절',request);folder=b.folder(task['id'])
prompt=f'''# 게임개발 팀장 제작 지시 {task['id']} / 차수1

사용자 요청/확인: {HERE/'사용자확인.md'}
담당 main01 → gameplay. 실제 구현 및 검증 작업이다. 사용자가 전장에 병사/영웅처럼 배치하고 배치 후 크기 조절까지 직접 확인했다. 같은 승인 질문을 반복하지 않는다.
자기 AGENTS/작업연결/작업진행방법/공통 규정, 추가 필독을 본문으로 읽고 read-pack → 자기 적용 요약/해시 기록 → start 통과 후 제작한다. actual sent 기록은 메인이 발송 직후 연결한다. 아직 없으면 담당 메인에게 ask한다. 단순 도구 전달 대기를 사용자 승인 문제로 돌리지 않는다.

## 편집/협업 경계
현재 최신 실행 원본: {ROOT/'게임'}, 실행 서버 http://127.0.0.1:5173. 루트 제품 파일은 메인이 최종 연결한다.
당신의 구현 공간: {ENGINE/'게임'}. 이 공간의 원본/미커밋 변경을 보존한다. 현재 루트 원본과 main.ts/landscape-entry.ts/devRangeDummy.ts/blondArt.ts 관련 표시 구조를 읽어 비교한다. 루트 최신본은 읽기 참조이고 직접 편집하지 않는다. 당신 공간이 이전 사본이면 기존 코드 덮어쓰기 없이 신규 모듈과 검토 가능한 최소 통합 패치를 만든다.
UI 작업 공간 {UI}에서는 MAIN02-20261109-063FC22B가 웨이브/보스 UI 이미지16장을 제작 중이다. 그 작업 허용 범위는 새 output/이미지와 자기 기록뿐, 게임 코드 수정 제외다. UI 담당과 공유 폴더/규정/AGENTS/기존 작업 기록을 수정하지 않는다. main01이 신규 개발자 모듈과 최소 연결점만 단독 통합한다. UI 컨셉 변경은 하지 않는다.
허용 변경: 게임개발 공간의 게임/src/devImageCompare.ts, devImageCompare.css, 필요한 순수 좌표/스케일 보조 모듈, 신규 게임/public/assets/dev-image-compare/와 변경에 필요한 검사 파일, 원작업 기록. main.ts/landscape-entry.ts는 현재 구조에 맞는 최소 통합 패치를 별도 산출물로 제시한다(게임개발 공간에서 검증용 수정 시 기존 바이트/변경 전후 패치와 실제 소유 범위를 명시). 다른 제품 모듈/수치/아트 원본은 수정하지 않는다.

## 목표/기능
기존 개발자 도구에 ‘이미지 대조’ 버튼 1개 추가. 버튼은 중복 생성되지 않고 기존 도구 터치 기준과 스타일을 재사용한다.
클릭하면 원본/1안/2안/3안/4안의 미리보기 선택 도구를 연다. 비교 PNG를 전장에 붙이는 것이 아니라 **개별 캐릭터 투명 PNG를 실제 전장 위에 배치**한다.
선택 후 전장 클릭/터치로 배치, 가능하면 카드에서 전장으로 드래그도 지원한다. 배치한 대상은 다시 선택·드래그로 위치 이동 가능하다. 여러 안을 나란히 두어 비교한다. 진짜 병사/영웅 소환 비용·정원·체력·스탯·데미지·적 타겟·전투 저장에 끼어들지 않는 개발자용 배치 대상이다.
배치 후 선택한 캐릭터만 크기 슬라이더/숫자 또는 +/-로 조절. 가로세로 등비 유지, 예: 50~200% 및 100% 복원. 적정 실제 범위는 미리보기 가독성에 맞춰 정한다. 크기 변경은 발 기준점을 고정하고 투명 캔버스/검끝을 몸 키로 잘못 잡지 않는다. 몸 높이와 발 위치는 이미지 알파/원본 측정 기록을 근거로 메타데이터화한다. 이미지 파일 자체 리샘플링/수정 금지.
선택 대상 구분, 개별 삭제, 전체 지우기, 배치 모드 해제/패널 닫기를 제공한다. 패널을 닫아도 배치한 미리보기는 비교용으로 유지할 수 있게 하고, 그 경우 닫힌 상태에서 실제 게임 입력을 가로채지 않도록 한다. 사용자에게 무엇이 남는지 간단히 표시한다. 전체 제거로 즉시 원복 가능.
전장 빈 곳 클릭은 게임의 유닛 소환/선택과 충돌하지 않는다. 배치/드래그 중 이벤트 전파를 적절히 막고 평소에는 기존 게임 조작을 보존한다. 포인터 캡처/취소/화면 전환/리사이즈를 처리한다. 웨이브와 보스 전장 각각의 크기/표시 배율을 구분하며 모드 전환 시 이전 전장의 고스트·패널/선택이 남지 않도록 한다.
현재 실제 전장 기준 위치를 계산한다. CSS 표시 크기와 논리 게임 좌표를 혼동하지 않는다. UI 내부 캔버스 비율을 임의 축소하지 않고 기존 공통 mobile-ui.css 및 가로 예외를 따른다. 슬롯 스냅은 실제 병사 배치판과 비교가 쉬우면 제공하되 전장 자유 위치도 사용할 수 있게 한다.

## 이미지 입력
원본: {ART/'original.png'}
신규4안: {ART/'variant-1-final.png'}, {ART/'variant-2-final.png'}, {ART/'variant-3-final.png'}, {ART/'variant-4-final.png'}
기존 측정/프레이밍 정보: {ART/'image-metadata.json'}, {ART/'index.html'}, {ART/'검수.md'}
각 PNG를 게임개발 작업 공간 public/assets/dev-image-compare/로 **바이트 그대로 복사**하고 해시를 기록한다. 모델·이미지 생성/아트 수정 작업이 아니다. body bounds/발 기준을 원본에서 확인하고 게임 기존 금발 전사의 표시 몸 높이 웨이브57/보스72 등 실제 blondArt.ts 코드에서 확인해 초기 표시를 맞춘다. 원본은 실제로 4안과 모발/발이 다른 프레이밍이다. 캔버스1254px 자체로 동일 크기 계산하지 않는다.

## 통합 방식
기존 createRangeDummy 스타일의 createDevImageCompare(options) 모듈과 sync/dispose를 사용해 최소 연결 가능하게 구성한다. 노출 API는 실제 코드 구조에 맞춰 제안한다. 메인이 최종 루트/실제 UI 공간에 넣을 추가 import와 초기화/sync/dispose의 **정확한 패치**를 파일로 제출한다. 패치 대상은 최신 루트 파일을 기준으로 하며 원래 미커밋 변경을 전체 덮어쓰지 않는다.
기본 브라우저 화면을 조작하지 않는다. 사용자의 창/탭/모델/브라우저 URL을 바꾸지 않는다. 검증이 필요하면 별도 headless 브라우저/임시 서버를 사용하고 실행한 자기 프로세스만 종료한다. 기존5173 서버와 다른 팀 프로세스를 중단/재시작하지 않는다.

## 검증/산출물
실제 브라우저에서 버튼→안선택→전장배치→선택/이동→배치후확대/축소→개별/전체삭제, 배치모드 해제 후 기존병사/영웅 입력 복원, 웨이브/보스 전환·리사이즈·포인터취소를 확인한다. 전투 골드/영웅정원/세이브 데이터가 미리보기 때문에 변하지 않는지 확인한다. 발선이 크기 변경 때 떠다니지 않는지 비교한다. 좁은 모바일 화면과 실제800×360에서도 조작 영역/잘림 확인. 순수 좌표/스케일 계산 검사는 의미 있는 범위로 수행하고 코드 구현을 복사한 테스트는 만들지 않는다.
프로젝트 tsc/build와 변경에 맞는 기존 검사를 실행한다. 실제 못 한 항목은 미검증으로 명시한다. 사용자 미적 합격은 대신하지 않는다.
최종 파일: 새 모듈/CSS/PNG5개, 통합.patch, 변경manifest.json(원본·변경 해시/허용 경로), 검증.md(실제 실행·재현·결과·스크린샷), 결과.json 및 원작업 3/4/5 기록.
결과는 {folder} 또는 자기 작업공간의 독립 작업 결과 폴더에 두고 실제 절대 경로를 worker_done으로 보고한다. 메인이 루트와 UI 공간의 좁은 변경만 검토·연결한 뒤 사용자에게 버튼 위치/사용법을 안내한다.
'''
write(folder/'전문프롬프트.md',prompt);write(folder/'요청확인.md',request)
write(folder/'1_대화기록.md',request)
write(folder/'2_사전확인.md',f'# 사전확인\n실제 제작 전 작성. 사용자 최신 구체화로 전장 배치·배치 후 크기 조절이 확인되었다. 공유규정/작업방법/UI 기준과 원본이미지 출처를 연결한다. UI공간은 main02 이미지시안 작업중이고 게임수정은 그 범위에서 제외됨을 실제 지시/상태로 확인했다. 게임개발 담당 공간은 완료 상태이며 이 작업은 신규 미리보기 모듈/검사/최소 통합패치만 소유한다. 실행서버는 root5173이며 직접 화면조작/프로세스종료/기존구현 덮어쓰기 제외. 실제 root/UI 통합은 메인이 패치검토 후 이 요청 범위만 적용한다.\n입력은 {ART}. 완료 기준과 상세 허용 경로는 전문프롬프트에 있다.\n')
readings=[UI/'문서/00_개발규칙/모바일UI규격.md',S/'기준/ui/규정.md',S/'기준/ui/작업진행방법.md',HERE/'사용자확인.md',ART/'검수.md']
b.set_readings(task['id'],'main01',[str(p) for p in readings]);b.confirm(task['id'],'main01','전장에 직접 병사나 영웅처럼 배치할수있게 해주고 배치가 되어도 캐릭터 크기조정할수있게 기능도 추가해서만들어줘',HERE/'사용자확인.md')
plan=b.prepare(task['id'],'main01');dump(HERE/'작업연결.json',{'task':task['id'],'folder':str(folder),'plan':plan,'engine':str(ENGINE),'ui':str(UI),'root':str(ROOT)})
print(json.dumps({'task':task['id'],'prompt':plan['prompt'],'selector':plan['selector']},ensure_ascii=False))

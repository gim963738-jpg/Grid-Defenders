from pathlib import Path
import importlib.util,json,hashlib
ROOT=Path('C:/Users/user/Desktop/Grid Defenders');S=ROOT/'작업관리';HERE=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('board',S/'도구/작업대장.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);b=m.Board(S)
task=b.load('MAIN01-20261109-F89105C9','main01')
if task['status']!='awaiting_user' or task['iteration']!=1:raise SystemExit('Unexpected state; inspect, no duplicate revision.')
if 'gameplay' in b.leases():raise SystemExit('Gameplay workspace leased; preserve owner.')
folder=b.folder(task['id']);worker=Path(json.loads((S/'브랜치목록.json').read_text(encoding='utf-8'))['branches']['gameplay']['path'])
source=ROOT/'게임/public/dev-previews/blond-scalp-v03';out=worker/'output'/task['id']/'v002-scalp'
proof=HERE/'사용자신규4안추가-v002.md'
proof.write_text('''# 사용자 기능 추가 요청

맥락: 금발전사 두상·얼굴 확대 신규4안을 제작했고 기존SD와 비교할 수 있는 갤러리를 제출했다. 기존 개발자도구 이미지 대조는 원본/이전4안×정면/45/90도15개를 전장배치·이동·50~200% 조절·삭제하는 임시 도구다.

사용자 최신 직접 지시: “이미지 대조 추가해봐”.

main01 이해 내용: 방금 제출한 신규4안을 기존 이미지 대조 도구에 추가해 같은 전장 배치/크기조절로 비교한다. 기존15개를 유지하고 신규4개는 실제 제작된 정면만 연결한다. 실제 병사·영웅 교체나 신규 측면 생성·공통비율 채택을 의미하지 않는다. 기존 기능과 자산을 명확히 특정한 직접 추가 지시를 실행 근거로 사용하며 같은 허락을 반복해 묻지 않는다.

별도 최신 저장 규칙: 기능 추가는 Git 저장 요청이 아니다. 이번 변경을 커밋·푸시하지 않는다.
''',encoding='utf-8')
baseline=[]
for name in ['devImageCompare.ts','devImageCompareArt.ts','devImageCompare.css']:
 p=ROOT/'게임/src'/name
 ui=Path('C:/Users/user/orca/workspaces/Grid Defenders/UI-전투화면')/'게임/src'/name
 assert p.read_bytes()==ui.read_bytes(), 'UI/root baseline differs; resolve before editing'
 baseline.append({'path':'게임/src/'+name,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
before=HERE/'신규4안-v002-사전확인.md'
before.write_text('''# 신규4안 추가 전 사전확인

규정A·메인운영규정·main01 작업방법·gameplay 분야규정·저장운영규정·도메인 안내/트리·기존모듈/이전검증/새manifest를 확인했다. 새이미지4안 추가는 기존 개발자 비교 도구의 승인된 입력/배치 기능 확장이며 최신 직접 지시를 실행 근거로 한다. 기능 선택은 미적합격이나 저장 허가가 아니다.

기존 기능 제작자 gameplay의 직전Task는 succeeded/retained다. gameplay 브랜치 점유 없음. 현재 활성 공유잠금은 effects뿐이므로 이3개 모듈 편집과 겹치지 않는다. root/UI 세 모듈 바이트 일치를 확인했다. gameplay는 자기 새output에서 구현·검수·패치만 작성하고 실제 UI는 UI 전용 작업 공간의 같은3모듈과 자산에 좁게 적용한 후 root 실행본에 반영한다. 기존 main.ts나 전투/재화/저장 로직은 수정 대상이 아니다.

허용범위: devImageCompare.ts/devImageCompareArt.ts/devImageCompare.css와 새4PNG/manifest의 리뷰용 추가, 실제 전장 임시배치. 기존15이미지·원본 생성물·이전결과/게임일반UI 유지. 새4안은 정면만 존재한다. 좌우반전/이전방향대체로 없는측면을 꾸미지 않는다.

완료기준: 이전15+신규4=19실제이미지 접근, 카드이름구분, 신규4의 클릭/드래그/개별선택/50·100·200/숫자크기/발선/삭제·닫기·전환, 정면만지원 고지와 방향입력 안전성, 기존방향 회귀/320px/48px/재화와실제유닛입력 분리. 구현자 격리실행·검수후 패치 제출, 통합후 main의 실제 실행본 확인. 사용자 화면 조작/자동커밋·푸시는 제외한다.
''',encoding='utf-8')
b.record(task['id'],'main01','revise',proof,'이미지 대조 추가해봐')
task=b.load(task['id'],'main01')
prompt=f'''# 이미지 대조에 신규 SD4안 추가 — {task['id']} / 차수2

main01 → 기존 게임개발 담당. 사용자 직접 지시 “이미지 대조 추가해봐”와 맥락: {proof}. 지금 승인된 개발자 전장비교 기능에 새로 완성된 두상·얼굴 확대4안만 추가한다. 이미 특정된 기능 추가 실행 지시이며 같은 확인을 반복하지 않는다. 새 그림 제작/실제유닛교체/공통비율채택은 제외다.

자기 작업방법·공통/분야 규정·이번차수·추가필독을 read-pack 본문으로 다시 읽고 차수2/역할gameplay의 문서별 적용 요약과 start 확인을 통과한 뒤 수정한다. 송신 직후 main01이 영수증을 연결한다. 직전 ACK를 재사용하지 않는다. 필요시 하위담당에도 방법/범위/필독을 전달한다. Sol/medium 기본을 유지한다. 저장운영규정도 읽고 커밋·푸시·예약저장하지 않는다. 실제 필요한 제작/검수 파일 작성만 한다.

## 기준과 편집 허용
현재 실제 기준은 {ROOT}/게임. 원래 자기 작업 공간의 오래된 게임을 최신으로 가정하지 않는다. root 및 UI 작업 공간의 원본은 read-only로 읽고, 자기 {out} 아래 새 격리검수사본/패치/자산/보고/스크린샷만 편집하라. 이전output/qa-game은 덮어쓰지 않는다.
최종 통합 파일은 게임/src/devImageCompare.ts,devImageCompareArt.ts,devImageCompare.css(필요한파일만) 및 게임/public/assets/dev-image-compare/scalp_face_v03/ 새4PNG/manifest로 제한한다. main.ts/실제유닛/전투/재화/일반저장/기존15PNG/다른 UI는 수정하지 않는다. 실제 UI 편집은 main01이 UI 작업 공간에 검토 패치를 적용한 뒤 root에 같은 바이트로 반영할 것이다.

## 새 원본
{source}/variant-1-front.png ~ variant-4-front.png 및 asset-manifest.json,report.md,검수.md. 원작품은 캐릭터작업공간의 scalp_face_v03이며 root 리뷰 사본은 생성원본바이트와 일치한다. 새manifest assets의 variant1~4에서 width,height,bodyHeight,footAnchor.x/y를 읽고 실제픽셀/발 기준점/알파를 보존한다. 2안은 다른 캔버스 비율이라1254정사각형을 하드코딩하지 않는다. 리샘플링·늘리기·보정그림 금지.

## 동작
기존 원본+이전4안×3방향15개를 유지한다. 새4안은 **정면만** 실제 존재하므로 총19개가 된다. 카드명이 기존1안과신규1안처럼 혼동되지 않게 기존/신규를 구분하고 신규1~4안이 찾기 쉬워야 한다. 필요하면 작은 묶음선택/제목을 사용하되 임의 축소로48px 터치 영역을 줄이지 않는다. UI는현재톤/패널에맞추고9개의선택이좁은화면에서도접근되어야한다.
새4안도 카드클릭→필드배치, 카드드래그, 복수배치/다시선택/이동, 크기50~200%와숫자입력/100리셋,선택삭제/전체삭제, 닫으면그림유지·게임입력복구, 웨이브/보스전환·재진입초기화,리사이즈발위치유지와dispose를 그대로 지원한다. 동일 전체키에서 실제 머리비중이 다른것을 볼 수 있어야 한다.
없는45/90도를 기존안의다른그림이나정면으로 위장하지 않는다. 새안 선택시 정면만지원 상태를 명확히 알리고 기존 방향이45/90일때도 새정면선택을 막지 않는다. 신규배치/선택 후 방향변경 시 없는자산 오류/다른안으로묵시교체/발점이동이 없어야 한다. 이전안으로돌아오면 이전3방향을다시사용할수있다. 필요한 asset ID/카드 인덱스/범위검증/도착개수하드코딩을함께확인한다. 기존동작을구분없이9개가정으로바꾸어옛방향을깨지않는다.

## 검수와 제출
바뀐부분에필요한유의미한검사를하고 새자산4개 SHA/알파/크기를확인한다. 기존15+새4선택/신규4클릭및드래그/50·100·200발점/선택격리/새정면제약→기존45·90복귀/재화·실제유닛분리/닫기·삭제·전환/320px접근·48px을 실제격리브라우저에서 확인한다. 자기별도프로필과서버만사용하고사용자브라우저·탭·창·localStorage를조작하지않는다. tsc/build를한다. 기존전체브라우저suite반복은변경범위와실패근거에따라판단한다.
{out}에 base-hashes.json, 변경manifest.json, 통합.patch(위3src만정확한root기준patch), 새4PNG+manifest, 실제검증보고/증거, 결과.json과필요한차수2기록을제출한다. 정확한변경파일·전후해시·소스출처·실행검사/미검증을main01에worker_done으로보낸다. 새output밖타파일을수정하지않는다. 자동커밋·푸시·저장작업/사용자화면조작없음.
'''
(folder/'요청확인.md').write_text(proof.read_text(encoding='utf-8'),encoding='utf-8')
(folder/'전문프롬프트.md').write_text(prompt,encoding='utf-8')
(folder/'2_사전확인.md').write_text(before.read_text(encoding='utf-8'),encoding='utf-8')
reads=list(dict.fromkeys([*task.get('additionalReadings',[]),str(proof),str(before),str(S/'저장운영규정.md'),str(source/'asset-manifest.json'),str(source/'report.md'),str(source/'검수.md')]))
b.set_readings(task['id'],'main01',reads);b.confirm(task['id'],'main01','이미지 대조 추가해봐',proof);plan=b.prepare(task['id'],'main01')
(HERE/'신규4안-v002-연결.json').write_text(json.dumps({'task':task['id'],'iteration':2,'folder':str(folder),'output':str(out),'source':str(source),'baseline':baseline,'plan':plan},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'task':task['id'],'iteration':2,'status':'prepared_not_sent','output':str(out)},ensure_ascii=False))

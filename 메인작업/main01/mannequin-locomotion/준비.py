from pathlib import Path
import importlib.util,json,hashlib
R=Path('C:/Users/user/Desktop/Grid Defenders');S=R/'작업관리';H=Path(__file__).resolve().parent
if (H/'연결.json').exists():raise SystemExit('Already registered; inspect existing task.')
spec=importlib.util.spec_from_file_location('board',S/'도구/작업대장.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);b=m.Board(S)
W=Path('C:/Users/user/orca/workspaces/Grid Defenders/캐릭터디자인2')
source=W/'output/characters/style1_blond_balor_three_views_main01-20261110-d820f076_v003/blond-right-035.png'
assert hashlib.sha256(source.read_bytes()).hexdigest()=='366b8073d944fea1849dd1795c4e36cdd63c2653f04ea9262a20d457670ee285'
quote='지금이작업은 이미지 작업이라기보단 코딩작업에 가까워보이니 GPT2.6은 사용하지않고 진행하자\nIdle 기본 대기\n시작/ Walk / Run / 정지'
approval='''# 사용자 확인 및 최신 제작 범위
앞서 main01이 제안한 작업: 금발 전사 비율의 우측3/4 단순 전신 마네킹 → 공통 뼈대 → 대기/걷기/정지의 전신 비교3안. 의상·헤어·장비·공격·스킬·실게임 통합은 제외, 부위 검사는 내부에서 하고 사용자는 전신 움직임을 확인. 기준 캐릭터를 새 화풍으로 재생성하는 작업이 아님.

사용자가 이번에 실행 승인과 범위를 직접 지정했다:
> '''+quote+'''

이는 위 제안을 코드 중심으로 진행하고 Run을 추가하는 실제 승인다. GPT2.6 사용 금지이며 이미지·영상 생성 모델/API 전체를 호출하지 않고 코드로 단순한 마네킹과 본 애니메이션을 만든다. 최종 모션/속도/게임 적용은 사용자 판정과 분리한다. 기존 A/B를 채택하거나 덮어쓰는 승인이 아니다.
'''
(H/'사용자확인.md').write_text(approval,encoding='utf-8')
pre='''# 사전 확인 — main01
공통 규정A/메인운영/팀장운영/자기 작업진행방법/분야 characters 규정·방법/작업대장·사용법/진행승인/메인보고형식/저장운영/파일담당표와 도메인 README·트리·캐릭터 색인을 본문 확인했다. 역할은 세계관/캐릭터, 제작 책임 characters. 같은 캐릭터 담당의 직전 B는 Orca 성공 settled/retained, Board 반환 awaiting_user이며 공용 브랜치 잠금은 비어 있었다. 표시상 liveness unverifiable를 종료 증거로 쓰지 않고 실제 성공 반환·Board 상태를 근거로 한다. 같은 담당에게 후속 전달하며 새 중복 편집자를 만들지 않는다.

최신 사용자의 진행하자 및 Idle/시작/Walk/Run/정지를 실제 승인으로 기록한다. 외부 생성·유료 이미지 API·env 열람 없이 코드 도형 마네킹, 공통 본, 전신 움직임3안을 만든다. 기존 PNG를 탈의 복원한 원화로 주장하지 않고 비율 참고를 사용한다. 사용자에게 새 허락을 반복 요청하지 않는다. 기존 A/B·원본·게임런타임·공통규정·UI·Git 상태를 보존하며 독립 새 output에만 제작한다. 검토 URL 연결은 main01이 사본으로 처리하고 사용자 화면을 조작하지 않는다. 새차수 필독 ACK/start 후 착수하도록 자동첨부한다.
'''
(H/'사전확인.md').write_text(pre,encoding='utf-8')
t=b.new('main01','characters','공통 마네킹 전신 이동3안 — Idle/Start/Walk/Run/Stop (코드 전용)',quote);tid=t['id'];F=b.folder(tid)
out=W/('output/characters/gc9_longsword_dagger/mannequin_locomotion_'+tid.lower()+'_v001')
prompt=f'''# {tid} 차수1 / main01 → characters

## 실제 사용자 확인과 목표
사용자 확인 본문: {H/'사용자확인.md'} . 최신 실제 발언의 “GPT2.6은 사용하지않고 진행하자 / Idle 기본 대기 / 시작/ Walk / Run / 정지”를 적용한다. 기존 의상 포함 팔리깅 A/B에서 연결 경계 문제가 보여 사용자가 공통 신체→움직임→후속 외형 연결 순서를 제안했다. main01의 전신마네킹·3안 비교 제안 후 위 진행 승인을 받았다. 추가 승인은 묻지 않는다. 마네킹 신체·움직임 시험이 이번 목표다.

## 참조·신체 표현
실제 참조 {source} (SHA366b8073d944fea1849dd1795c4e36cdd63c2653f04ea9262a20d457670ee285)를 먼저 직접 열어라. 얼굴·현재 양팔 대기포즈를 베껴 고정하는 것이 아니라 채택된 캐릭터의 머리/몸통/팔/다리 길이와 체형 관계를 참고한다. 기본 카메라 우측35도 전면3/4, 얼굴 일부·앞몸통이 보이며 오른쪽 진행성이 명확해야 한다. 앞/뒤 팔과 다리의 투영·색 차이로 입체적인 겹침 순서를 구분한다. 정측면 졸라맨으로 바꾸지 않는다.
새 마네킹은 SVG/Canvas 등 코드로 그린 단색의 단순한 머리/목/상체/골반/위팔/아래팔/손/허벅지/종아리/발 형태다. 헤어·옷·갑옷·장비·근육 상세/성기 상세 없이 비해부학적인 매끈한 인체 모형으로 만들며 눈은 방향 확인 표시만 유지한다. 머리카락 꼭대기를 두상 꼭대기로 잡지 말고 실제 정수리~턱과 헤어를 구분해 비율 근거를 남긴다. 가려진 몸의 추정치와 단순화는 설명하고 원본 알몸 정답을 복원했다고 주장하지 않는다. 모든 안은 같은 신체/본길이를 쓰며 기존 채택 스타일/비율을 새 기준으로 덮어쓰지 않는다. 필요하면 참고원본/마네킹 정지비교도 제공한다.

## 코드 전용·범위
GPT Image2.6 및 내장 imagegen 포함 모든 이미지/영상 생성과 외부 제작 API 금지. 키·env를 읽거나 API연결 테스트하지 마라. 로컬 코드/본/벡터 도형과 브라우저로 만든 캡처·영상만 허용. 래스터 캡처는 결과 기록이며 생성모델 작업이 아니다. 기존 코드의 유용한 행렬·검수 유틸은 읽기 전용 참고/복사하되 A의 오른팔 고정 시험을 전신 리깅 완료인 것처럼 쓰지 말 것.
허용 편집: 새 {out} 및 이 작업 번호의 실질 5종 기록. 기존 A/B·원본·캐릭터 카탈로그/스타일규정/기존도구/공통규정/게임 src·설정은 수정금지. 실제 의상·헤어 연결, 공격/피격/사망/스킬/장비, 다른 체형/방향, 게임적용·배포·커밋·푸시·화면/탭 조작은 이번 범위 밖이다. 사용자 지시가 코드 작업이므로 이전 이미지 생성 스킬 기본 경로를 사용하지 않는다.

## 공통 뼈대와 동작
Root→Pelvis→Torso→Chest→Neck→Head, 좌우 UpperArm→Forearm→Hand, 좌우 Thigh→Shin→Foot를 기본으로 재사용 가능한 이름·계층으로 구현한다. 본길이와 관절 위치는 단일 데이터에서 관리하고 확대·축소는 전신 등비로만 한다. 루프마다 부위 길이/얼굴 크기가 바뀌지 않게 한다. 바닥 발 접촉과 골반 높이 제어, 자연스러운 무릎 굽힘, 팔/다리 역상 움직임 및 상체 보조 회전을 포함한다. IK가 발 고정에 도움이 되면 수학 기반 2본 IK를 사용해도 된다. 단순 완성 그림 전체 회전/화면 상하 흔들림만으로 걷기를 대신하지 않는다.
필수 상태: Idle / Start(Idle→Walk 및 Idle→Run 출발) / Walk / Run / Stop(걷기/달리기→Idle). Walk와 Run은 단순 속도차만이 아니라 접지·체공·보폭·몸 기울기와 팔 움직임의 차이가 보여야 한다. 시작은 무게 이동/가속, 정지는 감속/발 디딤/중심 회수로 이어지며 갑작스러운 기본포즈 스냅을 피한다. Walk→Run 전환을 포함한 자동 시퀀스 Idle→Start→Walk→Run→Stop→Idle와 각 상태 단독재생을 제공한다. 어디서 정지를 눌러도 긴 루프를 기다리거나 발이 순간이동하지 않도록 지지발을 고려한다. 최종 속도는 사용자 결정이며 시연의 주기/이동량은 임시 값으로 표시한다.

## 3안과 비교 플레이어
같은 체형/카메라/크기/상태 타임라인/배경/같은 상태별 기본주기에서 전신 모션 3안을 만든다: 1 절제된 움직임, 2 무게 이동과 디딤이 명확한 기본형, 3 역동적인 탄성과 팔 스윙이 있는 형. 차이는 속도만 바꾸지 말고 상체·골반·팔·발 궤적과 타이밍 구성에서 보여야 한다. 세 안 모두 과한 고무 늘어남과 인체 접힘을 피한다. 세 안의 차이/장점/한계를 짧게 설명하되 사용자 대신 선택하지 않는다.
index.html: 동기 재생/일시정지/다시시작/스크럽/속도 변경, 전체순환·Idle·Start·Walk·Run·Stop 선택, 뼈대/관절/발 접촉 표시 토글, 밝음/어두움/필드 유사 배경, 확대와 57/72CSSpx 비교. 전신 시연이 우선이며 파츠펼침은 내부 검수 자료로 충분하고 문제가 있으면 관절 확대를 제공한다. 제자리 시험의 지면/루트 이동 기준을 분명히 하여 발 미끄러짐을 속이지 마라. 이동 표시를 넣으면 테스트 바닥만 움직이거나 전진 루트를 써도 되지만 우측 전진이고 좌측으로 돌아 걷는 연출은 넣지 않는다. 캔버스 클리핑으로 머리/발이 잘리지 않게 한다.

## 검증·납품
공통 인간형 걷기/달리기 원리를 공식 기술 문서나 공식 게임의 실제 이동 연속 장면으로 조사하고 출처/참고 구간/이번 적용점을 기록하라. 기존 A의 공격 참고를 이번 이동 근거로 그대로 재사용하지 말 것. 연구/생성 비용 없이 공개 자료만 사용한다.
실제 headless 격리 재생으로 로딩/재생/정지/스크럽/상태 연결/3안 차이/57·72 및 밝은 배경 전신을 검사. 전체 루프와 시작/정지 임의 위상, 발 지지와 지면 관계, 무릎/팔꿈치 틈, 앞뒤 겹침/방향, 발/머리 잘림, 길이 불변을 수치+중간/극점 연속 캡처로 검증한다. 제자리 좌표에서 발이 움직이는 것과 실제 지면 미끄러짐을 구분하고 측정 조건/오차/남은 한계를 기록한다. 불가능하거나 미달인 부분을 숨기지 말고 명시하라. 실게임/실기기 검증으로 과장하지 않는다.
rig/동작 데이터·소스, 마네킹 정지모습, 실제 동기 재생 플레이어·짧은 WebM 또는 동등한 움직임 증거, report.md/검수.md/파일manifest·검증JSON·실질5종기록을 제출한다. 외부 생성/API호출0을 코드·작업기록으로 확인하고 A/B 원본 보존 SHA를 기록한다. 모든 외부 파일 참조는 새 폴더 안의 상대 경로로 만들어 main01의 로컬 dev-previews 사본 배포가 가능하게 한다. 새 작업 read-pack 본문→새ACK→start 후 착수하며 이전 작업 ACK는 재사용하지 않는다. 완료 시 worker_done으로 main01에 실제 결과 경로/검수/남은 문제를 회신. 성공 기준은 이번 시제품의 상태별 전신 모션이 실제 동작하고 비교·검증 가능한 것, 사용자 합격·최종속도·의상·게임 통합은 미완료로 둔다.
'''
(F/'요청확인.md').write_text(approval,encoding='utf-8');(F/'전문프롬프트.md').write_text(prompt,encoding='utf-8');(F/'2_사전확인.md').write_text(pre,encoding='utf-8')
for name,body in [('1_대화기록.md',approval),('3_작업일지.md','# 작업일지\n사용자 진행 승인과 범위 확인. 본문 필독·착수 후 캐릭터 담당 제작 예정. 아직 제작/검수/합격 없음.\n'),('4_정의문서.md','# 정의\n코드 전용 우측3/4 공통 인간형 전신 마네킹과 Idle/Start/Walk/Run/Stop 비교3안. 각 세부사항은 전문 지시 참조.\n'),('5_버전관리.md','# 버전 상태\n새 출력 폴더 v001. 기존 A/B와 게임 원본 보존. 사용자 저장 요청 없으므로 커밋·푸시 없음.\n')]: (F/name).write_text(body,encoding='utf-8')
b.set_readings(tid,'main01',[str(H/'사용자확인.md'),str(H/'사전확인.md'),str(S/'진행승인규칙.md'),str(S/'저장운영규정.md'),str(S/'메인보고형식.md')])
b.confirm(tid,'main01',quote,H/'사용자확인.md');plan=b.prepare(tid,'main01')
(H/'연결.json').write_text(json.dumps({'task':tid,'iteration':1,'folder':str(F),'output':str(out),'plan':plan,'state':'prepared_not_sent'},ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'task':tid,'output':str(out),'prompt':plan['prompt'],'status':'prepared_not_sent'},ensure_ascii=False))

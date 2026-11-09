# MAIN01-20261109-1DA15A51 독립 QA / 차수1

기술 검증 PASS. 실제 root5173 통합본에서 새 Edge headless 프로필로 직접 조작한 40항목 전부 PASS, 런타임 예외 0건이다. 사용자 미적 합격과 실기기/APK 인증은 별도다.

대상은 `C:/Users/user/Desktop/Grid Defenders/게임`이다. 최초 접속은 `http://127.0.0.1:5173/battle-landscape.html?battle=normal&from=camp`; 로드 후 개발자 무한 테스트 버튼으로 동일 전장을 초기화하고 일시정지해 비교 조작을 검사했다. 보스와 웨이브 전환은 개발자 버튼으로 수행했다. 테스터 초기 게임 사본을 실행하지 않았다. root5173와 기존 사용자 앱·브라우저·탭·프로필·localStorage는 조작하지 않았으며 검사 전용 Edge/CDP9347만 종료했다.

|검사|결과와 증거|
|---|---|
|로드·이미지대조 버튼 1개|PASS, 실제 활성 버튼과 패널 관찰|
|원본/1~4안 × 정면/우45/우90|PASS, 패널에서 15개 선택·배치 및 모두1254×1254 디코드. all15-live.png|
|복수 배치·선택·드래그|PASS, 실제 마우스 이동. 선택대상만 방향/숫자크기 변경하고 다른14개 원본/위치/크기 유지|
|50/100/200%·숫자입력|PASS, 부분숫자1 허용/150 적용/300 커밋200 제한. 각 세 배율에서 원본 가로세로 비율과 footX/Y 기준 실제 이미지 발점 오차0.1CSSpx 미만|
|터치·취소·ESC·블러·닫기|PASS, CDP touch 배치; pointercancel/blur/resize 후capture 해제·추가이동 없음. ESC 그림유지, 재열기 유지, 드래그중 닫기도 고스트이동 없음|
|삭제·입력복구|PASS, 개별/전체삭제. 닫은 그림 pointer-events none; 병사 guard와 영웅 blond 실제 전장클릭 소환. 배치모드 해제와 재선택도 검사|
|재화/유닛/저장 분리|PASS, 미리보기 전후 gold480 및 실제 units 동일. 자동저장 안정화 후 savedAt만 제외한 전체 localStorage 저장객체 동일. 미리보기의 실제 정원 소비 없음|
|전환·리사이즈|PASS, 웨이브→보스→웨이브 미리보기/선택/패널 초기화. 보스1250월드/800CSS 좌표와 발점 유지.960×440 리사이즈 후 필드와 레이어 정렬·월드좌표 유지|
|작은 화면|PASS,800×360·320×640 패널 경계/최소48px 버튼. 기존800px 전장의 가로스크롤 유지. narrow-320.png|
|통합·자산|PASS,root/UI40파일 SHA256 일치.3모듈+main.ts7행추가/1행교체.15PNG 제작원본 바이트/크기/alpha32Bounds 일치.45/90은 정면 mirror와 다름|

재현: 이 워크스페이스에서 `node output/MAIN01-20261109-1DA15A51/independent-browser.mjs` 및 `python -X utf8 output/MAIN01-20261109-1DA15A51/asset-audit.py`. 기존5173이 준비되어 있어야 하며 Edge 설치 경로와 비어 있는9347포트를 사용한다. 매 실행마다 output 아래 새 프로필을 생성한다. browser-result.json은40개 개별체크와 저장 전후 상태, result.json은 PASS/FAIL/미검증, target-hashes.json은40개 대상해시, asset-audit.json은15PNG 실측을 담는다.

제작자 browser-check.mjs는 방법 참고로 읽고 output에 복사해 실제5173로 변경했다. 제작자31PASS를 그대로 인용하지 않았다. fixture 대신 실제 게임에서 터치/ESC/blur/취소/15개배치/선택격리/세배율발픽셀/리사이즈/드래그중닫기를 추가했다. 정적 전체 프레임은 별도 about:blank에 실제 PNG 바이트를 data URL로 표시했다.

검사 도구의 초기 실패를 구분했다. PowerShell→Python 한글인코딩, CDP 전역const 중복선언, 카드드래그후500ms 클릭억제, 방향교체시 기존선택 변경, 일시정지직전 저장의 갱신 대기, about:blank localStorage 접근 및 origin 이미지차단을 도구에서 교정했다. first-run-result.json은 처음 정적갤러리 방식이 실행게임 DOM을 지워 발생시킨 예외 기록이며 제품결함으로 판정하지 않는다. 최종 새프로필에서40PASS/예외0이다.

밝은/어두운 전체캔버스15장과 실제 웨이브/보스/320px 스크린샷을 view_image로 열람했다. 깨진그림·불투명 사각배경·원본캔버스 잘림을 관찰하지 않았고 정면/우사선/우측면 및 장검/단검 방향 차이를 확인했다. footX는 제작팀 지지중심 추정±20원본px,footY는±3원본px 한계를 유지한다. 이번 발점 검사는 이 메타데이터 기준 등록을 확인한 것이다. 방향별 얼굴·장식·키의 세부 일관성 최종수용은 사용자에게 남긴다.

미검증: 실기기/APK/WebView/실제 멀티터치·OS앱전환, 세로 전투, 장기 자연 웨이브진행, 기존15browser suites, 제작자 isolated dispose2회 fixture. blur/resize/pointercancel은 일부 합성 이벤트이며 CDP 터치와 실제 마우스드래그를 함께 사용했다. root tsc/build는 메인의 통과 보고를 참고하되 이번 QA에서 다시 실행하지 않았다. 제품수정·커밋·푸시0건이며 수정 의뢰할 재현 제품결함은 발견하지 못했다.

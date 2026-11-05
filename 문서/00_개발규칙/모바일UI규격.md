# 공통 모바일 UI 규격
사용자 요청: 로비부터 상점·영웅·전투·병영·기록까지 모든 메뉴에 같은 APK/안드로이드 앱 크기 기준을 사용한다.

Android에는 APK용 고정 필수 해상도가 없다. 본 프로젝트는 360×800 논리 화면을 설계 기준으로 선택하며 실제 기기 폭/높이에 반응한다. 1080px 등 물리 해상도에 UI 크기를 고정하지 않는다.

## 프로젝트 공통값
- 구현: 게임/src/mobile-ui.css. 모든 메뉴에서 재사용한다.
- viewport: device-width, initial-scale=1, viewport-fit=cover. 사용자 확대 제한 없음.
- 폭: 기기 폭 100%, 넓은 화면에서는 최대 480 CSS px의 세로 게임 틀. 최소 검증 폭 320px.
- 높이: 최소 100dvh, 콘텐츠가 길면 세로 스크롤. 화면별 임의 확대/축소 없음.
- 여백: 기본 좌우 12px, 요소 간격 8px. 기기 안전 영역은 env(safe-area-inset-*) 추가.
- 터치: 최소 48×48 논리 영역. 그림 자체는 보통 24~32px.
- 글자: 주요 본문/버튼 14px, 보조 12px, 제목 20~22px. 이 글자 크기는 프로젝트 선택값이며 Android 의무 수치가 아니다.
- 영웅 목록: 4×4 유지. 상세 스킬/장비는 전체 폭 4칸으로 배치하여 터치 크기를 확보한다.

## APK 통합 경계
현재 적용 범위는 독립 로비/영웅 UI 및 준비 중 메뉴의 공통 틀이다. 기존 실제 게임 코드와 연결하지 않았다. 상점·전투·병영·기록의 독립 페이지를 만들거나 실제 게임을 통합할 때 동일 스타일을 사용한다.
WebView에서는 viewport와 폰트 확대를 검증하고, 네이티브 시스템 바/컷아웃 inset을 전달하거나 네이티브에서 한 번만 소비한다. 실제 APK 빌드 및 실기기 인증을 수행한 것으로 간주하지 않는다.

## 근거
- Android 접근성의 터치 영역 권장: https://developer.android.com/guide/topics/ui/accessibility/views/apps-views
- Android 시스템 안전 영역: https://developer.android.com/develop/ui/compose/system/insets

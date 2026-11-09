# 캐릭터 제작 모음 갱신

프로젝트 루트에서 `node tools/character-catalog/build.mjs`를 실행한다. 외부 API나 이미지 생성 도구를 호출하지 않는다. Windows PowerShell·System.Drawing과 Node.js 기본 모듈을 사용한다.

`scan-images.ps1`은 정해진 이미지 폴더에서 크기·실제 알파·SHA-256을 수집한다. `build.mjs`는 이전 갤러리의 제목과 설명을 유지하면서 제작 묶음·캐릭터·방향·버전·참조를 분류하고 바이트가 같은 사본을 연결한다. `gallery.template.html`은 기존 갤러리 주소로 출력한다.

산출물은 `output/characters/catalog/`와 `output/characters/char001/gallery.html`이다. 이미지와 프롬프트는 옮기거나 다시 인코딩하지 않는다. 분류 로직·화면만 수정했을 때는 `node tools/character-catalog/build.mjs --skip-scan`으로 이미 수집한 메타데이터를 재사용할 수 있다.

자세한 분류 의미와 추가 방법은 [정리 기준](../../output/characters/catalog/정리기준.md)을 따른다.

주 탐색은 왼쪽 출신 대륙과 오른쪽 클래스이며 상단 전체 클래스에서는 대륙 조건을 해제한다. 기본 화면은 캐릭터별 묶음이고 개별 이미지 보기와 기존 7개 보관 분류도 유지한다.

분류 원본은 자료/캐릭터설정/캐릭터목록.json, 제작 순서는 제작순서.json이다. 출신·소속·정식 직업·배운 공격 계열을 구분하고 미정인 설정은 미지정으로 남긴다. 새 폴더를 등록할 때는 이미지 분류와 프로필을 함께 등록한다.

첨부자료와 이전 작업물은 수석 빛 마법사 시안을 포함해 현재 세계관에 배치하지 않는다. 기존 프로필은 placement_status:deferred, origin_id:unassigned, affiliation_ids:[]로 보관하며 빌더도 이 조건을 확인한다. 신규 제작부터 출신·소속을 지정한다.

브라우저 동작 검사는 browser-checks.js를 공유하며 verify-browser.mjs에 Orca 페이지 ID를 전달해 실행한다. 원본 100% 보기·다운로드 경로·대륙과 클래스 교차 필터·전체 클래스·구형 묶음 주소를 확인한다.

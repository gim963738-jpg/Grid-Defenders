# MAIN01-20261110-D11FE5E5 / 차수1 / characters

남녀 35도·90도 전신4장과 파츠판4장, 완전 개별 파츠64개를 제출한다. 35도 전신2장은 사용자 선택 A 원본의 바이트 사본이며 새 생성으로 세지 않는다. 90도 전신2장과 복원 donor 시트4장은 기존 GPT Image2.6/high 경로의 실제 6회 성공 결과다. 원시 PNG와 프롬프트/입력 해시를 보존했다.

## 파일 구조와 적용 조건

- full.png: 생성 반환 원본 또는 선택 원본의 바이트 사본. 4개 모두 1024×1536 RGBA.
- parts/*.png: 완전 donor 실루엣/관절 캡과 호환되는 원본 내부 픽셀. 숨은 형태는 AI 추정이다. 머리는 원본 가시 추출 유지, 35도 발은 원본 발끝 방향 유지와 발목 캡을 사용한다.
- visible/*.png: 원본 가시 픽셀의 상호 배타적 정확 추출. 원본 RGBA가 남으며 완전한 숨은 형상을 의미하지 않는다.
- restored/*.png: parts 중 원본 내부 재사용 외의 추정 복원 부분. 원본 소유 마스크와 별도다.
- render-masks/*.png: 바인드0 화면 가림. 완전 PNG에 bake하지 않는다.
- bind0-parts/*.png: 완전 PNG의 숨은 겹침 부분 + 해당 부위의 원본 정확 가시 추출을 사용하는 **원본 자세용 재질 변형**. 이것만 manifest 순서·동일좌표로 합성한 것이 reassembled.png다. 원본 full.png를 위에 덮어 합격처럼 보이지 않았다.
- reassembled-unoccluded.png: parts/*.png 완전 형상 전체를 직접 겹친 노출 비교. 바인드0 재질 전환/가림을 쓰지 않아 원본과 윤곽·색면·폭이 다르다. 이 결과의 차이를 숨기지 않는다.
- reassembled-visible.png: 가시 추출만 합성한 정확 분할 진단. 완전 파츠 품질 증명으로 사용하지 않는다.
- parts-manifest.json: 부위별 원본/cell/crop/SHA, 원점(0,0), 등비 배율, offset, 추정 pivot(±25px), 부모/인체 좌우, 각 파일/마스크/재질 정책.

## 실제 보완 이력

초기 원본·donor 단순 합집합은 이중 윤곽/옷 조각을 만들었다. 가림 제한을 완전 파츠 파일에 bake한 잘못된 보완은 파편과 큰 구멍을 만들었고 총괄 검수로 반려되어 복구했다. initial-processing / before-occlusion-refinement / masked-attempt에 이력을 보존했다. 최종은 완전 donor 외곽을 parts에 복구하고 화면 가림·가시 원본 재질을 별도로 분리했다. source/donor 색 차가 큰 내부 픽셀을 억지로 붙이지 않고 색 차 ≤6인 호환 내부만 재사용해 내부 이중 선을 줄였다. 골반 가시 소유와 레이어 순서를 보완했고, Torso pivot은 저알파 외곽 잡음 bbox 대신 실제 허리 겹침으로 정정했다.

추출/등록은 crop, 알파 마스크, 등비 bicubic donor 등록 및 표시 순서만 사용했다. 파츠 RGB 신체를 코드로 그리지 않았으며 비균일 늘림/반전은 사용하지 않았다. derivative donor alpha<16 정리는 원시 PNG와 별도인 추출 단계다. 완전 90도 먼쪽 L6씩은 독립 생성 donor를 사용하며 양쪽을 단순 반전하지 않았다.

## 판정과 한계

완전 외곽의 개별 파츠 및 정지 바인드 자료 납품이며 사용자 미적 합격/리깅 완료/걷기/실게임 통합은 아니다. 원본 정확 추출과 완전 복원 세트는 서로 다른 목적이며 완전 PNG 자체가 원본 RGBA 동일하다고 주장하지 않는다. 특히 무가림 합성에는 어깨/소매, 목, 골반과 허벅지, 발목의 등록·형상 차이가 남는다. 바인드0용 가림/재질 변형이 없어도 그대로 움직일 수 있다는 보장이 없다. 숨은 인체·옷 뒷면의 실제 모습은 원본에서 검증 불가능하고, pivot/연결은 정지 2D 추정이다. 회전 극점/동작 검사는 이번 범위에서 수행하지 않았다.

## API 실제 사용

6 POST / 6 성공, 자동 재시도0, 추가 유료보완0. 요청 preset sunburst-2.6-high / model gpt-image-2.6-sunburst / high / n1 / transparent. 실제 입력12452, 출력8232, 합계20684 tokens. 응답 모델명과 금액은 미보고(null)이며 임의 추정하지 않는다. 호출 전 로컬 JSON BOM 오류를 수정한 1건은 HTTP0 단계였고 유료 재시도가 아니다. 기존 adapter/env를 수정하지 않았고 키는 메모리에서만 읽었다. 실제 비밀 누출 검사는 secret-scan.json 참조.

## 주요8파일 절대 경로

- C:\Users\user\orca\workspaces\Grid Defenders\캐릭터디자인2\output\characters\gc9_longsword_dagger\body_parts8_main01-20261110-d11fe5e5_v001\male-035\full.png
- C:\Users\user\orca\workspaces\Grid Defenders\캐릭터디자인2\output\characters\gc9_longsword_dagger\body_parts8_main01-20261110-d11fe5e5_v001\male-035\parts-board.png
- C:\Users\user\orca\workspaces\Grid Defenders\캐릭터디자인2\output\characters\gc9_longsword_dagger\body_parts8_main01-20261110-d11fe5e5_v001\female-035\full.png
- C:\Users\user\orca\workspaces\Grid Defenders\캐릭터디자인2\output\characters\gc9_longsword_dagger\body_parts8_main01-20261110-d11fe5e5_v001\female-035\parts-board.png
- C:\Users\user\orca\workspaces\Grid Defenders\캐릭터디자인2\output\characters\gc9_longsword_dagger\body_parts8_main01-20261110-d11fe5e5_v001\male-090\full.png
- C:\Users\user\orca\workspaces\Grid Defenders\캐릭터디자인2\output\characters\gc9_longsword_dagger\body_parts8_main01-20261110-d11fe5e5_v001\male-090\parts-board.png
- C:\Users\user\orca\workspaces\Grid Defenders\캐릭터디자인2\output\characters\gc9_longsword_dagger\body_parts8_main01-20261110-d11fe5e5_v001\female-090\full.png
- C:\Users\user\orca\workspaces\Grid Defenders\캐릭터디자인2\output\characters\gc9_longsword_dagger\body_parts8_main01-20261110-d11fe5e5_v001\female-090\parts-board.png

갤러리: C:\Users\user\orca\workspaces\Grid Defenders\캐릭터디자인2\output\characters\gc9_longsword_dagger\body_parts8_main01-20261110-d11fe5e5_v001\index.html

비교: C:\Users\user\orca\workspaces\Grid Defenders\캐릭터디자인2\output\characters\gc9_longsword_dagger\body_parts8_main01-20261110-d11fe5e5_v001\comparison.png

검수: C:\Users\user\orca\workspaces\Grid Defenders\캐릭터디자인2\output\characters\gc9_longsword_dagger\body_parts8_main01-20261110-d11fe5e5_v001\검수.md

manifest: C:\Users\user\orca\workspaces\Grid Defenders\캐릭터디자인2\output\characters\gc9_longsword_dagger\body_parts8_main01-20261110-d11fe5e5_v001\asset-manifest.json

## 보존·미실행

21개 ACK 해시와 이전4장 작업 보존 snapshot은 최종 재검증 동일. 새 출력/이번 작업기록 외 수정 없음. 기존 원본/API 원시 반환 바이트를 보존했으며 사용자 창·탭·패널·Git·게임·공통규정·카탈로그·다른 모델을 변경하지 않았다. 리깅/영상/애니메이션/텍스트API·추가 결제·충전은 미실행이다. 사용자 평가와 후속 리깅 여부는 총괄에게 이관한다.

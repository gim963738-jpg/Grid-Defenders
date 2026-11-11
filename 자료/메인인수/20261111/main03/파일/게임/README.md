# Grid Defenders — 실행과 검증

기준일 2026-11-07 / WEB-179. PixiJS 8.22.0, TypeScript 7.0.2, Vite 8.3.5 기반 웹 시제품이다. 전체 상태는 [현재 구현 현황](../문서/05_프로젝트정의/현재구현현황.md), 사업·통합 결과는 [종합 보고서](../문서/06_프로젝트종합보고/2026-11-07/프로젝트종합보고서.md)를 따른다.

## 실행

게임 폴더에서 실행한다. 처음 설치하거나 잠금 파일이 바뀌었을 때 npm ci로 의존성을 설치한다.

```sh
npm ci
npm run dev
```

Vite가 출력하는 로컬 주소를 연다. 기본 로비는 index.html, 실제 가로 전투는 battle-landscape.html?battle=normal&from=camp이다. battle=infinite-test는 패배·시간 제한을 완화한 개발 모드다. lobby-preview.html, battle-landscape-preview.html은 별도 시안 진입점이다.

## 검증·빌드

```sh
npm test
npm run build
npm run preview
```

- npm test: 소스·테스트 타입 검사와 Vite SSR 기반 세로·가로 모델 검사. 새 .check.ts 파일은 실행기 분류에 등록한다.
- 모델 검사는 27개 파일을 화면 조건별로 실행한다. 세로 전용 1건은 가로에서 대상 아님으로 출력한다. DOM·캔버스·WebGL이 필요한 15개 파일은 별도 브라우저 검사가 필요하며 이 명령에서 실행하지 않는다.
- npm run build: 소스 타입 검사와 4개 진입점 프로덕션 빌드. dist는 재생성 산출물이다.
- 모델 통과는 실제 렌더링·터치·기기 저장 복귀 성공을 뜻하지 않는다.

브라우저11개 검사는 Vite의 /tests/browser-check.html 전용 페이지에서 [재실행 JS](../문서/06_프로젝트종합보고/2026-11-07/브라우저검증_재실행.js)를 실행한다. 검사는 해당 페이지의 DOM을 교체하므로 실제 게임 탭에서 실행하지 않는다. 결과는 window.audit에 기록한다.4개 육안 연출 갤러리는 별도다.

## 주요 모듈

| 모듈 | 책임 |
|---|---|
| defenseConfig.ts, defense.ts | 웨이브 설정·소환·아이템·배치·전투 상태 |
| bossBattle.ts, gameRun.ts | 보스 전투·웨이브 전환·종료 판정 |
| main.ts, landscape-entry.ts | 화면 연결·입력·전투 진행·가로 UI |
| landscape-inventory.ts | 장비 배치·경계·조합 연결 |
| battleSave.ts, battleContinuation.ts | 로컬 체크포인트·중단/복귀 |
| campProgress.ts, training.ts | 로비 보상·기록·병사 성장 |
| mobile-ui.css | 화면 공통 모바일 기준 |

## 아트 재생성

외부 작업 폴더 없이 [보관 원본](../자료/아트원본/README.md)으로 슬라임·금발 전사 아틀라스를 재생성할 수 있다. scripts/pack-slime-art.ps1, scripts/pack-blond-art.ps1의 기본 입력은 자료/아트원본이다. 검토할 때 -OutputRoot를 별도 폴더로 지정하면 배포 이미지를 덮어쓰지 않고 비교할 수 있다. 원래 위치와 SHA-256은 manifest에 남긴다.

## 현재 한계

로비 영웅과 전투 명단 통합, 진형 편집, 강제 튜토리얼, 40웨이브 최종 콘텐츠, 계정·결제는 완료되지 않았다. 수치·경제·보상은 임시이며 출시 밸런스가 아니다. 브라우저 저장은 기기·브라우저 단위이며 계정 동기화가 없다. 개발 도구는 현재 화면에 노출되어 있다.

WEB-178까지의 설명은 [게임 README 역사 보관본](../문서/03_작업기록/게임README_WEB001-178.md)에 보존했다.

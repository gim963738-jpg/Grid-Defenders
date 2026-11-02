# Grid Defenders — 웹 실행 기반

PixiJS + TypeScript + Vite. 현재는 세로형 렌더링 실행 확인만 구현했다. 전투·소환·장비·최종 UI는 포함하지 않는다.

## 실행 (PowerShell)
```powershell
Set-Location -LiteralPath 'C:\Users\user\Desktop\Grid Defenders\게임'
npm.cmd ci
npm.cmd run dev
```
출력된 Local 주소를 브라우저에서 연다. 종료: 터미널에서 Ctrl+C.
PowerShell 실행 정책을 바꾸지 않도록 npm.cmd를 사용한다.

## 확인과 빌드
```powershell
npm.cmd run check
npm.cmd run build
npm.cmd run preview
```
배포용 파일은 dist에 생성된다. index.html을 직접 더블클릭하지 말고 서버로 실행한다. 실제 호스팅·Google Play 배포는 이번 범위에 포함하지 않는다.

## 임시 화면
- 기준 크기 390×694, 좁은 화면에서는 비율 유지 축소.
- 중앙 사각형과 문구는 렌더링 진단용이며 게임 UI가 아니다.
- 정확한 패키지 버전은 package.json·package-lock.json 참조.
- 확인 환경: Windows Node.js 26.13.0, npm 11.20.0. 최소 요구 버전은 각 패키지의 engines를 확인한다.

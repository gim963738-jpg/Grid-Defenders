# Grid Defenders 아트 원본 보관

현재 게임이 사용하는 금발 전사와 슬라임의 원본을 기준 프로젝트 안에 보관한다. 기존 작업 공간의 원본은 이동하거나 수정하지 않았으며, 이미 적용된 그림과 동일한 입력만 SHA-256으로 확인해 복사했다. 이 폴더는 `게임/public` 밖에 있으므로 게임 배포물에 포함되지 않는다.

## 구성과 사용

| 보관 위치 | 원래 작업 공간 | 현재 사용처 |
|---|---|---|
| `character-design/characters/gc9_longsword_dagger/pixel_8views_v01/images/` | 캐릭터디자인2의 `output/characters/…` | 금발 전사 8방향·정면 초상화 입력 8장 |
| `character-design/animation/dreamina-right-walk-60-v01/` | 캐릭터디자인2의 `output/animation/…` | 오른쪽 걷기 60프레임 원본 시트·좌표·검수 기록 |
| `monster-design/round-slime/eight_views_v01/` | 몬스터-디자인의 `output/monsters/round-slime/…` | 노랑·파랑·빨강 슬라임 8방향 입력 총 24장 |
| `monster-design/round-slime/yellow-right-ripple-30f-v01/` | 몬스터-디자인의 같은 산출물 폴더 | 노란 슬라임 물결 30프레임 원본·좌표·검수 기록 |
| [shop/merchant.png](shop/merchant.png) | 기준 프로젝트의 `게임/public/assets/shop/merchant.png` | 현재 미사용 상인 원본의 비배포 보관 |

원본 41개를 외부 작업 공간에서 복사했고, 기존 상인 원본 1개를 이동했다. 개별 원본 경로·브랜치·검토 커밋·바이트 수·해시·원본 수정 시각은 [manifest.json](manifest.json)에 기록했다. 원본 생성물은 작업 공간의 미추적 파일이었으므로 커밋 번호만으로 그 바이트를 재현할 수 없다. 이 보관본과 해시가 해당 시점의 파일 상태를 식별한다.

상인 원본의 이전 주소는 WEB-021 기록과 과거 백업 manifest에 남아 있다. 역사 기록과 백업은 수정하지 않으며, 이 표와 `manifest.json`의 `relocations`가 현재 위치를 연결한다. 실제 사용 중인 `merchant-cutout.png`와 `merchant-silver-cutout.png`는 기존 배포 경로를 유지한다.

## 재현

두 패커의 기본 입력을 이 폴더로 변경했다. 실행 위치와 관계없이 스크립트 위치를 기준으로 원본을 찾으며, 필요하면 기존 `-SourceRoot` 인자를 계속 사용할 수 있다.

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ./게임/scripts/pack-slime-art.ps1
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ./게임/scripts/pack-blond-art.ps1
```

위 명령은 기존 런타임 출력 경로를 갱신한다. 비교 검증만 할 때에는 `-OutputRoot`로 별도 폴더를 지정한다. `-ExecutionPolicy Bypass`는 해당 프로세스의 스크립트 실행에만 적용하며 시스템 설정을 변경하지 않는다. 패커는 Windows PowerShell 5.1에서 한글 경로가 손상되지 않도록 UTF-8 BOM으로 저장했다.

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ./게임/scripts/pack-slime-art.ps1 -OutputRoot C:/Temp/grid-defenders-slime-check
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ./게임/scripts/pack-blond-art.ps1 -OutputRoot C:/Temp/grid-defenders-blond-check
```

## 검증과 범위

[verification.json](verification.json)에 이번 검증 결과와 같은 조건의 용량 비교를 기록했다. 원본 41개의 복사 해시·원본 수정 시각이 일치했고, 내부 원본을 기본 입력으로 별도 임시 출력에 패킹한 런타임 PNG 7개는 기존 파일과 바이트 단위로 같았다. 좌표 JSON 2개도 내용이 같았다. 현재 게임의 그림·프레임·표시 크기·피해 판정은 변경하지 않았다.

슬라임 원본은 30프레임을 보관하며 실제 오른쪽 이동은 기존 구현대로 2~24번 프레임을 재생한다. 금발 전사의 생성 스킬 아이콘은 미부여 상태를 유지한다. 검수 JSON은 제작 당시 기록이고, 이번 보관이 새 아트의 사용자 승인이나 실기기 검증을 의미하지 않는다.

진행 중인 이펙트 공방·달리기·영상·스플래시 시안과 세계관 배정은 이 보관에 포함하지 않았다. 새 자료를 추가할 때에는 현재 사용 여부와 검증 상태를 확인하고 파일·출처·해시를 함께 등록한다. 다른 작업 공간의 원본을 자동으로 덮어쓰거나 삭제하지 않는다.

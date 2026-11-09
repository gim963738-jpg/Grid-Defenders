# 영상에서 SD 픽셀 스프라이트 추출

`Extract-SkyGrassSprite.cs`는 제공된 Dreamina 영상의 하늘/잔디 팔레트에 맞춘 로컬 전경 분리와 고정 캔버스 패킹 도구다. 원본 동작을 새로 생성하지 않는다. 입력 배경이 바뀌면 색 범위와 시각 검수를 다시 적용해야 한다.

- `build.ps1 -ConfigPath <config.json>`: 선택된 원본 프레임의 배경 분리, 공통 크기 추출, 시트 작성.
- `finalize.mjs <config.json>`: 좌표·지속시간·원본 시각·파일 해시·오프라인 미리보기 생성.
- `verify.ps1 -ConfigPath <config.json>`: 실제 알파·잘림·모든 시트/프레임 픽셀 일치·남긴 전경 RGB 보존 검사.
- `package.ps1 -OutputPath <출력 폴더>`: 원본·시각 검수 확인 뒤 manifest와 ZIP을 만들고 모든 ZIP 항목 해시 확인. 기존 ZIP이 있으면 덮어쓰지 않는다.

config의 `frames`는 `index`, `source_index`, `source_pts`, `sample_target`, `source_file` 배열이며 `source`, `source_video`, `duration`, `scratch`, `output`을 함께 전달한다. 실제 사용한 선택 번호와 시각·원본 SHA-256은 산출물의 `source-and-extraction.json`에 있다.

원본 프레임은 FFmpeg의 `-map 0:v:0 -fps_mode passthrough`로 디코딩한다. 표시 시각은 ffprobe의 `best_effort_timestamp_time`을 사용하며, 60/1이라는 스트림 표기만 보고 실제 97장을 60fps 영상으로 간주하지 않는다. 약 4.016667초에서 시간순 60장을 고르므로 완성 미리보기는 약 14.94fps다.

배경 분리 결과에 확대·축소를 적용하지 않는다. 팔레트 분리 → 가장 큰 캐릭터 연결 영역 → 둘러싸인 전경 섬 보존 → 60장 가시 영역 합산 → 공통 원점/칸 크기 패킹 순서다. 프레임마다 별도 중앙 정렬하지 않는다. 원본 시작과 끝이 다른 경우 완벽한 무한 반복으로 표시하지 않는다.

Windows .NET의 System.Drawing과 PowerShell, Node.js, FFmpeg를 사용한다. 외부 배경 제거 서비스나 모델 API 호출은 없다. [FFmpeg 다운로드](https://ffmpeg.org/download.html)의 Windows 빌드 링크를 사용했으며 내려받은 빌드의 SHA-256을 대조했다.

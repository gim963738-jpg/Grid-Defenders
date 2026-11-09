# Sunburst 이미지 제작

Grid Defenders 캐릭터 제작용 로컬 Image API 연결. Node.js 22 이상에서 추가 패키지 설치 없이 실행한다. 기존 캐릭터 갤러리에서 `Sunburst 이미지 제작 열기`로 이동할 수 있다.

## 실행

프로젝트 루트에서 PowerShell로 실행한다.

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\tools\image-studio\start.ps1
```

브라우저 주소는 `http://127.0.0.1:8788/`이다. 이 주소만 사용한다. 로컬 PC에서만 접속하며 외부 배포 대상이 아니다. 서버 종료는 실행 터미널에서 Ctrl+C.

## API 키 등록

- Windows 사용자 환경 변수 `OPENAI_API_KEY`에 키를 등록하고 위 실행 명령을 다시 실행한다. 실행 스크립트는 사용자 환경 변수를 새로 읽는다.
- 또는 `.env.example`을 같은 폴더의 `.env.local`로 복사하고 로컬 편집기에서 `OPENAI_API_KEY=` 뒤에 키를 입력한다. `.env.local`은 요청할 때 다시 읽으므로 서버 재시작이 필요 없다.
- `.env.local`의 키가 환경 변수보다 우선한다. 키는 브라우저나 결과 메타데이터에 보내지 않으며 Git에서 제외한다. 키를 채팅이나 문서에 기록하지 않는다.
- 키를 만든 API 조직과 Pro 크레딧을 연결한 조직이 같아야 구독 혜택을 사용할 수 있다. 이 도구는 결제·충전·혜택 활성화를 수행하거나 잔액을 조회하지 않는다.
- `API 접근 확인`은 모델 목록을 읽는 검사다. 이미지 생성 가능 여부와 크레딧 잔액까지 보장하는 검사는 아니다.

## 세 가지 설정

| 화면 설정 | 모델 | 이미지 품질 |
|---|---|---|
| Sunburst 2.6 · High | `gpt-image-2.6-sunburst` | `high` |
| Sunburst 2.5 · XHigh | `gpt-image-2.5-sunburst` | `xhigh` |
| Sunburst 2.5 · High | `gpt-image-2.5-sunburst` | `high` |

2.6의 high는 프로젝트 기본값으로 정했다. xhigh/high는 대화 모델의 추론 강도가 아닌 **이미지 렌더링 품질**이다. 모델을 임의로 대체하지 않는다.

참고 이미지가 없으면 `/v1/images/generations`, 있으면 `/v1/images/edits`로 보낸다. 프로젝트의 `output/characters/` 이미지와 업로드를 합쳐 최대 4개, 파일당 12MB까지 지원한다. 기본 크기는 1536×1024, 배경은 투명, 결과는 PNG 한 장이다. 이미지 모델이 지원하는 더 큰 업로드 상한과 별개로 이 제작 화면의 용량을 제한했다.

이미지 생성은 API 크레딧을 사용한다. 화면을 열거나 설정을 바꾸는 것만으로 이미지를 생성하지 않는다. 생성 버튼을 누르면 한 건만 보내고 작업이 끝날 때까지 다음 생성을 막는다. 실패·시간 초과 시 자동 재시도하지 않는다. 연결이 끊긴 경우 새로고침하여 진행 중인 작업을 확인한다. 서버가 중간에 종료된 작업은 결과 불명으로 표시하고 다시 보내지 않는다.

## 결과와 제작 규약

`output/imagegen/sunburst/<요청 ID>/` 아래 PNG, `prompt.txt`, 참고 이미지 사본, `metadata.json`을 저장한다. 원본 캐릭터 파일은 덮어쓰지 않는다. 메타데이터는 요청한 모델·품질·크기·배경·참고 이미지·API 요청 ID와 API가 제공한 사용량을 기록한다. 사용량이 반환되지 않으면 미상이며, 0원으로 표시하지 않는다. 재실행해도 기존 결과를 다시 읽는다.

이 도구는 생성·편집 연결 기능이다. 스프라이트의 60개 프레임, 발 기준점, 투명 여백, 캐릭터 일관성, 모션 연결을 자동 보증하지 않는다. 실제 제작에서는 [캐릭터 스프라이트 제작 규약](../../문서/00_개발규칙/캐릭터스프라이트제작규약.md)을 적용하고 밝은/어두운 배경과 재생으로 검수한다. 프롬프트에는 원화·동작·변경 대상·보존할 부분을 명시한다.

## 검증

```powershell
node --test tools/image-studio/openai.test.mjs tools/image-studio/server.test.mjs
```

테스트는 외부 API를 모의 응답으로 대체하며 비용을 발생시키지 않는다. 실제 모델 접근 여부는 키 등록 뒤 화면의 `API 접근 확인`으로 별도 확인한다. 이미지의 실제 품질은 생성 결과로 검수한다.

공식 문서 확인일: 2026-11-05.

- [이미지 모델과 품질 설정](https://developers.openai.com/api/docs/guides/image-prompting)
- [이미지 편집 API](https://developers.openai.com/api/reference/resources/images/methods/edit)
- [구독 API 크레딧 연결](https://developers.openai.com/api/docs/guides/chatgpt-api-credits)

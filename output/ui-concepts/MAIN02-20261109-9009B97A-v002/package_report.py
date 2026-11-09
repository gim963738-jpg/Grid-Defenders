from pathlib import Path
from PIL import Image
import json, hashlib
out=Path(__file__).resolve().parent;root=out.parents[2]
def write(n,s): (out/n).write_text(s,encoding='utf-8')
def receipt(n):
 d=json.loads((out/n).read_text(encoding='utf-8-sig'));assert d['ok'],d
 return json.loads(d['result']['result'])
layout=receipt('layout-receipt.json'); gallery=receipt('gallery-receipt.json')
assert layout['pass'] and gallery['pass'],(layout['pass'],gallery['pass'])
write('버튼위치.json',json.dumps(layout['screens'][0]['buttons'],ensure_ascii=False,indent=2))
task=Path('C:/Users/user/Desktop/Grid Defenders/작업관리/작업/MAIN02-20261109-9009B97A/task.json')
record=json.loads(task.read_text(encoding='utf-8-sig'))
write('착수근거.json',json.dumps({k:record[k] for k in ['id','iteration','status','approval','readingAcknowledgement','history']},ensure_ascii=False,indent=2))
files=json.loads((out/'파일검증.json').read_text(encoding='utf-8'))
themes=['설산성채','사막유적','해안항구']; ids=['snow','desert','coast']; titles=['서릿빛 성채의 방어선','모래 아래 잠든 유적','푸른 항구의 전초기지']
st=['무광 금속','주조 프레임','차콜 글라스']
finals=[f'{i*3+d:02d}-{ids[i]}-D{d}.png' for i in range(3) for d in range(1,4)]
rows='\n'.join(f'| {n+1:02d} | {themes[n//3]} | D{n%3+1} {st[n%3]} | `{out/f}` |' for n,f in enumerate(finals))
report=f'''# 결과보고 — MAIN02-20261109-9009B97A / 차수2 / ui

새 배경 3종 × 공통 버튼 3종을 적용한 개별 PNG9장 제작 완료. **배경은3개이며, 같은 행의3장은 배경을 고정한 버튼 비교**다. 사용자 최신 정정과 “진행해봐” 확인 범위로 제작했으며 사용자 최종 시각 합격이나 게임 반영 완료가 아니다.

## 즉시 열기
- [개별 확대 갤러리]({out/'gallery.html'}) — 9장 각각 확대/원본 열기, 이전·다음, 키보드, 테마 필터.
- [전체 3×3 비교판]({out/'비교판-전체9.png'}) — 행: 설산/사막/해안, 열: D1/D2/D3.
- [버튼 확대 비교판]({out/'buttons-comparison.png'}) — 기본/선택/강조/비활성 및 아이콘8종.
- 테마별: [설산]({out/'비교판-설산성채.png'}), [사막]({out/'비교판-사막유적.png'}), [해안]({out/'비교판-해안항구.png'}).

## 개별 최종 PNG 절대경로
모두 2400×1080px, 800×360 논리 화면의3배. 각 셀은 같은 전투 상태(웨이브09, 시간00:18, 골드480G, 모루2, 누적몬스터7/20), 같은 아군8명/적7마리, 같은 크기·좌표다. 숫자는 비교용 표본으로 새 밸런스 확정이 아니다.

| 화면 | 새 배경 | 공통 버튼 | 실제 파일 절대경로 |
|---|---|---|---|
{rows}

## 참조 관찰과 새 배경
차수1의 01-war-gate / 03-war-citadel / 06-forest-oak / 07-demon-fissure / 08-demon-grove **5장을 각각 직접 열어 관찰**했다. 경로는 `{out.parent/'MAIN02-20261109-9009B97A'}`. 선호 부분은 회화적 돌·나무 표면, 소품의 접지 그림자, 외곽에 몰린 랜드마크, 교전 공간의 낮은 정보 밀도다. 마계의 암색 바닥과 광원 대비, 고목 화면의 자연물 깊이도 관찰했으나 이번 장면에 마계 식물·고목을 그대로 배치하지 않았다. 더 이전05/09 버튼 선호는 깊은 판·금속 선·큰 아이콘이라는 연속 참조로 반영했다.

이번 세 테마 구체명은 사용자 직접 지정이 아닌 **메인의 새 테마 선정**이다. 새 독립 이미지 생성이며 이전 배경 파일의 색상 보정본을 만들지 않았다. 설산 첫 생성은 원래 성벽 배치와 유사해 채택하지 않고 암벽·목책·망루가 나뉜 새 장면을 재생성했다.

| 테마 | 새 실루엣·재질·소품·빛 | 의도와 한계 |
|---|---|---|
| 설산성채 | 단절된 암벽/목책/망루, 밝은 눈, 푸른 그림자, 썰매·얼음 | 밝은 배경의 버튼 대비 확인. 설산 바위와 망루는 외곽만 차지 |
| 사막유적 | 모래결, 풍화 기둥/반매몰 석판, 천막/항아리, 황금빛 | 기존 숲·마계와 다른 유적 재질. 중앙 낮은 대비 유지 |
| 해안항구 | 위쪽 좁은 바다, 목조 부두/포대, 밧줄·상자/그물, 청명한 빛 | 바다는 상단 외곽에 한정, 중앙~우측 육지 교전로 연속 |

배경 단독: `{out/'backgrounds/snow.png'}`, `{out/'backgrounds/desert.png'}`, `{out/'backgrounds/coast.png'}`. 생성 원본 크기는 각각 {files['backgrounds']['snow']['size']}, {files['backgrounds']['desert']['size']}, {files['backgrounds']['coast']['size']}px이며 최종 합성에서2400×1080으로 확대했다. 네이티브2400 배경이라고 주장하지 않는다. 미채택 설산은 backgrounds/snow-first-take.png에 보존했다.

## 버튼 조형 비교와 공통 적용
| 디자인 | 형태/프레임/깊이 | 아이콘·상태 | 평가 |
|---|---|---|---|
| D1 | 절삭 모서리 판금 직사각형, 얇은 은색선, 불투명 무광 | 굵은 실루엣; 선택 시 왼쪽 표시선, 비활성은 낮은 대비 | 가장 빠른 판독/적은 장식. 환상적 장식성은 상대적으로 절제 |
| D2 | 비대칭 둥근 모서리, 청동 이중 프레임, 주조 베벨·음각 깊이 | 정교한 금색 선화; 선택 시 눌린 판과 이중선 | 기존 판타지 아트 연결이 강함. 테두리의 시각적 무게가 큼 |
| D3 | 둥근 캡슐, 얇은 유리 테두리, 반투명 차콜 | 간단한 선화와 원형 아이콘판; 선택 밝은 면/비활성 점선 | 지형 색이 은은히 비침. 밝은 눈에서도 테두리를 유지 |

각 D의 **배경색/테두리/깊이/아이콘이 세 배경에서 동일**하다. 눈꽃·조개·사막 문양을 공통 버튼에 넣지 않았다. 상단 HUD도 해당 D의 같은 재질·프레임을 사용한다. CSS 계산값 동일 검증3/3 통과. 확대 비교판의 선택/강조는 시각 규칙 제안이며 정적 기본9장에 새 게임 기능이 활성화된 것처럼 만들지 않았다. 실제 미구현 설정은 준비 중 비활성으로 유지했다.

## 화면 기능·버튼 좌표 매핑 (9장 공통 / 논리px)
| 기능 | x,y | 크기 | 표시/설명 |
|---|---|---|---|
| 정지 |572,8|48×48|기존 일시정지 접근 위치 |
| 배속 |628,8|48×48|1× 고정 비교 표본 |
| 설정 |684,8|48×48|준비 중 비활성, 존재하는 기능으로 주장하지 않음 |
| 복귀 |740,8|48×48|로비 복귀 접근 위치 |
| 병사 |704,76|84×48|동일한 명령 열 |
| 영웅 |704,132|84×48|동일한 명령 열 |
| 상점 |704,188|84×48|동일한 명령 열 |
| 진형 |704,244|84×48|동일한 명령 열 |
| 가방 |704,300|84×48|기존 공용가방 접근 위치 제안 |

상단: 웨이브(12,8/104×48), 시간(124,8/88×48), 재화(220,8/112×48), 누적몬스터(420,8/128×48). 방어 격자는104,92의5×4(240×192), 오른쪽 적 진입 표식은606,63. 중앙 교전과 오른쪽 진입을 가로막는 패널 없음. 정적 기본 화면 세트이므로 펼친 기능 패널은 이번 범위에서 만들지 않았다. 메뉴가 동작하는 게임 빌드로 제출하지 않는다.

## 적용 기준·착수 근거
현재 차수 read-pack14개 본문과 작업연결/발송지시-v002/사용자피드백-v002/기존보고/모바일규격을 다시 읽었다. `읽기확인.json`에 각path/sha256/applies를 기록하고 **차수2 sent 연결 및 start 통과** 후 제작했다. `착수근거.json`은 실제 공유 task 기록에서 복사한 영수증이다. 공통 mobile-ui.css는 읽기 전용 링크로 사용하고 이 시안의 독립 skins.css에서 디자인을 제안했다. 800×360, 여백12/간격8, 본문14·보조12·제목20, 터치48 이상 적용. 현재 규정과 사용자의 최신 지시가 충돌할 때 이번 확인된 시안 범위를 우선했다. 원 규정은 수정하지 않았다.

## 도구·프롬프트·재현
- imagegen 스킬 본문을 사용 전 읽고 기본 내장 `image_gen.imagegen` 사용. 최종 배경3개를 위해 총4회 호출(설산 재생성1회 포함), 외부 유료API/다른 모델 전환 없음.
- 정확한 전체 프롬프트와 원본 도구 저장경로: backgrounds/snow.json, desert.json, coast.json, snow-final.json. 최초3개는 기존03 배경을 회화 스타일 참고 입력으로 사용했고 최종 설산은 새 장면 구분을 위해 텍스트 지시로 생성했다. 이미지 원본은 도구 기본 경로에서도 보존.
- HTML/CSS/SVG는 정확한 한글과 아이콘/버튼 합성용. 기존 실제 스프라이트는 읽기 전용 상대경로로 사용. 합성 원본 concepts.html / skins.css / build_source.py, 버튼판 buttons.html, 갤러리 gallery.html.
- 설치된 Edge headless로 render.ps1에서 최종 PNG 렌더. Pillow는 연락판 배치/해상도 확인용이며 AI 배경 생성 대체물이 아니다. 작업 중 잘린 버튼판과 진입표식 간격을 수정 후 다시 렌더했다.
- 재현: `python build_source.py` → `powershell -NoProfile -ExecutionPolicy Bypass -File render.ps1` → `python finish_assets.py`. 체크JS는 Orca 브라우저에서 실행했으며 receipts를 보존했다.

## 검증 결과와 한계
- 최종 PNG9장 **각각 직접 열어** 설산/사막/해안 구분, 회화 마감, 작은 외곽 소품, 왼쪽 방어·오른쪽 진입, 한글/숫자, 버튼 형태차이와 밝은 배경 대비를 확인했다. 3×3 축소 연락판으로 검수를 대신하지 않았다.
- 브라우저9장×9버튼: 누락0,48px미만0,화면밖0,버튼간겹침0. 아군/적 좌표·크기 동일 통과, D별 같은 스킨3배경 적용 통과. 근거 layout-receipt.json/버튼위치.json.
- 갤러리9장 개별 확대와2400px 이미지 로드, 원본링크 일치, 이전·다음·키보드·닫기, 테마 필터 전체9/각3 통과. 근거 gallery-receipt.json.
- 파일 해상도9/9 통과. 기존 game/src와 이전16장/9장 및 관련 소스 **167개 파일 SHA256 불변**, 누락0. 근거 보존기준해시.json/파일검증.json.
- 자체 제작 검수 결과이며 독립 테스터 합격이나 사용자 최종 선택을 대신하지 않는다. 실제 APK·실기기 터치·게임 기능 통합 검증은 이번 정적 시안 범위 밖이다. 게임 코드/공통CSS/이전결과/규정 변경 및Git commit/push 없음.
- 요청된 산출물 미완료 없음. 남은 것은 main02 검수와 사용자 디자인 선택이며 게임 반영은 별도 확인 범위다.

## 규정 보완 제안 (미확정)
배경과 공통 버튼을 함께 비교할 때에는 행별 동일 배경/열별 동일 스킨·좌표·상태를 유지하는 매트릭스 방식을 재사용할 것을 제안한다. 원 규정을 덮어쓰지 않았으며 사용자 확정 규정으로 기록하지 않는다.
'''
write('결과보고.md',report)
records={
'1_대화기록.md':'# 대화 기록\n작업 MAIN02-20261109-9009B97A 차수2 ui. 최신 사용자 정정은 특정 필드 장면 고정이 아닌 그림체·소품방식·전체 분위기 선호이며 새 테마와 공통으로 어울리는 버튼을 요구한다. 확인은 “진행해봐”. 설산/사막/해안은 메인의 구체화이며 사용자 직접 테마 지정으로 기록하지 않는다.\n',
'2_사전확인.md':'# 사전 확인\n발송지시-v002와 현재 read-pack14개 본문 및 작품별 기준 재독 후 읽기확인.json을 작성해 차수2 start 통과. 허용은 신규 v002 output만이며 이전16/9장, 게임src, 공통CSS, 규정은 보존. 범위는 새 배경3×공통버튼3의 PNG9장/비교판/버튼판/갤러리/보고이며 기능개발과 통합 제외.\n',
'3_작업일지.md':'# 작업 일지\n5개 선호 화면을 직접 관찰하고3개 독립 배경을 기본 내장 imagegen으로 생성. 설산 첫 결과의 이전 구도 유사성을 발견해 새 암벽·목책 장면으로 재생성. 동일 상태와 좌표를 유지한 HTML/CSS/SVG로 D1/D2/D3를 합성하고 PNG9장을 렌더. 적 진입 표식 간격과 확대판 하단 잘림을 수정한 뒤 개별9장, 버튼판, 갤러리와 보존 해시를 검증. 상세는 결과보고.md와 receipts.\n',
'4_정의문서.md':'# 시안 정의\n800×360 논리/2400×1080 출력,왼쪽방어/중앙교전/오른쪽진입. D1절삭 판금·실루엣,D2주조 이중프레임·선화,D3라운드 반투명차콜·간결선화. 01~03설산/04~06사막/07~09해안,각열D1/D2/D3. 각행 배경1개를 의도적으로 고정하며 독립9배경이라고 부르지 않는다. 기능/버튼 좌표는 결과보고와 버튼위치.json 참조.\n',
'5_버전관리.md':'# 버전 관리\n차수2는 MAIN02-20261109-9009B97A-v002에만 신규 작성. 이전 결과 및 게임src167개 SHA256이 시작 기준과 동일. 기존 원본과 미커밋 변경을 보존했으며Git commit/push/통합하지 않음. 기술 자체검증 완료와 사용자 시각 합격은 별개. 후속 수정은 새 확인 범위로 진행.\n'}
for n,s in records.items():write(n,s)
missing=[]
for href in gallery['links']:
 if not (out/href).exists():missing.append(href)
assert not missing,missing
write('최종검증.json',json.dumps(dict(layoutPass=layout['pass'],galleryPass=gallery['pass'],finalPNGs=9,missingLinks=missing,directlyInspected=finals,preservedFiles=files['preservedFiles'],changedOriginals=files['changedOriginals'],notUserAcceptance=True,notGameIntegrated=True),ensure_ascii=False,indent=2))
print('Report, five records and final checks complete.')

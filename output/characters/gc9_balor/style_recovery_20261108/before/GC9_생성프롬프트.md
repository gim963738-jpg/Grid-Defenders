# GC9 새 캐릭터 생성 프롬프트

신규 캐릭터는 [캐릭터 제작 규약](../캐릭터제작규약.md)의 **일러스트 시안 승인 → 4방향 제작 → SD 시안 승인 → 3방향 제작** 순서를 먼저 적용한다. 시안 1장에 대한 사용자 통과 전에 나머지 방향을 연속 생성하지 않는다. 각 생성 원본의 크기와 바이트를 유지한다.

**선택한 원본 이미지 + 고정 화풍 지시 + 새 캐릭터 설정 + 검수**를 한 묶음으로 사용한다. 텍스트만으로 원본과 같은 결과가 보장되지는 않는다. 아래 문구는 그림체 제작을 위한 준비 양식이며 실제 생성 결과를 검증한 프롬프트는 아니다.

[그림체 기준](GC9_그림체기준.md) · [캐릭터 입력 양식](GC9_캐릭터입력양식.json) · [참조 ID와 파일 경로](../../../../자료/캐릭터그림체/GC9/참조목록.json)

## 전신 여백 기본값

[프레이밍 기준](../../../../자료/캐릭터설정/GC9_프레이밍기준.json)에 따라 GC9 전신은 상단 20%·좌우 각각 15%·하단 6%를 초기 빈 여백 기본값으로 사용한다. 사용자의 정성적 여백 요청을 적용하기 위한 기본값이며 정확한 수치 자체를 사용자 확정값으로 표기하지 않는다. GC9 등신과 체형을 유지하고 전체 실루엣의 화면 점유 크기만 균일하게 줄인다. 아래 고정 블록에도 같은 기준을 포함한다.

## 사용자 평가로 정한 생성 결과 참조

현재 제작에서는 C4 결과를 얼굴·그림 완성도의 우선 참조, C3 결과를 금속 표현의 우선 참조로 사용한다. 각각 `output/character-redesign-6x2/images/c04_front.png`와 `c03_front.png`, 대응하는 `_threequarter.png`다. 아래 원본 선택표에 더해 적용한다. 이미지 번호와 역할을 정확히 쓰고 두 캐릭터의 머리·복장·무기를 복사하지 않는다.

```text
Face quality reference: C4. 간결한 눈꺼풀·코·입, 정돈된 얼굴선과 절제된 피부 명암.
Metal quality reference: C3. 금속의 밝고 어두운 면, 모서리 두께, 판의 겹침과 일관된 광원.
Close inspection: 원본 PNG 100%에서 얼굴·흉갑·장비·손의 선과 연결을 확인.
Avoid: 인형 같은 피부 광택, 부푼 금테, 뭉친 장식선, 부유하는 체인, 축소 JPEG 확대로 품질 판정.
```

## 1 참조 이미지 선택

전체 16장(GC9 v1.1, 초기 9장 + 추가 7장)은 분석용 라이브러리다. 한 장 제작에는 역할이 분명한 2~3장을 우선 선택한다. 원본은 모두 `자료/캐릭터그림체/GC9/원본/`에 보관한다. 이미지 번호는 **이번 호출에 실제 첨부한 순서**로 다시 적는다.

| 새 인물 또는 재질 | 주 참조 | 보조 참조 | 사용할 부분 |
|---|---|---|---|
| 일반 남성 | M04 라스 | M01 미스트 | 기본 선화·셀 명암, 얼굴 생략 방식, 흰 천과 어두운 천 |
| 부드러운 남성 | M02 하르페 | M04 라스 | 눈매·표정의 부드러움, 넓은 천과 겹침 |
| 강인한 남성 | M03 지크하트 | M05 로난 + M04 라스 | 어깨·상완 양감, 장비의 단단함. 동작·대형 효과는 새 요청에 있을 때만 |
| 일반 여성 | F01 에델 | F04 리르 | 얼굴과 전신의 기본 정리, 제복·천·부드러운 얼굴 범위 |
| 날카로운 여성 | F02 유로파 | F01 에델 | 강한 눈매·검은 재질의 반사. 노출·체인은 가져오지 않음 |
| 부드러운 여성 | F04 리르 | F01 에델 | 둥근 볼·눈, 유기적인 곡선, 절제된 명암 |
| 중장갑 인물 | M05 로난 | F01 에델 | 판금·테두리·천만 참조. 성별·얼굴·체형은 새 인물 설정 |
| 얼음·반투명체가 있는 인물 | F03 티아 | F01 에델 + M04 라스 | 얼음·날개 재질만 확장하고 인물의 기본 셀 명암 유지 |
| 큰 금장 갑옷·따뜻한 팔레트 | A01 적발·금장 갑옷 | M05 로난 + M04 라스 | 큰 금속 판과 엣지·따뜻한 강조색. 얼굴·정체성·무기는 새 설정 |
| 밝은 웃음·원호와 별 장식 | A02 라피스 | F04 리르 + F01 에델 | 열린 입과 둥근 눈, 원호 가독성. 별무늬·큰 장식은 요청 시만 |
| 양감 있는 상체·밝은 인상 | A03 라이언 | M03 지크하트 + M04 라스 | 상체 양감·밝은 표정·따뜻한 천. 노출·장병기·속성을 자동 추가하지 않음 |
| 전신 판금·절제된 광택 | A04 브람 | M05 로난 + F01 에델 | 판·관절 연결, 낮은 대비의 내부 반사. 새 인물의 얼굴·체형 우선 |
| 검붉은 경량 장비 | A05 엘리시스 | F02 유로파 + M04 라스 | 어두운 갑옷·머리·망토의 분리, 국소적인 붉은 강조 |
| 흑백·자홍과 다층 장식 | A06 분홍 장발·흑익 | F01 에델 + A02 라피스 | 날개·판 구조·후방 문양의 층 분리. 이 구조가 필요한 요청에만 사용 |
| 흰 겹옷·넓은 소매 | A07 Hwarin | M02 하르페 + F01 에델 | 옅은 청회색 명암과 붉은 안감. 일자 앞머리·동양풍·책 형태 장비는 개별 설정 |

성별은 참조 선택의 빠른 출발점이다. 예를 들어 여성 중장갑 인물에도 로난의 금속 표현을 쓸 수 있지만 남성 얼굴이나 체형을 옮기지 않는다. 인물 성별보다 원하는 인상·재질·선화 강도를 우선한다.

추가 7장은 성별을 미지정으로 보관하고 역할별로 선택한다. A01·A06의 공식 이름·설정은 판정하지 않는다. 셀 경계를 유지하되 **금속 내부의 부드러움·흰 천의 그림자 농도·웃는 입의 표현**까지 해당 참조에 맞춘다. 기본 명암을 무조건 더 강하고 딱딱하게 만드는 지시는 피한다.

### 새 캐릭터의 기존 이미지가 있는 경우

- 이미지 1: **정체성 참조**. 얼굴 특징, 피부색, 나이, 체형, 머리, 옷과 장비를 유지한다.
- 이미지 2: **주 화풍 참조**. 선화, 얼굴 생략 수준, 머리 묶음, 명암 표현만 가져온다.
- 이미지 3: **보조 화풍 또는 재질 참조**. 지정한 재질이나 표현에만 적용한다.

정체성 참조가 없으면 새 캐릭터를 글로 정의하고 이미지 1을 주 화풍 참조로 지정한다. 참조 순서를 바꾸면 프롬프트의 이미지 번호도 함께 바꾼다. 화풍 참조를 편집할 원본 캐릭터로 오해하지 않도록 역할을 명시한다.

## 2 고정 화풍 블록

이 블록은 매번 사용한다. 설정 칸에 넣은 특징을 덮어쓰지 않는다.

```text
Use case: stylized-concept
Asset type: 정교한 2D 판타지 게임 캐릭터 전신 일러스트

Style/medium:
첨부한 화풍 참조들과 같은 시각 문법으로 새 캐릭터를 그린다.
가늘고 깨끗한 애니메이션 선화. 외곽과 겹침은 분명하게, 얼굴과 내부선은 더 섬세하게.
윗눈꺼풀이 또렷한 눈, 짧고 간결한 코와 입, 정돈된 턱과 깨끗한 피부 명암.
눈매·볼·턱은 새 인물의 개성과 나이에 맞게 유지한다.
머리카락은 큰 가닥을 먼저 묶고 뾰족한 끝과 선택적인 가는 내부선으로 표현한다.
천과 장비는 큰 구조와 겹침을 먼저 읽히게 하고 장식은 그 구조를 따른다.
기본색·주 그림자·깊은 겹침 그림자가 읽히는 셀 명암, 필요한 곳에만 부드러운 그라데이션.
선택한 참조의 명암 강도를 따른다. 판과 천의 경계는 읽히되 흰 겹옷의 옅은 그림자와
낮은 대비 금속의 완만한 내부 반사까지 모두 단단한 고대비로 바꾸지 않는다.
피부는 부드럽고 절제되게, 천은 넓은 접힌 면으로, 금속은 날카로운 밝고 어두운 면으로,
보석은 작은 고채도 면과 국소 하이라이트로 구분한다. 해당 재질이 있을 때만 적용한다.
팔레트는 새 캐릭터 설정을 따른다. 색이 많은 작은 장식을 전면에 흩뿌리지 않는다.
전신의 연결과 무게중심이 명확하고, 얼굴·손·주요 장비가 잘 읽히는 정돈된 실루엣.

Constraints:
화풍 참조의 캐릭터 정체성·얼굴·헤어스타일·머리색·의상·장식·무기를 복제하지 않는다.
새 인물의 성별 표현·나이·체형·피부색·종족·의상·색·장비를 우선한다.
날개·긴 코트·금장·노출·뿔·엘프 귀·대형 무기·마법 효과는 요청된 설정에만 넣는다.
손·관절·장비 연결을 자연스럽게, 의도하지 않은 머리·손·발·주요 장비의 잘림 없이 표현한다.
전신과 무기·방패·망토·장식을 함께 균일 배율로 줄여 x=15~85%, y=20~94% 안에 배치한다.
상단 최소 20%·좌우 각각 최소 15%·하단 최소 6%를 빈 여백으로 둔다.
기존 성인형 등신·체형은 유지하고 화면 점유 크기만 줄인다. 넓은 장비는 전체를 더 작게 배치한다.
손에 들거나 몸에 착용한 장비와 인물의 연결·자세·상대 크기를 유지한다. 장비를 따로 배치·이동·개별 축소하지 않는다.
같은 캐릭터의 방향 세트는 동일한 인물·머리 크기·배율·발선을 유지한다. 안내선은 그리지 않는다.
텍스트, 로고, 워터마크, 액자, UI, 별도 인물은 넣지 않는다.
```

### 영어 고정 블록

한국어 블록의 대체 문구다. 두 언어를 모두 붙일 필요는 없다.

```text
Use case: stylized-concept
Asset type: polished 2D fantasy game character illustration
Style/medium:
Use the supplied STYLE references for their drawing and rendering language.
Clean, fine anime linework with firmer silhouette and overlap contours and delicate facial and interior lines.
Expressive upper eyelids, simplified noses and mouths, clean jaw contours and restrained skin shading.
Keep the new subject's distinct eye shape, cheeks, jaw, age and expression.
Hair built from large coherent locks, tapered tips and selective fine strand lines.
Readable garment and equipment construction, broad folded planes and subordinate ornament.
Clearly separated cel-shaded base colors, main shadows and deep overlap shadows,
with controlled soft gradients only where useful. Soft restrained skin; broad matte fabric shadows;
sharp faceted metal reflections; compact saturated gem highlights, only on materials actually present.
Match the selected reference's contrast: retain readable boundaries while allowing pale shadows
on layered white cloth and restrained gradual reflections inside low-contrast metal plates.
Use the NEW subject's palette, body type and identity. Maintain clear anatomy, weight balance,
readable face and hands, and an elegant, organized full-body silhouette.
Constraints:
Transfer drawing style only. Do not substitute the reference characters' identities, facial designs,
hairstyles, hair colors, outfits, insignia, accessories or weapons for the new subject's design.
Preserve requested age, gender presentation, physique, skin tone, species and identifying features.
Add wings, gold trim, long coats, revealing clothing, horns, elf ears, oversized weapons or magic
only when explicitly included in the new subject brief.
Natural hands, joints and equipment attachments. No unintended cropping of the head, hands,
feet or important equipment.
Preserve the adult GC9 anatomy, head/body ratio and physique. Uniformly reduce only the
complete subject's canvas occupancy, including hair, ornaments, sword, shield and cape.
Keep the whole silhouette inside x=15%-85%, y=20%-94% of the native canvas.
Leave at least 20% empty space above, 15% on each side and 6% below.
For broad equipment use a smaller uniform scale; do not squeeze, stretch or crop it.
Keep equipment held or worn with the same contacts, pose and body-relative size. Never detach, separately position or individually shrink equipment to achieve padding.
Use the same body/head scale and ground baseline across one character's direction set.
Establish this framing during generation and preserve the actual returned image dimensions.
No guide lines, text, logos, watermark, frame, UI or additional characters.
```

## 3 새 캐릭터 설정 블록

아래 항목을 채워 고정 화풍 블록 뒤에 붙인다. 빈칸이 있을 때는 기존 프로젝트 설정을 먼저 확인한다. 임의의 스킬·세계관·능력치를 추가하지 않는다. 입력 JSON은 설정을 옮겨 적는 양식이며 생성 도구의 API 요청 형식이 아니다.

```text
Primary request: 아래 새 캐릭터를 첨부 참조의 화풍으로 그린다.

Input images:
이미지 1 = [정체성 / 주 화풍 중 실제 역할], [파일 또는 참조 ID], 가져올 점 [내용].
이미지 2 = [주 화풍 / 보조 화풍 / 재질], [파일 또는 참조 ID], 가져올 점 [내용].
[이미지 3이 있으면 실제 역할과 사용할 부분을 적는다.]

Subject:
인물의 이름 또는 역할: [내용]
성별 표현·나이·종족: [내용]
체형·키·어깨·팔다리: [내용]
얼굴: [눈매·볼·턱·눈썹·표정·피부색·흉터·수염 등]
머리: [색·길이·형태·묶음]
복장과 재질: [옷의 구조·덮는 범위·천/가죽/금속 등]
장비: [종류·개수·들거나 착용한 위치, 없으면 없음]
반드시 유지할 정체성: [변경하면 안 되는 특징]

Color palette: [주조색 / 보조색 / 강조색. 원본과 달라도 유지]
Composition/framing: [전신 또는 요청 범위 / 포즈 / 시점 / 장비 끝까지의 여백]
Scene/backdrop: [흰색·밝은 단색 / 실제 투명 / 요청된 배경 중 선택]
Lighting/mood: [광원 방향·밝기·분위기]
Rendering profile: [기본 셀 / 절제된 판금 반사 / 옅은 흰 겹옷 명암 / 검붉은 장비 구분 등]
Effects: [없음 / 지정한 위치에 국소 효과 / 명시적으로 요청된 대형 효과]
Output purpose: [캐릭터 일러스트 / 프로필 등. 전장 스프라이트와 혼동하지 않기]
Additional constraints: [새 캐릭터에서 꼭 지킬 사항]
```

## 4 피할 표현

별도의 네거티브 입력란이 없는 도구에서는 아래를 본문 `Avoid`로 사용한다. 검은 옷의 유광, 얼음의 부드러운 빛처럼 설정상 필요한 표현까지 지우지 않는다.

```text
Avoid:
실사·3D 렌더·피부 모공·사진 같은 모발·거친 붓질·수채화 번짐,
전면 에어브러시로 뭉개진 그림자, 모든 재질에 동일한 플라스틱 광택,
지나치게 두꺼운 균일한 외곽선, 큰 구조를 가리는 잔선과 무작위 장식,
요청하지 않은 SD/치비 체형, 참조 캐릭터의 얼굴·코스튬·색을 그대로 옮기는 것,
인물을 가리는 발광·안개·입자, 요청하지 않은 배경·추가 인물,
불필요한 노출이나 나이·체형 변경, 뒤틀린 손과 관절, 추가 팔다리, 장비와 손의 융합,
의도하지 않은 프레임 잘림, 텍스트·로고·워터마크.
```

## 5 다양한 설정으로 옮기는 예시

다음은 **입력 치환 예시**다. 신규 영웅·직업·게임 설정으로 확정한 내용이 아니며 이미지를 생성하지 않았다. 고정 화풍 블록에 아래 설정을 덧붙여 사용하는 방식이다.

### A 흑발과 갈색 옷의 남성

```text
Input images: 이미지 1=M04 주 화풍(선화와 기본 명암), 이미지 2=M01 보조(얼굴 생략 방식).
Subject: 성인 남성. 날씬하지만 평범한 체격, 짧은 검은 곱슬머리, 짙은 피부,
둥근 눈썹과 차분한 눈, 작은 미소. 갈색 무광 천 상의와 베이지 바지, 낡은 가죽 장화.
장신구와 무기 없음. 양손이 보이는 편안한 직립 자세.
Color palette: 갈색·베이지·짙은 녹색의 작은 강조. 백발·금장·흰 코트로 바꾸지 않는다.
Scene/backdrop: 흰색. Effects: 없음.
```

### B 연령과 체형이 다른 남성

```text
Input images: 이미지 1=M05 주 화풍(금속과 천), 이미지 2=M04 보조(선화).
Subject: 중년 남성, 넓은 몸통과 굵은 팔, 짧은 회갈색 머리, 네모난 턱과 짧은 수염,
눈가에 소수의 주름. 무광 회색 판금 위에 탁한 적색 천, 장식이 적은 방패 한 개.
두 발을 안정적으로 딛고 선다. 중년 인상·넓은 체형·수염을 유지한다.
Color palette: 회색·탁한 적색·갈색. Scene/backdrop: 흰색. Effects: 없음.
얼굴을 청년형으로 미화하거나 갑옷을 가늘게 줄이지 않는다.
```

### C 짧은 머리와 완전한 갑옷의 여성

```text
Input images: 이미지 1=F01 주 화풍(얼굴과 선화), 이미지 2=M05 재질(판금만).
Subject: 성인 여성, 탄탄한 어깨와 다리, 짧은 적갈색 머리, 각진 눈썹과 단호한 표정.
검은 피부. 가슴·허리·팔다리를 덮는 무광 강철 갑옷, 짧은 회색 천, 낮은 전투화.
직선형 검 한 자루를 아래로 향해 든 안정된 자세. 하이힐·노출·장발을 추가하지 않는다.
Color palette: 강철 회색·차콜·작은 주황색 강조. Scene/backdrop: 흰색. Effects: 없음.
```

### D 둥근 얼굴과 따뜻한 색의 여성

```text
Input images: 이미지 1=F04 주 화풍(둥근 얼굴과 곡선), 이미지 2=F01 보조(천 명암).
Subject: 성인 여성, 부드러운 볼과 둥근 눈, 통통한 체형, 어깨 길이의 짙은 갈색 웨이브 머리.
크림색 긴 소매 옷과 짙은 주황색 허리 천, 작은 가죽 가방, 둥근 낮은 신발.
인간 귀, 무기 없음, 손을 자연스럽게 내린 밝은 표정.
Color palette: 크림·짙은 주황·갈색. Scene/backdrop: 흰색. Effects: 없음.
눈과 몸의 부드러움을 유지하고 엘프 귀·녹색 의상·활·긴 마른 다리로 바꾸지 않는다.
```

## 6 실제 생성과 수정 순서

1. 그림체 기준과 캐릭터의 기존 설정을 읽고 입력 양식을 채운다. 정체성·재질·포즈·배경·효과 유무를 정한다.
2. 누적 16장 중 표에서 참조 2~3장을 골라 **실제 이미지를 확인하고 첨부**한다. 기존 캐릭터 이미지가 있으면 정체성 참조로 먼저 지정한다. 신규 자료가 추가되어도 무조건 모든 참조를 한 번에 섞지 않는다.
3. 이미지 번호별 역할 + 고정 화풍 블록 + 새 설정 + 피할 표현을 전달한다. 투명 출력은 도구에서도 실제 투명을 요청한다.
4. 결과를 기준 문서의 검수표로 점검한다. 원본의 밝은 배경 전체 프레임, 얼굴 확대, 재질 표현을 비교한다.
5. 수정할 때는 실패한 축을 구체적으로 쓴다. 예: “얼굴·포즈·의상은 유지하고, 천의 흐린 음영만 넓고 경계가 또렷한 셀 그림자로 정리. 피부와 얼음의 부드러움은 유지.”
6. 사용한 참조 ID·정확한 최종 프롬프트·출력 경로·수정 내용을 함께 보관한다. 실제 출력 검수 후에 해당 설정에서 그림체가 맞았다고 기록한다.

↳ 쉽게 말하면: 이번에 준비한 것은 재사용 가능한 기준과 참조 묶음이다. 다음 캐릭터가 정해지면 그대로 넣어 제작하고, 결과를 원본 옆에서 확인한다.

## 사용자 확정 한손 무기 그립

한손으로 쥐는 검·도·몽둥이 등은 [공통 그립 기준](../한손무기그립기준.md)과 [구조화 규칙](../../../../자료/캐릭터설정/한손무기그립.json)을 적용한다. 자세·사용자 손가락 표시 두 원본을 실제 첨부하며 화풍 원본 16장과 구분한다. 정면 오른손은 위 왼쪽의 폼멜에서 손잡이를 감싼 손을 거쳐 아래 오른쪽의 가드·무기 본체로 이어지고 몸 앞 반대쪽 발 아래로 향한다. 다른 구도에서는 같은 물리적 손과 자세를 회전해 투영한다. 손목·손바닥·다섯 손가락의 연결을 검수하며 참조의 가이드 선·갑주·인물·무기 색을 복제하지 않는다.

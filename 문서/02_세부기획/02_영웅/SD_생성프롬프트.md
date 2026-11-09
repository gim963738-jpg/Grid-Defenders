# SD 공통 생성 프롬프트 — SD-STD-002

[최신 기준](SD_공통제작기준.md)과 구조화JSON·해당 인물의 개별 마스터를 먼저 읽는다. 신규2안 승인3PNG의 필요한 방향을 실제 STYLE/PROPORTION 참조로 첨부한다. 다른 인물의 디자인은 별도 IDENTITY 입력이다. 새 방향은 해당 인물의 승인 정면을 우선하여 이어가며 필요한 작화/그립 보조를 역할별로 구분한다. 승인참조에 없는 후면을 있다고 기재하지 않는다. 은발 두상기준/폐기 SD시험/미합격 후보는 기본 마스터에서 제외한다. 도구 입력수 제한 안에서 필요한 원본만 사용한다.

```text
Use case: stylized-concept / identity-preserve / style-transfer as appropriate.
Asset: ONE character in the approved existing SD PIXEL finish.
Input1: target character's OWN identity / equipment / species / age / build master.
Input2: approved scalp_face_v03 NEW OPTION2 (ID6), direction-appropriate view,
for STYLE and PROPORTION only: real skull/visible-face prominence relative
to torso and limbs, readable small-game face, pixel clusters/material blocks.
Input3 when needed: hand/weapon grasp anatomy only, not costume or weapon design.

Do not copy the blond warrior's facial template, hair, gender, armor, weapons,
palette or expression onto another person. Preserve target jaw/cheeks/features,
hair, gender/age, species/build/explicit height, clothing/equipment/anatomical sides.
Judge the actual cranium UNDER hair (estimated scalp crown to chin), not the
outer hair spikes. Keep hair; do not puff hair or enlarge only eyes as a substitute.
Naturally connect neck/torso/limbs. No fixed anatomical head-unit number is adopted.

DELIVERY FRAMING IS SEPARATE FROM INPUT2'S NATIVE CANVAS:
Use the existing technical1254x1254 template: hairTop253, soles1178,
bodyHeight926 inclusive. On different returned native sizes use normalized
head253/1254,foot1178/1254,body926/1254,centerX0.5.
Preserve approved skull/face/body proportions while composing the whole connected
character/equipment within this delivery frame at generation time. Do NOT copy
Input2's tiny margins or assume its1133x1388 /1077x1460 canvas is the template.
Held weapon/staff/shield/cape/feather bounds are separate from anatomical body height.
Keep the same body scale/ground baseline/camera across target-character views.
Do not stretch/resample/re-encode actual returned PNGs to force a canvas size.

Pose/view: [requested direction; both-feet-planted idle unless requested otherwise].
Rotate head/chest/pelvis/feet/equipment coherently;45deg and true90deg distinct.
Preserve asymmetric ownership; natural far-side occlusion, no mirrored substitutes.
Hands physically wrap handles with opposing thumb; wrist/palm/weapon axes continuous.
True clean alpha; full hair/boots/equipment tips inside safe margin; no guide lines.
No unwanted fringe/dots/text/background. Approved reference fringe/small margins/
micro-detail inconsistencies are NOT permitted defects for new delivery.
Preserve returned native dimensions, alpha and bytes.
```

생성 수치와 원본 실측을 구분한다. 기술 템플릿은 `generation.framing_canvas`/`body_framing`, 원본별 크기는 `reference.native_dimensions`/`reference.views`를 읽는다. 숨은 정수리·얼굴영역의 추정오차를 기록하고 전체 표시키를 맞춘 밝고어두운/작은표시에서 검수한다.57/72CSSpx 갤러리는 실게임 검증으로 보고하지 않는다.

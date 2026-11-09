# SD 공통 생성 프롬프트

실제 입력 이미지는 캐릭터 디자인 원본, 은발·날개 지팡이의 해당 방향 기준 원본, 필요한 손 그립 가이드로 구성한다. 폐기된 새 SD 시험과 그 견본은 기본 참조에 넣지 않는다. [공통 기준](SD_공통제작기준.md)과 [제작 순서](../../../자료/캐릭터설정/제작순서.json)를 함께 적용한다.

```text
Use case: stylized-concept / style-transfer.
Asset type: one character in the established SD pixel style.
Input 1 = this character's IDENTITY and equipment reference only.
Input 2 = the actual silver-haired wing-staff SD reference for STYLE,
head/body proportions, camera, body scale and foot registration.
Input 3, when needed = hand/weapon grasp guide only.

Match the reference character's head size, SD head/body balance, torso/leg
lengths, pixel clusters and camera. Use the new character's own face,
hair, clothing, palette and equipment. Keep the same body size across classes.

BODY FRAMING, independent of held equipment:
On a 1254x1254 reference canvas, head/hair top is y=253, foot soles y=1178,
and the character's body height is 926px. On other native canvas sizes,
use head-top ratio 0.201754..., foot-baseline ratio 0.939394...,
and body-height ratio 0.738437.... Center the body horizontally.
Match the visible body to this scale at generation time. Place equipment
around that body without changing its scale to fit a staff, sword or shield.
Keep the same body scale and foot baseline when changing view direction.
The user's two red guide lines specify VERTICAL BODY HEIGHT: place the
head/hair top at the upper line and the foot soles at the lower line.
Preserve the character's own width and build. The annotated UI crop is
height guidance; use the canonical framing ratios for canvas coordinates.
Do not paint the red guides into the character image.

Pose/view: [the requested front / right profile / back / three-quarter].
Identity and species/build: [character brief; honor explicit height exceptions].
Hands/weapons: [anatomical ownership and the fixed one-handed grip].
Background: actual clean alpha transparency, no dots, vignette or painted grid.
No extra characters, text, labels, watermarks or unintended cropping.
Preserve the actual returned image dimensions and bytes.
```

수치는 구조화 기준의 실제 측정값을 우선한다.

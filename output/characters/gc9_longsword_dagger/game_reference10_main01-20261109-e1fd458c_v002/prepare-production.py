from pathlib import Path
import json,hashlib,shutil
from PIL import Image
R=Path(__file__).parent
P=R.parent/'combat_ready_right045_illustration_proportions_v02'
A=P/'sd-pose-original.png';B=P/'combat-ready-illustration-proportions.png'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def write(p,x):p.write_text(json.dumps(x,ensure_ascii=False,indent=2),encoding='utf-8')
rows=[
('01_arknights','명일방주','arknights','references/arknights/combat-inset-v2.png','https://play.google.com/store/apps/details?id=com.YoStarEN.Arknights&hl=en','A',
'공식 스토어 홍보물 오른쪽 인셋의 배치 타일·적 카운터·전투 중 오퍼레이터. 왼쪽 큰 일러스트는 제외.',
'큰 머리와 작은 몸통, 짧지만 분리되는 장화. 화면상 머리 포함 약 2.5~3두신으로 보이나 가림과 원근이 있어 추정.',
'가늘고 어두운 색 외곽과 비교적 각진 헤어/옷 덩어리.',
'광택을 적게 쓴 매트한 어두운 색면, 작은 밝은 면으로 재질 구분.',
'눈과 헤어 외곽, 의상의 큰 명도 구획으로 식별. 작은 장식은 뭉침.',
'짧고 각진 SD, 매트한 청/은 면과 절제한 하이라이트. 우리 갑옷과 쌍수 자세 유지.',
'Use the compact tactical battlefield chibi visible in image 2: a large but angular head, tiny torso, short separate boots, roughly 2.6 hair-inclusive heads in a relaxed full height (working design only). Fine dark colored contour, angular hair clumps, restrained matte 2-step shadows, sparse small highlights, dark cool midtones. Avoid rounded plush mascot and glossy ornate illustration. Render a small readable 2D combat sprite, NOT the large promotional portrait.'),
('02_azur_lane','벽람항로','azur_lane','references/azur_lane/combat-inset-v2.png','https://play.google.com/store/apps/details?id=com.YoStarEN.AzurLane&hl=en','A',
'공식 스토어 홍보물 아래쪽 전투 인셋: 해상 적·체력바·조작 UI와 3명의 작은 전투 캐릭터. 위 성인 일러스트/중간 편성창 제외.',
'머리가 몸 전체의 거의 절반인 극단 SD, 짧은 손발과 넓은 얼굴. 기울어진 홍보 패널이므로 정확한 등신 실측 불가.',
'또렷한 얇은 갈색/짙은 외곽과 둥근 작은 실루엣.',
'밝고 선명한 셀 면, 머리/눈의 작은 광택, 제한된 어두운 부분.',
'매우 큰 눈과 큰 머리색, 짧은 신체를 한 덩어리로 읽음.',
'머리 큰 약2두신과 매우 짧은 팔다리, 밝은 금/청/은의 선명한 면. 자세/장비는 원형 유지.',
'Use ONLY the tiny combat chibis at the left of the sea battle in image 2: EXTREMELY squat approximately 2 hair-inclusive heads, head about half body height, broad readable face and tiny bent arms/legs. Small smooth colored contours, bright clean compact cel shading, tiny glossy eye and hair highlights. Keep youthful male determination, not baby age. No ships, naval gear, feminine costume, water or UI. Do NOT use the mature portrait or skill cut-in as the proportion reference.'),
('03_priconne','프린세스 커넥트 Re:Dive','priconne','references/priconne/frame-000.1.png','https://priconne-redive.jp/about/','A',
'공식 소개 페이지 전투 영상 0.1초. Wave2/3·HP·적 골렘과 파티 전투 스프라이트. 필살기 컷인 프레임은 제외.',
'짧은 몸통에 둥근 큰 얼굴, 벽람보다 다리와 갑옷 분리가 더 읽히는 SD. 약2.5~3두신의 시각적 범위.',
'가는 갈색 테두리, 부드럽고 둥근 헤어/갑옷 윤곽.',
'밝은 파스텔에 가까운 밝은 면과 단순한 셀 그림자, 깨끗한 흰 하이라이트.',
'둥근 볼·큰 눈·헤어색과 무기의 큰 실루엣을 우선.',
'벽람의 극단SD보다 긴 종아리와 분리된 몸통, 밝은 둥근 애니 SD.',
'Follow the rounded anime battle sprites of image 2, NOT any skill portrait. A cheerful-bright rendering but same serious young male face. Approx 2.9 hair-inclusive heads, visibly more separated torso and longer calves than extreme 2-head chibi. Thin warm brown contours, rounded broad cheek planes, soft bright cel colors, simple pale shadows and white glints. Detailed enough to separate armor tiers but no photoreal textures.'),
('04_another_eden','어나더 에덴','another_eden','references/another_eden/store-shot-0.jpg','https://store.steampowered.com/app/1252600/ANOTHER_EDEN/','A',
'공식 Steam 전투 화면. 오른쪽 파티·왼쪽 적·Attack와 상태 UI. 스탠딩 일러스트가 아닌 전투 몸체.',
'큰 머리, 짧고 안정된 허리, 가늘고 짧은 다리. 약3두신 전후로 보이나 자세와 헤어를 포함한 추정.',
'가늘고 갈색을 띠는 외곽, 둥글면서 끝이 정리된 형태.',
'채도 낮은 중간색과 부드러운 작은 음영 면, 과한 번쩍임 없음.',
'헤어 덩어리·부츠·무기 외곽이 먼저 읽히고 의상 주름은 축약.',
'짧은 JRPG 전투 비율과 차분한 색 외곽/절제된 재질을 사용.',
'Use the short JRPG battlefield characters on the right in image 2. About 3.2 hair-inclusive heads, compact chest and hips, small hands, short slim legs and grounded boots. Fine warm dark-brown colored outline, muted golden blond and sober blue, soft compact shaded volumes, low contrast interior line work. Less glossy and less high-key than cute mobile anime chibis. No background or enemy bike.'),
('05_reverse1999','리버스: 1999','reverse1999','references/reverse1999/extra-store-shot-5.jpg','https://store.steampowered.com/app/3092660/Reverse_1999/','B',
'공식 Steam Wave/Round·카드 손패·적/아군이 함께 있는 전투 화면. 의상창·로비는 제외.',
'상대적으로 큰 머리와 가늘고 늘씬한 하체가 공존하는 중간 비율. 약4두신 계열의 시각적 추정.',
'약하고 가는 갈색 경계, 큰 윤곽 위주로 내부선 절제.',
'저채도 크림/회색 계열과 매트한 넓은 면, 재질의 강한 번쩍임보다 명도 구획.',
'얼굴과 긴 다리 실루엣, 의상 덩어리를 분리하며 미세 금속선 축약.',
'약4두신의 가는 하체, 저채도 매트 면/약한 경계. 종이·수채 효과를 임의 추가하지 않음.',
'Translate the actual battlefield figures on the RIGHT in image 2: a medium roughly 4-head silhouette, larger head than adult anatomy but long slim legs, understated fine warm contours and very sparse interior line. Muted cream silver, softened golden hair, desaturated blue cloth, broad matte painted color planes, restrained gentle gradients and subtle shadow. NOT glossy anime cel, NOT paper cutout, NO watercolor paper texture. Keep our armor design.'),
('06_epic_seven','에픽세븐','epic_seven','references/epic_seven/store-shot-1.jpg','https://store.steampowered.com/app/5019180/Epic_Seven/','B',
'공식 Steam 전투 화면. 보스 HP·스킬 버튼·전투 중 파티의 전신. 하단 큰 캐릭터 컷인은 분석에서 제외.',
'성인형에 가까운 긴 팔다리와 작은 허리, 머리는 일반 성인보다 약간 강조. 약5~6두신 관찰 범위.',
'선명한 가는 애니메이션 펜선과 예리한 머리/갑옷 끝.',
'또렷한 셀 그림자와 밝은 금속 하이라이트, 매끈한 색면.',
'긴 다리와 무기 방향을 남기고 소품은 묶음으로 읽힘. 작은 표시에서 얼굴 세부는 줄어듦.',
'중장신 애니 비율과 명확한 셀 면/가는 선. 우리 SD원형의 옷과 장비는 유지.',
'Use ONLY the full-body battlefield characters, not the lower-left portrait, in image 2. Mid-tall anime combat sprite roughly 5.5 hair-inclusive heads, long articulated legs, small waist and readable hands. Crisp thin ink, sharp tapered hair strands, smooth anime colors, decisive hard-edged 2-to-3-value cel shadows, bright clean angular metal reflections. No painterly brush texture. Keep battle-ready pose from image 1.'),
('07_counterside','카운터사이드 원작','counterside','references/counterside/store-shot-2.jpg','https://store.steampowered.com/app/1976440/CounterSide/','B',
'공식 Steam 원작의 라인 전투 HP/타이머/UI. 왼쪽 실제 전투 인물의 전신만 관찰, 카드/컷인/이펙트 제외. 현 서비스 여부는 이 자료로 확정하지 않음.',
'작은 머리와 길고 가는 팔다리, 성인형 장신 실루엣. 약6~7두신 범위 추정이며 의상/가림 영향 큼.',
'매우 가는 어두운 윤곽과 정밀한 작은 내부선.',
'얇은 셀 그림자와 부드러운 보조 그라데이션, 낮은 면적의 금속광.',
'긴 팔/다리 비례와 좁은 몸통이 우선. 얼굴은 작은 화면에서 매우 작음.',
'10안 중 가장 긴 성인형 신체와 가는 세부선. 원작의 미래 무기·코트는 복제하지 않음.',
'Use only the two full-body battlefield figures at LEFT of image 2, NOT UI portraits or explosion colors. Clearly tall adult 6.5-head proportions, small head, long slim articulated limbs, narrow waist, fine restrained dark ink and delicate fine armor seams. Subtle layered cel shading with a little soft gradient, not bold chibi ink. Preserve our original armor silhouette at the new proportions; no modern coat, guns or sci-fi accessories. Keep the same bent-knee readiness, do not stand straight.'),
('08_guardian_tales','가디언 테일즈','guardian_tales','references/guardian_tales/frame-022.png','https://guardiantales.com/','A',
'공식 홈페이지 배경 영상 22초의 전투: 피해 수치·무기 휘두름·적. 3초 프레임의 비전투 스프라이트는 보조 외형 관찰만.',
'큰 각진 머리와 매우 짧은 팔다리, 거의2두신의 압축된 도트 실루엣.',
'큰 계단형 픽셀 윤곽과 어두운 경계 클러스터.',
'몇 단계로 묶인 밝음/중간/어둠 픽셀 덩어리. 부드러운 HD선이나 미세 광택선 없음.',
'눈은 소수 픽셀, 주름/손가락을 큰 덩어리로 축약. 무기 방향과 머리색 우선.',
'거친 픽셀 클러스터와 극단적으로 짧은 다리. 원본을 축소한 파일이 아니라 신규 생성 표현.',
'Reinterpret our warrior as the COARSE chunky 2D pixel character sprites in image 2, with image 3 only as auxiliary in-game sprite visibility. Extremely compact near 2-head silhouette, broad blocky head and stubby bent legs, tiny pixel eyes. Use a visibly coarse virtual sprite grid around 48-64 pixels body height, large deliberate square pixel clusters, dark stepped outlines, only 3-value color ramps per material, NO smooth lines, NO antialias-looking painted detail. Generate the pixel artwork anew. Simplify our same equipment into readable pixel symbols, no giant extra props.'),
('09_dfo','던전앤파이터','dfo','references/dfo/us-store-shot-3.jpg','https://store.steampowered.com/app/495910/Dungeon_Fighter_Online/','B',
'공식 Steam 보스 HP와 실제 전투 화면. 왼쪽 전신 적 스프라이트와 전투장 캐릭터의 픽셀 표현을 관찰; 컷인/대사창 제외.',
'작은 머리와 긴 다리의 성인형 픽셀 비율. 약6두신 전후. 적/아군마다 체격이 달라 단일 게임 규격으로 단정하지 않음.',
'세밀한 계단형 외곽과 촘촘한 내부 픽셀선.',
'좁은 색상 램프와 날카로운 금속 밝은 픽셀, 천의 어두운 색 덩어리.',
'얼굴은 적은 픽셀이나 몸의 관절/근육과 부츠/갑옷 조각은 세밀하게 분리.',
'가디언의 거친SD도트와 대비되는 긴 약6두신/세밀한 도트. 네이티브 게임 납품 규격 주장은 하지 않음.',
'Use the FINE detailed 2D beat-em-up pixel sprites visible in image 2, especially the unobscured full-body opponent on the left; ignore all effects and portraits. Tall roughly 6-head adult male body, long legs, small head, articulated planted fighting stance. Visually fine pixel grid around 150-190 pixels character body height, stepped single-pixel contours and tight clusters, subtle multi-step limited color ramps, bright tiny metal highlight pixels, deep blue and brown shadows. NO smooth HD anime illustration. Do not turn this into coarse 2-head retro mascot.'),
('10_odin_sphere','오딘 스피어 레이브스라시르','odin_sphere','references/odin_sphere/official-osl1.jpg','https://atlus.com/atlus-titles/odinsphere/?ItemID=49','B',
'Atlus 공식 전투 이미지 osl1: HP/POW/PP·공격 중 주인공·적·피해 수치. 요리/탐색 화면은 주 참조에서 제외.',
'큰 머리를 약간 남기되 가는 허리와 길어진 부츠/다리의 동화풍 중장신. 자세가 굽어 정확한 등신 실측 불가, 약4~5두신 계열 추정.',
'검은 펜선보다 어두운 색 경계와 부드러운 외곽.',
'회화적으로 쌓인 작은 음영과 풍부한 금속/천의 색 변화, 부드러운 밝은 면.',
'실루엣을 크게 유지하고 재질은 중간 크기 면으로 묶음. 축소하면 미세 붓결은 사라짐.',
'약4.8두신 중장신과 색 경계 기반의 회화 재질을 우리 전사에 적용. 설경/이펙트/원작 복장은 제외.',
'Use the actual in-battle full-body boy character in image 2, NOT background snow, as a hand-painted 2D action sprite rendering reference. Elegant medium-tall roughly 4.8-head body with narrow waist, long boots, slightly emphasized head, same young adult male identity. Soft colored edges rather than uniform black outline, rich hand-painted warm/cool modeling, dimensional brushed silver metal and softly shaded woven blue cloth, luminous small highlights, no thick impasto or watercolor washes. Clearly painterly instead of hard anime cel. Preserve our exact paired weapon pose.'),
]
lookup={}
def visit(x):
 if isinstance(x,dict):
  if 'file'in x:lookup[str(x['file']).replace('\\','/')]=x
  for y in x.values():visit(y)
 elif isinstance(x,list):
  for y in x:visit(y)
for f in R.glob('*.json'):
 if f.name.startswith(('download-','reference-candidates')):
  try:visit(json.loads(f.read_text(encoding='utf-8-sig')))
  except Exception:pass
common='''Use case: style-transfer / stylized-concept. Deliver ONE isolated full-body 2D game-combat character on real transparent alpha; no text, labels, panels, background, ground shadow, watermark, UI, particles, aura, action trails, or enemies. Input image 1 is OUR pose/identity/equipment authority only, NOT rendering or body proportions. Input image 2 is a REAL GAME COMBAT rendering/proportions reference only. Never copy its character, face, hair, outfit, sex presentation, weapons, symbols, backdrop, or interface. Apply the game sprite body proportions specified below; proportion changes are intentionally allowed.\nIDENTITY: same youthful male warrior, layered spiky GOLDEN BLOND hair, brown eyes, silver plate armor, blue neck scarf and SHORT lowered hood (no long cape), blue waistcloth, brown belt/pouches/trousers. Anatomical RIGHT shoulder (near side / screen-left shoulder in this pose) has crescent pauldron, RIGHT shin screen-left is silver plate; anatomical LEFT boot screen-right is blue wrapped cloth with metal guards.\nPOSE IS LOCKED: front THREE-QUARTER toward SCREEN RIGHT, both knees bent and feet planted widely, left-screen foot back and right-screen foot forward, same forward leaning torso and head yaw as image 1, determined gaze to an enemy at right. Two arms, two hands, TWO weapons only: RIGHT hand in front of waist gripping LONGSWORD extending diagonally up-right, LEFT hand close to upper chest gripping SHORT ANGULAR DAGGER pointing up-right. The longsword retains blue diagonal blade inlays, silver wing-shaped guard and ring knuckle guard. Hands wrap actual grips; do not swap weapons, mirror body, change joint pose, straighten knees, attack or walk.\nFRAMING: include every hair spike, both full soles, all blade tips and guards inside canvas with at least 8% transparent safety margin on all sides. Entire warrior and connected held weapons are a single composition. Do not cut off the soles or sword tip.\nGAME TRANSFER: '''
sources=[];specs=[]
for row in rows:
 id,title,key,file,page,model,evidence,prop,line,shade,small,transfer,style=row
 out=R/id;out.mkdir(exist_ok=True)
 ref=R/file
 info={'id':id,'game':title,'gameKey':key,'sourcePage':page,'retrieved':'2026-11-09','captureDate':'unknown','timestampSeconds':0.1 if key=='priconne' else 22 if key=='guardian_tales' else None,'reference':file,'referenceSha256':sha(ref),'nativeDimensions':list(Image.open(ref).size),'viewedWith':'view_image','screenType':'actual combat screenshot/video frame; promotional inset isolated where noted','combatEvidence':evidence,'proportionsSilhouette':prop,'line':line,'shadingMaterial':shade,'smallSizeSimplification':small,'transferIntoOurCharacter':transfer,'unknowns':['エンジン/Spine/フレーム制作方式は静止画から断定しない','隠れた頭頂/正確な原作等身は未実測'],'sourceImageUrl':lookup.get(file,{}).get('imageUrl',lookup.get(file,{}).get('url'))}
 if key in ['arknights','azur_lane']:
  original=f'references/{key}/play-shot13.png';info['originalFullSource']=original;info['sourceImageUrl']=lookup.get(original,{}).get('url',lookup.get(original,{}).get('imageUrl'));info['sourceDerivation']={'method':'ffmpeg crop only; no scaling or perspective correction','roiXYWH':[1160,145,1360,680] if key=='arknights' else [325,1360,860,540],'initialCropPreserved':'combat-inset.png','limitation':'홍보 인셋의 작고 가려진 전투 몸체; 정확한 계측 불가. 벽람 패널 기울기는 보정하지 않음.'}
 if key=='priconne':info['sourceImageUrl']='https://priconne-redive.jp/_app/immutable/assets/sytem_battle_mov.D60HnmKq.mp4';info['sourceDerivation']={'method':'ffmpeg -ss 0.1, one native-size frame, no scaling','originalFullSource':'references/priconne/battle-video.mp4'}
 if key=='guardian_tales':info['sourceImageUrl']='https://guardiantales.com/images/WebsiteBackground.mp4';info['sourceDerivation']={'method':'ffmpeg -ss 22, one native-size frame, no scaling','originalFullSource':'references/guardian_tales/official-background.mp4'}
 if key=='odin_sphere':info['sourceImageUrl']='https://atlus.com/wp-content/uploads/2015/09/osl1.jpg'
 sources.append(info)
 inputs=[str(A if model=='A' else B),str(ref)]
 if key=='guardian_tales':inputs.append(str(R/'references/guardian_tales/frame-003.png'))
 spec={'id':id,'title':title,'tool':'builtin image_gen.imagegen','imageModel':'tool managed; not text model Sol','prompt':common+style,'referenced_image_paths':inputs,'transparent_background':True,'sourceRoles':['OUR POSE/IDENTITY only','GAME COMBAT RENDERING/PROPORTION only']+(['auxiliary in-game pixel sprite visibility only'] if key=='guardian_tales' else []),'status':'planned'}
 write(out/'generation-input.json',spec);specs.append(spec)
write(R/'sources.json',{'task':'MAIN01-20261109-E1FD458C','iteration':2,'scope':'10 actual-game-based variants TOTAL; not 20media/40assets; proportions may change','games':sources,'researchRule':'공식 전투 이미지/공식 영상 실제 프레임. 인셋 원본 보존. 3D캐릭터·컷인·로비 제외. 배경의 3D 여부와 캐릭터2D 표현 구분. 엔진과 애니메이션 방식 미확정. 수치는 관찰 추정으로 사용자 확정값 아님.'})
write(R/'generation-plan.json',specs)
(R/'제작기준.md').write_text('''# 게임 전투 2D표현 비교 · 차수2\n사용자 재확인 뒤 진행: 실제 게임10종을 연구하여 같은 금발 쌍수전사의 같은 오른쪽앞3/4 전투준비 자세로 총10장을 생성한다. 비율 변경을 허용한다. 이전20매체×2모델 제작은 중단된 별도 이력이다. A/B는 자세·정체성 입력이며 두비율을 각각10개 만드는 요청이 아니다.\n\n공식 전투 이미지/영상 프레임을 실제 열고 머리/몸 비중·선·명암·재질·축약 원리를 기록한다. 홍보물의 큰 일러스트/로비/스킬 컷인/3D 셀 캐릭터를 전투2D스프라이트로 사용하지 않는다. 게임 이름만 붙이거나 팔레트만 바꾼 같은애니 채색은 미달이다. 원작의 의상·인물·장비를 복제하지 않는다.\n\n정체성/장비좌우/양발전투준비/두무기/화면오른쪽앞3/4는 고정한다. 비율은 게임별 시각적 관찰 범위에 따라 신규 생성으로 변경한다. 머리포함 대략 등신은 작업설계 추정이며 원작 공식규격이나 승인 수치가 아니다. 숨은두개골 정수리는 직접 실측값으로 주장하지 않는다.\n\n첫3종(벽람·가디언·오딘)을 개별 생성·실제 열람 검수 후 잔여7종 진행. 투명PNG 원본 바이트/크기/알파 보존. 캐릭터를 수학적으로 늘이거나 축소해 생성 대신 제출하지 않는다. 비교만 CSS 등비표시/실측 발선 등록. 57/72CSSpx는 갤러리 관찰이며 실게임/실기기 검증 아님.\n\n원본 작업/공통SD규정/카탈로그/게임/public/사용자UI를 변경하지 않는다. 자동 채택·통합·커밋·푸시·외주API 호출 없음. 생성 성공은 사용자 미적 합격이 아니다.\n''',encoding='utf-8')
lines=['# 실제 전투 참조 분석 · 생성 전 설계','공식 스토어는 게시자의 이미지지만 홍보 조합일 수 있다. 실제 전투 인셋만 분석했고, 영상은 아래 실제 시각의 프레임을 추출했다. 캡처일은 모두 불명이며 다운로드일은 2026-11-09다. 정적 원근·가림·작은 픽셀 때문에 공식 등신이나 엔진을 확정하지 않는다.']
for s in sources:
 lines+=['\n## '+s['id']+' · '+s['game'],f"출처: {s['sourcePage']}\n파일: {s['reference']} / 시각: {s['timestampSeconds']}", '1. 전투 근거: '+s['combatEvidence'],'2. 비율/실루엣: '+s['proportionsSilhouette'],'3. 선: '+s['line'],'4. 명암/재질: '+s['shadingMaterial'],'5. 작은 화면 축약: '+s['smallSizeSimplification'],'6. 우리 캐릭터 적용: '+s['transferIntoOurCharacter']]
(R/'분석.md').write_text('\n\n'.join(lines),encoding='utf-8')
print(json.dumps({'sources':len(sources),'specs':len(specs),'A':sha(A),'B':sha(B),'missingSourceUrls':[s['id'] for s in sources if not s['sourceImageUrl']]},ensure_ascii=False))

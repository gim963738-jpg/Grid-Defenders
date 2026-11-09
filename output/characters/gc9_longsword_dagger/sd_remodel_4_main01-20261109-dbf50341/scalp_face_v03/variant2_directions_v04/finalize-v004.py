from pathlib import Path
from PIL import Image
import json,hashlib,datetime,subprocess
D=Path(__file__).resolve().parent
T=Path('C:/Users/user/Desktop/Grid Defenders/작업관리/작업/MAIN01-20261109-DBF50341')
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def read(p):return json.loads(Path(p).read_text(encoding='utf-8-sig'))
def write(n,s):(D/n).write_text(s,encoding='utf-8')
def dump(n,o):write(n,json.dumps(o,ensure_ascii=False,indent=2))
now=datetime.datetime.now().astimezone().isoformat()
M=read(D/'asset-manifest.json');A=M['compareArt'];task=read(T/'task.json')
assert task['iteration']==4 and task['status']=='in_progress'
before=read(D/'previous-files-before.json')
oldcheck=[dict(path=x['path'],before=x['sha256'],after=sha(x['path']),unchanged=sha(x['path'])==x['sha256']) for x in before]
assert all(x['unchanged'] for x in oldcheck)
dump('preservation-check.json',dict(checkedAt=now,allUnchanged=True,count=len(oldcheck),files=oldcheck))

srcdir=Path('C:/Users/user/.codex/generated_images/01a1bf68-4705-71f0-9449-07a1041b38d9')
sources=['exec-052767cf-d360-4739-ab0b-dab1a93bce10.png','exec-1b4b4a29-5219-4952-a4d9-c306777c097c.png','exec-816d7f1c-dd23-4d1e-9552-8c3f9c8d3051.png','exec-1b0413fc-b78d-4b51-b532-26e2ccbe36b3.png']
retained=['variant-2-right-045.png','candidates/right90-first.png','candidates/right90-refinement.png','variant-2-right-090.png']
specs=read(D/'generation-specs.json')+[read(D/'generation-right90-refinement-spec.json'),read(D/'generation-right90-pixel-spec.json')]
calls=[]
for i,(name,file,s) in enumerate(zip(sources,retained,specs)):
 src=srcdir/name;assert sha(src)==sha(D/file)
 inputs=[dict(path=p,sha256=sha(p)) for p in s['referenced_image_paths']]
 im=Image.open(src)
 calls.append(dict(sequence=i+1,prompt=s['prompt'],inputs=inputs,settings={'transparent_background':True,'imageModel':'builtin image_gen tool-managed; no model override','textModelDefault':'GPT-6.1 Sol / medium, separate from image model','externalPaidAPI':False},source=str(src),retained=file,sha256=sha(src),actualSize=im.size,selected=i in [0,3],decision=['45degree accepted for delivery','Initial profile smaller head ratio; history retained','Targeted head correction became too smooth; history retained','Master-only regeneration selected for pixel finish and larger real skull/face'][i]))
dump('generation-records.json',dict(task=M['task'],iteration=4,callCount=4,tool='builtin image_gen.imagegen',calls=calls,allOriginalBytesPreserved=True,originalMaster={'path':str(D.parent/'variant-2-front.png'),'sha256':sha(D.parent/'variant-2-front.png')}))
opened=[a['file'] for a in A]+['comparison.png','qa-dark.png','qa-small.png','qa-narrow.png','qa-expanded.png']
dump('view-image-evidence.json',dict(checkedAt=now,method='Actual local tools.view_image of all final PNG and browser captures; separate headless Edge profile',opened=[dict(file=f,sha256=sha(D/f)) for f in opened],observations='45deg two eyes/front chest;90deg one eye/profile nose/side hips and feet; skull/face not merely hair enlarged; blue far boot visible and far left dagger naturally hidden90; faint colored alpha fringe; no user aesthetic approval claim'))

write('제작기준.md','''# 신규2안 방향 전개 기준 · 차수4

사용자 직접 요청 “신규 2안 기준으로 45도 90도 만들어볼래? 적용까지”를 적용한다. 유일한 디자인·실제 두상/얼굴·체형·화풍 마스터는 scalp_face_v03/variant-2-front.png, SHA256 3cb5cafa69bf23ae43b95676a9c43f410827a5b42c25481fcdd5f472a9b88e53다. 이전 차수variant2와 신규1/3/4안은 사용하지 않는다. 이번 지정은 두 방향과 개발자 이미지대조 연결에 한정하며 전안 미적합격·기본 전투유닛 교체·공통 SD비율 확정이 아니다.

정면의 층진 금발·갈색눈·청년 남성 인상·완만한 턱과 작은 닫힌 미소, 은갑옷·청색 목도리/짧게내려진 후드·허리천·갈색 벨트/주머니/바지를 회전한다. 오른손 장검 청사선/날개가드/고리 보호대, 왼손 짧고 각진 단검, 오른 초승달견갑/판금정강이, 왼 청색천장화의 인체 좌우를 보존한다. 긴망토·새무기·새문양·이름·스탯 추가 없음.

45도는 화면 오른쪽 앞사선으로 두 눈(먼 눈은 좁게)과 일부 앞흉갑을 보인다.90도는 화면 오른쪽 정측면으로 한 눈·코/입/턱 옆선·옆흉갑/골반·겹친 어깨와 오른쪽을 향하는 발로 구분한다. 머리만 돌리지 않고 몸/골반/발/장비를 함께 회전한다. 양발 대기자세이며 걷기/공격이 아니다. 오른쪽 장비가 가까운 면이다. 먼 왼팔/단검/발의 자연 가림은 허용하고 보여주려고 팔다리/무기를 늘리지 않는다. 단순 반전 금지.

머리 단위는 모발 안 숨은 두개골 정수리~턱의 추정이며 모발끝~턱과 구분한다. 정면의 큰 두상·얼굴/몸 비중을 유지하되 정수리를 직접 실측했다고 주장하지 않는다. 이마/관자·귀 높이와 가능한 두개골 타원으로 추정, 정수리±40px·턱±10px. 얼굴 사각영역은 투영 외접 근사치로 가림을 포함하며 정확한 피부면적이 아니다. 얼굴 너비는 각도 투영 때문에 정면과 직접 동등비교하지 않는다.

개별 PNG는 실제 생성 반환바이트/알파/크기를 유지한다. 캔버스나 두상을 수학적으로 늘리거나 픽셀 리샘플링하지 않는다. hairTop~sole(양끝포함) 본체높이는 검끝/외곽여백과 분리하고 발지지중심은 육안 추정오차를 남긴다. 비교CSS/후속런타임의 등비등록만 허용한다. 같은 전체표시키/발선에서 세방향과57/72CSSpx를 확인한다. 갤러리 관찰과 실제게임/실기기 검증을 구분한다.

이번 정교화: 정면에서 방향 전개할 때 사선 두 눈/정측면 한 눈과 몸통·발을 함께 검사하며, 비대칭 장비의 소유 손을 그림의 화면좌우 대신 인체좌우로 판정한다. 숨은 무기를 보이지 않는다는 이유만으로 추가하지 않는다. 초기90도의 작아진 두상·매끈해진 후보를 기록하고 선택정면 마스터로 재생성한다. 이는 이 신규2안의 작품별 기준이며 공통규정 변경 제안/확정은 아니다.
''')

rows=[]
for a in A:
 rows.append(f"|{a['direction']}|{a['width']}×{a['height']}|{a['hairTop']}|{a['footX']} / {a['footY']}|{a['bodyHeight']}|{a['scalpCrown']['y']}±40 / {a['chin']['y']}±10|약{a['estimatedHeadToBodyRatio']*100:.0f}%|약{a['hairTopToChinOverBodyHeight']*100:.0f}%|")
write('분석.md','''# 차수4 방향 분석

선택 정면을 실제 view_image로 확인했고 내장 생성 총4회(45도1회,90도 초기/표적보정/마스터재생성 각1회)를 수행했다. 초기90도는 정면 대비 모발끝~턱 비중이 작아 보였다. 표적보정은 얼굴을 조금 늘렸으나 외곽선이 매끈해져 픽셀 표현 일관성이 약해졌다. 두 후보를 보존하고, 정면만을 디자인/두상/픽셀 마스터로 재생성한90도를 선택했다. 최종45/90은 실제 새 생성이며 이전 측면이나 반전본이 아니다.

45도는 두 눈의 투영 너비 차이와 일부 앞흉갑·두 다리의 깊이 차이를 보인다.90도는 한 눈과 코/입/턱의 옆선, 겹친 어깨·옆골반·오른쪽 지향 장화를 보인다.90도에서 가까운 오른손 장검과 초승달견갑/판금정강이가 유지되고 먼 왼손 단검은 가려진다. 단검을 별도 보이게 옮기지 않았다. 먼 청색천 장화 일부는 뒤쪽에 보인다.

검끝을 제외한 머리/발 ROI의 알파32로 모발끝~발바닥을 측정했다. 발X는 보이는 양발 지지영역 사이 중심의 수동 근사이며±30px,발Y±3px,본체높이±4px 오차를 둔다. 정수리는 모발 아래 숨은 점으로 직접 측정할 수 없고 이마/관자·귀·두개골 타원의 연결로 추정한다. 주석선·머리 가르마를 정수리로 사용하지 않았다.90도의 얼굴너비 축소는 원근 투영이므로 두상축소 증거로 단정하지 않는다.

|방향|실제PNG|hairTop y|footX / footY|bodyHeight|추정scalpCrown / chin|추정두상/본체높이|모발끝~턱/본체높이|
|---|---|---|---|---|---|---|---|
'''+ '\n'.join(rows)+'''

정면/45/90의 두상 비중은 약25/23/24%로 추정되며 모발끝~턱은 약35/33/33%다. 완전히 동일한 등신이라고 주장하지 않는다.45도에서 턱선이 조금 짧고,90도에서 코/턱의 측면 투영이 더 또렷해 성숙한 인상으로 읽힐 수 있다. 모발만 부풀린 보정이 아니라 얼굴·두개부와 목/몸통 연결을 함께 생성했다. 목도리/후드 주름·가드 날개 수/분할·벨트 작은 금속면은 생성별 세부차이가 남지만 장비종류·소유손·원래 배색/실루엣은 유지한다.

전신 비교는500CSSpx 본체높이와 동일발선으로 등록하고 좁은화면에서 세열전체를 등비축소한다.57/72CSSpx행은 별도 전역축소 없이 요청 본체높이를 사용한다. 세방향의 얼굴 위치와 장비비대칭이 작은크기에서도 구별되나57px에서는 개별표정/손가락 판독이 제한된다. 실제 게임 적용/실기기 검증은 후속담당 범위다.
''')

issues=[
'숨은 정수리±40px/턱±10px 추정오차; 정확히 같은 해부학적 등신이나 새 공통비율 확정 아님.',
'45도 두상 비중은 추정상 정면보다 조금 작으며,90도 측면 코·턱은 정면보다 성숙하게 읽힐 수 있어 사용자 미적 평가 대상.',
'장비 정체성/인체좌우는 유지하나 후드 주름·가드 날개 분할·벨트 금속면 등의 미세 생성차이가 남음.',
'90도 먼 왼손/단검은 자연가림이므로 별도 완전한 형태 검수는 불가능하며 보이도록 추가하지 않음.',
'세원본의 상단/하단 여백이 넉넉하지 않고 기존 공통 SD 프레이밍에 일치한다고 주장하지 않음.',
'밝고어두운배경에서 머리/장비 외곽에 가는 적색·갈색 등 반투명 가장자리 잔여가 보임; 원본바이트를 보존했고 게임용 픽셀 정리 완료로 주장하지 않음.',
'57/72CSSpx는 별도 갤러리 관찰; 게임 통합·실기기 검증·사용자 미적 합격은 이번 캐릭터 담당이 수행하지 않음.'
]
write('검수.md','''# 신규2안 세방향 검수 · 차수4

정면과 신규45/90PNG를 실제 로컬 view_image로 열어 확인했다. 최종 comparison.png/qa-dark.png/qa-small.png/qa-narrow.png/qa-expanded.png도 실제 열었다. 별도 headless Edge 프로필을 사용했고 사용자 앱 창/탭/패널/설정은 조작하지 않았다. browser-evidence.json과 view-image-evidence.json에 파일/해시 및 실제표시 증거를 남긴다.

|항목|검수결과|
|---|---|
|마스터|정면1133×1388, 지정 SHA3cb5cafa… 원본바이트 사본 일치; 유일디자인마스터 유지.|
|실제생성|최종45도1133×1388,90도1077×1460. 각각 내장실제출력과SHA일치, 원본픽셀 리샘플링/재인코딩 없음.|
|두상/얼굴|새2안의 큰두상과 compact몸 연결 유지,1/3/4안 미첨부.45도약간작은 추정비중/90도성숙한측면인상 한계기록.|
|각도|45도 두눈/앞흉갑일부,90도 한눈/코옆선/측면흉갑·골반·겹친장화. 머리만 회전한 결과 아님.|
|대기자세|양발입상,걷기·공격·긴망토/새무기 추가없음.|
|인체좌우|오른손장검·오른초승달·오른판금정강이가 가까운면,왼청색천장화는 먼면. 좌우반전 대체없음.|
|무기수/손|45도 장검1/단검1/손2.90도 보이는 오른팔/손과장검1, 먼왼팔/단검자연가림. 추가팔다리/무기 없음. 손잡이를감싼장갑·엄지/손가락덩어리와손목연결 확인;5손가락모든관절독립판독은가림/픽셀로제한.|
|무기연결|장검청사선/날개가드/고리보호대·단검각진날 유지. 손잡이/가드/날연결을확인하되모든방향같은화면대각선으로강제안함.|
|잘림/알파|모발·장화·검끝 모두알파32실루엣이캔버스안.알파0..255존재.낮은알파외곽픽셀은보존.|
|표시/발선|CSS등비500본체높이/동일발선;57/72행각3종. 본체ROI가검끝과분리됨.|
|밝고어두운|얼굴/갑옷/무기/장화 전체읽힘,유색반투명외곽은한계.|
|브라우저|세열로드,420px가로넘침없음,90도클릭확대성공.초기PNG캡처하단72행잘림은캡처높이1300으로수정후재열람.|

## 한계와 다음 단계

'''+ '\n'.join('- '+x for x in issues)+'''

제작·메타·비교자료 검수 완료이며 사용자 미적 합격을 대신하지 않는다. main01/gameplay의 개발자 이미지대조 적용으로 연결한다.
''')

files=[a['file'] for a in A]+['comparison.png','index.html','asset-manifest.json','제작기준.md','분석.md','검수.md','generation-records.json']
paths={f:str(D/f) for f in files}
report='''# 신규2안 오른쪽45/90도 제작 보고 · 차수4

MAIN01-20261109-DBF50341 / characters / 두방향 실제제작·세방향비교·게임전달메타 완료.

사용자 선택 scalp_face_v03 신규2안 정면을 유일 마스터로 내장 image_gen 총4회 생성 후 오른쪽앞45도와 완전90도 원본PNG를 제출한다. 정면 사본 SHA3cb5cafa69bf23ae43b95676a9c43f410827a5b42c25481fcdd5f472a9b88e53가 일치하고 새PNG도 생성원본바이트와 일치한다. 초기90도2후보를 보존하고 픽셀표현·두상비중을 재보완한90도를 선택했다. 이전측면을 재사용/반전하지 않았다.

## 산출물 절대경로

'''+ '\n'.join(f'- [{f}]({p.replace(chr(92),"/")})' for f,p in paths.items())+'''

## 게임 담당 연결

asset-manifest.json의 compareArt3개는 variant=6,label=신규2안,direction=front/right45/right90이며 file,width,height,bodyHeight,footX,footY,sha256,source를 포함한다. 파일은read-only로읽고원본바이트복사한다. 같은본체표시키/발선은 런타임메타로등록하며 PNG를 리샘플링하지 않는다. 다른신규1/3/4안방향은생성하지 않았다. 게임/public/아트로더를 본인이 수정하지 않았고 개발자 이미지대조 적용은 main01/gameplay 후속이다.

## 검증과 한계

실제3PNG/비교/밝고어두운전체캔버스/57·72CSSpx/좁은화면/확대창을 열어검수했다.45도두눈과90도한눈/코옆선으로구분되고 오른손장검/초승달견갑/판금정강이가가까운쪽에유지된다.90도먼왼손단검은자연가림이다. 원본바이트/기존파일불변/알파/장비끝잘림을검사했다.

'''+ '\n'.join('- '+x for x in issues)+'''

기존정면/15방향/다른안/공통규정/카탈로그/게임코드/public/사용자창은보존했다. 커밋/푸시/자동백업 없음. .qa-browser-profile은 로컬검수프로필로 업로드제외한다. 사용자에게 같은허락을 재질문하지 않았으며 이번제출은 기본전투유닛 교체나 전안 미적합격이 아니다.
'''
write('report.md',report)
dump('결과.json',dict(task=M['task'],iteration=4,role='characters',status='completed_for_developer_compare_integration',outputPaths=paths,masterPath=str(D.parent/'variant-2-front.png'),masterSha256=A[0]['sha256'],readingAcknowledgement=task['readingAcknowledgement'],checks=dict(generationCalls=4,newDirections=2,actualViewImage=True,sourceBytesMatch=True,noResampling=True,previousSnapshotFilesUnchanged=True,previousFileCount=len(oldcheck),threeDirectionsLightDarkSmallNarrowExpandedInspected=True,userAestheticApproved=False,gameIntegratedByCharacters=False,commonRulesChanged=False,gitCommitPush=False),remainingIssues=issues))

records={
'1_대화기록-characters-v004.md':'# 차수4 대화기록 추가\n\n사용자 “신규 2안 기준으로 45도 90도 만들어볼래? 적용까지”. 대상은 scalp_face_v03 신규2안 정면이며 이전2안이 아니다. 직접지정한2방향과개발자이미지대조연결을실행하고공통규정/기본전투유닛교체로확대하지않는다. 근거 사용자신규2방향-v004.md와발송지시-v004.md를읽었다.',
'2_사전확인-characters-v004.md':'# 차수4 실제 사전확인 연결\n\n이 파일은 완료시점추가연결이다. 생성 전에 작성된 실제 사전확인과 차수4 ACK/start를 연결하며 사전확인을 뒤늦게 수행했다고 표시하지 않는다.\n\n'+str(D/'사전확인.md')+'\n'+(D/'사전확인.md').read_text(encoding='utf-8')+'\n\n'+str(task['readingAcknowledgement']),
'3_작업일지-characters-v004.md':'# 차수4 작업일지 추가\n\n29문서·liveContext·추가본문 재열람 → 차수4ACK/start통과 → 선택정면/그립실제열람·원본SHA확인·사전확인 → 내장45/90생성 → 초기90두상비중검수/표적보정보존 → 정면단독마스터픽셀/두상재생성 → 원본바이트사본·ROI메타·CSS세방향/57·72비교 → 실제PNG/밝고어두운/좁은/확대검수 → 결과·이력추가. 총4호출,하위담당/유료외주없음.',
'4_정의문서-characters-v004.md':'# 차수4 정의 추가\n\n완료: 신규2안45/90실제PNG2장,선택정면사본,세방향비교PNG/HTML,compareArt ID6실측메타,프롬프트/입출력/검수/기준기록. 대기: main01/gameplay개발자이미지대조통합과사용자미적평가. 정확한같은두상비율/일러스트합격/기본전투유닛교체/공통기준확정아님. 각도투영·정수리추정·가드/후드미세차이·알파잔여·좁은여백한계보관.',
'5_버전관리-characters-v004.md':'# 차수4 버전관리 추가\n\n기존원본및차수1/2/3산출물스냅샷SHA불변확인. 새variant2_directions_v04및원작업차수4기록만추가했다. 별도커밋/푸시/예약백업없음. .qa-browser-profile/캐시/잠금파일은업로드제외. 게임소스/public/공통규정/사용자앱설정미편집. 결과물은개발자대조용완료이며미적합격·기본유닛교체로분류하지않는다.'
}
for f,s in records.items():
 p=T/f;assert not p.exists(),f'Will not overwrite {p}';p.write_text(s+'\n\n작성시점: '+now+'\n보고서: '+str(D/'report.md'),encoding='utf-8')
p=T/'characters-결과보고-v004.md';assert not p.exists();p.write_text(report,encoding='utf-8')
print('Reports, generation logs, visual evidence and five iteration4 records written; previous files unchanged: '+str(len(oldcheck)))

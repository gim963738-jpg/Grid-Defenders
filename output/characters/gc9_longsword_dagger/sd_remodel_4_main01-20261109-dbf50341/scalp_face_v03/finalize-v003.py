from pathlib import Path
import json, hashlib, datetime
from PIL import Image

D=Path(__file__).resolve().parent
T=Path('C:/Users/user/Desktop/Grid Defenders/작업관리/작업/MAIN01-20261109-DBF50341')
now=datetime.datetime.now().astimezone().isoformat()
def read(p): return json.loads(Path(p).read_text(encoding='utf-8-sig'))
def sha(p): return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def write(name,text): (D/name).write_text(text,encoding='utf-8')
def dump(name,obj): write(name,json.dumps(obj,ensure_ascii=False,indent=2))
M=read(D/'asset-manifest.json'); A=M['assets']
before=read(D/'previous-files-before.json')
preservation=[dict(path=x['path'],before=x['sha256'],after=sha(x['path']),unchanged=sha(x['path'])==x['sha256']) for x in before]
assert all(x['unchanged'] for x in preservation)
dump('previous-files-after-check.json',{'checkedAt':now,'allUnchanged':True,'scope':'previous parent and directions_v02 top-level files captured before this iteration','files':preservation})
opened=['original.png']+[f'variant-{n}-front.png' for n in range(1,5)]+['comparison.png','qa-small.png','qa-dark.png','qa-narrow.png','qa-expanded.png']
dump('view-image-evidence.json',{'checkedAt':now,'method':'Actual tools.view_image local inspection, plus separate headless Edge browser screenshots and DOM evidence','opened':[{'file':f,'sha256':sha(D/f)} for f in opened],'observations':'All full sprites visible; true face enlargement mild in1/2, strong in3/4; small-scale face features clearer3/4; light/dark show fine colored fringe; final2 sword points outward-down; no claim of user approval'})

calls=[]
for sf,rf in [('generation-specs.json','generation-first-returned.json'),('generation-refined-specs.json','generation-refined-returned.json'),('generation-balanced-spec.json','generation-balanced-returned.json'),('generation-balanced-face-spec.json','generation-balanced-face-returned.json')]:
    specs=read(D/sf); returns=read(D/rf)
    if not isinstance(specs,list): specs=[specs]
    if not isinstance(returns,list): returns=[returns]
    for i,(s,r) in enumerate(zip(specs,returns)):
        inputs=[]
        for j,p in enumerate(s['referenced_image_paths']):
            retained=Path(p)
            if sf=='generation-balanced-face-spec.json' and j==0:
                retained=D/'candidates/variant-2-balanced-before-face.png'
            inputs.append({'calledPath':p,'retainedExactInput':str(retained),'sha256':sha(retained)})
        source=Path(r['source'])
        calls.append({'sequence':len(calls)+1,'specFile':sf,'specIndex':i,'prompt':s['prompt'],'settings':{'transparent_background':s['transparent_background'],'imageModel':'builtin image_gen tool-managed; no model override parameter','paidExternalAPI':False},'inputs':inputs,'returned':r,'outputSha256':sha(source),'nativeSize':Image.open(source).size})
assert len(calls)==10
dump('generation-records.json',{'task':M['task'],'iteration':3,'tool':'builtin image_gen.imagegen','callCount':10,'noExternalPaidAPI':True,'originalBytesPreserved':True,'calls':calls,'finalSelection':read(D/'final-selection.json'),'historyNote':'Initial four were insufficiently separated; initial option2 was subsequently selected as restrained final1. Per-call historical filenames are not final-selection labels; final-selection.json is authoritative. Balanced face edit input is retained separately because its working path later received final output.'})

write('제작기준.md','''# 두상·얼굴 확대 SD 4안 · 차수3

사용자 원문은 “참고해서 4안 새로 뽑아와줘”이며 사용자두상확대-v003.md의 정정을 적용한다. 이전 차수4안은 승인 마스터가 아닌 수정 전 이력이다. 이번은 같은 금발 전사의 정면 선택용4안이며 추가 방향·애니메이션·게임 교체나 공통 비율 확정은 포함하지 않는다.

기존 hairTop~chin을 머리1단위로 삼으면 부풀거나 뾰족한 모발 때문에 실제 두상·얼굴이 작아도 목표 등신으로 보이는 문제가 있다. 이번은 모발 외곽 hairTop, 모발 아래 숨은 scalpCrown 추정, chin, sole, 얼굴 영역, 무기 포함 알파 외곽을 각각 기록한다. 두상 단위는 추정 scalpCrown~chin이고 전체 비교 표시 높이는 hairTop~sole다. scalpCrown~sole/두상 단위와 hairTop~sole/(hairTop~chin)은 별개 수치다. 이전3.3을 새 두상 목표로 옮기지 않는다. 생성 프롬프트의 수치는 탐색 설계값이며 사용자 확정값도 결과 실측값도 아니다.

숨은 정수리는 이마·관자 연속선, 귀 높이, 그 아래 가능한 두개골 타원으로 추정한다. 머리 가르마나 뾰족한 끝을 정수리로 확정하지 않는다. 원본과1안 ±35px,2안 ±40px,3안 ±50px,4안 ±55px의 불확실성을 둔다. 턱 ±8px, 얼굴 사각 영역 경계 ±12px. 얼굴 사각 영역은 앞머리 가림·눈 등을 포함하는 외접 근사치이며 실제 피부 면적이 아니다. 자세·그림 양식에 따라 해부학적 추정 자체도 달라질 수 있다.

공통화 목적은 작은 화면의 얼굴 가독성이다. 같은 두상 틀·턱·볼·눈썹을 모든 캐릭터에 복제하지 않는다. 이번 같은 인물의4안에서도 완만한 턱/넓은 볼/눈썹 기울기와 몸 비중의 차이를 허용한다. 청년 남성 인상과 금발 뾰족 헤어를 유지하고 유아·다른 직업으로 바꾸지 않는다. 모발을 제거하거나 모발·눈만 확대하지 않는다. 목·어깨·몸통·사지도 생성 단계에서 다시 연결한다.

금발·갈색눈·은빛갑옷·청색 목도리와 짧은 내려진 후드·허리천·갈색 벨트/주머니/바지를 유지한다. 인체 오른쪽=정면 화면 왼쪽에 초승달 견갑·판금 정강이·오른손 장검, 반대쪽에 청색천 장화·왼손 짧은 각진 단검. 장검 청색 사선·날개 가드·고리 보호대 유지. 새 무기·긴 망토·이름·출신·스탯을 추가하지 않는다.

개별PNG는 내장 image_gen 실제 출력 바이트를 그대로 복사하며 리샘플링/확대 재저장하지 않는다. 비교는 CSS 등비 등록만 수행한다. 전신5종의 hairTop~sole 높이와 발선을 같게 하고 얼굴 확대는 각 전신 표시 배율에 공통2배만 곱한다. 얼굴 각각을 동일 크기로 맞추지 않는다. 작은 표시57/72CSSpx도 전체 높이 기준이며 갤러리 관찰이다. 실제 게임/실기기 검증으로 보고하지 않는다.

## 공통 기준 보완 제안 — 미적용

향후 공통 SD 정의에 모발 포함 표시 높이와 추정 두상 단위, 얼굴 높이/너비 및 작은 표시 평가를 함께 기록하는 방식을 제안한다. 단일 등신값만으로 얼굴 가독성을 판정하지 않는다. 이번 사용자 선택 전에는 공통 규정·기존 기준·카탈로그를 변경하지 않는다.
''')

rows=[]
for a in A:
    r=a['relativeToOriginalAtEqualHairTopToSoleHeight']
    rows.append(f"|{a['label']}|{a['width']}×{a['height']}|{a['hairTop']} / {a['scalpCrown']['y']}±{a['scalpCrown']['uncertaintyPx']} / {a['chin']['y']} / {a['sole']}|{a['bodyHeight']}|약{r['scalpHeadLinearRatio']:.2f}배|약{r['faceHeightRatio']:.2f}배|약{r['faceWidthRatio']:.2f}배|")
small=[]
for a in A:
    x=a['displaySizes']
    small.append(f"|{a['label']}|약{x['57']['faceWidth']:.1f}×{x['57']['faceHeight']:.1f}px|약{x['72']['faceWidth']:.1f}×{x['72']['faceHeight']:.1f}px|")
write('분석.md','''# 차수3 분석

머리카락 포함 등신이 얼굴 가독성을 보증하지 못했다는 사용자 지적을 적용했다. 원본/이전4안과 두 참조를 실제 열람했고, 모발 디자인은 유지하면서 숨은 두상과 드러난 얼굴이 더 큰4안을 다시 생성했다. 이전4안을 현재 승인본으로 사용하지 않았다. 첫4회는 구별이 약해 원본·입력·후보를 보존하고 추가6회로 큰 두상과 중간형을 보완했다. 최종 번호는 생성 호출 번호와 다르며 final-selection.json에 연결된다.

비율 참고의 작은 보라머리 캐릭터는 모발·가림·잘린 화면 때문에 정수리와 정확한 관절 실측이 어렵다. 머리 아래 몸통/다리가 압축되고 얼굴 면이 상대적으로 큰 방향성만 적용했다. 빨간 주석선은 작화에 넣지 않았다. 작은 여러 캐릭터 참조에서는 큰 모자·수염·눈썹·눈의 기울기·짧고 굵은 몸통·장화와 상하의 명도 대비가 직업/성격의 시각적 인상을 나눈다. 둥근 모자·짧은 얼굴과 긴 상의는 부드러운 인상, 넓은 어깨·굵은 눈썹·큰 장갑은 단단한 인상, 비대칭 소품·헤어 방향과 강한 색 면은 모험가 인상을 만든다. 실제 성별·공식 이름·직업은 외모만으로 확정하지 않는다. 이번에는 금발전사의 같은 인물 정체성을 우선하고 턱/볼·눈썹·몸통 비중만 조절했다.

1안: 기존과 가까운 다리 길이·가늘게 모이는 턱을 유지하고 두상/얼굴을 절제해 확대했다. 2안: 목·상체를 더 압축하고 얼굴의 세로 면을 늘린 중간형이다. 3안: 넓은 볼·큰 두상에 갑옷 몸통/사지를 짧게 조합했다. 4안: 큰 얼굴과 좀 더 짧은 몸, 선명한 눈썹·턱의 읽기를 우선한다. 1/2의 차이는 주로 얼굴 세로와 몸통 길이이며 얼굴 폭 차이는 작다. 3/4는 서로 가까운 큰 두상군이고4안이 얼굴 비중이 조금 더 크다. 네 결과가 균등한 비율 단계로 생성됐다고 주장하지 않는다.

아래는 native 좌표와 동등한 전체 표시 높이에서의 근사 비교다. 정수리는 숨겨져 직접 실측할 수 없다. 모발끝·발선은 알파32와 머리/발 관심영역으로 확인하고 검끝은 몸 높이에서 제외했다. 경계·방법·오차는 manifest에 기록했다. 표의 비율은 선택용 추정치이며 사용자 확정값이 아니다.

|안|실제PNG|hairTop / 추정scalpCrown / chin / sole y|전체 표시 높이|두상선형/기존|얼굴높이/기존|얼굴너비/기존|
|---|---|---|---|---|---|---|
'''+ '\n'.join(rows)+'''

얼굴은 피부를 정확히 분할한 면적이 아닌 가림을 포함한 사각 영역으로 측정했다. 같은 전체 키에서 얼굴 영역 면적 대용치는1안 약1.27배,2안 약1.40배,3안 약3.32배,4안 약3.54배다. 추정 오차를 감안하면1/2와3/4의 작은 차이를 엄밀한 순위로 해석할 수 없다. 눈만 키운 결과는 아니며 턱·볼·귀 주변/얼굴 세로 면과 몸 비중도 함께 바뀌었다.

|안|57CSSpx의 얼굴 영역 너비×높이|72CSSpx의 얼굴 영역 너비×높이|
|---|---|---|
'''+ '\n'.join(small)+'''

작은 표시에서1/2는 원본보다 얼굴 세로 면이 늘지만 세부 표정은 여전히 제한된다.3/4는 얼굴의 눈·코/입 위치가 더 잘 분리된다. 이는 브라우저 갤러리 관찰이며 게임 통합·실기기·사용자 미적 합격이 아니다. 머리카락의 층/뾰족한 방향은 유지했으나 신규 생성으로 세부 가닥·갑옷 면이 원본과 픽셀 단위로 같지는 않다.
''')

issues=[
'1/2의 얼굴 폭 차이와3/4의 두상 차이는 작고 균등한4단계는 아니다; 얼굴/몸 비중과 턱·눈썹의 선택용 차이로 제출한다.',
'2안 장검은 원본처럼 바깥 아래로 향한다; 오른손·그립·날 연결은 보이나 몸 앞 반대발 방향의 선호 그립 축은 완전히 재현되지 않았다.',
'모발 아래 정수리는 추정이며 정확한 해부학적 등신/사용자 확정 비율이 아니다.',
'3/4의 큰 두상은 더 어린 인상을 줄 수 있어 사용자 선택이 필요하다; 청년 인상 유지의 미적 합격을 대신 판정하지 않는다.',
'전체 실루엣은 잘리지 않았지만3/4는 상하 여백이 작고 공통 SD 프레이밍 목표는 미달이다.',
'알파 가장자리의 가는 적색/갈색/청색 반투명 픽셀 잔여가 보인다; 출력 바이트 보존으로 제거하지 않았으며 게임용 최종 정리 완료가 아니다.',
'57/72CSSpx는 비교 페이지 관찰이며 실제 게임·실기기 검증 및 통합은 하지 않았다.'
]
qa='''# 차수3 검수

검수 범위는 선택용 실제4PNG, 원본 사본, 비교PNG와 별도 headless Edge의 밝은/어두운 배경·작은 표시·420px 좁은 화면·클릭 확대다. 사용자 현재 창/탭/패널은 조작하지 않았다. 로컬 view_image로 original 및 variant1~4, comparison/qa-small/qa-dark/qa-narrow/qa-expanded를 실제 열었다. 증거는 view-image-evidence.json과 browser-evidence.json에 남긴다.

|검사항목|결과와 한계|
|---|---|
|실제 신규4장|내장 image_gen 총10회 중 선택된4개; 파일명만 바꾼 동일그림 아님. source SHA 일치.|
|원본 보존|original.png 원본 SHA256 일치; 이전 차수 스냅샷 대상 파일 모두 불변.|
|원본 크기/알파|1/3/4 1254²,2 1133×1388 RGBA, 각 알파0..255. 개별파일 리샘플링·비균일 변형 없음.|
|얼굴 확대|동일한 모발끝~발 표시 키에서 모두 얼굴 세로/추정두상이 증가.1/2 약하고3/4 뚜렷함; 머리카락/눈만의 확대는 아님.|
|정체성|금발·갈색눈·청/은/갈색 배색, 목도리·짧은후드·허리천·주머니·판금/천 장화 비대칭 유지. 청년 인상은 선택 대상.|
|인체 좌우|정면 화면 왼쪽 오른손 장검/초승달견갑/판금 정강이, 화면 오른쪽 왼손 단검/청색천 장화 유지.|
|손/무기|각2팔·2손·장검1·단검1. 손잡이를 감싼 장갑과 엄지 반대쪽 손가락 덩어리 확인; 픽셀화/가림으로 손가락5개를 모두 독립 판독할 수 없음.|
|무기 연결|청색 사선·날개가드·고리보호대·짧은 각진 단검 유지.2안 바깥 아래 장검각도는 제한사항.|
|잘림|머리끝·발·검끝 모두 캔버스 안.3/4 하단 여백 약9~10px라 넉넉한 프레이밍은 아님.|
|표시 등록|5종 전체 표시 높이/발선 동일한 CSS 등비 등록; 얼굴칸은 같은 전신배율에 공통2배. 개별 얼굴 크기 통일 안함.|
|작은 표시|57/72CSSpx 각5종 동시 관찰.3/4 얼굴 분리가 더 뚜렷함. 실게임 검증 아님.|
|밝고 어두운 배경|장비/의상 읽힘; 가는 유색 반투명 외곽 픽셀 잔여 관찰. 게임용 알파 정리 완료로 판정하지 않음.|
|좁은화면/클릭|420px 페이지 가로넘침 없음, 전신/얼굴 각각5열 유지, 클릭3안 확대 성공. 브라우저 캡처 증거 보관.|

## 남은 사항

'''+ '\n'.join('- '+x for x in issues)+'''

제출 자료 생성/비교 가능 여부를 검수한 것이며 사용자 미적 합격·공통기준 채택·실제 게임 교체를 의미하지 않는다.
'''
write('검수.md',qa)
paths={k:str(D/k) for k in ['original.png']+[f'variant-{n}-front.png' for n in range(1,5)]+['comparison.png','index.html','asset-manifest.json','분석.md','제작기준.md','검수.md','generation-records.json']}
report='''# 금발전사 실제 두상·얼굴 확대4안 / 차수3

MAIN01-20261109-DBF50341 / characters / 제작 및 선택용 비교자료 완료, 사용자 미적 선택 대기.

머리카락 포함 등신 대신 숨은 정수리~턱의 추정 두상과 보이는 얼굴을 분리해 새 정면4장을 제작했다. 원형·중간형·큰두상·얼굴우선의 몸/얼굴 비중을 비교한다. 총10회 내장 생성, 원본/후보/프롬프트/입출력 SHA를 보존했다. 최종PNG는 생성 원본 바이트 그대로이며2안만1133×1388, 나머지1254²다.

동일 전체 표시 키의 얼굴 세로 비중은 기존 대비 근사1.20/1.30/1.94/2.04배다. 정수리 추정 두상은 약1.12/1.32/1.97/2.03배이며 오차가 있다.1/2 및3/4의 작은 차이를 엄밀한 단계라고 주장하지 않는다.57/72CSSpx 갤러리에서3/4가 얼굴 읽기에 더 유리했다. 사용자 미적 합격은 미정이다.

## 실제 결과 경로

'''+ '\n'.join(f'- [{k}]({v.replace(chr(92),"/")})' for k,v in paths.items())+'''

## 검증과 한계

로컬4PNG와 원본·비교·작은 표시·밝고어두운 배경·좁은화면·확대창을 실제 열어 검수했다. source SHA/알파/실제 크기/원본보존/과거 파일불변을 확인했다. 사용자의 현재 화면은 조작하지 않았다.

'''+ '\n'.join('- '+x for x in issues)+'''

게임코드/public/현재 스티커/공통규정/카탈로그 및 이전 결과는 변경하지 않았다. 새 방향·애니메이션·게임 교체는 미수행이다. 저장운영규정에 따라 커밋·푸시·예약백업을 수행하지 않았으며 이번 저장 요청 처리는 main01 담당이다. .qa-browser-profile은 별도 검수용 로컬 프로필이므로 업로드 제외 대상이다.
'''
write('report.md',report)
ackpath=T/'읽기확인-v003-860c1b3369e945bea266e7486d430038.json'
result={'task':M['task'],'iteration':3,'role':'characters','status':'completed_for_user_selection','timestamp':now,'outputPaths':paths,'originalPath':A[0]['source'],'originalSha256':A[0]['sha256'],'readingAcknowledgement':{'path':str(ackpath),'sha256':sha(ackpath),'startPassed':True,'newIterationAck':True},'checks':{'generationCalls':10,'finalCount':4,'actualViewImageInspected':True,'pngSourceBytesMatch':all(a['sourceBytesMatch'] for a in A),'noResampling':True,'previousSnapshotFilesUnchanged':True,'lightDarkSmallNarrowExpandedInspected':True,'userApproved':False,'gameIntegrated':False,'commonRulesChanged':False,'gitCommitPushPerformed':False},'remainingIssues':issues}
dump('결과.json',result)

records={
'1_대화기록-characters-v003.md':'''# 차수3 요청 기록 — 추가분

사용자 “참고해서 4안 새로 뽑아와줘”. 사용자두상확대-v003.md 원문을 읽고 모발 유지/실제 두상·얼굴 확대/같은 캐릭터4안으로 실행했다. 이전 hairTop~chin 측정이 얼굴 가독성을 보증하지 못한 정정이다. 이전 정면/방향 자료의 합격·공통비율 확정은 아니다. 이번 완료 시점에 차수3 결과 연결 기록을 추가하며 이전 대화기록을 보존한다.
''',
'2_사전확인-characters-v003.md':'# 차수3 사전확인 연결 기록\n\n실제 생성 전 작성된 다음 기록과 차수3 ACK/start를 연결한다. 이 파일은 완료 시점 추가 연결이며 사전확인을 뒤늦게 수행한 것으로 표시하지 않는다.\n\n'+str(D/'사전확인.md')+'\n\n'+(D/'사전확인.md').read_text(encoding='utf-8-sig')+'\n\n차수3 ACK: '+str(ackpath),
'3_작업일지-characters-v003.md':'''# 차수3 작업일지 — 추가분

read-pack 필독 재열람 → 문서별 적용/해시 ACK → start 통과 → 원본/참조/직전 결과 실제 열람 → 사전확인 작성 → 내장 생성 첫4회 → 차별화 부족 확인 → 큰 두상4회 보완 → 중간형1회와 얼굴1회 보완 → 후보 원본 보존 및 최종4개 선택 → CSS 등비 비교/manifest → 실제PNG/밝고어두운/57·72px/좁은화면/확대 검수 → 결과 문서 제출. 총10회, 유료 외주API 없음, 하위 담당 없음. 기존 결과를 덮어쓰지 않고 scalp_face_v03에서만 제작했다.
''',
'4_정의문서-characters-v003.md':'''# 차수3 정의 — 추가분

완료: 실제 신규 정면4PNG와 원본 바이트 사본, 전신/얼굴/57·72CSSpx 비교PNG·HTML, 추정 정수리/얼굴/알파/해시 manifest, 생성이력 및 검수/분석/제작기준. 미완료/대기: 사용자 미적 선택·공통 비율 채택·게임 통합. 제한:1/2 변화 절제,3/4 비슷한 큰두상군,정수리 추정오차,2안 장검 바깥방향,가장자리 유색 반투명 픽셀,상하 여백. 완성된 선택용 시안을 사용자 합격 또는 게임용 최종정리 완료로 바꾸지 않는다.
''',
'5_버전관리-characters-v003.md':'''# 차수3 버전관리 — 추가분

작업공간 branch gim963738-jpg/캐릭터디자인2, 시작 HEAD40eb365afa199606a27b09889fa3c64c3525dc50. 코드/공통규정/카탈로그/public/이전PNG·HTML·보고서를 수정하지 않았다. 기존 파일 사전/사후 SHA 스냅샷은 모두 일치한다. 신규 산출물과 차수3 기록만 추가했다. 커밋/푸시/자동백업 없음; 사용자 저장 요청은 main01이 처리한다. .qa-browser-profile과 캐시·잠금파일은 업로드 제외하며 안전한 산출물/후보/프롬프트/보고는 WIP 선택용 자료로 분류한다.
'''
}
for name,content in records.items():
    p=T/name
    assert not p.exists(),f'Refusing overwrite {p}'
    p.write_text(content+'\n\n작성 시점: '+now+'\n결과: '+str(D/'report.md')+'\n',encoding='utf-8')
p=T/'characters-결과보고-v003.md'; assert not p.exists(); p.write_text(report,encoding='utf-8')
files=[]
for p in sorted(D.rglob('*')):
    if p.is_file() and '.qa-browser-profile' not in p.parts and p.name!='deliverable-manifest.json':
        files.append({'file':str(p.relative_to(D)),'size':p.stat().st_size,'sha256':sha(p)})
dump('deliverable-manifest.json',{'task':M['task'],'iteration':3,'generatedAt':now,'excluded':['.qa-browser-profile/**'],'files':files})
print(json.dumps({'finalCount':4,'generationCalls':len(calls),'sourceMatches':all(a['sourceBytesMatch'] for a in A),'preservedPreviousFiles':len(preservation),'report':str(D/'report.md'),'result':str(D/'결과.json'),'taskRecordsAdded':list(records)},ensure_ascii=False))

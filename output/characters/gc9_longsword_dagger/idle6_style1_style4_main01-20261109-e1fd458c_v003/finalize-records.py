from pathlib import Path
from PIL import Image
import hashlib,json,datetime
R=Path(__file__).parent;TASK='MAIN01-20261109-E1FD458C'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def write(p,x):p.write_text(json.dumps(x,ensure_ascii=False,indent=2),encoding='utf-8')
manifest=json.loads((R/'asset-manifest.json').read_text(encoding='utf-8'));sources=json.loads((R/'source-inputs.json').read_text(encoding='utf-8'))
selected=[]
for a in manifest['assets']:
 spec=json.loads((R/a['inputFile']).read_text(encoding='utf-8'));rec=json.loads((R/(Path(a['file']).stem+'-result.json')).read_text(encoding='utf-8'))
 inputs=[{'path':p,'sha256':sha(Path(p)),'nativeDimensions':list(Image.open(p).size),'role':spec['inputRoles'][i]}for i,p in enumerate(spec['referenced_image_paths'])]
 selected.append({'file':a['file'],'variant':a['variant'],'direction':a['direction'],'inputFile':a['inputFile'],'prompt':spec['prompt'],'inputs':inputs,'tool':'builtin image_gen.imagegen','settings':{'transparent_background':True,'imageModel':'tool managed; not text model Sol medium'},'sourceRaw':rec['sourceRaw'],'sha256':a['sha256'],'nativeDimensions':a['nativeDimensions'],'alphaExtrema':a['alphaExtrema'],'rawBytesIdentical':a['rawBytesIdentical'],'status':'selected for comparison; user final aesthetic decision pending'})
candidates=[]
for file,resultfile,inputfile,reason in [
 ('candidates/variant-4-front-initial.png','candidates/variant-4-front-initial-result.json','variant-4-front-input.json','초기몸비중이원형보다길게읽힘'),
 ('candidates/variant-4-front-rework-01.png','variant-4-front-rework-result-01.json','variant-4-front-rework-input-01.json','머리/몸압축이커1/4상대비중역전우려'),
 ('candidates/variant-4-front-rework-02.png','candidates/variant-4-front-rework-02-result.json','variant-4-front-rework-input-02.json','초기정면대비몸길이교정폭작음')]:
  rec=json.loads((R/resultfile).read_text(encoding='utf-8'));spec=json.loads((R/inputfile).read_text(encoding='utf-8'));im=Image.open(R/file)
  candidates.append({'file':file,'sourceRaw':rec['sourceRaw'],'inputFile':inputfile,'resultFile':resultfile,'sha256':sha(R/file),'nativeDimensions':list(im.size),'alphaExtrema':im.getchannel('A').getextrema(),'rawBytesIdentical':sha(R/file)==sha(Path(rec['sourceRaw'])),'rejectionObservation':reason,'inputHashes':[{'path':p,'sha256':sha(Path(p))}for p in spec['referenced_image_paths']]})
write(R/'generation-records.json',{'task':TASK,'iteration':3,'issuedBuiltinCalls':9,'confirmedReturns':9,'selectedCount':6,'candidateCount':3,'selected':selected,'candidates':candidates,'paidExternalApiUsed':False,'individualPNGsResampledOrReencoded':False})
qa='''# 검수 · 기본대기6장 / 차수3

6개선정PNG와3개보존후보,정면중간밝음/어두움,전체2행3열,안별상세2장,라벨숨김,원형대조,57/72CSSpx의밝고어두운작은표시를view_image로실제열었다. headless Edge는새출력내독립프로필로실행후닫았고사용자창/탭/패널/설정을조작하지않았다. 파일존재/생성성공만으로미적합격을선언하지않는다.

|파일|시점·포즈|스타일/정체성·좌우 관찰|가림/남는차이|
|---|---|---|---|
|variant-1-front.png|두눈/정면흉갑·골반,양발입상·양손무기내림|각진헤어/명확한매트셀,화면왼쪽오른장검·초승달/판금다리·화면오른쪽단검/청장화|원형전투무릎을펴표시상머리비율이작아짐. 단순확대복사아님|
|variant-1-right-045.png|두눈과앞흉갑일부,머리/몸/골반/발이오른쪽앞사선|정면의헤어/눈매·각진색면/무기좌우유지. 무기를계속내려들음|원근으로발폭/원형장비윤곽이좁아짐. 미세선차이존재|
|variant-1-right-090.png|한눈/코옆선·옆몸통·겹친발,화면오른쪽정측면|가까운오른초승달견갑/오른손장검/오른판금다리,먼쪽청장화·단검부분관찰|먼팔이몸뒤로가려짐. 목도리후드옆접힘은정면에서미확인인구조를최소추정|
|variant-4-front.png|정면0양발입상,양손무기양옆내림|부드러운갈색경계/금속·천명암,1보다작은상대머리와길게읽히는신체. 금발·갈색눈·청/은/갈색장비유지|초기+교정2개보존후세번째보완선정. 단검손잡이는손가락에부분가림|
|variant-4-right-045.png|두눈/앞흉갑일부가보이는오른쪽앞사선,편입상|새정면과같은부드러운재질·머리구성·체형/양손소유유지|후드볼륨/옷주름·벨트각도에미세생성차이. 원형복제를뜻하지않음|
|variant-4-right-090.png|한눈/코옆선·어깨/발겹침의오른쪽정측면|오른장검·초승달/판금다리근경,청장화/단검은먼쪽에서부분노출|먼쪽단검/손의투영은완전3D동일좌표로보증하지않음. 추가팔/추가무기는관찰되지않음|

## 동일인물·포즈·스타일

전투준비의깊은무릎굽힘/가슴앞무기교차/검을들어올림/공격·걷기를새기본포즈로남기지않았다. 여섯장은모두팔을내리고양발을지지한다. 방향별로몸통과발도돌며머리만회전한정면몸을복사하지않았다. 정측면은한눈/코옆선·겹친발로45와구분된다. 실제3D모델회전이나정확한각도계측은아니고2D해석의미세차이가남는다.

1의각진헤어·옷/갑옷셀면과4의더부드러운윤곽·금속/천모델링은전체/라벨숨김에서도구분된다. 1의얼굴/머리비중이조금크고4가더길고가늘게읽힌다. 두안의같은캐릭터정체성을보존했으므로완전히별개얼굴/복장으로차이를과장하지않았다. 전체비율을수학적으로늘리지않았고각안새정면을해당안의후속입력으로첨부했다.

## 손·무기·잘림·알파

모두두팔/두손/장검1·단검1의큰연결과실제손잡이접촉을확인했다. 장검청사선·날개가드·고리보호대와짧은각진단검,오른견갑초승달·오른판금다리·왼청천장화를관찰했다. 90도에서는고리/손가락과먼쪽팔의일부가가려져정면과동일한윤곽을강요하지않았다. SD의작은손에서모든개별손가락의관절을완전히검증했다고주장하지않으며가드날개수/곡률·주름/버클세부에미세변화가있다. 긴망토/새무기/새문양은추가하지않았다.

6개모두머리/발/무기끝이alpha32실루엣에서캔버스경계에접촉하지않고밝고어두운전체프레임에서보인다. 10%안전여백요청은균일달성되지않아일부상하여백이좁다. 탐색검토가능과공통납품프레이밍합격을구분한다. alpha1의희미한유색외곽/저알파잔여는원본대로보존했고보이는주요실루엣과별도bounds로기록했다. 원본RGB가투명밖에있어view_image에서보일수있는주변색과브라우저실제알파합성을구분했다. 큰불투명사각배경이나장식광배는실제합성에서관찰되지않았다. 알파자동정리/리샘플링/재인코딩은하지않았다.

## 비율·등록·작은표시

native모발끝과지지신발ROI의alpha32아래끝을몸높이에사용했다. 검끝/캔버스높이는제외했다. 발중심은양발지지사이시각적중점추정,개별손가락/두개골계측과다르다. 숨은정수리는이마/관자놀이/귀곡선기반범위추정이며직접실측이아니다. ROI·좌표·10~14px지지점추정오차는manifest에있다. 새PNG는원래치수그대로이며CSS에만등비몸높이360px/공통발선을사용했다. 전체와두상세에서동일표시몸높이/발선을확인했다. 좁은660px비교에서도여섯주요실루엣이각프레임안에들어갔다.

57/72CSSpx에서는금발/청목도리/은갑옷/양옆내린장검의실루엣과시점은남으나얼굴표정·가드/손가락·부드러운재질의세부는많이소실된다. 1의경계/각진면과4의부드러운세부의차이가큰보기보다줄어든다. 이를모든기기게임가독성합격으로주장하지않는다. 실게임실행/실기기/실제전장통합은미실행이다.

## 제작순서/후보

정면2개를먼저생성·열람했다. 1의정면은그안후속방향입력으로계속사용했다. 4의초기본은길게읽혀보완했고첫교정은과압축,두번째는교정폭작음으로보존했다. 원래4마스터만사용한세번째보완정면을내부선정해그정면으로45/90을만들었다. 총내장9개별호출/확인반환9개/최종6개/보존초기후보3개다. 후보를최종장수에섞지않았다. 사용자최종선택/공통채택/게임적용/커밋·푸시는별도다.
'''
(R/'검수.md').write_text(qa,encoding='utf-8')
paths=[str(R/a['file'])for a in manifest['assets']]
ack=R/'읽기확인-v003.json'
remaining=['일부좁은여백/alpha1희미한외곽원본보존; 공통납품프레이밍통과주장안함','손가락·가드/주름·후드옆구조의미세생성차이및가림; 정확3D투영/해부계측아님','57/72CSSpx에서표정/재질세부소실;실게임·실기기미검증','최종미적선택·공통기준채택·게임적용은사용자판정이후별도']
report=['# 1번·4번 기본대기3방향 · 차수3 결과','사용자 “이 내용으로 진행 — 기본 자세6장”에따라1/4각정면·오른쪽앞45·오른쪽정90총6장을새로제작했다. 깊은전투준비대신양발로편안히서서오른장검/왼단검을양옆아래로내려든다.','## 바로 보기',f'- 연락판: {R}/index.html',f'- 2행3열전체: {R}/comparison.png',f'- 1번상세: {R}/comparison-variant-1.png',f'- 4번상세: {R}/comparison-variant-4.png',f'- 원형대조: {R}/original-comparison.png',f'- 검수: {R}/검수.md',f'- 입력/후보/생성결과: {R}/generation-records.json',f'- 원본치수·알파·SHA·지지ROI: {R}/asset-manifest.json','## 생성 원본 절대 경로']
report+=['- '+p for p in paths]
report+=['## 제작과 검증','새차수18필독본문/작업연결/분야색인/실제1/4마스터/사용자선호·진행원문을읽고새ACK/start를통과했다. 정면2개를먼저실제열람해안별포즈/스타일을검수했고4번비율보완후각새정면을같은안후속45/90입력으로사용했다. 총내장imagegen9회모두반환,최종6개와보존후보3개. API/유료외주경로로전환하지않았다.','6개모두실제PNG크기/알파/바이트를보존하고전체/안별상세/밝고어두운합성/라벨숨김/57·72CSSpx/원형대조를실제열었다. 격리headless개별확대와660px좁은갤러리도확인했다. bodyHeight는모발끝~지지발바닥으로검끝과캔버스를제외하고발ROI와추정오차를기록했다. 같은몸높이·발선은CSS등비표시에서만맞췄다. 정확3D회전/사용자미적합격/실게임검증은아니다.','## 남은 한계와 후속']
report+=['- '+x for x in remaining]
report+=['기존10안/부분40장/SD공통기준/카탈로그/게임/타팀/사용자창·탭·패널·모델설정은변경하지않았다. 수정은새출력과원작업차수3추가기록뿐이며커밋/푸시/예약백업없이수동저장전상태다. source-inputs.json의두마스터SHA와technical-verification.json으로원본보존/현재ACK/실제파일검증을연결한다.']
(R/'report.md').write_text('\n\n'.join(report),encoding='utf-8')
write(R/'결과.json',{'task':TASK,'iteration':3,'role':'characters','status':'completed_for_review','outputPaths':{'individualPngs':paths,'gallery':str(R/'index.html'),'comparison':str(R/'comparison.png'),'detailedComparisons':[str(R/'comparison-variant-1.png'),str(R/'comparison-variant-4.png')],'manifest':str(R/'asset-manifest.json'),'report':str(R/'report.md'),'qa':str(R/'검수.md')},'originalMasters':sources,'readingAcknowledgement':{'path':str(ack),'sha256':sha(ack),'startPassed':True,'documents':18},'generation':{'mode':'builtin image_gen','issued':9,'returned':9,'finals':6,'preservedCandidates':3},'checks':{'individualsActuallyViewed':6,'lightDarkFullViewed':True,'detailsViewed':True,'small57And72Viewed':True,'rawPNGsPreserved':True,'userUiTouched':False,'gameIntegration':False,'userAestheticApproval':False},'remainingIssues':remaining})
write(R/'viewing-evidence.json',{'method':'view_image actual local originals and isolated headless browser composite inspection','individuals':paths,'composites':['pilot-front-light.png','pilot-front-dark.png','comparison.png','comparison-variant-1.png','comparison-variant-4.png','qa-dark.png','qa-unlabeled.png','qa-small-light.png','qa-small-dark.png','original-comparison.png','qa-narrow.png'],'registration':'all main and both detailed panels: same360CSSpx body and common local sole baseline; small57/72CSSpx','userUiTouched':False,'gameOrDeviceTested':False})
stamp=datetime.datetime.now().astimezone().isoformat();local=R/'작업기록';local.mkdir(exist_ok=True);shared=Path('C:/Users/user/Desktop/Grid Defenders/작업관리/작업')/TASK
records=[('1_대화기록.md','실제사용자선택은idle6/사용자확인.md의 “이 내용으로 진행 — 기본 자세6장”.1/4각정면·오른쪽앞45·오른쪽정90,양발입상무기자연내림이며최종결정/게임적용은아님. 4번우선선호피드백도읽되최종채택으로확대하지않음.'),('2_사전확인.md',f'새차수18필독본문/자기작업연결/도메인색인/그립·기존작품기준을읽고읽기확인-v003/start통과후생성. 생성전상세사전기록 {R}/2_사전확인.md 보존. 같은범위재승인질문없음. 원형1/4비율과정체성/인체좌우고정,기본자세만변경.'),('3_작업일지.md','정면2개개별생성·원본/밝고어두운합성검수→1번새정면으로45/90→4번몸비중보완3회와후보보존→선정새정면으로4번45/90→6개원본/2행3열·안별상세·원형대조·라벨숨김·57/72px·밝고어두운전체/좁은갤러리검수. 내장9호출/9반환/6최종/3후보. PNG수학적늘림/재인코딩/알파자동정리없음.'),('4_정의문서.md',f'작품한정기준 {R}/제작기준.md 및분석.md/검수.md. 각안새정면을같은인물후속방향마스터로사용하고45/90구분/양손소유/자연가림과검끝제외몸높이ROI를명시. 공통SD/세계관/게임/카탈로그정의변경없음.'),('5_버전관리.md',f'새산출물 {R}. 기존1/4마스터SHA254e5eb3128813b0dc76c65dbe4d3c867322e640fd1083a9a4c0b74a8c08fb57 / ace368fd00617d2532f62eb68bb95faf6b6745fb5b291780d0b9c9c1468a0428 유지. 새6PNG/3후보/입력/원생성경로해시는generation-records·asset-manifest에연결. 기존10안/부분40장/공통규정/게임/UI/설정은보존. 커밋/푸시/예약백업없음,수동저장전상태.')]
for name,text in records:
 entry=f'\n\n## characters 차수3 결과추가 · {stamp}\n\n{text}\n';(local/name).write_text('# '+TASK+' / 차수3\n'+entry,encoding='utf-8')
 with(shared/name).open('a',encoding='utf-8')as f:f.write(entry)
print(json.dumps({'selected':len(selected),'candidates':len(candidates),'fiveRecordsAppended':True},ensure_ascii=False))

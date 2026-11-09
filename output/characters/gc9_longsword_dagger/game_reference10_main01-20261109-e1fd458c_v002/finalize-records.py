from pathlib import Path
from PIL import Image
import json,hashlib,datetime
R=Path(__file__).parent
TASK='MAIN01-20261109-E1FD458C'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def write(p,x):p.write_text(json.dumps(x,ensure_ascii=False,indent=2),encoding='utf-8')
manifest=json.loads((R/'asset-manifest.json').read_text(encoding='utf-8'))
sources=json.loads((R/'sources.json').read_text(encoding='utf-8'))['games']
run=[]
for a in manifest['assets']:
 folder=R/a['id'];spec=json.loads((R/a['generationInput']).read_text(encoding='utf-8'));result=json.loads((folder/'generation-result.json').read_text(encoding='utf-8'))
 inputs=[]
 for i,p in enumerate(spec['referenced_image_paths']):
  actual=Path(p);snapshot=folder/'candidates/initial.png' if a['id']=='09_dfo' and i==0 else actual
  inputs.append({'usedPathAtCall':p,'preservedInput':str(snapshot),'sha256':sha(snapshot),'nativeDimensions':list(Image.open(snapshot).size),'role':(['edit target pixel candidate; preserve rendering/body','OUR B head-yaw authority only','GAME COMBAT rendering/proportions only'][i] if a['id']=='09_dfo' else spec['sourceRoles'][i])})
 chosen={'id':a['id'],'status':'returned_selected_for_review','tool':'builtin image_gen.imagegen','promptFile':a['generationInput'],'inputs':inputs,'settings':{'transparent_background':True,'imageModel':'tool managed; no paid fallback or text-model substitution'},'resultFile':a['id']+'/generation-result.json','rawOutput':result['sourceRaw'],'savedOutput':a['file'],'savedSha256':a['sha256'],'rawBytesIdentical':sha(Path(result['sourceRaw']))==a['sha256'],'nativeDimensions':[a['width'],a['height']],'alpha':a['alphaExtrema'],'userAestheticApproval':False}
 write(folder/'selected-generation.json',chosen);run.append(chosen)
write(R/'generation-run.json',{'task':TASK,'iteration':2,'issuedBuiltinCalls':12,'confirmedReturnedCalls':12,'selectedFinals':10,'preservedInitialCandidates':2,'selected':run,'oldIterationCalls':'excluded; previous pending jobs not assumed stopped or reused'})
qa=[
('01','명일방주','04 어나더 에덴','더 각진 헤어/천/갑옷 색면, 어두운 얇은 경계와 상대적으로 짧은 몸. 04는 둥글고 부드러운 재질.','큰 세모형 헤어/무기/청목도리로 식별. 세부버클은 축소됨.','작은 전투 인셋과 이펙트 가림으로 원작 미세선 재현 확정 불가.'),
('02','벽람항로','03 프린세스 커넥트','전체키 대비 얼굴/머리가 가장 크게 읽히고 다리가 더 압축됨. 03은 얼굴이 작고 종아리/몸통이 더 분리됨. 둘 다 밝은 애니SD 계열이다.','57px에서도 얼굴 면과 두눈 대비가 비교적 남는다.','02/03은 여전히 가장 가까운 계열; 서로 무관한 미술재료 수준의 차이라고 주장하지 않음.'),
('03','프린세스 커넥트','02 벽람항로 / 04 초기','초기03/04가 너무 비슷해 초기본 보존 후 새로 생성. 최종은 둥근 큰 실제 얼굴과 짧은 팔다리로 04의 약3두신 몸과 구분. 02보다는 덜 극단적 SD.','57/72px에서 눈/머리와 작은 몸이 함께 읽히며 광택 세부는 사라짐.','원작의 밝은 SD 원리 적용이며 정량적인 원작 등신 일치 보증 없음.'),
('04','어나더 에덴','01 명일방주','더 긴 팔다리와 부드러운 색/재질, 낮은 대비 내부선. 01은 각진 매트 셀 면이 더 강하다.','머리/장비는 읽히나 갑옷 미세 재질은 57px에서 뭉침.','01/03/04는 애니SD 유사군이다. 색상만 바꾼 동일본은 아니나 완전히 별개 장르로 과장하지 않음.'),
('05','리버스:1999','07 카운터사이드','머리가 더 큰 중간 비율, 경계를 약화한 넓은 매트 면과 저채도. 07은 머리가 작고 몸이 길며 내부선이 많다.','긴 무기와 머리색은 남지만 57px에서 얼굴 세부와 저대비 의복 분리가 약해짐.','표현 축약을 우선해 원형보다 색 대비가 낮다. 종이/수채 효과로 차이를 발명하지 않음.'),
('06','에픽세븐','07 카운터사이드','가는 선과 선명한 하드 셀 그림자/금속 면, 07보다 머리가 조금 크고 몸이 단단함. 07은 더 가늘고 부드러운 중간 명암.','긴 신체/무기 방향은 분명하지만 작은 얼굴 표정은 거의 소실.','공통 애니 성인형 계열이라 SD/도트와 비교할 때보다 차이가 작음.'),
('07','카운터사이드 원작','06 에픽세븐 / 10 오딘','가장 작은 상대 머리와 긴 가는 몸, 섬세한 내부선/절제된 연속 명암. 10은 더 큰 머리와 풍부한 붓 면.','57px에서 얼굴은 점 수준, 긴 실루엣과 두 무기가 우선.','역사적 공식 자료 사용. 현재 서비스 여부/후속 리부트 표현으로 해석하지 않음.'),
('08','가디언 테일즈','09 던전앤파이터','큰 계단과 거친 픽셀 클러스터/압축SD. 09는 세밀한 작은 픽셀과 성인형 긴 다리.','57/72px에서 큰 픽셀 덩어리·헤어/청색/눈 기호가 남는다.','원작보다 장비가 복잡하고 목표2두신보다 약간 길다. 게임용 정확한 격자/팔레트 규격 납품은 아님.'),
('09','던전앤파이터','06 에픽세븐 / 08 가디언','성인형이라06과 실루엣은 가깝지만 세밀한 계단/색램프가 분명. 08보다 훨씬 작은 픽셀과 긴 팔다리.','표시축소에서 얼굴은 거의 점이며 도트 질감이 일부 노이즈처럼 보일 수 있음.','초기 머리가 더 측면으로 돌아가 두눈이 보이는 앞3/4로1회 보완. 작은 각도/관절 위치의 생성 차이는 남으며 프레임 단위 포즈 완전일치 보증 아님.'),
('10','오딘 스피어','07 카운터사이드 / 06 에픽세븐','더 풍부하고 따뜻한 회화적 금속/천 면과 색 경계, 또렷한 붓 모델링. 06의 단단한 셀 면과 구분.','72px에서 큰 재질 명도는 남지만 섬세한 붓 면은 사라짐.','작업 목표4.8두신보다 길게 반환돼 약5.5 계열로 관찰. 원작 비율 정확 복제나 붓 재질 완전일치 주장은 안 함.')]
head=['# 검수 · 차수2 실제 게임참고10안','검수일 2026-11-09. 개별10최종PNG/초기후보2개/첫3중간합성/전체비교/라벨가림/밝고어두운 전체와57·72CSSpx를 view_image로 실제 열었다. 비교/개별확대는 사용자 화면을 건드리지 않은 격리 headless Edge에서 검증했다. 생성 성공/파일SHA 차이를 스타일 차이의 증거로 쓰지 않는다.','## 공통 확인','금발·갈색눈·청년남성 인상·은갑옷·청목도리/짧은내려진후드·청허리천·갈색벨트/주머니/바지를 유지했다. 정면과 다른 오른쪽앞3/4의 굽힌 양발 전투준비, 장검을 허리 앞에서 우상향으로 든 인체오른손/단검을 가슴 근처에 든 왼손, 화면왼쪽 초승달견갑/판금정강이와 화면오른쪽 청천장화를 관찰했다. 긴망토/추가무기/적/연출이펙트는 보이지 않는다. 전체 몸/검끝/두발이 alpha32 실루엣에서 잘리지 않았다. 두팔·두손·두무기의 큰 구조와 그립 연결을 확인했으나 작은SD/도트의 개별 다섯손가락 정밀검사에는 한계가 있다. 날개가드/고리보호대/청사선과 짧은각진단검은 남으며 세부 개수/곡률은 생성 차이가 있다.','고정은 같은 동작과 방향 관계다. 비율 변경에 따라 팔꿈치/손목/무릎의 정확한 화면좌표와 무기 투영길이가 달라진다. 원본 좌표를 수학적으로 맞춘 동일 뼈대/프레임으로 납품하지 않는다. 머리 포함 관찰 비율과 숨은두상 정수리는 구분했으며 이 작업에서 정수리 실측/공식게임 등신 확정은 하지 않았다.','## 라벨 가림·유사쌍 검수표','|안|실제 게임|가장 가까운 안|눈으로 본 차이 / 보완|작은 표시|남은 한계|','|---|---|---|---|---|---|']
for row in qa:head.append('|'+ '|'.join(row)+'|')
head+=['## 재작업 및 기술/알파 한계','첫3종(02/08/10)을 실제 열어 극단SD셀·거친도트·회화장신의 거리를 확인한 뒤 나머지7종을 생성했다. 초기03과04의 유사성을 보고03을 비율/실제얼굴 중심으로 재구성했고,09의 머리 방향을 앞3/4로 보완했다. 각 초기본과 당시 결과기록은 해당 candidates/에 보존했다. 최종10장에 초기본을 섞어 개수를 채우지 않았다. 내장 개별호출12회/확인반환12회/최종10개/보존초기2개다.','원본은 RGBA이며 투명 영역이 있다. alpha1의 아주 희미한 유색/미세외곽 잔여는 alpha32 실루엣과 구분해 manifest에 기록했다. 밝고 어두운 실제 브라우저 합성에서 불투명 사각 바탕/뚜렷한 배경 장식은 관찰되지 않았다. 모든 생성물의8% 안전여백 요청은 균일 달성되지 않았다; 비잘림 탐색시안으로 검토할 수 있으나 공통 납품 프레이밍 통과로 격상하지 않는다. 원본 수정/알파 정제/리샘플링은 하지 않았다.','몸높이는 모발 최상단~발바닥, 발중심은 양발 지지 사이의 시각적 중점 추정이다. 검끝/캔버스 높이를 몸키로 쓰지 않았다. 메타의 5~16px 오차는 작업용 대략값이며 숨은 정수리 계측 오차가 아니다. CSS에만 같은 본체높이/발선을 적용했다. 도트2안은 표시에서 pixelated를 사용하며 신규 생성 원본과 CSS 표시를 구분한다.','최종 라벨가림에서 SD의 머리/몸 비중, 매트/셀/회화 재질, 거친/세밀한 픽셀은 구분된다. 02/03,01/04,06/07은 같은 상위 계열이라 상대적으로 가깝다. 10개가 모두 같은 거리로 멀거나 모든 관찰자가 즉시 구별한다는 보증은 하지 않는다. 57/72px에서는 일부선/붓/얼굴 차이가 사라지는 실제 한계도 같이 제시한다.','## 검증/미검증','공식10개 출처 페이지와 미디어 URL을 GET 응답으로 확인했다. 벽람은 국가 미지정 페이지가404여서 같은 공식 앱의 gl=US 페이지200을 연결했고 원미디어도200이다. 캡처일은 불명, 영상은 실제0.1초/22초이며 원본영상/프레임을 보존했다. Spine/엔진/프레임애니 방식/현재 서비스 여부는 판정하지 않았다. 실제 게임실행/실기기/런타임프레임·공통화풍채택/사용자미적합격은 미실행이다.']
(R/'검수.md').write_text('\n\n'.join(head),encoding='utf-8')
analysis=(R/'분석.md').read_text(encoding='utf-8').replace('id=com.YoStarEN.AzurLane&hl=en','id=com.YoStarEN.AzurLane&hl=en&gl=US')
if '## 생성 후 관찰' not in analysis:
 analysis+='\n\n## 생성 후 관찰\n\n원형A/B는 자세/정체성 입력이며 최종10안의 비율은 게임별로 달라졌다. 원래 A/B 각각10장으로 생성하지 않았다.03은 초기03/04 유사성 때문에 더 큰 실제 얼굴/두상과 짧은 몸으로 재구성했고09는 머리 앞3/4를 보완했다. 관찰 비율은 manifest의 headObservation에 근사치로 남겼고 게임공식규격/사용자확정수치로 쓰지 않는다.\n\n작은표시에서는02/03/08의 큰얼굴과 단순 덩어리가 잘 남고06/07/09/10의 긴 신체는 얼굴보다 무기/상체 실루엣이 먼저 읽힌다.05의 저채도 매트면은 배경명도에 따라 분리가 약해지고,10의 붓 재질과09의 미세픽셀은 축소시 많은 정보가 사라진다. 이런 관찰은 갤러리57/72CSSpx 조건이며 실제 게임 플레이 품질 검증과 구분한다. 같은 금발/청목도리/은갑옷/쌍수와 비대칭장화로 같은캐릭터임을 남겼다. 전체스타일차이와 개별부품의 완전복제는 별개다.\n'
 (R/'분석.md').write_text(analysis,encoding='utf-8')
ack=R/'읽기확인-v002.json'
paths=[str(R/a['file'])for a in manifest['assets']]
remaining=['가까운 애니SD/장신 셀 계열은 상대적 스타일 거리가 작고57/72px에서 차이가 줄어듦','안전여백8% 요청 균일 미달 및 alpha1 미세외곽값; 납품프레이밍/알파정제 미실행','게임별 원작 비율/렌더링의 정확 복제 보증 없음; 정수리/공식등신/엔진 미실측·미확정','사용자미적선택/실게임·실기기 검증/통합/공통스타일채택 미실행']
result={'task':TASK,'iteration':2,'role':'characters','status':'completed_for_review','scope':'실제게임2D전투참고10안 총10개, 비율변경허용','outputPaths':{'individualPngs':paths,'gallery':str(R/'index.html'),'comparison':str(R/'comparison-overview.png'),'detailedComparisons':[str(R/'comparison-1.png'),str(R/'comparison-2.png')],'manifest':str(R/'asset-manifest.json'),'sources':str(R/'sources.json'),'qa':str(R/'검수.md'),'report':str(R/'report.md')},'readingAcknowledgement':{'path':str(ack),'sha256':sha(ack),'startPassed':True},'generation':{'mode':'builtin image_gen','issued':12,'confirmedReturned':12,'finalPngCount':10,'preservedInitialCandidates':2,'paidFallbackUsed':False},'checks':{'individualPngsViewed':10,'officialCombatSourcesViewed':10,'initialPilotViewed':3,'lightDarkCompositesViewed':True,'labelsHiddenViewed':True,'small57And72Viewed':True,'rawBytesPreserved':True,'gameIntegration':False,'userAestheticApproval':False,'userUiManipulated':False},'remainingIssues':remaining,'previousIteration':'preserved; previous13return-unknown not assumed cancelled or mixed'}
write(R/'결과.json',result)
report=['# 실제 게임 전투2D 참고10안 · 차수2 결과','사용자 정정과 최종 “진행”에 따라 실제게임10종의 전투2D표현을 조사하고 같은 금발쌍수전사의 오른쪽앞3/4 전투준비로 총10장을 새로 생성했다. 신체비율 변경 허용을 반영했으며 미술매체20종×2모델40장 작업은 별도 중단 이력으로 보존했다.','## 바로 보기',f'- 전체 연락판: {R}/index.html',f'- 전체10안: {R}/comparison-overview.png',f'- 상세1~5: {R}/comparison-1.png',f'- 상세6~10: {R}/comparison-2.png',f'- 출처/실제프레임: {R}/sources.json',f'- 검수/가까운쌍/한계: {R}/검수.md',f'- 실측/해시: {R}/asset-manifest.json','## 개별 생성 원본']
report+=['- '+p for p in paths]
report+=['## 제작·확인','새차수17문서 본문 적용 ACK/start 후 공식 전투 자료10종을 다운로드·실제 열람했다. 벽람/명일방주는 큰 홍보 인물 대신 실제전투 인셋만 무배율 크롭으로 분리했고, 프린세스/가디언은 공식 영상0.1초/22초 프레임을 사용했다. 공식 출처/미디어20URL 재검증200이며 captureDate는 unknown으로 남겼다.','최초3종 내부검수 후7종을 제작했다.03의 유사비율과09의 머리방향을 각각1회 보완해 내장 개별호출12개가 모두 반환됐다. 최종10PNG는 실제 반환크기/알파/바이트 그대로이며 초기2개도 보존했다. 모든 프롬프트·실제 입력 역할/해시·원생성 경로를 generation-run.json과 각안 selected-generation.json에 기록했다.','격리 headless Edge로 밝고어두운 전체비교·라벨가림·57/72CSSpx·출처카드·개별확대·좁은갤러리를 확인했다. 현재 사용자 탭/창/패널 조작은 없고 비교만 CSS 등비 등록했다. 실게임 실행 검증은 아니다. 원형A/B 및 기존 다른 작업 바이트는 유지했다.','## 한계/다음 결정']
report+=['- '+x for x in remaining]
report+=['프린세스/벽람 등 같은 애니SD 계열과 에픽/카운터 성인형은 가장 가까운 쌍이다. 보완 후에도 모두 동일한 거리의10개 장르라고 과장하지 않는다. 실제게임의 없는 효과를 새로 발명해 차이를 늘리지 않았다. 사용자 선택·미적평가는 다음 단계이며 자동 채택/게임교체/공통기준변경/카탈로그수정은 하지 않았다.','수동저장 전 상태: 이 새 출력폴더와 원작업의 차수2 추가기록만 변경했고 커밋/푸시/예약백업/외주API호출은 하지 않았다. 파일/원본동일성/ACK해시 기술검증은 technical-verification.json, 브라우저 증거는 browser-evidence.json에 보존한다.']
(R/'report.md').write_text('\n\n'.join(report),encoding='utf-8')
stamp=datetime.datetime.now().astimezone().isoformat()
record=[('1_대화기록.md','사용자 실제 의도 정정은 메인 근거 사용자진행확인.md에 보존: 실제 서브컬처게임 인게임2D를 분석·참고하며 비율변경 허용, 같은 전투태세/구성으로10가지, 최종 실행답 “진행”. 담당이 승인원문을 새로 지어내거나 추가승인을 요구하지 않았다.'),('2_사전확인.md',f'characters 차수2 read-pack17필독 본문을 읽고 새ACK/start 통과 후 연구/생성했다. 상세 사전기록 {R}/2_사전확인.md 및 읽기확인-v002.json. 첫3내부검수 후7개, 같은장비/동작·비율변경허용, 기존부분작업 격리보존, 새출력과 이번기록만 편집했다.'),('3_작업일지.md','공식10게임 전투자료/영상프레임 확보·view_image 열람→6항분석/프롬프트 역할분리→02/08/10 개별생성·밝고어두운 내부검수→나머지7생성→라벨가림에서03/04유사확인·03재생성→09머리앞3/4보완→전체/57·72px/원본확대·출처카드 검수. 내장호출12/확인반환12/최종10/보존초기2. 공식20URL응답200, 원본PNG원바이트유지. 이전13미확인 작업상태는 재판정/혼합하지 않음.'),('4_정의문서.md',f'작품기준은 {R}/제작기준.md. 게임별 전투근거·비율·선·명암·축약·적용6항, 가까운쌍과한계는 분석.md/검수.md. 공통SD기준/다른작품/게임/카탈로그 정의는 변경하지 않았다. 생성성공/내부검수/사용자합격을 구분했다.'),('5_버전관리.md',f'차수2 산출물: {R}. 원본A/B해시6ec7c22e0063a3696d70837a702f9ab5192ffc7002c9f59a17c772d25dec00e8 / 3ca9d1bdcbe9c9b9b8d8ec2314be57cecf4f94757d99d020a6070ccd695a380d 유지. 각최종/후보/참조 해시는 manifest/generation-run에기록. 원본바이트를 복사하며리샘플링/재인코딩하지 않았다. 이새폴더와원작업 차수2 추가기록만 변경. 커밋/푸시/자동백업없음;수동저장전 상태다.')]
taskroot=Path('C:/Users/user/Desktop/Grid Defenders/작업관리/작업')/TASK
localrecords=R/'작업기록';localrecords.mkdir(exist_ok=True)
for name,body in record:
 text=f'\n\n## characters 차수2 결과 추가 · {stamp}\n\n{body}\n'
 (localrecords/name).write_text('# '+TASK+' / 차수2 / characters\n'+text,encoding='utf-8')
 with (taskroot/name).open('a',encoding='utf-8')as f:f.write(text)
print(json.dumps({'finalPngCount':len(paths),'report':str(R/'report.md'),'recordsAppended':5},ensure_ascii=False))

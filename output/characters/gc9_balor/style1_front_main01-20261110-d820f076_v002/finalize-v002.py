from pathlib import Path
import json,hashlib,datetime,shutil
from PIL import Image
import numpy as np
R=Path(__file__).parent.resolve();T=Path('C:/Users/user/Desktop/Grid Defenders/작업관리/작업/MAIN01-20261110-D820F076');M=Path('C:/Users/user/Desktop/Grid Defenders/메인작업/main01/balor-style1')
def read(p):return json.loads(p.read_text(encoding='utf-8-sig'))
def write(n,d):(R/n).write_text(json.dumps(d,ensure_ascii=False,indent=2),encoding='utf-8')
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
now=datetime.datetime.now().astimezone().isoformat();ack=read(R/'읽기확인-v002.json');registered=T/'읽기확인-v002-0281dbc1767447e281566739ab168d44.json'
docchecks=[dict(path=d['path'],expected=d['sha256'],actual=sha(d['path']),unchanged=sha(d['path'])==d['sha256']) for d in ack['documents']]
prior=[dict(**x,unchanged=sha(x['path'])==x['sha256']) for x in read(R/'prior-iteration-baseline.json')]
pres=[dict(**x,sourceUnchanged=sha(x['source'])==x['sha256'],preservedUnchanged=sha(x['preserved'])==x['sha256']) for x in read(M/'보존목록.json')['files']]
assert all(x['unchanged'] for x in docchecks+prior) and all(x['sourceUnchanged'] and x['preservedUnchanged'] for x in pres)
rec=read(R/'generation-records.json')
for c in rec['calls']:
 im=Image.open(c['rawPath']);p=R/(c.get('output') or c['candidate']);c.update(sha256=sha(c['rawPath']),dimensions=list(im.size),mode=im.mode,nativeByteCopyIdentical=sha(c['rawPath'])==sha(p));assert c['nativeByteCopyIdentical']
rec.update(actualBuiltinCalls=len(rec['calls']),paidApiCalls=0,postprocess='NONE: original PNG bytes/alpha preserved; CSS display only',completedAt=now);write('generation-records.json',rec)
man=read(R/'asset-manifest.json');old,style,new,identity=man['assets'];b=read(R/'browser-evidence.json')
full=b['cases'][0]['registration'];assert len(full)==3 and max(x['bodyHeight'] for x in full)-min(x['bodyHeight'] for x in full)<.001
im=Image.open(R/'front.png');a=np.array(im.getchannel('A'));y,x=np.where(a>0);new['alpha'].update(nonzeroBounds=[int(x.min()),int(y.min()),int(x.max()+1),int(y.max()+1)],lowAlpha1to31Pixels=int(((a>0)&(a<32)).sum()),alpha240to254Pixels=int(((a>=240)&(a<255)).sum()));new.update(nativeSource=rec['calls'][-1]['rawPath'],sourceSha256=rec['calls'][-1]['sha256'])
man.update(userArtisticApproval='pending; v001 explicitly REJECTED for broad silhouette',gameIntegration=False,art_source='host_image',route='builtin image_gen',generationRecord='generation-records.json');write('asset-manifest.json',man)
def ratio(asset,key):m=asset['widthMeasurements'][key];return 100*(m['x2']-m['x1'])/asset['bodyHeight']
labels={'shoulders':'견갑 포함 어깨폭','chest':'흉곽 추정폭','waist':'허리 추정폭','arms':'보이는 오른상완→중심축 거리','shield':'방패 자체 가로폭','cape':'망토 좌우폭','feet':'양발 바깥폭'}
rows='\n'.join('|'+label+'|'+f'{ratio(old,k):.1f}%|'+(f'{ratio(style,k):.1f}%' if style['widthMeasurements'][k]['applicable'] else '해당없음')+'|'+f'{ratio(new,k):.1f}%|' for k,label in labels.items())
headold=100*(old['chin']-old['hairTop'])/old['bodyHeight'];headnew=100*(new['chin']-new['hairTop'])/new['bodyHeight'];whold=100*(old['boundsAlpha32'][2]-old['boundsAlpha32'][0])/old['bodyHeight'];whnew=100*(new['boundsAlpha32'][2]-new['boundsAlpha32'][0])/new['bodyHeight']
proof=dict(task='MAIN01-20261110-D820F076',iteration=2,ack=dict(path=str(registered),sha256=sha(registered),startPassed=True,allCurrent=True,documents=docchecks),priorIterationFiles=prior,preserved11Models=pres,rawOutputCopies=rec['calls'],browserEvidence='browser-evidence.json',uniformBodyHeight=full,userUiTouched=False,committed=False,pushed=False)
write('verification-evidence.json',proof)
analysis=f'''# 차수2 실루엣 분석

사용자 확정 원문은 “너무 옆으로 퍼진느낌인데 불합격”과 수정설명 뒤 “진행”이다. 아래 수치는 실제 출력의 관찰·수동 ROI 추정이며 사용자 확정규격이 아니다. 차수1을 승인마스터로 고정하지 않았다.

승인발로르의 디자인과 선택1번 화풍을 주참조로 새 작화했다. 견갑을 위아래로 겹쳐 어깨 돌출을 줄이고 흉곽·허리의 가로덩어리를 정돈했다. 보이는 오른상완과 검 든 손을 몸쪽으로 모았다. 큰 방패는 길이와 카이트 형상을 유지하며 왼 흉갑·다리 앞에 더 겹쳐 배치했다. 망토는 부채꼴 양날개 대신 하체 뒤에서 수직으로 떨어뜨리고 양발 바깥폭을 줄였다. 원본 이미지를 가로압축·세로늘림·얼굴축소해 폭을 바꾸지 않았다.

같은 bodyHeight에 정규화한 폭/높이 관찰:

|부위|차수1 반려|선택1번 참조|차수2 수정|
|---|---:|---:|---:|
{rows}
|전체 장비포함 외곽|{whold:.1f}%|{100*(style['boundsAlpha32'][2]-style['boundsAlpha32'][0])/style['bodyHeight']:.1f}%|{whnew:.1f}%|
|모발포함 머리높이/본체|{headold:.1f}%|{100*(style['chin']-style['hairTop'])/style['bodyHeight']:.1f}%|{headnew:.1f}%|

어깨폭은 견갑 외곽의 보이는 단면, 흉곽/허리는 방패에 가린 부분의 대칭축·노출 외곽에 기반한 추정이다. 상완은 두 팔 전체폭을 실측한 것처럼 쓰지 않고 보이는 오른상완 중심에서 몸중심까지의 거리를 측정했다. 방패 자체폭과 장비포함전체폭, 망토폭을 분리했다. ROI/선위치/오차/추정 여부는 measurements.json과 asset-manifest.json. 겹친 몸의 정확한 3D치수를 복원한 자료가 아니다.

생성 후보1은 폭개선에 비해 다리/몸통이 길어 머리비중이 감소해 보존했다. 비율보완 후보2는 머리가 과대해 선택1과 달라 보존했다. 세번째 편집은 그 과대를 선택1/반려본의 머리비중에 가깝게 재작화했고 마지막에는 큰방패길이를 안쪽겹침으로 복원했으며, 폭 감소는 별도로 좁혀 그린 몸/배치 ROI로 평가한다. 최종 결과를 사용자 미적합격으로 대신 판정하지 않는다.
'''
(R/'분석.md').write_text(analysis,encoding='utf-8')
qa=f'''# 차수2 내부검수

제작/내부검수 완료, 수정본 사용자 미적판정 전. 차수1은 사용자 미적불합격이다. 내장 imagegen {len(rec['calls'])}회, 초기3후보 보존. 생성 원본 PNG와 실제 납품 SHA 동일, α/해상도 유지, 리샘플링/전체가로압축/세로늘림/자동알파정리 없음.

|검사항목|관찰/판정|
|---|---|
|실루엣|어깨/흉곽/허리·팔중심거리/망토/발을 구분해 새로 정돈. 큰방패를 안쪽에 겹쳐 배치. 전체외곽/본체 {whold:.1f}%→{whnew:.1f}%. 숫자만으로 사용자합격을 주장하지 않음.|
|얼굴·SD비중|짧은갈색머리·청회눈/차분한미소, 큰얼굴/압축SD 유지. 모발포함머리높이 {headold:.1f}%→{headnew:.1f}%, 숨은 정수리 추정은 별도. 중간후보의 과도한긴몸/큰머리를 최종본에 섞지 않음.|
|시점/자세|두눈·흉갑·골반이 정면, 양발입상·팔내림. 전투/걷기/공격 아님. 양발정렬은 수동추정으로 정확3D계측아님.|
|검 소유/그립|오른손=화면왼쪽 검1개. 팔→손목→장갑→파란감긴원통그립이 이어짐, 둥근은폼멜/은날개가드/중앙붉은마름모/은검신과축연결 확인. 엄지/보이는장갑손가락의감김이읽히며 가린5손가락의개별관절을전부확정하지않음. 금색가드/고리보호대/청사선검신 복제없음.|
|방패|왼팔=화면오른쪽 큰은카이트실드, 상단첨단/긴하단끝·검은긴십자/대칭깃날개 보존. 자체형태/길이를 버리고 작은장식방패로 바꾸지 않음. 몸통·왼다리 앞에 겹쳐측면확장감소. 왼손/부착구는가림으로미확인.|
|가슴/갑주|청은 노출층견갑·청가슴의 흰전신측면사자(화면왼쪽머리/앞발/오른꼬리). 가린부분은미확인, 사자머리단독/새문장없음.|
|핀/망토/하체|원형은핀2개·연결끈없음, 긴청망토/흰안감/하단흰용·마름모, 검은벨트·은버클/청중앙천·흰기하장식, 양쪽청은다리보존. 망토모음으로주름/용문양일부가림·가드곡률/핀내부면/미세선차이남음.|
|원본/화풍|원화IDENTITY/선택1STYLE·SD비율/반려본폭대조/그립해부학역할분리. 금발전사얼굴·금발·이중무기·스카프/후드·초승달/비대칭장화 복제없음. 뚜렷한외곽/각진매트셀을유지.|
|알파/잘림|{new['width']}×{new['height']} RGBA, α≥32외곽 {new['boundsAlpha32']}. 머리/양발/검끝/방패끝/망토끝캔버스내. 밝음어두움전체·확대 실제열람, 미세유색저알파/nearopaque253·254층은 원본보존하고 허용결함으로승격하지않음.|
|비교/작은표시|반려1/선택1/수정2 동일몸높이560CSSpx와발선으로 비교. 폭가이드선은HTML표시용만. 57/72CSSpx에서머리/청은기사/큰방패가읽히나 그립감김·보석·사자/용 세부소실. 실제게임·실기기검증아님.|
|보존/착수|차수2새ACK/start 통과,27필독현재해시일치. 차수1기존48파일과11원본/11보존사본 SHA일치. 이번새폴더/차수2기록만편집, 카탈로그/공통규정/타팀/게임/UI/창/커밋푸시없음.|

실제열람: 5입력/원본·반려본·3후보·최종front.png, comparison.png, silhouette-comparison.png, identity-comparison.png, identity-detail-comparison.png, qa-dark.png, qa-detail-dark.png, qa-small-light.png, qa-small-dark.png. browser-evidence.json에격리headless8캡처/원본1254px확대와정규화기록. verification-evidence.json에현재필독/보존/바이트대조. 숨은두상/흉곽/허리/왼손은추정·미확인으로구분한다.

잔여: 생성에따른얼굴나이감/장식미세선·핀분할·가드곡률차이, 가림/저알파경계, 작은표시세부소실. 부위측정추정오차안에서의변화와 눈으로읽는전체실루엣을함께봐야하며 사용자합격/공통SD확정/방향확장/게임반영은미실행이다.
'''
(R/'검수.md').write_text(qa,encoding='utf-8')
faceold=100*(old['faceRegion'][3]-old['faceRegion'][1])/old['bodyHeight']; facenew=100*(new['faceRegion'][3]-new['faceRegion'][1])/new['bodyHeight']
report=f'''# 발로르 선택1번 · 차수2 실루엣 수정 납품

MAIN01-20261110-D820F076 / iteration2 / characters / {now}

사용자 “너무 옆으로 퍼진느낌인데 불합격” 및 수정설명뒤 “진행”에 따라 정면기본입상1장을 새작화했다. 내장 imagegen {len(rec['calls'])}회, 초기3후보와각반환원본보존. 어깨/흉곽/허리와팔벌림을 정돈하고 큰방패를몸가까이겹침·망토를수직으로모음·발벌림을좁혔다. 전체가로압축/세로늘림으로바꾸지않았다.

모든표시를같은본체높이로맞춘결과 전체장비포함 외곽/본체 {whold:.1f}%→{whnew:.1f}%, 모발포함머리/본체 {headold:.1f}%→{headnew:.1f}%. 부위별폭과가림/오차는 분석.md·실루엣대조PNG·manifest 참조. 이는작업관찰값이며사용자확정수치/미적합격을대신하지않는다. 모발포함머리비중은약2%p작아졌지만 눈썹선~턱의실제얼굴영역비중은{faceold:.1f}%→{facenew:.1f}%로유지됐고, 얼굴축소로폭을속인것이아니다. 선택1번의얼굴비중을줄여좁아보이게속이지않고 새로좁힌몸과장비배치를별도대조했다.

- 정면: {R/'front.png'}
- 반려1/선택1/수정2 비교: {R/'comparison.png'}
- 부위폭 근거: {R/'silhouette-comparison.png'}
- 승인원화/선택1/수정2: {R/'identity-comparison.png'}
- 장비확대대조: {R/'identity-detail-comparison.png'}
- 연락판: {R/'index.html'}
- 메타/생성: {R/'asset-manifest.json'} / {R/'generation-records.json'}
- 검수: {R/'검수.md'}

최종 {new['width']}×{new['height']} RGBA · SHA256 `{new['sha256']}` · 본체{new['bodyHeight']}px/발({new['footX']},{new['footY']})·측정오차±{new['measurementErrorPx']}px. 원본PNG바이트/알파그대로이며CSS만등비등록했다. 실제밝음어두움/얼굴·그립·가드·사자·방패·핀·용확대/57·72CSSpx열람완료. 사용자창/탭을열지않고새출력내별도headless프로필로캡처8장완료후닫았다.

파란감긴그립/은폼멜/날개가드/붉은마름모·은검신/큰카이트실드검은날개십자/가슴측면사자/원형핀2개끈없음/청용망토흰안감을일대일대조했다. 미세가드곡률·문장선/핀분할·SD연령감차이와가려진왼손/몸통·저알파경계·작은표시세부손실은남는다. 수치목표를충족했다는이유로사용자합격이라고하지않는다.

새차수ACK/start통과: {registered} / SHA `{sha(registered)}`.27필독현재해시및차수1 48기존파일/11모델원본과11보존사본/생성원본바이트일치. 실제5종기록은이번차수2로추가했으며차수1기록은보존했다. 검증원문 verification-evidence.json/browser-evidence.json.

생성 art_source=host_image, builtin image_gen; 텍스트Sol/medium기본과이미지모델별개, 이미지모델상세명/비용은도구미보고. 유료API/계정연결/키잉/패딩/리샘플링/알파정리미실행. 총괄새방향메시지msg_eb3a144e6df1확인당시4번째호출은이미진행중이었고반환을보존했다. 메시지이후신규이미지호출0건/우측3/4·파츠·리깅제작0건, 현재차수2비교·기록만마무리했다. 신규정면의사용자합격/측면/애니메이션/게임적용/공통기준변경/카탈로그등록/커밋푸시/예약백업미실행. 로컬새산출물과이번기록만추가한수동저장전상태다.
'''
(R/'report.md').write_text(report,encoding='utf-8')
write('결과.json',dict(task='MAIN01-20261110-D820F076',iteration=2,role='characters',status='completed_for_review',outputPaths={n:str(R/n) for n in ['front.png','comparison.png','silhouette-comparison.png','identity-detail-comparison.png','index.html','asset-manifest.json','generation-records.json','report.md','검수.md']},originalPath=identity['file'],originalSha256=identity['sha256'],readingAcknowledgement=dict(path=str(registered),sha256=sha(registered),startPassed=True,currentDocs27=True),checks=dict(actualViews=True,rawBytesPreserved=True,prior48FilesUnchanged=True,preserved11Models=True,equalCSSHeight=True,userApproval=False,gameIntegrated=False),remainingIssues=['SD age impression and tiny heraldry/pin/guard details differ','Occluded anatomy and body-width estimates are not exact 3D measurements','Colored low-alpha edges preserved','Small preview fine details lost; no live-game/device validation']))
notes={
'1_대화기록.md':'사용자 차수1 너무옆으로퍼짐 불합격→수정설명뒤진행을현재차수2근거로읽었다. 선택1화풍/장비정체성유지하며정면실루엣수정1장, 이전판정/기록보존. 신규미적판정은미수신.',
'2_사전확인.md':'27필독본문/작업연결·자기브랜치/main01·분야색인과원본5입력실제열람. 새ACK/start통과후생성. 실제사전증거는상위2_사전확인.md/읽기확인-v002.json/start-result.json. 반려본은폭대조용, 새폴더/차수2기록만허용.',
'3_작업일지.md':f'내장생성{len(rec["calls"])}회로새정면과SD비율내부보완을제작, 후보3개/반환바이트보존. 동일높이반려/선택/수정비교·부위폭/장비확대/밝음어두움/57·72CSSpx 8캡처·view_image확인. 27필독/기존48파일/11모델과보존사본/생성바이트해시대조. 미실행:방향/영상/게임/카탈로그/공통규정/UI/외부API/커밋푸시.',
'4_정의문서.md':f'차수1SD는사용자미적불합격. 승인발로르IDENTITY/선택1STYLE/반려폭문제를구분. 어깨·몸통·팔·큰방패겹침·수직망토·발모음을새작화. 전체폭/몸키{whold:.1f}%→{whnew:.1f}%, 머리비중{headold:.1f}%→{headnew:.1f}%는관찰값이며사용자확정비율아님. 숨은신체추정/보이는장비실측/PNG원본/CSS등록을구분.',
'5_버전관리.md':'로컬차수2새output과이번5종기록만작성. 차수1기록/48파일·기존11모델과별도보존사본SHA일치. 커밋없음/푸시없음/원격미반영/예약백업없음. 사용자수동저장전상태, 프로필/캐시업로드없음. 원본PNG와세후보보존.'}
(R/'작업기록').mkdir(exist_ok=True)
marker='## characters 차수2 실루엣 수정 실제 수행 기록'
for name,text in notes.items():
 content=f'# {name[:-3]} / 차수2\n\n{now}\n\n{text}\n\n결과: {R/"report.md"}\n';(R/'작업기록'/name).write_text(content,encoding='utf-8');p=T/name;ex=p.read_text(encoding='utf-8-sig');p.write_text(ex.split(marker)[0].rstrip()+'\n\n'+marker+'\n\n'+content,encoding='utf-8')
print(json.dumps(dict(documents=len(docchecks),priorFiles=len(prior),preservedModels=len(pres),rawCopies=len(rec['calls']),oldWholeWidthRatio=whold,newWholeWidthRatio=whnew,oldHeadShare=headold,newHeadShare=headnew,sha256=new['sha256']),ensure_ascii=True))

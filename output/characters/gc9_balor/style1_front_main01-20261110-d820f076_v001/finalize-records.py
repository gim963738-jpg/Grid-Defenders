from pathlib import Path
import json,hashlib,datetime
from PIL import Image
import numpy as np
R=Path(__file__).parent.resolve(); T=Path('C:/Users/user/Desktop/Grid Defenders/작업관리/작업/MAIN01-20261110-D820F076'); M=Path('C:/Users/user/Desktop/Grid Defenders/메인작업/main01/balor-style1')
def read(p):return json.loads(p.read_text(encoding='utf-8-sig'))
def write(name,v): (R/name).write_text(json.dumps(v,ensure_ascii=False,indent=2),encoding='utf-8')
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
now=datetime.datetime.now().astimezone().isoformat()
ack=read(R/'읽기확인-v001.json'); docs=[dict(path=d['path'],expected=d['sha256'],actual=sha(d['path']),unchanged=sha(d['path'])==d['sha256']) for d in ack['documents']]
pres=[]
for f in read(M/'보존목록.json')['files']:
 pres.append(dict(role=f['role'],source=f['source'],preserved=f['preserved'],expected=f['sha256'],sourceSha256=sha(f['source']),preservedSha256=sha(f['preserved']),unchanged=sha(f['source'])==sha(f['preserved'])==f['sha256']))
records=read(R/'generation-records.json')
for c in records['calls']:
 p=Path(c['rawPath']); copied=R/(c.get('output') or c['candidate']); im=Image.open(p)
 c.update(sha256=sha(p),nativeDimensions=list(im.size),mode=im.mode,nativeByteCopyIdentical=sha(p)==sha(copied))
records.update(completedAt=now,postprocessing='NONE; all PNG assets raw returned bytes; browser screenshots are separate comparison artifacts',paidExternalApiCalls=0,actualBuiltinImagegenCalls=3)
write('generation-records.json',records)
browser=read(R/'browser-evidence.json'); reg=browser['cases'][0]['registration']; assert max(x['bodyHeight'] for x in reg)-min(x['bodyHeight'] for x in reg)<.001
assert len(pres)==11 and all(x['unchanged'] for x in pres)
assert all(x['unchanged'] for x in docs)
assert all(x['nativeByteCopyIdentical'] for x in records['calls'])
man=read(R/'asset-manifest.json'); final=man['assets'][2]
im=Image.open(R/'front.png'); a=np.array(im.getchannel('A')); y,x=np.where(a>0)
final['alpha'].update(nonzeroBounds=[int(x.min()),int(y.min()),int(x.max()+1),int(y.max()+1)],lowAlpha1to31Pixels=int(((a>0)&(a<32)).sum()),alpha240to254Pixels=int(((a>=240)&(a<255)).sum()),exactOpaque255Pixels=int((a==255).sum()))
final.update(nativeSource=records['calls'][-1]['rawPath'],sourceSha256=records['calls'][-1]['sha256'],safeMarginAlpha32Px=dict(left=292,top=180,right=291,bottom=190),hairInclusiveHeadUnitsEstimate=round(884/(428-180),2),hairInclusiveMeasurementNotApprovedSpec=True)
man['artSource']='host_image';man['generationRecord']='generation-records.json';man['userArtisticApproval']='pending for this new SD front';write('asset-manifest.json',man)
checks=dict(ackDocuments=docs,ackAllCurrent=all(x['unchanged'] for x in docs),preservedModels=pres,nativeByteCopies=records['calls'],browserEvidence='browser-evidence.json',uniformDisplayHeightVerified=reg,userUiTouched=False,gameIntegration=False,committed=False,pushed=False)
write('verification-evidence.json',checks)
warn=[c for c in read(R/'doctor.json')['checks'] if c['status']!='OK'];write('doctor-warnings-verbatim.json',warn)
qa='''# 検수 — MAIN01-20261110-D820F076 / 1차 / characters

제작·내부검수 완료, 신규 SD의 사용자 미적 합격은 아직 없다. 내장 imagegen 3회: 최초 후보는 여백 미달로 보존하고, 구도 여백 보완 뒤 방패 상대비중을 별도 보완했다. 두 후보와 세번째 최종 생성 원본을 모두 보존한다. 자동 리샘플링·늘림·알파 정리는 하지 않았다.

|검사항목|직접 관찰과 판정|
|---|---|
|원본/스타일 역할|승인 발로르 v02 원본 SHA 일치. 1번 정면과 전투예시는 화풍·비율 참조만 사용. 금발/이중검/스카프/초승달/비대칭장화를 복제하지 않음.|
|정면 기본입상|얼굴·흉갑·골반·양발이 정면. 양발 지지, 무릎을 깊게 굽히지 않고 검·방패 자연스럽게 내림. 전투 동작 아님.|
|머리/인상|갈색 층진 짧은 머리·청회색 눈·평온한 미소·큰 실제 얼굴과 다부진 압축 SD 체형. 원본보다 눈/턱이 간결하고 젊게 읽힐 여지가 있어 연령의 완전 동일성을 주장하지 않음.|
|선택1번 작화|뚜렷한 짙은 외곽·큰 각진 명암면·매트 셀. 원화 성인비율 축소판 아님. 모발포함 전체/머리 약3.56은 이 그림의 관찰 추정이며 신규 공통등신 확정 아님.|
|인체좌우/무기수|화면왼쪽=오른손 검 1개, 화면오른쪽=왼팔 방패 1개. 단검/추가팔 없음. 왼손은 방패 뒤 가림으로 확인 불가.|
|손·그립 연결|오른 전완→손목→장갑 손→파란 감긴 손잡이 연결. 폼멜→파란 그립→손→가드→날 축 연결. 보이는 장갑 손가락 덩어리/엄지의 감싸는 형태 확인, 가려진 손가락 5개 전체를 실측·확정하지 않음.|
|검 손잡이|파란 원통 감긴 그립·은색 둥근 면분할 폼멜 유지. 색/구조를 다른 손잡이로 바꾼 것을 화풍차이로 허용하지 않았음.|
|가드·보석·검신|은색 굽은 날개 가드·중앙 붉은 마름모 컷 보석과 은 테두리, 곧은 은색 양날 검신. 고리보호대·금색 가드·청색 사선검신 없음. 곡률/금속 면 수는 SD로 단순화되어 원화와 픽셀 단위 동일하지 않음.|
|방패|큰 은색 카이트 외곽·상단 뾰족 장식·아래 긴 끝, 검은 중앙 긴 십자와 양쪽 깃날개 유지. 최초 여백 보완본에서 약59%로 줄었던 방패를 추가 생성으로 약67%(594±8px/몸884±6px)로 복구했다. 원화와 같은 큰 방패의 가림을 유지하며 정확한3D비례 일치를 주장하지 않음.|
|가슴 사자|흰/은 전신 측면 사자, 화면왼쪽 머리/앞발과 오른쪽 말린 꼬리. 사자머리 단독/금색 문장으로 변경 안 함. 갈기·발의 세부 곡선은 단순화. 최종 큰 방패가 오른쪽 꼬리/하체 일부를 가리므로 가린 모양의 완전성은 확인 불가, 보완전 후보에서 전체를 대조했다.|
|어깨·핀|층진 노출 견갑, 은 원형 핀 2개와 연결끈 없음. 핀 내부 별/면 분할은 원본과 미세 차이.|
|망토·하체|긴 청색 망토·흰 안감·하단 양쪽 흰 용/마름모, 청은 양다리 갑주/청색 중앙천/검은 허리벨트·은 버클. 작은 문양 선 수와 천의 접힘은 단순화.|
|프레이밍|1254×1254 RGBA 생성 원본. α≥32 전체외곽 [292,180,963,1064], 좌292/우291/위180/아래190px 안전여백. 머리·발·검끝·방패끝·망토 포함, 잘림 없음.|
|알파/밝음/어두움|comparison.png/qa-dark.png와 디테일 밝음·어두움을 실제 view_image로 확인. 넓은 배경판/배경무늬 없음. 미세한 유색 저알파 가장자리 존재, near-opaque 내부α253/254 다수. 원본을 그대로 보존했으며 이를 미래 허용결함으로 확정하지 않음.|
|작은 표시|qa-small-light/dark.png 실제 열람. 본체57/72CSSpx에서 머리/눈의 큰 명도와 청은 기사·방패가 읽힘. 사자/용/그립 감긴 선/붉은 보석의 정확한 세부는 식별 곤란. 실게임/실기기 미검증.|
|비교 등록|본체높이·발 중심을 수동 ROI+실제 알파로 측정, 원화1129/참조1353/신규884px. 브라우저의 전체 비교는 모두560CSSpx/동일 발선612px, 작은 비교57/72CSSpx 동일. HTML의 원본 확대 열기1254px 정상.|
|기존 보존|보존목록의11개 원본 및11개 별도보존사본 SHA 모두 일치. 필독21개 해시 변동 없음. 공유규정/게임/main03 작업/기존작품 미편집.|

잔여 한계: 원형핀 내부 면 분할·작은 문장/가드 곡률 차이, SD 얼굴 연령감의 사용자 판단, 유색 저알파 가장자리, 작은 표시에서 문장 세부 손실. 숨은 왼손·뒤쪽 장비는 검증 불가. 이 내부 검수는 사용자 합격·향후 방향 승인·게임 적용이 아니다.

실제 열람 증거: front.png, 후보, references/identity.png·style-front.png·style-combat.png·grip-anatomy.png, comparison.png, qa-dark.png, identity-detail-comparison.png, qa-detail-dark.png, qa-small-light.png, qa-small-dark.png. 브라우저 데이터/원본확대 확인은 browser-evidence.json, 파일/알파/보존해시는 verification-evidence.json. 환경 doctor의 선택하지 않은 경로 경고는 doctor-warnings-verbatim.json에 원문 그대로 보존했다. 내장 host_image 사용은 성공했고 별도 유료API/CLI/키연결은 실행하지 않았다.
'''
(R/'검수.md').write_text(qa.replace('検수','검수'),encoding='utf-8')
(R/'분석.md').write_text('''# 발로르 1번 SD 정면 분석

승인 원화의 긴 성인 인체를 그대로 축소하지 않고, 선택1번의 큰 얼굴·짧은 몸통과 팔다리·큰 장화·선명한 매트 명암면으로 새로 그렸다. 갈색머리/청회눈·청은갑옷·사자·검·방패·용망토는 발로르 원화에서만 가져왔다. 금발전사의 얼굴틀/장비는 제외했다.

현재 신규 모발끝180→발바닥1064=884px, 턱428 기준 모발포함 머리248px·약3.56단위다. 실제 숨은 정수리는 y249±20px의 추정으로 모발끝과 구분한다. 얼굴 및 모발/두상의 정확한 3D 계측이 아니며 등신을 공통수치로 확정하지 않는다. 실제 발 지지중심은 x623±6px. 측정ROI/메타는 manifest 참조.

최초 후보는 정체성 디테일이 읽혔지만 상단 약1%의 좁은 여백으로 반려했다. 후보 바이트를 남기고 내장 편집으로 안전여백을 확보했다. 보완본은 몸/머리 비중·장비·기본입상을 유지하며 프레임 안에서 작아졌고, 비교 때에는 CSS로 같은 몸키에 등록한다. PNG를 수학적으로 줄이거나 재저장하지 않았다.

원본 대비 검 그립·은 폼멜·날개 가드·붉은 보석은 핵심 보존이며 세부 선 수만 단순화했다. 사자/용/방패 문장을 읽을 수 있다. 여백 보완본에서 방패의 본체 상대높이가 약65%→59%로 줄어 추가 생성으로 큰 방패 비중을 복구했다. 후보도 남겨 보완 전후를 확인할 수 있다. 이번 정면 납품에서 다른 방향을 자동 제작하지 않는다.

작은 표시에서는 원화보다 얼굴 덩어리와 눈이 잘 분리되나 문장·보석의 세부선은 줄어든다. 이 관찰은 57/72CSSpx 브라우저 미리보기이며 실제게임통합/실기기검증과 분리한다.
''',encoding='utf-8')
ackpath=T/'읽기확인-v001-7a8e332a3fdb436293422b1d550069be.json'
report=f'''# 발로르 · 선택1번 SD 정면 납품

MAIN01-20261110-D820F076 / 1차 / characters / {now}

정면0도·양발 입상·오른손검/왼방패 기본대기 1장을 내장 imagegen으로 새 제작하고 디테일 대조/밝고어두운 전체/57·72CSSpx 검수를 완료했다. 후보1은 여백 미달로, 후보2는 방패 비중 보완 전으로 보존하고 세번째 생성 결과를 front.png로 제출한다. 사용자 신규SD 합격은 아직 없고, 측면·애니메이션·실게임 적용·공통SD교체는 실행하지 않았다.

주요 경로:
- 정면: {R/'front.png'}
- 비교: {R/'comparison.png'}
- 장비 확대: {R/'identity-detail-comparison.png'}
- 연락판: {R/'index.html'}
- 메타: {R/'asset-manifest.json'}
- 검수: {R/'검수.md'}
- 원본시각목록: {R/'원본시각목록.md'}
- 생성3회 전체입력/후보/출력: {R/'generation-records.json'}

front.png는1254×1254 RGBA, SHA256 `{final['sha256']}`. 생성 원본 바이트와 동일하며 리샘플링/재인코딩/알파정리 없음. 본체884px·발(623,1064)±6px, α≥32 안전여백 위180/아래190/좌292/우291px. 최종 PNG를 새로 그린 원본이며 비교 PNG는 별도 격리 headless 브라우저 캡처다. 사용자 창·탭은 열거나 이동하지 않았다.

원본 검의 파란 감긴 그립/은 폼멜/날개가드/붉은 마름모, 큰 카이트실드/검은날개십자/가슴 전신측면 사자/원형핀2개/용망토를 개별 대조했다. 남은 차이는 핀 내부 분할/가드 곡률/미세문양·얼굴의 SD 연령감이다. 원본과 픽셀 단위 동일하다는 판정은 하지 않는다. 저알파 경계가 남고 작은 표시에서 문장·보석의 정확한 세부는 읽기 어렵다. 숨은 왼손은 확인 불가다.

착수:21문서 본문 재독 후 작업별ACK/start 통과. 실제 ACK `{ackpath}`, SHA `{sha(ackpath)}`; start-result.json status=in_progress. 반환 시21문서 해시 재대조 전부 동일, 새 start를 요구하는 필독 수정 없음. 보존11개원본+11개사본 SHA 일치. verification-evidence.json에 실제 결과를 기록했다.

사용한 스킬은 imagegen/generate2dsprite이며 art_source=host_image, 내장 image_gen 3회 성공. doctor의 WARN/MISSING/UNKNOWN 원문은 doctor-warnings-verbatim.json/doctor.json. 미사용 API키/CLI/키잉경로의 환경 정보이고 유료API전환/설치/계정연결/영상은 실행하지 않았다. 원격반영/커밋/푸시/예약백업 없음. 새 출력 및 이번5종기록만 로컬에 작성했다.
'''
(R/'report.md').write_text(report,encoding='utf-8')
result=dict(task='MAIN01-20261110-D820F076',iteration=1,role='characters',status='completed_for_review',outputPaths={n:str(R/n) for n in ['front.png','index.html','comparison.png','identity-detail-comparison.png','asset-manifest.json','generation-records.json','제작기준.md','검수.md','report.md']},originalPath=read(R/'source-inputs.json')[0]['source'],originalSha256=read(R/'source-inputs.json')[0]['sha256'],readingAcknowledgement=dict(path=str(ackpath),sha256=sha(ackpath),startPassed=True,currentHashesMatch=True),checks=dict(nativePNG=True,actualViews=True,lightDark=True,smallPreviewOnly=True,preserved11Models=True,userApproval=False,gameIntegrated=False),remainingIssues=['Minor pin facets/guard curvature/heraldry detail simplification','SD age impression requires user judgment','Low-alpha colored edges; small-preview heraldry/gem detail loss','Occluded left hand not inspectable'])
write('결과.json',result)
local=R/'작업기록';local.mkdir(exist_ok=True)
texts={
'1_대화기록.md':f'사용자 진행 근거 사용자확인.md/디테일피드백.md를 읽고1번 화풍의 발로르 정면 기본입상1장 제작을 수행했다. 원본/예비4별도보존·칼손잡이변경오류를 반영했다. 신규 결과에 대한 사용자 합격은 아직 없다.\n결과: {R/"report.md"}',
'2_사전확인.md':'사전21문서 본문독해/새ACK/start 통과. 승인 Balor SHA061f23cc… 대조, IDENTITY/STYLE/그립역할 분리. 원본시각목록을 생성전 기록. 새 출력/이번기록만 허용하며 공유규정/게임/다른메인/UI 제외. 실제 사전증거는 상위2_사전확인.md와start-result.json.',
'3_작업일지.md':f'내장 image_gen 3회: 최초 정면→여백 미달후보 보존→여백편집→방패 비중 보완 정면완료. 바이트복사/메타/HTML/전체·디테일·57/72px·밝음/어두움 캡처6장 제작 및 실제 view_image 확인. 필독21개/보존11원본·11사본/생성3원본 해시 검증. 결과 {R/"front.png"}. 미실행: 측면/영상/게임/UI/외부API/커밋푸시.',
'4_정의문서.md':'본작업의1번은선택금발전사 정면의선·각진매트셀·큰머리압축SD비율만의참조. 인물/검/방패/문장은승인발로르v02만이권위. 공통기준변경아님. 모발끝→발바닥bodyHeight884/foot623,1064±6px, 숨은정수리249±20추정. 원본PNG보존과CSS표시등록을분리. 검수통과는사용자합격아님.',
'5_버전관리.md':'새출력폴더와본작업기록만로컬작성. 기존모델/4번예비/타팀원본11개및보존사본11개SHA일치. 원본생성PNG3개바이트보존. 두 후보는candidate-01-tight-framing.png/candidate-02-shield-ratio.png로보관. 커밋없음/푸시없음/원격미반영/예약백업없음. 사용자가별도수동저장전검토할로컬추가상태이며 자동Git통합안함.'}
for name,text in texts.items():
 content=f'# {name[:-3]} — characters / 차수1\n\n{now}\n\n{text}\n'
 (local/name).write_text(content,encoding='utf-8')
 p=T/name; existing=p.read_text(encoding='utf-8-sig') if p.exists() else ''
 marker='## characters 제작·검수 완료 기록 — MAIN01-20261110-D820F076'
 p.write_text(existing.split(marker)[0].rstrip()+'\n\n'+marker+'\n\n'+content,encoding='utf-8')
print(json.dumps(dict(output=str(R),frontSha=final['sha256'],ackCurrent=len(docs),preserved=len(pres),rawCopies=len(records['calls']),displayBodyHeights=[x['bodyHeight'] for x in reg]),ensure_ascii=False))

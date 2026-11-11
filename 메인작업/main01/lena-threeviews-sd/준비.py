from pathlib import Path
import hashlib,importlib.util,json
R=Path('C:/Users/user/Desktop/Grid Defenders');S=R/'작업관리';H=Path(__file__).resolve().parent
if (H/'연결.json').exists():raise SystemExit('Already prepared; inspect existing state.')
W=Path('C:/Users/user/orca/workspaces/Grid Defenders/캐릭터디자인2')
priorH=H.parent/'lena-illustration';old=json.loads((priorH/'연결.json').read_text(encoding='utf-8'))
master=Path(old['output'])/'illustration.png';master_sha=hashlib.sha256(master.read_bytes()).hexdigest();assert master_sha=='41dbb10f2aa2e04d66374fee15df5ded732894f71b8ac58595f3ebf39b411391'
sdref=W/'output/characters/gc9_longsword_dagger/idle6_style1_style4_main01-20261109-e1fd458c_v003/variant-1-front.png';assert sdref.is_file()
proof=(H/'사용자확인.md').read_text(encoding='utf-8')
spec=importlib.util.spec_from_file_location('board',S/'도구/작업대장.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);b=m.Board(S)
t=b.load(old['task'],'main01')
if t['status']=='awaiting_user':b.record(old['task'],'main01','accept',H/'사용자확인.md','합격 매우 만족')
assert b.load(old['task'],'main01')['status']=='accepted'
old.update(state='accepted',userAccepted=True,acceptanceEvidence=str(H/'사용자확인.md'),acceptanceQuote='합격 매우 만족');(priorH/'연결.json').write_text(json.dumps(old,ensure_ascii=False,indent=2),encoding='utf-8')
piece=S/'기준/characters/작품/레나';piece.mkdir(parents=True,exist_ok=True)
accepted={'character':'레나','form':'illustration','state':'user_accepted','userQuote':'합격 매우 만족','evidence':str(H/'사용자확인.md'),'source':str(master),'sha256':master_sha,'sourceTask':old['task'],'view':'right_threequarter_approx35','newViewOrSdAccepted':False,'profileSource':str(priorH/'사용자확인.md')}
p=piece/'승인.json'
if p.exists():assert json.loads(p.read_text(encoding='utf-8'))['sha256']==master_sha
else:p.write_text(json.dumps(accepted,ensure_ascii=False,indent=2),encoding='utf-8')
(piece/'제작기준.md').write_text('# 레나 최신 작품별 제작기준\n\n일반 전신3/4 마스터는 사용자의 ‘합격 매우 만족’으로 승인됐다. 승인.json의 원본/해시를 사용한다. 승인 레나의 실제 선·얼굴·색·신체비율·재질·코트/이너·부츠·레이피어를 유지하며 옛GC9 참조로 재스타일링하지 않는다.\n\n사용자가 정면/3/4/우측면3장과 SD3방향의 동시 진행,2.6 사용을 명시했다. 합격3/4는 바이트 유지, 일러스트0/90 추가. SD는 승인 레나 외형과 최신1번 금발SD 표본의 결합비율을 역할분리해 참조한다. 새로운SD/추가방향은 아직 사용자합격이 아니다.\n\n일러스트 방향완성 후 SD착수라는 옛순서보다 이번동시진행이우선한다. 검수는 자세·그림체 중심으로 결과를 바로 제출하고 세부장식/검축/알파계측을 새합격관문으로 추가하지 않는다. SD는 본체72CSSpx/3번 표시, 고해상도원본 보존. 실게임/리깅/모션/Git 저장은 별도 요청 범위다. 상세 최신범위는 '+str(H/'사용자확인.md')+' 및 전문지시다.\n',encoding='utf-8')
task=b.new('main01','characters','레나 일러스트3방향·SD3방향 병행 / 2.6 신규5장',proof);tid=task['id'];F=b.folder(tid);out=W/'output/characters/lena'/('threeviews_sd_'+tid.lower()+'_v001')
prompt=(H/'전문지시초안.md').read_text(encoding='utf-8')
for key,value in {'TASK':tid,'APPROVAL':proof,'MASTER':str(master),'PIECE':str(piece),'ROOT':str(R),'SDREF':str(sdref),'OUTPUT':str(out)}.items():prompt=prompt.replace('{{'+key+'}}',value)
assert '{{' not in prompt
(F/'요청확인.md').write_text(proof,encoding='utf-8');(F/'전문프롬프트.md').write_text(prompt,encoding='utf-8');(F/'2_사전확인.md').write_text((H/'사전확인.md').read_text(encoding='utf-8'),encoding='utf-8')
docs={'1_대화기록.md':proof,'3_작업일지.md':'레나 일반일러스트 실제합격 기록→SD3방향 개수 실제답변 확인→합격원본/공통SD표본 역할분리·호출5회·두트랙병행 전문지시 준비. 아직 새생성 전.','4_정의문서.md':'일러스트0/35/90(35승인원본보존+0/90신규),SD0/35/90신규. 총6칸·신규5장.2.6각최초1POST. 자세/화풍관찰 후 즉시제출.','5_버전관리.md':'레나 초기합격 원작업74BA96AC는 accepted. 후속 신규작업과 이전합격원본을 분리한다. 원본/필드/타팀/게임/리깅/키설정/Git변경없음.'}
for name,text in docs.items():
 (F/name).write_text('# '+tid+'\n\n'+text+'\n',encoding='utf-8');(H/name).write_bytes((F/name).read_bytes())
(H/'입력목록.json').write_text(json.dumps([{'path':str(master),'role':'approved_lena_identity_and_illustration_style','sha256':master_sha},{'path':str(sdref),'role':'sd_proportion_and_translation_only','sha256':hashlib.sha256(sdref.read_bytes()).hexdigest()}],ensure_ascii=False,indent=2),encoding='utf-8')
extras=[H/'사용자확인.md',H/'사전확인.md',piece/'승인.json',piece/'제작기준.md',priorH/'사용자확인.md',S/'단일메인운영규정.md',S/'이미지2.6사용규칙.md',S/'진행승인규칙.md',S/'저장운영규정.md',S/'기준/characters/SD_72CSSpx_표시기준.md',R/'메인작업/main01/balor-style1/사용자확인.md',W/'문서/02_세부기획/02_영웅/캐릭터제작규약.md',W/'문서/02_세부기획/02_영웅/한손무기그립기준.md',W/'tools/image-studio/README.md']
assert all(p.is_file() for p in extras)
b.set_readings(tid,'main01',[str(p) for p in extras]);b.confirm(tid,'main01','정면 3/4 우측면으로 3장하고 SD작업 동시 진행 / 2.6사용 허가 / SD 3방향도 함께 제작',H/'사용자확인.md');plan=b.prepare(tid,'main01')
c={'task':tid,'iteration':1,'folder':str(F),'output':str(out),'plan':plan,'state':'prepared_not_sent','targetDispatch':'ctx_e42dcd1ad166','image26InitialCallsAllowed':5,'expectedNewImages':5,'totalComparisonImages':6,'preservedApprovedView':str(master),'reviewScope':['pose','drawing_style'],'parallelTracks':['illustration','sd']}
(H/'연결.json').write_text(json.dumps(c,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps({'task':tid,'state':c['state'],'prompt':plan['prompt'],'newImages':5,'comparisonImages':6},ensure_ascii=False))

from pathlib import Path
from datetime import datetime
import hashlib, importlib.util, json, os, shutil, subprocess, sys, urllib.request

R=Path('C:/Users/user/Desktop/Grid Defenders'); S=R/'작업관리'; G=R/'게임'
H=R/'메인작업/main01/blond-motion-apply'; V=H/'visual-spacing-v003'; I=V/'integration'
E=R/'메인작업/main01/balor-motions-dual/workshop-correction-v001'; QH=E/'qa'
Q=Path('C:/Users/user/orca/workspaces/Grid Defenders/테스터/output/balor-workshop-correction_qa_main01-20261111-b11472d8_v001')
O=Path('C:/Users/user/orca/workspaces/Grid Defenders/게임개발/output/blond-turtle-spacing-boundary_main01-20261111-dcd6b21b_v003')
ORCA='C:/Users/user/AppData/Local/Programs/orca/resources/bin/orca.exe'
def read(p):return json.loads(Path(p).read_text(encoding='utf-8-sig'))
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def write(p,d):Path(p).parent.mkdir(parents=True,exist_ok=True);Path(p).write_text(json.dumps(d,ensure_ascii=False,indent=2),encoding='utf-8')
def now():return datetime.now().astimezone().isoformat()
spec=importlib.util.spec_from_file_location('board',S/'도구/작업대장.py'); mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod);board=mod.Board(S)

def ack(task,role):
 t=board.load(task,'main01');board.validate_started(t)
 p=Path(t['readingAcknowledgement']['path']);a=read(p)
 assert a['task']==task and a['role']==role and a['iteration']==1
 return {'path':str(p),'sha256':sha(p),'documents':len(a['documents'])}

def browser_state():
 tabs=json.loads(subprocess.check_output([ORCA,'tab','list','--json'],text=True,encoding='utf-8'))['result']['tabs']
 candidates=[t for t in tabs if t['url']=='http://localhost:5173/lobby-preview.html']
 assert len(candidates)==1,'로비 이외 상태로 바뀌면 사용자가 진행중인지 다시 확인'
 page=candidates[0]
 expr="JSON.stringify({url:location.href,keys:Object.fromEntries(Object.keys(localStorage).filter(k=>k.startsWith('grid-defenders.')).map(k=>[k,localStorage.getItem(k)])),overlays:document.querySelectorAll('vite-error-overlay').length})"
 raw=json.loads(subprocess.check_output([ORCA,'eval','--page',page['browserPageId'],'--expression',expr,'--json'],text=True,encoding='utf-8'))
 result=raw['result']['result'];result=json.loads(result) if isinstance(result,str) else result
 assert result['url']=='http://localhost:5173/lobby-preview.html'
 return {'at':now(),'page':page['browserPageId'],'active':page['active'],**result}

def prework():
 I.mkdir(parents=True,exist_ok=True)
 p=I/'2_사전확인.md'
 if p.exists():return
 docs=read(R/'작업연결.json')['requiredReadings']+[str(S/'저장운영규정.md'),str(S/'이미지2.6사용규칙.md'),str(S/'브랜치목록.json'),str(S/'작업대장.md'),str(S/'기준/gameplay/규정.md'),str(S/'기준/qa/규정.md'),str(S/'기준/characters/SD_72CSSpx_표시기준.md'),str(R/'문서/00_개발규칙/스킬구현규약.md'),str(R/'문서/00_개발규칙/개발규칙.md'),str(H/'사용자승인.md'),str(O/'검증보고.md'),str(O/'통합.patch'),str(O/'검사.patch'),str(Q/'report.md')]
 applications={
  '규정A.md':'승인된 원요청의 기술 보완과 정확한 파일만 통합. 원본/미커밋/5종기록 보존.',
  '작업진행방법.md':'이번 반환에서 실제 규정·보고·patch 본문 읽기 후 자가 사전확인. 본문 열람과 SHA검사를 구분.',
  '메인운영규정.md':'같은 gameplay/qa 작업의 실제 dispatch 결과를 기록하고 중복 편집자·폴링 금지.',
  '단일메인운영규정.md':'main01 단독 인수/통합. main02/03 재개하지 않음.',
  '팀장운영규정.md':'콘텐츠 원본은 그대로. 기술QA와 사용자 미적합격 분리.',
  '파일담당표.md':'반환된4게임 소스만 root에 적용. UI/effects 원본을 임의 편집하지 않음.',
  '메인보고형식.md':'번호/실제상태 먼저, 완료는 초록표식. 기술검증과 사용자 판정 분리.',
  '진행승인규칙.md':'원요청의 실제 진행 문구 범위내 검수/통합. 새 제작/이미지 생성은 없음.',
  '저장운영규정.md':'로컬 결과/근거만 기록. Git 커밋·푸시·예약저장 안 함.',
  '이미지2.6사용규칙.md':'이번 기술 반환에 유료생성 허가 없음. 이미 전달한 신규13장은 별도/검수하지 않음.',
  '스킬구현규약.md':'몸통/전체표시/지면/공격판정 분리. 전체 전장 이미지와 사거리·피해·저장 회귀 확인.',
  'SD_72CSSpx_표시기준.md':'금발 본체72와 보스 개별180 CSS 기준 유지; PNG 축소/재생성 없음.',
  '사용법.md':'실제 worker_done과 최신 ACK검증 후 returned. 사용자 accept를 대신 입력하지 않음.',
  '개발규칙.md':'대상/제외/완료기준 선기록. 최신 보고형식과 저장규정이 오래된5블록/선저장문구보다 우선.'}
 rows=[]
 for d in dict.fromkeys(docs):
  pth=Path(d);rows.append({'path':d,'sha256':sha(pth),'applies':applications.get(pth.name,'이번 실제 담당·작업 상태·원요청·보고·패치의 범위를 확인. 최종합격/새제작 권한으로 확대하지 않음.')})
 write(I/'메인읽기확인.json',{'at':now(),'role':'main01','work':'DCD6B21B 반환·통합 / B11472D8 기술QA 반환','documents':rows,'missingAssumedPath':'기준/main01/규정.md는 존재하지 않음. 작업연결 requiredReadings의 메인운영규정/작업진행방법을 실제 기준으로 사용.'})
 p.write_text('# 반환 검토·좁은 실게임 통합 사전확인\n\n'+now()+'\n\n사용자 실제 승인: 마지막 연결했던 기준으로 진행해줘. 각 유닛 겹침 방지와 기존 스프라이트 적용 범위의 기술 보완이다.\n\n대상은 DCD6B21B의 현재root v001 기반 누적4소스와7검사. 원본21자산과 그 외 root 파일, 실제로 열린 로비/사용자저장/공방5182/원본13장은 유지한다.\n\n기존6시트 공방QA는 별도 반환만 한다. 최신23필독 ACK와58경로 현재SHA·HTTP200을 확인한다. 신규Sunburst13장 아트 검수는 하지 않는다.\n\n반영 전 모든before/after SHA, root71현재SHA를 대조하고 작업별 원본사본을 보존한다. 로비 localStorage는 grid-defenders. prefix만 읽기/보존하며 쓰지 않는다. 정확한11파일 적용 후 root test/build 및 독립QA 진행. 코드 충돌/화면상태 변경/검사 실패를 숨기지 않는다. 사용자합격/커밋/푸시는 수행하지 않는다.\n',encoding='utf-8')
 for name,text in {
  '1_대화기록.md':'누적4건 알림을 한 번 check하여 B11472D8/ DCD6B21B의 실제 succeeded 반환을 수신. 원래 제작 승인에 따라 기술 검토/통합한다.',
  '3_작업일지.md':'사전규정·보고서/patch 본문 열람, 후기24.5초·혼잡 전장·공방원본보정 비교 화면 직접 확인. 이후 통합 결과는 별도 추가.',
  '4_정의문서.md':'v003은 고정64셀 전체표시 경계와 이동·정지복구 제한, body keep-out/앞발40·270 등록. 기존 체격/능력치/타격시점 보존. 공방QA163PASS는 기존6동작 편집기만 대상.',
  '5_버전관리.md':'이번 로컬 작업별 before/staged 사본으로 복구 가능. 요청없는 Git commit/push/예약백업0. 제품/검사11파일과 local 기록만 변경.'}.items():
  (I/name).write_text('# '+name+'\n\n'+text+'\n',encoding='utf-8')

def review():
 prework()
 qc=read(QH/'연결.json');qr=read(Q/'result.json')
 assert qc['task']==qr['task']=='MAIN01-20261111-B11472D8' and qc['delivery']['dispatchId']=='ctx_17ab62341cde'
 assert qr['outcome']=='succeeded' and qr['result']=='PASS' and qr['summary']['PASS']==163 and qr['summary']['FAIL']==0
 assert not qr['runtimeErrors'] and not qr['httpErrors'] and qr['productEdits']==qr['apiGenerationCalls']==qr['gitWrites']==0
 hashes=[]
 for row in read(Q/'target-hashes-after.json'):
  actual=sha(row['path']);assert actual==row['after']==row['expected'] and row['unchanged'];hashes.append({'path':row['path'],'sha256':actual})
 assert len(hashes)==58
 qaack=ack(qc['task'],'qa');assert qaack['documents']==23
 with urllib.request.urlopen('http://127.0.0.1:5182/effect-workshop.html',timeout=10) as res:http=res.status
 assert http==200
 qreview={'at':now(),'task':qc['task'],'nativeMessage':'msg_86b9aeb6763a','nativeOutcome':'succeeded','report':str(Q/'report.md'),'reportSha256':sha(Q/'report.md'),'browserPass':160,'preservationPass':3,'failed':0,'readAck':qaack,'currentHashes':hashes,'http':http,'personallyViewed':str(Q/'comparison-wide-dpr2.png'),'technicalQaPassed':True,'userAccepted':False,'newSunburst13ArtReviewed':False}
 write(QH/'반환검증.json',qreview)
 (QH/'반환검토.md').write_text('# 발로르 공방 독립 검증 반환\n\n기존6동작72프레임 편집·원본/보정·동기·66점6갭 궤적·JSON독립복구·불량입력 거부와QA01/03 회귀가 독립160항목, 보존3항목 통과했다. 메인은 보고/실제비교화면/현재58SHA/필독23ACK/HTTP200을 확인했다.\n\n원래 아트 failed/주의 및 추정점 한계, 실기기/장기부하/이번IndexedDB왕복 미검증은 유지한다. 새Sunburst13장 검수/통합과 별개.\n',encoding='utf-8')
 if board.load(qc['task'],'main01')['status']=='in_progress':board.record(qc['task'],'main01','returned',Q/'report.md')
 qc.update(state='returned_technical_pass',workerOutcome='succeeded',report=str(Q/'report.md'),mainReview=str(QH/'반환검증.json'),userAccepted=False);write(QH/'연결.json',qc)
 ec=read(E/'연결.json');ec.update(state='technical_qa_pass_awaiting_user',userAccepted=False,independentQa={'task':qc['task'],'result':'PASS','report':str(Q/'report.md'),'mainReview':str(QH/'반환검증.json')});write(E/'연결.json',ec)
 gc=read(V/'연결.json');gr=read(O/'결과.json');m=read(O/'변경manifest.json')
 assert gc['task']==gr['task']==m['task']=='MAIN01-20261111-DCD6B21B' and gr['outcome']=='succeeded' and gr['dispatch']==gc['delivery']['dispatchId']=='ctx_3aa339222a78'
 assert gr['productCount']==4 and gr['checkCount']==7 and gr['models']['failed']==0
 gack=ack(gc['task'],'gameplay');assert gack['documents']==23
 expected=read(H/'integration/현재반영해시.json')['files'];assert len(expected)==71
 for row in expected:assert sha(row['path'])==row['sha256'],'root original71 drift: '+row['path']
 rows=[]
 for row in m['productFiles']+m['checkFiles']:
  rel=Path(row['path']);dest=G/rel;src=Path(row['delivery'])
  assert dest.resolve().is_relative_to(G.resolve()) and src.resolve().is_relative_to(O.resolve())
  assert (sha(dest) if dest.is_file() else None)==row['beforeSha256'] and sha(src)==row['afterSha256']
  stage=I/'staged'/rel;stage.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(src,stage)
  if dest.exists():
   old=I/'before'/rel;old.parent.mkdir(parents=True,exist_ok=True)
   if old.exists():assert old.read_bytes()==dest.read_bytes()
   else:shutil.copy2(dest,old)
  rows.append({'path':row['path'],'beforeSha256':row['beforeSha256'],'afterSha256':row['afterSha256'],'staged':str(stage)})
 write(I/'통합사전검증.json',{'task':gc['task'],'at':now(),'productCount':4,'checkCount':7,'files':rows,'root71BeforeMatch':True,'readAck':gack,'nativeMessage':'msg_c04f6445c73f','nativeOutcome':'succeeded','viewed':[str(O/'after-visual/arena-crowd.png'),str(O/'after-visual/arena-boss-late.png')],'limitations':gr['limitations']})
 if board.load(gc['task'],'main01')['status']=='in_progress':board.record(gc['task'],'main01','returned',O/'결과.json')
 gc.update(state='returned_ready_for_root_integration',workerOutcome='succeeded',report=str(O/'검증보고.md'),mainReview=str(I/'통합사전검증.json'),userAccepted=False);write(V/'연결.json',gc)
 print(json.dumps({'qa':'163 PASS / current58SHA /23ACK /HTTP200','game':'4source7check /root71before /23ACK PASS','prepared':str(I)},ensure_ascii=False))

def apply():
 assert not (I/'실제반영.json').exists(),'Already applied; inspect receipt instead of rerun'
 data=read(I/'통합사전검증.json');rows=data['files']
 state=browser_state();assert state['overlays']==0;write(I/'사용자상태-반영전.json',state)
 for row in rows:
  dest=G/row['path'];assert (sha(dest) if dest.is_file() else None)==row['beforeSha256'] and sha(row['staged'])==row['afterSha256']
 changed=[]
 for row in rows:
  dest=G/row['path'];dest.parent.mkdir(parents=True,exist_ok=True)
  assert (sha(dest) if dest.is_file() else None)==row['beforeSha256']
  temp=dest.with_name(dest.name+'.boundary-main01.tmp');assert not temp.exists();shutil.copy2(row['staged'],temp);os.replace(temp,dest)
  assert sha(dest)==row['afterSha256'];changed.append(row['path']);write(I/'반영중.json',{'changed':changed,'at':now()})
 result={**data,'at':now(),'state':'applied_pending_root_checks','userStorageWrite':False,'browserNavigation':False,'serverRestart':False,'gitWrite':False,'apiCall':False}
 write(I/'실제반영.json',result)
 gc=read(V/'연결.json');gc.update(state='root_applied_pending_checks',rootIntegrated=True,rootIntegrationEvidence=str(I/'실제반영.json'),needsIndependentQa=True);write(V/'연결.json',gc)
 with (I/'3_작업일지.md').open('a',encoding='utf-8') as f:f.write('\n'+now()+' 현재로비URL/앱저장 읽기보존 후11파일만 SHA검증/원자적교체. 실제반영.json. root검사 및 독립QA 대기.\n')
 print(json.dumps({'applied':changed,'state':result['state']},ensure_ascii=False))

if __name__=='__main__':
 if sys.argv[1:] == ['review']:review()
 elif sys.argv[1:] == ['apply']:apply()
 elif sys.argv[1:] == ['after-state']:
  state=browser_state();write(I/'사용자상태-반영후.json',state);before=read(I/'사용자상태-반영전.json');print(json.dumps({'samePage':state['page']==before['page'],'sameUrl':state['url']==before['url'],'sameStorage':state['keys']==before['keys'],'overlay':state['overlays']},ensure_ascii=False))
 else:raise SystemExit('review | apply | after-state')

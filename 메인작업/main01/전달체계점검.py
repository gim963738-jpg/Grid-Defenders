from pathlib import Path
from collections import Counter
from datetime import datetime
import hashlib, json, subprocess

R=Path('C:/Users/user/Desktop/Grid Defenders');S=R/'작업관리'
A=R/'메인작업/main01/workflow-audit-20261111';A.mkdir(exist_ok=True)
ORCA='C:/Users/user/AppData/Local/Programs/orca/resources/bin/orca.exe'
def read(p):return json.loads(Path(p).read_text(encoding='utf-8-sig'))
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def write(p,d):p.write_text(json.dumps(d,ensure_ascii=False,indent=2),encoding='utf-8')
if not (A/'2_사전확인.md').exists():
 for name,text in {
 '1_대화기록.md':'사용자 요청: 지금 작업 체계의 전달/수신 과정 변경·오류, 지시 원문과 전문프롬프트의 의미 보존, AI 간 오해와 불필요한 경유를 전체적으로 점검하고 설명. 체계 변경/신규 제작은 요청하지 않음.',
 '2_사전확인.md':'읽기 전용 감사. 공유작업48건의 메타·발송영수증·버전·ACK/착수·반환 이력을 전수 확인하고 분야별 실제 내용은 명시한 표본에서 대조. 메인 직접 Sunburst13개는 별도 확인. 현행규정/게임/부서/진행중작업을 바꾸거나 검수용AI를 새로 거치게 하지 않음. 기록/근거만 이 폴더에 작성. API/Git/화면 변경0.',
 '3_작업일지.md':'규정A/메인·팀장운영/작업방법/보고·진행·단일메인/저장·2.6 규칙, 현행 조직/도메인/파일담당·작업목록을 읽고 전달/의미/결과상태를 나누어 점검 시작.',
 '4_정의문서.md':'문서바이트보존, 실제수신, 작업착수, 의미보존, 생성모델의 이행, 기술검증, 사용자합격은 별도 판정. 해시/ACK는 의미이해 증거로 대신하지 않음. 최신요청으로 바뀐 방향은 과거 오류로 소급하지 않음.',
 '5_버전관리.md':'감사JSON·보고만 로컬 작성. 기존 규정/제품/원본/작업대장/상태를 수정하지 않음. Git commit/push/자동백업 없음.'}.items():
  (A/name).write_text('# 작업 전달 체계 점검\n\n'+datetime.now().astimezone().isoformat()+'\n\n'+text+'\n',encoding='utf-8')

tasks=[];events=[];plans=[];acks=[];errors=[]
for p in sorted((S/'작업').glob('*/task.json')):
 d=read(p);tasks.append({k:d.get(k) for k in ['id','main','branch','title','status','iteration','createdAt','updatedAt']})
 for e in d.get('history',[]):
  row={'task':d['id'],'branch':d['branch'],**e};ev=e.get('evidence')
  if ev and 'path' in ev:
   q=Path(ev['path']);row['fileExists']=q.is_file();row['fileHashMatches']=q.is_file() and sha(q)==ev.get('sha256')
   if not row['fileExists'] or not row['fileHashMatches']:errors.append({k:row.get(k) for k in ['task','branch','action','iteration','evidence','fileExists','fileHashMatches']})
  events.append(row)
 for plan in sorted(p.parent.glob('발송준비-v*.json')):
  z=read(plan);f=Path(z['prompt']);plans.append({'task':d['id'],'iteration':z.get('iteration'),'path':str(plan),'prompt':str(f),'exists':f.is_file(),'hashMatches':f.is_file() and sha(f)==z.get('promptSha256'),'sourcePromptSha256':z.get('sourcePromptSha256'),'approvalQuote':z.get('approval',{}).get('userQuote'),'promptCharacters':len(f.read_text(encoding='utf-8-sig')) if f.is_file() else None,'snapshotDocumentCount':len(z.get('approval',{}).get('hashes',{}))})
 for ap in sorted(p.parent.glob('읽기확인-v*.json')):
  z=read(ap);docs=z.get('documents',[]);acks.append({'task':d['id'],'iteration':z.get('iteration'),'role':z.get('role'),'path':str(ap),'sha256':sha(ap),'documentCount':len(docs),'workSummary':z.get('workSummary'),'allAppliesNonempty':all(x.get('applies','').strip() for x in docs),'taskRoleMatch':z.get('task')==d['id'] and z.get('role')==d['branch']})
write(A/'작업목록.json',tasks);write(A/'이력대조.json',events);write(A/'발송문서대조.json',plans);write(A/'읽기확인목록.json',acks);write(A/'증거불일치.json',errors)

native={}
for label,args in [('native-tasks',['task-list','--run','run_47ce1a81d7b1','--full','--json']),('native-workers',['worker-list','--json']),('native-messages',['inbox','--terminal','run:run_47ce1a81d7b1','--limit','250','--full','--json'])]:
 cp=subprocess.run([ORCA,'orchestration',*args],capture_output=True,text=True,encoding='utf-8',errors='replace')
 if cp.returncode:write(A/(label+'.json'),{'error':cp.stdout,'stderr':cp.stderr,'exit':cp.returncode});continue
 z=json.loads(cp.stdout);write(A/(label+'.json'),z);native[label]={'topKeys':list(z),'resultType':type(z.get('result')).__name__,'resultKeys':list(z['result']) if isinstance(z.get('result'),dict) else len(z.get('result',[]))}

direct=read(R/'메인작업/main01/balor-sunburst13-direct-v001/작업.json');drows=[]
for j in direct['jobs']:
 prompt=Path(j['promptFile']).read_text(encoding='utf-8-sig');req=read(R/'메인작업/main01/balor-sunburst13-direct-v001'/(j['id']+'-request.json'))
 drows.append({'id':j['id'],'requestId':j['requestId'],'promptFile':j['promptFile'],'promptShaMatch':sha(j['promptFile'])==j['promptSha256'],'normalizedTextHashMatchesRecord':hashlib.sha256(prompt.encode('utf-8')).hexdigest()==j['promptSha256'],'hashComparisonNote':'Recorded prompt hash is UTF-8 text with LF; Windows file may use CRLF. Compare normalized text and submitted prompt separately from file bytes.','submittedPromptEqualsFile':req['prompt']==prompt.strip(),'requestedModel':req['model'],'responseModel':j.get('responseModel'),'sourceOutput':j['sourceOutput'],'nativeOutputUnchanged':sha(j['outputFile'])==sha(j['sourceOutput'])==j['sha256'],'referenceCount':len(j['attachedReferences']),'refs':[{'path':x['source'],'recordedSha':x['sha256'],'shaMatch':sha(x['source'])==x['sha256']} for x in j['attachedReferences']],'artReviewed':j['artReviewed']})
write(A/'메인직접13호출대조.json',drows)
summary={'at':datetime.now().astimezone().isoformat(),'tasks':len(tasks),'branchCounts':dict(Counter(x['branch'] for x in tasks)),'statuses':dict(Counter(x['status'] for x in tasks)),'eventCounts':dict(Counter(x.get('action') for x in events)),'plans':len(plans),'promptMissing':sum(not x['exists'] for x in plans),'promptHashMismatch':sum(x['exists'] and not x['hashMatches'] for x in plans),'acks':len(acks),'emptyApplies':sum(not x['allAppliesNonempty'] for x in acks),'ackTaskRoleMismatch':sum(not x['taskRoleMatch'] for x in acks),'evidenceMismatch':len(errors),'direct13PromptEquals':sum(x['submittedPromptEqualsFile'] for x in drows),'direct13NativeBytesEqual':sum(x['nativeOutputUnchanged'] for x in drows),'native':native}
write(A/'요약수치.json',summary);print(json.dumps(summary,ensure_ascii=False,indent=2))

from pathlib import Path
import hashlib,importlib.util,json,shutil,re,urllib.request,urllib.error,time,os
from urllib.parse import quote

R=Path('C:/Users/user/Desktop/Grid Defenders'); S=R/'작업관리'; P=R/'메인작업/main01'
spec=importlib.util.spec_from_file_location('board',S/'도구/작업대장.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);b=m.Board(S)
for name,outcome,reportname in [('character-effect-workshop','succeeded','검증보고.md'),('balor-motions-dual','failed','report.md')]:
 H=P/name;c=json.loads((H/'연결.json').read_text(encoding='utf-8'));O=Path(c['output']);report=O/reportname;assert report.is_file()
 if b.load(c['task'],'main01')['status']=='in_progress':b.record(c['task'],'main01','returned',report)
 c.update(state='awaiting_user',workerOutcome=outcome,report=str(report),userAccepted=False)
 (H/'연결.json').write_text(json.dumps(c,ensure_ascii=False,indent=2),encoding='utf-8')
 (H/'반환검토.md').write_text('# 반환 검토\n\n실제 worker_done outcome: '+outcome+'\n\n반환 문서: '+str(report)+'\n\n'+('기존 공방 구현과 제작팀 검사 근거·실제 화면·HTTP200 확인. 독립QA와 사용자 최종 확인은 별도다.' if outcome=='succeeded' else '26시트 생성/재생기는 존재하지만 횡베기 읽힘·무기 최고점 잘림·원본 크기와 연결 흔들림으로 품질 미달. 사용자 합격·게임 적용·추가 생성은 하지 않았다.')+'\n',encoding='utf-8')
 print(json.dumps({'task':c['task'],'boardStatus':b.load(c['task'],'main01')['status'],'workerOutcome':outcome},ensure_ascii=False))

H=P/'character-effect-workshop';c=json.loads((H/'연결.json').read_text(encoding='utf-8'));O=Path(c['output'])
changed=json.loads((O/'changed-files.json').read_text(encoding='utf-8-sig'));verified=[]
for entry in changed:
 p=Path(entry['path']);actual=hashlib.sha256(p.read_bytes()).hexdigest();assert actual==entry['sha256'],str(p);verified.append({'path':str(p),'sha256':actual})
(H/'수신파일검증.json').write_text(json.dumps({'changedFiles':verified,'allMatch':True,'url':'http://127.0.0.1:5182/effect-workshop.html#actor'},ensure_ascii=False,indent=2),encoding='utf-8')

H=P/'balor-motions-dual';c=json.loads((H/'연결.json').read_text(encoding='utf-8'));O=Path(c['output']);T=R/'게임/public/dev-previews/balor-motions-dual-v001'
names=['index.html','data.js','player.js','comparison.png','asset-manifest.json','generation-records.json','action-plan.json','technical-checks.json','visual-review.json','report.md','검수.md','expected-assets.md','제작기준.md']
files=[O/n for n in names]
for prefix in ['raw','assets','source']:
 files.extend(p for p in (O/prefix).rglob('*') if p.is_file() and p.suffix.lower() in ['.png','.json'])
files.extend([O/'api/01-ref-balor90/native.png',O/'api/02-ref-giant90/native.png'])
assert all(p.is_file() for p in files)
assert len([p for p in files if p.parent.parent==O/'raw' and p.suffix.lower()=='.png'])==26
records=[]
for p in sorted(set(files)):
 rel=p.relative_to(O);data=p.read_bytes()
 if p.suffix.lower() in ['.html','.js','.json','.md']:assert not re.search(rb'sk-(?:proj-)?[A-Za-z0-9_-]{24,}',data),str(rel)
 source_digest=hashlib.sha256(data).hexdigest()
 if rel.as_posix()=='index.html':
  text=data.decode('utf-8');tag='<script src="data.js"></script><script src="player.js"></script>'
  assert text.count(tag)==1
  scripts=(O/'data.js').read_text(encoding='utf-8')+'\n'+(O/'player.js').read_text(encoding='utf-8')
  assert '</script' not in scripts.lower()
  data=text.replace(tag,'<script>\n'+scripts+'\n</script>').encode('utf-8')
 dest=T/rel;dest.parent.mkdir(parents=True,exist_ok=True)
 if dest.exists():
  previous=dest.read_bytes()
  assert previous in [p.read_bytes(),data],'기존 게시 파일과 다름: '+str(rel)
 if not dest.exists() or dest.read_bytes()!=data:
  temp=dest.with_name(dest.name+'.publishing-tmp');temp.write_bytes(data);os.replace(temp,dest)
 records.append({'file':rel.as_posix(),'sourceSha256':source_digest,'sha256':hashlib.sha256(data).hexdigest(),'bytes':len(data)})
time.sleep(1)
for entry in records:
 rel=Path(entry['file']);dest=T/rel;data=dest.read_bytes()
 if rel.suffix=='.js':
  entry['verification']='파일 해시 확인. 실행 코드는 HTML에 포함하며 공개 JS 직접 프로브를 사용하지 않음.'
  continue
 url='http://127.0.0.1:5173/dev-previews/balor-motions-dual-v001/'+quote(rel.as_posix())
 received=None
 for attempt in range(8):
  try:received=urllib.request.urlopen(url,timeout=20).read()
  except urllib.error.HTTPError as e:
   if e.code not in [404,500]:raise
  if received==data:break
  time.sleep(.25)
 assert received==data==dest.read_bytes(),str(rel)
 entry['httpByteMatch']=True
result={'task':c['task'],'workerOutcome':'failed','userAccepted':False,'url':'http://localhost:5173/dev-previews/balor-motions-dual-v001/index.html','files':records,'fileCount':len(records),'previewScriptsInline':True,'originalImageBytesPreserved':True,'excluded':['api request records','references','profiles','generation scripts','credentials'],'gameRuntimeChanged':False}
(H/'게시검증.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({k:v for k,v in result.items() if k!='files'},ensure_ascii=False))

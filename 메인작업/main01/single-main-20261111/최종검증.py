from pathlib import Path
import hashlib,importlib.util,json,subprocess,sys
H=Path(__file__).resolve().parent;R=H.parents[2];S=R/'작업관리'
sys.path.insert(0,str(S/'도구'))
from 팀장검증 import validate_org
from 도메인검증 import validate_tree
mains=json.loads((S/'메인목록.json').read_text(encoding='utf-8'));branches=json.loads((S/'브랜치목록.json').read_text(encoding='utf-8'));org=json.loads((S/'조직.json').read_text(encoding='utf-8'));tree=json.loads((S/'도메인/트리.json').read_text(encoding='utf-8'))
assert set(mains['mains'])=={'main01'} and set(mains['retiredMains'])=={'main02','main03'}
assert validate_org(org,branches['branches'],mains['mains'])==15
domain=validate_tree(tree,branches['branches'])
policy=str(S/'단일메인운영규정.md')
for item in list(branches['branches'].values())+list(mains['mains'].values()):
 assert policy in item['requiredReadings']
 assert all(Path(p).is_file() for p in item['requiredReadings'])
 assert '<!-- GRID-SINGLE-MAIN-20261111 -->' in (Path(item['path'])/'AGENTS.md').read_text(encoding='utf-8')
spec=importlib.util.spec_from_file_location('board',S/'도구/작업대장.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);b=m.Board(S)
for role in ['main02','main03']:
 try:b.new(role,'characters','must not create','retired role check')
 except ValueError:pass
 else:raise AssertionError('Retired main accepted')
transfer=json.loads((H/'운영통합결과.json').read_text(encoding='utf-8'))['transferredTasks']
for row in transfer:
 current=b.load(row['task'],'main01');original=json.loads((H/'운영변경전/root/작업관리/작업'/row['task']/'task.json').read_text(encoding='utf-8'))
 for field in ['id','iteration','status','approval','request','title','readingAcknowledgement']:
  assert current.get(field)==original.get(field),(row['task'],field)
assert not any(t['main'] in {'main02','main03'} for t in b.listing())
checks=[]
for role in ['main02','main03']:
 inv=json.loads((H/(role+'-인수검증.json')).read_text(encoding='utf-8'))
 assert Path(inv['historyBundle']).is_file()
 for item in inv['files']:
  # The old path is now an archive junction; all former references still read the preserved bytes.
  p=Path(item['original']);q=Path(item['archive'])
  assert p.exists() and q.exists()
  assert p.stat().st_size==q.stat().st_size==item['bytes']
 for rel in (['메인작업/main02/model-restriction-20261111/사용자지시.md'] if role=='main02' else ['output/turtle-fullmotion-v07/index.html','output/turtle-dragon-handoff-v01/터틀드래곤_다른AI전달묶음.zip','output/silver-ponytail-rapier-v03/manifest.json']):
  entry=next(x for x in inv['files'] if x['relative']==rel)
  assert hashlib.sha256(Path(entry['original']).read_bytes()).hexdigest()==entry['sha256']
 checks.append({'role':role,'files':inv['fileCount'],'bytes':inv['bytes'],'archiveVerified':True,'legacyPathsResolve':True})
before=json.loads((H/'worktrees.json').read_text(encoding='utf-8'))['result']['worktrees'];after=json.loads((H/'worktrees-after.json').read_text(encoding='utf-8'))['result']['worktrees']
remaining={x['id'] for x in after};removed=[x for x in before if x['id'] not in remaining];assert len(removed)==2 and all(x['path'].endswith(('메인02','메인03')) for x in removed)
assert all(x['worktreeId'] in remaining for x in branches['branches'].values())
result={'passed':True,'activeMainIds':['main01'],'retiredWorkspaceRemovalConfirmed':True,'remainingWorkspaces':len(after),'teamAndSpecialistWorkspacesPreserved':len(branches['branches']),'transferredTasks':len(transfer),'taskStatusApprovalAndIterationPreserved':True,'activeReadingLinksValid':True,'retiredMainRegistrationBlocked':True,'organizationNodes':15,'domain':domain,'archives':checks,'totalPreservedFiles':sum(x['files'] for x in checks),'totalPreservedBytes':sum(x['bytes'] for x in checks),'gitCommitPushPerformed':False}
(H/'최종검증.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(result,ensure_ascii=False))

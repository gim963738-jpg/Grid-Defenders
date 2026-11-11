from pathlib import Path
import hashlib,json,os,subprocess
H=Path(__file__).resolve().parent;R=H.parents[2]
excluded={'.git','node_modules','.qa-profile','.preview-profile','.playwright','__pycache__','.vite','.cache','.pytest_cache','.venv','venv','dist'}
def sha(p):
 d=hashlib.sha256()
 with p.open('rb') as f:
  for x in iter(lambda:f.read(1024*1024),b''):d.update(x)
 return d.hexdigest()
results=[]
for role,label in [('main02','메인02'),('main03','메인03')]:
 j=json.loads((H/(role+'-인수검증.json')).read_text(encoding='utf-8'));source=Path(j['source']);expected=Path('C:/Users/user/orca/workspaces/Grid Defenders')/label
 assert source.resolve()==expected.resolve() and (source/'.git').is_file()
 assert j['shaVerified'] and j['privateFileCount']==0
 current=set()
 for cur,dirs,files in os.walk(source,followlinks=False):
  dirs[:]=[d for d in dirs if d not in excluded and not Path(cur,d).is_symlink()]
  for n in files:
   if n!='.git':current.add(Path(cur,n).relative_to(source).as_posix())
 assert current=={x['relative'] for x in j['files']},'Source file list changed: '+role
 for entry in j['files']:
  assert sha(Path(entry['original']))==sha(Path(entry['archive']))==entry['sha256'],entry['relative']
 actual=subprocess.run(['git','-C',str(source),'rev-parse','HEAD'],capture_output=True,text=True,check=True).stdout.strip();assert actual==j['head']
 results.append({'role':role,'source':str(source.resolve()),'archive':j['archive'],'files':len(j['files']),'shaVerifiedAgain':True,'head':actual,'branch':j['branch']})
report={'userRequestedRetirement':True,'handoverReceived':True,'activeProductionInRetiringMains':False,'targets':results,'allowedOnlyExactTargets':True,'keepBranches':True,'keepTeamWorkspaces':True}
(H/'정리전최종검증.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'verifiedFiles':sum(x['files'] for x in results),'targets':[x['role'] for x in results]},ensure_ascii=False))

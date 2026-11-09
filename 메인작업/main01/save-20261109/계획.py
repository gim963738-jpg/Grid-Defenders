from pathlib import Path
from datetime import datetime
import json,re,subprocess,hashlib
ROOT=Path('C:/Users/user/Desktop/Grid Defenders'); HERE=Path(__file__).resolve().parent
def git(root,*args):
 p=subprocess.run(['git',*args],cwd=root,capture_output=True)
 if p.returncode:raise RuntimeError(p.stderr.decode('utf-8','replace'))
 return p.stdout
source=json.loads((HERE/'조사결과.json').read_text(encoding='utf-8'))
stamp=datetime.now().astimezone().strftime('%Y%m%d-%H%M%S');saveid='SAVE-'+stamp
plan={'id':saveid,'at':datetime.now().astimezone().isoformat(),'policy':'작업관리/저장운영규정.md','roles':{},'secretFlags':[],'validation':{'build':'PASS: npm run build, tsc + Vite 801 modules','workflow':'PASS: 12 test_workflow checks','imageComparison':'Prior independent QA: 40 PASS, runtime exceptions 0; full real-device coverage not claimed'}}
bad_parts={'node_modules','dist','__pycache__','.cache','.vite','.git','.forge','qa-game','handoffs'}
def exclusion(name,size):
 parts=Path(name).parts;lower=[p.lower() for p in parts];base=lower[-1]
 if any(p in bad_parts for p in lower):return 'dependency/cache/test copy/version backup'
 if any(('profile' in p and any(k in p for k in ('edge','browser','chrome','chromium','qa-'))) or p in ('user-data','user_data') for p in lower):return 'browser temporary profile; not source'
 if base.startswith('.env') and base not in ('.env.example','.env.sample','.env.template'):return 'local environment file'
 if base.endswith(('.pyc','.pyo','.tmp','.lock','.bundle')) or base=='writer.lock':return 'temporary/lock/version bundle'
 if size>=100*1024*1024:return 'GitHub normal Git file limit; original preserved locally'
 if any(k in base for k in ('credentials','private-key','id_rsa','id_ed25519')):return 'credential filename'
 return None
patterns=[re.compile(rb'\bgh[pousr]_[A-Za-z0-9]{30,}\b'),re.compile(rb'github_pat_[A-Za-z0-9_]{30,}'),re.compile(rb'sk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{28,}'),re.compile(rb'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----')]
for role,old in source.items():
 root=Path(old['root']); head=git(root,'rev-parse','HEAD').decode().strip()
 if head!=old['head']:raise SystemExit('HEAD changed since inventory: '+role)
 raw=git(root,'status','--porcelain=v1','-z','--untracked-files=all').split(b'\0');files=[];excluded=[];i=0
 while i<len(raw):
  item=raw[i];i+=1
  if not item:continue
  status=item[:2].decode();name=item[3:].decode('utf-8');p=root/name
  if 'R' in status or 'C' in status:raise SystemExit('Rename requires explicit handling: '+role+':'+name)
  size=p.stat().st_size if p.is_file() else 0
  reason=exclusion(name,size)
  if reason:excluded.append({'path':name,'bytes':size,'reason':reason});continue
  if p.is_file() and size<3*1024*1024 and (p.suffix.lower() in ('.md','.json','.py','.js','.mjs','.ts','.tsx','.toml','.yaml','.yml','.txt','.html','.ini','.config') or '.env' in p.name):
   data=p.read_bytes()
   if any(x.search(data) for x in patterns):plan['secretFlags'].append({'role':role,'path':name,'reason':'credential-like literal; inspect locally before saving'})
  files.append({'status':status,'path':name,'bytes':size})
 branch=old['branch']; ref=('refs/heads/main' if role=='main01' else f'refs/heads/save/{stamp}/{role}')
 plan['roles'][role]={'root':str(root),'branch':branch,'head':head,'remoteRef':ref,'files':files,'excluded':excluded,'mode':'main commit' if role=='main01' else 'archive snapshot: original HEAD/index/work files unchanged'}
(HERE/'保存計画.json').write_text(json.dumps(plan,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'id':saveid,'roles':[{'role':r,'files':len(v['files']),'MiB':round(sum(x['bytes'] for x in v['files'])/1048576,1),'excluded':len(v['excluded'])} for r,v in plan['roles'].items()],'secretFlags':plan['secretFlags'],'largeExcluded':[{'role':r,**x} for r,v in plan['roles'].items() for x in v['excluded'] if x['bytes']>=100*1024*1024]},ensure_ascii=False,indent=2))

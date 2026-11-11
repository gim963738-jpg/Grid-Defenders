from pathlib import Path
import json,os,subprocess,collections
H=Path(__file__).resolve().parent;R=H.parents[2]
CLI='C:/Users/user/AppData/Local/Programs/orca/resources/bin/orca.exe'
def run(args):
 p=subprocess.run(args,capture_output=True,text=True,encoding='utf-8',errors='replace')
 if p.returncode:raise RuntimeError(p.stderr or p.stdout)
 return p.stdout
for name,args in [('worktrees',['worktree','list','--repo','id:de86d10c-8e2c-444d-8b0f-43b772894ad9','--json']),('processes',['worktree','ps','--json'])]:
 raw=run([CLI]+args);(H/(name+'.json')).write_text(raw,encoding='utf-8')
 j=json.loads(raw);print(name,'keys',list(j.get('result',j)) if isinstance(j.get('result',j),dict) else 'list')
excluded={'.git','node_modules','.qa-profile','.preview-profile','.playwright','__pycache__','.vite','.cache','.pytest_cache','.venv','venv','dist'}
all_reports=[]
for role,label in [('main02','메인02'),('main03','메인03')]:
 w=Path('C:/Users/user/orca/workspaces/Grid Defenders')/label
 status=run(['git','-C',str(w),'status','--porcelain=v1','-uall']);(H/(role+'-git-status.txt')).write_text(status,encoding='utf-8')
 tracked=run(['git','-C',str(w),'ls-files','-z']).split('\0');(H/(role+'-tracked.json')).write_text(json.dumps([x for x in tracked if x],ensure_ascii=False),encoding='utf-8')
 items=[];counts=collections.Counter();sizes=collections.Counter();skipped=[]
 for current,dirs,files in os.walk(w,followlinks=False):
  for d in list(dirs):
   if d in excluded or Path(current,d).is_symlink():dirs.remove(d);skipped.append(str(Path(current,d).relative_to(w)))
  for name in files:
   p=Path(current,name)
   if name=='.git':continue
   rel=p.relative_to(w);st=p.stat();group=rel.parts[0];counts[group]+=1;sizes[group]+=st.st_size
   private=(name.startswith('.env') and name not in {'.env.example','.env.template'}) or p.suffix in {'.pem','.key','.pfx'}
   items.append({'path':rel.as_posix(),'bytes':st.st_size,'mtimeNs':st.st_mtime_ns,'private':private})
 report={'role':role,'path':str(w),'head':run(['git','-C',str(w),'rev-parse','HEAD']).strip(),'branch':run(['git','-C',str(w),'branch','--show-current']).strip(),'files':items,'skippedDirectories':skipped,'groups':[{'name':g,'files':counts[g],'bytes':sizes[g]} for g in counts]}
 (H/(role+'-inventory.json')).write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
 all_reports.append({k:report[k] for k in ['role','path','head','branch','groups']})
 print(json.dumps({'role':role,'files':len(items),'bytes':sum(sizes.values()),'statusLines':len(status.splitlines()),'topGroups':sorted(report['groups'],key=lambda x:x['bytes'],reverse=True)[:10]},ensure_ascii=False))
(H/'조사요약.json').write_text(json.dumps(all_reports,ensure_ascii=False,indent=2),encoding='utf-8')

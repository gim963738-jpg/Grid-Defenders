from pathlib import Path
import subprocess,json
ROOT=Path('C:/Users/user/Desktop/Grid Defenders');S=ROOT/'작업관리';HERE=Path(__file__).resolve().parent
def git(root,*args):
 p=subprocess.run(['git',*args],cwd=root,capture_output=True)
 if p.returncode: raise RuntimeError(p.stderr.decode('utf-8','replace'))
 return p.stdout
roles={'main01':{'path':str(ROOT)}}
roles.update(json.loads((S/'메인목록.json').read_text(encoding='utf-8'))['mains'])
roles.update(json.loads((S/'브랜치목록.json').read_text(encoding='utf-8'))['branches'])
report={};summary=[]
for role,row in roles.items():
 root=Path(row['path']);raw=git(root,'status','--porcelain=v1','-z','--untracked-files=all').split(b'\0');files=[];i=0
 while i<len(raw):
  item=raw[i];i+=1
  if not item:continue
  status=item[:2].decode();name=item[3:].decode('utf-8');p=root/name
  if 'R' in status or 'C' in status:i+=1
  files.append({'status':status,'path':name,'bytes':p.stat().st_size if p.is_file() else 0})
 branch=git(root,'branch','--show-current').decode().strip()
 record={'root':str(root),'branch':branch,'head':git(root,'rev-parse','HEAD').decode().strip(),'files':files}
 report[role]=record
 groups={}
 for f in files:
  top=f['path'].split('/')[0];g=groups.setdefault(top,{'count':0,'bytes':0});g['count']+=1;g['bytes']+=f['bytes']
 summary.append({'role':role,'branch':branch,'count':len(files),'MiB':round(sum(f['bytes'] for f in files)/1048576,1),'top':groups,'over50MiB':[f for f in files if f['bytes']>50*1048576], 'sensitiveNames':[f['path'] for f in files if any(x in f['path'].lower() for x in ['.env','credential','secret','token','private-key'])][:30]})
(HERE/'조사결과.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(summary,ensure_ascii=False,indent=2))

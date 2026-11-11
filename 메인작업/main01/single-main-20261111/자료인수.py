from pathlib import Path
import hashlib,json,os,shutil,subprocess
H=Path(__file__).resolve().parent;R=H.parents[2]
archive=R/'자료/메인인수/20261111'
vault=Path('C:/Users/user/orca/backups/Grid Defenders/MAIN-CONSOLIDATE-20261111')
vault.mkdir(parents=True,exist_ok=True)
def sha(p):
 d=hashlib.sha256()
 with p.open('rb') as f:
  for block in iter(lambda:f.read(1024*1024),b''):d.update(block)
 return d.hexdigest()
def git(w,*args):return subprocess.run(['git','-C',str(w),*args],capture_output=True,check=True).stdout
all_reports=[]
for role in ['main02','main03']:
 inv=json.loads((H/(role+'-inventory.json')).read_text(encoding='utf-8'))
 source=Path(inv['path']).resolve();expected=Path('C:/Users/user/orca/workspaces/Grid Defenders')/('메인02' if role=='main02' else '메인03')
 assert source==expected.resolve() and source.is_dir() and (source/'.git').is_file()
 dest=(archive/role/'파일').resolve();assert dest.is_relative_to(R.resolve()) and not dest.is_relative_to(source)
 history=vault/role/'git';history.mkdir(parents=True,exist_ok=True)
 bundle=history/'history.bundle'
 if not bundle.exists():git(source,'bundle','create',str(bundle),inv['branch'])
 git(source,'bundle','verify',str(bundle))
 (history/'worktree.patch').write_bytes(git(source,'diff','--binary','HEAD'))
 (history/'staged.patch').write_bytes(git(source,'diff','--cached','--binary'))
 index=Path(git(source,'rev-parse','--git-path','index').decode().strip())
 if not index.is_absolute():index=source/index
 if index.is_file():shutil.copy2(index,history/'index')
 records=[]
 for item in inv['files']:
  p=source/item['path'];assert p.is_file(),str(p)
  target=(vault/role/'private'/item['path']) if item['private'] else dest/item['path']
  target.parent.mkdir(parents=True,exist_ok=True)
  before=sha(p)
  if target.exists():
   assert sha(target)==before,'Archive differs: '+str(target)
  else:shutil.copy2(p,target)
  assert sha(target)==before==sha(p),'Copy mismatch: '+str(p)
  records.append({'original':str(p),'relative':item['path'],'archive':str(target),'bytes':p.stat().st_size,'sha256':before,'private':item['private']})
 report={'role':role,'source':str(source),'archive':str(dest),'branch':inv['branch'],'head':inv['head'],'historyBundle':str(bundle),'fileCount':len(records),'bytes':sum(x['bytes'] for x in records),'privateFileCount':sum(x['private'] for x in records),'files':records,'excludedDirectories':inv['skippedDirectories'],'sourceFilesRemoved':False,'shaVerified':True}
 (H/(role+'-인수검증.json')).write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
 (archive/role/'README.md').write_text('# '+role+' 인수자료\n\n사용자 요청으로 메인01에 인수한 기존 자료의 보관 사본입니다. 파일/ 아래 원래 상대 경로와 바이트를 유지합니다. 현재 운영본이나 최종합격으로 자동 승격하지 않습니다. 원래 브랜치 '+inv['branch']+' / HEAD '+inv['head']+' 이력은 보존합니다. 단일메인 인수기록의 해시/경로표를 참고하세요. Git 커밋/푸시를 하지 않았습니다.\n',encoding='utf-8')
 all_reports.append({k:report[k] for k in ['role','source','archive','branch','head','historyBundle','fileCount','bytes','privateFileCount','shaVerified']})
 print(json.dumps(all_reports[-1],ensure_ascii=False),flush=True)
(H/'인수요약.json').write_text(json.dumps(all_reports,ensure_ascii=False,indent=2),encoding='utf-8')

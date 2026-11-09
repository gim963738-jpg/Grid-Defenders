"""Apply the user-requested domain hierarchy through the official Orca CLI."""
import argparse
from datetime import datetime
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import uuid

ROOT=Path(__file__).resolve().parents[2]
SHARED=ROOT/'작업관리'
RECORD=SHARED/'기록/OPS-002'
ORCA='C:/Users/user/AppData/Local/Programs/orca/resources/bin/orca.exe'
REPO='de86d10c-8e2c-444d-8b0f-43b772894ad9'
NEW={
 'world':('세계관','domain/world-index',None),
 'monster_sprites':('몬스터-스프라이트','domain/monster-sprites','monsters'),
 'character_stats':('캐릭터-능력치','domain/character-stats','characters'),
 'character_skills':('캐릭터-스킬','domain/character-skills','characters'),
}
PARENTS={'world':None,'monsters':'world','monster_sprites':'monsters','characters':'world',
         'splash':'characters','sprites':'characters','character_stats':'characters',
         'character_skills':'characters','video':'sprites','effects':'character_skills'}
NAMES={'world':'세계관','monsters':'몬스터','monster_sprites':'몬스터 스프라이트','characters':'캐릭터',
       'splash':'캐릭터 일러스트','sprites':'캐릭터 스프라이트','character_stats':'캐릭터 능력치',
       'character_skills':'캐릭터 스킬','video':'영상·모션 소스','effects':'이펙트·제작도구'}

def read(p):return json.loads(p.read_text(encoding='utf-8'))
def write(p,text):
 p.parent.mkdir(parents=True,exist_ok=True)
 p.write_text(text,encoding='utf-8',newline='\n')
def dump(p,value):
 p.parent.mkdir(parents=True,exist_ok=True)
 temp=p.with_name(p.name+'.'+uuid.uuid4().hex+'.tmp')
 write(temp,json.dumps(value,ensure_ascii=False,indent=2)+'\n');os.replace(temp,p)
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def cli(*args):
 p=subprocess.run([ORCA,*args,'--json'],cwd=ROOT,capture_output=True,text=True,encoding='utf-8')
 try:value=json.loads(p.stdout)
 except Exception:raise RuntimeError('Orca reply was not verifiable. Inspect before retrying: '+p.stdout+p.stderr)
 if not value.get('ok',True):raise RuntimeError(json.dumps(value,ensure_ascii=False))
 return value
def workspaces():
 return [w for w in cli('worktree','ps')['result']['worktrees'] if w['repoId']==REPO]
def git(path,*args):return subprocess.check_output(['git',*args],cwd=path).decode('utf-8')

def snapshot():
 if (RECORD/'before.json').exists():raise RuntimeError('OPS-002 snapshot already exists; inspect it rather than replacing it.')
 if (SHARED/'상태/writer.lock').exists():raise RuntimeError('Another main is updating shared state.')
 stamp=datetime.now().astimezone().strftime('%Y%m%d-%H%M%S')
 backup=Path('C:/Users/user/orca/backups/Grid Defenders')/('domain-nesting-'+stamp)
 backup.mkdir(parents=True,exist_ok=False)
 shutil.copytree(SHARED,backup/'shared',ignore=shutil.ignore_patterns('__pycache__','*.tmp','writer.lock'))
 state=workspaces();files=[]
 for rel in ['AGENTS.md','README.md','task.md','문서/05_프로젝트정의/현재구현현황.md','문서/05_프로젝트정의/정의목록.md']:
  src=ROOT/rel;dst=backup/'root-files'/rel;dst.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(src,dst)
 for w in state:
  path=Path(w['path'])
  for name in ['AGENTS.md','작업연결.json']:
   src=path/name
   if src.exists():
    dst=backup/'workspaces'/path.name/name;dst.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(src,dst)
    files.append({'path':str(src),'backup':str(dst),'sha256':sha(src)})
  w['gitStatusBefore']=git(path,'status','--porcelain=v1','--untracked-files=all')
  w['headBefore']=git(path,'rev-parse','HEAD').strip()
 metadata={'at':datetime.now().astimezone().isoformat(),'backup':str(backup),'workspaces':state,'files':files,
           'registry':read(SHARED/'브랜치목록.json'),'mains':read(SHARED/'메인목록.json'),
           'tasks':list(str(p.relative_to(SHARED)) for p in (SHARED/'작업').glob('*/task.json'))}
 dump(RECORD/'before.json',metadata);dump(backup/'before.json',metadata)
 print(json.dumps({'backup':str(backup),'existingWorkspaces':len(state),'existingTasks':len(metadata['tasks'])},ensure_ascii=False))

def create():
 if (RECORD/'configured.json').exists():raise RuntimeError('OPS-002 is already configured; do not rerun its migration.')
 branches=read(SHARED/'브랜치목록.json')['branches']
 for role,(name,ref,parent) in NEW.items():
  receipt=RECORD/'영수증'/(role+'-create.json')
  if receipt.exists():
   value=read(receipt)
  else:
   existing=[w for w in workspaces() if w['branch'].removeprefix('refs/heads/')==ref]
   if existing:
    raise RuntimeError('Desired branch already exists without a recorded receipt; inspect it: '+ref)
   args=['worktree','create','--repo','id:'+REPO,'--name',name,'--branch',ref,'--base-branch','main','--setup','skip']
   args+=['--no-parent'] if parent is None else ['--parent-worktree',branches[parent]['selector']]
   value=cli(*args);dump(receipt,value)
  w=value['result']['worktree']
  branches[role]={'id':role,'name':NAMES[role],'path':w['path'],'gitBranch':w['branch'].removeprefix('refs/heads/'),
                 'worktreeId':w['id'],'selector':'id:'+w['id'],'rules':'기준/'+role+'/규정.md',
                 'ruleVersion':'1.0.0','kind':'domain-coordination' if role=='world' else 'specialist',
                 'agent':None,'workspacePrepared':True,'agentStarted':False}
  # Persist every accepted creation before proceeding; never duplicate a lost launch.
  catalog=read(SHARED/'브랜치목록.json');catalog['branches']=branches;dump(SHARED/'브랜치목록.json',catalog)
  print(json.dumps({'createdRole':role,'path':w['path'],'branch':branches[role]['gitBranch']},ensure_ascii=False))

def nesting():
 if (RECORD/'configured.json').exists():raise RuntimeError('OPS-002 is already configured; do not reset later hierarchy changes.')
 catalog=read(SHARED/'브랜치목록.json');branches=catalog['branches'];before=read(RECORD/'before.json')
 old={w['worktreeId']:w for w in before['workspaces']}
 for role,parent in PARENTS.items():
  row=branches[role];args=['worktree','set','--worktree',row['selector'],'--display-name',NAMES[role]]
  args+=['--no-parent'] if parent is None else ['--parent-worktree',branches[parent]['selector']]
  comment=old.get(row['worktreeId'],{}).get('comment','')
  args+=['--comment',('세계관 도메인 계층 · '+comment) if comment else '세계관 도메인 계층 · 원본 연결·확인된 요청으로 작업']
  receipt=cli(*args);dump(RECORD/'영수증'/(role+'-nest.json'),receipt)
  row['name']=NAMES[role];row['parentRole']=parent
  labels=[];cursor=role
  while cursor is not None:labels.append(NAMES[cursor]);cursor=PARENTS[cursor]
  row['domainPath']=list(reversed(labels));row['domainIndex']='도메인/'+'/'.join(row['domainPath'])+'/index.json'
 catalog.update(schemaVersion=2,domainRoot='world',domainTree='도메인/트리.json',expectedRoleCount=len(branches))
 dump(SHARED/'브랜치목록.json',catalog)
 dump(RECORD/'after-orca.json',{'workspaces':workspaces()})
 print(json.dumps({'nestedNodes':len(PARENTS),'registryRoles':len(branches)},ensure_ascii=False))

if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('phase',choices=['snapshot','create','nest'])
 {'snapshot':snapshot,'create':create,'nest':nesting}[parser.parse_args().phase]()

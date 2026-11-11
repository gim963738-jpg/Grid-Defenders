"""Validate domain ownership separately from Git paths and production workflows."""
import json
import hashlib
from pathlib import Path
import subprocess

REQUIRED={'world':None,'monsters':'world','monster_sprites':'monsters','characters':'world',
          'splash':'characters','sprites':'characters','character_stats':'characters','character_skills':'characters'}

def read(path):return json.loads(path.read_text(encoding='utf-8'))
def normalized(value):return value.replace('\\','/').casefold() if isinstance(value,str) else value

def validate_tree(tree,branches):
 nodes=tree['nodes'];root=tree['root']
 if root!='world' or root not in nodes:raise ValueError('World must be the domain root')
 for role,parent in REQUIRED.items():
  if role not in nodes or nodes[role]['parent']!=parent:raise ValueError('Required hierarchy differs: '+role)
 used=set();paths=set()
 for role,node in nodes.items():
  if role not in branches:raise ValueError('Unregistered role: '+role)
  if node['parent'] is not None and node['parent'] not in nodes:raise ValueError('Missing parent: '+role)
  chain=[];seen=set();cursor=role
  while cursor is not None:
   if cursor in seen:raise ValueError('Domain cycle: '+role)
   seen.add(cursor);chain.append(nodes[cursor]['name']);cursor=nodes[cursor]['parent']
  expected=list(reversed(chain))
  if expected[0]!='세계관' or node['domainPath']!=expected:raise ValueError('Incorrect domain path: '+role)
  path=tuple(expected)
  if path in paths:raise ValueError('Duplicate domain path')
  paths.add(path)
  workspace=normalized(branches[role]['worktreeId'])
  if workspace in used:raise ValueError('One worktree cannot represent two domain owners')
  used.add(workspace)
  if branches[role].get('domainPath')!=expected:raise ValueError('Registry path differs: '+role)
 return {'nodes':len(nodes),'requiredNodes':len(REQUIRED),'noCycles':True,'uniqueOwners':True}

def main():
 root=Path(__file__).resolve().parents[2];shared=root/'작업관리';historical=shared/'기록/OPS-002'
 catalog=read(shared/'브랜치목록.json');branches=catalog['branches'];tree=read(shared/'도메인/트리.json')
 organization=read(shared/catalog['organizationFile']) if catalog.get('organizationFile') else None
 record=shared/'기록/OPS-003' if organization else historical
 checks=[];summary=validate_tree(tree,branches)
 def check(ok,label):
  if not ok:raise AssertionError(label)
  checks.append(label)
 check(summary['noCycles'] and summary['uniqueOwners'],'domain hierarchy and ownership are consistent')
 cli='C:/Users/user/AppData/Local/Programs/orca/resources/bin/orca.exe'
 live=json.loads(subprocess.check_output([cli,'worktree','ps','--json'],text=True,encoding='utf-8'))
 if not live.get('ok'):raise AssertionError('Live Orca state could not be verified')
 state=[w for w in live['result']['worktrees'] if w['repoId']=='de86d10c-8e2c-444d-8b0f-43b772894ad9']
 (record/'after-orca.json').write_text(json.dumps({'workspaces':state},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 actual={normalized(w['worktreeId']):w for w in state}
 for role,node in tree['nodes'].items():
  row=branches[role];w=actual[normalized(row['worktreeId'])];parent=node['parent']
  orgnode=organization['nodes'][role] if organization else None
  expected=organization['nodes'][orgnode['parent']]['worktreeId'] if orgnode and orgnode['parent'] else branches[parent]['worktreeId'] if parent is not None and not orgnode else None
  check(normalized(w['parentWorktreeId'])==normalized(expected),'actual Orca parent matches: '+role)
  check(w['displayName']==(orgnode['name'] if orgnode else node['name']),'actual Orca label matches: '+role)
  index=read(shared/row['domainIndex'])
  check(index['role']==role and index['domainPath']==node['domainPath'],'domain index matches: '+role)
  for source in index['sources']:
   check(Path(source['path']).exists(),'source reference exists: '+source['label'])
  pointer=read(Path(row['path'])/'작업연결.json')
  check(pointer['domainPath']==node['domainPath'],'workspace pointer matches: '+role)
 before=read(historical/'before.json')['workspaces']
 for old in before:
  w=actual[normalized(old['worktreeId'])]
  check(normalized(w['path'])==normalized(old['path']) and w['branch']==old['branch'],'original checkout path and branch preserved: '+old['displayName'])
  head=subprocess.check_output(['git','rev-parse','HEAD'],cwd=w['path'],text=True).strip()
  check(head==old['headBefore'],'original HEAD preserved: '+old['displayName'])
 for role in ['ui','items']:
  old=next(w for w in before if normalized(w['worktreeId'])==normalized(branches[role]['worktreeId']))
  check(normalized(actual[normalized(old['worktreeId'])]['parentWorktreeId'])==normalized(old['parentWorktreeId']),'external project role stays in place: '+role)
 for item in read(historical/'before.json')['files']:
  backup=Path(item['backup']);check(hashlib.sha256(backup.read_bytes()).hexdigest()==item['sha256'],'original instruction backup retained: '+item['path'])
  if Path(item['path']).name=='AGENTS.md':check(Path(item['path']).read_bytes().startswith(backup.read_bytes()),'original instruction prefix retained: '+item['path'])
 result={'status':'PASS',**summary,'checks':checks,'roleCount':len(branches),'physicalSourceMoves':0,'productionDispatches':0}
 (record/('도메인검증.json' if organization else '검증.json')).write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 print(json.dumps(result,ensure_ascii=False,indent=2))

if __name__=='__main__':main()

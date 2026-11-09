"""Verify live organization, source preservation and truthful delivery accounting."""
from 팀장세팅 import ROOT,SHARED,REC,read,dump,sha,live,git
from pathlib import Path
from datetime import datetime

def validate_org(org,branches,mains):
 nodes=org['nodes'];roles={**mains,**branches}
 if set(nodes)!=set(roles):raise ValueError('Organization and role catalog differ')
 if org['independentTester'] in org['teamLeads']:raise ValueError('Tester belongs to production team')
 if nodes[org['independentTester']]['parent']!=org['director']:raise ValueError('Tester is not independent')
 ids=set()
 for role,n in nodes.items():
  if n['worktreeId'] in ids:raise ValueError('Duplicate workspace')
  ids.add(n['worktreeId']);seen=set();cursor=role
  while cursor is not None:
   if cursor in seen:raise ValueError('Organization cycle')
   seen.add(cursor);cursor=nodes[cursor]['parent']
  if n['teamOwner'] not in org['teamLeads']+list(mains)+[org['independentTester']]:raise ValueError('Unregistered team owner')
 return len(nodes)

def main():
 cat=read(SHARED/'브랜치목록.json');mains=read(SHARED/'메인목록.json')['mains'];org=read(SHARED/'조직.json');before=read(REC/'before.json');checks=[]
 def check(value,label):
  if not value:raise AssertionError(label)
  checks.append(label)
 check(validate_org(org,cat['branches'],mains)==17,'17 workspaces: 3 mains + 6 team leads + tester + 7 preserved domain/specialist spaces')
 state={w['worktreeId']:w for w in live()};dump(REC/'actual-organization.json',{'at':datetime.now().astimezone().isoformat(),'workspaces':list(state.values())})
 for role,n in org['nodes'].items():
  w=state[n['worktreeId']];expected=org['nodes'][n['parent']]['worktreeId'] if n['parent'] else None
  check(w['parentWorktreeId']==expected and w['displayName']==n['name'],'actual placement: '+role)
  p=Path(n['path']);pointer=read(p/'작업연결.json')
  check(pointer['role']==role and pointer['teamOwner']==n['teamOwner'] and Path(pointer['teamRules']).is_file(),'role instruction connection: '+role)
  check('GRID-TEAM-OPS003-BEGIN' in (p/'AGENTS.md').read_text(encoding='utf-8'),'role startup rules: '+role)
 for old in before['workspaces']:
  w=state[old['worktreeId']]
  check(w['path']==old['path'] and w['branch']==old['branch'] and git(w['path'],'rev-parse','HEAD')==old['headBefore'],'existing checkout and HEAD preserved: '+old['displayName'])
  old_sessions={a['paneKey'] for a in old.get('agents',[])};new_sessions={a['paneKey'] for a in w.get('agents',[])}
  check(old_sessions<=new_sessions,'existing chats preserved: '+old['displayName'])
 for f in before['files']:
  if Path(f['path']).name=='AGENTS.md':check(Path(f['path']).read_bytes().startswith(Path(f['backup']).read_bytes()),'original AGENTS preserved: '+f['path'])
 check(all(sha(Path(f['path']))==f['sha256'] for f in before['protected']),'328 existing runtime/source/test files unchanged')
 new_ready={}
 for role in ['gameplay','qa']:
  manifest=read(REC/f'{role}-baseline.json')
  check(all(sha(Path(manifest['destination'])/f['path'])==f['sha256'] for f in manifest['files']),'complete current game snapshot: '+role)
  receipt=read(REC/'영수증'/f'{role}-notify.json')['result']
  check(receipt['outcome']['kind']=='structured' and receipt['prompt']['outcome']=='journaled','new chat + initial prompt delivered: '+role)
  ack=REC/'초기화'/f'{role}.json';new_ready[role]=read(ack) if ack.exists() else {'ready':False,'reason':'initial read acknowledgement pending'}
 pending=[read(p) for p in (REC/'전달대기').glob('*.json')]
 check(len(pending)==10,'existing chat notice limitations recorded separately from configured rules')
 report={'status':'PASS','at':datetime.now().astimezone().isoformat(),'checks':checks,'teamLeadCount':6,'independentTesterCount':1,'newChatPromptsDelivered':2,'readAcknowledgements':new_ready,'existingChatNotificationsPending':len(pending),'protectedFiles':len(before['protected']),'backup':before['backup']}
 dump(REC/'팀장검증.json',report)
 print(__import__('json').dumps({k:v for k,v in report.items() if k!='checks'},ensure_ascii=False,indent=2))
if __name__=='__main__':main()

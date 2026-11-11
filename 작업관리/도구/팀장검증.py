"""Validate current organization and independent QA ownership."""
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
 from 운영검증 import main as validate_current
 validate_current()

if __name__=="__main__":main()

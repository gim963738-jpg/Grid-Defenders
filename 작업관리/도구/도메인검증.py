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
 from 운영검증 import main as validate_current
 validate_current()

if __name__=="__main__":main()

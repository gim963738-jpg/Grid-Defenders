import importlib.util
from pathlib import Path
import unittest

SPEC=importlib.util.spec_from_file_location('domain_check',Path(__file__).with_name('도메인검증.py'))
MODULE=importlib.util.module_from_spec(SPEC);SPEC.loader.exec_module(MODULE)

class DomainTreeTests(unittest.TestCase):
 def setUp(self):
  labels={'world':'세계관','monsters':'몬스터','monster_sprites':'몬스터 스프라이트','characters':'캐릭터',
          'splash':'캐릭터 일러스트','sprites':'캐릭터 스프라이트','character_stats':'캐릭터 능력치','character_skills':'캐릭터 스킬'}
  self.tree={'root':'world','nodes':{role:{'parent':parent,'name':labels[role]} for role,parent in MODULE.REQUIRED.items()}}
  self.branches={}
  for role,node in self.tree['nodes'].items():
   chain=[];cursor=role
   while cursor is not None:chain.append(labels[cursor]);cursor=MODULE.REQUIRED[cursor]
   node['domainPath']=list(reversed(chain));self.branches[role]={'worktreeId':'repo::/'+role,'domainPath':node['domainPath'][:]}
 def test_requested_domain_tree(self):self.assertEqual(MODULE.validate_tree(self.tree,self.branches)['requiredNodes'],8)
 def test_missing_character_skill_branch_is_rejected(self):
  del self.tree['nodes']['character_skills']
  with self.assertRaises(ValueError):MODULE.validate_tree(self.tree,self.branches)
 def test_wrong_monster_sprite_parent_is_rejected(self):
  self.tree['nodes']['monster_sprites']['parent']='characters'
  with self.assertRaises(ValueError):MODULE.validate_tree(self.tree,self.branches)
 def test_support_node_cycle_is_rejected(self):
  self.tree['nodes'].update({'a':{'name':'a','parent':'b','domainPath':[]},'b':{'name':'b','parent':'a','domainPath':[]}})
  self.branches.update({'a':{'worktreeId':'repo::/a'},'b':{'worktreeId':'repo::/b'}})
  with self.assertRaises(ValueError):MODULE.validate_tree(self.tree,self.branches)
 def test_duplicate_worktree_ownership_is_rejected(self):
  self.branches['monster_sprites']['worktreeId']=self.branches['sprites']['worktreeId']
  with self.assertRaises(ValueError):MODULE.validate_tree(self.tree,self.branches)
 def test_stale_registry_path_is_rejected(self):
  self.branches['sprites']['domainPath']=['old path']
  with self.assertRaises(ValueError):MODULE.validate_tree(self.tree,self.branches)
 def test_registered_role_required(self):
  del self.branches['splash']
  with self.assertRaises(ValueError):MODULE.validate_tree(self.tree,self.branches)
 def test_unsupported_second_root_is_rejected(self):
  self.tree['nodes']['other']={'name':'other','parent':None,'domainPath':['other']};self.branches['other']={'worktreeId':'repo::/other','domainPath':['other']}
  with self.assertRaises(ValueError):MODULE.validate_tree(self.tree,self.branches)

if __name__=='__main__':unittest.main(verbosity=2)

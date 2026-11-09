"""Meaningful failure cases for independent tester and hierarchy integrity."""
import copy,unittest
from 팀장검증 import validate_org
class OrgTests(unittest.TestCase):
 def setUp(self):
  self.m={'main01':{}};self.b={'dev':{},'qa':{}}
  self.o={'director':'main01','teamLeads':['dev'],'independentTester':'qa','nodes':{
   'main01':{'worktreeId':'m','parent':None,'teamOwner':'main01'},
   'dev':{'worktreeId':'d','parent':'main01','teamOwner':'dev'},
   'qa':{'worktreeId':'q','parent':'main01','teamOwner':'qa'}}}
 def test_valid(self):self.assertEqual(validate_org(self.o,self.b,self.m),3)
 def test_tester_under_production_rejected(self):
  self.o['nodes']['qa']['parent']='dev'
  with self.assertRaises(ValueError):validate_org(self.o,self.b,self.m)
 def test_cycle_rejected(self):
  self.o['nodes']['main01']['parent']='dev'
  with self.assertRaises(ValueError):validate_org(self.o,self.b,self.m)
 def test_shared_workspace_rejected(self):
  self.o['nodes']['qa']['worktreeId']='d'
  with self.assertRaises(ValueError):validate_org(self.o,self.b,self.m)
 def test_missing_role_rejected(self):
  del self.b['dev']
  with self.assertRaises(ValueError):validate_org(self.o,self.b,self.m)
if __name__=='__main__':unittest.main()

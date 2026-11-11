import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

MODULE_PATH=Path(__file__).resolve().parents[3]/'게임/scripts/register-viewer-result.py'
spec=importlib.util.spec_from_file_location('register_viewer_result',MODULE_PATH)
M=importlib.util.module_from_spec(spec);spec.loader.exec_module(M)

class RegistrationTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup)
        self.root=Path(self.tmp.name);self.viewer=self.root/'viewer';self.viewer.mkdir()
        self.catalog=self.viewer/'catalog.json';self.catalog.write_text('{"collections":[]}',encoding='utf-8')
        self.original=self.root/'source.png';self.original.write_bytes(b'untouched fixture bytes')
        self.manifest={'id':'TEST-v1','title':'검토','assets':[{'id':'result','label':'결과','file':str(self.original)}]}
    def test_registration_preserves_original_and_uses_content_hash(self):
        before=self.original.read_bytes();result=M.register(self.manifest,self.viewer)
        self.assertEqual(self.original.read_bytes(),before)
        self.assertEqual(result['entry'],'/dev-previews/viewer/index.html')
        a=json.loads(self.catalog.read_text(encoding='utf-8'))['collections'][0]['assets'][0]
        self.assertEqual(a['sha256'],M.digest(self.original))
        self.assertEqual(len(list((self.viewer/'collections').rglob('*.png'))),1)
        M.register(self.manifest,self.viewer)
        self.assertEqual(len(json.loads(self.catalog.read_text(encoding='utf-8'))['collections']),1)
    def test_invalid_paths_references_and_sheet_do_not_replace_catalog(self):
        before=self.catalog.read_bytes()
        for update in [{'id':'../escape'},{'referenceId':'missing'},{'assets':[{'id':'result','file':str(self.original),'sheet':{'columns':4,'rows':3,'count':99}}]}]:
            with self.assertRaises(ValueError):M.register({**self.manifest,**update},self.viewer)
            self.assertEqual(self.catalog.read_bytes(),before)
    def test_active_writer_lock_is_preserved(self):
        lock=self.viewer/'catalog.lock';lock.write_text('other writer',encoding='utf-8')
        with self.assertRaises(ValueError):M.register(self.manifest,self.viewer)
        self.assertTrue(lock.exists())

if __name__=='__main__':unittest.main(verbosity=2)

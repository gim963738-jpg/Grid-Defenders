from pathlib import Path
import json,hashlib,zipfile
from html.parser import HTMLParser
root=Path(__file__).resolve().parents[1]
def load(p):return json.loads(Path(p).read_text(encoding='utf-8-sig'))
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
m=load(root/'manifest.json');g=load(root/'generation-record.json');a=load(root/'evidence/읽기확인.json')
assert len(m['images'])==6 and len(g['records'])==9
assert sum(x['selected'] for x in g['records'])==6
for x in m['images']:assert sha(root/x['file'])==x['sha256'] and x['native_bytes_preserved'] and x['margin_numeric_pass']
assert len({x['sha256'] for x in m['images']})==6
for r in g['records']:
 assert sha(r['output'])==r['sha256']==sha(r['source'])
 for x in r['references_at_execution']:assert sha(x['path'])==x['sha256']
for x in a['documents']:assert sha(x['path'])==x['sha256']
for x in m['inputs']+m['GC9_benchmarks']:assert sha(x['path'])==x['sha256']==sha(root/x['copy'])
with zipfile.ZipFile(root/m['zip']['file']) as z:
 assert len(z.namelist())==6
 for x in m['images']:assert hashlib.sha256(z.read(x['file'])).hexdigest()==x['sha256']
assert sha(root/m['zip']['file'])==m['zip']['sha256']
missing=[]
class Links(HTMLParser):
 def handle_starttag(self,t,attrs):
  for k,v in attrs:
   if k in ['href','src'] and not v.startswith(('#','http:','https:','data:')) and not (root/v).exists():missing.append(v)
for p in ['index.html','inspect.html']:Links().feed((root/p).read_text(encoding='utf-8'))
assert not missing,missing
for f in ['제작기준.md','검수결과.md','보고.md']:assert (root/f).stat().st_size>100
oldroot=root.parent/'gc9-four-characters-12views-v01'
old=load(oldroot/'manifest.json')
assert all(sha(oldroot/x['file'])==x['sha256'] for x in old['images'])
report=load(root/'evidence/integrity-report.json')
report.update({'native_calls':9,'selected_candidates':6,'preserved_previous_candidates':3,'all_generation_reference_hashes_current':True,'local_link_missing':missing,'required_reports_exist':True,'old_four_character_images_unchanged':12,'technical_file_validation':'passed','visual_approval':'pending','remaining_notes':['Native baseline spread N01=5px N02=2px; not exact pixel equality.','Hidden/inferred accessory structures and overlapped fingers require visual review.']})
(root/'evidence/integrity-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(report,ensure_ascii=False,indent=2))


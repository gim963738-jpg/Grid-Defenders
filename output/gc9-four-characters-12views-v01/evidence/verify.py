from pathlib import Path
import hashlib,json,zipfile
from html.parser import HTMLParser
root=Path(__file__).resolve().parents[1]
def load(p):return json.loads(Path(p).read_text(encoding='utf-8-sig'))
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
m=load(root/'manifest.json');a=load(root/'evidence/읽기확인.json');r=load(root/'generation-record.json')
missing=[]
class Links(HTMLParser):
 def handle_starttag(self,tag,attrs):
  for k,v in attrs:
   if k in ('href','src') and not v.startswith(('http:','https:','#','data:')) and not (root/v).exists():missing.append(v)
for p in [root/'index.html',root/'inspect.html']:Links().feed(p.read_text(encoding='utf-8'))
assert not missing,missing
assert len(m['images'])==12 and len(r['records'])==24
assert sum(x['selected'] for x in r['records'])==12
assert all(x['safe_area_numeric_pass'] for x in m['images'])
for x in m['images']:assert sha(root/x['file'])==x['sha256']
for x in m['inputs']+m['gc9_references']:assert sha(x['path'])==x['sha256']==sha(root/x['copy'])
for d in a['documents']:assert sha(d['path'])==d['sha256']
with zipfile.ZipFile(root/m['zip']['file']) as z:
 assert len(z.namelist())==12
 for x in m['images']:assert hashlib.sha256(z.read(x['file'].replace('\\','/'))).hexdigest()==x['sha256']
required=['index.html','inspect.html','manifest.json','generation-record.json','제작기준.md','검수결과.md','보고.md','evidence/읽기확인.json']
assert all((root/p).exists() for p in required)
result={'task':m['task'],'iteration':1,'generated_png_candidates':12,'native_calls':24,'png_integrity':True,'native_bytes_preserved':True,'unique_hashes':len(set(x['sha256'] for x in m['images'])),'reference_hashes_verified':12,'reading_document_hashes_current':len(a['documents']),'local_links_missing':missing,'zip_roundtrip_matches':12,'safe_margin_contrast_checks_pass':12,'common_scale_and_baseline_pass':False,'all_requirements_complete':False,'user_approved':False,'outcome':'failed_common_scale_and_baseline_unresolved'}
(root/'evidence/integrity-report.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(result,ensure_ascii=False,indent=2))


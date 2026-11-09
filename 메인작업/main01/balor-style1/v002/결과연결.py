from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlparse,unquote
import json,shutil,hashlib,urllib.request,importlib.util
ROOT=Path('C:/Users/user/Desktop/Grid Defenders');HERE=Path(__file__).resolve().parent
link=json.loads((HERE/'연결.json').read_text(encoding='utf-8'));src=Path(link['output']);dest=ROOT/'게임/public/dev-previews/balor-style1-v002'
receipt=HERE/'결과연결.json'
if receipt.exists():raise SystemExit('Already linked; inspect receipt before recovery.')
selected={'index.html','front.png','comparison.png','identity-detail-comparison.png','silhouette-comparison.png','identity-comparison.png','제작기준.md','검수.md','report.md','asset-manifest.json'}
class Links(HTMLParser):
 def handle_starttag(self,tag,attrs):
  for k,v in attrs:
   if k in ('src','href') and v:
    parsed=urlparse(v)
    if not parsed.scheme and not parsed.netloc and parsed.path and not parsed.path.startswith('/'):
     selected.add(unquote(parsed.path))
Links().feed((src/'index.html').read_text(encoding='utf-8'))
for p in src.glob('*/character.png'):selected.add(p.relative_to(src).as_posix())
for p in (src/'references').rglob('*') if (src/'references').exists() else []:
 if p.is_file() and p.suffix.lower() in ('.png','.jpg','.jpeg','.webp'):selected.add(p.relative_to(src).as_posix())
rows=[]
for name in sorted(selected):
 p=(src/name).resolve()
 if not p.is_relative_to(src.resolve()) or not p.is_file():raise SystemExit('Invalid or missing gallery reference: '+name)
 d=dest/name;d.parent.mkdir(parents=True,exist_ok=True)
 if d.exists() and d.read_bytes()!=p.read_bytes():raise SystemExit('Existing different delivery copy: '+str(d))
 if not d.exists():shutil.copy2(p,d)
 digest=hashlib.sha256(p.read_bytes()).hexdigest();assert digest==hashlib.sha256(d.read_bytes()).hexdigest()
 rows.append({'path':name,'sha256':digest,'bytes':p.stat().st_size})
checked=[]
for name in ['index.html','comparison.png','front.png','identity-detail-comparison.png']:
 url='http://localhost:5173/dev-previews/balor-style1-v002/'+name
 with urllib.request.urlopen(url,timeout=15) as r:assert r.status==200 and r.read()==(dest/name).read_bytes()
 checked.append(name)
data={'status':'delivered_for_user_review','gallery':'http://localhost:5173/dev-previews/balor-style1-v002/index.html','overview':'http://localhost:5173/dev-previews/balor-style1-v002/comparison.png','source':str(src),'files':rows,'httpByteChecks':len(checked),'mainReviewed':['comparison.png','report.md','검수.md'],'mainObservation':'Main reviewed revision2 comparison and equipment details. Narrower shoulder/torso silhouette and closer equipment/cape placement observed. Minor ornament differences remain. Rejected v1 preserved; no rig or animation started; user aesthetic approval pending.','userScreenChanged':False,'gameRuntimeChanged':False,'committed':False,'pushed':False}
receipt.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
spec=importlib.util.spec_from_file_location('board',ROOT/'작업관리/도구/작업대장.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);b=m.Board(ROOT/'작업관리');t=b.load(link['task'],'main01')
if t['status']=='in_progress':b.record(t['id'],'main01','returned',src/'report.md')
print(json.dumps({'gallery':data['gallery'],'filesCopied':len(rows),'httpChecks':len(checked),'finalImages':1,'committed':False,'pushed':False},ensure_ascii=False),flush=True)

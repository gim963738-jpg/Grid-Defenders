from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlparse,unquote
import json,shutil,hashlib,urllib.request,importlib.util
ROOT=Path('C:/Users/user/Desktop/Grid Defenders');HERE=Path(__file__).resolve().parent
link=json.loads((HERE/'연결.json').read_text(encoding='utf-8'));src=Path(link['output']);dest=ROOT/'게임/public/dev-previews/blond-balor-035-v003'
receipt=HERE/'결과연결.json'
if receipt.exists():raise SystemExit('Already linked; inspect receipt before recovery.')
selected={'index.html','comparison.png','front-comparison.png','balor-width-comparison.png','identity-detail-comparison.png','검수.md','report.md','asset-manifest.json'}
class Links(HTMLParser):
 def handle_starttag(self,tag,attrs):
  for k,v in attrs:
   if k in ('src','href') and v:
    parsed=urlparse(v)
    if not parsed.scheme and not parsed.netloc and parsed.path and not parsed.path.startswith('/'):
     selected.add(unquote(parsed.path))
Links().feed((src/'index.html').read_text(encoding='utf-8'))
for p in src.glob('*.png'):selected.add(p.relative_to(src).as_posix())
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
for name in ['index.html','comparison.png',*[p.relative_to(src).as_posix() for p in sorted(src.glob('*.png'))]]:
 url='http://localhost:5173/dev-previews/blond-balor-035-v003/'+name
 with urllib.request.urlopen(url,timeout=15) as r:assert r.status==200 and r.read()==(dest/name).read_bytes()
 checked.append(name)
data={'status':'delivered_for_user_review','gallery':'http://localhost:5173/dev-previews/blond-balor-035-v003/index.html','overview':'http://localhost:5173/dev-previews/blond-balor-035-v003/comparison.png','source':str(src),'files':rows,'httpByteChecks':len(checked),'mainReviewed':['comparison.png','report.md','검수.md'],'mainObservation':'Main viewed six-angle comparison, Balor width comparison and equipment closeups. Balor shoulder/torso/upper arms narrower than rejected v2. Equipment relative length and ornament differences remain. User approval pending. No game/rig/animation integration or new Git save.','userScreenChanged':False,'gameRuntimeChanged':False,'committed':False,'pushed':False}
receipt.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
spec=importlib.util.spec_from_file_location('board',ROOT/'작업관리/도구/작업대장.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);b=m.Board(ROOT/'작업관리');t=b.load(link['task'],'main01')
if t['status']=='in_progress':b.record(t['id'],'main01','returned',src/'report.md')
print(json.dumps({'gallery':data['gallery'],'filesCopied':len(rows),'httpChecks':len(checked),'finalImages':6,'committed':False,'pushed':False},ensure_ascii=False),flush=True)

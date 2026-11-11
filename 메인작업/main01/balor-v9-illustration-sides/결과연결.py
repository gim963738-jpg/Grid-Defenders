from pathlib import Path
import json,hashlib,shutil,urllib.request,urllib.parse,importlib.util
H=Path(__file__).resolve().parent;R=Path('C:/Users/user/Desktop/Grid Defenders')
l=json.loads((H/'연결.json').read_text(encoding='utf-8'));src=Path(l['output']);dest=R/'게임/public/dev-previews/balor-v9-illustration-sides4-v001';receipt=H/'결과연결.json'
if receipt.exists():raise SystemExit('Delivery exists; inspect before repeating.')
names={'index.html','comparison.png','comparison-dark.png','보고.md','검수.md','제작기준.md','asset-manifest.json','generation-records.json'}
for sub in ['built-in','image26','inputs','evidence']:
 names.update(p.relative_to(src).as_posix() for p in (src/sub).rglob('*') if p.is_file() and p.suffix in {'.png','.json'})
rows=[]
for name in sorted(names):
 s=(src/name).resolve();assert s.is_relative_to(src.resolve()) and s.is_file();d=dest/name;d.parent.mkdir(parents=True,exist_ok=True)
 if d.exists() and d.read_bytes()!=s.read_bytes():raise SystemExit('Different existing file: '+str(d))
 if not d.exists():shutil.copy2(s,d)
 sha=hashlib.sha256(s.read_bytes()).hexdigest();assert sha==hashlib.sha256(d.read_bytes()).hexdigest()
 rows.append({'path':name,'sha256':sha,'bytes':d.stat().st_size})
for row in rows:
 with urllib.request.urlopen('http://127.0.0.1:5173/dev-previews/balor-v9-illustration-sides4-v001/'+urllib.parse.quote(row['path']),timeout=10) as response:
  assert response.status==200 and hashlib.sha256(response.read()).hexdigest()==row['sha256'],row['path']
 row['http']=200
assert hashlib.sha256((dest/'inputs/front-v9.png').read_bytes()).hexdigest()=='ad96de56563ef391944deac57480e9120e4f1570c60c3c60568baa322c7331e3'
data={'task':l['task'],'source':str(src),'gallery':'http://localhost:5173/dev-previews/balor-v9-illustration-sides4-v001/index.html','files':rows,'workerOutcome':'failed','userAccepted':False,'mainImagesReviewed':['comparison.png','evidence/sword-axes.png'],'gameRuntimeChanged':False,'visibleBrowserChanged':False,'additionalGenerationCalls':0,'committed':False,'pushed':False}
receipt.write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'gallery':data['gallery'],'httpShaVerified':len(rows),'workerOutcome':'failed'},ensure_ascii=False))

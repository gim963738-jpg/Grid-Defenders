from pathlib import Path
import json,hashlib,shutil,urllib.request,urllib.parse
H=Path(__file__).resolve().parent;R=Path('C:/Users/user/Desktop/Grid Defenders');l=json.loads((H/'연결.json').read_text(encoding='utf-8'));src=Path(l['output']);dest=R/'게임/public/dev-previews/balor-builtin35-90-fix-v003';receipt=H/'결과연결.json'
if receipt.exists():raise SystemExit('Delivery exists; inspect before repeating.')
names={'index.html','comparison.png','comparison-dark.png','report.md','보고.md','검수.md','제작기준.md','asset-manifest.json','generation-records.json'}
for sub in ['references','final','evidence']:
 names.update(p.relative_to(src).as_posix() for p in (src/sub).rglob('*') if p.is_file() and p.suffix in {'.png','.json'})
rows=[]
for name in sorted(names):
 s=src/name;d=dest/name;assert s.is_file();d.parent.mkdir(parents=True,exist_ok=True)
 if d.exists() and d.read_bytes()!=s.read_bytes():raise SystemExit('Different existing delivery: '+str(d))
 if not d.exists():shutil.copy2(s,d)
 sha=hashlib.sha256(s.read_bytes()).hexdigest();assert sha==hashlib.sha256(d.read_bytes()).hexdigest()
 rows.append({'path':name,'sha256':sha,'bytes':d.stat().st_size})
for row in rows:
 with urllib.request.urlopen('http://127.0.0.1:5173/dev-previews/balor-builtin35-90-fix-v003/'+urllib.parse.quote(row['path']),timeout=10) as res:
  assert res.status==200 and hashlib.sha256(res.read()).hexdigest()==row['sha256'],row['path']
 row['http']=200
data={'task':l['task'],'iteration':3,'gallery':'http://localhost:5173/dev-previews/balor-builtin35-90-fix-v003/index.html','files':rows,'workerOutcome':'failed','technicalPass':False,'userAccepted':False,'mainReviewed':['보고.md','검수.md','comparison.png','final/builtin-right-035.png','final/builtin-right-090.png'],'limitations':['全캔버스배경알파잔여','검축/손의미세정합및가림','미세작화차이','몸통/시선추가반영미확인'],'additionalGenerationCalls':0,'image26Calls':0,'userScreenChanged':False,'gameRuntimeChanged':False,'committed':False,'pushed':False}
receipt.write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps({'gallery':data['gallery'],'httpShaVerified':len(rows),'technicalPass':False},ensure_ascii=False))

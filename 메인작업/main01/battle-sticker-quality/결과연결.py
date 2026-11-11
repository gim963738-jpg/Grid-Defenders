from pathlib import Path
import hashlib,json,shutil,urllib.request,urllib.parse
R=Path('C:/Users/user/Desktop/Grid Defenders');H=Path(__file__).resolve().parent
l=json.loads((H/'연결.json').read_text(encoding='utf-8'));src=Path(l['output']);dest=R/'게임/public/dev-previews/battle-sticker-quality-v001';p=H/'결과연결.json'
if p.exists():raise SystemExit('Already delivered. Inspect before repeating.')
names={'index.html','app.js','style.css','mobile-ui.css','source-manifest.json','inventory.json','보고.md','정의문서.md','사용자확인.md','사전확인.md'}
for sub in ['assets','evidence']:
 names.update(f.relative_to(src).as_posix() for f in (src/sub).rglob('*') if f.is_file() and f.suffix in {'.png','.json','.css'})
rows=[]
for name in sorted(names):
 f=(src/name).resolve();assert f.is_relative_to(src.resolve()) and f.is_file(),name
 d=dest/name;d.parent.mkdir(parents=True,exist_ok=True)
 if d.exists() and d.read_bytes()!=f.read_bytes():raise SystemExit('Different existing delivery: '+str(d))
 if not d.exists():shutil.copy2(f,d)
 digest=hashlib.sha256(f.read_bytes()).hexdigest();assert digest==hashlib.sha256(d.read_bytes()).hexdigest()
 rows.append({'path':name,'sha256':digest,'bytes':d.stat().st_size})
for row in rows:
 with urllib.request.urlopen('http://127.0.0.1:5173/dev-previews/battle-sticker-quality-v001/'+urllib.parse.quote(row['path']),timeout=10) as response:
  assert response.status==200 and hashlib.sha256(response.read()).hexdigest()==row['sha256'],row['path']
 row['http']=200
data={'task':l['task'],'state':'delivered_for_review_not_accepted','source':str(src),'gallery':'http://localhost:5173/dev-previews/battle-sticker-quality-v001/index.html','files':rows,'mainReviewed':['보고.md','정의문서.md','evidence/desktop-dpr1.png','qa.cjs'],'mainObservation':'실제필드+전투태세전사/보스와스티커편집·3표시모드 확인. 경계정리차이는매우작으며실기기/타브라우저/독립테스터·DPR3장시간미검증. 사용자합격이나게임통합이아님.','userScreenChanged':False,'gameRuntimeChanged':False,'imageGenerationCalls':0,'apiCalls':0,'committed':False,'pushed':False}
p.write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps({'gallery':data['gallery'],'httpByteVerified':len(rows)},ensure_ascii=False))

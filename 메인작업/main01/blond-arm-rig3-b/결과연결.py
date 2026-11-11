from pathlib import Path
import hashlib,json,shutil,urllib.request,urllib.parse
ROOT=Path('C:/Users/user/Desktop/Grid Defenders');HERE=Path(__file__).resolve().parent
link=json.loads((HERE/'연결.json').read_text(encoding='utf-8'));src=Path(link['output'])
dest=ROOT/'게임/public/dev-previews/blond-arm-rig3-b-v001';receipt=HERE/'결과연결.json'
if receipt.exists():raise SystemExit('Already delivered; inspect receipt before repeating.')
selected={p.name for p in src.iterdir() if p.is_file() and p.suffix in {'.png','.webm'}}
selected.update(['index.html','renderer.js','rig.json','animations.json','parts-manifest.json','registration.json','api-usage.json','report.md','검수.md'])
for sub in ['parts','reference-A']:
 selected.update(p.relative_to(src).as_posix() for p in (src/sub).rglob('*') if p.is_file() and p.suffix in {'.png','.json','.webm'})
rows=[]
for name in sorted(selected):
 p=(src/name).resolve();assert p.is_relative_to(src.resolve()) and p.is_file(),name
 d=dest/name;d.parent.mkdir(parents=True,exist_ok=True)
 if d.exists() and d.read_bytes()!=p.read_bytes():raise SystemExit('Different delivery copy: '+str(d))
 if not d.exists():shutil.copy2(p,d)
 digest=hashlib.sha256(p.read_bytes()).hexdigest();assert digest==hashlib.sha256(d.read_bytes()).hexdigest()
 rows.append({'path':name,'sha256':digest,'bytes':d.stat().st_size})
for row in rows:
 with urllib.request.urlopen('http://127.0.0.1:5173/dev-previews/blond-arm-rig3-b-v001/'+urllib.parse.quote(row['path']),timeout=10) as r:
  assert r.status==200 and hashlib.sha256(r.read()).hexdigest()==row['sha256'],row['path']
 row['http']=200
data={'task':link['task'],'state':'delivered_for_review_not_accepted','source':str(src),
 'gallery':'http://localhost:5173/dev-previews/blond-arm-rig3-b-v001/index.html','files':rows,
 'mainReviewed':['report.md','검수.md','parts-board.png','joint-strike-pair.png'],
 'mainObservation':'동일 모션에서 전완/소매 복원 차이 확인. B의 청색 옆구리 조각과 두꺼운 천 겹침, 두 안의 경계 잔여 픽셀이 보임. 사용자 합격이 아님.',
 'userScreenChanged':False,'gameRuntimeChanged':False,'committed':False,'pushed':False}
receipt.write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'gallery':data['gallery'],'httpByteVerified':len(rows)},ensure_ascii=False))

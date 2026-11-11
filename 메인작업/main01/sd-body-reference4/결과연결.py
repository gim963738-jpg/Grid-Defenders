from pathlib import Path
import hashlib,json,shutil,urllib.request,urllib.parse
R=Path('C:/Users/user/Desktop/Grid Defenders');H=Path(__file__).resolve().parent
l=json.loads((H/'연결.json').read_text(encoding='utf-8'));src=Path(l['output']);dest=R/'게임/public/dev-previews/sd-body-reference4-v001';p=H/'결과연결.json'
if p.exists():raise SystemExit('Already delivered; inspect before repeating.')
names=['A-male.png','A-female.png','B-male.png','B-female.png','reference.png','comparison.png','comparison-dark.png','index.html','generation-records.json','api-usage.json','asset-manifest.json','report.md','검수.md','제작기준.md']
rows=[]
for name in names:
 f=(src/name).resolve();assert f.is_relative_to(src.resolve()) and f.is_file(),name
 d=dest/name;d.parent.mkdir(parents=True,exist_ok=True)
 if d.exists() and d.read_bytes()!=f.read_bytes():raise SystemExit('Different existing delivery: '+str(d))
 if not d.exists():shutil.copy2(f,d)
 digest=hashlib.sha256(f.read_bytes()).hexdigest();assert digest==hashlib.sha256(d.read_bytes()).hexdigest()
 rows.append({'path':name,'sha256':digest,'bytes':d.stat().st_size})
for row in rows:
 with urllib.request.urlopen('http://127.0.0.1:5173/dev-previews/sd-body-reference4-v001/'+urllib.parse.quote(row['path']),timeout=10) as response:
  assert response.status==200 and hashlib.sha256(response.read()).hexdigest()==row['sha256'],row['path']
 row['http']=200
data={'task':l['task'],'state':'delivered_for_review_not_accepted','source':str(src),'gallery':'http://localhost:5173/dev-previews/sd-body-reference4-v001/index.html','files':rows,'mainReviewed':['comparison.png','report.md','검수.md'],'userScreenChanged':False,'gameRuntimeChanged':False,'committed':False,'pushed':False}
data['mainObservation']='4개 이미지의 비교판에서 복장/민머리/입상 조건과 남녀 실루엣 차이 확인. 손발·발끝방향·머리비중·근육/옷 명암 차이는 남아 있음. 사용자 합격이 아님.'
p.write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps({'gallery':data['gallery'],'httpByteVerified':len(rows)},ensure_ascii=False))

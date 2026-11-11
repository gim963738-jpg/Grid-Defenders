from pathlib import Path
import hashlib,json,shutil,urllib.request,urllib.parse
R=Path('C:/Users/user/Desktop/Grid Defenders');H=Path(__file__).resolve().parent
l=json.loads((H/'연결.json').read_text(encoding='utf-8'));src=Path(l['output']);dest=R/'게임/public/dev-previews/mannequin-locomotion-v001';p=H/'결과연결.json'
if p.exists():raise SystemExit('Already delivered; inspect before repeating.')
names={f.name for f in src.iterdir() if f.is_file() and f.suffix in {'.png','.webm'}}
names.update(['index.html','locomotion.js','rig.json','bodies.json','motions.json','report.md','검수.md','리깅설계.md','연구분석.md','제작기준.md','research-sources.json'])
rows=[]
for name in sorted(names):
 f=(src/name).resolve();assert f.is_relative_to(src.resolve()) and f.is_file(),name
 d=dest/name;d.parent.mkdir(parents=True,exist_ok=True)
 if d.exists() and d.read_bytes()!=f.read_bytes():raise SystemExit('Different delivery file: '+str(d))
 if not d.exists():shutil.copy2(f,d)
 digest=hashlib.sha256(f.read_bytes()).hexdigest();assert digest==hashlib.sha256(d.read_bytes()).hexdigest()
 rows.append({'path':name,'sha256':digest,'bytes':d.stat().st_size})
for row in rows:
 url='http://127.0.0.1:5173/dev-previews/mannequin-locomotion-v001/'+urllib.parse.quote(row['path'])
 with urllib.request.urlopen(url,timeout=10) as response:
  assert response.status==200 and hashlib.sha256(response.read()).hexdigest()==row['sha256'],row['path']
 row['http']=200
data={'task':l['task'],'state':'delivered_for_review_not_accepted','source':str(src),'gallery':'http://localhost:5173/dev-previews/mannequin-locomotion-v001/index.html','files':rows,'mainReviewed':['comparison.png','motion-contact-sheet.png','report.md','검수.md'],'mainObservation':'남성체1+여성체1 및 전신 이동 상태 확인. 기하 도형 초안이며 여성 체형 세부비율/두상 추정은 사용자 평가 대기. Auto 접합잔차 약0.975u, 발 롤/물리 및 외형부착 미검증.','userScreenChanged':False,'gameRuntimeChanged':False,'committed':False,'pushed':False}
p.write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps({'gallery':data['gallery'],'httpByteVerified':len(rows)},ensure_ascii=False))

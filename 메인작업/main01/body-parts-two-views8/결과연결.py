from pathlib import Path
import hashlib,json,shutil,urllib.request,urllib.parse
R=Path('C:/Users/user/Desktop/Grid Defenders');H=Path(__file__).resolve().parent
l=json.loads((H/'연결.json').read_text(encoding='utf-8'));src=Path(l['output']);dest=R/'게임/public/dev-previews/body-parts8-v001';p=H/'결과연결.json'
if p.exists():raise SystemExit('Already delivered; inspect before repeating.')
names={'index.html','comparison.png','comparison-dark.png','report.md','검수.md','제작기준.md','asset-manifest.json','generation-records.json','api-usage.json','verification.json'}
for key in ['male-035','female-035','male-090','female-090']:
 d=src/key
 names.update(f.relative_to(src).as_posix() for f in d.iterdir() if f.is_file() and f.suffix in {'.png','.json'})
 for sub in ['parts','visible','restored','masks','render-masks','bind0-parts','donor-crops','registered-donors']:
  if (d/sub).exists():names.update(f.relative_to(src).as_posix() for f in (d/sub).rglob('*') if f.is_file() and f.suffix in {'.png','.json'})
rows=[]
for name in sorted(names):
 f=(src/name).resolve();assert f.is_relative_to(src.resolve()) and f.is_file(),name
 d=dest/name;d.parent.mkdir(parents=True,exist_ok=True)
 if d.exists() and d.read_bytes()!=f.read_bytes():raise SystemExit('Different existing delivery: '+str(d))
 if not d.exists():shutil.copy2(f,d)
 digest=hashlib.sha256(f.read_bytes()).hexdigest();assert digest==hashlib.sha256(d.read_bytes()).hexdigest()
 rows.append({'path':name,'sha256':digest,'bytes':d.stat().st_size})
for row in rows:
 with urllib.request.urlopen('http://127.0.0.1:5173/dev-previews/body-parts8-v001/'+urllib.parse.quote(row['path']),timeout=10) as response:
  assert response.status==200 and hashlib.sha256(response.read()).hexdigest()==row['sha256'],row['path']
 row['http']=200
parts=sum('/parts/' in row['path'] and row['path'].endswith('.png') for row in rows);assert parts==64
data={'task':l['task'],'state':'delivered_for_review_not_accepted','source':str(src),'gallery':'http://localhost:5173/dev-previews/body-parts8-v001/index.html','files':rows,'primaryImages':8,'parts':parts,'mainReviewed':['comparison.png','male-035/parts-board.png','female-035/parts-board.png','male-090/parts-board.png','female-090/parts-board.png','report.md','검수.md'],'mainObservation':'완전한 파츠 외곽과 숨은 반대쪽 팔다리 확인. 원본 가시추출과 완전 파츠/정지용 재질·가림/무가림 합성은 구분됨. 회전 연결과 움직임 미검증, 무가림 등록·형상차는 남아 있음. 사용자 합격이나 리깅 완료가 아님.','userScreenChanged':False,'gameRuntimeChanged':False,'committed':False,'pushed':False}
p.write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps({'gallery':data['gallery'],'httpByteVerified':len(rows),'primaryImages':8,'parts':parts},ensure_ascii=False))

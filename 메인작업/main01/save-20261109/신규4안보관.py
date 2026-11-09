from pathlib import Path
import hashlib,json,shutil,urllib.request
ROOT=Path('C:/Users/user/Desktop/Grid Defenders'); HERE=Path(__file__).resolve().parent
source=Path('C:/Users/user/orca/workspaces/Grid Defenders/캐릭터디자인2/output/characters/gc9_longsword_dagger/sd_remodel_4_main01-20261109-dbf50341/scalp_face_v03')
dest=ROOT/'게임/public/dev-previews/blond-scalp-v03';dest.mkdir(parents=True,exist_ok=True)
names=['original.png',*[f'variant-{n}-front.png' for n in range(1,5)],'comparison.png','index.html','asset-manifest.json','분석.md','제작기준.md','검수.md','report.md','generation-records.json']
rows=[]
for name in names:
 p=source/name;d=dest/name;data=p.read_bytes()
 if d.exists() and d.read_bytes()!=data:raise SystemExit('Preserve existing different review copy: '+name)
 if not d.exists():shutil.copy2(p,d)
 assert hashlib.sha256(data).hexdigest()==hashlib.sha256(d.read_bytes()).hexdigest()
 rows.append({'source':str(p),'destination':str(d),'sha256':hashlib.sha256(data).hexdigest(),'bytes':len(data)})
for name in ['index.html','comparison.png',*[f'variant-{n}-front.png' for n in range(1,5)]]:
 url='http://localhost:5173/dev-previews/blond-scalp-v03/'+name
 with urllib.request.urlopen(url,timeout=15) as r:
  assert r.status==200 and r.read()==(dest/name).read_bytes()
result={'source':str(source),'gallery':'http://localhost:5173/dev-previews/blond-scalp-v03/index.html','copied':rows,'httpByteChecks':6,'userScreenChanged':False,'gameArtReplaced':False,'mainVisualReview':'Opened comparison.png; 1/2 modest, 3/4 large-head group; alpha/framing/age/weapon-angle caveats retained in report.'}
(HERE/'신규4안보관결과.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'copied':len(rows),'httpChecks':6,'gallery':result['gallery']},ensure_ascii=False))

from pathlib import Path
from datetime import datetime
import hashlib,json,subprocess,importlib.util
ROOT=Path('C:/Users/user/Desktop/Grid Defenders');HERE=Path(__file__).resolve().parent
UI=Path('C:/Users/user/orca/workspaces/Grid Defenders/UI-전투화면')
OUT=Path('C:/Users/user/orca/workspaces/Grid Defenders/게임개발/output/MAIN01-20261109-F89105C9/v002-scalp')
receipt=HERE/'신규4안-v002-통합결과.json'
if receipt.exists():raise SystemExit('Already attempted; inspect evidence before recovery.')
manifest=json.loads((OUT/'변경manifest.json').read_text(encoding='utf-8'));rows=manifest['changedFiles']
allowed={'게임/src/devImageCompare.ts','게임/src/devImageCompareArt.ts','게임/src/devImageCompare.css','게임/public/assets/dev-image-compare/scalp_face_v03/asset-manifest.json',*[f'게임/public/assets/dev-image-compare/scalp_face_v03/variant-{i}-front.png' for i in range(1,5)]}
assert len(rows)==8 and {r['target'] for r in rows}==allowed
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
assert sha(OUT/'통합.patch')==manifest['patchSha256']
unchanged={};original={}
for label,workspace in [('ui',UI),('root',ROOT)]:
 main=workspace/'게임/src/main.ts';unchanged[str(main)]=sha(main)
 for p in (workspace/'게임/public/assets/dev-image-compare/directions_v02').glob('*'):
  if p.is_file():unchanged[str(p)]=sha(p)
 for r in rows:
  p=workspace/r['target'];source=Path(r['delivery'])
  assert sha(source)==r['afterSha256']
  if r['beforeSha256'] is None:assert not p.exists(),'New target already exists: '+str(p)
  else:assert sha(p)==r['beforeSha256'],'Source changed: '+str(p)
  if p.exists():original[str(p)]=p.read_bytes()
 q=subprocess.run(['git','apply','--check',str(OUT/'통합.patch')],cwd=workspace,capture_output=True,encoding='utf-8')
 assert q.returncode==0,q.stderr
pre={'at':datetime.now().astimezone().isoformat(),'scope':sorted(allowed),'authorization':'사용자 최신 직접 요청: 이미지 대조 추가해봐','input':'root/UI source hashes match reviewed patch','coordination':'main02 msg_b357ae2380e9 explicitly excludes these modules and assets from its image-only output work','recovery':'Previous main commit aa5554ae0470695e239f5d88dbc2f211bb7cfe6c contains identical baseline; in-memory old bytes retained while applying','notNewSaveRequest':True}
(HERE/'신규4안-v002-통합사전확인.json').write_text(json.dumps(pre,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
changed=[]
for label,workspace in [('ui',UI),('root',ROOT)]:
 for r in rows:
  p=workspace/r['target'];p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(Path(r['delivery']).read_bytes())
  assert sha(p)==r['afterSha256']
  changed.append({'workspace':label,'path':str(p),'beforeSha256':r['beforeSha256'],'sha256':r['afterSha256']})
for p,digest in unchanged.items():assert sha(Path(p))==digest,'Out-of-scope source changed: '+p
for r in rows:assert (ROOT/r['target']).read_bytes()==(UI/r['target']).read_bytes()
result={'at':datetime.now().astimezone().isoformat(),'status':'integrated_pending_independent_qa','filesPerWorkspace':8,'changes':changed,'preserved':unchanged,'old15PNGPreserved':True,'mainTsPreserved':True,'userScreenOperated':False,'serverRestarted':False,'committed':False,'pushed':False}
receipt.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
spec=importlib.util.spec_from_file_location('board',ROOT/'작업관리/도구/작업대장.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);b=m.Board(ROOT/'작업관리')
t=b.load('MAIN01-20261109-F89105C9','main01')
if t['status']=='in_progress':b.record(t['id'],'main01','returned',OUT/'결과.json')
print(json.dumps({'status':result['status'],'filesPerWorkspace':8,'committed':False,'pushed':False},ensure_ascii=False))

from pathlib import Path
from datetime import datetime
import hashlib,json,subprocess,importlib.util,urllib.request
ROOT=Path('C:/Users/user/Desktop/Grid Defenders');UI=Path('C:/Users/user/orca/workspaces/Grid Defenders/UI-전투화면');HERE=Path(__file__).resolve().parent
OUT=Path('C:/Users/user/orca/workspaces/Grid Defenders/게임개발/output/MAIN01-20261109-F89105C9/v003-new2-directions');receipt=HERE/'신규2방향-v003-통합결과.json'
if receipt.exists():raise SystemExit('Already attempted; inspect evidence, no blind retry.')
meta=json.loads((OUT/'변경manifest.json').read_text(encoding='utf-8'));rows=meta['changedFiles'];sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
prefix='게임/public/assets/dev-image-compare/scalp_face_v03/variant2_directions_v04/'
allowed={'게임/src/devImageCompare.ts','게임/src/devImageCompareArt.ts',*[prefix+n for n in ['asset-manifest.json','variant-2-right-045.png','variant-2-right-090.png']]}
assert len(rows)==5 and {r['target'] for r in rows}==allowed
assert sha(OUT/'통합.patch')==meta['patchSha256']
preserved={};original={}
for label,workspace in [('ui',UI),('root',ROOT)]:
 for p in [workspace/'게임/src/main.ts',workspace/'게임/src/devImageCompare.css',*(workspace/'게임/public/assets/dev-image-compare').rglob('*')]:
  if p.is_file():preserved[str(p)]=sha(p)
 for r in rows:
  dest=workspace/r['target'];assert sha(Path(r['delivery']))==r['afterSha256']
  if r['beforeSha256'] is None:assert not dest.exists(),'New target exists: '+str(dest)
  else:assert sha(dest)==r['beforeSha256'];original[str(dest)]=dest.read_bytes()
 q=subprocess.run(['git','apply','--check',str(OUT/'통합.patch')],cwd=workspace,capture_output=True,encoding='utf-8');assert q.returncode==0,q.stderr
(HERE/'신규2방향-v003-통합사전확인.json').write_text(json.dumps({'at':datetime.now().astimezone().isoformat(),'authorization':'신규 2안 기준으로 45도 90도 만들어볼래? 적용까지','scope':sorted(allowed),'rootAndUIBeforeHashesMatch':True,'preserve':'19 PNG, CSS, main.ts, selected front2; user screen; no commit/push','recovery':'Previous v002 delivery retains matching source bytes; in-memory baseline retained during application'},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
changes=[]
for label,workspace in [('ui',UI),('root',ROOT)]:
 for r in sorted(rows,key=lambda r:r['target'].startswith('게임/src/')):
  dest=workspace/r['target'];dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(Path(r['delivery']).read_bytes());assert sha(dest)==r['afterSha256']
  changes.append({'workspace':label,'path':str(dest),'beforeSha256':r['beforeSha256'],'sha256':r['afterSha256']})
for p,digest in preserved.items():assert sha(Path(p))==digest,'Protected file changed: '+p
for r in rows:assert (ROOT/r['target']).read_bytes()==(UI/r['target']).read_bytes()
for filename in ['variant-2-right-045.png','variant-2-right-090.png','asset-manifest.json']:
 relative='assets/dev-image-compare/scalp_face_v03/variant2_directions_v04/'+filename
 with urllib.request.urlopen('http://127.0.0.1:5173/'+relative,timeout=15) as response:assert response.status==200 and response.read()==(ROOT/'게임/public'/relative).read_bytes()
result={'at':datetime.now().astimezone().isoformat(),'status':'integrated_pending_actual_root_direction_test','filesPerWorkspace':5,'catalogAssets':21,'changes':changes,'preserved':preserved,'httpByteChecks':3,'userScreenOperated':False,'serverRestarted':False,'committed':False,'pushed':False}
receipt.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
spec=importlib.util.spec_from_file_location('board',ROOT/'작업관리/도구/작업대장.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);b=m.Board(ROOT/'작업관리');t=b.load('MAIN01-20261109-F89105C9','main01')
if t['status']=='in_progress':b.record(t['id'],'main01','returned',OUT/'결과.json')
print(json.dumps({'status':result['status'],'filesPerWorkspace':5,'catalogAssets':21,'httpChecks':3,'committed':False,'pushed':False},ensure_ascii=False))

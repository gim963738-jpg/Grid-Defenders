from pathlib import Path
from datetime import datetime
import hashlib,importlib.util,json,shutil,subprocess
ROOT=Path('C:/Users/user/Desktop/Grid Defenders');HERE=Path(__file__).resolve().parent
ENGINE=Path('C:/Users/user/orca/workspaces/Grid Defenders/게임개발')
UI=Path('C:/Users/user/orca/workspaces/Grid Defenders/UI-전투화면')
OUT=ENGINE/'output/MAIN01-20261109-F89105C9';receipt=HERE/'통합결과.json'
if receipt.exists():raise SystemExit('Already attempted integration: inspect receipt before repeating')
def read(p):return json.loads(p.read_text(encoding='utf-8-sig'))
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def dump(p,v):p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
manifest=read(OUT/'변경manifest.json');expected={Path(x['path']).resolve():x['after'] for x in manifest['changes']}
basehash=next(x['root'] for x in manifest['rootReference'] if x['file']=='main.ts')
assert sha(OUT/'통합.patch')==manifest['patch']['sha256'],'Patch changed after worker report'
sources=[ENGINE/'게임/src'/x for x in ['devImageCompare.ts','devImageCompareArt.ts','devImageCompare.css']]
assets=ENGINE/'게임/public/assets/dev-image-compare/directions_v02'
images=sorted(assets.glob('*.png'));assert len(images)==15,'Need all 15 art files'
sources += [assets/'asset-manifest.json',*images]
for p in sources:assert sha(p)==expected[p.resolve()],str(p)
for workspace in [UI,ROOT]:
 assert sha(workspace/'게임/src/main.ts')==basehash,'main.ts changed; rebase narrow patch before integration'
 for p in sources:
  dest=workspace/p.relative_to(ENGINE)
  assert not dest.exists() or sha(dest)==sha(p),'Conflicting existing file '+str(dest)
 checked=subprocess.run(['git','-c','core.safecrlf=false','apply','--check','--ignore-space-change',str(OUT/'통합.patch')],cwd=workspace,capture_output=True,encoding='utf-8')
 assert checked.returncode==0,checked.stderr
backup=Path('C:/Users/user/orca/backups/Grid Defenders')/datetime.now().strftime('dev-image-compare-%Y%m%d-%H%M%S')
dump(HERE/'통합사전확인.json',{'at':datetime.now().astimezone().isoformat(),'rootMainSha':basehash,'backup':str(backup),
 'scope':['UI/root main.ts narrow patch','3 new source files','15 PNG and source metadata'],
 'authorization':'사용자의 개발자 이미지 대조·실전장 배치·배치후 크기조절 및45/90방향 추가 직접 요청',
 'notArtAcceptance':True,'omitUnusedLegacyCopies':'Runtime references only directions_v02; unused duplicated front copies and measurements are not integrated.'})
changes=[]
for label,workspace in [('ui',UI),('live-root',ROOT)]:
 main=workspace/'게임/src/main.ts';saved=backup/label/'main.ts';saved.parent.mkdir(parents=True);shutil.copy2(main,saved)
 for p in sources:
  dest=workspace/p.relative_to(ENGINE);dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(p,dest)
  assert sha(dest)==sha(p);changes.append({'workspace':label,'path':str(dest),'sha256':sha(dest)})
 applied=subprocess.run(['git','-c','core.safecrlf=false','apply','--ignore-space-change',str(OUT/'통합.patch')],cwd=workspace,capture_output=True,encoding='utf-8')
 assert applied.returncode==0,applied.stderr
 changes.append({'workspace':label,'path':str(main),'before':basehash,'sha256':sha(main),'backup':str(saved)})
assert (ROOT/'게임/src/main.ts').read_bytes()==(UI/'게임/src/main.ts').read_bytes()
dump(receipt,{'at':datetime.now().astimezone().isoformat(),'status':'integrated_pending_independent_qa','changes':changes,
 'backup':str(backup),'patch':str(OUT/'통합.patch'),'productUIOperated':False,'serverRestarted':False,'artAcceptance':'pending_user'})
spec=importlib.util.spec_from_file_location('board',ROOT/'작업관리/도구/작업대장.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);b=m.Board(ROOT/'작업관리')
for task,proof in [
 ('MAIN01-20261109-F89105C9',OUT/'결과.json'),
 ('MAIN01-20261109-DBF50341',Path('C:/Users/user/orca/workspaces/Grid Defenders/캐릭터디자인2/output/characters/gc9_longsword_dagger/sd_remodel_4_main01-20261109-dbf50341/directions_v02/report.md')),
 ('MAIN01-20261109-7AE73F23',Path('C:/Users/user/orca/workspaces/Grid Defenders/몬스터-디자인/output/monsters/three_types_three_views_main01-20261109-7ae73f23/report.md'))]:
 state=b.load(task,'main01')
 if state['status']=='in_progress':b.record(task,'main01','returned',proof)
print(json.dumps({'status':'integrated_pending_independent_qa','filesPerWorkspace':len(sources)+1,'backup':str(backup)},ensure_ascii=False))

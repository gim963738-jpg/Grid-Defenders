from pathlib import Path
import hashlib,importlib.util,json,os,shutil,sys,time

R=Path('C:/Users/user/Desktop/Grid Defenders');G=R/'게임';H=Path(__file__).resolve().parent;I=H/'integration';I.mkdir(exist_ok=True)
c=json.loads((H/'연결.json').read_text(encoding='utf-8'));O=Path(c['output']);m=json.loads((O/'변경manifest.json').read_text(encoding='utf-8-sig'))
assert m['task']==c['task'] and len(m['productFiles'])==32
rows=m['productFiles']+m['checkFiles'];paths=set();records=[]
for row in rows:
 rel=Path(row['path']);assert not rel.is_absolute() and '..' not in rel.parts and rel.parts[0] in ['src','tests','scripts','public','qa']
 if rel.as_posix() in paths:raise SystemExit('중복 경로: '+str(rel))
 paths.add(rel.as_posix());target=G/rel;assert target.resolve().is_relative_to(G.resolve())
 source=Path(row.get('delivery') or str(O/'game'/rel));assert source.resolve().is_relative_to(O.resolve()) and source.is_file()
 incoming=hashlib.sha256(source.read_bytes()).hexdigest();assert incoming==row['afterSha256'],'반환 SHA 불일치: '+str(rel)
 current=hashlib.sha256(target.read_bytes()).hexdigest() if target.is_file() else None
 assert current==row['beforeSha256'],'현재 기준 SHA 충돌: '+str(rel)
 stage=I/'staged'/rel;stage.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(source,stage)
 if target.exists():
  before=I/'before'/rel;before.parent.mkdir(parents=True,exist_ok=True)
  if before.exists():assert before.read_bytes()==target.read_bytes()
  else:shutil.copy2(target,before)
 records.append({'path':rel.as_posix(),'beforeSha256':current,'afterSha256':incoming,'staged':str(stage),'bytes':source.stat().st_size})
preflight={'task':c['task'],'productFiles':32,'checkFiles':len(m['checkFiles']),'files':records,'state':'ready_to_apply','allBaselineAndDeliveryHashesMatch':True}
(I/'통합사전검증.json').write_text(json.dumps(preflight,ensure_ascii=False,indent=2),encoding='utf-8')
if '--apply' not in sys.argv:
 print(json.dumps({k:v for k,v in preflight.items() if k!='files'},ensure_ascii=False));raise SystemExit(0)
assert not (I/'실제반영.json').exists(),'이미 반영 영수증 존재, 재적용 금지'
assert (I/'진행상태보존.json').is_file(),'사용자 전투 진행 보존 먼저 확인'
spec=importlib.util.spec_from_file_location('board',R/'작업관리/도구/작업대장.py');bmod=importlib.util.module_from_spec(spec);spec.loader.exec_module(bmod);board=bmod.Board(R/'작업관리')
if board.load(c['task'],'main01')['status']=='in_progress':board.record(c['task'],'main01','returned',O/'결과.json')
def atomic(record):
 rel=Path(record['path']);dest=G/rel;now=hashlib.sha256(dest.read_bytes()).hexdigest() if dest.is_file() else None
 assert now==record['beforeSha256'],'반영 직전 충돌: '+str(rel)
 dest.parent.mkdir(parents=True,exist_ok=True);tmp=dest.with_name(dest.name+'.runtime-apply-tmp');shutil.copy2(record['staged'],tmp);os.replace(tmp,dest)
 assert hashlib.sha256(dest.read_bytes()).hexdigest()==record['afterSha256']
assets=[r for r in records if r['path'].startswith('public/')]
for r in assets:atomic(r)
time.sleep(1)
sources=[r for r in records if r['path'].startswith('src/')]
sources.sort(key=lambda r:(r['beforeSha256'] is not None,r['path']=='src/main.ts',r['path']))
for r in sources:atomic(r)
for r in records:
 if not r['path'].startswith(('src/','public/')):atomic(r)
result={**preflight,'state':'applied_pending_validation','userProgressCaptured':True,'gameServerRestarted':False,'gitOperations':False}
(I/'실제반영.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
c.update(state='root_applied_pending_checks',rootIntegrated=True,rootIntegrationEvidence=str(I/'실제반영.json'),workerOutcome='succeeded',userAccepted=False,needsIndependentQa=True);(H/'연결.json').write_text(json.dumps(c,ensure_ascii=False,indent=2),encoding='utf-8')
with (H/'3_작업일지.md').open('a',encoding='utf-8') as f:f.write('\n현재root기준과반환SHA전항목대조후 제품32+검사39파일만원자적반영. 게임진행체크포인트/수정전파일보존. 실제반영.json 연결, root검사/독립QA/사용자최종확인 대기. Git0.\n')
print(json.dumps({'task':c['task'],'state':result['state'],'productFiles':32,'checkFiles':len(m['checkFiles']),'sourceFiles':len(sources),'assets':len(assets)},ensure_ascii=False))

from pathlib import Path
import importlib.util,json,subprocess
R=Path('C:/Users/user/Desktop/Grid Defenders');H=Path(__file__).resolve().parent;p=H/'실제발송영수증.json'
if p.exists():raise SystemExit('Receipt exists. Inspect before recovery; do not launch twice.')
l=json.loads((H/'연결.json').read_text(encoding='utf-8'));plan=l['plan']
cmd=['C:/Users/user/AppData/Local/Programs/orca/resources/bin/orca.exe','orchestration','worker-start','--spec-file',plan['prompt'],'--worktree',plan['selector'],'--agent','codex','--model','gpt-6.1-sol','--effort','medium','--keep-open','--run','run_47ce1a81d7b1','--task-title','72 CSSpx 교전 스티커 비교도구','--json']
q=subprocess.run(cmd,capture_output=True,text=True,encoding='utf-8',errors='replace');p.write_text(q.stdout+('\n'+q.stderr if q.stderr else ''),encoding='utf-8');print(q.stdout,flush=True)
if q.returncode:raise SystemExit(q.returncode)
d=json.loads(q.stdout)
if not d.get('ok'):raise SystemExit('Worker launch not confirmed. Inspect recovery guidance, do not rerun.')
spec=importlib.util.spec_from_file_location('board',R/'작업관리/도구/작업대장.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);b=m.Board(R/'작업관리');b.record(l['task'],'main01','sent',p)
l['state']='delivery_receipt_recorded';l['delivery']=d['result'];(H/'연결.json').write_text(json.dumps(l,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps({'task':l['task'],'state':l['state']},ensure_ascii=False),flush=True)

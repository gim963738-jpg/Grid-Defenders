from pathlib import Path
import importlib.util,json,subprocess
HERE=Path(__file__).resolve().parent
ROOT=Path('C:/Users/user/Desktop/Grid Defenders')
link=json.loads((HERE/'연결.json').read_text(encoding='utf-8'))
receipt=HERE/'실제발송영수증.json'
if receipt.exists():raise SystemExit('Receipt exists: inspect it; never duplicate the launch')
exe='C:/Users/user/AppData/Local/Programs/orca/resources/bin/orca.exe'
argv=[exe,'orchestration','worker-start','--spec-file',link['plan']['prompt'],'--worktree',link['plan']['selector'],
      '--agent','codex','--model','gpt-6.1-sol','--effort','medium','--keep-open','--task-title','금발전사 SD 리모델링 4안','--json']
(HERE/'발송시도.json').write_text(json.dumps({'argv':argv,'task':link['task']},ensure_ascii=False,indent=2),encoding='utf-8')
p=subprocess.run(argv,capture_output=True,encoding='utf-8')
raw=p.stdout
try:reply=json.loads(raw[raw.index('{'):])
except (ValueError,json.JSONDecodeError):
 receipt.write_text(json.dumps({'unparsed':raw,'stderr':p.stderr,'returncode':p.returncode},ensure_ascii=False,indent=2),encoding='utf-8')
 raise SystemExit('Ambiguous launch output recorded; no retry')
receipt.write_text(json.dumps(reply,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(reply,ensure_ascii=False,indent=2),flush=True)
if p.returncode or not reply.get('ok'):raise SystemExit('Inspect failedStage and use the official recovery guide; do not resend')
spec=importlib.util.spec_from_file_location('board',ROOT/'작업관리/도구/작업대장.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
m.Board(ROOT/'작업관리').record(link['task'],'main01','sent',receipt)
print('Delivery receipt connected to '+link['task'],flush=True)

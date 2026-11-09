from pathlib import Path
import importlib.util,json,subprocess,hashlib
ROOT=Path('C:/Users/user/Desktop/Grid Defenders'); S=ROOT/'작업관리'; HERE=Path(__file__).resolve().parent
receipt=HERE/'두상확대-v003-실제발송영수증.json'
if receipt.exists(): raise SystemExit('Already attempted; inspect existing receipt. Do not duplicate.')
link=json.loads((HERE/'두상확대-v003-연결.json').read_text(encoding='utf-8')); plan=link['plan']
spec=importlib.util.spec_from_file_location('board',S/'도구/작업대장.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
board=m.Board(S);task=board.load(link['task'],'main01')
if task['iteration']!=3 or task['status']!='prepared': raise SystemExit('Task state changed; inspect before sending.')
if task['approval']['hashes']!=board.hashes(task): raise SystemExit('Approval scope changed; no send.')
prompt=Path(plan['prompt'])
if hashlib.sha256(prompt.read_bytes()).hexdigest()!=plan['promptSha256']: raise SystemExit('Prepared prompt changed; no send.')
exe='C:/Users/user/AppData/Local/Programs/orca/resources/bin/orca.exe'
p=subprocess.run([exe,'orchestration','send','--to','dispatch:ctx_553445b731ee','--subject','확인된 수정 제작: 실제 두상·얼굴 확대 금발SD 정면4안 / 차수3','--type','dispatch','--body',prompt.read_text(encoding='utf-8'),'--json'],capture_output=True,encoding='utf-8')
try: reply=json.loads(p.stdout[p.stdout.index('{'):])
except (ValueError,json.JSONDecodeError): reply={'ok':False,'stdout':p.stdout,'stderr':p.stderr,'returncode':p.returncode}
receipt.write_text(json.dumps(reply,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(reply,ensure_ascii=False,indent=2),flush=True)
if p.returncode or not reply.get('ok'): raise SystemExit('Inspect failed/uncertain receipt; do not resend automatically.')
state=board.record(task['id'],'main01','sent',receipt)
print(json.dumps({'task':state['id'],'iteration':state['iteration'],'state':state['status'],'receipt':str(receipt)},ensure_ascii=False),flush=True)

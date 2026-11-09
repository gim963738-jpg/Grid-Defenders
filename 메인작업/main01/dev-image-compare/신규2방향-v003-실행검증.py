from pathlib import Path
from datetime import datetime
import json,subprocess,socket
ROOT=Path('C:/Users/user/Desktop/Grid Defenders');HERE=Path(__file__).resolve().parent
source=Path('C:/Users/user/orca/workspaces/Grid Defenders/게임개발/output/MAIN01-20261109-F89105C9/v003-new2-directions/browser-check.mjs')
out=HERE/('live-directions-v003-'+datetime.now().strftime('%H%M%S'));out.mkdir(exist_ok=False)
with socket.socket() as probe:probe.bind(('127.0.0.1',9357))
body=source.read_text(encoding='utf-8')
old="const server=spawn(process.execPath,['C:/Users/user/Desktop/Grid Defenders/게임/node_modules/vite/bin/vite.js','--host','127.0.0.1','--port',String(port),'--strictPort'],{cwd:qa,windowsHide:true,stdio:'ignore'});"
assert body.count(old)==1
body=body.replace("port=5197,debug=9347","port=5173,debug=9357").replace(old,"const server={kill(){}}; // Use existing root5173 read-only; never restart/terminate it.")
body='// Main integration verification: same producer cases rerun against actual root, not an independent QA claim.\n'+body
script=out/'actual-root-check.mjs';script.write_text(body,encoding='utf-8')
p=subprocess.run(['node',str(script)],cwd=ROOT,capture_output=True,encoding='utf-8')
(out/'runner.log').write_text(p.stdout+'\n'+p.stderr,encoding='utf-8')
r=json.loads((out/'browser-result.json').read_text(encoding='utf-8'))
summary={'target':'actual root5173','output':str(out),'script':str(script),'result':r['result'],'passed':sum(x['passed'] for x in r['checks']),'total':len(r['checks']),'runtimeExceptions':len(r['errors']),'independentQA':False,'userBrowserTouched':False,'existingServerRestarted':False,'committed':False,'pushed':False}
(HERE/'신규2방향-v003-실행검증결과.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(summary,ensure_ascii=False,indent=2),flush=True)
if p.returncode or r['result']!='PASS' or r['errors'] or len(r['checks'])!=48:raise SystemExit('Actual root check failed; inspect evidence before claiming done.')

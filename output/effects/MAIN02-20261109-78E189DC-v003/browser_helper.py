from pathlib import Path
import json,subprocess
P=Path(__file__).resolve().parent
CLI=r'C:/Users/user/AppData/Local/Programs/orca/resources/bin/orca.exe'
PAGE='13f15e2d-f6a5-4bf9-a043-95a5e6bc98da'
def run(*args):
 r=subprocess.run([CLI,*args,'--json'],capture_output=True,encoding='utf-8');d=json.loads(r.stdout);assert d.get('ok'),d;return d['result']
def ev(expr):
 s=run('eval','--page',PAGE,'--expression',expr)['result']
 try:return json.loads(s)
 except:return s
if __name__=='__main__':
 print(ev("document.body.appendChild(Object.assign(document.createElement('script'),{textContent:\"document.body.dataset.mainWorldDemo=String(!!window.demo)\"}));document.body.dataset.mainWorldDemo"))

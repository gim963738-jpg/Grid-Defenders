from pathlib import Path
import json,subprocess
P=Path(__file__).resolve().parent
CLI=r'C:/Users/user/AppData/Local/Programs/orca/resources/bin/orca.exe'
PAGE='91eb2fa3-df7e-4645-98d0-0cec54138bad'
def run(*args):
 r=subprocess.run([CLI,*args,'--json'],capture_output=True,encoding='utf-8');d=json.loads(r.stdout);assert d.get('ok'),d;return d['result']
def ev(expr):
 s=run('eval','--page',PAGE,'--expression',expr)['result']
 try:return json.loads(s)
 except:return s
if __name__=='__main__':print(ev('demo.exportFrames()'))


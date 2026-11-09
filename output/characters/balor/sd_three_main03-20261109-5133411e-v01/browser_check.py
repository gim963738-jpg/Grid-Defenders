from pathlib import Path
import subprocess,json
ROOT=Path(__file__).resolve().parent
CLI=r'C:/Users/user/AppData/Local/Programs/orca/resources/bin/orca.exe'
PAGE='2e9a0ecc-fae4-4db9-85ff-a88ea8987de1'
expr="""JSON.stringify({w:innerWidth,h:innerHeight,dpr:devicePixelRatio,images:Array.from(document.images).map(i=>({src:i.getAttribute('src'),complete:i.complete,w:i.naturalWidth})),grid:document.querySelector('.grid').getBoundingClientRect().toJSON()})"""
p=subprocess.run([CLI,'eval','--page',PAGE,'--expression',expr,'--json'],capture_output=True,text=True,encoding='utf-8')
(ROOT/'evidence/browser-check.json').write_text(p.stdout,encoding='utf-8')
print(p.stdout)

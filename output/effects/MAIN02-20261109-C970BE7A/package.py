from pathlib import Path
import subprocess,json,zipfile,hashlib
P=Path(__file__).resolve().parent
cli=r'C:/Users/user/AppData/Local/Programs/orca/resources/bin/orca.exe'
page='4f11e865-91ee-47b2-b5da-137b638d1b13'
def run(*args):
 r=subprocess.run([cli,*args,'--json'],capture_output=True,encoding='utf-8');d=json.loads(r.stdout);assert d.get('ok'),d;return d['result']
run('goto','--page',page,'--url',(P/'preview.html').as_uri())
r=run('eval','--page',page,'--expression',"({protocol:location.protocol,hasPlayer:!!window.demo,canvasWidth:document.querySelector('canvas').width,backgroundLoaded:document.querySelector('canvas').getContext('2d').getImageData(20,20,1,1).data[3]===255})")
d=json.loads(r['result']);assert d['hasPlayer'] and d['protocol']=='file:' and d['canvasWidth']==992,d
(P/'standalone-file-audit.json').write_text(json.dumps(d,indent=2),encoding='utf-8')
run('goto','--page',page,'--url','http://127.0.0.1:5197/preview.html')
(P/'check.js').unlink(missing_ok=True)
with zipfile.ZipFile(P/'six-slash-alpha-source.zip','w',zipfile.ZIP_DEFLATED) as z:
 for f in (P/'frames').glob('*.png'):z.write(f,'frames/'+f.name)
 for name in ['preview.html','timeline.json','drawingRender.js','drawingModel.js','editable-plans.json','build.py','export.py','serve.py','qa.py','finalize.py','mobile-ui.css','battlefield-display.png','battlefield-source.png','sources.json','전문제작프롬프트.md']:z.write(P/name,name)
with zipfile.ZipFile(P/'six-slash-alpha-source.zip') as z:assert z.testzip() is None
manifest=[]
for p in sorted(P.rglob('*')):
 if p.is_file() and p.name!='manifest.json':manifest.append(dict(path=str(p.relative_to(P)),bytes=p.stat().st_size,sha256=hashlib.sha256(p.read_bytes()).hexdigest()))
(P/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
print('STANDALONE AND ZIP PASS',len(manifest))

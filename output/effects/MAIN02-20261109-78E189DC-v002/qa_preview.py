from pathlib import Path
from PIL import Image
import json,subprocess,shutil
P=Path(__file__).resolve().parent;page='c96b5b0f-aa68-41ea-801c-2d685e31a285'
cli=r'C:/Users/user/AppData/Local/Programs/orca/resources/bin/orca.exe'
def run(*args):
 r=subprocess.run([cli,*args,'--json'],capture_output=True,encoding='utf-8');d=json.loads(r.stdout);assert d.get('ok'),d;return d['result']
def ev(s):
 value=run('eval','--page',page,'--expression',s)['result']
 try:return json.loads(value)
 except:return value
def save(n,d):(P/n).write_text(json.dumps(d,ensure_ascii=False,indent=2),encoding='utf-8')
run('reload','--page',page)
ev('atlas.decode()')
for width in [320,390,1100]:
 run('viewport','--page',page,'--width',str(width),'--height','850','--scale','1',*(['--mobile'] if width<500 else []))
 d=ev("demo.seekFrame(12);({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,canvas:canvas.getBoundingClientRect().toJSON(),controls:[...document.querySelectorAll('button,select,label')].map(e=>({width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height}))})")
 assert d['scrollWidth']==d['width'] and all(x['width']>=47.9 and x['height']>=47.9 for x in d['controls']),d
 save(f'mobile-{width}.json',d);shot=run('screenshot','--page',page);shutil.copyfile(shot['path'],P/f'preview-{width}.png')
d=ev("""(async()=>{let checks=[];for(let rate of [.25,.5,1,2]){demo.seek(0);let e=document.querySelector('#speed');e.value=rate<1?String(rate).slice(1):String(rate);e.dispatchEvent(new Event('change'));document.querySelector('#play').click();let start=performance.now();await new Promise(r=>setTimeout(r,900));let a=demo.state(),real=performance.now()-start;document.querySelector('#play').click();let frozen=demo.state().t;await new Promise(r=>setTimeout(r,100));checks.push({rate,ratio:a.t/real,pauseStable:demo.state().t===frozen});}document.querySelector('#restart').click();checks.push({restart:demo.state().t===0});let lp=document.querySelector('#loop');lp.checked=false;lp.dispatchEvent(new Event('change'));demo.seek(2000);document.querySelector('#play').click();await new Promise(r=>setTimeout(r,150));checks.push({nonLoopStop:demo.state().t===2050&&!demo.state().playing,lastFrame:demo.state().index===24});lp.checked=true;lp.dispatchEvent(new Event('change'));document.querySelector('#play').click();await new Promise(r=>setTimeout(r,100));checks.push({loopRestart:demo.state().t<2050});let select=document.querySelector('#speed');select.value='1';select.dispatchEvent(new Event('change'));demo.seekFrame(1);document.querySelector('#next').click();checks.push({nextFrame:demo.state().index===2});document.querySelector('#prev').click();checks.push({prevFrame:demo.state().index===1});return checks})()""")
assert all(x.get('pauseStable',True) for x in d) and all(abs(x['ratio']-x['rate'])<.15 for x in d if 'ratio'in x),d
assert d[4]['restart'] and d[5]['nonLoopStop'] and d[5]['lastFrame'] and d[6]['loopRestart'] and d[7]['nextFrame'] and d[8]['prevFrame'],d
save('playback-audit.json',d)
d=ev("(()=>{let checks=[];for(let bg of ['grey','green','dark']){let e=document.querySelector('#bg');e.value=bg;e.dispatchEvent(new Event('change'));checks.push(demo.state().background===bg)}let frames=[];for(let i=1;i<=24;i++){demo.seekFrame(i);frames.push(demo.state().index)}return {backgrounds:checks,frames}})()")
assert all(d['backgrounds']) and d['frames']==list(range(1,25));save('frame-background-audit.json',d)
run('goto','--page',page,'--url',(P/'preview.html').as_uri())
d=ev("(async()=>{await atlas.decode();return {protocol:location.protocol,atlasWidth:atlas.naturalWidth,atlasHeight:atlas.naturalHeight,frames:demo.spec.frameCount}})()")
assert d==dict(protocol='file:',atlasWidth=3840,atlasHeight=2560,frames=24);save('standalone-audit.json',d)
run('goto','--page',page,'--url','http://127.0.0.1:5199/preview.html')
console=run('console','--page',page,'--limit','20');save('browser-console.json',console)
gifAudit=[]
for name in ['grey','green','dark']:
 im=Image.open(P/f'combo-{name}.gif');duration=0
 for i in range(im.n_frames):im.seek(i);duration+=im.info.get('duration',0)
 assert im.n_frames==24 and duration==2050 and im.info.get('loop')==0
 gifAudit.append(dict(file=f'combo-{name}.gif',decodedFrames=24,durationMs=duration,loop=0,alpha=False,source='combo-sheet.png cropped24cells'))
save('gif-audit.json',gifAudit)
print('VIEWER/GIF/24SHEETFRAMES VERIFIED')

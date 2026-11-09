from browser_helper import P,PAGE,run,ev
from PIL import Image
import json,shutil,subprocess
def save(n,d):(P/n).write_text(json.dumps(d,ensure_ascii=False,indent=2),encoding='utf-8')
run('reload','--page',PAGE)
for width in [320,390,1100]:
 run('viewport','--page',PAGE,'--width',str(width),'--height','850','--scale','1',*(['--mobile']if width<500 else []))
 d=ev("demo.seek(.25);({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,canvas:canvas.getBoundingClientRect().toJSON(),controls:[...document.querySelectorAll('button,select,label')].map(e=>({width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height}))})")
 assert d['width']==d['scrollWidth'] and all(x['width']>=47.9 and x['height']>=47.9 for x in d['controls']),d
 save(f'mobile-{width}.json',d);shot=run('screenshot','--page',PAGE);shutil.copyfile(shot['path'],P/f'preview-{width}.png')
d=ev("""(async()=>{let a=[];for(let rate of [.25,.5,1,2]){demo.seek(0);let e=document.querySelector('#speed');e.value=rate<1?String(rate).slice(1):String(rate);e.dispatchEvent(new Event('change'));document.querySelector('#play').click();let now=performance.now();await new Promise(r=>setTimeout(r,600));let passed=(performance.now()-now)/1000,s=demo.state();document.querySelector('#play').click();let frozen=demo.state().t;await new Promise(r=>setTimeout(r,100));a.push({rate,ratio:s.t/passed,pauseStable:demo.state().t===frozen});}document.querySelector('#restart').click();a.push({restart:demo.state().t===0});let e=document.querySelector('#loop');e.checked=false;e.dispatchEvent(new Event('change'));demo.seek(1.57);document.querySelector('#play').click();await new Promise(r=>setTimeout(r,150));a.push({nonLoopEnd:demo.state().t===1.6&&!demo.state().playing});e.checked=true;e.dispatchEvent(new Event('change'));document.querySelector('#play').click();await new Promise(r=>setTimeout(r,100));a.push({loopRestart:demo.state().t<1.6});let sp=document.querySelector('#speed');sp.value='1';sp.dispatchEvent(new Event('change'));return a})()""")
assert all(x.get('pauseStable',True)for x in d) and all(abs(x['ratio']-x['rate'])<.22 for x in d if 'ratio'in x),d
assert d[4]['restart'] and d[5]['nonLoopEnd'] and d[6]['loopRestart'],d;save('playback-audit.json',d)
d=ev("""(()=>{let backgrounds=[],hits=[];for(let v of ['grey','green','dark','battle']){let e=document.querySelector('#bg');e.value=v;e.dispatchEvent(new Event('change'));backgrounds.push(demo.state().background===v);}for(let v of [1,2,3,0]){let e=document.querySelector('#hit');e.value=String(v);e.dispatchEvent(new Event('change'));demo.seekFrame(v?12:16);hits.push({hit:v,selection:demo.state().selection,frameMax:+document.querySelector('#scrub').max})}return {backgrounds,hits}})()""")
assert all(d['backgrounds']) and all(x['hit']==x['selection'] and x['frameMax']==(30 if x['hit']else 96)for x in d['hits']),d
save('selection-background-audit.json',d)
run('goto','--page',PAGE,'--url',(P/'preview.html').as_uri())
d=ev("(async()=>{await battle.decode();demo.seek(.25);return {protocol:location.protocol,hasPlayer:!!window.demo,backgroundLoaded:battle.naturalWidth>0,canvasWidth:canvas.width}})()")
assert d['protocol']=='file:'and d['hasPlayer']and d['backgroundLoaded'];save('standalone-audit.json',d)
run('goto','--page',PAGE,'--url','http://127.0.0.1:5200/preview.html');save('browser-console.json',run('console','--page',PAGE,'--limit','20'))
checks=[]
for bg in ['grey','green','dark','battle']:
 f=P/f'combo-{bg}.mp4';r=subprocess.run(['ffprobe','-v','error','-select_streams','v:0','-show_entries','stream=width,height,nb_frames,r_frame_rate,duration','-of','json',str(f)],capture_output=True,text=True,check=True);s=json.loads(r.stdout)['streams'][0]
 assert s['nb_frames']=='96'and float(s['duration'])==1.6
 subprocess.run(['ffmpeg','-v','error','-i',str(f),'-f','null','-'],check=True,capture_output=True);checks.append(dict(file=f.name,decode='pass',**s))
for group,expected in [(f'combo-{x}',1600)for x in ['grey','green','dark','battle']]+[(f'hit{x}-dark',500)for x in [1,2,3]]:
 im=Image.open(P/f'{group}.gif');total=0
 for i in range(im.n_frames):im.seek(i);total+=im.info.get('duration',0)
 assert total==expected and im.info.get('loop')==0
 checks.append(dict(file=f'{group}.gif',durationMs=total,loop=0,alpha=False))
save('media-audit.json',checks)
print('V003 VIEWER/MEDIA QA PASS')

from browser_helper import P,PAGE,run,ev
from PIL import Image
import json,shutil,subprocess
def save(n,d):(P/n).write_text(json.dumps(d,ensure_ascii=False,indent=2),encoding='utf-8')
run('reload','--page',PAGE)
for width in [320,390,1100]:
 run('viewport','--page',PAGE,'--width',str(width),'--height','850','--scale','1',*(['--mobile']if width<500 else []))
 d=ev("demo.seek(.32);({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,canvas:canvas.getBoundingClientRect().toJSON(),controls:[...document.querySelectorAll('button,select,label')].map(e=>({width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height}))})")
 assert d['width']==d['scrollWidth'] and all(x['width']>=47.9 and x['height']>=47.9 for x in d['controls']),d
 save(f'mobile-{width}.json',d);shot=run('screenshot','--page',PAGE);shutil.copyfile(shot['path'],P/f'preview-{width}.png')
d=ev("""(async()=>{let a=[];for(let rate of [.25,.5,1,2,5]){demo.seek(0);let e=document.querySelector('#speed');e.value=rate<1?String(rate).slice(1):String(rate);e.dispatchEvent(new Event('change'));document.querySelector('#play').click();let now=performance.now();await new Promise(r=>setTimeout(r,rate>2?150:rate>1?250:500));await new Promise(requestAnimationFrame);let passed=(performance.now()-now)/1000,s=demo.state();document.querySelector('#play').click();let frozen=demo.state().t;await new Promise(r=>setTimeout(r,100));a.push({rate,ratio:s.t/passed,pauseStable:demo.state().t===frozen});}document.querySelector('#restart').click();a.push({restart:demo.state().t===0});let sp=document.querySelector('#speed');sp.value='1';sp.dispatchEvent(new Event('change'));let e=document.querySelector('#loop');e.checked=false;e.dispatchEvent(new Event('change'));demo.seek(1.18);document.querySelector('#play').click();await new Promise(r=>setTimeout(r,150));a.push({nonLoopEnd:demo.state().t===1.2&&!demo.state().playing});e.checked=true;e.dispatchEvent(new Event('change'));document.querySelector('#play').click();await new Promise(r=>setTimeout(r,100));a.push({loopRestart:demo.state().t<1.2});return a})()""")
assert all(x.get('pauseStable',True) for x in d)and all(abs(x['ratio']-x['rate'])<.45 for x in d if 'ratio'in x),d
assert d[5]['restart']and d[6]['nonLoopEnd']and d[7]['loopRestart'],d;save('playback-audit.json',d)
d=ev("""(()=>{let backgrounds=[],layers=[];for(let v of ['grey','green','dark','battle']){let e=document.querySelector('#bg');e.value=v;e.dispatchEvent(new Event('change'));backgrounds.push(demo.state().background===v);}for(let v of ['combined','slash','flash','ground','debris','dust']){let e=document.querySelector('#layer');e.value=v;e.dispatchEvent(new Event('change'));demo.seekFrame(22);layers.push({layer:v,selection:demo.state().selection})}let tip=demo.point(demo.h,1,0);demo.seekFrame(18);document.querySelector('#next').click();let next=demo.state().t===.3;document.querySelector('#prev').click();return {backgrounds,layers,tip,anchor:demo.spec.pivotPadded,next,prev:Math.abs(demo.state().t-17/60)<1e-6}})()""")
assert all(d['backgrounds'])and all(x['layer']==x['selection'] for x in d['layers']) and all(abs(a-b)<1e-6 for a,b in zip(d['tip'],d['anchor']))and d['next']and d['prev'];save('selection-contact-audit.json',d)
d=ev("""(()=>{function pixels(name){let c=demo.effect(.3,name),a=c.getContext('2d').getImageData(0,0,992,572).data,n=0;for(let i=3;i<a.length;i+=4)if(a[i]>=64)n++;return n}let before=pixels('slash'),old=demo.h.thickness;demo.h.thickness=old*1.2;let after=pixels('slash');demo.h.thickness=old;let p=demo.spec.layers.flash,scale=p.scale;p.scale=1;let f1=pixels('flash');p.scale=1.5;let f2=pixels('flash');p.scale=scale;return{bladeBefore:before,bladeAfter:after,flashBefore:f1,flashAfter:f2,restored:demo.h.thickness===old}})()""")
assert d['bladeAfter']>d['bladeBefore']and d['flashAfter']>d['flashBefore']and d['restored'];save('parameter-audit.json',d)
run('goto','--page',PAGE,'--url',(P/'preview.html').as_uri())
d=ev("(async()=>{await battle.decode();demo.seek(.32);return {protocol:location.protocol,hasPlayer:!!window.demo,backgroundLoaded:battle.naturalWidth>0,canvasWidth:canvas.width}})()")
assert d['protocol']=='file:'and d['hasPlayer']and d['backgroundLoaded'];save('standalone-audit.json',d)
run('goto','--page',PAGE,'--url','http://127.0.0.1:5202/preview.html');save('browser-console.json',run('console','--page',PAGE,'--limit','20'))
checks=[]
for bg in ['grey','green','dark','battle']:
 f=P/f'impact-{bg}.mp4';r=subprocess.run(['ffprobe','-v','error','-select_streams','v:0','-show_entries','stream=width,height,nb_frames,r_frame_rate,duration','-of','json',str(f)],capture_output=True,text=True,check=True);s=json.loads(r.stdout)['streams'][0]
 assert s['nb_frames']=='72'and float(s['duration'])==1.2
 subprocess.run(['ffmpeg','-v','error','-i',str(f),'-f','null','-'],check=True,capture_output=True);checks.append(dict(file=f.name,decode='pass',**s))
 im=Image.open(P/f'impact-{bg}.gif');total=0
 for i in range(im.n_frames):im.seek(i);total+=im.info.get('duration',0)
 assert total==1200 and im.info.get('loop')==0
 checks.append(dict(file=f'impact-{bg}.gif',durationMs=total,loop=0,alpha=False))
save('media-audit.json',checks)
print('GROUND SLASH VIEWER/MEDIA QA PASS')


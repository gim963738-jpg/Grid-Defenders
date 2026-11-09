from pathlib import Path
import subprocess,json,shutil
P=Path(__file__).resolve().parent
cli=r'C:/Users/user/AppData/Local/Programs/orca/resources/bin/orca.exe'
page='e1e963b1-46f9-4608-b584-5757e5430392'
def run(*args):
 r=subprocess.run([cli,*args,'--json'],capture_output=True,encoding='utf-8')
 d=json.loads(r.stdout)
 assert d.get('ok'),d
 return d['result']
def ev(s):
 r=run('eval','--page',page,'--expression',s)['result']
 try:return json.loads(r)
 except:return r
def save(name,data):(P/name).write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
run('reload','--page',page)
ev('demo.exportFrames()')
save('editable-plans.json',ev('demo.plans'))
measure="""demo.seek(1.31); ({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,canvas:document.querySelector('canvas').getBoundingClientRect().toJSON(),controls:[...document.querySelectorAll('button,select,label')].map(e=>({tag:e.tagName,width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height}))})"""
for width in [320,390,1100]:
 run('viewport','--page',page,'--width',str(width),'--height','850','--scale','1',*(['--mobile'] if width<500 else []))
 d=ev(measure);assert d['width']==d['scrollWidth'],d
 assert all(x['height']>=47.9 and x['width']>=47.9 for x in d['controls']),d
 save(f'mobile-{width}.json',d)
 shot=run('screenshot','--page',page)
 shutil.copyfile(shot['path'],P/f'preview-{width}.png')
playback=ev("""(async()=>{let checks=[];for(const rate of [.25,.5,1,2]){demo.seek(0);let s=document.querySelector('#speed');s.value=rate<1?String(rate).slice(1):String(rate);s.dispatchEvent(new Event('change'));document.querySelector('#play').click();let start=performance.now();await new Promise(r=>setTimeout(r,900));let a=demo.state(),real=(performance.now()-start)/1000;document.querySelector('#play').click();let paused=demo.state().t;await new Promise(r=>setTimeout(r,100));checks.push({rate,real,elapsed:a.t,ratio:a.t/real,pauseStable:demo.state().t===paused});}document.querySelector('#restart').click();checks.push({restart:demo.state().t===0});document.querySelector('#loop').checked=false;document.querySelector('#loop').dispatchEvent(new Event('change'));demo.seek(1.95);document.querySelector('#play').click();await new Promise(r=>setTimeout(r,250));checks.push({nonLoopStops:demo.state().t===2&&!demo.state().playing});document.querySelector('#loop').checked=true;document.querySelector('#loop').dispatchEvent(new Event('change'));document.querySelector('#play').click();await new Promise(r=>setTimeout(r,150));checks.push({loopRestarts:demo.state().t<2});document.querySelector('#speed').value='1';document.querySelector('#speed').dispatchEvent(new Event('change'));return checks})()""")
assert all(d.get('pauseStable',True) for d in playback),playback
assert all(abs(d['ratio']-d['rate'])<.15 for d in playback if 'ratio'in d),playback
assert playback[-3]['restart'] and playback[-2]['nonLoopStops'] and playback[-1]['loopRestarts'],playback
save('playback-audit.json',playback)
backgrounds=ev("""(()=>{demo.seek(.26);let out=[];for(let v of ['grey','green','dark','battle']){let b=document.querySelector('#bg');b.value=v;b.dispatchEvent(new Event('change'));out.push(demo.state().background)}return out})()""")
assert backgrounds==['grey','green','dark','battle'];save('background-audit.json',backgrounds)
save('browser-console.json',run('console','--page',page,'--limit','20'))
print('BROWSER QA PASS',flush=True)

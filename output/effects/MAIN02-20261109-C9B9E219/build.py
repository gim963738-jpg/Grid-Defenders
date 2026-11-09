from pathlib import Path
import json,shutil,argparse
P=Path(__file__).resolve().parent
OLD=P.parent/'MAIN02-20261109-78E189DC-v003'
ap=argparse.ArgumentParser();ap.add_argument('--spec');args=ap.parse_args()
spec=dict(task='MAIN02-20261109-C9B9E219',iteration=1,role='effects',format='gd.ground-slash-vfx@1',fps=60,frameCount=72,duration=1.2,content=[960,540],padding=16,cell=[992,572],pivotSource=[480,425],pivotPadded=[496,441],alpha=True,background='transparent',impactCount=1,damage=None,range=None,gameIntegration=False,finalSpeedApproved=False,permanentGroundDamage=False,
 slash=dict(start=.12,sweep=.18,duration=.31,radiusX=300,radiusY=190,thickness=76,lengthScale=1,rotation=0,startAngle=-115,endAngle=90,clockwise=True),
 layers={
 'slash':dict(offset=[0,0],angle=0,scale=1,opacity=1),
 'flash':dict(delay=0,duration=.09,size=1,offset=[0,0],angle=0,scale=1,opacity=1),
 'ground':dict(delay=0,duration=.55,width=1,offset=[0,0],angle=-7,scale=1,opacity=1),
 'debris':dict(delay=0,duration=.55,count=24,seed=219,gravity=1500,speed=1,offset=[0,0],angle=0,scale=1,opacity=1),
 'dust':dict(delay=.016666666666666666,duration=.60,count=22,seed=931,spread=1,offset=[0,0],angle=0,scale=1,opacity=.8)})
if args.spec:spec=json.loads(Path(args.spec).read_text(encoding='utf-8-sig'))
spec['contactTime']=round(spec['slash']['start']+spec['slash']['sweep'],8)
spec['contactFrameAtStart']=round(spec['contactTime']*60)+1
spec['visualImpactCompletedFrame']=round(spec['contactTime']*60)
spec['sourceRect']=[16,16,960,540]
spec['notes']={'impactFrame':'Visual contact at time 0.3s = completion of logical frame18, sampled frame19; no game damage event.','pivot':'All layer frame anchors are ground contact; slash ellipse center is derived separately.','alpha':'Straight RGBA PNG; composites MP4/GIF have no alpha.','adjust':'Edit independent JSON copy, run build.py --spec copy.json, render via serve.py and demo.exportFrames(), then export.py.'}
for k,v in spec['layers'].items():
 v['start']=spec['slash']['start'] if k=='slash' else spec['contactTime']+v['delay']
 v['end']=v['start']+(spec['slash']['duration'] if k=='slash' else v['duration'])
spec['sheets']={k:dict(file=k+'-sheet.png',columns=8,rows=9,frames=[dict(frame=i+1,rect=[i%8*992,i//8*572,992,572],pivot=spec['pivotPadded'],durationMs=1000/60,file=f'frames/{k}/frame-{i:03}.png') for i in range(72)]) for k in ['combined',*spec['layers']]}
(P/'effect.json').write_text(json.dumps(spec,ensure_ascii=False,indent=2),encoding='utf-8')
src=(OLD/'renderer.js').read_text(encoding='utf-8')
functions=src[src.index('function point('):src.index('function effect(')]
# Existing smooth radial white blade mesh retained without modifying its source.
renderer='const spec='+json.dumps(spec,ensure_ascii=False)+';\n'+"""
const canvas=document.querySelector('canvas'),ctx=canvas.getContext('2d');
const fx=document.createElement('canvas');fx.width=992;fx.height=572;const fc=fx.getContext('2d');
const layer=document.createElement('canvas');layer.width=992;layer.height=572;const lc=layer.getContext('2d');
const out=document.createElement('canvas');out.width=992;out.height=572;const oc=out.getContext('2d');
const clamp=x=>Math.max(0,Math.min(1,x));
const battle=new Image();battle.src='battlefield-display.png';
const h={...spec.slash,pivot:[0,0]};const endOffset=point(h,1,0);h.pivot=[spec.pivotSource[0]-endOffset[0]+16,spec.pivotSource[1]-endOffset[1]+16];
"""+functions+"""
function rng(seed){return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296}}
function poly(ps,color){fc.beginPath();ps.forEach((p,i)=>i?fc.lineTo(...p):fc.moveTo(...p));fc.closePath();fc.fillStyle=color;fc.fill()}
function line(ps,color,width){fc.beginPath();ps.forEach((p,i)=>i?fc.lineTo(...p):fc.moveTo(...p));fc.strokeStyle=color;fc.lineWidth=width;fc.lineJoin='round';fc.stroke()}
function flash(a,p){let q=a/p.duration;if(q<0||q>=1)return;fc.globalAlpha=(1-q)**2;fc.save();fc.scale(p.size,p.size);let r=1+q*.35;let g=fc.createRadialGradient(0,0,0,0,0,55*r);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.25,'rgba(255,255,255,.7)');g.addColorStop(1,'rgba(255,255,255,0)');fc.fillStyle=g;fc.fillRect(-60*r,-60*r,120*r,120*r);poly([[-76,1],[-14,-7],[-3,-49],[7,-8],[66,-2],[13,7],[0,17],[-11,8]],'#fff');fc.restore()}
function ground(a,p){let q=a/p.duration;if(q<0||q>=1)return;let grow=clamp(a/.055);fc.scale(p.width,1);fc.globalAlpha=clamp(a/.016+.3)*Math.pow(1-clamp((q-.45)/.55),1.4);fc.scale(grow,grow);
 // A jagged elongated gouge with chipped lips; no opaque ground plate.
 poly([[-100,0],[-72,-7],[-51,-5],[-23,-13],[1,-10],[28,-14],[59,-6],[96,-3],[114,1],[77,7],[45,9],[12,15],[-19,9],[-54,10],[-78,5]],'#746e65');
 poly([[-87,0],[-54,-3],[-21,-6],[7,-4],[36,-8],[78,-2],[99,0],[47,4],[9,8],[-33,3]],'#383734');
 line([[-99,1],[-69,8],[-42,10],[-13,12],[15,16],[42,10],[78,8],[109,2]],'#b2aaa0',2.5);
 const branches=[[[14,4],[35,18],[58,17],[77,26],[107,26]],[[40,-3],[57,-16],[74,-13],[91,-25],[110,-26]],[[-22,2],[-48,17],[-59,15],[-83,28],[-106,25]],[[-37,-4],[-59,-17],[-77,-13],[-101,-22]],[[-3,8],[1,27],[-14,34],[-9,42]],[[67,1],[94,11],[127,9],[147,17]]];
 branches.forEach((b,i)=>{line(b,'#4b4842',i<4?2.8:1.9);line(b.map(([x,y])=>[x,y+1.7]),'#b9b1a6',.8)});
 for(let i=0;i<9;i++){let x=-77+i*19,y=(i%2?10:-9);poly([[x-6,y],[x+2,y-4],[x+10,y+1],[x+3,y+5]],i%2?'#9d9487':'#c0b7aa')}
}
function debris(a,p){if(a<0||a>=p.duration)return;let rand=rng(p.seed);for(let i=0;i<p.count;i++){let side=i%2?1:-1,vx=side*(130+rand()*310)*p.speed,vy=190+rand()*260,depth=(rand()-.5)*32,sz=2+rand()*6,rot=rand()*6.28,spin=(rand()-.5)*22;let flight=2*vy/p.gravity;if(a>flight+.035)continue;let x=vx*a,y=depth-vy*a+.5*p.gravity*a*a;fc.save();fc.translate(x,y);fc.rotate(rot+spin*a);fc.globalAlpha=clamp(a/.025)*Math.min(1,(p.duration-a)/.15)*clamp((flight+.035-a)/.07);poly([[-sz,-sz*.4],[sz*.1,-sz],[sz,0],[sz*.4,sz*.8],[-sz*.8,sz*.6]],'#827b70');poly([[-sz,-sz*.4],[sz*.1,-sz],[sz,0],[-sz*.1,0]],'#c7bfb0');line([[-sz*.8,sz*.6],[sz*.4,sz*.8],[sz,0]],'#56534e',.8);fc.restore()}}
function dust(a,p){if(a<0||a>=p.duration)return;let rand=rng(p.seed);for(let i=0;i<p.count;i++){let side=i%2?1:-1,v=90+rand()*280,delay=rand()*.045,age=a-delay;if(age<0)continue;let q=age/p.duration,x=side*v*.23*(1-Math.exp(-age/ .23))*p.spread,y=(rand()-.5)*22-12*Math.sin(q*Math.PI),r=(4+rand()*9)*(1+q*2.4);fc.save();fc.translate(x,y);fc.scale(1.6,.58);let grad=fc.createRadialGradient(0,0,0,0,0,r);grad.addColorStop(0,'rgba(164,155,139,'+(.38*(1-q)**2*clamp(age/.03))+')');grad.addColorStop(.6,'rgba(164,155,139,'+(.16*(1-q)**2*clamp(age/.03))+')');grad.addColorStop(1,'rgba(164,155,139,0)');fc.fillStyle=grad;fc.fillRect(-r,-r,r*2,r*2);fc.restore()}}
function effect(time,only='combined'){oc.clearRect(0,0,992,572);for(let name of ['ground','dust','slash','flash','debris']){if(only!=='combined'&&name!==only)continue;let p=spec.layers[name];fc.clearRect(0,0,992,572);fc.save();fc.translate(16+spec.pivotSource[0]+p.offset[0],16+spec.pivotSource[1]+p.offset[1]);fc.rotate(p.angle*Math.PI/180);fc.scale(p.scale,p.scale);if(name==='slash'){fc.restore();drawHit(h,time-h.start)}else{({flash,ground,debris,dust})[name](time-p.start,p);fc.restore()}oc.save();oc.globalAlpha=p.opacity;if(name==='slash'){oc.translate(16+spec.pivotSource[0]+p.offset[0],16+spec.pivotSource[1]+p.offset[1]);oc.rotate(p.angle*Math.PI/180);oc.scale(p.scale,p.scale);oc.translate(-16-spec.pivotSource[0],-16-spec.pivotSource[1])}oc.drawImage(fx,0,0);oc.restore()}return out}
let t=0,playing=true,loop=true,speed=1,last=performance.now(),background='grey',selection='combined';
function render(){ctx.fillStyle=background==='dark'?'#101a25':background==='green'?'#A5C9A0':'#DADFE3';ctx.fillRect(0,0,992,572);if(background==='battle'&&battle.complete&&battle.naturalWidth)ctx.drawImage(battle,0,0,992,572);ctx.drawImage(effect(t,selection),0,0);document.querySelector('#play').textContent=playing?'일시정지':'재생';document.querySelector('#scrub').value=Math.min(72,Math.floor(t*60)+1);document.querySelector('#status').textContent=`${t<spec.contactTime?'접촉 전':'충격 1 / 1'} · ${t.toFixed(3)}s · 프레임 ${Math.min(72,Math.floor(t*60)+1)} / 72`;}
function tick(now){let dt=(now-last)/1000;last=now;if(playing){t+=dt*speed;if(t>=spec.duration){if(loop)t%=spec.duration;else{t=spec.duration;playing=false}}}render();requestAnimationFrame(tick)}
document.querySelector('#play').onclick=()=>{playing=!playing;last=performance.now()};document.querySelector('#restart').onclick=()=>{t=0;last=performance.now();render()};document.querySelector('#loop').onchange=e=>loop=e.target.checked;document.querySelector('#speed').onchange=e=>speed=+e.target.value;document.querySelector('#bg').onchange=e=>{background=e.target.value;render()};document.querySelector('#layer').onchange=e=>{selection=e.target.value;render()};
function seekFrame(i){playing=false;t=Math.max(0,Math.min(71,i-1))/60;render()}
document.querySelector('#scrub').oninput=e=>seekFrame(+e.target.value);document.querySelector('#prev').onclick=()=>seekFrame(Math.floor(t*60));document.querySelector('#next').onclick=()=>seekFrame(Math.floor(t*60)+2);
window.demo={spec,h,point,effect,seek:x=>{playing=false;t=x;render()},seekFrame,state:()=>({t,playing,loop,speed,background,selection}),exportFrames:async()=>{playing=false;for(let group of ['combined',...Object.keys(spec.layers)])for(let i=0;i<72;i++){let data=effect(i/60,group).toDataURL('image/png').split(',')[1];let r=await fetch('/save/'+group+'/frame-'+String(i).padStart(3,'0')+'.png',{method:'POST',body:data});if(!r.ok)throw Error(group+i)}return '432 RGBA frames exported'}};
requestAnimationFrame(tick);
"""
renderer=renderer.replace("const battle=new Image();battle.src='battlefield-display.png';", "const battle=new Image();battle.src='battlefield-display.png';const atlases={};for(let name of ['combined',...Object.keys(spec.layers)]){let im=new Image();im.src=name+'-sheet.png';atlases[name]=im}")
renderer=renderer.replace('ctx.drawImage(effect(t,selection),0,0);',"let atlas=atlases[selection],fi=Math.min(71,Math.floor(t*60));if(atlas.complete&&atlas.naturalWidth)ctx.drawImage(atlas,fi%8*992,Math.floor(fi/8)*572,992,572,0,0,992,572);else ctx.drawImage(effect(t,selection),0,0);")
(P/'renderer.js').write_text(renderer,encoding='utf-8')
html='''<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>흰 내려베기 · 지면 충격 1타</title><style>*{box-sizing:border-box}body{margin:0;background:#19212b;color:#edf1f6;font:14px system-ui}main{max-width:1100px;margin:auto;padding:12px}h1{font-size:19px;margin:4px 0 12px}canvas{display:block;width:100%;height:auto;border-radius:8px}.controls{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0;align-items:center}button,select{min-height:48px;min-width:48px;font:14px system-ui;border:1px solid #657082;border-radius:6px;padding:8px;background:#273443;color:white}label{display:flex;gap:7px;align-items:center;min-height:48px}input[type=checkbox]{width:22px;height:22px}input[type=range]{width:100%;height:48px}p{line-height:1.5}small{font-size:12px}a{color:#c5e1ff}#status{font-variant-numeric:tabular-nums}</style><main><h1>흰 내려베기 · 지면 충격 1타</h1><canvas width="992" height="572"></canvas><div class="controls"><button id="play">일시정지</button><button id="restart">재시작</button><button id="prev">이전</button><button id="next">다음</button><label><input id="loop" type="checkbox" checked>반복</label><label>배속<select id="speed"><option>.25</option><option>.5</option><option selected>1</option><option>2</option><option>5</option></select></label><label>배경<select id="bg"><option value="grey">밝은 회색</option><option value="green">초록</option><option value="dark">어두운</option><option value="battle">전장 합성</option></select></label><label>레이어<select id="layer"><option value="combined">전체</option><option value="slash">검격</option><option value="flash">접점 섬광</option><option value="ground">패임·균열</option><option value="debris">돌파편</option><option value="dust">먼지</option></select></label></div><input id="scrub" aria-label="프레임" type="range" min="1" max="72" value="1"><p id="status"></p><p>1× · 1.2초는 제안 초기값입니다. 최종 속도·두께·파괴 규모는 사용자가 결정합니다.<br><small>캐릭터 없는 독립 VFX · 전장 화면은 기존 배경 위 합성입니다. 게임 통합·영구 지형 파괴가 아닙니다.</small></p><p><a href="combined-sheet.png">투명 통합 시트</a> · <a href="impact-battle.mp4">전장 MP4</a> · <a href="impact-dark.gif">반복 GIF</a> · <a href="effect.json">조정 명세</a></p></main><script>'''+renderer+'</script></html>'
(P/'preview.html').write_text(html,encoding='utf-8')
shutil.copy2(OLD/'battlefield-display.png',P/'battlefield-display.png')
shutil.copy2(OLD/'renderer.js',P/'reference-v003-renderer.js')
print('effect.json, renderer.js, offline preview.html built')

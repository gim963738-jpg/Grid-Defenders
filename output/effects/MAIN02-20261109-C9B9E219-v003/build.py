from pathlib import Path
import json,shutil,argparse
P=Path(__file__).resolve().parent
OLD=P.parent/'MAIN02-20261109-78E189DC-v003'
ap=argparse.ArgumentParser();ap.add_argument('--spec');args=ap.parse_args()
spec=dict(task='MAIN02-20261109-C9B9E219',iteration=3,role='effects',format='gd.ground-slash-vfx@1',fps=60,frameCount=72,duration=1.2,content=[960,540],padding=16,cell=[992,572],pivotSource=[480,425],pivotPadded=[496,441],alpha=True,background='transparent',impactCount=1,damage=None,range=None,gameIntegration=False,finalSpeedApproved=False,permanentGroundDamage=False,
 slash=dict(start=.12,sweep=.18,duration=.31,radiusX=320,radiusY=250,thickness=110,lengthScale=1,rotation=0,startAngle=-45,endAngle=45,clockwise=True),
 layers={
 'slash':dict(offset=[0,0],angle=0,scale=1,opacity=1),
 'rays':dict(delay=1/60,duration=.34,size=1,offset=[0,0],angle=0,scale=1,opacity=1),
 'sparks':dict(delay=.035,duration=.37,count=27,seed=731,offset=[0,0],angle=0,scale=1,opacity=1),
 'flash':dict(delay=0,duration=.15,size=1,offset=[0,0],angle=0,scale=1,opacity=1),
 'ground':dict(delay=0,duration=.35,width=.9,offset=[0,0],angle=-7,scale=1,opacity=1),
 'debris':dict(delay=0,duration=.38,count=7,seed=219,gravity=1550,speed=.86,offset=[0,0],angle=0,scale=1,opacity=1),
 'dust':dict(delay=.016666666666666666,duration=.40,count=10,seed=931,spread=1,offset=[0,0],angle=0,scale=1,opacity=.8)})
spec['rayDesign']=[[-174,151,11,.003],[-154,221,18,.013],[-143,172,10,0],[-126,299,24,.006],[-114,192,11,.018],[-100,247,17,0],[-88,164,13,.011],[-75,284,23,.016],[-60,206,13,.004],[-42,257,22,.008],[-25,177,10,.019],[-8,202,15,.002]]
spec['layers']['rays'].update(growthTau=.028,tearStart=.105,tearDuration=.15,detachDistance=43)
spec['phases']={'contact':.3,'compressedCore':[.3,.335],'fanGrowth':[.317,.40],'tearAndDetach':[.422,.657],'particles':[.335,.705],'allClearBy':.717,'rayDesignFields':['angleDegrees','lengthPx','halfWidthPx','delaySeconds']}
if args.spec:spec=json.loads(Path(args.spec).read_text(encoding='utf-8-sig'))
spec['contactTime']=round(spec['slash']['start']+spec['slash']['sweep'],8)
spec['contactFrameAtStart']=round(spec['contactTime']*60)+1
spec['visualImpactCompletedFrame']=round(spec['contactTime']*60)
spec['sourceRect']=[16,16,960,540]
spec['notes']={'impactFrame':'Visual contact at time 0.3s = completion of logical frame18, sampled frame19; no game damage event.','pivot':'All layer frame anchors are ground contact; slash ellipse center is derived separately.','alpha':'Straight RGBA PNG; composites MP4/GIF have no alpha.','adjust':'Edit independent JSON copy, run build.py --spec copy.json, render via serve.py and demo.exportFrames(), then export.py.'}
for k,v in spec['layers'].items():
 v['start']=spec['slash']['start'] if k=='slash' else spec['contactTime']+v['delay']
 v['end']=v['start']+(spec['slash']['duration'] if k=='slash' else v['duration'])
spec['sheets']={k:dict(file=k+'-sheet.png',columns=8,rows=9,frames=[dict(frame=i+1,rect=[i%8*992,i//8*572,992,572],pivot=spec['pivotPadded'],durationMs=1000/60,file=f'frames/{k}/frame-{i:03}.png') for i in range(72)]) for k in ['combined','impact',*spec['layers']]}
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

function flash(a,p){let q=a/p.duration;if(q<0||q>=1)return;let z=1+Math.sin(Math.PI*q)*.25;fc.scale(p.size,p.size);fc.globalAlpha=(1-q)**1.35;
 fc.save();fc.scale(1,.55);let g=fc.createRadialGradient(-4,-24,2,0,-20,98);g.addColorStop(0,'rgba(255,255,255,.95)');g.addColorStop(.36,'rgba(255,255,255,.55)');g.addColorStop(1,'rgba(255,255,255,0)');fc.fillStyle=g;fc.fillRect(-110,-130,220,220);fc.restore();
 fc.save();fc.scale(z,1);fc.beginPath();fc.moveTo(-67,1);fc.bezierCurveTo(-51,-4,-51,-20,-34,-21);fc.bezierCurveTo(-26,-38,-14,-24,-5,-36);fc.bezierCurveTo(8,-50,20,-32,29,-30);fc.bezierCurveTo(44,-34,40,-14,54,-9);fc.bezierCurveTo(59,-3,66,-3,68,1);fc.bezierCurveTo(42,12,-35,14,-67,1);fc.fillStyle='#fff';fc.fill();fc.restore();
}
const rayDesign=spec.rayDesign;
function ribbon(ps,alpha,blur=0){fc.save();fc.globalAlpha=alpha;fc.filter=blur?`blur(${blur}px)`:'none';poly(ps,'#fff');fc.restore()}
function rays(a,p){if(a<0||a>=p.duration)return;for(let i=0;i<rayDesign.length;i++){let [ang,len,w,delay]=rayDesign[i],age=a-delay;if(age<=0)continue;let grow=1-Math.exp(-age/p.growthTau),q=clamp(age/p.duration),tear=clamp((age-p.tearStart)/p.tearDuration),base=(tear**1.3)*len*.70,tip=len*grow+tear*27,thick=w*(1-.83*tear),bend=(i%2?1:-1)*(9+tear*12);if(base>=tip)continue;fc.save();fc.rotate(ang*Math.PI/180);fc.scale(p.size,p.size);
 // Broad irregular face; unequal shoulders, hooked ridge, offset pointed tip.
 let ps=[[base,-thick*.12],[base+(tip-base)*.20,-thick*.45],[base+(tip-base)*.36,-thick],[base+(tip-base)*.52,-thick*.68],[tip,-bend*.25],[base+(tip-base)*.62,thick*.48+bend*.12],[base+(tip-base)*.37,thick*.65],[base,thick*.18]];
 let alpha=clamp(age/.012)*(1-q)**.8;ribbon(ps,.18*alpha,5);ribbon(ps,.56*alpha,1);ribbon([[base,0],[base+(tip-base)*.40,-thick*.42],[tip,-bend*.25],[base+(tip-base)*.51,thick*.14]],.9*alpha);
 if(tear>0){let shift=15+tear*p.detachDistance,at=tip+shift;let splinter=[[at-13,-bend*.25-3],[at+16,-bend*.28],[at+2,-bend*.25+2]];ribbon(splinter,.55*alpha*tear);}
 fc.restore();}
 // The low contact face also breaks into outward shards, never a full circular ring.
 let q=clamp(a/p.duration),x=37+205*(1-Math.exp(-a/.085)),fade=(1-q)**1.4;
 for(let side of [-1,1]){fc.save();fc.scale(side,1);ribbon([[x*.12,0],[x*.35,-7],[x,-3],[x*.65,4],[x*.27,6]],.68*fade);fc.restore()}
}
function sparks(a,p){if(a<0||a>=p.duration)return;let rand=rng(p.seed);for(let i=0;i<p.count;i++){let delay=rand()*.055,age=a-delay;if(age<=0)continue;let ang=(-173+rand()*167)*Math.PI/180,v=220+rand()*460,len=5+rand()*14,distance=42+v*age,x=Math.cos(ang)*distance,y=Math.sin(ang)*distance+110*age*age,q=clamp(age/p.duration),width=.6+rand()*1.5;fc.save();fc.translate(x,y);fc.rotate(ang+.18*age);fc.globalAlpha=clamp(age/.012)*(1-q)**1.4;poly([[-len*(1-q),0],[0,-width],[len*.35*(1-q),0],[0,width]],'#fff');fc.restore()}}
function ground(a,p){let q=a/p.duration;if(q<0||q>=1)return;let grow=clamp(a/.075);fc.scale(p.width,1);fc.globalAlpha=clamp(a/.025)*Math.pow(1-clamp((q-.43)/.57),1.25);
 // Flat painted abrasion with a shallow contact stain, no dark cavity or bevel lip.
 fc.save();fc.scale(grow,1);poly([[-109,0],[-79,-9],[-38,-12],[5,-10],[46,-13],[89,-6],[112,0],[78,9],[30,12],[-12,10],[-64,11]],'rgba(145,137,121,.24)');
 line([[-93,0],[-62,-3],[-27,-1],[0,-4],[34,-1],[67,-5],[100,-2]],'#716c60',2.5);
 line([[-76,3],[-36,5],[5,2],[41,5],[79,2]],'rgba(190,180,158,.7)',2);fc.restore();
 const branches=[[[0,0],[21,10],[43,8],[57,19],[87,17],[106,25]],[[14,-1],[33,-13],[51,-10],[67,-23],[94,-24]],[[-5,2],[-27,14],[-42,11],[-64,25],[-86,20]],[[-18,-2],[-39,-14],[-60,-12],[-82,-22]],[[-6,4],[-3,20],[-19,28],[-12,37]],[[47,1],[72,11],[97,8],[123,16]]];
 for(let i=0;i<branches.length;i++){let path=branches[i],n=(path.length-1)*grow,ps=path.slice(0,Math.floor(n)+1);if(n%1&&Math.ceil(n)<path.length){let b=path[Math.floor(n)],c=path[Math.ceil(n)],f=n%1;ps.push([b[0]+(c[0]-b[0])*f,b[1]+(c[1]-b[1])*f])}if(ps.length>1)line(ps,i%2?'#777060':'#625f55',i<4?2.3:1.7)}
 for(let i=0;i<7;i++){let x=-67+i*21,y=i%2?8:-7;line([[x-5,y],[x+4,y-2]],'#9d9583',1.6)}
}
function debris(a,p){if(a<0||a>=p.duration)return;let rand=rng(p.seed);for(let i=0;i<p.count;i++){let side=i%2?1:-1,vx=side*(110+rand()*300)*p.speed,vy=170+rand()*180,depth=(rand()-.5)*22,sz=2.2+rand()*4.8,rot=rand()*6.28,spin=(rand()-.5)*14;let flight=2*vy/p.gravity;if(a>flight+.025)continue;let x=vx*a,y=depth-vy*a+.5*p.gravity*a*a;fc.save();fc.translate(x,y);fc.rotate(rot+spin*a);fc.globalAlpha=clamp(a/.025)*clamp((flight+.025-a)/.08)*clamp((p.duration-a)/.12);poly([[-sz,-sz*.3],[sz*.2,-sz*.7],[sz,sz*.1],[-sz*.2,sz*.65]],i%3?'#a29a88':'#746f63');if(i%3===0)line([[-sz,-sz*.3],[sz*.2,-sz*.7],[sz,sz*.1]],'#bfb69f',.9);fc.restore()}}
function dust(a,p){if(a<0||a>=p.duration)return;let rand=rng(p.seed);for(let i=0;i<p.count;i++){let side=i%2?1:-1,v=140+rand()*300,delay=rand()*.04,age=a-delay;if(age<0)continue;let q=clamp(age/p.duration),x=side*v*.25*(1-Math.exp(-age/.25))*p.spread,y=(rand()-.5)*18-6*Math.sin(q*Math.PI),r=(6+rand()*11)*(1+q*1.6);fc.save();fc.translate(x,y);fc.scale(1.8,.48);fc.globalAlpha=clamp(age/.028)*(1-q)**1.8;
 // Two simple flat ink masses with a little edge softness, rather than volumetric smoke.
 fc.beginPath();fc.moveTo(-r,0);fc.bezierCurveTo(-r*.9,-r*.55,-r*.4,-r*.9,-r*.05,-r*.65);fc.bezierCurveTo(r*.3,-r*1.1,r*.8,-r*.4,r,0);fc.bezierCurveTo(r*.8,r*.33,-r*.7,r*.5,-r,0);fc.fillStyle='rgba(171,160,139,.19)';fc.fill();fc.beginPath();fc.ellipse(r*.15,r*.12,r*.72,r*.22,0,0,Math.PI*2);fc.fillStyle='rgba(193,180,154,.12)';fc.fill();fc.restore()}}
function effect(time,only='combined'){oc.clearRect(0,0,992,572);for(let name of ['ground','dust','slash','flash','rays','debris','sparks']){if(only==='impact'&&name==='slash')continue;if(only!=='combined'&&only!=='impact'&&name!==only)continue;let p=spec.layers[name];fc.clearRect(0,0,992,572);fc.save();fc.translate(16+spec.pivotSource[0]+p.offset[0],16+spec.pivotSource[1]+p.offset[1]);fc.rotate(p.angle*Math.PI/180);fc.scale(p.scale,p.scale);if(name==='slash'){fc.restore();drawHit(h,time-h.start)}else{({flash,rays,sparks,ground,debris,dust})[name](time-p.start,p);fc.restore()}oc.save();oc.globalAlpha=p.opacity;if(name==='slash'){oc.translate(16+spec.pivotSource[0]+p.offset[0],16+spec.pivotSource[1]+p.offset[1]);oc.rotate(p.angle*Math.PI/180);oc.scale(p.scale,p.scale);oc.translate(-16-spec.pivotSource[0],-16-spec.pivotSource[1])}oc.drawImage(fx,0,0);oc.restore()}return out}
let t=0,playing=true,loop=true,speed=1,last=performance.now(),background='grey',selection='combined';
function render(){ctx.fillStyle=background==='dark'?'#101a25':background==='green'?'#A5C9A0':'#DADFE3';ctx.fillRect(0,0,992,572);if(background==='battle'&&battle.complete&&battle.naturalWidth)ctx.drawImage(battle,0,0,992,572);ctx.drawImage(effect(t,selection),0,0);document.querySelector('#play').textContent=playing?'일시정지':'재생';document.querySelector('#scrub').value=Math.min(72,Math.floor(t*60)+1);document.querySelector('#status').textContent=`${t<spec.contactTime?'접촉 전':'충격 1 / 1'} · ${t.toFixed(3)}s · 프레임 ${Math.min(72,Math.floor(t*60)+1)} / 72`;}
function tick(now){let dt=(now-last)/1000;last=now;if(playing){t+=dt*speed;if(t>=spec.duration){if(loop)t%=spec.duration;else{t=spec.duration;playing=false}}}render();requestAnimationFrame(tick)}
document.querySelector('#play').onclick=()=>{playing=!playing;last=performance.now()};document.querySelector('#restart').onclick=()=>{t=0;last=performance.now();render()};document.querySelector('#loop').onchange=e=>loop=e.target.checked;document.querySelector('#speed').onchange=e=>speed=+e.target.value;document.querySelector('#bg').onchange=e=>{background=e.target.value;render()};document.querySelector('#layer').onchange=e=>{selection=e.target.value;render()};
function seekFrame(i){playing=false;t=Math.max(0,Math.min(71,i-1))/60;render()}
document.querySelector('#scrub').oninput=e=>seekFrame(+e.target.value);document.querySelector('#prev').onclick=()=>seekFrame(Math.floor(t*60));document.querySelector('#next').onclick=()=>seekFrame(Math.floor(t*60)+2);
window.demo={spec,h,point,effect,seek:x=>{playing=false;t=x;render()},seekFrame,state:()=>({t,playing,loop,speed,background,selection}),exportFrames:async()=>{playing=false;for(let group of ['combined','impact',...Object.keys(spec.layers)])for(let i=0;i<72;i++){let data=effect(i/60,group).toDataURL('image/png').split(',')[1];let r=await fetch('/save/'+group+'/frame-'+String(i).padStart(3,'0')+'.png',{method:'POST',body:data});if(!r.ok)throw Error(group+i)}return '648 RGBA frames exported'}};
requestAnimationFrame(tick);
"""
renderer=renderer.replace("const battle=new Image();battle.src='battlefield-display.png';", "const battle=new Image();battle.src='battlefield-display.png';const atlases={};for(let name of ['combined','impact',...Object.keys(spec.layers)]){let im=new Image();im.src=name+'-sheet.png';atlases[name]=im}")
renderer=renderer.replace('ctx.drawImage(effect(t,selection),0,0);',"let atlas=atlases[selection],fi=Math.min(71,Math.floor(t*60));if(atlas.complete&&atlas.naturalWidth)ctx.drawImage(atlas,fi%8*992,Math.floor(fi/8)*572,992,572,0,0,992,572);else ctx.drawImage(effect(t,selection),0,0);")
(P/'renderer.js').write_text(renderer,encoding='utf-8')
html='''<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>사분원 내려베기 · 백색 타격 FX</title><style>*{box-sizing:border-box}body{margin:0;background:#19212b;color:#edf1f6;font:14px system-ui}main{max-width:1100px;margin:auto;padding:12px}h1{font-size:19px;margin:4px 0 12px}canvas{display:block;width:100%;height:auto;border-radius:8px}.controls{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0;align-items:center}button,select{min-height:48px;min-width:48px;font:14px system-ui;border:1px solid #657082;border-radius:6px;padding:8px;background:#273443;color:white}label{display:flex;gap:7px;align-items:center;min-height:48px}input[type=checkbox]{width:22px;height:22px}input[type=range]{width:100%;height:48px}p{line-height:1.5}small{font-size:12px}a{color:#c5e1ff}#status{font-variant-numeric:tabular-nums}</style><main><h1>사분원 내려베기 · 백색 타격 FX</h1><canvas width="992" height="572"></canvas><div class="controls"><button id="play">일시정지</button><button id="restart">재시작</button><button id="prev">이전</button><button id="next">다음</button><label><input id="loop" type="checkbox" checked>반복</label><label>배속<select id="speed"><option>.25</option><option>.5</option><option selected>1</option><option>2</option><option>5</option></select></label><label>배경<select id="bg"><option value="grey">밝은 회색</option><option value="green">초록</option><option value="dark">어두운</option><option value="battle">전장 합성</option></select></label><label>레이어<select id="layer"><option value="combined">전체</option><option value="impact">타격 FX 단독</option><option value="slash">검격</option><option value="rays">부채 분출·해체</option><option value="sparks">짧은 빛입자</option><option value="flash">접점 섬광</option><option value="ground">패임·균열</option><option value="debris">돌파편</option><option value="dust">먼지</option></select></label></div><input id="scrub" aria-label="프레임" type="range" min="1" max="72" value="1"><p id="status"></p><p>1× · 1.2초는 제안 초기값입니다. 최종 속도·두께·파괴 규모는 사용자가 결정합니다.<br><small>캐릭터 없는 독립 VFX · 전장 화면은 기존 배경 위 합성입니다. 게임 통합·영구 지형 파괴가 아닙니다.</small></p><p><a href="combined-sheet.png">투명 통합 시트</a> · <a href="impact-battle.mp4">전장 MP4</a> · <a href="impact-dark.gif">반복 GIF</a> · <a href="effect.json">조정 명세</a></p></main><script>'''+renderer+'</script></html>'
(P/'preview.html').write_text(html,encoding='utf-8')
shutil.copy2(OLD/'battlefield-display.png',P/'battlefield-display.png')
shutil.copy2(OLD/'renderer.js',P/'reference-v003-renderer.js')
print('effect.json, renderer.js, offline preview.html built')

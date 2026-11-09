
const spec={"task": "MAIN02-20261109-C970BE7A", "iteration": 2, "role": "effects", "fps": 60, "frames": 120, "duration": 2, "speed": "1x proposal only; user decides", "hits": [{"number": 1, "start": 0.12, "emphasis": 0.185, "fadeStart": 0.197, "end": 0.3, "angle": 27, "length": 760, "curvature": 18, "coreWidth": 2.6, "sweep": 0.065}, {"number": 2, "start": 0.32, "emphasis": 0.395, "fadeStart": 0.407, "end": 0.5, "angle": -34, "length": 700, "curvature": -28, "coreWidth": 3.5, "sweep": 0.075}, {"number": 3, "start": 0.52, "emphasis": 0.575, "fadeStart": 0.587, "end": 0.7, "angle": 151, "length": 745, "curvature": 12, "coreWidth": 2.1, "sweep": 0.055}, {"number": 4, "start": 0.73, "emphasis": 0.81, "fadeStart": 0.822, "end": 0.92, "angle": 218, "length": 675, "curvature": -34, "coreWidth": 3.8, "sweep": 0.08}, {"number": 5, "start": 0.94, "emphasis": 1.005, "fadeStart": 1.017, "end": 1.14, "angle": 68, "length": 460, "curvature": 22, "coreWidth": 2.8, "sweep": 0.065}, {"number": 6, "start": 1.22, "emphasis": 1.31, "fadeStart": 1.322, "end": 1.47, "angle": -16, "length": 815, "curvature": -16, "coreWidth": 4.2, "sweep": 0.09}], "palette": ["#FFFFFF", "#EEEEEE", "#CCCCCC"], "sourceRect": {"x": 0, "y": 0, "width": 960, "height": 540}, "padding": 16, "frameSize": [992, 572], "pivotSource": [480, 270], "pivotPadded": [496, 286], "displayBounds": "entire padded frame; uniform scale around target center", "alpha": true, "alphaFormat": "straight RGBA PNG sequence", "damage": null, "range": null, "hero": null, "combatIntegration": false};
const view=document.querySelector('canvas'),ctx=view.getContext('2d');
const fx=document.createElement('canvas');fx.width=992;fx.height=572;const fc=fx.getContext('2d');
const layer=document.createElement('canvas');layer.width=992;layer.height=572;const lc=layer.getContext('2d');
const battle=new Image();battle.src='battlefield-display.png';
let t=0,playing=true,loop=true,speed=1,last=performance.now(),background='battle';
const clamp=x=>Math.max(0,Math.min(1,x));
function point(h,u,offset=0){let a=h.angle*Math.PI/180,x=(u-.5)*h.length,y=h.curvature*4*(u-.5)**2+offset;return [496+x*Math.cos(a)-y*Math.sin(a),286+x*Math.sin(a)+y*Math.cos(a)]}
function mesh(h,lo,hi,width,offset=0){if(hi<=lo)return;let points=[];for(let j=0;j<=100;j++){let u=lo+(hi-lo)*j/100;let taper=Math.pow(Math.sin(Math.PI*u),.65);points.push({u,w:width*taper*(.55+.45*u)})}lc.beginPath();for(let j=0;j<points.length;j++){let p=points[j],v=point(h,p.u,offset-p.w);j?lc.lineTo(...v):lc.moveTo(...v)}for(let j=points.length-1;j>=0;j--){let p=points[j];lc.lineTo(...point(h,p.u,offset+p.w))}lc.closePath();lc.fillStyle='#FFFFFF';lc.fill();}
function pass(h,lo,hi,width,blur,alpha,offset=0){lc.clearRect(0,0,992,572);mesh(h,lo,hi,width,offset);fc.save();fc.globalAlpha=alpha;fc.filter=blur?`blur(${blur}px)`:'none';fc.drawImage(layer,0,0);fc.restore()}
function effect(time){fc.clearRect(0,0,992,572);for(let h of spec.hits){let age=time-h.start,life=h.end-h.start;if(age<=0||age>=life)continue;
 let head=clamp(age/h.sweep),tail=clamp((age-h.sweep-.018)/(life-h.sweep-.018));
 let intensity=clamp(age/.012)*Math.pow(1-age/life,.60);
 // Soft light volume, narrow middle bloom, razor white core. No colored outline or filled ribbon.
 pass(h,tail,head,h.coreWidth*4,12,.24*intensity);
 pass(h,tail,head,h.coreWidth*1.9,4,.42*intensity);
 pass(h,tail,head,h.coreWidth*.55,.6,.98*intensity);
 pass(h,tail,head,h.coreWidth*.22,0,intensity);
 // One short trailing veil belonging to this same strike, never a persistent crossed scar.
 let echoHead=clamp((age-.012)/h.sweep),echoTail=clamp((age-h.sweep)/(life-h.sweep));
 pass(h,echoTail,echoHead,h.coreWidth*2,7,.14*intensity,5);
 // Small transient energy focus as the blade crosses the fixed target pivot.
 let glint=Math.max(0,1-Math.abs(age-h.sweep*.5)/.018)*.35;
 if(glint>0){fc.save();fc.translate(496,286);fc.rotate(h.angle*Math.PI/180);fc.scale(2.5,.45);let g=fc.createRadialGradient(0,0,0,0,0,12);g.addColorStop(0,`rgba(255,255,255,${glint})`);g.addColorStop(1,'rgba(255,255,255,0)');fc.fillStyle=g;fc.fillRect(-12,-12,24,24);fc.restore()}
 }return fx}
function render(time=t){document.querySelector('#play').textContent=playing?'일시정지':'재생';ctx.clearRect(0,0,992,572);ctx.fillStyle=background==='dark'?'#101E30':background==='green'?'#A5C9A0':'#DADFE3';ctx.fillRect(0,0,992,572);if(background==='battle'&&battle.complete&&battle.naturalWidth)ctx.drawImage(battle,0,0,992,572);ctx.drawImage(effect(time),0,0);document.querySelector('#scrub').value=time;let n=spec.hits.filter(h=>time>=h.emphasis).length;document.querySelector('#status').textContent=`${n} / 6타 · ${time.toFixed(3)}s · 프레임 ${Math.min(120,Math.floor(time*60)+1)} / 120`;}
function tick(now){let dt=(now-last)/1000;last=now;if(playing){t+=dt*speed;if(t>=2){if(loop)t%=2;else{t=2;playing=false}}}render();requestAnimationFrame(tick)}
document.querySelector('#play').onclick=()=>playing=!playing;
document.querySelector('#restart').onclick=()=>{t=0;last=performance.now();render()};
document.querySelector('#loop').onchange=e=>loop=e.target.checked;
document.querySelector('#speed').onchange=e=>speed=+e.target.value;
document.querySelector('#bg').onchange=e=>{background=e.target.value;render()};
document.querySelector('#scrub').oninput=e=>{t=+e.target.value;playing=false;render()};
document.querySelector('#prev').onclick=()=>{playing=false;t=Math.max(0,t-1/60);render()};
document.querySelector('#next').onclick=()=>{playing=false;t=Math.min(2,t+1/60);render()};
window.demo={spec,plans:spec.hits,effect,render,state:()=>({t,playing,loop,speed,background}),seek:x=>{playing=false;t=x;render()},exportFrames:async()=>{playing=false;for(let i=0;i<120;i++){let data=effect(i/60).toDataURL('image/png').split(',')[1];let r=await fetch('/save/frame-'+String(i).padStart(3,'0')+'.png',{method:'POST',body:data});if(!r.ok)throw Error('save failed '+i)}return '120 RGBA frames exported'}};
requestAnimationFrame(tick);

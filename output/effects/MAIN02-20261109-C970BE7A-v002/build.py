from pathlib import Path
import json,shutil,hashlib,re
P=Path(__file__).resolve().parent
OLD=P.parent/'MAIN02-20261109-C970BE7A'
def write(n,s):(P/n).write_text(s,encoding='utf-8')
for name in ['battlefield-source.png','battlefield-display.png','mobile-ui.css']:
 if not (P/name).exists():shutil.copyfile(OLD/name,P/name)
if not (P/'v001-preservation.json').exists():
 oldmanifest=json.loads((OLD/'manifest.json').read_text(encoding='utf-8'))
 write('v001-preservation.json',json.dumps([dict(path=str(OLD/x['path']),sha256=hashlib.sha256((OLD/x['path']).read_bytes()).hexdigest()) for x in oldmanifest],ensure_ascii=False,indent=2))
raw=[(.12,27,760,18,2.6,.065,.18),(.32,-34,700,-28,3.5,.075,.18),(.52,151,745,12,2.1,.055,.18),(.73,218,675,-34,3.8,.08,.19),(.94,68,460,22,2.8,.065,.20),(1.22,-16,815,-16,4.2,.09,.25)]
hits=[dict(number=i+1,start=s,emphasis=round(s+sw,4),fadeStart=round(s+sw+.012,4),end=round(s+life,4),angle=a,length=l,curvature=c,coreWidth=w,sweep=sw) for i,(s,a,l,c,w,sw,life) in enumerate(raw)]
spec=dict(task='MAIN02-20261109-C970BE7A',iteration=2,role='effects',fps=60,frames=120,duration=2,speed='1x proposal only; user decides',hits=hits,palette=['#FFFFFF','#EEEEEE','#CCCCCC'],sourceRect=dict(x=0,y=0,width=960,height=540),padding=16,frameSize=[992,572],pivotSource=[480,270],pivotPadded=[496,286],displayBounds='entire padded frame; uniform scale around target center',alpha=True,alphaFormat='straight RGBA PNG sequence',damage=None,range=None,hero=None,combatIntegration=False)
write('timeline.json',json.dumps(spec,ensure_ascii=False,indent=2))
engine=r'''
const spec=SPEC;
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
'''.replace('SPEC',json.dumps(spec))
write('vfx-renderer.js',engine)
html=(P/'viewer-template.html' if (P/'viewer-template.html').exists() else OLD/'preview.html').read_text(encoding='utf-8')
html=re.sub(r'<script>[\s\S]*?</script>',lambda m:'<script>'+engine+'</script>',html)
html=html.replace('청백 사선 · 6연격','WHITE EDGE · 다각도 6연격').replace('가늘게 가르고, 푸른 바람만 짧게 남는 여섯 번의 검격.','여섯 방향의 날카로운 백색 검광과 순간적으로 감쇠하는 빛.').replace('max="2.5"','max="2"')
write('preview.html',html)
write('editable-plans.json',json.dumps(hits,indent=2))
write('사전확인.md','''# MAIN02-20261109-C970BE7A 차수2 / effects / main02
사용자: 다양한 각도로 베는 느낌을 표현해줘 이펙트 표현 그림체?도 좀 별로다 / 청백색느낌보다는 흰색이 좀더 좋지 / 애니메이션이라기보단 진짜 이펙트 느낌.
확인: 맞아 그느낌이야 진행.
기존 비슷한 사선·푸른 리본 반복을 폐기하고 ↘↗↙↖/급경사/완경사6타를 각기 길이·곡률·두께·시간차로 작성. 희고 날카로운 코어와 다중 부드러운 블룸/잔광을 합성. 끝난 자국은 빨리 지워 오래 누적된X자로 남기지 않음.
차수1 모든 파일 보존, 신규 v002 출력만 수정. 독립 뷰어/원본/영상/검증/비교 외 게임/재료함/공통규정 수정 없음. 사용자 속도·합격 별도. 기존 Canvas 공방 방식의 출력기를 사본에서 확장하고 외부 모델/유료API 호출 없음.
''')
write('전문제작프롬프트.md','''흰색 중심의 실감 나는 게임VFX로 긴 날카로운 검격6타가 순차적으로 빠르게 교차하도록 제작한다. 방향27/-34/151/218/68/-16도, 길이·곡률·원근두께·속도를 각각 다르게 한다. 중성흰색 날/무채색 블룸, 중심은 날카롭고 가장자리는 부드럽게 소멸한다. 만화적 붓터치/셀채색/푸른외곽/불투명 흰막/레이저봉/오래쌓이는X자/추가폭발은 제외한다. 마지막만 같은 언어에서 절제해 강조한다. 1배2초는 제안값으로 조절 가능. 차수1 같은방향/청백색 지시는 최신 사용자 확인으로 대체됨. 구현: 기존 독립 Canvas 출력 도구 사본에서 tapered curved mesh/백색 다중 bloom 합성, 외주 호출0/비용0/모델전환0.
''')
print('V002 BUILD COMPLETE')

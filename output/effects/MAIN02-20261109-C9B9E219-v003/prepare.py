from pathlib import Path
import json
P=Path(__file__).resolve().parent;OLD=P.parent/'MAIN02-20261109-C9B9E219-v002'
for n in ['build.py','export.py','qa.py','browser_helper.py','serve.py']:
 s=(OLD/n).read_text('utf-8-sig').replace('5202','5203')
 if n=='build.py':
  s=s.replace('iteration=2,role=','iteration=3,role=')
  s=s.replace("'flash':dict(delay=0,duration=.09", "'rays':dict(delay=1/60,duration=.34,size=1,offset=[0,0],angle=0,scale=1,opacity=1),\n 'sparks':dict(delay=.035,duration=.37,count=27,seed=731,offset=[0,0],angle=0,scale=1,opacity=1),\n 'flash':dict(delay=0,duration=.105")
  s=s.replace("'ground':dict(delay=0,duration=.55,width=1", "'ground':dict(delay=0,duration=.35,width=.9")
  s=s.replace("'debris':dict(delay=0,duration=.55,count=17", "'debris':dict(delay=0,duration=.38,count=7")
  s=s.replace("'dust':dict(delay=.016666666666666666,duration=.54,count=16", "'dust':dict(delay=.016666666666666666,duration=.40,count=10")
  # Keep previous slash byte-for-byte in default geometry and drawing functions.
  s=s.replace("for k in ['combined',*spec['layers']]", "for k in ['combined','impact',*spec['layers']]")
  s=s.replace("['combined',...Object.keys(spec.layers)]", "['combined','impact',...Object.keys(spec.layers)]")
  begin=s.index('function flash(a,p)');end=s.index('function ground(a,p)',begin)
  s=s[:begin]+r'''
function flash(a,p){let q=a/p.duration;if(q<0||q>=1)return;let z=1+Math.sin(Math.PI*q)*.25;fc.scale(p.size,p.size);fc.globalAlpha=(1-q)**1.35;
 let g=fc.createRadialGradient(-4,-14,2,0,-12,86);g.addColorStop(0,'rgba(255,255,255,.95)');g.addColorStop(.36,'rgba(255,255,255,.55)');g.addColorStop(1,'rgba(255,255,255,0)');fc.fillStyle=g;fc.fillRect(-95,-110,190,140);
 fc.save();fc.scale(z,1);poly([[-69,1],[-47,-8],[-50,-18],[-29,-16],[-28,-35],[-9,-27],[3,-48],[13,-29],[29,-35],[32,-19],[48,-22],[48,-8],[70,-1],[42,9],[8,12],[-31,8]],'#fff');fc.restore();
}
const rayDesign=[[-174,151,11,.003],[-154,221,18,.013],[-143,172,10,0],[-126,299,24,.006],[-114,192,11,.018],[-100,247,17,0],[-88,164,13,.011],[-75,284,23,.016],[-60,206,13,.004],[-42,257,22,.008],[-25,177,10,.019],[-8,202,15,.002]];
function ribbon(ps,alpha,blur=0){fc.save();fc.globalAlpha=alpha;fc.filter=blur?`blur(${blur}px)`:'none';poly(ps,'#fff');fc.restore()}
function rays(a,p){if(a<0||a>=p.duration)return;for(let i=0;i<rayDesign.length;i++){let [ang,len,w,delay]=rayDesign[i],age=a-delay;if(age<=0)continue;let grow=1-Math.exp(-age/.028),q=clamp(age/p.duration),tear=clamp((age-.105)/.15),base=(tear**1.3)*len*.70,tip=len*grow+tear*27,thick=w*(1-.83*tear),bend=(i%2?1:-1)*(9+tear*12);if(base>=tip)continue;fc.save();fc.rotate(ang*Math.PI/180);fc.scale(p.size,p.size);
 // Broad irregular face; unequal shoulders, hooked ridge, offset pointed tip.
 let ps=[[base,-thick*.12],[base+(tip-base)*.20,-thick*.45],[base+(tip-base)*.36,-thick],[base+(tip-base)*.52,-thick*.68],[tip,-bend*.25],[base+(tip-base)*.62,thick*.48+bend*.12],[base+(tip-base)*.37,thick*.65],[base,thick*.18]];
 let alpha=clamp(age/.012)*(1-q)**.8;ribbon(ps,.18*alpha,5);ribbon(ps,.56*alpha,1);ribbon([[base,0],[base+(tip-base)*.40,-thick*.42],[tip,-bend*.25],[base+(tip-base)*.51,thick*.14]],.9*alpha);
 if(tear>0){let shift=15+tear*43,at=tip+shift;let splinter=[[at-13,-bend*.25-3],[at+16,-bend*.28],[at+2,-bend*.25+2]];ribbon(splinter,.55*alpha*tear);}
 fc.restore();}
 // The low contact face also breaks into outward shards, never a full circular ring.
 let q=clamp(a/p.duration),x=37+205*(1-Math.exp(-a/.085)),fade=(1-q)**1.4;
 for(let side of [-1,1]){fc.save();fc.scale(side,1);ribbon([[x*.12,0],[x*.35,-7],[x,-3],[x*.65,4],[x*.27,6]],.68*fade);fc.restore()}
}
function sparks(a,p){if(a<0||a>=p.duration)return;let rand=rng(p.seed);for(let i=0;i<p.count;i++){let delay=rand()*.055,age=a-delay;if(age<=0)continue;let ang=(-173+rand()*167)*Math.PI/180,v=220+rand()*460,len=5+rand()*14,distance=42+v*age,x=Math.cos(ang)*distance,y=Math.sin(ang)*distance+110*age*age,q=clamp(age/p.duration),width=.6+rand()*1.5;fc.save();fc.translate(x,y);fc.rotate(ang+.18*age);fc.globalAlpha=clamp(age/.012)*(1-q)**1.4;poly([[-len*(1-q),0],[0,-width],[len*.35*(1-q),0],[0,width]],'#fff');fc.restore()}}
''' +s[end:]
  s=s.replace("['ground','dust','slash','flash','debris']", "['ground','dust','slash','flash','rays','debris','sparks']")
  s=s.replace("if(only!=='combined'&&name!==only)continue;", "if(only==='impact'&&name==='slash')continue;if(only!=='combined'&&only!=='impact'&&name!==only)continue;")
  s=s.replace('({flash,ground,debris,dust})','({flash,rays,sparks,ground,debris,dust})')
  s=s.replace('<option value="slash">검격</option>', '<option value="impact">타격 FX 단독</option><option value="slash">검격</option><option value="rays">부채 분출·해체</option><option value="sparks">짧은 빛입자</option>')
  s=s.replace("return '432 RGBA frames exported'", "return '648 RGBA frames exported'")
  s=s.replace('사분원 내려베기 · 2D 지면 충격 1타','사분원 내려베기 · 백색 타격 FX')
 if n=='serve.py':s=s.replace('combined|slash|flash|ground|debris|dust','combined|impact|slash|flash|rays|sparks|ground|debris|dust')
 if n=='export.py':s=s.replace("['combined',*S['layers']]", "['combined','impact',*S['layers']]")
 (P/n).write_text(s,'utf-8')
print('V003 source prepared; prior slash geometry unchanged')

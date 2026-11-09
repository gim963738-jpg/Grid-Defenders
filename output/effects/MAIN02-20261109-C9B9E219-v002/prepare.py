from pathlib import Path
import shutil
P=Path(__file__).resolve().parent;OLD=P.parent/'MAIN02-20261109-C9B9E219'
for n in ['build.py','export.py','qa.py','browser_helper.py','serve.py']:
 s=(OLD/n).read_text('utf-8')
 s=s.replace('5201','5202')
 if n=='build.py':
  s=s.replace("iteration=1,role=", "iteration=2,role=")
  s=s.replace('radiusX=300,radiusY=190,thickness=76','radiusX=320,radiusY=250,thickness=110')
  s=s.replace('startAngle=-115,endAngle=90','startAngle=-45,endAngle=45')
  s=s.replace("count=24,seed=219,gravity=1500,speed=1", "count=17,seed=219,gravity=1550,speed=.86")
  s=s.replace("duration=.60,count=22", "duration=.54,count=16")
  start=s.index('function ground(a,p)');end=s.index('function effect(time',start)
  s=s[:start]+r'''
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
''' + s[end:]
  s=s.replace('흰 내려베기 · 지면 충격 1타','사분원 내려베기 · 2D 지면 충격 1타')
 if n=='export.py':
  s=s.replace("MAIN02-20261109-78E189DC-v003/frames/combo/frame-014.png", "MAIN02-20261109-C9B9E219/frames/slash/frame-018.png")
  s=s.replace('Previous downcut: nominal width64px','Iteration1: 205-degree curved slash, width76px')
  s=s.replace('Ground downcut: nominal width76px (+18.75%)','Iteration2: 90-degree curved slash, width110px')
 (P/n).write_text(s,'utf-8')
shutil.copy2(OLD/'renderer.js',P/'reference-v001-renderer.js')
print('New editable source copies prepared')

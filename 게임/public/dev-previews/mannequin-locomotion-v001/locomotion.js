export const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const mix=(a,b,t)=>a+(b-a)*t, sm=t=>{t=clamp(t);return t*t*t*(10+t*(-15+6*t))}, add=(a,b)=>a.map((v,i)=>v+b[i]), sub=(a,b)=>a.map((v,i)=>v-b[i]), mul=(a,s)=>a.map(v=>v*s), norm=a=>Math.hypot(...a), unit=a=>mul(a,1/(norm(a)||1)), dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
export function ik(a,b,l1,l2,pole=[1,0,0]){const d0=norm(sub(b,a)),d=clamp(d0,0.001,l1+l2-.0001),u=unit(sub(b,a)),p=unit(sub(pole,mul(u,dot(pole,u)))),along=(l1*l1-l2*l2+d*d)/(2*d),h=Math.sqrt(Math.max(0,l1*l1-along*along));return {joint:add(a,add(mul(u,along),mul(p,h))),end:add(a,mul(u,d)),reachError:Math.abs(d-d0)}}
export class Simulator{
 constructor(rig,motions,variant,mode='Auto',stopAt=null){this.r=rig;this.m=motions;this.v=variant;this.mode=mode;this.stopAt=stopAt;this.t=0;this.root=0;this.vel=0;this.phase=0;this.running=0;this.active=false;this.feet=[-1,1].map(z=>({p:[0,28,z*68],swing:null,contact:true}));this.prevRun=0;this.samples=[]}
 control(t){const v=this.v;let speed=0,run=0,label='Idle';
  const launch=(tt,isRun)=>({speed:(isRun?v.runSpeed:v.walkSpeed)*sm(tt/1.2),run:isRun?sm(tt/1.2):0,label:tt<1.2?'Start→'+(isRun?'Run':'Walk'):(isRun?'Run':'Walk')});
  if(this.mode==='Auto'){if(t<1.4){}else if(t<2.6){({speed,run,label}=launch(t-1.4,false))}else if(t<5.6){speed=v.walkSpeed;label='Walk'}else if(t<6.4){run=sm((t-5.6)/.8);speed=mix(v.walkSpeed,v.runSpeed,run);label='Walk→Run'}else if(t<9.4){speed=v.runSpeed;run=1;label='Run'}else if(t<10.8){run=1-sm((t-9.4)/1.0);speed=v.runSpeed*(1-sm((t-9.4)/.85));label='Stop'}
  }else if(this.mode==='Idle'){}else if(this.mode==='StartRun'){({speed,run,label}=launch(t,true))}else if(this.mode==='Start'){({speed,run,label}=launch(t,false))}else if(this.mode==='Stop'){speed=v.runSpeed*(1-sm((t-1.6)/.85));run=t<1.6?1:1-sm((t-1.6));label=t<1.6?'Run':t<3?'Stop':'Idle'}else{run=this.mode==='Run'?1:0;speed=run?v.runSpeed:v.walkSpeed;label=this.mode}
  if(this.stopAt!==null&&t>=this.stopAt){const c=this.controlBeforeStop||{speed,run};this.controlBeforeStop=c;speed=c.speed*(1-sm((t-this.stopAt)/.65));run=c.run*(1-sm((t-this.stopAt)/.9));label=t-this.stopAt<1.35?'Stop 요청':'Idle'}
  return{speed,run,label};
 }
 step(dt){const t=this.t,c=this.control(t),v=this.v,r=this.r;this.vel=c.speed;this.running=c.run;this.root+=c.speed*dt;const moving=c.speed>2;
  if(moving){this.phase+=dt/mix(this.m.cycles.walk,this.m.cycles.run,c.run)}
  const duty=mix(v.walkDuty,v.runDuty,c.run),cycle=mix(this.m.cycles.walk,this.m.cycles.run,c.run);
  for(let i=0;i<2;i++){const f=this.feet[i],phase=(this.phase+i*.5)%1;const wantsSwing=moving&&phase>duty;
   if(!f.swing&&f.contact&&wantsSwing){const dur=(1-duty)*cycle;const target=this.root+c.speed*(dur+duty*cycle*.5);f.swing={start:t,duration:dur,from:[...f.p],to:[target,28,f.p[2]],lift:mix(v.walkLift,v.runLift,c.run),settle:false};f.contact=false}
   if(f.swing){const s=f.swing,u=clamp((t-s.start)/s.duration);f.p=[mix(s.from[0],s.to[0],sm(u)),mix(s.from[1],s.to[1],sm(u))+s.lift*Math.sin(Math.PI*u)**2,s.from[2]];if(u>=1){f.p=[...s.to];f.swing=null;f.contact=true}}
  }
  // After braking, replace one support foot at a time; never teleport planted feet to rest.
  if(!moving&&!this.feet.some(f=>f.swing)){const f=this.feet.find(f=>Math.abs(f.p[0]-this.root)>4);if(f){f.swing={start:t,duration:.26,from:[...f.p],to:[this.root,28,f.p[2]],lift:35,settle:true};f.contact=false}}
  this.t+=dt;return this.pose(c)
 }
 pose(c=this.control(this.t)){const r=this.r,v=this.v,run=c.run,move=clamp(c.speed/v.walkSpeed),ph=this.phase*2*Math.PI,amp=clamp(move),idle=Math.sin(this.t*2*Math.PI/3.1)*2;
  const airborne=this.feet.every(f=>!f.contact);let hipY=r.rest.hipHeight+idle*(1-amp)+amp*v.bob*(mix(-8,3,run)+mix(8,18,run)*Math.cos(ph*2));
  const sway=amp*v.sway*Math.sin(ph),hipX=this.root+amp*mix(0,13,run)*v.lean;
  // Lower pelvis to keep all ankle goals reachable without changing any limb length.
  for(const f of this.feet){const dx=f.p[0]-hipX,dy=Math.sqrt(Math.max(1,(r.lengths.thigh+r.lengths.shin-3)**2-dx*dx));hipY=Math.min(hipY,f.p[1]+dy)}
  const pelvis=[hipX,hipY,sway],lean=amp*mix(.025,.15,run)*v.lean,torso=[Math.sin(lean)*r.lengths.torso,Math.cos(lean)*r.lengths.torso,0],chest=add(pelvis,torso),neck=add(chest,[0,r.lengths.neck,0]),head=add(neck,[7,110,0]);
  const joints={Root:[this.root,0,0],Pelvis:pelvis,Torso:add(pelvis,mul(torso,.48)),Chest:chest,Neck:neck,Head:head},bones=[];
  const link=(n,a,b,l)=>{joints[n]=b;bones.push({name:n,a,b,length:l})};
  let reachError=0;
  for(let i=0;i<2;i++){const sign=i===0?-1:1,prefix=i===0?'Right':'Left',f=this.feet[i],hip=add(pelvis,[0,0,sign*r.rest.hipHalfWidth]),k=ik(hip,f.p,r.lengths.thigh,r.lengths.shin,[1,.05,0]);reachError=Math.max(reachError,k.reachError);joints[prefix+'Hip']=hip;link(prefix+'Thigh',hip,k.joint,r.lengths.thigh);link(prefix+'Shin',k.joint,k.end,r.lengths.shin);joints[prefix+'Foot']=k.end;
   const shoulder=add(chest,[0,0,sign*r.rest.shoulderHalfWidth]),swing=amp*v.arm*mix(.25,.65,run)*Math.sin(ph+i*Math.PI),angle=-swing-.05*amp,elbow=add(shoulder,[Math.sin(angle)*Math.sqrt(r.lengths.upperArm**2-64),-Math.cos(angle)*Math.sqrt(r.lengths.upperArm**2-64),sign*8]);
   const bend=mix(.20,1.30,run)*amp+.12;const wrist=add(elbow,[Math.sin(angle+bend)*r.lengths.forearm,-Math.cos(angle+bend)*r.lengths.forearm,0]);joints[prefix+'Shoulder']=shoulder;link(prefix+'UpperArm',shoulder,elbow,r.lengths.upperArm);link(prefix+'Forearm',elbow,wrist,r.lengths.forearm);joints[prefix+'Hand']=add(wrist,[8,-25,0]);
  }
  return{time:this.t,root:this.root,velocity:c.speed,run,label:c.label,phase:this.phase,airborne,joints,bones,feet:this.feet.map(f=>({p:[...f.p],contact:f.contact,swing:!!f.swing})),reachError,rig:r}
 }
}
export function simulate(r,m,v,mode='Auto',stopAt=null,duration=null){const s=new Simulator(r,m,v,mode,stopAt),d=duration??(mode==='Auto'?m.duration:mode==='Idle'?3.1:mode==='Stop'?4.2:mode.startsWith('Start')?3.4:mode==='Run'?m.cycles.run*6:m.cycles.walk*4),out=[s.pose()];for(let t=0;t<d-m.dt/2;t+=m.dt)out.push(s.step(m.dt));return out}
export function at(samples,t){return samples[Math.min(samples.length-1,Math.max(0,Math.round(t/(1/120))))]}
export function project(p,root=0){const a=35*Math.PI/180;return[(p[0]-root)*Math.sin(a)+p[2]*Math.cos(a),-p[1]+(p[0]-root)*.10+p[2]*.06]}
export function draw(canvas,p,opt={}){const ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height,sc=Math.min(w/720,h/1210)*1010/(p.rig.rest.hipHeight+p.rig.lengths.torso+p.rig.lengths.neck+220),ox=w*.48,oy=h*.91;ctx.clearRect(0,0,w,h);ctx.fillStyle=opt.bg==='dark'?'#172332':opt.bg==='field'?'#78906a':'#f4f5f1';ctx.fillRect(0,0,w,h);const P=q=>{let a=project(q,p.root);return[ox+a[0]*sc,oy+a[1]*sc]},line=(a,b,color,width)=>{a=P(a);b=P(b);ctx.strokeStyle=color;ctx.lineWidth=width*sc;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.stroke()},ellipse=(q,rx,ry,color)=>{q=P(q);ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(q[0],q[1],rx*sc,ry*sc,0,0,Math.PI*2);ctx.fill()};
  // Perspective grid represents fixed world points, while follow-camera subtracts root.
  ctx.strokeStyle=opt.bg==='dark'?'#354656':'#c3ccbd';ctx.lineWidth=1;for(let k=Math.floor(p.root/150)-8;k<Math.floor(p.root/150)+9;k++){const a=P([k*150,0,-400]),b=P([k*150,0,400]);ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.stroke()}line([p.root-620,0,0],[p.root+620,0,0],'#88978c',2);
 const j=p.joints,far='#778895',near='#b1bdc5',mid='#98a9b5',edge='#33495b';
 function limb(prefix,color){for(const[n,width]of[['Thigh',66],['Shin',52],['UpperArm',48],['Forearm',40]]){const b=p.bones.find(b=>b.name===prefix+n);line(b.a,b.b,edge,width+5);line(b.a,b.b,color,width)}ellipse(j[prefix+'Hand'],22,28,color);const f=j[prefix+'Foot'];line(add(f,[-30,-13,0]),add(f,[65,-13,0]),edge,32);line(add(f,[-30,-13,0]),add(f,[65,-13,0]),color,27)}
 limb('Left',far);
 ellipse(j.Pelvis,p.rig.rest.pelvisRadius??93,58,edge);ellipse(j.Pelvis,(p.rig.rest.pelvisRadius??93)-4,54,mid);
 // Rounded torso polygon has an oblique front plane; no anatomy, clothing or texture.
 const corners=[add(j.Chest,[0,0,-p.rig.rest.shoulderHalfWidth+9]),add(j.Chest,[0,0,p.rig.rest.shoulderHalfWidth-9]),add(j.Pelvis,[0,90,p.rig.rest.waistHalfWidth??78]),add(j.Pelvis,[0,30,p.rig.rest.hipHalfWidth+6]),add(j.Pelvis,[0,30,-p.rig.rest.hipHalfWidth-6]),add(j.Pelvis,[0,90,-(p.rig.rest.waistHalfWidth??78)])].map(P);ctx.fillStyle=mid;ctx.strokeStyle=edge;ctx.lineWidth=4*sc;ctx.beginPath();ctx.moveTo(...corners[0]);for(const c of corners.slice(1))ctx.lineTo(...c);ctx.closePath();ctx.fill();ctx.stroke();line(j.Chest,j.Neck,mid,48);
 limb('Right',near);
 ellipse(j.Head,p.rig.rest.headRadiusX,p.rig.rest.headRadiusY,edge);ellipse(j.Head,p.rig.rest.headRadiusX-4,p.rig.rest.headRadiusY-4,near);
 // Two unequal direction marks and side plane show right-front35, not strict profile.
 ellipse(add(j.Head,[90,6,-10]),5,10,edge);ellipse(add(j.Head,[90,6,35]),3.4,8,edge);line(add(j.Head,[88,-14,35]),add(j.Head,[105,-18,35]),edge,4);
 if(opt.bones){for(const b of p.bones)line(b.a,b.b,'#e8666c',5);for(const n of['Pelvis','Chest','Neck','Head'])ellipse(j[n],7,7,'#ffe28e');for(const b of p.bones)ellipse(b.a,6,6,'#39d0cf')}
 if(opt.contacts){p.feet.forEach(f=>{ellipse([f.p[0],0,f.p[2]],30,7,f.contact?'#2eaa67':'#cf8c38')})}
 return p;
}

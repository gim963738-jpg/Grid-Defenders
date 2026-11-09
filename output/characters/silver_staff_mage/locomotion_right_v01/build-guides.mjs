// Geometry-only animation planning guides; these are not rendered character art.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const dir=path.dirname(fileURLToPath(import.meta.url));
fs.mkdirSync(path.join(dir,'guides'),{recursive:true});
const lerp=(a,b,t)=>a+(b-a)*t;
function curve(points,t){
  let i=0;while(i<points.length-2&&t>points[i+1][0])i++;
  const a=points[i],b=points[i+1],u=(t-a[0])/(b[0]-a[0]);
  // Cubic Hermite with finite difference tangents, preserving explicit contact phases.
  const p=points[Math.max(0,i-1)],q=points[Math.min(points.length-1,i+2)];
  return [1,2,3].map(k=>{
    const m0=(b[k]-p[k])/(b[0]-p[0])*(b[0]-a[0]);
    const m1=(q[k]-a[k])/(q[0]-a[0])*(b[0]-a[0]);
    return (2*u**3-3*u*u+1)*a[k]+(u**3-2*u*u+u)*m0+(-2*u**3+3*u*u)*b[k]+(u**3-u*u)*m1;
  });
}
function foot(p,action){
  if(action==='walk'){
    if(p<.5)return [lerp(145,96,p/.5),205,lerp(-12,0,Math.min(1,p/.08))];
    if(p<.6)return [lerp(96,86,(p-.5)/.1),lerp(205,199,(p-.5)/.1),lerp(0,32,(p-.5)/.1)];
    return curve([[.6,86,199,32],[.72,101,184,18],[.83,126,184,-6],[.94,147,197,-16],[1,145,205,-12]],p);
  }
  if(p<.28)return [lerp(146,94,p/.28),205,lerp(-10,0,Math.min(1,p/.07))];
  if(p<.34)return [lerp(94,86,(p-.28)/.06),lerp(205,197,(p-.28)/.06),lerp(0,38,(p-.28)/.06)];
  return curve([[.34,86,197,38],[.48,88,176,48],[.64,112,172,10],[.8,145,186,-15],[.91,151,197,-18],[1,146,205,-10]],p);
}
function knee(hip,ankle){
  const dx=ankle[0]-hip[0],dy=ankle[1]-hip[1],d=Math.hypot(dx,dy),l1=31,l2=30;
  const a=(l1*l1-l2*l2+d*d)/(2*d),h=Math.sqrt(Math.max(0,l1*l1-a*a));
  return [hip[0]+a*dx/d+h*dy/d,hip[1]+a*dy/d-h*dx/d];
}
const results={};
for(const action of ['walk','run']){
  const poses=Array.from({length:30},(_,i)=>{
    const t=i/30,run=action==='run';
    const bob=(run?5.3:2)*Math.cos(4*Math.PI*(t-(run?.12:.1)));
    const hip=[117,run?158+bob:154+bob],head=[run?134:123,(run?69:66)+bob];
    const farFoot=foot((t+.5)%1,action),nearFoot=foot(t,action);
    const farHip=[hip[0]-3,hip[1]-1],nearHip=[hip[0]+1,hip[1]];
    const shoulder=[run?128:119,103+bob];
    const swing=Math.cos(2*Math.PI*t);
    const elbow=[shoulder[0]+(run?2:0)-(run?10:9)*swing,128+bob-(run?6:0)];
    const hand=[elbow[0]+(run?18:4)-(run?2:7)*swing,run?124+bob:150+bob];
    const grip=[156+(run?2:1.4)*Math.sin(2*Math.PI*t),124+bob];
    return {frame:i+1,phase:t,action,groundY:214,hip,head,shoulder,elbow,hand,grip,
      staffTop:[run?174:161,(run?15:10)+bob],staffBottom:[run?141:152,(run?195:207)+bob],
      near:{hip:nearHip,knee:knee(nearHip,nearFoot),ankle:nearFoot.slice(0,2),footAngle:nearFoot[2],support:t<(run?.34:.6)},
      far:{hip:farHip,knee:knee(farHip,farFoot),ankle:farFoot.slice(0,2),footAngle:farFoot[2],support:(t+.5)%1<(run?.34:.6)}};
  });
  results[action]=poses;
  fs.writeFileSync(path.join(dir,'guides',`${action}-poses.json`),JSON.stringify(poses,null,2));
}
fs.writeFileSync(path.join(dir,'guides','motion-contract.json'),JSON.stringify({
  status:'planning geometry, not measurements of generated art',frameCount:30,columns:6,rows:5,
  sourceLogicalCell:229,groundY:214,nearLeg:'camera side, anatomical right',farLeg:'behind, anatomical left',
  walk:{cycleMs:1000,stanceFraction:.6},run:{cycleMs:750,stanceFraction:.34},
  order:'01 through 30, row-major, then 01; no ping-pong or duplicate terminal frame',
  identity:'Existing silver-staff-8views-v1; staff stays in the far anatomical left hand; near right arm free',
  poses:results},null,2));
console.log('Wrote two geometry-only 30-pose plans.');

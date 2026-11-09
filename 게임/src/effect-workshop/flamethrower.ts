import type { EffectLayer, EffectRecipe } from './model';

export function createFlamethrower(): EffectRecipe {
  return {
    format: 'gd.effect@1', name: '청염 화염방사',
    settings: { size: 256, frames: 64, fps: 64 / 2.4, pixelSize: 1, loop: false },
    palette: ['#196DFF', '#FF821C', '#FFFBE7'],
    placement: { pivotX: .84, pivotY: .52, displaySize: 220, impactFrame: 6 },
    layers: [
      { id: 'blue-jet-ignition', name: '점화 순간의 푸른 불꽃', type: 'flame', enabled: true, blend: 'normal', color: 0, x: .84, y: .52, start: 0, end: .12, radius: .055, thickness: .012, rotation: 0, spread: 40, amount: 5, speed: 1.4, opacity: .65, seed: 165 },
      { id: 'blue-jet-stream', name: '주황 분사·백열 중심·청염 외곽', type: 'jet', enabled: true, blend: 'normal', color: 0, x: .84, y: .52, start: .015, end: 1, radius: .42, thickness: .075, rotation: 180, spread: 65, amount: 56, speed: 1, opacity: 1, seed: 25031 },
    ],
  };
}

const smooth = (a: number, b: number, t: number) => { const u = Math.max(0, Math.min(1, (t - a) / (b - a))); return u * u * (3 - 2 * u); };
const frac = (t: number) => t - Math.floor(t);
function mix(a: string, b: string, t: number): string {
  const channel = (i: number) => Math.round(parseInt(a.slice(i,i+2),16)*(1-t)+parseInt(b.slice(i,i+2),16)*t).toString(16).padStart(2,'0');
  return `#${channel(1)}${channel(3)}${channel(5)}`;
}
function spectralHighlight(color: string): string {
  const r=parseInt(color.slice(1,3),16)/255,g=parseInt(color.slice(3,5),16)/255,b=parseInt(color.slice(5,7),16)/255,max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min;
  const hue= !d ? 0 : max===r ? ((g-b)/d+6)%6 : max===g ? (b-r)/d+2 : (r-g)/d+4;
  const h=(hue*60-24+360)%360,s=max===0?0:d/max,v=Math.min(1,max*1.12),c=v*s,x=c*(1-Math.abs(h/60%2-1)),m=v-c;
  const rgb=h<60?[c,x,0]:h<120?[x,c,0]:h<180?[0,c,x]:h<240?[0,x,c]:h<300?[x,0,c]:[c,0,x];
  return '#'+rgb.map(n=>Math.round((n+m)*255).toString(16).padStart(2,'0')).join('');
}
function plume(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, color: string, alpha: number, dense = false, warp?: number) {
  if(alpha <= .001 || rx <= 0 || ry <= 0) return;
  ctx.save(); ctx.translate(x,y); ctx.scale(rx,ry); ctx.globalAlpha *= alpha;
  const gradient=ctx.createRadialGradient(-.13,-.08,0,0,0,1);
  gradient.addColorStop(0,color); gradient.addColorStop(dense ? .52 : .18,`${color}F0`); gradient.addColorStop(.77,`${color}75`); gradient.addColorStop(1,`${color}00`);
  ctx.fillStyle=gradient;
  if(warp===undefined)ctx.fillRect(-1,-1,2,2);
  else {ctx.beginPath();for(let i=0;i<=32;i++){const a=i/32*Math.PI*2,r=.82+.12*Math.sin(a*3+warp)+.09*Math.sin(a*7-warp*.6);const x=Math.cos(a)*r,y=Math.sin(a)*r;if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y);}ctx.closePath();ctx.fill();}
  ctx.restore();
}

/** Continuous advection: after shutoff the empty section travels from nozzle to tip. */
export function drawFlameJet(ctx: CanvasRenderingContext2D, layer: EffectLayer, palette: readonly string[], time: number, size: number, random: () => number): void {
  const length=layer.radius*size*1.35, head=layer.thickness*size*(1.45+Math.min(1,layer.spread/100)*.9);
  const blue=palette[layer.color], orange=palette[(layer.color+1)%3], white=palette[(layer.color+2)%3], cyan=spectralHighlight(blue), gold=mix(orange,white,.56);
  const flow=5.3*layer.speed, phase=time*flow;
  const live=(u:number,hot=false)=>{const born=time-u/flow;return smooth(0,.04,born)*(1-smooth(hot ? .64 : .70,hot ? .69 : .75,born));};
  const width=(u:number)=>head*(.035+.97*Math.max(0,u)**1.35);
  const center=(u:number)=>Math.sin(u*13-time*24*layer.speed)*head*.065*u+Math.sin(u*21-time*37*layer.speed)*head*.035;
  const pressure=.93+.055*Math.sin(time*65)+.025*Math.sin(time*109);

  // Outer plume first: blue rolls stay around the front while the hot body fills the center.
  for(let i=0;i<layer.amount*2;i++) {
    const start=random(), side=random()*2-1, variation=random(), turn=random()*Math.PI*2;
    const u=.24+frac(start+phase*.38)*.81, active=live(u); if(!active)continue;
    const w=width(u), x=length*u, y=center(u)+side*w*.9+Math.sin(time*20+turn)*w*.13;
    const r=w*(.2+variation*.25)*pressure;
    plume(ctx,x,y,r*1.65,r*1.6,blue,active*.09);
    plume(ctx,x,y,r*1.25,r,variation>.55 ? cyan : blue,active*(.7+variation*.25),true,time*23+turn);
    // A curling, tapered tongue gives the silhouette torn flame edges.
    ctx.save();ctx.globalAlpha*=active*.32;ctx.fillStyle=variation>.65 ? cyan : blue;
    const s=side<0?-1:1;ctx.beginPath();ctx.moveTo(x-r*.6,y);ctx.bezierCurveTo(x+r*.1,y-s*r,x+r*.9,y-s*r*.9,x+r*.85,y-s*r*.25);ctx.bezierCurveTo(x+r*.15,y-s*r*.6,x+r*.4,y+s*r*.6,x-r*.6,y);ctx.fill();ctx.restore();
  }
  // Broad white/yellow interior with noisy lobes, rather than a rigid triangular beam.
  for(let i=0;i<layer.amount;i++) {
    const jitter=random(), side=random()*2-1, variation=random();
    const u=.08+frac(i/layer.amount+phase*.47)*.76, active=live(u,true); if(!active)continue;
    const w=width(u), color=u<.28 ? mix(orange,gold,u/.28) : u<.44 ? gold : white;
    const radius=(2+w*(.47+variation*.22))*pressure;
    plume(ctx,length*u,center(u)+side*w*.23,radius*1.55,radius*1.2,color,active*.13);
    plume(ctx,length*u,center(u)+side*w*.23,radius*(1.1+jitter*.3),radius*.92,color,active*.97,true,time*19+jitter*12);
  }
  // A thin orange neck keeps the emission point legible beneath the large bright front.
  for(let i=0;i<12;i++) {
    const u=i/12*.31, active=live(u,true), w=1.4+u*head*.23;
    plume(ctx,length*u,center(u)*.3,w*2.5,w,orange,active*.85,true);
    plume(ctx,length*u,center(u)*.3,w*1.4,w*.38,white,active*.85,true);
  }
  // Small hot droplets along the neck and cool fragments at the outer front.
  for(let i=0;i<layer.amount;i++) {
    const offset=random(), side=random()*2-1, variation=random();
    const u=frac(offset+phase*.7)*1.08, active=live(u,u<.5); if(!active)continue;
    const w=width(u), radius=size*(.002+variation*.004), color=u<.5 ? orange : cyan;
    const x=length*u,y=center(u)+(u<.5?side*(w*.9+size*.012):Math.sign(side)*w*(.7+Math.abs(side)*.6));
    plume(ctx,x,y,radius*2.7,radius*2.7,color,active*.7);
    ctx.save();ctx.globalAlpha*=active*.9;ctx.fillStyle=u<.5 ? white : cyan;ctx.beginPath();ctx.ellipse(x,y,radius*(u<.5?1.5:1),radius,0,0,Math.PI*2);ctx.fill();ctx.restore();
  }
}

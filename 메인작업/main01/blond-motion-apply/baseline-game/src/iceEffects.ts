/** Shared crystal geometry for wave Pixi rendering and boss SVG rendering. */
export function iceProjectileShape(p:{x:number;y:number;tx:number;ty:number}){
  const angle=Math.atan2(p.ty-p.y,p.tx-p.x),dx=Math.cos(angle),dy=Math.sin(angle);
  return {trail:[p.x-dx*22,p.y-dy*22,p.x,p.y],crystal:[p.x+dx*10,p.y+dy*10,p.x-dy*4,p.y+dx*4,p.x-dx*7,p.y-dy*7,p.x+dy*4,p.y-dx*4]};
}
export function iceBurstShape(b:{x:number;y:number;life:number}){
  const progress=1-b.life/.45,radius=48*progress,alpha=1-progress;
  const shards=Array.from({length:8},(_,i)=>{
    const a=i*Math.PI/4+.2,x=b.x+Math.cos(a)*radius,y=b.y+Math.sin(a)*radius;
    return [x,y-6,x+3,y,x,y+6,x-3,y];
  });
  return {radius,alpha,shards};
}

export interface GroundActor {id:string;x:number;y:number;hp:number;kind:string;}
export function groundRadius(a:GroundActor){return a.kind==='boss'?46:a.kind==='retainer'?23:20;}
/** Stable ground footprints, independent of alpha bounds, weapons and attack range. */
export function separateActors(actors:GroundActor[],width:number,height:number,pinned:ReadonlySet<string>=new Set()):void{
 const live=actors.filter(a=>a.hp>0).sort((a,b)=>a.id.localeCompare(b.id));
 const clamp=(a:GroundActor)=>{const r=groundRadius(a);a.x=Math.max(r,Math.min(width-r,a.x));a.y=Math.max(r,Math.min(height-r,a.y));};
 for(let pass=0;pass<128;pass++){
  let overlap=0;
  for(let i=0;i<live.length;i++)for(let j=i+1;j<live.length;j++){
   const a=live[i],b=live[j],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy),gap=groundRadius(a)+groundRadius(b)+2-d;
   if(gap<=.001)continue;overlap=Math.max(overlap,gap);
   const angle=((i*73+j*137)%360)*Math.PI/180,nx=d>1e-6?dx/d:Math.cos(angle),ny=d>1e-6?dy/d:Math.sin(angle);
   const ap=pinned.has(a.id),bp=pinned.has(b.id);if(ap&&bp)continue;const aw=ap?0:bp?1:.5,bw=bp?0:ap?1:.5;
   a.x-=nx*gap*aw;a.y-=ny*gap*aw;b.x+=nx*gap*bw;b.y+=ny*gap*bw;clamp(a);clamp(b);
  }
  live.forEach(clamp);if(overlap<.01)break;
 }
}

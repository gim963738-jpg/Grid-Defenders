export interface GroundActor {id:string;x:number;y:number;hp:number;kind:string;side?:'ally'|'enemy';}
/** One registration for all 64 original turtle cells. Contact is the forward grounded paw,
 * not the middle of the shell. Visual core excludes horns, neck swing, tail and transparent margins. */
export const TURTLE_REGISTRATION={cell:314,contactX:40,footY:270,bodyReference:230,bodyCss:180,shellCenterX:156.75,
 core:{left:80,top:70,right:285,bottom:260}} as const;
export const turtleWorldScale=(width:number)=>TURTLE_REGISTRATION.bodyCss/TURTLE_REGISTRATION.bodyReference*width/800;
export function turtleHudOffset(width:number,cssWidth=800){return (TURTLE_REGISTRATION.shellCenterX-TURTLE_REGISTRATION.contactX)*turtleWorldScale(width)*800/cssWidth;}
/** Union of nonzero alpha across all original 64 cells is [0,0,314,314].
 * This fixed DISPLAY envelope never changes the footprint or attack radius.
 * Four world units cover the 2px arena border/rounding at the canonical 800px view. */
export function actorFieldBounds(a:GroundActor,width:number,height:number){
 const r=groundRadius(a);if(a.kind!=='boss')return {left:r,right:width-r,top:r,bottom:height-r};
 const m=TURTLE_REGISTRATION,s=turtleWorldScale(width),margin=4;
 return {left:Math.max(r,m.contactX*s+margin),right:Math.min(width-r,width-(m.cell-m.contactX)*s-margin),
  top:Math.max(r,m.footY*s+margin),bottom:Math.min(height-r,height-(m.cell-m.footY)*s-margin)};
}
export function constrainActor(a:GroundActor,width:number,height:number):void{
 const b=actorFieldBounds(a,width,height);a.x=Math.max(b.left,Math.min(b.right,a.x));a.y=Math.max(b.top,Math.min(b.bottom,a.y));
}
export function visualCore(a:GroundActor,width:number){
 if(a.kind==='boss'){const m=TURTLE_REGISTRATION,s=turtleWorldScale(width);return {left:a.x+(m.core.left-m.contactX)*s,right:a.x+(m.core.right-m.contactX)*s,top:a.y+(m.core.top-m.footY)*s,bottom:a.y+(m.core.bottom-m.footY)*s};}
 const hero=['blond','melee','ranged','assassin','tank','healer','arcanist'].includes(a.kind),half=a.kind==='retainer'?22:hero?16:14;
 // Legacy soldier/roster SVGs are centered at the model point (feet ~+32 world).
 // Blond and slimes already register their ground root at the model point.
 const top=a.kind==='blond'?-72*width/800*.88:a.kind==='retainer'?-48:hero?-55:-30;
 const bottom=a.kind==='blond'?-8:a.kind==='retainer'?-6:hero?24:28;
 return {left:a.x-half,right:a.x+half,top:a.y+top,bottom:a.y+bottom};
}
function bodyOverlap(a:GroundActor,b:GroundActor,width:number){const x=visualCore(a,width),y=visualCore(b,width),dx=(y.left+y.right-x.left-x.right)/2,dy=(y.top+y.bottom-x.top-x.bottom)/2;return {x:(x.right-x.left+y.right-y.left)/2-Math.abs(dx)+2,y:(x.bottom-x.top+y.bottom-y.top)/2-Math.abs(dy)+2,dx,dy};}

/** Route around a shell instead of repeatedly steering straight into its keep-out.
 * This only changes a movement waypoint; attack range and damage target remain the real actor. */
export function approachPoint(actor:GroundActor,target:GroundActor,actors:GroundActor[],width:number,height:number):{x:number;y:number}{
 for(const boss of actors)if(boss.kind==='boss'&&boss.hp>0&&boss!==actor){
  const c=visualCore(boss,width),v=visualCore(actor,width),half=(v.right-v.left)/2;
  const r={left:c.left-half-2,right:c.right+half+2,top:c.top+(actor.y-v.bottom)-2,bottom:c.bottom+(actor.y-v.top)+2};
  let enter=0,leave=1,intersects=true;
  for(const [start,end,min,max] of [[actor.x,target.x,r.left,r.right],[actor.y,target.y,r.top,r.bottom]]){
   const d=end-start;if(Math.abs(d)<1e-9){if(start<min||start>max)intersects=false;continue;}
   const a=(min-start)/d,b=(max-start)/d;enter=Math.max(enter,Math.min(a,b));leave=Math.min(leave,Math.max(a,b));
  }
  if(!intersects||enter>=leave-1e-8||leave<=1e-6||enter>=1-1e-6)continue;
  const radius=groundRadius(actor),routes=[r.top-2,r.bottom+2].filter(y=>y>=radius&&y<=height-radius);
  routes.sort((a,b)=>Math.hypot(actor.x-r.right-2,actor.y-a)+Math.hypot(target.x-r.left+2,target.y-a)-Math.hypot(actor.x-r.right-2,actor.y-b)-Math.hypot(target.x-r.left+2,target.y-b));
  const y=routes[0];if(y===undefined)continue;
  if(actor.y>r.top&&actor.y<r.bottom&&actor.x>=r.right)return {x:r.right+2,y};
  return {x:r.left-2,y};
 }
 return target;
}

export function groundRadius(a:GroundActor){return a.kind==='boss'?46:a.kind==='retainer'?23:20;}
/** Stable ground footprints, independent of alpha bounds, weapons and attack range. */
export function separateActors(actors:GroundActor[],width:number,height:number,pinned:ReadonlySet<string>=new Set()):void{
 const live=actors.filter(a=>a.hp>0).sort((a,b)=>a.id.localeCompare(b.id));
 const clamp=(a:GroundActor)=>constrainActor(a,width,height);
 live.forEach(clamp);
 // Degenerate restored/editor input can have several identical centers at a wall.
 // Establish the nearest feasible deterministic standing positions once; ordinary
 // movement never enters this path (its per-step penetration is much smaller).
 let coincident=0;for(let i=0;i<live.length;i++)for(let j=i+1;j<live.length;j++)if(Math.hypot(live[i].x-live[j].x,live[i].y-live[j].y)<1)coincident++;
 if(coincident>=3){
  const placed:GroundActor[]=[],ordered=[...live].sort((a,b)=>Number(b.kind==='boss')-Number(a.kind==='boss')||a.id.localeCompare(b.id));
  const valid=(a:GroundActor)=>placed.every(b=>Math.hypot(a.x-b.x,a.y-b.y)>=groundRadius(a)+groundRadius(b)+2-.001&&(!(a.kind==='boss'||b.kind==='boss'||a.side==='ally'&&b.side==='ally')||bodyOverlap(a,b,width).x<=.001||bodyOverlap(a,b,width).y<=.001));
  for(const a of ordered){
   clamp(a);const r=groundRadius(a);
   const origin={x:a.x,y:a.y},core=visualCore(a,width),minY=Math.max(r,a.y-core.top+2),maxY=Math.min(height-r,height-(core.bottom-a.y)-2);
   a.y=Math.max(minY,Math.min(maxY,a.y));
   if(!pinned.has(a.id)&&!valid(a)){
    let found=false;
    for(let radius=8;radius<=Math.hypot(width,height)&&!found;radius+=8)for(let angle=0;angle<64&&!found;angle++){
     a.x=origin.x+Math.cos(angle*Math.PI/32)*radius;a.y=origin.y+Math.sin(angle*Math.PI/32)*radius;clamp(a);a.y=Math.max(minY,Math.min(maxY,a.y));
     if(valid(a))found=true;
    }
   }
   placed.push(a);
  }
 }
 for(let pass=0;pass<128;pass++){
  let overlap=0;
  for(let i=0;i<live.length;i++)for(let j=i+1;j<live.length;j++){
   const a=live[i],b=live[j],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy),gap=groundRadius(a)+groundRadius(b)+2-d;
   if(gap<=.001){
    if(a.side==='ally'&&b.side==='ally'){
      const o=bodyOverlap(a,b,width);
      if(o.x>.001&&o.y>.001){
       // Choose a feasible separating axis. At a wall, transfer the blocked half
       // to the other actor instead of clamping it back into its neighbour.
       for(const alongX of o.x<=o.y?[true,false]:[false,true]){
        const sign=(alongX?o.dx:o.dy)>=0?1:-1,ra=groundRadius(a),rb=groundRadius(b),limit=alongX?width:height,av=alongX?a.x:a.y,bv=alongX?b.x:b.y;
        const cross=alongX?b.y-a.y:b.x-a.x,groundDistance=Math.sqrt(Math.max(0,(ra+rb+2)**2-cross**2));
        const delta=Math.max(alongX?o.x:o.y,groundDistance-sign*(bv-av));
        const roomA=pinned.has(a.id)?0:sign>0?av-ra:limit-ra-av,roomB=pinned.has(b.id)?0:sign>0?limit-rb-bv:bv-rb;
        if(roomA+roomB<delta-1e-6)continue;
        let da=Math.min(delta/2,roomA),db=Math.min(delta-da,roomB);da=delta-db;
        if(alongX){a.x-=sign*da;b.x+=sign*db;}else{a.y-=sign*da;b.y+=sign*db;}
        overlap=Math.max(overlap,delta);break;
       }
      }
    }
    continue;
   }overlap=Math.max(overlap,gap);
   const angle=((i*73+j*137)%360)*Math.PI/180,nx=d>1e-6?dx/d:Math.cos(angle),ny=d>1e-6?dy/d:Math.sin(angle);
   const ap=pinned.has(a.id),bp=pinned.has(b.id);if(ap&&bp)continue;const aw=ap?0:bp?1:.5,bw=bp?0:ap?1:.5;
   a.x-=nx*gap*aw;a.y-=ny*gap*aw;b.x+=nx*gap*bw;b.y+=ny*gap*bw;clamp(a);clamp(b);
  }
  // Shell-space is a visual keep-out, not a larger attack radius. Front contact remains reachable.
  for(const boss of live.filter(a=>a.kind==='boss'))for(const actor of live)if(actor!==boss&&!pinned.has(actor.id)){
   const o=bodyOverlap(boss,actor,width);if(o.x<=.001||o.y<=.001)continue;
   const core=visualCore(boss,width),other=visualCore(actor,width),half=(other.right-other.left)/2,topOffset=actor.y-other.top,bottomOffset=actor.y-other.bottom;
   const candidates=[{x:core.left-half-2,y:actor.y},{x:core.right+half+2,y:actor.y},{x:actor.x,y:core.top+bottomOffset-2},{x:actor.x,y:core.bottom+topOffset+2}];
   const valid=candidates.filter(c=>c.x>=groundRadius(actor)&&c.x<=width-groundRadius(actor)&&c.y>=groundRadius(actor)&&c.y<=height-groundRadius(actor));
   valid.sort((a,b)=>Math.hypot(a.x-actor.x,a.y-actor.y)-Math.hypot(b.x-actor.x,b.y-actor.y));
   if(valid[0]){overlap=Math.max(overlap,Math.min(o.x,o.y));actor.x=valid[0].x;actor.y=valid[0].y;}
  }
  live.forEach(clamp);if(overlap<.01)break;
 }
}

/** Timings and sheet frames share one clock, so damage always matches peak flames. */
export const FIRE_SKILL={cooldown:4,speed:320,radius:48,damageMultiplier:1,hits:3,
  impactFrameSeconds:.05,pillarFrameSeconds:.07,peakTimes:[.91,.98,1.05],duration:1.61} as const;
export const FIRE_SHEET_URL=`${import.meta.env.BASE_URL}assets/effects/fire-skill-sheet.png`;
// Dark blue backgrounds and gray cell dividers are discarded at render time.
export const FIRE_ALPHA_MATRIX:[number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number]=[1,0,0,0,0, 0,1,0,0,0, 0,0,1,0,0, 2,-.5,-2,0,-.08];
export interface FireCast<S,Id>{source:S;targetId:Id;attack:number;x:number;y:number;tx:number;ty:number;stage:'flight'|'pillar';age:number;hits:number;footOffset:number;}
export function createFireCast<S,Id>(source:S,targetId:Id,attack:number,x:number,y:number,tx:number,ty:number,footOffset=8):FireCast<S,Id>{
 return {source,targetId,attack,x,y,tx,ty,stage:'flight',age:0,hits:0,footOffset};
}
/** Returns newly crossed damage beats. Landing and magic-circle creation deal no damage. */
export function advanceFire<S,Id>(cast:FireCast<S,Id>,dt:number,target?:{x:number;y:number}):number{
 // Only the airborne projectile follows the enemy. Landing locks the damage center.
 if(target&&cast.stage==='flight'){cast.tx=target.x;cast.ty=target.y;}
 if(cast.stage==='flight'){
  const dx=cast.tx-cast.x,dy=cast.ty-cast.y,d=Math.hypot(dx,dy),step=FIRE_SKILL.speed*dt;
  if(d>step){cast.x+=dx/d*step;cast.y+=dy/d*step;cast.age+=dt;return 0;}
  cast.x=cast.tx;cast.y=cast.ty;cast.stage='pillar';cast.age=0;return 0;
 }
 cast.age+=dt;let beats=0;
 while(cast.hits<FIRE_SKILL.hits&&cast.age+1e-8>=FIRE_SKILL.peakTimes[cast.hits]){cast.hits++;beats++;}
 return beats;
}
export const fireAlive=(cast:FireCast<unknown,unknown>)=>cast.stage==='flight'||cast.age<FIRE_SKILL.duration;
export interface FireFrame{x:number;y:number;width:number;height:number;pivotX:number;pivotY:number;}
// The supplied sheet uses uneven cell widths. Each ground frame has its own
// measured magic-circle center, independent of the surrounding empty pixels.
function frames(bounds:number[],y:number,height:number,pivots?:[number,number][]):FireFrame[]{
 return bounds.slice(0,-1).map((left,i)=>{
  const x=left+2,top=y+2,width=bounds[i+1]-left-4,h=height-4;
  return {x,y:top,width,height:h,pivotX:pivots?pivots[i][0]-x:width/2,pivotY:pivots?pivots[i][1]-top:h/2};
 });
}
const flight=frames([268,382,499,618,740,863,989,1119,1248,1381,1508],351,85);
const impact=frames([268,391,538,715,907,1099,1301,1508],481,98,
 [[330,537],[464,537.5],[625.5,544],[809,544],[1001.5,543.5],[1198,544],[1402,544]]);
const rise=frames([268,402,535,669,804,940,1077,1215,1355,1508],623,139,
 [[336.5,730],[469,729.5],[602.5,730],[737,730],[873,730.5],[1009,730.5],[1146,731],[1284.5,731.5],[1429.5,732.5]]);
const fade=frames([268,405,544,682,820,959,1096,1232,1369,1508],808,170,
 [[336,948],[474.5,948],[614,948],[752.5,948.5],[891,948.5],[1031,949],[1170,949],[1307,949],[1444,949]]);
export function fireFrame(cast:FireCast<unknown,unknown>):FireFrame{
 if(cast.stage==='flight')return flight[Math.min(9,Math.floor(cast.age/.035))];
 const t=cast.age;if(t<.35)return impact[Math.min(6,Math.floor((t+1e-8)/.05))];
 if(t<.98-1e-8)return rise[Math.min(8,Math.floor((t-.35+1e-8)/.07))];
 return fade[Math.min(8,Math.max(0,Math.floor((t-.98+1e-8)/.07)))];
}
export function firePlacement(cast:FireCast<unknown,unknown>){
 if(cast.stage==='flight')return {x:cast.x,y:cast.y,width:54,height:34,anchorX:.5,anchorY:.5,rotation:Math.atan2(cast.ty-cast.y,cast.tx-cast.x)};
 const frame=fireFrame(cast),scale=.75;
 // One source-pixel scale throughout the pillar keeps the circle grounded
 // while its flames grow. The collision point remains the monster's center.
 return {x:cast.tx,y:cast.ty+cast.footOffset,width:frame.width*scale,height:frame.height*scale,
  anchorX:frame.pivotX/frame.width,anchorY:frame.pivotY/frame.height,rotation:0};
}

/** Timings and sheet frames share one clock, so damage always matches peak flames. */
export const FIRE_SKILL={cooldown:4,speed:320,radius:48,damageMultiplier:1,hits:3,
  impactFrameSeconds:.05,pillarFrameSeconds:.07,peakTimes:[.91,.98,1.05],duration:1.61} as const;
export const FIRE_SHEET_URL=`${import.meta.env.BASE_URL}assets/effects/fire-skill-sheet.png`;
// Dark blue backgrounds and gray cell dividers are discarded at render time.
export const FIRE_ALPHA_MATRIX:[number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number]=[1,0,0,0,0, 0,1,0,0,0, 0,0,1,0,0, 2,-.5,-2,0,-.08];
export interface FireCast<S,Id>{source:S;targetId:Id;attack:number;x:number;y:number;tx:number;ty:number;stage:'flight'|'pillar';age:number;hits:number;}
export function createFireCast<S,Id>(source:S,targetId:Id,attack:number,x:number,y:number,tx:number,ty:number):FireCast<S,Id>{
 return {source,targetId,attack,x,y,tx,ty,stage:'flight',age:0,hits:0};
}
/** Returns newly crossed damage beats. Landing and magic-circle creation deal no damage. */
export function advanceFire<S,Id>(cast:FireCast<S,Id>,dt:number,target?:{x:number;y:number}):number{
 if(target&&(cast.stage==='flight'||cast.hits===0)){cast.tx=target.x;cast.ty=target.y;}
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
export interface FireFrame{x:number;y:number;width:number;height:number;}
const row=(x:number,y:number,width:number,height:number,count:number):FireFrame[]=>Array.from({length:count},(_,i)=>({x:Math.round(x+i*width/count)+2,y:y+2,width:Math.round(width/count)-4,height:height-4}));
const flight=row(268,351,1240,85,10),impact=row(268,481,1240,98,7),rise=row(268,623,1240,139,9),fade=row(268,808,1240,170,9);
export function fireFrame(cast:FireCast<unknown,unknown>):FireFrame{
 if(cast.stage==='flight')return flight[Math.min(9,Math.floor(cast.age/.035))];
 const t=cast.age;if(t<.35)return impact[Math.min(6,Math.floor((t+1e-8)/.05))];
 if(t<.98-1e-8)return rise[Math.min(8,Math.floor((t-.35+1e-8)/.07))];
 return fade[Math.min(8,Math.max(0,Math.floor((t-.98+1e-8)/.07)))];
}
export function firePlacement(cast:FireCast<unknown,unknown>){
 if(cast.stage==='flight')return {x:cast.x,y:cast.y,width:54,height:34,anchorY:.5,rotation:Math.atan2(cast.ty-cast.y,cast.tx-cast.x)};
 return {x:cast.tx,y:cast.ty+14,width:100,height:cast.age<.35?58:cast.age<.98?104:128,anchorY:1,rotation:0};
}

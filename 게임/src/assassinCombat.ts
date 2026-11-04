export const ASSASSIN={basicFrames:[6,8,10],basicMultiplier:.35,waveFrame:10,waveMultiplier:2.5,waveCooldown:4,bossFrames:[6,10,14,20],bossMultipliers:[.35,.35,.35,2.5],bossCooldown:5,frameSeconds:.065,cell:70.3125,breakSeconds:5,breakRatio:.3} as const;
export type AssassinActionKind='basic'|'wave'|'boss';
export interface AssassinAction<S,Id>{impact?:{x:number;y:number};kind:AssassinActionKind;source:S;sourceId:Id;targets:Id[];attack:number;age:number;frameSeconds:number;hits:number;origin:{x:number;y:number};direction:{x:number;y:number};cancelled:boolean;}
export function createAssassinAction<S,Id>(kind:AssassinActionKind,source:S,sourceId:Id,targets:Id[],attack:number,x:number,y:number,target:{x:number;y:number},rate=1):AssassinAction<S,Id>{
 const distance=Math.hypot(target.x-x,target.y-y)||1;
 return {kind,source,sourceId,targets:[...targets],attack,age:0,frameSeconds:kind==='basic'?.9/(Math.max(.1,rate)*12):ASSASSIN.frameSeconds,hits:0,origin:{x,y},direction:{x:(target.x-x)/distance,y:(target.y-y)/distance},cancelled:false};
}
export const assassinHitFrames=(kind:AssassinActionKind):readonly number[]=>kind==='basic'?ASSASSIN.basicFrames:kind==='wave'?[ASSASSIN.waveFrame]:ASSASSIN.bossFrames;
export const assassinFrameCount=(kind:AssassinActionKind)=>kind==='basic'?12:kind==='wave'?16:24;
export function advanceAssassin<S,Id>(action:AssassinAction<S,Id>,dt:number):number[]{
 if(action.cancelled)return [];action.age+=Math.max(0,dt);const frames=assassinHitFrames(action.kind),beats:number[]=[];
 // Frame N completes at N * frameSeconds. Entering N never commits its damage.
 while(action.hits<frames.length&&action.age+1e-9>=frames[action.hits]*action.frameSeconds)beats.push(action.hits++);
 return beats;
}
export function cancelAssassin<S,Id>(action:AssassinAction<S,Id>):void {action.cancelled=true;}
export const assassinAlive=(a:AssassinAction<unknown,unknown>)=>!a.cancelled&&a.age<assassinFrameCount(a.kind)*a.frameSeconds;
export const assassinFrame=(a:AssassinAction<unknown,unknown>)=>Math.min(assassinFrameCount(a.kind),Math.floor(a.age/a.frameSeconds)+1);
export const assassinSourceBusy=(a:AssassinAction<unknown,unknown>)=>assassinAlive(a)&&(a.kind==='boss'||a.kind==='wave'&&a.age<9*a.frameSeconds);
export function assassinPosition(a:AssassinAction<unknown,unknown>):{x:number;y:number}{
 let progress=0;
 if(a.kind==='boss'){const f=a.age/a.frameSeconds;progress=f<=16?0:f<=20?(f-16)/4:Math.max(0,1-(f-20)/4);}
 return {x:a.origin.x+a.direction.x*ASSASSIN.cell*progress,y:a.origin.y+a.direction.y*ASSASSIN.cell*progress};
}
export function inAssassinPath(a:AssassinAction<unknown,unknown>,p:{x:number;y:number},radius=24):boolean {
 const dx=p.x-a.origin.x,dy=p.y-a.origin.y,along=Math.max(0,Math.min(ASSASSIN.cell,dx*a.direction.x+dy*a.direction.y));
 return Math.hypot(dx-a.direction.x*along,dy-a.direction.y*along)<=radius;
}
export interface AssassinImpact {x:number;y:number;kind:1|2|5;life:number;}

/** Resolve each basic beat against the live in-range roster, repeating its last enemy when short. */
export function assassinBasicTarget<Id>(planned:readonly Id[],beat:number,available:readonly Id[]):Id|undefined {
 const intended=planned[Math.min(beat,planned.length-1)];
 return available.includes(intended)?intended:available[Math.min(beat,available.length-1)];
}
export function assassinBasicTrail(action:AssassinAction<unknown,unknown>){
 const frame=action.age/action.frameSeconds;
 if(action.kind!=='basic'||action.cancelled||frame<3||frame>=11)return null;
 const fade=Math.min(1,(frame-3)/1.5,(11-frame)/1.5),phase=(frame-3)/8;
 return {alpha:Math.max(0,fade)*.58,phase,angle:Math.atan2(action.direction.y,action.direction.x)*.22,reach:46};
}

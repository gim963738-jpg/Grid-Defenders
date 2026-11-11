import {BLOND_CLIPS} from './blondRuntimeData';
export type BlondClip=keyof typeof BLOND_CLIPS;
export type MotionClip=BlondClip|'walk'|'idle'|'weak'|'strong';
export interface ActorMotion {clip:MotionClip;age:number;sequence:number;targetId:string|number|null;attack:number;critical:boolean;hit:boolean;}
export const BLOND_SPEED=1.5, BLOND_HOLD_MS=160;
export const BASIC_SEQUENCE=['03','04','05','06'] as const;
export const TURTLE_WEAK=[100,100,70,65,60,55,50,40,30,90,90,100,100,100,120,130];
export const TURTLE_STRONG=[120,120,120,120,120,140,140,200,70,55,130,140,140,160,160,265];
const hitFrames:Partial<Record<MotionClip,number>>={'03':6,'04':5,'05':6,'06':5,weak:9,strong:10};
export function durations(clip:MotionClip):readonly number[]{
 if(clip==='weak')return TURTLE_WEAK;if(clip==='strong')return TURTLE_STRONG;
 if(clip==='walk'||clip==='idle')return Array(16).fill(clip==='walk'?75:150) as number[];
 const d=BLOND_CLIPS[clip].durationsMs;return clip==='05'?d.slice(0,7):d;
}
export function speed(clip:MotionClip){return clip.length===2?BLOND_SPEED:1;}
export function contactTime(clip:MotionClip){const n=hitFrames[clip];return n?durations(clip).slice(0,n).reduce((a,b)=>a+b,0)/1000/speed(clip):Infinity;}
export function motionDuration(clip:MotionClip){return (durations(clip).reduce((a,b)=>a+b,0)+(clip.length===2&&hitFrames[clip]?BLOND_HOLD_MS:0))/1000/speed(clip);}
export function attacking(m:ActorMotion){return hitFrames[m.clip]!==undefined;}
export function locked(m:ActorMotion){return (attacking(m)||m.clip==='07'||m.clip==='08')&&m.age<motionDuration(m.clip)-1e-9;}
export function createMotion(turtle=false):ActorMotion{return {clip:turtle?'idle':'02',age:0,sequence:0,targetId:null,attack:0,critical:false,hit:false};}
export function setPose(m:ActorMotion,clip:MotionClip){if(m.clip!==clip){m.clip=clip;m.age=0;m.targetId=null;m.hit=false;}}
export function startMotion(m:ActorMotion,targetId:string|number,attack:number,critical=false,turtle=false){
 const clip=turtle?(m.sequence%3===2?'strong':'weak'):BASIC_SEQUENCE[m.sequence%4];
 m.sequence++;m.clip=clip;m.age=0;m.targetId=targetId;m.attack=attack;m.critical=critical;m.hit=false;
}
/** Caller advances in simulation substeps. A held contact emits exactly once, including after save/restore. */
export function advanceMotion(m:ActorMotion,dt:number):boolean{
 m.age+=Math.max(0,dt);if(!m.hit&&attacking(m)&&m.age+1e-9>=contactTime(m.clip)){m.hit=true;return true;}return false;
}
export function motionFrame(m:ActorMotion):number{
 const ds=durations(m.clip),loop=['01','02','idle','walk'].includes(m.clip);
 let t=m.age*1000*speed(m.clip),contact=contactTime(m.clip)*1000*speed(m.clip);
 if(m.clip.length===2&&attacking(m)&&t>=contact){if(t<contact+BLOND_HOLD_MS)return hitFrames[m.clip]!-1;t-=BLOND_HOLD_MS;}
 const total=ds.reduce((a,b)=>a+b,0);if(loop)t%=total;
 for(let i=0;i<ds.length;i++){if(t<ds[i]-1e-7)return i;t-=ds[i];}return ds.length-1;
}
/** Explicit knockback entry contract. Ordinary damage must not call this. No new knockback mechanic is introduced. */
export function knockbackMotion(m:ActorMotion,displacement:number):boolean{if(!Number.isFinite(displacement)||displacement<=0||m.clip==='08')return false;setPose(m,'07');return true;}
export function dieMotion(m:ActorMotion){setPose(m,'08');m.targetId=null;}

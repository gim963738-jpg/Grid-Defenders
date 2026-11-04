export const SWORD_SHEET_URL=`${import.meta.env.BASE_URL}assets/effects/sword-basic-sheet.png`;
export const SWORD_ORDER=[5,4,3] as const;
export const SWORD_ALPHA_MATRIX:[number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number]=
 [1,0,0,0,0, 0,1,0,0,0, 0,0,1,0,0, .8,.8,.8,0,-1.6];
export interface SwordAttack<Id,TargetId>{sourceId:Id;targetId:TargetId;attack:number;critical:boolean;kind:3|4|5;age:number;duration:number;hit:boolean;cancelled?:boolean;connected:boolean;x:number;y:number;}
export function createSwordAttack<Id,TargetId>(sourceId:Id,targetId:TargetId,attack:number,critical:boolean,sequence:number,rate:number,x:number,y:number):SwordAttack<Id,TargetId>{
 return {sourceId,targetId,attack,critical,kind:SWORD_ORDER[sequence%3],age:0,duration:Math.min(.5,.9/rate),hit:false,connected:false,x,y};
}
export const swordImpactTime=(s:SwordAttack<unknown,unknown>)=>s.duration*.4;
/** The sword's light peaks once; visual frames never inflict damage themselves. */
export function advanceSword(s:SwordAttack<unknown,unknown>,dt:number,target?:{x:number;y:number}):boolean{
 s.age+=dt;
 if(s.cancelled)return false;
 if(!s.hit&&target){s.x=target.x;s.y=target.y;}
 if(!s.hit&&s.age+1e-8>=swordImpactTime(s)){s.hit=true;s.connected=!!target;return s.connected;}
 return false;
}
export const swordAlive=(s:SwordAttack<unknown,unknown>)=>s.age<s.duration;
export interface SwordFrame{x:number;y:number;width:number;height:number;}
const glintCenters=[[128,304],[314,304],[500,300],[683,300],[864,288],[1045,288],[1228,304],[1412,304]];
const glints:SwordFrame[]=glintCenters.map(([x,y])=>({x:x-28,y:y-26,width:56,height:52}));
const edges=[190,321,452,582,713,844,975,1105,1236,1367,1499];
const rows:Record<3|4|5,[number,number]>={3:[718,73],4:[798,80],5:[886,83]};
export function swordSlashFrame(kind:3|4|5,index:number):SwordFrame{
 const [y,height]=rows[kind],i=Math.min(9,Math.max(0,index));return {x:edges[i]+2,y:y+2,width:edges[i+1]-edges[i]-4,height:height-4};
}
export interface SwordVisual {frame:SwordFrame;x:number;y:number;width:number;height:number;rotation:number;alpha:number;part:'glint'|'slash';}
export function swordVisuals(s:SwordAttack<unknown,unknown>,glintX:number,glintY:number,scale=1):SwordVisual[]{
 const visuals:SwordVisual[]=[];
 if(!s.cancelled&&s.age<s.duration*.8){
  const i=Math.min(7,Math.floor(s.age/(s.duration*.8)*8)),alpha=[0,.1,.45,1,1,.8,.25,0][i];
  if(alpha>0)visuals.push({frame:glints[i],x:glintX,y:glintY,width:20*scale,height:18*scale,rotation:-Math.PI/2,alpha,part:'glint'});
 }
 if(s.connected&&s.age>=swordImpactTime(s)&&swordAlive(s)){
  const t=(s.age-swordImpactTime(s))/(s.duration-swordImpactTime(s));
  visuals.push({frame:swordSlashFrame(s.kind,Math.floor(t*10)),x:s.x,y:s.y,width:60*scale,height:40*scale,rotation:0,alpha:1,part:'slash'});
 }
 return visuals;
}

export function cancelSword(s:SwordAttack<unknown,unknown>):void {s.cancelled=true;}

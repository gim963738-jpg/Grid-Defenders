import {FIRE_SKILL,type FireFrame} from './fireSkill';
// Checked frames: trail 3/7/9, final swirl, falling blade 3, peak blast 3.
export const BLADE_SKILL={cooldown:8,radius:FIRE_SKILL.radius,hits:6,
 damageMultipliers:[.75,.75,.75,.75,.75,2.25],
 hitTimes:[.0625,.1625,.2125,.675,.7+.2/7*2.5,1.075],duration:1.39} as const;
export const bladeDamageMultiplier=(hitIndex:number)=>BLADE_SKILL.damageMultipliers[hitIndex]??0;
export const BLADE_SHEET_URL=`${import.meta.env.BASE_URL}assets/effects/blade-skill-sheet.png`;
export const BLADE_ALPHA_MATRIX:[number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number]=[1,0,0,0,0,0,1,0,0,0,0,0,1,0,0,.8,.3,1.2,0,-.38];
export interface BladeCast<S,Id>{critical?:boolean;source:S;targetId:Id;attack:number;x:number;y:number;footOffset:number;age:number;hits:number;}
export function createBladeCast<S,Id>(source:S,targetId:Id,attack:number,x:number,y:number,footOffset=8):BladeCast<S,Id>{return {source,targetId,attack,x,y,footOffset,age:0,hits:0};}
export function advanceBlade(cast:BladeCast<unknown,unknown>,dt:number):number{
 cast.age+=dt;let beats=0;
 while(cast.hits<BLADE_SKILL.hits&&cast.age+1e-8>=BLADE_SKILL.hitTimes[cast.hits]){cast.hits++;beats++;}
 return beats;
}
export const bladeAlive=(cast:BladeCast<unknown,unknown>)=>cast.age<BLADE_SKILL.duration;
function row(edges:number[],y:number,height:number,groundY:number,pivots?:[number,number][]):FireFrame[]{return edges.slice(0,-1).map((x,i)=>({x:x+2,y:y+2,width:edges[i+1]-x-4,height:height-4,pivotX:pivots?pivots[i][0]-x-2:(edges[i+1]-x-4)/2,pivotY:(pivots?pivots[i][1]:groundY)-y-2}));}
const trail=row([233,355,478,603,730,857,986,1120,1253,1386,1517],335,98,423);
const swirl=row([233,382,531,678,830,979,1124,1264,1393,1517],473,113,576);
const fall=row([233,394,557,724,914,1116,1318,1517],632,139,749,
 [[309,744],[477,746],[643,746],[824,747],[1038,750],[1243,751],[1442,751]]);
const blast=row([233,410,584,772,964,1152,1332,1517],814,146,938,
 [[321,939],[490,939],[692,940],[872,938],[1054,938],[1244,938],[1428,942]]);
export function bladeFrame(cast:BladeCast<unknown,unknown>):FireFrame{
 const t=cast.age;
 if(t<.25)return trail[Math.min(9,Math.floor(t/.025))];
 if(t<.7)return swirl[Math.min(8,Math.floor((t-.25)/.05))];
 if(t<.9)return fall[Math.min(6,Math.floor((t-.7)/(.2/7)))];
 return blast[Math.min(6,Math.max(0,Math.floor((t-.9+1e-8)/.07)))];
}
export function bladePlacement(cast:BladeCast<unknown,unknown>){const f=bladeFrame(cast),scale=.7;return {x:cast.x,y:cast.y+cast.footOffset,width:f.width*scale,height:f.height*scale,anchorX:f.pivotX/f.width,anchorY:f.pivotY/f.height};}

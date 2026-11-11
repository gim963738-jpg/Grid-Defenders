import {DEFENSE_FIELD,fieldToScreen,screenToField} from '../src/defenseFieldLayout';
import {PATH,SLOTS} from '../src/defenseConfig';
import {pathPoint} from '../src/defense';
import {createFireCast,fireFrame,firePlacement} from '../src/fireSkill';
import {createBladeCast,bladePlacement} from '../src/bladeSkill';
export function checkDefenseFieldLayout(){
 const passed:string[]=[];const check=(ok:boolean,name:string)=>{if(!ok)throw Error(name);passed.push(name);};
 check(DEFENSE_FIELD.top===100&&DEFENSE_FIELD.height===430,'canopy and combat share a 430px scene');
 for(const rect of [{left:0,top:0,width:390,height:430},{left:1,top:-72,width:318,height:318/390*430}]){
  for(const [i,p] of SLOTS.entries()){const screen=fieldToScreen(rect,p),back=screenToField(rect,screen);check(Math.abs(back.x-p.x)<1e-8&&Math.abs(back.y-p.y)<1e-8,`slot ${i} survives screen and field conversion at width ${rect.width}`);}
  check(screenToField(rect,{x:rect.left+rect.width/2,y:rect.top+10}).y<0,`HUD points stay outside deployment at width ${rect.width}`);
 }
 const fire=createFireCast({},1,75,195,28,195,28);fire.stage='pillar';fire.age=1.05;
 const f=firePlacement(fire),fireTop=DEFENSE_FIELD.top+f.y-fireFrame(fire).pivotY*.75;
 check(fireTop>=0&&fireTop<DEFENSE_FIELD.top,'top-road flame rises into canopy within scene bounds');
 const blade=createBladeCast({},1,90,195,28);blade.age=1.075;const b=bladePlacement(blade),bladeTop=DEFENSE_FIELD.top+b.y-b.anchorY*b.height;
 check(bladeTop>=0&&bladeTop<DEFENSE_FIELD.top,'top-road blade rises into canopy within scene bounds');
 const lengths=PATH.map((p,i)=>Math.hypot(PATH[(i+1)%PATH.length][0]-p[0],PATH[(i+1)%PATH.length][1]-p[1])),perimeter=lengths.reduce((a,b)=>a+b,0);
 check(PATH.length>4&&lengths.every(n=>n>0),'rounded trail has no zero-length segments');
 check(Math.hypot(pathPoint(perimeter).x-PATH[0][0],pathPoint(perimeter).y-PATH[0][1])<1e-7,'monsters loop back to trail start');
 check(Math.hypot(pathPoint(perimeter-.1).x-pathPoint(.1).x,pathPoint(perimeter-.1).y-pathPoint(.1).y)<.21,'loop seam stays continuous');
 check(!PATH.some(([x,y])=>(x===28||x===362)&&(y===28||y===302)),'turns avoid square corners outside the painted road');
 return passed;
}

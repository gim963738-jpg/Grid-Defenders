import {Assets,Rectangle,Texture} from 'pixi.js';
import {pathPoint,type Enemy} from './defense';
import {smoothTexture} from './renderQuality';

export const SLIME_DIRECTIONS=['front','front-right','right','back-right','back','back-left','left','front-left'] as const;
export const SLIME_RIPPLE={count:30,columns:6,cell:256,fps:30,firstFrame:2,lastFrame:24,anchorX:128,anchorY:228,visibleWidth:211} as const;
export const SLIME_DISPLAY_WIDTH=28;
type Palette='yellow'|'blue'|'red';
type SlimeEnemy=Pick<Enemy,'named'|'bounty'|'defenseType'|'distance'|'speed'>;
export type SlimePose={palette:Palette;direction:number;frame:number;animated:boolean};
type FrameArt=SlimePose&{texture:Texture;anchorX:number;anchorY:number;scale:number};
const idle=new Map<Palette,FrameArt[]>();let ripple:FrameArt[]=[];
const base=`${import.meta.env.BASE_URL}assets/monsters/slimes-v1/`;

export function slimeDirection(distance:number):number{
  const a=pathPoint(distance),b=pathPoint(distance+1);
  return (2-Math.round(Math.atan2(b.y-a.y,b.x-a.x)/(Math.PI/4))+8)%8;
}
export function slimePose(enemy:SlimeEnemy,elapsed:number):SlimePose|null{
  if(enemy.named||enemy.bounty)return null;
  const palette=enemy.defenseType==='physical'?'blue':enemy.defenseType==='magic'?'red':'yellow',direction=slimeDirection(enemy.distance);
  const animated=palette==='yellow'&&direction===2&&enemy.speed>0;
  const seconds=Number.isFinite(elapsed)?Math.max(0,elapsed):0;
  const length=SLIME_RIPPLE.lastFrame-SLIME_RIPPLE.firstFrame+1;
  return {palette,direction,animated,frame:animated?SLIME_RIPPLE.firstFrame-1+Math.floor(seconds*SLIME_RIPPLE.fps+1e-7)%length:direction};
}
export async function loadSlimeArt():Promise<void>{
  if(idle.size===3&&ripple.length===SLIME_RIPPLE.count)return;
  await Promise.all([
    ...(['yellow','blue','red'] as const).map(async palette=>{
      const sheet=await Assets.load<Texture>(`${base}idle-${palette}.png`);smoothTexture(sheet);
      idle.set(palette,SLIME_DIRECTIONS.map((_,direction)=>({palette,direction,frame:direction,animated:false,
        texture:new Texture({source:sheet.source,frame:new Rectangle(direction*128,0,128,128)}),anchorX:.5,anchorY:112/128,scale:SLIME_DISPLAY_WIDTH/104})));
    }),
    (async()=>{
      const sheet=await Assets.load<Texture>(`${base}yellow-right-ripple.png`);smoothTexture(sheet);
      ripple=Array.from({length:SLIME_RIPPLE.count},(_,frame)=>({palette:'yellow',direction:2,frame,animated:true,
        texture:new Texture({source:sheet.source,frame:new Rectangle(frame%6*256,Math.floor(frame/6)*256,256,256)}),
        anchorX:SLIME_RIPPLE.anchorX/256,anchorY:SLIME_RIPPLE.anchorY/256,scale:SLIME_DISPLAY_WIDTH/SLIME_RIPPLE.visibleWidth}));
    })()
  ]);
}
export function slimeFrame(enemy:SlimeEnemy,elapsed:number):FrameArt|undefined{
  const pose=slimePose(enemy,elapsed);return pose?(pose.animated?ripple[pose.frame]:idle.get(pose.palette)?.[pose.direction]):undefined;
}

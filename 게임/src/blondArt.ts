import {createSkillFrame,skillFramePlacement,type SkillFrameArt,type SkillFrameSpec} from './skillVisual';
import {BLOND_DIRECTIONS} from './blondMotion';
export {blondDirection} from './blondMotion';

const base=`${import.meta.env.BASE_URL}assets/heroes/blond-warrior-v1/`;
export const BLOND_PORTRAIT_URL=`${base}portrait.png`;
export const BLOND_SKILL_ICON_URL=`${base}skill-preview.png`;
// Original blond-warrior body heights; other reference-matched heroes use these.
export const BLOND_WAVE_BODY_HEIGHT=57,BLOND_BOSS_BODY_HEIGHT=72;
type FrameSpec=Omit<SkillFrameSpec,'background'>&{bodyHeight:number;duration?:number};
type Manifest={idle:FrameSpec[];walk:{durationMs:number;fps:number;frames:FrameSpec[]}};
export type BlondFrame=SkillFrameArt&{bodyHeight:number;frame:number;direction:number;walking:boolean};
let manifest:Manifest|undefined,loading:Promise<void>|undefined;
const idle:BlondFrame[]=[],walk:BlondFrame[]=[];
const load=(url:string)=>new Promise<HTMLImageElement>((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=reject;image.src=url;});

export function loadBlondArt():Promise<void>{
  return loading??= (async()=>{
    const [stationary,walking,data]=await Promise.all([load(`${base}idle-8.png`),load(`${base}walk-right-60.png`),fetch(`${base}frames.json`).then(r=>{if(!r.ok)throw Error('Missing blond frame metadata');return r.json() as Promise<Manifest>;})]);
    if(data.idle.length!==8||data.walk.frames.length!==60)throw Error('Incomplete blond warrior frames');
    const frame=(image:HTMLImageElement,spec:FrameSpec,index:number,walking:boolean):BlondFrame=>({...createSkillFrame(image,{...spec,background:'transparent',bloom:false}),bodyHeight:spec.bodyHeight,frame:index,direction:walking?2:index,walking});
    idle.push(...data.idle.map((spec,i)=>frame(stationary,spec,i,false)));
    walk.push(...data.walk.frames.map((spec,i)=>frame(walking,spec,i,true)));
    manifest=data;
  })();
}
export function blondWalkFrame(seconds:number):number{
  if(!manifest)return 0;
  let time=((Number.isFinite(seconds)?Math.max(0,seconds)*1000:0)+1e-7)%manifest.walk.durationMs;
  for(let i=0;i<manifest.walk.frames.length;i++){if(time<manifest.walk.frames[i].duration!)return i;time-=manifest.walk.frames[i].duration!;}
  return 0;
}
export function blondFrame(direction=0,moving=false,elapsed=0):BlondFrame|undefined{
  const facing=((Math.round(direction)%BLOND_DIRECTIONS.length)+8)%8;
  return moving&&facing===2?walk[blondWalkFrame(elapsed)]:idle[facing];
}
export function blondPlacement(art:BlondFrame,x:number,footY:number,bodyHeight:number){
  return skillFramePlacement(art,x,footY,bodyHeight*art.contentHeight/art.bodyHeight);
}
export function blondImage(direction=0):string{
  const art=blondFrame(direction);return art?`<img src="${art.url}" alt="" draggable="false">`:'';
}
/** Frame and pivot use the same world-unit scale as the parent actor, with visible overflow. */
export function blondBossImage(direction:number,moving:boolean,elapsed:number):string{
  const art=blondFrame(direction,moving,elapsed);if(!art)return '';
  const p=blondPlacement(art,26,68.5625,BLOND_BOSS_BODY_HEIGHT);
  return `<svg class="boss-blond-frame" data-direction="${art.direction}" data-walk-frame="${art.walking?art.frame:-1}" viewBox="0 0 52 73.125" overflow="visible" aria-hidden="true"><image href="${art.url}" x="${p.x-p.width*p.anchorX}" y="${p.y-p.height*p.anchorY}" width="${p.width}" height="${p.height}"/></svg>`;
}

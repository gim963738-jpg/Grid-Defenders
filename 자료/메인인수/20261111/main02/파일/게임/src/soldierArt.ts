import {Rectangle,Texture,type Sprite} from 'pixi.js';
import type {UnitKind} from './defenseConfig';
import {smoothTexture} from './renderQuality';

export const SOLDIER_KINDS=['guard','archer'] as const;
type SoldierKind=typeof SOLDIER_KINDS[number];
type SoldierArt={url:string;texture:Texture;sourceWidth:number;sourceHeight:number;frame:Rectangle;contentHeight:number;anchorY:number};
const frames=new Map<UnitKind,SoldierArt>();

export async function loadSoldierArt():Promise<void>{
  await Promise.all(SOLDIER_KINDS.map(async(kind:SoldierKind)=>{
    if(frames.has(kind))return;
    const url=`${import.meta.env.BASE_URL}assets/soldiers/${kind}-idle-v1.png`;
    const image=await new Promise<HTMLImageElement>((resolve,reject)=>{
      const image=new Image();image.onload=()=>resolve(image);image.onerror=reject;image.src=url;
    });
    // Measure transparent margins for display only; preserve the generated PNG and its alpha.
    const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;
    const ctx=canvas.getContext('2d',{willReadFrequently:true})!;ctx.drawImage(image,0,0);
    const {data}=ctx.getImageData(0,0,canvas.width,canvas.height);
    let left=canvas.width,top=canvas.height,right=-1,bottom=-1;
    // Ignore imperceptible alpha noise when measuring; do not alter any source pixels.
    for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++)if(data[(y*canvas.width+x)*4+3]>=16){
      left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);
    }
    if(right<left)throw new Error(`Empty soldier art: ${kind}`);
    const padding=24,x=Math.max(0,left-padding),y=Math.max(0,top-padding);
    const frame=new Rectangle(x,y,Math.min(canvas.width,right+padding+1)-x,Math.min(canvas.height,bottom+padding+1)-y);
    const original=Texture.from(image),texture=new Texture({source:original.source,frame});smoothTexture(texture);
    frames.set(kind,{url,texture,sourceWidth:canvas.width,sourceHeight:canvas.height,frame,contentHeight:bottom-top+1,anchorY:(bottom+1-y)/frame.height});
  }));
}
export function soldierFrame(kind:UnitKind){return frames.get(kind);}
export function positionSoldier(sprite:Sprite,art:SoldierArt,x:number,footY:number){
  sprite.texture=art.texture;sprite.anchor.set(.5,art.anchorY);sprite.scale.set(44/art.contentHeight);sprite.position.set(x,footY);
}
export function soldierImage(kind:UnitKind):string{
  const art=frames.get(kind);if(!art)return '';
  const f=art.frame;
  return `<svg class="soldier-sprite" data-soldier-art="${kind}" viewBox="${f.x} ${f.y} ${f.width} ${f.height}" preserveAspectRatio="xMidYMax meet" aria-hidden="true"><image href="${art.url}" width="${art.sourceWidth}" height="${art.sourceHeight}"/></svg>`;
}

import {smoothTexture,removeSheetBackground} from './renderQuality';
import {Texture} from 'pixi.js';
import type {UnitKind} from './defenseConfig';
import {createSkillFrame,type SkillFrameArt} from './skillVisual';
import {assassinFrameSpec,type AssassinArtRow} from './assassinVisual';
export const HERO_SHEET_URL=`${import.meta.env.BASE_URL}assets/heroes/hero-roster-sheet.png`;
export const ASSASSIN_SHEET_URL=`${import.meta.env.BASE_URL}assets/effects/assassin-sheet.png`;
const rows:Partial<Record<UnitKind,number>>={tank:0,arcanist:1,assassin:2,healer:3};
export const sheetHero=(kind:UnitKind)=>rows[kind]!==undefined;
type FrameArt={url:string;texture:Texture};
const frames=new Map<string,FrameArt>();let heroSource:HTMLImageElement,assassinSource:HTMLImageElement;
const skillFrames=new Map<string,SkillFrameArt>();
function cut(key:string,image:HTMLImageElement,x:number,y:number,w:number,h:number,canvasWidth=w,canvasHeight=h,dx=0,dy=0):FrameArt {
 const cached=frames.get(key);if(cached)return cached;
 const canvas=document.createElement('canvas');canvas.width=canvasWidth;canvas.height=canvasHeight;const ctx=canvas.getContext('2d')!;
 ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(image,x,y,w,h,dx,dy,w,h);
 const pixels=ctx.getImageData(0,0,canvas.width,canvas.height);
 removeSheetBackground(pixels);
 ctx.putImageData(pixels,0,0);const texture=Texture.from(canvas);smoothTexture(texture);
 const art={url:canvas.toDataURL(),texture};frames.set(key,art);return art;
}
function load(url:string):Promise<HTMLImageElement>{return new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=reject;image.src=url;});}
export async function loadHeroArt():Promise<void>{
 [heroSource,assassinSource]=await Promise.all([load(HERO_SHEET_URL),load(ASSASSIN_SHEET_URL)]);
 for(const [kind,row]of Object.entries(rows))for(let i=0;i<5;i++){
  const attack=i===4,w=attack?226:112,x=attack?1280:806+i*113;
  cut(`${kind}:${i}`,heroSource,x,row!*200+24,w,158,256,180,128-(attack?90:56),12);
 }
}
export function heroFrame(kind:UnitKind,pose:'idle'|'walk'|'attack'='idle',index=0):FrameArt|undefined {return frames.get(`${kind}:${pose==='attack'?4:pose==='walk'?index%4:0}`);}
export function heroImage(kind:UnitKind,pose:'idle'|'walk'|'attack'='idle',index=0):string {
 const art=heroFrame(kind,pose,index);return `<img src="${art?.url??`${import.meta.env.BASE_URL}assets/heroes/${kind}-idle.png`}" alt="" draggable="false">`;
}
export function heroPortrait(kind:UnitKind):string {
 const row=rows[kind];return row===undefined?`<span class="${kind}-portrait"></span>`:`<svg class="hero-sheet-portrait" viewBox="240 ${row*200+3} 500 194" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><image href="${HERO_SHEET_URL}" width="1536" height="801"/></svg>`;
}
export function assassinArt(row:AssassinArtRow,frame:number):SkillFrameArt|undefined {
 if(!assassinSource)return;
 const spec=assassinFrameSpec(row,frame),key=`${row}:${spec.x}:${spec.y}`;
 let art=skillFrames.get(key);if(!art){art=createSkillFrame(assassinSource,spec);skillFrames.set(key,art);}return art;
}

export function assassinSkillIcon(mode:'wave'|'boss'):string {
 const x=mode==='wave'?1330:1434;
 return `<svg viewBox="${x} 879 83 83" aria-hidden="true"><image href="${ASSASSIN_SHEET_URL}" width="1536" height="1024"/></svg>`;
}

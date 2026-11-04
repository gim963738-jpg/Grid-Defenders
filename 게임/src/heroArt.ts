import {smoothTexture,removeSheetBackground} from './renderQuality';
import {Texture} from 'pixi.js';
import type {UnitKind} from './defenseConfig';
export const HERO_SHEET_URL=`${import.meta.env.BASE_URL}assets/heroes/hero-roster-sheet.png`;
export const ASSASSIN_SHEET_URL=`${import.meta.env.BASE_URL}assets/effects/assassin-sheet.png`;
const rows:Partial<Record<UnitKind,number>>={tank:0,arcanist:1,assassin:2,healer:3};
export const sheetHero=(kind:UnitKind)=>rows[kind]!==undefined;
type FrameArt={url:string;texture:Texture};
const frames=new Map<string,FrameArt>();let heroSource:HTMLImageElement,assassinSource:HTMLImageElement;
function cut(key:string,image:HTMLImageElement,x:number,y:number,w:number,h:number,canvasWidth=w,canvasHeight=h,dx=0,dy=0):FrameArt {
 const cached=frames.get(key);if(cached)return cached;
 const canvas=document.createElement('canvas');canvas.width=canvasWidth;canvas.height=canvasHeight;const ctx=canvas.getContext('2d')!;
 ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(image,x,y,w,h,dx,dy,w,h);
 const pixels=ctx.getImageData(0,0,canvas.width,canvas.height),[row,frame]=key.split(':');
 const effect=['basic','wave','boss','impact'].includes(row),actor=row==='basic'||row==='wave'&&Number(frame)<=9||row==='boss'&&Number(frame)<=19;
 removeSheetBackground(pixels,row==='basic',effect?actor:undefined);
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
export function assassinArt(row:'basic'|'wave'|'boss'|'impact',frame:number):FrameArt|undefined {
 if(!assassinSource)return;
 if(row==='impact'){const edges=[24,151,281,410,541,670,806,944,1082,1201],i=Math.max(0,Math.min(8,frame-1));return cut(`impact:${i}`,assassinSource,edges[i]+3,861,edges[i+1]-edges[i]-6,120);}
 if(row==='wave'){
  // Source numbering skips 12: hold cell11 for logical frame12, then use cells labelled13–16.
  const edges=[15,114,214,314,415,516,617,718,819,920,1021,1122,1223,1323,1424,1527];
  const logical=Math.max(1,Math.min(16,frame)),i=logical<=11?logical-1:logical===12?10:logical-2;
  return cut(`${row}:${frame}`,assassinSource,edges[i]+2,286,edges[i+1]-edges[i]-4,120);
 }
 const edges=[20,148,273,398,523,648,773,898,1023,1149,1274,1400,1528],index=Math.max(0,frame-1),col=index%12;
 const y=row==='basic'?66:index<12?512:650,h=row==='basic'?110:index<12?94:98;
 return cut(`${row}:${frame}`,assassinSource,edges[col]+2,y,edges[col+1]-edges[col]-4,h);
}

export function assassinSkillIcon(mode:'wave'|'boss'):string {
 const x=mode==='wave'?1330:1434;
 return `<svg viewBox="${x} 879 83 83" aria-hidden="true"><image href="${ASSASSIN_SHEET_URL}" width="1536" height="1024"/></svg>`;
}

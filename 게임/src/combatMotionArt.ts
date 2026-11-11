import {TURTLE_REGISTRATION} from './actorSpacing';
import {Texture} from 'pixi.js';
import {smoothTexture} from './renderQuality';
import {BLOND_CLIPS} from './blondRuntimeData';
import {createMotion,motionFrame,type ActorMotion,type MotionClip} from './actorMotion';
import type {BlondFrame} from './blondArt';
const base=`${import.meta.env.BASE_URL}assets/combat-motion-v1/`;
const frames=new Map<MotionClip,BlondFrame[]>();
export let motionArtError='';
const surface=(w:number,h:number)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
// Display method 3: premultiplied canvas progressive downsampling and edge-connected alpha cleanup.
// Never changes source files or opaque green artwork. Cache is finite (one frame set per loaded sheet).
function cleanEdge(c:HTMLCanvasElement){const x=c.getContext('2d',{willReadFrequently:true})!,im=x.getImageData(0,0,c.width,c.height),p=im.data,w=c.width,h=c.height,seen=new Uint8Array(w*h),q=new Uint32Array(w*h);let tail=0,head=0;
 const add=(i:number)=>{if(!seen[i]&&p[i*4+3]<=8){seen[i]=1;q[tail++]=i;}};
 for(let i=0;i<w;i++){add(i);add((h-1)*w+i);}for(let j=0;j<h;j++){add(j*w);add(j*w+w-1);}
 while(head<tail){const i=q[head++],k=i*4;if(p[k+3]&&!(p[k+1]>p[k]*1.15&&p[k+1]>p[k+2]*1.1))p[k+3]--;if(i%w)add(i-1);if(i%w<w-1)add(i+1);if(i>=w)add(i-w);if(i<w*(h-1))add(i+w);}
 x.putImageData(im,0,0);
}
function buffer(source:HTMLCanvasElement,scale:number){const w=Math.ceil(source.width*scale),h=Math.ceil(source.height*scale);let current=source;
 while(current.width>w*2&&current.height>h*2){const c=surface(Math.max(w,Math.ceil(current.width/2)),Math.max(h,Math.ceil(current.height/2))),x=c.getContext('2d')!;x.imageSmoothingEnabled=true;x.imageSmoothingQuality='high';x.drawImage(current,0,0,c.width,c.height);current=c;}
 const c=surface(w,h),x=c.getContext('2d')!;x.imageSmoothingEnabled=true;x.imageSmoothingQuality='high';x.drawImage(current,0,0,w,h);cleanEdge(c);return c;
}
function image(url:string){return new Promise<HTMLImageElement>((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>reject(Error(url));i.src=url;});}
function frame(c:HTMLCanvasElement,rootX:number,rootY:number,body:number,index:number):BlondFrame{const texture=Texture.from(c);smoothTexture(texture);return {url:c.toDataURL(),texture,contentWidth:c.width,contentHeight:c.height,padding:0,anchorX:rootX/c.width,anchorY:rootY/c.height,bodyHeight:body,frame:index,direction:2,walking:false};}
let loading:Promise<void>|undefined;
export function loadCombatMotionArt(){return loading??=loadFrames();}
async function loadFrames(){
 const dpr=Math.max(1,Math.min(3,window.devicePixelRatio||1));
 await Promise.all(Object.entries(BLOND_CLIPS).map(async([key,m])=>{try{
  const sheet=await image(`${base}blond-${key}-sheet.png`);
  const cached=m.frameRects.map(([sx,sy,sw,sh],i)=>{const c=surface(448,406),x=c.getContext('2d')!,[ox,oy]=m.frameOffsets[i];
   x.setTransform(m.displayScale,0,0,m.displayScale,m.anchor[0]-m.sourceAnchor[0]*m.displayScale,m.anchor[1]-m.sourceAnchor[1]*m.displayScale);
   x.drawImage(sheet,sx,sy,sw,sh,ox,oy,sw,sh);
   const b=buffer(c,72/200*dpr),rx=b.width/c.width,ry=b.height/c.height;
   return frame(b,m.anchor[0]*rx,m.anchor[1]*ry,200*ry,i);
  });frames.set(key as MotionClip,cached);
 }catch(e){motionArtError+=`금발 ${key} 로드 실패; `;console.error(e);}}));
 await Promise.all((['walk','idle','weak','strong'] as const).map(async key=>{try{
  const sheet=await image(`${base}turtle-${key}.png`),cuts=[0,314,627,940,1254];
  frames.set(key,Array.from({length:16},(_,i)=>{const col=i%4,row=Math.floor(i/4),c=surface(314,314),x=c.getContext('2d')!;
   x.drawImage(sheet,cuts[col],cuts[row],cuts[col+1]-cuts[col],cuts[row+1]-cuts[row],0,0,cuts[col+1]-cuts[col],cuts[row+1]-cuts[row]);
   const b=buffer(c,180/230*dpr);return frame(b,TURTLE_REGISTRATION.contactX*b.width/314,TURTLE_REGISTRATION.footY*b.height/314,TURTLE_REGISTRATION.bodyReference*b.height/314,i);
  }));
 }catch(e){motionArtError+=`터틀 ${key} 로드 실패; `;console.error(e);}}));
}
export function runtimeFrame(m?:ActorMotion){return frames.get(m?.clip??'02')?.[motionFrame(m??createMotion())];}
/** Logical actor x/y is the fixed ground root. A 52 × 73.125 world-unit DOM actor is centered there. */
export function runtimeBossImage(m:ActorMotion|undefined,bodyHeight:number):string{
 const f=runtimeFrame(m);if(!f)return '';const k=bodyHeight/f.bodyHeight,w=f.texture.width*k,h=f.texture.height*k;
 return `<svg class="boss-runtime-frame" data-motion="${m?.clip??'02'}" data-frame="${f.frame}" viewBox="0 0 52 73.125" preserveAspectRatio="xMidYMid meet" overflow="visible" aria-hidden="true"><image href="${f.url}" x="${26-w*f.anchorX}" y="${36.5625-h*f.anchorY}" width="${w}" height="${h}"/></svg>`;
}
export function bossSlimeImage(defense:string,direction:number){const palette=defense==='physical'?'blue':defense==='magic'?'red':'yellow';return `<svg class="boss-slime-frame" viewBox="0 0 52 73.125" overflow="visible" aria-hidden="true"><svg x="-6" y="-19.4375" width="64" height="64" viewBox="${direction*128} 0 128 128" style="overflow:hidden"><image href="${import.meta.env.BASE_URL}assets/monsters/slimes-v1/idle-${palette}.png" width="1024" height="128"/></svg></svg>`;}

import { materialUrl, sampleMaterial, type Material, type MaterialComposition } from './materialModel';
import { renderPreviewCanvas } from './renderer';

type MaterialImage=HTMLImageElement|HTMLCanvasElement;
const recipeCache=new Map<string,HTMLCanvasElement>();
const recipeKey=(m:Material,index:number)=>`${m.id}:${index}`;
function recipeFrame(m:Material,index:number):HTMLCanvasElement {
  const key=recipeKey(m,index),cached=recipeCache.get(key);
  if(cached){recipeCache.delete(key);recipeCache.set(key,cached);return cached;}
  const canvas=renderPreviewCanvas(m.recipeSource!.recipe,index);recipeCache.set(key,canvas);
  let pixels=0;for(const c of recipeCache.values())pixels+=c.width*c.height;
  for(const [k,c] of recipeCache){if(recipeCache.size<=96&&pixels<=8_000_000)break;recipeCache.delete(k);pixels-=c.width*c.height;}
  return canvas;
}
export async function materialFrameCanvas(m:Material,index:number):Promise<HTMLCanvasElement> {
  if(m.recipeSource)return recipeFrame(m,index);
  const f=m.frames[index],image=await loadMaterialImage(m.sheets[f.sheet]),canvas=document.createElement('canvas');
  canvas.width=f.width;canvas.height=f.height;canvas.getContext('2d')!.drawImage(image,f.x,f.y,f.width,f.height,0,0,f.width,f.height);return canvas;
}

const cache=new Map<string,{image:HTMLImageElement;promise:Promise<HTMLImageElement>}>();
export function loadMaterialImage(path:string):Promise<HTMLImageElement> {
  const cached=cache.get(path);if(cached){cache.delete(path);cache.set(path,cached);return cached.promise;}
  const image=new Image();image.decoding='async';
  const promise=new Promise<HTMLImageElement>((resolve,reject)=>{image.onload=()=>resolve(image);image.onerror=()=>{cache.delete(path);reject(Error('재료 이미지를 읽지 못했습니다. '+path));};image.src=materialUrl(path);});
  cache.set(path,{image,promise});
  // Bound decoded atlas memory. Canvas keeps the pixels already drawn, not this cache.
  let pixels=0;for(const item of [...cache.values()].reverse())pixels+=item.image.naturalWidth*item.image.naturalHeight;
  for(const [key,item] of cache){if(cache.size<=40 && pixels<=48_000_000)break;if(key===path || !item.image.complete)continue;cache.delete(key);pixels-=item.image.naturalWidth*item.image.naturalHeight;}
  return promise;
}
export function peekImage(path:string):HTMLImageElement|undefined {const c=cache.get(path);return c?.image.complete&&c.image.naturalWidth?c.image:undefined;}
export function drawMaterialPreview(ctx:CanvasRenderingContext2D,m:Material,index:number,size:number):boolean {
  if(m.recipeSource){ctx.drawImage(recipeFrame(m,index),0,0,size,size);return true;}
  const im=peekImage(m.preview);if(!im){void loadMaterialImage(m.preview).catch(()=>{});return false;}
  ctx.drawImage(im,(index%8)*128,Math.floor(index/8)*128,128,128,0,0,size,size);return true;
}
export async function prepareComposition(c:MaterialComposition,byId:Map<string,Material>,time:number,full:boolean):Promise<Map<string,MaterialImage>> {
  const prepared=new Map<string,MaterialImage>(),paths=new Set<string>();
  for(const l of c.layers){const m=byId.get(l.materialId)!,s=sampleMaterial(l,m,time);if(!s)continue;
    if(m.recipeSource)prepared.set(recipeKey(m,s.index),recipeFrame(m,s.index));
    else paths.add(full?m.sheets[m.frames[s.index].sheet]:m.preview);
  }
  // Retain the images needed by this frame even if the shared browsing cache evicts them.
  await Promise.all([...paths].map(async path=>prepared.set(path,await loadMaterialImage(path))));return prepared;
}
export function drawComposition(target:HTMLCanvasElement,c:MaterialComposition,byId:Map<string,Material>,time:number,full=false,prepared?:ReadonlyMap<string,MaterialImage>):void {
  const ctx=target.getContext('2d')!;ctx.clearRect(0,0,target.width,target.height);ctx.imageSmoothingEnabled=true;
  for(const l of c.layers){
    const m=byId.get(l.materialId)!,s=sampleMaterial(l,m,time);if(!s)continue;
    const f=m.frames[s.index],path=m.recipeSource?recipeKey(m,s.index):full?m.sheets[f.sheet]:m.preview,im=prepared?.get(path)??(m.recipeSource?recipeFrame(m,s.index):peekImage(path));if(!im){void loadMaterialImage(path).catch(()=>{});continue;}
    const scale=target.height*l.scale/Math.max(m.width,m.height)*(1+(l.endScale-1)*s.progress);
    const cw=m.width+2*m.padding,ch=m.height+2*m.padding;
    ctx.save();ctx.translate(l.x*target.width,l.y*target.height);ctx.rotate((l.rotation+l.spin*s.progress)*Math.PI/180);ctx.scale(l.flipX?-scale:scale,scale);
    ctx.globalAlpha=s.alpha;ctx.globalCompositeOperation=l.blend==='add'?'lighter':l.blend==='screen'?'screen':'source-over';ctx.filter=l.hue?`hue-rotate(${l.hue}deg)`:'none';
    if(full||m.recipeSource)ctx.drawImage(im,f.x,f.y,f.width,f.height,-m.padding-l.pivotX*m.width,-m.padding-l.pivotY*m.height,cw,ch);
    else {
      // Preview letterboxing retains the exact source aspect ratio and coordinate origin.
      const side=Math.max(cw,ch),x=-(side-cw)/2-m.padding-l.pivotX*m.width,y=-(side-ch)/2-m.padding-l.pivotY*m.height;
      ctx.drawImage(im,(s.index%8)*128,Math.floor(s.index/8)*128,128,128,x,y,side,side);
    }
    ctx.restore();
  }
}
export function touchesCanvasEdge(c:HTMLCanvasElement):boolean {
  const ctx=c.getContext('2d')!,w=c.width,h=c.height;
  return [[0,0,w,1],[0,h-1,w,1],[0,0,1,h],[w-1,0,1,h]].some(([x,y,a,b])=>{const data=ctx.getImageData(x,y,a,b).data;for(let i=3;i<data.length;i+=4)if(data[i]>0)return true;return false;});
}

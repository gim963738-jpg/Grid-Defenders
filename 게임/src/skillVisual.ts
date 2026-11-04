import {Texture} from 'pixi.js';
import {smoothTexture,removeSheetBackground} from './renderQuality';

/** Visual bounds are independent of hitboxes. Coordinates below refer to the unpadded source cell. */
export interface SkillFrameSpec {
 x:number;y:number;width:number;height:number;
 pivot:{x:number;y:number};
 background:'transparent'|'dark';
 actor?:{x:number;y:number;rx:number;ry:number};
}
export interface SkillFrameArt {
 url:string;texture:Texture;contentWidth:number;contentHeight:number;
 padding:number;anchorX:number;anchorY:number;
}
export const SKILL_FRAME_PADDING=24;
const smooth=(n:number)=>{const t=Math.max(0,Math.min(1,n));return t*t*(3-2*t);};

/** Unmatte luminous pixels instead of making their dark red backdrop opaque. */
export function matteSkillFrame(pixels:ImageData,actor?:SkillFrameSpec['actor']):void {
 const {width:w,height:h,data:d}=pixels;
 const body=actor?new ImageData(new Uint8ClampedArray(d),w,h):undefined;
 if(body)removeSheetBackground(body);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const i=(y*w+x)*4,originalAlpha=d[i+3]/255;
  const rgb=[Math.max(0,d[i]-12),Math.max(0,d[i+1]-15),Math.max(0,d[i+2]-20)];
  const strength=Math.max(...rgb),lightAlpha=strength/235*smooth((strength-10)/35);
  // Keep the actual actor opaque, with a soft transition into the surrounding light.
  const distance=actor?Math.hypot((x-actor.x)/actor.rx,(y-actor.y)/actor.ry):2;
  const bodyAlpha=body?body.data[i+3]/255*smooth((1-distance)/.24):0;
  const edge=Math.min(x,y,w-1-x,h-1-y),light=lightAlpha*smooth(edge/12);
  const alpha=Math.min(1,bodyAlpha+(1-bodyAlpha)*light)*originalAlpha;
  for(let c=0;c<3;c++){
   const glowColor=lightAlpha>0?Math.min(255,rgb[c]/Math.max(lightAlpha,.001)):0;
   d[i+c]=alpha?((d[i+c]*bodyAlpha+glowColor*light*(1-bodyAlpha))*originalAlpha/alpha):0;
  }
  d[i+3]=alpha*255;
 }
}

/** One cached transparent texture, safe gutter and a stable pivot for Canvas and DOM renderers. */
export function createSkillFrame(image:CanvasImageSource,spec:SkillFrameSpec):SkillFrameArt {
 const core=document.createElement('canvas');core.width=spec.width;core.height=spec.height;
 const ctx=core.getContext('2d')!;ctx.drawImage(image,spec.x,spec.y,spec.width,spec.height,0,0,spec.width,spec.height);
 if(spec.background==='dark'){const pixels=ctx.getImageData(0,0,core.width,core.height);matteSkillFrame(pixels,spec.actor);ctx.putImageData(pixels,0,0);}
 const padding=SKILL_FRAME_PADDING,canvas=document.createElement('canvas');canvas.width=core.width+padding*2;canvas.height=core.height+padding*2;
 const output=canvas.getContext('2d')!;
 // A low-opacity bloom continues into the gutter, so the source-cell border never becomes a visible rectangle.
 output.filter='blur(4px)';output.globalAlpha=.24;output.drawImage(core,padding,padding);
 output.filter='none';output.globalAlpha=1;output.drawImage(core,padding,padding);
 const texture=Texture.from(canvas);smoothTexture(texture);
 return {url:canvas.toDataURL(),texture,contentWidth:core.width,contentHeight:core.height,padding,
  anchorX:(padding+spec.pivot.x)/canvas.width,anchorY:(padding+spec.pivot.y)/canvas.height};
}
export function skillFramePlacement(art:SkillFrameArt,x:number,y:number,contentHeight:number){
 const scale=contentHeight/art.contentHeight;
 return {x,y,width:art.texture.width*scale,height:art.texture.height*scale,anchorX:art.anchorX,anchorY:art.anchorY};
}

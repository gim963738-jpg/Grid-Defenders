import type {Texture} from 'pixi.js';
export const battleResolution=(ratio=1)=>Math.max(2,Math.min(3,Number.isFinite(ratio)&&ratio>0?ratio:1));
export function smoothTexture(texture:Texture):void {
 texture.source.scaleMode='linear';texture.source.autoGenerateMipmaps=true;texture.source.mipmapFilter='linear';
}
/** Remove only edge-connected navy backdrop; enclosed dark clothing stays opaque. */
export function removeSheetBackground(pixels:ImageData,featherGlow=false,effectActor?:boolean):void {
 const {data:d,width,height}=pixels,count=width*height,outside=new Uint8Array(count),queue=new Int32Array(count);let read=0,write=0;
 const background=(i:number)=>{const p=i*4,r=d[p],g=d[p+1],b=d[p+2];return !d[p+3]||(r<48&&g<58&&b<68&&r<=Math.max(g,b)+8&&g<=b+14);};
 const visit=(i:number)=>{if(outside[i]||!background(i))return;outside[i]=1;queue[write++]=i;};
 for(let x=0;x<width;x++){visit(x);visit((height-1)*width+x);}for(let y=1;y<height-1;y++){visit(y*width);visit(y*width+width-1);}
 while(read<write){const i=queue[read++],x=i%width;if(x)visit(i-1);if(x<width-1)visit(i+1);if(i>=width)visit(i-width);if(i<count-width)visit(i+width);}
 for(let i=0;i<count;i++){
  const p=i*4;if(outside[i]){d[p]=d[p+1]=d[p+2]=d[p+3]=0;continue;}
  const x=i%width,y=Math.floor(i/width);
  // Glowing arcs enclose backdrop pockets. Keep dark clothing only around the actor, not inside the entire arc.
  if(effectActor!==undefined){
   if(x<2||x>=width-2||y<2||y>=height-2){d[p+3]=0;continue;}
   const body=effectActor&&((x/width-.43)/.25)**2+((y/height-.62)/.4)**2<1;
   if(!body){const brightness=Math.max(d[p],d[p+1],d[p+2]),signal=Math.max(d[p]-Math.max(d[p+1],d[p+2]),brightness-50);d[p+3]*=Math.max(0,Math.min(1,(signal-5)/20));}
  }
  if(!featherGlow)continue;
  const edge=Math.min(x,width-1-x,y,height-1-y),red=d[p]-Math.min(d[p+1],d[p+2]);
  if(edge<9&&(red>25||Math.max(d[p],d[p+1],d[p+2])>185)){const t=edge/9;d[p+3]*=t*t*(3-2*t);}
 }
}

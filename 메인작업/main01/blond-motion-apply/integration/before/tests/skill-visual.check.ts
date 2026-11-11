import {loadHeroArt,assassinArt} from '../src/heroArt';
import {assassinFrameSpec,type AssassinArtRow} from '../src/assassinVisual';
import {createSkillFrame,matteSkillFrame,skillFramePlacement,SKILL_FRAME_PADDING} from '../src/skillVisual';

export async function checkSkillVisual(){
 const passed:string[]=[];const check=(ok:boolean,label:string)=>{if(!ok)throw Error(label);passed.push(label);};
 const sample=new ImageData(32,32);for(let i=0;i<1024;i++)sample.data.set([9,13,19,255],i*4);
 sample.data.set([70,18,29,255],(16*32+12)*4);sample.data.set([255,240,250,255],(16*32+16)*4);
 matteSkillFrame(sample);check(sample.data[(8*32+8)*4+3]===0,'navy sheet backdrop is transparent');
 check(sample.data[(16*32+12)*4+3]<75&&sample.data[(16*32+12)*4]>180,'dim red glow is translucent and unmatte removes its black fringe');
 check(sample.data[(16*32+16)*4+3]>245,'white hit core stays bright');
 const original=document.createElement('canvas');original.width=original.height=8;const originalCtx=original.getContext('2d')!;originalCtx.fillStyle='#080a0f';originalCtx.fillRect(2,2,4,4);
 const preserved=createSkillFrame(original,{x:0,y:0,width:8,height:8,pivot:{x:4,y:8},background:'transparent'}),decoded=new Image();decoded.src=preserved.url;await decoded.decode();
 const probe=document.createElement('canvas');probe.width=probe.height=56;const probeCtx=probe.getContext('2d')!;probeCtx.drawImage(decoded,0,0);const center=probeCtx.getImageData(28,28,1,1).data;
 check(center[0]===8&&center[1]===10&&center[2]===15&&center[3]===255,'already transparent art bypasses dark-background removal and keeps opaque dark details');preserved.texture.destroy(true);
 await loadHeroArt();
 for(const [row,count] of [['basic',12],['wave',16],['boss',24],['impact',9]] as const){
  let clear=true,padded=true,opaque=false;
  for(let i=1;i<=count;i++){
   const a=assassinArt(row,i)!,im=new Image();im.src=a.url;await im.decode();
   const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const ctx=c.getContext('2d')!;ctx.drawImage(im,0,0);const d=ctx.getImageData(0,0,c.width,c.height).data;
   for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++){
    const alpha=d[(y*c.width+x)*4+3];if(x<2||y<2||x>=c.width-2||y>=c.height-2)clear&&=alpha<=1;
    opaque||=alpha>220;
   }
   padded&&=a.texture.width===a.contentWidth+2*SKILL_FRAME_PADDING&&a.texture.height===a.contentHeight+2*SKILL_FRAME_PADDING;
  }
  check(clear&&padded&&opaque,`${row}: every frame has transparent outer edges, a full gutter and a visible core`);
 }
 const ring=assassinFrameSpec('impact',5);check(ring.x===510&&ring.x+ring.width===646,'common ring uses its own measured bounds, without clipping its left side or including the next burst');
 const b=assassinArt('basic',8)!,p=skillFramePlacement(b,99,93,65);
 check(Math.abs(p.width/p.height-b.texture.width/b.texture.height)<1e-9&&p.height>65,'gutter expands visual bounds without stretching or shrinking the source content');
 check(Math.abs(p.y-p.height*p.anchorY+b.padding*65/b.contentHeight+(b.contentHeight-3)*65/b.contentHeight-93)<1e-9,'padding preserves the actor ground pivot');
 const first=assassinArt('wave',10)!,last=assassinArt('wave',16)!;
 check(skillFramePlacement(first,160,38,90).anchorY===skillFramePlacement(last,160,38,90).anchorY,'target burst frames share one fixed foot pivot');
 check(assassinArt('wave',11)===assassinArt('wave',12),'source missing frame12 is explicitly held, not read from the neighboring cell');
 return passed;
}

/** Bright contact sheets expose dark boxes that disappear against a black preview background. */
export async function renderSkillContactSheet(){
 await loadHeroArt();const canvas=document.createElement('canvas');canvas.width=1440;canvas.height=880;const ctx=canvas.getContext('2d')!;
 const rows:[AssassinArtRow,number[]][]=[['basic',Array.from({length:12},(_,i)=>i+1)],['wave',Array.from({length:8},(_,i)=>i+1)],['wave',Array.from({length:8},(_,i)=>i+9)],['boss',Array.from({length:12},(_,i)=>i+1)],['boss',Array.from({length:12},(_,i)=>i+13)],['impact',[1,2,3,4,5,6,7,8,9]]];
 for(let row=0;row<rows.length;row++){
  ctx.fillStyle=row%2?'#aeab8e':'#648346';ctx.fillRect(0,row*146,1440,146);
  for(let col=0;col<rows[row][1].length;col++){
   const n=rows[row][1][col],a=assassinArt(rows[row][0],n)!,im=new Image();im.src=a.url;await im.decode();const scale=.63;
   ctx.drawImage(im,col*120+(120-im.width*scale)/2,row*146+5,im.width*scale,im.height*scale);
   ctx.fillStyle='#ffffff';ctx.font='12px sans-serif';ctx.fillText(`${rows[row][0]} ${n}`,col*120+9,row*146+137);
  }
 }
 return canvas.toDataURL();
}

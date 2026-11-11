import {ImageSource,Texture} from 'pixi.js';
import {battleResolution,removeSheetBackground,smoothTexture} from '../src/renderQuality';
import {assassinBasicTrail,createAssassinAction,cancelAssassin} from '../src/assassinCombat';
export function checkRenderQuality(){
 const passed:string[]=[];const check=(ok:boolean,label:string)=>{if(!ok)throw Error(label);passed.push(label);};
 check(battleResolution(1)===2&&battleResolution(1.25)===2&&battleResolution(2.5)===2.5,'low-DPI screens keep at least double-density battlefield rendering');
 check(battleResolution(4)===3&&battleResolution(NaN)===2&&battleResolution(0)===2,'render density is bounded on extreme or invalid pixel ratios');
 const c=document.createElement('canvas');c.width=c.height=8;const texture=new Texture({source:new ImageSource({resource:c})});smoothTexture(texture);check(texture.source.scaleMode==='linear'&&texture.source.autoGenerateMipmaps&&texture.source.mipmapFilter==='linear','hero textures use linear mipmapped minification');texture.destroy(true);
 const data=new ImageData(7,7);for(let i=0;i<49;i++)data.data.set([12,22,32,255],i*4);for(let y=1;y<6;y++)for(let x=1;x<6;x++)data.data.set([160,70,55,255],(y*7+x)*4);data.data.set([8,10,15,255],(3*7+3)*4);removeSheetBackground(data);
 check(data.data[3]===0&&data.data[(3*7+3)*4+3]===255,'edge backdrop is removed while enclosed dark clothing stays opaque');
 const pocket=new ImageData(data.width,data.height);pocket.data.set(data.data);removeSheetBackground(pocket,false,false);check(pocket.data[(3*7+3)*4+3]===0,'pure effects remove dark pockets enclosed by glowing arcs');
 check(data.data[(3*7+3)*4]===8&&data.data[(3*7+2)*4+3]===255,'foreground colors and opaque edges retain their original coverage');
 const glow=new ImageData(24,24);for(let i=0;i<24*24;i++)glow.data.set([245,60,100,255],i*4);removeSheetBackground(glow,true);
 check(glow.data[3]===0&&glow.data[(12*24+4)*4+3]>0&&glow.data[(12*24+4)*4+3]<255&&glow.data[(12*24+12)*4+3]===255,'cropped red slash fades smoothly at the cell edge without fading its center');
 const action=createAssassinAction('basic',{},1,[2],100,0,0,{x:50,y:0});check(assassinBasicTrail(action)===null,'no extended slash appears before sword windup');action.age=6*action.frameSeconds;const trail=assassinBasicTrail(action)!;
 check(trail.reach>32&&trail.reach<64&&trail.alpha<.65,'slash extends past half a slot while remaining below the adjacent hero center');cancelAssassin(action);check(assassinBasicTrail(action)===null,'cancelled basic immediately hides its extended slash');return passed;
}

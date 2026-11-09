import { createFlamethrower } from '../src/effect-workshop/flamethrower';
import { createGraph } from '../src/effect-workshop/graphModel';
import { parseRecipe, validateRecipe, makeAiPrompt } from '../src/effect-workshop/model';
import { canvas, createSheet, destroyFrames, renderFrame, renderFrames, sheetMetadata } from '../src/effect-workshop/renderer';

export function buildFlamethrowerSources() {
  const checks:string[]=[], files:{name:string;data:string;base64:boolean}[]=[], recipe=validateRecipe(createFlamethrower()), stable=JSON.stringify(recipe);
  const check=(ok:boolean,name:string)=>{if(!ok)throw Error(name);checks.push(name);};
  const png=(name:string,c:HTMLCanvasElement)=>files.push({name,data:c.toDataURL().split(',')[1],base64:true});
  const json=(name:string,value:unknown)=>files.push({name,data:JSON.stringify(value,null,2),base64:false});
  check(JSON.stringify(parseRecipe(stable))===stable,'editable JSON round trip preserves jet layers');
  check(Math.abs(recipe.settings.frames/recipe.settings.fps-2.4)<1e-7,'the authored effect spans 2.4 seconds');
  check(makeAiPrompt(recipe,'수정').includes('splash/jet'),'AI request retains the jet renderer type');
  const frames=renderFrames(recipe), mass:number[]=[], warm:number[]=[], cool:number[]=[];
  try {
    check(frames.length===64&&frames.every(f=>!f.touchesEdge),'all 64 frames stay inside the original content boundary');
    check(!frames[0].visible&&!frames.at(-1)!.visible,'transparent first and last frames avoid a hard repeat cut');
    let transparent=true;
    for(const f of frames){const c=f.canvas,p=c.getContext('2d')!.getImageData(0,0,c.width,c.height).data;let sum=0,red=0,blue=0;
      for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++){const i=(y*c.width+x)*4,a=p[i+3];sum+=a;if(a>32){if(p[i]>p[i+2]*1.2)red+=a;if(p[i+2]>p[i]*1.2)blue+=a;}if(x===0||y===0||x===c.width-1||y===c.height-1)transparent&&=a===0;}
      mass.push(sum);warm.push(red);cool.push(blue);
    }
    check(transparent,'all padded output borders are fully transparent');
    check(Math.min(...mass.slice(18,40))>Math.max(...mass.slice(18,40))*.65,'sustained fire keeps its body instead of fading like a single burst');
    check(warm[22]>10000&&cool[22]>10000,'hot orange emission and cool blue exterior coexist');
    check(cool[57]>warm[57]*3&&cool[57]>1000,'blue residual flame outlasts the orange stream after shutoff');
    const again=renderFrame(recipe,22), graph=structuredClone(recipe);graph.graph=createGraph(graph);const gf=renderFrame(validateRecipe(graph),22);
    try {check(again.canvas.toDataURL()===frames[22].canvas.toDataURL(),'the same seed/frame reproduces identical fire');check(gf.canvas.toDataURL()===frames[22].canvas.toDataURL(),'node output preserves the sustained flame frame');}finally{destroyFrames([again,gf]);}
    const metadata=sheetMetadata(recipe,8);check(metadata.frames.every(f=>f.pivot.x===24+.84*256&&f.pivot.y===24+.52*256),'the nozzle pivot stays fixed through the whole sequence');
    check(metadata.frames.at(-1)!.x===304*7&&metadata.frames.at(-1)!.y===304*7,'the final frame maps to the last valid 8 by 8 sheet cell');
    check(JSON.stringify(recipe)===stable,'rendering leaves source properties unchanged');
    json('blue-flamethrower.effect.json',recipe);json('blue-flamethrower.sheet.json',metadata);png('blue-flamethrower.sheet.png',createSheet(frames,8));
    const contact=canvas(1152,1320), cc=contact.getContext('2d')!;cc.fillStyle='#E5E7E8';cc.fillRect(0,0,1152,1320);cc.fillStyle='#273342';cc.font='18px sans-serif';cc.fillText('청염 화염방사 · 64 frames / 2.4s · 밝은 배경 전체 프레임',12,27);
    frames.forEach((f,i)=>{const x=i%8*144,y=Math.floor(i/8)*160+40;cc.fillStyle=i%2?'#BCD4B3':'#D9DDE1';cc.fillRect(x,y,144,160);cc.drawImage(f.canvas,x,y,144,144);cc.fillStyle='#354353';cc.font='12px sans-serif';cc.fillText(String(i+1),x+5,y+154);});png('blue-flamethrower.contact.png',contact);
    const review=canvas(1216,608), rc=review.getContext('2d')!;
    [5,12,22,36,44,50,55,59].forEach((index,i)=>{const x=i%4*304,y=Math.floor(i/4)*304;rc.fillStyle=i%2?'#A3C493':'#1B202A';rc.fillRect(x,y,304,304);rc.drawImage(frames[index].canvas,x,y);rc.fillStyle=i%2?'#243240':'#DDE7ED';rc.font='16px sans-serif';rc.fillText(`${index+1}F`,x+12,y+28);});png('blue-flamethrower.review.png',review);
    return {checks,metrics:{visible:frames.filter(f=>f.visible).length,touchesEdge:frames.filter(f=>f.touchesEdge).length,mass,warm,cool},files};
  }finally{destroyFrames(frames);}
}

export async function captureFlamethrowerBattle() {
  const {createBattlePreview}=await import('../src/effect-workshop/battle');
  const host=document.createElement('div');host.style.cssText='position:fixed;inset:0 auto auto 0;width:390px;height:430px;z-index:999;background:#203024';document.body.append(host);
  const preview=await createBattlePreview(host), files:{name:string;data:string}[]=[], contact=canvas(1170,860),ctx=contact.getContext('2d')!;
  try {
    for(let scene=0;scene<2;scene++)for(const [column,index] of [9,28,56].entries()) {
      const recipe=createFlamethrower(),f=renderFrame(recipe,index),posed=structuredClone(recipe);
      posed.drawing={version:1,enabled:true,showBase:true,prompt:'검수용 시전자. 분사구보다 오른쪽20px/아래30px에 발 배치.',strokes:[{id:'qa-caster',role:'move',purpose:'direction',directionTarget:'actor',points:[[.93,.656],[.93,.656]],step:1,duration:2.4,delay:0,linger:0,color:'#FFFFFF',width:.005,style:'trail',followActor:false,fold:false,note:'검수용 분사구와 시전자 분리'}]};
      preview.setPosition(170,scene?255:128);preview.draw(f,posed);const c=host.querySelector('canvas')!;
      files.push({name:`blue-flamethrower.battle-${scene?'center':'top'}-${index+1}.png`,data:c.toDataURL().split(',')[1]});
      ctx.drawImage(c,column*390,scene*430,390,430);destroyFrames([f]);
    }
    files.push({name:'blue-flamethrower.battle-contact.png',data:contact.toDataURL().split(',')[1]});return files;
  }finally{preview.destroy();host.remove();}
}

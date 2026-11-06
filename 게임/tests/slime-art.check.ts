import {Container,Texture,Sprite} from 'pixi.js';
import {Defense,enemyRadius,pathPoint,type Enemy} from '../src/defense';
import {PATH} from '../src/defenseConfig';
import {createDefenseView} from '../src/defenseView';
import {stepCombat} from '../src/combatPlayback';
import {loadSlimeArt,slimePose,slimeFrame,slimeDirection,SLIME_RIPPLE} from '../src/slimeArt';

export async function checkSlimeArt(){
 const passed:string[]=[];const check=(ok:boolean,label:string)=>{if(!ok)throw Error(label);passed.push(label);};
 await loadSlimeArt();
 const game=new Defense(()=>1),sample=game.enemies[0],enemy:Enemy={...sample,id:100,named:false,bounty:false,defenseType:'normal',distance:20,...pathPoint(20),speed:20};
 for(const [defenseType,palette] of [['normal','yellow'],['physical','blue'],['magic','red']] as const){
  check(slimePose({...enemy,defenseType},0)?.palette===palette,`${defenseType} uses ${palette} artwork`);
  check(!!slimeFrame({...enemy,defenseType},0),`${palette} texture is loaded`);
 }
 check(slimePose({...enemy,named:true},0)===null&&slimePose({...enemy,bounty:true},0)===null,'named and bounty monsters retain their special appearance');
 check(!slimePose({...enemy,speed:0},.5)!.animated,'stationary yellow slime does not run its movement animation');
 let distance=0;const directions=new Set<number>();
 for(let i=0;i<PATH.length;i++){
  const a=PATH[i],b=PATH[(i+1)%PATH.length],length=Math.hypot(b[0]-a[0],b[1]-a[1]),middle=distance+length/2;
  const direction=slimeDirection(middle);directions.add(direction);
  const pose=slimePose({...enemy,distance:middle},.5)!;
  check(pose.animated===(direction===2),`path segment ${i} animates only when facing right`);
  distance+=length;
 }
 check(directions.size===8,'rounded path uses all eight supplied directions');
 const frames=Array.from({length:30},(_,i)=>slimeFrame(enemy,i/30)!);
 check(new Set(frames.map(f=>f.texture)).size===30,'all thirty original frames are used');
 check(slimeFrame(enemy,1)!.texture===frames[0].texture&&slimeFrame(enemy,29/30)!.texture===frames[29].texture,'one second loops from frame thirty back to frame one');
 check(frames.every(f=>f.anchorX===.5&&f.anchorY===228/256&&f.scale===frames[0].scale),'all frames keep one ground pivot and one uniform scale');
 const data=await fetch(`${import.meta.env.BASE_URL}assets/monsters/slimes-v1/yellow-right-ripple.frames.json`).then(r=>r.json());
 check(data.frameCount===30&&data.defaultFps===30&&data.columns===6&&data.rows===5,'runtime matches source sheet metadata');
 check(frames.every((f,i)=>f.texture.frame.x===data.frames[i].x&&f.texture.frame.y===data.frames[i].y&&f.texture.frame.width===256&&f.texture.frame.height===256),'frame extraction follows original row-major source coordinates');
 const canvas=document.createElement('canvas');canvas.width=1536;canvas.height=1280;const context=canvas.getContext('2d')!;
 context.drawImage(frames[0].texture.source.resource as CanvasImageSource,0,0);
 const pixels=context.getImageData(0,0,1536,1280).data,alpha=(f:number,x:number,y:number)=>pixels[((Math.floor(f/6)*256+y)*1536+(f%6)*256+x)*4+3];
 let clearEdges=true,frozenUpper=true;const lowerHashes=new Set<number>();
 for(let f=0;f<30;f++){
  for(let n=0;n<256;n++)clearEdges&&=alpha(f,n,0)===0&&alpha(f,n,255)===0&&alpha(f,0,n)===0&&alpha(f,255,n)===0;
  let hash=2166136261;
  for(let y=0;y<256;y++)for(let x=0;x<256;x++)for(let c=0;c<4;c++){
   const index=((Math.floor(f/6)*256+y)*1536+(f%6)*256+x)*4+c;
   if(y<158)frozenUpper&&=pixels[index]===pixels[(y*1536+x)*4+c];
   else hash=Math.imul(hash^pixels[index],16777619);
  }
  lowerHashes.add(hash);
 }
 check(clearEdges,'all thirty cells retain transparent borders');
 check(frozenUpper,'upper body and eyes stay pixel-identical across all frames');
 check(lowerHashes.size>1,'only the lower ripple contains changing artwork');
 for(const speed of [.25,1,5]){
  const timed=new Defense(()=>1);timed.speed=speed;stepCombat(.1,speed,(_sim,real)=>timed.tick(real));
  check(Math.abs(timed.elapsed-.1*speed)<1e-8&&slimePose(enemy,timed.elapsed)!.frame===(speed===.25?0:speed===1?3:15),`animation follows actual ${speed} speed game clock`);
  const before=timed.elapsed,texture=slimeFrame(enemy,before)!.texture;stepCombat(1,speed,(_sim,real)=>timed.tick(real),true);
  check(timed.elapsed===before&&slimeFrame(enemy,timed.elapsed)!.texture===texture,`pause freezes the frame at ${speed} speed`);
 }
 const stage=new Container(),view=createDefenseView({stage} as never,game,()=>{},Texture.EMPTY,Texture.EMPTY,Texture.EMPTY,Texture.EMPTY,Texture.EMPTY);
 game.enemies=[enemy,{...enemy,id:101,defenseType:'physical'},{...enemy,id:102,defenseType:'magic'},{...enemy,id:103}];
 const nodes=():Sprite[]=>{const result:Sprite[]=[];const walk=(n:Container)=>{if(n instanceof Sprite&&n.label?.startsWith('slime-'))result.push(n);for(const child of n.children)walk(child);};walk(stage);return result;};
 const snapshot=JSON.stringify(game.enemies);view.draw(null,false);
 check(nodes().length===4&&new Set(nodes().map(n=>n.uid)).size===4,'every monster has its own display node');
 check(nodes().every(n=>n.scale.x===n.scale.y&&n.eventMode==='none'&&!n.mask),'slime sprites preserve proportions and never intercept battlefield input');
 check(nodes().every(n=>n.x===enemy.x&&n.y===enemy.y+8)&&enemyRadius(enemy)===8&&JSON.stringify(game.enemies)===snapshot,'rendering preserves path positions, hit radius and combat state');
 const yellow=nodes().find(n=>n.label==='slime-yellow-100')!,first=yellow.texture;game.elapsed=1/30;view.draw(null,false);
 check(yellow.texture!==first&&yellow.anchor.y===SLIME_RIPPLE.anchorY/256,'live display advances the sheet without moving its ground anchor');
 game.enemies[0].defenseType='magic';view.draw(null,false);check(yellow.label==='slime-red-100','reused enemy id updates its palette');
 game.enemies[0].named=true;view.draw(null,false);check(yellow.destroyed&&nodes().length===3,'switching to a special enemy removes the old slime sprite');
 game.enemies=[];view.draw(null,false);check(nodes().length===0,'removed enemies release all slime display nodes');
 stage.destroy({children:true});return passed;
}

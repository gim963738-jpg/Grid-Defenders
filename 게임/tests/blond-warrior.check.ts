import {Assets,Container,Sprite,Texture} from 'pixi.js';
import {Defense} from '../src/defense';
import {UNITS,ITEMS,SLOTS} from '../src/defenseConfig';
import {BossBattle,waveBossRoster} from '../src/bossBattle';
import {createBossBattleView} from '../src/bossBattleView';
import {createDefenseView} from '../src/defenseView';
import {loadHeroArt,heroPortrait} from '../src/heroArt';
import {blondFrame,blondDirection,blondPlacement,blondWalkFrame,blondBossImage,BLOND_WAVE_BODY_HEIGHT,BLOND_BOSS_BODY_HEIGHT,type BlondFrame} from '../src/blondArt';
import {stepCombat} from '../src/combatPlayback';
import {RANGED_IDLE_URL,RANGED_SOURCE_BODY_HEIGHT} from '../src/rangedArt';

export async function checkBlondWarrior(){
 const passed:string[]=[],check=(ok:boolean,label:string)=>{if(!ok)throw Error(label);passed.push(label);};
 await loadHeroArt();
 const def=UNITS.blond,g=new Defense(()=>1);
 check(def.hero&&def.hp===1400&&def.attack===85&&def.rate===1.1&&def.armor===35&&def.magicArmor===20,'blond warrior has the requested temporary hero stats');
 check(g.summon('blond',0)&&g.gold===480,'blond warrior summons through the existing free hero rules');
 check(!g.summon('blond',1)&&g.units.length===1,'duplicate blond hero is rejected');
 const unit=g.units[0],stats=g.stats(unit);
 check(unit.facing===0&&blondFrame()===blondFrame(0),'newly summoned blond warrior and default art face front');
 check(stats.physicalAttack===85&&stats.magicAttack===0&&stats.critChance===.1&&stats.critMultiplier===1.5,'new hero uses normal physical attack and shared critical stats');
 g.gear.push({id:100,def:ITEMS[0],owner:unit.id,x:0,y:0,turns:0,order:100,costBasis:60});
 check(g.stats(unit).attack===100,'existing equipment modifies the new hero stats');
 const idle=Array.from({length:8},(_,i)=>blondFrame(i)!),metadata=await fetch(`${import.meta.env.BASE_URL}assets/heroes/blond-warrior-v1/frames.json`).then(r=>r.json());
 check(new Set(idle.map(f=>f.texture)).size===8,'all eight supplied idle directions have separate textures');
 for(let i=0;i<8;i++){
  const angle=Math.PI/2-i*Math.PI/4;
  check(blondDirection(Math.cos(angle),Math.sin(angle))===i,`direction ${i} follows actor movement without mirroring`);
 }
 check(blondDirection(0,0,6)===6&&blondDirection(NaN,0)===2,'zero and invalid vectors keep a stable facing');
 let ms=0;const walking:BlondFrame[]=[];
 for(let i=0;i<60;i++){
  const frame=blondFrame(2,true,(ms+metadata.walk.frames[i].duration/2)/1000)!;walking.push(frame);
  check(frame.frame===i&&blondWalkFrame(ms/1000)===i,`source frame ${i} uses its original duration boundary`);
  ms+=metadata.walk.frames[i].duration;
 }
 check(ms===4017&&blondWalkFrame(ms/1000)===0,'all sixty frames loop at original 4017ms, not sixty fps');
 check(new Set(walking.map(f=>f.texture)).size===60&&new Set(walking.map(f=>f.url)).size===60,'all sixty distinct source poses are retained');
 check(blondFrame(2,false,1)===idle[2]&&[0,1,3,4,5,6,7].every(i=>blondFrame(i,true,1)===idle[i]),'walking animation applies only to rightward movement');
 check(walking.every(f=>f.anchorX===walking[0].anchorX&&f.anchorY===walking[0].anchorY&&f.bodyHeight===171.5),'walk keeps the original common foot anchor and one body scale');
 const image=new Image();image.src=`${import.meta.env.BASE_URL}assets/heroes/blond-warrior-v1/walk-right-60.png`;await image.decode();
 const atlas=document.createElement('canvas');atlas.width=1680;atlas.height=1080;const ac=atlas.getContext('2d')!;ac.drawImage(image,0,0);const source=ac.getImageData(0,0,1680,1080).data;
 let clear=true,same=true;
 for(let i=0;i<60;i++){
  const art=walking[i],canvas=art.texture.source.resource as HTMLCanvasElement,w=canvas.width,h=canvas.height,pixels=canvas.getContext('2d')!.getImageData(0,0,w,h).data;
  for(let n=0;n<w;n++)clear&&=pixels[n*4+3]===0&&pixels[((h-1)*w+n)*4+3]===0;
  for(let n=0;n<h;n++)clear&&=pixels[(n*w)*4+3]===0&&pixels[(n*w+w-1)*4+3]===0;
  for(let y=0;y<180;y++)for(let x=0;x<168;x++)for(let c=0;c<4;c++)same&&=pixels[((y+24)*w+x+24)*4+c]===source[((Math.floor(i/10)*180+y)*1680+i%10*168+x)*4+c];
  const p=blondPlacement(art,100,200,72);
  check(Math.abs(p.width/art.texture.width-p.height/art.texture.height)<1e-10&&p.x===100&&p.y===200,`frame ${i} uses uniform scale and a stable world foot position`);
 }
 check(clear&&same,'all sixty runtime frames preserve transparent borders and exact packed RGBA without added bloom');
 const b=new BossBattle(waveBossRoster(g),()=>1),hero=b.actors.find(a=>a.kind==='blond')!,target=b.actors.find(a=>a.kind==='boss')!;
 b.actors=[hero,target];b.autoSkills=false;target.speed=0;target.attack=0;hero.x=100;hero.y=target.y;target.x=700;
 check(hero.hp===1400&&hero.attack===100&&hero.walk?.direction===0,'boss roster receives equipped hero stats and fresh front-facing state');
 b.tick(.05);check(hero.x>100&&hero.walk!.direction===2&&hero.walk!.moving&&hero.walk!.elapsed===.05,'actual boss movement turns right and advances the walking clock');
 for(const speed of [.25,1,5]){
  const run=new BossBattle(waveBossRoster(g),()=>1),h=run.actors.find(a=>a.kind==='blond')!;run.autoSkills=false;
  stepCombat(.1,speed,sim=>run.tick(sim));
  check(Math.abs(h.walk!.elapsed-.1*speed)<1e-8,`boss walking follows ${speed} speed simulation time`);
  const snapshot=JSON.stringify(h);stepCombat(1,speed,sim=>run.tick(sim),true);
  check(JSON.stringify(h)===snapshot,`pause freezes movement and animation at ${speed} speed`);
 }
 target.x=hero.x+hero.range-1;hero.cooldown=0;b.tick(.05);
 check(!hero.walk!.moving&&hero.walk!.elapsed===0&&b.hits.some(h=>h.from===hero.id&&h.damage>0&&!h.magic),'entering attack range stops walking and uses an ordinary physical basic attack');
 check(!b.canHeroSkill(hero.id)&&!b.useHeroSkill(hero.id)&&b.heroSkillCooldowns.size===0&&!b.fireCasts.length&&!b.bladeCasts.length&&!b.assassinActions.length,'preview icon grants no active skill or skill casts');
 b.reset(waveBossRoster(g));check(b.actors.find(a=>a.kind==='blond')!.walk!.elapsed===0&&b.actors.find(a=>a.kind==='blond')!.walk!.direction===0,'boss reset clears movement and restores the front pose');
 const stage=new Container(),view=createDefenseView({stage} as never,g,()=>{},Texture.EMPTY,Texture.EMPTY,Texture.EMPTY,Texture.EMPTY,Texture.EMPTY);
 const pos=SLOTS[0];g.enemies=[{...g.enemies[0],id:999,hp:160,x:pos.x,y:pos.y+70,distance:10}];
 const before=JSON.stringify(g.units);view.draw(null,false);
 const find=(n:Container):Sprite|undefined=>{for(const c of n.children){if(c instanceof Sprite&&c.texture===idle[0].texture)return c;const nested=find(c);if(nested)return nested;}};
 const sprite=find(stage)!;check(!!sprite&&sprite.visible&&sprite.scale.x===sprite.scale.y&&sprite.eventMode==='none'&&JSON.stringify(g.units)===before,'summoned wave hero stays front-facing even with an enemy in range');
 check(Math.abs(sprite.scale.y*idle[0].bodyHeight-57)<.01&&BLOND_WAVE_BODY_HEIGHT===57&&sprite.x===pos.x&&sprite.y===pos.y+12,'wave blond retains its original body height and foot position');
 check(BLOND_BOSS_BODY_HEIGHT===72&&blondBossImage(0,false,0).includes('boss-blond-frame'),'boss blond retains its original body height through the original pivot renderer');
 for(let i=0;i<5;i++)g.tick(.05);view.draw(null,false);
 check(unit.facing===0&&sprite.texture===idle[0].texture,'waiting for the first attack keeps the front pose');
 for(let i=0;i<2;i++)g.tick(.05);view.draw(null,false);
 const shot=g.shots.find(s=>s.x===pos.x&&s.y===pos.y)!;
 check(!!shot&&unit.facing===blondDirection(shot.tx-pos.x,shot.ty-pos.y)&&sprite.texture===idle[unit.facing!].texture,'actual first attack turns the hero toward its combat target');stage.destroy({children:true});
 const ids=['boss-hero-skills','boss-auto-skills','boss-commander-skill'],originals=ids.map(id=>document.getElementById(id));
 originals.forEach((n,i)=>{if(n)n.id=`blond-check-preserved-${ids[i]}`;});
 const fixture=document.createElement('div');fixture.hidden=true;fixture.innerHTML='<div id="boss-hero-skills"></div><button id="boss-auto-skills"></button><button id="boss-commander-skill"><i class="boss-skill-icon"></i><small class="boss-skill-time"></small><strong></strong></button>';document.body.append(fixture);
 try{
  const root=document.createElement('div'),status=document.createElement('p');fixture.append(root,status);
  const a=b.actors.find(a=>a.kind==='blond')!,v=createBossBattleView(root,status,b);v.draw();
  check(root.querySelector('.boss-blond-frame')?.getAttribute('data-direction')==='0'&&root.querySelector('.boss-blond-frame')?.getAttribute('data-walk-frame')==='-1','boss spawn displays the original front cut before any action');
  a.walk={direction:2,moving:true,elapsed:1};v.draw();
  check(root.querySelector('.boss-blond-frame')?.getAttribute('data-walk-frame')===String(blondWalkFrame(1)),'boss display uses the sixty-frame walk art at model time');
  check(!fixture.querySelector('[data-hero-skill]')&&fixture.querySelector('.boss-skill-preview')?.getAttribute('aria-disabled')==='true'&&!!fixture.querySelector('.boss-skill-preview img'),'boss preview icon is visibly unassigned and cannot activate a skill');
  check(heroPortrait('blond').includes('portrait.png')&&!!fixture.querySelector('.boss-skill-hero-card .blond-portrait'),'hero cards and boss HUD use the new blond portrait');
  a.walk={direction:6,moving:true,elapsed:1};v.draw();check(root.querySelector('.boss-blond-frame')?.getAttribute('data-walk-frame')==='-1'&&blondBossImage(6,true,1).includes('data-direction="6"'),'other boss directions use the supplied idle image');
  b.actors=[];v.draw();check(!root.querySelector('.boss-fighter.blond'),'cleared roster removes the blond actor display');
 }finally{fixture.remove();originals.forEach((n,i)=>{if(n)n.id=ids[i];});}
 const comparison=new Defense(()=>1);comparison.summon('ranged',0);comparison.summon('blond',1);
 const reference=await Assets.load<Texture>(RANGED_IDLE_URL),comparisonStage=new Container();
 const comparisonView=createDefenseView({stage:comparisonStage} as never,comparison,()=>{},reference,Texture.EMPTY,Texture.EMPTY,Texture.EMPTY,Texture.EMPTY);
 const comparisonState=JSON.stringify(comparison.units);comparisonView.draw(null,false);
 const allSprites:Sprite[]=[];const visit=(node:Container)=>{for(const child of node.children){if(child instanceof Sprite)allSprites.push(child);if(child instanceof Container)visit(child);}};visit(comparisonStage);
 const caster=allSprites.find(s=>s.visible&&s.texture===reference)!,warrior=allSprites.find(s=>s.visible&&s.texture===idle[0].texture)!;
 check(!!caster&&!!warrior&&Math.abs(caster.scale.y*RANGED_SOURCE_BODY_HEIGHT-warrior.scale.y*idle[0].bodyHeight)<.01,'actual caster and blond wave sprites share the same head-to-foot body height');
 check(caster.height>57&&Math.abs(warrior.scale.y*idle[0].bodyHeight-57)<.01&&JSON.stringify(comparison.units)===comparisonState,'caster grows to the unchanged blond reference without changing combat stats');
 comparisonStage.destroy({children:true});
 return passed;
}

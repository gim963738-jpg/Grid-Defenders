import {ReadyBossBattle as BossBattle} from './ready-boss-fixture';
import {Container,Graphics,Sprite,Text,Texture} from 'pixi.js';
import {Defense,type Enemy} from '../src/defense';
import {SLOTS,type UnitKind} from '../src/defenseConfig';
import {createDefenseView} from '../src/defenseView';
import {loadHeroArt} from '../src/heroArt';
import {loadSoldierArt} from '../src/soldierArt';
import {loadSlimeArt} from '../src/slimeArt';
import {runtimeFrame,loadCombatMotionArt} from '../src/combatMotionArt';
import {waveBossRoster} from '../src/bossBattle';
import {createBossBattleView} from '../src/bossBattleView';

export async function checkActorDepth(){
 const passed:string[]=[],check=(ok:boolean,label:string)=>{if(!ok)throw Error(label);passed.push(label);};
 await Promise.all([loadHeroArt(),loadCombatMotionArt(),loadSoldierArt(),loadSlimeArt()]);
 const game=new Defense(()=>1),sample={...game.enemies[0]},stage=new Container();
 const layout:[UnitKind,number][]=[['guard',0],['guard',1],['guard',2],['guard',3],['archer',8],['ranged',9],['archer',10],['archer',11],['mage',12],['mage',13],['mage',14],['mage',15],['blond',5]];
 game.units=layout.map(([kind,slot],i)=>({id:100+i,kind,slot,level:1,spent:0,cooldown:.3,...(kind==='blond'?{facing:0}:{})})).reverse();game.enemies=[];
 const view=createDefenseView({stage} as never,game,()=>{},Texture.EMPTY,Texture.EMPTY,Texture.EMPTY,Texture.EMPTY,Texture.EMPTY);
 const walk=(n:Container):Container[]=>[n,...n.children.flatMap(c=>walk(c))];
 const get=(label:string)=>walk(stage).find(n=>n.label===label)!;
 const snapshot=JSON.stringify(game.units);view.draw(null,false);
 const depth=get('actor-depth-layer'),guard=walk(stage).find(n=>n instanceof Sprite&&n.label?.startsWith('soldier-guard-')&&n.x===SLOTS[0].x&&n.y===SLOTS[0].y+12) as Sprite;
 const hero=walk(stage).find(n=>n instanceof Sprite&&n.texture===runtimeFrame()!.texture) as Sprite;
 const behind=(a:Container,b:Container)=>depth.children.indexOf(a)<depth.children.indexOf(b);
 check(!!guard&&!!hero&&behind(guard.parent!,hero.parent!),'upper soldier feet render behind the lower blond hero regardless of unit insertion order');
 check(guard.parent===get('unit-slot-0')&&hero.parent===get('unit-slot-5'),'soldiers and heroes use the same ground-depth layer');
 check(behind(get('unit-slot-10'),get('unit-slot-15'))&&behind(get('unit-slot-15'),get('unit-slot-5')),'archer images and fallback mage graphics follow row depth');
 check(depth.children.filter(n=>n.visible&&n.label?.startsWith('unit-slot-')).every((n,i,a)=>!i||a[i-1].zIndex<=n.zIndex),'all visible formation rows are ordered by their feet');
 check(JSON.stringify(game.units)===snapshot&&hero.x===SLOTS[5].x&&hero.y===SLOTS[5].y+12&&hero.scale.x===hero.scale.y,'depth sorting leaves units, scale, ground pivots and placement unchanged');
 const badge=get('actor-hud-layer').children.find(n=>n instanceof Text&&n.text==='영웅 검')!;
 check(!!badge&&badge.parent===get('actor-hud-layer')&&depth.parent!.children.indexOf(badge.parent!)>depth.parent!.children.indexOf(depth),'nameplate HUD remains above all hero actor bodies');
 check(get('unit-slot-12').children.some(n=>n instanceof Graphics&&n.width>0),'fallback characters retain their body drawing');
 const ranged=game.units.find(u=>u.kind==='ranged')!;game.rangedSkills.set(ranged.id,{cooldown:2,shotsLeft:0,delay:0,casts:1});view.draw(null,false);
 check(get('actor-hud-layer').children.some(n=>n instanceof Text&&n.visible&&n.text==='2.0s'),'skill cooldown labels remain attached to the correct unit depth');
 const blond=game.units.find(u=>u.kind==='blond')!,upper=game.units.find(u=>u.slot===0)!;
 [blond.slot,upper.slot]=[upper.slot,blond.slot];view.draw(null,false);
 check(behind(guard.parent!,hero.parent!),'hero priority remains after reversing hero and soldier rows reverses their visible overlap');
 check(hero.parent===get('unit-slot-0')&&guard.parent===get('unit-slot-5'),'moving units reparents body art to its current tile');
 // Both layouts need a vacant front-row destination; portrait has no slot 16.
 const frontSlot=SLOTS.length-1;game.units=game.units.filter(u=>u.slot!==frontSlot);
 check(game.moveUnit(blond.id,frontSlot),'hero moves through the existing placement model');view.draw(null,false);
 check(hero.parent===get(`unit-slot-${frontSlot}`)&&behind(guard.parent!,hero.parent!)&&!get('unit-slot-0').visible,'moving to the front row updates depth and hides the old tile information');
 const enemy:Enemy={...sample,id:999,x:SLOTS[frontSlot].x,y:40,distance:20,named:false,bounty:false,defenseType:'normal',hp:160};game.enemies=[enemy];view.draw(null,false);
 const enemyNode=get('enemy-999'),slime=walk(stage).find(n=>n instanceof Sprite&&n.label==='slime-yellow-999') as Sprite;
 check(behind(enemyNode,hero.parent!)&&slime.parent===enemyNode,'monsters share ground depth with friendly sprites');
 enemy.y=300;view.draw(null,false);check(behind(enemyNode,hero.parent!),'hero remains above a monster moving below formation');
 enemy.named=true;view.draw(null,false);check(slime.destroyed&&get('enemy-999').children.some(n=>n instanceof Graphics&&n.width>0),'special monster conversion replaces only the body and keeps its depth group');
 game.enemies=[];view.draw(null,false);check(enemyNode.destroyed&&!walk(stage).some(n=>n.label==='enemy-999'),'removed monsters release body, health and label together');
 game.enemies=[{...enemy,named:false}];view.draw(null,false);check(!!get('enemy-999')&&walk(stage).some(n=>n instanceof Sprite&&n.label==='slime-yellow-999'),'reused monster id recreates a working shared-texture sprite');
 game.damageNumbers=[{id:1,x:100,y:100,damage:123,critical:false,life:.75}];view.draw(null,false);
 const number=walk(stage).find(n=>n instanceof Text&&n.text==='123')!;
 check(number.parent===depth.parent&&depth.parent!.children.indexOf(number)>depth.parent!.children.indexOf(depth),'damage numbers stay above all sorted actors');
 check(depth.parent!.children.indexOf(get('attack-effects'))>depth.parent!.children.indexOf(depth),'projectile and hit lines remain above character bodies');
 game.units=game.units.filter(u=>u.id!==blond.id);view.draw(null,false);check(!hero.visible&&!get(`unit-slot-${frontSlot}`).visible,'removed heroes leave no floating nameplate or body');
 stage.destroy({children:true});

 const ids=['boss-hero-skills','boss-auto-skills','boss-commander-skill'],originals=ids.map(id=>document.getElementById(id));originals.forEach((n,i)=>{if(n)n.id=`depth-check-preserved-${ids[i]}`;});
 const fixture=document.createElement('div');fixture.hidden=true;fixture.innerHTML='<div id="boss-hero-skills"></div><button id="boss-auto-skills"></button><button id="boss-commander-skill"><small class="boss-skill-time"></small><strong></strong></button>';document.body.append(fixture);
 try{
  const g=new Defense(()=>1);g.summon('blond',0);g.summon('guard',5);const battle=new BossBattle(waveBossRoster(g),()=>1),front=battle.actors.find(a=>a.kind==='guard')!,back=battle.actors.find(a=>a.kind==='blond')!;
  front.y=150;back.y=90;battle.actors=[front,back,...battle.actors.filter(a=>a.side==='enemy')];
  const root=document.createElement('div'),status=document.createElement('p');fixture.append(root,status);const bossView=createBossBattleView(root,status,battle);bossView.draw();
  const layer=root.querySelector<HTMLElement>('.boss-actor-layer')!,frontNode=layer.querySelector<HTMLElement>('.guard')!,backNode=layer.querySelector<HTMLElement>('.blond')!;
  check(Number(backNode.style.zIndex)>Number(frontNode.style.zIndex),'boss hero remains above soldier regardless of feet order');
  check(getComputedStyle(layer).isolation==='isolate'&&Number(getComputedStyle(layer).zIndex)===2,'boss depth is confined to its own stacking context');
  const oldLeft=frontNode.style.left;front.y=60;back.y=200;bossView.draw();
  check(Number(backNode.style.zIndex)>Number(frontNode.style.zIndex)&&frontNode.style.left===oldLeft&&layer.querySelector('.guard')===frontNode,'crossing boss rows updates depth without recreating or shifting actor images');
  battle.hits=[{from:back.id,to:'tester-boss',x:900,y:281.25,damage:123,magic:false,life:.3}];bossView.draw();
  const effects=root.querySelector<SVGElement>('.boss-hit-trails')!;
  check(effects.parentElement===root&&Number(getComputedStyle(effects).zIndex)>Number(getComputedStyle(layer).zIndex)&&!layer.querySelector('.boss-damage-number'),'boss hit effects and damage text stay above sorted characters');
  battle.actors=[];battle.hits=[];bossView.draw();check(layer.childElementCount===0,'boss reset removes old depth-sorted character nodes');
 }finally{fixture.remove();originals.forEach((n,i)=>{if(n)n.id=ids[i];});}
 return passed;
}

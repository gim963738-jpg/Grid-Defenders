import {Defense,pathPoint} from '../src/defense';
import {BossBattle,waveBossRoster} from '../src/bossBattle';
import {GameRun} from '../src/gameRun';
import {SLOTS,UNITS} from '../src/defenseConfig';
import {captureBattle,restoreBattle,type BattleSaveMeta} from '../src/battleSave';
import {createMotion,startMotion,advanceMotion,motionFrame,motionDuration,contactTime,knockbackMotion,dieMotion,locked} from '../src/actorMotion';
import {groundRadius,separateActors} from '../src/actorSpacing';
export function checkRuntimeMotion(){
 const passed:string[]=[],check=(ok:boolean,label:string)=>{if(!ok)throw Error(label);passed.push(label);},near=(a:number,b:number)=>Math.abs(a-b)<1e-6;
 const meta:BattleSaveMeta={runId:'motion',scene:'boss',activeBossWave:10,bossReturnDelay:0,bossTestMode:false,bossEncounterWave:10,defeatedBossEnemies:[],combatPaused:false};
 const fixture=()=>{const game=new Defense(()=>1);game.summon('blond',0);game.keepWaveMonsters=true;const run=new GameRun();run.start('normal');const boss=new BossBattle(waveBossRoster(game),()=>1);boss.autoSkills=false;return {game,run,boss};};
 check(UNITS.blond.range===100&&UNITS.blond.attack===85,'range 100, attack 85 and no new skills');
 const f=fixture(),b=f.boss,initial=JSON.stringify(b.actors.map(a=>[a.x,a.y,a.hp,a.cooldown]));
 b.tick(2.4);check(b.elapsed===0&&near(b.preparationRemaining,.6)&&initial===JSON.stringify(b.actors.map(a=>[a.x,a.y,a.hp,a.cooldown])),'three-second preparation freezes movement HP cooldown and combat timer');
 check(!b.commanderSkill()&&!b.canHeroSkill(b.actors[0].id),'preparation blocks manual and automatic skills');
 const prepSave=captureBattle(f.game,b,f.run,meta,1),prepCopy=fixture();check(!!prepSave&&!!restoreBattle(prepSave,prepCopy.game,prepCopy.boss,prepCopy.run)&&near(prepCopy.boss.preparationRemaining,.6),'partial preparation save restores remaining .6 seconds');
 b.tick(.6);check(b.elapsed===0&&b.preparationRemaining<1e-8,'preparation completion does not consume fight time');b.tick(.1);check(near(b.elapsed,.1),'fight starts after preparation');
 const enemies=b.actors.filter(a=>a.side==='enemy');check(enemies.length===4&&enemies.filter(a=>a.kind==='retainer').length===3&&new Set(enemies.filter(a=>a.kind==='retainer').map(a=>a.defenseType)).size===3,'exactly turtle and yellow blue red retainers');
 for(const clip of ['03','04','05','06'] as const){
  const m=createMotion();m.sequence=['03','04','05','06'].indexOf(clip);startMotion(m,1,85);const hitAt=contactTime(clip);
  check(!advanceMotion(m,hitAt-.0001),clip+' no early damage');check(advanceMotion(m,.0001),clip+' contact emits one event');
  const frozen=motionFrame(m);advanceMotion(m,.08);check(motionFrame(m)===frozen&&!advanceMotion(m,0),clip+' 160 source-ms actor-only hold and no duplicate');
  advanceMotion(m,2);check(!locked(m)&&motionFrame(m)===(clip==='05'?6:11),clip+' recovery ends at approved last frame');
 }
 check(near(contactTime('weak'),.570)&&near(contactTime('strong'),1.205)&&near(motionDuration('weak'),1.3)&&near(motionDuration('strong'),2.2),'turtle v07 exact contact and recovery durations');
 const turtle=createMotion(true),order:string[]=[];for(let i=0;i<3;i++){startMotion(turtle,'ally',120,false,true);order.push(turtle.clip);let hits=0;for(let t=0;t<230;t++)if(advanceMotion(turtle,.01))hits++;check(hits===1,'turtle action '+i+' exactly one hit');}check(order.join(',')==='weak,weak,strong','weak idle weak idle strong cycle');
 function duel(turtle=false){const f=fixture(),b=f.boss;b.preparationRemaining=0;const h=b.actors[0],e=b.actors.find(a=>a.kind==='boss')!;b.actors=[h,e];Object.assign(h,{x:300,y:350,speed:0,cooldown:turtle?999:0,hp:100000,maxHp:100000});Object.assign(e,{x:375,y:350,speed:0,cooldown:turtle?0:999,hp:100000,maxHp:100000,physicalArmor:0});return {...f,h,e};}
 const d=duel();d.boss.tick(.001);check(d.e.hp===100000&&d.h.motion?.clip==='03','real boss model starts motion without immediate damage');d.h.cooldown=999;
 d.boss.tick(.30);check(d.e.hp===100000,'boss model waits before 03 frame6 end');
 const saved=captureBattle(d.game,d.boss,d.run,meta,2),copy=fixture();check(!!saved&&!!restoreBattle(saved,copy.game,copy.boss,copy.run),'pending blond hit serializes');
 d.boss.tick(.1);copy.boss.tick(.1);check(near(d.e.hp,99915)&&JSON.stringify(copy.boss.actors)===JSON.stringify(d.boss.actors),'pending hit restores exactly once at correct damage');
 const afterSave=captureBattle(d.game,d.boss,d.run,meta,3),after=fixture();check(!!afterSave&&!!restoreBattle(afterSave,after.game,after.boss,after.run),'post-hit hold serializes');d.boss.tick(1);after.boss.tick(1);check(JSON.stringify(after.boss.actors)===JSON.stringify(d.boss.actors)&&d.e.hp===99915,'restored hitstop and recovery never replay damage');
 const miss=duel();miss.boss.tick(.001);miss.h.cooldown=999;miss.e.x=550;miss.boss.tick(.6);check(miss.e.hp===100000,'target leaving 100 range whiffs without retarget');
 const deadTarget=duel();deadTarget.boss.tick(.001);deadTarget.e.hp=0;deadTarget.boss.tick(1);check(deadTarget.boss.hits.length===0,'dead original target cancels damage');
 const t=duel(true);t.boss.tick(.001);t.e.cooldown=999;t.boss.tick(.55);check(t.h.hp===100000,'turtle real model no damage before .570');t.boss.tick(.03);check(t.h.hp<100000,'turtle real model contact deals damage');const health=t.h.hp;t.boss.tick(2);check(t.h.hp===health,'turtle model recovery grants no duplicate');
 const partial=duel();partial.game.summon('guard',1);const guard=new BossBattle(waveBossRoster(partial.game)).actors.find(a=>a.kind==='guard')!;guard.cooldown=999;guard.speed=0;partial.boss.actors.push(guard);partial.h.hp=0;partial.boss.tick(2);check(partial.boss.result==='fighting'&&motionFrame(partial.h.motion!)===11&&!partial.boss.deathPlaying,'dead blond finishes while another ally continues fighting');
 const dying=duel();dying.boss.tick(.01);dying.h.hp=0;dying.boss.tick(.01);check(dying.h.motion?.clip==='08'&&dying.boss.deathPlaying,'zero HP enters visible death and cancels pending attack');dying.boss.tick(3);check(!dying.boss.deathPlaying&&motionFrame(dying.h.motion!)===11,'terminal battle advances full death and holds last pose');
 const m=createMotion();check(!knockbackMotion(m,0)&&m.clip==='02','ordinary nonknockback damage cannot enter hurt');check(knockbackMotion(m,10)&&String(m.clip)==='07','explicit knockback enters hurt');dieMotion(m);check(!knockbackMotion(m,10)&&String(m.clip)==='08','death cannot be interrupted by hurt');
 const wave=new Defense(()=>1);wave.summon('blond',0);const u=wave.units[0],slot=SLOTS[0],enemy=wave.enemies[0];Object.assign(enemy,{...slot,speed:0,hp:100000,maxHp:100000,armor:0,defenseType:'normal'});wave.waveSpawned=10;u.cooldown=0;const foot=JSON.stringify(SLOTS[u.slot]);wave.tick(.001);check(wave.logs.damage.length===0&&u.motion?.clip==='03','wave motion starts without damage');u.cooldown=999;wave.tick(.4);check(wave.logs.damage.length===1&&JSON.stringify(SLOTS[u.slot])===foot,'wave hit emitted once while slot remains fixed');
 wave.nextTestWave();check(u.motion?.clip==='02'&&u.motion.targetId===null,'wave transition cancels pending pose into idle');
 for(const scale of [.25,1,4]){const a=duel(),c=duel();for(let i=0;i<100;i++)a.boss.tick(.01*scale);c.boss.tick(scale);check(a.h.hp===c.h.hp&&a.e.hp===c.e.hp&&a.h.motion!.sequence===c.h.motion!.sequence&&Math.abs(a.h.cooldown-c.h.cooldown)<.021&&Math.abs(a.h.motion!.age-c.h.motion!.age)<.021,'large update retains all contacts, substep timing tolerance <=20ms at '+scale+'x');}
 for(const shape of ['same','diagonal','boundary','crowd']){const actors=Array.from({length:shape==='crowd'?16:4},(_,i)=>({id:'a'+i,kind:i===0?'boss':'retainer',hp:1,x:shape==='same'?300:shape==='boundary'?0:300+i*5,y:shape==='same'?200:shape==='boundary'?0:200+i*5}));separateActors(actors,1250,562.5);for(let pass=0;pass<20;pass++)separateActors(actors,1250,562.5);let gap=Infinity;for(let i=0;i<actors.length;i++)for(let j=i+1;j<actors.length;j++)gap=Math.min(gap,Math.hypot(actors[i].x-actors[j].x,actors[i].y-actors[j].y)-groundRadius(actors[i])-groundRadius(actors[j]));check(gap>=1.9&&actors.every(a=>Number.isFinite(a.x)&&a.x>=groundRadius(a)),shape+' deterministic spacing and boundaries');}
 return passed;
}

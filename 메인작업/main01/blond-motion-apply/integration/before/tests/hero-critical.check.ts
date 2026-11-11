import {Defense,pathPoint} from '../src/defense';
import {BossBattle,waveBossRoster} from '../src/bossBattle';
import {criticalAttack} from '../src/critical';
export function checkHeroCritical(){
 const passed:string[]=[];const check=(ok:boolean,s:string)=>{if(!ok)throw Error(s);passed.push(s);};
 let rolls=0;const frozen=criticalAttack({attack:100},{critChance:.1,critMultiplier:2},()=>{rolls++;return 0;});
 check(frozen.critical&&frozen.attack===200&&rolls===1,'critical snapshot rolls once and supports configured damage multiplier');
 check(!criticalAttack({attack:100},{critChance:0},()=>{throw Error('unexpected roll');}).critical,'zero chance does not roll');
 for(const kind of ['melee','ranged','assassin'] as const){
  const wave=(critical:boolean)=>{let rolls=0;const g=new Defense(()=>{rolls++;return critical?0:1;});g.summon(kind,2);g.units[0].cooldown=999;const template=g.enemies[0];
   g.enemies=[200,208].map((distance,i)=>({...template,id:100+i,distance,...pathPoint(distance),speed:0,hp:100000,maxHp:100000,defenseType:'normal' as const}));g.waveSpawned=10;
   for(let i=0;i<39;i++)g.tick(.05);return {g,rolls,logs:g.logs.damage};};
  const yes=wave(true),no=wave(false);
  check(yes.rolls===1&&no.rolls===1,kind+' wave rolls exactly once for entire skill');
  check(yes.logs.length===(kind==='melee'?12:kind==='ranged'?6:1)&&yes.logs.every(l=>l.critical===true)&&no.logs.every(l=>l.critical===false),kind+' wave all beats and victims share critical flag');
  check(yes.logs.every((l,i)=>Math.abs(l.attack!-no.logs[i].attack!*1.5)<1e-8),kind+' wave applies multiplier exactly once to every beat');
  const boss=(critical:boolean)=>{let rolls=0;const prep=new Defense(()=>1);prep.summon(kind,0);const b=new BossBattle(waveBossRoster(prep),()=>{rolls++;return critical?0:1;});b.autoSkills=false;
   const h=b.actors.find(a=>a.kind===kind)!,e=b.actors.find(a=>a.side==='enemy')!;Object.assign(h,{x:100,y:100,cooldown:999,speed:0});
   const enemies=[150,158].map((x,i)=>({...e,id:'target'+i,x,y:100,hp:100000,maxHp:100000,physicalArmor:0,magicArmor:0,defenseType:'normal' as const,cooldown:999,speed:0}));b.actors=[h,...enemies];b.useHeroSkill(h.id);
   const cast=kind==='melee'?b.bladeCasts[0]:kind==='ranged'?b.fireCasts[0]:b.assassinActions[0];
   for(let i=0;i<39;i++)b.tick(.05);return {b,rolls,cast,loss:enemies.map(e=>100000-e.hp)};};
  const by=boss(true),bn=boss(false);
  check(by.rolls===1&&bn.rolls===1,kind+' boss rolls once, never per target or beat');
  check(by.cast.critical===true&&bn.cast.critical===false,kind+' boss stores the cast critical decision');
  check(by.loss.every((n,i)=>n>0&&Math.abs(n-bn.loss[i]*1.5)<1e-7),kind+' boss every victim takes the same critical multiplier');
 }
 for(const kind of ['tank','melee','ranged','healer','arcanist','assassin'] as const){
  let rolls=0;const g=new Defense(()=>{rolls++;return 0;});g.summon(kind,2);const u=g.units[0],e=g.enemies[0];u.cooldown=0;Object.assign(e,{distance:200,...pathPoint(200),speed:0,hp:100000,maxHp:100000,defenseType:'normal'});g.waveSpawned=10;
  g.meleeSkills.set(u.id,{casts:0,cooldown:999});g.assassinSkills.set(u.id,{casts:0,cooldown:999});g.rangedSkills.set(u.id,{casts:0,cooldown:999,delay:0,shotsLeft:0});
  g.tick(.001);u.cooldown=999;for(let i=0;i<20;i++)g.tick(.05);
  check(rolls===1&&g.logs.damage.length>0&&g.logs.damage.every(l=>l.critical===true),kind+' wave basic preserves a single critical roll through delayed hits/projectiles');
  let bossRolls=0;const b=new BossBattle(waveBossRoster(g),()=>{bossRolls++;return 0;});b.autoSkills=false;const h=b.actors.find(a=>a.side==='ally')!,t=b.actors.find(a=>a.side==='enemy')!;
  Object.assign(h,{x:100,y:100,cooldown:0,speed:0});Object.assign(t,{x:150,y:100,cooldown:999,speed:0,hp:100000,maxHp:100000});b.actors=[h,t];b.tick(.001);h.cooldown=999;let sawCritical=b.hits.some(hit=>hit.from===h.id&&hit.critical);
  for(let i=0;i<20;i++){b.tick(.05);sawCritical||=b.hits.some(hit=>hit.from===h.id&&hit.critical);}
  check(bossRolls===1&&t.hp<100000&&sawCritical,kind+' boss basic rolls once and marks its hit critical');
 }
 const g=new Defense(()=>1);for(const kind of ['tank','melee','ranged'] as const){g.summon(kind,g.units.length);check(g.stats(g.units.at(-1)!).critChance===.1&&g.stats(g.units.at(-1)!).critMultiplier===1.5,kind+' exposes hero critical stats');}
 return passed;
}

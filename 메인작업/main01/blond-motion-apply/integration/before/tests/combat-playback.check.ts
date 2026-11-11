import {COMBAT_SPEEDS,nextCombatSpeed,stepCombat} from '../src/combatPlayback';
import {Defense,pathPoint} from '../src/defense';
import {BossBattle,waveBossRoster} from '../src/bossBattle';
export function checkCombatPlayback(){
 const passed:string[]=[];const check=(ok:boolean,name:string)=>{if(!ok)throw Error(name);passed.push(name);};
 let speed=1;const cycle=[];for(let i=0;i<6;i++){speed=nextCombatSpeed(speed);cycle.push(speed);}
 check(cycle.join(',')==='2,3,5,0.25,0.5,1','speed button cycles all six supported speeds');
 for(const rate of COMBAT_SPEEDS){let sim=0,real=0,max=0;stepCombat(.2,rate,(s,r)=>{sim+=s;real+=r;max=Math.max(max,s);});
  check(Math.abs(sim-.2*rate)<1e-8&&Math.abs(real-.2)<1e-8&&max<=.05,`${rate} speed preserves time and safe step size`);
 }
 for(const rate of [.25,.5,5]){
  const wave=new Defense(()=>1);wave.summon('ranged',0);wave.speed=rate;
  const boss=new BossBattle(waveBossRoster(wave),()=>1);stepCombat(.2,rate,(s,r)=>{wave.tick(r);boss.tick(s);});
  check(Math.abs(wave.elapsed-.2*rate)<1e-8&&Math.abs(boss.elapsed-.2*rate)<1e-8,`wave and boss both run at ${rate} speed`);
 }
 const wave=new Defense(()=>1),base=wave.enemies[0];wave.enemies=[{...base,id:100,distance:20,...pathPoint(20),speed:0,hp:5000,maxHp:5000,defenseType:'normal'}];wave.waveSpawned=10;wave.summon('melee',0);wave.units[0].cooldown=999;wave.speed=5;
 stepCombat(1.15/5,5,(_s,r)=>wave.tick(r));check(wave.enemies[0].hp===4457,'five speed preserves all six sword skill hits and final multiplier');
 const boss=new BossBattle(waveBossRoster(wave),()=>1),hero=boss.actors.find(a=>a.kind==='melee')!,target=boss.actors.find(a=>a.side==='enemy')!;boss.actors=[hero,target];hero.x=target.x-20;hero.y=target.y;hero.cooldown=999;target.cooldown=999;hero.speed=target.speed=0;boss.useHeroSkill(hero.id);
 stepCombat(.2,5,s=>boss.tick(s));check(Math.abs(boss.skillCooldown(hero.id)-7)<1e-8,'boss cooldown advances one game second in one-fifth real second');
 const heldWave=new Defense(()=>1);heldWave.summon('ranged',0);heldWave.speed=5;const heldBoss=new BossBattle(waveBossRoster(heldWave),()=>1);heldBoss.commanderSkill();
 const snapshot=()=>JSON.stringify({waveTime:heldWave.waveTime,waveElapsed:heldWave.elapsed,enemies:heldWave.enemies,units:heldWave.units,bossTime:heldBoss.elapsed,actors:heldBoss.actors,commander:heldBoss.commanderCooldown});
 const before=snapshot();let calls=0;const step=(s:number,r:number)=>{calls++;heldWave.tick(r);heldBoss.tick(s);};
 stepCombat(12,5,step,true);check(calls===0,'pause skips every combat simulation update');check(snapshot()===before,'pause freezes both modes time positions health attacks and skill cooldown');
 stepCombat(.2,5,step,false);check(Math.abs(heldWave.elapsed-1)<1e-8&&Math.abs(heldBoss.elapsed-1)<1e-8&&Math.abs(heldBoss.commanderCooldown-14)<1e-8,'resume advances normally without replaying paused time');
 return passed;
}

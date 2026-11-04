import { Defense } from '../src/defense';
import { BossBattle, waveBossRoster } from '../src/bossBattle';
import { iceProjectileShape, iceBurstShape } from '../src/iceEffects';
export function checkBossRosterIce():string[]{
 const passed:string[]=[];const check=(ok:boolean,label:string)=>{if(!ok)throw new Error(label);passed.push(label);};
 const wave=new Defense(()=>1);wave.gold=10000;wave.summon('guard',3);wave.summon('ranged',5);wave.summon('tank',12);
 const soldier=wave.units[0],ranged=wave.units[1];wave.upgrade(soldier.id);wave.buy(0);wave.equip(wave.gear[0].id,ranged.id,0,0,0);
 const snapshot=JSON.stringify({units:wave.units,gear:wave.gear,gold:wave.gold});
 const battle=new BossBattle(waveBossRoster(wave),()=>1),allies=battle.actors.filter(a=>a.side==='ally');battle.autoSkills=false;
 check(allies.length===3&&allies.map(a=>a.kind).join(',')==='guard,ranged,tank','exact wave roster with no phantom units');
 check(allies[0].sourceSlot===3&&allies[0].x===246.09375&&allies[0].y===386.71875,'wave slot rotates into boss formation');
 check(allies[0].level===2&&allies[0].attack===wave.stats(soldier).attack,'soldier level and attack transfer');
 const hero=battle.hero()!;check(hero.attack===wave.stats(ranged).attack&&hero.maxHp===wave.stats(ranged).hp,'equipped hero stats transfer');
 check(hero.range===wave.stats(ranged).range*1.5&&allies[0].range===wave.stats(soldier).range,'only ranged hero gets 1.5 range');
 battle.tick(.05);check(JSON.stringify({units:wave.units,gear:wave.gear,gold:wave.gold})===snapshot,'boss combat leaves wave model unchanged');
 const target=battle.actors.find(a=>a.kind==='retainer')!,near=battle.actors.find(a=>a.kind==='boss')!;
 battle.actors=[hero,target,near];hero.x=target.x-100;hero.y=target.y;hero.cooldown=0;target.cooldown=999;target.speed=0;near.x=target.x+25;near.y=target.y;near.speed=0;near.cooldown=999;
 const targetHp=target.hp,nearHp=near.hp;battle.tick(.05);
 check(battle.iceProjectiles.length===1&&target.hp===targetHp,'crystal launches without instant damage');
 const start=battle.iceProjectiles[0].x;hero.cooldown=999;battle.tick(.05);
 check(battle.iceProjectiles[0].x>start,'crystal travels toward target');
 for(let i=0;i<20;i++){hero.cooldown=999;battle.tick(.05);}
 check(target.hp<targetHp&&near.hp<nearHp,'crystal impact damages targets within wave AoE radius');
 battle.reset(waveBossRoster(wave));check(battle.iceProjectiles.length===0&&battle.iceBursts.length===0,'restart clears projectile and explosion effects');
 wave.sellUnit(soldier.id);battle.reset(waveBossRoster(wave));check(battle.actors.filter(a=>a.side==='ally').length===2,'updated wave roster replaces old units');
 const empty=new BossBattle([]);check(!empty.actors.some(a=>a.side==='ally')&&!empty.hero()&&!empty.commanderSkill()&&!empty.tripleSkill(),'empty roster cannot spawn allies or cast skills');
 const p=iceProjectileShape({x:10,y:20,tx:110,ty:20}),b=iceBurstShape({x:10,y:20,life:.225});
 check(p.trail.join(',')==='-12,20,10,20'&&b.radius===24&&b.shards.length===8,'shared wave and boss crystal and eight-shard geometry');
 return passed;
}

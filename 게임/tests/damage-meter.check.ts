import { DamageMeter } from '../src/damageMeter';
import { Defense } from '../src/defense';
import { bossFixture } from './boss-fixture';
export function checkDamageMeter():string[]{
 const passed:string[]=[];const check=(ok:boolean,label:string)=>{if(!ok)throw new Error(label);passed.push(label);};
 const meter=new DamageMeter(),a={id:'a',name:'보병',color:'#fff'},b={id:'b',name:'궁병',color:'#fff'};
 meter.record(a,100);meter.record(a,50);meter.record(b,50);let s=meter.snapshot(2);
 check(s.total===200&&s.dps===100&&s.rows[0].damage===150&&s.rows[0].dps===75,'accumulates damage and computes average DPS');
 check(s.rows[0].share===.75&&s.rows[1].share===.25,'damage contribution shares');
 meter.record(a,NaN);meter.record(a,-1);meter.record(a,Infinity);check(meter.snapshot(2).total===200,'invalid or nonpositive damage ignored');
 check(meter.snapshot(0).dps===0&&meter.snapshot(0).rows.every(r=>r.dps===0),'zero time never produces infinite DPS');
 meter.reset();check(meter.snapshot(1).total===0&&!meter.snapshot(1).rows.length,'meter reset clears entries');
 const wave=new Defense();wave.summon('guard',0);wave.units[0].cooldown=0;wave.enemies=wave.enemies.slice(0,1);wave.enemies[0].hp=5;wave.enemies[0].speed=0;wave.waveSpawned=10;
 wave.tick(.01);check(wave.damageMeter.snapshot(wave.waveTime).total===5,'wave overkill counts only actual five HP');
 wave.nextTestWave();check(wave.damageMeter.snapshot(wave.waveTime).total===0,'new wave clears DPS');
 wave.reset();check(wave.damageMeter.snapshot(1).total===0,'game reset clears wave DPS');
 const battle=bossFixture(),guards=battle.actors.filter(a=>a.kind==='guard').slice(0,2),enemy=battle.actors.find(a=>a.kind==='retainer')!;
 battle.actors=[...guards,enemy];enemy.hp=10;enemy.cooldown=999;for(const guard of guards){guard.x=enemy.x-10;guard.y=enemy.y;guard.cooldown=0;}
 battle.tick(.05);s=battle.damageMeter.snapshot(battle.elapsed);
 check(s.total===10&&s.rows.length===2&&s.rows.every(r=>r.damage===5),'simultaneous boss overkill allocated without double counting');
 battle.tick(.05);check(battle.damageMeter.snapshot(battle.elapsed).total===10,'persistent visual hits are not counted twice');
 battle.reset();check(battle.damageMeter.snapshot(1).total===0,'boss retry clears DPS');
 const one=battle.actors.find(a=>a.kind==='guard')!,foe=battle.actors.find(a=>a.kind==='retainer')!;battle.actors=[one,foe];one.cooldown=999;one.x=foe.x-10;one.y=foe.y;foe.cooldown=0;battle.tick(.05);
 check(one.hp<one.maxHp&&battle.damageMeter.snapshot(battle.elapsed).total===0,'enemy attacks do not count as allied DPS');
 battle.reset();const hero=battle.hero()!,targets=battle.actors.filter(a=>a.side==='enemy').slice(0,2);battle.actors=[hero,...targets];hero.x=600;hero.y=210;hero.cooldown=0;targets.forEach((e,i)=>{e.x=700+i*15;e.y=210;e.hp=5+i*2;e.speed=0;e.cooldown=999;});
 battle.tick(.05);check(battle.damageMeter.snapshot(battle.elapsed).total===0,'projectile launch does not count unlanded damage');
 for(let i=0;i<30&&battle.result==='fighting';i++){hero.cooldown=999;battle.tick(.05);}
 check(battle.damageMeter.snapshot(battle.elapsed).total===12,'ice AoE credits actual HP lost across victims');
 return passed;
}

import {Defense,pathPoint} from '../src/defense';
export function checkWaveRangedSkill(){
 const passed:string[]=[];const check=(ok:boolean,name:string)=>{if(!ok)throw Error(name);passed.push(name);};
 const setup=()=>{const g=new Defense();const base=g.enemies[0];g.enemies=[];g.waveSpawned=10;g.summon('ranged',0);g.units[0].cooldown=999;g.enemies=[0,1].map(i=>({...base,id:100+i,distance:20+i*8,...pathPoint(20+i*8),speed:0,hp:5000,maxHp:5000,defenseType:'normal' as const}));return g;};
 const g=setup();g.tick(.01);const id=g.units[0].id;const state=g.rangedSkills.get(id)!;
 check(state.casts===1&&state.cooldown===4,'automatic cast starts four second cooldown');
 check(g.fireCasts.length===1&&g.iceProjectiles.length===0,'one fire cast replaces ice volley');
 check(g.enemies.every(e=>e.hp===5000),'skill damage waits for projectile impact');
 const shots=new Set(g.fireCasts);for(let i=0;i<45;i++){g.tick(.05);g.fireCasts.forEach(p=>shots.add(p));}
 check(shots.size===1,'one cast creates one fire pillar');
 check(g.enemies.every(e=>e.hp===4775),'three peak beats apply base area damage');
 check(state.casts===1,'cooldown prevents immediate recast');
 for(let i=0;i<40;i++)g.tick(.05);check(Number(state.casts)===2,'skill automatically repeats after cooldown');
 const empty=setup();empty.enemies=[];empty.tick(.1);check(empty.rangedSkills.get(empty.units[0].id)!.casts===0,'no enemy does not consume cooldown');
 const move=setup();move.tick(.01);const s=move.rangedSkills.get(move.units[0].id)!;move.units[0].slot=1;move.tick(.1);check(Math.abs(s.cooldown-3.9)<1e-6,'moving unit retains its cooldown');
 move.nextTestWave();check(s.shotsLeft===0&&s.cooldown>0&&!move.fireCasts.length,'wave transition cancels volley and retains cooldown');
 move.reset();check(move.rangedSkills.size===0,'reset clears all skill states');
 const speed=setup();speed.tick(.01);speed.speed=3;speed.tick(.1);check(Math.abs(speed.rangedSkills.get(speed.units[0].id)!.cooldown-3.7)<1e-6,'cooldown follows combat speed');
 return passed;
}

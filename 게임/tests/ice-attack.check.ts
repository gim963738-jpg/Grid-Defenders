import { Defense, pathPoint } from '../src/defense';

// Run through the Vite browser: import('/tests/ice-attack.check.ts').then(m=>m.checkIceAttack()).
export function checkIceAttack():string[] {
  const passed:string[]=[];
  const check=(ok:boolean,name:string)=>{if(!ok)throw new Error(name);passed.push(name);};
  const setup=()=>{
    const g=new Defense();g.enemies=[];g.waveSpawned=10;g.summon('ranged',0);g.units[0].cooldown=0;g.rangedSkills.set(g.units[0].id,{cooldown:999,shotsLeft:0,delay:0,casts:0});
    const base=new Defense().enemies[0];
    g.enemies=[0,1,2].map(i=>({...base,id:100+i}));
    g.enemies.forEach((e,i)=>Object.assign(e,{distance:i===2?200:20+i*8,...pathPoint(i===2?200:20+i*8),speed:0,hp:500,maxHp:500,defenseType:i===1?'magic':'normal'}));
    return g;
  };
  const g=setup();g.tick(0.01);
  check(g.iceProjectiles.length===1,'launch creates ice projectile');
  check(g.enemies.every(e=>e.hp===500),'no damage at launch');
  // Fix the chosen target so the distant enemy cannot affect target selection.
  const p=g.iceProjectiles[0];p.targetId=g.enemies[0].id;p.tx=g.enemies[0].x;p.ty=g.enemies[0].y;
  g.units[0].cooldown=100;g.tick(0.01);
  check(g.iceProjectiles.length===1&&g.enemies.every(e=>e.hp===500),'flight delays damage');
  for(let i=0;i<30&&g.iceProjectiles.length;i++)g.tick(0.05);
  check(g.enemies[0].hp===425,'impact deals base magic damage');
  check(g.enemies[1].hp===444,'nearby magic armor receives rounded 0.75 damage');
  check(g.enemies[2].hp===500,'outside radius remains untouched');
  check(g.iceBursts.length===1,'impact creates explosion');
  g.tick(0.05);check(g.enemies[0].hp===425,'explosion damages each victim only once');
  const dead=setup();dead.tick(0.01);const q=dead.iceProjectiles[0];
  q.targetId=dead.enemies[0].id;q.tx=dead.enemies[0].x;q.ty=dead.enemies[0].y;
  dead.enemies[0].hp=0;dead.units[0].cooldown=100;
  for(let i=0;i<30&&dead.iceProjectiles.length;i++)dead.tick(0.05);
  check(dead.iceProjectiles.length===0&&dead.enemies.some(e=>e.hp===444),'dead target explodes at last location');
  const track=setup();track.tick(0.01);const moving=track.iceProjectiles[0];
  moving.targetId=track.enemies[0].id;track.enemies[0].distance=60;track.units[0].cooldown=100;track.tick(0.01);
  check(moving.tx===pathPoint(60).x,'projectile follows living target');
  const kill=setup();kill.enemies.forEach(e=>e.hp=10);kill.tick(0.01);const k=kill.iceProjectiles[0];
  k.targetId=kill.enemies[0].id;k.tx=kill.enemies[0].x;k.ty=kill.enemies[0].y;kill.units[0].cooldown=100;
  for(let i=0;i<30&&kill.iceProjectiles.length;i++)kill.tick(0.05);
  check(kill.kills===2&&kill.logs.reward.length===2,'area kills grant exactly one reward per enemy');
  const reset=setup();reset.tick(0.01);reset.reset();
  check(!reset.iceProjectiles.length&&!reset.iceBursts.length,'reset clears ice effects');
  const wave=setup();wave.tick(0.01);wave.nextTestWave();
  check(!wave.iceProjectiles.length&&!wave.iceBursts.length,'wave transition clears pending ice');
  return passed;
}

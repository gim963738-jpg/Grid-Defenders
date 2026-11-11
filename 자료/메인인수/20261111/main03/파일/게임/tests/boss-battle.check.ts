import { bossFixture } from './boss-fixture';
export function checkBossBattle():string[]{
  const passed:string[]=[];const check=(ok:boolean,label:string)=>{if(!ok)throw new Error(label);passed.push(label);};
  const battle=bossFixture();
  check(battle.actors.filter(a=>a.side==='ally').length===12&&battle.actors.filter(a=>a.side==='enemy').length===3,'twelve allies, boss and two retainers');
  const guards=battle.actors.filter(a=>a.kind==='retainer'),boss=battle.actors.find(a=>a.kind==='boss')!;
  check(guards[0].x===guards[1].x&&guards[0].y<guards[1].y&&guards[0].x<boss.x,'retainers stand vertically ahead of boss');
  check(battle.actors.every(a=>battle.target(a)?.rank===0),'both sides prioritize living front rank');
  const ally=battle.actors.find(a=>a.kind==='guard')!,allyX=ally.x,enemyX=guards[0].x;
  battle.tick(.05);check(ally.x>allyX&&guards[0].x<enemyX,'both sides advance toward each other');
  guards.forEach(a=>a.hp=0);
  check(battle.target(ally)===boss,'boss becomes target after all retainers fall');
  battle.actors.filter(a=>a.kind==='guard').forEach(a=>a.hp=0);
  check(battle.target(boss)?.rank===2,'enemies advance to second allied rank');
  battle.reset();let damageSeen=false;
  for(let i=0;i<7200&&battle.result==='fighting';i++){
    battle.tick(.05);
    damageSeen ||= battle.actors.some(a=>a.hp<a.maxHp);
  }
  check(damageSeen,'combat causes damage');
  check(battle.result!=='fighting','battle reaches a result');
  check(battle.actors.every(a=>a.hp>=0&&Number.isFinite(a.x)&&Number.isFinite(a.y)),'health and positions remain valid');
  const ended=battle.elapsed;battle.tick(.05);check(battle.elapsed===ended,'finished battle stops');
  battle.reset();check(battle.result==='fighting'&&battle.elapsed===0&&battle.hits.length===0&&battle.actors.every(a=>a.hp===a.maxHp),'restart restores initial encounter');
  let protectedBoss=true,protectedRear=true;
  for(let i=0;i<3600&&battle.result==='fighting';i++){
    const enemyFront=battle.actors.some(a=>a.side==='enemy'&&a.rank===0&&a.hp>0);
    const allyFront=battle.actors.some(a=>a.side==='ally'&&a.rank===0&&a.hp>0);
    battle.hits=[];battle.tick(.05);
    if(enemyFront&&battle.hits.some(h=>h.to==='tester-boss'&&!h.splash))protectedBoss=false;
    if(allyFront&&battle.hits.some(h=>{const a=battle.actors.find(a=>a.id===h.to)!;return a.side==='ally'&&a.rank>0;}))protectedRear=false;
  }
  check(protectedBoss&&protectedRear,'no rear targets attacked while front rank remains');
  return passed;
}

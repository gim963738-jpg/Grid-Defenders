import {createFireCast,advanceFire,fireFrame,FIRE_SKILL,fireAlive} from '../src/fireSkill';
import {Defense,pathPoint} from '../src/defense';
import {bossFixture} from './boss-fixture';
export function checkFireSkill(){
 const passed:string[]=[];const check=(ok:boolean,name:string)=>{if(!ok)throw Error(name);passed.push(name);};
 const c=createFireCast({},1,75,0,0,0,0);check(advanceFire(c,.05)===0&&c.stage==='pillar','landing causes zero damage');
 check(advanceFire(c,.9)===0&&c.hits===0,'impact and rising flame cause zero damage');
 let beats=advanceFire(c,.01);check(beats===1&&fireFrame(c).y===625,'first hit coincides with final rising peak frame');
 beats+=advanceFire(c,.07);check(beats===2&&fireFrame(c).y===810,'second hit coincides with maximum flame frame');
 beats+=advanceFire(c,.07);check(beats===3&&fireFrame(c).x>270,'third hit coincides with next maximum flame frame');
 check(advanceFire(c,.5)===0&&c.hits===3,'no extra damage during fade');advanceFire(c,.1);check(!fireAlive(c),'effect expires after fade');
 const skip=createFireCast({},1,75,0,0,0,0);advanceFire(skip,.01);check(advanceFire(skip,1.1)===3,'large simulation step preserves all three hits');
 const w=new Defense();w.enemies=[];w.waveSpawned=10;w.summon('ranged',0);const hero=w.units[0];hero.cooldown=999;
 const base=new Defense().enemies[0];w.enemies=[{...base,id:100,distance:20,...pathPoint(20),speed:0,hp:5000,maxHp:5000,defenseType:'normal'}];
 w.tick(.01);const hp=w.enemies[0].hp;for(let i=0;i<10;i++)w.tick(.05);check(w.enemies[0].hp===hp,'wave has no early impact damage');
 for(let i=0;i<35;i++)w.tick(.05);check(hp-w.enemies[0].hp===w.stats(hero).attack*3,'wave total equals three base attacks');
 check(w.damageMeter.snapshot(w.elapsed).total===225,'fire damage is counted in wave DPS');
 w.reset();check(w.fireCasts.length===0,'wave reset clears fire effects');
 const b=bossFixture(),h=b.hero()!,t=b.actors.find(a=>a.kind==='retainer')!;b.actors=[h,t];h.x=t.x-20;h.y=t.y;h.cooldown=999;t.cooldown=999;
 const before=t.hp;b.tripleSkill();for(let i=0;i<10;i++)b.tick(.05);check(t.hp===before,'boss has no early impact damage');
 for(let i=0;i<35;i++)b.tick(.05);check(before-t.hp===h.attack*3,'boss total equals three base attacks');
 b.reset();check(b.fireCasts.length===0&&b.heroSkillCooldown===0,'boss reset clears fire effects and cooldown');
 check(FIRE_SKILL.cooldown===4&&FIRE_SKILL.damageMultiplier===1,'cooldown and per-hit multiplier remain editable constants');
 return passed;
}

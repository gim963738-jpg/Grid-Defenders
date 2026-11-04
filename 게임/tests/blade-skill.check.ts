import {BLADE_SKILL,createBladeCast,advanceBlade,bladeAlive,bladeFrame,bladePlacement} from '../src/bladeSkill';
import {FIRE_SKILL} from '../src/fireSkill';
import {Defense,pathPoint} from '../src/defense';
import {BossBattle,waveBossRoster} from '../src/bossBattle';
export function checkBladeSkill(){
 const passed:string[]=[];const check=(ok:boolean,name:string)=>{if(!ok)throw Error(name);passed.push(name);};
 check(BLADE_SKILL.cooldown===FIRE_SKILL.cooldown&&BLADE_SKILL.radius===FIRE_SKILL.radius&&BLADE_SKILL.hits===3&&BLADE_SKILL.damageMultiplier===1,'sword skill shares ranged cooldown radius damage multiplier and hit count');
 const c=createBladeCast({},1,90,100,80,14);check(advanceBlade(c,.9)===0,'trail swirl and falling blade do not cause extra hits');
 let hits=advanceBlade(c,.01);check(hits===1&&bladeFrame(c).y===816,'first peak blast hits once');hits+=advanceBlade(c,.07);hits+=advanceBlade(c,.07);check(hits===3,'three consecutive blast beats');
 check(advanceBlade(c,.4)===0&&!bladeAlive(c),'fading blast causes no fourth hit');
 const skip=createBladeCast({},1,90,100,80);check(advanceBlade(skip,1.1)===3,'large step preserves all three damage beats');
 const p=bladePlacement(c);check(p.x===100&&p.y===94,'blade skill starts from fixed target feet');
 const setup=()=>{const g=new Defense();const base=g.enemies[0];g.enemies=[200,208,20].map((distance,i)=>({...base,id:100+i,distance,...pathPoint(distance),speed:0,hp:5000,maxHp:5000,defenseType:'normal' as const}));g.waveSpawned=10;g.summon('melee',2);g.units[0].cooldown=999;return g;};
 const g=setup();g.tick(.01);const hero=g.units[0];check(g.bladeCasts.length===1&&g.meleeSkills.get(hero.id)!.cooldown===4,'wave automatically casts sword skill and starts four second cooldown');
 for(let i=0;i<17;i++)g.tick(.05);check(g.enemies.every(e=>e.hp===5000),'wave sword skill waits for peak blast');
 for(let i=0;i<9;i++)g.tick(.05);check(g.enemies[0].hp===4730&&g.enemies[1].hp===4730&&g.enemies[2].hp===5000,'wave sword skill hits two nearby targets three times and excludes outside target');
 check(g.damageMeter.snapshot(g.elapsed).total===540,'wave sword area damage is counted in DPS');
 check(g.meleeSkills.get(hero.id)!.casts===1,'cooldown prevents extra cast');g.nextTestWave();check(g.bladeCasts.length===0&&g.meleeSkills.get(hero.id)!.cooldown>0,'wave change clears blade effects while retaining cooldown');g.reset();check(g.meleeSkills.size===0&&g.bladeCasts.length===0,'reset clears sword skill state');
 const wave=new Defense();wave.summon('melee',0);wave.summon('ranged',1);wave.summon('healer',2);const b=new BossBattle(waveBossRoster(wave));
 const m=b.actors.find(a=>a.kind==='melee')!,r=b.hero()!,h=b.actors.find(a=>a.kind==='healer')!,t=b.actors.find(a=>a.kind==='retainer')!,n={...t,id:'nearby',x:508,defenseType:'normal' as const};t.x=500;t.y=280;t.defenseType='normal';n.y=280;
 b.actors=[m,r,h,t,n];b.actors.forEach(a=>{a.speed=0;a.cooldown=999;a.hp=a.maxHp=10000;});m.x=480;r.x=475;h.x=470;m.y=r.y=h.y=280;
 check(b.useHeroSkill(m.id)&&b.useHeroSkill(r.id)&&b.skillCooldown(m.id)===4&&b.skillCooldown(r.id)===4,'boss sword and ranged skills have independent cooldowns');
 check(!b.useHeroSkill(m.id)&&!b.useHeroSkill(h.id),'cooldown and unassigned hero block skill use');
 for(let i=0;i<40;i++)b.tick(.05);check(t.hp===9505&&n.hp===9505,'boss sword and fire each apply exactly three base hits to both targets');
 check(b.damageMeter.snapshot(b.elapsed).total===990,'boss area skill damage is counted in DPS');
 for(let i=0;i<45;i++)b.tick(.05);b.autoSkills=true;b.tick(.05);check(b.skillCooldown(m.id)>0&&b.skillCooldown(r.id)>0,'auto use casts both assigned hero skills');
 b.reset();check(b.bladeCasts.length===0&&b.heroSkillCooldowns.size===0&&b.heroSkillCooldown===0,'boss restart resets every hero skill cooldown');
 return passed;
}

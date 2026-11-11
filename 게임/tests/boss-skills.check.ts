import { bossFixture } from './boss-fixture';
export function checkBossSkills():string[]{
 const passed:string[]=[];const check=(ok:boolean,label:string)=>{if(!ok)throw new Error(label);passed.push(label);};
 const g=bossFixture();check(!g.tripleSkill()&&g.heroSkillCooldown===0,'out-of-range triple does not consume cooldown');
 check(g.commanderSkill()&&g.commanderBuff===10&&g.commanderCooldown===15,'commander starts ten-second buff and fifteen-second cooldown');
 check(!g.commanderSkill()&&g.commanderBuff===10,'commander cannot stack');
 const guard=g.actors.find(a=>a.kind==='guard')!,enemy=g.actors.find(a=>a.id==='retainer-top')!;
 g.actors=[guard,enemy];guard.x=enemy.x-10;guard.y=enemy.y;guard.cooldown=0;enemy.cooldown=999;
 const before=enemy.hp;g.tick(.05);check(Math.abs(before-enemy.hp-126*.75)<.001,'soldier attack gains one hundred before defense multiplier');
 for(let i=0;i<310;i++){guard.cooldown=999;g.tick(.05);}
 check(g.commanderBuff===0&&g.commanderCooldown===0,'buff and cooldown expire');
 g.reset();const hero=g.hero()!,target=g.actors.find(a=>a.id==='retainer-top')!;
 g.actors=[hero,target];hero.x=target.x-20;hero.y=target.y;hero.cooldown=999;target.cooldown=999;
 check(g.tripleSkill()&&g.heroSkillCooldown===4,'triple starts four-second cooldown');
 check(!g.tripleSkill(),'triple cannot be recast during cooldown');
 const hp=target.hp;let strikes=0;
 for(let i=0;i<50;i++){g.hits=[];g.tick(.05);strikes+=g.hits.filter(h=>h.from===hero.id).length;}
 check(strikes===3&&hp-target.hp===hero.attack*3,'fire skill deals exactly three base damage hits');
 g.reset();const h=g.hero()!,t=g.actors.find(a=>a.id==='retainer-top')!;g.actors=[h,t];h.x=t.x-10;h.y=t.y;h.cooldown=0;t.cooldown=999;g.commanderSkill();const old=t.hp;g.tick(.05);for(let i=0;i<10;i++){h.cooldown=999;g.tick(.05);}
 check(old-t.hp===h.attack,'commander does not buff hero');
 h.cooldown=0;g.tick(.05);check(h.cooldown<=1/h.rate&&h.cooldown>=1/h.rate-.05-1e-8,'basic attack delay follows attack rate');
 g.reset();check(g.heroSkillCooldown===0&&g.commanderBuff===0&&g.commanderCooldown===0,'restart clears skill state');
 return passed;
}

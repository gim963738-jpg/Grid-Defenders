import {LANDSCAPE_BATTLE} from './defenseConfig';
import {criticalAttack} from './critical';
import {assassinBasicTarget,ASSASSIN,createAssassinAction,advanceAssassin,cancelAssassin,assassinAlive,assassinPosition,inAssassinPath,type AssassinAction,type AssassinImpact} from './assassinCombat';
import {combatDefenseMultiplier,applyArmorBreak,tickArmorBreak} from './armorBreak';
import {BLADE_SKILL,bladeDamageMultiplier,createBladeCast,advanceBlade,bladeAlive,type BladeCast} from './bladeSkill';
import {cancelSword,createSwordAttack,advanceSword,swordAlive,type SwordAttack} from './swordAttack';
import {FIRE_SKILL,createFireCast,advanceFire,fireAlive,type FireCast} from './fireSkill';
import { DamageMeter, DamagePeaks } from './damageMeter';
import type { Defense } from './defense';
import { AREA_ATTACK, UNITS, type UnitKind, type DamageType, type DefenseType } from './defenseConfig';

export interface BossTuning {healthScale:number;attackScale:number;}
export interface BossAlly {id:number;kind:UnitKind;slot:number;level:number;stats:ReturnType<Defense['stats']>;}
export function waveBossRoster(game:Defense):BossAlly[]{return game.units.map(u=>({id:u.id,kind:u.kind,slot:u.slot,level:u.level,stats:{...game.stats(u)}}));}
export interface BossActor {
  normalDamageMultiplier?:number;bossDamageMultiplier?:number;armorBreakRemaining?:number;
  level?:number;sourceSlot?:number;regen?:number;critChance?:number;critMultiplier?:number;physicalArmor?:number;magicArmor?:number;
  id:string;side:'ally'|'enemy';kind:UnitKind|'boss'|'retainer';name:string;
  x:number;y:number;hp:number;maxHp:number;attack:number;rate:number;range:number;
  speed:number;rank:number;damageType:DamageType;defenseType:DefenseType;cooldown:number;
}
export interface BossIceProjectile {critical?:boolean;x:number;y:number;tx:number;ty:number;targetId:string;source:BossActor;attack:number;}
export interface BossIceBurst {x:number;y:number;life:number;}
export interface BossHit {from:string;to:string;x:number;y:number;damage:number;magic:boolean;life:number;ice?:boolean;sword?:boolean;critical?:boolean;splash?:boolean;}
/** Independent temporary encounter: it never mutates defense units, equipment or rewards. */
export class BossBattle {
  readonly damageMeter:DamageMeter;
  encounter=0;
  tuning:BossTuning={healthScale:1,attackScale:1};
  actors:BossActor[]=[];
  hits:BossHit[]=[];
  iceProjectiles:BossIceProjectile[]=[];
  iceBursts:BossIceBurst[]=[];
  private roster:BossAlly[]=[];
  autoSkills=true;
  assassinActions:AssassinAction<BossActor,string>[]=[];
  assassinImpacts:AssassinImpact[]=[];
  commanderCooldown=0;
  commanderBuff=0;
  heroSkillCooldown=0;
  readonly heroSkillCooldowns=new Map<string,number>();
  bladeCasts:BladeCast<BossActor,string>[]=[];
  swordAttacks:SwordAttack<string,string>[]=[];
  readonly swordSwingCounts=new Map<string,number>();
  fireCasts:FireCast<BossActor,string>[]=[];
  elapsed=0;
  result:'fighting'|'victory'|'defeat'='fighting';
  constructor(roster:BossAlly[]=[],private random:()=>number=Math.random,peaks?:DamagePeaks){this.damageMeter=new DamageMeter(peaks);this.reset(roster);}
  reset(roster:BossAlly[]=this.roster,tuning:BossTuning={healthScale:1,attackScale:1}):void {
    this.tuning={...tuning};
    this.encounter++;
    this.damageMeter.reset();
    this.roster=roster.map(u=>({...u,stats:{...u.stats}}));
    this.actors=[];this.hits=[];this.iceProjectiles=[];this.iceBursts=[];this.elapsed=0;this.result='fighting';
    this.commanderCooldown=0;this.commanderBuff=0;this.heroSkillCooldown=0;this.fireCasts=[];this.swordAttacks=[];this.swordSwingCounts.clear();this.heroSkillCooldowns.clear();this.bladeCasts=[];this.assassinActions=[];this.assassinImpacts=[];
    for(const u of this.roster){
      const d=UNITS[u.kind],s=u.stats,col=LANDSCAPE_BATTLE?3-u.slot%4:3-Math.floor(u.slot/4),row=LANDSCAPE_BATTLE?Math.floor(u.slot/4)+1:u.slot%4+2;
      this.actors.push({id:`ally-${u.id}`,side:'ally',kind:u.kind,name:d.name,level:u.level,sourceSlot:u.slot,
        x:(col+.5)*70.3125,y:(row+.5)*70.3125,hp:s.hp,maxHp:s.hp,attack:s.attack,
        rate:s.rate,range:u.kind==='assassin'?80:s.range*(u.kind==='ranged'||u.kind==='arcanist'?1.5:1),speed:u.kind==='guard'||u.kind==='tank'||u.kind==='melee'?64:53,
        rank:Math.floor(u.slot/4),damageType:s.damageType,defenseType:'normal',cooldown:.25,
        normalDamageMultiplier:s.normalDamageMultiplier,bossDamageMultiplier:s.bossDamageMultiplier,regen:s.regen,physicalArmor:s.physicalArmor,magicArmor:s.magicArmor,critChance:s.critChance,critMultiplier:s.critMultiplier});
    }
    this.actors.push(
      {id:'retainer-top',side:'enemy',kind:'retainer',name:'친위대 · 강철 감시자',x:760,y:215,hp:1800,maxHp:1800,attack:70,rate:.8,range:50,speed:50,rank:0,damageType:'physical',defenseType:'physical',physicalArmor:35,magicArmor:25,cooldown:.25},
      {id:'retainer-bottom',side:'enemy',kind:'retainer',name:'친위대 · 비전 파수꾼',x:760,y:347.5,hp:1800,maxHp:1800,attack:70,rate:.8,range:50,speed:50,rank:0,damageType:'magic',defenseType:'magic',physicalArmor:25,magicArmor:35,cooldown:.25},
      {id:'tester-boss',side:'enemy',kind:'boss',name:'시험 보스',x:900,y:281.25,hp:6000,maxHp:6000,attack:120,rate:.7,range:80,speed:34,rank:1,damageType:'physical',defenseType:'normal',physicalArmor:60,magicArmor:40,cooldown:.25},
    );
    for(const enemy of this.actors.filter(a=>a.side==='enemy')){
      enemy.hp=enemy.maxHp=Math.max(1,Math.ceil(enemy.maxHp*tuning.healthScale));
      enemy.attack=Math.max(1,Math.floor(enemy.attack*tuning.attackScale));
    }
  }
  target(actor:BossActor):BossActor|undefined {
    const opponents=this.actors.filter(a=>a.side!==actor.side&&a.hp>0);
    if(!opponents.length)return;
    const rank=Math.min(...opponents.map(a=>a.rank));
    return opponents.filter(a=>a.rank===rank).sort((a,b)=>
      Math.hypot(a.x-actor.x,a.y-actor.y)-Math.hypot(b.x-actor.x,b.y-actor.y)||a.id.localeCompare(b.id))[0];
  }
  hero():BossActor|undefined{return this.actors.find(a=>a.kind==='ranged'&&a.hp>0);}
  skillCooldown(id:string):number {return this.actors.find(a=>a.id===id)?.kind==='ranged'?this.heroSkillCooldown:this.heroSkillCooldowns.get(id)??0;}
  canHeroSkill(id:string):boolean {
    const hero=this.actors.find(a=>a.id===id&&a.side==='ally'&&a.hp>0&&(a.kind==='ranged'||a.kind==='melee'||a.kind==='assassin')),target=hero&&this.target(hero);
    return this.result==='fighting'&&this.skillCooldown(id)<=0&&!!hero&&!!target&&Math.hypot(hero.x-target.x,hero.y-target.y)<=hero.range;
  }
  canTriple():boolean {const hero=this.hero();return !!hero&&this.canHeroSkill(hero.id);}
  commanderSkill():boolean {
    if(this.result!=='fighting'||!this.actors.some(a=>a.side==='ally'&&a.hp>0)||this.commanderCooldown>0)return false;
    this.commanderBuff=10;this.commanderCooldown=15;return true;
  }
  useHeroSkill(id:string):boolean {
    if(!this.canHeroSkill(id))return false;
    const hero=this.actors.find(a=>a.id===id)!,target=this.target(hero)!,footOffset=target.kind==='boss'?55.6875:40.5;
    for(const swing of this.swordAttacks)if(swing.sourceId===id)cancelSword(swing);
    for(const action of this.assassinActions)if(action.sourceId===id&&action.kind==='basic')cancelAssassin(action);
    if(hero.kind==='assassin'){
      this.heroSkillCooldowns.set(id,ASSASSIN.bossCooldown);
      this.assassinActions.push(criticalAttack(createAssassinAction('boss',{...hero},id,[target.id],this.attackPower(hero),hero.x,hero.y,target,hero.rate),hero,this.random));
    }else if(hero.kind==='melee'){
      this.heroSkillCooldowns.set(id,BLADE_SKILL.cooldown);
      this.bladeCasts.push(criticalAttack(createBladeCast({...hero},target.id,this.attackPower(hero),target.x,target.y,footOffset),hero,this.random));
    }else{
      this.heroSkillCooldown=FIRE_SKILL.cooldown;
      this.fireCasts.push(criticalAttack(createFireCast({...hero},target.id,this.attackPower(hero),hero.x,hero.y-12,target.x,target.y,footOffset),hero,this.random));
    }
    return true;
  }
  tripleSkill():boolean {const hero=this.hero();return !!hero&&this.useHeroSkill(hero.id);}
  private attackPower(actor:BossActor):number {
    const bonus=actor.side==='ally'&&['guard','archer','mage'].includes(actor.kind)&&this.commanderBuff>0?100:0;
    return actor.attack+bonus;
  }
  private damageFactor(source:BossActor,target:BossActor):number {return combatDefenseMultiplier(source.damageType,target)*(source.side==='ally'?(target.kind==='boss'?source.bossDamageMultiplier??1:source.normalDamageMultiplier??1):1);}
  private strike(actor:BossActor,target:BossActor,damage:Map<string,number>):void {
    if(actor.kind==='ranged'){
      this.iceProjectiles.push(criticalAttack({x:actor.x,y:actor.y-12,tx:target.x,ty:target.y,targetId:target.id,source:{...actor},attack:this.attackPower(actor)},actor,this.random));
      return;
    }
    if(actor.kind==='assassin'){
      const targets=this.actors.filter(a=>a.side!==actor.side&&a.hp>0&&Math.hypot(a.x-actor.x,a.y-actor.y)<=actor.range).sort((a,b)=>a.rank-b.rank||Math.hypot(a.x-actor.x,a.y-actor.y)-Math.hypot(b.x-actor.x,b.y-actor.y)||a.id.localeCompare(b.id)).slice(0,3);
      this.assassinActions.push(criticalAttack(createAssassinAction('basic',{...actor},actor.id,targets.map(a=>a.id),this.attackPower(actor),actor.x,actor.y,target,actor.rate),actor,this.random));return;
    }
    if(actor.kind==='melee'){
      const sequence=this.swordSwingCounts.get(actor.id)??0;this.swordSwingCounts.set(actor.id,sequence+1);
      const rolled=criticalAttack({attack:this.attackPower(actor)},actor,this.random);this.swordAttacks.push(createSwordAttack(actor.id,target.id,rolled.attack,rolled.critical,sequence,actor.rate,target.x,target.y));return;
    }
    const critical=(actor.critChance??0)>this.random();
    const amount=this.attackPower(actor)*(critical?(actor.critMultiplier??1.5):1)*this.damageFactor(actor,target);
    damage.set(target.id,(damage.get(target.id)??0)+amount);
    this.hits.push({from:actor.id,to:target.id,x:target.x,y:target.y,damage:amount,magic:actor.damageType==='magic',life:.32,critical});
  }
  tick(seconds:number):void {
    const dt=Math.min(.05,Math.max(0,seconds));
    if(this.result!=='fighting'){
      // Finish the final sword flash without extending combat time or dealing damage.
      for(const swing of this.swordAttacks)swing.age+=dt;
      this.swordAttacks=this.swordAttacks.filter(swordAlive);
      for(const cast of this.bladeCasts)cast.age+=dt;this.bladeCasts=this.bladeCasts.filter(bladeAlive);
      for(const action of this.assassinActions){action.age+=dt;const source=this.actors.find(a=>a.id===action.sourceId);if(source&&action.kind==='boss')Object.assign(source,assassinPosition(action));}
      this.assassinActions=this.assassinActions.filter(assassinAlive);return;
    }
    this.elapsed+=dt;
    for(const actor of this.actors)tickArmorBreak(actor,dt);
    for(const impact of this.assassinImpacts)impact.life-=dt;this.assassinImpacts=this.assassinImpacts.filter(i=>i.life>0);
    this.commanderCooldown=Math.max(0,this.commanderCooldown-dt);
    this.commanderBuff=Math.max(0,this.commanderBuff-dt);
    this.heroSkillCooldown=Math.max(0,this.heroSkillCooldown-dt);
    for(const [id,cooldown] of this.heroSkillCooldowns)this.heroSkillCooldowns.set(id,Math.max(0,cooldown-dt));
    if(this.autoSkills){this.commanderSkill();for(const hero of this.actors.filter(a=>a.side==='ally'&&(a.kind==='ranged'||a.kind==='melee'||a.kind==='assassin')))this.useHeroSkill(hero.id);}
    this.hits=this.hits.filter(h=>(h.life-=dt)>0);
    for(const burst of this.iceBursts)burst.life-=dt;
    this.iceBursts=this.iceBursts.filter(b=>b.life>0);
    const firstNewHit=this.hits.length;
    const live=this.actors.filter(a=>a.hp>0);
    for(const a of live)if(a.regen)a.hp=Math.min(a.maxHp,a.hp+a.regen*dt);
    const plans=live.map(actor=>({actor,target:this.target(actor)}));
    const damage=new Map<string,number>();
    // Same homing speed, impact lifetime and AoE radius as the wave ice attack.
    this.iceProjectiles=this.iceProjectiles.filter(p=>{
      const target=live.find(a=>a.id===p.targetId);
      if(target){p.tx=target.x;p.ty=target.y;}
      const dx=p.tx-p.x,dy=p.ty-p.y,distance=Math.hypot(dx,dy),step=320*dt;
      if(distance>step){p.x+=dx/distance*step;p.y+=dy/distance*step;return true;}
      this.iceBursts.push({x:p.tx,y:p.ty,life:.45});
      for(const victim of live)if(victim.side!==p.source.side&&Math.hypot(victim.x-p.tx,victim.y-p.ty)<=AREA_ATTACK.mageRadius){
        const amount=p.attack*this.damageFactor(p.source,victim);
        damage.set(victim.id,(damage.get(victim.id)??0)+amount);
        this.hits.push({from:p.source.id,to:victim.id,x:victim.x,y:victim.y,damage:amount,magic:true,life:.32,ice:true,critical:p.critical,splash:victim.id!==p.targetId});
      }
      return false;
    });
    this.swordAttacks=this.swordAttacks.filter(s=>live.some(a=>a.id===s.sourceId));
    for(const swing of this.swordAttacks){
      const source=live.find(a=>a.id===swing.sourceId)!,target=live.find(a=>a.id===swing.targetId);
      if(advanceSword(swing,dt,target)&&target){
        const amount=swing.attack*this.damageFactor(source,target);
        damage.set(target.id,(damage.get(target.id)??0)+amount);
        this.hits.push({from:source.id,to:target.id,x:target.x,y:target.y,damage:amount,magic:false,life:.32,sword:true,critical:swing.critical});
      }
    }
    this.swordAttacks=this.swordAttacks.filter(swordAlive);
    for(const action of this.assassinActions){
      const source=live.find(a=>a.id===action.sourceId);if(!source){cancelAssassin(action);continue;}
      for(const beat of advanceAssassin(action,dt)){
        const available=live.filter(a=>a.side!==source.side&&a.hp>(damage.get(a.id)??0)&&Math.hypot(a.x-source.x,a.y-source.y)<=source.range).sort((a,b)=>a.rank-b.rank||Math.hypot(a.x-source.x,a.y-source.y)-Math.hypot(b.x-source.x,b.y-source.y)||a.id.localeCompare(b.id));
        const primaryId=action.kind==='basic'?assassinBasicTarget(action.targets,beat,available.map(a=>a.id)):action.targets[0];
        const primary=live.find(a=>a.id===primaryId);
        const victims=action.kind==='boss'&&beat===3?live.filter(a=>a.side!==source.side&&inAssassinPath(action,a)):primary?[primary]:[];
        for(const victim of victims){
          const multiplier=action.kind==='basic'?ASSASSIN.basicMultiplier:ASSASSIN.bossMultipliers[beat];
          const amount=action.attack*multiplier*this.damageFactor(source,victim);
          damage.set(victim.id,(damage.get(victim.id)??0)+amount);
          this.hits.push({from:source.id,to:victim.id,x:victim.x,y:victim.y,damage:amount,magic:false,life:.32,sword:true,critical:action.critical});
          if(action.kind==='boss'&&beat===3)applyArmorBreak(victim);
          else this.assassinImpacts.push({x:victim.x,y:victim.y,kind:([1,2,5] as const)[beat],life:.24});
        }
      }
      if(action.kind==='boss')Object.assign(source,assassinPosition(action));
    }
    this.assassinActions=this.assassinActions.filter(assassinAlive);
    for(const {actor,target} of plans){
      if(!target)continue;
      actor.cooldown=Math.max(0,actor.cooldown-dt);
      if(this.assassinActions.some(a=>a.sourceId===actor.id&&a.kind==='boss'))continue;
      const dx=target.x-actor.x,dy=target.y-actor.y,dist=Math.hypot(dx,dy);
      if(dist>actor.range){
        const step=Math.min(actor.speed*dt,dist-actor.range);
        actor.x+=dx/dist*step;actor.y+=dy/dist*step;
      } else if(actor.cooldown<=0){
        this.strike(actor,target,damage);
        actor.cooldown=1/actor.rate;
      }
    }
    for(const cast of this.fireCasts){
      const target=live.find(a=>a.id===cast.targetId),beats=advanceFire(cast,dt,target);
      for(let i=0;i<beats;i++)for(const victim of live)if(victim.side!==cast.source.side&&Math.hypot(victim.x-cast.tx,victim.y-cast.ty)<=FIRE_SKILL.radius){
        const amount=cast.attack*FIRE_SKILL.damageMultiplier*this.damageFactor(cast.source,victim);
        damage.set(victim.id,(damage.get(victim.id)??0)+amount);
        this.hits.push({from:cast.source.id,to:victim.id,x:victim.x,y:victim.y,damage:amount,magic:true,life:.32,ice:true,critical:cast.critical,splash:victim.id!==cast.targetId});
      }
    }
    this.fireCasts=this.fireCasts.filter(fireAlive);
    for(const cast of this.bladeCasts){
      const beats=advanceBlade(cast,dt);
      for(let i=0;i<beats;i++)for(const victim of live)if(victim.side!==cast.source.side&&Math.hypot(victim.x-cast.x,victim.y-cast.y)<=BLADE_SKILL.radius){
        const amount=cast.attack*bladeDamageMultiplier(cast.hits-beats+i)*this.damageFactor(cast.source,victim);
        damage.set(victim.id,(damage.get(victim.id)??0)+amount);
        this.hits.push({from:cast.source.id,to:victim.id,x:victim.x,y:victim.y,damage:amount,magic:false,life:.32,sword:true,critical:cast.critical,splash:victim.id!==cast.targetId});
      }
    }
    this.bladeCasts=this.bladeCasts.filter(bladeAlive);
    // Apply both sides' attacks together, avoiding iteration-order advantages.
    const freshHits=this.hits.slice(firstNewHit);
    for(const actor of live){
      const attempted=damage.get(actor.id)??0,actual=Math.min(actor.hp,attempted);
      if(actual>0)for(const hit of freshHits.filter(h=>h.to===actor.id)){
        const source=this.actors.find(a=>a.id===hit.from);
        if(source?.side==='ally'){
          const def=UNITS[source.kind as UnitKind];
          this.damageMeter.record({id:source.id.replace('ally-',''),name:`${source.name} #${source.id.replace('ally-','')} · Lv.${source.level??1}`,color:'#'+def.color.toString(16).padStart(6,'0')},actual*hit.damage/attempted,this.elapsed);
        }
      }
      actor.hp=Math.max(0,actor.hp-attempted);
    }
    if(!this.actors.some(a=>a.side==='ally'&&a.hp>0))this.result='defeat';
    else if(!this.actors.some(a=>a.side==='enemy'&&a.hp>0))this.result='victory';
  }
}

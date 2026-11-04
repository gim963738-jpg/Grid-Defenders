import {FIRE_SKILL,createFireCast,advanceFire,fireAlive,type FireCast} from './fireSkill';
import { DamageMeter, DamagePeaks } from './damageMeter';
import type { Defense } from './defense';
import { AREA_ATTACK, UNITS, type UnitKind, type DamageType, type DefenseType } from './defenseConfig';

export interface BossAlly {id:number;kind:UnitKind;slot:number;level:number;stats:ReturnType<Defense['stats']>;}
export function waveBossRoster(game:Defense):BossAlly[]{return game.units.map(u=>({id:u.id,kind:u.kind,slot:u.slot,level:u.level,stats:{...game.stats(u)}}));}
export interface BossActor {
  level?:number;sourceSlot?:number;regen?:number;critChance?:number;critMultiplier?:number;physicalArmor?:number;magicArmor?:number;
  id:string;side:'ally'|'enemy';kind:UnitKind|'boss'|'retainer';name:string;
  x:number;y:number;hp:number;maxHp:number;attack:number;rate:number;range:number;
  speed:number;rank:number;damageType:DamageType;defenseType:DefenseType;cooldown:number;
}
export interface BossIceProjectile {x:number;y:number;tx:number;ty:number;targetId:string;source:BossActor;attack:number;}
export interface BossIceBurst {x:number;y:number;life:number;}
export interface BossHit {from:string;to:string;x:number;y:number;damage:number;magic:boolean;life:number;ice?:boolean;critical?:boolean;splash?:boolean;}
/** Independent temporary encounter: it never mutates defense units, equipment or rewards. */
export class BossBattle {
  readonly damageMeter:DamageMeter;
  encounter=0;
  actors:BossActor[]=[];
  hits:BossHit[]=[];
  iceProjectiles:BossIceProjectile[]=[];
  iceBursts:BossIceBurst[]=[];
  private roster:BossAlly[]=[];
  autoSkills=false;
  commanderCooldown=0;
  commanderBuff=0;
  heroSkillCooldown=0;
  fireCasts:FireCast<BossActor,string>[]=[];
  elapsed=0;
  result:'fighting'|'victory'|'defeat'='fighting';
  constructor(roster:BossAlly[]=[],private random:()=>number=Math.random,peaks?:DamagePeaks){this.damageMeter=new DamageMeter(peaks);this.reset(roster);}
  reset(roster:BossAlly[]=this.roster):void {
    this.encounter++;
    this.damageMeter.reset();
    this.roster=roster.map(u=>({...u,stats:{...u.stats}}));
    this.actors=[];this.hits=[];this.iceProjectiles=[];this.iceBursts=[];this.elapsed=0;this.result='fighting';
    this.commanderCooldown=0;this.commanderBuff=0;this.heroSkillCooldown=0;this.fireCasts=[];
    for(const u of this.roster){
      const d=UNITS[u.kind],s=u.stats,col=3-Math.floor(u.slot/4),row=u.slot%4+2;
      this.actors.push({id:`ally-${u.id}`,side:'ally',kind:u.kind,name:d.name,level:u.level,sourceSlot:u.slot,
        x:(col+.5)*70.3125,y:(row+.5)*70.3125,hp:s.hp,maxHp:s.hp,attack:s.attack,
        rate:s.rate,range:s.range*(u.kind==='ranged'?1.5:1),speed:u.kind==='guard'||u.kind==='tank'||u.kind==='melee'?64:53,
        rank:Math.floor(u.slot/4),damageType:s.damageType,defenseType:'normal',cooldown:.25,
        regen:s.regen,physicalArmor:s.physicalArmor,magicArmor:s.magicArmor,critChance:s.critChance,critMultiplier:s.critMultiplier});
    }
    this.actors.push(
      {id:'retainer-top',side:'enemy',kind:'retainer',name:'친위대 · 강철 감시자',x:760,y:215,hp:1800,maxHp:1800,attack:70,rate:.8,range:50,speed:50,rank:0,damageType:'physical',defenseType:'physical',cooldown:.25},
      {id:'retainer-bottom',side:'enemy',kind:'retainer',name:'친위대 · 비전 파수꾼',x:760,y:347.5,hp:1800,maxHp:1800,attack:70,rate:.8,range:50,speed:50,rank:0,damageType:'magic',defenseType:'magic',cooldown:.25},
      {id:'tester-boss',side:'enemy',kind:'boss',name:'시험 보스',x:900,y:281.25,hp:6000,maxHp:6000,attack:120,rate:.7,range:80,speed:34,rank:1,damageType:'physical',defenseType:'normal',cooldown:.25},
    );
  }
  target(actor:BossActor):BossActor|undefined {
    const opponents=this.actors.filter(a=>a.side!==actor.side&&a.hp>0);
    if(!opponents.length)return;
    const rank=Math.min(...opponents.map(a=>a.rank));
    return opponents.filter(a=>a.rank===rank).sort((a,b)=>
      Math.hypot(a.x-actor.x,a.y-actor.y)-Math.hypot(b.x-actor.x,b.y-actor.y)||a.id.localeCompare(b.id))[0];
  }
  hero():BossActor|undefined{return this.actors.find(a=>a.kind==='ranged'&&a.hp>0);}
  canTriple():boolean {
    const hero=this.hero(),target=hero&&this.target(hero);
    return this.result==='fighting'&&this.heroSkillCooldown<=0&&!!hero&&!!target&&Math.hypot(hero.x-target.x,hero.y-target.y)<=hero.range;
  }
  commanderSkill():boolean {
    if(this.result!=='fighting'||!this.actors.some(a=>a.side==='ally'&&a.hp>0)||this.commanderCooldown>0)return false;
    this.commanderBuff=10;this.commanderCooldown=15;return true;
  }
  tripleSkill():boolean {
    if(!this.canTriple())return false;
    const hero=this.hero()!,target=this.target(hero)!;
    this.heroSkillCooldown=FIRE_SKILL.cooldown;
    this.fireCasts.push(createFireCast({...hero},target.id,this.attackPower(hero),hero.x,hero.y-12,target.x,target.y));return true;
  }
  private attackPower(actor:BossActor):number {
    const bonus=actor.side==='ally'&&['guard','archer','mage'].includes(actor.kind)&&this.commanderBuff>0?100:0;
    return actor.attack+bonus;
  }
  private strike(actor:BossActor,target:BossActor,damage:Map<string,number>):void {
    if(actor.kind==='ranged'){
      this.iceProjectiles.push({x:actor.x,y:actor.y-12,tx:target.x,ty:target.y,targetId:target.id,source:{...actor},attack:this.attackPower(actor)});
      return;
    }
    const critical=(actor.critChance??0)>this.random();
    const amount=this.attackPower(actor)*(critical?(actor.critMultiplier??1.5):1)*(target.defenseType===actor.damageType ? .75 : 1);
    damage.set(target.id,(damage.get(target.id)??0)+amount);
    this.hits.push({from:actor.id,to:target.id,x:target.x,y:target.y,damage:amount,magic:actor.damageType==='magic',life:.32,critical});
  }
  tick(seconds:number):void {
    if(this.result!=='fighting')return;
    const dt=Math.min(.05,Math.max(0,seconds));this.elapsed+=dt;
    this.commanderCooldown=Math.max(0,this.commanderCooldown-dt);
    this.commanderBuff=Math.max(0,this.commanderBuff-dt);
    this.heroSkillCooldown=Math.max(0,this.heroSkillCooldown-dt);
    if(this.autoSkills){this.commanderSkill();this.tripleSkill();}
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
        const amount=p.attack*(victim.defenseType===p.source.damageType ? .75 : 1);
        damage.set(victim.id,(damage.get(victim.id)??0)+amount);
        this.hits.push({from:p.source.id,to:victim.id,x:victim.x,y:victim.y,damage:amount,magic:true,life:.32,ice:true,splash:victim.id!==p.targetId});
      }
      return false;
    });
    for(const {actor,target} of plans){
      if(!target)continue;
      actor.cooldown=Math.max(0,actor.cooldown-dt);
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
        const amount=cast.attack*FIRE_SKILL.damageMultiplier*(victim.defenseType===cast.source.damageType?.75:1);
        damage.set(victim.id,(damage.get(victim.id)??0)+amount);
        this.hits.push({from:cast.source.id,to:victim.id,x:victim.x,y:victim.y,damage:amount,magic:true,life:.32,ice:true,splash:victim.id!==cast.targetId});
      }
    }
    this.fireCasts=this.fireCasts.filter(fireAlive);
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

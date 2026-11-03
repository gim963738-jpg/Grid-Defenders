import { UNITS, type UnitKind, type DamageType, type DefenseType } from './defenseConfig';

export interface BossActor {
  id:string;side:'ally'|'enemy';kind:UnitKind|'boss'|'retainer';name:string;
  x:number;y:number;hp:number;maxHp:number;attack:number;rate:number;range:number;
  speed:number;rank:number;damageType:DamageType;defenseType:DefenseType;cooldown:number;
}
export interface BossHit {from:string;to:string;x:number;y:number;damage:number;magic:boolean;life:number;}
/** Independent temporary encounter: it never mutates defense units, equipment or rewards. */
export class BossBattle {
  actors:BossActor[]=[];
  hits:BossHit[]=[];
  commanderCooldown=0;
  commanderBuff=0;
  heroSkillCooldown=0;
  private burst:{left:number;delay:number}|null=null;
  elapsed=0;
  result:'fighting'|'victory'|'defeat'='fighting';
  constructor(){this.reset();}
  reset():void {
    this.actors=[];this.hits=[];this.elapsed=0;this.result='fighting';
    this.commanderCooldown=0;this.commanderBuff=0;this.heroSkillCooldown=0;this.burst=null;
    for(let row=0;row<4;row++)for(const col of [0,1,3]){
      const kind:UnitKind=col===3?'guard':col===0?'mage':row===1?'ranged':'archer';
      const d=UNITS[kind];
      this.actors.push({id:`ally-${row}-${col}`,side:'ally',kind,name:d.name,
        x:(col+.5)*70.3125,y:(row+2.5)*70.3125,hp:d.hp,maxHp:d.hp,attack:d.attack,
        rate:d.rate,range:kind==='guard'?48:kind==='mage'?185:220,speed:kind==='guard'?64:53,
        rank:col===3?0:col===1?1:2,damageType:d.damageType,defenseType:'normal',cooldown:.25});
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
    if(this.result!=='fighting'||this.commanderCooldown>0)return false;
    this.commanderBuff=10;this.commanderCooldown=15;return true;
  }
  tripleSkill():boolean {
    if(!this.canTriple())return false;
    this.heroSkillCooldown=4;this.burst={left:3,delay:0};return true;
  }
  private attackDamage(actor:BossActor,target:BossActor):number {
    const bonus=actor.side==='ally'&&['guard','archer','mage'].includes(actor.kind)&&this.commanderBuff>0?100:0;
    return (actor.attack+bonus)*(target.defenseType===actor.damageType ? .75 : 1);
  }
  tick(seconds:number):void {
    if(this.result!=='fighting')return;
    const dt=Math.min(.05,Math.max(0,seconds));this.elapsed+=dt;
    this.commanderCooldown=Math.max(0,this.commanderCooldown-dt);
    this.commanderBuff=Math.max(0,this.commanderBuff-dt);
    this.heroSkillCooldown=Math.max(0,this.heroSkillCooldown-dt);
    this.hits=this.hits.filter(h=>(h.life-=dt)>0);
    const live=this.actors.filter(a=>a.hp>0);
    const plans=live.map(actor=>({actor,target:this.target(actor)}));
    const damage=new Map<string,number>();
    for(const {actor,target} of plans){
      if(!target)continue;
      actor.cooldown=Math.max(0,actor.cooldown-dt);
      const dx=target.x-actor.x,dy=target.y-actor.y,dist=Math.hypot(dx,dy);
      if(dist>actor.range){
        const step=Math.min(actor.speed*dt,dist-actor.range);
        actor.x+=dx/dist*step;actor.y+=dy/dist*step;
      } else if(actor.cooldown<=0){
        const amount=this.attackDamage(actor,target);
        damage.set(target.id,(damage.get(target.id)??0)+amount);
        this.hits.push({from:actor.id,to:target.id,x:target.x,y:target.y,damage:amount,magic:actor.damageType==='magic',life:.32});
        actor.cooldown=1/actor.rate;
      }
    }
    if(this.burst){
      this.burst.delay-=dt;
      if(this.burst.delay<=0){
        const hero=this.hero(),target=hero&&this.target(hero);
        if(!hero||!target){this.burst=null;}
        else {
          if(Math.hypot(hero.x-target.x,hero.y-target.y)<=hero.range){
            const amount=this.attackDamage(hero,target);
            damage.set(target.id,(damage.get(target.id)??0)+amount);
            this.hits.push({from:hero.id,to:target.id,x:target.x,y:target.y,damage:amount,magic:true,life:.32});
          }
          this.burst.left--;this.burst.delay=.12;
          if(!this.burst.left)this.burst=null;
        }
      }
    }
    // Apply both sides' attacks together, avoiding iteration-order advantages.
    for(const actor of live)actor.hp=Math.max(0,actor.hp-(damage.get(actor.id)??0));
    if(!this.actors.some(a=>a.side==='ally'&&a.hp>0))this.result='defeat';
    else if(!this.actors.some(a=>a.side==='enemy'&&a.hp>0))this.result='victory';
  }
}

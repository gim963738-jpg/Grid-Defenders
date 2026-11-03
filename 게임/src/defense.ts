import { DamageMeter } from './damageMeter';
import { AREA_ATTACK, BAG_GRID, GRID, ITEMS, MONSTERS, DAMAGE_LABEL, DEFENSE_LABEL, PATH, RECIPES, RULES, SLOTS, UNITS, rotated, type UnitKind, type ItemDef, type DamageType, type DefenseType, type MonsterDef } from './defenseConfig';

export interface Unit { id:number; kind:UnitKind; slot:number; level:number; spent:number; cooldown:number; }
export interface Enemy { id:number; distance:number; x:number; y:number; hp:number; maxHp:number; speed:number; bounty?:boolean; named:boolean;name:string;defenseType:DefenseType;damageType:DamageType;attack:number;armor:number;magicArmor:number;rate:number;goldReward:number;wave:number; }
export function defenseMultiplier(attack:DamageType,defense:DefenseType):number {return attack===defense?0.75:1;}
export function mitigatedDamage(attack:number,type:DamageType,defense:DefenseType):number {return Math.round(attack*defenseMultiplier(type,defense));}
export interface DamageNumber {id:number;x:number;y:number;damage:number;critical:boolean;life:number;}
export interface Gear { id:number; def:ItemDef; owner:number|null; x:number; y:number; turns:number; order:number; costBasis:number; }
export function recipeForTypes(a:string,b:string) {
  return RECIPES.find(r=>(r.materials[0]===a&&r.materials[1]===b)||(r.materials[0]===b&&r.materials[1]===a));
}
export interface GearState { active:boolean; reason:string; }
export interface Shot { x:number; y:number; tx:number; ty:number; life:number; color:number; }
export interface IceProjectile {x:number;y:number;tx:number;ty:number;targetId:number;source:Unit;attack:number;}
export interface IceBurst {x:number;y:number;life:number;}
export type AttackArea =
  | { kind:'sector'; x:number; y:number; radius:number; angle:number; halfAngle:number; life:number; color:number }
  | { kind:'circle'; x:number; y:number; radius:number; life:number; color:number };
export function inAttackArea(area:AttackArea,x:number,y:number):boolean {
  const dx=x-area.x,dy=y-area.y;
  if(Math.hypot(dx,dy)>area.radius+1e-6)return false;
  if(area.kind==='circle'||Math.hypot(dx,dy)<1e-6)return true;
  const delta=Math.atan2(Math.sin(Math.atan2(dy,dx)-area.angle),Math.cos(Math.atan2(dy,dx)-area.angle));
  return Math.abs(delta)<=area.halfAngle+1e-6;
}
export type LogCategory = 'damage' | 'reward' | 'economy';
export interface DevLog {
  id:number; time:number; category:LogCategory; text:string;
  sourceId?:number; targetId?:number; attack?:number; damage?:number;
  hpBefore?:number; hpAfter?:number; goldBefore?:number; goldAfter?:number; goldDelta?:number;
  critical?:boolean;damageType?:DamageType;defenseType?:DefenseType;defenseMultiplier?:number;
}
export const DEV_LOG_LIMIT=100;

const lengths=PATH.map((p,i)=>Math.hypot(PATH[(i+1)%4][0]-p[0],PATH[(i+1)%4][1]-p[1]));
const perimeter=lengths.reduce((a,b)=>a+b,0);
export function pathPoint(distance:number): {x:number;y:number} {
  let d=((distance%perimeter)+perimeter)%perimeter;
  for(let i=0;i<4;i++) {
    if(d<=lengths[i]) { const a=PATH[i],b=PATH[(i+1)%4];return {x:a[0]+(b[0]-a[0])*d/lengths[i],y:a[1]+(b[1]-a[1])*d/lengths[i]}; }
    d-=lengths[i];
  }
  return {x:PATH[0][0],y:PATH[0][1]};
}

export class Defense {
  readonly damageMeter=new DamageMeter();
  gold:number=RULES.initialGold;
  units:Unit[]=[]; enemies:Enemy[]=[]; gear:Gear[]=[]; shots:Shot[]=[]; attackAreas:AttackArea[]=[];
  iceProjectiles:IceProjectile[]=[];iceBursts:IceBurst[]=[];
  shop:(ItemDef|null)[]=ITEMS.slice(0,RULES.shopSlots);
  shopDiscounts:boolean[]=this.shop.map(()=>Math.random()<RULES.shopDiscountChance);
  kills=0; elapsed=0; speed=1; revision=0;
  normalKills=0;bountySummons=0;pendingBounties=0;
  wave=1;waveTime=0;waveSpawned=0;bossPending=false;
  damageNumbers:DamageNumber[]=[];
  private nextDamageId=1;
  anvils=0;
  message='병사를 선택하고 전장의 빈 칸을 눌러주세요.';
  readonly logs:Record<LogCategory,DevLog[]>={damage:[],reward:[],economy:[]};
  logRevision=0;
  private nextLogId=1;
  private nextId=1;
  private placementOrder=0;
  constructor(){this.startWave(false);}
  private createMonster(def:MonsterDef):Enemy {
    const factor=1+(this.wave-1)*0.1,maxHp=Math.round(def.hp*factor);
    return {id:this.nextId++,distance:0,...pathPoint(0),hp:maxHp,maxHp,speed:def.speed,named:def.named,name:def.name,defenseType:def.defenseType,damageType:def.damageType,
      attack:Math.round(def.attack*factor),armor:def.armor,magicArmor:def.magicArmor,rate:def.rate,goldReward:def.gold,wave:this.wave};
  }
  spawnTestMonster(id:string):boolean {
    const def=MONSTERS.find(d=>d.id===id);if(!def)return false;
    if(!def.named&&this.enemies.filter(e=>!e.bounty&&!e.named&&e.hp>0).length>=RULES.maxEnemies)return this.note('일반 몬스터 시험 한도30마리에 도달했습니다.');
    const enemy=this.createMonster(def);this.enemies.push(enemy);this.note(`[개발자] ${def.name} #${enemy.id} 소환 · ${DEFENSE_LABEL[def.defenseType]}`);return true;
  }
  private spawnWaveDue():void {
    const due=Math.min(RULES.waveMonsters,Math.floor(this.waveTime/RULES.waveSpawnSeconds)+1);
    while(this.waveSpawned<due&&this.enemies.filter(e=>!e.bounty&&!e.named&&e.hp>0).length<RULES.maxEnemies){
      const def=MONSTERS[(this.wave-1+this.waveSpawned)%3];this.enemies.push(this.createMonster(def));this.waveSpawned++;
    }
  }
  private startWave(announce=true):void {
    this.damageMeter.reset();
    this.waveTime=0;this.waveSpawned=0;
    if(this.wave%RULES.bountyEvery===0){
      this.pendingBounties=Math.min(RULES.bountyStackLimit,this.pendingBounties+1);
      this.log('economy',`[웨이브 ${this.wave}] 현상금 소환 기회 · ${this.pendingBounties}/${RULES.bountyStackLimit}`);
    }
    if(this.wave%RULES.bossEvery===0){
      this.bossPending=true;
      if(announce)this.note(`${this.wave}웨이브 · 보스전 시작`);
      return;
    }
    if(this.wave%RULES.namedEvery===0){
      const names=MONSTERS.filter(d=>d.named),def=names[(this.wave/RULES.namedEvery-1)%names.length];
      this.enemies.push(this.createMonster(def));this.log('economy',`[웨이브 ${this.wave}] 네임드 ${def.name} 등장`);
    }
    this.spawnWaveDue();
    if(announce)this.note(`${this.wave}웨이브 시작 · ${RULES.waveSeconds}초 시험 전투`);
  }
  completeBossWave():boolean {
    if(!this.bossPending)return false;
    this.nextTestWave();return true;
  }
  nextTestWave():void {
    this.bossPending=false;
    const removed=this.enemies.filter(e=>!e.named&&!e.bounty&&e.hp>0).length;
    this.enemies=this.enemies.filter(e=>(e.named||e.bounty)&&e.hp>0);
    this.shots=[];this.attackAreas=[];this.iceProjectiles=[];this.iceBursts=[];this.wave++;
    this.log('economy',`[웨이브 전환] 남은 일반 몬스터 ${removed}마리 정리 · 처치 보상 없음 · 네임드/현상금 유지`);
    this.startWave();
  }
  private advanceWaves(dt:number):void {
    let remaining=dt;
    while(remaining>0&&!this.bossPending){
      const step=Math.min(remaining,RULES.waveSeconds-this.waveTime);
      this.waveTime+=step;remaining-=step;this.spawnWaveDue();
      if(this.waveTime>=RULES.waveSeconds-1e-8)this.nextTestWave();
    }
  }
  private log(category:LogCategory,text:string,data:Partial<Omit<DevLog,'id'|'time'|'category'|'text'>>={}):void {
    const list=this.logs[category];
    list.unshift({id:this.nextLogId++,time:this.elapsed,category,text,...data});
    if(list.length>DEV_LOG_LIMIT)list.length=DEV_LOG_LIMIT;
    this.logRevision++;
  }
  private unitName(u:Unit):string {
    return `${UNITS[u.kind].name} #${u.id} (${Math.floor(u.slot/4)+1}행 ${u.slot%4+1}열)`;
  }
  private goldLog(category:'reward'|'economy',reason:string,before:number,data:Partial<DevLog>={}):void {
    const delta=this.gold-before;
    this.log(category,`${reason} · ${delta>=0?'+':''}${delta}G · ${before} → ${this.gold}G`,
      {...data,goldBefore:before,goldAfter:this.gold,goldDelta:delta});
  }
  note(message:string):false {this.message=message;this.revision++;return false;}
  heroes():Unit[] {return this.units.filter(u=>UNITS[u.kind].hero);}
  bountyCredits():number {return this.pendingBounties;}
  summonBounty():boolean {
    if(this.bountyCredits()<1)return this.note('3웨이브마다 현상금 소환 기회를 얻습니다.');
    if(this.enemies.some(e=>e.bounty&&e.hp>0))return this.note('현상금 몬스터는 동시에 1마리만 소환할 수 있습니다.');
    this.enemies.push({id:this.nextId++,distance:0,...pathPoint(0),hp:RULES.bountyHp,maxHp:RULES.bountyHp,speed:RULES.bountySpeed,bounty:true,named:false,name:'현상금 몬스터',defenseType:'normal',damageType:'physical',attack:80,armor:20,magicArmor:20,rate:0.8,goldReward:RULES.bountyGold,wave:this.wave});
    this.pendingBounties--;this.bountySummons++;this.note('현상금 몬스터 등장 · 처치하면 모루와 골드를 획득합니다.');return true;
  }
  gearStates(owner:number):Map<number,GearState> {
    const occupied=new Set<string>(),result=new Map<number,GearState>();
    const gear=this.gear.filter(g=>g.owner===owner).sort((a,b)=>a.order-b.order||a.id-b.id);
    for(const item of gear){
      const cells=rotated(item.def.cells,item.turns).map(([dx,dy])=>[item.x+dx,item.y+dy]);
      const outside=cells.some(([x,y])=>x<0||y<0||x>=GRID.columns||y>=GRID.rows);
      const overlap=cells.some(([x,y])=>occupied.has(`${x},${y}`));
      result.set(item.id,{active:!outside&&!overlap,reason:outside?'경계 밖':overlap?'다른 장비와 겹침':'활성'});
      // 먼저 놓인 물리 블록의 칸을 우선한다. 비활성 블록도 뒤에 놓인 블록과의 겹침 판정에 포함.
      for(const [x,y] of cells)occupied.add(`${x},${y}`);
    }
    return result;
  }
  gearState(item:Gear):GearState {
    return item.owner===null?{active:false,reason:'공용 가방 보관'}:this.gearStates(item.owner).get(item.id)!;
  }
  stats(unit:Unit) {
    const states=this.gearStates(unit.id);
    const base=UNITS[unit.kind], gear=this.gear.filter(g=>g.owner===unit.id&&states.get(g.id)?.active);
    const total=(field:'attack'|'armor'|'magicArmor'|'hp'|'speed'|'regen'|'gold')=>gear.reduce((a,g)=>a+(g.def[field]??0),0);
    const attack=Math.round(base.attack*(1+(unit.level-1)*0.25)+total('attack')),physicalArmor=base.armor+total('armor'),magicArmor=base.magicArmor+total('magicArmor');
    return {attack,damageType:base.damageType,physicalAttack:base.damageType==='physical'?attack:0,magicAttack:base.damageType==='magic'?attack:0,physicalArmor,magicArmor,
      rate:base.rate*(1+total('speed')),range:base.range,
      hp:base.hp+total('hp'),armor:physicalArmor,regen:total('regen'),gold:total('gold'),
      critChance:base.hero?0:RULES.soldierCritChance,critMultiplier:RULES.critMultiplier};
  }
  summon(kind:UnitKind,slot:number):boolean {
    const def=UNITS[kind];
    if(!SLOTS[slot]||this.units.some(u=>u.slot===slot))return this.note('빈 배치 칸을 선택해 주세요.');
    if(def.hero&&this.heroes().length>=RULES.heroLimit)return this.note('영웅은 최대 3명까지 배치할 수 있습니다.');
    if(def.hero&&this.units.some(u=>u.kind===kind))return this.note('같은 영웅은 한 명만 배치합니다. (시험 규칙)');
    if(this.gold<def.cost)return this.note('소환에 필요한 골드가 부족합니다.');
    const before=this.gold;this.gold-=def.cost;
    const unit:Unit={id:this.nextId++,kind,slot,level:1,spent:def.cost,cooldown:0.3};
    this.units.push(unit);
    this.goldLog('economy',`${this.unitName(unit)} 소환${def.hero?' (무료)':''}`,before,{sourceId:unit.id});
    this.note(`${def.name} 배치 완료`);return true;
  }
  moveUnit(id:number,slot:number):boolean {
    const unit=this.units.find(u=>u.id===id);
    if(!unit||!Number.isInteger(slot)||!SLOTS[slot])return this.note('유닛을 전장 안의 배치 칸에 놓아주세요.');
    if(unit.slot===slot)return true;
    const other=this.units.find(u=>u.slot===slot),previous=unit.slot;
    if(other)other.slot=previous;
    unit.slot=slot;
    this.note(other?`${UNITS[unit.kind].name}과 ${UNITS[other.kind].name} 자리교체 완료`:`${UNITS[unit.kind].name} 이동 완료`);
    return true;
  }
  upgrade(id:number):boolean {
    const u=this.units.find(u=>u.id===id);
    if(!u||UNITS[u.kind].hero)return this.note('병사만 강화할 수 있습니다.');
    if(u.level>=5)return this.note('시험 강화는 5레벨까지입니다.');
    const cost=this.upgradeCost(u);
    if(this.gold<cost)return this.note('강화 골드가 부족합니다.');
    const before=this.gold;this.gold-=cost;u.spent+=cost;u.level++;
    this.goldLog('economy',`${this.unitName(u)} Lv.${u.level-1} → Lv.${u.level} 강화`,before,{sourceId:u.id});
    this.note(`${UNITS[u.kind].name} Lv.${u.level} 강화 완료`);return true;
  }
  upgradeCost(u:Unit):number{return Math.floor(UNITS[u.kind].cost*0.6*u.level);}
  sellUnit(id:number):boolean {
    const u=this.units.find(u=>u.id===id);
    if(!u||UNITS[u.kind].hero)return this.note('영웅은 판매할 수 없습니다. 위치 이동은 드래그로 가능합니다.');
    const before=this.gold,refund=Math.floor(u.spent/2);this.gold+=refund;
    this.goldLog('economy',`${this.unitName(u)} 판매`,before,{sourceId:u.id});
    this.units=this.units.filter(v=>v.id!==id);this.note(`병사 판매 · ${refund}G 환급`);return true;
  }
  buy(index:number,position?:{x:number;y:number}):boolean {
    const item=this.shop[index];if(!item)return false;
    const price=this.shopPrice(index);
    if(this.gold<price)return this.note('구매 골드가 부족합니다.');
    const before=this.gold;this.gold-=price;this.shop[index]=null;
    const gear:Gear={id:this.nextId++,def:item,owner:null,x:0,y:0,turns:0,order:++this.placementOrder,costBasis:price};
    Object.assign(gear,this.purchasePosition(item,position));
    this.gear.push(gear);
    this.goldLog('economy',`${item.name} #${gear.id} 구매${this.shopDiscounts[index]?' (반값 할인)':''}`,before);
    this.note(`${item.name}을 공용 가방에 넣었습니다.`);return true;
  }
  shopPrice(index:number):number {return Math.floor((this.shop[index]?.price??0)*(this.shopDiscounts[index]?0.5:1));}
  reroll():boolean {
    if(this.gold<RULES.rerollGold)return this.note('리롤 골드가 부족합니다.');
    const before=this.gold;this.gold-=RULES.rerollGold;
    this.shop=Array.from({length:RULES.shopSlots},()=>ITEMS[Math.floor(Math.random()*ITEMS.length)]);
    this.shopDiscounts=this.shop.map(()=>Math.random()<RULES.shopDiscountChance);
    this.goldLog('economy','상점 리롤',before);
    this.note('상점 상품을 새로 가져왔습니다.');return true;
  }
  equip(id:number,owner:number,x:number,y:number,turns:number):boolean {
    const item=this.gear.find(g=>g.id===id),unit=this.heroes().find(u=>u.id===owner);
    if(!item||!unit)return this.note('먼저 장비를 사용할 영웅을 선택해 주세요.');
    if(!Number.isInteger(x)||!Number.isInteger(y)||!Number.isInteger(turns))return this.note('유효한 장비 칸을 선택하세요.');
    const position=this.correctedPosition(item,owner,x,y,turns);
    if(!position)return this.note('영웅 장비칸에 빈칸이 없습니다.');
    x=position.x;y=position.y;
    item.owner=owner;item.x=x;item.y=y;item.turns=((turns%4)+4)%4;item.order=++this.placementOrder;
    const state=this.gearState(item);
    this.note(`${item.def.name} 배치 완료 · ${state.active?'능력치 활성':state.reason+' / 능력치 비활성'}`);return true;
  }
  unequip(id:number):boolean {
    const g=this.gear.find(g=>g.id===id);if(!g)return false;
    const space=this.findBagSpace(g);
    g.owner=null;Object.assign(g,space);
    this.note(`${g.def.name} 장착 해제 · 공용 가방으로 이동`);return true;
  }
  outside(item:Pick<Gear,'def'>,owner:number|null,x:number,y:number,turns:number):boolean {
    return rotated(item.def.cells,turns).some(([dx,dy])=>x+dx<0||y+dy<0||x+dx>=(owner===null?BAG_GRID.columns:GRID.columns)||(owner!==null&&y+dy>=GRID.rows));
  }
  canPlace(item:Pick<Gear,'id'|'def'>,owner:number|null,x:number,y:number,turns:number,others:readonly Gear[]=this.gear):boolean {
    if(!Number.isInteger(x)||!Number.isInteger(y)||!Number.isInteger(turns))return false;
    const cells=rotated(item.def.cells,turns).map(([dx,dy])=>[dx+x,dy+y]);
    if(cells.some(([cx,cy])=>cx<0||cy<0||cx>=(owner===null?BAG_GRID.columns:GRID.columns)||(owner!==null&&cy>=GRID.rows)))return false;
    const occupied=new Set(others.filter(g=>g.owner===owner&&g.id!==item.id).flatMap(g=>rotated(g.def.cells,g.turns).map(([dx,dy])=>`${g.x+dx},${g.y+dy}`)));
    return !cells.some(([cx,cy])=>occupied.has(`${cx},${cy}`));
  }
  nearestFree(item:Pick<Gear,'id'|'def'>,owner:number|null,x:number,y:number,turns:number,others:readonly Gear[]=this.gear):{x:number;y:number}|null {
    const cells=rotated(item.def.cells,turns),height=Math.max(...cells.map(c=>c[1]))+1;
    const bottom=others.filter(g=>g.owner===owner&&g.id!==item.id).reduce((n,g)=>Math.max(n,g.y+Math.max(...rotated(g.def.cells,g.turns).map(c=>c[1]))+1),0);
    const rows=owner===null?Math.max(BAG_GRID.rows,bottom+height,Math.ceil(Math.max(0,y))+height):GRID.rows;
    let best:{x:number;y:number}|null=null,distance=Infinity;
    for(let cy=0;cy<=rows-height;cy++)for(let cx=0;cx<(owner===null?BAG_GRID.columns:GRID.columns);cx++){
      const d=(cx-x)**2+(cy-y)**2;
      if(d<distance&&this.canPlace(item,owner,cx,cy,turns,others)){best={x:cx,y:cy};distance=d;}
    }
    return best;
  }
  correctedPosition(item:Pick<Gear,'id'|'def'>,owner:number|null,x:number,y:number,turns:number,others:readonly Gear[]=this.gear):{x:number;y:number}|null {
    return this.outside(item,owner,x,y,turns)?this.nearestFree(item,owner,x,y,turns,others):{x,y};
  }
  autoEquip(id:number,owner:number):boolean {
    const item=this.gear.find(g=>g.id===id);if(!item||!this.heroes().some(h=>h.id===owner))return false;
    const position=this.nearestFree(item,owner,0,0,item.turns);
    if(!position)return this.note('영웅 장비칸에 빈칸이 없습니다.');
    return this.equip(id,owner,position.x,position.y,item.turns);
  }
  purchasePosition(def:ItemDef,position?:{x:number;y:number}):{x:number;y:number} {
    const item={id:-1,def,turns:0};
    const corrected=position?this.correctedPosition(item,null,position.x,position.y,0):null;
    return corrected&&this.canPlace(item,null,corrected.x,corrected.y,0)?corrected:this.findBagSpace(item);
  }
  private findBagSpace(item:Pick<Gear,'id'|'def'|'turns'>):{x:number;y:number} {
    const bottom=this.gear.filter(g=>g.owner===null&&g.id!==item.id).reduce((n,g)=>Math.max(n,g.y+Math.max(...rotated(g.def.cells,g.turns).map(c=>c[1]))+1),0);
    for(let y=0;y<=bottom;y++)for(let x=0;x<BAG_GRID.columns;x++)if(this.canPlace(item,null,x,y,item.turns))return {x,y};
    return {x:0,y:bottom};
  }
  bagRows():number {
    return this.gear.filter(g=>g.owner===null).reduce<number>((n,g)=>Math.max(n,g.y+Math.max(...rotated(g.def.cells,g.turns).map(c=>c[1]))+1),BAG_GRID.rows);
  }
  placeInBag(id:number,x:number,y:number,turns:number):boolean {
    const item=this.gear.find(g=>g.id===id);if(!item)return false;
    const position=this.correctedPosition(item,null,x,y,turns);if(!position)return false;
    x=position.x;y=position.y;
    if(!this.canPlace(item,null,x,y,turns))return this.note('가방 경계를 벗어나거나 장비가 겹칩니다. 원래 위치를 유지합니다.');
    item.owner=null;item.x=x;item.y=y;item.turns=((turns%4)+4)%4;
    this.note(`${item.def.name} 공용 가방 배치 완료`);return true;
  }
  rotateGear(id:number):boolean {
    const item=this.gear.find(g=>g.id===id);if(!item)return false;
    const next=(item.turns+1)%4;
    return item.owner===null?this.placeInBag(id,item.x,item.y,next):this.equip(id,item.owner,item.x,item.y,next);
  }
  sellGear(id:number):boolean {
    const g=this.gear.find(g=>g.id===id);if(!g)return false;
    // 직접 구매품은 구매 원가, 조합품은 소모한 재료의 누적 원가를 기준으로 환급.
    const before=this.gold,value=Math.floor(g.costBasis/2);this.gold+=value;
    this.goldLog('economy',`${g.def.name} #${g.id} 판매`,before);
    this.gear=this.gear.filter(v=>v.id!==id);this.note(`${g.def.name} 판매 · ${value}G 환급`);return true;
  }
  recipeFor(ids:readonly number[]) {
    if(ids.length!==2||new Set(ids).size!==2)return undefined;
    const [a,b]=ids.map(id=>this.gear.find(g=>g.id===id));
    return a&&b?recipeForTypes(a.def.id,b.def.id):undefined;
  }
  touching(a:Gear,b:Gear):boolean {
    if(a.owner!==b.owner||a.id===b.id)return false;
    const ac=rotated(a.def.cells,a.turns).map(([x,y])=>[x+a.x,y+a.y]);
    const bc=rotated(b.def.cells,b.turns).map(([x,y])=>[x+b.x,y+b.y]);
    if([...ac,...bc].some(([x,y])=>x<0||y<0||x>=(a.owner===null?BAG_GRID.columns:GRID.columns)||(a.owner!==null&&y>=GRID.rows)))return false;
    if(ac.some(([x,y])=>bc.some(([bx,by])=>x===bx&&y===by)))return false;
    return ac.some(([x,y])=>bc.some(([bx,by])=>Math.abs(x-bx)+Math.abs(y-by)===1));
  }
  adjacentPairs(owner:number|null):[number,number][] {
    const items=this.gear.filter(g=>g.owner===owner).sort((a,b)=>a.id-b.id),pairs:[number,number][]=[];
    for(let i=0;i<items.length;i++)for(let j=i+1;j<items.length;j++)
      if(recipeForTypes(items[i].def.id,items[j].def.id)&&this.touching(items[i],items[j]))pairs.push([items[i].id,items[j].id]);
    return pairs;
  }
  combinationPlan(hero:number|null):[number,number][] {
    const candidates=[...(hero===null?[]:this.adjacentPairs(hero)),...this.adjacentPairs(null)];
    const used=new Set<number>();
    // 같은 재료를 두 번 소비하지 않는다. 현재 영웅, 공용 가방, 생성 번호 순으로 확정.
    return candidates.filter(pair=>{if(pair.some(id=>used.has(id)))return false;pair.forEach(id=>used.add(id));return true;});
  }
  combineMany(pairs:readonly (readonly number[])[]):boolean {
    const ids=pairs.flat(),recipes=pairs.map(pair=>this.recipeFor(pair));
    if(!pairs.length||new Set(ids).size!==ids.length||recipes.some(r=>!r))return this.note('붙어 있는 조합 재료가 없습니다.');
    if(pairs.some(pair=>!this.touching(this.gear.find(g=>g.id===pair[0])!,this.gear.find(g=>g.id===pair[1])!)))return this.note('같은 가방에서 재료 블록의 변을 붙여주세요.');
    if(this.anvils<pairs.length)return this.note(`조합 ${pairs.length}회에 모루 ${pairs.length}개가 필요합니다.`);
    const results=pairs.map((pair,i)=>{
      const anchor=this.gear.find(g=>g.id===pair[0])!;
      return {recipe:recipes[i]!,owner:anchor.owner,x:anchor.x,y:anchor.y,turns:anchor.turns,
        costBasis:pair.reduce((sum,id)=>sum+this.gear.find(g=>g.id===id)!.costBasis,0)};
    });
    // 재료가 사라질 칸과 앞선 완성품까지 고려해, 가방 결과 배치도 소비 전에 검증한다.
    const planned=this.gear.filter(g=>!ids.includes(g.id));
    for(const [i,result] of results.entries()){
      const def=ITEMS.find(item=>item.id===result.recipe.result)!;
      const candidate:Gear={id:this.nextId+i,def,...result,order:0};
      const position=this.correctedPosition(candidate,result.owner,result.x,result.y,result.turns,planned);
      if(!position)return this.note('영웅 장비칸에 빈칸이 없습니다. 재료와 모루는 유지됩니다.');
      result.x=position.x;result.y=position.y;Object.assign(candidate,position);
      if(result.owner===null&&!this.canPlace(candidate,null,result.x,result.y,result.turns,planned))
        return this.note('조합 자리의 완성품 공간이 부족합니다. 주변 블록을 옮겨주세요. 재료와 모루는 유지됩니다.');
      planned.push(candidate);
    }
    this.gear=this.gear.filter(g=>!ids.includes(g.id));this.anvils-=pairs.length;
    for(const {recipe,costBasis,owner,x,y,turns} of results){
      const def=ITEMS.find(item=>item.id===recipe.result)!;
      const result:Gear={id:this.nextId++,def,owner,x,y,turns,order:++this.placementOrder,costBasis};
      this.gear.push(result);
      this.log('economy',`${recipe.materials.map(id=>ITEMS.find(item=>item.id===id)!.name).join(' + ')} → ${def.name} #${result.id} · 모루 -1 / 남은 ${this.anvils} · 재료 원가 ${costBasis}G`);
    }
    this.note(`조합 ${pairs.length}회 완료 · 모루 ${pairs.length}개 사용 · 완성품은 재료가 있던 자리에서 확인하세요.`);return true;
  }
  combine(ids:readonly number[]):boolean {return this.combineMany([ids]);}
  devDeploySoldiers():void {
    const layout:{kind:UnitKind;slot:number;level?:number}[]=[
      ...[0,1,2,3].map(slot=>({kind:'guard' as const,slot})),
      {kind:'archer',slot:8},{kind:'ranged',slot:9},{kind:'archer',slot:10},{kind:'archer',slot:11},
      {kind:'mage',slot:12,level:5},...[13,14,15].map(slot=>({kind:'mage' as const,slot})),
    ];
    let added=0;
    for(const {kind,slot,level=1} of layout){
      if(this.units.some(u=>u.slot===slot))continue;
      if(UNITS[kind].hero&&(this.heroes().some(u=>u.kind===kind)||this.heroes().length>=RULES.heroLimit))continue;
      const unit:Unit={id:this.nextId++,kind,slot,level,spent:0,cooldown:0.3};
      this.units.push(unit);added++;
      this.log('economy',`[개발자] ${this.unitName(unit)} 테스트 배치 · 무료`,{sourceId:unit.id});
    }
    this.note(added?`테스트 배치 ${added}명 완료 · 기존 유닛 유지 · 무료`:'테스트 배치 위치가 이미 사용 중입니다.');
  }
  devGold():void {
    const before=this.gold;this.gold+=10000;this.goldLog('economy','[개발자] 골드 지급',before);this.note('개발자 골드 +10,000G');
  }
  devAnvils():void {
    const before=this.anvils;this.anvils+=10;this.log('economy',`[개발자] 모루 +10 · ${before} → ${this.anvils}`);this.note('개발자 모루 +10');
  }
  reset():void {
    this.iceProjectiles=[];this.iceBursts=[];
    this.gold=RULES.initialGold;this.anvils=0;this.units=[];this.enemies=[];this.gear=[];this.shots=[];this.attackAreas=[];
    this.normalKills=0;this.bountySummons=0;this.pendingBounties=0;this.wave=1;this.waveTime=0;this.waveSpawned=0;this.bossPending=false;this.damageNumbers=[];this.nextDamageId=1;
    this.shop=ITEMS.slice(0,RULES.shopSlots);this.shopDiscounts=this.shop.map(()=>Math.random()<RULES.shopDiscountChance);this.kills=0;this.elapsed=0;this.speed=1;this.nextId=1;this.placementOrder=0;
    this.logs.damage.length=0;this.logs.reward.length=0;this.logs.economy.length=0;this.nextLogId=1;this.logRevision++;
    this.startWave(false);this.note('게임을 시작 상태로 초기화했습니다.');
  }
  tick(realSeconds:number):void {
    if(this.bossPending)return;
    const dt=realSeconds*this.speed;this.elapsed+=dt;
    this.advanceWaves(dt);
    if(this.bossPending)return;
    for(const e of this.enemies){e.distance+=e.speed*dt;Object.assign(e,pathPoint(e.distance));}
    for(const burst of this.iceBursts)burst.life-=dt;
    this.iceBursts=this.iceBursts.filter(b=>b.life>0);
    // Advance existing projectiles before firing new ones: never deal damage on launch.
    this.iceProjectiles=this.iceProjectiles.filter(p=>{
      const target=this.enemies.find(e=>e.id===p.targetId&&e.hp>0);
      if(target){p.tx=target.x;p.ty=target.y;}
      const dx=p.tx-p.x,dy=p.ty-p.y,distance=Math.hypot(dx,dy),step=320*dt;
      if(distance>step){p.x+=dx/distance*step;p.y+=dy/distance*step;return true;}
      const area:AttackArea={kind:'circle',x:p.tx,y:p.ty,radius:AREA_ATTACK.mageRadius,life:0.28,color:0x88ddff};
      this.iceBursts.push({x:p.tx,y:p.ty,life:0.45});
      for(const enemy of this.enemies)if(enemy.hp>0&&inAttackArea(area,enemy.x,enemy.y))this.hit(p.source,enemy,p.attack);
      return false;
    });
    for(const u of this.units) {
      u.cooldown-=dt;if(u.cooldown>0)continue;
      const s=this.stats(u),pos=SLOTS[u.slot];
      // 순환 일반전의 임시 선두 판정: 총 이동 거리 최대, 동률은 먼저 생성된 대상.
      const target=this.enemies.filter(e=>e.hp>0&&Math.hypot(e.x-pos.x,e.y-pos.y)<=s.range)
        .sort((a,b)=>b.distance-a.distance||a.id-b.id)[0];
      if(!target){u.cooldown=0;continue;}
      u.cooldown=1/s.rate;
      if(u.kind==='ranged'){
        this.iceProjectiles.push({x:pos.x,y:pos.y-12,tx:target.x,ty:target.y,targetId:target.id,source:{...u},attack:s.attack});
        continue;
      }
      let area:AttackArea|undefined;
      if(u.kind==='guard')area={kind:'sector',x:pos.x,y:pos.y,radius:s.range,angle:Math.atan2(target.y-pos.y,target.x-pos.x),halfAngle:AREA_ATTACK.guardHalfAngle,life:0.28,color:UNITS[u.kind].color};
      if(u.kind==='mage')area={kind:'circle',x:target.x,y:target.y,radius:AREA_ATTACK.mageRadius,life:0.28,color:UNITS[u.kind].color};
      if(area)this.attackAreas.push(area);
      const targets=area?this.enemies.filter(e=>e.hp>0&&inAttackArea(area!,e.x,e.y)):[target];
      this.shots.push({x:pos.x,y:pos.y,tx:target.x,ty:target.y,life:0.16,color:UNITS[u.kind].color});
      const critical=s.critChance>0&&Math.random()<s.critChance;
      const attack=s.attack*(critical?s.critMultiplier:1);
      for(const victim of targets)this.hit(u,victim,attack,critical);
    }
    this.enemies=this.enemies.filter(e=>e.hp>0);
    for(const shot of this.shots)shot.life-=dt;
    this.shots=this.shots.filter(s=>s.life>0);
    for(const area of this.attackAreas)area.life-=dt;
    this.attackAreas=this.attackAreas.filter(a=>a.life>0);
    for(const number of this.damageNumbers)number.life-=realSeconds;
    this.damageNumbers=this.damageNumbers.filter(n=>n.life>0);
  }
  private hit(u:Unit,target:Enemy,attack:number,critical=false):void {
      if(target.hp<=0)return;
      const hpBefore=target.hp;
      const damageType=UNITS[u.kind].damageType,multiplier=defenseMultiplier(damageType,target.defenseType),afterDefense=mitigatedDamage(attack,damageType,target.defenseType);
      target.hp=Math.max(0,target.hp-afterDefense);
      const damage=hpBefore-target.hp;
      this.damageMeter.record({id:String(u.id),name:`${UNITS[u.kind].name} #${u.id} · Lv.${u.level}`,color:'#'+UNITS[u.kind].color.toString(16).padStart(6,'0')},damage);
      this.damageNumbers.push({id:this.nextDamageId++,x:target.x,y:target.y,damage,critical,life:0.75});
      if(this.damageNumbers.length>80)this.damageNumbers.splice(0,this.damageNumbers.length-80);
      const targetName=`${target.name} #${target.id} (${DEFENSE_LABEL[target.defenseType]})`;
      this.log('damage',`${this.unitName(u)} → ${targetName}${critical?' [치명타 ×1.5]':''} · ${DAMAGE_LABEL[damageType]} 공격 ${attack} → 방어 ×${multiplier} = ${afterDefense} / 실제 피해 ${damage} · 체력 ${hpBefore} → ${target.hp}`,
        {sourceId:u.id,targetId:target.id,attack,damage,hpBefore,hpAfter:target.hp,critical,damageType,defenseType:target.defenseType,defenseMultiplier:multiplier});
      if(target.hp<=0) {
        const bonus=this.heroes().reduce((sum,h)=>sum+this.stats(h).gold,0);
        const before=this.gold;
        this.gold+=Math.floor(target.goldReward*(1+bonus));this.kills++;
        if(target.bounty){this.anvils+=RULES.bountyAnvils;this.note(`현상금 처치 · 모루 +${RULES.bountyAnvils} · 골드 획득`);}
        else if(!target.named)this.normalKills++;
        this.revision++;
        this.goldLog('reward',`${this.unitName(u)}이 ${targetName} 처치${target.bounty?` · 모루 +${RULES.bountyAnvils} / 보유 ${this.anvils}`:''}${bonus>0?` (골드 보너스 +${Math.round(bonus*100)}%)`:''}`,before,{sourceId:u.id,targetId:target.id});
      }
  }
}

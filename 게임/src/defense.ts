import { GRID, ITEMS, PATH, RULES, SLOTS, UNITS, rotated, type UnitKind, type ItemDef } from './defenseConfig';

export interface Unit { id:number; kind:UnitKind; slot:number; level:number; spent:number; cooldown:number; }
export interface Enemy { id:number; distance:number; x:number; y:number; hp:number; maxHp:number; speed:number; }
export interface Gear { id:number; def:ItemDef; owner:number|null; x:number; y:number; turns:number; }
export interface Shot { x:number; y:number; tx:number; ty:number; life:number; color:number; }

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
  gold:number=RULES.initialGold;
  units:Unit[]=[]; enemies:Enemy[]=[]; gear:Gear[]=[]; shots:Shot[]=[];
  shop:(ItemDef|null)[]=ITEMS.slice(0,5);
  kills=0; elapsed=0; speed=1; revision=0;
  message='병사를 선택하고 전장의 빈 칸을 눌러주세요.';
  private nextId=1; private spawnClock=0;
  note(message:string):false {this.message=message;this.revision++;return false;}
  heroes():Unit[] {return this.units.filter(u=>UNITS[u.kind].hero);}
  stats(unit:Unit) {
    const base=UNITS[unit.kind], gear=this.gear.filter(g=>g.owner===unit.id);
    const total=(field:'attack'|'armor'|'hp'|'speed'|'regen'|'gold')=>gear.reduce((a,g)=>a+(g.def[field]??0),0);
    return {attack:Math.round(base.attack*(1+(unit.level-1)*0.25)+total('attack')),
      rate:base.rate*(1+total('speed')),range:base.range,
      hp:base.hp+total('hp'),armor:base.armor+total('armor'),regen:total('regen'),gold:total('gold')};
  }
  summon(kind:UnitKind,slot:number):boolean {
    const def=UNITS[kind];
    if(!SLOTS[slot]||this.units.some(u=>u.slot===slot))return this.note('빈 배치 칸을 선택해 주세요.');
    if(def.hero&&this.heroes().length>=RULES.heroLimit)return this.note('영웅은 최대 3명까지 배치할 수 있습니다.');
    if(def.hero&&this.units.some(u=>u.kind===kind))return this.note('같은 영웅은 한 명만 배치합니다. (시험 규칙)');
    if(this.gold<def.cost)return this.note('소환에 필요한 골드가 부족합니다.');
    this.gold-=def.cost;
    this.units.push({id:this.nextId++,kind,slot,level:1,spent:def.cost,cooldown:0.3});
    this.note(`${def.name} 배치 완료`);return true;
  }
  upgrade(id:number):boolean {
    const u=this.units.find(u=>u.id===id);
    if(!u||UNITS[u.kind].hero)return this.note('병사만 강화할 수 있습니다.');
    if(u.level>=5)return this.note('시험 강화는 5레벨까지입니다.');
    const cost=this.upgradeCost(u);
    if(this.gold<cost)return this.note('강화 골드가 부족합니다.');
    this.gold-=cost;u.spent+=cost;u.level++;this.note(`${UNITS[u.kind].name} Lv.${u.level} 강화 완료`);return true;
  }
  upgradeCost(u:Unit):number{return Math.floor(UNITS[u.kind].cost*0.6*u.level);}
  sellUnit(id:number):boolean {
    const u=this.units.find(u=>u.id===id);
    if(!u||UNITS[u.kind].hero)return this.note('영웅은 판매하거나 교체할 수 없습니다.');
    const refund=Math.floor(u.spent/2);this.gold+=refund;
    this.units=this.units.filter(v=>v.id!==id);this.note(`병사 판매 · ${refund}G 환급`);return true;
  }
  buy(index:number):boolean {
    const item=this.shop[index];if(!item)return false;
    if(this.gold<item.price)return this.note('구매 골드가 부족합니다.');
    this.gold-=item.price;this.shop[index]=null;
    this.gear.push({id:this.nextId++,def:item,owner:null,x:0,y:0,turns:0});
    this.note(`${item.name}을 공용 가방에 넣었습니다.`);return true;
  }
  reroll():boolean {
    if(this.gold<RULES.rerollGold)return this.note('리롤 골드가 부족합니다.');
    this.gold-=RULES.rerollGold;
    this.shop=Array.from({length:5},()=>ITEMS[Math.floor(Math.random()*ITEMS.length)]);
    this.note('상점 상품을 새로 가져왔습니다.');return true;
  }
  equip(id:number,owner:number,x:number,y:number,turns:number):boolean {
    const item=this.gear.find(g=>g.id===id),unit=this.heroes().find(u=>u.id===owner);
    if(!item||!unit)return this.note('먼저 장비를 사용할 영웅을 선택해 주세요.');
    const cells=rotated(item.def.cells,turns).map(([dx,dy])=>[dx+x,dy+y]);
    if(cells.some(([cx,cy])=>cx<0||cy<0||cx>=GRID.columns||cy>=GRID.rows))return this.note('장비가 장비칸 밖으로 나갑니다.');
    const occupied=new Set(this.gear.filter(g=>g.owner===owner&&g.id!==id).flatMap(g=>rotated(g.def.cells,g.turns).map(([dx,dy])=>`${g.x+dx},${g.y+dy}`)));
    if(cells.some(([cx,cy])=>occupied.has(`${cx},${cy}`)))return this.note('다른 장비와 겹칩니다. 원래 위치를 유지합니다.');
    item.owner=owner;item.x=x;item.y=y;item.turns=((turns%4)+4)%4;
    this.note(`${item.def.name} 장착 완료 · 능력치 적용`);return true;
  }
  unequip(id:number):boolean {
    const g=this.gear.find(g=>g.id===id);if(!g)return false;
    g.owner=null;this.note(`${g.def.name} 장착 해제 · 공용 가방으로 이동`);return true;
  }
  sellGear(id:number):boolean {
    const g=this.gear.find(g=>g.id===id);if(!g)return false;
    // 이번 판매 대상은 상점 직접 구매품만. 조합품의 재료 원가 규칙은 아직 구현하지 않음.
    const value=Math.floor(g.def.price/2);this.gold+=value;
    this.gear=this.gear.filter(v=>v.id!==id);this.note(`${g.def.name} 판매 · ${value}G 환급`);return true;
  }
  tick(realSeconds:number):void {
    const dt=realSeconds*this.speed;this.elapsed+=dt;
    this.spawnClock+=dt;
    while(this.spawnClock>=RULES.spawnSeconds) {
      this.spawnClock-=RULES.spawnSeconds;
      if(this.enemies.length<RULES.maxEnemies) {
        const maxHp=160+Math.floor(this.elapsed/30)*40;
        this.enemies.push({id:this.nextId++,distance:0,...pathPoint(0),hp:maxHp,maxHp,speed:43});
      }
    }
    for(const e of this.enemies){e.distance+=e.speed*dt;Object.assign(e,pathPoint(e.distance));}
    for(const u of this.units) {
      u.cooldown-=dt;if(u.cooldown>0)continue;
      const s=this.stats(u),pos=SLOTS[u.slot];
      // 순환 일반전의 임시 선두 판정: 총 이동 거리 최대, 동률은 먼저 생성된 대상.
      const target=this.enemies.filter(e=>e.hp>0&&Math.hypot(e.x-pos.x,e.y-pos.y)<=s.range)
        .sort((a,b)=>b.distance-a.distance||a.id-b.id)[0];
      if(!target){u.cooldown=0;continue;}
      target.hp-=s.attack;u.cooldown=1/s.rate;
      this.shots.push({x:pos.x,y:pos.y,tx:target.x,ty:target.y,life:0.16,color:UNITS[u.kind].color});
      if(target.hp<=0) {
        const bonus=this.heroes().reduce((sum,h)=>sum+this.stats(h).gold,0);
        this.gold+=Math.floor(RULES.killGold*(1+bonus));this.kills++;this.revision++;
      }
    }
    this.enemies=this.enemies.filter(e=>e.hp>0);
    for(const shot of this.shots)shot.life-=dt;
    this.shots=this.shots.filter(s=>s.life>0);
  }
}

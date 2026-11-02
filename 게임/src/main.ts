import { Application } from 'pixi.js';
import { Defense } from './defense';
import { GRID, RULES, UNITS, rotated, type UnitKind, type ItemDef } from './defenseConfig';
import { createDefenseView } from './defenseView';
import './style.css';

const el=<T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as T;
const game=new Defense();
let pending:UnitKind|null=null, selectedUnit:number|null=null, selectedHero:number|null=null;
let selectedGear:number|null=null,turns=0,tab='summon';
const events=new AbortController();

function shape(item:ItemDef,rotation=0):string {
  const cells=rotated(item.cells,rotation),width=Math.max(...cells.map(c=>c[0]))+1;
  return `<span class="mini-shape" style="grid-template-columns:repeat(${width},9px)">${cells.map(([x,y])=>`<i style="grid-column:${x+1};grid-row:${y+1};background:${item.color}"></i>`).join('')}</span>`;
}
function openTab(name:string):void {
  tab=name;
  document.querySelectorAll<HTMLElement>('.panel').forEach(p=>p.hidden=p.id!==tab);
  document.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach(b=>{b.classList.toggle('active',b.dataset.tab===tab);b.setAttribute('aria-pressed',String(b.dataset.tab===tab));});
}
function refresh():void {
  const unitCards=(hero:boolean)=>Object.entries(UNITS).filter(([,d])=>d.hero===hero).map(([kind,d])=>{
    const blocked=hero&&(game.heroes().length>=RULES.heroLimit||game.heroes().some(u=>u.kind===kind));
    return `<button class="unit-card ${pending===kind?'selected':''}" data-summon="${kind}" ${blocked||game.gold<d.cost?'disabled':''} aria-pressed="${pending===kind}"><span class="unit-icon" style="color:#${d.color.toString(16)}">${d.icon}</span><b>${d.name}</b><small>공격 ${d.attack} · 공속 ${d.rate}</small><span class="price">${hero?(game.heroes().some(u=>u.kind===kind)?'배치됨':'무료 소환'):`${d.cost} G`}</span></button>`;
  }).join('');
  el('soldiers').innerHTML=unitCards(false);el('heroes').innerHTML=unitCards(true);
  el('hero-count').textContent=`배치 ${game.heroes().length} / 3 · 무료`;
  const u=game.units.find(u=>u.id===selectedUnit);
  if(u) {
    const d=UNITS[u.kind],s=game.stats(u);
    el('unit-detail').innerHTML=`<b>${d.name} ${d.hero?'':`Lv.${u.level}`}</b><br>공격 ${s.attack} · 공속 ${s.rate.toFixed(2)} · 체력 ${s.hp}<div class="actions">${d.hero?'<span>영웅은 판매·교체 불가 · 기본 공격만 구현</span>':`<button data-upgrade="${u.id}" ${u.level>=5||game.gold<game.upgradeCost(u)?'disabled':''}>강화 ${u.level>=5?'MAX':game.upgradeCost(u)+'G'}</button><button class="danger" data-sell-unit="${u.id}">판매 +${Math.floor(u.spent/2)}G</button>`}</div>`;
  } else el('unit-detail').textContent='배치된 유닛을 누르면 정보와 병사 강화·판매를 확인합니다.';
  if(!game.heroes().some(h=>h.id===selectedHero))selectedHero=game.heroes()[0]?.id??null;
  el('hero-tabs').innerHTML=game.heroes().map(h=>`<button data-hero="${h.id}" class="${h.id===selectedHero?'active':''}">${UNITS[h.kind].name}</button>`).join('')||'<p class="empty">소환·지휘에서 영웅을 먼저 배치하세요.</p>';
  const hero=game.heroes().find(h=>h.id===selectedHero);
  if(hero) {
    const s=game.stats(hero);
    el('hero-stats').textContent=`공격 ${s.attack} · 공속 ${s.rate.toFixed(2)} · 체력 ${s.hp} · 방어 ${s.armor} · 회복 ${s.regen}/초`;
  } else el('hero-stats').textContent='영웅별 장비칸 5 × 6 · 임시 규격';
  const occupied=new Map<string,typeof game.gear[number]>();
  for(const g of game.gear.filter(g=>g.owner===selectedHero&&g.owner!==null))for(const [dx,dy]of rotated(g.def.cells,g.turns))occupied.set(`${g.x+dx},${g.y+dy}`,g);
  el('equipment').innerHTML=Array.from({length:GRID.columns*GRID.rows},(_,i)=>{
    const x=i%GRID.columns,y=Math.floor(i/GRID.columns),g=occupied.get(`${x},${y}`);
    return `<button class="gear-cell ${g?.id===selectedGear?'picked':''}" data-cell="${x},${y}" ${g?`data-equipped="${g.id}" style="background:${g.def.color}"`:''} aria-label="${x+1}열 ${y+1}행${g?' '+g.def.name:''}" ${!hero?'disabled':''}>${g?g.def.short:''}</button>`;
  }).join('');
  const bag=game.gear.filter(g=>g.owner===null).map(g=>`<button class="bag-item ${selectedGear===g.id?'selected':''}" data-gear="${g.id}" aria-label="${g.def.name} 선택">${shape(g.def,g.id===selectedGear?turns:g.turns)}<span>${g.def.name}</span></button>`).join('')||'<p class="empty">가방이 비어 있습니다. 상점에서 장비를 구매하세요.</p>';
  el('gear-bag').innerHTML=bag;el('shop-bag').innerHTML=bag;
  const gear=game.gear.find(g=>g.id===selectedGear);
  el('rotate').toggleAttribute('disabled',!gear);
  el('unequip').toggleAttribute('disabled',!gear||gear.owner===null);
  el('item-detail').innerHTML=gear?`${shape(gear.def,turns)} <b>${gear.def.name}</b> · ${gear.def.description}<br>방향 ${turns*90}° · ${gear.owner===null?'공용 가방':'장착 중'}<div class="actions"><button class="danger" data-sell-gear="${gear.id}">판매 +${Math.floor(gear.def.price/2)}G</button><button data-cancel-gear>선택 취소</button></div>`:'장비를 선택하면 모양과 능력치를 확인합니다.';
  el('shop-cards').innerHTML=game.shop.map((item,index)=>item?`<article class="shop-card">${shape(item)}<b>${item.name}</b><p>${item.description}</p><button data-buy="${index}" ${game.gold<item.price?'disabled':''}>구매 ${item.price}G</button></article>`:'<article class="shop-card"><b>구매 완료</b><p>새로고침으로 상품을 보충하세요.</p></article>').join('');
  el('reroll').toggleAttribute('disabled',game.gold<RULES.rerollGold);
  updateHud();
}
function updateHud():void {
  el('gold').innerHTML=`${game.gold} <small>G</small>`;
  el('enemies').innerHTML=`${game.enemies.length} <small>/ ${RULES.maxEnemies}</small>`;
  el('kills').textContent=String(game.kills);
  el('population').textContent=`배치 ${game.units.length} / 16`;
  el('message').textContent=game.message;
}
function chooseGear(id:number):void {
  const g=game.gear.find(g=>g.id===id);if(!g)return;
  selectedGear=id;turns=g.turns;if(g.owner!==null)selectedHero=g.owner;
  openTab('gear');game.note(`${g.def.name} 선택 · 회전 후 장비칸에 놓으세요.`);
}
function placeGear(x:number,y:number):void {
  if(selectedGear===null||selectedHero===null)return;
  if(game.equip(selectedGear,selectedHero,x,y,turns))selectedGear=null;
}
let drag:{id:number;x:number;y:number;pointer:number;moved:boolean;ghost:HTMLElement|null}|null=null;
let suppressClick=false;
document.addEventListener('pointerdown',(e)=>{
  if(e.button!==0)return;
  const button=(e.target as HTMLElement).closest<HTMLElement>('[data-gear],[data-equipped]');
  if(button)drag={id:Number(button.dataset.gear??button.dataset.equipped),x:e.clientX,y:e.clientY,pointer:e.pointerId,moved:false,ghost:null};
},{signal:events.signal});
document.addEventListener('pointermove',(e)=>{
  if(!drag||drag.pointer!==e.pointerId)return;
  if(!drag.moved&&Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>7) {
    drag.moved=true;chooseGear(drag.id);
    drag.ghost=document.createElement('div');drag.ghost.className='drag-ghost';
    drag.ghost.textContent=game.gear.find(g=>g.id===drag!.id)?.def.name??'';document.body.append(drag.ghost);
  }
  if(drag.ghost){drag.ghost.style.left=`${e.clientX}px`;drag.ghost.style.top=`${e.clientY}px`;}
},{signal:events.signal});
document.addEventListener('pointerup',(e)=>{
  if(!drag||drag.pointer!==e.pointerId)return;
  if(drag.moved) {
    suppressClick=true;
    const target=document.elementFromPoint(e.clientX,e.clientY)?.closest<HTMLElement>('[data-cell]');
    if(target?.dataset.cell){const [x,y]=target.dataset.cell.split(',').map(Number);placeGear(x,y);}
    else game.note('장비칸에 놓지 않아 원래 위치를 유지합니다.');
    refresh();setTimeout(()=>suppressClick=false,0);
  }
  drag.ghost?.remove();drag=null;
},{signal:events.signal});
document.addEventListener('pointercancel',()=>{drag?.ghost?.remove();drag=null;},{signal:events.signal});
el('app').addEventListener('click',(e)=>{
  if(suppressClick)return;
  const b=(e.target as HTMLElement).closest<HTMLButtonElement>('button');if(!b||b.disabled)return;
  const d=b.dataset;
  if(d.tab)openTab(d.tab);
  else if(d.summon){const kind=d.summon as UnitKind;pending=pending===kind?null:kind;game.note(pending?`${UNITS[kind].name} 선택 · 전장의 빈 칸을 눌러주세요.`:'소환 선택을 취소했습니다.');}
  else if(d.upgrade)game.upgrade(Number(d.upgrade));
  else if(d.sellUnit){game.sellUnit(Number(d.sellUnit));selectedUnit=null;}
  else if(d.hero){selectedHero=Number(d.hero);selectedGear=null;}
  else if(d.buy)game.buy(Number(d.buy));
  else if(d.gear)chooseGear(Number(d.gear));
  else if(d.cell){const [x,y]=d.cell.split(',').map(Number);if(selectedGear!==null)placeGear(x,y);else if(d.equipped)chooseGear(Number(d.equipped));}
  else if(d.sellGear){game.sellGear(Number(d.sellGear));selectedGear=null;}
  else if('cancelGear'in d){selectedGear=null;game.note('장비 선택을 취소했습니다.');}
  else if(b.id==='rotate'){turns=(turns+1)%4;game.note('90° 회전 · 배치를 완료하면 적용됩니다.');}
  else if(b.id==='unequip'&&selectedGear!==null){game.unequip(selectedGear);selectedGear=null;}
  else if(b.id==='reroll')game.reroll();
  else if(b.id==='speed'){game.speed=game.speed===1?2:game.speed===2?3:1;b.textContent=`${game.speed}×`;}
  refresh();
},{signal:events.signal});

async function start():Promise<void> {
  const app=new Application();
  await app.init({width:RULES.width,height:RULES.height,background:'#172620',preference:'webgl',resolution:Math.min(devicePixelRatio||1,2),autoDensity:true,antialias:true});
  el('battlefield').append(app.canvas);app.canvas.setAttribute('aria-label','순환 전장, 병사와 영웅 배치 칸 16개');el('status').hidden=true;
  const view=createDefenseView(app,game,(slot)=>{
    const unit=game.units.find(u=>u.slot===slot);
    if(unit){selectedUnit=unit.id;pending=null;if(UNITS[unit.kind].hero)selectedHero=unit.id;game.note(`${UNITS[unit.kind].name} 선택`);}
    else if(pending){if(game.summon(pending,slot)){selectedUnit=game.units.at(-1)!.id;if(UNITS[pending].hero){selectedHero=selectedUnit;pending=null;}}}
    else game.note('먼저 아래에서 소환할 병사 또는 영웅을 선택하세요.');
    refresh();
  });
  let lastRevision=-1,hudClock=0;
  refresh();
  app.ticker.add(ticker=>{
    // 복귀 시 대량 생성·일괄 피해가 생기지 않게 시뮬레이션 한 프레임을 제한.
    const dt=Math.min(ticker.deltaMS/1000,0.1);game.tick(dt);view.draw(selectedUnit,pending!==null);
    hudClock+=dt;if(hudClock>0.15){hudClock=0;updateHud();}
    if(lastRevision!==game.revision&&!drag){lastRevision=game.revision;refresh();}
  });
  if(import.meta.hot)import.meta.hot.dispose(()=>{events.abort();drag?.ghost?.remove();app.destroy(true,{children:true});});
}
void start().catch((error:unknown)=>{el('status').hidden=false;el('status').textContent='전장을 시작하지 못했습니다. 브라우저 그래픽 지원을 확인해 주세요.';console.error(error);});

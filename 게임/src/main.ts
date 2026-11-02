import { Application } from 'pixi.js';
import { Defense, type LogCategory } from './defense';
import { GRID, ITEMS, RECIPES, RULES, SLOTS, UNITS, rotated, type UnitKind, type ItemDef } from './defenseConfig';
import { createDefenseView } from './defenseView';
import './style.css';

const el=<T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as T;
const game=new Defense();
let pending:UnitKind|null=null, selectedUnit:number|null=null, selectedHero:number|null=null;
let selectedGear:number|null=null,turns=0,tab='summon';
let combineSelection:number[]=[];
const events=new AbortController();
let heroInfo:{kind:UnitKind;unitId:number|null}|null=null;
let heroInfoMarkup='';
function closeHeroInfo():void {heroInfo=null;el('hero-info').hidden=true;}
function positionHeroInfo():void {
  const popup=el('hero-info');if(!heroInfo)return;
  let anchor:{left:number;right:number;top:number;bottom:number};
  if(heroInfo.unitId!==null){
    const unit=game.units.find(u=>u.id===heroInfo!.unitId),canvas=document.querySelector('canvas');
    if(!unit||!canvas){closeHeroInfo();return;}
    const box=canvas.getBoundingClientRect(),point=SLOTS[unit.slot];
    const x=box.left+point.x*box.width/RULES.width,y=box.top+point.y*box.height/RULES.height;
    anchor={left:x-20,right:x+20,top:y-22,bottom:y+22};
  } else {
    const card=document.querySelector<HTMLElement>(`[data-summon="${heroInfo.kind}"]`);
    if(!card||el('summon').hidden){popup.hidden=true;return;}
    anchor=card.getBoundingClientRect();
  }
  if(anchor.bottom<0||anchor.top>innerHeight){popup.hidden=true;return;}
  popup.hidden=false;
  const bounds=el('app').getBoundingClientRect();
  const width=Math.min(300,bounds.width-16,innerWidth-16);
  popup.style.width=`${width}px`;
  const minLeft=Math.max(8,bounds.left+8),maxLeft=Math.min(innerWidth-width-8,bounds.right-width-8);
  const left=Math.max(minLeft,Math.min(maxLeft,(anchor.left+anchor.right-width)/2));
  const height=popup.getBoundingClientRect().height;
  let top=anchor.top-height-10;
  if(top<8)top=anchor.bottom+10;
  popup.style.left=`${left}px`;popup.style.top=`${Math.max(8,Math.min(innerHeight-height-8,top))}px`;
}
function refreshHeroInfo():void {
  if(!heroInfo)return;
  const def=UNITS[heroInfo.kind],unit=game.units.find(u=>u.id===heroInfo!.unitId);
  if(heroInfo.unitId!==null&&!unit){closeHeroInfo();return;}
  const stats=unit?game.stats(unit):{hp:def.hp,attack:def.attack,armor:def.armor,rate:def.rate,regen:0,gold:0};
  const fields=[['hp','♥','최대 체력',stats.hp.toLocaleString()],['attack','⚔','공격력',stats.attack.toLocaleString()],['armor','⬡','방어력',String(stats.armor)],['rate','↗','공격속도',`${stats.rate.toFixed(2)}/초`],['regen','✚','체력 재생',`${stats.regen}/초`],['gold','◇','골드 획득',`+${Math.round(stats.gold*100)}%`]];
  const markup=`<header><span class="hero-info-icon" style="color:#${def.color.toString(16)}">${def.icon}</span><div><small>${unit?(def.hero?'장비 적용 능력치':`강화 적용 능력치 · Lv.${unit.level}`):'기본 능력치 · 배치 전'}</small><h2>${def.name}${unit?` #${unit.id}`:''}</h2></div><button id="close-hero-info" aria-label="유닛 능력치 닫기">×</button></header><dl>${fields.map(([key,icon,label,value])=>`<div class="hero-stat"><dt><span class="stat-symbol ${key}">${icon}</span>${label}</dt><dd data-stat="${key}">${value}</dd></div>`).join('')}</dl>`;
  if(markup!==heroInfoMarkup){el('hero-info').innerHTML=markup;heroInfoMarkup=markup;}
  positionHeroInfo();
}
const logHeads:Record<LogCategory,number>={damage:0,reward:0,economy:0};
function refreshLogs():void {
  for(const category of ['damage','reward','economy'] as const) {
    const records=game.logs[category];
    if(!records.length){
      if(logHeads[category]!==0){el(`${category}-log`).innerHTML='<li class="log-empty">아직 기록이 없습니다.</li>';el(`${category}-count`).textContent='0건';logHeads[category]=0;}
      continue;
    }
    if(logHeads[category]===records[0].id)continue;
    logHeads[category]=records[0].id;
    const list=el<HTMLOListElement>(`${category}-log`);
    const oldTop=list.scrollTop;
    const anchor=oldTop>0?Array.from(list.children).find(row=>row.getBoundingClientRect().bottom>list.getBoundingClientRect().top):null;
    const anchorId=anchor?.getAttribute('data-log-id');
    const oldOffset=anchor?anchor.getBoundingClientRect().top-list.getBoundingClientRect().top:0;
    const nodes=records.map(record=>{
      const row=document.createElement('li');row.dataset.logId=String(record.id);
      const time=document.createElement('time');
      const seconds=Math.floor(record.time);
      time.textContent=`[${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}]`;
      const text=document.createElement('span');text.textContent=record.text;
      row.append(time,text);return row;
    });
    list.replaceChildren(...nodes);
    if(anchorId) {
      const retained=nodes.find(row=>row.dataset.logId===anchorId);
      list.scrollTop=retained?retained.getBoundingClientRect().top-list.getBoundingClientRect().top+list.scrollTop-oldOffset:oldTop;
    } else list.scrollTop=0;
    el(`${category}-count`).textContent=`${records.length}건`;
  }
}

function shape(item:ItemDef,rotation=0):string {
  const cells=rotated(item.cells,rotation),width=Math.max(...cells.map(c=>c[0]))+1;
  return `<span class="mini-shape" style="grid-template-columns:repeat(${width},9px)">${cells.map(([x,y])=>`<i style="grid-column:${x+1};grid-row:${y+1};background:${item.color}"></i>`).join('')}</span>`;
}
function openTab(name:string):void {
  tab=name;
  document.querySelectorAll<HTMLElement>('.panel').forEach(p=>p.hidden=p.id!==tab);
  document.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach(b=>{b.classList.toggle('active',b.dataset.tab===tab);b.setAttribute('aria-pressed',String(b.dataset.tab===tab));});
}
function inventoryGrid(owner:number|null):string {
  const occupied=new Map<string,typeof game.gear>();
  const states=owner===null?null:game.gearStates(owner);
  for(const g of game.gear.filter(g=>g.owner===owner).sort((a,b)=>a.order-b.order))for(const [dx,dy]of rotated(g.def.cells,g.turns)){
    const key=`${g.x+dx},${g.y+dy}`;occupied.set(key,[...(occupied.get(key)??[]),g]);
  }
  const rows=owner===null?game.bagRows():GRID.rows;
  return Array.from({length:GRID.columns*rows},(_,i)=>{
    const x=i%GRID.columns,y=Math.floor(i/GRID.columns),stack=occupied.get(`${x},${y}`)??[];
    const g=stack.find(g=>g.id===selectedGear)??stack.at(-1),inactive=g&&states&&!states.get(g.id)?.active;
    const address=owner===null?`data-bag-cell="${x},${y}"`:`data-cell="${x},${y}"`;
    return `<button class="gear-cell ${g?.id===selectedGear?'picked':''} ${inactive?'gear-inactive':''} ${g&&combineSelection.includes(g.id)?'material-picked':''}" ${address} ${g?`data-gear-id="${g.id}" ${inactive?'data-inactive="true"':''} style="background-color:${g.def.color}" title="${stack.map(v=>`${v.def.name} #${v.id}`).join(' / ')} · 더블클릭 회전"`:''} aria-label="${owner===null?'공용 가방':'영웅 장비'} ${x+1}열 ${y+1}행${g?' '+g.def.name:''}${inactive?' 비활성':''}">${g?g.def.short:''}${stack.length>1?`<sup>${stack.length}</sup>`:''}</button>`;
  }).join('');
}
function refresh():void {
  combineSelection=combineSelection.filter(id=>game.gear.some(g=>g.id===id&&g.owner===null));
  const unitCards=(hero:boolean)=>Object.entries(UNITS).filter(([,d])=>d.hero===hero).map(([kind,d])=>{
    const blocked=hero&&(game.heroes().length>=RULES.heroLimit||game.heroes().some(u=>u.kind===kind));
    if(hero)return `<button class="unit-card hero-card ${pending===kind?'selected':''} ${blocked?'unavailable':''}" data-summon="${kind}" aria-pressed="${pending===kind}" aria-haspopup="dialog" aria-label="${d.name} 능력치 확인"><span class="unit-icon" style="color:#${d.color.toString(16)}">${d.icon}</span><b>${d.name}</b><span class="price">${game.heroes().some(u=>u.kind===kind)?'배치됨':blocked?'정원 가득':'무료 소환'}</span></button>`;
    return `<button class="unit-card ${pending===kind?'selected':''} ${game.gold<d.cost?'unavailable':''}" data-summon="${kind}" aria-pressed="${pending===kind}" aria-haspopup="dialog"><span class="unit-icon" style="color:#${d.color.toString(16)}">${d.icon}</span><b>${d.name}</b><small>클릭하여 능력치 확인</small><span class="price">${d.cost} G</span></button>`;
  }).join('');
  el('soldiers').innerHTML=unitCards(false);el('heroes').innerHTML=unitCards(true);
  el('hero-count').textContent=`배치 ${game.heroes().length} / 3 · 무료`;
  const u=game.units.find(u=>u.id===selectedUnit);
  el('unit-detail').hidden=!u||UNITS[u.kind].hero;
  if(u&&!UNITS[u.kind].hero) {
    const d=UNITS[u.kind],s=game.stats(u);
    el('unit-detail').innerHTML=`<b>${d.name} #${u.id} Lv.${u.level}</b> · ${Math.floor(u.slot/4)+1}행 ${u.slot%4+1}열<br>공격 ${s.attack} · 공속 ${s.rate.toFixed(2)} · 체력 ${s.hp}<div class="actions"><button data-upgrade="${u.id}" ${u.level>=5||game.gold<game.upgradeCost(u)?'disabled':''}>강화 ${u.level>=5?'MAX':game.upgradeCost(u)+'G'}</button><button class="danger" data-sell-unit="${u.id}">판매 +${Math.floor(u.spent/2)}G</button></div>`;
  } else el('unit-detail').textContent='배치된 유닛을 누르면 정보와 병사 강화·판매를 확인합니다.';
  if(!game.heroes().some(h=>h.id===selectedHero))selectedHero=game.heroes()[0]?.id??null;
  const hero=game.heroes().find(h=>h.id===selectedHero);
  el('gear-title').textContent=hero?`${UNITS[hero.kind].name} #${hero.id} 장비`:'영웅 장비';
  el('equipment').innerHTML=hero?inventoryGrid(hero.id):'<p class="empty">영웅을 먼저 배치하세요.</p>';
  el('equipped-list').innerHTML=hero?game.gear.filter(g=>g.owner===hero.id).map(g=>{
    const state=game.gearState(g);
    return `<div class="gear-state-row ${state.active?'':'invalid'}"><button data-select-gear="${g.id}">${g.def.name} #${g.id} · ${state.active?'활성':`비활성 (${state.reason})`}</button>${!state.active?`<button data-return-gear="${g.id}">가방으로</button>`:''}</div>`;
  }).join(''):'';
  const bag=inventoryGrid(null);
  el('gear-bag').innerHTML=bag;el('shop-bag').innerHTML=bag;
  const gear=game.gear.find(g=>g.id===selectedGear);
  el('rotate').toggleAttribute('disabled',!gear);
  el('unequip').toggleAttribute('disabled',!gear||gear.owner===null);
  const itemDetail=gear?`${shape(gear.def,turns)} <b>${gear.def.name} #${gear.id}</b> · ${gear.def.description}<br>방향 ${turns*90}° · ${gear.owner===null?'공용 가방':game.gearState(gear).active?'능력치 활성':`능력치 비활성 (${game.gearState(gear).reason})`}<div class="actions"><button data-rotate-selected>↻ 회전</button>${gear.owner===null?`<button data-open-gear>영웅에게 장착</button><button data-material="${gear.id}" aria-pressed="${combineSelection.includes(gear.id)}">${combineSelection.includes(gear.id)?'재료 선택 해제':'조합 재료 선택'}</button>`:''}<button class="danger" data-sell-gear="${gear.id}">판매 +${Math.floor(gear.costBasis/2)}G</button><button data-cancel-gear>취소</button></div>`:'블록을 선택하거나 끌어 놓으세요. 더블클릭·두 번 탭하면 회전합니다.';
  el('item-detail').innerHTML=itemDetail;el('shop-item-detail').innerHTML=itemDetail;
  el('shop-cards').innerHTML=game.shop.map((item,index)=>item?`<article class="shop-card">${shape(item)}<b>${item.name}</b><p>${item.description}</p><button data-buy="${index}" ${game.gold<item.price?'disabled':''}>구매 ${item.price}G</button></article>`:'<article class="shop-card"><b>구매 완료</b><p>새로고침으로 상품을 보충하세요.</p></article>').join('');
  el('reroll').toggleAttribute('disabled',game.gold<RULES.rerollGold);
  updateHud();
  refreshLogs();
  refreshHeroInfo();
  refreshTools();
}
function refreshTools():void {
  el('dev-balance').textContent=`골드 ${game.gold.toLocaleString()}G · 모루 ${game.anvils}`;
  el('recipe-list').innerHTML=RECIPES.map(recipe=>{
    const used:number[]=[];
    const available=recipe.materials.every(type=>{const g=game.gear.find(g=>g.owner===null&&g.def.id===type&&!used.includes(g.id));if(!g)return false;used.push(g.id);return true;});
    const result=ITEMS.find(item=>item.id===recipe.result)!;
    const chip=(id:string)=>{const item=ITEMS.find(item=>item.id===id)!;return `<span class="recipe-chip">${shape(item)}<span>${item.name}</span></span>`;};
    return `<article class="recipe-card"><div class="recipe-formula">${chip(recipe.materials[0])}<b>+</b>${chip(recipe.materials[1])}<b>→</b>${chip(recipe.result)}</div><p>${result.description} · 모루 1</p><button data-pick-recipe="${recipe.id}" ${available?'':'disabled'}>${available?'재료 선택':'가방 재료 부족'}</button></article>`;
  }).join('');
  const selection=combineSelection.map(id=>game.gear.find(g=>g.id===id)!);
  el('combine-materials').innerHTML=selection.map(g=>`<button data-remove-material="${g.id}">${g.def.name} #${g.id} ×</button>`).join('')||'<span>가방에서 재료 2개를 선택하세요.</span>';
  const recipe=game.recipeFor(combineSelection),result=ITEMS.find(item=>item.id===recipe?.result);
  el('combine-result').textContent=result?`결과: ${result.name} · 판매 환급 ${Math.floor(selection.reduce((sum,g)=>sum+g.costBasis,0)/2)}G`:selection.length===2?'해당 재료의 조합식이 없습니다.':'조합식의 ‘재료 선택’을 눌러도 됩니다.';
  el('combine').toggleAttribute('disabled',!recipe||game.anvils<1);
}
function selectMaterial(id:number):void {
  if(combineSelection.includes(id))combineSelection=combineSelection.filter(v=>v!==id);
  else if(combineSelection.length<2&&game.gear.some(g=>g.id===id&&g.owner===null))combineSelection.push(id);
  else game.note('재료는 2개까지 선택합니다. 먼저 기존 선택을 해제하세요.');
}
function selectRecipe(id:string):void {
  const recipe=RECIPES.find(r=>r.id===id);if(!recipe)return;
  const selected:number[]=[];
  for(const type of recipe.materials){const gear=game.gear.find(g=>g.owner===null&&g.def.id===type&&!selected.includes(g.id));if(!gear){game.note('공용 가방에 조합 재료가 부족합니다.');return;}selected.push(gear.id);}
  combineSelection=selected;game.note('재료 선택 완료 · 모루 1개로 조합할 수 있습니다.');
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
  game.note(`${g.def.name} 선택 · 빈 칸에 배치 / 더블클릭 회전`);
}
function placeGear(x:number,y:number,bag=false):void {
  if(selectedGear===null)return;
  if(!bag&&selectedHero===null){game.note('장착할 영웅을 먼저 선택하세요.');return;}
  const success=bag?game.placeInBag(selectedGear,x,y,turns):game.equip(selectedGear,selectedHero!,x,y,turns);
  if(success)selectedGear=null;
}
type Drag={id:number;x:number;y:number;pointer:number;moved:boolean;ghost:HTMLElement|null;dx:number;dy:number};
let drag:Drag|null=null;
let unitDrag:Drag|null=null;
let suppressClick=false;
let lastGearTap:{id:number;context:string;time:number}|null=null;
let lastRotation:{id:number;time:number}|null=null;
function rotateSelected(id:number):void {
  selectedGear=id;
  if(game.rotateGear(id)){const item=game.gear.find(g=>g.id===id)!;const state=game.gearState(item);game.note(item.owner===null||state.active?'블록 90° 회전 완료':`회전 완료 · 능력치 비활성 (${state.reason})`);}
  turns=game.gear.find(g=>g.id===id)?.turns??0;
  lastRotation={id,time:performance.now()};lastGearTap=null;
}
function canvasSlot(x:number,y:number):number {
  const canvas=document.querySelector('canvas');if(!canvas)return -1;
  const rect=canvas.getBoundingClientRect();
  const px=(x-rect.left)*RULES.width/rect.width,py=(y-rect.top)*RULES.height/rect.height;
  return SLOTS.findIndex(p=>Math.abs(p.x-px)<=25&&Math.abs(p.y-py)<=23);
}
document.addEventListener('pointerdown',(e)=>{
  if(e.button!==0)return;
  const target=e.target as HTMLElement;
  if(!target.closest('#hero-info')&&!target.closest('.unit-card'))closeHeroInfo();
  const button=target.closest<HTMLElement>('[data-gear-id]');
  if(button){
    const id=Number(button.dataset.gearId),item=game.gear.find(g=>g.id===id);
    const cell=(button.dataset.bagCell??button.dataset.cell)!.split(',').map(Number);
    drag={id,x:e.clientX,y:e.clientY,pointer:e.pointerId,moved:false,ghost:null,dx:cell[0]-(item?.x??0),dy:cell[1]-(item?.y??0)};
  }
  if(target.tagName==='CANVAS'){
    const unit=game.units.find(u=>u.slot===canvasSlot(e.clientX,e.clientY));
    if(unit)unitDrag={id:unit.id,x:e.clientX,y:e.clientY,pointer:e.pointerId,moved:false,ghost:null,dx:0,dy:0};
  }
},{signal:events.signal});
document.addEventListener('pointermove',(e)=>{
  if(unitDrag&&unitDrag.pointer===e.pointerId){
    if(!unitDrag.moved&&Math.hypot(e.clientX-unitDrag.x,e.clientY-unitDrag.y)>7){
      unitDrag.moved=true;selectedUnit=unitDrag.id;pending=null;
      unitDrag.ghost=document.createElement('div');unitDrag.ghost.className='drag-ghost';
      const unit=game.units.find(u=>u.id===unitDrag!.id);
      if(unit&&UNITS[unit.kind].hero)selectedHero=unit.id;
      unitDrag.ghost.textContent=unit?`${UNITS[unit.kind].name} 이동`:'유닛 이동';document.body.append(unitDrag.ghost);
    }
    if(unitDrag.ghost){unitDrag.ghost.style.left=`${e.clientX}px`;unitDrag.ghost.style.top=`${e.clientY}px`;}
  }
  if(!drag||drag.pointer!==e.pointerId)return;
  if(!drag.moved&&Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>7) {
    drag.moved=true;lastGearTap=null;chooseGear(drag.id);
    drag.ghost=document.createElement('div');drag.ghost.className='drag-ghost';
    drag.ghost.textContent=game.gear.find(g=>g.id===drag!.id)?.def.name??'';document.body.append(drag.ghost);
  }
  if(drag.ghost){drag.ghost.style.left=`${e.clientX}px`;drag.ghost.style.top=`${e.clientY}px`;}
},{signal:events.signal});
document.addEventListener('pointerup',(e)=>{
  if(unitDrag&&unitDrag.pointer===e.pointerId){
    if(unitDrag.moved){game.moveUnit(unitDrag.id,canvasSlot(e.clientX,e.clientY));refresh();}
    unitDrag.ghost?.remove();unitDrag=null;
  }
  if(!drag||drag.pointer!==e.pointerId)return;
  if(drag.moved) {
    suppressClick=true;
    const target=document.elementFromPoint(e.clientX,e.clientY)?.closest<HTMLElement>('[data-cell],[data-bag-cell]');
    const address=target?.dataset.cell??target?.dataset.bagCell;
    if(address){const [x,y]=address.split(',').map(Number);placeGear(x-drag.dx,y-drag.dy,!!target?.dataset.bagCell);}
    else game.note('장비칸에 놓지 않아 원래 위치를 유지합니다.');
    refresh();setTimeout(()=>suppressClick=false,0);
  }
  drag.ghost?.remove();drag=null;
},{signal:events.signal});
document.addEventListener('pointercancel',()=>{drag?.ghost?.remove();drag=null;unitDrag?.ghost?.remove();unitDrag=null;},{signal:events.signal});
el('app').addEventListener('click',(e)=>{
  if(suppressClick)return;
  const b=(e.target as HTMLElement).closest<HTMLButtonElement>('button');if(!b||b.disabled)return;
  const d=b.dataset;
  if(d.tab){closeHeroInfo();openTab(d.tab);}
  else if(d.summon){
    const kind=d.summon as UnitKind;
    if(UNITS[kind].hero){
      const placed=game.heroes().find(u=>u.kind===kind);
      if(placed){selectedUnit=placed.id;selectedHero=placed.id;pending=null;selectedGear=null;openTab('gear');heroInfo={kind,unitId:placed.id};game.note(`${UNITS[kind].name} 장비 선택`);}
      else {heroInfo={kind,unitId:null};pending=game.heroes().length<RULES.heroLimit?kind:null;game.note(pending?`${UNITS[kind].name} 선택 · 빈 칸을 누르면 무료 소환`:'영웅 정원이 가득합니다. 기본 능력치를 확인할 수 있습니다.');}
    } else {heroInfo={kind,unitId:null};pending=game.gold>=UNITS[kind].cost?kind:null;game.note(pending?`${UNITS[kind].name} 선택 · 빈 칸을 누르면 소환`:'골드가 부족합니다. 기본 능력치는 확인할 수 있습니다.');}
  }
  else if(d.upgrade)game.upgrade(Number(d.upgrade));
  else if(d.sellUnit){game.sellUnit(Number(d.sellUnit));selectedUnit=null;}
  else if(d.buy)game.buy(Number(d.buy));
  else if(d.selectGear)chooseGear(Number(d.selectGear));
  else if(d.returnGear){game.unequip(Number(d.returnGear));selectedGear=null;}
  else if(d.material)selectMaterial(Number(d.material));
  else if(d.cell||d.bagCell){
    if(d.gearId){
      const id=Number(d.gearId),context=b.parentElement!.id,now=performance.now();
      if(e.detail===2||(e.detail>0&&lastGearTap?.id===id&&lastGearTap.context===context&&now-lastGearTap.time<350))rotateSelected(id);
      else {chooseGear(id);lastGearTap={id,context,time:now};}
    } else {lastGearTap=null;const [x,y]=(d.cell??d.bagCell)!.split(',').map(Number);placeGear(x,y,!!d.bagCell);}
  }
  else if(d.sellGear){game.sellGear(Number(d.sellGear));selectedGear=null;}
  else if('cancelGear'in d){selectedGear=null;game.note('장비 선택을 취소했습니다.');}
  else if((b.id==='rotate'||'rotateSelected'in d)&&selectedGear!==null)rotateSelected(selectedGear);
  else if('openGear'in d)openTab('gear');
  else if(b.id==='unequip'&&selectedGear!==null){game.unequip(selectedGear);selectedGear=null;}
  else if(b.id==='reroll')game.reroll();
  else if(b.id==='speed'){game.speed=game.speed===1?2:game.speed===2?3:1;b.textContent=`${game.speed}×`;}
  refresh();
},{signal:events.signal});
el('dev-tools').addEventListener('click',(e)=>{
  const button=(e.target as HTMLElement).closest<HTMLButtonElement>('button');if(!button||button.disabled)return;
  const data=button.dataset;
  if(button.id==='dev-gold')game.devGold();
  else if(button.id==='dev-anvils')game.devAnvils();
  else if(button.id==='dev-reset'){
    drag?.ghost?.remove();unitDrag?.ghost?.remove();drag=null;unitDrag=null;
    game.reset();pending=null;selectedUnit=null;selectedHero=null;selectedGear=null;turns=0;combineSelection=[];
    lastGearTap=null;lastRotation=null;suppressClick=false;closeHeroInfo();openTab('summon');el('speed').textContent='1×';
  }
  else if(data.pickRecipe)selectRecipe(data.pickRecipe);
  else if(data.removeMaterial)combineSelection=combineSelection.filter(id=>id!==Number(data.removeMaterial));
  else if(button.id==='combine'){if(game.combine(combineSelection)){combineSelection=[];selectedGear=null;}}
  refresh();
},{signal:events.signal});
el('hero-info').addEventListener('click',(e)=>{if((e.target as HTMLElement).closest('#close-hero-info'))closeHeroInfo();},{signal:events.signal});
document.addEventListener('keydown',(e)=>{if(e.key==='Escape')closeHeroInfo();},{signal:events.signal});
window.addEventListener('resize',positionHeroInfo,{signal:events.signal});
document.addEventListener('scroll',positionHeroInfo,{capture:true,signal:events.signal});
// DOM이 갱신되어도 두 번 클릭한 블록 ID로 회전을 판정한다. 네이티브 dblclick 단독 입력도 지원.
el('app').addEventListener('dblclick',(e)=>{
  const block=(e.target as HTMLElement).closest<HTMLElement>('[data-gear-id]');
  if(!block)return;
  e.preventDefault();const id=Number(block.dataset.gearId);
  if(lastRotation?.id===id&&performance.now()-lastRotation.time<400)return;
  rotateSelected(id);refresh();
},{signal:events.signal});

async function start():Promise<void> {
  const app=new Application();
  await app.init({width:RULES.width,height:RULES.height,background:'#172620',preference:'webgl',resolution:Math.min(devicePixelRatio||1,2),autoDensity:true,antialias:true});
  el('battlefield').append(app.canvas);app.canvas.setAttribute('aria-label','순환 전장, 병사와 영웅 배치 칸 16개');el('status').hidden=true;
  const view=createDefenseView(app,game,(slot)=>{
    if(unitDrag?.moved)return;
    const unit=game.units.find(u=>u.slot===slot);
    if(unit){selectedUnit=unit.id;pending=null;if(UNITS[unit.kind].hero){selectedHero=unit.id;selectedGear=null;openTab('gear');}else openTab('summon');heroInfo={kind:unit.kind,unitId:unit.id};game.note(`${UNITS[unit.kind].name} 선택 · 드래그로 이동·자리교체`);}
    else if(pending){if(game.summon(pending,slot)){selectedUnit=game.units.at(-1)!.id;if(UNITS[pending].hero){selectedHero=selectedUnit;pending=null;}closeHeroInfo();}}
    else game.note('먼저 아래에서 소환할 병사 또는 영웅을 선택하세요.');
    refresh();
  });
  let lastRevision=-1,hudClock=0;
  refresh();
  app.ticker.add(ticker=>{
    // 복귀 시 대량 생성·일괄 피해가 생기지 않게 시뮬레이션 한 프레임을 제한.
    const dt=Math.min(ticker.deltaMS/1000,0.1);game.tick(dt);view.draw(selectedUnit,pending!==null);
    hudClock+=dt;if(hudClock>0.15){hudClock=0;updateHud();refreshLogs();}
    if(lastRevision!==game.revision&&!drag&&!unitDrag){lastRevision=game.revision;refresh();}
  });
  if(import.meta.hot)import.meta.hot.dispose(()=>{events.abort();drag?.ghost?.remove();unitDrag?.ghost?.remove();app.destroy(true,{children:true});});
}
void start().catch((error:unknown)=>{el('status').hidden=false;el('status').textContent='전장을 시작하지 못했습니다. 브라우저 그래픽 지원을 확인해 주세요.';console.error(error);});

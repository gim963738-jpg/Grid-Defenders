import './mobile-ui.css';
import {UNITS,SLOTS,GRID,BAG_GRID,RULES,rotated,type UnitKind} from './defenseConfig';
import {itemArt,hasItemArt} from './itemArt';
import {COMMANDER_SKILL_ICON} from './bossSkillIcons';
import {inventoryPlacement,commitInventoryPlacement,pickedItem,combinationPartners,inventoryCombinationLinks,type InventoryPick,type InventoryPlacement} from './landscape-inventory';
const params=new URLSearchParams(location.search);
if(!params.has('battle')){params.set('battle','normal');params.set('from','camp');history.replaceState(null,'',`${location.pathname}?${params}`);}
document.body.classList.add('landscape-live');document.body.style.visibility='visible';
const el=(id:string)=>document.getElementById(id)!;
const field=el('battlefield'),frame=document.createElement('section');frame.id='live-landscape';frame.setAttribute('aria-label','가로형 전투');
el('defense-screen').prepend(frame);frame.append(field);
frame.insertAdjacentHTML('beforeend',`
  <div id="live-terrain"></div><div id="live-tiles"></div>
  <aside id="live-status" aria-label="전투 현황">
    <section id="live-wave" aria-label="웨이브 1">
      <header class="live-wave-heading"><span>WAVE</span><strong>01</strong></header>
      <div class="live-wave-dial" role="timer" aria-label="웨이브 남은 시간"><span data-live-clock-label>남은 시간</span><b>00:30</b></div>
      <div class="live-enemy-readout"><span>몬스터</span><small><em data-live-enemy-count>0</em><span data-live-enemy-limit>/ 20</span></small>
        <div class="live-enemy-gauge" role="progressbar" aria-label="전장 몬스터 수" aria-valuemin="0" aria-valuemax="20" aria-valuenow="0"><i></i></div>
      </div>
    </section>
  </aside>
  <nav id="live-controls"><button data-control="pause" aria-label="일시정지">Ⅱ</button><button data-control="speed" aria-label="배속 변경">1×</button><button disabled aria-label="설정 준비중">⚙</button><button data-control="home" aria-label="로비로">⌂</button></nav>
  <nav id="live-actions"><button data-menu="soldier">병사</button><button data-menu="hero">영웅</button><button data-menu="shop">상점</button></nav>
  <div id="live-tray" hidden></div>
  <aside id="live-inventory" hidden>
    <section id="live-equipment"><div id="live-hero-bags"></div><button id="live-combine" data-action="combine">조합</button></section>
    <section id="live-shared" aria-label="공용 가방"><div id="live-bag-board"></div></section>
  </aside>
  <aside id="live-hero-panel" aria-label="영웅 정보" hidden></aside>
  <svg id="live-links" viewBox="0 0 800 360" aria-hidden="true"></svg>
  <div id="live-drop-target" hidden aria-hidden="true"></div><div id="live-sale-target" hidden>여기로 끌어 판매 <b></b></div>
  <p id="live-notice" role="status"></p>`);
const controls=el('live-controls');controls.hidden=true;controls.setAttribute('aria-label','전투 조작');el('app').append(controls);
const bossAuto=el('boss-auto-skills'),commander=el('boss-commander-skill');
bossAuto.hidden=true;controls.prepend(bossAuto);
commander.insertAdjacentHTML('afterbegin',`<i class="boss-skill-icon" aria-hidden="true">${COMMANDER_SKILL_ICON}</i><small class="boss-skill-time" aria-hidden="true"></small>`);
el('boss-screen').append(commander);
const wallet=document.querySelector<HTMLElement>('.inventory-actions .resource-wallet')!;
wallet.id='live-wallet';wallet.setAttribute('aria-label','전투 재화');el('live-status').append(wallet);
const devArea=document.createElement('section');devArea.id='landscape-dev-area';devArea.setAttribute('aria-label','전투 개발자 도구');document.body.append(devArea);devArea.append(el('dev-tools'),el('dev-log'));
const live=await import('./main');
await import('./landscape-game.css');
const api=live.liveBattle,g=api.game;
Object.assign(frame,{liveBattle:api});
const tray=el('live-tray'),actions=el('live-actions'),inventory=el('live-inventory'),heroPanel=el('live-hero-panel');
const heroBags=el('live-hero-bags'),bagBoard=el('live-bag-board'),links=el('live-links');
const INVENTORY_CELL=32;
const lifetime=new AbortController(),signal=lifetime.signal;
const htmlCache=new WeakMap<HTMLElement,string>();
type Menu='soldier'|'hero'|'shop'|'';
type Drag={pointer:number;x:number;y:number;startX:number;startY:number;type:'unit'|'gear'|'offer';id:string;
  node:HTMLElement;moved:boolean;scrolling:boolean;scroll:number;ghost:HTMLElement|null;grabX:number;grabY:number};
type Destination={kind:'grid';grid:HTMLElement;plan:InventoryPlacement}|{kind:'hero';hero:number;plan:InventoryPlacement}|
  {kind:'sale'}|{kind:'none'};
let menu:Menu='',gear:number|null=null,focusPick:InventoryPick|null=null,drag:Drag|null=null;
let selectedCard:string|null=null,suppressUntil=0,timer:number|undefined,dragFrame=0;
let lastTap:{id:number;time:number}|null=null,rotationAnimation:Animation|null=null;
let observedRun=api.runId,observedScene=api.scene;
let heroClickUntil=0,pendingHeroFocus:number|null=null;
let heroScrollReady=false,heroWheelTimer:number|undefined;
let renderedHeroLimit:boolean|undefined;

function interactive(){return api.ready&&api.active&&api.scene==='defense'&&el('app').getAttribute('aria-busy')!=='true';}
function setHtml(node:HTMLElement,html:string){
  if(htmlCache.get(node)===html)return;
  const left=node.scrollLeft,top=node.scrollTop;
  node.innerHTML=html;htmlCache.set(node,html);node.scrollLeft=left;node.scrollTop=top;
}
function finishMutation(){api.refresh();render();}
function closeMenu(){
  clearTimeout(timer);clearTimeout(heroWheelTimer);cancelDrag();menu='';gear=null;focusPick=null;selectedCard=null;pendingHeroFocus=null;heroScrollReady=false;
  tray.hidden=true;inventory.hidden=true;heroPanel.hidden=true;actions.classList.remove('away');actions.inert=false;
  api.clearSelection();render();
}
function showMenu(value:Menu,heroId:number|null=null){
  if(!interactive())return;
  const alreadyOpen=menu===value&&!tray.hidden;
  clearTimeout(timer);clearTimeout(heroWheelTimer);cancelDrag();menu=value;gear=null;focusPick=null;selectedCard=null;
  if(heroId!==null&&api.hero!==heroId)api.selectHero(heroId);
  pendingHeroFocus=value==='shop'||value==='hero'?(heroId??api.hero):null;
  if(value==='hero'){
    const hero=g.heroes().find(hero=>hero.id===(heroId??api.hero)),index=heroCards.findIndex(([kind])=>kind===hero?.kind);
    if(index>=0)selectedCard=`${heroCards[index][0]}-${index}`;
  }
  api.clearSelection();
  if(alreadyOpen){inventory.hidden=value!=='shop';heroPanel.hidden=value!=='hero';render();return;}
  heroScrollReady=false;tray.hidden=true;tray.scrollLeft=0;inventory.hidden=true;heroPanel.hidden=true;
  actions.classList.add('away');actions.inert=true;
  timer=window.setTimeout(()=>{if(!interactive()){closeMenu();return;}tray.hidden=false;inventory.hidden=menu!=='shop';heroPanel.hidden=menu!=='hero';render();},200);
}

// Presentation names/crops only: no lobby roster, levels or equipment are imported.
const heroCards:[UnitKind,string,number][]=[['melee','아리아',1],['ranged','카이',4],['tank','브란',0],
  ['healer','셀린',2],['arcanist','벨라',3],['assassin','제노',6],['melee','아리아',1],['ranged','카이',4],['healer','리나',5]];
// Three fixed copies provide a buffer on both sides; selection/deployment uses the original card key.
const HERO_CARD_STEP=74,HERO_CYCLE=heroCards.length*HERO_CARD_STEP;
function heroLimitReached(){return g.heroes().length>=RULES.heroLimit;}
function visibleHeroCards(){
  const entries=heroCards.map(([kind,name,portrait],index)=>({kind,name,portrait,index}));
  if(!heroLimitReached())return entries;
  const deployed=new Set(g.heroes().map(hero=>hero.kind));
  return entries.filter(entry=>deployed.delete(entry.kind));
}
function loopHeroLeft(left:number){return HERO_CYCLE+((left-HERO_CYCLE)%HERO_CYCLE+HERO_CYCLE)%HERO_CYCLE;}
function scrollHeroes(left:number){
  if(heroLimitReached()){tray.scrollTo({left:0,behavior:'instant'});return;}
  const wrapped=loopHeroLeft(left);
  if(drag?.scrolling)drag.scroll+=wrapped-left;
  tray.scrollTo({left:wrapped,behavior:'instant'});
}
function syncHeroCopies(){
  if(menu!=='hero'||tray.hidden||!heroScrollReady||heroLimitReached())return;
  const buttons=[...tray.querySelectorAll<HTMLButtonElement>('[data-live-card]')],center=tray.scrollLeft+tray.clientWidth/2;
  for(let i=0;i<heroCards.length;i++){
    const copies=buttons.filter(button=>button.dataset.heroIndex===String(i));
    const nearest=copies.reduce((best,button)=>Math.abs(button.offsetLeft+button.offsetWidth/2-center)<Math.abs(best.offsetLeft+best.offsetWidth/2-center)?button:best);
    for(const button of copies){
      const active=button===nearest;button.tabIndex=active?0:-1;
      if(active)button.removeAttribute('aria-hidden');else button.setAttribute('aria-hidden','true');
      if(!active&&document.activeElement===button)nearest.focus({preventScroll:true});
    }
  }
}
function snapHeroes(){
  tray.classList.remove('scrolling');
  if(heroLimitReached()){scrollHeroes(0);return;}
  tray.scrollTo({left:Math.round(tray.scrollLeft/HERO_CARD_STEP)*HERO_CARD_STEP,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
}
function emblem(kind:UnitKind){
  const path=kind==='guard'?'<path d="m5 19 12-14 2 2L7 21M5 13l6 5M3 21l3-3"/>':
    kind==='archer'?'<path d="M6 3q17 9 0 18L11 12ZM3 12h18m-4-4 4 4-4 4"/>':
    '<path d="m7 21 7-14M10 5l4-3 4 3-4 4ZM4 7h3m12 6h2"/>';
  return `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${path}</svg>`;
}
function card(kind:UnitKind,index:number,name?:string,portrait=0,cycle=0){
  const d=UNITS[kind],key=`${kind}-${index}`;
  if(!d.hero)return `<button class="live-unit-card live-soldier-card" data-live-unit="${kind}" data-live-card="${key}" aria-label="${d.name} ${d.cost}골드 소환" aria-pressed="false"><span class="class-emblem" title="${d.name}">${emblem(kind)}</span><span class="soldier-card-body">${api.unitArt(kind)}</span><small class="soldier-cost">${d.cost}G</small></button>`;
  const x=[39,266,492,719][portrait%4],y=portrait<4?968:1223;
  return `<button class="live-unit-card live-hero-card" data-live-unit="${kind}" data-live-card="${key}" data-hero-index="${index}" data-hero-cycle="${cycle}" aria-label="${name} · ${d.name} 선택" aria-pressed="false"><svg class="live-card-portrait" viewBox="${x} ${y} 192 108" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><image href="${import.meta.env.BASE_URL}assets/lobby/hero-concept.png" width="948" height="1659"/></svg><span class="hero-nameplate">${name}</span></button>`;
}
function footprintArt(def:Parameters<typeof itemArt>[0],turns=0){
  if(hasItemArt(def))return itemArt(def,turns);
  const shape=rotated(def.cells,turns),w=Math.max(...shape.map(p=>p[0]))+1,h=Math.max(...shape.map(p=>p[1]))+1;
  return `<svg class="live-block-art" viewBox="0 0 ${w*24} ${h*24}" aria-hidden="true">${shape.map(([x,y])=>`<rect x="${x*24+1}" y="${y*24+1}" width="22" height="22" rx="2" fill="${def.color}" stroke="#edddb1" stroke-width="1"/>`).join('')}</svg>`;
}
function board(owner:number|null,cell:number,readOnly=false){
  const rows=owner===null?g.bagRows():GRID.rows,cols=owner===null?BAG_GRID.columns:GRID.columns;
  const items=g.gear.filter(item=>item.owner===owner),states=owner===null?null:g.gearStates(owner);
  const cells=Array.from({length:rows*cols},(_,i)=>{
    const x=i%cols,y=Math.floor(i/cols),item=items.find(item=>rotated(item.def.cells,item.turns).some(([dx,dy])=>item.x+dx===x&&item.y+dy===y));
    const tag=readOnly?'span':'button';
    const attributes=readOnly?'aria-hidden="true"':`data-owner="${owner??'bag'}" data-x="${x}" data-y="${y}" ${item?`data-live-gear="${item.id}"`:''} aria-label="${item?.def.name??'빈 칸'} ${y+1}행 ${x+1}열"`;
    return `<${tag} class="live-cell${!readOnly&&item?.id===gear?' picked':''}" ${attributes}></${tag}>`;
  }).join('');
  const art=items.map(item=>{
    const shape=rotated(item.def.cells,item.turns),w=Math.max(...shape.map(p=>p[0]))+1,h=Math.max(...shape.map(p=>p[1]))+1;
    const active=owner===null||states?.get(item.id)?.active;
    const description=`${item.def.name} · ${item.def.description} · ${active?'활성':`비활성 · ${states?.get(item.id)?.reason??'효과 없음'}`}`;
    return `<span class="live-gear-art${active?'':' inactive'}" ${readOnly?`data-preview-art-id="${item.id}" role="img" aria-label="${description}" title="${description}"`:`data-art-id="${item.id}"`} style="left:${item.x*(cell+2)}px;top:${item.y*(cell+2)}px;width:${w*(cell+2)-2}px;height:${h*(cell+2)-2}px">${footprintArt(item.def,item.turns)}</span>`;
  }).join('');
  return `<div class="live-grid${readOnly?' live-equipment-preview':''}" ${readOnly?`data-preview-owner="${owner}" role="group" aria-label="착용 장비 배치"`:`data-grid-owner="${owner??'bag'}"`} data-rows="${rows}" data-columns="${cols}" style="--cell:${cell}px;--columns:${cols};width:${cols*(cell+2)-2}px;height:${rows*(cell+2)-2}px">${cells}${art}</div>`;
}
function renderHeroPanel(){
  const preview=heroCards.find(([kind],index)=>`${kind}-${index}`===selectedCard);
  const selected=g.heroes().find(hero=>hero.id===api.hero),kind=preview?.[0]??selected?.kind??heroCards[0][0];
  const unit=g.heroes().find(hero=>hero.kind===kind),identity=preview??heroCards.find(([type])=>type===kind)!;
  const stats=g.stats(unit??{id:-1,kind,slot:0,level:1,spent:0,cooldown:0});
  const fields:[string,string,string][]=[
    ['hp','체력',stats.hp.toLocaleString()],['attack',stats.damageType==='physical'?'물리 공격':'마법 공격',stats.attack.toLocaleString()],
    ['rate','공격 속도',`${stats.rate.toFixed(2)}/초`],['physicalArmor','물리 방어',stats.physicalArmor.toLocaleString()],
    ['magicArmor','마법 방어',stats.magicArmor.toLocaleString()],['range','사거리',stats.range.toLocaleString()],
    ['critChance','치명타 확률',`${Math.round(stats.critChance*100)}%`],['critMultiplier','치명타 피해',`${Math.round(stats.critMultiplier*100)}%`],
    ['regen','체력 재생',`${stats.regen.toLocaleString()}/초`],['gold','골드 획득',`+${Math.round(stats.gold*100)}%`],
  ];
  const items=unit?g.gear.filter(item=>item.owner===unit.id):[];
  heroPanel.dataset.heroId=unit?String(unit.id):'';heroPanel.dataset.heroKind=kind;
  setHtml(heroPanel,`<header class="live-hero-heading"><span class="live-hero-avatar" aria-hidden="true">${api.unitArt(kind)}</span><div><h2>${identity[1]}</h2><small>Lv.${unit?.level??1} · ${unit?'배치 중':'배치 전'}</small></div></header>
    <section class="live-hero-stats" aria-label="능력치"><h3>능력치</h3><dl>${fields.map(([key,label,value])=>`<div><dt>${label}</dt><dd data-live-stat="${key}">${value}</dd></div>`).join('')}</dl></section>
    <section class="live-worn-equipment" aria-label="착용 장비"><h3>착용 장비 <span>${items.length}</span></h3><div class="live-worn-layout">${board(unit?.id??-1,26,true)}</div></section>`);
}
function render(){
  frame.dataset.menu=menu;tray.dataset.menu=menu;
  const heroEntries=visibleHeroCards(),atHeroLimit=heroLimitReached();
  if(menu==='hero'){
    tray.dataset.heroLoop=String(!atHeroLimit);
    if(renderedHeroLimit!==atHeroLimit){
      clearTimeout(heroWheelTimer);cancelDrag();heroScrollReady=false;renderedHeroLimit=atHeroLimit;
    }
    if(atHeroLimit&&selectedCard&&!heroEntries.some(entry=>`${entry.kind}-${entry.index}`===selectedCard)){
      const kind=heroCards.find(([kind],index)=>`${kind}-${index}`===selectedCard)?.[0],entry=heroEntries.find(entry=>entry.kind===kind);
      selectedCard=entry?`${entry.kind}-${entry.index}`:null;
    }
  }
  controls.hidden=api.scene!=='defense'&&api.scene!=='boss';
  bossAuto.hidden=api.scene!=='boss';
  heroPanel.hidden=menu!=='hero'||tray.hidden||!interactive();
  if(!heroPanel.hidden)renderHeroPanel();
  if(gear!==null&&!g.gear.some(item=>item.id===gear))gear=null;
  if(focusPick&&!pickedItem(g,focusPick))focusPick=null;
  // Do not replace a node held by a pointer, including the pre-drag press interval.
  if(!drag){
    setHtml(heroBags,g.heroes().map(hero=>`<section class="live-hero-bag${hero.id===api.hero?' selected':''}" data-bag-hero="${hero.id}"><header class="live-hero-bag-header"><button data-live-hero="${hero.id}" aria-label="${UNITS[hero.kind].name} 장비 선택" aria-pressed="${hero.id===api.hero}"></button></header>${board(hero.id,INVENTORY_CELL)}</section>`).join(''));
    setHtml(bagBoard,board(null,INVENTORY_CELL));
    if(menu==='soldier')setHtml(tray,(['guard','archer','mage'] as UnitKind[]).map((kind,i)=>card(kind,i)).join(''));
    if(menu==='hero'){
      const cycles=atHeroLimit?[0]:[0,1,2];
      setHtml(tray,cycles.map(cycle=>heroEntries.map(entry=>card(entry.kind,entry.index,entry.name,entry.portrait,cycle)).join('')).join(''));
      if(!tray.hidden&&!heroScrollReady){heroScrollReady=true;scrollHeroes(atHeroLimit?0:HERO_CYCLE);}
    }
    if(menu==='shop')setHtml(tray,g.shop.map((item,i)=>item?`<div class="live-offer-wrap" data-offer-card="offer-${i}"><button class="live-buy" data-live-buy="${i}" aria-label="${item.name} ${g.shopPrice(i)}골드 구매" hidden ${g.gold<g.shopPrice(i)?'disabled':''}>구매</button><button class="live-offer" data-live-offer="${i}" aria-label="${item.name} ${g.shopPrice(i)}골드 선택" aria-pressed="false"><span class="live-item-art">${footprintArt(item)}</span><small>${g.shopPrice(i)}G</small></button></div>`:'<button disabled aria-label="구매 완료">구매 완료</button>').join('')+'<button data-action="reroll">새로고침<br>20G</button>');
  }
  tray.querySelectorAll<HTMLButtonElement>('[data-live-card]').forEach(button=>{
    const selected=button.dataset.liveCard===selectedCard;
    button.classList.toggle('is-selected',selected);button.setAttribute('aria-pressed',String(selected));
    const kind=button.dataset.liveUnit as UnitKind,definition=UNITS[kind];
    const unavailable=g.gold<definition.cost||(definition.hero&&!g.heroes().some(hero=>hero.kind===kind)&&g.heroes().length>=RULES.heroLimit);
    button.classList.toggle('unavailable',unavailable);button.setAttribute('aria-disabled',String(unavailable&&!definition.hero));
  });
  tray.querySelectorAll<HTMLElement>('[data-offer-card]').forEach(card=>{
    const selected=card.dataset.offerCard===selectedCard;
    card.classList.toggle('is-selected',selected);
    card.querySelector('.live-offer')!.setAttribute('aria-pressed',String(selected));
    (card.querySelector('.live-buy') as HTMLButtonElement).hidden=!selected;
  });
  const plan=g.combinationPlan(api.hero);
  const combine=el('live-combine') as HTMLButtonElement;
  combine.disabled=!interactive()||plan.length===0||g.anvils<plan.length;
  combine.textContent=plan.length?`조합 ${plan.length}`:'조합';combine.title=`선택 영웅과 공용 가방 · 모루 ${plan.length}개 필요`;
  const startupNotice=g.message==='게임을 시작 상태로 초기화했습니다.';
  el('live-notice').hidden=menu==='hero'||startupNotice;
  el('live-notice').textContent=startupNotice?'':g.message;
  el('live-notice').title=startupNotice?'':g.message;
  if(pendingHeroFocus!==null&&!tray.hidden){
    const list=menu==='shop'?heroBags:tray;
    const target=menu==='shop'?heroBags.querySelector<HTMLElement>(`[data-bag-hero="${pendingHeroFocus}"]`):[...tray.querySelectorAll<HTMLElement>('[data-live-card]')].filter(card=>card.dataset.liveCard===selectedCard).sort((a,b)=>Math.abs(a.offsetLeft-tray.scrollLeft)-Math.abs(b.offsetLeft-tray.scrollLeft))[0];
    if(target){const r=target.getBoundingClientRect(),bounds=list.getBoundingClientRect();
      const left=list.scrollLeft+r.left-bounds.left-(list.clientWidth-target.offsetWidth)/2;
      if(menu==='hero')scrollHeroes(left);else list.scrollTo({left,behavior:'instant'});}
    pendingHeroFocus=null;
  }
  actions.querySelectorAll<HTMLButtonElement>('button').forEach(button=>button.disabled=!interactive());
  syncHeroCopies();
  drawConnections();
}

function dragPick(current=drag):InventoryPick|null {
  return current?.type==='offer'?{kind:'offer',index:Number(current.id)}:current?.type==='gear'?{kind:'gear',id:Number(current.id)}:null;
}
function visibleRect(node:HTMLElement){
  let r=node.getBoundingClientRect(),left=r.left,right=r.right,top=r.top,bottom=r.bottom;
  for(let parent=node.parentElement;parent;parent=parent.parentElement){
    const style=getComputedStyle(parent);
    if(parent===frame||/(auto|scroll|hidden|clip)/.test(style.overflowX+' '+style.overflowY)){
      r=parent.getBoundingClientRect();left=Math.max(left,r.left);right=Math.min(right,r.right);top=Math.max(top,r.top);bottom=Math.min(bottom,r.bottom);
    }
    if(parent===frame)break;
  }
  return right>left&&bottom>top?{left,right,top,bottom}:null;
}
function localPoint(x:number,y:number){const r=frame.getBoundingClientRect();return {x:(x-r.left)*800/r.width,y:(y-r.top)*360/r.height};}
function itemCenter(id:number){
  const node=inventory.querySelector<HTMLElement>(`[data-art-id="${id}"]`),r=node&&visibleRect(node);
  return r?localPoint((r.left+r.right)/2,(r.top+r.bottom)/2):null;
}
function drawConnections(){
  frame.querySelectorAll('.live-combo-partner').forEach(node=>node.classList.remove('live-combo-partner'));
  if(inventory.hidden||!interactive()){links.innerHTML='';return;}
  const paths:string[]=[];
  for(const pair of inventoryCombinationLinks(g)){
    const a=itemCenter(pair.a),b=itemCenter(pair.b);
    if(a&&b)paths.push(`<path class="${pair.ready?'combo-ready':'combo-deferred'}" data-pair="${pair.a},${pair.b}" d="M${a.x},${a.y} L${b.x},${b.y}"/>`);
  }
  const offer=selectedCard?.startsWith('offer-')?Number(selectedCard.slice(6)):null;
  const pick=drag?.moved?dragPick():focusPick??(gear!==null?{kind:'gear',id:gear} as InventoryPick:offer===null?null:{kind:'offer',index:offer} as InventoryPick);
  if(pick){
    let source=drag?.moved?localPoint(drag.x,drag.y):pick.kind==='gear'?itemCenter(pick.id):null;
    if(!source&&pick.kind==='offer'){
      const card=tray.querySelector<HTMLElement>(`[data-live-offer="${pick.index}"]`),r=card&&visibleRect(card);
      if(r)source=localPoint((r.left+r.right)/2,(r.top+r.bottom)/2);
    }
    if(source)for(const id of combinationPartners(g,pick)){
      const target=itemCenter(id);if(!target)continue;
      inventory.querySelectorAll(`[data-live-gear="${id}"]`).forEach(node=>node.classList.add('live-combo-partner'));
      paths.push(`<path class="combo-hint" data-partner="${id}" d="M${source.x},${source.y} Q${(source.x+target.x)/2},${(source.y+target.y)/2-10} ${target.x},${target.y}"/>`);
    }
  }
  links.innerHTML=paths.join('');
}

function heroAt(x:number,y:number){
  const p=localPoint(x,y);
  return g.heroes().find(hero=>Math.abs(SLOTS[hero.slot].x-p.x)<=29&&Math.abs(SLOTS[hero.slot].y-p.y)<=28);
}
function destination(current:Drag):Destination {
  const pick=dragPick(current);if(!pick)return {kind:'none'};
  const target=document.elementFromPoint(current.x,current.y) as HTMLElement|null;
  if(current.type==='gear'&&target?.closest('#live-sale-target'))return {kind:'sale'};
  const grid=target?.closest<HTMLElement>('.live-grid');
  if(grid){
    const owner=grid.dataset.gridOwner==='bag'?null:Number(grid.dataset.gridOwner),r=grid.getBoundingClientRect();
    const cell=parseFloat(grid.style.getPropertyValue('--cell')),step=cell+2;
    const x=Math.floor((current.x-r.left)*grid.offsetWidth/r.width/step)-current.grabX;
    const row=Math.floor((current.y-r.top)*grid.offsetHeight/r.height/step);
    const y=row-current.grabY;
    const plan=inventoryPlacement(g,pick,owner,x,y);
    if(plan)return {kind:'grid',grid,plan};
  }
  const header=target?.closest<HTMLElement>('[data-live-hero]');
  const hero=header?g.heroes().find(hero=>hero.id===Number(header.dataset.liveHero)):target?.closest('canvas')?heroAt(current.x,current.y):null;
  if(hero){const item=pickedItem(g,pick),free=item&&g.nearestFree(item,hero.id,0,0,item.turns);
    const plan=inventoryPlacement(g,pick,hero.id,free?.x??0,free?.y??0);if(plan)return {kind:'hero',hero:hero.id,plan};}
  return {kind:'none'};
}
function clearPreview(){
  frame.querySelectorAll('.live-drop-preview').forEach(node=>node.classList.remove('live-drop-preview','drop-warning','drop-invalid'));
  el('live-drop-target').hidden=true;el('live-sale-target').classList.remove('is-target');
}
function outline(rect:{left:number;right:number;top:number;bottom:number},valid:boolean){
  const a=localPoint(rect.left,rect.top),b=localPoint(rect.right,rect.bottom),node=el('live-drop-target');
  node.hidden=false;node.style.left=`${a.x}px`;node.style.top=`${a.y}px`;node.style.width=`${b.x-a.x}px`;node.style.height=`${b.y-a.y}px`;node.classList.toggle('invalid',!valid);
}
function unitSlot(current:Drag){
  const target=document.elementFromPoint(current.x,current.y);
  if(!target?.closest('canvas'))return -1;
  const p=localPoint(current.x,current.y);
  return SLOTS.findIndex(slot=>Math.abs(slot.x-p.x)<=29&&Math.abs(slot.y-p.y)<=21);
}
function updateDrag(){
  if(!drag?.moved||drag.scrolling)return;
  clearPreview();const current=drag;
  if(current.type==='unit'){
    if(current.ghost){current.ghost.style.left=`${current.x}px`;current.ghost.style.top=`${current.y}px`;}
    const slot=unitSlot(current),kind=current.id as UnitKind,def=UNITS[kind];
    const valid=slot>=0&&!g.units.some(unit=>unit.slot===slot)&&g.gold>=def.cost&&(!def.hero||g.heroes().length<RULES.heroLimit&&!g.heroes().some(hero=>hero.kind===kind));
    if(slot>=0){const r=frame.getBoundingClientRect(),p=SLOTS[slot];outline({left:r.left+(p.x-29)*r.width/800,right:r.left+(p.x+29)*r.width/800,top:r.top+(p.y-21)*r.height/360,bottom:r.top+(p.y+21)*r.height/360},valid);}
    current.ghost?.classList.toggle('invalid',!valid);return;
  }
  const pick=dragPick(current)!,item=pickedItem(g,pick);if(!item)return;
  const dest=destination(current),size=dest.kind==='grid'?parseFloat(dest.grid.style.getPropertyValue('--cell')):INVENTORY_CELL,step=size+2;
  const cells=rotated(item.def.cells,item.turns),w=(Math.max(...cells.map(p=>p[0]))+1)*step-2,h=(Math.max(...cells.map(p=>p[1]))+1)*step-2;
  if(current.ghost){
    current.ghost.innerHTML=footprintArt(item.def,item.turns);current.ghost.style.width=`${w}px`;current.ghost.style.height=`${h}px`;
    current.ghost.style.left=`${current.x-current.grabX*step-size/2}px`;current.ghost.style.top=`${current.y-current.grabY*step-size/2}px`;
    current.ghost.classList.toggle('invalid',dest.kind==='none'||((dest.kind==='grid'||dest.kind==='hero')&&!dest.plan.allowed));
  }
  if(dest.kind==='grid'){
    for(const [dx,dy] of dest.plan.cells){
      const cell=dest.grid.querySelector<HTMLElement>(`[data-x="${dest.plan.x+dx}"][data-y="${dest.plan.y+dy}"]`);
      cell?.classList.add('live-drop-preview');cell?.classList.toggle('drop-invalid',!dest.plan.allowed);cell?.classList.toggle('drop-warning',dest.plan.allowed&&dest.plan.warning);
    }
  }else{
    if(dest.kind==='hero'){const p=SLOTS[g.heroes().find(hero=>hero.id===dest.hero)!.slot],r=frame.getBoundingClientRect();
      const bag=heroBags.querySelector<HTMLElement>(`[data-bag-hero="${dest.hero}"]`),target=document.elementFromPoint(current.x,current.y);
      const rect=target?.closest('[data-live-hero]')&&bag?visibleRect(bag):null;
      outline(rect??{left:r.left+(p.x-29)*r.width/800,right:r.left+(p.x+29)*r.width/800,top:r.top+(p.y-28)*r.height/360,bottom:r.top+(p.y+28)*r.height/360},dest.plan.allowed);
    }
    if(dest.kind==='sale')el('live-sale-target').classList.add('is-target');
  }
  drawConnections();
}

function commitDrop(current:Drag){
  if(!interactive())return;
  if(current.type==='unit'){const slot=unitSlot(current);if(slot>=0&&api.deploy(current.id as UnitKind,slot))selectedCard=current.node.dataset.liveCard??null;return;}
  const pick=dragPick(current)!,dest=destination(current);
  if(dest.kind==='sale'&&pick.kind==='gear'){if(g.sellGear(pick.id))gear=null;}
  else if(dest.kind==='grid'||dest.kind==='hero'){
    if(commitInventoryPlacement(g,pick,dest.plan)){gear=null;selectedCard=null;if(dest.plan.owner!==null)api.selectHero(dest.plan.owner);}
  }
  // An invalid/outside drop is a cancellation, never an implicit purchase.
}
function cancelDrag(){
  cancelAnimationFrame(dragFrame);dragFrame=0;
  const current=drag;drag=null;current?.node.classList.remove('dragging');current?.ghost?.remove();
  rotationAnimation?.cancel();rotationAnimation=null;
  tray.classList.remove('scrolling');el('live-sale-target').hidden=true;clearPreview();
  if(current&&frame.hasPointerCapture(current.pointer))frame.releasePointerCapture(current.pointer);
}
function rotateSelected(){
  const id=drag?.type==='gear'?Number(drag.id):gear;if(id===null)return;
  rotationAnimation?.cancel();
  const before=(drag?.ghost??inventory.querySelector<HTMLElement>(`[data-art-id="${id}"]`))?.getBoundingClientRect();
  const didRotate=g.rotateGear(id);gear=id;lastTap=null;
  if(drag?.type==='gear'){
    const item=g.gear.find(item=>item.id===id);if(item){const cells=rotated(item.def.cells,item.turns);const nearest=cells.reduce((best,p)=>Math.hypot(p[0]-drag!.grabX,p[1]-drag!.grabY)<Math.hypot(best[0]-drag!.grabX,best[1]-drag!.grabY)?p:best);[drag.grabX,drag.grabY]=nearest;}
    updateDrag();
  }
  finishMutation();
  const node=drag?.ghost??inventory.querySelector<HTMLElement>(`[data-art-id="${id}"]`);
  if(didRotate&&before&&node&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
    const after=node.getBoundingClientRect(),dx=(before.left+before.right-after.left-after.right)/2,dy=(before.top+before.bottom-after.top-after.bottom)/2;
    rotationAnimation=node.animate([{transform:`translate(${dx}px,${dy}px) rotate(-90deg)`},{transform:'translate(0px,0px) rotate(0deg)'}],{duration:180,easing:'ease-out'});
  }
}
function scrollDrag(){
  if(!drag?.moved||drag.scrolling||!interactive()){if(drag&&!interactive())cancelDrag();return;}
  const hit=document.elementFromPoint(drag.x,drag.y),scroll=hit?.closest<HTMLElement>('#live-hero-bags');
  if(scroll){const r=scroll.getBoundingClientRect(),edge=18;
    if(drag.x<r.left+edge)scroll.scrollLeft-=3;else if(drag.x>r.right-edge)scroll.scrollLeft+=3;
  }
  updateDrag();dragFrame=requestAnimationFrame(scrollDrag);
}
function beginVisualDrag(){
  if(!drag||drag.ghost)return;
  drag.node.classList.add('dragging');drag.ghost=document.createElement('div');
  drag.ghost.className=`live-drag-ghost ${drag.type==='unit'?'unit-ghost':'item-ghost'}`;
  if(drag.type==='unit')drag.ghost.innerHTML=api.unitArt(drag.id as UnitKind);
  document.body.append(drag.ghost);
  if(drag.type==='gear'){const item=g.gear.find(item=>item.id===Number(drag!.id));el('live-sale-target').hidden=false;el('live-sale-target').querySelector('b')!.textContent=`+${Math.floor((item?.costBasis??0)/2)}G`;}
  dragFrame=requestAnimationFrame(scrollDrag);
}

controls.addEventListener('click',event=>{
  const button=(event.target as HTMLElement).closest<HTMLButtonElement>('[data-control]');
  if(button&&!button.disabled)api[button.dataset.control as 'pause'|'speed'|'home']();
},{signal});
el('app').addEventListener('landscape-hero-selected',event=>{
  const id=(event as CustomEvent<{id:number}>).detail.id;
  if(!interactive()||!g.heroes().some(hero=>hero.id===id))return;
  heroClickUntil=performance.now()+300;showMenu(menu==='shop'?'shop':'hero',id);
},{signal});
frame.addEventListener('click',event=>{
  if(performance.now()<suppressUntil){event.preventDefault();return;}
  const target=event.target as HTMLElement,b=target.closest<HTMLElement>('button,a');
  if(!b){if(target.closest('canvas')&&performance.now()<heroClickUntil&&heroAt(event.clientX,event.clientY)?.id===api.hero)return;if(!target.closest('#live-inventory,#live-tray,#live-hero-panel'))closeMenu();return;}
  if(!interactive())return;
  if(b.dataset.menu){showMenu(b.dataset.menu as Menu);return;}
  if(b.dataset.liveUnit){
    const kind=b.dataset.liveUnit as UnitKind,existing=UNITS[kind].hero&&g.heroes().find(hero=>hero.kind===kind);
    if(existing){api.selectHero(existing.id);selectedCard=b.dataset.liveCard!;}
    else if(UNITS[kind].hero){if(!api.select(kind))api.clearSelection();selectedCard=b.dataset.liveCard!;}
    else if(api.select(kind))selectedCard=b.dataset.liveCard!;
    gear=null;focusPick=null;render();return;
  }
  if(b.dataset.liveHero){
    const owner=Number(b.dataset.liveHero);
    if(gear!==null){
      const item=g.gear.find(item=>item.id===gear),position=item&&g.nearestFree(item,owner,0,0,item.turns);
      if(item&&position){const pick:InventoryPick={kind:'gear',id:item.id},plan=inventoryPlacement(g,pick,owner,position.x,position.y);if(plan&&commitInventoryPlacement(g,pick,plan))gear=null;}
      else g.note('영웅 장비칸에 빈 공간이 없습니다.');
      focusPick=null;
    }
    api.selectHero(owner);render();return;
  }
  if(b.dataset.liveOffer){
    const key=`offer-${b.dataset.liveOffer}`;
    selectedCard=selectedCard===key?null:key;gear=null;
    focusPick=selectedCard?{kind:'offer',index:Number(b.dataset.liveOffer)}:null;
    render();return;
  }
  if(b.dataset.liveBuy){if(g.buy(Number(b.dataset.liveBuy))){selectedCard=null;focusPick=null;}finishMutation();return;}
  if(b.dataset.owner){
    selectedCard=null;
    const id=b.dataset.liveGear===undefined?null:Number(b.dataset.liveGear);
    if(gear!==null&&id!==gear){
      const pick:InventoryPick={kind:'gear',id:gear},owner=b.dataset.owner==='bag'?null:Number(b.dataset.owner);
      const plan=inventoryPlacement(g,pick,owner,Number(b.dataset.x),Number(b.dataset.y));
      if(plan&&commitInventoryPlacement(g,pick,plan))gear=null;
      lastTap=null;focusPick=null;finishMutation();return;
    }
    if(id!==null){
      if(lastTap?.id===id&&performance.now()-lastTap.time<320){gear=id;rotateSelected();}
      else{
        gear=id;lastTap={id,time:performance.now()};focusPick={kind:'gear',id};
        const item=g.gear.find(item=>item.id===id);if(item?.owner!==null&&item?.owner!==undefined)api.selectHero(item.owner);
        render();
      }
    }
    return;
  }
  if(b.dataset.action){
    const action=b.dataset.action;
    if(action==='reroll'){g.reroll();selectedCard=null;}
    else if(action==='combine'){g.combineMany(g.combinationPlan(api.hero));gear=null;}
    focusPick=null;lastTap=null;finishMutation();
  }
},{signal});

frame.addEventListener('pointerdown',event=>{
  if(event.button!==0||!interactive()||drag)return;
  const node=(event.target as HTMLElement).closest<HTMLElement>('[data-live-unit],[data-live-offer],[data-live-gear]');
  if(!node||(node as HTMLButtonElement).disabled)return;
  clearTimeout(heroWheelTimer);tray.classList.remove('scrolling');
  const type=node.dataset.liveUnit?'unit':node.dataset.liveOffer?'offer':'gear';
  const item=type==='gear'?g.gear.find(item=>item.id===Number(node.dataset.liveGear)):null;
  drag={pointer:event.pointerId,type,id:node.dataset.liveUnit??node.dataset.liveOffer??node.dataset.liveGear!,node,
    x:event.clientX,y:event.clientY,startX:event.clientX,startY:event.clientY,scroll:tray.scrollLeft,moved:false,scrolling:false,ghost:null,
    grabX:item?Number(node.dataset.x)-item.x:0,grabY:item?Number(node.dataset.y)-item.y:0};
  focusPick=dragPick();drawConnections();
},{signal});
document.addEventListener('pointermove',event=>{
  if(!drag||drag.pointer!==event.pointerId)return;
  if(!interactive()){cancelDrag();return;}
  const dx=event.clientX-drag.startX,dy=event.clientY-drag.startY;
  if(!drag.moved&&Math.hypot(dx,dy)>8){
    drag.moved=true;drag.scrolling=drag.type==='unit'&&UNITS[drag.id as UnitKind].hero&&Math.abs(dx)>Math.abs(dy)&&event.clientY>=tray.getBoundingClientRect().top-12;
    frame.setPointerCapture(event.pointerId);
    if(drag.scrolling)tray.classList.add('scrolling');
    else beginVisualDrag();
  }
  // A horizontal browse gesture may continue upward into a field deployment.
  if(drag.scrolling&&dy< -24&&event.clientY<tray.getBoundingClientRect().top-12){
    drag.scrolling=false;tray.classList.remove('scrolling');scrollHeroes(drag.scroll);beginVisualDrag();
  }
  if(drag.moved){event.preventDefault();drag.x=event.clientX;drag.y=event.clientY;
    if(drag.scrolling)scrollHeroes(drag.scroll-dx);else updateDrag();}
},{passive:false,signal});
document.addEventListener('pointerup',event=>{
  if(!drag||drag.pointer!==event.pointerId)return;
  const current=drag;current.x=event.clientX;current.y=event.clientY;
  if(current.moved){suppressUntil=performance.now()+180;if(!current.scrolling)commitDrop(current);}
  const heroLeft=heroBags.scrollLeft;
  cancelDrag();focusPick=gear===null?null:{kind:'gear',id:gear};
  if(current.scrolling)snapHeroes();
  if(current.moved){finishMutation();heroBags.scrollLeft=heroLeft;drawConnections();}
  else drawConnections();
},{signal});
document.addEventListener('pointercancel',event=>{if(drag&&event.pointerId!==drag.pointer)return;cancelDrag();focusPick=null;render();},{signal});
frame.addEventListener('lostpointercapture',event=>{if(drag&&event.pointerId===drag.pointer){cancelDrag();focusPick=null;render();}},{signal});
window.addEventListener('blur',()=>{cancelDrag();focusPick=null;render();},{signal});
frame.addEventListener('dragstart',event=>{if((event.target as HTMLElement).closest('#live-tray,#live-inventory'))event.preventDefault();},{signal});
frame.addEventListener('dblclick',event=>{if((event.target as HTMLElement).closest('#live-inventory'))event.preventDefault();},{signal});
tray.addEventListener('pointerover',event=>{
  if(drag)return;const node=(event.target as HTMLElement).closest<HTMLElement>('[data-live-offer]');
  if(node){focusPick={kind:'offer',index:Number(node.dataset.liveOffer)};drawConnections();}
},{signal});
tray.addEventListener('pointerleave',()=>{if(!drag){focusPick=null;drawConnections();}},{signal});
frame.addEventListener('focusin',event=>{
  if(drag)return;const node=event.target as HTMLElement;
  if(node.dataset.liveOffer){focusPick={kind:'offer',index:Number(node.dataset.liveOffer)};drawConnections();}
},{signal});
frame.addEventListener('focusout',()=>{if(!drag){focusPick=null;drawConnections();}},{signal});
tray.addEventListener('scroll',()=>{
  if(menu!=='hero'||tray.hidden||!heroScrollReady)return;
  if(heroLimitReached()){if(tray.scrollLeft)scrollHeroes(0);return;}
  // Fractional display scales can round a snapped card across the exact cycle boundary.
  if(tray.scrollLeft<HERO_CYCLE-HERO_CARD_STEP/2||tray.scrollLeft>=HERO_CYCLE*2+HERO_CARD_STEP/2)scrollHeroes(tray.scrollLeft);
  syncHeroCopies();
},{signal});
tray.addEventListener('wheel',event=>{
  if(menu!=='hero'||tray.hidden||drag||!interactive()||heroLimitReached())return;
  const delta=Math.abs(event.deltaX)>Math.abs(event.deltaY)?event.deltaX:event.deltaY;
  if(!delta)return;event.preventDefault();clearTimeout(heroWheelTimer);tray.classList.add('scrolling');
  scrollHeroes(tray.scrollLeft+delta*(event.deltaMode===1?16:event.deltaMode===2?tray.clientWidth:1));
  heroWheelTimer=window.setTimeout(snapHeroes,120);
},{passive:false,signal});
frame.addEventListener('scroll',()=>{if(drag?.moved)updateDrag();else drawConnections();},{capture:true,signal});
window.addEventListener('resize',()=>{if(drag?.moved)updateDrag();else drawConnections();},{signal});
document.addEventListener('keydown',event=>{
  if(event.key==='Escape'){closeMenu();return;}
  if(event.key.toLowerCase()==='r'&&interactive()&&!(event.target as HTMLElement).closest('input,textarea,select')){event.preventDefault();rotateSelected();}
},{signal});

const clock=window.setInterval(()=>{
  if(observedRun!==api.runId||observedScene!==api.scene){observedRun=api.runId;observedScene=api.scene;closeMenu();}
  const wave=el('live-wave'),progress=el('wave-progress') as HTMLProgressElement;
  wave.querySelector('strong')!.textContent=String(g.wave).padStart(2,'0');wave.setAttribute('aria-label',`웨이브 ${g.wave}`);
  wave.querySelector('b')!.textContent=el('wave-timer').textContent;
  wave.style.setProperty('--wave-fill',String(Math.max(0,Math.min(1,progress.max?progress.value/progress.max:0))));
  wave.classList.toggle('is-urgent',progress.value>0&&progress.value<=5);
  const enemies=Number(el('enemies').textContent)||0,limit=Number(el('enemy-limit').textContent)||RULES.maxEnemies;
  wave.querySelector('[data-live-enemy-count]')!.textContent=String(enemies);wave.querySelector('[data-live-enemy-limit]')!.textContent=`/ ${limit}`;
  const gauge=wave.querySelector<HTMLElement>('.live-enemy-gauge')!;
  gauge.setAttribute('aria-valuenow',String(Math.max(0,Math.min(limit,enemies))));gauge.setAttribute('aria-valuemax',String(limit));
  gauge.setAttribute('aria-valuetext',`${enemies}마리 / 기준 ${limit}마리`);
  gauge.querySelector<HTMLElement>('i')!.style.transform=`scaleX(${Math.max(0,Math.min(1,enemies/limit))})`;
  wave.classList.toggle('is-crowded',enemies>=limit*.75);
  wallet.querySelectorAll<HTMLElement>('[data-resource-value]').forEach(value=>{value.classList.toggle('has-long-value',value.textContent!.length>7);value.title=value.textContent!;});
  controls.querySelector('[data-control=speed]')!.textContent=el('speed').textContent;
  const pause=controls.querySelector('[data-control=pause]')!,paused=el('pause').getAttribute('aria-pressed')==='true';
  pause.textContent=paused?'▶':'Ⅱ';pause.setAttribute('aria-label',paused?'전투 재개':'일시정지');pause.setAttribute('aria-pressed',String(paused));
  el('live-status').classList.toggle('is-paused',paused);wave.querySelector('[data-live-clock-label]')!.textContent=paused?'일시정지':'남은 시간';
  if(!api.active||api.scene!=='defense'){cancelDrag();tray.hidden=true;inventory.hidden=true;heroPanel.hidden=true;}
  render();
},150);
if(import.meta.hot)import.meta.hot.dispose(()=>{cancelDrag();clearTimeout(timer);clearTimeout(heroWheelTimer);clearInterval(clock);lifetime.abort();});

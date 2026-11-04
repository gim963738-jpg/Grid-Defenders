import {calibrateBossTest,type BossTestProfile} from './bossTestBalance';
import {nextCombatSpeed,stepCombat} from './combatPlayback';
import {BLADE_SHEET_URL} from './bladeSkill';
import {SWORD_SHEET_URL} from './swordAttack';
import {FIRE_SHEET_URL} from './fireSkill';
import { Application, Assets, Texture } from 'pixi.js';
import { Defense, recipeForTypes, type LogCategory } from './defense';
import { BAG_GRID, GRID, ITEMS, MONSTERS, DAMAGE_LABEL, DEFENSE_LABEL, RECIPES, RULES, SLOTS, UNITS, rotated, type UnitKind, type ItemDef } from './defenseConfig';
import { createDefenseView } from './defenseView';
import { createSceneTransition, type BattleScene } from './sceneTransition';
import { BossBattle, waveBossRoster } from './bossBattle';
import { createBossBattleView } from './bossBattleView';
import { BossDamageHistory } from './bossDamageHistory';
import './style.css';

const el=<T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as T;
const game=new Defense();
let showDamageNumbers=true,combatPaused=false;
const bossBattle=new BossBattle(waveBossRoster(game),Math.random,game.damageMeter.peaks);
let bossRosterSignature='';
let bossTestMode=false,bossTestProfile:BossTestProfile|null=null;
const bossDamageHistory=new BossDamageHistory();
let bossEncounterWave=game.wave;
let damageMeterMode:'defense'|'boss'='defense',showLastBoss=false;
function syncBossRoster(force=false,discardPrevious=false):void {
  const roster=waveBossRoster(game),signature=JSON.stringify({roster,testMode:bossTestMode});
  if(force||signature!==bossRosterSignature){if(!discardPrevious)bossDamageHistory.capture(bossBattle,bossEncounterWave,true);bossTestProfile=bossTestMode?calibrateBossTest(roster):null;bossBattle.reset(roster,bossTestProfile??undefined);bossEncounterWave=game.wave;bossRosterSignature=signature;showLastBoss=false;}
  const summary=el('boss-test-profile');summary.hidden=!bossTestProfile;
  if(bossTestProfile){
    const boss=bossBattle.actors.find(a=>a.kind==='boss')!;
    summary.textContent=`편성 맞춤 50초+ 시험 · 자동 스킬 기준 약 ${bossTestProfile.expectedSeconds.toFixed(1)}초(게임 시간) · 보스 체력 ${boss.maxHp.toLocaleString()} / 공격력 ${boss.attack}`;
    summary.title=bossBattle.actors.filter(a=>a.side==='enemy').map(a=>`${a.name}: 체력 ${a.maxHp.toLocaleString()}, 공격력 ${a.attack}`).join(' / ');
  }
}
const bossBattleView=createBossBattleView(document.getElementById('boss-combat')!,document.getElementById('boss-combat-status')!,bossBattle,()=>showDamageNumbers,()=>combatPaused);
let currentScene:BattleScene='defense',sceneTransitioning=false;
let activeBossWave:number|null=null,bossReturnDelay=0;
let pending:UnitKind|null=null, selectedUnit:number|null=null, selectedHero:number|null=null;
let selectedGear:number|null=null,turns=0,tab='summon';
let shopFocus:number|null=null;
let pressedGear:number|null=null;
const events=new AbortController();
let heroInfo:{kind:UnitKind;unitId:number|null}|null=null;
let noticeTimer:ReturnType<typeof setTimeout>|undefined;
let heroInfoMarkup='';
let centeredHeroKind:UnitKind='tank',heroCardsMarkup='',heroScrollFrame=0,heroAnimationFrame=0,heroSuppressClickUntil=0;
let heroGesture:{pointer:number;x:number;y:number;lastX:number;startScroll:number;index:number;dragged:boolean}|null=null;
const heroKinds=Object.entries(UNITS).filter(([,d])=>d.hero).map(([kind])=>kind as UnitKind);
let heroPhysicalIndex=heroKinds.length,heroRebasing=false;
const heroNavigationQueue:number[]=[];
function markCenteredHero(kind:UnitKind,physicalIndex=heroPhysicalIndex):void {
  centeredHeroKind=kind;heroPhysicalIndex=physicalIndex;
  const cards=Array.from(el('heroes').querySelectorAll<HTMLElement>('[data-summon]'));
  cards.forEach((card,i)=>{const active=i===physicalIndex;card.classList.toggle('carousel-centered',active);card.tabIndex=active?0:-1;if(active)card.setAttribute('aria-current','true');else card.removeAttribute('aria-current');});
  el('hero-carousel-position').textContent=`${heroKinds.indexOf(kind)+1} / ${heroKinds.length}`;
  el<HTMLButtonElement>('hero-prev').disabled=heroKinds.length<2;
  el<HTMLButtonElement>('hero-next').disabled=heroKinds.length<2;
  el('command-area').dataset.heroBackdrop=kind;
  el('command-area').style.setProperty('--hero-symbol',`"${UNITS[kind].icon}"`);
}
function heroOffset(index:number):number {
  const track=el('heroes'),card=track.querySelectorAll<HTMLElement>('[data-summon]')[index];
  return card?Math.max(0,card.offsetLeft-(track.clientWidth-card.offsetWidth)/2):0;
}
function rebaseHero(kind:UnitKind):void {
  const track=el('heroes'),middle=heroKinds.length+heroKinds.indexOf(kind);
  if(heroPhysicalIndex===middle)return;
  heroRebasing=true;track.classList.add('hero-rebasing');track.style.scrollSnapType='none';
  markCenteredHero(kind,middle);track.scrollLeft=heroOffset(middle);
  void track.offsetWidth;
  track.classList.remove('hero-rebasing');track.style.scrollSnapType='';heroRebasing=false;
}
function centerHero(kind:UnitKind,behavior:ScrollBehavior='smooth',requestedIndex?:number):void {
  const track=el('heroes'),cards=Array.from(track.querySelectorAll<HTMLElement>('[data-summon]'));if(!cards.length)return;
  const candidates=cards.map((card,index)=>({card,index})).filter(v=>v.card.dataset.summon===kind);
  const physical=requestedIndex??candidates.sort((a,b)=>Math.abs(a.index-heroPhysicalIndex)-Math.abs(b.index-heroPhysicalIndex))[0].index;
  cancelAnimationFrame(heroAnimationFrame);heroAnimationFrame=0;track.setAttribute('aria-busy','false');
  markCenteredHero(kind,physical);if(!track.clientWidth)return;
  const target=heroOffset(physical),start=track.scrollLeft;
  track.style.scrollSnapType='none';
  if(behavior!=='smooth'||matchMedia('(prefers-reduced-motion: reduce)').matches||Math.abs(target-start)<1){track.scrollLeft=target;track.style.scrollSnapType='';rebaseHero(kind);return;}
  track.setAttribute('aria-busy','true');
  const started=performance.now();
  const animate=(now:number)=>{
    const t=Math.min(1,(now-started)/520),ease=t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
    track.scrollLeft=start+(target-start)*ease;
    if(t<1)heroAnimationFrame=requestAnimationFrame(animate);
    else {heroAnimationFrame=0;track.setAttribute('aria-busy','false');track.style.scrollSnapType='';markCenteredHero(kind,physical);rebaseHero(kind);const next=heroNavigationQueue.shift();if(next!==undefined)moveHeroCarousel(next);}
  };
  heroAnimationFrame=requestAnimationFrame(animate);
}
function moveHeroCarousel(direction:number):void {
  closeHeroInfo();if(heroAnimationFrame||heroRebasing){heroNavigationQueue.push(direction);return;}
  rebaseHero(centeredHeroKind);const target=heroPhysicalIndex+direction;
  centerHero(heroKinds[(target+heroKinds.length)%heroKinds.length],'smooth',target);
}

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
    const card=document.querySelector<HTMLElement>(`#heroes .carousel-centered[data-summon="${heroInfo.kind}"]`)??document.querySelector<HTMLElement>(`[data-summon="${heroInfo.kind}"]`);
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
  const stats=unit?game.stats(unit):{hp:def.hp,attack:def.attack,armor:def.armor,rate:def.rate,regen:0,gold:0,critChance:def.hero?0:RULES.soldierCritChance,critMultiplier:RULES.critMultiplier,physicalAttack:def.damageType==='physical'?def.attack:0,magicAttack:def.damageType==='magic'?def.attack:0,physicalArmor:def.armor,magicArmor:def.magicArmor};
  const fields=[['hp','♥','최대 체력',stats.hp.toLocaleString()],['rate','↗','공격속도',`${stats.rate.toFixed(2)}/초`],['attack','⚔','물리 공격',String(stats.physicalAttack)],['attack','✦','마법 공격',String(stats.magicAttack)],['armor','⬡','물리 방어',String(stats.physicalArmor)],['armor','◇','마법 방어',String(stats.magicArmor)],['regen','✚','체력 재생',`${stats.regen}/초`],['gold','◇','골드 획득',`+${Math.round(stats.gold*100)}%`]];
  if(!def.hero)fields.push(['attack','✦','치명타 확률',`${Math.round(stats.critChance*100)}%`],['attack','✦','치명타 배율',`${stats.critMultiplier}배`]);
  const markup=`<header><span class="hero-info-icon" style="color:#${def.color.toString(16)}">${heroInfo.kind==='ranged'||heroInfo.kind==='melee'?`<span class="${heroInfo.kind}-portrait"></span>`:def.icon}</span><div><small>${unit?(def.hero?'장비 적용 능력치':`강화 적용 능력치 · Lv.${unit.level}`):'기본 능력치 · 배치 전'}</small><h2>${def.name}${unit?` #${unit.id}`:''}</h2></div><button id="close-hero-info" aria-label="유닛 능력치 닫기">×</button></header><dl>${fields.map(([key,icon,label,value])=>`<div class="hero-stat"><dt><span class="stat-symbol ${key}">${icon}</span>${label}</dt><dd data-stat="${key}">${value}</dd></div>`).join('')}</dl>`;
  if(markup!==heroInfoMarkup){el('hero-info').innerHTML=markup;heroInfoMarkup=markup;}
  positionHeroInfo();
}
const logHeads:Record<LogCategory,number>={damage:0,reward:0,economy:0};
let damageMeterMarkup='';
function refreshDamageMeter():void {
  const boss=damageMeterMode==='boss',saved=bossDamageHistory.last;
  const useSaved=boss&&!!saved&&(showLastBoss||currentScene!=='boss'||bossBattle.result!=='fighting');
  const waveRecord=game.bossPending?game.lastWaveDamage:null;
  const empty={elapsed:0,total:0,dps:0,peakDps:game.damageMeter.peaks.overall,rows:[]};
  const stats=boss?(useSaved?saved!.stats:currentScene==='boss'?bossBattle.damageMeter.snapshot(bossBattle.elapsed):empty):(waveRecord?.stats??game.damageMeter.snapshot(game.waveTime));
  const label=boss?(useSaved?`최근 보스 · WAVE ${saved!.wave} · ${saved!.outcome}`:currentScene==='boss'?`보스 · WAVE ${bossEncounterWave} · 진행 중`:'보스전 기록 없음'):`웨이브 ${waveRecord?.wave??game.wave}${currentScene==='boss'?' · 일시정지':''}`;
  for(const mode of ['defense','boss'])el(`dps-tab-${mode}`).setAttribute('aria-pressed',String(damageMeterMode===mode));
  const historyButton=el<HTMLButtonElement>('dps-last-boss');historyButton.hidden=!boss||!saved||currentScene!=='boss'||bossBattle.result!=='fighting';
  historyButton.textContent=showLastBoss?'실시간 보기':'최근 결과';historyButton.setAttribute('aria-pressed',String(showLastBoss));
  el('dps-total').textContent=`${stats.dps.toFixed(1)} DPS`;
  el('dps-summary').textContent=`${label} · ${stats.elapsed.toFixed(1)}초 · 총 피해 ${Math.round(stats.total).toLocaleString()} · 평균 DPS · ${useSaved||waveRecord?'당시':'게임'} 최고(1초) ${stats.peakDps.toFixed(1)} DPS`;
  const markup=stats.rows.length?stats.rows.map((row,i)=>`<li class="dps-row"><div class="dps-bar" style="width:${(row.share*100).toFixed(2)}%;background:${row.color}"></div><div class="dps-row-top"><b>${i+1}. ${row.name}</b><strong>${row.dps.toFixed(1)} DPS</strong></div><div class="dps-row-bottom"><span>누적 ${Math.round(row.damage).toLocaleString()}</span><span class="dps-peak" title="이번 게임에서 최근 1초간 실제 피해의 최고값">최고 ${row.peakDps.toFixed(1)} DPS</span><span>${(row.share*100).toFixed(1)}%</span></div></li>`).join(''):'<li class="log-empty">실제 피해가 발생하면 표시됩니다.</li>';
  if(markup!==damageMeterMarkup){const list=el('dps-meter'),top=list.scrollTop;list.innerHTML=markup;list.scrollTop=top;damageMeterMarkup=markup;}
}
function refreshLogs():void {
  refreshDamageMeter();
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

function shape(item:ItemDef,rotation=0,cellSize=9):string {
  const cells=rotated(item.cells,rotation),width=Math.max(...cells.map(c=>c[0]))+1,height=Math.max(...cells.map(c=>c[1]))+1;
  return `<span class="mini-shape" style="--shape-columns:${width};--shape-rows:${height};grid-template-columns:repeat(${width},${cellSize}px)">${cells.map(([x,y])=>`<i style="grid-column:${x+1};grid-row:${y+1};width:${cellSize}px;height:${cellSize}px;background:${item.color}"></i>`).join('')}</span>`;
}
function openTab(name:string):void {
  tab=name;
  el('command-area').classList.toggle('summon-background',tab==='summon');
  if(tab!=='summon'){cancelAnimationFrame(heroAnimationFrame);heroAnimationFrame=0;heroNavigationQueue.length=0;heroGesture=null;el('heroes').setAttribute('aria-busy','false');}
  const inventory=tab==='gear'||tab==='shop';
  document.querySelectorAll<HTMLElement>('.panel').forEach(p=>p.hidden=inventory?!['gear','shop'].includes(p.id):p.id!==tab);
  document.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach(b=>{const active=b.dataset.tab===tab||(inventory&&b.dataset.tab==='gear');b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
  if(tab==='summon')centerHero(centeredHeroKind,'auto');
}
function inventoryGrid(owner:number|null):string {
  const occupied=new Map<string,typeof game.gear>();
  const states=owner===null?null:game.gearStates(owner);
  for(const g of game.gear.filter(g=>g.owner===owner).sort((a,b)=>a.order-b.order))for(const [dx,dy]of rotated(g.def.cells,g.turns)){
    const key=`${g.x+dx},${g.y+dy}`;occupied.set(key,[...(occupied.get(key)??[]),g]);
  }
  const rows=owner===null?game.bagRows():GRID.rows,columns=owner===null?BAG_GRID.columns:GRID.columns;
  return Array.from({length:columns*rows},(_,i)=>{
    const x=i%columns,y=Math.floor(i/columns),stack=occupied.get(`${x},${y}`)??[];
    const g=stack.find(g=>g.id===selectedGear)??stack.at(-1),inactive=g&&states&&!states.get(g.id)?.active;
    const address=owner===null?`data-bag-cell="${x},${y}"`:`data-cell="${x},${y}"`;
    return `<button class="gear-cell ${(x+y)%2?'board-light':'board-dark'} ${g?.id===selectedGear?'picked':''} ${inactive?'gear-inactive':''} " ${address} ${g?`data-gear-id="${g.id}" ${inactive?'data-inactive="true"':''} style="background-color:${g.def.color}" title="${stack.map(v=>`${v.def.name} #${v.id}`).join(' / ')} · 더블클릭 회전"`:''} aria-label="${owner===null?'공용 가방':'영웅 장비'} ${x+1}열 ${y+1}행${g?' '+g.def.name:''}${inactive?' 비활성':''}">${g?g.def.short:''}${stack.length>1?`<sup>${stack.length}</sup>`:''}</button>`;
  }).join('');
}
function refresh():void {

  const chosenSoldier=game.units.find(u=>u.id===selectedUnit&&!UNITS[u.kind].hero);
  const unitCards=(hero:boolean)=>Object.entries(UNITS).filter(([,d])=>d.hero===hero).map(([kind,d])=>{
    const deployed=hero&&game.heroes().some(u=>u.kind===kind);
    const blocked=hero&&(game.heroes().length>=RULES.heroLimit||deployed);
    if(hero)return `<button class="unit-card hero-card ${kind==='ranged'||kind==='melee'?`${kind}-summon-card`:''} ${pending===kind?'selected':''} ${blocked?'unavailable':''} ${deployed?'deployed':''}" data-summon="${kind}" aria-pressed="${pending===kind}" aria-haspopup="dialog" aria-label="${d.name} 능력치 확인"><span class="unit-icon" style="color:#${d.color.toString(16)}">${kind==='ranged'||kind==='melee'?`<span class="${kind}-portrait"></span>`:d.icon}</span><b>${d.name}</b><span class="price">${game.heroes().some(u=>u.kind===kind)?'배치됨':blocked?'정원 가득':'무료 소환'}</span></button>`;
    return `<div class="soldier-choice"><button class="unit-card ${pending===kind?'selected':''} ${game.gold<d.cost?'unavailable':''}" data-summon="${kind}" aria-pressed="${pending===kind}" aria-haspopup="dialog"><span class="unit-icon" style="color:#${d.color.toString(16)}">${d.icon}</span><b>${d.name}</b><small>클릭하여 능력치 확인</small><span class="price">${d.cost} G</span></button>${chosenSoldier?.kind===kind?`<button class="card-upgrade" data-upgrade="${chosenSoldier.id}" ${chosenSoldier.level>=5||game.gold<game.upgradeCost(chosenSoldier)?'disabled':''}>#${chosenSoldier.id} 승급 ${chosenSoldier.level>=5?'MAX':game.upgradeCost(chosenSoldier)+'G'}</button>`:''}</div>`;
  }).join('');
  el('soldiers').innerHTML=unitCards(false);
  const heroMarkup=unitCards(true);
  if(heroMarkup!==heroCardsMarkup){el('heroes').innerHTML=heroMarkup.repeat(3);heroCardsMarkup=heroMarkup;centerHero(centeredHeroKind,'auto');}
  el('hero-count').textContent=`배치 ${game.heroes().length} / 3 · 무료`;
  const u=game.units.find(u=>u.id===selectedUnit);
  el('unit-detail').hidden=!u||UNITS[u.kind].hero;
  if(u&&!UNITS[u.kind].hero) {
    const d=UNITS[u.kind],s=game.stats(u);
    el('unit-detail').innerHTML=`<b>${d.name} #${u.id} Lv.${u.level}</b> · ${Math.floor(u.slot/4)+1}행 ${u.slot%4+1}열<br>${DAMAGE_LABEL[s.damageType]} 공격 ${s.attack} · 공속 ${s.rate.toFixed(2)} · 체력 ${s.hp}<br>치명타 ${Math.round(s.critChance*100)}% · 피해 ${s.critMultiplier}배<div class="actions"><button data-upgrade="${u.id}" ${u.level>=5||game.gold<game.upgradeCost(u)?'disabled':''}>승급 ${u.level>=5?'MAX':game.upgradeCost(u)+'G'}</button><button class="danger" data-sell-unit="${u.id}">판매 +${Math.floor(u.spent/2)}G</button></div>`;
  } else el('unit-detail').textContent='배치된 유닛을 누르면 정보와 병사 강화·판매를 확인합니다.';
  if(!game.heroes().some(h=>h.id===selectedHero))selectedHero=game.heroes()[0]?.id??null;
  const hero=game.heroes().find(h=>h.id===selectedHero);
  el('gear-title').textContent='영웅 장비';
  el('inventory-hero-name').textContent=hero?UNITS[hero.kind].name:'영웅 선택';
  el('inventory-hero-icon').innerHTML=hero?(hero.kind==='ranged'||hero.kind==='melee'?`<span class="${hero.kind}-portrait"></span>`:UNITS[hero.kind].icon):'◇';
  el('equipment').innerHTML=inventoryGrid(hero?.id??-1);
  const bag=inventoryGrid(null);
  el('gear-bag').innerHTML=bag;el('shop-bag').innerHTML=bag;
  const gear=game.gear.find(g=>g.id===selectedGear);
  const itemDetail=gear?`${shape(gear.def,turns)} <b>${gear.def.name} #${gear.id}</b> · ${gear.def.description}<br>방향 ${turns*90}° · ${gear.owner===null?'공용 가방':game.gearState(gear).active?'능력치 활성':`능력치 비활성 (${game.gearState(gear).reason})`}<div class="actions"><button data-rotate-selected>↻ 회전</button>${gear.owner===null?`<button data-open-gear>영웅에게 장착</button>`:''}<button class="danger" data-sell-gear="${gear.id}">판매 +${Math.floor(gear.costBasis/2)}G</button><button data-cancel-gear>취소</button></div>`:'블록을 선택하거나 끌어 놓으세요. 더블클릭·두 번 탭하면 회전합니다.';
  el('item-detail').innerHTML=itemDetail;el('shop-item-detail').innerHTML=itemDetail;
  el('shop-cards').innerHTML='<div class="shop-merchant-slot" role="img" aria-label="상인 일러스트"></div>'+game.shop.map((item,index)=>item?`<article class="shop-card ${game.shopDiscounts[index]?'discounted':''}" data-shop-index="${index}" tabindex="0" aria-label="${item.name} · ${game.shopPrice(index)}G · 공용 가방에 드래그하여 구매">${`<span class="shop-item-visual">${shape(item,0,22)}<span class="shop-item-name">${item.name}</span></span>`}<button data-buy="${index}" aria-label="${item.name} ${game.shopPrice(index)}G 구매" ${game.gold<game.shopPrice(index)?'disabled':''}>${game.shopPrice(index)}G</button></article>`:'<article class="shop-card sold-out" aria-label="구매 완료">—</article>').join('');
  el('reroll').toggleAttribute('disabled',game.gold<RULES.rerollGold);
  updateHud();
  refreshLogs();
  refreshHeroInfo();
  refreshTools();
  refreshFieldUpgrade();
  if(currentScene==='boss')renderBossScreen();
}
function refreshCombatControls():void {
  for(const id of ['speed','boss-speed']){el(id).textContent=`${game.speed}×`;el(id).setAttribute('aria-label',`전투 배속 변경 · 현재 ${game.speed}배`);}
  for(const id of ['pause','boss-pause']){
    const button=el(id);button.setAttribute('aria-pressed',String(combatPaused));button.setAttribute('aria-label',combatPaused?'전투 재개':'전투 일시정지');button.title=combatPaused?'전투 재개':'일시정지';
    button.innerHTML=combatPaused?'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m5 2 9 6-9 6Z" fill="currentColor"/></svg>':'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 3h3v10H4zm5 0h3v10H9z" fill="currentColor"/></svg>';
  }
  el('app').dataset.combatPaused=String(combatPaused);el('wave-info').classList.toggle('is-paused',combatPaused);
  const numbers=el('dev-damage-numbers');numbers.textContent=`데미지 숫자 ${showDamageNumbers?'ON':'OFF'}`;numbers.setAttribute('aria-pressed',String(showDamageNumbers));
}
function refreshTools():void {
  refreshCombatControls();
  el('dev-balance').textContent=`골드 ${game.gold.toLocaleString()}G · 모루 ${game.anvils}`;
  el<HTMLButtonElement>('dev-test-gear').disabled=!game.heroes().some(u=>u.id===selectedHero);
  const plan=game.combinationPlan(selectedHero),count=plan.length;
  el('combine-status').textContent=`조합 ${count}회 · 모루 ${count}개 필요 / 보유 ${game.anvils}개`;
  const button=el<HTMLButtonElement>('combine');
  button.disabled=!count||game.anvils<count;
  button.textContent=count?`조합 ${count}`:'조합';
  button.title=plan.map(pair=>pair.map(id=>{const g=game.gear.find(g=>g.id===id)!;return `${g.def.name} #${g.id}`;}).join(' + ')).join(' / ');
  const full=game.enemies.filter(e=>!e.bounty&&!e.named&&e.hp>0).length>=RULES.maxEnemies;
  document.querySelectorAll<HTMLButtonElement>('[data-monster-id]').forEach(button=>button.disabled=full&&!MONSTERS.find(d=>d.id===button.dataset.monsterId)?.named);
  refreshLinks();
}
function renderMonsterTools():void {
  el('test-enemy-buttons').innerHTML=MONSTERS.map(def=>`<button data-monster-id="${def.id}">${def.named?'네임드 · ':''}${def.name}</button>`).join('');
  el('test-enemy-stats').innerHTML=MONSTERS.map(def=>`<article><b>${def.name} · ${DEFENSE_LABEL[def.defenseType]}</b><p>체력 ${def.hp} · ${DAMAGE_LABEL[def.damageType]} 공격 ${def.attack} · 공속 ${def.rate}/초<br>물리 방어 ${def.armor} · 마법 방어 ${def.magicArmor}<br>이동 ${def.speed} · 처치 ${def.gold}G</p></article>`).join('');
}
function renderRecipeTree():void {
  el('recipe-tree').innerHTML=`<details open><summary>📁 조합 공식 <small>${RECIPES.length}종</small></summary><p class="tools-hint">개발 확인용 · 조합 1회당 모루 1개</p><ul>${RECIPES.map(recipe=>{
    const result=ITEMS.find(item=>item.id===recipe.result)!;
    return `<li><details open><summary><span class="tree-item">${shape(result)}<b>${result.name}</b></span></summary><ul>${recipe.materials.map(id=>{
      const material=ITEMS.find(item=>item.id===id)!;
      return `<li><span class="tree-item">${shape(material)}<span>${material.name} ×1</span></span></li>`;
    }).join('')}</ul></details></li>`;
  }).join('')}</ul></details>`;
}
// 화면에 보이는 칸들의 중심만 사용한다. 스크롤로 가려진 칸에는 선을 그리지 않는다.
function visibleCenter(nodes:HTMLElement[]):{x:number;y:number}|null {
  const rects=nodes.filter(node=>node.getClientRects().length).map(node=>{
    const r=node.getBoundingClientRect(),scroll=node.closest('.inventory-scroll')?.getBoundingClientRect();
    const left=Math.max(0,r.left,scroll?.left??0),right=Math.min(innerWidth,r.right,scroll?.right??innerWidth);
    const top=Math.max(0,r.top,scroll?.top??0),bottom=Math.min(innerHeight,r.bottom,scroll?.bottom??innerHeight);
    return {left,right,top,bottom};
  }).filter(r=>r.right>r.left&&r.bottom>r.top);
  if(!rects.length)return null;
  return {x:rects.reduce((n,r)=>n+(r.left+r.right)/2,0)/rects.length,y:rects.reduce((n,r)=>n+(r.top+r.bottom)/2,0)/rects.length};
}
function refreshLinks():void {
  const svg=document.getElementById('combination-links')!;
  svg.setAttribute('viewBox',`0 0 ${innerWidth} ${innerHeight}`);
  document.querySelectorAll('.combo-partner').forEach(node=>node.classList.remove('combo-partner'));
  const lines:string[]=[];
  const planned=new Set(game.combinationPlan(selectedHero).map(pair=>pair.join(',')));
  const line=(a:{x:number;y:number},b:{x:number;y:number},kind:string)=>lines.push(`<line class="${kind}" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"/>`);
  const grids=['equipment','gear-bag','shop-bag'].map(id=>el(id)).filter(node=>node.getClientRects().length);
  for(const grid of grids){
    const owner=grid.id==='equipment'?selectedHero:null;
    if(grid.id==='equipment'&&owner===null)continue;
    for(const [a,b] of game.adjacentPairs(owner)){
      const ca=visibleCenter(Array.from(grid.querySelectorAll<HTMLElement>(`[data-gear-id="${a}"]`)));
      const cb=visibleCenter(Array.from(grid.querySelectorAll<HTMLElement>(`[data-gear-id="${b}"]`)));
      if(ca&&cb)line(ca,cb,planned.has(`${a},${b}`)?'combo-ready':'combo-deferred');
    }
  }
  const held=game.gear.find(g=>g.id===pressedGear);
  const product=shopFocus===null?null:game.shop[shopFocus];
  const type=drag?.shopIndex!==undefined?game.shop[drag.shopIndex]:held?.def??product;
  let source:{x:number;y:number}|null=null;
  if(drag?.moved)source={x:drag.x,y:drag.y};
  else if(held&&shopFocus===null)source=visibleCenter(Array.from(document.querySelectorAll<HTMLElement>(`[data-gear-id="${held.id}"]`)));
  else if(shopFocus!==null)source=visibleCenter(Array.from(document.querySelectorAll<HTMLElement>(`[data-shop-index="${shopFocus}"]`)));
  if(type&&source)for(const grid of grids)for(const item of game.gear){
    if(item.id===held?.id||!recipeForTypes(type.id,item.def.id))continue;
    const cells=Array.from(grid.querySelectorAll<HTMLElement>(`[data-gear-id="${item.id}"]`));
    const target=visibleCenter(cells);if(!target)continue;
    cells.forEach(node=>node.classList.add('combo-partner'));line(source,target,'combo-hint');
  }
  svg.innerHTML=lines.join('');
}
function updateHud():void {
  for(const key of ['gold','anvils'] as const)document.querySelectorAll<HTMLElement>(`[data-resource-value="${key}"]`).forEach(node=>{node.textContent=game[key].toLocaleString();});
  const bountyActive=game.enemies.some(e=>e.bounty&&e.hp>0),credits=game.bountyCredits();
  el('enemies').textContent=String(game.enemies.filter(e=>e.hp>0).length);
  const bountyButton=el<HTMLButtonElement>('bounty-summon');bountyButton.hidden=credits<1;bountyButton.disabled=bountyActive;
  bountyButton.title=`현상금 소환 · 대기 ${credits}/${RULES.bountyStackLimit}회 · 처치 보상 모루 ${RULES.bountyAnvils}개 / 기본 ${RULES.bountyGold}G`;
  bountyButton.setAttribute('aria-label',bountyActive?'현상금 몬스터 전투 중':`현상금 몬스터 소환 · 남은 ${credits}회`);
  el('bounty-label').textContent=bountyActive?'진행중':`소환${credits>1?' ×'+credits:''}`;
  el('wave-number').textContent=`WAVE ${game.wave}`;
  const remaining=Math.max(0,RULES.waveSeconds-game.waveTime),seconds=Math.ceil(remaining);
  el('wave-timer').textContent=`${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;
  const progress=el<HTMLProgressElement>('wave-progress');progress.max=RULES.waveSeconds;progress.value=remaining;
  progress.setAttribute('aria-valuetext',`남은 시간 ${seconds}초`);
  el('wave-info').classList.toggle('wave-urgent',remaining<=5);
  el('population').textContent=`배치 ${game.units.length} / 16`;
  el('message').textContent=game.message;
}
function chooseGear(id:number):void {
  const g=game.gear.find(g=>g.id===id);if(!g)return;
  shopFocus=null;selectedGear=id;turns=g.turns;if(g.owner!==null)selectedHero=g.owner;
  game.note(`${g.def.name} 선택 · 빈 칸에 배치 / 더블클릭 회전`);
}
function placeGear(x:number,y:number,bag=false):void {
  if(selectedGear===null)return;
  if(!bag&&selectedHero===null){game.note('장착할 영웅을 먼저 선택하세요.');return;}
  const success=bag?game.placeInBag(selectedGear,x,y,turns):game.equip(selectedGear,selectedHero!,x,y,turns);
  if(success)selectedGear=null;
}
type Drag={shopIndex?:number;cellSize?:number;id:number;x:number;y:number;pointer:number;moved:boolean;ghost:HTMLElement|null;dx:number;dy:number};
let drag:Drag|null=null;
let unitDrag:Drag|null=null;
type SummonDrag={kind:UnitKind;pointer:number;startX:number;startY:number;x:number;y:number;active:boolean;hero:boolean;previous:UnitKind|null;ghost:HTMLElement|null};
let summonDrag:SummonDrag|null=null,summonSuppressClickUntil=0;
function summonReason(kind:UnitKind):string|null {
  if(currentScene!=='defense'||sceneTransitioning)return '웨이브전에서 소환해 주세요.';
  const def=UNITS[kind];
  if(game.gold<def.cost)return '소환에 필요한 골드가 부족합니다.';
  if(def.hero&&game.heroes().some(u=>u.kind===kind))return '이미 배치된 영웅입니다. 전장의 영웅을 끌어 이동하세요.';
  if(def.hero&&game.heroes().length>=RULES.heroLimit)return '영웅은 최대 3명까지 배치할 수 있습니다.';
  if(game.units.length>=SLOTS.length)return '전장에 빈 배치 칸이 없습니다.';
  return null;
}
function clearSummonDrag():void {
  if(!summonDrag)return;
  if(summonDrag.active)pending=summonDrag.previous;
  summonDrag.ghost?.remove();summonDrag=null;
}
function updateSummonGhost():void {
  if(!summonDrag?.active||!summonDrag.ghost)return;
  const slot=canvasSlot(summonDrag.x,summonDrag.y),valid=slot>=0&&!game.units.some(u=>u.slot===slot)&&!summonReason(summonDrag.kind);
  summonDrag.ghost.style.left=`${summonDrag.x}px`;summonDrag.ghost.style.top=`${summonDrag.y}px`;
  summonDrag.ghost.classList.toggle('valid-drop',valid);
}

let suppressClick=false;
let lastGearTap:{id:number;context:string;time:number}|null=null;
let lastRotation:{id:number;time:number}|null=null;
function showCenterNotice(message:string):void {
  clearTimeout(noticeTimer);el('center-notice').textContent=message;el('center-notice').hidden=false;
  noticeTimer=setTimeout(()=>el('center-notice').hidden=true,2800);
}
function refreshFieldUpgrade():void {
  const button=el<HTMLButtonElement>('field-upgrade'),u=game.units.find(u=>u.id===selectedUnit&&!UNITS[u.kind].hero),canvas=document.querySelector('canvas');
  button.hidden=currentScene!=='defense'||sceneTransitioning||!u||!canvas||!!unitDrag?.moved;if(currentScene!=='defense'||sceneTransitioning||!u||!canvas||unitDrag?.moved)return;
  const r=canvas.getBoundingClientRect(),p=SLOTS[u.slot],x=r.left+p.x*r.width/RULES.width,y=r.top+(p.y+25)*r.height/RULES.height;
  button.hidden=y<0||y>innerHeight||r.bottom<0||r.top>innerHeight;
  button.style.left=`${Math.max(38,Math.min(innerWidth-38,x))}px`;button.style.top=`${y}px`;
  button.textContent=`승급 ${u.level>=5?'MAX':game.upgradeCost(u)+'G'}`;
  button.disabled=u.level>=5||game.gold<game.upgradeCost(u);button.dataset.upgrade=String(u.id);
}
function dragDestination(){
  if(!drag)return null;
  const hit=document.elementFromPoint(drag.x,drag.y),gear=game.gear.find(g=>g.id===drag!.id);
  if(drag.shopIndex===undefined&&(tab==='shop'||tab==='gear')&&hit?.closest('#shop-market'))return {kind:'sale' as const};
  const hero=(tab==='shop'||tab==='gear')&&gear?.owner===null&&hit?.closest('canvas')?game.heroes().find(h=>h.slot===canvasSlot(drag!.x,drag!.y)):null;
  if(hero)return {kind:'hero' as const,hero};
  const grids=['equipment','gear-bag','shop-bag'].map(id=>el(id)).filter(g=>g.getClientRects().length&&g.querySelector('[data-cell],[data-bag-cell]'));
  let grid=hit?.closest<HTMLElement>('#equipment,#gear-bag,#shop-bag');
  // 영역 밖 드롭도 가장 가까운 보이는 격자의 좌표로 보정한다. 상점 미구매품은 가방 위에서만 구매.
  if(!grid&&drag.shopIndex===undefined)grid=grids.sort((a,b)=>{
    const distance=(g:HTMLElement)=>{const r=g.getBoundingClientRect();return Math.max(r.left-drag!.x,0,drag!.x-r.right)**2+Math.max(r.top-drag!.y,0,drag!.y-r.bottom)**2};return distance(a)-distance(b);
  })[0]??null;
  if(!grid)return null;
  const first=grid.querySelector<HTMLElement>('[data-cell],[data-bag-cell]');if(!first)return null;
  const r=first.getBoundingClientRect(),step=r.width+3;
  const x=Math.round((drag.x-r.left-r.width/2)/step)-drag.dx,y=Math.round((drag.y-r.top-r.height/2)/step)-drag.dy;
  const bag=grid.id!=='equipment',owner=bag?null:selectedHero;
  return {kind:'grid' as const,grid,bag,owner,x,y,size:r.width};
}
function updateGearDrag():void {
  document.querySelectorAll<HTMLElement>('.drop-preview').forEach(node=>{node.classList.remove('drop-preview','drop-warning');node.style.removeProperty('--preview-color');});
  el('hero-drop-target').hidden=true;el('shop-market').classList.remove('sale-drop-active');el('shop-sale-hint').textContent='보유 아이템을 이곳으로 끌어 판매';
  if(!drag?.moved||!drag.ghost)return;
  const gear=game.gear.find(g=>g.id===drag!.id),def=drag.shopIndex===undefined?gear?.def:game.shop[drag.shopIndex];if(!def)return;
  const rotation=gear?.turns??0,cells=rotated(def.cells,rotation),destination=dragDestination();
  const size=destination?.kind==='grid'?destination.size:drag.cellSize??32,step=size+3,ghost=drag.ghost;
  ghost.innerHTML=cells.map(([x,y])=>`<i style="left:${x*step}px;top:${y*step}px;width:${size}px;height:${size}px;background:${def.color}"></i>`).join('');
  ghost.style.width=`${(Math.max(...cells.map(c=>c[0]))+1)*step-3}px`;ghost.style.height=`${(Math.max(...cells.map(c=>c[1]))+1)*step-3}px`;
  ghost.style.left=`${drag.x-drag.dx*step-size/2}px`;ghost.style.top=`${drag.y-drag.dy*step-size/2}px`;
  let valid=true;
  if(destination?.kind==='sale'){el('shop-market').classList.add('sale-drop-active');el('shop-sale-hint').textContent=`놓으면 판매 +${Math.floor((gear?.costBasis??0)/2)}G`;}
  else if(destination?.kind==='hero'){
    const canvas=document.querySelector('canvas')!,r=canvas.getBoundingClientRect(),p=SLOTS[destination.hero.slot],outline=el('hero-drop-target');
    outline.hidden=false;outline.style.left=`${r.left+(p.x-25)*r.width/RULES.width}px`;outline.style.top=`${r.top+(p.y-23)*r.height/RULES.height}px`;
    outline.style.width=`${50*r.width/RULES.width}px`;outline.style.height=`${46*r.height/RULES.height}px`;
    valid=!!game.nearestFree({id:drag.id,def},destination.hero.id,0,0,rotation);outline.classList.toggle('no-space',!valid);
  } else if(destination?.kind==='grid'){
    const {bag,owner,grid}=destination;
    let position=drag.shopIndex!==undefined?(bag?game.purchasePosition(def,{x:destination.x,y:destination.y}):null):game.correctedPosition({id:drag.id,def},owner,destination.x,destination.y,rotation);
    valid=!!position&&(bag||owner!==null)&&game.canPlace({id:drag.id,def},owner,position.x,position.y,rotation);
    if(drag.shopIndex!==undefined)valid=!!position&&bag&&game.gold>=game.shopPrice(drag.shopIndex);
    if(position)for(const [dx,dy] of cells){
      const node=Array.from(grid.querySelectorAll<HTMLElement>('[data-cell],[data-bag-cell]')).find(n=>(n.dataset.cell??n.dataset.bagCell)===`${position.x+dx},${position.y+dy}`);
      if(node){node.classList.add('drop-preview');node.classList.toggle('drop-warning',!valid);node.style.setProperty('--preview-color',def.color);}
    }
  }
  ghost.classList.toggle('drag-warning',!valid);
}
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
  const summon=target.closest<HTMLElement>('[data-summon]');
  if(summon&&currentScene==='defense'&&!sceneTransitioning){
    const kind=summon.dataset.summon as UnitKind;
    summonDrag={kind,pointer:e.pointerId,startX:e.clientX,startY:e.clientY,x:e.clientX,y:e.clientY,active:false,hero:UNITS[kind].hero,previous:pending,ghost:null};
  }
  if(!target.closest('#hero-info')&&!target.closest('.unit-card'))closeHeroInfo();
  const button=target.closest<HTMLElement>('[data-gear-id]');
  const product=target.closest<HTMLElement>('[data-shop-index]');
  if(product){
    shopFocus=Number(product.dataset.shopIndex);selectedGear=null;pressedGear=null;
    drag={shopIndex:shopFocus,id:-1,x:e.clientX,y:e.clientY,pointer:e.pointerId,moved:false,ghost:null,dx:0,dy:0};
    refreshLinks();
  } else if(!button){shopFocus=null;pressedGear=null;}
  if(button){
    const id=Number(button.dataset.gearId);pressedGear=id;shopFocus=null;const item=game.gear.find(g=>g.id===id);
    const cell=(button.dataset.bagCell??button.dataset.cell)!.split(',').map(Number);
    drag={id,cellSize:button.getBoundingClientRect().width,x:e.clientX,y:e.clientY,pointer:e.pointerId,moved:false,ghost:null,dx:cell[0]-(item?.x??0),dy:cell[1]-(item?.y??0)};refreshLinks();
  }
  if(target.tagName==='CANVAS'){
    const unit=game.units.find(u=>u.slot===canvasSlot(e.clientX,e.clientY));
    if(unit)unitDrag={id:unit.id,x:e.clientX,y:e.clientY,pointer:e.pointerId,moved:false,ghost:null,dx:0,dy:0};
  }
},{signal:events.signal});
document.addEventListener('pointermove',(e)=>{
  if(summonDrag?.pointer===e.pointerId){
    const g=summonDrag,dx=e.clientX-g.startX,dy=e.clientY-g.startY;
    if(!g.active&&Math.hypot(dx,dy)>8){
      if(g.hero&&Math.abs(dx)>Math.abs(dy)){summonDrag=null;}
      else if(!g.hero||dy < -10){
        const reason=summonReason(g.kind);
        if(reason){heroGesture=null;summonSuppressClickUntil=performance.now()+500;clearSummonDrag();game.note(reason);showCenterNotice(reason);return;}
        g.active=true;heroGesture=null;cancelAnimationFrame(heroAnimationFrame);heroAnimationFrame=0;heroNavigationQueue.length=0;
        if(g.hero)centerHero(g.kind,'auto');
        pending=g.kind;closeHeroInfo();g.ghost=document.createElement('div');g.ghost.className='summon-drag-ghost';g.ghost.setAttribute('aria-hidden','true');
        g.ghost.innerHTML=g.kind==='ranged'||g.kind==='melee'?`<img src="${import.meta.env.BASE_URL}assets/heroes/${g.kind}-idle.png" alt=""><span>${UNITS[g.kind].name}</span>`:`<b style="color:#${UNITS[g.kind].color.toString(16)}">${UNITS[g.kind].icon}</b><span>${UNITS[g.kind].name}</span>`;
        document.body.append(g.ghost);
      }
    }
    if(summonDrag?.active){e.preventDefault();summonDrag.x=e.clientX;summonDrag.y=e.clientY;updateSummonGhost();return;}
  }
  if(unitDrag&&unitDrag.pointer===e.pointerId){
    if(!unitDrag.moved&&Math.hypot(e.clientX-unitDrag.x,e.clientY-unitDrag.y)>7){
      unitDrag.moved=true;selectedUnit=unitDrag.id;pending=null;
      unitDrag.ghost=document.createElement('div');unitDrag.ghost.className='drag-ghost';
      const unit=game.units.find(u=>u.id===unitDrag!.id);
      if(unit&&UNITS[unit.kind].hero)selectedHero=unit.id;
      unitDrag.ghost.textContent=unit?`${UNITS[unit.kind].name} 이동`:'유닛 이동';document.body.append(unitDrag.ghost);
    }
    if(unitDrag.ghost){unitDrag.ghost.style.left=`${e.clientX}px`;unitDrag.ghost.style.top=`${e.clientY}px`;}
    if(unitDrag.moved){unitDrag.x=e.clientX;unitDrag.y=e.clientY;}
  }
  if(!drag||drag.pointer!==e.pointerId)return;
  if(!drag.moved&&Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>7) {
    drag.moved=true;lastGearTap=null;if(drag.shopIndex===undefined)chooseGear(drag.id);
    drag.ghost=document.createElement('div');drag.ghost.className='gear-drag-ghost';drag.ghost.setAttribute('aria-hidden','true');el('gear-drag-layer').append(drag.ghost);
  }
  if(drag.moved){drag.x=e.clientX;drag.y=e.clientY;}
  updateGearDrag();
  refreshLinks();
},{signal:events.signal});
document.addEventListener('pointerup',(e)=>{
  if(summonDrag?.pointer===e.pointerId){
    const g=summonDrag;summonDrag=null;
    if(g.active){
      heroGesture=null;summonSuppressClickUntil=performance.now()+350;g.ghost?.remove();
      const slot=canvasSlot(e.clientX,e.clientY);pending=g.previous;
      if(slot<0){game.note('전장의 빈 배치 칸에 놓아주세요.');showCenterNotice(game.message);}
      else if(game.summon(g.kind,slot)){
        selectedUnit=game.units.at(-1)!.id;if(UNITS[g.kind].hero)selectedHero=selectedUnit;pending=null;closeHeroInfo();
      } else showCenterNotice(game.message);
      refresh();return;
    }
  }
  if(unitDrag&&unitDrag.pointer===e.pointerId){
    if(unitDrag.moved){game.moveUnit(unitDrag.id,canvasSlot(e.clientX,e.clientY));refresh();}
    unitDrag.ghost?.remove();unitDrag=null;
  }
  if(!drag||drag.pointer!==e.pointerId)return;
  if(drag.moved) {
    suppressClick=true;
    drag.x=e.clientX;drag.y=e.clientY;const destination=dragDestination();
    if(drag.shopIndex!==undefined){
      if(destination?.kind==='grid'&&destination.bag)game.buy(drag.shopIndex,{x:destination.x,y:destination.y});
      else game.note('공용 가방에 내려놓을 때만 구매합니다.');
    } else if(destination?.kind==='sale'){game.sellGear(drag.id);selectedGear=null;}
    else if(destination?.kind==='hero'){
      if(game.autoEquip(drag.id,destination.hero.id)){selectedHero=destination.hero.id;selectedGear=null;}
      else showCenterNotice(game.message);
    } else if(destination?.kind==='grid'){
      placeGear(destination.x,destination.y,destination.bag);
      if(game.message.includes('빈칸이 없습니다'))showCenterNotice(game.message);
    } else game.note('장비칸을 찾지 못해 원래 위치를 유지합니다.');
    refresh();setTimeout(()=>suppressClick=false,0);
  }
  drag.ghost?.remove();drag=null;pressedGear=null;shopFocus=null;updateGearDrag();refreshLinks();
},{signal:events.signal});
document.addEventListener('pointercancel',()=>{clearSummonDrag();drag?.ghost?.remove();drag=null;pressedGear=null;shopFocus=null;unitDrag?.ghost?.remove();unitDrag=null;updateGearDrag();refreshLinks();},{signal:events.signal});


el('heroes').addEventListener('pointerdown',(e)=>{
  if(e.button!==0||!e.isPrimary)return;
  cancelAnimationFrame(heroAnimationFrame);heroAnimationFrame=0;heroNavigationQueue.length=0;el('heroes').setAttribute('aria-busy','false');
  heroGesture={pointer:e.pointerId,x:e.clientX,y:e.clientY,lastX:e.clientX,startScroll:el('heroes').scrollLeft,index:heroPhysicalIndex,dragged:false};
},{signal:events.signal});
document.addEventListener('pointermove',(e)=>{
  const g=heroGesture;if(!g||g.pointer!==e.pointerId||summonDrag?.active)return;
  const dx=e.clientX-g.x,dy=e.clientY-g.y;
  if(!g.dragged){if(Math.abs(dy)>Math.abs(dx)&&Math.abs(dy)>7){heroGesture=null;return;}if(Math.abs(dx)<7)return;g.dragged=true;closeHeroInfo();el('heroes').style.scrollSnapType='none';}
  e.preventDefault();g.lastX=e.clientX;
  const lo=heroOffset(g.index-1),hi=heroOffset(g.index+1);
  el('heroes').scrollLeft=Math.max(lo,Math.min(hi,g.startScroll-dx*.7));
},{passive:false,signal:events.signal});
document.addEventListener('pointerup',(e)=>{
  const g=heroGesture;if(!g||g.pointer!==e.pointerId)return;heroGesture=null;
  if(!g.dragged)return;
  heroSuppressClickUntil=performance.now()+350;
  const dx=e.clientX-g.x,advance=Math.abs(dx)>30?(dx<0?1:-1):0;
  const target=g.index+advance;centerHero(heroKinds[(target+heroKinds.length)%heroKinds.length],'smooth',target);
},{signal:events.signal});
document.addEventListener('pointercancel',(e)=>{if(heroGesture?.pointer===e.pointerId){heroGesture=null;centerHero(centeredHeroKind);}},{signal:events.signal});
el('heroes').addEventListener('scroll',()=>{
  cancelAnimationFrame(heroScrollFrame);
  heroScrollFrame=requestAnimationFrame(()=>{
    const track=el('heroes');if(!track.clientWidth||heroAnimationFrame||heroRebasing||track.getAttribute('aria-busy')==='true')return;
    const box=track.getBoundingClientRect(),center=box.left+box.width/2;
    const nearest=Array.from(track.querySelectorAll<HTMLElement>('[data-summon]')).sort((a,b)=>{const ar=a.getBoundingClientRect(),br=b.getBoundingClientRect();return Math.abs(ar.left+ar.width/2-center)-Math.abs(br.left+br.width/2-center);})[0];
    if(nearest)markCenteredHero(nearest.dataset.summon as UnitKind,Array.from(track.querySelectorAll('[data-summon]')).indexOf(nearest));
  });
},{passive:true,signal:events.signal});
el('heroes').addEventListener('scrollend',()=>{if(!heroAnimationFrame&&!heroGesture&&!heroRebasing)rebaseHero(centeredHeroKind);},{signal:events.signal});
el('heroes').addEventListener('keydown',(e)=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();moveHeroCarousel(e.key==='ArrowLeft'?-1:1);}},{signal:events.signal});
el('app').addEventListener('click',(e)=>{
  if((e.target as HTMLElement).closest('[data-summon]')&&performance.now()<summonSuppressClickUntil)return;
  if(suppressClick||((e.target as HTMLElement).closest('#heroes')&&performance.now()<heroSuppressClickUntil))return;
  const b=(e.target as HTMLElement).closest<HTMLButtonElement>('button');if(!b||b.disabled)return;
  const d=b.dataset;
  if(d.tab){closeHeroInfo();openTab(d.tab);}
  else if(b.id==='hero-prev')moveHeroCarousel(-1);
  else if(b.id==='hero-next')moveHeroCarousel(1);
  else if(d.summon){
    const kind=d.summon as UnitKind;
    if(UNITS[kind].hero&&kind!==centeredHeroKind){closeHeroInfo();centerHero(kind,'smooth',Array.from(el('heroes').querySelectorAll('[data-summon]')).indexOf(b));return;}
    if(!game.units.some(u=>u.id===selectedUnit&&u.kind===kind))selectedUnit=null;
    if(UNITS[kind].hero){
      const placed=game.heroes().find(u=>u.kind===kind);
      if(placed){selectedUnit=placed.id;selectedHero=placed.id;pending=null;selectedGear=null;heroInfo={kind,unitId:placed.id};game.note(`${UNITS[kind].name} · 이미 소환된 영웅입니다.`);}
      else {heroInfo={kind,unitId:null};pending=game.heroes().length<RULES.heroLimit?kind:null;game.note(pending?`${UNITS[kind].name} 선택 · 빈 칸을 누르면 무료 소환`:'영웅 정원이 가득합니다. 기본 능력치를 확인할 수 있습니다.');}
    } else {heroInfo={kind,unitId:null};pending=game.gold>=UNITS[kind].cost?kind:null;game.note(pending?`${UNITS[kind].name} 선택 · 빈 칸을 누르면 소환`:'골드가 부족합니다. 기본 능력치는 확인할 수 있습니다.');}
  }
  else if(d.upgrade)game.upgrade(Number(d.upgrade));
  else if(d.sellUnit){game.sellUnit(Number(d.sellUnit));selectedUnit=null;}
  else if(d.buy)game.buy(Number(d.buy));
  else if(d.cell||d.bagCell){
    if(d.gearId){
      const id=Number(d.gearId),context=b.parentElement!.id,now=performance.now();
      if(e.detail===2||(e.detail>0&&lastGearTap?.id===id&&lastGearTap.context===context&&now-lastGearTap.time<350))rotateSelected(id);
      else {chooseGear(id);lastGearTap={id,context,time:now};}
    } else {lastGearTap=null;const [x,y]=(d.cell??d.bagCell)!.split(',').map(Number);placeGear(x,y,!!d.bagCell);}
  }
  else if(d.sellGear){game.sellGear(Number(d.sellGear));selectedGear=null;}
  else if('cancelGear'in d){selectedGear=null;game.note('장비 선택을 취소했습니다.');}
  else if('rotateSelected'in d&&selectedGear!==null)rotateSelected(selectedGear);
  else if('openGear'in d)openTab('gear');
  else if(b.id==='combine'){if(game.combineMany(game.combinationPlan(selectedHero))){selectedGear=null;pressedGear=null;shopFocus=null;}}
  else if(b.id==='reroll')game.reroll();
  else if(b.id==='bounty-summon')game.summonBounty();
  else if(b.id==='pause'||b.id==='boss-pause'){combatPaused=!combatPaused;refreshCombatControls();if(currentScene==='boss')bossBattleView.draw();}
  else if(b.id==='speed'||b.id==='boss-speed'){game.speed=nextCombatSpeed(game.speed);refreshCombatControls();}
  refresh();
},{signal:events.signal});
el('dev-tools').addEventListener('click',(e)=>{
  const button=(e.target as HTMLElement).closest<HTMLButtonElement>('button');if(!button||button.disabled)return;
  if(button.id==='dev-boss-scene'){
    if(!game.units.length){game.note('50초 시험 보스와 싸울 아군을 먼저 배치하세요.');refresh();return;}
    bossTestMode=true;activeBossWave=null;bossReturnDelay=0;syncBossRoster(true);renderBossScreen();void sceneTransition.go('boss');return;
  }
  if(button.id==='dev-defense-scene'){void sceneTransition.go('defense');return;}
  if(button.id==='dev-test-deploy')game.devDeploySoldiers();
  else if(button.id==='dev-test-gear'){
    if(game.devEquipHero(selectedHero)){selectedUnit=selectedHero;pending=null;selectedGear=null;pressedGear=null;shopFocus=null;turns=0;openTab('gear');}
  }
  else if(button.id==='dev-damage-numbers'){showDamageNumbers=!showDamageNumbers;if(currentScene==='boss')bossBattleView.draw();}
  else if(button.id==='dev-gold')game.devGold();
  else if(button.id==='dev-anvils')game.devAnvils();
  else if(button.dataset.monsterId)game.spawnTestMonster(button.dataset.monsterId);
  else if(button.id==='dev-next-wave')game.nextTestWave();
  else if(button.id==='dev-reset'){
    clearSummonDrag();drag?.ghost?.remove();unitDrag?.ghost?.remove();drag=null;unitDrag=null;
    clearTimeout(noticeTimer);el('center-notice').hidden=true;game.reset();combatPaused=false;bossDamageHistory.clear();damageMeterMode='defense';showLastBoss=false;activeBossWave=null;bossReturnDelay=0;bossBattle.autoSkills=false;bossTestMode=false;syncBossRoster(true,true);bossBattleView.draw();pending=null;selectedUnit=null;selectedHero=null;selectedGear=null;turns=0;pressedGear=null;shopFocus=null;
    lastGearTap=null;lastRotation=null;suppressClick=false;closeHeroInfo();openTab('summon');refreshCombatControls();
  }
  refresh();
},{signal:events.signal});
window.addEventListener('blur',()=>{clearSummonDrag();if(heroGesture){heroGesture=null;centerHero(centeredHeroKind,'auto');}drag?.ghost?.remove();drag=null;pressedGear=null;shopFocus=null;unitDrag?.ghost?.remove();unitDrag=null;updateGearDrag();refreshLinks();},{signal:events.signal});
el('field-upgrade').addEventListener('click',()=>{const id=Number(el('field-upgrade').dataset.upgrade);game.upgrade(id);refresh();},{signal:events.signal});
el('hero-info').addEventListener('click',(e)=>{if((e.target as HTMLElement).closest('#close-hero-info'))closeHeroInfo();},{signal:events.signal});
document.addEventListener('keydown',(e)=>{if(e.key==='Escape')closeHeroInfo();},{signal:events.signal});
window.addEventListener('resize',()=>{centerHero(centeredHeroKind,'auto');positionHeroInfo();refreshFieldUpgrade();updateGearDrag();refreshLinks();},{signal:events.signal});
document.addEventListener('scroll',()=>{positionHeroInfo();refreshFieldUpgrade();updateGearDrag();refreshLinks();},{capture:true,signal:events.signal});
// DOM이 갱신되어도 두 번 클릭한 블록 ID로 회전을 판정한다. 네이티브 dblclick 단독 입력도 지원.
el('dps-tab-defense').addEventListener('click',()=>{damageMeterMode='defense';showLastBoss=false;refreshDamageMeter();},{signal:events.signal});
el('dps-tab-boss').addEventListener('click',()=>{damageMeterMode='boss';showLastBoss=false;refreshDamageMeter();},{signal:events.signal});
el('dps-last-boss').addEventListener('click',()=>{showLastBoss=!showLastBoss;refreshDamageMeter();},{signal:events.signal});
el('boss-restart').addEventListener('click',()=>{bossReturnDelay=0;syncBossRoster(true);renderBossScreen();},{signal:events.signal});
el('boss-auto-skills').addEventListener('click',()=>{if(currentScene==='boss'&&!sceneTransitioning)bossBattle.autoSkills=!bossBattle.autoSkills;bossBattleView.draw();},{signal:events.signal});
el('boss-commander-skill').addEventListener('click',()=>{if(currentScene==='boss'&&!sceneTransitioning&&!combatPaused)bossBattle.commanderSkill();bossBattleView.draw();},{signal:events.signal});
el('boss-hero-skills').addEventListener('click',(e)=>{const button=(e.target as HTMLElement).closest<HTMLButtonElement>('[data-hero-skill]');if(button&&!button.disabled&&currentScene==='boss'&&!sceneTransitioning&&!combatPaused)bossBattle.useHeroSkill(button.dataset.heroSkill!);bossBattleView.draw();},{signal:events.signal});
el('app').addEventListener('dblclick',(e)=>{
  const block=(e.target as HTMLElement).closest<HTMLElement>('[data-gear-id]');
  if(!block)return;
  e.preventDefault();const id=Number(block.dataset.gearId);
  if(lastRotation?.id===id&&performance.now()-lastRotation.time<400)return;
  rotateSelected(id);refresh();
},{signal:events.signal});

function renderBossScreen():void {
  el('boss-wave-label').textContent=`BOSS · WAVE ${game.wave}`;
  bossBattleView.draw();refreshDamageMeter();
  const formation=game.units;
  el('boss-party').innerHTML=Array.from({length:32},(_,index)=>{
    const col=index%4,row=Math.floor(index/4);
    const unit=row>=2&&row<6?formation.find(u=>u.slot===(3-col)*4+row-2):undefined;
    if(!unit)return '<div class="boss-grid-cell" aria-hidden="true"></div>';
    const def=UNITS[unit.kind],color='#'+def.color.toString(16).padStart(6,'0');
    const weapon=unit.kind==='archer'?'<path d="M35 10 L40 24 L35 32" fill="none" stroke="#d2b47b" stroke-width="3"/>':unit.kind==='mage'||unit.kind==='healer'?`<path d="M36 35 V7" stroke="#ab8758" stroke-width="3"/><circle cx="36" cy="7" r="4" fill="${color}"/>`:'<path d="M35 28 L41 7" stroke="#d9e4e6" stroke-width="3"/>';
    const art=unit.kind==='ranged'||unit.kind==='melee'?`<img src="${import.meta.env.BASE_URL}assets/heroes/${unit.kind}-idle.png" alt="" draggable="false">`:`<svg viewBox="0 0 48 48" aria-hidden="true"><ellipse cx="24" cy="36" rx="15" ry="5" fill="#0a171380"/><rect x="14" y="18" width="20" height="21" rx="4" fill="${color}" stroke="#172731" stroke-width="2"/><circle cx="24" cy="14" r="7" fill="#e1c7a5" stroke="#273943" stroke-width="2"/>${weapon}</svg>`;
    return `<div class="boss-grid-cell boss-grid-unit" aria-label="${row+1}행 ${col+1}열 ${def.name} ${unit.level}레벨">${art}<small>${def.hero?'영웅':`Lv.${unit.level}`} ${def.icon}</small></div>`;
  }).join('');
}
const sceneTransition=createSceneTransition({
  root:el('app'),
  onBusy(busy){
    sceneTransitioning=busy;
    el<HTMLButtonElement>('dev-boss-scene').disabled=busy;el<HTMLButtonElement>('dev-defense-scene').disabled=busy;
    if(busy){
      clearSummonDrag();closeHeroInfo();cancelAnimationFrame(heroAnimationFrame);heroAnimationFrame=0;heroNavigationQueue.length=0;heroGesture=null;
      drag?.ghost?.remove();unitDrag?.ghost?.remove();drag=null;unitDrag=null;pressedGear=null;shopFocus=null;updateGearDrag();refreshLinks();
      el('field-upgrade').hidden=true;el('center-notice').hidden=true;
    }
  },
  onCovered(scene){
    if(currentScene==='boss'&&scene==='defense')bossDamageHistory.capture(bossBattle,bossEncounterWave,true);
    currentScene=scene;if(scene==='boss')syncBossRoster();renderBossScreen();
    el('scene-dev-status').textContent=`현재 화면: ${scene==='boss'?'보스전':'웨이브전'}`;
    el('dev-boss-scene').setAttribute('aria-pressed',String(scene==='boss'));el('dev-defense-scene').setAttribute('aria-pressed',String(scene==='defense'));
    document.title=`Grid Defenders — ${scene==='boss'?'보스전':'디펜스 전투'}`;
    if(scene==='defense'){refresh();if(tab==='summon')centerHero(centeredHeroKind,'auto');}
  },
});

async function start():Promise<void> {
  const app=new Application();
  await app.init({width:RULES.width,height:RULES.height,background:'#172620',preference:'webgl',resolution:Math.min(devicePixelRatio||1,2),autoDensity:true,antialias:true});
  el('battle-scene').append(app.canvas);app.canvas.setAttribute('aria-label','순환 전장, 병사와 영웅 배치 칸 16개');el('status').hidden=true;
  const rangedTexture=await Assets.load<Texture>(`${import.meta.env.BASE_URL}assets/heroes/ranged-idle.png`);
  const meleeTexture=await Assets.load<Texture>(`${import.meta.env.BASE_URL}assets/heroes/melee-idle.png`);
  const fireTexture=await Assets.load<Texture>(FIRE_SHEET_URL);
  const swordTexture=await Assets.load<Texture>(SWORD_SHEET_URL);
  const bladeTexture=await Assets.load<Texture>(BLADE_SHEET_URL);
  const view=createDefenseView(app,game,(slot)=>{
    if(unitDrag?.moved||summonDrag?.active)return;
    const unit=game.units.find(u=>u.slot===slot);
    if(unit){selectedUnit=unit.id;pending=null;if(UNITS[unit.kind].hero){selectedHero=unit.id;selectedGear=null;openTab('gear');}else openTab('summon');heroInfo={kind:unit.kind,unitId:unit.id};game.note(`${UNITS[unit.kind].name} 선택 · 드래그로 이동·자리교체`);}
    else if(pending){if(game.summon(pending,slot)){selectedUnit=game.units.at(-1)!.id;if(UNITS[pending].hero){selectedHero=selectedUnit;pending=null;}closeHeroInfo();}}
    else game.note('먼저 아래에서 소환할 병사 또는 영웅을 선택하세요.');
    refresh();
  },rangedTexture,meleeTexture,fireTexture,swordTexture,bladeTexture,()=>showDamageNumbers);
  let lastRevision=-1,hudClock=0,meterClock=0;
  renderMonsterTools();
  renderRecipeTree();
  refresh();
  app.ticker.add(ticker=>{
    if(sceneTransitioning)return;
    if(activeBossWave!==null&&(!game.bossPending||activeBossWave!==game.wave)){activeBossWave=null;bossReturnDelay=0;}
    if(currentScene==='boss'){
      const dt=Math.min(ticker.deltaMS/1000,.1);stepCombat(dt,game.speed,seconds=>bossBattle.tick(seconds),combatPaused);bossDamageHistory.capture(bossBattle,bossEncounterWave);bossBattleView.draw();
      meterClock+=dt;if(meterClock>=.15){meterClock=0;refreshDamageMeter();}
      if(activeBossWave===game.wave&&bossBattle.result==='victory'){
        if(!combatPaused)bossReturnDelay+=dt;
        if(!combatPaused&&bossReturnDelay>=1.2&&game.completeBossWave()){
          activeBossWave=null;bossReturnDelay=0;void sceneTransition.go('defense');
        }
      } else bossReturnDelay=0;
      return;
    }
    if(!combatPaused&&game.bossPending&&activeBossWave!==game.wave){
      activeBossWave=game.wave;bossReturnDelay=0;bossTestMode=false;syncBossRoster(true);
      void sceneTransition.go('boss');return;
    }
    if(summonDrag?.active){
      const step=Math.min(ticker.deltaMS,40)*.4;
      if(summonDrag.y<70)window.scrollBy(0,-step);else if(summonDrag.y>innerHeight-70)window.scrollBy(0,step);
      updateSummonGhost();
    }
    if(drag?.moved){
      const edge=60,step=Math.min(ticker.deltaMS,40)*0.35;
      const node=document.elementFromPoint(drag.x,drag.y)?.closest<HTMLElement>('.inventory-scroll');
      const rect=node?.getBoundingClientRect();
      const before=node?.scrollTop;
      if(node&&rect){if(drag.y<rect.top+edge)node.scrollTop-=step;else if(drag.y>rect.bottom-edge)node.scrollTop+=step;}
      if(!node||node.scrollTop===before){if(drag.y<edge)window.scrollBy(0,-step);else if(drag.y>innerHeight-edge)window.scrollBy(0,step);}
    }
    // 복귀 시 대량 생성·일괄 피해가 생기지 않게 시뮬레이션 한 프레임을 제한.
    const dt=Math.min(ticker.deltaMS/1000,0.1);stepCombat(dt,game.speed,(_seconds,realSeconds)=>game.tick(realSeconds),combatPaused);
    const canSummon=pending!==null&&!summonReason(pending);
    view.draw(selectedUnit,canSummon,unitDrag?.moved?{id:unitDrag.id,slot:canvasSlot(unitDrag.x,unitDrag.y)}:undefined);
    hudClock+=dt;if(hudClock>0.15){hudClock=0;updateHud();refreshFieldUpgrade();refreshLogs();}
    if(lastRevision!==game.revision&&!drag&&!unitDrag&&!summonDrag){lastRevision=game.revision;refresh();}
  });
  if(import.meta.hot)import.meta.hot.dispose(()=>{events.abort();clearSummonDrag();sceneTransition.dispose();cancelAnimationFrame(heroScrollFrame);cancelAnimationFrame(heroAnimationFrame);heroGesture=null;clearTimeout(noticeTimer);drag?.ghost?.remove();drag=null;updateGearDrag();unitDrag?.ghost?.remove();app.destroy(true,{children:true});});
}
void start().catch((error:unknown)=>{el('status').hidden=false;el('status').textContent='전장을 시작하지 못했습니다. 브라우저 그래픽 지원을 확인해 주세요.';console.error(error);});

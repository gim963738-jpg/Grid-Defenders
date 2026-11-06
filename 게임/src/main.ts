import {campProgress,campPageUrl,launchMode,newBattleId} from './campProgress';
import {trainingProgress} from './training';
import {itemArt,hasItemArt} from './itemArt';
import {battleResolution} from './renderQuality';
import {loadHeroArt,heroImage,heroPortrait,sheetHero,assassinSkillIcon} from './heroArt';
import {ASSASSIN} from './assassinCombat';
import {GameRun,FAILURE_TEXT,RUN_LIMITS,type RunMode,type RunFailure} from './gameRun';
import {upcomingWaveWarning} from './waveWarning';
import {DEFENSE_FIELD,FOREST_TERRAIN_URL,fieldToScreen,screenToField} from './defenseFieldLayout';
import {calibrateBossTest,type BossTestProfile} from './bossTestBalance';
import {nextCombatSpeed,stepCombat} from './combatPlayback';
import {BLADE_SKILL,BLADE_SHEET_URL} from './bladeSkill';
import {SWORD_SHEET_URL} from './swordAttack';
import {FIRE_SKILL,FIRE_SHEET_URL} from './fireSkill';
import { Application, Assets, Texture } from 'pixi.js';
import { Defense, recipeForTypes, type LogCategory } from './defense';
import { LANDSCAPE_BATTLE, BAG_GRID, GRID, ITEMS, MONSTERS, DAMAGE_LABEL, DEFENSE_LABEL, RECIPES, RULES, SLOTS, UNITS, rotated, type UnitKind, type ItemDef } from './defenseConfig';
import { createDefenseView } from './defenseView';
import { createSceneTransition, type BattleScene } from './sceneTransition';
import { BossBattle, waveBossRoster } from './bossBattle';
import { createBossBattleView } from './bossBattleView';
import { BossDamageHistory } from './bossDamageHistory';
import './style.css';
import { mountScreenBottomGuide } from './screen-bottom-guide';
const fromCamp=new URLSearchParams(location.search).get('from')==='camp';
if(fromCamp)document.body.classList.add('integrated-game');
mountScreenBottomGuide(fromCamp?'480px':'430px');

const el=<T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as T;
const game=new Defense(Math.random,()=>trainingProgress.bonuses());
const run=new GameRun();
let lastEmpireReward=0;
let currentRunId=newBattleId();
let returnPending=false,pausedBeforeReturn=false;
let assetsReady=false;
let showDamageNumbers=true,combatPaused=false;
const bossBattle=new BossBattle(waveBossRoster(game),Math.random,game.damageMeter.peaks);
let bossRosterSignature='';
let bossTestMode=false,bossTestProfile:BossTestProfile|null=null;
const bossDamageHistory=new BossDamageHistory();
const defeatedBossEnemies=new Set<string>();
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
const bossBattleView=createBossBattleView(document.getElementById('boss-combat')!,document.getElementById('boss-combat-status')!,bossBattle,()=>showDamageNumbers,()=>combatPaused||!run.active);
let currentScene:BattleScene='lobby',sceneTransitioning=false;
let activeBossWave:number|null=null,bossReturnDelay=0;
let pending:UnitKind|null=null, selectedUnit:number|null=null, selectedHero:number|null=null;
let selectedGear:number|null=null,turns=0,tab='summon';
let shopFocus:number|null=null;
let pressedGear:number|null=null;
const events=new AbortController();
let heroInfo:{kind:UnitKind;unitId:number|null;anchor?:'inventory'}|null=null;
let noticeTimer:ReturnType<typeof setTimeout>|undefined;
let waveWarningKey='';
let heroInfoMarkup='';
let heroSkillTooltipKind:UnitKind|null=null,heroSkillTooltipSlot=0,heroSkillSlotsMarkup='';
let centeredHeroKind:UnitKind='tank',heroCardsMarkup='',heroScrollFrame=0,heroAnimationFrame=0,heroSuppressClickUntil=0;
let heroGesture:{pointer:number;x:number;y:number;lastX:number;startScroll:number;index:number;dragged:boolean}|null=null;
const heroKinds=Object.entries(UNITS).filter(([,d])=>d.hero).map(([kind])=>kind as UnitKind);
let heroPhysicalIndex=heroKinds.length,heroRebasing=false;
const heroNavigationQueue:number[]=[];
function markCenteredHero(kind:UnitKind,physicalIndex=heroPhysicalIndex):void {
  if(centeredHeroKind!==kind)closeHeroSkillTooltip();
  centeredHeroKind=kind;heroPhysicalIndex=physicalIndex;
  const cards=Array.from(el('heroes').querySelectorAll<HTMLElement>('[data-summon]'));
  cards.forEach((card,i)=>{const active=i===physicalIndex;card.classList.toggle('carousel-centered',active);card.tabIndex=active?0:-1;if(active)card.setAttribute('aria-current','true');else card.removeAttribute('aria-current');});
  el('hero-carousel-position').textContent=`${heroKinds.indexOf(kind)+1} / ${heroKinds.length}`;
  el<HTMLButtonElement>('hero-prev').disabled=heroKinds.length<2;
  el<HTMLButtonElement>('hero-next').disabled=heroKinds.length<2;
  el('command-area').dataset.heroBackdrop=kind;
  el('command-area').style.setProperty('--hero-symbol',`"${UNITS[kind].icon}"`);
  refreshHeroSkillSlots();
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
  closeHeroInfo();closeHeroSkillTooltip();if(heroAnimationFrame||heroRebasing){heroNavigationQueue.push(direction);return;}
  rebaseHero(centeredHeroKind);const target=heroPhysicalIndex+direction;
  centerHero(heroKinds[(target+heroKinds.length)%heroKinds.length],'smooth',target);
}

// The summon strip describes assigned active skills; basic attacks are not slots.
function summonHeroSkill(kind:UnitKind,slot=0){
  if(kind==='assassin')return slot===0?{name:'참격 · 웨이브',cooldown:ASSASSIN.waveCooldown,hits:1,damage:'250%',description:'제자리에서 뛰어 내려쳐 한 대상을 공격하고, 5초 동안 물리·마법 방어력을 30% 감소시킵니다.'}:slot===1?{name:'삼연참·돌진 · 보스',cooldown:ASSASSIN.bossCooldown,hits:4,damage:'35% × 3 + 250%',description:'한 대상을 3회 벤 뒤 한 칸 전진하며 경로의 모든 적을 타격하고 원위치로 돌아옵니다. 경로 타격은 5초 동안 물리·마법 방어력을 30% 감소시킵니다.'}:null;
  if(slot!==0)return null;
  if(kind==='melee')return {name:'연속 검격',sheet:BLADE_SHEET_URL,crop:'16 338 193 194',cooldown:BLADE_SKILL.cooldown,hits:BLADE_SKILL.hits,
    damage:`${BLADE_SKILL.damageMultipliers[0]*100}% × ${BLADE_SKILL.hits-1} + ${BLADE_SKILL.damageMultipliers.at(-1)!*100}%`,
    description:'대상 주변을 연속으로 베고 마지막 일격으로 강하게 내려칩니다.'};
  if(kind==='ranged')return {name:'화염 기둥',sheet:FIRE_SHEET_URL,crop:'37 369 198 198',cooldown:FIRE_SKILL.cooldown,hits:FIRE_SKILL.hits,
    damage:`${FIRE_SKILL.damageMultiplier*100}% × ${FIRE_SKILL.hits}`,
    description:'대상 발밑에 화염 기둥을 생성해 주변 적을 연속 타격합니다.'};
  return null;
}
function summonSkillIcon(kind:UnitKind,slot=0):string {
  if(kind==='assassin')return assassinSkillIcon(slot===0?'wave':'boss');
  const skill=summonHeroSkill(kind,slot);return skill&&'crop' in skill?`<svg viewBox="${skill.crop}" aria-hidden="true"><image href="${skill.sheet}" width="1536" height="1024"/></svg>`:'';
}
function refreshHeroSkillSlots():void {
  const root=el('hero-skill-slots');
  const markup=Array.from({length:3},(_,i)=>{const skill=summonHeroSkill(centeredHeroKind,i);return skill
    ?`<button class="hero-skill-slot assigned" data-hero-skill-info="${centeredHeroKind}" data-skill-index="${i}" aria-label="${skill.name} 스킬 설명" aria-haspopup="dialog" aria-expanded="false" aria-controls="hero-skill-tooltip">${summonSkillIcon(centeredHeroKind,i)}</button>`
    :`<button class="hero-skill-slot empty" disabled aria-label="미구현 스킬 ${i+1}"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="m10 10 12 12m0-12L10 22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>`;}).join('');
  if(markup!==heroSkillSlotsMarkup){root.innerHTML=markup;heroSkillSlotsMarkup=markup;}
  root.dataset.heroKind=centeredHeroKind;root.setAttribute('aria-label',`${UNITS[centeredHeroKind].name} 스킬`);
}
function closeHeroSkillTooltip():void {
  heroSkillTooltipKind=null;el('hero-skill-tooltip').hidden=true;
  el('hero-skill-slots').querySelectorAll('button[aria-expanded]').forEach(b=>b.setAttribute('aria-expanded','false'));
}
function positionHeroSkillTooltip():void {
  if(heroSkillTooltipKind===null)return;
  const popup=el('hero-skill-tooltip'),button=el('hero-skill-slots').querySelector<HTMLElement>(`[data-hero-skill-info][data-skill-index="${heroSkillTooltipSlot}"]`);
  if(!button||tab!=='summon'||currentScene!=='defense'||sceneTransitioning){popup.hidden=true;return;}
  const anchor=button.getBoundingClientRect();
  if(anchor.bottom<0||anchor.top>innerHeight){popup.hidden=true;return;}
  popup.hidden=false;
  const bounds=el('app').getBoundingClientRect(),width=Math.min(280,bounds.width-16,innerWidth-16);
  popup.style.width=`${width}px`;
  const height=popup.getBoundingClientRect().height;
  const left=Math.max(8,bounds.left+8,Math.min(innerWidth-width-8,bounds.right-width-8,(anchor.left+anchor.right-width)/2));
  const top=anchor.top-height-10>=8?anchor.top-height-10:anchor.bottom+10;
  popup.style.left=`${left}px`;popup.style.top=`${Math.max(8,Math.min(innerHeight-height-8,top))}px`;
}
function toggleHeroSkillTooltip(kind:UnitKind,slot=0):void {
  const skill=summonHeroSkill(kind,slot);if(!skill||kind!==centeredHeroKind)return;
  if(heroSkillTooltipKind===kind&&heroSkillTooltipSlot===slot){closeHeroSkillTooltip();return;}
  closeHeroInfo();heroSkillTooltipKind=kind;heroSkillTooltipSlot=slot;
  el('hero-skill-tooltip').innerHTML=`<header><span class="hero-skill-tooltip-icon">${summonSkillIcon(kind,slot)}</span><div><small>${UNITS[kind].name} · ${kind==='assassin'?'단일·경로':'범위'} ${DAMAGE_LABEL[UNITS[kind].damageType]} 피해</small><h2 id="hero-skill-tooltip-title">${skill.name}</h2></div><button id="close-hero-skill-tooltip" aria-label="스킬 설명 닫기">×</button></header><p>${skill.description}</p><dl><div><dt>쿨타임</dt><dd>${skill.cooldown}초</dd></div><div><dt>타격 횟수</dt><dd>${skill.hits}회</dd></div><div class="skill-damage"><dt>기본 공격력 대비 피해</dt><dd>${skill.damage}</dd></div></dl>`;
  el('hero-skill-slots').querySelector(`[data-hero-skill-info][data-skill-index="${slot}"]`)?.setAttribute('aria-expanded','true');positionHeroSkillTooltip();
}

function closeHeroInfo():void {heroInfo=null;el('hero-info').hidden=true;}
function positionHeroInfo():void {
  const popup=el('hero-info');if(!heroInfo)return;
  let anchor:{left:number;right:number;top:number;bottom:number};
  if(heroInfo.anchor==='inventory'){
    const button=el('inventory-hero-stats');if(!button.getClientRects().length){popup.hidden=true;return;}
    anchor=button.getBoundingClientRect();
  } else if(heroInfo.unitId!==null){
    const unit=game.units.find(u=>u.id===heroInfo!.unitId),canvas=document.querySelector('canvas');
    if(!unit||!canvas){closeHeroInfo();return;}
    const box=canvas.getBoundingClientRect(),point=SLOTS[unit.slot];
    const {x,y}=fieldToScreen(box,point);
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
  const stats=unit?game.stats(unit):{hp:def.hp,attack:def.attack,armor:def.armor,rate:def.rate,regen:0,gold:0,critChance:def.hero?RULES.heroCritChance:RULES.soldierCritChance,critMultiplier:RULES.critMultiplier,physicalAttack:def.damageType==='physical'?def.attack:0,magicAttack:def.damageType==='magic'?def.attack:0,physicalArmor:def.armor,magicArmor:def.magicArmor};
  const field=(key:string,icon:string,label:string,current:number,base:number,format=(n:number)=>n.toLocaleString(),prefix='')=>{
    const gain=unit&&def.hero?current-base:0;
    return {key,icon,label,value:prefix+format(current),bonus:gain>1e-8?`(+${format(gain)})`:''};
  };
  const baseAttack=Math.round(def.attack*(1+((unit?.level??1)-1)*.25));
  const fields=[field('hp','♥','최대 체력',stats.hp,def.hp),field('rate','↗','공격속도',stats.rate,def.rate,n=>`${n.toFixed(2)}/초`),
    field('attack','⚔','물리 공격',stats.physicalAttack,def.damageType==='physical'?baseAttack:0),field('attack','✦','마법 공격',stats.magicAttack,def.damageType==='magic'?baseAttack:0),
    field('armor','⬡','물리 방어',stats.physicalArmor,def.armor),field('armor','◇','마법 방어',stats.magicArmor,def.magicArmor),
    field('regen','✚','체력 재생',stats.regen,0,n=>`${n.toLocaleString()}/초`),field('gold','◇','골드 획득',stats.gold,0,n=>`${Math.round(n*100)}%`,'+')];
  fields.push(field('attack','✦','치명타 확률',stats.critChance,stats.critChance,n=>`${Math.round(n*100)}%`),field('attack','✦','치명타 데미지',stats.critMultiplier,stats.critMultiplier,n=>`${n}배`));
  const markup=`<header><span class="hero-info-icon" style="color:#${def.color.toString(16)}">${def.hero?heroPortrait(heroInfo.kind):def.icon}</span><div><small>${unit?(def.hero?'장비·훈련 적용 능력치':`강화·훈련 적용 능력치 · Lv.${unit.level}`):'기본 능력치 · 배치 전'}</small><h2>${def.name}${unit?` #${unit.id}`:''}</h2></div><button id="close-hero-info" aria-label="유닛 능력치 닫기">×</button></header><dl>${fields.map(({key,icon,label,value,bonus})=>`<div class="hero-stat"><dt><span class="stat-symbol ${key}">${icon}</span>${label}</dt><dd data-stat="${key}"${bonus?' class="stat-increased"':''}><span>${value}</span>${bonus?`<small class="gear-stat-bonus" aria-label="장비 증가분 ${bonus}">${bonus}</small>`:''}</dd></div>`).join('')}</dl>`;
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
  if(hasItemArt(item))return `<span class="mini-shape illustrated-shape" style="width:${width*cellSize+(width-1)*2}px;height:${height*cellSize+(height-1)*2}px">${itemArt(item,rotation)}</span>`;
  return `<span class="mini-shape" style="--shape-columns:${width};--shape-rows:${height};grid-template-columns:repeat(${width},${cellSize}px)">${cells.map(([x,y])=>`<i style="grid-column:${x+1};grid-row:${y+1};width:${cellSize}px;height:${cellSize}px;background:${item.color}"></i>`).join('')}</span>`;
}
function openTab(name:string):void {
  closeHeroSkillTooltip();tab=name;
  el('command-area').classList.toggle('summon-background',tab==='summon');
  if(tab!=='summon'){cancelAnimationFrame(heroAnimationFrame);heroAnimationFrame=0;heroNavigationQueue.length=0;heroGesture=null;el('heroes').setAttribute('aria-busy','false');}
  document.querySelectorAll<HTMLElement>('.panel').forEach(p=>p.hidden=p.id!==tab&&!(tab==='shop'&&p.id==='gear'));
  document.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach(b=>{const active=b.dataset.tab===tab;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
  el('command-area').querySelector('.command-panels')?.scrollTo({top:0});
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
    const illustrated=g&&hasItemArt(g.def);
    const footprint=g?rotated(g.def.cells,g.turns):[],w=footprint.length?Math.max(...footprint.map(c=>c[0]))+1:1,h=footprint.length?Math.max(...footprint.map(c=>c[1]))+1:1;
    const first=footprint.slice().sort((a,b)=>a[1]-b[1]||a[0]-b[0])[0],anchor=illustrated&&first&&x===g.x+first[0]&&y===g.y+first[1];
    const art=anchor?`<span class="inventory-item-art" style="left:calc(-1px - (var(--inventory-cell) + 3px) * ${first[0]});top:calc(-1px - (var(--inventory-cell) + 3px) * ${first[1]});width:calc(var(--inventory-cell) * ${w} + ${(w-1)*3}px);height:calc(var(--inventory-cell) * ${h} + ${(h-1)*3}px)">${itemArt(g.def,g.turns)}</span>`:'';
    return `<button class="gear-cell ${illustrated?'illustrated-cell':''} ${(x+y)%2?'board-light':'board-dark'} ${g?.id===selectedGear?'picked':''} ${inactive?'gear-inactive':''} " ${address} ${g?`data-gear-id="${g.id}" ${inactive?'data-inactive="true"':''} style="background-color:${g.def.color}" title="${stack.map(v=>`${v.def.name} #${v.id}`).join(' / ')} · 더블클릭 회전"`:''} aria-label="${owner===null?'공용 가방':'영웅 장비'} ${x+1}열 ${y+1}행${g?' '+g.def.name:''}${inactive?' 비활성':''}">${art}${g&&!illustrated?g.def.short:''}${stack.length>1?`<sup>${stack.length}</sup>`:''}</button>`;
  }).join('');
}
function refresh():void {

  const chosenSoldier=game.units.find(u=>u.id===selectedUnit&&!UNITS[u.kind].hero);
  const unitCards=(hero:boolean)=>Object.entries(UNITS).filter(([,d])=>d.hero===hero).map(([key,d])=>{
    const kind=key as UnitKind;
    const deployed=hero&&game.heroes().some(u=>u.kind===kind);
    const blocked=hero&&(game.heroes().length>=RULES.heroLimit||deployed);
    if(hero)return `<button class="unit-card hero-card ${kind}-summon-card ${sheetHero(kind)&&kind!=='melee'?'sheet-summon-card':''} ${pending===kind?'selected':''} ${blocked?'unavailable':''} ${deployed?'deployed':''}" data-summon="${kind}" aria-pressed="${pending===kind}" aria-haspopup="dialog" aria-label="${d.name} 능력치 확인"><span class="hero-card-art">${sheetHero(kind)&&kind!=='melee'?heroPortrait(kind):''}</span><span class="unit-icon" style="color:#${d.color.toString(16)}">${heroPortrait(kind)}</span><b>${d.name}</b><span class="price">${game.heroes().some(u=>u.kind===kind)?'배치됨':blocked?'정원 가득':'무료 소환'}</span></button>`;
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
  const statsButton=el<HTMLButtonElement>('inventory-hero-stats');statsButton.disabled=!hero;
  statsButton.setAttribute('aria-label',hero?`${UNITS[hero.kind].name} 능력치 보기`:'영웅 능력치 보기');
  el('inventory-hero-icon').innerHTML=hero?heroPortrait(hero.kind):'◇';
  el('equipment').innerHTML=inventoryGrid(hero?.id??-1);
  const bag=inventoryGrid(null);
  el('gear-bag').innerHTML=bag;el('shop-bag').innerHTML=bag;
  const gear=game.gear.find(g=>g.id===selectedGear);
  const itemDetail=gear?`${shape(gear.def,turns)} <b>${gear.def.name} #${gear.id}</b> · ${gear.def.description}<br>방향 ${turns*90}° · ${gear.owner===null?'공용 가방':game.gearState(gear).active?'능력치 활성':`능력치 비활성 (${game.gearState(gear).reason})`}<div class="actions"><button data-rotate-selected>↻ 회전</button>${gear.owner===null?`<button data-open-gear>영웅에게 장착</button>`:''}<button class="danger" data-sell-gear="${gear.id}">판매 +${Math.floor(gear.costBasis/2)}G</button><button data-cancel-gear>취소</button></div>`:'블록을 선택하거나 끌어 놓으세요. 더블클릭·두 번 탭하면 회전합니다.';
  el('item-detail').innerHTML=itemDetail;el('shop-item-detail').innerHTML=itemDetail;
  el('shop-cards').innerHTML='<div class="shop-merchant-slot" role="img" aria-label="상인 일러스트"></div>'+game.shop.map((item,index)=>item?`<article class="shop-card ${game.shopDiscounts[index]?'discounted':''}" data-shop-index="${index}" tabindex="0" aria-label="${item.name} · ${game.shopPrice(index)}G · 공용 가방 또는 영웅 장비칸에 드래그하여 구매">${`<span class="shop-item-visual">${shape(item,0,22)}<span class="shop-item-name">${item.name}</span></span>`}<button data-buy="${index}" aria-label="${item.name} ${game.shopPrice(index)}G 구매" ${game.gold<game.shopPrice(index)?'disabled':''}>${game.shopPrice(index)}G</button></article>`:'<article class="shop-card sold-out" aria-label="구매 완료">—</article>').join('');
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
  refreshLinks();refreshRunControls();
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
function refreshWaveAlert():void {
  const root=el('wave-alert'),warning=run.active&&currentScene==='defense'&&!sceneTransitioning?upcomingWaveWarning(game):null;
  if(!warning){if(!root.hidden)root.hidden=true;waveWarningKey='';return;}
  const key=`${warning.kind}:${warning.wave}`;
  if(key!==waveWarningKey){
    waveWarningKey=key;root.dataset.kind=warning.kind;
    el('wave-alert-label').textContent=warning.kind==='boss'?'DANGER · BOSS INCOMING':'ELITE INCOMING';
    el('wave-alert-title').textContent=warning.kind==='boss'?'보스전 임박':'네임드 출현 예고';
    el('wave-alert-round').textContent=`WAVE ${warning.wave}`;
    root.setAttribute('aria-label',`${warning.wave}웨이브 ${warning.kind==='boss'?'보스전':'네임드'} 시작 10초 전`);
  }
  const seconds=String(warning.seconds);if(el('wave-alert-seconds').textContent!==seconds)el('wave-alert-seconds').textContent=seconds;
  if(root.hidden)root.hidden=false;
}
function updateHud():void {
  for(const key of ['gold','anvils'] as const)document.querySelectorAll<HTMLElement>(`[data-resource-value="${key}"]`).forEach(node=>{node.textContent=game[key].toLocaleString();});
  const bountyActive=game.enemies.some(e=>e.bounty&&e.hp>0),credits=game.bountyCredits();
  const alive=game.enemies.filter(e=>e.hp>0).length,limit=RULES.waveMonsters*2;
  el('enemies').textContent=String(alive);el('enemy-limit').textContent=String(limit);
  el('enemy-limit').title=run.mode==='normal'?`생존 몬스터 ${limit}마리 누적 시 패배`:'2웨이브 분량 기준 · 테스트 모드 패배 없음';
  el('enemy-limit').parentElement!.setAttribute('aria-label',`현재 몬스터 ${alive}마리 / 2웨이브 분량 ${limit}마리`);
  refreshWaveAlert();refreshBossTimer();
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
  el('population').textContent=`배치 ${game.units.length} / ${SLOTS.length}`;
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
  if(!run.active)return '로비에서 게임을 시작하세요.';
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
function unitDragImage(kind:UnitKind):string {
  if(UNITS[kind].hero)return heroImage(kind);
  const color='#'+UNITS[kind].color.toString(16).padStart(6,'0');
  const weapon=kind==='archer'?'<path d="M35 10 L40 24 L35 32" fill="none" stroke="#d2b47b" stroke-width="3"/>':kind==='mage'||kind==='healer'?`<path d="M36 35 V7" stroke="#ab8758" stroke-width="3"/><circle cx="36" cy="7" r="4" fill="${color}"/>`:'<path d="M35 28 L41 7" stroke="#d9e4e6" stroke-width="3"/>';
  return `<svg viewBox="0 0 48 48" aria-hidden="true"><ellipse cx="24" cy="36" rx="15" ry="5" fill="#0a171380"/><rect x="14" y="18" width="20" height="21" rx="4" fill="${color}" stroke="#172731" stroke-width="2"/><circle cx="24" cy="14" r="7" fill="#e1c7a5" stroke="#273943" stroke-width="2"/>${weapon}</svg>`;
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
  const r=canvas.getBoundingClientRect(),p=SLOTS[u.slot],{x,y}=fieldToScreen(r,{x:p.x,y:p.y+25});
  button.hidden=y<0||y>innerHeight||r.bottom<0||r.top>innerHeight;
  button.style.left=`${Math.max(38,Math.min(innerWidth-38,x))}px`;button.style.top=`${y}px`;
  button.textContent=`승급 ${u.level>=5?'MAX':game.upgradeCost(u)+'G'}`;
  button.disabled=u.level>=5||game.gold<game.upgradeCost(u);button.dataset.upgrade=String(u.id);
}
function dragDestination(){
  if(!drag)return null;
  const hit=document.elementFromPoint(drag.x,drag.y),gear=game.gear.find(g=>g.id===drag!.id);
  if(drag.shopIndex===undefined&&(tab==='shop'||tab==='gear')&&hit?.closest('#shop-market'))return {kind:'sale' as const};
  const hero=(tab==='shop'||tab==='gear')&&(drag.shopIndex!==undefined||gear?.owner===null)&&hit?.closest('canvas')?game.heroes().find(h=>h.slot===canvasSlot(drag!.x,drag!.y)):null;
  if(hero)return {kind:'hero' as const,hero};
  const grids=['equipment','gear-bag','shop-bag'].map(id=>el(id)).filter(g=>g.getClientRects().length&&g.querySelector('[data-cell],[data-bag-cell]'));
  let grid=hit?.closest<HTMLElement>('#equipment,#gear-bag,#shop-bag');
  // 영역 밖 드롭도 가장 가까운 보이는 격자의 좌표로 보정한다. 상점 미구매품은 가방 또는 영웅 장비칸 위에서 구매.
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
  el('gear-sale-layer').hidden=true;
  if(!drag?.moved||!drag.ghost)return;
  const gear=game.gear.find(g=>g.id===drag!.id),def=drag.shopIndex===undefined?gear?.def:game.shop[drag.shopIndex];if(!def)return;
  const rotation=gear?.turns??0,cells=rotated(def.cells,rotation),destination=dragDestination();
  if(drag.shopIndex===undefined&&gear&&(tab==='gear'||tab==='shop')){
    el('gear-sale-layer').hidden=false;el('gear-sale-title').textContent=destination?.kind==='sale'?'놓아서 판매':'아이템 판매';
    el('gear-sale-value').textContent=`+${Math.floor(gear.costBasis/2).toLocaleString()}G`;
  }
  const size=destination?.kind==='grid'?destination.size:drag.cellSize??32,step=size+3,ghost=drag.ghost;
  ghost.innerHTML=hasItemArt(def)?itemArt(def,rotation):cells.map(([x,y])=>`<i style="left:${x*step}px;top:${y*step}px;width:${size}px;height:${size}px;background:${def.color}"></i>`).join('');
  ghost.style.width=`${(Math.max(...cells.map(c=>c[0]))+1)*step-3}px`;ghost.style.height=`${(Math.max(...cells.map(c=>c[1]))+1)*step-3}px`;
  ghost.style.left=`${drag.x-drag.dx*step-size/2}px`;ghost.style.top=`${drag.y-drag.dy*step-size/2}px`;
  let valid=true;
  if(destination?.kind==='sale'){el('shop-market').classList.add('sale-drop-active');el('shop-sale-hint').textContent=`놓으면 판매 +${Math.floor((gear?.costBasis??0)/2)}G`;}
  else if(destination?.kind==='hero'){
    const canvas=document.querySelector('canvas')!,r=canvas.getBoundingClientRect(),p=SLOTS[destination.hero.slot],outline=el('hero-drop-target');
    const point=fieldToScreen(r,{x:p.x-25,y:p.y-23});
    outline.hidden=false;outline.style.left=`${point.x}px`;outline.style.top=`${point.y}px`;
    outline.style.width=`${50*r.width/RULES.width}px`;outline.style.height=`${46*r.height/DEFENSE_FIELD.height}px`;
    valid=!!game.nearestFree({id:drag.id,def},destination.hero.id,0,0,rotation)&&(drag.shopIndex===undefined||game.gold>=game.shopPrice(drag.shopIndex));outline.classList.toggle('no-space',!valid);
  } else if(destination?.kind==='grid'){
    const {bag,owner,grid}=destination;
    let position=drag.shopIndex!==undefined?(bag?game.purchasePosition(def,{x:destination.x,y:destination.y}):owner!==null?game.nearestFree({id:-1,def},owner,destination.x,destination.y,0):null):game.correctedPosition({id:drag.id,def},owner,destination.x,destination.y,rotation);
    valid=!!position&&(bag||owner!==null)&&game.canPlace({id:drag.id,def},owner,position.x,position.y,rotation);
    if(drag.shopIndex!==undefined)valid=!!position&&(bag||owner!==null)&&game.gold>=game.shopPrice(drag.shopIndex);
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
  const {x:px,y:py}=screenToField(rect,{x,y});
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
  if(!target.closest('#hero-skill-tooltip')&&!target.closest('[data-hero-skill-info]'))closeHeroSkillTooltip();
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
        pending=g.kind;closeHeroInfo();g.ghost=document.createElement('div');g.ghost.className='summon-drag-ghost unit-drag-ghost';g.ghost.setAttribute('aria-hidden','true');
        g.ghost.innerHTML=unitDragImage(g.kind);
        document.body.append(g.ghost);
      }
    }
    if(summonDrag?.active){e.preventDefault();summonDrag.x=e.clientX;summonDrag.y=e.clientY;updateSummonGhost();return;}
  }
  if(unitDrag&&unitDrag.pointer===e.pointerId){
    if(!unitDrag.moved&&Math.hypot(e.clientX-unitDrag.x,e.clientY-unitDrag.y)>7){
      unitDrag.moved=true;selectedUnit=unitDrag.id;pending=null;
      unitDrag.ghost=document.createElement('div');unitDrag.ghost.className='summon-drag-ghost unit-drag-ghost';unitDrag.ghost.setAttribute('aria-hidden','true');
      const unit=game.units.find(u=>u.id===unitDrag!.id);
      if(unit&&UNITS[unit.kind].hero)selectedHero=unit.id;
      unitDrag.ghost.innerHTML=unit?unitDragImage(unit.kind):'';document.body.append(unitDrag.ghost);
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
      if(destination?.kind==='grid'){if(!destination.bag&&destination.owner===null)game.note('장비를 받을 영웅을 선택해 주세요.');else game.buy(drag.shopIndex,{x:destination.x,y:destination.y},destination.bag?null:destination.owner);}
      else if(destination?.kind==='hero'){if(game.buy(drag.shopIndex,undefined,destination.hero.id))selectedHero=destination.hero.id;}
      else game.note('공용 가방이나 영웅 장비칸에 내려놓으면 구매합니다.');
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
  if(b.id==='game-start'){startRun('normal');return;}
  if(!run.active||sceneTransitioning)return;
  if(d.tab){closeHeroInfo();openTab(d.tab);}
  else if(b.id==='hero-prev')moveHeroCarousel(-1);
  else if(b.id==='hero-next')moveHeroCarousel(1);
  else if(d.heroSkillInfo){toggleHeroSkillTooltip(d.heroSkillInfo as UnitKind,Number(d.skillIndex??0));return;}
  else if(d.summon){
    closeHeroSkillTooltip();
    const kind=d.summon as UnitKind;
    if(UNITS[kind].hero&&kind!==centeredHeroKind){closeHeroInfo();centerHero(kind,'smooth',Array.from(el('heroes').querySelectorAll('[data-summon]')).indexOf(b));return;}
    if(!game.units.some(u=>u.id===selectedUnit&&u.kind===kind))selectedUnit=null;
    if(UNITS[kind].hero){
      const placed=game.heroes().find(u=>u.kind===kind);
      if(placed){selectedUnit=placed.id;selectedHero=placed.id;pending=null;selectedGear=null;heroInfo={kind,unitId:placed.id};game.note(`${UNITS[kind].name} · 이미 소환된 영웅입니다.`);}
      else {heroInfo={kind,unitId:null};pending=game.heroes().length<RULES.heroLimit?kind:null;game.note(pending?`${UNITS[kind].name} 선택 · 빈 칸을 누르면 무료 소환`:'영웅 정원이 가득합니다. 기본 능력치를 확인할 수 있습니다.');}
    } else {heroInfo={kind,unitId:null};pending=game.gold>=UNITS[kind].cost?kind:null;game.note(pending?`${UNITS[kind].name} 선택 · 빈 칸을 누르면 소환`:'골드가 부족합니다. 기본 능력치는 확인할 수 있습니다.');}
  }
  else if(b.id==='inventory-hero-stats'){
    const hero=game.heroes().find(u=>u.id===selectedHero);
    if(hero)heroInfo={kind:hero.kind,unitId:hero.id,anchor:'inventory'};
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
  const button=(e.target as HTMLElement).closest<HTMLButtonElement>('button');if(!button||button.disabled||sceneTransitioning)return;
  if(button.id==='dev-infinite-test'){startRun('infinite-test');return;}
  if(button.id==='dev-lobby'&&fromCamp){requestCampReturn();return;}
  if(button.id==='dev-lobby'){run.reset();clearBattleInteraction();renderLobby();refreshWaveAlert();refreshRunControls();void sceneTransition.go('lobby');return;}
  if(button.id==='dev-reset'){
    if(run.active)startRun(run.mode);else {resetBattleState();run.reset();renderLobby();refresh();}
    return;
  }
  if(!run.active&&button.id!=='dev-damage-numbers')return;
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

  refresh();checkRunFailure();
},{signal:events.signal});
window.addEventListener('blur',()=>{clearSummonDrag();if(heroGesture){heroGesture=null;centerHero(centeredHeroKind,'auto');}drag?.ghost?.remove();drag=null;pressedGear=null;shopFocus=null;unitDrag?.ghost?.remove();unitDrag=null;updateGearDrag();refreshLinks();},{signal:events.signal});
el('field-upgrade').addEventListener('click',()=>{const id=Number(el('field-upgrade').dataset.upgrade);game.upgrade(id);refresh();},{signal:events.signal});
el('hero-info').addEventListener('click',(e)=>{if((e.target as HTMLElement).closest('#close-hero-info'))closeHeroInfo();},{signal:events.signal});
el('hero-skill-tooltip').addEventListener('click',(e)=>{if((e.target as HTMLElement).closest('#close-hero-skill-tooltip'))closeHeroSkillTooltip();},{signal:events.signal});
document.addEventListener('keydown',(e)=>{if(e.key==='Escape'){closeHeroInfo();closeHeroSkillTooltip();}},{signal:events.signal});
window.addEventListener('resize',()=>{centerHero(centeredHeroKind,'auto');positionHeroInfo();positionHeroSkillTooltip();refreshFieldUpgrade();updateGearDrag();refreshLinks();},{signal:events.signal});
document.addEventListener('scroll',()=>{positionHeroInfo();positionHeroSkillTooltip();refreshFieldUpgrade();updateGearDrag();refreshLinks();},{capture:true,signal:events.signal});
// DOM이 갱신되어도 두 번 클릭한 블록 ID로 회전을 판정한다. 네이티브 dblclick 단독 입력도 지원.
el('dps-tab-defense').addEventListener('click',()=>{damageMeterMode='defense';showLastBoss=false;refreshDamageMeter();},{signal:events.signal});
el('dps-tab-boss').addEventListener('click',()=>{damageMeterMode='boss';showLastBoss=false;refreshDamageMeter();},{signal:events.signal});
el('dps-last-boss').addEventListener('click',()=>{showLastBoss=!showLastBoss;refreshDamageMeter();},{signal:events.signal});
el('boss-restart').addEventListener('click',()=>{if(!run.active||sceneTransitioning)return;bossReturnDelay=0;syncBossRoster(true);renderBossScreen();},{signal:events.signal});
el('boss-auto-skills').addEventListener('click',()=>{if(run.active&&currentScene==='boss'&&!sceneTransitioning)bossBattle.autoSkills=!bossBattle.autoSkills;bossBattleView.draw();},{signal:events.signal});
el('boss-commander-skill').addEventListener('click',()=>{if(run.active&&currentScene==='boss'&&!sceneTransitioning&&!combatPaused)bossBattle.commanderSkill();bossBattleView.draw();},{signal:events.signal});
el('boss-hero-skills').addEventListener('click',(e)=>{const button=(e.target as HTMLElement).closest<HTMLButtonElement>('[data-hero-skill]');if(button&&!button.disabled&&run.active&&currentScene==='boss'&&!sceneTransitioning&&!combatPaused)bossBattle.useHeroSkill(button.dataset.heroSkill!);bossBattleView.draw();},{signal:events.signal});
el('app').addEventListener('dblclick',(e)=>{
  const block=(e.target as HTMLElement).closest<HTMLElement>('[data-gear-id]');
  if(!block)return;
  e.preventDefault();const id=Number(block.dataset.gearId);
  if(lastRotation?.id===id&&performance.now()-lastRotation.time<400)return;
  rotateSelected(id);refresh();
},{signal:events.signal});

function formatRunTime(seconds:number):string {
  const whole=Math.max(0,Math.floor(seconds));return `${String(Math.floor(whole/60)).padStart(2,'0')}:${String(whole%60).padStart(2,'0')}`;
}
function renderLobby():void {
  const result=run.result;el('run-result').hidden=!result;
  el('game-start').innerHTML=`${result?'다시 게임 시작':'게임 시작'} <span>›</span>`;
  if(result){
    el('run-result-title').textContent=result.reason==='monster-limit'?'전장 방어 실패':result.reason==='boss-timeout'?'보스전 시간 초과':'보스전 패배';
    el('run-result-reason').textContent=FAILURE_TEXT[result.reason]+` · 제국 골드 +${lastEmpireReward}`;
    el('run-result-wave').textContent=String(result.wave);el('run-result-kills').textContent=String(result.kills);el('run-result-time').textContent=formatRunTime(result.seconds);
  }
}
function refreshBossTimer():void {
  const timer=el('boss-time-limit'),limited=run.mode==='normal',remaining=Math.max(0,RUN_LIMITS.bossSeconds-bossBattle.elapsed),seconds=Math.ceil(remaining-1e-8);
  timer.textContent=limited?`남은 시간 ${formatRunTime(seconds)}`:'시간 제한 없음';timer.classList.toggle('urgent',limited&&remaining<=10);
  timer.setAttribute('aria-label',limited?`보스전 남은 시간 ${seconds}초`:'무한웨이브 테스트 · 보스 시간 제한 없음');
}
function refreshRunControls():void {
  el('battle-shell-header').hidden=!run.active;
  el<HTMLButtonElement>('battle-return').disabled=sceneTransitioning;
  const enabled=run.active&&!sceneTransitioning;
  el('app').dataset.runMode=run.mode;el('app').dataset.runState=run.active?'playing':'lobby';el('dev-log').hidden=!run.active;
  el('run-mode-label').textContent=run.mode==='normal'?'일반전':'무한 테스트';
  el<HTMLButtonElement>('game-start').disabled=!assetsReady||sceneTransitioning;
  const infinite=el<HTMLButtonElement>('dev-infinite-test');infinite.disabled=!assetsReady||sceneTransitioning;infinite.setAttribute('aria-pressed',String(run.active&&run.mode==='infinite-test'));
  for(const id of ['dev-lobby','dev-boss-scene','dev-defense-scene','boss-restart','dev-gold','dev-anvils','dev-test-deploy','dev-next-wave'])el<HTMLButtonElement>(id).disabled=!enabled;
  el<HTMLButtonElement>('dev-test-gear').disabled=!enabled||!game.heroes().some(u=>u.id===selectedHero);
  el<HTMLButtonElement>('dev-reset').disabled=sceneTransitioning;
  const full=game.enemies.filter(e=>!e.bounty&&!e.named&&e.hp>0).length>=RULES.maxEnemies;
  document.querySelectorAll<HTMLButtonElement>('[data-monster-id]').forEach(button=>button.disabled=!enabled||(full&&!MONSTERS.find(d=>d.id===button.dataset.monsterId)?.named));
}
function clearBattleInteraction():void {
  clearSummonDrag();closeHeroInfo();closeHeroSkillTooltip();cancelAnimationFrame(heroAnimationFrame);heroAnimationFrame=0;heroNavigationQueue.length=0;heroGesture=null;
  drag?.ghost?.remove();unitDrag?.ghost?.remove();drag=null;unitDrag=null;pressedGear=null;shopFocus=null;
  clearTimeout(noticeTimer);el('center-notice').hidden=true;el('field-upgrade').hidden=true;updateGearDrag();refreshLinks();
}
function resetBattleState():void {
  lastEmpireReward=0;
  clearBattleInteraction();game.reset();combatPaused=false;bossDamageHistory.clear();defeatedBossEnemies.clear();damageMeterMode='defense';showLastBoss=false;activeBossWave=null;bossReturnDelay=0;bossBattle.autoSkills=true;bossTestMode=false;
  pending=null;selectedUnit=null;selectedHero=null;selectedGear=null;turns=0;lastGearTap=null;lastRotation=null;suppressClick=false;
  centeredHeroKind='tank';heroPhysicalIndex=heroKinds.length;heroCardsMarkup='';syncBossRoster(true,true);bossBattleView.draw();openTab('summon');refreshCombatControls();
}
function startRun(mode:RunMode):void {
  if(!assetsReady||sceneTransitioning)return;
  currentRunId=newBattleId();
  resetBattleState();run.start(mode);game.keepWaveMonsters=mode==='normal';renderLobby();refresh();
  if(currentScene!=='defense')void sceneTransition.go('defense');else window.scrollTo(0,0);
}
function finishRun(reason:RunFailure):void {
  if(!run.finish(reason,game.wave,game.kills+defeatedBossEnemies.size))return;
  const empireReward=trainingProgress.reward(game.wave,game.kills+defeatedBossEnemies.size);lastEmpireReward=empireReward;
  if(empireReward>0)game.note(`전투 종료 보상 · 제국 골드 +${empireReward}`);
  if(currentScene==='boss'){
    if(reason==='boss-timeout')bossBattle.result='defeat';
    bossDamageHistory.capture(bossBattle,bossEncounterWave);
  }
  const result=run.result!;
  try{campProgress.record({...result,id:currentRunId,empireGold:empireReward,finishedAt:Date.now()});}catch(error){console.error('전투 기록 저장 실패',error);}
  updateHud();clearBattleInteraction();refreshWaveAlert();renderLobby();refreshRunControls();
  if(fromCamp)location.replace(campPageUrl(location.href,currentRunId));else void sceneTransition.go('lobby');
}
function requestCampReturn():void {
  if(!run.active){location.replace(campPageUrl(location.href));return;}
  if(sceneTransitioning)return;
  pausedBeforeReturn=combatPaused;combatPaused=true;refreshCombatControls();
  el<HTMLDialogElement>('leave-battle-dialog').showModal();
}
el('battle-return').addEventListener('click',requestCampReturn,{signal:events.signal});
el('leave-battle-cancel').addEventListener('click',()=>el<HTMLDialogElement>('leave-battle-dialog').close(),{signal:events.signal});
el('leave-battle-confirm').addEventListener('click',()=>{
 returnPending=true;run.reset();clearBattleInteraction();location.replace(campPageUrl(location.href));
},{signal:events.signal});
el('leave-battle-dialog').addEventListener('close',()=>{if(!returnPending){combatPaused=pausedBeforeReturn;refreshCombatControls();}},{signal:events.signal});

function checkRunFailure():boolean {
  if(!run.active||currentScene==='lobby'||sceneTransitioning)return false;
  const reason=run.failure(currentScene==='defense'?{scene:'defense',monsters:game.enemies.filter(e=>e.hp>0).length}:{scene:'boss',result:bossBattle.result,elapsed:bossBattle.elapsed});
  if(!reason)return false;finishRun(reason);return true;
}

function renderBossScreen():void {
  el('boss-wave-label').textContent=`BOSS · WAVE ${game.wave}`;refreshBossTimer();
  bossBattleView.draw();refreshDamageMeter();
  const formation=game.units;
  el('boss-party').innerHTML=Array.from({length:32},(_,index)=>{
    const col=index%4,row=Math.floor(index/4);
    const unit=LANDSCAPE_BATTLE?(row>=1&&row<6?formation.find(u=>u.slot===(row-1)*4+3-col):undefined):(row>=2&&row<6?formation.find(u=>u.slot===(3-col)*4+row-2):undefined);
    if(!unit)return '<div class="boss-grid-cell" aria-hidden="true"></div>';
    const def=UNITS[unit.kind],color='#'+def.color.toString(16).padStart(6,'0');
    const weapon=unit.kind==='archer'?'<path d="M35 10 L40 24 L35 32" fill="none" stroke="#d2b47b" stroke-width="3"/>':unit.kind==='mage'||unit.kind==='healer'?`<path d="M36 35 V7" stroke="#ab8758" stroke-width="3"/><circle cx="36" cy="7" r="4" fill="${color}"/>`:'<path d="M35 28 L41 7" stroke="#d9e4e6" stroke-width="3"/>';
    const art=def.hero?heroImage(unit.kind):`<svg viewBox="0 0 48 48" aria-hidden="true"><ellipse cx="24" cy="36" rx="15" ry="5" fill="#0a171380"/><rect x="14" y="18" width="20" height="21" rx="4" fill="${color}" stroke="#172731" stroke-width="2"/><circle cx="24" cy="14" r="7" fill="#e1c7a5" stroke="#273943" stroke-width="2"/>${weapon}</svg>`;
    return `<div class="boss-grid-cell boss-grid-unit" aria-label="${row+1}행 ${col+1}열 ${def.name} ${unit.level}레벨">${art}<small>${def.hero?'영웅':`Lv.${unit.level}`} ${def.icon}</small></div>`;
  }).join('');
}
const sceneTransition=createSceneTransition({
  root:el('app'),initialScene:'lobby',
  onBusy(busy){
    sceneTransitioning=busy;refreshWaveAlert();
    refreshRunControls();if(busy)clearBattleInteraction();
  },
  onCovered(scene){
    if(currentScene==='boss'&&scene!=='boss')bossDamageHistory.capture(bossBattle,bossEncounterWave,true);
    currentScene=scene;if(scene==='boss'){syncBossRoster();renderBossScreen();}
    const label=scene==='boss'?'보스전':scene==='defense'?'웨이브전':'로비';
    el('scene-dev-status').textContent=`현재 화면: ${label}`;
    el('dev-boss-scene').setAttribute('aria-pressed',String(scene==='boss'));el('dev-defense-scene').setAttribute('aria-pressed',String(scene==='defense'));
    document.title=`Grid Defenders — ${label}`;
    if(scene==='defense'){refresh();if(tab==='summon')centerHero(centeredHeroKind,'auto');}else if(scene==='lobby')renderLobby();
    refreshRunControls();
  },
});

async function start():Promise<void> {
  const app=new Application();
  await app.init({width:DEFENSE_FIELD.width,height:DEFENSE_FIELD.height,background:'#172620',backgroundAlpha:LANDSCAPE_BATTLE?0:1,preference:'webgl',resolution:battleResolution(devicePixelRatio),autoDensity:true,antialias:true});
  el('battle-scene').append(app.canvas);app.canvas.setAttribute('aria-label','숲 순환 전장, 상단 정보와 아군 배치 영역');el('status').hidden=true;
  el('battlefield').style.setProperty('--field-top',`${DEFENSE_FIELD.top/DEFENSE_FIELD.height*100}%`);
  await loadHeroArt();
  const forestTexture=await Assets.load<Texture>(FOREST_TERRAIN_URL);
  const rangedTexture=await Assets.load<Texture>(`${import.meta.env.BASE_URL}assets/heroes/ranged-idle.png`);
  const meleeTexture=await Assets.load<Texture>(`${import.meta.env.BASE_URL}assets/heroes/melee-idle.png`);
  const fireTexture=await Assets.load<Texture>(FIRE_SHEET_URL);
  const swordTexture=await Assets.load<Texture>(SWORD_SHEET_URL);
  const bladeTexture=await Assets.load<Texture>(BLADE_SHEET_URL);
  const view=createDefenseView(app,game,(slot)=>{
    if(!run.active||unitDrag?.moved||summonDrag?.active)return;
    const unit=game.units.find(u=>u.slot===slot);
    if(unit){closeHeroInfo();selectedUnit=unit.id;pending=null;if(UNITS[unit.kind].hero){selectedHero=unit.id;selectedGear=null;openTab('gear');}else openTab('summon');game.note(`${UNITS[unit.kind].name} 선택 · 드래그로 이동·자리교체`);}
    else if(pending){if(game.summon(pending,slot)){selectedUnit=game.units.at(-1)!.id;if(UNITS[pending].hero){selectedHero=selectedUnit;pending=null;}closeHeroInfo();}}
    else game.note('먼저 아래에서 소환할 병사 또는 영웅을 선택하세요.');
    refresh();
  },rangedTexture,meleeTexture,fireTexture,swordTexture,bladeTexture,()=>showDamageNumbers,{top:DEFENSE_FIELD.top,terrain:LANDSCAPE_BATTLE?undefined:forestTexture});
  let lastRevision=-1,hudClock=0,meterClock=0;
  renderMonsterTools();
  renderRecipeTree();assetsReady=true;document.title='Grid Defenders — 로비';el('lobby-hint').textContent='병사와 영웅을 배치하고 몬스터를 막아내세요.';renderLobby();
  refresh();
  app.ticker.add(ticker=>{
    if(sceneTransitioning||!run.active||currentScene==='lobby')return;
    if(checkRunFailure())return;
    if(activeBossWave!==null&&(!game.bossPending||activeBossWave!==game.wave)){activeBossWave=null;bossReturnDelay=0;}
    if(currentScene==='boss'){
      const dt=Math.min(ticker.deltaMS/1000,.1);stepCombat(dt,game.speed,seconds=>{
        if(!run.active)return;
        const step=bossBattle.result==='fighting'?run.bossStep(seconds,bossBattle.elapsed):seconds,before=bossBattle.elapsed;
        if(step>0)bossBattle.tick(step);
        for(const enemy of bossBattle.actors)if(enemy.side==='enemy'&&enemy.hp<=0)defeatedBossEnemies.add(`${bossBattle.encounter}:${enemy.id}`);
        run.advance(bossBattle.elapsed-before);checkRunFailure();
      },combatPaused);
      if(!run.active)return;
      bossDamageHistory.capture(bossBattle,bossEncounterWave);bossBattleView.draw();refreshBossTimer();
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
    const dt=Math.min(ticker.deltaMS/1000,0.1);stepCombat(dt,game.speed,(_seconds,realSeconds)=>{
      if(!run.active)return;const before=game.elapsed;game.tick(realSeconds);run.advance(game.elapsed-before);checkRunFailure();
    },combatPaused);
    if(!run.active)return;
    refreshWaveAlert();
    const canSummon=pending!==null&&!summonReason(pending);
    view.draw(selectedUnit,canSummon,unitDrag?.moved?{id:unitDrag.id,slot:canvasSlot(unitDrag.x,unitDrag.y)}:undefined);
    hudClock+=dt;if(hudClock>0.15){hudClock=0;updateHud();refreshFieldUpgrade();refreshLogs();}
    if(lastRevision!==game.revision&&!drag&&!unitDrag&&!summonDrag){lastRevision=game.revision;refresh();}
  });
  const automaticMode=launchMode(location.search);if(automaticMode)startRun(automaticMode);
  if(import.meta.hot)import.meta.hot.dispose(()=>{events.abort();clearSummonDrag();sceneTransition.dispose();cancelAnimationFrame(heroScrollFrame);cancelAnimationFrame(heroAnimationFrame);heroGesture=null;clearTimeout(noticeTimer);drag?.ghost?.remove();drag=null;updateGearDrag();unitDrag?.ghost?.remove();app.destroy(true,{children:true});});
}
void start().catch((error:unknown)=>{el('battle-shell-header').hidden=false;el<HTMLButtonElement>('battle-return').disabled=false;el('status').hidden=false;el('status').textContent='전장을 시작하지 못했습니다. 브라우저 그래픽 지원을 확인해 주세요.';el('lobby-hint').textContent='전장을 불러오지 못했습니다. 새로고침해 주세요.';console.error(error);});

/** Shared live controls used by the landscape presentation. */
export const liveBattle={game,get ready(){return assetsReady;},get hero(){return selectedHero;},get scene(){return currentScene;},get active(){return run.active;},refresh,
 select(kind:UnitKind){const reason=summonReason(kind);if(reason){game.note(reason);return false;}pending=kind;refresh();return true;},
 selectHero(id:number){if(game.heroes().some(hero=>hero.id===id)){selectedHero=id;selectedUnit=id;refresh();}},
 deploy(kind:UnitKind,slot:number){const reason=summonReason(kind);if(reason){game.note(reason);return false;}const ok=game.summon(kind,slot);if(ok){selectedUnit=game.units.at(-1)!.id;if(UNITS[kind].hero)selectedHero=selectedUnit;pending=null;}refresh();return ok;},
 pause(){el('pause').click();},speed(){el('speed').click();},home:requestCampReturn};

import {heroImage,sheetHero,assassinArt,assassinSkillIcon} from './heroArt';
import {skillFramePlacement} from './skillVisual';
import {ASSASSIN,assassinFrame} from './assassinCombat';
import {BROKEN_SHIELD_SVG,effectiveArmor} from './armorBreak';
import {BLADE_SKILL,bladeFrame,bladePlacement,BLADE_SHEET_URL,BLADE_ALPHA_MATRIX} from './bladeSkill';
import {swordVisuals,SWORD_SHEET_URL,SWORD_ALPHA_MATRIX} from './swordAttack';
import {FIRE_SKILL,fireFrame,firePlacement,FIRE_SHEET_URL,FIRE_ALPHA_MATRIX} from './fireSkill';
import { BossBattle, type BossActor } from './bossBattle';
import { UNITS, type UnitKind } from './defenseConfig';
import { iceProjectileShape, iceBurstShape } from './iceEffects';
import {BOSS_FIELD} from './bossField';
import {soldierImage} from './soldierArt';

function art(a:BossActor,battle?:BossBattle):string {
  if(battle&&a.kind==='assassin'){const action=battle.assassinActions.find(c=>c.sourceId===a.id&&!c.cancelled);if(action){const frame=assassinArt(action.kind==='basic'?'basic':'boss',assassinFrame(action));if(frame)return `<svg class="boss-assassin-frame" viewBox="0 0 ${frame.contentWidth} ${frame.contentHeight}" preserveAspectRatio="xMidYMax meet" overflow="visible" aria-hidden="true"><image href="${frame.url}" x="${-frame.padding}" y="${-frame.padding}" width="${frame.texture.width}" height="${frame.texture.height}"/></svg>`;}}
  if(a.kind in UNITS&&UNITS[a.kind as UnitKind].hero){const target=battle?.target(a),walking=!!target&&Math.hypot(target.x-a.x,target.y-a.y)>a.range;return heroImage(a.kind as UnitKind,walking?'walk':a.cooldown>1/a.rate-.2?'attack':'idle',Math.floor((battle?.elapsed??0)*(a.kind==='melee'&&!walking?5:8)));}
  if(a.kind==='ranged'||a.kind==='melee')return `<img src="${import.meta.env.BASE_URL}assets/heroes/${a.kind}-idle.png" alt="" draggable="false">`;
  if(a.kind==='boss')return '<span class="boss-test-monster boss-test-chief">♛<i>◆</i></span>';
  if(a.kind==='retainer')return `<span class="boss-test-monster ${a.defenseType}">♜<i>◆</i></span>`;
  const soldier=soldierImage(a.kind);if(soldier)return soldier;
  const color='#'+UNITS[a.kind].color.toString(16).padStart(6,'0');
  const weapon=a.kind==='archer'?'<path d="M35 10 L40 24 L35 32" fill="none" stroke="#d2b47b" stroke-width="3"/>':(a.kind==='mage'||a.kind==='healer')?`<path d="M36 35 V7" stroke="#ab8758" stroke-width="3"/><circle cx="36" cy="7" r="4" fill="${color}"/>`:'<path d="M35 28 L41 7" stroke="#d9e4e6" stroke-width="3"/>';
  return `<svg viewBox="0 0 48 48" aria-hidden="true"><ellipse cx="24" cy="36" rx="15" ry="5" fill="#0a171380"/><rect x="14" y="18" width="20" height="21" rx="4" fill="${color}" stroke="#172731" stroke-width="2"/><circle cx="24" cy="14" r="7" fill="#e1c7a5" stroke="#273943" stroke-width="2"/>${weapon}</svg>`;
}
function updateSkillFill(card:HTMLElement,remaining:number,duration:number,enabled:boolean,ready:boolean):void {
  const state=!enabled?'blocked':remaining>0?'cooldown':ready?'ready':'blocked';
  const progress=state==='blocked'?0:state==='ready'?1:Math.max(0,Math.min(1,1-remaining/duration));
  card.dataset.skillState=state;
  card.style.setProperty('--skill-fill',`${(progress*100).toFixed(2)}%`);
  card.setAttribute('aria-disabled',String(state!=='ready'));
}
export function createBossBattleView(root:HTMLElement,status:HTMLElement,battle:BossBattle,showDamageNumbers:()=>boolean=()=>true,paused:()=>boolean=()=>false){
  const nodes=new Map<string,HTMLElement>();
  const skillRoot=document.getElementById('boss-hero-skills')!;let heroSignature='';
  const trails=document.createElementNS('http://www.w3.org/2000/svg','svg');
  const viewBox=`0 0 ${BOSS_FIELD.width} ${BOSS_FIELD.height}`;
  root.closest('.boss-arena')?.querySelector<HTMLElement>('.boss-allied-side')?.style.setProperty('width',`${BOSS_FIELD.alliesWidth/BOSS_FIELD.width*100}%`);
  trails.setAttribute('viewBox',viewBox);trails.classList.add('boss-hit-trails');
  root.append(trails);
  const assassinEffects=document.createElementNS('http://www.w3.org/2000/svg','svg');
  assassinEffects.setAttribute('viewBox',viewBox);assassinEffects.classList.add('boss-hit-trails','boss-assassin-effects');root.append(assassinEffects);
  return {draw(){
    const stopped=paused();
    const current=new Set(battle.actors.map(a=>a.id));
    for(const [id,node] of nodes)if(!current.has(id)){node.remove();nodes.delete(id);}
    for(const actor of battle.actors){
      let node=nodes.get(actor.id);
      if(node&&node.dataset.kind!==actor.kind){node.remove();nodes.delete(actor.id);node=undefined;}
      if(!node){
        node=document.createElement('div');node.className=`boss-fighter ${actor.side} ${actor.kind}`;
        node.dataset.bossActor=actor.id;node.dataset.kind=actor.kind;
        node.innerHTML=`<div class="boss-fighter-art">${art(actor)}</div><div class="boss-fighter-hp"><i></i></div><span class="boss-armor-break" hidden></span><small></small>`;
        root.append(node);nodes.set(actor.id,node);
      }
      node.hidden=actor.hp<=0;
      const heroKind=actor.kind in UNITS?actor.kind as UnitKind:null;
      node.classList.toggle('sheet-hero',!!heroKind&&sheetHero(heroKind));
      node.classList.toggle('assassin-motion',battle.assassinActions.some(a=>a.sourceId===actor.id&&!a.cancelled));
      const nextArt=art(actor,battle),artNode=node.querySelector<HTMLElement>('.boss-fighter-art')!;
      if(artNode.dataset.frameArt!==nextArt){artNode.innerHTML=nextArt;artNode.dataset.frameArt=nextArt;}
      const broken=node.querySelector<HTMLElement>('.boss-armor-break')!;broken.hidden=!(actor.armorBreakRemaining!>0);
      if(!broken.hidden){if(!broken.children.length)broken.innerHTML=BROKEN_SHIELD_SVG;broken.title=`방어력 30% 감소 · ${actor.armorBreakRemaining!.toFixed(1)}초 · 물리 ${effectiveArmor(actor,'physical').toFixed(1)} / 마법 ${effectiveArmor(actor,'magic').toFixed(1)}`;}

      node.querySelector('small')!.textContent=actor.side==='enemy'?actor.name:`Lv.${actor.level??1} ${UNITS[actor.kind as keyof typeof UNITS]?.icon??''}`;
      node.style.left=`${actor.x/BOSS_FIELD.width*100}%`;node.style.top=`${actor.y/BOSS_FIELD.height*100}%`;
      node.style.width=`${(actor.kind==='boss'?90:actor.kind==='retainer'?65:52)/BOSS_FIELD.width*100}%`;
      node.classList.toggle('attacking',battle.hits.some(h=>h.from===actor.id));
      node.setAttribute('aria-label',`${actor.name} Lv.${actor.level??1} 체력 ${Math.ceil(actor.hp)}/${actor.maxHp} 공격 ${actor.attack} 사거리 ${actor.range}`);
      node.querySelector<HTMLElement>('.boss-fighter-hp i')!.style.width=`${actor.hp/actor.maxHp*100}%`;
    }
    trails.innerHTML=`<defs><filter id="boss-fire-alpha" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="${FIRE_ALPHA_MATRIX.join(' ')}"/></filter></defs>`+battle.hits.map(h=>{
      const from=battle.actors.find(a=>a.id===h.from)!;
      return `<g opacity="${Math.min(1,h.life/.15)}">${h.ice||h.sword?'':`<path d="M${from.x} ${from.y} L${h.x} ${h.y}" stroke="${h.magic?'#8bdeff':'#ffe3a1'}" stroke-width="${h.magic?4:2}"/>`}<circle cx="${h.x}" cy="${h.y}" r="${h.magic?14:6}" fill="${h.sword?'none':h.magic?'#8bdeff88':'#ffe3a188'}"/>${showDamageNumbers()?`<text class="boss-damage-number" x="${h.x}" y="${h.y-35-(.32-h.life)*70}" text-anchor="middle" fill="${h.critical?'#ffd15c':'#fff0bf'}" font-size="22" stroke="#14201d" stroke-width="3" paint-order="stroke">${h.critical?'치명 ':''}${Math.round(h.damage)}</text>`:''}</g>`;
    }).join('')+battle.iceProjectiles.map(p=>{
      const {trail,crystal}=iceProjectileShape(p);
      return `<g class="boss-ice-projectile"><path d="M${trail[0]} ${trail[1]} L${p.x} ${p.y}" stroke="#62baff" stroke-opacity=".25" stroke-width="5"/><circle cx="${p.x}" cy="${p.y}" r="10" fill="#66ccff" fill-opacity=".14"/><polygon points="${crystal.join(' ')}" fill="#80dfff" stroke="#e8fbff" stroke-width="1"/></g>`;
    }).join('')+battle.iceBursts.map(b=>{
      const {radius,alpha,shards}=iceBurstShape(b);
      return `<g class="boss-ice-burst"><circle cx="${b.x}" cy="${b.y}" r="${radius}" fill="#87dcff" fill-opacity="${alpha*.2}" stroke="#b9efff" stroke-opacity="${alpha}" stroke-width="2"/>${shards.map((points,i)=>`<polygon points="${points.join(' ')}" fill="${i%2?'#d9faff':'#69c7ff'}" opacity="${alpha}"/>`).join('')}</g>`;
    }).join('');
    trails.innerHTML+=battle.fireCasts.map(cast=>{
      const f=fireFrame(cast),p=firePlacement(cast),x=p.x-p.width*p.anchorX,y=p.y-p.height*p.anchorY;
      return `<g class="boss-fire-skill" transform="rotate(${p.rotation*180/Math.PI} ${p.x} ${p.y})" filter="url(#boss-fire-alpha)"><svg x="${x}" y="${y}" width="${p.width}" height="${p.height}" viewBox="${f.x} ${f.y} ${f.width} ${f.height}" preserveAspectRatio="none" overflow="hidden"><image href="${FIRE_SHEET_URL}" width="1536" height="1024"/></svg></g>`;
    }).join('');
    trails.innerHTML+=`<defs><filter id="boss-sword-alpha" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="${SWORD_ALPHA_MATRIX.join(' ')}"/></filter></defs>`+battle.swordAttacks.flatMap(swing=>{
      const source=battle.actors.find(a=>a.id===swing.sourceId&&a.hp>0);if(!source)return [];
      return swordVisuals(swing,source.x+14,source.y-30,2).map(v=>{
        const f=v.frame;
        return `<g class="boss-sword-${v.part}" transform="rotate(${v.rotation*180/Math.PI} ${v.x} ${v.y})" opacity="${v.alpha}" filter="url(#boss-sword-alpha)"><svg x="${v.x-v.width/2}" y="${v.y-v.height/2}" width="${v.width}" height="${v.height}" viewBox="${f.x} ${f.y} ${f.width} ${f.height}" preserveAspectRatio="none" overflow="hidden"><image href="${SWORD_SHEET_URL}" width="1536" height="1024"/></svg></g>`;
      });
    }).join('');
    trails.innerHTML+=`<defs><filter id="boss-blade-alpha" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="${BLADE_ALPHA_MATRIX.join(' ')}"/></filter></defs>`+battle.bladeCasts.map(cast=>{
      const f=bladeFrame(cast),p=bladePlacement(cast);
      return `<g class="boss-blade-skill" filter="url(#boss-blade-alpha)"><svg x="${p.x-p.width*p.anchorX}" y="${p.y-p.height*p.anchorY}" width="${p.width}" height="${p.height}" viewBox="${f.x} ${f.y} ${f.width} ${f.height}" preserveAspectRatio="none" overflow="hidden"><image href="${BLADE_SHEET_URL}" width="1536" height="1024"/></svg></g>`;
    }).join('');
    assassinEffects.innerHTML=battle.assassinImpacts.map(impact=>{const image=assassinArt('impact',impact.kind);if(!image)return '';const p=skillFramePlacement(image,impact.x,impact.y,70);return `<image class="boss-assassin-impact" href="${image.url}" x="${p.x-p.width*p.anchorX}" y="${p.y-p.height*p.anchorY}" width="${p.width}" height="${p.height}" opacity="${Math.min(1,impact.life/.1)}"/>`;}).join('');
    const heroes=battle.actors.filter(a=>a.side==='ally'&&UNITS[a.kind as keyof typeof UNITS]?.hero);
    const signature=heroes.map(h=>`${h.id}:${h.kind}`).join('|');
    if(signature!==heroSignature||!skillRoot.children.length){
      heroSignature=signature;
      skillRoot.innerHTML=heroes.length?heroes.map(h=>{
        const def=UNITS[h.kind as keyof typeof UNITS],hasSkill=h.kind==='ranged'||h.kind==='melee'||h.kind==='assassin';
        const portrait=heroImage(h.kind as UnitKind);
        return `<div class="boss-hero-skill-row" data-skill-hero="${h.id}"><div class="boss-skill-hero-card">${portrait}<b>${def.name}</b><small>웨이브 편성 연동</small></div><div class="boss-skill-column"><div class="boss-skill boss-basic-skill" data-basic-delay><b>1 · 평타</b><span>자동 공격 · 공속 기준</span><strong></strong></div>${hasSkill?`<button class="boss-skill" data-hero-skill="${h.id}">${h.kind==='assassin'?`<i class="boss-assassin-skill-icon">${assassinSkillIcon('boss')}</i>`:''}<b>2 · ${h.kind==='assassin'?'삼연참·돌진':h.kind==='melee'?'연속 검격':'화염 기둥'}</b><span>${h.kind==='assassin'?'35% ×3 + 250% · 경로 / 방어 -30%':h.kind==='melee'?'75% ×5 + 225% · 범위':'기본 피해 ×3 · 범위 공격'}</span><strong></strong></button>`:`<div class="boss-skill boss-skill-empty" aria-label="${def.name} 스킬 미배정"></div>`}</div></div>`;
      }).join(''):'<p class="boss-scene-note">웨이브전에서 영웅을 배치하세요.</p>';
    }
    for(const hero of heroes){
      const row=skillRoot.querySelector<HTMLElement>(`[data-skill-hero="${hero.id}"]`)!,basic=row.querySelector<HTMLElement>('[data-basic-delay]')!;
      const alive=hero.hp>0,fighting=battle.result==='fighting'&&!stopped,target=alive&&battle.target(hero),ready=!!target&&Math.hypot(hero.x-target.x,hero.y-target.y)<=hero.range;
      row.querySelector('.boss-skill-hero-card')!.classList.toggle('hero-absent',!alive);
      basic.querySelector('strong')!.textContent=!alive?'전투 불가':stopped?'일시정지':!fighting?'전투 종료':`공격 딜레이 ${hero.cooldown.toFixed(1)}초 / ${(1/hero.rate).toFixed(2)}초`;
      updateSkillFill(basic,hero.cooldown,1/hero.rate,fighting&&alive,ready);
      const skill=row.querySelector<HTMLButtonElement>('[data-hero-skill]');
      if(skill){
        const cooldown=battle.skillCooldown(hero.id),canUse=!stopped&&battle.canHeroSkill(hero.id),duration=hero.kind==='assassin'?ASSASSIN.bossCooldown:hero.kind==='melee'?BLADE_SKILL.cooldown:FIRE_SKILL.cooldown;skill.disabled=!canUse;
        skill.querySelector('strong')!.textContent=!alive?'전투 불가':stopped?'일시정지':!fighting?'전투 종료':cooldown>0?`재사용 ${cooldown.toFixed(1)}초 / ${duration}초`:canUse?`사용 가능 · 쿨타임 ${duration}초`:'사거리까지 접근 중';
        updateSkillFill(skill,cooldown,duration,fighting&&alive,canUse);
      }
    }
    const auto=document.getElementById('boss-auto-skills')!;
    auto.textContent=`스킬 자동 ${battle.autoSkills?'ON':'OFF'}`;auto.setAttribute('aria-pressed',String(battle.autoSkills));
    const commander=document.getElementById('boss-commander-skill') as HTMLButtonElement;
    commander.disabled=stopped||battle.result!=='fighting'||!battle.actors.some(a=>a.side==='ally'&&a.hp>0)||battle.commanderCooldown>0;
    commander.classList.toggle('buff-active',battle.commanderBuff>0);
    document.getElementById('commander-skill-cooldown')!.textContent=stopped?'일시정지':battle.commanderBuff>0?`강화 ${battle.commanderBuff.toFixed(1)}초 · 재사용 ${battle.commanderCooldown.toFixed(1)}초`:battle.commanderCooldown>0?`재사용 ${battle.commanderCooldown.toFixed(1)}초`:'사용 가능 · 쿨타임 15초';
    const fighting=battle.result==='fighting'&&!stopped;
    updateSkillFill(commander,battle.commanderCooldown,15,fighting&&battle.actors.some(a=>a.side==='ally'&&a.hp>0),!commander.disabled);
    const allies=battle.actors.filter(a=>a.side==='ally'&&a.hp>0).length;
    const enemies=battle.actors.filter(a=>a.side==='enemy'&&a.hp>0).length;
    const text=!battle.actors.some(a=>a.side==='ally')?'웨이브전에서 아군을 먼저 배치하세요':battle.result==='victory'?'시험 승리':battle.result==='defeat'?'시험 패배':stopped?'일시정지':'전열 우선 교전';
    status.textContent=`${text} · 아군 ${allies} / 적 ${enemies} · ${Math.floor(battle.elapsed)}초`;
  }};
}

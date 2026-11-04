import {FIRE_SKILL,fireFrame,firePlacement,FIRE_SHEET_URL,FIRE_ALPHA_MATRIX} from './fireSkill';
import { BossBattle, type BossActor } from './bossBattle';
import { UNITS } from './defenseConfig';
import { iceProjectileShape, iceBurstShape } from './iceEffects';

function art(a:BossActor):string {
  if(a.kind==='ranged'||a.kind==='melee')return `<img src="${import.meta.env.BASE_URL}assets/heroes/${a.kind}-idle.png" alt="" draggable="false">`;
  if(a.kind==='boss')return '<span class="boss-test-monster boss-test-chief">♛<i>◆</i></span>';
  if(a.kind==='retainer')return `<span class="boss-test-monster ${a.defenseType}">♜<i>◆</i></span>`;
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
export function createBossBattleView(root:HTMLElement,status:HTMLElement,battle:BossBattle){
  const nodes=new Map<string,HTMLElement>();
  const trails=document.createElementNS('http://www.w3.org/2000/svg','svg');
  trails.setAttribute('viewBox','0 0 1000 562.5');trails.classList.add('boss-hit-trails');
  root.append(trails);
  return {draw(){
    const current=new Set(battle.actors.map(a=>a.id));
    for(const [id,node] of nodes)if(!current.has(id)){node.remove();nodes.delete(id);}
    for(const actor of battle.actors){
      let node=nodes.get(actor.id);
      if(node&&node.dataset.kind!==actor.kind){node.remove();nodes.delete(actor.id);node=undefined;}
      if(!node){
        node=document.createElement('div');node.className=`boss-fighter ${actor.side} ${actor.kind}`;
        node.dataset.bossActor=actor.id;node.dataset.kind=actor.kind;
        node.innerHTML=`<div class="boss-fighter-art">${art(actor)}</div><div class="boss-fighter-hp"><i></i></div><small></small>`;
        root.append(node);nodes.set(actor.id,node);
      }
      node.hidden=actor.hp<=0;
      node.querySelector('small')!.textContent=actor.side==='enemy'?actor.name:`Lv.${actor.level??1} ${UNITS[actor.kind as keyof typeof UNITS]?.icon??''}`;
      node.style.left=`${actor.x/10}%`;node.style.top=`${actor.y/5.625}%`;
      node.classList.toggle('attacking',battle.hits.some(h=>h.from===actor.id));
      node.setAttribute('aria-label',`${actor.name} Lv.${actor.level??1} 체력 ${Math.ceil(actor.hp)}/${actor.maxHp} 공격 ${actor.attack} 사거리 ${actor.range}`);
      node.querySelector<HTMLElement>('.boss-fighter-hp i')!.style.width=`${actor.hp/actor.maxHp*100}%`;
    }
    trails.innerHTML=`<defs><filter id="boss-fire-alpha" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="${FIRE_ALPHA_MATRIX.join(' ')}"/></filter></defs>`+battle.hits.map(h=>{
      const from=battle.actors.find(a=>a.id===h.from)!;
      return `<g opacity="${Math.min(1,h.life/.15)}">${h.ice?'':`<path d="M${from.x} ${from.y} L${h.x} ${h.y}" stroke="${h.magic?'#8bdeff':'#ffe3a1'}" stroke-width="${h.magic?4:2}"/>`}<circle cx="${h.x}" cy="${h.y}" r="${h.magic?14:6}" fill="${h.magic?'#8bdeff88':'#ffe3a188'}"/><text x="${h.x}" y="${h.y-35-(.32-h.life)*70}" text-anchor="middle" fill="#fff0bf" font-size="22" stroke="#14201d" stroke-width="3" paint-order="stroke">${Math.round(h.damage)}</text></g>`;
    }).join('')+battle.iceProjectiles.map(p=>{
      const {trail,crystal}=iceProjectileShape(p);
      return `<g class="boss-ice-projectile"><path d="M${trail[0]} ${trail[1]} L${p.x} ${p.y}" stroke="#62baff" stroke-opacity=".25" stroke-width="5"/><circle cx="${p.x}" cy="${p.y}" r="10" fill="#66ccff" fill-opacity=".14"/><polygon points="${crystal.join(' ')}" fill="#80dfff" stroke="#e8fbff" stroke-width="1"/></g>`;
    }).join('')+battle.iceBursts.map(b=>{
      const {radius,alpha,shards}=iceBurstShape(b);
      return `<g class="boss-ice-burst"><circle cx="${b.x}" cy="${b.y}" r="${radius}" fill="#87dcff" fill-opacity="${alpha*.2}" stroke="#b9efff" stroke-opacity="${alpha}" stroke-width="2"/>${shards.map((points,i)=>`<polygon points="${points.join(' ')}" fill="${i%2?'#d9faff':'#69c7ff'}" opacity="${alpha}"/>`).join('')}</g>`;
    }).join('');
    trails.innerHTML+=battle.fireCasts.map(cast=>{
      const f=fireFrame(cast),p=firePlacement(cast),x=p.x-p.width/2,y=p.y-p.height*p.anchorY;
      return `<g class="boss-fire-skill" transform="rotate(${p.rotation*180/Math.PI} ${p.x} ${p.y})" filter="url(#boss-fire-alpha)"><svg x="${x}" y="${y}" width="${p.width}" height="${p.height}" viewBox="${f.x} ${f.y} ${f.width} ${f.height}" preserveAspectRatio="none" overflow="hidden"><image href="${FIRE_SHEET_URL}" width="1536" height="1024"/></svg></g>`;
    }).join('');
    document.querySelector('.boss-skill-hero-card')!.classList.toggle('hero-absent',!battle.actors.some(a=>a.kind==='ranged'));
    document.querySelector('.boss-skill-hero-card small')!.textContent=battle.actors.some(a=>a.kind==='ranged')?'웨이브 편성 연동':'웨이브전 미배치';
    const auto=document.getElementById('boss-auto-skills')!;
    auto.textContent=`스킬 자동 ${battle.autoSkills?'ON':'OFF'}`;auto.setAttribute('aria-pressed',String(battle.autoSkills));
    const commander=document.getElementById('boss-commander-skill') as HTMLButtonElement;
    commander.disabled=battle.result!=='fighting'||!battle.actors.some(a=>a.side==='ally'&&a.hp>0)||battle.commanderCooldown>0;
    commander.classList.toggle('buff-active',battle.commanderBuff>0);
    document.getElementById('commander-skill-cooldown')!.textContent=battle.commanderBuff>0?`강화 ${battle.commanderBuff.toFixed(1)}초 · 재사용 ${battle.commanderCooldown.toFixed(1)}초`:battle.commanderCooldown>0?`재사용 ${battle.commanderCooldown.toFixed(1)}초`:'사용 가능 · 쿨타임 15초';
    const hero=battle.hero();
    document.getElementById('hero-basic-cooldown')!.textContent=!hero?'전투 불가':battle.result!=='fighting'?'전투 종료':`공격 딜레이 ${hero.cooldown.toFixed(1)}초 / ${(1/hero.rate).toFixed(1)}초`;
    const triple=document.getElementById('boss-triple-skill') as HTMLButtonElement;
    triple.disabled=!battle.canTriple();
    document.getElementById('hero-triple-cooldown')!.textContent=!hero?'전투 불가':battle.result!=='fighting'?'전투 종료':battle.heroSkillCooldown>0?`재사용 ${battle.heroSkillCooldown.toFixed(1)}초`:battle.canTriple()?'사용 가능':'사거리까지 접근 중';
    const fighting=battle.result==='fighting';
    const target=hero&&battle.target(hero);
    const basicReady=!!hero&&!!target&&Math.hypot(hero.x-target.x,hero.y-target.y)<=hero.range;
    updateSkillFill(commander,battle.commanderCooldown,15,fighting&&battle.actors.some(a=>a.side==='ally'&&a.hp>0),!commander.disabled);
    updateSkillFill(document.getElementById('boss-basic-skill')!,hero?.cooldown??0,hero?1/hero.rate:1,fighting&&!!hero,basicReady);
    updateSkillFill(triple,battle.heroSkillCooldown,FIRE_SKILL.cooldown,fighting&&!!hero,battle.canTriple());
    const allies=battle.actors.filter(a=>a.side==='ally'&&a.hp>0).length;
    const enemies=battle.actors.filter(a=>a.side==='enemy'&&a.hp>0).length;
    const text=!battle.actors.some(a=>a.side==='ally')?'웨이브전에서 아군을 먼저 배치하세요':battle.result==='victory'?'시험 승리':battle.result==='defeat'?'시험 패배':'전열 우선 교전';
    status.textContent=`${text} · 아군 ${allies} / 적 ${enemies} · ${Math.floor(battle.elapsed)}초`;
  }};
}

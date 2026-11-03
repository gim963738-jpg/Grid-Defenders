import { BossBattle, type BossActor } from './bossBattle';
import { UNITS } from './defenseConfig';

function art(a:BossActor):string {
  if(a.kind==='ranged')return `<img src="${import.meta.env.BASE_URL}assets/heroes/ranged-idle.png" alt="" draggable="false">`;
  if(a.kind==='boss')return '<span class="boss-test-monster boss-test-chief">♛<i>◆</i></span>';
  if(a.kind==='retainer')return `<span class="boss-test-monster ${a.defenseType}">♜<i>◆</i></span>`;
  const color='#'+UNITS[a.kind].color.toString(16).padStart(6,'0');
  const weapon=a.kind==='archer'?'<path d="M35 10 L40 24 L35 32" fill="none" stroke="#d2b47b" stroke-width="3"/>':a.kind==='mage'?`<path d="M36 35 V7" stroke="#ab8758" stroke-width="3"/><circle cx="36" cy="7" r="4" fill="${color}"/>`:'<path d="M35 28 L41 7" stroke="#d9e4e6" stroke-width="3"/>';
  return `<svg viewBox="0 0 48 48" aria-hidden="true"><ellipse cx="24" cy="36" rx="15" ry="5" fill="#0a171380"/><rect x="14" y="18" width="20" height="21" rx="4" fill="${color}" stroke="#172731" stroke-width="2"/><circle cx="24" cy="14" r="7" fill="#e1c7a5" stroke="#273943" stroke-width="2"/>${weapon}</svg>`;
}
export function createBossBattleView(root:HTMLElement,status:HTMLElement,battle:BossBattle){
  const nodes=new Map<string,HTMLElement>();
  const trails=document.createElementNS('http://www.w3.org/2000/svg','svg');
  trails.setAttribute('viewBox','0 0 1000 562.5');trails.classList.add('boss-hit-trails');
  root.append(trails);
  for(const actor of battle.actors){
    const node=document.createElement('div');node.className=`boss-fighter ${actor.side} ${actor.kind}`;
    node.dataset.bossActor=actor.id;
    node.innerHTML=`<div class="boss-fighter-art">${art(actor)}</div><div class="boss-fighter-hp"><i></i></div><small>${actor.side==='enemy'?actor.name:UNITS[actor.kind as keyof typeof UNITS]?.icon??''}</small>`;
    root.append(node);nodes.set(actor.id,node);
  }
  return {draw(){
    for(const actor of battle.actors){
      const node=nodes.get(actor.id)!;node.hidden=actor.hp<=0;
      node.style.left=`${actor.x/10}%`;node.style.top=`${actor.y/5.625}%`;
      node.classList.toggle('attacking',battle.hits.some(h=>h.from===actor.id));
      node.setAttribute('aria-label',`${actor.name} 체력 ${Math.ceil(actor.hp)}/${actor.maxHp}`);
      node.querySelector<HTMLElement>('.boss-fighter-hp i')!.style.width=`${actor.hp/actor.maxHp*100}%`;
    }
    trails.innerHTML=battle.hits.map(h=>{
      const from=battle.actors.find(a=>a.id===h.from)!;
      return `<g opacity="${Math.min(1,h.life/.15)}"><path d="M${from.x} ${from.y} L${h.x} ${h.y}" stroke="${h.magic?'#8bdeff':'#ffe3a1'}" stroke-width="${h.magic?4:2}"/><circle cx="${h.x}" cy="${h.y}" r="${h.magic?14:6}" fill="${h.magic?'#8bdeff88':'#ffe3a188'}"/><text x="${h.x}" y="${h.y-35-(.32-h.life)*70}" text-anchor="middle" fill="#fff0bf" font-size="22" stroke="#14201d" stroke-width="3" paint-order="stroke">${Math.round(h.damage)}</text></g>`;
    }).join('');
    const commander=document.getElementById('boss-commander-skill') as HTMLButtonElement;
    commander.disabled=battle.result!=='fighting'||battle.commanderCooldown>0;
    commander.classList.toggle('buff-active',battle.commanderBuff>0);
    document.getElementById('commander-skill-cooldown')!.textContent=battle.commanderBuff>0?`강화 ${battle.commanderBuff.toFixed(1)}초 · 재사용 ${battle.commanderCooldown.toFixed(1)}초`:battle.commanderCooldown>0?`재사용 ${battle.commanderCooldown.toFixed(1)}초`:'사용 가능 · 쿨타임 15초';
    const hero=battle.hero();
    document.getElementById('hero-basic-cooldown')!.textContent=!hero?'전투 불가':battle.result!=='fighting'?'전투 종료':`공격 딜레이 ${hero.cooldown.toFixed(1)}초 / ${(1/hero.rate).toFixed(1)}초`;
    const triple=document.getElementById('boss-triple-skill') as HTMLButtonElement;
    triple.disabled=!battle.canTriple();
    document.getElementById('hero-triple-cooldown')!.textContent=!hero?'전투 불가':battle.result!=='fighting'?'전투 종료':battle.heroSkillCooldown>0?`재사용 ${battle.heroSkillCooldown.toFixed(1)}초`:battle.canTriple()?'사용 가능':'사거리까지 접근 중';
    const allies=battle.actors.filter(a=>a.side==='ally'&&a.hp>0).length;
    const enemies=battle.actors.filter(a=>a.side==='enemy'&&a.hp>0).length;
    const text=battle.result==='victory'?'시험 승리':battle.result==='defeat'?'시험 패배':'전열 우선 교전';
    status.textContent=`${text} · 아군 ${allies} / 적 ${enemies} · ${Math.floor(battle.elapsed)}초`;
  }};
}

import './hero-detail-panels.css';
import {ITEMS,type ItemDef} from './defenseConfig';
import {hasItemArt,itemArt} from './itemArt';
import type {PreviewHero} from './hero-preview';

function inventoryArt(item:ItemDef){
 if(hasItemArt(item))return itemArt(item);
 const w=Math.max(...item.cells.map(c=>c[0]))+1,h=Math.max(...item.cells.map(c=>c[1]))+1;
 return `<svg viewBox="0 0 ${w*24} ${h*24}" aria-hidden="true">${item.cells.map(([x,y])=>`<rect x="${x*24+1}" y="${y*24+1}" width="22" height="22" rx="2" fill="${item.color}" stroke="#d5bd84"/>`).join('')}</svg>`;
}
export function renderHeroSkills(hero:PreviewHero){
 const skills=hero.id==='bran'?[
  {name:'방패 강타',type:'자동 스킬',description:'방패로 전방의 적을 밀쳐 피해를 주고 잠시 움직임을 늦춥니다.'},
  {name:'수호의 맹세',type:'전투 스킬',description:'아군을 지키는 방벽을 펼쳐 일정 시간 받는 피해를 줄입니다.'},
  {name:'불굴의 의지',type:'패시브',description:'위기에 처할수록 굳건해집니다. 체력이 낮아지면 방어 능력이 높아집니다.'},
 ]:[
  {name:'집중된 일격',type:'자동 스킬',description:'힘을 모아 대상에게 강한 일격을 가합니다.'},
  {name:'전투의 의지',type:'전투 스킬',description:'숨겨진 힘을 깨워 잠시 전투 능력을 끌어올립니다.'},
  {name:'숙련된 전술',type:'패시브',description:'오랜 전투 경험으로 부대와 함께 더 효율적으로 싸웁니다.'},
 ];
 return `<section class="hero-skill-description-list" aria-label="${hero.name} 스킬"><div class="hero-pane-heading"><h2>스킬</h2><span>임시 설명</span></div>${skills.map((s,i)=>`<article class="hero-skill-description"><div class="hero-described-skill-icon"><svg viewBox="${[570,659,748][i]} 539 68 68" aria-hidden="true"><image href="${import.meta.env.BASE_URL}assets/lobby/hero-concept.png" width="948" height="1659"/></svg></div><div><span>${s.type}</span><h3>${s.name}</h3><p>${s.description}</p></div></article>`).join('')}</section>`;
}
function characterStandIn(hero:PreviewHero){
 if(hero.id==='aria')return `<svg class="hero-equipment-model" viewBox="180 96 240 300" aria-label="근접 딜러 캐릭터" role="img"><image href="${import.meta.env.BASE_URL}assets/heroes/melee-motion-sheet.png" width="1774" height="887"/></svg>`;
 return `<div class="hero-character-placeholder" aria-label="${hero.name} 캐릭터 준비중"><svg viewBox="0 0 100 180" aria-hidden="true"><circle cx="50" cy="26" r="17"/><path d="M30 49h40c7 0 12 5 14 12l9 40c2 8-10 11-13 3L70 74v40l7 50c1 9-13 11-15 2l-12-42-12 42c-2 9-16 7-15-2l7-50V74l-10 30c-3 8-15 5-13-3l9-40c2-7 7-12 14-12Z"/></svg><span>캐릭터 준비중</span></div>`;
}
export function renderHeroEquipment(hero:PreviewHero,selectedId?:string){
 const chosen=ITEMS.find(item=>item.id===selectedId);
 return `<section class="hero-equipment-pane" aria-label="${hero.name} 장비"><div class="hero-pane-heading"><h2>${hero.name} 장비</h2><span>무기 · 아티펙트</span></div>
 <div class="hero-equipment-stage"><button class="hero-loadout-slot" data-notice="무기 장착은 준비 중입니다." aria-label="무기 장비칸"><span class="hero-slot-symbol" aria-hidden="true">⚔</span><strong>무기</strong><small>빈 슬롯</small></button><div class="hero-character-stage">${characterStandIn(hero)}<span class="hero-character-plinth" aria-hidden="true"></span></div><button class="hero-loadout-slot" data-notice="아티펙트 장착은 준비 중입니다." aria-label="아티펙트 장비칸"><span class="hero-slot-symbol" aria-hidden="true">✧</span><strong>아티펙트</strong><small>빈 슬롯</small></button></div>
 <section class="hero-inventory"><div class="hero-pane-heading"><h2>인벤토리</h2><span>${ITEMS.length} / 16</span></div><div class="hero-inventory-grid" role="group" aria-label="장비 인벤토리">${ITEMS.map(item=>`<button class="hero-inventory-item" data-inventory="${item.id}" aria-pressed="${item.id===selectedId}" aria-label="${item.name} · ${item.description}"><span class="hero-inventory-art">${inventoryArt(item)}</span><small>${item.name}</small></button>`).join('')}${Array.from({length:Math.max(0,16-ITEMS.length)},()=>'<div class="hero-inventory-empty" aria-hidden="true"></div>').join('')}</div><div class="hero-inventory-description" role="status" aria-live="polite">${chosen?`<strong>${chosen.name}</strong><p>${chosen.description}</p>`:'<p>장비를 선택하면 정보를 확인할 수 있습니다.</p>'}</div></section></section>`;
}

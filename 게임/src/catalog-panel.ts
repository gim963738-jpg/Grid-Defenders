import {PREVIEW_HEROES,previewHeroPortrait} from './hero-preview';
import {ITEMS,RECIPES,type ItemDef} from './defenseConfig';
import {hasItemArt,itemArt} from './itemArt';
import './catalog-panel.css';

type Category='heroes'|'equipment';
function equipmentPicture(item:ItemDef){
 if(hasItemArt(item))return itemArt(item);
 const width=Math.max(...item.cells.map(c=>c[0]))+1,height=Math.max(...item.cells.map(c=>c[1]))+1;
 return `<svg class="catalog-shape-icon" viewBox="0 0 ${width*24} ${height*24}" aria-hidden="true">${item.cells.map(([x,y])=>`<rect x="${x*24+2}" y="${y*24+2}" width="20" height="20" rx="3" fill="${item.color}" stroke="#ede0b6" stroke-opacity=".6"/>`).join('')}</svg>`;
}
function equipmentStats(item:ItemDef){
 const rows:[string,string][]=[];
 if(item.attack!==undefined)rows.push(['공격력',`+${item.attack}`]);
 if(item.armor!==undefined)rows.push(['물리 방어력',`+${item.armor}`]);
 if(item.magicArmor!==undefined)rows.push(['마법 방어력',`+${item.magicArmor}`]);
 if(item.hp!==undefined)rows.push(['체력',`+${item.hp}`]);
 if(item.speed!==undefined)rows.push(['공격속도',`+${Math.round(item.speed*100)}%`]);
 if(item.regen!==undefined)rows.push(['초당 회복',`+${item.regen}`]);
 if(item.gold!==undefined)rows.push(['골드 획득',`+${Math.round(item.gold*100)}%`]);
 return rows;
}
export function mountCatalogPanel(){
 const dialog=document.createElement('dialog');dialog.className='catalog-panel';dialog.setAttribute('aria-labelledby','catalog-title');document.body.append(dialog);
 let category:Category='heroes',selected:string|undefined,opener:HTMLElement|null=null;
 function render(focus?:string){
  const hero=category==='heroes'?PREVIEW_HEROES.find(h=>h.id===selected):undefined;
  const item=category==='equipment'?ITEMS.find(i=>i.id===selected):undefined;
  const detail=Boolean(hero||item);
  const title=hero?.name??item?.name;
  const count=category==='heroes'?PREVIEW_HEROES.length:ITEMS.length;
  dialog.innerHTML=`<header class="catalog-header"><div><span>IMPERIAL ARCHIVE</span><h2 id="catalog-title">제국 도감</h2></div><button data-close aria-label="도감 닫기">×</button></header>
   <div class="catalog-tabs" role="tablist" aria-label="도감 분류">${(['heroes','equipment'] as const).map(id=>`<button id="catalog-tab-${id}" role="tab" data-tab="${id}" aria-selected="${category===id}" aria-controls="catalog-content" tabindex="${category===id?0:-1}">${id==='heroes'?'영웅':'장비'} <span>${id==='heroes'?PREVIEW_HEROES.length:ITEMS.length}</span></button>`).join('')}</div>
   <div class="catalog-summary"><span>${detail?'상세 정보':category==='heroes'?'영웅들의 기록':'전장에서 사용하는 장비'}</span><strong>${detail?title:`등록 ${count}종`}</strong></div>
   <div class="catalog-content" id="catalog-content" role="tabpanel" aria-labelledby="catalog-tab-${category}" tabindex="0">${hero?`<article class="catalog-hero-detail"><div class="catalog-hero-picture">${previewHeroPortrait(hero)}</div><div class="catalog-detail-heading"><span>${hero.role}${hero.role==='근접'?' 딜러':''}</span><h3>${hero.name}</h3><p>${hero.owned?'보유 영웅':'미보유 영웅'} · 소속 ${hero.affiliation??'미정'}</p></div><dl class="catalog-stats">${[['레벨',hero.owned?`Lv. ${hero.level}`:'—'],['공격력',hero.owned?hero.attack.toLocaleString():'—'],['방어력',hero.owned?hero.defense.toLocaleString():'—'],['체력',hero.owned?hero.hp.toLocaleString():'—']].map(([label,value])=>`<div><dt>${label}</dt><dd>${value}</dd></div>`).join('')}</dl></article>`:
   item?`<article class="catalog-equipment-detail"><div class="catalog-equipment-picture">${equipmentPicture(item)}</div><div class="catalog-detail-heading"><span>${item.name.startsWith('시험용')?'시험용 장비':RECIPES.some(r=>r.result===item.id)?'조합 장비':'기본 장비'} · ${item.id}</span><h3>${item.name}</h3><p>${item.description}</p></div><dl class="catalog-stats"><div><dt>기준 가격</dt><dd>${item.price.toLocaleString()} G</dd></div><div><dt>차지하는 칸</dt><dd>${item.cells.length}칸</dd></div>${equipmentStats(item).map(([label,value])=>`<div><dt>${label}</dt><dd>${value}</dd></div>`).join('')}</dl><section class="catalog-footprint"><h4>장비 형태</h4><div>${(()=>{const w=Math.max(...item.cells.map(c=>c[0]))+1,h=Math.max(...item.cells.map(c=>c[1]))+1;return `<svg viewBox="0 0 ${w*28} ${h*28}" width="${w*28}" height="${h*28}" aria-label="${item.cells.length}칸 장비 형태" role="img">${item.cells.map(([x,y])=>`<rect x="${x*28+2}" y="${y*28+2}" width="24" height="24" rx="2" fill="${item.color}" stroke="#f4e3ad"/>`).join('')}</svg>`;})()}</div></section>${RECIPES.filter(r=>r.result===item.id).map(r=>`<section class="catalog-recipe"><h4>조합 재료</h4><p>${r.materials.map(id=>ITEMS.find(i=>i.id===id)!.name).join(' + ')}</p></section>`).join('')}</article>`:
   `<div class="catalog-grid">${category==='heroes'?PREVIEW_HEROES.map(h=>`<button class="catalog-entry catalog-hero-entry ${h.owned?'':'unowned'}" data-entry="${h.id}" aria-label="${h.name} 도감 상세"><span class="catalog-card-picture">${previewHeroPortrait(h)}</span><strong>${h.name}</strong><small>${h.role} · ${h.owned?'보유':'미보유'}</small></button>`).join(''):ITEMS.map(i=>`<button class="catalog-entry catalog-item-entry" data-entry="${i.id}" aria-label="${i.name} 도감 상세"><span class="catalog-card-picture">${equipmentPicture(i)}</span><strong>${i.name}</strong><small>${i.cells.length}칸 · ${i.price} G</small></button>`).join('')}</div>`}</div>
   <footer class="catalog-footer">${detail?'<button data-list>‹ 목록으로</button>':`<span>${category==='heroes'?'영웅을 선택해 상세 정보를 확인하세요.':'장비를 선택해 능력치와 형태를 확인하세요.'}</span>`}</footer>`;
  if(focus)dialog.querySelector<HTMLElement>(focus)?.focus({preventScroll:true});
 }
 function changeTab(tab:Category){category=tab;selected=undefined;render(`[data-tab="${category}"]`);}
 dialog.addEventListener('click',event=>{const b=(event.target as HTMLElement).closest<HTMLButtonElement>('button');if(!b||b.disabled)return;
  if(b.hasAttribute('data-close')){dialog.close();return;}
  if(b.dataset.tab==='heroes'||b.dataset.tab==='equipment'){changeTab(b.dataset.tab);return;}
  if(b.dataset.entry){selected=b.dataset.entry;render('[data-list]');return;}
  if(b.hasAttribute('data-list')){const id=selected;selected=undefined;render(`[data-entry="${id}"]`);}
 });
 dialog.addEventListener('keydown',event=>{if(!(event.target instanceof HTMLElement)||!event.target.matches('[role=tab]'))return;if(['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){event.preventDefault();changeTab(event.key==='Home'?'heroes':event.key==='End'?'equipment':category==='heroes'?'equipment':'heroes');}});
 dialog.addEventListener('close',()=>{if(opener?.isConnected)opener.focus({preventScroll:true});});window.addEventListener('hashchange',()=>{if(dialog.open)dialog.close();});
 return {open(){opener=document.activeElement as HTMLElement;category='heroes';selected=undefined;render();if(!dialog.open)dialog.showModal();}};
}

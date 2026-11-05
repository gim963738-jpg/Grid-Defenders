import {renderHeroSkills,renderHeroEquipment} from './hero-detail-panels';
import {mountHeroGrowthPanel} from './hero-growth-panel';
import {BRAN_STAT_SAMPLE} from './hero-stat-sample';
﻿// Presentation state only. Future game integration can replace this data adapter.
export interface PreviewHero {
  id: string; name: string; role: string; affiliation?: string; level: number; attack: number;
  defense: number; hp: number; owned: boolean; portrait: number;
}
const heroes: PreviewHero[] = [
  { id:'bran', name:'브란', role:'탱커', level:12, attack:136, defense:210, hp:2300, owned:true, portrait:0 },
  { id:'aria', name:'아리아', role:'근접', level:12, attack:261, defense:95, hp:1330, owned:true, portrait:1 },
  { id:'selin', name:'셀린', role:'지원', level:10, attack:120, defense:70, hp:1100, owned:true, portrait:2 },
  { id:'bella', name:'벨라', role:'원거리', level:10, attack:240, defense:55, hp:900, owned:true, portrait:3 },
  { id:'kai', name:'카이', role:'원거리', level:8, attack:210, defense:65, hp:1000, owned:true, portrait:4 },
  { id:'rina', name:'리나', role:'지원', level:6, attack:98, defense:60, hp:980, owned:true, portrait:5 },
  { id:'jeno', name:'제노', role:'근접', level:1, attack:0, defense:0, hp:0, owned:false, portrait:6 },
  { id:'eira', name:'에이라', role:'지원', level:1, attack:0, defense:0, hp:0, owned:false, portrait:7 },
];
export {heroes as PREVIEW_HEROES};
export function previewHeroPortrait(hero:PreviewHero,extra=''){
 const x=[39,266,492,719][hero.portrait%4],y=hero.portrait<4?968:1223;
 return `<svg class="hero-portrait ${extra}" viewBox="${x} ${y} 192 108" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><image href="${import.meta.env.BASE_URL}assets/lobby/hero-concept.png" width="948" height="1659"/></svg>`;
}
const roleIcons: Record<string,string> = {'탱커':'♜','근접':'⚔','원거리':'➶','지원':'✧'};
export function mountHeroPreview() {
  const lobby = document.querySelector<HTMLElement>('main.camp')!;
  const screen = document.createElement('main');
  screen.className = 'camp hero-screen';
  screen.hidden = true;
  screen.setAttribute('aria-label','영웅 관리 시안');
  lobby.after(screen);
  const growthPanel=mountHeroGrowthPanel();
  const detailNav=document.createElement('nav');detailNav.className='hero-detail-navigation';detailNav.hidden=true;detailNav.setAttribute('aria-label','영웅 상세 분류');document.body.append(detailNav);
  const slots:(string|null)[]=[...heroes.filter(h=>h.owned).map(h=>h.id),null,null];
  let formationEditing=false;
  let updateRoster=()=>{};
  let selected = heroes[1];
  let filter = '전체';
  let sort = 'level';
  let filtersOpen = false;
  let detailTab = '능력치';
  let isDetail = false;
  let listScroll = 0;
  let opener: HTMLElement | null = null;
  const imageUrl = `${import.meta.env.BASE_URL}assets/lobby/hero-concept.png`;
  // Crop artwork only, excluding the labels and frames baked into the concept.
  const artwork = (x:number,y:number,w:number,h:number,className:string) => `<svg class="${className}" viewBox="${x} ${y} ${w} ${h}" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><image href="${imageUrl}" width="948" height="1659" /></svg>`;
  const portrait = previewHeroPortrait;
  function render() {
    screen.dataset.view = isDetail ? 'detail' : 'list';
    screen.dataset.detailTab=detailTab;
    detailNav.hidden=screen.hidden||!isDetail;
    detailNav.innerHTML=isDetail?`<div role="tablist" aria-label="영웅 상세 탭">${['능력치','스킬','장비'].map((tab,i)=>`<button id="hero-detail-tab-${i}" data-detail="${tab}" role="tab" aria-selected="${tab===detailTab}" aria-controls="hero-detail-body" tabindex="${tab===detailTab?0:-1}">${tab}</button>`).join('')}</div>`:'';
    screen.classList.toggle('formation-editing',formationEditing&&!isDetail);
    const list = heroes.filter(h => filter === '전체' || h.role === filter).sort((a,b) => Number(b.owned)-Number(a.owned) || (sort === 'level' ? b.level-a.level : a.name.localeCompare(b.name,'ko')));
    const ability = `<section class="hero-ability-section" aria-label="${selected.name} 능력치"><div class="hero-ability-heading"><h3>능력치</h3>${selected.id==='bran'?'<span>표본 수치</span>':''}</div><dl class="hero-stats ${selected.id==='bran'?'hero-sample-stats':''}">${selected.id==='bran'?BRAN_STAT_SAMPLE.map(stat=>`<div data-stat="${stat.id}"><dt>${stat.name}</dt><dd><strong>${stat.value}</strong>${stat.note?`<small>${stat.note}</small>`:''}</dd></div>`).join(''):`<div><dt>⚔ 공격력</dt><dd>${selected.attack.toLocaleString()}</dd></div><div><dt>♜ 방어력</dt><dd>${selected.defense.toLocaleString()}</dd></div><div><dt>♡ 체력</dt><dd>${selected.hp.toLocaleString()}</dd></div>`}</dl></section>`;
    screen.innerHTML = `
      <header class="hero-header"><button data-action="back" aria-label="${isDetail?'영웅 목록으로 돌아가기':'로비로 돌아가기'}">‹</button><h1 tabindex="-1">${isDetail?'영웅 상세':'영웅'}</h1><div class="hero-wallet"><span>✦ <b>480</b></span><span>⚒ <b>0</b></span></div><button data-action="home" aria-label="로비 홈">⌂</button></header>
      ${isDetail ? `
      <section class="hero-showcase" aria-label="선택 영웅 상세">
        <div class="hero-illustration ${selected.id === 'aria' ? 'aria-full' : ''}">${selected.id === 'aria' ? artwork(17,151,520,500,'hero-full-art') : portrait(selected,'large-portrait')}</div>
        <div class="hero-information"><span class="hero-role">${roleIcons[selected.role]} ${selected.role}${selected.role === '근접' ? ' 딜러' : ''}</span><p class="hero-affiliation"><span>소속</span><strong>${selected.affiliation??'미정'}</strong></p><h2>${selected.name}</h2><p class="hero-level">Lv. ${selected.level}<span><i style="width:${selected.level / 30 * 100}%"></i></span></p><div class="hero-stars" aria-label="5성">★★★★★</div><button class="hero-growth-button" data-action="growth">성장</button>
        </div><div class="hero-detail-view" id="hero-detail-body" role="tabpanel" aria-labelledby="hero-detail-tab-${['능력치','스킬','장비'].indexOf(detailTab)}">${detailTab==='능력치'?ability:detailTab==='스킬'?renderHeroSkills(selected):renderHeroEquipment(selected)}</div>
      </section>
      ` : `
      <button class="hero-formation-button ${formationEditing?'is-editing':''}" data-action="formation" aria-pressed="${formationEditing}"><span>${formationEditing?'편성 완료':'편성하기'}</span><small>${slots.filter(Boolean).length} / 8</small><span aria-hidden="true">${formationEditing?'✓':'›'}</span></button>${formationEditing?'<p class="hero-formation-hint">영웅을 눌러 편성하거나 해제하세요.</p>':''}
      <section class="hero-collection" aria-label="보유 영웅"><div class="collection-heading"><h2>보유 영웅 <span>6 / 8</span></h2><div class="collection-tools"><select aria-label="영웅 정렬"><option value="level" ${sort==='level'?'selected':''}>레벨순</option><option value="name" ${sort==='name'?'selected':''}>이름순</option></select><button class="hero-filter-toggle ${filter!=='전체'?'has-filter':''}" data-action="filters" aria-label="역할 필터" aria-controls="hero-role-filters" aria-expanded="${filtersOpen}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16M8 3v6m8 0v6m-7 0v6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></button></div></div><div id="hero-role-filters" class="hero-filters" role="group" aria-label="영웅 역할 필터" ${filtersOpen?'':'hidden'}>${['전체','탱커','근접','원거리','지원'].map(f=>`<button data-filter="${f}" class="${f===filter?'active':''}" aria-pressed="${f===filter}">${f}</button>`).join('')}</div><div class="hero-grid">${list.map(h=>`<button class="hero-card ${!h.owned?'unowned':''} ${formationEditing&&slots.includes(h.id)?'formation-selected':''}" data-select="${h.id}" ${formationEditing&&h.owned?`aria-pressed="${slots.includes(h.id)}"`:''} aria-label="${h.name}${!h.owned?' 미보유':formationEditing?(slots.includes(h.id)?' 편성 해제':' 편성 추가'):(slots.includes(h.id)?' 편성 중 · 상세 보기':' 상세 보기')}">${portrait(h)}${slots.includes(h.id)?'<span class="hero-formation-badge" aria-hidden="true">편성</span>':''}<span class="role-badge">${roleIcons[h.role]}</span><span class="card-caption"><small>${h.owned?'Lv. '+h.level:'🔒 미보유'}</small><strong>${h.name}</strong><span class="hero-stars">★★★★★</span></span></button>`).join('')}${Array.from({length:Math.max(0,16-list.length)},()=>'<div class="hero-empty-slot" aria-hidden="true"></div>').join('')}</div></section>
      `}
      <p class="hero-notice" role="status" aria-live="polite"></p>`;
  }
  let noticeTimer: ReturnType<typeof setTimeout>;
  function notice(message:string) {
    const el = screen.querySelector<HTMLElement>('.hero-notice')!;
    el.textContent = message;
    el.classList.add('visible');
    clearTimeout(noticeTimer);
    noticeTimer = setTimeout(()=>el.classList.remove('visible'),2600);
  }
  function rerender(focusSelector?:string) {
    const scroll = window.scrollY;
    render();
    if(focusSelector) screen.querySelector<HTMLElement>(focusSelector)?.focus({preventScroll:true});
    window.scrollTo(0,scroll);
  }
  screen.addEventListener('click',event=>{
    const button=(event.target as HTMLElement).closest<HTMLButtonElement>('button');
    if(!button)return;
    if(button.dataset.action==='formation'){formationEditing=!formationEditing;rerender('[data-action="formation"]');return;}
    if(button.dataset.action==='growth'){growthPanel.open(selected);return;}
    if(button.dataset.action==='home'){location.hash='';return;}
    if(button.dataset.action==='back'){location.hash=isDetail?'heroes':'';return;}
    if(button.dataset.action==='list'){location.hash='heroes';return;}
    if(button.dataset.notice){notice(button.dataset.notice);return;}
    if(button.dataset.action==='filters'){filtersOpen=!filtersOpen;rerender('[data-action="filters"]');return;}
    if(button.dataset.filter){filter=button.dataset.filter;rerender(`[data-filter="${filter}"]`);return;}
    if(button.dataset.select){
      const hero=heroes.find(h=>h.id===button.dataset.select)!;if(!hero.owned){notice('아직 보유하지 않은 영웅입니다.');return;}
      if(formationEditing){
        const existing=slots.indexOf(hero.id);
        if(existing!==-1)slots[existing]=null;
        else{const empty=slots.indexOf(null);if(empty===-1){notice('최대 8명까지 편성할 수 있습니다.');return;}slots[empty]=hero.id;}
        updateRoster();rerender(`[data-select="${hero.id}"]`);return;
      }
      listScroll=window.scrollY;detailTab='능력치';location.hash=`heroes/${hero.id}`;return;
    }
  });
  screen.addEventListener('keydown',event=>{if(event.key==='Escape'&&formationEditing){formationEditing=false;rerender('[data-action="formation"]');}});
  screen.addEventListener('change',event=>{if(event.target instanceof HTMLSelectElement){sort=event.target.value;rerender('select');}});
  function changeDetailTab(tab:string){
    if(!['능력치','스킬','장비'].includes(tab))return;
    detailTab=tab;render();window.scrollTo(0,0);detailNav.querySelector<HTMLElement>(`[data-detail="${tab}"]`)?.focus({preventScroll:true});
  }
  detailNav.addEventListener('click',event=>{const b=(event.target as HTMLElement).closest<HTMLButtonElement>('[data-detail]');if(b)changeDetailTab(b.dataset.detail!);});
  detailNav.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const tabs=['능력치','스킬','장비'],i=tabs.indexOf(detailTab);changeDetailTab(event.key==='Home'?tabs[0]:event.key==='End'?tabs[2]:tabs[(i+(event.key==='ArrowRight'?1:2))%3]);});
  function syncRoute(){
    const routeHero=heroes.find(h=>location.hash===`#heroes/${h.id}`&&h.owned);
    if(location.hash!=='#heroes')formationEditing=false;
    const wasDetail=isDetail;
    isDetail=Boolean(routeHero);
    if(routeHero){if(routeHero.id!==selected.id||!wasDetail){detailTab='능력치';}selected=routeHero;}
    const isHero=location.hash==='#heroes'||Boolean(routeHero);
    lobby.hidden=isHero||location.hash==='#barracks'||location.hash==='#training'||(location.hash==='#specialty'||location.hash.startsWith('#specialty/'));
    screen.hidden=!isHero;
    detailNav.hidden=!isHero||!isDetail;
    if(isHero){render();window.scrollTo(0,!isDetail&&wasDetail?listScroll:0);if(!isDetail&&wasDetail)screen.querySelector<HTMLElement>(`.hero-card[data-select="${selected.id}"]`)?.focus({preventScroll:true});else screen.querySelector<HTMLElement>('h1')?.focus({preventScroll:true});}
    else if(location.hash!=='#barracks'&&location.hash!=='#training'&&location.hash!=='#specialty'&&!location.hash.startsWith('#specialty/')){window.scrollTo(0,0);opener?.focus({preventScroll:true});}
  }
  window.addEventListener('hashchange',syncRoute);
  syncRoute();
  function mountRoster(container:HTMLElement) {
    const picker=document.createElement('dialog');
    picker.className='roster-picker';
    picker.setAttribute('aria-labelledby','roster-picker-title');
    document.body.append(picker);
    let slotIndex=0;
    const slotMarkup=()=>`<div class="roster-heading"><h2>영웅 편성</h2><span>${slots.filter(Boolean).length} / 8</span></div><div class="lobby-roster-grid">${slots.map((id,index)=>{const h=heroes.find(h=>h.id===id);return `<button class="lobby-roster-slot ${h?'filled':'vacant'}" data-roster-slot="${index}" aria-label="${index+1}번 편성 ${h?h.name:'빈칸'} 변경">${h?portrait(h):'<span class="roster-plus" aria-hidden="true">＋</span>'}<span class="roster-slot-label">${h?h.name:'빈 슬롯'}</span></button>`;}).join('')}</div>`;
    function drawSlots(){
      container.innerHTML=slotMarkup();
    }
    function closePicker(){picker.close();}
    picker.addEventListener('close',()=>{container.querySelector<HTMLElement>(`[data-roster-slot="${slotIndex}"]`)?.focus({preventScroll:true});});
    const selectSlot=(event:Event)=>{
      const button=(event.target as HTMLElement).closest<HTMLButtonElement>('[data-roster-slot]');if(!button)return;
      slotIndex=Number(button.dataset.rosterSlot);
      picker.innerHTML=`<button class="close" data-close aria-label="닫기">×</button><h1 id="roster-picker-title">${slotIndex+1}번 슬롯 · 영웅 선택</h1><div class="roster-picker-grid">${heroes.filter(h=>h.owned).map(h=>`<button data-roster-hero="${h.id}" aria-label="${h.name} 편성">${portrait(h)}<span>${h.name}</span></button>`).join('')}</div><p>이미 편성된 영웅을 고르면 서로 자리를 바꿉니다.</p><button class="dialog-confirm" data-remove>편성 해제</button>`;
      picker.showModal();
    };
    container.addEventListener('click',selectSlot);
    window.addEventListener('hashchange',()=>{if(picker.open)picker.close();});
    updateRoster=drawSlots;
    picker.addEventListener('click',event=>{
      const button=(event.target as HTMLElement).closest<HTMLButtonElement>('button');
      if(!button)return;
      if(button.hasAttribute('data-close')){closePicker();return;}
      if(button.hasAttribute('data-remove'))slots[slotIndex]=null;
      else if(button.dataset.rosterHero){const id=button.dataset.rosterHero;const previous=slots.indexOf(id);if(previous!==-1)slots[previous]=slots[slotIndex];slots[slotIndex]=id;}
      else return;
      drawSlots();closePicker();
    });
    drawSlots();
  }
  return {open(){opener=document.activeElement as HTMLElement;location.hash='heroes';},mountRoster};
}





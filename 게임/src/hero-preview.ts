// Presentation state only. Future game integration can replace this data adapter.
export interface PreviewHero {
  id: string; name: string; role: string; level: number; attack: number;
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
const roleIcons: Record<string,string> = {'탱커':'♜','근접':'⚔','원거리':'➶','지원':'✧'};
export function mountHeroPreview() {
  const lobby = document.querySelector<HTMLElement>('main.camp')!;
  const screen = document.createElement('main');
  screen.className = 'camp hero-screen';
  screen.hidden = true;
  screen.setAttribute('aria-label','영웅 관리 시안');
  lobby.after(screen);
  let selected = heroes[1];
  let filter = '전체';
  let sort = 'level';
  let filtersOpen = false;
  let detailTab = '스킬';
  let isDetail = false;
  let listScroll = 0;
  let opener: HTMLElement | null = null;
  const imageUrl = `${import.meta.env.BASE_URL}assets/lobby/hero-concept.png`;
  // Crop artwork only, excluding the labels and frames baked into the concept.
  const artwork = (x:number,y:number,w:number,h:number,className:string) => `<svg class="${className}" viewBox="${x} ${y} ${w} ${h}" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><image href="${imageUrl}" width="948" height="1659" /></svg>`;
  const portrait = (hero: PreviewHero, extra = '') => artwork([39,266,492,719][hero.portrait % 4],hero.portrait < 4 ? 968 : 1223,192,108,`hero-portrait ${extra}`);
  function render() {
    screen.dataset.view = isDetail ? 'detail' : 'list';
    const list = heroes.filter(h => filter === '전체' || h.role === filter).sort((a,b) => Number(b.owned)-Number(a.owned) || (sort === 'level' ? b.level-a.level : a.name.localeCompare(b.name,'ko')));
    screen.innerHTML = `
      <header class="hero-header"><button data-action="back" aria-label="${isDetail?'영웅 목록으로 돌아가기':'로비로 돌아가기'}">‹</button><h1 tabindex="-1">${isDetail?'영웅 상세':'영웅'}</h1><div class="hero-wallet"><span>✦ <b>480</b></span><span>⚒ <b>0</b></span></div><button data-action="home" aria-label="로비 홈">⌂</button></header>
      <nav class="hero-categories" aria-label="관리 분류"><button class="active" data-action="list" aria-current="page">영웅</button><button data-notice="병사 관리는 준비 중입니다.">병사</button><button data-notice="도감은 준비 중입니다.">도감</button></nav>
      ${isDetail ? `
      <section class="hero-showcase" aria-label="선택 영웅 상세">
        <div class="hero-illustration ${selected.id === 'aria' ? 'aria-full' : ''}">${selected.id === 'aria' ? artwork(17,151,520,500,'hero-full-art') : portrait(selected,'large-portrait')}</div>
        <div class="hero-information"><span class="hero-role">${roleIcons[selected.role]} ${selected.role}${selected.role === '근접' ? ' 딜러' : ''}</span><h2>${selected.name}</h2><p class="hero-level">Lv. ${selected.level}<span><i style="width:${selected.level / 30 * 100}%"></i></span></p><div class="hero-stars" aria-label="5성">★★★★★</div><dl class="hero-stats"><div><dt>⚔ 공격력</dt><dd>${selected.attack.toLocaleString()}</dd></div><div><dt>♜ 방어력</dt><dd>${selected.defense.toLocaleString()}</dd></div><div><dt>♡ 체력</dt><dd>${selected.hp.toLocaleString()}</dd></div></dl>
        </div><div class="hero-detail-panel"><div class="hero-detail-tabs" role="group" aria-label="영웅 상세 분류">${['스킬','장비'].map(t=>`<button data-detail="${t}" aria-pressed="${t===detailTab}" class="${t===detailTab?'active':''}">${t}</button>`).join('')}</div>
        <div class="hero-skills">${detailTab === '스킬' ? ['기본 공격','스킬 1','스킬 2','패시브'].map((s,i)=>`<button class="skill-art" aria-label="${s}" data-notice="${selected.name} · ${s} — 시안용 아이콘입니다.">${artwork([570,659,748,837][i],539,68,68,'skill-image')}</button>`).join('') : '<div class="preview-equipment">'+['무기','방어구','장신구','보조'].map(s=>`<button data-notice="장비 연결은 추후 진행합니다."><span>＋</span>${s}</button>`).join('')+'</div>'}</div></div>
      </section>
      <button class="hero-list-return" data-action="list">‹ 영웅 목록으로</button>
      ` : `
      <section class="hero-collection" aria-label="보유 영웅"><div class="collection-heading"><h2>보유 영웅 <span>6 / 8</span></h2><div class="collection-tools"><select aria-label="영웅 정렬"><option value="level" ${sort==='level'?'selected':''}>레벨순</option><option value="name" ${sort==='name'?'selected':''}>이름순</option></select><button class="hero-filter-toggle ${filter!=='전체'?'has-filter':''}" data-action="filters" aria-label="역할 필터" aria-controls="hero-role-filters" aria-expanded="${filtersOpen}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16M8 3v6m8 0v6m-7 0v6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></button></div></div><div id="hero-role-filters" class="hero-filters" role="group" aria-label="영웅 역할 필터" ${filtersOpen?'':'hidden'}>${['전체','탱커','근접','원거리','지원'].map(f=>`<button data-filter="${f}" class="${f===filter?'active':''}" aria-pressed="${f===filter}">${f}</button>`).join('')}</div><div class="hero-grid">${list.map(h=>`<button class="hero-card ${!h.owned?'unowned':''}" data-select="${h.id}" aria-label="${h.name}${!h.owned?' 미보유':' 상세 보기'}">${portrait(h)}<span class="role-badge">${roleIcons[h.role]}</span><span class="card-caption"><small>${h.owned?'Lv. '+h.level:'🔒 미보유'}</small><strong>${h.name}</strong><span class="hero-stars">★★★★★</span></span></button>`).join('')}${Array.from({length:Math.max(0,16-list.length)},()=>'<div class="hero-empty-slot" aria-hidden="true"></div>').join('')}</div></section>
      `}
      <nav class="hero-bottom-nav" aria-label="로비 메뉴">${[['상점','♜'],['영웅','♞'],['전투','⚔'],['병영','⌂'],['기록','▤']].map(([label,icon])=>`<button ${label==='전투'?'data-action="home"':label==='영웅'?'data-action="list" aria-current="page" class="active"':`data-notice="${label} 화면은 준비 중입니다."`}><span>${icon}</span>${label}</button>`).join('')}</nav><p class="hero-preview-note">디자인 미리보기 · 게임 데이터 연결 전</p><p class="hero-notice" role="status" aria-live="polite"></p>`;
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
    if(button.dataset.action==='home'){location.hash='';return;}
    if(button.dataset.action==='back'){location.hash=isDetail?'heroes':'';return;}
    if(button.dataset.action==='list'){location.hash='heroes';return;}
    if(button.dataset.notice){notice(button.dataset.notice);return;}
    if(button.dataset.action==='filters'){filtersOpen=!filtersOpen;rerender('[data-action="filters"]');return;}
    if(button.dataset.filter){filter=button.dataset.filter;rerender(`[data-filter="${filter}"]`);return;}
    if(button.dataset.detail){detailTab=button.dataset.detail;rerender(`[data-detail="${detailTab}"]`);return;}
    if(button.dataset.select){const hero=heroes.find(h=>h.id===button.dataset.select)!;if(!hero.owned){notice('아직 보유하지 않은 영웅입니다.');return;}listScroll=window.scrollY;detailTab='스킬';location.hash=`heroes/${hero.id}`;return;}
  });
  screen.addEventListener('change',event=>{if(event.target instanceof HTMLSelectElement){sort=event.target.value;rerender('select');}});
  function syncRoute(){
    const routeHero=heroes.find(h=>location.hash===`#heroes/${h.id}`&&h.owned);
    const wasDetail=isDetail;
    isDetail=Boolean(routeHero);
    if(routeHero)selected=routeHero;
    const isHero=location.hash==='#heroes'||Boolean(routeHero);
    lobby.hidden=isHero||location.hash==='#barracks'||location.hash==='#training'||(location.hash==='#specialty'||location.hash.startsWith('#specialty/'));
    screen.hidden=!isHero;
    if(isHero){render();window.scrollTo(0,!isDetail&&wasDetail?listScroll:0);if(!isDetail&&wasDetail)screen.querySelector<HTMLElement>(`.hero-card[data-select="${selected.id}"]`)?.focus({preventScroll:true});else screen.querySelector<HTMLElement>('h1')?.focus({preventScroll:true});}
    else if(location.hash!=='#barracks'&&location.hash!=='#training'&&location.hash!=='#specialty'&&!location.hash.startsWith('#specialty/')){window.scrollTo(0,0);opener?.focus({preventScroll:true});}
  }
  window.addEventListener('hashchange',syncRoute);
  syncRoute();
  function mountRoster(container:HTMLElement) {
    const slots: (string|null)[] = [...heroes.filter(h=>h.owned).map(h=>h.id),null,null];
    const picker=document.createElement('dialog');
    picker.className='roster-picker';
    picker.setAttribute('aria-labelledby','roster-picker-title');
    document.body.append(picker);
    let slotIndex=0;
    function drawSlots() {
      container.innerHTML=`<div class="roster-heading"><h2>영웅 편성</h2><span>${slots.filter(Boolean).length} / 8</span></div><div class="lobby-roster-grid">${slots.map((id,index)=>{const h=heroes.find(h=>h.id===id);return `<button class="lobby-roster-slot ${h?'filled':'vacant'}" data-roster-slot="${index}" aria-label="${index+1}번 편성 ${h?h.name:'빈칸'} 변경">${h?portrait(h):'<span class="roster-plus" aria-hidden="true">＋</span>'}<span class="roster-slot-label">${h?h.name:'빈 슬롯'}</span></button>`;}).join('')}</div>`;
    }
    function closePicker() {picker.close();container.querySelector<HTMLElement>(`[data-roster-slot="${slotIndex}"]`)?.focus();}
    container.addEventListener('click',event=>{
      const button=(event.target as HTMLElement).closest<HTMLButtonElement>('[data-roster-slot]');
      if(!button)return;
      slotIndex=Number(button.dataset.rosterSlot);
      picker.innerHTML=`<button class="close" data-close aria-label="닫기">×</button><h1 id="roster-picker-title">${slotIndex+1}번 슬롯 · 영웅 선택</h1><div class="roster-picker-grid">${heroes.filter(h=>h.owned).map(h=>`<button data-roster-hero="${h.id}" aria-label="${h.name} 편성">${portrait(h)}<span>${h.name}</span></button>`).join('')}</div><p>이미 편성된 영웅을 고르면 서로 자리를 바꿉니다.</p><button class="dialog-confirm" data-remove>편성 해제</button>`;
      picker.showModal();
    });
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





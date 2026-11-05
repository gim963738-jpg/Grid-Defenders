import './specialty-screen.css';

const CLASSES=[
 {id:'infantry',name:'보병',description:'전열을 지키는 근접 병과',art:'<path d="m10 5 3-3 3 3-1 11h-4zM7 17h12M13 17v7M10 25h6"/>'},
 {id:'archer',name:'활',description:'먼 거리의 적을 겨누는 병과',art:'<path d="M8 3c15 4 15 18 0 22L14 14zM4 14h21m-4-4 4 4-4 4"/>'},
 {id:'mage',name:'마법',description:'마력으로 적을 제압하는 병과',art:'<path d="m8 25 10-16M16 4l4-2 5 5-4 5-5-3zM4 6h5M6.5 3.5v5M22 19h5m-2.5-2.5v5"/>'},
 {id:'support',name:'지원',description:'아군의 전투를 돕는 병과',art:'<path d="M4 7c5-2 8-1 10 1 2-2 5-3 10-1v16c-5-2-8-1-10 1-2-2-5-3-10-1zM14 8v16M18 12h4m-2-2v4M7 12h4M7 16h4"/>'},
 {id:'assassin',name:'암살',description:'적의 빈틈을 파고드는 병과',art:'<path d="m4 3 9 7-3 4zM9 15l9 9M7 17l5-5M24 3l-9 7 3 4zM19 15l-9 9M21 17l-5-5"/>'},
 {id:'tank',name:'탱커',description:'단단한 방어로 아군을 보호하는 병과',art:'<path d="M14 2 24 6v8c0 6-6 10-10 12C10 24 4 20 4 14V6zM14 7v14M8 11h12"/>'},
] as const;

export function mountSpecialtyScreen(){
 const screen=document.createElement('main');
 screen.className='camp specialty-screen';screen.hidden=true;screen.setAttribute('aria-label','병사 특기');
 screen.innerHTML=`<header class="hero-header"><button data-back aria-label="병영으로 돌아가기">‹</button><h1 tabindex="-1">병사 특기</h1><button class="specialty-home" data-home aria-label="로비 홈">⌂</button></header>
 <section class="specialty-content"><div class="specialty-heading"><span>BARRACKS SPECIALTY</span><h2>병과의 특기를 연마하세요</h2><p>특기를 확인할 병과를 선택하세요.</p></div>
 <div class="specialty-scroll"><div class="specialty-scroll-paper"><div class="specialty-scroll-title"><span aria-hidden="true">✦</span> 병과 선택 <span aria-hidden="true">✦</span></div>
 <div class="specialty-grid" role="group" aria-label="병과 선택 · 가로 2칸 세로 4칸">${CLASSES.map((c,i)=>`<button class="specialty-class class-${c.id}" data-class="${c.id}" aria-pressed="false"><span class="specialty-number" aria-hidden="true">0${i+1}</span><span class="specialty-icon"><svg viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${c.art}</svg></span><strong>${c.name}</strong><span class="specialty-select-label">특기 보기 <span aria-hidden="true">›</span></span></button>`).join('')}${[1,2].map(i=>`<button class="specialty-class specialty-empty" disabled aria-label="빈자리 ${i} · 준비중"><span class="specialty-icon specialty-x" aria-hidden="true">×</span><strong>준비중</strong><span class="specialty-select-label">빈자리</span></button>`).join('')}</div>
 <div class="specialty-selection" role="status" aria-live="polite"><strong>병과를 선택하세요</strong><p>병사들의 특기를 병과별로 관리합니다.</p></div></div></div></section>`;
 document.body.append(screen);
 screen.addEventListener('click',event=>{
  const button=(event.target as HTMLElement).closest<HTMLButtonElement>('button');if(!button||button.disabled)return;
  if(button.hasAttribute('data-back')){location.hash='barracks';return;}
  if(button.hasAttribute('data-home')){location.hash='';return;}
  const selected=CLASSES.find(c=>c.id===button.dataset.class);if(!selected)return;
  screen.querySelectorAll<HTMLButtonElement>('[data-class]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  screen.querySelector<HTMLElement>('.specialty-selection')!.innerHTML=`<strong>${selected.name} 특기</strong><p>${selected.description}</p><span>특기 업그레이드 준비중</span>`;
 });
 function sync(){
  const visible=location.hash==='#specialty';screen.hidden=!visible;
  if(visible){screen.classList.remove('scroll-open');void screen.offsetWidth;screen.classList.add('scroll-open');window.scrollTo(0,0);screen.querySelector<HTMLElement>('h1')?.focus({preventScroll:true});}
 }
 window.addEventListener('hashchange',sync);sync();
}

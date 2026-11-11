import './hero-growth-panel.css';

const SCROLLS=[
 {id:'low',grade:'하급',subtitle:'기초 성장 두루마리'},
 {id:'mid',grade:'중급',subtitle:'정제된 성장 두루마리'},
 {id:'high',grade:'상급',subtitle:'찬란한 성장 두루마리'},
] as const;
type GrowthHero={name:string;level:number};

export function mountHeroGrowthPanel(){
 const dialog=document.createElement('dialog');dialog.className='hero-growth-panel';
 dialog.setAttribute('aria-labelledby','growth-title');dialog.setAttribute('aria-describedby','growth-description');
 document.body.append(dialog);
 let opener:HTMLElement|null=null;
 let choice:typeof SCROLLS[number]|undefined;
 function selectScroll(id:string){
  choice=SCROLLS.find(s=>s.id===id);if(!choice)return;
  dialog.querySelectorAll<HTMLButtonElement>('[data-scroll]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.scroll===choice!.id)));
  dialog.querySelector<HTMLElement>('#growth-question')!.textContent=`${choice.grade} 성장 두루마리를 사용할까요?`;
  dialog.querySelector<HTMLButtonElement>('[data-confirm]')!.disabled=false;
  dialog.querySelector<HTMLElement>('.growth-status')!.textContent='';
 }
 dialog.addEventListener('click',event=>{
  const button=(event.target as HTMLElement).closest<HTMLButtonElement>('button');if(!button||button.disabled)return;
  if(button.hasAttribute('data-close')){dialog.close();return;}
  if(button.dataset.scroll){selectScroll(button.dataset.scroll);return;}
  if(button.hasAttribute('data-confirm')&&choice){
   dialog.querySelector<HTMLElement>('.growth-status')!.textContent=`${choice.grade} 두루마리를 선택했습니다. 성장 효과와 아이템 소모는 준비 중입니다.`;
  }
 });
 dialog.addEventListener('close',()=>{if(opener?.isConnected)opener.focus({preventScroll:true});});
 window.addEventListener('hashchange',()=>{if(dialog.open)dialog.close();});
 return {open(hero:GrowthHero){
  opener=document.activeElement as HTMLElement;choice=undefined;
  dialog.innerHTML=`<header class="growth-header"><div><span>HERO GROWTH</span><h2 id="growth-title">영웅 성장</h2></div><button type="button" data-close aria-label="성장 창 닫기">×</button></header>
   <div class="growth-hero"><span aria-hidden="true">✦</span><strong>${hero.name}</strong><span>Lv. ${hero.level}</span></div>
   <p id="growth-description">마법진의 힘으로 영웅을 성장시키세요.<br>전투 없이 영웅 경험치를 얻는 아이템입니다.</p>
   <div class="growth-scroll-options" role="group" aria-label="성장 두루마리 선택">${SCROLLS.map(s=>`<button type="button" class="growth-scroll growth-${s.id}" data-scroll="${s.id}" aria-pressed="false" aria-label="${s.grade} 성장 두루마리 선택"><span class="growth-check" aria-hidden="true">✓</span><img src="${import.meta.env.BASE_URL}assets/lobby/growth-scrolls/scroll-${s.id}.png" alt="" width="128" height="128"><strong>${s.grade}</strong><span>성장 두루마리</span></button>`).join('')}</div>
   <p id="growth-question">사용할 두루마리를 선택하세요.</p><p class="growth-rule-note">성장량 · 보유 수량 연결 준비중</p>
   <div class="growth-actions"><button type="button" data-close>취소</button><button type="button" data-confirm disabled>사용 확인</button></div>
   <p class="growth-status" role="status" aria-live="polite"></p>`;
  if(!dialog.open)dialog.showModal();
 }};
}

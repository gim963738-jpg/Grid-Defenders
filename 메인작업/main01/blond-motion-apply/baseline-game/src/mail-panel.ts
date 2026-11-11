import './mail-panel.css';

type Attachment={name:string;amount:number;image?:string;symbol?:string};
type Mail={id:string;title:string;sender:string;date:string;expires:string;body:string[];attachments:Attachment[];read:boolean;claimed:boolean};
const initialMail:Mail[]=[
 {id:'welcome',title:'지휘관님, 제국에 오신 것을 환영합니다',sender:'제국 사령부',date:'오늘',expires:'7일 남음',body:['지휘관님의 부임을 진심으로 환영합니다.','잊혀진 숲으로 향하는 첫 원정을 위해 작은 보급품을 준비했습니다. 영웅들과 함께 부대를 정비하고 새로운 여정을 시작하세요.','제국의 깃발 아래, 그대의 승리를 기원합니다.'],attachments:[{name:'제국 골드',amount:500,symbol:'✦'},{name:'하급 성장 두루마리',amount:3,image:'growth-scrolls/scroll-low.png'}],read:false,claimed:false},
 {id:'supplies',title:'원정대를 위한 특별 보급',sender:'제국 보급관',date:'오늘',expires:'6일 남음',body:['숲의 정찰 임무에 앞서 특별 보급품을 전달합니다.','푸른 크리스탈과 성장 두루마리를 확인하고 다가올 원정에 대비해 주세요.'],attachments:[{name:'푸른 크리스탈',amount:20,image:'snow-crystal.svg'},{name:'중급 성장 두루마리',amount:1,image:'growth-scrolls/scroll-mid.png'}],read:false,claimed:false},
 {id:'training',title:'훈련소 개방을 알립니다',sender:'병영 훈련관',date:'어제',expires:'5일 남음',body:['병영 훈련소가 문을 열었습니다.','함께 훈련한 영웅과 병사들의 힘이 곧 부대의 힘이 됩니다. 부대 육성에 도움이 될 보급금을 함께 보냅니다.'],attachments:[{name:'제국 골드',amount:300,symbol:'✦'}],read:false,claimed:false},
 {id:'notice',title:'잊혀진 숲 원정 안내',sender:'제국 기록관',date:'어제',expires:'기간 제한 없음',body:['잊혀진 숲에서 이상 징후가 발견되었습니다.','원정을 떠나기 전에 영웅 편성을 확인해 주세요. 전장의 기록은 다음 도전을 위한 이정표가 됩니다.'],attachments:[],read:true,claimed:false},
];

export function mountMailPanel(){
 const mails=initialMail.map(m=>({...m})); // Session-only preview mailbox.
 const dialog=document.createElement('dialog');dialog.className='mail-panel';dialog.setAttribute('aria-labelledby','mail-title');document.body.append(dialog);
 let selected:Mail|undefined,filter:'all'|'unclaimed'='all',opener:HTMLElement|null=null,announcement='';
 const pending=(m:Mail)=>m.attachments.length>0&&!m.claimed;
 function render(focus?:string){
  const unread=mails.filter(m=>!m.read).length,unclaimed=mails.filter(pending).length;
  const shown=mails.filter(m=>filter==='all'||pending(m));
  dialog.innerHTML=`<header class="mail-header"><div class="mail-heading"><span class="mail-emblem" aria-hidden="true">✉</span><div><small>IMPERIAL POST</small><h2 id="mail-title">${selected?'서신 읽기':'우편함'}</h2></div></div><button data-close aria-label="우편함 닫기">×</button></header>
   <div class="mail-caption"><span>${selected?'제국에서 도착한 서신':'지휘관님께 도착한 소식'}</span><span class="mail-preview-label">예시 우편</span></div>
   ${selected?`<div class="mail-detail-scroll" tabindex="0" aria-label="우편 내용"><article class="mail-letter"><div class="mail-letter-top"><span>${selected.sender}</span><span>${selected.date}</span></div><h3>${selected.title}</h3><div class="mail-letter-body">${selected.body.map(p=>`<p>${p}</p>`).join('')}</div><div class="mail-signature">${selected.sender}<span aria-hidden="true">✦</span></div></article>
    <section class="mail-attachments" aria-label="첨부 보상"><h3>첨부 보상 <span>${selected.attachments.length}</span></h3>${selected.attachments.length?`<div class="mail-reward-grid">${selected.attachments.map(a=>`<div class="mail-reward"><span class="mail-reward-icon">${a.image?`<img src="${import.meta.env.BASE_URL}assets/lobby/${a.image}" alt="" width="48" height="48">`:`<span aria-hidden="true">${a.symbol}</span>`}</span><strong>${a.amount.toLocaleString()}</strong><small>${a.name}</small></div>`).join('')}</div>`:'<p class="mail-no-attachments">첨부된 보상이 없습니다.</p>'}</section><p class="mail-expiry">${selected.expires}</p></div>
    <footer class="mail-footer"><button data-list>‹ 목록</button><button class="mail-gold-button" data-claim ${pending(selected)?'':'disabled'}>${selected.attachments.length?(selected.claimed?'수령 완료':'보상 받기'):'첨부 보상 없음'}</button></footer>`:
   `<div class="mail-tabs" role="group" aria-label="우편 분류"><button data-filter="all" aria-pressed="${filter==='all'}">전체 우편 <span>${mails.length}</span></button><button data-filter="unclaimed" aria-pressed="${filter==='unclaimed'}">미수령 <span>${unclaimed}</span></button></div><div class="mail-list-summary"><span>읽지 않은 우편 <strong>${unread}</strong></span><span>보관 ${mails.length} / 50</span></div>
    <div class="mail-list" tabindex="0" aria-label="받은 우편 목록">${shown.length?shown.map(m=>`<button class="mail-row ${m.read?'is-read':''}" data-mail="${m.id}" aria-label="${m.title} · ${m.read?'읽음':'읽지 않음'}"><span class="mail-envelope" aria-hidden="true">${m.read?'▱':'✉'}${!m.read?'<i></i>':''}</span><span class="mail-row-content"><strong>${m.title}</strong><span>${m.sender} · ${m.date}</span><small>${m.expires}</small></span><span class="mail-row-state">${m.claimed?'수령 완료':pending(m)?'보상 있음':'안내'}<b aria-hidden="true">›</b></span></button>`).join(''):'<div class="mail-empty"><span aria-hidden="true">✉</span><h3>미수령 우편이 없습니다</h3><p>모든 첨부 보상을 확인했습니다.</p></div>'}</div><footer class="mail-footer"><span class="mail-footer-note">보상 우편 ${unclaimed}개</span><button class="mail-gold-button" data-claim-all ${unclaimed?'':'disabled'}>모두 받기</button></footer>`}
   <p class="mail-status" role="status" aria-live="polite">${announcement}</p>`;
  if(focus)dialog.querySelector<HTMLElement>(focus)?.focus({preventScroll:true});
 }
 dialog.addEventListener('click',event=>{
  const b=(event.target as HTMLElement).closest<HTMLButtonElement>('button');if(!b||b.disabled)return;
  if(b.hasAttribute('data-close')){dialog.close();return;}
  if(b.dataset.mail){selected=mails.find(m=>m.id===b.dataset.mail);if(selected)selected.read=true;announcement='';render('[data-list]');return;}
  if(b.hasAttribute('data-list')){const id=selected?.id;selected=undefined;announcement='';render(`[data-mail="${id}"]`);return;}
  if(b.dataset.filter==='all'||b.dataset.filter==='unclaimed'){filter=b.dataset.filter;announcement='';render(`[data-filter="${filter}"]`);return;}
  if(b.hasAttribute('data-claim')&&selected&&pending(selected)){selected.claimed=true;selected.read=true;announcement='예시 우편의 수령 상태를 확인했습니다. 실제 보상은 지급되지 않습니다.';render('[data-list]');return;}
  if(b.hasAttribute('data-claim-all')){mails.filter(pending).forEach(m=>{m.claimed=true;m.read=true;});announcement='예시 우편의 수령 상태를 확인했습니다. 실제 보상은 지급되지 않습니다.';render('[data-filter="unclaimed"]');}
 });
 dialog.addEventListener('close',()=>{if(opener?.isConnected)opener.focus({preventScroll:true});});
 window.addEventListener('hashchange',()=>{if(dialog.open)dialog.close();});
 return {open(){opener=document.activeElement as HTMLElement;selected=undefined;filter='all';announcement='';render();if(!dialog.open)dialog.showModal();}};
}

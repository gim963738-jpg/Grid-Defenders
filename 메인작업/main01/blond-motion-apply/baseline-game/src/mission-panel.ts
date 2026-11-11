import './mission-panel.css';

type Mission={id:string;name:string;description:string;target:number;reward:string;icon:string};
const MISSIONS:Record<'daily'|'weekly',Mission[]>={
 daily:[
  {id:'daily-battle',name:'오늘의 첫 출정',description:'전투를 1회 완료하세요.',target:1,reward:'제국 골드 100',icon:'⚔'},
  {id:'daily-monster',name:'숲의 위협 제거',description:'일반 몬스터를 100마리 처치하세요.',target:100,reward:'제국 골드 150',icon:'♟'},
  {id:'daily-training',name:'꾸준한 단련',description:'병영에서 훈련을 1회 진행하세요.',target:1,reward:'하급 성장 두루마리 1개',icon:'♜'},
  {id:'daily-hero',name:'함께하는 성장',description:'영웅 성장을 1회 진행하세요.',target:1,reward:'제국 골드 100',icon:'✧'},
  {id:'daily-wave',name:'흔들리지 않는 전열',description:'웨이브를 누적 10회 돌파하세요.',target:10,reward:'푸른 크리스탈 5개',icon:'⚑'},
 ],
 weekly:[
  {id:'weekly-battle',name:'끊임없는 원정',description:'전투를 누적 15회 완료하세요.',target:15,reward:'제국 골드 1,000',icon:'⚔'},
  {id:'weekly-monster',name:'숲의 수호자',description:'몬스터를 누적 2,000마리 처치하세요.',target:2000,reward:'중급 성장 두루마리 3개',icon:'♟'},
  {id:'weekly-boss',name:'강적을 넘어',description:'보스를 누적 5회 처치하세요.',target:5,reward:'푸른 크리스탈 30개',icon:'♛'},
  {id:'weekly-training',name:'정예 부대 육성',description:'병영 훈련을 누적 20회 진행하세요.',target:20,reward:'제국 골드 800',icon:'♜'},
  {id:'weekly-growth',name:'새로운 경지',description:'영웅 성장을 누적 10회 진행하세요.',target:10,reward:'상급 성장 두루마리 1개',icon:'✧'},
 ],
};

export function mountMissionPanel(){
 const dialog=document.createElement('dialog');dialog.className='mission-panel';
 dialog.setAttribute('aria-labelledby','mission-title');document.body.append(dialog);
 let tab:'daily'|'weekly'='daily',opener:HTMLElement|null=null;
 function render(){
  const label=tab==='daily'?'일일':'주간',missions=MISSIONS[tab];
  dialog.innerHTML=`<div class="mission-parchment"><header class="mission-header"><div><span>IMPERIAL MISSIONS</span><h2 id="mission-title">제국의 임무</h2></div><button data-close aria-label="임무 창 닫기">×</button></header>
   <div class="mission-tabs" role="tablist" aria-label="임무 분류">${(['daily','weekly'] as const).map(id=>`<button role="tab" id="mission-tab-${id}" data-tab="${id}" aria-selected="${tab===id}" aria-controls="mission-list" tabindex="${tab===id?0:-1}">${id==='daily'?'일일 임무':'주간 임무'}</button>`).join('')}</div>
   <div class="mission-overview"><div><span>${tab==='daily'?'매일 쌓아가는 작은 성취':'한 주의 도전과 특별한 보상'}</span><h3>${label} 임무 현황</h3></div><strong>0 <span>/ ${missions.length}</span></strong></div>
   <div class="mission-list" id="mission-list" role="tabpanel" aria-labelledby="mission-tab-${tab}" tabindex="0">${missions.map((m,i)=>`<article class="mission-card"><div class="mission-card-top"><span class="mission-seal" aria-hidden="true">${m.icon}</span><div><small>MISSION ${String(i+1).padStart(2,'0')}</small><h4>${m.name}</h4></div><span class="mission-state">진행중</span></div>
    <p>${m.description}</p><div class="mission-progress-row"><div class="mission-progress" role="progressbar" aria-label="${m.name}" aria-valuemin="0" aria-valuenow="0" aria-valuemax="${m.target}"><span></span></div><span>0 / ${m.target.toLocaleString()}</span></div>
    <div class="mission-card-bottom"><div class="mission-reward"><span>보상</span><strong>${m.reward}</strong></div><button disabled aria-label="${m.name} 보상 받기 · 진행중">받기</button></div></article>`).join('')}</div>
   <footer class="mission-footer"><div><span>${label} 임무 완료</span><strong>0 / ${missions.length}</strong></div><button disabled>모두 받기</button></footer></div>`;
 }
 dialog.addEventListener('click',event=>{const b=(event.target as HTMLElement).closest<HTMLButtonElement>('button');if(!b||b.disabled)return;if(b.hasAttribute('data-close')){dialog.close();return;}if(b.dataset.tab==='daily'||b.dataset.tab==='weekly'){tab=b.dataset.tab;render();dialog.querySelector<HTMLElement>(`[data-tab="${tab}"]`)?.focus({preventScroll:true});}});
 dialog.addEventListener('keydown',event=>{if(!(event.target instanceof HTMLElement)||!event.target.matches('[role=tab]'))return;if(['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){event.preventDefault();tab=event.key==='Home'?'daily':event.key==='End'?'weekly':tab==='daily'?'weekly':'daily';render();dialog.querySelector<HTMLElement>(`[data-tab="${tab}"]`)?.focus({preventScroll:true});}});
 dialog.addEventListener('close',()=>{if(opener?.isConnected)opener.focus({preventScroll:true});});
 window.addEventListener('hashchange',()=>{if(dialog.open)dialog.close();});
 return {open(){opener=document.activeElement as HTMLElement;tab='daily';render();if(!dialog.open)dialog.showModal();}};
}

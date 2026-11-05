import {TRAININGS,TRAINING_RULES,trainingProgress} from './training';
import './training-screen.css';
export function mountTrainingScreen(){
 const screen=document.createElement('main');screen.className='camp training-screen';screen.hidden=true;screen.setAttribute('aria-label','병영 훈련소');
 const workspace=document.createElement('div');workspace.className='training-workspace';workspace.hidden=true;
 const support=document.createElement('aside');support.className='training-support';support.setAttribute('aria-label','훈련 개발자 도구와 설명');workspace.append(screen,support);document.body.append(workspace);
 let message='';
 function draw(focus?:string){
  const openDetails=[...support.querySelectorAll<HTMLDetailsElement>('details[open]')].map(n=>n.className);
  const s=trainingProgress.snapshot(),bonuses=trainingProgress.bonuses(),complete=TRAININGS.filter(t=>s.levels[t.id]===10).length;
  screen.innerHTML=`<header class="hero-header"><button data-back aria-label="병영으로 돌아가기">‹</button><h1 tabindex="-1">훈련소</h1><span class="training-wallet"><small>제국 골드</small><b>${s.gold.toLocaleString()}</b></span><button data-home aria-label="로비 홈">⌂</button></header>
   <section class="training-intro"><span>IMPERIAL TRAINING</span><h2>부대의 한계를 높이세요</h2><p>영웅 · 병사 공통 강화</p><strong>${s.rank+1}등급 훈련</strong></section>
   <section class="training-pillars" aria-label="네 가지 훈련">${TRAININGS.map((t,i)=>{const level=s.levels[t.id],cost=trainingProgress.cost(t.id),total=(s.rank*10+level)*t.step;return `<article class="training-pillar pillar-${t.id}"><div class="training-emblem" aria-hidden="true">${t.icon}</div><h3>${t.name}</h3><strong class="training-total">+${total}%</strong><div class="training-tower" role="img" aria-label="${t.name} ${level}/10단계">${Array.from({length:10},(_,i)=>{const n=10-i;return `<span class="training-step ${n<=level?'filled':''}" aria-hidden="true">${n}</span>`;}).join('')}</div><b class="training-level">${level}<small> / 10</small></b><p class="training-next">${cost===null?'훈련 완료':`다음 +${t.step}%`}</p><button data-train="${t.id}" ${cost===null||s.gold<cost?'disabled':''} aria-label="${t.name} 훈련${cost===null?' 완료':` · 제국 골드 ${cost}`}" >${cost===null?'MAX':`<span>훈련</span><small>${cost.toLocaleString()} G</small>`}</button></article>`;}).join('')}</section>
   <section class="training-promotion"><p>최고 단계 달성 <b>${complete} / 4</b></p><button data-promote ${trainingProgress.canPromote()?'':'disabled'}>✦ ${s.rank+2}등급으로 승급</button></section>
   <section class="training-summary" aria-labelledby="training-summary-title">
    <div class="training-summary-heading"><h2 id="training-summary-title">총 훈련 능력치</h2><span>영웅 · 병사 공통</span></div>
    <table><thead><tr><th scope="col">능력치</th><th scope="col">누적 증가</th><th scope="col">현재 등급 목표</th></tr></thead>
    <tbody>${TRAININGS.map(t=>{const total=(s.rank*10+s.levels[t.id])*t.step,target=(s.rank+1)*10*t.step;return `<tr class="pillar-${t.id}"><th scope="row">${t.name}</th><td><strong>+${total}%</strong><div class="training-summary-track" role="progressbar" aria-label="${t.name} 누적 증가" aria-valuemin="0" aria-valuenow="${total}" aria-valuemax="${target}" aria-valuetext="${target}% 목표 중 ${total}% 증가"><span style="width:${total/target*100}%"></span></div></td><td>+${target}%</td></tr>`;}).join('')}</tbody></table>
   </section>
   <p class="training-message" role="status" aria-live="polite" ${message?'':'hidden'}>${message}</p>
`;
  support.innerHTML=`<h2>훈련 개발자 도구</h2>
   <details class="training-help"><summary>훈련 효과와 제국 골드</summary><p>공격력·체력은 단계당 +${TRAININGS[0].step}%, 일반·보스 피해는 +${TRAININGS[2].step}%입니다. 비용은 ${TRAINING_RULES.baseCost} × 등급 × 다음 단계입니다.</p><p>일반 전투 종료 보상: 처치 수 ×${TRAINING_RULES.killReward} + 완료 웨이브 ×${TRAINING_RULES.waveReward}. 전투 중 사용하는 골드와 별도 재화입니다.</p><p>현재 합계: 공격력 +${Math.round((bonuses.attackMultiplier-1)*100)}% · 체력 +${Math.round((bonuses.healthMultiplier-1)*100)}%</p></details>
   <details class="training-test"><summary>개발자 테스트</summary><button data-grant>제국 골드 +10,000</button></details>
`;
  for(const name of openDetails)support.querySelector<HTMLDetailsElement>(`details.${name}`)?.setAttribute('open','');
  if(focus)(screen.querySelector<HTMLElement>(focus)??support.querySelector<HTMLElement>(focus))?.focus({preventScroll:true});
 }
 const handleClick=(event:Event)=>{const b=(event.target as HTMLElement).closest<HTMLButtonElement>('button');if(!b||b.disabled)return;
  if(b.hasAttribute('data-back')){location.hash='barracks';return;}if(b.hasAttribute('data-home')){location.hash='';return;}
  if(b.dataset.train){if(trainingProgress.train(b.dataset.train as typeof TRAININGS[number]['id']))message='훈련 완료 · 영웅과 병사의 능력치가 함께 상승했습니다.';draw(`[data-train="${b.dataset.train}"]`);}
  else if(b.hasAttribute('data-promote')){if(trainingProgress.promote())message='승급 완료 · 누적 효과를 유지하고 다음 등급 훈련을 시작합니다.';draw('[data-promote]');}
  else if(b.hasAttribute('data-grant')){trainingProgress.grant(10000);message='테스트 제국 골드 10,000을 지급했습니다.';draw('[data-grant]');}
 };
 screen.addEventListener('click',handleClick);support.addEventListener('click',handleClick);
 const sync=()=>{screen.hidden=location.hash!=='#training';workspace.hidden=screen.hidden;if(!screen.hidden){draw();window.scrollTo(0,0);screen.querySelector<HTMLElement>('h1')?.focus({preventScroll:true});}};
 window.addEventListener('hashchange',sync);window.addEventListener('storage',()=>{if(!screen.hidden)draw();});window.addEventListener('training-change',()=>{if(!screen.hidden)draw();});sync();
}

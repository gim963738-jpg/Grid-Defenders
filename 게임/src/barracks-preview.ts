import {mountTrainingScreen} from './training-screen';
import './barracks-preview.css';

export function mountBarracksPreview(openPanel:(name:string)=>void) {
  const screen=document.createElement('main');
  screen.className='camp barracks-screen';
  screen.hidden=true;
  screen.setAttribute('aria-label','병영');
  const asset=`${import.meta.env.BASE_URL}assets/lobby/camp-concept.png`;
  const icon=(x:number,y:number,w:number,h:number)=>`<svg viewBox="${x} ${y} ${w} ${h}" aria-hidden="true"><image href="${asset}" width="948" height="1659"/></svg>`;
  screen.innerHTML=`<header class="hero-header"><button data-home aria-label="로비로 돌아가기">‹</button><h1 tabindex="-1">병영</h1><div class="hero-wallet"><span>✦ <b>480</b></span><span>⚒ <b>0</b></span></div><button data-home aria-label="로비 홈">⌂</button></header>
    <section class="barracks-content" aria-label="병영 메뉴"><div class="barracks-heading"><small>BARRACKS</small><h2>부대의 힘을 기르는 곳</h2><p>이용할 메뉴를 선택하세요.</p></div>
    <div class="barracks-compass">
      <div class="barracks-orbit" aria-hidden="true"></div>
      <button class="diamond-card north" data-card="훈련" aria-label="훈련"><span class="diamond-content"><span class="diamond-art">${icon(435,1512,82,77)}</span><strong>훈련</strong></span></button>
      <button class="diamond-card east" data-card="특기" aria-label="특기"><span class="diamond-content"><span class="diamond-art">${icon(803,1516,82,70)}</span><strong>특기</strong></span></button>
      <button class="diamond-card south undecided" data-card="미정" aria-label="남쪽 미정"><span class="diamond-content"><span class="diamond-unknown" aria-hidden="true">?</span><strong>미정</strong></span></button>
      <button class="diamond-card west undecided" data-card="미정" aria-label="서쪽 미정"><span class="diamond-content"><span class="diamond-unknown" aria-hidden="true">?</span><strong>미정</strong></span></button>
      <span class="barracks-center" aria-hidden="true">✦</span>
    </div><p class="barracks-status" role="status" aria-live="polite">훈련 · 특기 · 미정 · 미정</p></section>
    <nav class="hero-bottom-nav" aria-label="로비 메뉴">${[['상점','♜'],['영웅','♞'],['전투','⚔'],['병영','⌂'],['기록','▤']].map(([name,art])=>`<button data-nav="${name}" ${name==='병영'?'class="active" aria-current="page"':''}><span>${art}</span>${name}</button>`).join('')}</nav><p class="hero-preview-note">디자인 미리보기 · 게임 데이터 연결 전</p>`;
  document.body.append(screen);
  mountTrainingScreen();
  let opener:HTMLElement|null=null;
  screen.addEventListener('click',event=>{
    const button=(event.target as HTMLElement).closest<HTMLButtonElement>('button');
    if(!button)return;
    if(button.hasAttribute('data-home')||button.dataset.nav==='전투'){location.hash='';return;}
    if(button.dataset.nav==='영웅'){location.hash='heroes';return;}
    if(button.dataset.card==='훈련'){location.hash='training';return;}
    if(button.dataset.card){
      screen.querySelectorAll('.diamond-card').forEach(card=>card.classList.toggle('chosen',card===button));
      screen.querySelector<HTMLElement>('.barracks-status')!.textContent=button.dataset.card==='미정'?'아직 정해지지 않은 메뉴입니다.':`${button.dataset.card} 메뉴는 준비 중입니다.`;
      return;
    }
    if(button.dataset.nav&&button.dataset.nav!=='병영')openPanel(button.dataset.nav);
  });
  function sync(){
    const visible=location.hash==='#barracks';
    const wasVisible=!screen.hidden;
    screen.hidden=!visible;
    if(visible){window.scrollTo(0,0);screen.querySelector<HTMLElement>('h1')?.focus({preventScroll:true});}
    else if(wasVisible&&location.hash==='')opener?.focus({preventScroll:true});
  }
  window.addEventListener('hashchange',sync);
  sync();
  return {open(){opener=document.activeElement as HTMLElement;location.hash='barracks';}};
}

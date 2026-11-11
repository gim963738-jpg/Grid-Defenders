import './battle-continuation.css';

/** Page lifecycle stops combat independently of animation/frame throttling. */
export function createBattleContinuation(options:{
  active:()=>boolean;
  paused:()=>boolean;
  canShow:()=>boolean;
  pause:()=>void;
  resume:()=>void;
  save:()=>boolean;
  hidden?:()=>boolean;
}) {
  const events=new AbortController(),dialog=document.createElement('dialog');
  const hidden=options.hidden??(()=>document.hidden);
  dialog.id='battle-resume-dialog';
  dialog.setAttribute('aria-labelledby','battle-resume-title');
  dialog.setAttribute('aria-describedby','battle-resume-description');
  dialog.innerHTML='<h2 id="battle-resume-title"></h2><p id="battle-resume-description"></p><p class="battle-save-failed" role="status" hidden>브라우저에 전투를 저장하지 못했습니다. 현재 화면에서는 계속 플레이할 수 있습니다.</p><div><button data-resume-secondary></button><button data-resume-primary></button></div>';
  document.body.append(dialog);
  const title=dialog.querySelector('h2')!,description=dialog.querySelector('#battle-resume-description')!;
  const primary=dialog.querySelector<HTMLButtonElement>('[data-resume-primary]')!;
  const secondary=dialog.querySelector<HTMLButtonElement>('[data-resume-secondary]')!;
  let pending:'background'|'saved'|'retry'|null=null,restart:(()=>void)|null=null,retry:(()=>void)|null=null,savedDescription='';
  function clear(){pending=null;restart=null;retry=null;if(dialog.open)dialog.close();}
  function show(){
    if(!pending||hidden()||!options.active()||!options.canShow())return;
    const saved=pending==='saved',failed=pending==='retry';
    title.textContent=failed?'보상을 저장하지 못했습니다':saved?'진행 중인 전투가 있습니다':'전투가 일시정지되었습니다';
    description.textContent=saved||failed?savedDescription:'화면을 벗어난 동안 전투를 멈췄습니다. 준비되면 다시 시작하세요.';
    secondary.textContent=saved?'새 전투':'정지 유지';primary.textContent=failed?'다시 시도':saved?'이어하기':'전투 재개';
    if(!dialog.open)dialog.showModal();
    primary.focus({preventScroll:true});
  }
  function suspend(){
    if(!options.active())return;
    const running=!options.paused();options.pause();
    dialog.querySelector<HTMLElement>('.battle-save-failed')!.hidden=options.save();
    if(running&&!pending)pending='background';
  }
  primary.addEventListener('click',()=>{
    if(hidden()||!options.active()||!options.canShow())return;
    const action=retry;clear();if(action)action();else options.resume();options.save();
  },{signal:events.signal});
  secondary.addEventListener('click',()=>{
    const action=pending==='saved'?restart:null;clear();if(action)action();
  },{signal:events.signal});
  dialog.addEventListener('cancel',event=>{event.preventDefault();if(pending!=='saved')clear();},{signal:events.signal});
  document.addEventListener('visibilitychange',()=>{if(hidden())suspend();else show();},{signal:events.signal});
  window.addEventListener('pagehide',suspend,{signal:events.signal});
  window.addEventListener('pageshow',show,{signal:events.signal});
  document.addEventListener('freeze',suspend,{signal:events.signal});
  return {
    suspend,show,clear,
    offerSaved(description:string,onRestart:()=>void){
      options.pause();savedDescription=description;restart=onRestart;pending='saved';show();
    },
    offerRetry(description:string,onRetry:()=>void){
      options.pause();savedDescription=description;retry=onRetry;pending='retry';show();
    },
    dispose(){events.abort();clear();dialog.remove();},
  };
}

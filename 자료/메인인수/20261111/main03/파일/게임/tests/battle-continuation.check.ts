import {createBattleContinuation} from '../src/battleContinuation';

export function checkBattleContinuation(){
 const passed:string[]=[],check=(ok:boolean,name:string)=>{if(!ok)throw Error(name);passed.push(name);};
 let hidden=false,active=true,paused=false,canShow=true,saves=0,resumes=0,restarts=0,retries=0,saveOK=true;
 const controller=createBattleContinuation({active:()=>active,paused:()=>paused,canShow:()=>canShow,hidden:()=>hidden,
  pause:()=>{paused=true;},resume:()=>{paused=false;resumes++;},save:()=>{saves++;return saveOK;}});
 const dialog=[...document.querySelectorAll<HTMLDialogElement>('#battle-resume-dialog')].at(-1)!;
 const primary=dialog.querySelector<HTMLButtonElement>('[data-resume-primary]')!;
 const secondary=dialog.querySelector<HTMLButtonElement>('[data-resume-secondary]')!;
 const visibility=(value:boolean)=>{hidden=value;document.dispatchEvent(new Event('visibilitychange'));};
 try {
  visibility(true);check(paused&&saves===1&&!dialog.open,'background pauses and saves without displaying a hidden modal');
  visibility(false);check(dialog.open&&paused,'return stays paused and asks to resume');
  primary.click();check(!paused&&!dialog.open&&resumes===1,'only resume click resumes combat');
  paused=true;visibility(true);visibility(false);check(paused&&!dialog.open,'manual pause is preserved without an unnecessary return prompt');
  paused=false;visibility(true);visibility(false);secondary.click();check(paused&&!dialog.open,'keep paused closes the prompt without resuming');
  paused=false;canShow=false;visibility(true);visibility(false);check(paused&&!dialog.open,'scene transition or another dialog defers the prompt');
  canShow=true;controller.show();check(dialog.open,'deferred prompt opens after transition or dialog finishes');
  dialog.dispatchEvent(new Event('cancel',{cancelable:true}));check(paused&&!dialog.open,'Escape keeps a backgrounded battle paused');
  controller.offerSaved('WAVE 3',()=>{restarts++;});
  check(paused&&dialog.open&&primary.textContent==='이어하기','restored battle offers explicit continuation while paused');
  const cancel=new Event('cancel',{cancelable:true});dialog.dispatchEvent(cancel);
  check(cancel.defaultPrevented&&dialog.open,'Escape cannot silently discard a restored battle');
  primary.click();check(resumes===2&&!paused,'restored continuation resumes only when chosen');
  controller.offerSaved('WAVE 4',()=>{restarts++;});secondary.click();check(restarts===1&&!dialog.open,'new battle invokes restart once');
  controller.offerRetry('보상 저장 재시도',()=>{retries++;});
  check(paused&&dialog.open&&primary.textContent==='다시 시도','reward save failure keeps combat paused with retry action');
  primary.click();check(retries===1&&!dialog.open,'retry invokes settlement callback once');
  paused=false;window.dispatchEvent(new Event('pagehide'));check(paused,'pagehide freezes an active battle');
  window.dispatchEvent(new Event('pageshow'));check(dialog.open,'back-forward page restoration requires explicit resume');
  controller.clear();paused=false;document.dispatchEvent(new Event('freeze'));check(paused,'page freeze pauses before browser suspension');
  controller.clear();active=false;paused=false;const before=saves;visibility(true);visibility(false);
  check(!paused&&saves===before&&!dialog.open,'lobby and completed battles do not produce checkpoints or resume prompts');
  active=true;saveOK=false;visibility(true);visibility(false);
  check(dialog.open&&!dialog.querySelector<HTMLElement>('.battle-save-failed')!.hidden,'failed storage reports failure without blocking in-memory play');
  primary.click();check(!paused,'storage failure still allows current battle to resume');
  controller.dispose();const disposedSaves=saves;visibility(true);check(saves===disposedSaves&&!dialog.isConnected,'dispose removes listeners and modal');
  return passed;
 }finally{controller.dispose();}
}

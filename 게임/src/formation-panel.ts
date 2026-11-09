import type {Defense} from './defense';
import {UNITS,type UnitKind} from './defenseConfig';
import {FORMATION,formationRank,canPlaceFormationUnit} from './battleFormation';
import './formation-panel.css';

/** Formation changes use deployed unit ids; the wave field is never rearranged. */
export function createFormationPanel(options:{
 game:Defense;host:HTMLElement;unitArt:(kind:UnitKind)=>string;
 begin:()=>boolean;end:()=>void;changed:()=>void;
}){
 const dialog=document.createElement('dialog'),events=new AbortController(),signal=events.signal;
 dialog.id='battle-formation-dialog';
 dialog.setAttribute('aria-label','유닛 진형 배치');
 dialog.setAttribute('aria-describedby','formation-message');
 dialog.innerHTML=`<header class="formation-heading">
   <div class="formation-direction" aria-label="진행 방향 12시, 위쪽">
     <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21V3m-7 7 7-7 7 7"/></svg><span>진행 방향</span>
   </div>
  </header>
  <div class="formation-scroll"><div class="formation-layout">
   <div class="formation-bands" aria-hidden="true"><span>전열</span><span>중열</span><span>후열</span></div>
   <div class="formation-board" role="group" aria-label="가로 7칸, 세로 6칸 진형"></div>
  </div></div>
  <footer class="formation-footer"><button type="button" data-formation-close>완료</button><button type="button" data-formation-auto>자동배치</button><p id="formation-message" role="status" aria-live="polite"></p></footer>`;
 document.body.append(dialog);
 const board=dialog.querySelector<HTMLElement>('.formation-board')!,message=dialog.querySelector<HTMLElement>('#formation-message')!;
 const auto=dialog.querySelector<HTMLButtonElement>('[data-formation-auto]')!;
 const footer=dialog.querySelector<HTMLElement>('.formation-footer')!;
 let selected:number|null=null,opener:HTMLElement|null=null;
 function position(){
  const bounds=options.host.getBoundingClientRect();
  dialog.style.left=`${bounds.right-276}px`;dialog.style.top=`${bounds.top+44}px`;
  footer.style.left=`${bounds.left+160}px`;footer.style.top=`${bounds.top+260}px`;
 }
 function reposition(){if(dialog.open)position();}
 window.addEventListener('resize',reposition,{signal});
 window.addEventListener('scroll',reposition,{signal,passive:true});
 window.visualViewport?.addEventListener('resize',reposition,{signal});
 const buttons=Array.from({length:FORMATION.size},(_,cell)=>{
  const button=document.createElement('button');button.type='button';button.className='formation-cell';
  button.dataset.formationCell=String(cell);button.dataset.rank=String(formationRank(cell));
  board.append(button);return button;
 });
 function hint(text?:string){
  const unit=options.game.units.find(u=>u.id===selected);
  message.textContent=text??(unit?`${UNITS[unit.kind].name} · ${UNITS[unit.kind].hero?'중열의 칸 선택':'이동할 칸 선택'}`:options.game.units.length?'유닛 선택 → 이동·교환\n영웅은 중열에 배치':'전장에 병사·영웅을 먼저 소환하세요.');
 }
 function draw(){
  const placements=options.game.formationSlots(),units=options.game.units;
  if(selected!==null&&!units.some(u=>u.id===selected))selected=null;
  const picked=units.find(u=>u.id===selected);
  for(const [cell,button] of buttons.entries()){
   const placement=placements.find(p=>p.cell===cell),unit=units.find(u=>u.id===placement?.unitId);
   const rank=['전열','중열','후열'][formationRank(cell)];
   button.classList.toggle('occupied',!!unit);
   button.classList.toggle('hero',!!unit&&UNITS[unit.kind].hero);
   button.classList.toggle('picked',!!unit&&unit.id===selected);
   const allowed=!picked||canPlaceFormationUnit(picked,cell)&&(!unit||canPlaceFormationUnit(unit,placements.find(p=>p.unitId===picked.id)!.cell));
   button.classList.toggle('blocked',!allowed);
   button.setAttribute('aria-pressed',String(!!unit&&unit.id===selected));
   button.setAttribute('aria-label',`${rank} ${Math.floor(cell/FORMATION.columns)+1}행 ${cell%FORMATION.columns+1}열 · ${unit?`${UNITS[unit.kind].name} ${unit.level}레벨`:'빈칸'}`);
   button.title=button.getAttribute('aria-label')!;
   const content=unit?`<span class="formation-unit-art" aria-hidden="true">${options.unitArt(unit.kind)}</span><small>${UNITS[unit.kind].hero?'영웅':`Lv.${unit.level}`}</small>`:`<span class="formation-cell-number" aria-hidden="true">${cell+1}</span>`;
   if(button.innerHTML!==content)button.innerHTML=content;
  }
  auto.disabled=units.length===0;hint();
 }
 function finishClose(){
  document.documentElement.classList.remove('formation-editing');selected=null;options.end();
  const target=opener;opener=null;
  if(!document.hidden&&!document.querySelector('dialog[open]')&&target?.isConnected&&!target.matches(':disabled')&&!target.closest('[inert]')&&target.getClientRects().length)target.focus({preventScroll:true});
 }
 function close(){if(!dialog.open)return;dialog.close();finishClose();}
 dialog.addEventListener('click',event=>{
  const button=(event.target as HTMLElement).closest<HTMLButtonElement>('button');
  if(button?.hasAttribute('data-formation-close')){close();return;}
  if(button?.hasAttribute('data-formation-auto')){
   options.game.autoArrangeFormation();selected=null;options.changed();draw();hint('자동배치 완료 · 영웅은 중열');return;
  }
  if(button?.dataset.formationCell!==undefined){
   const cell=Number(button.dataset.formationCell),placements=options.game.formationSlots();
   const occupant=placements.find(p=>p.cell===cell);
   if(selected===null){selected=occupant?.unitId??null;draw();return;}
   if(occupant?.unitId===selected){selected=null;draw();return;}
   if(options.game.moveFormationUnit(selected,cell)){selected=null;options.changed();draw();}
   else hint('영웅은 중열 안에서만 이동·교환할 수 있습니다.');
   return;
  }
  if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)close();}
 },{signal});
 dialog.addEventListener('cancel',event=>{event.preventDefault();close();},{signal});
 // Covers programmatic close as well as native dialog dismissal.
 dialog.addEventListener('close',()=>{if(!dialog.open)finishClose();},{signal});
 return {
  get isOpen(){return dialog.open;},
  open(returnFocus=document.activeElement as HTMLElement|null){if(dialog.open)return true;if(!options.begin())return false;opener=returnFocus;selected=null;draw();document.documentElement.classList.add('formation-editing');position();dialog.showModal();auto.focus({preventScroll:true});return true;},
  close,
  dispose(){close();events.abort();dialog.remove();},
 };
}

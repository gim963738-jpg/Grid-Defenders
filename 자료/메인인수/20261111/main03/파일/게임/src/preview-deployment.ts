import {loadHeroArt,heroImage} from './heroArt';
import {UNITS,type UnitKind} from './defenseConfig';
/** Local UI prototype: placement only; no combat, currency or persisted roster. */
export async function mountPreviewDeployment(frame:HTMLElement,tray:HTMLElement):Promise<void> {
 await loadHeroArt();
 const board=frame.querySelector<HTMLElement>('.field-grid')!;
 const notice=document.querySelector<HTMLElement>('#preview-status')!;
 type Unit={kind:string;name:string;key:string;art:string};
 const occupied=new Map<number,Unit>();
 let selected:Unit|null=null,moveFrom:number|null=null;
 let gesture:{id:number;x:number;y:number;unit:Unit;ghost:HTMLElement|null;dragged:boolean}|null=null;
 let blockClick=false;
 board.innerHTML=Array.from({length:20},(_,i)=>`<button class="deployment-cell" data-cell="${i}" aria-label="${Math.floor(i/5)+1}행 ${i%5+1}열 빈 배치칸"></button>`).join('');
 function unitFrom(button:HTMLElement):Unit {
 const kind=button.dataset.combatKind as UnitKind;
 const color='#'+(UNITS[kind]?.color??0x80b890).toString(16).padStart(6,'0');
 const weapon=kind==='archer'?'<path d="M32 12 37 24 32 31" stroke="#d2b47b"/>':kind==='mage'?`<path d="M33 33V7" stroke="#ab8758"/><circle cx="33" cy="7" r="4" fill="${color}" stroke="none"/>`:'<path d="m32 27 6-20" stroke="#d9e4e6"/>';
 const soldier=`<svg class="soldier-unit-art" viewBox="0 0 48 48" aria-hidden="true"><ellipse cx="20" cy="40" rx="13" ry="4" fill="#10251b55"/><g stroke-width="2" stroke-linejoin="round"><rect x="10" y="15" width="20" height="21" rx="4" fill="${color}" stroke="#172731"/><circle cx="20" cy="11" r="7" fill="#e1c7a5" stroke="#273943"/><g stroke-width="3" fill="none">${weapon}</g></g></svg>`;
 return {kind:button.dataset.deployKind!,name:button.dataset.deployName!,key:button.dataset.deployKey!,art:button.dataset.deployKind==='hero'?heroImage(kind):soldier};
 }
 function clearSelection(){selected=null;moveFrom=null;board.classList.remove('placement-ready');tray.querySelectorAll('[data-deploy-kind]').forEach(card=>card.setAttribute('aria-pressed','false'));}
 function render(){board.querySelectorAll<HTMLButtonElement>('[data-cell]').forEach(cell=>{const index=Number(cell.dataset.cell),unit=occupied.get(index);cell.innerHTML=unit?`<span class="placed-unit ${unit.kind}">${unit.art}</span>`:'';cell.classList.toggle('occupied',!!unit);cell.setAttribute('aria-label',`${Math.floor(index/5)+1}행 ${index%5+1}열 ${unit?.name??'빈 배치칸'}`);});}
 function place(index:number,unit:Unit):boolean {if(occupied.has(index)&&index!==moveFrom){notice.textContent='이미 배치된 칸입니다. 빈 칸을 선택하세요.';return false;}if(unit.kind==='hero'&&[...occupied.entries()].some(([cell,placed])=>cell!==moveFrom&&placed.key===unit.key)){notice.textContent='이 영웅 카드는 이미 배치되어 있습니다. 배치된 영웅을 눌러 이동하세요.';return false;}if(moveFrom!==null)occupied.delete(moveFrom);occupied.set(index,unit);render();notice.textContent=`${unit.name} 배치 완료 · ${occupied.size} / 20칸`;clearSelection();return true;}
 tray.addEventListener('click',event=>{const card=(event.target as HTMLElement).closest<HTMLElement>('[data-deploy-kind]');if(!card)return;selected=unitFrom(card);moveFrom=null;board.classList.add('placement-ready');notice.textContent=`${selected.name}: 빈 배치칸을 누르거나 카드를 위로 드래그하세요.`;});
 board.addEventListener('click',event=>{const cell=(event.target as HTMLElement).closest<HTMLElement>('[data-cell]');if(!cell||blockClick)return;const index=Number(cell.dataset.cell);if(selected){place(index,selected);return;}const unit=occupied.get(index);if(unit){selected=unit;moveFrom=index;board.classList.add('placement-ready');notice.textContent=`${unit.name}: 이동할 빈 칸을 선택하세요.`;}});
 tray.addEventListener('pointerdown',event=>{if(event.button!==0)return;const card=(event.target as HTMLElement).closest<HTMLElement>('[data-deploy-kind]');if(!card)return;gesture={id:event.pointerId,x:event.clientX,y:event.clientY,unit:unitFrom(card),ghost:null,dragged:false};});
 document.addEventListener('pointermove',event=>{if(!gesture||gesture.id!==event.pointerId)return;const dx=event.clientX-gesture.x,dy=event.clientY-gesture.y;if(!gesture.dragged){if(tray.classList.contains('is-dragging')){gesture=null;return;}if(Math.hypot(dx,dy)<8)return;if(gesture.unit.kind==='hero'&&Math.abs(dx)>=Math.abs(dy))return;gesture.dragged=true;tray.classList.add('deploy-dragging');tray.setPointerCapture(event.pointerId);gesture.ghost=document.createElement('div');gesture.ghost.className='deployment-ghost';gesture.ghost.innerHTML=gesture.unit.art;document.body.append(gesture.ghost);board.classList.add('placement-ready');}event.preventDefault();gesture.ghost!.style.left=`${event.clientX}px`;gesture.ghost!.style.top=`${event.clientY}px`;board.querySelectorAll('.drop-target').forEach(cell=>cell.classList.remove('drop-target'));document.elementFromPoint(event.clientX,event.clientY)?.closest('.deployment-cell')?.classList.add('drop-target');},{passive:false});
 function finish(event:PointerEvent,cancel=false){if(!gesture||gesture.id!==event.pointerId)return;const drag=gesture;gesture=null;drag.ghost?.remove();tray.classList.remove('deploy-dragging');board.querySelectorAll('.drop-target').forEach(cell=>cell.classList.remove('drop-target'));if(drag.dragged){blockClick=true;window.setTimeout(()=>{blockClick=false;},120);if(!cancel){const cell=document.elementFromPoint(event.clientX,event.clientY)?.closest<HTMLElement>('.deployment-cell');moveFrom=null;if(cell)place(Number(cell.dataset.cell),drag.unit);else{clearSelection();notice.textContent='배치가 취소되었습니다. 배치칸 안에 놓아주세요.';}}else clearSelection();}if(tray.hasPointerCapture(event.pointerId))tray.releasePointerCapture(event.pointerId);}
 document.addEventListener('pointerup',event=>finish(event));
 document.addEventListener('pointercancel',event=>finish(event,true));
 frame.addEventListener('click',event=>{if(blockClick&&event.detail!==0){event.preventDefault();event.stopImmediatePropagation();}},true);
 frame.addEventListener('preview-selection-reset',()=>{gesture?.ghost?.remove();gesture=null;tray.classList.remove('deploy-dragging');board.querySelectorAll('.drop-target').forEach(cell=>cell.classList.remove('drop-target'));clearSelection();});
}

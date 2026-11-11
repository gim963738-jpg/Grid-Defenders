import {mountPreviewDeployment} from './preview-deployment';
import {nextCombatSpeed} from './combatPlayback';
import './mobile-ui.css';
import './battle-landscape-preview.css';
import {ITEMS} from './defenseConfig';
import {itemArt} from './itemArt';
const frame=document.querySelector('.landscape')!;
document.querySelector('#offers')!.innerHTML=ITEMS.slice(0,5).map(item=>`<button class="offer" aria-label="${item.name} ${item.price}골드 시안"><span class="item-art">${itemArt(item)}</span><small>${item.price} G</small></button>`).join('');
// Reuse lobby portrait atlas crops without loading the lobby's stateful module.
const portraitNames=['브란','아리아','셀린','벨라','카이','리나','제노','에이라'];
const randomPortraits=Array.from({length:8},(_,i)=>i);
for(let i=randomPortraits.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[randomPortraits[i],randomPortraits[j]]=[randomPortraits[j],randomPortraits[i]];}
const previewHeroes=[1,4,...randomPortraits.slice(0,7)];
document.querySelector('.heroes')!.innerHTML=previewHeroes.map((portrait,index)=>{const x=[39,266,492,719][portrait%4],y=portrait<4?968:1223;return `<button class="preview-hero-card" data-combat-kind="${['tank','melee','healer','arcanist','ranged','healer','melee','healer'][portrait]}" data-deploy-kind="hero" data-deploy-name="${portraitNames[portrait]}" data-deploy-key="hero-${index}" aria-label="${portraitNames[portrait]} 영웅 카드 ${index+1}" aria-pressed="false"><svg class="preview-hero-portrait" viewBox="${x} ${y} 192 108" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><image href="${import.meta.env.BASE_URL}assets/lobby/hero-concept.png" width="948" height="1659"/></svg><span>${portraitNames[portrait]}</span></button>`;}).join('');
document.querySelectorAll<HTMLButtonElement>('.soldiers button').forEach((button,index)=>{button.dataset.deployKind='soldier';button.dataset.combatKind=['guard','archer','mage'][index];button.dataset.deployName=button.querySelector('b')!.textContent!;button.dataset.deployKey=`soldier-${index}`;});
document.querySelector('#shop-preview')!.innerHTML=document.querySelector('#offers')!.innerHTML;
document.querySelector('.bag')!.innerHTML=Array.from({length:15},(_,i)=>`<button aria-label="빈 가방 칸 ${i+1}"></button>`).join('');
document.querySelector('#guides')!.addEventListener('click',e=>{const show=frame.classList.toggle('show-guides');const button=e.currentTarget as HTMLButtonElement;button.setAttribute('aria-pressed',String(show));button.textContent=`영역 표시 ${show?'ON':'OFF'}`;});
document.querySelector('.hero-gear-grid')!.innerHTML=Array.from({length:20},(_,i)=>`<button aria-label="빈 영웅 장비칸 ${i+1}"></button>`).join('');
const inventory=document.querySelector<HTMLElement>('#inventory-window')!;
const launchers=[...document.querySelectorAll<HTMLButtonElement>('[data-panel]')];
let opener:HTMLButtonElement|null=null;
function closeInventory(){inventory.hidden=true;launchers.forEach(button=>{button.setAttribute('aria-pressed','false');button.setAttribute('aria-expanded','false');});opener?.focus();}
launchers.forEach(button=>button.addEventListener('click',()=>{if(button.closest('.right-action-buttons')){openBottomTray(button);return;}closeBottomTray(false);if(!inventory.hidden&&opener===button){closeInventory();return;}opener=button;inventory.hidden=false;launchers.forEach(tab=>{tab.setAttribute('aria-pressed',String(tab===button));tab.setAttribute('aria-expanded',String(tab===button));});document.querySelectorAll<HTMLElement>('.command-body>section').forEach(panel=>panel.hidden=panel.id!==button.dataset.panel);document.querySelector('#inventory-title')!.textContent=button.dataset.panel==='soldier-summon'?'병사 소환':button.dataset.panel==='hero-summon'?'영웅 소환':button.dataset.panel==='shop-preview'?'상점':'인게임 장비';document.querySelector('.command-body')!.scrollTop=0;document.querySelector<HTMLButtonElement>('#inventory-close')!.focus();}));
document.querySelector('#inventory-close')!.addEventListener('click',closeInventory);
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!inventory.hidden)closeInventory();});
document.querySelectorAll<HTMLButtonElement>('.offer,.soldiers button,.heroes button,.hero-gear-grid button,.bag button').forEach(button=>button.addEventListener('click',()=>{document.querySelector('#preview-status')!.textContent='독립 UI 시안입니다. 구매·소환·장착은 게임 연결 후 적용됩니다.';}));

// Only the preview marker is animated. No live run or stored rewards are touched.
const pauseButton=document.querySelector<HTMLButtonElement>('#preview-pause')!;
const speedButton=document.querySelector<HTMLButtonElement>('#preview-speed')!;
const marker=document.querySelector<HTMLElement>('.patrol-preview-marker')!;
let previewSpeed=1,previewPaused=false;
const patrol=marker.animate([{offsetDistance:'0%'},{offsetDistance:'100%'}],{duration:20000,iterations:Infinity,easing:'linear'});
pauseButton.addEventListener('click',()=>{previewPaused=!previewPaused;previewPaused?patrol.pause():patrol.play();pauseButton.setAttribute('aria-pressed',String(previewPaused));pauseButton.setAttribute('aria-label',previewPaused?'재개':'일시정지');pauseButton.querySelector('path')!.setAttribute('d',previewPaused?'m8 5 11 7-11 7Z':'M8 5v14M16 5v14');});
speedButton.addEventListener('click',()=>{previewSpeed=nextCombatSpeed(previewSpeed);patrol.updatePlaybackRate(previewSpeed);speedButton.querySelector('span')!.textContent=`${previewSpeed}×`;speedButton.setAttribute('aria-label',`배속 변경, 현재 ${previewSpeed}배`);});

const rightActions=document.querySelector<HTMLElement>('.right-action-buttons')!;
const bottomTray=document.querySelector<HTMLElement>('#bottom-action-tray')!;
let trayTimer:number|undefined,trayOpener:HTMLButtonElement|null=null;
function closeBottomTray(restoreFocus=true){frame.dispatchEvent(new Event('preview-selection-reset'));window.clearTimeout(trayTimer);bottomTray.hidden=true;rightActions.classList.remove('sliding-out');rightActions.inert=false;rightActions.querySelectorAll('button').forEach(button=>{button.setAttribute('aria-pressed','false');button.setAttribute('aria-expanded','false');});if(restoreFocus)trayOpener?.focus();trayOpener=null;}
function openBottomTray(button:HTMLButtonElement){frame.dispatchEvent(new Event('preview-selection-reset'));if(!inventory.hidden)closeInventory();window.clearTimeout(trayTimer);trayOpener=button;const kind=button.dataset.panel;const source=kind==='soldier-summon'?document.querySelector('.soldiers')!:kind==='hero-summon'?document.querySelector('.heroes')!:document.querySelector('#offers')!;bottomTray.innerHTML=source.innerHTML;bottomTray.scrollLeft=0;bottomTray.setAttribute('aria-label',kind==='soldier-summon'?'병사 소환 목록':kind==='hero-summon'?'영웅 소환 목록':'상점 아이템 목록');bottomTray.dataset.kind=kind;bottomTray.hidden=true;button.setAttribute('aria-pressed','true');button.setAttribute('aria-expanded','true');rightActions.classList.add('sliding-out');rightActions.inert=true;trayTimer=window.setTimeout(()=>{bottomTray.hidden=false;bottomTray.querySelector<HTMLButtonElement>('button')?.focus({preventScroll:true});},200);}
frame.addEventListener('click',event=>{const target=event.target as HTMLElement;if(target.closest('button,a,#bottom-action-tray,#inventory-window,.right-action-buttons'))return;if(trayOpener)closeBottomTray(false);});
bottomTray.addEventListener('click',event=>{const button=(event.target as HTMLElement).closest('button');if(!button)return;bottomTray.querySelectorAll('button').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));document.querySelector('#preview-status')!.textContent='선택 표시만 확인하는 UI 시안입니다. 실제 구매·소환은 연결 전입니다.';});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&trayOpener)closeBottomTray();});

// Free horizontal dragging, then align to the nearest card on release.
let trayDrag:{pointer:number;x:number;y:number;scroll:number;moved:boolean}|null=null;
let suppressTrayClick=false;
function finishTrayDrag(){if(!trayDrag)return;const drag=trayDrag;trayDrag=null;bottomTray.classList.remove('is-dragging');if(bottomTray.hasPointerCapture(drag.pointer))bottomTray.releasePointerCapture(drag.pointer);if(drag.moved){suppressTrayClick=true;window.setTimeout(()=>{suppressTrayClick=false;},120);const card=bottomTray.querySelector<HTMLElement>('button');const step=(card?.offsetWidth??72)+(parseFloat(getComputedStyle(bottomTray).columnGap)||2);bottomTray.scrollTo({left:Math.round(bottomTray.scrollLeft/step)*step,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}}
bottomTray.addEventListener('pointerdown',event=>{if(bottomTray.dataset.kind!=='hero-summon'||event.button!==0)return;trayDrag={pointer:event.pointerId,x:event.clientX,y:event.clientY,scroll:bottomTray.scrollLeft,moved:false};});
bottomTray.addEventListener('pointermove',event=>{if(!trayDrag||event.pointerId!==trayDrag.pointer)return;if(bottomTray.classList.contains('deploy-dragging'))return;const delta=event.clientX-trayDrag.x;const vertical=Math.abs(event.clientY-trayDrag.y);if(!trayDrag.moved&&vertical>Math.abs(delta))return;if(!trayDrag.moved&&Math.abs(delta)>4){trayDrag.moved=true;bottomTray.classList.add('is-dragging');bottomTray.setPointerCapture(event.pointerId);}if(trayDrag.moved){event.preventDefault();bottomTray.scrollLeft=trayDrag.scroll-delta;}});
bottomTray.addEventListener('pointerup',finishTrayDrag);
bottomTray.addEventListener('pointercancel',finishTrayDrag);
bottomTray.addEventListener('lostpointercapture',finishTrayDrag);
bottomTray.addEventListener('dragstart',event=>event.preventDefault());
bottomTray.addEventListener('click',event=>{if(suppressTrayClick&&event.detail!==0){event.preventDefault();event.stopImmediatePropagation();}},true);

void mountPreviewDeployment(frame as HTMLElement,bottomTray).catch(()=>{document.querySelector('#preview-status')!.textContent='유닛 이미지를 불러오지 못했습니다. 새로고침해 주세요.';});

import {paintNavigationIcons} from './navigation-icons';
// Standalone lobby UI. Catalog reads game configuration; no live combat state.
export {};
import { mountCatalogPanel } from './catalog-panel';
import { mountMailPanel } from './mail-panel';
import { mountMissionPanel } from './mission-panel';
import { mountHeroPreview } from './hero-preview';
import { mountBarracksPreview } from './barracks-preview';
import './hero-preview.css';
import './mobile-ui.css';
import { mountScreenBottomGuide } from './screen-bottom-guide';
mountScreenBottomGuide();
// Keep each painted icon in its own viewport rather than scaling a whole UI sheet.
const lobbyArtUrl = `${import.meta.env.BASE_URL}assets/lobby/camp-concept.png`;
function paintIcon(selector:string, bounds:[number,number,number,number]) {
  document.querySelectorAll<HTMLElement>(selector).forEach(element => {
    const [x,y,w,h] = bounds;
    element.innerHTML = `<svg class="lobby-icon" viewBox="${x} ${y} ${w} ${h}" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><image href="${lobbyArtUrl}" width="948" height="1659" /></svg>`;
  });
}
paintIcon('.portrait',[30,13,97,90]);
paintIcon('.coin',[419,32,44,43]);
paintIcon('.settings',[878,30,43,45]);
paintIcon('.stage > span',[328,1130,25,35]);
paintNavigationIcons();
document.querySelector('.battle > span')!.innerHTML = `<svg class="lobby-icon" viewBox="0 0 40 40" aria-hidden="true"><g fill="#4b2c11" stroke="#ffe1a0" stroke-width=".7" stroke-linejoin="round"><path d="m7 3 5 2 18 22-4 4L5 10Z"/><path d="m33 3-5 2L10 27l4 4 21-21Z"/><path d="m6 24 10 10-3 3-10-10Zm18 10 10-10 3 3-10 10Z"/><path d="m7 31 3 3-5 5-3-3Zm23 3 3-3 5 5-3 3Z"/></g></svg>`;
const shortcuts = document.querySelectorAll<HTMLButtonElement>('.side-menu button:not([data-panel="임무"])');
shortcuts.forEach((button,index) => {
  button.setAttribute('aria-label',index===0?'우편':'도감');
  button.innerHTML = `<svg class="lobby-icon" viewBox="812 ${index===0?225:374} 105 132" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><image href="${lobbyArtUrl}" width="948" height="1659" /></svg>`;
});
const catalogPanel = mountCatalogPanel();
const mailPanel = mountMailPanel();
const missionPanel = mountMissionPanel();
const heroPreview = mountHeroPreview();
heroPreview.mountRoster(document.querySelector<HTMLElement>('#lobby-roster')!);
const barracksPreview = mountBarracksPreview(name => openPanel(name));
// One viewport-anchored navigation bar, shared by every lobby route.
const bottomNav=document.querySelector<HTMLElement>('.bottom-nav')!;
bottomNav.classList.add('app-bottom-nav');document.body.append(bottomNav);
document.body.classList.add('app-fixed-navigation');
function syncBottomNav(label?:string){
 const active=label??(location.hash.startsWith('#heroes')?'영웅':location.hash==='#barracks'||location.hash==='#training'||location.hash.startsWith('#specialty')?'병영':'전투');
 bottomNav.querySelectorAll<HTMLButtonElement>('button').forEach(button=>{
  const chosen=(button.id==='camp-tab'?'전투':button.dataset.panel)===active;
  button.classList.toggle('selected',chosen);
  if(chosen)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');
 });
}
window.addEventListener('hashchange',()=>syncBottomNav());syncBottomNav();

const panel = document.querySelector<HTMLDialogElement>('#panel')!;
const title = document.querySelector<HTMLElement>('#panel-title')!;
const content = document.querySelector<HTMLElement>('#panel-content')!;
const messages: Record<string, string> = {
  '지휘관': '지휘관 Lv.1 · 경험치 24 / 100',
  '상점': '장비와 보급품을 준비하는 공간입니다.',
  '영웅': '캠프에서 함께할 영웅을 확인하는 공간입니다.',
  '영웅 편성': '출전할 영웅 3명을 편성하는 공간입니다.',
  '병영': '병사와 부대를 관리하는 공간입니다.',
  '병영 관리': '병사와 부대를 관리하는 공간입니다.',
  '기록': '잊혀진 숲 · 최고 웨이브 10',
  '임무': '오늘의 임무 · 전투 1회 완료',
  '우편': '현재 도착한 우편이 없습니다.',
  '도감': '영웅과 장비의 이야기가 모이는 공간입니다.',
  '설정': '로비 화면 시안 · 사운드 및 계정 설정 연결 전',
  '전투 준비': '잊혀진 숲 · 제1구역',
  '소탕': '소탕 기능은 준비 중입니다.',
};
let returnFocus: HTMLElement | null = null;
function openPanel(name: string) {
  returnFocus = document.activeElement as HTMLElement;
  title.textContent = name;
  content.replaceChildren();
  const detail = document.createElement('div');
  detail.className = 'panel-detail';
  detail.textContent = messages[name] ?? '';
  const note = document.createElement('p');
  note.textContent = name === '전투 준비'
    ? '로비 디자인 미리보기입니다. 실제 전투는 시작되지 않습니다.'
    : '이 메뉴는 디자인 확인용입니다. 게임 기능은 아직 연결하지 않았습니다.';
  content.append(detail, note);
  panel.showModal();
}
document.querySelectorAll<HTMLButtonElement>('[data-panel]').forEach(button => {
  button.addEventListener('click', () => {
    const name = button.dataset.panel!;
    if (name === '영웅' || name === '영웅 편성') heroPreview.open();
    else if(name === '임무') missionPanel.open();
    else if(name === '우편') mailPanel.open();
    else if(name === '도감') catalogPanel.open();
    else if(name === '병영' || name === '병영 관리') barracksPreview.open();
    else openPanel(name);
    if(bottomNav.contains(button))syncBottomNav(name);
  });
});
document.querySelector('#battle')!.addEventListener('click', () => openPanel('전투 준비'));
document.querySelectorAll('#panel .close, #panel .dialog-confirm').forEach(button => {
  button.addEventListener('click', () => panel.close());
});
panel.addEventListener('click', event => {
  const bounds = panel.getBoundingClientRect();
  if (event.target === panel && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) panel.close();
});
panel.addEventListener('close', () => {returnFocus?.focus();syncBottomNav();});
let toastTimer: ReturnType<typeof setTimeout>;
function toast(message: string) {
  const element = document.querySelector<HTMLElement>('.toast')!;
  element.textContent = message;
  element.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => element.classList.remove('visible'), 2800);
}
document.querySelector('#camp-tab')!.addEventListener('click', () => {if(location.hash)location.hash='';else toast('현재 캠프 화면입니다.');syncBottomNav('전투');});

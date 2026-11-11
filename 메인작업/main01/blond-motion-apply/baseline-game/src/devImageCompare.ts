import './devImageCompare.css';
import {DIRECTION_COMPARE_ART} from './devImageCompareArt';
import {BLOND_WAVE_BODY_HEIGHT,BLOND_BOSS_BODY_HEIGHT} from './blondArt';

type Scene='defense'|'boss';
type Field={element:HTMLElement;width:number;height:number;top:number};
type Point={x:number;y:number};
export type CompareDirection='front'|'right45'|'right90';
export type CompareArt={file:string;label:string;bodyHeight:number;footX:number;footY:number;variant:number;direction:CompareDirection;width:number;height:number};
// Catalog IDs 0..4 preserve the original three-direction sets; 5..8 are new art; ID6 has three directions, IDs5/7/8 are front-only.
export const COMPARE_ART:readonly CompareArt[]=DIRECTION_COMPARE_ART.filter(a=>a.direction==='front');
export function compareLocal(client:Point,rect:Pick<DOMRect,'left'|'top'|'width'|'height'>,field:Omit<Field,'element'>):Point{
 return {x:Math.max(0,Math.min(field.width,(client.x-rect.left)*field.width/rect.width)),y:Math.max(-field.top,Math.min(field.height-field.top,(client.y-rect.top)*field.height/rect.height-field.top))};
}
export function comparePlacement(art:CompareArt,bodyHeight:number,percent:number){
 const scale=bodyHeight*Math.max(50,Math.min(200,percent))/100/art.bodyHeight;
 return {width:art.width*scale,height:art.height*scale,left:-art.footX*scale,top:-art.footY*scale};
}
export function createDevImageCompare(options:{controls:HTMLElement;fields:Record<Scene,Field>;active:()=>boolean;scene:()=>Scene|'lobby'}){
 const assets:CompareArt[]=[...DIRECTION_COMPARE_ART];
 let direction:CompareDirection='front',group:'legacy'|'scalp'='scalp';
 const existing=options.controls.querySelector<HTMLButtonElement>('#dev-image-compare');
 if(existing)throw Error('이미지 대조 도구가 이미 연결되어 있습니다');
 const lifetime=new AbortController(),signal=lifetime.signal,base=`${import.meta.env.BASE_URL}assets/dev-image-compare/`;
 const button=document.createElement('button');button.id='dev-image-compare';button.type='button';button.textContent='이미지 대조';options.controls.append(button);
 const panel=document.createElement('section');panel.id='dev-image-compare-panel';panel.hidden=true;panel.setAttribute('aria-label','이미지 대조');
 panel.innerHTML=`<header><b>이미지 대조</b><button type="button" data-action="close">닫기</button></header><nav class="compare-groups" aria-label="비교 묶음"><button type="button" data-group="legacy">기존 5종</button><button type="button" data-group="scalp">신규 4안</button></nav><div class="compare-cards"></div><p class="compare-help" data-support></p><label>방향 <select aria-label="비교 방향"><option value="front">정면</option><option value="right45">오른쪽 45°</option><option value="right90">오른쪽 90°</option></select></label><p class="compare-help">안을 고른 뒤 전장에 터치하거나 카드를 끌어 놓으세요.</p><button type="button" data-action="mode">배치 모드 해제</button><p data-status aria-live="polite"></p><label>선택 크기 <input aria-label="선택 크기 슬라이더" type="range" min="50" max="200" value="100"></label><div class="compare-size"><input aria-label="선택 크기 퍼센트" type="number" min="50" max="200" value="100"><span>%</span><button type="button" data-action="reset">100%</button></div><div class="compare-actions"><button type="button" data-action="delete">선택 삭제</button><button type="button" data-action="clear">전체 지우기</button></div><p class="compare-help">닫으면 그림만 유지되고 게임을 조작할 수 있습니다. 다시 열어 전체 지우기로 원복하세요. 전장 전환 시 모두 지워집니다.</p>`;
 document.body.append(panel);
 const layer=document.createElement('div');layer.id='dev-image-compare-layer';layer.hidden=true;document.body.append(layer);
 const cards=panel.querySelector<HTMLElement>('.compare-cards')!,status=panel.querySelector<HTMLElement>('[data-status]')!,range=panel.querySelector<HTMLInputElement>('[type=range]')!,number=panel.querySelector<HTMLInputElement>('[type=number]')!,modeButton=panel.querySelector<HTMLButtonElement>('[data-action=mode]')!;
 const directionSelect=panel.querySelector<HTMLSelectElement>('select')!;
 const items:{id:number;art:number;p:Point;percent:number;node:HTMLButtonElement}[]=[];
 let cardClickUntil=0;
 let opened=false,placing=false,artIndex=assets.findIndex(a=>a.variant===5),selected=0,nextId=1,scene:Scene|null=null,disposed=false;
 let drag:{pointer:number;target:HTMLElement;item:number|null;start:Point;origin:Point;moved:boolean;art:number}|null=null;
 const eat=(e:Event)=>{e.preventDefault();e.stopImmediatePropagation();};
 function cancel(){const d=drag;drag=null;if(d?.target.hasPointerCapture(d.pointer))d.target.releasePointerCapture(d.pointer);}
 function clear(){cancel();items.splice(0).forEach(i=>i.node.remove());selected=0;}
 function rect(){return scene?options.fields[scene].element.getBoundingClientRect():null;}
 function inside(e:PointerEvent){const r=rect();return r&&e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom;}
 function local(e:PointerEvent){return compareLocal({x:e.clientX,y:e.clientY},rect()!,options.fields[scene!]);}
 function draw(){
  if(!scene)return;const f=options.fields[scene],r=rect()!,sx=r.width/f.width,sy=r.height/f.height;
  Object.assign(layer.style,{left:`${r.left}px`,top:`${r.top}px`,width:`${r.width}px`,height:`${r.height}px`});
  layer.dataset.editing=String(opened);layer.dataset.placing=String(opened&&placing);
  for(const item of items){
   const a=assets[item.art],p=comparePlacement(a,scene==='boss'?BLOND_BOSS_BODY_HEIGHT:BLOND_WAVE_BODY_HEIGHT,item.percent),img=item.node.querySelector('img')!;
   Object.assign(item.node.style,{left:`${item.p.x*sx}px`,top:`${(item.p.y+f.top)*sy}px`});
   Object.assign(img.style,{width:`${p.width*sx}px`,height:`${p.height*sy}px`,left:`${p.left*sx}px`,top:`${p.top*sy}px`});
   item.node.dataset.selected=String(opened&&selected===item.id);item.node.tabIndex=opened?0:-1;
   item.node.dataset.x=String(item.p.x);item.node.dataset.y=String(item.p.y);item.node.dataset.percent=String(item.percent);
  }
  const item=items.find(i=>i.id===selected);range.disabled=number.disabled=!item;range.value=number.value=String(item?.percent??100);
  status.textContent=item?`${assets[item.art].label} 선택 · ${item.percent}% · ${items.length}개 배치`:`${items.length}개 배치 · ${placing?assets[artIndex].label+' 배치 중':'게임 입력 사용 · 그림을 선택해 이동'}`;
  modeButton.textContent=placing?'배치 모드 해제':'배치 모드 켜기';modeButton.setAttribute('aria-pressed',String(placing));
  modeButton.disabled=!assets.some(a=>a.variant===assets[artIndex].variant&&a.direction===direction);
  const target=assets[item?.art??artIndex];
  for(const option of directionSelect.options)option.disabled=!assets.some(a=>a.variant===target.variant&&a.direction===option.value);
  panel.querySelector<HTMLElement>('[data-support]')!.textContent=group==='scalp'?'신규2안: 정면/45°/90° · 신규1·3·4안: 정면 전용':'원본·기존4안 · 정면/오른쪽45°/90°';
  panel.querySelectorAll<HTMLButtonElement>('[data-group]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.group===group)));
  cards.querySelectorAll('button').forEach(b=>{const variant=Number(b.dataset.variant),front=assets.findIndex(a=>a.variant===variant&&a.direction==='front'),found=assets.findIndex(a=>a.variant===variant&&a.direction===direction),index=found>=0?found:front;b.hidden=(variant>=5?'scalp':'legacy')!==group;b.disabled=index<0;b.setAttribute('aria-pressed',String(placing&&index===artIndex));if(index>=0){const img=b.querySelector('img')!,url=base+assets[index].file;if(img.getAttribute('src')!==url)img.src=url;}});
  directionSelect.value=item?assets[item.art].direction:direction;
  button.textContent=`이미지 대조${items.length?` (${items.length})`:''}`;button.setAttribute('aria-expanded',String(opened));
 }
 function add(index:number,p:Point){
  const node=document.createElement('button');node.type='button';node.className='compare-actor';node.setAttribute('aria-label',`${assets[index].label} 미리보기 · 드래그로 이동`);
  node.innerHTML=`<img src="${base+assets[index].file}" alt="" draggable="false"><span>${assets[index].label}</span>`;
  const item={id:nextId++,art:index,p,percent:100,node};items.push(item);selected=item.id;layer.append(node);
  node.addEventListener('pointerdown',e=>{if(!opened||e.button!==0||drag)return;eat(e);selected=item.id;artIndex=item.art;direction=assets[item.art].direction;group=assets[item.art].variant>=5?'scalp':'legacy';drag={pointer:e.pointerId,target:node,item:item.id,start:{x:e.clientX,y:e.clientY},origin:{...item.p},moved:false,art:index};node.setPointerCapture(e.pointerId);draw();},{signal});
  node.addEventListener('keydown',e=>{if(!opened)return;const delta:Record<string,Point>={ArrowLeft:{x:-5,y:0},ArrowRight:{x:5,y:0},ArrowUp:{x:0,y:-5},ArrowDown:{x:0,y:5}};if(delta[e.key]){eat(e);selected=item.id;const f=options.fields[scene!];item.p={x:Math.max(0,Math.min(f.width,item.p.x+delta[e.key].x)),y:Math.max(-f.top,Math.min(f.height-f.top,item.p.y+delta[e.key].y))};draw();}},{signal});
  draw();
 }
 COMPARE_ART.forEach((art,i)=>{
  const card=document.createElement('button');card.type='button';card.dataset.variant=String(art.variant);card.innerHTML=`<img src="${base+art.file}" alt="" draggable="false"><span>${art.label}</span>`;cards.append(card);
  card.addEventListener('pointerdown',e=>{if(e.button!==0||drag||!scene)return;eat(e);const found=assets.findIndex(a=>a.variant===art.variant&&a.direction===direction),index=found>=0?found:assets.findIndex(a=>a.variant===art.variant&&a.direction==='front');if(index<0)return;direction=assets[index].direction;artIndex=index;placing=true;drag={pointer:e.pointerId,target:card,item:null,start:{x:e.clientX,y:e.clientY},origin:{x:0,y:0},moved:false,art:index};card.setPointerCapture(e.pointerId);draw();},{signal});
  card.addEventListener('click',()=>{if(performance.now()<cardClickUntil)return;const found=assets.findIndex(a=>a.variant===art.variant&&a.direction===direction),index=found>=0?found:assets.findIndex(a=>a.variant===art.variant&&a.direction==='front');if(index<0)return;direction=assets[index].direction;artIndex=index;placing=true;selected=0;draw();},{signal});
 });
 directionSelect.addEventListener('change',()=>{const next=directionSelect.value as CompareDirection,item=items.find(i=>i.id===selected);const target=assets[item?.art??artIndex];if(!assets.some(a=>a.variant===target.variant&&a.direction===next)){status.textContent=`${target.label}은 정면만 지원합니다. 현재 그림을 유지합니다.`;directionSelect.value=target.direction;return;}if(item){const index=assets.findIndex(a=>a.variant===assets[item.art].variant&&a.direction===next);if(index<0){status.textContent='이 방향은 아직 제작 대기 중입니다. 현재 그림을 유지합니다.';directionSelect.value=assets[item.art].direction;return;}item.art=index;item.node.querySelector('img')!.src=base+assets[index].file;}direction=next;const matching=assets.findIndex(a=>a.variant===target.variant&&a.direction===next);if(matching>=0)artIndex=matching;placing=false;cancel();draw();},{signal});
 function close(){opened=false;placing=false;cancel();panel.hidden=true;draw();button.focus({preventScroll:true});}
 button.addEventListener('click',e=>{eat(e);if(opened)close();else{sync();if(!scene)return;opened=true;panel.hidden=false;draw();panel.querySelector('button')?.focus({preventScroll:true});}},{signal});
 panel.addEventListener('click',e=>{const requestedGroup=(e.target as HTMLElement).closest<HTMLElement>('[data-group]')?.dataset.group;if(requestedGroup==='legacy'||requestedGroup==='scalp')group=requestedGroup;const action=(e.target as HTMLElement).closest<HTMLElement>('[data-action]')?.dataset.action;if(action==='close')close();else if(action==='mode'){placing=!placing;cancel();}else if(action==='clear')clear();else if(action==='delete'){const index=items.findIndex(i=>i.id===selected);if(index>=0){items.splice(index,1)[0].node.remove();selected=0;cancel();}}else if(action==='reset'){const item=items.find(i=>i.id===selected);if(item)item.percent=100;}draw();e.stopPropagation();},{signal});
 for(const input of [range,number]){
  input.addEventListener('input',()=>{const item=items.find(i=>i.id===selected),value=input.valueAsNumber;if(item&&Number.isFinite(value)&&value>=50&&value<=200){item.percent=value;draw();}},{signal});
  input.addEventListener('change',()=>{const item=items.find(i=>i.id===selected);if(item){item.percent=Number.isFinite(input.valueAsNumber)?Math.max(50,Math.min(200,input.valueAsNumber)):item.percent;draw();}},{signal});
 }
 layer.addEventListener('pointerdown',e=>{if(e.target!==layer||!opened||!placing||!scene||e.button!==0||drag)return;eat(e);add(artIndex,local(e));},{signal});
 window.addEventListener('pointermove',e=>{if(!drag||drag.pointer!==e.pointerId||!scene)return;eat(e);const r=rect()!,f=options.fields[scene];if(Math.hypot(e.clientX-drag.start.x,e.clientY-drag.start.y)>5)drag.moved=true;if(drag.item!==null){const item=items.find(i=>i.id===drag!.item)!;item.p={x:Math.max(0,Math.min(f.width,drag.origin.x+(e.clientX-drag.start.x)*f.width/r.width)),y:Math.max(-f.top,Math.min(f.height-f.top,drag.origin.y+(e.clientY-drag.start.y)*f.height/r.height))};draw();}},{signal,capture:true});
 window.addEventListener('pointerup',e=>{if(!drag||drag.pointer!==e.pointerId)return;eat(e);const d=drag;if(d.item===null&&d.moved){cardClickUntil=performance.now()+500;if(inside(e))add(d.art,local(e));}cancel();draw();},{signal,capture:true});
 window.addEventListener('pointercancel',e=>{if(drag?.pointer===e.pointerId){eat(e);cancel();}},{signal,capture:true});
 for(const target of [layer,panel])target.addEventListener('lostpointercapture',()=>cancel(),{signal});
 layer.addEventListener('click',e=>{if(opened&&(placing||(e.target as HTMLElement).closest('.compare-actor')))eat(e);},{signal});
 window.addEventListener('keydown',e=>{if(opened&&e.key==='Escape'){eat(e);close();}},{signal});
 window.addEventListener('blur',cancel,{signal});document.addEventListener('visibilitychange',cancel,{signal});
 const resize=()=>{cancel();draw();};window.addEventListener('resize',resize,{signal});window.addEventListener('scroll',resize,{signal,capture:true});
 const observer=new ResizeObserver(resize);Object.values(options.fields).forEach(f=>observer.observe(f.element));
 function sync(){
  if(disposed)return;const next=options.scene(),active=options.active()&&next!=='lobby';button.disabled=!active;
  if(!active||scene!==next){clear();opened=false;placing=false;panel.hidden=true;scene=active?next as Scene:null;}
  layer.hidden=!active;if(!scene){button.textContent='이미지 대조';button.setAttribute('aria-expanded','false');}draw();
 }
 sync();return {sync,setAssets(next:readonly CompareArt[]){for(const art of next){if(![art.width,art.height,art.bodyHeight,art.footX,art.footY].every(Number.isFinite)||art.width<=0||art.height<=0||art.bodyHeight<=0||!Number.isInteger(art.variant)||!COMPARE_ART.some(a=>a.variant===art.variant)||!['front','right45','right90'].includes(art.direction)||!/^[-a-zA-Z0-9_/.]+\.png$/.test(art.file))throw Error('Invalid comparison art metadata');const index=assets.findIndex(a=>a.variant===art.variant&&a.direction===art.direction);if(index>=0)assets[index]={...art};else assets.push({...art});}draw();},dispose(){if(disposed)return;disposed=true;clear();observer.disconnect();lifetime.abort();panel.remove();layer.remove();button.remove();}};
}

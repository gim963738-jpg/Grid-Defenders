import './devRangeDummy.css';

/** Fixed measuring unit requested for skill planning; independent of live stats. */
export const DEV_RANGE_UNIT=130;
type Scene='defense'|'boss';
type Point={x:number;y:number};
type Field={element:HTMLElement;width:number;height:number;top:number};
export function createRangeDummy(options:{
 controls:HTMLElement;fields:Record<Scene,Field>;
 active:()=>boolean;scene:()=>Scene|'lobby';
}){
 const events=new AbortController(),signal=events.signal;
 const button=document.createElement('button');button.id='dev-range-dummy';button.type='button';
 button.title='1R=130 · 0.5R 간격, 최대 3R · 허수아비를 드래그해 이동';
 const legend=document.createElement('p');legend.id='dev-range-legend';legend.className='tools-hint';
 legend.textContent='0.5R=65 · 1R=130 · 1.5R=195 · 2R=260 · 2.5R=325 · 3R=390. 허수아비를 드래그해 기준점을 옮깁니다. 큰 원은 전장 경계에서 잘립니다.';
 options.controls.querySelector('#dev-damage-numbers')!.after(button,legend);
 const layer=document.createElement('div');layer.id='dev-range-overlay';layer.hidden=true;
 layer.innerHTML=`<svg class="dev-range-circles" aria-hidden="true"></svg>
  <button type="button" class="dev-range-handle" aria-label="거리 허수아비 · 드래그 또는 방향키로 이동" title="드래그로 이동 · 흰 점이 거리 기준점">
   <svg viewBox="0 0 48 64" aria-hidden="true"><ellipse cx="24" cy="61" rx="18" ry="3" fill="#071b12" opacity=".5"/><path d="M24 22v40M4 29h40" stroke="#50361c" stroke-width="7" stroke-linecap="round"/><path d="M24 22v40M5 28h38" stroke="#b38b4f" stroke-width="3" stroke-linecap="round"/><path d="m14 23 10-4 10 4-2 20-8 4-8-4Z" fill="#c4a66c" stroke="#53452a" stroke-width="2"/><path d="m15 26-6 8m5-4-5 8m25-12 5 8m-4-4 5 8M17 42l-3 7m7-5-1 6m8-6 2 6m3-8 3 7" stroke="#e6cb83" stroke-width="2"/><circle cx="24" cy="13" r="9" fill="#dfc88b" stroke="#5a4528" stroke-width="2"/><path d="m12 9 6-8h12l6 8Z" fill="#786039" stroke="#43311f" stroke-width="2"/><path d="M9 10h30m-19 5 3 3m0-3-3 3m7-3 3 3m0-3-3 3m-6 4h8" stroke="#53412b" stroke-width="2"/><circle cx="24" cy="63" r="2" fill="#fff4cd"/></svg>
  </button>`;
 const svg=layer.querySelector<SVGSVGElement>('svg')!,handle=layer.querySelector<HTMLButtonElement>('button')!;
 const svgNS='http://www.w3.org/2000/svg';
 const ray=document.createElementNS(svgNS,'line');ray.classList.add('dev-range-ray');svg.append(ray);
 const marks=Array.from({length:6},(_,i)=>{
  const r=(i+1)/2,distance=r*DEV_RANGE_UNIT,color=i%2?'#ffdc55':'#52b8ff';
  const circle=document.createElementNS(svgNS,'circle');circle.dataset.r=String(r);circle.setAttribute('r',String(distance));
  circle.setAttribute('stroke',color);circle.setAttribute('vector-effect','non-scaling-stroke');svg.append(circle);
  const label=document.createElement('span');label.className='dev-range-label';label.dataset.r=String(r);label.dataset.distance=String(distance);
  label.style.color=color;label.innerHTML=`<b>${r}R</b><small>${distance}</small>`;layer.append(label);
  return {distance,circle,label};
 });
 let requested=false,scene:Scene|null=null,drag:{id:number;dx:number;dy:number}|null=null;
 const origins:Record<Scene,Point>={defense:{x:130,y:(options.fields.defense.height-options.fields.defense.top)/2},boss:{x:130,y:options.fields.boss.height/2}};
 function cancelDrag(){if(drag&&handle.hasPointerCapture(drag.id))handle.releasePointerCapture(drag.id);drag=null;}
 function draw(){
  if(!scene)return;const field=options.fields[scene],p=origins[scene];
  svg.setAttribute('viewBox',`0 ${-field.top} ${field.width} ${field.height}`);
  ray.setAttribute('x1',String(p.x));ray.setAttribute('y1',String(p.y));ray.setAttribute('x2',String(p.x+DEV_RANGE_UNIT*3));ray.setAttribute('y2',String(p.y));
  handle.style.left=`${p.x/field.width*100}%`;handle.style.top=`${(p.y+field.top)/field.height*100}%`;
  handle.dataset.x=String(p.x);handle.dataset.y=String(p.y);
  for(const mark of marks){
   mark.circle.setAttribute('cx',String(p.x));mark.circle.setAttribute('cy',String(p.y));
   mark.label.style.left=`${(p.x+mark.distance)/field.width*100}%`;mark.label.style.top=handle.style.top;
   mark.label.hidden=p.x+mark.distance>field.width;
  }
 }
 function sync(){
  const next=options.scene(),visible=requested&&options.active()&&next!=='lobby';
  button.disabled=!options.active()||next==='lobby';button.textContent=`거리 허수아비 ${requested?'ON':'OFF'}`;
  button.setAttribute('aria-pressed',String(requested));legend.hidden=!requested;
  if(!visible){layer.hidden=true;cancelDrag();return;}
  if(scene!==next||layer.parentElement!==options.fields[next].element){
   cancelDrag();scene=next;options.fields[next].element.append(layer);draw();
  }
  layer.hidden=false;
 }
 function local(event:PointerEvent):Point {
  const field=options.fields[scene!],r=layer.getBoundingClientRect();
  return {x:(event.clientX-r.left)*field.width/r.width,y:(event.clientY-r.top)*field.height/r.height-field.top};
 }
 function move(x:number,y:number){
  if(!scene)return;const field=options.fields[scene];origins[scene]={x:Math.max(0,Math.min(field.width,x)),y:Math.max(0,Math.min(field.height-field.top,y))};draw();
 }
 button.addEventListener('click',()=>{requested=!requested;sync();},{signal});
 handle.addEventListener('pointerdown',event=>{
  if(event.button!==0||!scene)return;event.preventDefault();event.stopPropagation();
  const p=local(event),origin=origins[scene];drag={id:event.pointerId,dx:origin.x-p.x,dy:origin.y-p.y};handle.setPointerCapture(event.pointerId);
 },{signal});
 handle.addEventListener('pointermove',event=>{
  if(!drag||drag.id!==event.pointerId)return;event.preventDefault();event.stopPropagation();const p=local(event);move(p.x+drag.dx,p.y+drag.dy);
 },{signal});
 for(const type of ['pointerup','pointercancel'] as const)handle.addEventListener(type,event=>{event.stopPropagation();if(drag?.id===event.pointerId)cancelDrag();},{signal});
 handle.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();},{signal});
 handle.addEventListener('keydown',event=>{
  if(!scene)return;const delta:Record<string,Point>={ArrowLeft:{x:-8,y:0},ArrowRight:{x:8,y:0},ArrowUp:{x:0,y:-8},ArrowDown:{x:0,y:8}},step=delta[event.key];
  if(step){event.preventDefault();event.stopPropagation();const p=origins[scene];move(p.x+step.x,p.y+step.y);}
 },{signal});
 window.addEventListener('blur',cancelDrag,{signal});
 sync();
 return {sync,dispose(){cancelDrag();events.abort();layer.remove();legend.remove();button.remove();}};
}

'use strict';
const $=id=>document.getElementById(id);
const assets={warrior:{label:'금발 전사',file:'assets/warrior.png',body:1123,footX:470,footY:1164},boss:{label:'터틀드래곤',file:'assets/boss.png',body:748,footX:535,footY:968}};
const state={stickers:[],selected:null,mode:'current',background:'field',next:1,ready:false};
let dpr=Math.min(3,window.devicePixelRatio||1),frame=0,drag=null,pan=false;
const cache=new Map();let cacheBytes=0,processingCount=0;
const canvas=$('battle'),ctx=canvas.getContext('2d'),field=new Image();
function surface(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c}
function note(t){$('status').textContent=t}
function selected(){return state.stickers.find(s=>s.id===state.selected)}
function geometry(s){const a=assets[s.kind],k=s.size/a.body;return {x:s.x-a.footX*k,y:s.y-a.footY*k,w:a.image.width*k,h:a.image.height*k,k}}
function cleanEdge(c){const x=c.getContext('2d',{willReadFrequently:true}),im=x.getImageData(0,0,c.width,c.height),p=im.data,w=c.width,h=c.height,seen=new Uint8Array(w*h),queue=new Uint32Array(w*h);let end=0,head=0,changed=0,greenPreserved=0;
 function add(i){if(!seen[i]&&p[i*4+3]<=8){seen[i]=1;queue[end++]=i}}
 for(let i=0;i<w;i++){add(i);add((h-1)*w+i)}for(let j=0;j<h;j++){add(j*w);add(j*w+w-1)}
 while(head<end){const i=queue[head++],q=i*4,a=p[q+3];if(a){if(p[q+1]>p[q]*1.15&&p[q+1]>p[q+2]*1.1){greenPreserved++}else{p[q+3]=a-1;changed++}}const col=i%w;if(col)add(i-1);if(col<w-1)add(i+1);if(i>=w)add(i-w);if(i<w*(h-1))add(i+w)}
 x.putImageData(im,0,0);c.edgeStats={changed,greenPreserved};
}
function texture(s,mode=state.mode){const a=assets[s.kind];if(mode==='current')return a.image;const g=geometry(s),key=[s.kind,s.size,dpr,mode].join('|');if(cache.has(key)){const c=cache.get(key);cache.delete(key);cache.set(key,c);return c}
 processingCount++;const w=Math.max(1,Math.ceil(g.w*dpr)),h=Math.max(1,Math.ceil(g.h*dpr));let source=a.image;
 // Canvas works with premultiplied alpha when filtering/compositing. Halve until near target.
 while(source.width>w*2&&source.height>h*2){const c=surface(Math.max(w,Math.ceil(source.width/2)),Math.max(h,Math.ceil(source.height/2))),x=c.getContext('2d');x.imageSmoothingEnabled=true;x.imageSmoothingQuality='high';x.drawImage(source,0,0,c.width,c.height);source=c}
 const c=surface(w,h),x=c.getContext('2d');x.imageSmoothingEnabled=true;x.imageSmoothingQuality='high';x.drawImage(source,0,0,w,h);if(mode==='edge')cleanEdge(c);
 const bytes=w*h*4;while(cache.size&&(cache.size>=24||cacheBytes+bytes>24*1024*1024)){const k=cache.keys().next().value;const old=cache.get(k);cacheBytes-=old.width*old.height*4;cache.delete(k)}cache.set(key,c);cacheBytes+=bytes;return c;
}
function paint(x,overlay=false){x.clearRect(0,0,800,360);if(state.background==='field'){x.drawImage(field,-400,(360-1766)*.6,1600,1766)}else{x.fillStyle=state.background==='light'?'#f1f0e9':'#151719';x.fillRect(0,0,800,360)}
 for(const s of state.stickers){const g=geometry(s);x.imageSmoothingEnabled=true;x.imageSmoothingQuality=state.mode==='current'?'low':'high';x.drawImage(texture(s),g.x,g.y,g.w,g.h);if(overlay&&s.id===state.selected){x.save();x.strokeStyle='#ffe29b';x.lineWidth=1;x.setLineDash([4,3]);x.strokeRect(g.x,g.y,g.w,g.h);x.setLineDash([]);x.beginPath();x.moveTo(s.x-5,s.y);x.lineTo(s.x+5,s.y);x.moveTo(s.x,s.y-5);x.lineTo(s.x,s.y+5);x.stroke();x.restore()}}
}
function render(){frame=0;if(!state.ready)return;canvas.width=Math.round(800*dpr);canvas.height=Math.round(360*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);paint(ctx,true);$('measurement').textContent=`800 × 360 CSS px · DPR ${dpr} · ${state.stickers.length}장`;
 const z=$('zoom'),s=selected();if(s){const g=geometry(s);z.width=Math.ceil(g.w*4*dpr);z.height=Math.ceil(g.h*4*dpr);z.style.width=`${g.w*4}px`;z.style.height=`${g.h*4}px`;const x=z.getContext('2d');x.imageSmoothingEnabled=false;x.drawImage(texture(s),0,0,z.width,z.height)}else{z.width=480;z.height=360;z.style.width='240px';z.style.height='180px'}
}
function schedule(){if(!frame)frame=requestAnimationFrame(render)}
function sync(){const s=selected();$('selection').replaceChildren(new Option('선택 없음',''),...state.stickers.map(s=>new Option(`${assets[s.kind].label} #${s.id} · ${s.size}px`,s.id)));$('selection').value=state.selected||'';$('editor').disabled=!s;$('selected-label').textContent=s?`${assets[s.kind].label} #${s.id} · 발점 기준`:'선택 없음';if(s){$('size').value=$('slider').value=s.size;$('x').value=+s.x.toFixed(1);$('y').value=+s.y.toFixed(1)}schedule()}
function add(kind,copy){if(!state.ready)return;if(state.stickers.length>=50){note('최대 50장까지 비교할 수 있습니다.');return}const s=copy?{...copy,id:state.next++,x:Math.min(800,copy.x+24),y:Math.min(360,copy.y+12)}:{id:state.next++,kind,size:kind==='warrior'?72:180,x:kind==='warrior'?280:460,y:280};state.stickers.push(s);state.selected=s.id;sync()}
function reset(){state.stickers=[];add('warrior');add('boss');state.selected=null;sync();note('비교용 초기 배치 · 전사 72px / 터틀 180px')}
function remove(){const s=selected();if(!s)return;state.stickers=state.stickers.filter(v=>v.id!==s.id);state.selected=null;sync()}
function validInput(id,min,max,prop){$(id).addEventListener('input',()=>{const s=selected();if(!s)return;const raw=$(id).value,n=Number(raw);if(!raw||!Number.isFinite(n)||n<min||n>max){$(id).setCustomValidity(`${min}~${max} 사이 값을 입력하세요.`);note(`${min}~${max} 범위만 적용됩니다. 이전 배치를 유지합니다.`);return}$(id).setCustomValidity('');s[prop]=n;if(prop==='size'){$('slider').value=n;if(id==='slider')$('size').value=n}schedule();note(`${assets[s.kind].label} #${s.id} · ${s.size} CSS px`)});$(id).addEventListener('change',()=>{const s=selected();if(s){$(id).setCustomValidity('');sync()}})}
validInput('size',16,360,'size');validInput('slider',16,360,'size');validInput('x',0,800,'x');validInput('y',0,360,'y');
$('mode').onchange=()=>{state.mode=$('mode').value;schedule();note('표시 방식만 변경했습니다. 배치와 크기는 같습니다.')};$('background').onchange=()=>{state.background=$('background').value;schedule()};$('selection').onchange=()=>{state.selected=Number($('selection').value)||null;sync()};$('add-warrior').onclick=()=>add('warrior');$('add-boss').onclick=()=>add('boss');$('duplicate').onclick=()=>{if(selected())add(selected().kind,selected())};$('delete').onclick=remove;$('reset').onclick=reset;
function point(e){const r=canvas.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top}}
function hit(p){for(let i=state.stickers.length-1;i>=0;i--){const s=state.stickers[i],g=geometry(s),a=assets[s.kind],x=Math.floor((p.x-g.x)/g.k),y=Math.floor((p.y-g.y)/g.k);if(x>=0&&y>=0&&x<a.image.width&&y<a.image.height&&a.pixels[(y*a.image.width+x)*4+3]>16)return s}return null}
canvas.style.touchAction='none';
$('pan').onclick=()=>{pan=!pan;end();canvas.style.touchAction=pan?'pan-x pan-y':'none';$('pan').textContent=pan?'조작: 전장 스크롤':'조작: 스티커 이동';$('pan').setAttribute('aria-pressed',String(pan));note(pan?'전장을 쓸어 스크롤하세요. 스티커 배치는 유지됩니다.':'스티커를 드래그하세요. 페이지는 전장 바깥에서 스크롤합니다.')};
canvas.addEventListener('pointerdown',e=>{if(!state.ready||e.button>0||pan)return;const p=point(e),s=hit(p);state.selected=s?s.id:null;sync();if(s){e.preventDefault();drag={id:s.id,pointer:e.pointerId,dx:p.x-s.x,dy:p.y-s.y};canvas.setPointerCapture(e.pointerId);canvas.classList.add('dragging')}});
canvas.addEventListener('pointermove',e=>{if(!drag||drag.pointer!==e.pointerId)return;e.preventDefault();const s=state.stickers.find(s=>s.id===drag.id),p=point(e);if(s){s.x=Math.max(0,Math.min(800,p.x-drag.dx));s.y=Math.max(0,Math.min(360,p.y-drag.dy));$('x').value=+s.x.toFixed(1);$('y').value=+s.y.toFixed(1);schedule()}});
function end(){drag=null;canvas.classList.remove('dragging')}canvas.addEventListener('pointerup',end);canvas.addEventListener('pointercancel',end);canvas.addEventListener('lostpointercapture',end);
document.addEventListener('keydown',e=>{if(e.target.matches('input,select,textarea,[contenteditable]'))return;if(e.key==='Delete'||e.key==='Backspace'){if(selected()){e.preventDefault();remove()}}if(e.key==='Escape'){state.selected=null;sync()}});
function exportCanvas(){const c=surface(Math.round(800*dpr),Math.round(360*dpr));const x=c.getContext('2d');x.scale(dpr,dpr);paint(x);return c}
$('download').onclick=()=>{if(!state.ready)return;exportCanvas().toBlob(blob=>{if(!blob){note('PNG 출력에 실패했습니다.');return}const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`battle-${state.mode}-${800*dpr}x${360*dpr}.png`;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);note(`PNG ${Math.round(800*dpr)}×${Math.round(360*dpr)} · 800×360 CSS px 장면`)})};
window.addEventListener('resize',()=>{dpr=Math.min(3,window.devicePixelRatio||1);schedule()});
function load(im,url){return new Promise((resolve,reject)=>{im.onload=()=>resolve(im);im.onerror=()=>reject(new Error(url));im.src=url})}
Promise.all([load(field,'assets/field.png'),...Object.values(assets).map(async a=>{a.image=await load(new Image(),a.file);const c=surface(a.image.width,a.image.height),x=c.getContext('2d',{willReadFrequently:true});x.drawImage(a.image,0,0);a.pixels=x.getImageData(0,0,c.width,c.height).data})]).then(()=>{state.ready=true;reset()}).catch(e=>{note(`원본 로드 실패: ${e.message}. assets 폴더와 함께 로컬 HTTP로 열어주세요.`);document.querySelectorAll('button').forEach(b=>b.disabled=true)});
// Read-only inspection hooks used by isolated browser QA.
window.stickerQA={state,geometry,exportCanvas,texture,get metrics(){return {dpr,processingCount,cacheEntries:cache.size,cacheBytes}},assets};

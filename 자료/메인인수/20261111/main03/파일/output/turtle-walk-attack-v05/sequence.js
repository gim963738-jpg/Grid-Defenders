'use strict';
const $ = id => document.getElementById(id);
const singleTiming=[120,120,100,100,80,50,90,120,100,120,120,180];
const doubleTiming=[120,120,120,120,120,140,140,200,70,55,130,140,140,160,160,265];
const segments=[
 {action:'walk_front_left',duration:2400,label:'3/4 사선 이동',phase:'walk'},
 {action:'slam_right_foreleg',duration:1300,label:'한앞발 내려찍기 ①',phase:'single1'},
 {action:'idle_breathe',duration:2400,label:'숨쉬며 쉬기 ①',phase:'rest1'},
 {action:'slam_right_foreleg',duration:1300,label:'한앞발 내려찍기 ②',phase:'single2'},
 {action:'idle_breathe',duration:2400,label:'숨쉬며 쉬기 ②',phase:'rest2'},
 {action:'slam_both_forelegs',duration:2200,label:'양앞발 강하게 내려찍기',phase:'double'},
 {action:'idle_breathe',duration:2400,label:'숨쉬며 쉬기 ③',phase:'rest3'}
];
const TOTAL_MS=segments.reduce((sum,s)=>sum+s.duration,0);
let start=0;for(const s of segments){s.start=start;start+=s.duration;s.end=start;}
const images=new Map(),backgrounds=new Map();
let elapsed=0,playing=false,loaded=false,last=null;
function sample(durations,time){let end=0;for(let i=0;i<durations.length;i++){end+=durations[i];if(time<end)return i;}return durations.length-1;}
function stateAt(time){
 const t=Math.min(TOTAL_MS,Math.max(0,time));
 const segment=segments.find(s=>t<s.end)||segments.at(-1);
 const local=Math.min(segment.duration-1,Math.max(0,t-segment.start));
 const frame=segment.action==='walk_front_left'?Math.floor((local%1200)/100):segment.action==='idle_breathe'?Math.floor((local%2400)/200):sample(segment.action==='slam_both_forelegs'?doubleTiming:singleTiming,local);
 return {...segment,frame,local,x:segment.action==='walk_front_left'?680-360*local/2400:320,y:segment.action==='walk_front_left'?275+45*local/2400:320};
}
function draw(){
 if(!loaded)return;
 const state=stateAt(elapsed);
 for(const route of ['builtin','sunburst26']){
 const sourceRoute=route==='sunburst26'&&state.action==='walk_front_left'?'sunburst26':'builtin';
 const sheet=window.sequenceSheets.find(s=>s.action===state.action&&s.route===sourceRoute);
 const ctx=$(route).getContext('2d');ctx.clearRect(0,0,1000,370);
 const bg=backgrounds.get($('bg').value);
 if(bg){const scale=Math.max(1000/bg.naturalWidth,370/bg.naturalHeight),w=bg.naturalWidth*scale,h=bg.naturalHeight*scale;ctx.drawImage(bg,(1000-w)/2,(370-h)/2,w,h);}
 else{ctx.strokeStyle=$('bg').value==='dark'?'#536454':'#a4b19f';ctx.beginPath();ctx.moveTo(30,320);ctx.lineTo(970,320);ctx.stroke();}
 const rect=sheet.cells[state.frame].sourceRect;
 // One transform per action, preserving the original frame spacing and body motion.
 const baseScale=384/(sheet.width/4);
 const scale=baseScale*Number($('attackScale').value)/100;
 const foot={walk_front_left:290,slam_right_foreleg:296,idle_breathe:280,slam_both_forelegs:270}[state.action];
 ctx.drawImage(images.get(sheet.id),...rect,state.x-(sheet.width/8)*scale,state.y-foot*scale,rect[2]*scale,rect[3]*scale);
 const n=sheet.cells.length,impact=state.action==='slam_right_foreleg'&&state.frame===6||state.action==='slam_both_forelegs'&&state.frame===10;
 $(route+'-state').textContent=state.label+' · '+(state.frame+1)+'/'+n+(impact?' · 타격 기준':'')+(route==='sunburst26'&&state.action!=='walk_front_left'?' · 기존 공격/숨쉬기 시트 공통':'');
 }
 document.querySelectorAll('[data-phase]').forEach(el=>el.classList.toggle('active',el.dataset.phase===state.phase));
 $('seek').value=elapsed;$('clock').textContent=(elapsed/1000).toFixed(2)+' / '+(TOTAL_MS/1000).toFixed(2)+'초 · '+state.label+(playing?' · 재생 중':elapsed===TOTAL_MS?' · 종료':' · 정지');
 $('pause').textContent=playing?'일시정지':'이어서 재생';
}
function tick(now){if(last!==null&&playing){elapsed+=(now-last)*Number($('speed').value);if(elapsed>=TOTAL_MS){if($('loop').checked)elapsed%=TOTAL_MS;else{elapsed=TOTAL_MS;playing=false;}}draw();}last=now;requestAnimationFrame(tick);}
async function loadImage(src){const im=new Image();await new Promise((resolve,reject)=>{im.onload=resolve;im.onerror=()=>reject(new Error(src));im.src=src;});return im;}
async function init(){
 await Promise.all(['forest','snow'].map(async n=>backgrounds.set(n,await loadImage('backgrounds/'+n+'.png'))));
 await Promise.all(window.sequenceSheets.map(async s=>images.set(s.id,await loadImage(s.file))));
 loaded=true;$('restart').disabled=$('pause').disabled=false;$('seek').max=TOTAL_MS;
 $('restart').onclick=()=>{elapsed=0;playing=true;last=null;draw();};
 $('transition').onclick=()=>{elapsed=2100;playing=true;last=null;draw();};
 $('pause').onclick=()=>{if(elapsed>=TOTAL_MS)elapsed=0;playing=!playing;last=null;draw();};
 $('seek').oninput=()=>{elapsed=Number($('seek').value);playing=false;draw();};
 $('speed').oninput=()=>{$('speedText').textContent=$('speed').value+'×';};
 $('attackScale').oninput=()=>{$('attackScaleText').textContent=$('attackScale').value+'%';draw();};
 $('bg').onchange=()=>{document.body.classList.toggle('dark',$('bg').value==='dark');draw();};
 document.addEventListener('visibilitychange',()=>{last=null;});
 window.sequenceReview={seek(ms){elapsed=Math.max(0,Math.min(TOTAL_MS,ms));playing=false;draw();return stateAt(elapsed);},state:()=>({elapsed,playing,loaded,images:images.size,...stateAt(elapsed)}),total:TOTAL_MS,segments};
 const at=Number(new URLSearchParams(location.search).get('at'));
 if(Number.isFinite(at)&&at>0){elapsed=Math.min(TOTAL_MS,at);playing=false;}else playing=true;
 draw();requestAnimationFrame(tick);
}
init().catch(e=>{$('clock').textContent='로드 실패: '+e.message;});

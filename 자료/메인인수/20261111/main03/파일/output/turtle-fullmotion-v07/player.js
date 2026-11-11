'use strict';
const $=id=>document.getElementById(id),images=new Map(),backgrounds=new Map();
const oldWeak=[120,120,100,100,80,50,90,120,100,120,120,180];
const newWeak=[100,100,70,65,60,55,50,40,30,90,90,100,100,100,120,130];
const strongTime=[120,120,120,120,120,140,140,200,70,55,130,140,140,160,160,265];
const full=[{action:'walk',duration:2400,phase:'walk',label:'이동'},{action:'weak',duration:1300,phase:'weak1',label:'약공격 ①'},{action:'idle',duration:2400,phase:'idle1',label:'숨쉬기 ①'},{action:'weak',duration:1300,phase:'weak2',label:'약공격 ②'},{action:'idle',duration:2400,phase:'idle2',label:'숨쉬기 ②'},{action:'strong',duration:2200,phase:'strong',label:'강공격'},{action:'idle',duration:2400,phase:'idle3',label:'숨쉬기 ③'}];
const cycles={walk:1200,weak:1300,strong:2200,idle:2400};
let elapsed=0,playing=false,loaded=false,last=null;
function segments(){return $('mode').value==='full'?full:[{action:$('mode').value,duration:cycles[$('mode').value],phase:$('mode').value,label:$('mode').selectedOptions?.[0]?.textContent||$('mode').value}];}
function duration(){return segments().reduce((s,x)=>s+x.duration,0);}
function stateAt(t){let start=0,list=segments();t=Math.max(0,Math.min(duration(),t));for(let i=0;i<list.length;i++){const s=list[i];if(t<start+s.duration||i===list.length-1){const local=Math.min(s.duration-0.001,Math.max(0,t-start)),distance=Math.max(0,Math.min(500,Number($('distance').value))),remaining=s.action==='walk'?1-local/s.duration:0;return {...s,start,local,x:320+distance*remaining,y:330-distance*0.125*remaining};}start+=s.duration;}}
function fieldShake(s){
 if(!$('shake').checked||!['weak','strong'].includes(s.action))return {x:0,y:0};
 const impact=s.action==='weak'?570:1205,age=s.local-impact;
 const life=s.action==='weak'?160:240,amplitude=s.action==='weak'?4.5:8;
 if(age<0||age>=life)return {x:0,y:0};
 const envelope=(1-age/life)**2;
 return {x:Math.sin(age*0.15)*amplitude*envelope,y:Math.cos(age*0.19)*amplitude*0.65*envelope};
}
function sample(ds,t){let sum=0;for(let i=0;i<ds.length;i++){sum+=ds[i];if(t<sum)return i;}return ds.length-1;}
function frameFor(sheet,s){if(s.action==='walk'||s.action==='idle'){const cycle=cycles[s.action];return Math.min(sheet.frames-1,Math.floor((s.local%cycle)/cycle*sheet.frames));}return sample(s.action==='weak'?(sheet.group==='before'?oldWeak:newWeak):strongTime,s.local);}
function render(){if(!loaded)return;const s=stateAt(elapsed);for(const group of ['before','after']){
 const sheet=window.sheets.find(x=>x.group===group&&x.action===s.action),frame=frameFor(sheet,s),ctx=$(group).getContext('2d');ctx.clearRect(0,0,1000,400);
 const shake=fieldShake(s);ctx.save();ctx.translate(shake.x,shake.y);
 const bg=backgrounds.get($('bg').value);if(bg){const sc=Math.max(1024/bg.naturalWidth,424/bg.naturalHeight),w=bg.naturalWidth*sc,h=bg.naturalHeight*sc;ctx.drawImage(bg,(1000-w)/2,(400-h)/2,w,h);}
 const q=sheet.cells[frame],scale=384/(sheet.width/4)*Number($('scale').value)/100;
 const baseline=group==='before'?{walk:290,weak:296,strong:270,idle:280}[s.action]:270;
 ctx.drawImage(images.get(sheet.id),...q,s.x-sheet.width/8*scale,s.y-baseline*scale,q[2]*scale,q[3]*scale);
 ctx.restore();
 const impact=s.action==='weak'&&frame===(group==='before'?6:9)||s.action==='strong'&&frame===10;
 $(group+'-state').textContent=s.label+' · '+(frame+1)+'/'+sheet.frames+(impact?' · 타격 기준':'');
 }
 $('seek').value=elapsed;$('clock').textContent=(elapsed/1000).toFixed(2)+' / '+(duration()/1000).toFixed(2)+'초 · '+s.label+(playing?' · 재생 중':' · 정지');$('pause').textContent=playing?'일시정지':'이어서 재생';document.querySelectorAll('[data-phase]').forEach(el=>el.classList.toggle('active',el.dataset.phase===s.phase));
}
function seek(t){elapsed=Math.min(duration(),Math.max(0,t));playing=false;render();return {...stateAt(elapsed),shake:fieldShake(stateAt(elapsed))};}
function step(dir){const s=stateAt(elapsed),sheet=window.sheets.find(x=>x.group==='after'&&x.action===s.action);let boundaries;if(s.action==='walk'||s.action==='idle'){const dt=cycles[s.action]/sheet.frames;boundaries=Array.from({length:Math.ceil(s.duration/dt)+1},(_,i)=>s.start+i*dt);}else{let total=s.start;boundaries=[total];for(const d of s.action==='weak'?newWeak:strongTime){total+=d;boundaries.push(total);}}const t=dir>0?boundaries.find(t=>t>elapsed+0.01):boundaries.findLast(t=>t<elapsed-0.01);seek(t===undefined?elapsed+dir*75:t);}
function tick(now){if(last!==null&&playing){elapsed+=(now-last)*Number($('speed').value);const end=duration();if(elapsed>=end){if($('loop').checked||$('mode').value!=='full')elapsed%=end;else{elapsed=end;playing=false;}}render();}last=now;requestAnimationFrame(tick);}
async function load(src){const im=new Image();await new Promise((r,j)=>{im.onload=r;im.onerror=()=>j(new Error(src));im.src=src;});return im;}
async function init(){await Promise.all(window.sheets.map(async s=>images.set(s.id,await load(s.file))));await Promise.all(['forest','snow'].map(async n=>backgrounds.set(n,await load('backgrounds/'+n+'.png'))));loaded=true;$('restart').disabled=$('pause').disabled=false;
 $('restart').onclick=()=>{elapsed=0;playing=true;last=null;render();};$('pause').onclick=()=>{if(elapsed>=duration())elapsed=0;playing=!playing;last=null;render();};$('seek').oninput=()=>seek(Number($('seek').value));$('mode').onchange=()=>{elapsed=0;last=null;$('seek').max=duration();render();};$('transition').onclick=()=>{$('mode').value='full';$('seek').max=14400;elapsed=2100;playing=true;last=null;render();};$('speed').oninput=()=>{$('speedText').textContent=$('speed').value+'×';};$('scale').oninput=()=>{$('scaleText').textContent=$('scale').value+'%';render();};$('bg').onchange=()=>{document.body.classList.toggle('dark',$('bg').value==='dark');render();};$('prev').onclick=()=>step(-1);$('next').onclick=()=>step(1);document.addEventListener('visibilitychange',()=>{last=null;});
 $('raws').innerHTML=window.sheets.map(s=>'<details><summary>'+(s.group==='before'?'기존':'수정')+' · '+s.action+' · '+s.frames+'포즈</summary><a href="'+s.file+'" target="_blank"><img src="'+s.file+'" alt="'+s.id+' 원본 시트"></a></details>').join('');
 $('distance').oninput=()=>{$('distanceText').textContent=$('distance').value;render();};$('shake').onchange=render;
 window.motionReview={seek,state:()=>({elapsed,playing,loaded,images:images.size,...stateAt(elapsed),shake:fieldShake(stateAt(elapsed))}),frames:()=>window.sheets.map(s=>({id:s.id,frame:frameFor(s,stateAt(elapsed))})),duration};const at=Number(new URLSearchParams(location.search).get('at'));if(at>0)seek(at);else{playing=true;render();}requestAnimationFrame(tick);
}
init().catch(e=>{$('clock').textContent='로드 실패: '+e.message;});

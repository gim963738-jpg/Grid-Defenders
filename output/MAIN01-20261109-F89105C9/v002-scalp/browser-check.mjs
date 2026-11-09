import {spawn} from 'node:child_process';
import {writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const out=path.dirname(fileURLToPath(import.meta.url));
const qa=path.join(out,'qa-game'),port=5193,debug=9343;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const server=spawn(process.execPath,['C:/Users/user/Desktop/Grid Defenders/게임/node_modules/vite/bin/vite.js','--host','127.0.0.1','--port',String(port),'--strictPort'],{cwd:qa,windowsHide:true,stdio:'ignore'});
let edge,ws;const pending=new Map();let id=0;const report={checks:[],errors:[]};
async function cdp(method,params={}){const key=++id;return new Promise((resolve,reject)=>{pending.set(key,{resolve,reject});ws.send(JSON.stringify({id:key,method,params}));});}
async function evaluate(expression){const r=await cdp('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;}
function check(ok,name){report.checks.push({name,passed:!!ok});if(!ok)throw Error(name);}
async function mouse(type,x,y,button='left'){return cdp('Input.dispatchMouseEvent',{type,x,y,button,buttons:type==='mouseReleased'?0:1,clickCount:type==='mouseMoved'?0:1});}
async function click(x,y){await mouse('mousePressed',x,y);await mouse('mouseReleased',x,y);}
async function box(selector){return evaluate(`(()=>{const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2,w:r.width,h:r.height,top:r.top,bottom:r.bottom}})()`);}
async function hit(selector){await evaluate(`(()=>{const n=document.querySelector(${JSON.stringify(selector)}),row=n.closest('.compare-cards');if(row){const r=n.getBoundingClientRect(),p=row.getBoundingClientRect();if(r.right>p.right)row.scrollLeft+=r.right-p.right+4;if(r.left<p.left)row.scrollLeft-=p.left-r.left+4;}})()`);await sleep(60);await evaluate(`(()=>{const n=document.querySelector(${JSON.stringify(selector)}),p=n.closest('#dev-image-compare-panel');if(p){const r=n.getBoundingClientRect(),b=p.getBoundingClientRect();if(r.bottom>b.bottom)p.scrollTop+=r.bottom-b.bottom+4;if(r.top<b.top)p.scrollTop-=b.top-r.top+4;}})()`);const b=await box(selector);await click(b.x,b.y);}
async function snap(name){const r=await cdp('Page.captureScreenshot',{format:'png'});await writeFile(path.join(out,name),Buffer.from(r.data,'base64'));}
try{
 for(let i=0;i<100;i++){try{if((await fetch(`http://127.0.0.1:${port}`)).ok)break;}catch{}await sleep(100);}
 edge=spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',['--headless=new','--no-first-run','--no-default-browser-check','--disable-gpu',`--remote-debugging-port=${debug}`,`--user-data-dir=${path.join(out,'edge-profile')}`,'about:blank'],{windowsHide:true,stdio:'ignore'});
 let targets;for(let i=0;i<100;i++){try{targets=await (await fetch(`http://127.0.0.1:${debug}/json`)).json();if(targets.length)break;}catch{}await sleep(100);}
 ws=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));
 ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);if(m.error)p?.reject(Error(JSON.stringify(m.error)));else p?.resolve(m.result);}else if(m.method==='Runtime.exceptionThrown')report.errors.push(m.params);});
 await cdp('Runtime.enable');await cdp('Page.enable');await cdp('Page.addScriptToEvaluateOnNewDocument',{source:'localStorage.clear();'});await cdp('Emulation.setDeviceMetricsOverride',{width:800,height:360,deviceScaleFactor:1,mobile:false});
 await cdp('Page.navigate',{url:`http://127.0.0.1:${port}/battle-landscape.html?battle=infinite-test`});
 for(let i=0;i<200;i++){if(await evaluate(`!!document.querySelector('#live-landscape')?.liveBattle?.ready`))break;await sleep(100);}
 await evaluate(`window.api=document.querySelector('#live-landscape').liveBattle;document.querySelector('#dev-infinite-test').click()`);await sleep(800);
 await evaluate(`for(const a of document.getAnimations())a.finish();if(document.querySelector('#app').dataset.combatPaused!=='true')api.pause();api.refresh()`);await sleep(200);
 await sleep(2100); // Let the existing 2s autosave capture paused state before taking the baseline.
 check(await evaluate(`!document.querySelector('#dev-image-compare').disabled`),'current root integration ready');
 await evaluate(`window.before={gold:api.game.gold,units:JSON.stringify(api.game.units),storage:JSON.stringify(localStorage)};document.querySelector('#dev-image-compare').click()`);
 check(await evaluate(`document.querySelectorAll('.compare-cards button').length===9&&document.querySelectorAll('.compare-cards button:not([hidden])').length===4&&document.querySelector('[data-support]').textContent.includes('정면만')`),'nine distinct cards with new four immediately discoverable');
 check(await evaluate(`[...document.querySelectorAll('.compare-cards button')].map(b=>b.textContent).join('|')==='원본|기존1안|기존2안|기존3안|기존4안|신규1안|신규2안|신규3안|신규4안'`),'old and new variant labels are unambiguous');
 await evaluate(`(async()=>{window.catalog=(await import('/src/devImageCompareArt.ts')).DIRECTION_COMPARE_ART;})()`);
 check(await evaluate(`catalog.length===19&&catalog.filter(a=>a.variant<5).length===15&&catalog.filter(a=>a.variant>=5).every(a=>a.direction==='front')`),'catalog keeps old fifteen and four front-only assets');
 check(await evaluate(`(async()=> (await Promise.all(catalog.map(a=>new Promise(resolve=>{const img=new Image();img.onload=()=>resolve(img.naturalWidth===a.width&&img.naturalHeight===a.height);img.onerror=()=>resolve(false);img.src='/assets/dev-image-compare/'+a.file})))).every(Boolean))()`),'all nineteen PNGs load at their own native dimensions');
 await hit('[data-group=legacy]');
 for(let v=0;v<5;v++)for(const dir of ['front','right45','right90']){
  await evaluate(`document.querySelector('.compare-cards button[data-variant="${v}"]').click();(()=>{const s=document.querySelector('select');s.value='${dir}';s.dispatchEvent(new Event('change'));})();document.querySelector('.compare-cards button[data-variant="${v}"]').click()`);
  await click(180+v*60,160);
 }
 check(await evaluate(`document.querySelectorAll('.compare-actor').length===15&&new Set([...document.querySelectorAll('.compare-actor img')].map(n=>n.src)).size===15`),'all fifteen legacy card-direction combinations still select and place distinct assets');
 await evaluate(`document.querySelector('[data-action=clear]').click()`);await hit('[data-group=scalp]');
 for(let v=5;v<=8;v++){
  await hit(`.compare-cards button[data-variant="${v}"]`);await click(190+(v-5)*75,190);
 }
 check(await evaluate(`[...document.querySelectorAll('.compare-actor img')].every((img,i)=>img.src.includes('scalp_face_v03/variant-'+(i+1)+'-front.png'))&&document.querySelectorAll('.compare-actor').length===4`),'each new card clicks to place its correct transparent PNG');
 await snap('new-four-wave.png');
 // Select and scale each placed new design independently, anchoring the foot.
 for(let i=1;i<=4;i++){
  await hit(`.compare-actor:nth-child(${i})`);
  const before=await evaluate(`(()=>{const n=document.querySelector('.compare-actor:nth-child(${i})'),r=n.getBoundingClientRect();return {x:r.x+r.width/2,y:r.bottom,others:[...document.querySelectorAll('.compare-actor')].filter(a=>a!==n).map(a=>a.dataset.percent).join()}})()`);
  for(const percent of [50,200,100]){
   await evaluate(`(()=>{const n=document.querySelector('[type=number]');n.value='${percent}';n.dispatchEvent(new Event('input'));})()`);
   check(await evaluate(`(()=>{const n=document.querySelector('.compare-actor:nth-child(${i})'),r=n.getBoundingClientRect();return n.dataset.percent==='${percent}'&&Math.abs(r.x+r.width/2-${before.x})<.01&&Math.abs(r.bottom-${before.y})<.01&&[...document.querySelectorAll('.compare-actor')].filter(a=>a!==n).map(a=>a.dataset.percent).join()===${JSON.stringify(before.others)}})()`),`new variant ${i} ${percent}% fixes foot and isolates selection`);
  }
 }
 check(await evaluate(`(()=>{const img=document.querySelector('.compare-actor:nth-child(2) img'),r=img.getBoundingClientRect();return Math.abs(r.width/r.height-1133/1388)<.001})()`),'non-square new variant2 preserves 1133 by 1388 aspect');
 await evaluate(`(()=>{const n=document.querySelector('[type=number]');n.value='1';n.dispatchEvent(new Event('input'));window.partial=n.value==='1';n.value='150';n.dispatchEvent(new Event('input'));})()`);
 check(await evaluate(`partial&&document.querySelector('.compare-actor:nth-child(4)').dataset.percent==='150'`),'number editing supports partial digits');
 await hit('[data-action=reset]');
 check(await evaluate(`document.querySelector('.compare-actor:nth-child(4)').dataset.percent==='100'`),'100 percent reset applies to selected new actor');
 const move=await box('.compare-actor:nth-child(1)');await mouse('mousePressed',move.x,move.y);await mouse('mouseMoved',move.x+18,move.y+22);await mouse('mouseReleased',move.x+18,move.y+22);
 check(await evaluate(`document.querySelector('.compare-actor').dataset.x==='208'&&document.querySelector('.compare-actor').dataset.y==='212'`),'new placed preview reselects and moves');
 for(let v=5;v<=8;v++){
  await hit(`.compare-cards button[data-variant="${v}"]`);
  await sleep(100);const card=await box(`.compare-cards button[data-variant="${v}"]`);await mouse('mousePressed',card.x,card.y);await mouse('mouseMoved',190+(v-5)*75,280);await mouse('mouseReleased',190+(v-5)*75,280);await sleep(520);
 }
 report.dragged=await evaluate(`[...document.querySelectorAll('.compare-actor img')].map(n=>n.src)`);
 check(await evaluate(`document.querySelectorAll('.compare-actor').length===8&&[...document.querySelectorAll('.compare-actor img')].slice(4).every((img,i)=>img.src.includes('scalp_face_v03/variant-'+(i+1)+'-front.png'))`),'all four new cards support drag to battlefield');
 await evaluate(`window.newBefore=[...document.querySelectorAll('.compare-actor')].map(n=>[n.dataset.x,n.dataset.y,n.dataset.percent,n.querySelector('img').src]);const s=document.querySelector('select');s.value='right90';s.dispatchEvent(new Event('change'));`);
 check(await evaluate(`document.querySelector('select').value==='front'&&[...document.querySelector('select').options].filter(o=>o.value!=='front').every(o=>o.disabled)&&JSON.stringify(newBefore)===JSON.stringify([...document.querySelectorAll('.compare-actor')].map(n=>[n.dataset.x,n.dataset.y,n.dataset.percent,n.querySelector('img').src]))`),'unsupported new direction keeps image foot scale and disables side choices');
 await hit('[data-group=legacy]');await hit('.compare-cards button[data-variant="1"]');
 await evaluate(`const side=document.querySelector('select');side.value='right45';side.dispatchEvent(new Event('change'));`);
 await hit('.compare-cards button[data-variant="1"]');await click(230,110);
 check(await evaluate(`document.querySelector('.compare-actor:last-child img').src.includes('directions_v02/variant-1-right-045.png')`),'return to old variant restores actual right45');
 await evaluate(`(()=>{const s=document.querySelector('select');s.value='right90';s.dispatchEvent(new Event('change'));})()`);
 check(await evaluate(`document.querySelector('.compare-actor:last-child img').src.includes('directions_v02/variant-1-right-090.png')`),'old right90 still works');
 await hit('[data-group=scalp]');
 check(await evaluate(`[...document.querySelectorAll('.compare-cards button:not([hidden])')].every(b=>!b.disabled)`),'all new fronts remain selectable while old direction is right90');
 await hit('.compare-cards button[data-variant="6"]');await click(320,110);
 check(await evaluate(`document.querySelector('.compare-actor:last-child img').src.includes('scalp_face_v03/variant-2-front.png')&&document.querySelector('select').value==='front'`),'choosing new from old right90 explicitly selects new front');
 await evaluate(`window.normalizeSave=raw=>JSON.stringify(Object.fromEntries(Object.entries(JSON.parse(raw)).map(([k,v])=>{const d=JSON.parse(v);delete d.savedAt;return [k,d]})));`);
 report.state=await evaluate(`({before,after:{gold:api.game.gold,units:JSON.stringify(api.game.units),storage:JSON.stringify(localStorage)}})`);
 check(await evaluate(`api.game.gold===before.gold&&JSON.stringify(api.game.units)===before.units&&normalizeSave(JSON.stringify(localStorage))===normalizeSave(before.storage)`),'previews do not change gold actual units or saved battle apart from normal savedAt');
 await hit('[data-action=delete]');check(await evaluate(`document.querySelectorAll('.compare-actor').length===9`),'individual delete leaves other previews');
 await hit('[data-action=close]');
 check(await evaluate(`document.querySelectorAll('.compare-actor').length===9&&getComputedStyle(document.querySelector('#dev-image-compare-layer')).pointerEvents==='none'&&[...document.querySelectorAll('.compare-actor')].every(n=>getComputedStyle(n).pointerEvents==='none')`),'close preserves drawings and restores game input');
 await evaluate(`api.select('guard')`);await click(189,105);
 check(await evaluate(`api.game.units.length===1&&api.game.units[0].kind==='guard'`),'real soldier summon works with closed preview layer');
 await evaluate(`document.querySelector('#dev-image-compare').click();document.querySelector('[data-action=clear]').click()`);
 check(await evaluate(`document.querySelectorAll('.compare-actor').length===0`),'clear all restores battlefield');
 await hit('.compare-cards button[data-variant="5"]');await click(260,190);
 await evaluate(`document.querySelector('#dev-boss-scene').click()`);await sleep(800);await evaluate(`for(const a of document.getAnimations())a.finish();api.refresh()`);
 check(await evaluate(`api.scene==='boss'&&document.querySelectorAll('.compare-actor').length===0&&document.querySelector('#dev-image-compare-panel').hidden`),'boss transition resets new previews and panel');
 await evaluate(`document.querySelector('#dev-image-compare').click()`);await hit('[data-group=scalp]');await hit('.compare-cards button[data-variant="8"]');await click(280,200);
 check(await evaluate(`Math.abs(Number(document.querySelector('.compare-actor').dataset.x)-437.5)<.001`),'new actor uses actual boss world scale');
 await snap('new-boss.png');
 const coord=await evaluate(`document.querySelector('.compare-actor').dataset.x+','+document.querySelector('.compare-actor').dataset.y`);
 await cdp('Emulation.setDeviceMetricsOverride',{width:320,height:640,deviceScaleFactor:1,mobile:false});await sleep(150);
 check(await evaluate(`document.querySelector('.compare-actor').dataset.x+','+document.querySelector('.compare-actor').dataset.y===${JSON.stringify(coord)}`),'resize preserves logical new actor foot position');
 for(const group of ['legacy','scalp']){
  await hit(`[data-group=${group}]`);
  const ids=group==='legacy'?[0,1,2,3,4]:[5,6,7,8];
  for(const v of ids){await hit(`.compare-cards button[data-variant="${v}"]`);const b=await box(`.compare-cards button[data-variant="${v}"]`);check(b.x-b.w/2>=12&&b.x+b.w/2<=308&&b.w>=48&&b.h>=48,`320px group ${group} card ${v} reachable at full touch size`);}
 }
 await snap('narrow-320.png');
 await evaluate(`document.querySelector('#dev-defense-scene').click()`);await sleep(800);await evaluate(`for(const a of document.getAnimations())a.finish();api.refresh()`);
 check(await evaluate(`api.scene==='defense'&&document.querySelectorAll('.compare-actor').length===0`),'wave reentry clears boss previews');
 // Isolated DOM fixture exercises lifetime disposal without touching the real game module.
 await cdp('Page.navigate',{url:`http://127.0.0.1:${port}/compare-check.html`});
 for(let i=0;i<50;i++){if(await evaluate(`!!window.fixture`))break;await sleep(100);}
 check(await evaluate(`(()=>{fixture.setAssets(math.COMPARE_ART);try{fixture.setAssets([{...math.COMPARE_ART[0],variant:99}]);return false}catch{return true}})()`),'catalog-based setAssets accepts new IDs and rejects unknown variants');
 await evaluate(`fixture.dispose();fixture.dispose()`);
 check(await evaluate(`!document.querySelector('#dev-image-compare')&&!document.querySelector('#dev-image-compare-layer')&&!document.querySelector('#dev-image-compare-panel')`),'dispose remains idempotent with new catalog');
 await cdp('Emulation.setDeviceMetricsOverride',{width:1600,height:700,deviceScaleFactor:1,mobile:false});
 await evaluate(`document.body.innerHTML='<div id="frames" style="display:flex;gap:8px;padding:12px;background:#f8f3e7">'+math.COMPARE_ART.filter(a=>a.variant===0||a.variant>=5).map(a=>'<figure style="margin:0;width:300px"><img src="/assets/dev-image-compare/'+a.file+'" style="width:300px;height:550px;object-fit:contain"><figcaption>'+a.label+' 전체 캔버스</figcaption></figure>').join('')+'</div>'`);
 await sleep(200);await snap('fullframes-light.png');
 await evaluate(`document.querySelector('#frames').style.background='#1b242e';document.querySelector('#frames').style.color='white'`);await snap('fullframes-dark.png');
 report.result='PASS';
}catch(e){report.result='FAIL';report.failure=String(e);try{await snap('failure.png');}catch{}}
finally{await writeFile(path.join(out,'browser-result.json'),JSON.stringify(report,null,2));try{await cdp('Browser.close');}catch{}ws?.close();edge?.kill();server.kill();console.log(JSON.stringify(report,null,2));}

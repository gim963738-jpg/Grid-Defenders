import {spawn} from 'node:child_process';
import {writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const out=path.dirname(fileURLToPath(import.meta.url));
const qa=path.join(out,'qa-game'),port=5189,debug=9339;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const server=spawn(process.execPath,['C:/Users/user/Desktop/Grid Defenders/게임/node_modules/vite/bin/vite.js','--host','127.0.0.1','--port',String(port),'--strictPort'],{cwd:qa,windowsHide:true,stdio:'ignore'});
let edge,ws;const pending=new Map();let id=0;const report={checks:[],errors:[]};
async function cdp(method,params={}){const key=++id;return new Promise((resolve,reject)=>{pending.set(key,{resolve,reject});ws.send(JSON.stringify({id:key,method,params}));});}
async function evaluate(expression){const r=await cdp('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;}
function check(ok,name){report.checks.push({name,passed:!!ok});if(!ok)throw Error(name);}
async function mouse(type,x,y,button='left'){return cdp('Input.dispatchMouseEvent',{type,x,y,button,buttons:type==='mouseReleased'?0:1,clickCount:type==='mouseMoved'?0:1});}
async function click(x,y){await mouse('mousePressed',x,y);await mouse('mouseReleased',x,y);}
async function box(selector){return evaluate(`(()=>{const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2,w:r.width,h:r.height,top:r.top,bottom:r.bottom}})()`);}
async function hit(selector){await evaluate(`(()=>{const n=document.querySelector(${JSON.stringify(selector)}),p=n.closest('#dev-image-compare-panel');if(p){const r=n.getBoundingClientRect(),b=p.getBoundingClientRect();if(r.bottom>b.bottom)p.scrollTop+=r.bottom-b.bottom+4;if(r.top<b.top)p.scrollTop-=b.top-r.top+4;}})()`);const b=await box(selector);await click(b.x,b.y);}
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
 check(await evaluate(`!document.querySelector('#dev-image-compare').disabled`),'actual game ready and comparison button enabled');
 await evaluate(`window.before={gold:api.game.gold,units:JSON.stringify(api.game.units),storage:JSON.stringify(localStorage)};document.querySelector('#dev-image-compare').click()`);
 check(await evaluate(`!document.querySelector('#dev-image-compare-panel').hidden&&document.querySelectorAll('#dev-image-compare').length===1`),'one button opens panel');
 await hit('.compare-cards button:nth-child(1)');await click(210,180);
 await hit('.compare-cards button:nth-child(2)');await click(285,180);
 await hit('.compare-cards button:nth-child(3)');await click(360,180);
 check(await evaluate(`document.querySelectorAll('.compare-actor').length===3`),'select cards and place multiple variants on real battlefield');
 await hit('[data-action=mode]');
 const actor=await box('.compare-actor:nth-child(2)');await mouse('mousePressed',actor.x,actor.y);await mouse('mouseMoved',actor.x+25,actor.y+30);await mouse('mouseReleased',actor.x+25,actor.y+30);
 check(await evaluate(`document.querySelector('.compare-actor:nth-child(2)').dataset.x==='310'&&document.querySelector('.compare-actor:nth-child(2)').dataset.y==='210'`),'reselect and drag updates logical position');
 const footBefore=await evaluate(`(()=>{const n=document.querySelector('.compare-actor:nth-child(2)'),r=n.getBoundingClientRect();return {x:r.x+r.width/2,y:r.bottom,img:n.querySelector('img').getBoundingClientRect().height}})()`);
 await evaluate(`const input=document.querySelector('[type=number]');input.value='200';input.dispatchEvent(new Event('input',{bubbles:true}))`);
 const footAfter=await evaluate(`(()=>{const n=document.querySelector('.compare-actor:nth-child(2)'),r=n.getBoundingClientRect();return {x:r.x+r.width/2,y:r.bottom,img:n.querySelector('img').getBoundingClientRect().height}})()`);
 check(footBefore.x===footAfter.x&&footBefore.y===footAfter.y&&Math.abs(footAfter.img/footBefore.img-2)<.01,'200 percent keeps sole pivot and uniform image scale');
 await snap('wave-800x360.png');
 await evaluate(`const n=document.querySelector('[type=number]');n.value='50';n.dispatchEvent(new Event('input',{bubbles:true}))`);await hit('[data-action=reset]');
 check(await evaluate(`document.querySelector('.compare-actor:nth-child(2)').dataset.percent==='100'`),'50 percent and 100 percent restore');
 check(await evaluate(`(()=>{const n=document.querySelector('[type=number]');n.value='1';n.dispatchEvent(new Event('input'));const partial=n.value==='1';n.value='150';n.dispatchEvent(new Event('input'));const typed=document.querySelector('.compare-actor:nth-child(2)').dataset.percent==='150';n.value='300';n.dispatchEvent(new Event('change'));const clamped=document.querySelector('.compare-actor:nth-child(2)').dataset.percent==='200';document.querySelector('[data-action=reset]').click();return partial&&typed&&clamped;})()`),'number editing permits partial digits and clamps only on commit');
 await evaluate(`const s=document.querySelector('[aria-label="비교 방향"]');s.value='right45';s.dispatchEvent(new Event('change'))`);
 check(await evaluate(`document.querySelector('[aria-label="비교 방향"]').value==='right45'`),'actual variant1 right45 direction changes selected image');
 await hit('[data-action=delete]');check(await evaluate(`document.querySelectorAll('.compare-actor').length===2`),'delete selected only');
 await hit('[data-action=close]');
 check(await evaluate(`document.querySelectorAll('.compare-actor').length===2&&getComputedStyle(document.querySelector('#dev-image-compare-layer')).pointerEvents==='none'&&[...document.querySelectorAll('.compare-actor')].every(n=>getComputedStyle(n).pointerEvents==='none')`),'close retains images with no input interception');
 report.state=await evaluate(`({before,after:{gold:api.game.gold,units:JSON.stringify(api.game.units),storage:JSON.stringify(localStorage)}})`);
 check(await evaluate(`api.game.gold===before.gold&&JSON.stringify(api.game.units)===before.units&&JSON.stringify(Object.fromEntries(Object.entries(localStorage).map(([k,v])=>{const d=JSON.parse(v);delete d.savedAt;return [k,d]})))===JSON.stringify(Object.fromEntries(Object.entries(JSON.parse(before.storage)).map(([k,v])=>{const d=JSON.parse(v);delete d.savedAt;return [k,d]})))`),'preview operations leave gold roster and saved battle unchanged except normal autosave savedAt');
 await evaluate(`document.querySelector('#dev-image-compare').click();document.querySelector('[data-action=clear]').click()`);check(await evaluate(`document.querySelectorAll('.compare-actor').length===0`),'clear all immediately restores battlefield');
 // Drag a card to the field, then cancel an actor drag.
 await evaluate(`document.querySelector('#dev-image-compare-panel').scrollTop=0`);await sleep(100);await evaluate(`window.draglog=[];for(const t of ['pointerdown','pointerup','pointermove','lostpointercapture'])window.addEventListener(t,e=>draglog.push([t,e.target.className,e.clientX,e.clientY]),true)`);const card=await box('.compare-cards button:nth-child(2)');await mouse('mousePressed',card.x,card.y);await mouse('mouseMoved',260,170);await mouse('mouseReleased',260,170);
 report.drag=await evaluate(`({log:draglog,rect:document.querySelector('#battle-scene').getBoundingClientRect().toJSON(),card:document.querySelector('.compare-cards button:nth-child(2)').getBoundingClientRect().toJSON(),panel:document.querySelector('#dev-image-compare-panel').hidden})`);check(await evaluate(`document.querySelectorAll('.compare-actor').length===1`),'card drag to field places preview');
 await evaluate(`const cancelActor=document.querySelector('.compare-actor');cancelActor.dispatchEvent(new PointerEvent('pointercancel',{bubbles:true,pointerId:1}));window.dispatchEvent(new Event('resize'))`);
 await evaluate(`document.querySelector('[data-action=close]').click();api.select('guard')`);await click(189,105);check(await evaluate(`api.game.units.length===1&&api.game.units[0].kind==='guard'`),'closed comparison restores actual soldier summon click');await evaluate(`api.select('blond')`);await click(247,147);report.heroInput=await evaluate(`api.game.units.map(u=>u.kind)`);
 await evaluate(`document.querySelector('#dev-boss-scene').click()`);await sleep(800);await evaluate(`for(const a of document.getAnimations())a.finish();api.refresh()`);await sleep(100);
 check(await evaluate(`api.scene==='boss'&&document.querySelectorAll('.compare-actor').length===0&&document.querySelector('#dev-image-compare-panel').hidden`),'boss switch clears previous previews selection and panel');
 await evaluate(`document.querySelector('#dev-image-compare').click()`);await hit('.compare-cards button:nth-child(1)');await click(300,170);
 check(await evaluate(`Math.abs(Number(document.querySelector('.compare-actor').dataset.x)-468.75)<.1`),'boss coordinate uses 1250 world width at 800 CSS pixels');
 await evaluate(`window.bossFoot={x:document.querySelector('.compare-actor').dataset.x,y:document.querySelector('.compare-actor').dataset.y};for(const dir of ['right45','right90']){const s=document.querySelector('select');s.value=dir;s.dispatchEvent(new Event('change'));}`);
 check(await evaluate(`document.querySelector('.compare-actor img').src.includes('original-right-090.png')&&document.querySelector('.compare-actor').dataset.x===bossFoot.x&&document.querySelector('.compare-actor').dataset.y===bossFoot.y&&document.querySelector('.compare-actor').dataset.percent==='100'`),'actual boss right45 right90 swaps preserve foot position and scale');
 await snap('boss-800x360.png');
 await evaluate(`const sd=document.querySelector('select');sd.value='right45';sd.dispatchEvent(new Event('change'))`);
 for(let v=1;v<=4;v++){
  await evaluate(`document.querySelectorAll('.compare-cards button')[${v}].click()`);await click(180+v*65,250);
 }
 check(await evaluate(`[...document.querySelectorAll('.compare-actor img')].slice(1).every((img,i)=>img.src.includes('variant-'+(i+1)+'-right-045.png'))`),'all four new variants place actual right45 art');
 await snap('directions45-battle.png');
 for(let v=1;v<=4;v++){
  await hit(`.compare-actor:nth-child(${v+1})`);
  await evaluate(`(()=>{const sd=document.querySelector('select');sd.value='right90';sd.dispatchEvent(new Event('change'));})()`);
 }
 check(await evaluate(`[...document.querySelectorAll('.compare-actor')].slice(1).every((n,i)=>n.querySelector('img').src.includes('variant-'+(i+1)+'-right-090.png')&&Number(n.dataset.x)===(180+(i+1)*65)/.64&&Number(n.dataset.y)===250/.64)`),'all four new variants swap to actual right90 art at fixed world foot');
 await snap('directions90-battle.png');
 await cdp('Emulation.setDeviceMetricsOverride',{width:320,height:640,deviceScaleFactor:1,mobile:false});await sleep(100);
 const pb=await box('#dev-image-compare-panel');check(pb.x-pb.w/2>=11&&pb.x+pb.w/2<=309&&pb.bottom<=640,'panel fits narrow 320 pixel viewport without scaling UI');
 check(await evaluate(`[...document.querySelectorAll('#dev-image-compare-panel button')].every(n=>n.getBoundingClientRect().height>=48)`),'panel buttons retain 48 pixel touch height');await snap('narrow-320.png');
 await evaluate(`document.querySelector('#dev-defense-scene').click()`);await sleep(800);await evaluate(`for(const a of document.getAnimations())a.finish();api.refresh()`);
 check(await evaluate(`api.scene==='defense'&&document.querySelectorAll('.compare-actor').length===0`),'return to wave clears boss previews');
 check(report.heroInput.includes('blond'),'closed comparison restores actual hero summon click');
 await cdp('Emulation.setDeviceMetricsOverride',{width:800,height:360,deviceScaleFactor:1,mobile:false});
 await cdp('Page.navigate',{url:`http://127.0.0.1:${port}/compare-check.html`});
 for(let i=0;i<50;i++){if(await evaluate(`!!window.fixture`))break;await sleep(100);}
 check(await evaluate(`(()=>{const p=math.compareLocal({x:260,y:200},{left:100,top:20,width:400,height:280},{width:800,height:560,top:100});return p.x===320&&p.y===260})()`),'coordinate conversion handles CSS offset half scale and canopy top');
 check(await evaluate(`(()=>{const p=math.compareLocal({x:-30,y:999},{left:0,top:0,width:800,height:360},{width:800,height:360,top:0});return p.x===0&&p.y===360})()`),'out of bounds pointer is clamped to field');
 check(await evaluate(`(()=>{for(const a of math.COMPARE_ART){const p=math.comparePlacement(a,57,100);if(Math.abs(p.top+a.footY*p.height/a.height)>.00001||Math.abs(p.height/a.height* a.bodyHeight-57)>.00001)return false;}return true})()`),'all five distinct source framings normalize to 57 body units at sole anchor');
 // Metadata-only fixture: existing front bytes stand in for direction images solely to test API state invariants.
 await evaluate(`fixture.setAssets([{...math.COMPARE_ART[0],direction:'right45',footX:550,footY:1000,bodyHeight:900}]);document.querySelector('#dev-image-compare').click()`);
 await hit('.compare-cards button');await click(220,220);
 await evaluate(`window.directionBefore={x:document.querySelector('.compare-actor').dataset.x,y:document.querySelector('.compare-actor').dataset.y};const ds=document.querySelector('select');ds.value='right45';ds.dispatchEvent(new Event('change'))`);
 check(await evaluate(`document.querySelector('select').value==='right45'&&document.querySelector('.compare-actor').dataset.x===directionBefore.x&&document.querySelector('.compare-actor').dataset.y===directionBefore.y`),'direction metadata swap preserves placed world foot position');
 const ac=await box('.compare-actor');await mouse('mousePressed',ac.x,ac.y);
 await evaluate(`window.cancelBefore=document.querySelector('.compare-actor').dataset.x`);
 await evaluate(`document.querySelector('.compare-actor').dispatchEvent(new PointerEvent('pointercancel',{bubbles:true,pointerId:1}));`);
 await mouse('mouseMoved',ac.x+80,ac.y);await mouse('mouseReleased',ac.x+80,ac.y);
 check(await evaluate(`document.querySelector('.compare-actor').dataset.x===cancelBefore&&!document.querySelector('.compare-actor').hasPointerCapture(1)`),'pointer cancellation releases capture and prevents stale drag');
 await hit('.compare-cards button');
 await cdp('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:350,y:220,id:11}]});
 await cdp('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 check(await evaluate(`document.querySelectorAll('.compare-actor').length===2`),'touch input places a second preview on field');
 await evaluate(`fixture.dispose();fixture.dispose()`);
 check(await evaluate(`!document.querySelector('#dev-image-compare-layer')&&!document.querySelector('#dev-image-compare-panel')&&!document.querySelector('#dev-image-compare')`),'dispose is idempotent and removes all owned UI');
 await cdp('Emulation.setDeviceMetricsOverride',{width:1600,height:1200,deviceScaleFactor:1,mobile:false});
 await evaluate(`(async()=>{window.artList=(await import('/src/devImageCompareArt.ts')).DIRECTION_COMPARE_ART;})()`);
 check(await evaluate(`(async()=> (await Promise.all(artList.map(a=>new Promise(resolve=>{const img=new Image();img.onload=()=>resolve(img.naturalWidth===a.width&&img.naturalHeight===a.height);img.onerror=()=>resolve(false);img.src='/assets/dev-image-compare/'+a.file})))).every(Boolean))()`),'all 15 actual direction PNGs load at original dimensions');
 await evaluate(`document.body.innerHTML='<div id="fullframes" style="display:grid;grid-template-columns:repeat(5,300px);gap:8px;padding:12px;background:#f8f3e7">'+[...artList].sort((a,b)=>['front','right45','right90'].indexOf(a.direction)-['front','right45','right90'].indexOf(b.direction)||a.variant-b.variant).map(a=>'<figure style="margin:0;width:300px"><img src="/assets/dev-image-compare/'+a.file+'" style="width:300px;height:330px;object-fit:contain"><figcaption>'+a.label+' '+a.direction+' · 전체 원본 캔버스</figcaption></figure>').join('')+'</div>'`);
 await sleep(200);await snap('fullframes-light.png');
 await evaluate(`document.querySelector('#fullframes').style.background='#1b242e';document.querySelector('#fullframes').style.color='white'`);await snap('fullframes-dark.png');
 report.result='PASS';
}catch(e){report.result='FAIL';report.failure=String(e);try{await snap('failure.png');}catch{}}
finally{await writeFile(path.join(out,'browser-result.json'),JSON.stringify(report,null,2));try{await cdp('Browser.close');}catch{}ws?.close();edge?.kill();server.kill();console.log(JSON.stringify({...report,state:report.state?'see browser-result.json':undefined},null,2));}


// Main integration verification: same producer cases rerun against actual root, not an independent QA claim.
import {spawn} from 'node:child_process';
import {writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const out=path.dirname(fileURLToPath(import.meta.url));
const qa=path.join(out,'qa-game'),port=5173,debug=9357;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const server={kill(){}}; // Use existing root5173 read-only; never restart/terminate it.
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
 check(await evaluate(`!document.querySelector('#dev-image-compare').disabled`),'latest integrated root initializes');
 await evaluate(`window.before={gold:api.game.gold,units:JSON.stringify(api.game.units),storage:JSON.stringify(localStorage)};document.querySelector('#dev-image-compare').click()`);
 await evaluate(`(async()=>{window.catalog=(await import('/src/devImageCompareArt.ts')).DIRECTION_COMPARE_ART;})()`);
 check(await evaluate(`catalog.length===21&&document.querySelectorAll('.compare-cards button').length===9&&catalog.filter(a=>a.variant===6).length===3&&catalog.filter(a=>[5,7,8].includes(a.variant)).length===3`),'twenty-one assets and nine cards with exact support sets');
 check(await evaluate(`(async()=> (await Promise.all(catalog.map(a=>new Promise(resolve=>{const img=new Image();img.onload=()=>resolve(img.naturalWidth===a.width&&img.naturalHeight===a.height);img.onerror=()=>resolve(false);img.src='/assets/dev-image-compare/'+a.file})))).every(Boolean))()`),'all twenty-one original-size PNG references load');
 check(await evaluate(`(async()=>{const base='/assets/dev-image-compare/scalp_face_v03/variant2_directions_v04/',m=await (await fetch(base+'asset-manifest.json')).json();return m.compareArt[0].file==='../variant-2-front.png'&&(await fetch(base+m.compareArt[0].file)).ok;})()`),'runtime manifest references existing front without a duplicate');
 async function direction(dir){await evaluate(`(()=>{const s=document.querySelector('select');s.value='${dir}';s.dispatchEvent(new Event('change'));})()`);}
 async function scale(percent){await evaluate(`(()=>{const n=document.querySelector('[type=number]');n.value='${percent}';n.dispatchEvent(new Event('input'));})()`);}
 async function prepareScene(){
  await hit('[data-group=scalp]');await hit('.compare-cards button[data-variant="5"]');await click(210,180);
  await hit('.compare-cards button[data-variant="6"]');await click(330,200);
 }
 async function exercise(scene){
  await prepareScene();
  const pivot=await evaluate(`(()=>{const n=document.querySelector('.compare-actor:nth-child(2)'),r=n.getBoundingClientRect();return {x:r.x+r.width/2,y:r.bottom,world:[n.dataset.x,n.dataset.y]}})()`);
  const other=await evaluate(`document.querySelector('.compare-actor').outerHTML`);
  for(const percent of [50,100,200]){
   await scale(percent);
   for(const dir of ['front','right45','right90','front']){
    await direction(dir);
    const observed=await evaluate(`(()=>{const n=document.querySelector('.compare-actor:nth-child(2)'),r=n.getBoundingClientRect(),img=n.querySelector('img'),ir=img.getBoundingClientRect(),a=catalog.find(a=>a.variant===6&&a.direction==='${dir}');return {x:r.x+r.width/2,y:r.bottom,world:[n.dataset.x,n.dataset.y],percent:n.dataset.percent,ratio:ir.width/ir.height,expectedRatio:a.width/a.height,body:ir.height*a.bodyHeight/a.height,footX:ir.left+ir.width*a.footX/a.width,footY:ir.top+ir.height*a.footY/a.height,src:img.getAttribute('src'),expectedSrc:'/assets/dev-image-compare/'+a.file,other:document.querySelector('.compare-actor').outerHTML}})()`);
    const expectedBody=(scene==='boss'?72*.64:57)*percent/100;
    check(observed.src===observed.expectedSrc&&observed.percent===String(percent)&&JSON.stringify(observed.world)===JSON.stringify(pivot.world)&&Math.abs(observed.x-pivot.x)<.01&&Math.abs(observed.y-pivot.y)<.01&&Math.abs(observed.footX-pivot.x)<.05&&Math.abs(observed.footY-pivot.y)<.05&&Math.abs(observed.body-expectedBody)<.05&&Math.abs(observed.ratio-observed.expectedRatio)<.001&&observed.other===other,`${scene} ${percent}% ${dir} exact image fixed sole uniform ratio and selection isolation`);
   }
  }
  await direction('right90');
  const n=await box('.compare-actor:nth-child(2)');await mouse('mousePressed',n.x,n.y);await mouse('mouseMoved',n.x+20,n.y+20);await mouse('mouseReleased',n.x+20,n.y+20);
  check(await evaluate(`(()=>{const n=document.querySelector('.compare-actor:nth-child(2)');return Number(n.dataset.x)>${pivot.world[0]}&&Number(n.dataset.y)>${pivot.world[1]}&&n.dataset.percent==='200'&&n.querySelector('img').src.includes('variant-2-right-090.png')})()`),`${scene} new side view moves without resetting direction or scale`);
  await hit('.compare-actor:nth-child(1)');
  await evaluate(`window.protectedNew=document.querySelector('.compare-actor').outerHTML`);await direction('right45');
  check(await evaluate(`document.querySelector('select').value==='front'&&document.querySelector('.compare-actor').outerHTML===protectedNew&&[...document.querySelector('select').options].filter(o=>o.value!=='front').every(o=>o.disabled)`),`${scene} new1 rejects missing sides without switching variant`);
  await hit('[data-group=legacy]');await hit('.compare-cards button[data-variant="2"]');await direction('right45');
  check(await evaluate(`[...document.querySelector('select').options].every(o=>!o.disabled)`),`${scene} legacy card restores three supported directions`);
  await hit('.compare-actor:nth-child(2)');
  check(await evaluate(`document.querySelector('[data-group=scalp]').getAttribute('aria-pressed')==='true'&&document.querySelector('select').value==='right90'&&document.querySelector('[type=number]').value==='200'&&[...document.querySelector('select').options].every(o=>!o.disabled)`),`${scene} mixed actor reselect restores new2 group right90 and200%`);
  await snap(`${scene}-three-directions.png`);
 }
 await exercise('defense');
 await hit('[data-action=clear]');
 // Click and drag all three directions, keeping each placed asset separate.
 for(const dir of ['front','right45','right90']){
  await hit('.compare-cards button[data-variant="6"]');await direction(dir);await hit('.compare-cards button[data-variant="6"]');await click(210+['front','right45','right90'].indexOf(dir)*85,170);
  await hit('.compare-cards button[data-variant="6"]');await sleep(100);const card=await box('.compare-cards button[data-variant="6"]');await mouse('mousePressed',card.x,card.y);await mouse('mouseMoved',210+['front','right45','right90'].indexOf(dir)*85,270);await mouse('mouseReleased',210+['front','right45','right90'].indexOf(dir)*85,270);await sleep(520);
 }
 check(await evaluate(`document.querySelectorAll('.compare-actor').length===6&&new Set([...document.querySelectorAll('.compare-actor img')].map(n=>n.src)).size===3`),'new2 front right45 right90 support separate click and card-drag placements');
 for(const v of [7,8]){
  await hit(`.compare-cards button[data-variant="${v}"]`);await click(190+(v-7)*90,110);
  const protectedHTML=await evaluate(`document.querySelector('.compare-actor:last-child').outerHTML`);await direction('right90');
  check(await evaluate(`document.querySelector('.compare-actor:last-child').outerHTML===${JSON.stringify(protectedHTML)}&&document.querySelector('select').value==='front'&&[...document.querySelector('select').options].filter(o=>o.value!=='front').every(o=>o.disabled)`),`new${v-4} retains front-only guard and selected identity`);
 }
 check(await evaluate(`document.querySelector('[data-support]').textContent.includes('신규2안: 정면/45°/90°')&&document.querySelector('[data-support]').textContent.includes('신규1·3·4안: 정면 전용')`),'new group support help matches actual mixed catalog');
 await evaluate(`window.normalizeSave=raw=>JSON.stringify(Object.fromEntries(Object.entries(JSON.parse(raw)).map(([k,v])=>{const d=JSON.parse(v);delete d.savedAt;return [k,d]})));`);
 check(await evaluate(`api.game.gold===before.gold&&JSON.stringify(api.game.units)===before.units&&normalizeSave(JSON.stringify(localStorage))===normalizeSave(before.storage)`),'direction previews leave gold actual roster and saved battle unchanged except normal timestamp');
 await hit('[data-action=delete]');check(await evaluate(`document.querySelectorAll('.compare-actor').length===7`),'delete selected side-test actor only');
 await hit('[data-action=close]');
 check(await evaluate(`document.querySelectorAll('.compare-actor').length===7&&getComputedStyle(document.querySelector('#dev-image-compare-layer')).pointerEvents==='none'`),'closing retains drawings and releases field input');
 await evaluate(`api.select('guard')`);await click(189,105);check(await evaluate(`api.game.units.length===1`),'actual unit summon works after closing direction tool');
 await evaluate(`document.querySelector('#dev-boss-scene').click()`);await sleep(800);await evaluate(`for(const a of document.getAnimations())a.finish();api.refresh()`);
 check(await evaluate(`api.scene==='boss'&&document.querySelectorAll('.compare-actor').length===0&&document.querySelector('#dev-image-compare-panel').hidden`),'boss transition clears preview and panel');
 await evaluate(`document.querySelector('#dev-image-compare').click()`);await exercise('boss');
 await cdp('Emulation.setDeviceMetricsOverride',{width:320,height:640,deviceScaleFactor:1,mobile:false});await sleep(100);
 await hit('.compare-cards button[data-variant="6"]');await direction('right45');
 const b=await box('.compare-cards button[data-variant="6"]');
 check(b.w>=48&&b.h>=48&&b.x-b.w/2>=12&&b.x+b.w/2<=308,'320px new2 side card stays reachable without shrinking touch target');
 check(await evaluate(`[...document.querySelector('select').options].every(o=>!o.disabled)`),'320px new2 side direction options remain enabled');await snap('narrow-320.png');
 await evaluate(`document.querySelector('#dev-defense-scene').click()`);await sleep(800);await evaluate(`for(const a of document.getAnimations())a.finish();api.refresh()`);
 check(await evaluate(`api.scene==='defense'&&document.querySelectorAll('.compare-actor').length===0`),'wave return clears boss direction previews');
 // Bright and dark full original frames, read-only raster assets.
 await evaluate(`document.querySelector('#dev-image-compare').click();document.querySelector('[data-action=close]').click()`);
 await cdp('Emulation.setDeviceMetricsOverride',{width:1200,height:800,deviceScaleFactor:1,mobile:false});
 await evaluate(`window.frameSheet=document.createElement('section');frameSheet.id='frame-sheet';frameSheet.style.cssText='position:fixed;inset:0;z-index:20000;background:#f8f3e7;display:flex;gap:8px;padding:12px';frameSheet.innerHTML=catalog.filter(a=>a.variant===6).map(a=>'<figure style="margin:0;width:360px"><img src="/assets/dev-image-compare/'+a.file+'" style="width:360px;height:700px;object-fit:contain"><figcaption>'+a.direction+' · original canvas</figcaption></figure>').join('');document.body.append(frameSheet)`);
 await sleep(200);await snap('fullframes-light.png');await evaluate(`frameSheet.style.background='#1b242e';frameSheet.style.color='white'`);await snap('fullframes-dark.png');
 report.result='PASS';
}catch(e){report.result='FAIL';report.failure=String(e);try{await snap('failure.png');}catch{}}
finally{await writeFile(path.join(out,'browser-result.json'),JSON.stringify(report,null,2));try{await cdp('Browser.close');}catch{}ws?.close();edge?.kill();server.kill();console.log(JSON.stringify(report,null,2));}

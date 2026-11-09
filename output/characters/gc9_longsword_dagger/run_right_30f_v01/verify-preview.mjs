import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
const directory = path.dirname(fileURLToPath(import.meta.url));
const tempPrefix = path.join(os.tmpdir(), 'grid-defenders-run-review-');
const profile = fs.mkdtempSync(tempPrefix);
const edge = spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { windowsHide: true, stdio: 'ignore' });
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
let socket;
try {
  let port;
  for (let i=0; i<100; i++) {
    const filename = path.join(profile, 'DevToolsActivePort');
    if (fs.existsSync(filename)) { port = fs.readFileSync(filename,'utf8').split('\n')[0]; break; }
    await pause(100);
  }
  if (!port) throw Error('Edge debugging endpoint did not start');
  const tabs = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  socket = new WebSocket(tabs.find(tab => tab.type==='page').webSocketDebuggerUrl);
  await new Promise((resolve,reject) => { socket.onopen=resolve; socket.onerror=reject; });
  let serial=0;
  const pending = new Map();
  socket.onmessage = event => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const {resolve,reject} = pending.get(message.id); pending.delete(message.id);
      if (message.error) reject(Error(JSON.stringify(message.error))); else resolve(message.result);
    }
  };
  function call(method,params={}) {
    const id=++serial;
    return new Promise((resolve,reject) => { pending.set(id,{resolve,reject}); socket.send(JSON.stringify({id,method,params})); });
  }
  async function evaluate(expression) {
    const result = await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});
    if (result.exceptionDetails) throw Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  }
  await call('Page.enable');
  await call('Emulation.setDeviceMetricsOverride',{width:1100,height:900,deviceScaleFactor:1,mobile:false});
  await call('Page.navigate',{url:pathToFileURL(path.join(directory,'preview.html')).href});
  let ready=false;
  for (let i=0;i<100;i++) { ready=await evaluate('document.documentElement.dataset.ready === "true"'); if(ready)break; await pause(100); }
  if(!ready) throw Error('Preview failed to load atlas');
  const report = await evaluate(`(() => {
    const p=window.spritePreview, result={imageReady:true, defaultInfinite:p.looping};
    p.selectFrame(0); document.getElementById('previous').click(); result.previousWraps=p.current===29;
    document.getElementById('next').click(); result.nextWraps=p.current===0;
    result.everyFrameSelectable=true;
    for(let i=0;i<30;i++){ const s=document.getElementById('frame'); s.value=String(i); s.dispatchEvent(new Event('input')); result.everyFrameSelectable &&= p.current===i && !p.playing && document.getElementById('counter').value.startsWith(String(i+1).padStart(2,'0')); }
    p.selectFrame(29); p.setPlaying(true); p.tick(10000); p.tick(10000+1000/30); result.loopWraps=p.current===0 && p.playing;
    p.tick(10000+61000/30); result.multipleLoops=p.current===0 && p.playing;
    document.getElementById('play').click(); result.pauseWorks=!p.playing;
    document.getElementById('play').click(); result.resumeWorks=p.playing;
    document.getElementById('loop').click(); p.selectFrame(0); p.setPlaying(true); p.tick(20000); p.tick(21000);
    result.loopOffStops=!p.looping && !p.playing && p.current===29 && document.getElementById('loop').getAttribute('aria-pressed')==='false';
    document.getElementById('loop').click(); result.loopOnRestarts=p.looping && p.playing;
    document.getElementById('seam').click(); result.seamStarts=p.current===26 && p.looping && p.playing;
    p.tick(30000); p.tick(30000+4000/30); result.seamReachesFirst=p.current===0 && p.playing;
    const speed=document.getElementById('fps'); speed.value='15'; speed.dispatchEvent(new Event('change')); p.selectFrame(0); p.setPlaying(true); p.tick(40000); p.tick(41000); result.speedWorks=p.current===15;
    speed.value='30'; speed.dispatchEvent(new Event('change')); p.setPlaying(false);
    document.querySelector('[data-background=light]').click(); result.lightWorks=document.getElementById('stage').classList.contains('light');
    document.querySelector('[data-background=dark]').click(); result.darkWorks=document.getElementById('stage').classList.contains('dark');
    result.numberedCells=document.querySelectorAll('.order-number').length;
    return result;
  })()`);
  const checks = ['imageReady','defaultInfinite','previousWraps','nextWraps','everyFrameSelectable','loopWraps','multipleLoops','pauseWorks','resumeWorks','loopOffStops','loopOnRestarts','seamStarts','seamReachesFirst','speedWorks','lightWorks','darkWorks'];
  if(checks.some(key=>!report[key]) || report.numberedCells!==30) throw Error(JSON.stringify(report));
  report.zoom=await evaluate(`(()=>{
    const p=window.spritePreview;p.selectFrame(14);const canvas=document.getElementById('sprite');
    p.resetView();document.getElementById('zoom-in').click();const plus=p.view.zoom===1.25;
    document.getElementById('zoom-out').click();const minus=p.view.zoom===1;
    const slider=document.getElementById('zoom');slider.value='3.5';slider.dispatchEvent(new Event('input'));const sliderWorks=p.view.zoom===3.5;
    p.setZoom(20);const upperLimit=p.view.zoom===4 && document.getElementById('zoom-in').disabled;
    p.setZoom(-1);const lowerLimit=p.view.zoom===1 && document.getElementById('zoom-out').disabled;
    document.getElementById('zoom-feet').click();const feet=p.view.zoom===2 && p.view.panY<0;
    const frameUnchanged=p.current===14,canvasResolutionUnchanged=canvas.width===256 && canvas.height===256;
    document.getElementById('next').click();const persistsAcrossFrames=p.current===15 && p.view.zoom===2;
    document.getElementById('zoom-reset').click();const reset=p.view.zoom===1 && p.view.panX===0 && p.view.panY===0;
    p.setZoom(2);const r=document.getElementById('stage').getBoundingClientRect();
    return {plus,minus,sliderWorks,upperLimit,lowerLimit,feet,frameUnchanged,canvasResolutionUnchanged,persistsAcrossFrames,reset,stage:{x:r.x,y:r.y,width:r.width,height:r.height}};
  })()`);
  const zr=report.zoom.stage,mouseX=zr.x+zr.width/2,mouseY=zr.y+zr.height/2;
  await call('Input.dispatchMouseEvent',{type:'mousePressed',x:mouseX,y:mouseY,button:'left',buttons:1,clickCount:1});
  await call('Input.dispatchMouseEvent',{type:'mouseMoved',x:mouseX+60,y:mouseY-40,button:'left',buttons:1});
  await call('Input.dispatchMouseEvent',{type:'mouseReleased',x:mouseX+60,y:mouseY-40,button:'left',buttons:0,clickCount:1});
  const dragged=await evaluate('window.spritePreview.view');
  report.zoom.mouseDrag=dragged.panX>0 && dragged.panY<0 && dragged.pointers===0;
  await call('Input.dispatchMouseEvent',{type:'mouseWheel',x:mouseX,y:mouseY,deltaX:0,deltaY:-100});
  await pause(60);
  report.zoom.wheel=await evaluate('window.spritePreview.view.zoom>2');
  await evaluate('window.spritePreview.focusFeet();window.spritePreview.selectFrame(14)');
  const zoomShot=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
  fs.writeFileSync(path.join(directory,'preview-zoom-feet.png'),Buffer.from(zoomShot.data,'base64'));
  if(Object.entries(report.zoom).some(([key,value])=>key!=='stage' && value!==true)) throw Error(JSON.stringify(report.zoom));
  await evaluate('window.spritePreview.resetView()');
  const atlasData = 'data:image/png;base64,'+fs.readFileSync(path.join(directory,'run-right-30f.png')).toString('base64');
  await evaluate(`(async()=>{ const im=new Image(); im.src=${JSON.stringify(atlasData)}; await im.decode(); window.previewSource=im; })()`);
  const previewTemplate=fs.readFileSync(path.join(directory,'preview.html'),'utf8');
  function makeInline(webp,cell){
    let inline=previewTemplate.replaceAll('run-right-30f.png',webp).replace(/      <div class="buttons downloads">.*?<\/div>\r?\n/,'').replace('width: min(100%, 512px)','width: min(100%, 400px)');
    inline=inline.replace(/(<img class="atlas" src=")[^"]+(" alt=)/,'$1$2').replace('image.onload = () => { ready = true;','image.onload = () => { document.querySelector(\'.atlas\').src = image.src; ready = true;');
    inline=inline.replace('const CELL = 256,',`const CELL = ${cell},`);
    if(cell<256)inline=inline.replace('100–400% · 휠 / 두 손가락으로 확대 · 드래그로 이동',`휠 / 두 손가락으로 확대 · 드래그로 이동 · 채팅용 ${cell}px 압축 표시, 로컬 미리보기는 256px 원본`);
    return inline;
  }
  let webp,inline,quality,previewCell;
  compression: for(const cell of [256,192,160,128]){
    await evaluate(`(()=>{const c=document.createElement('canvas');c.width=${cell*6};c.height=${cell*5};const ctx=c.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.drawImage(window.previewSource,0,0,c.width,c.height);window.previewExport=c;})()`);
    for(const candidate of [.9,.8,.7,.6,.5]){
      webp=await evaluate(`window.previewExport.toDataURL('image/webp',${candidate})`);inline=makeInline(webp,cell);quality=candidate;previewCell=cell;
      if(Buffer.byteLength(inline)<500000)break compression;
    }
  }
  if(Buffer.byteLength(inline)>=500000)throw Error('Inline atlas exceeds size limit');
  fs.writeFileSync(path.join(directory,'preview-atlas-zoom.webp'),Buffer.from(webp.split(',')[1],'base64'));
  for(const [background,frame] of [['light',0],['dark',18]]) {
    await evaluate(`document.querySelector('[data-background=${background}]').click();window.spritePreview.selectFrame(${frame});`);
    const shot=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
    fs.writeFileSync(path.join(directory,`preview-browser-${background}.png`),Buffer.from(shot.data,'base64'));
  }
  await call('Emulation.setDeviceMetricsOverride',{width:390,height:900,deviceScaleFactor:1,mobile:true});
  await call('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:2});
  await evaluate('window.scrollTo(0,0);window.spritePreview.resetView()');
  const touchRect=await evaluate('(()=>{const r=document.getElementById("stage").getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()');
  await call('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,x:touchRect.x-35,y:touchRect.y},{id:2,x:touchRect.x+35,y:touchRect.y}]});
  await call('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{id:1,x:touchRect.x-70,y:touchRect.y},{id:2,x:touchRect.x+70,y:touchRect.y}]});
  await call('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  const pinched=await evaluate('window.spritePreview.view');
  report.zoom.touchPinch=pinched.zoom>1.8 && pinched.zoom<2.2 && pinched.pointers===0;
  await call('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,x:touchRect.x,y:touchRect.y}]});
  await call('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{id:1,x:touchRect.x-30,y:touchRect.y+25}]});
  await call('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  const touchDragged=await evaluate('window.spritePreview.view');
  report.zoom.touchDrag=touchDragged.panX<pinched.panX && touchDragged.panY>pinched.panY && touchDragged.pointers===0;
  report.zoom.sheetScrollable=await evaluate(`(()=>{document.querySelector('details').open=true;const s=document.getElementById('sheet-zoom');s.value='4';s.dispatchEvent(new Event('change'));const v=document.querySelector('.sheet-viewport');return v.scrollWidth>v.clientWidth*3.5 && document.documentElement.scrollWidth<=innerWidth;})()`);
  report.mobile390=await evaluate(`({noHorizontalOverflow:document.documentElement.scrollWidth<=innerWidth,controlMinHeight:Math.min(...Array.from(document.querySelectorAll('button,select,input')).map(e=>e.getBoundingClientRect().height))})`);
  if(!report.zoom.touchPinch || !report.zoom.touchDrag || !report.zoom.sheetScrollable)throw Error(JSON.stringify(report.zoom));
  await evaluate('window.spritePreview.resetView();document.querySelector("details").open=false');
  await call('Emulation.setDeviceMetricsOverride',{width:320,height:900,deviceScaleFactor:1,mobile:true});
  report.mobile320=await evaluate(`({noHorizontalOverflow:document.documentElement.scrollWidth<=innerWidth,controlMinHeight:Math.min(...Array.from(document.querySelectorAll('button,select,input')).filter(e=>e.getClientRects().length).map(e=>e.getBoundingClientRect().height))})`);
  if(!report.mobile320.noHorizontalOverflow || report.mobile320.controlMinHeight<48)throw Error(JSON.stringify(report.mobile320));
  await call('Emulation.setDeviceMetricsOverride',{width:390,height:900,deviceScaleFactor:1,mobile:true});
  const animated=fs.readFileSync(path.join(directory,'run-right-animated.png')).toString('base64');
  report.apng=await evaluate(`(async()=>{
    const bytes=Uint8Array.from(atob(${JSON.stringify(animated)}),c=>c.charCodeAt(0));const decoder=new ImageDecoder({data:bytes,type:'image/png',preferAnimation:true});await decoder.tracks.ready;await decoder.completed;
    const t=decoder.tracks.selectedTrack,r={frameCount:t.frameCount,animated:t.animated,repetitionCount:String(t.repetitionCount),decodedFrames:0,durationMs:0,allFrames256:true};
    for(let i=0;i<t.frameCount;i++){const f=(await decoder.decode({frameIndex:i,completeFramesOnly:true})).image;r.decodedFrames++;r.durationMs+=f.duration/1000;r.allFrames256 &&= f.displayWidth===256 && f.displayHeight===256;f.close();}decoder.close();return r;
  })()`);
  if(!report.mobile390.noHorizontalOverflow || report.mobile390.controlMinHeight<48 || report.apng.decodedFrames!==30 || !report.apng.allFrames256 || report.apng.durationMs!==1000 || report.apng.repetitionCount!=='Infinity') throw Error(JSON.stringify(report));
  const scratch=process.env.ORCA_CHAT_SCRATCH_DIR;
  if(scratch){
    report.inline={file:'blond-run-right-30f-zoom-v02.html',bytes:Buffer.byteLength(inline),atlasWidth:previewCell*6,atlasHeight:previewCell*5,cellSize:previewCell,webpQuality:quality};
    if(report.inline.bytes>=512*1024) throw Error('Inline preview exceeds size limit');
    fs.writeFileSync(path.join(scratch,report.inline.file),inline);
    await call('Page.navigate',{url:pathToFileURL(path.join(scratch,report.inline.file)).href});
    let inlineReady=false;
    for(let i=0;i<100;i++){inlineReady=await evaluate('document.documentElement.dataset.ready === "true"');if(inlineReady)break;await pause(50);}
    report.inline.ready=inlineReady;
    if(!inlineReady)throw Error('Inline atlas failed to load');
    report.inline.zoomWorks=await evaluate('(()=>{document.getElementById("zoom-feet").click();return window.spritePreview.view.zoom===2 && document.getElementById("sprite").getBoundingClientRect().width>document.getElementById("stage").getBoundingClientRect().width*1.9;})()');
    if(!report.inline.zoomWorks)throw Error('Inline zoom failed');
  }
  await call('Emulation.setDeviceMetricsOverride',{width:1536,height:1344,deviceScaleFactor:1,mobile:false});
  await call('Page.navigate',{url:pathToFileURL(path.join(directory,'order.html')).href});
  let orderReady=false;
  for(let i=0;i<100;i++){orderReady=await evaluate('document.querySelector("img")?.complete && document.querySelector("img")?.naturalWidth===1536 && document.querySelectorAll(".number").length===30');if(orderReady)break;await pause(50);}
  if(!orderReady)throw Error('Numbered sheet failed to load');
  await evaluate('document.fonts.ready');
  const numbered=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
  fs.writeFileSync(path.join(directory,'run-right-30f-numbered.png'),Buffer.from(numbered.data,'base64'));
  await call('Emulation.setDeviceMetricsOverride',{width:1024,height:950,deviceScaleFactor:1,mobile:false});
  await call('Page.navigate',{url:pathToFileURL(path.join(directory,'motion-review.html')).href});
  let reviewReady=false;
  for(let i=0;i<100;i++){reviewReady=await evaluate('document.documentElement.dataset.ready === "true"');if(reviewReady)break;await pause(50);}
  if(!reviewReady)throw Error('Motion comparison failed to load');
  const motionShot=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
  fs.writeFileSync(path.join(directory,'motion-review.png'),Buffer.from(motionShot.data,'base64'));
  report.sourceSheetSha256=createHash('sha256').update(fs.readFileSync(path.join(directory,'run-right-30f.png'))).digest('hex');
  fs.writeFileSync(path.join(directory,'browser-verification.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report));
  await call('Browser.close');
} finally {
  socket?.close();if(edge.exitCode===null)edge.kill();await pause(600);
  if(path.resolve(profile).startsWith(path.resolve(tempPrefix)) && path.dirname(profile)===path.dirname(tempPrefix)){
    try{fs.rmSync(profile,{recursive:true,force:true,maxRetries:3,retryDelay:200});}catch{}
  }
}

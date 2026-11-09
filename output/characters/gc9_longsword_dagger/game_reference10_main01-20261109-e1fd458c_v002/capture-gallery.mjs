import {spawn} from 'node:child_process';
import {writeFileSync} from 'node:fs';
import {fileURLToPath,pathToFileURL} from 'node:url';
import path from 'node:path';
const dir=path.dirname(fileURLToPath(import.meta.url)),pilot=process.argv.includes('--pilot'),port=9274;
const proc=spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',['--headless','--disable-gpu','--no-first-run','--no-default-browser-check','--remote-debugging-port='+port,'--user-data-dir='+dir+'/.qa-browser-profile','--hide-scrollbars',pathToFileURL(path.join(dir,'index.html')).href],{windowsHide:true,stdio:'ignore'});
let targets;for(let i=0;i<100;i++){try{targets=await(await fetch('http://127.0.0.1:'+port+'/json/list')).json();if(targets.some(x=>x.type==='page'))break}catch{}await new Promise(r=>setTimeout(r,100))}
const target=targets.find(x=>x.type==='page'&&x.url.includes('index.html')),socket=new WebSocket(target.webSocketDebuggerUrl);await new Promise(r=>socket.addEventListener('open',r,{once:true}));
let id=0;const pending=new Map();socket.addEventListener('message',({data})=>{const m=JSON.parse(data);if(pending.has(m.id)){pending.get(m.id)(m);pending.delete(m.id)}});
async function send(method,params={}){const key=++id,p=new Promise(r=>pending.set(key,r));socket.send(JSON.stringify({id:key,method,params}));const r=await p;if(r.error)throw Error(JSON.stringify(r.error));return r.result}
async function js(expression){const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value}
await send('Page.enable');const evidence=[];
const cases=pilot?[['pilot-light.png','?capture=1&pilot=1',2400,590,false,false,false],['pilot-dark.png','?capture=1&pilot=1',2400,590,true,false,false]]:[['comparison-overview.png','?capture=1',2500,1120,false,false,false],['comparison-1.png','?capture=1&group=1',2500,600,false,false,false],['comparison-2.png','?capture=1&group=2',2500,600,false,false,false],['qa-dark-overview.png','?capture=1',2500,1120,true,false,false],['qa-unlabeled.png','?capture=1',2500,1120,false,true,false],['qa-small-light.png','?capture=1',2200,650,false,false,true],['qa-small-dark.png','?capture=1',2200,650,true,false,true]];
for(const [file,query,width,height,dark,hide,small]of cases){await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});await send('Page.navigate',{url:pathToFileURL(path.join(dir,'index.html')).href+query});for(let i=0;i<100;i++){try{if(await js('document.readyState==="complete"&&typeof window.setSmall==="function"'))break}catch{}await new Promise(r=>setTimeout(r,100))}await js('Promise.all([...document.images].map(i=>i.decode().catch(()=>{})))');await js('document.body.classList.toggle("dark",'+dark+');document.body.classList.toggle("nolabel",'+hide+');window.setSmall('+small+');new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');const frame=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});writeFileSync(path.join(dir,file),Buffer.from(frame.data,'base64'));evidence.push({file,dark,hideLabels:hide,small,loaded:await js('[...document.images].map(i=>({file:i.getAttribute("src"),width:i.naturalWidth,height:i.naturalHeight}))'),displayBodyHeights:await js('[...document.querySelectorAll(".stage")].map(m=>+m.dataset.displayBodyHeight)')});}
const interactions=[];
if(!pilot){
 await send('Emulation.setDeviceMetricsOverride',{width:1400,height:1100,deviceScaleFactor:1,mobile:false});
 await send('Page.navigate',{url:pathToFileURL(path.join(dir,'index.html')).href});
 for(let i=0;i<100;i++){try{if(await js('document.readyState==="complete"&&typeof window.setMode==="function"'))break}catch{}await new Promise(r=>setTimeout(r,100))}
 await js('Promise.all([...document.images].map(i=>i.decode().catch(()=>{})))');
 await js('setMode("sources");new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');
 let frame=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});writeFileSync(path.join(dir,'qa-source-cards.png'),Buffer.from(frame.data,'base64'));
 interactions.push({test:'source mode',visibleReferenceCount:await js('[...document.querySelectorAll(".reference")].filter(e=>getComputedStyle(e).display!=="none").length')});
 await js('zoom(DATA[0].file,DATA[0].label);document.getElementById("zoomimage").decode()');
 frame=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});writeFileSync(path.join(dir,'qa-individual-zoom.png'),Buffer.from(frame.data,'base64'));
 interactions.push({test:'individual zoom',value:await js('({open:document.getElementById("zoom").open,nativeWidth:document.getElementById("zoomimage").naturalWidth,rawLink:document.getElementById("rawlink").getAttribute("href")})')});
 await js('document.getElementById("zoom").close();setMode("art")');
 await send('Emulation.setDeviceMetricsOverride',{width:480,height:900,deviceScaleFactor:1,mobile:false});
 await js('register();new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');
 frame=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});writeFileSync(path.join(dir,'qa-narrow-gallery.png'),Buffer.from(frame.data,'base64'));
 interactions.push({test:'narrow viewport rendered art bounds',value:await js('[...document.querySelectorAll("#grid .stage")].map(el=>{const a=DATA.find(a=>a.id===el.dataset.id),img=el.querySelector("img"),s=parseFloat(img.style.width)/a.width,l=parseFloat(img.style.left),t=parseFloat(img.style.top);return {id:a.id,displayBodyHeight:+el.dataset.displayBodyHeight,left:l+a.boundsAlpha32[0]*s,right:l+a.boundsAlpha32[2]*s,top:t+a.hairTop*s,sole:t+a.sole*s,stageWidth:el.clientWidth,stageHeight:el.clientHeight}})')});
}
writeFileSync(path.join(dir,pilot?'pilot-browser-evidence.json':'browser-evidence.json'),JSON.stringify({isolatedHeadless:true,userUiTouched:false,cases:evidence,interactions},null,2));console.log(JSON.stringify({captures:evidence.length,loaded:evidence.map(x=>x.loaded.length),interactions:interactions.length}));await send('Browser.close');socket.close();

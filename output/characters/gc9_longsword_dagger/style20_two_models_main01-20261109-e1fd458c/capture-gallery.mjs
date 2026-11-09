import {spawn} from 'node:child_process';
import {writeFileSync} from 'node:fs';
import {fileURLToPath,pathToFileURL} from 'node:url';
import path from 'node:path';
const dir=path.dirname(fileURLToPath(import.meta.url));
const pilot=process.argv.includes('--pilot');
spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',['--headless','--disable-gpu','--no-first-run','--no-default-browser-check','--remote-debugging-port=9271','--user-data-dir='+dir+'/.qa-browser-profile','--hide-scrollbars',pathToFileURL(path.join(dir,'index.html')).href],{windowsHide:true,stdio:'ignore'});
let targets;for(let i=0;i<60;i++){try{targets=await(await fetch('http://127.0.0.1:9271/json/list')).json();if(targets.some(x=>x.type==='page'))break}catch{}await new Promise(r=>setTimeout(r,100))}
const target=targets.find(x=>x.type==='page'&&x.url.includes('index.html'));
const socket=new WebSocket(target.webSocketDebuggerUrl);await new Promise(r=>socket.addEventListener('open',r,{once:true}));
let id=0;const pending=new Map();socket.addEventListener('message',({data})=>{const m=JSON.parse(data);if(pending.has(m.id)){pending.get(m.id)(m);pending.delete(m.id)}});
async function send(method,params={}){const key=++id,p=new Promise(r=>pending.set(key,r));socket.send(JSON.stringify({id:key,method,params}));const r=await p;if(r.error)throw Error(JSON.stringify(r.error));return r.result}
async function js(expression){const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value}
await send('Page.enable');const evidence=[];
const cases=pilot?[['pilot-light.png','?capture=1&pilot=1',4000,570,false,false,false],['pilot-dark.png','?capture=1&pilot=1',4000,570,true,false,false]]:[
['comparison-overview.png','?capture=1',3000,1500,false,false,false],
['qa-unlabeled.png','?capture=1',3000,1500,false,true,false],
['qa-dark-overview.png','?capture=1',3000,1500,true,false,false],
...Array.from({length:4},(_,i)=>['comparison-'+(i+1)+'.png','?capture=1&group='+(i+1),4000,590,false,false,false]),
['qa-small.png','?capture=1',3000,850,false,false,true]];
for(const [file,query,width,height,dark,hide,small] of cases){
 await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
 await send('Page.navigate',{url:pathToFileURL(path.join(dir,'index.html')).href+query});
 for(let i=0;i<100;i++){try{if(await js('document.readyState==="complete"&&typeof window.setSmall==="function"'))break}catch{}await new Promise(r=>setTimeout(r,100))}
 await js('Promise.all([...document.images].map(i=>i.decode().catch(()=>{})))');
 await js('document.body.classList.toggle("dark",'+dark+');document.body.classList.toggle("nolabel",'+hide+');window.setSmall('+small+');new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');
 const frame=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});writeFileSync(path.join(dir,file),Buffer.from(frame.data,'base64'));
 evidence.push({file,dark,hideLabels:hide,small,loaded:await js('[...document.images].map(i=>({file:i.getAttribute("src"),width:i.naturalWidth,height:i.naturalHeight}))'),displayBodyHeights:await js('[...document.querySelectorAll(".model")].map(m=>+m.dataset.displayBodyHeight)')});
}
writeFileSync(path.join(dir,pilot?'pilot-browser-evidence.json':'browser-evidence.json'),JSON.stringify({isolatedHeadless:true,userUiTouched:false,cases:evidence},null,2));
console.log(JSON.stringify({captures:evidence.length,loaded:evidence.map(x=>x.loaded.length)}));await send('Browser.close');socket.close();

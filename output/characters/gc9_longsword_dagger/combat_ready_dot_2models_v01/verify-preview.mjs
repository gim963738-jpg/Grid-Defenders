import {spawn} from 'node:child_process';
import {writeFileSync} from 'node:fs';
import {fileURLToPath,pathToFileURL} from 'node:url';
import path from 'node:path';
const dir=path.dirname(fileURLToPath(import.meta.url));
spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',['--headless','--disable-gpu','--no-first-run','--no-default-browser-check','--remote-debugging-port=9261',`--user-data-dir=${dir}/.qa-browser-profile`,'--hide-scrollbars',pathToFileURL(path.join(dir,'index.html')).href],{windowsHide:true,stdio:'ignore'});
let targets;for(let i=0;i<50;i++){try{targets=await(await fetch('http://127.0.0.1:9261/json/list')).json();if(targets.length)break}catch{}await new Promise(r=>setTimeout(r,100))}
const target=targets.find(x=>x.type==='page'&&x.url.includes('index.html'));
const socket=new WebSocket(target.webSocketDebuggerUrl);await new Promise(r=>socket.addEventListener('open',r,{once:true}));
let id=0;const pending=new Map();socket.addEventListener('message',({data})=>{const m=JSON.parse(data);if(pending.has(m.id)){pending.get(m.id)(m);pending.delete(m.id)}});
async function send(method,params={}){const key=++id,p=new Promise(r=>pending.set(key,r));socket.send(JSON.stringify({id:key,method,params}));const r=await p;if(r.error)throw Error(JSON.stringify(r.error));return r.result}
async function js(expression){const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value}
await send('Page.enable');await send('Emulation.setDeviceMetricsOverride',{width:1700,height:850,deviceScaleFactor:1,mobile:false});
await js(`Promise.all([...document.images].map(i=>i.complete?Promise.resolve():new Promise(r=>i.onload=r)))`);
for(const [file,dark] of [['comparison.png',false],['qa-dark.png',true]]){
 await js(`document.body.classList.toggle('dark',${dark});new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))`);
 const r=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});writeFileSync(path.join(dir,file),Buffer.from(r.data,'base64'));
}
const evidence=await js(`({loaded:[...document.images].map(i=>({file:i.getAttribute('src'),width:i.naturalWidth,height:i.naturalHeight,display:i.getBoundingClientRect().toJSON()})),width:innerWidth,documentWidth:document.documentElement.scrollWidth})`);
writeFileSync(path.join(dir,'browser-evidence.json'),JSON.stringify({...evidence,isolatedHeadless:true,userAppUiTouched:false},null,2));
console.log(JSON.stringify(evidence));await send('Browser.close');socket.close();



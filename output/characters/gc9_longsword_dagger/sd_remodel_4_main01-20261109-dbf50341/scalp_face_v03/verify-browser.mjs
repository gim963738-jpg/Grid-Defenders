import {spawn} from 'node:child_process';
import {writeFileSync} from 'node:fs';
import {fileURLToPath,pathToFileURL} from 'node:url';
import path from 'node:path';
const dir=path.dirname(fileURLToPath(import.meta.url));
const browser=spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',['--headless','--disable-gpu','--no-first-run','--no-default-browser-check','--remote-debugging-port=9251',`--user-data-dir=${dir}/.qa-browser-profile`,'--hide-scrollbars',pathToFileURL(path.join(dir,'index.html')).href],{windowsHide:true,stdio:'ignore'});
let targets;for(let i=0;i<50;i++){try{targets=await(await fetch('http://127.0.0.1:9251/json/list')).json();if(targets.length)break}catch{}await new Promise(r=>setTimeout(r,100))}
const target=targets.find(x=>x.type==='page'&&x.url.includes('index.html'));
const socket=new WebSocket(target.webSocketDebuggerUrl);await new Promise(r=>socket.addEventListener('open',r,{once:true}));
let id=0;const pending=new Map();socket.addEventListener('message',({data})=>{const m=JSON.parse(data);if(pending.has(m.id)){pending.get(m.id)(m);pending.delete(m.id)}});
async function send(method,params={}){const key=++id;const p=new Promise(r=>pending.set(key,r));socket.send(JSON.stringify({id:key,method,params}));const r=await p;if(r.error)throw Error(JSON.stringify(r.error));return r.result}
async function js(expression){const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value}
await send('Page.enable');await js(`Promise.all([...document.images].map(i=>i.complete?Promise.resolve():new Promise(r=>i.onload=r)))`);
const evidence={url:target.url,isolatedHeadless:true,appUiTouched:false};
async function size(w,h){await send('Emulation.setDeviceMetricsOverride',{width:w,height:h,deviceScaleFactor:1,mobile:false});await js('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))')}
async function shot(name){const r=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});writeFileSync(path.join(dir,name),Buffer.from(r.data,'base64'))}
await size(2500,1600);await js("document.body.className='capture';fit()");await shot('comparison.png');
evidence.wide=await js(`({width:innerWidth,columns:document.querySelectorAll('article').length,loaded:[...document.querySelectorAll('.stage img')].every(i=>i.naturalWidth>0),board:document.querySelector('.board').getBoundingClientRect().toJSON()})`);
const gameRect=await js("(()=>{const r=document.querySelector('.games').getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,scale:1}})()");
const gameShot=await send('Page.captureScreenshot',{format:'png',clip:gameRect,captureBeyondViewport:true});writeFileSync(path.join(dir,'qa-small.png'),Buffer.from(gameShot.data,'base64'));
evidence.smallDisplays=await js("[...document.querySelectorAll('.tiny img')].map(i=>({file:i.getAttribute('src'),requestedBodyHeight:Number(i.dataset.displayHeight),renderedWidth:i.getBoundingClientRect().width,naturalWidth:i.naturalWidth}))");
await js("document.body.className='capture dark'");await shot('qa-dark.png');
await js("document.body.className=''");await size(420,900);await shot('qa-narrow.png');
evidence.narrow=await js(`({width:innerWidth,documentWidth:document.documentElement.scrollWidth,boardRight:document.querySelector('.board').getBoundingClientRect().right,viewportRight:document.querySelector('.viewport').getBoundingClientRect().right,labels:document.querySelector('.mobile-labels').textContent})`);
evidence.expansion=await js(`(()=>{document.querySelectorAll('.stage')[3].click();return {dialogOpen:document.querySelector('dialog').open,source:document.querySelector('#large').getAttribute('src'),caption:document.querySelector('#caption').textContent}})()`);
await js("new Promise(r=>{const im=document.querySelector('#large');if(im.complete)r();else im.onload=r})");await shot('qa-expanded.png');await js("document.querySelector('dialog').close()");
writeFileSync(path.join(dir,'browser-evidence.json'),JSON.stringify(evidence,null,2));
console.log(JSON.stringify(evidence,null,2));
await send('Browser.close');socket.close();


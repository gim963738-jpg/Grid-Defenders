import {spawn} from 'node:child_process';
import {writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const here=path.dirname(fileURLToPath(import.meta.url));
const port=9438;
const child=spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',[
 '--headless','--disable-gpu','--no-first-run','--no-default-browser-check',
 '--disable-background-timer-throttling','--disable-renderer-backgrounding',
 '--remote-debugging-port='+port,'--user-data-dir='+path.join(here,'.review-browser-profile'),
 'http://127.0.0.1:5173/dev-previews/blond-arm-rig3-b-v001/index.html?capture=1'
],{windowsHide:true,stdio:'ignore'});
let ws;
try {
 let tab;
 for(let i=0;i<100;i++){
  try {tab=(await(await fetch('http://127.0.0.1:'+port+'/json/list')).json()).find(t=>t.type==='page');if(tab)break;}catch{}
  await new Promise(r=>setTimeout(r,100));
 }
 if(!tab)throw Error('Headless review page unavailable');
 ws=new WebSocket(tab.webSocketDebuggerUrl);
 await new Promise(r=>ws.addEventListener('open',r,{once:true}));
 let id=0;const pending=new Map();
 ws.addEventListener('message',({data})=>{const m=JSON.parse(data);if(pending.has(m.id)){pending.get(m.id)(m);pending.delete(m.id)}});
 async function send(method,params={}){const n=++id,p=new Promise(r=>pending.set(n,r));ws.send(JSON.stringify({id:n,method,params}));const m=await p;if(m.error)throw Error(JSON.stringify(m.error));return m.result;}
 async function js(expression){const m=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(m.exceptionDetails)throw Error(JSON.stringify(m.exceptionDetails));return m.result.value;}
 await send('Emulation.setDeviceMetricsOverride',{width:1800,height:1000,deviceScaleFactor:1,mobile:false});
 let ready=false;for(let i=0;i<100;i++){if(await js('window.ready===true')){ready=true;break;}await new Promise(r=>setTimeout(r,100));}
 if(!ready)throw Error('Player did not become ready');
 await js('window.setState(0,{mode:"rig",bg:"light",bones:false});document.getElementById("play").click()');
 const before=await js('window.snapshot()');
 await new Promise(r=>setTimeout(r,400));
 const moving=await js('window.snapshot()');
 await js('document.getElementById("play").click()');
 const paused=await js('window.snapshot()');
 await new Promise(r=>setTimeout(r,100));
 const still=await js('window.snapshot()');
 await js('document.getElementById("scrub").value=688;document.getElementById("scrub").dispatchEvent(new Event("input"))');
 const scrub=await js('window.snapshot()');
 const evidence={url:tab.url,ready,loaded:moving.loaded,playAdvances:before.ms!==moving.ms,
  pauseHolds:paused.ms===still.ms,scrubWorks:scrub.ms===688,
  threeDifferentPoses:scrub.cards.length===6 && new Set(scrub.cards.map(p=>JSON.stringify(p.angles))).size===3 && scrub.cards.slice(0,3).every((a,i)=>JSON.stringify(a.angles)===JSON.stringify(scrub.cards[i+3].angles)),
  before,moving,paused,scrub,userScreenChanged:false};
 if(!evidence.playAdvances||!evidence.pauseHolds||!evidence.scrubWorks||!evidence.threeDifferentPoses)throw Error('Playback check failed: '+JSON.stringify(evidence));
 writeFileSync(path.join(here,'배포재생검사.json'),JSON.stringify(evidence,null,2));
 const screenshot=await send('Page.captureScreenshot',{format:'png'});
 writeFileSync(path.join(here,'배포재생688ms.png'),Buffer.from(screenshot.data,'base64'));
 console.log(JSON.stringify({ready,playAdvances:true,pauseHolds:true,scrubWorks:true,threeDifferentPoses:true,loaded:moving.loaded}));
 await send('Browser.close');
} finally {if(ws)ws.close();child.kill();}

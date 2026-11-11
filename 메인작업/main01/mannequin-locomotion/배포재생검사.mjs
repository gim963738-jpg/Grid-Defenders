import {spawn} from 'node:child_process';
import {writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const here=path.dirname(fileURLToPath(import.meta.url)),port=9440;
const child=spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',[
 '--headless','--disable-gpu','--no-first-run','--no-default-browser-check',
 '--disable-background-timer-throttling','--disable-renderer-backgrounding',
 '--remote-debugging-port='+port,'--user-data-dir='+path.join(here,'.review-browser-profile'),
 'http://127.0.0.1:5173/dev-previews/mannequin-locomotion-v001/index.html'
],{windowsHide:true,stdio:'ignore'});
let ws;
try{
 let tab;for(let i=0;i<100;i++){try{tab=(await(await fetch('http://127.0.0.1:'+port+'/json/list')).json()).find(t=>t.type==='page');if(tab)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 if(!tab)throw Error('Headless page unavailable');ws=new WebSocket(tab.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));
 let id=0;const pending=new Map();ws.addEventListener('message',({data})=>{const m=JSON.parse(data);if(pending.has(m.id)){pending.get(m.id)(m);pending.delete(m.id)}});
 async function send(method,params={}){const n=++id,p=new Promise(r=>pending.set(n,r));ws.send(JSON.stringify({id:n,method,params}));const m=await p;if(m.error)throw Error(JSON.stringify(m.error));return m.result;}
 async function js(expression){const m=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(m.exceptionDetails)throw Error(JSON.stringify(m.exceptionDetails));return m.result.value;}
 await send('Emulation.setDeviceMetricsOverride',{width:1500,height:1900,deviceScaleFactor:1,mobile:false});
 let ready=false;for(let i=0;i<100;i++){if(await js('window.ready===true')){ready=true;break;}await new Promise(r=>setTimeout(r,100));}if(!ready)throw Error('Player not ready');
 await js('setState(0,{mode:"Auto"});document.getElementById("play").click()');const before=await js('snapshot()');await new Promise(r=>setTimeout(r,400));const moving=await js('snapshot()');
 await js('document.getElementById("play").click()');const paused=await js('snapshot()');await new Promise(r=>setTimeout(r,100));const still=await js('snapshot()');
 await js('document.getElementById("scrub").value=4;document.getElementById("scrub").dispatchEvent(new Event("input"))');const scrub=await js('snapshot()');
 await js('document.getElementById("stopNow").click()');const stop=await js('snapshot()');
 const modes=[];for(const mode of ['Idle','Start','StartRun','Walk','Run','Stop']){await js('document.getElementById("mode").value='+JSON.stringify(mode)+';document.getElementById("mode").dispatchEvent(new Event("change"));setState(0.4)');modes.push(await js('snapshot()'));}
 await js('document.getElementById("restart").click()');const restarted=await js('snapshot()');
 const evidence={ready,playAdvances:moving.time>before.time,pauseHolds:paused.time===still.time,scrubWorks:Math.abs(scrub.time-4)<.02,stopWorks:Math.abs(stop.stopAt-4)<.02,restartWorks:restarted.time===0,twoBodies:await js('document.querySelectorAll(".card").length===2 && window.mannequin.bodies.bodies.length===2'),allModesWork:modes.every((m,i)=>m.mode===['Idle','Start','StartRun','Walk','Run','Stop'][i]&&m.states.length===2),modes,userScreenChanged:false};
 if(['playAdvances','pauseHolds','scrubWorks','stopWorks','restartWorks','twoBodies','allModesWork'].some(k=>!evidence[k]))throw Error(JSON.stringify(evidence));
 await js('setState(0.4,{mode:"Run",bones:true})');const shot=await send('Page.captureScreenshot',{format:'png'});writeFileSync(path.join(here,'배포재생확인.png'),Buffer.from(shot.data,'base64'));
 writeFileSync(path.join(here,'배포재생검사.json'),JSON.stringify(evidence,null,2));console.log(JSON.stringify({...evidence,modes:modes.map(m=>m.mode)}));await send('Browser.close');
}finally{if(ws)ws.close();child.kill();}

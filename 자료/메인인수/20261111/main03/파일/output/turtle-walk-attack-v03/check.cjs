const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const elements=new Map(),draws=[];
const ctx={clearRect(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},drawImage(...args){draws.push(args);}};
function el(id){if(!elements.has(id))elements.set(id,{value:id==='speed'?'1':id==='bg'?'forest':id==='attackScale'?'90':'0',checked:false,disabled:true,getContext:()=>ctx});return elements.get(id);}
let scheduled;
const scope={window:{},console,URLSearchParams,location:{search:''},document:{getElementById:el,querySelectorAll:()=>[],addEventListener(){},body:{classList:{toggle(){}}}},Image:class{set src(value){const b=fs.readFileSync(path.join(__dirname,value));assert.equal(b.subarray(1,4).toString(),'PNG');this.naturalWidth=b.readUInt32BE(16);this.naturalHeight=b.readUInt32BE(20);this.onload();}},requestAnimationFrame:fn=>scheduled=fn};
vm.createContext(scope);for(const file of ['data.js','sequence.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,file),'utf8'),scope);
setImmediate(()=>{
 const api=scope.window.sequenceReview;assert.ok(api);assert.equal(api.total,14400);assert.equal(api.state().images,4);
 const checks=[[0,'walk',0],[2399,'walk',11],[2400,'single1',0],[2970,'single1',6],[3700,'rest1',0],[6099,'rest1',11],[6100,'single2',0],[7400,'rest2',0],[9800,'double',0],[11005,'double',10],[12000,'rest3',0],[14400,'rest3',11]];
 const samples=checks.map(([t,phase,frame])=>{const s=api.seek(t);assert.equal(s.phase,phase);assert.equal(s.frame,frame);return {ms:t,phase:s.phase,action:s.action,frame:s.frame};});
 el('restart').onclick();scheduled(0);scheduled(14400);assert.equal(api.state().playing,false);assert.equal(api.state().elapsed,14400);
 el('loop').checked=true;el('restart').onclick();scheduled(0);scheduled(14500);assert.equal(api.state().elapsed,100);
 el('pause').onclick();assert.equal(api.state().playing,false);
 el('seek').value='11005';el('seek').oninput();assert.equal(api.state().frame,10);
 const before=draws.at(-1);el('attackScale').value='85';el('attackScale').oninput();assert.ok(draws.at(-1).at(-2)<before.at(-2));
 el('bg').value='snow';el('bg').onchange();el('speed').value='0.5';el('speed').oninput();assert.equal(el('speedText').textContent,'0.5×');
 const result={ok:true,scope:'Actual script in Node VM with local PNG loading; browser screenshots checked separately',totalMs:api.total,images:4,backgrounds:2,samples,checks:['exact seven segment sequence','one front paw attack twice','breathing idle three times','both front paw impact','one-shot stop','repeat','pause','seek','scale','snow background','speed']};
 fs.writeFileSync(path.join(__dirname,'qa.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
});

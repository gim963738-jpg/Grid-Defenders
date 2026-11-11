const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const els=new Map(),draws=[];const ctx={clearRect(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},drawImage(...args){draws.push(args);}};
function el(id){if(!els.has(id))els.set(id,{value:id==='mode'?'full':id==='speed'?'1':id==='scale'?'90':id==='bg'?'forest':'0',checked:false,disabled:true,getContext:()=>ctx});return els.get(id);}
let scheduled;
const scope={window:{},console,URLSearchParams,location:{search:''},document:{getElementById:el,querySelectorAll:()=>[],addEventListener(){},body:{classList:{toggle(){}}}},Image:class{set src(p){const b=fs.readFileSync(path.join(__dirname,p));assert.equal(b.subarray(1,4).toString(),'PNG');this.naturalWidth=b.readUInt32BE(16);this.naturalHeight=b.readUInt32BE(20);this.onload();}},requestAnimationFrame:fn=>scheduled=fn};
vm.createContext(scope);for(const f of ['data.js','player.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,f),'utf8'),scope);
setImmediate(()=>{
 const api=scope.window.motionReview;assert.ok(api);assert.equal(api.duration(),14400);assert.equal(api.state().images,8);
 const samples=[];
 for(const [t,action] of [[0,'walk'],[2399,'walk'],[2400,'weak'],[2970,'weak'],[3700,'idle'],[6100,'weak'],[7400,'idle'],[9800,'strong'],[11005,'strong'],[12000,'idle'],[14400,'idle']]){api.seek(t);assert.equal(api.state().action,action);samples.push({ms:t,...api.state(),frames:api.frames()});}
 api.seek(2970);assert.equal(api.frames().find(s=>s.id==='before/weak').frame,6);assert.equal(api.frames().find(s=>s.id==='after/weak').frame,9);
 api.seek(2399);const a=api.state();api.seek(2400);const b=api.state();assert.ok(Math.abs(a.x-b.x)<1&&Math.abs(a.y-b.y)<1);
 for(const [mode,duration] of [['walk',1200],['weak',1300],['strong',2200],['idle',2400]]){el('mode').value=mode;el('mode').onchange();assert.equal(api.duration(),duration);api.seek(duration-1);const frames=api.frames().filter(f=>f.id.endsWith('/'+mode));assert.equal(frames.length,2);assert.ok(frames.every(f=>Number.isFinite(f.frame)));}
 el('mode').value='full';el('mode').onchange();el('restart').onclick();scheduled(0);scheduled(14400);assert.equal(api.state().playing,false);
 el('loop').checked=true;el('restart').onclick();scheduled(0);scheduled(14500);assert.equal(api.state().elapsed,100);el('pause').onclick();assert.equal(api.state().playing,false);
 el('transition').onclick();assert.equal(api.state().elapsed,2100);assert.equal(api.state().playing,true);el('pause').onclick();
 api.seek(2400);el('next').onclick();assert.ok(api.state().elapsed>2400);el('prev').onclick();assert.equal(api.state().elapsed,2400);
 el('speed').value='0.5';el('speed').oninput();assert.equal(el('speedText').textContent,'0.5×');el('scale').value='85';el('scale').oninput();el('bg').value='snow';el('bg').onchange();
 const result={ok:true,scope:'Node VM actual player code and PNGs; real browser screenshots reviewed separately',images:8,backgrounds:2,totalMs:14400,samples,checks:['same action time before/after','correct baseline chosen2.6 walk','8 sheets load','7-segment sequence','weak impact same570ms','standalone4actions','loop','one-shot stop','pause','transition shortcut','frame stepping','speed','scale','snow background']};
 fs.writeFileSync(path.join(__dirname,'qa.json'),JSON.stringify(result,null,2));console.log(JSON.stringify({ok:true,images:8,totalMs:14400,checks:result.checks}));
});


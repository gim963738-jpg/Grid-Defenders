const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const elements = new Map();
const draws = [];
const ctx = {clearRect(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},drawImage(...args){draws.push(args);}};
const el = id => {
  if (!elements.has(id)) elements.set(id,{value: id==='speed'?'1':id==='bg'?'light':'0',checked:false,disabled:true,textContent:'',getContext:()=>ctx});
  return elements.get(id);
};
let scheduled;
const scope = {
  window:{},console,
  document:{getElementById:el,querySelectorAll:()=>[],addEventListener(){},body:{classList:{toggle(){}}}},
  Image:class {set src(value){const b=fs.readFileSync(path.join(__dirname,value)); assert.equal(b.subarray(1,4).toString(),'PNG'); this.onload();}},
  requestAnimationFrame:fn=>{scheduled=fn;}
};
vm.createContext(scope);
vm.runInContext(fs.readFileSync(path.join(__dirname,'data.js'),'utf8'),scope);
vm.runInContext(fs.readFileSync(path.join(__dirname,'sequence.js'),'utf8'),scope);
setImmediate(()=>{
  const api=scope.window.sequenceReview;
  assert.ok(api,'all four source images loaded');
  const samples=[0,1199,1200,2399,2400,2969,2970,3699,3700,4300].map(t=>({ms:t,...api.seek(t)}));
  assert.equal(api.seek(2399).phase,'walk');
  assert.equal(api.seek(2400).phase,'attack');
  assert.equal(api.seek(2400).frame,0);
  assert.equal(api.seek(2970).frame,6);
  assert.equal(api.seek(3700).phase,'rest');
  assert.equal(api.seek(4300).frame,11);
  el('restart').onclick(); scheduled(0); scheduled(2400);
  assert.equal(api.state().phase,'attack');
  scheduled(4300);
  assert.equal(api.state().playing,false);
  assert.equal(api.state().elapsed,4300);
  el('loop').checked=true; el('restart').onclick(); scheduled(0); scheduled(4400);
  assert.equal(api.state().elapsed,100);
  el('pause').onclick(); assert.equal(api.state().playing,false);
  el('seek').value='2970'; el('seek').oninput(); assert.equal(api.state().frame,6);
  el('bg').value='dark'; el('bg').onchange();
  el('speed').value='0.5'; el('speed').oninput();
  assert.equal(el('speedText').textContent,'0.5×');
  const result={ok:true,scope:'Node VM playback and control checks; not a real browser visual approval',loadedImages:api.state().images,samples,drawCalls:draws.length,checks:['PNG sources loaded','walk to immediate attack boundary','impact frame','recover hold','one-shot stop','loop','pause','seek','background switch','speed control']};
  fs.writeFileSync(path.join(__dirname,'qa.json'),JSON.stringify(result,null,2));
  console.log(JSON.stringify(result));
});

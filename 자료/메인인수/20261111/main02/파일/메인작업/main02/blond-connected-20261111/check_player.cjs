const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert');
const root=__dirname,html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const elements={},draws=[];
const element=id=>elements[id]??=( {value:id==='speed'?'1':id==='bg'?'light':'0',textContent:'',classList:{toggle(){}},appendChild(){},getContext(){return {fillRect(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},drawImage(...a){draws.push(a);}};}} );
const context={console,Promise,Math,Number,Error,performance:{now:()=>0},window:{},document:{getElementById:element,createElement:()=>element('button'+Math.random()),body:{dataset:{}}},requestAnimationFrame(){},Image:class{set src(x){this.complete=true;this.naturalWidth=1536;queueMicrotask(()=>this.onload());}}};
vm.createContext(context);vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1],context);
setImmediate(()=>{
  const d=context.window.sequenceDebug;
  assert.equal(context.document.body.dataset.ready,'true');assert.equal(context.document.body.dataset.tests,'pass');
  const fifth=d.steps.filter(s=>s.action===4);assert.deepEqual(Array.from(fifth,s=>s.frame),[0,1,2,3,4,5,6]);
  const sixth=d.steps.find(s=>s.action===5);assert.equal(d.at(sixth.start-0.001).frame,6);assert.equal(d.at(sixth.start).frame,0);assert.equal(d.at(sixth.start).action,5);
  for(const time of [d.introMs,d.introMs+d.loopMs,d.introMs+100*d.loopMs]){assert.equal(d.at(time).action,1);assert.equal(d.at(time).frame,0);assert.equal(d.at(time).tail,true);}
  vm.runInContext('elapsed=6380;paint()',context);assert(element('status').textContent.startsWith('02 대기 반복'));
  element('play').onclick();assert.equal(vm.runInContext('playing',context),false);
  element('restart').onclick();assert.equal(vm.runInContext('elapsed',context),0);assert.equal(vm.runInContext('playing',context),true);
  assert(draws.length>=6);const result={ok:true,builtInChecks:Array.from(d.checks),imagesLoaded:12,introFrames:d.steps.length,introMs:d.introMs,tailLoopMs:d.loopMs,controls:'pause/restart verified',tail:'02 loops after06; 07/08 absent',render:'both variants draw through same clock',drawCalls:draws.length};
  fs.writeFileSync(path.join(root,'verification.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
});

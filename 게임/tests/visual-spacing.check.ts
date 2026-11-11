import {GameRun} from '../src/gameRun';
import {captureBattle,restoreBattle} from '../src/battleSave';
import {Defense} from '../src/defense';
import {BossBattle,waveBossRoster,type BossActor} from '../src/bossBattle';
import {BOSS_FIELD} from '../src/bossField';
import {RULES,SLOTS,UNITS} from '../src/defenseConfig';
import {groundRadius,separateActors,visualCore,approachPoint,TURTLE_REGISTRATION,turtleWorldScale,actorFieldBounds} from '../src/actorSpacing';
export let visualSpacingEvidence:unknown;
export function checkVisualSpacing(){
 const passed:string[]=[],ck=(ok:boolean,name:string)=>{if(!ok)throw Error(name);passed.push(name);};
 const overlaps=(a:ReturnType<typeof visualCore>,b:ReturnType<typeof visualCore>)=>Math.min(a.right,b.right)>Math.max(a.left,b.left)+.05&&Math.min(a.bottom,b.bottom)>Math.max(a.top,b.top)+.05;
 function fixture(){const g=new Defense(()=>1);g.devDeploySoldiers();g.summon('blond',4);g.summon('blond',5);g.summon('guard',6);const b=new BossBattle(waveBossRoster(g),()=>1);b.autoSkills=false;return {g,b};}
 ck(TURTLE_REGISTRATION.contactX===40&&TURTLE_REGISTRATION.footY===270&&TURTLE_REGISTRATION.bodyCss===180&&TURTLE_REGISTRATION.bodyReference===230,'fixed measured front paw registration, unchanged body scale');
 ck(UNITS.blond.range===100&&UNITS.blond.attack===85&&UNITS.blond.rate===1.1&&UNITS.blond.hp===1400,'blond combat stats unchanged');
 const f=fixture(),b=f.b,originalUnits=JSON.stringify(f.g.units),gold=f.g.gold,initial=JSON.stringify(b.actors);
 b.tick(3);ck(b.elapsed===0&&b.preparationRemaining===0&&JSON.stringify(b.actors.map(a=>[a.x,a.y,a.hp,a.cooldown]))===JSON.stringify((JSON.parse(initial) as BossActor[]).map(a=>[a.x,a.y,a.hp,a.cooldown])),'safe spawn remains still during exact 3 seconds');
 ck(b.actors.filter(a=>a.side==='enemy').length===4,'same four enemy roster');
 const boss=b.actors.find(a=>a.kind==='boss')!,s=turtleWorldScale(BOSS_FIELD.width);
 ck(boss.x+(314-40)*s<BOSS_FIELD.width&&boss.y-270*s>=0,'initial full turtle cell fits rear and top at 800 reference');
 const hits=new Map<string,number>();const jumps:{time:number;id:string;step:number;from:{x:number;y:number};to:{x:number;y:number}}[]=[];let fullBoundary=true,maxLateStep=0,finite=true,bodyClear=true,rangeProof=false;let previous=new Map(b.actors.map(a=>[a.id,{x:a.x,y:a.y}]));
 const snapshots:number[]=[];
 for(let i=0;i<1800&&b.result==='fighting';i++){
  b.hits=[];b.tick(.02);
  for(const h of b.hits){hits.set(h.from,(hits.get(h.from)??0)+1);const source=b.actors.find(a=>a.id===h.from)!,target=b.actors.find(a=>a.id===h.to)!;if(source.kind==='blond'&&Math.hypot(source.x-target.x,source.y-target.y)<=100.05)rangeProof=true;}
  for(const a of b.actors){const old=previous.get(a.id)!;if(b.elapsed>2&&a.hp>0){const step=Math.hypot(a.x-old.x,a.y-old.y);maxLateStep=Math.max(maxLateStep,step);if(step>10)jumps.push({time:b.elapsed,id:a.id,step,from:old,to:{x:a.x,y:a.y}});}finite&&=Number.isFinite(a.x)&&Number.isFinite(a.y)&&a.x>=0&&a.x<=BOSS_FIELD.width&&a.y>=0&&a.y<=BOSS_FIELD.height;}
  fullBoundary&&=boss.x-40*s>=0&&boss.x+274*s<=BOSS_FIELD.width&&boss.y-270*s>=0&&boss.y+44*s<=BOSS_FIELD.height;
  if(boss.hp>0)for(const a of b.actors)if(a!==boss&&a.hp>0)bodyClear&&=!overlaps(visualCore(boss,BOSS_FIELD.width),visualCore(a,BOSS_FIELD.width));
  previous=new Map(b.actors.map(a=>[a.id,{x:a.x,y:a.y}]));
  if(Math.abs(b.elapsed-9.5)<.001||Math.abs(b.elapsed-16.5)<.001)snapshots.push(b.elapsed);
 }
 ck(fullBoundary,'full display envelope remains in field on every20ms step through live boss death');
 ck(finite,'all actual multi-unit positions finite and within field');
 ck(bodyClear,'turtle core and other living visible cores remain separate throughout combat');
 ck(maxLateStep<=14&&jumps.length<=2,'ordinary combat has at most2 small lane corrections above10world, each <=14world torso half-width '+JSON.stringify({maxLateStep,jumps:jumps.slice(0,12)}));
 ck(snapshots.length===2,'unchanged QA checkpoints 9.5 and16.5 reached');
 visualSpacingEvidence={maxLateStep,jumps,attackCounts:Object.fromEntries(hits),elapsed:b.elapsed,result:b.result,roster:b.actors.map(a=>({id:a.id,kind:a.kind,side:a.side,hp:a.hp}))};
 ck(rangeProof,'actual blond can strike inside100 range after spacing');
 ck((hits.get('tester-boss')??0)>0,'turtle can approach and attack');
 for(const id of ['retainer-normal','retainer-top','retainer-bottom']){
  const f=fixture(),attacker=f.b.actors.find(a=>a.id===id)!,target=f.b.actors.find(a=>a.kind==='guard')!;f.b.preparationRemaining=0;f.b.actors=[attacker,target];
  Object.assign(attacker,{x:600,y:350,cooldown:0});Object.assign(target,{x:400,y:350,cooldown:999,speed:0,hp:100000,maxHp:100000});
  for(let i=0;i<250;i++)f.b.tick(.02);
  ck(attacker.x<600&&target.hp<100000&&Math.hypot(attacker.x-target.x,attacker.y-target.y)<=50.05,id+' real approach and basic attack with unchanged enemy stats');
 }
 ck(b.actors.filter(a=>a.kind==='guard').some(a=>(hits.get(a.id)??0)>0),'ordinary soldiers remain able to attack');
 ck(JSON.stringify(f.g.units)===originalUnits&&f.g.gold===gold,'boss spacing never mutates wave slots or currency');
 // Ground circles were already separated: this specifically exercises a body-only overlap behind the shell.
 const rear=fixture(),t=rear.b.actors.find(a=>a.kind==='boss')!,a=rear.b.actors.find(a=>a.kind==='blond')!;Object.assign(t,{x:450,y:350});Object.assign(a,{x:570,y:300});rear.b.actors=[a,t];
 ck(Math.hypot(a.x-t.x,a.y-t.y)>groundRadius(a)+groundRadius(t)+2&&overlaps(visualCore(a,BOSS_FIELD.width),visualCore(t,BOSS_FIELD.width)),'rear fixture has circle PASS but real body core overlap');
 separateActors(rear.b.actors,BOSS_FIELD.width,BOSS_FIELD.height);ck(!overlaps(visualCore(a,BOSS_FIELD.width),visualCore(t,BOSS_FIELD.width)),'rear-body keep-out resolves overlap without giant ground radius');
 const front=fixture(),h=front.b.actors.find(a=>a.kind==='blond')!,e=front.b.actors.find(a=>a.kind==='boss')!;front.b.preparationRemaining=0;front.b.actors=[h,e];Object.assign(h,{x:410,y:350,cooldown:0,speed:0});Object.assign(e,{x:500,y:350,cooldown:999,speed:0,physicalArmor:0});const hp=e.hp;front.b.tick(.001);h.cooldown=999;front.b.tick(.4);ck(e.hp===hp-h.attack&&Math.hypot(e.x-h.x,e.y-h.y)<=100,'front contact remains reachable and one real hit lands');
 const around=fixture(),runner=around.b.actors.find(a=>a.kind==='blond')!,shell=around.b.actors.find(a=>a.kind==='boss')!;around.b.preparationRemaining=0;around.b.actors=[runner,shell];Object.assign(runner,{x:900,y:350,cooldown:0});Object.assign(shell,{x:500,y:350,speed:0,cooldown:999,hp:100000,maxHp:100000});
 around.g.keepWaveMonsters=true;const run=new GameRun();run.start('normal');for(let i=0;i<75;i++)around.b.tick(.02);
 const checkpoint=captureBattle(around.g,around.b,run,{runId:'rear-route-save',scene:'boss',activeBossWave:10,bossReturnDelay:0,bossTestMode:false,bossEncounterWave:10,defeatedBossEnemies:[],combatPaused:false},1),continued=fixture(),continuedRun=new GameRun();
 const restored=!!checkpoint&&!!restoreBattle(checkpoint,continued.g,continued.b,continuedRun);
 for(let i=0;i<675;i++){around.b.tick(.02);if(restored)continued.b.tick(.02);}
 ck(restored&&JSON.stringify(around.b.actors)===JSON.stringify(continued.b.actors),'saved rear approach resumes exact movement, motion and damage with no hidden waypoint state');
 ck(shell.hp<100000&&Math.hypot(runner.x-shell.x,runner.y-shell.y)<=100.05,'rear approach routes around shell and reaches actual100 range without blocking '+JSON.stringify({runner:{x:runner.x,y:runner.y,phase:runner.motion},shell:{x:shell.x,y:shell.y,hp:shell.hp},next:approachPoint(runner,shell,around.b.actors,BOSS_FIELD.width,BOSS_FIELD.height)}));
 for(const n of [1,4,12,SLOTS.length]){const g=new Defense(()=>1);g.gold=99999;for(let i=0;i<Math.min(n,SLOTS.length);i++)g.summon('guard',i);const b=new BossBattle(waveBossRoster(g),()=>1);b.autoSkills=false;let envelopeSafe=true;for(let i=0;i<300;i++){b.tick(.05);const e=b.actors.find(a=>a.kind==='boss')!;envelopeSafe&&=e.x-40*s>=0&&e.x+274*s<=BOSS_FIELD.width&&e.y-270*s>=0&&e.y+44*s<=BOSS_FIELD.height;}const live=b.actors.filter(a=>a.hp>0);let clear=true;for(let i=0;i<live.length;i++)for(let j=i+1;j<live.length;j++)if(live[i].kind==='boss'||live[j].kind==='boss'||live[i].side==='ally'&&live[j].side==='ally')clear&&=!overlaps(visualCore(live[i],BOSS_FIELD.width),visualCore(live[j],BOSS_FIELD.width));
 ck(envelopeSafe&&clear&&b.actors.some(a=>a.hp<a.maxHp)&&b.actors.every(a=>Number.isFinite(a.x)&&Number.isFinite(a.y)&&a.x>=0&&a.x<=BOSS_FIELD.width),'different actual roster '+n+' fights, separates visible cores and stays finite');}
 const crowd=fixture().b.actors;for(const a of crowd){a.x=1;a.y=1;}for(let i=0;i<5;i++)separateActors(crowd,BOSS_FIELD.width,BOSS_FIELD.height);ck(crowd.every(a=>Number.isFinite(a.x)&&Number.isFinite(a.y)&&a.x>=groundRadius(a)&&a.x<=BOSS_FIELD.width-groundRadius(a)&&a.y>=groundRadius(a)),'coincident boundary crowd separates without escaping field '+JSON.stringify(crowd.map(a=>({id:a.id,x:a.x,y:a.y}))));
 let groundGap=Infinity;for(let i=0;i<crowd.length;i++)for(let j=i+1;j<crowd.length;j++)groundGap=Math.min(groundGap,Math.hypot(crowd[i].x-crowd[j].x,crowd[i].y-crowd[j].y)-groundRadius(crowd[i])-groundRadius(crowd[j]));
 ck(groundGap>=1.9,'coincident crowd preserves existing ground gap after settling '+JSON.stringify({groundGap,crowd:crowd.map(a=>({id:a.id,x:a.x,y:a.y}))}));
 const cb=crowd.find(a=>a.kind==='boss')!;ck(crowd.every(a=>a===cb||!overlaps(visualCore(cb,BOSS_FIELD.width),visualCore(a,BOSS_FIELD.width))),'coincident crowd also respects turtle visible core');
 let friendlyClear=true;for(let i=0;i<crowd.length;i++)for(let j=i+1;j<crowd.length;j++)if(crowd[i].side==='ally'&&crowd[j].side==='ally')friendlyClear&&=!overlaps(visualCore(crowd[i],BOSS_FIELD.width),visualCore(crowd[j],BOSS_FIELD.width));ck(friendlyClear,'coincident crowd also separates same-side visible torsos');
 ck(RULES.heroLimit===3,'hero cap remains unchanged');

 // Entire fixed display envelope, independent from the torso proxy.
 const fullFits=(a:BossActor)=>a.x-40*s>=0&&a.x+274*s<=BOSS_FIELD.width&&a.y-270*s>=0&&a.y+44*s<=BOSS_FIELD.height;
 ck(fullFits(boss),'whole64-frame display envelope still inside field at end of real combat');
 for(const [x,y] of [[0,0],[BOSS_FIELD.width,0],[0,BOSS_FIELD.height],[BOSS_FIELD.width,BOSS_FIELD.height]]){
  const wall=fixture().b;const e=wall.actors.find(a=>a.kind==='boss')!;Object.assign(e,{x,y});separateActors(wall.actors,BOSS_FIELD.width,BOSS_FIELD.height);
  ck(fullFits(e),'whole turtle display envelope survives separation at corner '+x+','+y);
 }
 const old=fixture();old.g.keepWaveMonsters=true;const oldRun=new GameRun();oldRun.start('normal');const oldBoss=old.b.actors.find(a=>a.kind==='boss')!;Object.assign(oldBoss,{x:BOSS_FIELD.width-1,y:70});
 const oldSave=captureBattle(old.g,old.b,oldRun,{runId:'boundary-restore',scene:'boss',activeBossWave:10,bossReturnDelay:0,bossTestMode:false,bossEncounterWave:10,defeatedBossEnemies:[],combatPaused:true},1),res=fixture(),rr=new GameRun();
 ck(!!oldSave&&!!restoreBattle(oldSave,res.g,res.b,rr)&&fullFits(res.b.actors.find(a=>a.kind==='boss')!),'old offscreen checkpoint is constrained immediately even before a paused first tick');
 for(const kind of ['blond','guard'] as const){
  const g=new Defense(()=>1);g.summon(kind,0);const b=new BossBattle(waveBossRoster(g),()=>1);b.autoSkills=false;b.preparationRemaining=0;
  const h=b.actors.find(a=>a.side==='ally')!,e=b.actors.find(a=>a.kind==='boss')!;b.actors=[h,e];Object.assign(e,{x:500,y:actorFieldBounds(e,BOSS_FIELD.width,BOSS_FIELD.height).top,cooldown:0});Object.assign(h,{x:430,y:e.y-160,cooldown:0});
  const hp=h.hp,ep=e.hp;let safe=true,maxStep=0;for(let i=0;i<650&&b.result==='fighting';i++){const pos={x:e.x,y:e.y};b.tick(.02);safe&&=fullFits(e);maxStep=Math.max(maxStep,Math.hypot(e.x-pos.x,e.y-pos.y));}
  ck(safe&&e.hp<ep&&h.hp<hp&&maxStep<2,'upper '+kind+' and boundary turtle both approach/attack without out-of-field corrections '+JSON.stringify({h:h.hp,e:e.hp,maxStep}));
 }

 for(const [x,y] of [[BOSS_FIELD.width,0],[0,BOSS_FIELD.height],[BOSS_FIELD.width,BOSS_FIELD.height]]){
  const actors=fixture().b.actors;for(const a of actors)Object.assign(a,{x,y});for(let n=0;n<5;n++)separateActors(actors,BOSS_FIELD.width,BOSS_FIELD.height);
  const e=actors.find(a=>a.kind==='boss')!;let clear=true,gap=Infinity;
  for(let i=0;i<actors.length;i++)for(let j=i+1;j<actors.length;j++){const a=actors[i],b=actors[j];gap=Math.min(gap,Math.hypot(a.x-b.x,a.y-b.y)-groundRadius(a)-groundRadius(b));if(a.kind==='boss'||b.kind==='boss'||a.side==='ally'&&b.side==='ally')clear&&=!overlaps(visualCore(a,BOSS_FIELD.width),visualCore(b,BOSS_FIELD.width));}
  ck(fullFits(e)&&clear&&gap>=1.9,'18 coincident actors at corner '+x+','+y+' preserve full display, standing bodies and ground gap '+gap);
 }
 return passed;
}

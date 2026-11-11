import {ReadyBossBattle as BossBattle} from './ready-boss-fixture';
import {GameRun,RUN_LIMITS} from '../src/gameRun';
import {Defense} from '../src/defense';
import {waveBossRoster} from '../src/bossBattle';
import {stepCombat} from '../src/combatPlayback';
export function checkGameRun(){
 const passed:string[]=[];const check=(ok:boolean,name:string)=>{if(!ok)throw Error(name);passed.push(name);};
 const run=new GameRun();check(!run.active&&run.result===null,'boot opens an idle lobby');
 check(run.failure({scene:'defense',monsters:50})===null&&run.bossStep(.05,0)===0,'lobby never simulates or ends a run');
 run.start('normal');check(run.active&&run.mode==='normal','start activates a normal run');
 check(run.failure({scene:'defense',monsters:19})===null,'nineteen monsters are allowed');
 check(run.failure({scene:'defense',monsters:20})==='monster-limit','twentieth monster ends a normal run');
 check(run.failure({scene:'defense',monsters:21})==='monster-limit','overflow also ends a normal run');
 check(run.failure({scene:'boss',result:'defeat',elapsed:12})==='boss-defeat','boss army defeat ends a normal run');
 check(run.failure({scene:'boss',result:'fighting',elapsed:59.99})===null,'boss can fight before deadline');
 check(run.failure({scene:'boss',result:'fighting',elapsed:60})==='boss-timeout','living boss at sixty seconds times out');
 check(run.failure({scene:'boss',result:'victory',elapsed:60})===null,'victory on deadline is valid');
 check(run.failure({scene:'boss',result:'victory',elapsed:60.01})==='boss-timeout','victory after deadline cannot bypass timeout');
 check(Math.abs(run.bossStep(.05,59.98)-.02)<1e-8&&run.bossStep(.05,60)===0,'final boss step is clamped to deadline');
 run.advance(12.5);const result=run.finish('monster-limit',2,7)!;
 check(!run.active&&result.wave===2&&result.kills===7&&result.seconds===12.5,'finish captures result and stops run');
 result.wave=999;check(run.result!.wave===2,'returned result cannot rewrite lobby snapshot');
 check(run.finish('boss-timeout',5,99)===null&&run.result!.reason==='monster-limit','finish is idempotent');
 run.advance(100);check(run.elapsed===12.5,'ended run clock is frozen');
 run.start('normal');check(run.result===null&&run.elapsed===0,'new game clears last run state');
 run.start('infinite-test');check(run.failure({scene:'defense',monsters:30})===null,'infinite test ignores monster limit');
 check(run.failure({scene:'boss',result:'defeat',elapsed:100})===null&&run.failure({scene:'boss',result:'fighting',elapsed:100})===null,'infinite test ignores boss failure and deadline');
 check(run.bossStep(.05,100)===.05&&run.finish('boss-timeout',10,0)===null&&run.active,'infinite test preserves legacy boss simulation');
 run.reset();check(!run.active&&run.result===null&&run.mode==='normal','reset restores lobby state');
 const normal=new Defense(()=>1);normal.keepWaveMonsters=true;const first=normal.enemies[0].id;normal.waveTime=29.99;normal.tick(.02);
 check(normal.wave===2&&normal.enemies.some(e=>e.id===first)&&normal.enemies.length===11,'normal wave carries live monsters across boundary');
 for(let i=0;i<400&&!normal.monsterLimitReached;i++)normal.tick(.05);
 check(normal.monsterLimitReached&&normal.enemies.length===20&&normal.wave===2,'two uncleared waves reach twenty monsters');
 const elapsed=normal.elapsed;normal.tick(100);check(normal.elapsed===elapsed&&normal.enemies.length===20,'overloaded normal wave cannot attack away the loss or keep spawning');
 normal.enemies[0].hp=0;check(!normal.monsterLimitReached,'dead monsters do not count toward loss');
 normal.reset();check(!normal.keepWaveMonsters&&normal.wave===1,'model reset preserves legacy default for new test setup');
 const legacy=new Defense(()=>1),old=legacy.enemies[0].id;legacy.waveTime=29.99;legacy.tick(.02);
 check(legacy.wave===2&&legacy.enemies.length===1&&!legacy.enemies.some(e=>e.id===old),'infinite test retains old normal-monster cleanup');
 const prep=new Defense(()=>1);prep.devDeploySoldiers();
 for(const speed of [.25,.5,1,2,3,5]){
  const active=new GameRun();active.start('normal');const boss=new BossBattle(waveBossRoster(prep),()=>1);boss.actors.forEach(a=>{a.attack=0;a.speed=0;});boss.elapsed=59.98;
  stepCombat(.2,speed,seconds=>{if(!active.active)return;const before=boss.elapsed,dt=active.bossStep(seconds,boss.elapsed);if(dt>0)boss.tick(dt);active.advance(boss.elapsed-before);const reason=active.failure({scene:'boss',result:boss.result,elapsed:boss.elapsed});if(reason)active.finish(reason,10,0);});
  check(active.result?.reason==='boss-timeout'&&Math.abs(boss.elapsed-RUN_LIMITS.bossSeconds)<1e-8,`deadline remains sixty simulated seconds at ${speed}x`);
 }
 const paused=new GameRun();paused.start('normal');const boss=new BossBattle(waveBossRoster(prep),()=>1);stepCombat(10,5,dt=>{boss.tick(dt);paused.advance(dt);},true);
 check(boss.elapsed===0&&paused.elapsed===0,'pause freezes boss deadline and run time');
 return passed;
}

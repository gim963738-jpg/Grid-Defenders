import {upcomingWaveWarning} from '../src/waveWarning';
import {Defense} from '../src/defense';
import {RULES} from '../src/defenseConfig';
export function checkWaveWarning(){
 const passed:string[]=[];const check=(ok:boolean,name:string)=>{if(!ok)throw Error(name);passed.push(name);};
 const state=(wave:number,waveTime:number,bossPending=false)=>({wave,waveTime,bossPending});
 check(upcomingWaveWarning(state(3,25))===null,'ordinary upcoming round has no warning');
 check(upcomingWaveWarning(state(4,19.99))===null,'named warning stays hidden before final ten seconds');
 const named=upcomingWaveWarning(state(4,20));check(named?.kind==='named'&&named.wave===5&&named.seconds===10,'named warning starts ten seconds before wave five');
 check(upcomingWaveWarning(state(4,25.2))?.seconds===5,'countdown rounds the remaining simulation seconds up');
 check(upcomingWaveWarning(state(4,29.99))?.seconds===1,'warning remains through the final second');
 check(upcomingWaveWarning(state(4,30))===null,'expired round has no stale warning');
 check(upcomingWaveWarning(state(5,20))===null,'current named round does not warn about itself');
 const boss=upcomingWaveWarning(state(9,20));check(boss?.kind==='boss'&&boss.wave===10,'boss warning takes precedence over named at wave ten');
 check(upcomingWaveWarning(state(14,20))?.kind==='named','named cycle repeats at fifteen');
 check(upcomingWaveWarning(state(19,20))?.kind==='boss','boss cycle repeats at twenty');
 check(upcomingWaveWarning(state(9,20,true))===null,'boss gate suppresses preview');
 check(upcomingWaveWarning(state(4,19.999999999999996))?.seconds===10,'floating point boundary never shows eleven seconds');
 for(const speed of [.25,.5,1,2,3,5]){
  const g=new Defense();while(g.wave<4)g.nextTestWave();g.waveTime=19.9;g.speed=speed;g.tick(.2/speed);
  check(upcomingWaveWarning(g)?.seconds===10,`warning follows simulated time at ${speed}x`);
 }
 const g=new Defense();while(g.wave<4)g.nextTestWave();g.waveTime=20;const before=JSON.stringify({wave:g.wave,time:g.waveTime,enemies:g.enemies});upcomingWaveWarning(g);
 check(JSON.stringify({wave:g.wave,time:g.waveTime,enemies:g.enemies})===before,'warning lookup does not mutate combat');
 g.tick(10.01);check(g.wave===5&&upcomingWaveWarning(g)===null,'named start clears the preview');
 g.reset();check(upcomingWaveWarning(g)===null,'reset clears upcoming warning');
 check(RULES.waveMonsters*2===20,'display-only threshold is two normal waves');
 return passed;
}

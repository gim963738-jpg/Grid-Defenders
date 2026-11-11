import { BossDamageHistory } from '../src/bossDamageHistory';
import { bossFixture } from './boss-fixture';
import { Defense } from '../src/defense';
export function checkBossDpsHistory():string[]{
 const passed:string[]=[];const check=(ok:boolean,label:string)=>{if(!ok)throw new Error(label);passed.push(label);};
 const history=new BossDamageHistory(),battle=bossFixture();history.capture(battle,10,true);check(history.last===null,'zero-time unstarted battle is not archived');
 battle.elapsed=5;battle.damageMeter.record({id:'1',name:'보병',color:'#fff'},100,5);history.capture(battle,10);check(history.last===null,'live battle is not mistaken for a final result');
 history.capture(battle,10,true);check(history.last?.outcome==='중단'&&history.last.stats.total===100,'manual exit keeps a paused battle snapshot');
 battle.elapsed=10;battle.damageMeter.record({id:'1',name:'보병',color:'#fff'},50,10);battle.result='victory';history.capture(battle,10);
 check(history.last?.outcome==='승리'&&history.last.stats.total===150&&history.last.stats.dps===15,'finished result replaces paused snapshot');
 const archived=history.last;history.capture(battle,10);check(history.last===archived,'finished snapshot is not rewritten every frame');
 battle.reset();check(history.last===archived&&history.last!.stats.total===150,'new attempt does not erase the previous result');
 battle.damageMeter.record({id:'1',name:'보병',color:'#fff'},300,3);battle.elapsed=3;history.capture(battle,20,true);check(history.last===archived,'interrupted new trial cannot erase a completed result');check(history.last!.stats.total===150,'archive is detached from live damage data');
 battle.elapsed=3;battle.result='defeat';history.capture(battle,20);check(history.last!.wave===20&&history.last!.outcome==='패배'&&history.last!.stats.total===300,'latest finished attempt replaces old result');
 history.clear();check(history.last===null,'game reset can clear boss archive');
 const game=new Defense(()=>1);game.damageMeter.record({id:'2',name:'병사',color:'#fff'},80,4);game.waveTime=4;game.nextTestWave();
 check(game.lastWaveDamage?.wave===1&&game.lastWaveDamage.stats.total===80,'completed wave retains its own detached snapshot');
 const waveRecord=game.lastWaveDamage;game.wave=10;game.bossPending=true;game.completeBossWave();check(game.lastWaveDamage===waveRecord,'boss completion does not overwrite prior wave record');
 game.reset();check(game.lastWaveDamage===null,'game reset clears wave archive');
 return passed;
}

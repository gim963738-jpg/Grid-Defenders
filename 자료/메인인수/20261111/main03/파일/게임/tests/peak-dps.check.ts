import { DamageMeter, DamagePeaks } from '../src/damageMeter';
import { Defense } from '../src/defense';
import { BossBattle, waveBossRoster } from '../src/bossBattle';
export function checkPeakDps():string[]{
 const passed:string[]=[];const check=(ok:boolean,label:string)=>{if(!ok)throw new Error(label);passed.push(label);};
 const history=new DamagePeaks(),wave=new DamageMeter(history),boss=new DamageMeter(history),source={id:'7',name:'원거리 딜러',color:'#fff'};
 wave.record(source,100,2);let s=wave.snapshot(4);
 check(s.rows[0].dps===25&&s.rows[0].peakDps===100&&s.peakDps===100,'one-second peak persists when average DPS falls');
 wave.reset();check(wave.snapshot(0).total===0&&wave.snapshot(0).peakDps===100,'wave reset retains game peak');
 wave.record(source,10,1);check(wave.snapshot(1).rows[0].peakDps===100,'same unit keeps peak across waves');
 boss.record(source,180,2);s=boss.snapshot(2);check(s.rows[0].peakDps===180&&s.peakDps===180,'boss updates shared unit and overall peaks');
 wave.record(source,1,2);check(wave.snapshot(2).rows[0].peakDps===180,'wave sees peak earned in boss combat');
 boss.reset();check(boss.snapshot(0).peakDps===180,'boss retry retains peak');
 wave.reset(true);check(boss.snapshot(0).peakDps===0&&history.units.size===0,'game reset clears shared peaks');
 const g=new Defense(()=>1);g.devDeploySoldiers();const b=new BossBattle(waveBossRoster(g),()=>1,g.damageMeter.peaks);
 g.damageMeter.record({id:String(g.units[0].id),name:'보병',color:'#fff'},50,1);b.reset();check(b.damageMeter.snapshot(0).peakDps===50,'boss reset preserves actual game peak history');
 g.nextTestWave();check(g.damageMeter.snapshot(0).peakDps===50,'actual next wave preserves game peak');
 g.reset();check(g.damageMeter.snapshot(0).peakDps===0&&b.damageMeter.snapshot(0).peakDps===0,'actual game reset clears both scene histories');
 return passed;
}

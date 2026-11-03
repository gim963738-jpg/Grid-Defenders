import { DamageMeter } from '../src/damageMeter';
export function checkDpsWindow():string[]{
 const passed:string[]=[];const check=(ok:boolean,label:string)=>{if(!ok)throw new Error(label);passed.push(label);};
 const a={id:'a',name:'궁병',color:'#fff'},b={id:'b',name:'마법병',color:'#fff'};
 const tiny=new DamageMeter();tiny.record(a,45,.0001);let s=tiny.snapshot(.0001);
 check(s.peakDps===45&&s.rows[0].peakDps===45,'tiny opening time cannot create 450000 peak DPS');
 check(s.dps===45&&s.rows[0].dps===45,'opening average also uses a minimum one-second denominator');
 const rolling=new DamageMeter();rolling.record(a,35,.1);rolling.record(a,40,.8);check(rolling.snapshot(.8).peakDps===75,'hits within one second combine');
 rolling.record(a,80,1.2);check(rolling.snapshot(1.2).peakDps===120,'expired hits do not inflate later windows');
 rolling.record(a,10,20);check(rolling.snapshot(20).peakDps===120,'long idle gap preserves peak without accumulating old hits');
 const boundary=new DamageMeter();boundary.record(a,30,0);boundary.record(a,20,.5);boundary.record(a,100,1);
 check(boundary.snapshot(1).peakDps===120,'one-second boundary excludes the oldest hit');
 boundary.reset();boundary.record(a,80,.1);check(boundary.snapshot(.1).peakDps===120,'new encounter clears window but preserves game best');
 boundary.reset(true);boundary.record(a,5,.1);check(boundary.snapshot(.1).peakDps===5,'game reset discards erroneous old peaks');
 const total=new DamageMeter();total.record(a,90,1);total.record(b,110,3);s=total.snapshot(3);
 check(s.peakDps===110&&s.rows.find(r=>r.id==='a')!.peakDps===90,'overall peak is concurrent damage rather than sum of separate unit peaks');
 const early=new DamageMeter();early.record(a,30,0);check(early.snapshot(0).dps===0&&early.snapshot(0).peakDps===30,'zero-time hit stays finite');
 return passed;
}

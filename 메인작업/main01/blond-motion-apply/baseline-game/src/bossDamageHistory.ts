import type { BossBattle } from './bossBattle';
import type { DamageMeter } from './damageMeter';
export interface BossDamageResult {encounter:number;wave:number;outcome:'승리'|'패배'|'중단';stats:ReturnType<DamageMeter['snapshot']>;}
/** Latest result is a detached snapshot, never the live meter itself. */
export class BossDamageHistory {
  last:BossDamageResult|null=null;
  clear():void{this.last=null;}
  capture(battle:BossBattle,wave:number,interrupted=false):void {
    if(battle.elapsed<=0||battle.result==='fighting'&&!interrupted)return;
    if(battle.result==='fighting'&&this.last&&this.last.outcome!=='중단')return;
    const outcome=battle.result==='victory'?'승리':battle.result==='defeat'?'패배':'중단';
    if(this.last?.encounter===battle.encounter&&this.last.outcome===outcome&&this.last.stats.elapsed===battle.elapsed)return;
    this.last={encounter:battle.encounter,wave,outcome,stats:battle.damageMeter.snapshot(battle.elapsed)};
  }
}

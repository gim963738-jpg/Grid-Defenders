import {RULES} from './defenseConfig';
export interface WaveWarning {kind:'named'|'boss';wave:number;seconds:number;}
/** A preview of the next round, using simulation time rather than a wall-clock timer. */
export function upcomingWaveWarning(state:{wave:number;waveTime:number;bossPending:boolean}):WaveWarning|null {
  const remaining=RULES.waveSeconds-state.waveTime;
  if(state.bossPending||remaining<=0||remaining>10+1e-8)return null;
  const wave=state.wave+1,kind=wave%RULES.bossEvery===0?'boss':wave%RULES.namedEvery===0?'named':null;
  return kind?{kind,wave,seconds:Math.ceil(Math.min(10,remaining))}:null;
}

import {RULES} from './defenseConfig';
export type RunMode='normal'|'infinite-test';
export type RunFailure='monster-limit'|'boss-defeat'|'boss-timeout';
export const RUN_LIMITS={monsters:RULES.waveMonsters*2,bossSeconds:60} as const;
export const FAILURE_TEXT:Record<RunFailure,string>={
 'monster-limit':`몬스터가 ${RUN_LIMITS.monsters}마리 누적되어 전장을 지키지 못했습니다.`,
 'boss-defeat':'보스전에서 아군이 모두 쓰러졌습니다.',
 'boss-timeout':`보스를 제한시간 ${RUN_LIMITS.bossSeconds}초 안에 처치하지 못했습니다.`,
};
export interface RunResult {reason:RunFailure;wave:number;kills:number;seconds:number;}
export type RunSnapshot={scene:'defense';monsters:number}|{scene:'boss';result:'fighting'|'victory'|'defeat';elapsed:number};
export class GameRun {
 mode:RunMode='normal';active=false;elapsed=0;result:RunResult|null=null;
 start(mode:RunMode):void {this.mode=mode;this.active=true;this.elapsed=0;this.result=null;}
 reset():void {this.mode='normal';this.active=false;this.elapsed=0;this.result=null;}
 advance(seconds:number):void {if(this.active)this.elapsed+=Math.max(0,seconds);}
 bossStep(seconds:number,elapsed:number):number {
  if(!this.active)return 0;
  return Math.max(0,Math.min(seconds,this.mode==='normal'?RUN_LIMITS.bossSeconds-elapsed:seconds));
 }
 failure(snapshot:RunSnapshot):RunFailure|null {
  if(!this.active||this.mode==='infinite-test')return null;
  if(snapshot.scene==='defense')return snapshot.monsters>=RUN_LIMITS.monsters?'monster-limit':null;
  if(snapshot.result==='defeat')return 'boss-defeat';
  if(snapshot.result==='victory')return snapshot.elapsed>RUN_LIMITS.bossSeconds+1e-8?'boss-timeout':null;
  return snapshot.elapsed>=RUN_LIMITS.bossSeconds-1e-8?'boss-timeout':null;
 }
 finish(reason:RunFailure,wave:number,kills:number):RunResult|null {
  if(!this.active||this.mode==='infinite-test')return null;
  this.active=false;this.result={reason,wave,kills,seconds:this.elapsed};return {...this.result};
 }
}

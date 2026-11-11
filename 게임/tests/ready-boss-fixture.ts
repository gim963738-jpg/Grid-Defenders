import {BossBattle} from '../src/bossBattle';
/** These legacy suites exercise combat AFTER preparation. The real three-second preparation is tested separately in runtime-motion.check.ts. */
export class ReadyBossBattle extends BossBattle {
 override reset(...args:Parameters<BossBattle['reset']>):void{super.reset(...args);this.preparationRemaining=0;}
}

export const COMBAT_SPEEDS=[.25,.5,1,2,3,5] as const;
export function nextCombatSpeed(current:number):number {const i=COMBAT_SPEEDS.findIndex(v=>v===current);return i<0?1:COMBAT_SPEEDS[(i+1)%COMBAT_SPEEDS.length];}
/** Keep every simulation update within the boss model's 50ms limit at every speed. */
export function stepCombat(realSeconds:number,speed:number,step:(simulationSeconds:number,realSeconds:number)=>void,paused=false):void {
 if(paused)return;
 if(!Number.isFinite(realSeconds)||!Number.isFinite(speed)||speed<=0)return;
 let remaining=Math.max(0,realSeconds)*speed;
 while(remaining>1e-8){const dt=Math.min(.05,remaining);step(dt,dt/speed);remaining-=dt;}
}

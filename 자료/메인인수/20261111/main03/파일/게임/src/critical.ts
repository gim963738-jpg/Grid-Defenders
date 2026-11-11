export interface CriticalStats {critChance?:number;critMultiplier?:number;}
/** Roll exactly once when an attack/cast is committed; all later hits reuse this snapshot. */
export function criticalAttack<T extends {attack:number}>(attack:T,stats:CriticalStats,random:()=>number=Math.random):T&{critical:boolean}{
 const critical=(stats.critChance??0)>0&&random()<(stats.critChance??0);
 return Object.assign(attack,{attack:attack.attack*(critical?(stats.critMultiplier??1.5):1),critical});
}

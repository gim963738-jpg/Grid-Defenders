import type {DamageType,DefenseType} from './defenseConfig';
export interface BreakableArmor {armor?:number;physicalArmor?:number;magicArmor?:number;armorBreakRemaining?:number;defenseType:DefenseType;}
export function effectiveArmor(target:BreakableArmor,type:DamageType):number {
 const base=type==='physical'?(target.physicalArmor??target.armor??0):(target.magicArmor??0);return base*((target.armorBreakRemaining??0)>0?.7:1);
}
export function combatDefenseMultiplier(type:DamageType,target:BreakableArmor):number {
 const base=type==='physical'?(target.physicalArmor??target.armor??0):(target.magicArmor??0);
 // Keep existing test-type mitigation as the baseline; only the lost armor changes damage.
 return (type===target.defenseType?.75:1)*(100+Math.max(0,base))/(100+Math.max(0,effectiveArmor(target,type)));
}
export function applyArmorBreak(target:BreakableArmor):void {target.armorBreakRemaining=5;}
export function tickArmorBreak(target:BreakableArmor,dt:number):void {target.armorBreakRemaining=Math.max(0,(target.armorBreakRemaining??0)-dt);}
export const BROKEN_SHIELD_SVG='<svg viewBox="0 0 32 36" aria-hidden="true"><path d="M16 2 29 7v10c0 8-9 14-13 17C12 31 3 25 3 17V7Z" fill="#271c27" stroke="#ffb0a0" stroke-width="2"/><path d="m19 4-6 10 7 2-7 16" fill="none" stroke="#ff655c" stroke-width="2"/><path d="M3 29 29 5" stroke="#ffe0c4" stroke-width="3"/></svg>';

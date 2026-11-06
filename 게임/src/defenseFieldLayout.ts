import {RULES,LANDSCAPE_BATTLE} from './defenseConfig';

// Combat coordinates remain local to the clearing. The renderer also includes its canopy.
export const DEFENSE_FIELD={width:RULES.width,top:LANDSCAPE_BATTLE?0:100,height:RULES.height+(LANDSCAPE_BATTLE?0:100)} as const;
export const FOREST_TERRAIN_URL=`${import.meta.env.BASE_URL}assets/battlefields/forest-clearing-v1.png`;
export interface FieldViewport {left:number;top:number;width:number;height:number;}
export function fieldToScreen(rect:FieldViewport,p:{x:number;y:number}):{x:number;y:number}{
  return {x:rect.left+p.x*rect.width/DEFENSE_FIELD.width,y:rect.top+(p.y+DEFENSE_FIELD.top)*rect.height/DEFENSE_FIELD.height};
}
export function screenToField(rect:FieldViewport,p:{x:number;y:number}):{x:number;y:number}{
  return {x:(p.x-rect.left)*DEFENSE_FIELD.width/rect.width,y:(p.y-rect.top)*DEFENSE_FIELD.height/rect.height-DEFENSE_FIELD.top};
}

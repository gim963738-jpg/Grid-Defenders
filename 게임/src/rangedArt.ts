import {BLOND_WAVE_BODY_HEIGHT,BLOND_BOSS_BODY_HEIGHT} from './blondArt';

export const RANGED_IDLE_URL=`${import.meta.env.BASE_URL}assets/heroes/ranged-idle.png`;
// Measured source landmarks: hair crown through boot soles, excluding the staff.
export const RANGED_SOURCE={width:1199,height:1312,bodyTop:318,footY:1289} as const;
export const RANGED_SOURCE_BODY_HEIGHT=RANGED_SOURCE.footY-RANGED_SOURCE.bodyTop;
export function rangedPlacement(x:number,footY:number,bodyHeight:number=BLOND_WAVE_BODY_HEIGHT){
 const scale=bodyHeight/RANGED_SOURCE_BODY_HEIGHT;
 return {x,y:footY,width:RANGED_SOURCE.width*scale,height:RANGED_SOURCE.height*scale,anchorX:.5,anchorY:RANGED_SOURCE.footY/RANGED_SOURCE.height};
}
export function rangedBossImage():string{
 const p=rangedPlacement(26,68.5625,BLOND_BOSS_BODY_HEIGHT);
 return `<svg class="boss-ranged-frame" data-body-height="${BLOND_BOSS_BODY_HEIGHT}" viewBox="0 0 52 73.125" overflow="visible" aria-hidden="true"><image href="${RANGED_IDLE_URL}" x="${p.x-p.width*p.anchorX}" y="${p.y-p.height*p.anchorY}" width="${p.width}" height="${p.height}"/></svg>`;
}

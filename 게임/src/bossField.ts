import {LANDSCAPE_BATTLE} from './defenseConfig';

// Keep world units square across the full 20:9 mobile field and the original 16:9 field.
export const BOSS_FIELD={width:LANDSCAPE_BATTLE?1250:1000,height:562.5,alliesWidth:LANDSCAPE_BATTLE?337.5:281.25} as const;

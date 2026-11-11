export const BLOND_DIRECTIONS=['front','front-right','right','back-right','back','back-left','left','front-left'] as const;
export interface BlondWalk {direction:number;moving:boolean;elapsed:number;}
export function blondDirection(dx:number,dy:number,fallback=2):number{
  if(!Number.isFinite(dx)||!Number.isFinite(dy)||Math.hypot(dx,dy)<1e-6)return fallback;
  return (2-Math.round(Math.atan2(dy,dx)/(Math.PI/4))+8)%8;
}

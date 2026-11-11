// The landscape placement grid and trail use the same combat coordinates.
export const LANDSCAPE_GRID = {left:160,top:84,columns:5,rows:4,cellWidth:58,cellHeight:42} as const;
export const LANDSCAPE_TRAIL = {
  width:LANDSCAPE_GRID.cellWidth,
  left:LANDSCAPE_GRID.left-LANDSCAPE_GRID.cellWidth/2,
  right:LANDSCAPE_GRID.left+(LANDSCAPE_GRID.columns+.5)*LANDSCAPE_GRID.cellWidth,
  top:68,bottom:264,
} as const;

export function landscapeTrailPath():[number,number][] {
  const {left,right,top,bottom}=LANDSCAPE_TRAIL;
  return [[left,top],[right,top],[right,bottom],[left,bottom]];
}

export function landscapeTerrain():string {
  // Tile and mirror a soil-only crop of the original field. Curved source
  // corners must not introduce grass patches into the new square corners.
  const {left,top,columns,rows,cellWidth,cellHeight}=LANDSCAPE_GRID;
  const outerLeft=LANDSCAPE_TRAIL.left-LANDSCAPE_TRAIL.width/2;
  const outerRight=LANDSCAPE_TRAIL.right+LANDSCAPE_TRAIL.width/2;
  const outerTop=LANDSCAPE_TRAIL.top*2-top;
  const outerBottom=LANDSCAPE_TRAIL.bottom*2-(top+rows*cellHeight);
  return `<svg viewBox="0 0 800 360" aria-hidden="true" focusable="false">
    <defs>
      <image id="live-trail-texture" href="${import.meta.env.BASE_URL}assets/battlefields/forest-clearing-v1.png" width="1194" height="1317"/>
      <svg id="live-trail-soil" viewBox="280 372 640 32" width="320" height="16" preserveAspectRatio="none" overflow="hidden"><use href="#live-trail-texture"/></svg>
      <pattern id="live-trail-soil-pattern" patternUnits="userSpaceOnUse" width="640" height="32">
        <rect width="640" height="32" fill="#d9af68"/>
        <use href="#live-trail-soil"/>
        <use href="#live-trail-soil" transform="translate(640 0) scale(-1 1)"/>
        <use href="#live-trail-soil" transform="translate(0 32) scale(1 -1)"/>
        <use href="#live-trail-soil" transform="translate(640 32) scale(-1 -1)"/>
      </pattern>
      <filter id="live-trail-soft-rim" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="1.5"/></filter>
      <mask id="live-trail-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="800" height="360">
        <rect x="${outerLeft}" y="${outerTop}" width="${outerRight-outerLeft}" height="${outerBottom-outerTop}" fill="white" filter="url(#live-trail-soft-rim)"/>
        <rect x="${left-2}" y="${top-2}" width="${columns*cellWidth+4}" height="${rows*cellHeight+4}" fill="black" filter="url(#live-trail-soft-rim)"/>
      </mask>
    </defs>
    <rect width="800" height="360" fill="url(#live-trail-soil-pattern)" mask="url(#live-trail-mask)"/>
  </svg>`;
}

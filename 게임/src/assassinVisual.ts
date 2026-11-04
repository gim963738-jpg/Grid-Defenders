import type {SkillFrameSpec} from './skillVisual';
export type AssassinArtRow='basic'|'wave'|'boss'|'impact';
/** Explicit cells: the supplied sheet has nonuniform common-effect spacing and no wave label 12. */
export function assassinFrameSpec(row:AssassinArtRow,frame:number):SkillFrameSpec {
 if(row==='impact'){
  const rects=[[25,864,133,114],[181,864,111,114],[296,864,93,114],[390,864,120,114],[510,864,136,114],[647,860,143,118],[790,860,144,118],[938,860,104,118],[1050,860,147,118]];
  const [x,y,width,height]=rects[Math.max(0,Math.min(8,frame-1))];
  return {x,y,width,height,background:'dark',pivot:{x:width/2,y:height*.58}};
 }
 const wave=row==='wave',n=Math.max(1,Math.min(wave?16:row==='basic'?12:24,frame));
 const edges=wave?[15,114,214,314,415,516,617,718,819,920,1021,1122,1223,1323,1424,1527]:[20,148,273,398,523,648,773,898,1023,1149,1274,1400,1528];
 const i=wave?(n<=11?n-1:n===12?10:n-2):(n-1)%12;
 const x=edges[i]+2,y=wave?280:row==='basic'?56:n<=12?507:643;
 const width=edges[i+1]-edges[i]-4,height=wave?129:row==='basic'?122:n<=12?101:108;
 const actor=row==='basic'||wave&&n<=9||row==='boss'&&(n<=19||n===21);
 // The jump is already drawn into the source: preserve the actor at its actual height in each frame.
 const jumpBodies=[[.38,.76,.30,.35],[.43,.75,.30,.35],[.43,.60,.32,.34],[.43,.43,.35,.30],[.44,.34,.32,.30],[.42,.35,.35,.31],[.38,.64,.31,.35],[.44,.79,.32,.28],[.43,.80,.32,.28]];
 const [cx,cy,rx,ry]=wave&&actor?jumpBodies[n-1]:[.40,.62,.30,.43];
 return {x,y,width,height,background:'dark',pivot:{x:width/2,y:height-3},
  actor:actor?{x:width*cx,y:height*cy,rx:width*rx,ry:height*ry}:undefined};
}

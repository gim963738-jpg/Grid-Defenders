import {LANDSCAPE_GRID as grid,LANDSCAPE_TRAIL as road,landscapeTrailPath} from '../src/landscapeField';
import {LANDSCAPE_BATTLE,PATH,SLOTS} from '../src/defenseConfig';
import {pathPoint} from '../src/defense';
import {fieldToScreen,screenToField} from '../src/defenseFieldLayout';

export function checkLandscapeField(){
  const passed:string[]=[];
  const check=(ok:boolean,name:string)=>{if(!ok)throw Error(name);passed.push(name);};
  const close=(a:number,b:number)=>Math.abs(a-b)<1e-7;
  const path=landscapeTrailPath(),right=grid.left+grid.columns*grid.cellWidth,bottom=grid.top+grid.rows*grid.cellHeight;
  check(close(road.left+road.width/2,grid.left)&&close(road.right-road.width/2,right),'both vertical inner road edges meet the placement grid');
  check(road.width===grid.cellWidth,'vertical road width equals one horizontal tile');
  check(path.length===4,'rectangular trail has exactly four corners');
  check(path.every((p,i)=>{const next=path[(i+1)%path.length];return (p[0]===next[0])!==(p[1]===next[1]);}),'all four road segments are horizontal or vertical');
  check(close(Math.min(...path.map(p=>p[0])),road.left)&&close(Math.max(...path.map(p=>p[0])),road.right),'path follows both vertical road centers');
  check(close(Math.min(...path.map(p=>p[1])),road.top)&&close(Math.max(...path.map(p=>p[1])),road.bottom),'upper and lower centerline positions are preserved');
  const lengths=path.map((p,i)=>Math.hypot(path[(i+1)%path.length][0]-p[0],path[(i+1)%path.length][1]-p[1]));
  check(lengths.every(n=>n>0),'no duplicate or zero-length road segments');
  const samples:{x:number;y:number}[]=[];
  for(let i=0;i<path.length;i++){
    const a=path[i],b=path[(i+1)%path.length];
    for(let t=0;t<=1;t+=.1)samples.push({x:a[0]+(b[0]-a[0])*t,y:a[1]+(b[1]-a[1])*t});
  }
  check(samples.every(({x,y})=>!(x>grid.left&&x<right&&y>grid.top&&y<bottom)),'every straight segment and turn stays outside all placement tiles');
  if(LANDSCAPE_BATTLE){
    check(JSON.stringify(PATH)===JSON.stringify(path),'combat uses the same path as the painted road');
    check(SLOTS.length===20&&SLOTS.every((p,i)=>p.x===189+i%5*58&&p.y===105+Math.floor(i/5)*42),'all twenty original deployment positions stay unchanged');
    const perimeter=lengths.reduce((a,b)=>a+b,0);
    check(Math.hypot(pathPoint(perimeter).x-PATH[0][0],pathPoint(perimeter).y-PATH[0][1])<1e-7,'monster path loops continuously');
    check(Math.hypot(pathPoint(perimeter-.1).x-pathPoint(.1).x,pathPoint(perimeter-.1).y-pathPoint(.1).y)<.21,'monster motion has no jump at the loop seam');
    for(const width of [800,640]){
      const rect={left:13,top:27,width,height:width*360/800};
      let aligned=true;
      for(let distance=0;distance<perimeter;distance+=17){
        const p=pathPoint(distance),back=screenToField(rect,fieldToScreen(rect,p));
        aligned=aligned&&close(back.x,p.x)&&close(back.y,p.y);
      }
      check(aligned,`entire monster route retains position at screen width ${width}`);
    }
  }
  return passed;
}

import {Defense} from '../src/defense';
import {ITEMS,rotated} from '../src/defenseConfig';
import {GALE_SWORD_URL,hasItemArt,itemArt} from '../src/itemArt';
export async function checkGaleArt(){
 const passed:string[]=[];const check=(ok:boolean,s:string)=>{if(!ok)throw Error(s);passed.push(s);};const sword=ITEMS.find(i=>i.id==='I08')!;
 check(JSON.stringify(sword.cells)==='[[0,0],[0,1],[1,1]]','gale sword keeps the approved three-cell L footprint');
 check(hasItemArt(sword)&&sword.attack===20&&sword.speed===.15&&sword.price===150,'approved gale art keeps existing balance');
 for(let turns=0;turns<4;turns++){
  const cells=rotated(sword.cells,turns),first=cells.slice().sort((a,b)=>a[1]-b[1]||a[0]-b[0])[0];
  check(cells.length===3&&cells.some(([x,y])=>x===first[0]&&y===first[1])&&itemArt(sword,turns).includes(`rotate(${turns*90} 512 512)`),'rotation '+turns+' uses a complete rotated icon and an occupied anchor');
 }
 const g=new Defense(()=>1);g.summon('melee',0);g.shop[0]=sword;g.shopDiscounts[0]=false;check(g.buy(0,{x:0,y:0},g.units[0].id)&&g.gear[0].owner===g.units[0].id,'gale sword can be bought directly into hero board');
 g.devEquipHero(g.units[0].id);check(g.gear.filter(i=>i.owner===g.units[0].id&&i.def.id==='I08').length===5,'test equipment still fits five gale swords');
 const image=new Image();image.src=GALE_SWORD_URL;await image.decode();const c=document.createElement('canvas');c.width=image.width;c.height=image.height;const ctx=c.getContext('2d')!;ctx.drawImage(image,0,0);
 check(ctx.getImageData(0,0,1,1).data[3]===0,'gale sword outer backdrop is transparent');
 check(ctx.getImageData(Math.floor(c.width*.9),Math.floor(c.height*.1),1,1).data[3]===0,'missing upper-right L cell stays transparent');
 return passed;
}

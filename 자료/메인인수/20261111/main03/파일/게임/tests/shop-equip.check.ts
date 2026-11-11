import {Defense} from '../src/defense';
import {ITEMS,GRID} from '../src/defenseConfig';
import {hasItemArt,itemArt,ITEM_ATLAS_URL} from '../src/itemArt';
export async function checkShopEquip(){
 const passed:string[]=[];const check=(ok:boolean,s:string)=>{if(!ok)throw Error(s);passed.push(s);};
 const g=new Defense(()=>1);g.summon('melee',0);const hero=g.units[0];g.shop=[ITEMS[0],ITEMS[1],ITEMS[2]];g.shopDiscounts=[true,false,false];const before=g.gold;
 check(g.buy(0,{x:1,y:2},hero.id),'shop can buy directly into selected hero equipment');
 check(g.gear[0].owner===hero.id&&g.gear[0].x===1&&g.gear[0].y===2&&g.gold===before-30&&g.gear[0].costBasis===30,'direct purchase preserves requested position, discount and cost basis');
 check(!g.buy(0,undefined,hero.id)&&g.gold===before-30,'sold-out product cannot charge twice');
 const snap=()=>JSON.stringify({gold:g.gold,shop:g.shop,gear:g.gear});let state=snap();check(!g.buy(1,undefined,999)&&snap()===state,'invalid hero rejects purchase without changing inventory or gold');
 g.gold=0;state=snap();check(!g.buy(1,undefined,hero.id)&&snap()===state,'insufficient gold leaves item for sale');g.gold=1000;
 for(let i=0;i<20;i++)g.gear.push({id:100+i,def:ITEMS[4],owner:hero.id,x:i%GRID.columns,y:Math.floor(i/GRID.columns),turns:0,order:i+10,costBasis:100});
 state=snap();check(!g.buy(1,undefined,hero.id)&&snap()===state,'full hero board rejects payment and preserves product');
 check(g.buy(1)&&g.gear.at(-1)!.owner===null,'normal bag purchase remains available even when hero board is full');
 check(ITEMS.slice(0,5).every(hasItemArt)&&!hasItemArt(ITEMS[5]),'tier-one equipment retains art and unassigned higher-tier items retain blocks');
 check(ITEMS.slice(0,5).every(item=>itemArt(item).includes('equipment-item-art')&&itemArt(item).includes(ITEM_ATLAS_URL)),'all five icons reference shared complete atlas');
 const image=new Image();image.src=ITEM_ATLAS_URL;await image.decode();const c=document.createElement('canvas');c.width=image.width;c.height=image.height;const ctx=c.getContext('2d')!;ctx.drawImage(image,0,0);
 check(ctx.getImageData(0,0,1,1).data[3]===0&&ctx.getImageData(20,500,1,1).data[3]===0,'atlas background is truly transparent');
 check(ctx.getImageData(200,500,1,1).data[3]>240,'sword body remains opaque without a grid line');
 return passed;
}

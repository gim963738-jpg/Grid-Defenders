import {recipeForTypes,type Defense} from './defense';
import {rotated,type ItemDef,type Cell} from './defenseConfig';

export type InventoryPick = {kind:'gear';id:number}|{kind:'offer';index:number};
export interface InventoryPlacement {
  owner:number|null;
  x:number;y:number;turns:number;
  cells:Cell[];
  allowed:boolean;
  warning:boolean;
  reason:string;
}

export function pickedItem(game:Defense,pick:InventoryPick):{def:ItemDef;id:number;turns:number}|null {
  if(pick.kind==='gear')return game.gear.find(item=>item.id===pick.id)??null;
  const def=game.shop[pick.index];
  return def?{def,id:-1,turns:0}:null;
}

/** The preview and pointer-up use this same, side-effect-free placement calculation. */
export function inventoryPlacement(game:Defense,pick:InventoryPick,owner:number|null,x:number,y:number):InventoryPlacement|null {
  const item=pickedItem(game,pick);
  if(!item)return null;
  const result:InventoryPlacement={owner,x,y,turns:item.turns,cells:rotated(item.def.cells,item.turns),allowed:false,warning:true,reason:''};
  if(!Number.isInteger(x)||!Number.isInteger(y))return {...result,reason:'유효한 장비 칸을 선택하세요.'};
  if(owner!==null&&!game.heroes().some(hero=>hero.id===owner))return {...result,reason:'장비를 받을 영웅을 선택하세요.'};
  const position=pick.kind==='offer'
    ?owner===null?game.purchasePosition(item.def,{x,y}):game.nearestFree(item,owner,x,y,0)
    :game.correctedPosition(item,owner,x,y,item.turns);
  if(!position)return {...result,reason:'장비칸에 빈 공간이 없습니다.'};
  Object.assign(result,position);
  // Hero overlaps are intentionally permitted by the original engine, but remain inactive.
  // Bag overlaps are rejected. Neither destination may extend beyond its board.
  const free=game.canPlace(item,owner,position.x,position.y,item.turns);
  if(game.outside(item,owner,position.x,position.y,item.turns))return {...result,reason:'장비칸 밖에는 배치할 수 없습니다.'};
  if(pick.kind==='offer'&&game.gold<game.shopPrice(pick.index))return {...result,reason:'구매 골드가 부족합니다.'};
  if(owner===null&&!free)return {...result,reason:'가방 아이템이 겹칩니다.'};
  result.allowed=true;
  result.warning=!free;
  result.reason=free?'배치 가능':'겹치는 장비는 능력치가 비활성화됩니다.';
  return result;
}

export function commitInventoryPlacement(game:Defense,pick:InventoryPick,placement:InventoryPlacement):boolean {
  const current=inventoryPlacement(game,pick,placement.owner,placement.x,placement.y);
  if(!current?.allowed)return game.note(current?.reason??'아이템을 찾을 수 없습니다.');
  if(pick.kind==='offer')return game.buy(pick.index,{x:current.x,y:current.y},current.owner);
  return current.owner===null
    ?game.placeInBag(pick.id,current.x,current.y,current.turns)
    :game.equip(pick.id,current.owner,current.x,current.y,current.turns);
}

export function combinationPartners(game:Defense,pick:InventoryPick):number[] {
  const item=pickedItem(game,pick);
  return item?game.gear.filter(other=>other.id!==item.id&&recipeForTypes(item.def.id,other.def.id)).map(other=>other.id):[];
}

/** All visible owners get the same non-reusing pair order as the model's combine action. */
export function inventoryCombinationLinks(game:Defense):{a:number;b:number;ready:boolean}[] {
  const links:{a:number;b:number;ready:boolean}[]=[];
  for(const owner of [null,...game.heroes().map(hero=>hero.id)]){
    const plan=new Set(game.combinationPlan(owner).map(pair=>pair.join(',')));
    for(const [a,b] of game.adjacentPairs(owner))links.push({a,b,ready:plan.has(`${a},${b}`)});
  }
  return links;
}

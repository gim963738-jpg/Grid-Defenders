import type {ItemDef} from './defenseConfig';
export const ITEM_ATLAS_URL=`${import.meta.env.BASE_URL}assets/items/tier1-equipment-atlas.png`;
export const GALE_SWORD_URL=`${import.meta.env.BASE_URL}assets/items/gale-sword.png`;
const crops:Record<string,number[]>={I01:[90,275,190,495],I02:[335,290,292,480],I03:[640,295,267,460],I04:[950,285,210,480],I05:[1200,395,285,300]};
export const hasItemArt=(item:ItemDef)=>item.id==='I08'||!!crops[item.id];
/** One complete image over the occupied footprint, never one fragment per cell. */
export function itemArt(item:ItemDef,rotation=0):string {
 if(item.id==='I08')return `<svg class="equipment-item-art" viewBox="0 0 1024 1024" aria-hidden="true"><image href="${GALE_SWORD_URL}" width="1024" height="1024" transform="rotate(${((rotation%4+4)%4)*90} 512 512)"/></svg>`;
 const crop=crops[item.id];if(!crop)return '';const [x,y,w,h]=crop,q=((rotation+(item.id==='I05'?0:3))%4+4)%4;
 const transforms=['',`translate(${h} 0) rotate(90)`,`translate(${w} ${h}) rotate(180)`,`translate(0 ${w}) rotate(270)`];
 return `<svg class="equipment-item-art" viewBox="0 0 ${q%2?h:w} ${q%2?w:h}" aria-hidden="true"><g transform="${transforms[q]}"><svg width="${w}" height="${h}" viewBox="${x} ${y} ${w} ${h}"><image href="${ITEM_ATLAS_URL}" width="1536" height="1024"/></svg></g></svg>`;
}

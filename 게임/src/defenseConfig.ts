export const LANDSCAPE_BATTLE=typeof location!=='undefined'&&location.pathname.endsWith('/battle-landscape.html');
// WEB-002 시험 수치. 최종 밸런스가 아니다.
export const RULES = { width: LANDSCAPE_BATTLE?800:390, height: LANDSCAPE_BATTLE?360:330, initialGold: 480, maxEnemies: 30,
  spawnSeconds: 2.4, killGold: 12, heroLimit: 3, rerollGold: 20, shopSlots:5, shopDiscountChance:0.2,
  soldierCritChance:0.1, heroCritChance:0.1, critMultiplier:1.5, waveSeconds:30, bossEvery:10, waveMonsters:10, waveSpawnSeconds:2, namedEvery:5, bountyEvery:3, bountyStackLimit:3, bountyHp:1600, bountySpeed:32, bountyGold:100, bountyAnvils:1 } as const;
export type DamageType = 'physical' | 'magic';
export type DefenseType = 'normal' | 'physical' | 'magic';
export const DAMAGE_LABEL:Record<DamageType,string>={physical:'물리',magic:'마법'};
export const DEFENSE_LABEL:Record<DefenseType,string>={normal:'일반형',physical:'물리 방어형',magic:'마법 방어형'};
export type UnitKind = 'guard' | 'archer' | 'mage' | 'tank' | 'melee' | 'ranged' | 'healer' | 'arcanist' | 'assassin';
export interface UnitDef { name: string; icon: string; hero: boolean; cost: number;
  attack: number; damageType:DamageType; rate: number; range: number; hp: number; armor: number; magicArmor:number; color: number; }
export const UNITS: Record<UnitKind, UnitDef> = {
  guard: { damageType:'physical',magicArmor:10,name:'보병',icon:'검',hero:false,cost:50,attack:26,rate:1,range:130,hp:400,armor:20,color:0x8bb8df },
  archer: { damageType:'physical',magicArmor:5,name:'궁병',icon:'궁',hero:false,cost:75,attack:30,rate:1.2,range:230,hp:260,armor:10,color:0x70d9a0 },
  mage: { damageType:'magic',magicArmor:15,name:'마법병',icon:'마',hero:false,cost:90,attack:48,rate:0.7,range:190,hp:240,armor:8,color:0xb9a0ef },
  tank: { damageType:'physical',magicArmor:45,name:'탱커',icon:'방',hero:true,cost:0,attack:45,rate:0.8,range:130,hp:2200,armor:65,color:0xf3c76c },
  melee: { damageType:'physical',magicArmor:15,name:'근접 딜러',icon:'검',hero:true,cost:0,attack:90,rate:1,range:130,hp:1100,armor:25,color:0xfa9583 },
  ranged: { damageType:'magic',magicArmor:20,name:'원거리 딜러',icon:'술',hero:true,cost:0,attack:75,rate:1,range:230,hp:800,armor:15,color:0xb9a0ef },
  healer: { damageType:'magic',magicArmor:35,name:'힐러',icon:'빛',hero:true,cost:0,attack:35,rate:1,range:210,hp:950,armor:20,color:0x70dbcf },
  arcanist:{damageType:'magic',magicArmor:35,name:'마법 딜러',icon:'법',hero:true,cost:0,attack:100,rate:.8,range:240,hp:780,armor:15,color:0xbe93ed},
  assassin:{damageType:'physical',magicArmor:15,name:'암살자',icon:'암',hero:true,cost:0,attack:100,rate:1.2,range:130,hp:1000,armor:25,color:0xf16e79},
};
export type Cell = [number, number];
export interface ItemDef { id:string; name:string; short:string; cells:Cell[]; color:string;
  price:number; attack?:number; armor?:number; magicArmor?:number; hp?:number; speed?:number; regen?:number; gold?:number; description:string; }
export const ITEMS: ItemDef[] = [
  {id:'I01',name:'철검',short:'검',cells:[[0,0],[1,0]],color:'#809bb9',price:60,attack:15,description:'공격력 +15'},
  {id:'I02',name:'수호 방패',short:'방',cells:[[0,0],[1,0]],color:'#719aaf',price:60,armor:20,description:'물리 방어력 +20'},
  {id:'I03',name:'가속 룬',short:'속',cells:[[0,0],[1,0]],color:'#9a92c7',price:70,speed:0.1,description:'공격속도 +10%'},
  {id:'I04',name:'활력의 수정',short:'체',cells:[[0,0],[1,0]],color:'#ae8192',price:60,hp:150,description:'체력 +150'},
  {id:'I05',name:'황금 주머니',short:'금',cells:[[0,0]],color:'#c7a85c',price:100,gold:0.1,description:'골드 획득 +10%'},
  {id:'I06',name:'정밀 검',short:'정',cells:[[0,0],[1,0],[2,0]],color:'#67ad8b',price:150,attack:40,description:'공격력 +40'},
  {id:'I07',name:'룬 방패',short:'룬',cells:[[0,0],[0,1],[1,1]],color:'#67a3a2',price:160,armor:35,hp:200,description:'물리 방어력 +35 · 체력 +200'},
  {id:'I08',name:'질풍의 검',short:'질',cells:[[0,0],[0,1],[1,1]],color:'#83ae74',price:150,attack:20,speed:0.15,description:'공격력 +20 · 공속 +15%'},
  {id:'I09',name:'재생의 부적',short:'재',cells:[[0,0],[1,0],[2,0]],color:'#6eac90',price:160,hp:350,regen:10,description:'체력 +350 · 초당 회복 +10'},
  {id:'I10',name:'시험용 대형 방패',short:'대',cells:[[0,0],[1,0],[2,0],[0,1],[1,1],[2,1],[0,2],[1,2],[2,2]],color:'#668fb0',price:120,armor:50,hp:500,description:'시험용 3×3 · 물리 방어력 +50 · 체력 +500'},
  {id:'I11',name:'시험용 장창',short:'창',cells:[[0,0],[1,0],[2,0],[3,0]],color:'#c59463',price:100,attack:35,description:'시험용 4×1 · 공격력 +35'},
];
export const GRID = { columns:LANDSCAPE_BATTLE?5:4, rows:LANDSCAPE_BATTLE?4:5 } as const;
export const BAG_GRID = { columns:LANDSCAPE_BATTLE?7:5, rows:3 } as const;
export const RECIPES = [
  {id:'R01',materials:['I01','I01'],result:'I06'},
  {id:'R02',materials:['I02','I04'],result:'I07'},
  {id:'R03',materials:['I01','I03'],result:'I08'},
  {id:'R04',materials:['I04','I04'],result:'I09'},
] as const;
export const AREA_ATTACK = { guardHalfAngle:Math.PI/4, mageRadius:48 } as const;
// The painted trail has rounded bends; each short segment follows its road center.
export const PATH:Cell[]=(()=>{
  if(LANDSCAPE_BATTLE){const points:Cell[]=[[176,68]];for(const [cx,cy,angle]of [[434,116,-90],[434,216,0],[176,216,90],[176,116,180]])for(let i=0;i<=12;i++){if(angle===180&&i===12)continue;const a=(angle+i*90/12)*Math.PI/180;points.push([cx+Math.cos(a)*48,cy+Math.sin(a)*48]);}return points;}
  const points:Cell[]=[[56,28]];
  for(const [cx,cy,angle]of [[334,56,-90],[334,274,0],[56,274,90],[56,56,180]])
    for(let i=0;i<=8;i++){
      if(angle===180&&i===8)continue;
      const a=(angle+i*90/8)*Math.PI/180;points.push([cx+Math.cos(a)*28,cy+Math.sin(a)*28]);
    }
  return points;
})();
export const SLOTS = LANDSCAPE_BATTLE?Array.from({length:20},(_,i)=>({x:189+(i%5)*58,y:105+Math.floor(i/5)*42})):Array.from({length:16},(_,i)=>({x:99+(i%4)*64,y:81+Math.floor(i/4)*56}));
export function rotated(cells: Cell[], turns:number): Cell[] {
  let result=cells.map(([x,y]):Cell=>[x,y]);
  for(let i=0;i<(turns%4+4)%4;i++) {
    result=result.map(([x,y]):Cell=>[-y,x]);
    const minX=Math.min(...result.map(c=>c[0])),minY=Math.min(...result.map(c=>c[1]));
    result=result.map(([x,y]):Cell=>[x-minX,y-minY]);
  }
  return result;
}

export interface MonsterDef {id:string;name:string;defenseType:DefenseType;damageType:DamageType;hp:number;attack:number;armor:number;magicArmor:number;rate:number;speed:number;gold:number;named:boolean;}
export const MONSTERS:MonsterDef[]=[
  {id:'normal',name:'순환 괴물',defenseType:'normal',damageType:'physical',hp:160,attack:20,armor:10,magicArmor:10,rate:0.8,speed:43,gold:12,named:false},
  {id:'physical',name:'철갑 괴물',defenseType:'physical',damageType:'physical',hp:180,attack:25,armor:60,magicArmor:10,rate:0.7,speed:40,gold:12,named:false},
  {id:'magic',name:'비전 괴물',defenseType:'magic',damageType:'magic',hp:160,attack:25,armor:10,magicArmor:60,rate:0.8,speed:43,gold:12,named:false},
  {id:'named-physical',name:'강철 감시자',defenseType:'physical',damageType:'physical',hp:3200,attack:150,armor:120,magicArmor:40,rate:0.7,speed:27,gold:150,named:true},
  {id:'named-magic',name:'비전 파수꾼',defenseType:'magic',damageType:'magic',hp:2800,attack:170,armor:40,magicArmor:120,rate:0.8,speed:30,gold:150,named:true},
];

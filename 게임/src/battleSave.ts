import {createMotion} from './actorMotion';
import {pathPoint,type Defense} from './defense';
import type {BossBattle} from './bossBattle';
import type {DamageMeter} from './damageMeter';
import type {GameRun,RunMode} from './gameRun';
import {ITEMS,LANDSCAPE_BATTLE,RULES,SLOTS,UNITS} from './defenseConfig';
import {COMBAT_SPEEDS} from './combatPlayback';
import {FORMATION,isFormationCell,canPlaceFormationUnit,type FormationUnit,type FormationPlacement} from './battleFormation';

export type BattleLayout='landscape'|'portrait';
export type BattleSaveStorage=Pick<Storage,'getItem'|'setItem'|'removeItem'>;
export const BATTLE_SAVE_VERSION=1;
export const BATTLE_SAVE_PREFIX='grid-defenders.battle-save.v1';
export const battleLayout:BattleLayout=LANDSCAPE_BATTLE?'landscape':'portrait';
export interface BattleSaveMeta {
 runId:string;scene:'defense'|'boss';activeBossWave:number|null;bossReturnDelay:number;
 bossTestMode:boolean;bossEncounterWave:number;defeatedBossEnemies:string[];combatPaused:boolean;
}
type Value=null|boolean|number|string|Value[]|{[key:string]:Value};
type Fields=Record<string,Value>;
export interface BattleSave {
 version:typeof BATTLE_SAVE_VERSION;layout:BattleLayout;mode:RunMode;savedAt:number;
 meta:BattleSaveMeta;
 defense:Fields&{wave:number;gold:number;elapsed:number};boss:Fields;run:Fields;
}
type Validator=(value:unknown)=>boolean;
const object=(v:unknown):v is Record<string,unknown>=>v!==null&&typeof v==='object'&&!Array.isArray(v)&&Object.getPrototypeOf(v)===Object.prototype;
const number:Validator=v=>typeof v==='number'&&Number.isFinite(v)&&Math.abs(v)<=Number.MAX_SAFE_INTEGER;
const positive:Validator=v=>number(v)&&(v as number)>0;
const nonnegative:Validator=v=>number(v)&&(v as number)>=0;
const integer:Validator=v=>nonnegative(v)&&Number.isSafeInteger(v);
const id:Validator=v=>integer(v)&&(v as number)>0;
const bool:Validator=v=>typeof v==='boolean';
const text:Validator=v=>typeof v==='string'&&v.length<=2048;
const token:Validator=v=>text(v)&&(v as string).length>0&&(v as string).length<=128;
const choice=(...values:unknown[]):Validator=>v=>values.includes(v);
const nullable=(validate:Validator):Validator=>v=>v===null||validate(v);
const list=(validate:Validator,max=10000):Validator=>v=>Array.isArray(v)&&v.length<=max&&v.every(validate);
const shape=(required:Record<string,Validator>,optional:Record<string,Validator>={}):Validator=>v=>object(v)&&
 Object.keys(required).every(k=>Object.hasOwn(v,k)&&required[k](v[k]))&&
 Object.keys(v).every(k=>Object.hasOwn(required,k)||Object.hasOwn(optional,k)&&optional[k](v[k]));
const fields=(names:string,validate:Validator=number)=>Object.fromEntries(names.split(' ').map(name=>[name,validate]));
const map=(key:Validator,value:Validator):Validator=>v=>list(row=>Array.isArray(row)&&row.length===2&&key(row[0])&&value(row[1]))(v)&&
 new Set((v as unknown[][]).map(row=>row[0])).size===(v as unknown[]).length;
const damageType=choice('physical','magic'),defenseType=choice('normal','physical','magic');
const kind:Validator=v=>typeof v==='string'&&Object.hasOwn(UNITS,v);
const itemId:Validator=v=>typeof v==='string'&&ITEMS.some(item=>item.id===v);
const position=shape(fields('x y'));
const motion=shape({clip:choice('01','02','03','04','05','06','07','08','walk','idle','weak','strong'),age:nonnegative,sequence:integer,targetId:nullable(v=>token(v)||id(v)),attack:nonnegative,critical:bool,hit:bool});
const unit=shape({id,kind,slot:v=>integer(v)&&(v as number)<SLOTS.length,level:id,spent:nonnegative,cooldown:number},{facing:v=>integer(v)&&(v as number)<8,motion});
const enemy=shape({id,...fields('distance x y hp maxHp speed attack armor magicArmor rate goldReward'),named:bool,name:text,defenseType,damageType,wave:id},{bounty:bool,armorBreakRemaining:nonnegative});
const stats=shape({...fields('attack physicalAttack magicAttack physicalArmor magicArmor rate range hp normalDamageMultiplier bossDamageMultiplier armor regen gold critChance critMultiplier'),damageType});
const actor=shape({id:token,side:choice('ally','enemy'),kind:v=>kind(v)||v==='boss'||v==='retainer',name:text,
 ...fields('x y hp maxHp attack rate range speed rank cooldown'),damageType,defenseType},
 {...fields('normalDamageMultiplier bossDamageMultiplier armorBreakRemaining level sourceSlot regen critChance critMultiplier physicalArmor magicArmor'),
  motion,walk:shape({direction:v=>integer(v)&&(v as number)<8,moving:bool,elapsed:nonnegative})});
const skill=shape({cooldown:number,casts:integer});
const critical={critical:bool};
const impact=shape({...fields('x y life'),kind:choice(1,2,5)});
const projectile=(source:Validator,target:Validator)=>shape({...fields('x y tx ty attack'),source,targetId:target},{...critical,skill:bool});
const fire=(source:Validator,target:Validator)=>shape({source,targetId:target,...fields('attack x y tx ty age footOffset'),stage:choice('flight','pillar'),hits:v=>integer(v)&&(v as number)<=3},critical);
const blade=(source:Validator,target:Validator)=>shape({source,targetId:target,...fields('attack x y age footOffset'),hits:v=>integer(v)&&(v as number)<=6},critical);
const sword=(source:Validator,target:Validator)=>shape({sourceId:source,targetId:target,...fields('attack age x y'),duration:positive,critical:bool,kind:choice(3,4,5),hit:bool,connected:bool},{cancelled:bool});
const assassin=(source:Validator,target:Validator)=>shape({source,sourceId:target,targets:list(target,3),kind:choice('basic','wave','boss'),
 attack:number,age:nonnegative,frameSeconds:positive,hits:v=>integer(v)&&(v as number)<=4,origin:position,direction:position,cancelled:bool},{...critical,impact:position});
const damageEntry=shape({id:token,name:text,color:text,damage:nonnegative});
const meterFields={entries:map(token,damageEntry),recent:list(shape({time:nonnegative,id:token,damage:nonnegative}),30000),
 recentTotals:map(token,nonnegative),recentTotal:nonnegative,clock:nonnegative};
const peaksFields={units:map(token,nonnegative),overall:nonnegative};
const meter=shape({...meterFields,peaks:shape(peaksFields)});
const damageSnapshot=shape({...fields('elapsed total dps peakDps',nonnegative),rows:list(shape({id:token,name:text,color:text,...fields('damage dps peakDps share',nonnegative)}))});
const log=shape({id,time:nonnegative,category:choice('damage','reward','economy'),text},{...fields('sourceId targetId attack damage hpBefore hpAfter goldBefore goldAfter goldDelta defenseMultiplier'),critical:bool,damageType,defenseType});
const defenseFields:Record<string,Validator>={
 ...fields('gold anvils kills elapsed normalKills bountySummons pendingBounties waveTime waveSpawned',nonnegative),
 ...fields('revision logRevision placementOrder',integer),...fields('wave nextDamageId nextLogId nextId',id),
 speed:choice(...COMBAT_SPEEDS),bossPending:bool,keepWaveMonsters:bool,message:text,
 units:list(unit,SLOTS.length),enemies:list(enemy,512),
 gear:list(shape({id,def:itemId,owner:nullable(id),x:integer,y:integer,turns:v=>integer(v)&&(v as number)<4,order:integer,costBasis:nonnegative}),1000),
 shop:v=>list(nullable(itemId),RULES.shopSlots)(v)&&(v as unknown[]).length===RULES.shopSlots,
 shopDiscounts:v=>list(bool,RULES.shopSlots)(v)&&(v as unknown[]).length===RULES.shopSlots,
 shots:list(shape(fields('x y tx ty life color'))),
 attackAreas:list(v=>shape({...fields('x y radius life color'),kind:choice('circle')})(v)||shape({...fields('x y radius life color angle halfAngle'),kind:choice('sector')})(v)),
 damageNumbers:list(shape({id,...fields('x y damage life'),critical:bool})),
 rangedSkills:map(id,shape({cooldown:number,shotsLeft:integer,delay:number,casts:integer})),
 meleeSkills:map(id,skill),assassinSkills:map(id,skill),swordSwingCounts:map(id,integer),
 fireCasts:list(fire(unit,id)),bladeCasts:list(blade(unit,id)),swordAttacks:list(sword(id,id)),
 assassinActions:list(assassin(unit,id)),assassinImpacts:list(impact),iceProjectiles:list(projectile(unit,id)),iceBursts:list(shape(fields('x y life'))),
 logs:shape({damage:list(log,100),reward:list(log,100),economy:list(log,100)}),
 lastWaveDamage:nullable(shape({wave:id,stats:damageSnapshot})),damageMeter:meter,
};
// Optional for version-one checkpoints created before the formation editor.
const defenseOptionalFields={formation:list(shape({unitId:id,cell:isFormationCell}),FORMATION.size),formationRows:choice(4,FORMATION.rows)};
const bossFields:Record<string,Validator>={
 encounter:integer,tuning:shape({healthScale:positive,attackScale:positive}),actors:list(actor,128),
 roster:list(shape({id,kind,slot:integer,level:id,stats},{formationCell:isFormationCell}),SLOTS.length),autoSkills:bool,
 ...fields('commanderCooldown commanderBuff heroSkillCooldown elapsed',nonnegative),
 result:choice('fighting','victory','defeat'),heroSkillCooldowns:map(token,number),swordSwingCounts:map(token,integer),
 hits:list(shape({from:token,to:token,...fields('x y damage life'),magic:bool},{ice:bool,sword:bool,critical:bool,splash:bool})),
 iceProjectiles:list(projectile(actor,token)),iceBursts:list(shape(fields('x y life'))),
 fireCasts:list(fire(actor,token)),bladeCasts:list(blade(actor,token)),swordAttacks:list(sword(token,token)),assassinActions:list(assassin(actor,token)),assassinImpacts:list(impact),damageMeter:meter,
};
const bossOptionalFields={preparationRemaining:v=>nonnegative(v)&&(v as number)<=3,motionVersion:choice(1)} satisfies Record<string,Validator>;
const runFields={mode:choice('normal','infinite-test'),active:choice(true),elapsed:nonnegative,result:choice(null)};
const meta=shape({runId:token,scene:choice('defense','boss'),activeBossWave:nullable(id),bossReturnDelay:nonnegative,bossTestMode:bool,
 bossEncounterWave:id,defeatedBossEnemies:list(token,10000),combatPaused:bool});
const envelope=shape({version:choice(BATTLE_SAVE_VERSION),layout:choice('landscape','portrait'),mode:runFields.mode,savedAt:nonnegative,
 meta,defense:shape(defenseFields,defenseOptionalFields),boss:shape(bossFields,bossOptionalFields),run:shape(runFields)});

// Only this version's named data fields are read/written. Model prototypes, RNG,
// training providers and the shared DamagePeaks instance never enter the save.
function copy(value:unknown):Value {
 if(value===null||typeof value==='boolean'||typeof value==='string')return value;
 if(typeof value==='number'&&Number.isFinite(value))return value;
 if(value instanceof Map)return [...value].map(([key,item])=>[copy(key),copy(item)]);
 if(Array.isArray(value))return value.map(copy);
 if(object(value)){
  const result:Fields={};
  for(const [key,item] of Object.entries(value)){
   if(key==='__proto__'||key==='constructor'||key==='prototype')throw Error('Unsafe saved property');
   if(item!==undefined)result[key]=copy(item);
  }
  return result;
 }
 throw Error('Unsupported battle data');
}
function readFields(model:object,schema:Record<string,Validator>,omit:readonly string[]=[]):Fields {
 const data:Fields={};for(const key of Object.keys(schema))if(!omit.includes(key))data[key]=copy(Reflect.get(model,key));return data;
}
function readMeter(model:DamageMeter):Fields {return {...readFields(model,meterFields),peaks:readFields(model.peaks,peaksFields)};}
function writeFields(model:object,data:Fields,omit:readonly string[]=[]):void {
 for(const [key,value] of Object.entries(data)){
  if(omit.includes(key))continue;
  const existing=Reflect.get(model,key);
  if(existing instanceof Map){existing.clear();for(const [k,v] of value as [Value,Value][])existing.set(k,v);}
  else Reflect.set(model,key,value);
 }
}
function writeMeter(model:DamageMeter,data:Fields):void {writeFields(model,data,['peaks']);writeFields(model.peaks,data.peaks as Fields);}
function unique(values:unknown[]):boolean{return new Set(values).size===values.length;}
function savedFormationCell(unit:FormationUnit,cell:number,rows:Value|undefined):boolean {
 // Old v1 checkpoints used four rows with no size marker. Shift them by one
 // row so front/middle/rear membership survives the new outside rows.
 return rows===FORMATION.rows?canPlaceFormationUnit(unit,cell):
  Number.isInteger(cell)&&cell>=0&&cell<28&&canPlaceFormationUnit(unit,cell+FORMATION.columns);
}
export function validBattleSave(value:unknown,layout:BattleLayout=battleLayout):value is BattleSave {
 if(!envelope(value))return false;
 const save=value as BattleSave;if(save.layout!==layout||save.mode!==save.run.mode)return false;
 const d=save.defense,units=d.units as Fields[],enemies=d.enemies as Fields[],gear=d.gear as Fields[],actors=save.boss.actors as Fields[];
 const allIds=[...units,...enemies,...gear].map(item=>item.id as number);
 if(!unique(allIds)||!unique(units.map(u=>u.slot))||!unique(actors.map(a=>a.id))||allIds.some(i=>i>=(d.nextId as number)))return false;
 if(units.filter(u=>UNITS[u.kind as keyof typeof UNITS].hero).length>RULES.heroLimit)return false;
 if(d.formation!==undefined){
  const placements=d.formation as Fields[];
  if(placements.length!==units.length||!unique(placements.map(p=>p.unitId))||!unique(placements.map(p=>p.cell)))return false;
  if(placements.some(p=>{const unit=units.find(u=>u.id===p.unitId);return !unit||!savedFormationCell(unit as unknown as FormationUnit,p.cell as number,d.formationRows);}))return false;
 }
 if((save.boss.roster as Fields[]).some(u=>u.formationCell!==undefined&&!savedFormationCell(u as unknown as FormationUnit,u.formationCell as number,d.formationRows)))return false;
 if(gear.some(item=>item.owner!==null&&!units.some(u=>u.id===item.owner&&UNITS[u.kind as keyof typeof UNITS].hero)))return false;
 if((d.waveTime as number)>RULES.waveSeconds||(d.waveSpawned as number)>RULES.waveMonsters)return false;
 if(save.mode==='normal'&&!d.keepWaveMonsters||save.mode==='infinite-test'&&d.keepWaveMonsters)return false;
 if(enemies.some(e=>(e.hp as number)<0||(e.maxHp as number)<=0||(e.hp as number)>(e.maxHp as number)))return false;
 if(actors.some(a=>(a.hp as number)<0||(a.maxHp as number)<=0||(a.hp as number)>(a.maxHp as number)))return false;
 if(gear.some(item=>(item.order as number)>(d.placementOrder as number)))return false;
 return true;
}
export function captureBattle(game:Defense,boss:BossBattle,run:GameRun,details:BattleSaveMeta,now=Date.now()):BattleSave|null {
 try {
  const defense=readFields(game,defenseFields,['damageMeter','gear','shop']);
  defense.formation=copy(game.formationSlots());
  defense.formationRows=FORMATION.rows;
  defense.damageMeter=readMeter(game.damageMeter);
  defense.gear=game.gear.map(item=>({...item,def:item.def.id}));
  defense.shop=game.shop.map(item=>item?.id??null);
  const bossData={...readFields(boss,bossOptionalFields),...readFields(boss,bossFields,['damageMeter','tuning'])};bossData.damageMeter=readMeter(boss.damageMeter);
  // The developer calibration passes a BossTestProfile, whose explanatory
  // timings also reach reset(). Only combat tuning belongs to persistent state.
  bossData.tuning={healthScale:boss.tuning.healthScale,attackScale:boss.tuning.attackScale};
  const save={version:BATTLE_SAVE_VERSION,layout:battleLayout,mode:run.mode,savedAt:now,meta:copy(details),defense,boss:bossData,run:readFields(run,runFields)};
  return validBattleSave(save)?save:null;
 }catch{return null;}
}
export function restoreBattle(value:unknown,game:Defense,boss:BossBattle,run:GameRun):BattleSaveMeta|null {
 try {
  // Validate and detach everything before touching a running model. No methods,
  // callbacks or class instances can be replaced by data loaded from storage.
  const save=copy(value);if(!validBattleSave(save))return null;
  const d=save.defense;
  if(d.formationRows!==FORMATION.rows){
   for(const p of (d.formation??[]) as Fields[])p.cell=(p.cell as number)+FORMATION.columns;
   for(const u of save.boss.roster as Fields[])if(u.formationCell!==undefined)u.formationCell=(u.formationCell as number)+FORMATION.columns;
  }
  writeFields(game,d,['damageMeter','gear','shop','formationRows']);
  // Distance is authoritative when a landscape checkpoint used an older road.
  if(LANDSCAPE_BATTLE)for(const enemy of game.enemies)Object.assign(enemy,pathPoint(enemy.distance));
  game.formation=(d.formation??[]) as unknown as FormationPlacement[];
  game.formationSlots();
  game.gear=(d.gear as Fields[]).map(item=>({...item,def:ITEMS.find(def=>def.id===item.def)!})) as unknown as Defense['gear'];
  game.shop=(d.shop as (string|null)[]).map(item=>item===null?null:ITEMS.find(def=>def.id===item)!);
  writeMeter(game.damageMeter,d.damageMeter as Fields);
  // Old v1 checkpoints were already fighting. Do not replay preparation or invent a pending hit.
  if(save.boss.motionVersion===undefined){
   save.boss.preparationRemaining=0;save.boss.motionVersion=1;
   for(const a of save.boss.actors as Fields[])if(a.kind==='blond')a.range=Math.max(0,(a.range as number)-30);
   for(const a of save.boss.roster as Fields[])if(a.kind==='blond'){const stats=a.stats as Fields;stats.range=Math.max(0,(stats.range as number)-30);}
   const actors=save.boss.actors as Fields[];
   if(actors.some(a=>a.kind==='boss')&&!actors.some(a=>a.id==='retainer-normal')){
    const tuning=save.boss.tuning as Fields;
    actors.push({id:'retainer-normal',side:'enemy',kind:'retainer',name:'노랑 친위대',x:805,y:281.25,hp:Math.ceil(1800*(tuning.healthScale as number)),maxHp:Math.ceil(1800*(tuning.healthScale as number)),attack:Math.floor(70*(tuning.attackScale as number)),rate:.8,range:50,speed:50,rank:0,damageType:'physical',defenseType:'normal',physicalArmor:25,magicArmor:25,cooldown:.25});
   }
  }
  writeFields(boss,save.boss,['damageMeter']);
  for(const a of boss.actors)if((a.kind==='blond'||a.kind==='boss')&&!a.motion)a.motion=createMotion(a.kind==='boss');writeMeter(boss.damageMeter,save.boss.damageMeter as Fields);
  writeFields(run,save.run);game.revision++;game.logRevision++;
  return save.meta;
 }catch{return null;}
}
export function battleSaveKey(mode:RunMode,layout:BattleLayout=battleLayout){return `${BATTLE_SAVE_PREFIX}.${layout}.${mode}`;}
export class BattleSaveStore {
 constructor(private storage?:BattleSaveStorage,readonly layout:BattleLayout=battleLayout){}
 load(mode:RunMode):BattleSave|null {
  try {const raw=this.storage?.getItem(battleSaveKey(mode,this.layout));if(!raw||raw.length>2_000_000)return null;
   const value:unknown=JSON.parse(raw);return validBattleSave(value,this.layout)&&value.mode===mode?value:null;
  }catch{return null;}
 }
 save(save:BattleSave):boolean {
  if(!this.storage||!validBattleSave(save,this.layout))return false;
  try{const encoded=JSON.stringify(save);if(encoded.length>2_000_000)return false;this.storage.setItem(battleSaveKey(save.mode,this.layout),encoded);return true;}catch{return false;}
 }
 clear(mode:RunMode,runId?:string):boolean {
  if(!this.storage)return false;
  try {if(runId&&this.load(mode)?.meta.runId!==runId)return false;this.storage.removeItem(battleSaveKey(mode,this.layout));return true;}catch{return false;}
 }
}
function storage():BattleSaveStorage|undefined{try{return typeof localStorage==='undefined'?undefined:localStorage;}catch{return undefined;}}
export const battleSaveStore=new BattleSaveStore(storage());

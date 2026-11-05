import type {RunResult} from './gameRun';
export const CAMP_PROGRESS_KEY='grid-defenders.camp-progress.v1';
export const FORMATION_KEY='grid-defenders.formation.v1';
export const FORMATION_SIZE=8;
type StorageLike=Pick<Storage,'getItem'|'setItem'>;
export interface BattleRecord extends RunResult {id:string;empireGold:number;finishedAt:number;}
interface CampProgress {records:BattleRecord[];bestWave:number;}
const nonnegative=(n:unknown):n is number=>typeof n==='number'&&Number.isFinite(n)&&n>=0;
function isRecord(r:unknown):r is BattleRecord {
 if(!r||typeof r!=='object')return false;const v=r as BattleRecord;
 return typeof v.id==='string'&&v.id.length>0&&v.id.length<=100&&['monster-limit','boss-defeat','boss-timeout'].includes(v.reason)&&Number.isSafeInteger(v.wave)&&v.wave>=1&&Number.isSafeInteger(v.kills)&&v.kills>=0&&nonnegative(v.seconds)&&Number.isSafeInteger(v.empireGold)&&v.empireGold>=0&&nonnegative(v.finishedAt);
}
export class CampProgressStore {
 constructor(private storage?:StorageLike){}
 snapshot():CampProgress {
  try{const raw=this.storage?.getItem(CAMP_PROGRESS_KEY);if(!raw)return {records:[],bestWave:0};const s=JSON.parse(raw),seen=new Set<string>();const records:BattleRecord[]=(Array.isArray(s.records)?s.records:[]).filter((r:unknown):r is BattleRecord=>{if(!isRecord(r)||seen.has(r.id))return false;seen.add(r.id);return true;}).slice(0,20);return {records,bestWave:Math.max(Number.isSafeInteger(s.bestWave)&&s.bestWave>=0?s.bestWave:0,...records.map(r=>r.wave))};}catch{return {records:[],bestWave:0};}
 }
 record(result:BattleRecord):boolean {
  if(!isRecord(result))return false;const s=this.snapshot();if(s.records.some(r=>r.id===result.id))return false;
  this.storage?.setItem(CAMP_PROGRESS_KEY,JSON.stringify({records:[{...result},...s.records].slice(0,20),bestWave:Math.max(s.bestWave,result.wave)}));return true;
 }
}
function storage():StorageLike|undefined{try{return typeof localStorage==='undefined'?undefined:localStorage;}catch{return undefined;}}
export const campProgress=new CampProgressStore(storage());
export function loadFormation(ownedIds:readonly string[],saved=storage()): (string|null)[]{
 const initial=Array.from({length:FORMATION_SIZE},(_,i)=>ownedIds[i]??null);
 try{const raw=saved?.getItem(FORMATION_KEY);if(!raw)return initial;const data=JSON.parse(raw);if(!Array.isArray(data.slots))return initial;const seen=new Set<string>();return Array.from({length:FORMATION_SIZE},(_,i)=>{const id=data.slots[i];if(typeof id!=='string'||!ownedIds.includes(id)||seen.has(id))return null;seen.add(id);return id;});}catch{return initial;}
}
export function saveFormation(slots:readonly (string|null)[],ownedIds:readonly string[],saved=storage()):void {
 const seen=new Set<string>();const cleaned=Array.from({length:FORMATION_SIZE},(_,i)=>{const id=slots[i];if(!id||!ownedIds.includes(id)||seen.has(id))return null;seen.add(id);return id;});saved?.setItem(FORMATION_KEY,JSON.stringify({slots:cleaned}));
}
export function battlePageUrl(current:string,mode:'normal'|'infinite-test'='normal'){
 const url=new URL('index.html',current);url.searchParams.set('battle',mode);url.searchParams.set('from','camp');return url.href;
}
export function campPageUrl(current:string,resultId?:string){const url=new URL('lobby-preview.html',current);if(resultId)url.searchParams.set('result',resultId);return url.href;}
export function launchMode(search:string):'normal'|'infinite-test'|null {const mode=new URLSearchParams(search).get('battle');return mode==='normal'||mode==='infinite-test'?mode:null;}

export function newBattleId():string{return globalThis.crypto?.randomUUID?.()??`${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;}

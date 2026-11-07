export const TRAINING_KEY='grid-defenders.training.v1';
export const TRAINING_CAP=10;
export const TRAINING_RULES={baseCost:100,killReward:10,waveReward:25} as const;
export const TRAININGS=[
 {id:'attack',name:'공격력',short:'공격',icon:'⚔',step:2},
 {id:'health',name:'체력',short:'체력',icon:'♥',step:2},
 {id:'normal',name:'일반 몬스터 피해',short:'일반 피해',icon:'♟',step:3},
 {id:'boss',name:'보스 몬스터 피해',short:'보스 피해',icon:'♛',step:3},
] as const;
export type TrainingId=typeof TRAININGS[number]['id'];
export interface TrainingState {rank:number;gold:number;levels:Record<TrainingId,number>;}
export interface TrainingBonuses {attackMultiplier:number;healthMultiplier:number;normalDamageMultiplier:number;bossDamageMultiplier:number;}
export const NO_TRAINING:TrainingBonuses={attackMultiplier:1,healthMultiplier:1,normalDamageMultiplier:1,bossDamageMultiplier:1};
type StorageLike=Pick<Storage,'getItem'|'setItem'>;
const initial=():TrainingState=>({rank:0,gold:0,levels:{attack:0,health:0,normal:0,boss:0}});
const integer=(n:unknown,max=Number.MAX_SAFE_INTEGER)=>typeof n==='number'&&Number.isSafeInteger(n)&&n>=0?Math.min(max,n):0;
const battleId=(id:unknown):id is string=>typeof id==='string'&&id.length>0&&id.length<=100;
/** Meta progression is shared by both unit types and both battle scenes. Combat gold is separate. */
export class TrainingProgress {
 private state=initial();
 private battleRewards=new Map<string,number>();
 constructor(private storage?:StorageLike){this.reload();}
 private reload():boolean {if(!this.storage)return true;try{const raw=this.storage.getItem(TRAINING_KEY);if(!raw){this.state=initial();this.battleRewards.clear();return true;}const s=JSON.parse(raw);this.state={rank:integer(s.rank,10000),gold:integer(s.gold),levels:Object.fromEntries(TRAININGS.map(t=>[t.id,integer(s.levels?.[t.id],10)])) as TrainingState['levels']};this.battleRewards=new Map((Array.isArray(s.battleRewards)?s.battleRewards:[]).filter((entry:unknown):entry is [string,number]=>Array.isArray(entry)&&entry.length===2&&battleId(entry[0])&&Number.isSafeInteger(entry[1])&&entry[1]>=0));return true;}catch{this.state=initial();this.battleRewards.clear();return false;}}
 snapshot():TrainingState {this.reload();return {...this.state,levels:{...this.state.levels}};}
 private save(next:TrainingState,rewards=this.battleRewards){this.storage?.setItem(TRAINING_KEY,JSON.stringify({...next,battleRewards:[...rewards]}));this.state=next;this.battleRewards=rewards;if(typeof window!=='undefined')window.dispatchEvent(new Event('training-change'));}
 cost(id:TrainingId):number|null {const s=this.snapshot();return s.levels[id]>=TRAINING_CAP?null:TRAINING_RULES.baseCost*(s.rank+1)*(s.levels[id]+1);}
 train(id:TrainingId):boolean {if(!TRAININGS.some(t=>t.id===id))return false;const s=this.snapshot(),cost=this.cost(id);if(cost===null||s.gold<cost)return false;this.save({...s,gold:s.gold-cost,levels:{...s.levels,[id]:s.levels[id]+1}});return true;}
 canPromote(){const s=this.snapshot();return TRAININGS.every(t=>s.levels[t.id]===TRAINING_CAP);}
 promote():boolean {if(!this.canPromote())return false;const s=this.snapshot();if(s.rank>=10000)return false;this.save({...s,rank:s.rank+1,levels:initial().levels});return true;}
 grant(amount:number):boolean {if(!Number.isSafeInteger(amount)||amount<=0)return false;const s=this.snapshot();if(!Number.isSafeInteger(s.gold+amount))return false;this.save({...s,gold:s.gold+amount});return true;}
 reward(wave:number,kills:number,runId?:string):number {
  const amount=integer(kills)*TRAINING_RULES.killReward+Math.max(0,integer(wave)-1)*TRAINING_RULES.waveReward;
  if(!Number.isSafeInteger(amount))return 0;
  if(runId===undefined)return amount>0&&this.grant(amount)?amount:0;
  if(!battleId(runId))return 0;
  if(!this.reload())throw Error('전투 보상 저장 기록을 읽지 못했습니다.');
  if(this.battleRewards.has(runId)||!Number.isSafeInteger(this.state.gold+amount))return 0;
  // Commit the wallet and receipt together. A failed write leaves both retryable.
  const rewards=new Map(this.battleRewards);rewards.set(runId,amount);
  this.save({...this.state,gold:this.state.gold+amount},rewards);return amount;
 }
 bonuses():TrainingBonuses {const s=this.snapshot(),bonus=(id:TrainingId)=>1+(s.rank*TRAINING_CAP+s.levels[id])*TRAININGS.find(t=>t.id===id)!.step/100;return {attackMultiplier:bonus('attack'),healthMultiplier:bonus('health'),normalDamageMultiplier:bonus('normal'),bossDamageMultiplier:bonus('boss')};}
}
function browserStorage():StorageLike|undefined {try{return typeof localStorage!=='undefined'?localStorage:undefined;}catch{return undefined;}}
export const trainingProgress=new TrainingProgress(browserStorage());

import {TrainingProgress,TRAININGS,TRAINING_KEY} from '../src/training';
import {Defense,pathPoint} from '../src/defense';
import {BossBattle,waveBossRoster} from '../src/bossBattle';
export function checkTraining(){
 const passed:string[]=[];const check=(ok:boolean,s:string)=>{if(!ok)throw Error(s);passed.push(s);};
 const data=new Map<string,string>(),storage={getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>{data.set(k,v);}};const p=new TrainingProgress(storage);
 check(p.snapshot().gold===0&&!p.canPromote()&&!p.promote(),'fresh training starts empty and cannot promote');
 check(!p.train('attack')&&p.snapshot().levels.attack===0,'insufficient empire gold cannot advance training');
 check(!p.grant(-100)&&!p.grant(1.5),'invalid currency grants cannot alter the wallet');p.grant(22000);
 for(const t of TRAININGS){for(let i=0;i<10;i++){check(p.cost(t.id)===100*(i+1)&&p.train(t.id),`${t.id} level${i+1} consumes its own next-level price`);}check(!p.train(t.id)&&p.cost(t.id)===null,t.id+' caps at ten');if(t.id!=='boss')check(!p.canPromote(),'promotion waits for every tower');}
 check(p.snapshot().gold===0&&p.canPromote(),'four completed towers cost exactly 22000 and unlock promotion');
 const before=p.bonuses();check(Math.abs(before.attackMultiplier-1.2)<1e-8&&Math.abs(before.healthMultiplier-1.2)<1e-8&&Math.abs(before.bossDamageMultiplier-1.3)<1e-8,'all bonuses match completed training levels');
 check(p.promote()&&p.snapshot().rank===1&&TRAININGS.every(t=>p.snapshot().levels[t.id]===0),'promotion advances grade and resets the four tower levels');
 check(JSON.stringify(p.bonuses())===JSON.stringify(before)&&!p.canPromote()&&!p.promote(),'promotion preserves earned bonuses and cannot repeat without training');
 check(p.cost('attack')===200,'new grade uses its configured training cost');
 const loaded=new TrainingProgress(storage);check(JSON.stringify(loaded.snapshot())===JSON.stringify(p.snapshot()),'empire wallet and promotion persist across reload');
 check(loaded.reward(3,5)===100&&loaded.snapshot().gold===100,'battle reward combines kills and completed waves');
 const malformed=new Map([[TRAINING_KEY,'invalid']]);check(new TrainingProgress({getItem:k=>malformed.get(k)??null,setItem(){}}).snapshot().gold===0,'corrupt saved data safely starts empty');
 const boost={attackMultiplier:1.2,healthMultiplier:1.2,normalDamageMultiplier:1.3,bossDamageMultiplier:1.6};
 for(const kind of ['guard','archer','mage','tank','melee','ranged','healer','arcanist','assassin'] as const){const a=new Defense(()=>1),b=new Defense(()=>1,()=>boost);a.summon(kind,2);b.summon(kind,2);const raw=a.stats(a.units[0]),trained=b.stats(b.units[0]);check(trained.attack===Math.round(raw.attack*1.2)&&trained.hp===Math.round(raw.hp*1.2),kind+' receives the same attack and health training');}
 const wave=new Defense(()=>1,()=>boost);wave.summon('guard',2);wave.units[0].cooldown=0;Object.assign(wave.enemies[0],{distance:200,...pathPoint(200),speed:0,hp:10000,maxHp:10000,defenseType:'normal'});wave.waveSpawned=10;const attack=wave.stats(wave.units[0]).attack;wave.tick(.001);check(wave.enemies[0].hp===10000-Math.round(attack*1.3),'wave damage applies normal-monster training once');
 for(const kind of ['boss','retainer'] as const){const b=new BossBattle(waveBossRoster(wave),()=>1);b.autoSkills=false;const ally=b.actors.find(a=>a.side==='ally')!,enemy=b.actors.find(a=>a.kind===kind)!;b.actors=[ally,enemy];Object.assign(ally,{x:100,y:100,cooldown:0,speed:0});Object.assign(enemy,{x:150,y:100,cooldown:999,speed:0,hp:10000,maxHp:10000,defenseType:'normal',physicalArmor:0});b.tick(.001);check(Math.abs(enemy.hp-(10000-attack*(kind==='boss'?1.6:1.3)))<1e-7,kind+' receives the correct outgoing damage multiplier');}
 return passed;
}

import {BossBattle,type BossAlly,type BossTuning} from './bossBattle';
export interface BossTestProfile extends BossTuning {minimumSeconds:number;targetSeconds:number;expectedSeconds:number;}
const TARGET=60,MAX_SIMULATION=100;
/** Offline trial owns its roster, RNG and meter; it cannot affect the live game. */
function trial(roster:BossAlly[],tuning:BossTuning):{seconds:number;outcome:BossBattle['result']}{
 const battle=new BossBattle([],()=>0);battle.reset(roster,tuning);battle.autoSkills=true;
 for(let i=0;i<MAX_SIMULATION/.05&&battle.result==='fighting';i++)battle.tick(.05);
 return {seconds:battle.elapsed,outcome:battle.result};
}
export function calibrateBossTest(roster:BossAlly[]):BossTestProfile|null {
 if(!roster.length||!roster.some(u=>u.stats.attack>0&&u.stats.rate>0))return null;
 const totalHp=roster.reduce((sum,u)=>sum+u.stats.hp,0);
 // At most ~35% of total ally HP is dealt in 60s, before deaths reduce enemy DPS.
 const attackScale=Math.max(.001,totalHp*.35/(196*TARGET));
 const maximumDps=roster.reduce((sum,u)=>{
  const soldier=['guard','archer','mage'].includes(u.kind),critical=u.stats.critChance>0?u.stats.critMultiplier:1;
  return sum+(u.stats.attack+(soldier?100:0))*u.stats.rate*critical+(['ranged','melee'].includes(u.kind)?u.stats.attack*.75:0);
 },0);
 let low=0,high=Math.max(.01,maximumDps*TARGET/9600);
 for(let i=0;i<8;i++){
  const result=trial(roster,{healthScale:high,attackScale});
  if(result.outcome!=='victory'||result.seconds>=TARGET)break;
  low=high;high*=2;
 }
 for(let i=0;i<12;i++){
  const mid=(low+high)/2,result=trial(roster,{healthScale:mid,attackScale});
  if(result.outcome==='victory'&&result.seconds<TARGET)low=mid;else high=mid;
 }
 const expected=trial(roster,{healthScale:high,attackScale});
 return {healthScale:high,attackScale,minimumSeconds:50,targetSeconds:TARGET,expectedSeconds:expected.seconds};
}

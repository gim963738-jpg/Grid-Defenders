import {Defense} from '../src/defense';
import {BossBattle,waveBossRoster} from '../src/bossBattle';
import {calibrateBossTest} from '../src/bossTestBalance';
export function checkBossTestBalance(){
 const passed:string[]=[];const check=(ok:boolean,name:string)=>{if(!ok)throw Error(name);passed.push(name);};
 check(calibrateBossTest([])===null,'empty formation cannot calibrate a test boss');
 const weak=new Defense(()=>1);weak.summon('mage',0);
 const normal=new Defense(()=>1);normal.devDeploySoldiers();
 const strong=new Defense(()=>1);strong.devDeploySoldiers();strong.summon('melee',4);strong.summon('tank',5);strong.devEquipHero(strong.units.find(u=>u.kind==='melee')!.id);strong.devEquipHero(strong.units.find(u=>u.kind==='ranged')!.id);
 const cases=[['single mage',weak],['saved twelve',normal],['equipped fourteen',strong]] as const;
 const profiles=[];
 for(const [name,game] of cases){
  const before=JSON.stringify({units:game.units,gear:game.gear,gold:game.gold,peak:game.damageMeter.peaks.overall}),roster=waveBossRoster(game),profile=calibrateBossTest(roster)!;profiles.push(profile);
  check(profile.expectedSeconds>=59.99&&profile.expectedSeconds<=65,`${name} maximum firepower trial lasts about sixty seconds`);
  check(JSON.stringify({units:game.units,gear:game.gear,gold:game.gold,peak:game.damageMeter.peaks.overall})===before,`${name} calibration leaves live roster gear gold and peaks untouched`);
  for(const critical of [0,1]){
   const b=new BossBattle([],()=>critical);b.reset(roster,profile);b.autoSkills=true;
   for(let i=0;i<1000&&b.result==='fighting';i++)b.tick(.05);
   check(b.result==='fighting'&&b.elapsed>49.99,`${name} cannot finish before fifty seconds with RNG ${critical}`);
   check(b.actors.some(a=>a.side==='enemy'&&a.hp<a.maxHp),`${name} receives normal damage before fifty seconds`);
  }
  const manual=new BossBattle(roster);manual.reset(roster,profile);manual.autoSkills=false;
  for(let i=0;i<1000&&manual.result==='fighting';i++)manual.tick(.05);
  check(manual.result==='fighting',`${name} does not wipe before fifty seconds with auto skills off`);
 }
 check(profiles[2].healthScale>profiles[1].healthScale&&profiles[1].healthScale>profiles[0].healthScale,'stronger equipment and formations increase test enemy health');
 const b=new BossBattle(waveBossRoster(normal),()=>1);b.reset(waveBossRoster(normal),profiles[1]);const boss=b.actors.find(a=>a.kind==='boss')!;
 check(boss.maxHp>6000&&boss.attack>0&&boss.attack<120,'manual test has adjusted health and positive survivable attack');
 b.reset();check(b.actors.find(a=>a.kind==='boss')!.maxHp===6000&&b.actors.find(a=>a.kind==='boss')!.attack===120,'default reset restores normal wave boss stats');
 return passed;
}

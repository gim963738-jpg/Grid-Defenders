import {Defense,pathPoint} from '../src/defense';
import {BossBattle,waveBossRoster} from '../src/bossBattle';
import {GameRun} from '../src/gameRun';
import {ITEMS,LANDSCAPE_BATTLE,RULES} from '../src/defenseConfig';
import {NO_TRAINING} from '../src/training';
import {createFireCast} from '../src/fireSkill';
import {createBladeCast} from '../src/bladeSkill';
import {createSwordAttack} from '../src/swordAttack';
import {createAssassinAction} from '../src/assassinCombat';
import {COMBAT_SPEEDS} from '../src/combatPlayback';
import {calibrateBossTest} from '../src/bossTestBalance';
import {formationRank} from '../src/battleFormation';
import {BattleSaveStore,battleSaveKey,battleLayout,captureBattle,restoreBattle,validBattleSave,type BattleSave,type BattleSaveMeta} from '../src/battleSave';

export function checkBattleSave(){
 const passed:string[]=[],check=(ok:boolean,label:string)=>{if(!ok)throw Error(label);passed.push(label);};
 const json=(v:unknown)=>JSON.stringify(v),clone=<T>(v:T):T=>JSON.parse(json(v));
 const details:BattleSaveMeta={runId:'save-test-run',scene:'defense',activeBossWave:null,bossReturnDelay:0,bossTestMode:false,bossEncounterWave:1,defeatedBossEnemies:[],combatPaused:false};
 function fixture(){
  const game=new Defense(()=>.9,()=>({...NO_TRAINING,attackMultiplier:1.1})),run=new GameRun();run.start('normal');game.keepWaveMonsters=true;
  const boss=new BossBattle([],()=>.9,game.damageMeter.peaks);return {game,boss,run};
 }
 const source=fixture(),g=source.game,b=source.boss,r=source.run;
 g.gold=10000;g.anvils=4;g.summon('ranged',0);g.summon('melee',1);g.summon('assassin',2);g.summon('guard',3);
 g.autoArrangeFormation();g.moveFormationUnit(g.units[0].id,20);
 g.buy(0);g.equip(g.gear[0].id,g.units[0].id,0,0,1);g.buy(2);g.speed=3;
 for(let i=0;i<80;i++){g.tick(.05);r.advance(.05);}
 b.reset(waveBossRoster(g));b.autoSkills=false;
 const saved=captureBattle(g,b,r,details,1000);
 check(saved!==null,'captures a populated wave with active projectiles and gear');if(!saved)return passed;
 check(saved.meta.runId===details.runId&&saved.defense.wave===g.wave&&saved.savedAt===1000,'retains run identity, wave and save timestamp');
 check(!json(saved).includes('attackMultiplier')&&!json(saved).includes('"random"'),'does not serialize model callbacks or training provider');
 const initial=fixture(),initialSave=captureBattle(initial.game,initial.boss,initial.run,details,1);
 check(initialSave!==null,'captures an empty starting formation');
 for(const speed of COMBAT_SPEEDS){initial.game.speed=speed;const speedSave=captureBattle(initial.game,initial.boss,initial.run,details,1);
  const speedCopy=fixture();check(!!speedSave&&!!restoreBattle(speedSave,speedCopy.game,speedCopy.boss,speedCopy.run)&&speedCopy.game.speed===speed,`preserves supported ${speed}x playback`);}
 const target=fixture(),meter=target.game.damageMeter,peaks=meter.peaks,skillMap=target.game.rangedSkills;
 const restored=restoreBattle(clone(saved),target.game,target.boss,target.run);
 check(restored?.runId===details.runId,'returns main-scene metadata after restore');
 check(target.game instanceof Defense&&target.boss instanceof BossBattle&&target.run instanceof GameRun,'keeps model class methods and prototypes');
 check(target.game.damageMeter===meter&&target.game.rangedSkills===skillMap&&target.boss.damageMeter.peaks===peaks,'keeps live Map, meter and shared damage peaks identities');
 check(target.game.gold===g.gold&&target.game.anvils===g.anvils&&target.game.speed===3,'restores actual currency and speed');
 if(LANDSCAPE_BATTLE){
  const oldRoad=clone(saved),oldEnemy=oldRoad.defense.enemies as {x:number;y:number;distance:number;hp:number}[];
  oldEnemy[0].x=220;oldEnemy[0].y=78;
  const migrated=fixture(),expected=pathPoint(oldEnemy[0].distance);
  check(!!restoreBattle(oldRoad,migrated.game,migrated.boss,migrated.run)&&migrated.game.enemies[0].x===expected.x&&migrated.game.enemies[0].y===expected.y&&migrated.game.enemies[0].distance===oldEnemy[0].distance&&migrated.game.enemies[0].hp===oldEnemy[0].hp,'older rounded-road saves immediately resume on the rectangular road without advancing time or changing HP');
 }
 check(json(target.game.units)===json(g.units)&&json(target.game.enemies)===json(g.enemies),'restores formation, enemy HP, position and cooldowns');
 check(json(target.game.formation)===json(g.formation)&&target.game.formation.find(p=>p.unitId===g.units[0].id)?.cell===20,'restores manually arranged boss formation without moving wave slots');
 check(json(target.game.gear)===json(g.gear)&&target.game.gear.every(item=>ITEMS.includes(item.def)),'restores item placement using canonical item definitions');
 check(target.game.shop.every((item,index)=>item===g.shop[index])&&json(target.game.shopDiscounts)===json(g.shopDiscounts),'restores purchased slots, offer definitions and discount flags');
 check(json(target.game.stats(target.game.units[0]))===json(g.stats(g.units[0])),'restored model still calls its training provider');
 const legacy=clone(saved);delete legacy.defense.formation;delete legacy.defense.formationRows;
 for(const ally of legacy.boss.roster as Record<string,unknown>[])delete ally.formationCell;
 const legacyTarget=fixture();legacyTarget.game.summon('guard',0);
 check(validBattleSave(legacy)&&!!restoreBattle(legacy,legacyTarget.game,legacyTarget.boss,legacyTarget.run),'version-one checkpoints without new formation fields remain resumable');
 check(legacyTarget.game.formation.length===g.units.length&&legacyTarget.game.heroes().every(u=>formationRank(legacyTarget.game.formation.find(p=>p.unitId===u.id)!.cell)===1),'legacy restore creates role-appropriate cells and removes preexisting target assignments');
 check(saved.defense.formationRows===6,'new checkpoints record six-row formation geometry');
 const fourRows=clone(saved),oldCells=[10,9,11,3];delete fourRows.defense.formationRows;
 fourRows.defense.formation=g.units.map((u,i)=>({unitId:u.id,cell:oldCells[i]}));
 if(LANDSCAPE_BATTLE)for(const [i,ally] of (fourRows.boss.roster as Record<string,unknown>[]).entries())ally.formationCell=oldCells[i];
 const fourSnapshot=json(fourRows),oldActors=json(fourRows.boss.actors),migrated=fixture();
 check(validBattleSave(fourRows)&&!!restoreBattle(fourRows,migrated.game,migrated.boss,migrated.run),'four-row v1 checkpoints remain resumable after expanding the board');
 check(migrated.game.formation.every((p,i)=>p.cell===oldCells[i]+7)&&migrated.game.heroes().every(u=>formationRank(migrated.game.formation.find(p=>p.unitId===u.id)!.cell)===1),'old cells move down one row while heroes remain middle rank');
 check(json(migrated.boss.actors)===oldActors&&json(fourRows)===fourSnapshot,'migration never teleports saved boss actors or mutates the input checkpoint');
 check(!LANDSCAPE_BATTLE||(migrated.boss as unknown as {roster:{formationCell:number}[]}).roster.every((u,i)=>u.formationCell===oldCells[i]+7),'saved boss roster also upgrades to six rows for later resets');
 const migratedSave=captureBattle(migrated.game,migrated.boss,migrated.run,details,1000);
 check(!!migratedSave&&migratedSave.defense.formationRows===6&&validBattleSave(migratedSave),'migrated state can be saved again using the new geometry marker');
 const invalidLegacy=clone(fourRows);(invalidLegacy.defense.formation as Record<string,unknown>[])[3].cell=35;
 check(!validBattleSave(invalidLegacy),'unmarked legacy saves cannot smuggle cells outside their original board');
 check(json(target.game.damageMeter.snapshot(g.waveTime))===json(g.damageMeter.snapshot(g.waveTime)),'restores damage totals and rolling peaks');
 check(target.run.active&&target.run.mode===r.mode&&target.run.elapsed===r.elapsed,'restores active run time without elapsed offline time');
 const normalized=(save:BattleSave)=>{const copy=clone(save);copy.defense.revision=0;copy.defense.logRevision=0;return json(copy);};
 for(let i=0;i<40;i++){g.tick(.05);target.game.tick(.05);r.advance(.05);target.run.advance(.05);}
 const uninterrupted=captureBattle(g,b,r,details,2000),continued=captureBattle(target.game,target.boss,target.run,details,2000);
 check(!!uninterrupted&&!!continued&&normalized(uninterrupted)===normalized(continued),'resumed wave advances identically to uninterrupted play');
 const oldIds=new Set([...target.game.units,...target.game.enemies,...target.game.gear].map(v=>v.id));
 target.game.summon('archer',4);target.game.buy(1);
 check(!oldIds.has(target.game.units.at(-1)!.id)&&!oldIds.has(target.game.gear.at(-1)!.id)&&target.game.units.at(-1)!.id!==target.game.gear.at(-1)!.id,'restores private ID counter without new unit/item collisions');
 const beforeGold=g.gold;target.game.gold=3;check(g.gold===beforeGold,'snapshot and restored model are detached from the original');

 // Save across a damage beat: already applied hits must not replay, and pending
 // hits must survive. The source copies deliberately live separately from units.
 const combat=fixture();combat.game.summon('ranged',0);combat.game.summon('melee',1);combat.game.summon('assassin',2);
 combat.game.enemies[0].hp=combat.game.enemies[0].maxHp=100000;
 const enemy=combat.game.enemies[0],ranged=combat.game.units[0],melee=combat.game.units[1],assassin=combat.game.units[2];
 const fire=createFireCast({...ranged},enemy.id,100,enemy.x,enemy.y,enemy.x,enemy.y);fire.stage='pillar';fire.age=.96;fire.hits=1;combat.game.fireCasts=[fire];
 const blade=createBladeCast({...melee},enemy.id,100,enemy.x,enemy.y);blade.age=.18;blade.hits=2;combat.game.bladeCasts=[blade];
 const swing=createSwordAttack(melee.id,enemy.id,100,false,0,1,enemy.x,enemy.y);swing.age=.19;combat.game.swordAttacks=[swing];
 const slash=createAssassinAction('wave',{...assassin},assassin.id,[enemy.id],100,enemy.x,enemy.y,enemy);slash.age=.6;combat.game.assassinActions=[slash];
 combat.game.rangedSkills.set(ranged.id,{cooldown:3,shotsLeft:1,delay:.025,casts:2});
 const actionSave=captureBattle(combat.game,combat.boss,combat.run,details,3000),actionCopy=fixture();
 check(!!actionSave&&!!restoreBattle(actionSave,actionCopy.game,actionCopy.boss,actionCopy.run),'captures partial multi-hit attacks and active burst counters');
 for(let i=0;i<8;i++){combat.game.tick(.05);actionCopy.game.tick(.05);}
 check(json(combat.game.enemies)===json(actionCopy.game.enemies)&&combat.game.kills===actionCopy.game.kills,'partial attacks resume without duplicate or missing damage');
 check(json(combat.game.fireCasts)===json(actionCopy.game.fireCasts)&&json(combat.game.assassinActions)===json(actionCopy.game.assassinActions),'preserves exact action clocks and completed-hit counts');

 const bossSource=fixture();bossSource.game.summon('melee',0);bossSource.game.summon('ranged',1);bossSource.game.summon('assassin',2);
 bossSource.boss.reset(waveBossRoster(bossSource.game));bossSource.boss.autoSkills=false;
 for(let i=0;i<100;i++){bossSource.boss.tick(.05);bossSource.run.advance(.05);}
 const bossEnemy=bossSource.boss.actors.find(a=>a.side==='enemy')!;
 for(const ally of bossSource.boss.actors.filter(a=>a.side==='ally')){ally.x=bossEnemy.x-40;ally.y=bossEnemy.y;bossSource.boss.useHeroSkill(ally.id);}
 for(let i=0;i<7;i++){bossSource.boss.tick(.05);bossSource.run.advance(.05);}
 bossSource.boss.commanderSkill();bossSource.boss.heroSkillCooldowns.set('ally-'+bossSource.game.units[0].id,2.25);
 const bossMeta:BattleSaveMeta={...details,scene:'boss',activeBossWave:10,bossEncounterWave:10,combatPaused:true,defeatedBossEnemies:['retainer-top']};
 const bossSave=captureBattle(bossSource.game,bossSource.boss,bossSource.run,bossMeta,4000),bossCopy=fixture();
 check(!!bossSave&&!!restoreBattle(bossSave,bossCopy.game,bossCopy.boss,bossCopy.run),'captures and restores an active boss encounter');
 check(bossCopy.boss.elapsed===bossSource.boss.elapsed&&bossCopy.boss.commanderCooldown===15&&!bossCopy.boss.autoSkills,'restores boss time, skill cooldown and manual-auto preference');
 check(json(bossCopy.boss.actors)===json(bossSource.boss.actors),'restores boss and ally HP and movement positions');
 check(bossCopy.boss.assassinActions.length>0&&bossCopy.boss.bladeCasts.length>0&&bossCopy.boss.fireCasts.length>0,'restores pending boss multi-hit skills together');
 check(bossCopy.boss.assassinActions.every(a=>a.source!==bossCopy.boss.actors.find(actor=>actor.id===a.sourceId)),
  'keeps attack source snapshots detached as the native combat model intends');
 check(bossSave?.meta.defeatedBossEnemies[0]==='retainer-top'&&bossSave.meta.combatPaused,'preserves credited boss kills and manual pause metadata');
 for(let i=0;i<100;i++){bossSource.boss.tick(.05);bossCopy.boss.tick(.05);bossSource.run.advance(.05);bossCopy.run.advance(.05);}
 const bs=captureBattle(bossSource.game,bossSource.boss,bossSource.run,bossMeta,5000),bc=captureBattle(bossCopy.game,bossCopy.boss,bossCopy.run,bossMeta,5000);
 check(!!bs&&!!bc&&normalized(bs)===normalized(bc),'boss resumes identically without restarting timer or encounter');
 const calibrated=fixture();calibrated.game.summon('guard',0);
 const calibratedRoster=waveBossRoster(calibrated.game),profile=calibrateBossTest(calibratedRoster)!;
 calibrated.boss.reset(calibratedRoster,profile);calibrated.boss.tick(.05);calibrated.run.advance(.05);
 const calibratedSave=captureBattle(calibrated.game,calibrated.boss,calibrated.run,{...bossMeta,bossTestMode:true},5500),calibratedCopy=fixture();
 check(!!calibratedSave&&!!restoreBattle(calibratedSave,calibratedCopy.game,calibratedCopy.boss,calibratedCopy.run),
  'accepts a developer boss reset with an actual calibrated BossTestProfile');
 check(!!calibratedSave&&Object.keys(calibratedSave.boss.tuning as object).sort().join() ==='attackScale,healthScale'&&
  calibratedCopy.boss.tuning.healthScale===profile.healthScale&&calibratedCopy.boss.tuning.attackScale===profile.attackScale,
  'persists combat tuning while excluding calibration-only explanatory timings');
 check(json(calibratedCopy.boss.actors)===json(calibrated.boss.actors)&&calibratedCopy.boss.elapsed===calibrated.boss.elapsed,
  'calibrated boss restoration preserves its scaled HP, attack and elapsed time');

 const data=new Map<string,string>(),storage={getItem:(key:string)=>data.get(key)??null,setItem:(key:string,value:string)=>{data.set(key,value);},removeItem:(key:string)=>{data.delete(key);}};
 const store=new BattleSaveStore(storage);
 check(store.save(saved)&&store.load('normal')?.meta.runId===details.runId,'storage roundtrip restores a normal run');
 check(new BattleSaveStore(storage).load('normal')?.defense.wave===g.wave,'saved run survives a store/page instance change');
 check(store.load('infinite-test')===null,'normal save never enters test mode');
 const differentLayout=LANDSCAPE_BATTLE?'portrait':'landscape';
 check(new BattleSaveStore(storage,differentLayout).load('normal')===null,'portrait and landscape progress use different slots');
 const testFixture=fixture();testFixture.run.start('infinite-test');testFixture.game.keepWaveMonsters=false;
 const testSave=captureBattle(testFixture.game,testFixture.boss,testFixture.run,{...details,runId:'test-mode'},6000)!;
 check(store.save(testSave)&&store.load('normal')?.meta.runId===details.runId&&store.load('infinite-test')?.meta.runId==='test-mode','saving a test run does not overwrite normal progress');
 check(!store.clear('normal','other-run')&&!!store.load('normal'),'stale run cannot delete a different saved run');
 check(store.clear('normal',details.runId)&&store.load('normal')===null&&!!store.load('infinite-test'),'clears only the completed or abandoned run');
 const badCases:[string,(s:BattleSave)=>void][]=[
  ['unknown version',s=>{(s as {version:number}).version=999;}],
  ['wrong layout',s=>{s.layout=differentLayout;}],
  ['different run mode',s=>{s.mode='infinite-test';}],
  ['missing run identity',s=>{s.meta.runId='';}],
  ['invalid currency',s=>{s.defense.gold=-1;}],
  ['unknown unit kind',s=>{(s.defense.units as Record<string,unknown>[])[0].kind='unknown';}],
  ['unknown item definition',s=>{(s.defense.gear as Record<string,unknown>[])[0].def='missing';}],
  ['duplicate occupied slots',s=>{const units=s.defense.units as Record<string,unknown>[];units[1].slot=units[0].slot;}],
  ['reused actor ID counter',s=>{s.defense.nextId=1;}],
  ['invalid map rows',s=>{s.defense.rangedSkills=[[1]];}],
  ['unknown attack source',s=>{s.defense.fireCasts=[{source:{kind:'missing'}}];}],
  ['finished run',s=>{s.run.active=false;}],
  ['negative boss timer',s=>{s.boss.elapsed=-1;}],
  ['missing field',s=>{delete s.defense.enemies;}],
  ['unknown executable field',s=>{s.defense.random='override';}],
  ['out-of-board formation cell',s=>{(s.defense.formation as Record<string,unknown>[])[0].cell=42;}],
  ['unsupported formation geometry',s=>{s.defense.formationRows=8;}],
  ['duplicate formation cell',s=>{const cells=s.defense.formation as Record<string,unknown>[];cells[1].cell=cells[0].cell;}],
  ['unknown formation unit',s=>{(s.defense.formation as Record<string,unknown>[])[0].unitId=99999;}],
  ['missing formation unit',s=>{(s.defense.formation as Record<string,unknown>[]).pop();}],
  ['hero outside middle formation',s=>{(s.defense.formation as Record<string,unknown>[])[0].cell=0;}],
  ['invalid saved boss formation cell',s=>{(s.boss.roster as Record<string,unknown>[])[0].formationCell=42;}],
 ];
 for(const [label,change] of badCases){const bad=clone(saved);change(bad);const clean=fixture(),before=json(clean.game.units);
  check(!validBattleSave(bad)&&restoreBattle(bad,clean.game,clean.boss,clean.run)===null&&json(clean.game.units)===before,'rejects '+label+' before model mutation');
 }
 data.set(battleSaveKey('normal'),'broken json');check(store.load('normal')===null,'corrupt JSON does not block starting a game');
 data.set(battleSaveKey('normal'),json(saved).replace('"runId":','"__proto__":{"polluted":true},"runId":'));
 check(store.load('normal')===null&&!(Object.prototype as {polluted?:boolean}).polluted,'rejects prototype pollution payloads');
 const unavailable=new BattleSaveStore({getItem:()=>{throw Error('blocked');},setItem:()=>{throw Error('full');},removeItem:()=>{throw Error('blocked');}});
 check(unavailable.load('normal')===null&&!unavailable.save(saved)&&!unavailable.clear('normal'),'unavailable or full storage returns failure without throwing');
 check(new BattleSaveStore().load('normal')===null&&!new BattleSaveStore().save(saved),'absent storage degrades to normal in-memory play');
 const stopped=fixture();stopped.run.reset();check(captureBattle(stopped.game,stopped.boss,stopped.run,details)===null,'inactive run cannot overwrite resumable progress');
 check(battleSaveKey('normal').includes(battleLayout)&&battleSaveKey('normal')!==battleSaveKey('infinite-test'),'keys encode layout and mode explicitly');
 check(RULES.heroLimit===3,'save feature keeps the existing hero limit');
 return passed;
}

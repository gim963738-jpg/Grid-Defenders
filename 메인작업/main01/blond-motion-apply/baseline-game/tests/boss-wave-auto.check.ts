import { Defense } from '../src/defense';
import { BossBattle, waveBossRoster } from '../src/bossBattle';
export function checkBossWaveAuto():string[]{
 const passed:string[]=[];const check=(ok:boolean,label:string)=>{if(!ok)throw new Error(label);passed.push(label);};
 const game=new Defense(()=>1);check(!game.bossPending&&!game.completeBossWave(),'ordinary wave cannot complete a boss');
 while(game.wave<9)game.nextTestWave();const named=game.enemies.filter(e=>e.named).length;
 game.waveTime=29.99;game.tick(.02);
 check(game.wave===10&&game.bossPending,'wave timer enters boss at ten');
 check(game.waveSpawned===0&&!game.enemies.some(e=>e.wave===10),'boss wave does not spawn normal or named wave monsters');
 check(game.enemies.filter(e=>e.named).length===named,'existing named monsters persist');
 const frozen=JSON.stringify({elapsed:game.elapsed,time:game.waveTime,enemies:game.enemies});game.tick(999);
 check(JSON.stringify({elapsed:game.elapsed,time:game.waveTime,enemies:game.enemies})===frozen,'wave simulation stays frozen during boss');
 check(game.completeBossWave()&&game.wave===11&&!game.bossPending,'boss completion resumes wave eleven');
 check(!game.completeBossWave()&&game.wave===11,'completion is idempotent');
 while(game.wave<20)game.nextTestWave();check(game.bossPending&&game.waveSpawned===0,'wave twenty also starts a boss');
 game.completeBossWave();while(game.wave<30)game.nextTestWave();check(game.bossPending,'wave thirty also starts a boss');
 game.reset();check(game.wave===1&&!game.bossPending,'game reset clears boss gate');
 game.devDeploySoldiers();const battle=new BossBattle(waveBossRoster(game),()=>1);
 check(battle.autoSkills,'auto skills default on');
 battle.actors.forEach(a=>a.attack=0);
 let automaticTriple=false;
 for(let i=0;i<800&&battle.result==='fighting';i++){battle.tick(.05);if(battle.heroSkillCooldown>0){automaticTriple=true;break;}}
 check(battle.commanderCooldown>0,'auto mode casts commander skill');
 check(automaticTriple,'auto mode casts triple after entering range');
 battle.autoSkills=false;
 for(let i=0;i<400;i++)battle.tick(.05);
 check(battle.commanderCooldown===0&&battle.commanderBuff===0&&battle.heroSkillCooldown===0,'off mode does not recast when cooldown expires');
 battle.autoSkills=true;battle.reset();check(battle.autoSkills,'retry preserves auto preference');
 const empty=new BossBattle([]);empty.autoSkills=true;empty.tick(.05);check(empty.commanderCooldown===0&&empty.heroSkillCooldown===0,'auto mode cannot cast without allies');
 return passed;
}

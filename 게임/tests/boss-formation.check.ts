import {Defense} from '../src/defense';
import {BossBattle,waveBossRoster,bossFormationPoint,BOSS_FORMATION} from '../src/bossBattle';
import {FORMATION,formationRank} from '../src/battleFormation';
import {LANDSCAPE_BATTLE,UNITS} from '../src/defenseConfig';

export function checkBossFormation():string[]{
 const passed:string[]=[],check=(ok:boolean,label:string)=>{if(!ok)throw Error(label);passed.push(label);};
 const points=Array.from({length:FORMATION.size},(_,cell)=>bossFormationPoint(cell));
 check(points.length===42&&new Set(points.map(p=>`${p.x},${p.y}`)).size===42,'all forty-two editor cells map to distinct encounter positions');
 check(points.every(p=>p.x>=28.125&&p.x<=309.375&&p.y>=65.625&&p.y<=403.125),'all starting positions stay inside the allied area and above the lower skill HUD');
 check([3,10,17,24,31,38].map(c=>bossFormationPoint(c).x).join(',')==='309.375,253.125,196.875,140.625,84.375,28.125','two rows per rank advance clockwise from editor north toward right-side enemies');
 check(bossFormationPoint(0).y===65.625&&bossFormationPoint(6).y===403.125,'the seven editor columns retain their order after clockwise rotation');
 check(BOSS_FORMATION.columns===6&&BOSS_FORMATION.rows===7&&BOSS_FORMATION.cell*.64===36&&BOSS_FORMATION.top*.64===24,'live board has six columns seven rows with thirty-six pixel cells and twenty-four pixel top inset');

 const game=new Defense(()=>1);game.gold=10000;
 game.summon('guard',3);game.summon('ranged',5);game.summon('tank',12);game.summon('archer',1);game.summon('mage',2);
 game.autoArrangeFormation();
 const snapshot=JSON.stringify({units:game.units,gear:game.gear,gold:game.gold}),roster=waveBossRoster(game),battle=new BossBattle(roster,()=>1);
 check(JSON.stringify({units:game.units,gear:game.gear,gold:game.gold})===snapshot,'roster translation leaves wave slots levels equipment and currency intact');
 check(roster.length===game.units.length&&roster.every(u=>game.units.some(unit=>unit.id===u.id&&unit.slot===u.slot)),'no phantom units replace the original wave roster or source slots');
 if(LANDSCAPE_BATTLE){
  check(roster.every(u=>u.formationCell===game.formationSlots().find(p=>p.unitId===u.id)?.cell),'landscape roster carries each saved formation cell');
  const allies=battle.actors.filter(a=>a.side==='ally');
  check(allies.every(a=>{const r=roster.find(u=>`ally-${u.id}`===a.id)!,p=bossFormationPoint(r.formationCell!);return a.x===p.x&&a.y===p.y&&a.sourceSlot===r.slot&&a.rank===formationRank(r.formationCell!);}), 'live initial positions and targeting ranks agree with the selected formation');
  check(allies.filter(a=>UNITS[a.kind as keyof typeof UNITS].hero).every(a=>a.rank===1),'every hero enters the encounter as middle rank');
  const boss=battle.actors.find(a=>a.kind==='boss')!;
  check(battle.target(boss)?.kind==='guard','enemy targeting begins at the living front row');
  allies.filter(a=>a.rank===0).forEach(a=>a.hp=0);
  check(battle.target(boss)?.rank===1,'after the front falls enemies target the middle before rear soldiers');
  allies.filter(a=>a.rank===1).forEach(a=>a.hp=0);
  check(battle.target(boss)?.rank===2,'after the middle falls enemies reach the rear rank');
  const guard=game.units.find(u=>u.kind==='guard')!,hero=game.units.find(u=>u.kind==='ranged')!;
  const liveActors=JSON.stringify(battle.actors);
  check(game.moveFormationUnit(guard.id,0)&&game.moveFormationUnit(hero.id,27),'the formation accepts a front corner and a second-middle-row corner');
  check(JSON.stringify(battle.actors)===liveActors,'editing the next encounter formation never teleports or heals an ongoing boss encounter');
  battle.reset(waveBossRoster(game));
  const movedGuard=battle.actors.find(a=>a.id===`ally-${guard.id}`)!,movedHero=battle.actors.find(a=>a.id===`ally-${hero.id}`)!;
  check(movedGuard.x===309.375&&movedGuard.y===65.625&&movedGuard.sourceSlot===3,'new boss entry uses the manually assigned front corner without moving its wave slot');
  check(movedHero.x===140.625&&movedHero.y===403.125&&movedHero.rank===1,'new boss entry uses the second middle row with middle targeting priority');
 }else{
  check(roster.every(u=>u.formationCell===undefined),'portrait rosters keep the original placement format');
  check(battle.actors[0].x===246.09375&&battle.actors[0].y===386.71875&&battle.actors[0].rank===0,'portrait encounter retains its original positions and targeting ranks');
 }
 return passed;
}

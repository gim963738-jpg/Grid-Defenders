import {Defense} from '../src/defense';
import {SLOTS,UNITS,type UnitKind} from '../src/defenseConfig';
import {FORMATION,autoFormation,reconcileFormation,moveFormation,formationRank,formationRow,isFormationCell,canPlaceFormationUnit,type FormationUnit,type FormationPlacement} from '../src/battleFormation';

export function checkBattleFormation(){
 const passed:string[]=[],check=(ok:boolean,label:string)=>{if(!ok)throw Error(label);passed.push(label);};
 const json=(v:unknown)=>JSON.stringify(v);
 const roster=(kinds:UnitKind[]):FormationUnit[]=>kinds.map((kind,i)=>({id:i+1,kind}));
 const repeated=(kind:UnitKind,n:number)=>Array.from({length:n},()=>kind);
 const complete=(units:FormationUnit[],positions:FormationPlacement[])=>positions.length===units.length&&
  new Set(positions.map(p=>p.unitId)).size===units.length&&new Set(positions.map(p=>p.cell)).size===units.length&&
  positions.every(p=>!!units.find(u=>u.id===p.unitId)&&canPlaceFormationUnit(units.find(u=>u.id===p.unitId)!,p.cell));
 check(FORMATION.columns===7&&FORMATION.rows===6&&FORMATION.size===42,'formation exposes seven columns, six rows and forty-two cells');
 check([0,6,7,13].every(c=>formationRank(c)===0)&&[14,20,21,27].every(c=>formationRank(c)===1)&&[28,34,35,41].every(c=>formationRank(c)===2),'twelve-o-clock formation has two front, two middle and two rear rows');
 check(formationRow(0)===0&&formationRow(41)===5&&isFormationCell(0)&&isFormationCell(41),'formation includes both boundary cells');
 check([-1,42,1.5,NaN,Infinity].every(c=>!isFormationCell(c)),'outside and noninteger cells are rejected');
 check(autoFormation([]).length===0,'empty wave roster has no phantom formation units');
 const units=roster(['guard','guard','guard','archer','archer','mage','melee','ranged','blond']),original=json(units),positions=autoFormation(units);
 check(complete(units,positions),'mixed automatic formation assigns every deployed unit exactly once');
 check(positions.filter(p=>UNITS[units[p.unitId-1].kind].hero).every(p=>formationRank(p.cell)===1),'every hero role is assigned to the middle');
 check(positions.filter(p=>units[p.unitId-1].kind==='guard').every(p=>formationRank(p.cell)===0),'ordinary guards occupy the front');
 check(positions.filter(p=>['archer','mage'].includes(units[p.unitId-1].kind)).every(p=>formationRank(p.cell)===2),'ordinary archers and mages occupy the rear');
 check(json(units)===original&&json(autoFormation([...units].reverse()))===json(positions),'automatic placement does not mutate units and ignores incidental roster iteration order');
 check(json(autoFormation(units))===json(positions),'repeating auto arrangement is deterministic');

 // Every legal twenty-unit hero/guard/ranged mix must remain complete when a
 // preferred row fills; all three heroes still fit their two reserved rows.
 for(let heroes=0;heroes<=3;heroes++)for(let guards=0;guards<=20-heroes;guards++){
  const army=roster([...'melee ranged blond'.split(' ').slice(0,heroes) as UnitKind[],...repeated('guard',guards),...Array.from({length:20-heroes-guards},(_,i)=>i%2?'mage' as const:'archer' as const)]);
  const arranged=autoFormation(army);
  check(complete(army,arranged),`twenty-unit mix ${heroes} heroes / ${guards} guards keeps unique valid cells without dropping units`);
 }
 const crowded=roster([...repeated('guard',17),'melee','ranged','blond']),crowdedPositions=autoFormation(crowded);
 check(crowdedPositions.filter(p=>formationRank(p.cell)===0).length===14&&complete(crowded,crowdedPositions),'both front rows fill before overflow uses open middle cells');
 const rearArmy=roster([...repeated('archer',17),'melee','ranged','blond']),rearPositions=autoFormation(rearArmy);
 check(rearPositions.filter(p=>formationRank(p.cell)===2).length===14&&complete(rearArmy,rearPositions),'both rear rows fill before overflow uses middle cells while heroes stay in the middle');
 const full=roster([...repeated('guard',26),...repeated('mage',13),'melee','ranged','blond']);
 check(complete(full,autoFormation(full)),'all forty-two formation cells can hold distinct units without exceeding board boundaries');

 const guard=units[0],hero=units[6],oldHero=positions.find(p=>p.unitId===hero.id)!.cell,snapshot=json(positions);
 const moved=moveFormation(units,positions,hero.id,20)!;
 check(!!moved&&moved.find(p=>p.unitId===hero.id)!.cell===20&&json(positions)===snapshot,'middle-row manual move returns detached state');
 check(moveFormation(units,positions,hero.id,3)===null&&moveFormation(units,positions,hero.id,41)===null,'manual hero movement cannot leave the middle');
 check(moveFormation(units,positions,guard.id,oldHero)===null&&json(positions)===snapshot,'a front soldier cannot swap a hero out of the middle');
 const staged=moveFormation(units,positions,guard.id,19)!;
 const swapped=moveFormation(units,staged,guard.id,oldHero)!;
 check(swapped.find(p=>p.unitId===hero.id)!.cell===19&&swapped.find(p=>p.unitId===guard.id)!.cell===oldHero,'middle-row soldier and hero exchange occupied cells atomically');
 check([-1,42,NaN,1.5].every(c=>moveFormation(units,positions,guard.id,c)===null)&&moveFormation(units,positions,999,0)===null,'invalid manual input cannot change formation state');
 check(json(reconcileFormation(units,moved))===json(moved),'reopening the editor retains valid manual arrangement');
 const remaining=units.filter(u=>u.id!==guard.id),pruned=reconcileFormation(remaining,moved);
 check(complete(remaining,pruned)&&!pruned.some(p=>p.unitId===guard.id),'sold or removed units leave no occupied ghost cell');
 const corrupt=[...positions,{unitId:999,cell:5},{unitId:hero.id,cell:1}];corrupt[0]={unitId:guard.id,cell:positions[1].cell};
 check(complete(units,reconcileFormation(units,corrupt)),'reconciliation removes stale IDs and duplicate cells before filling missing units');
 const soldiers=roster(repeated('guard',17)),manual=soldiers.map((u,i)=>({unitId:u.id,cell:i<14?i+14:i-14}));
 const withHeroes=[...soldiers,...roster(['melee','ranged','blond']).map(u=>({...u,id:u.id+17}))];
 const recruited=reconcileFormation(withHeroes,manual);
 check(complete(withHeroes,recruited)&&recruited.filter(p=>p.unitId>17).every(p=>formationRank(p.cell)===1),'new heroes displace soldiers safely when all fourteen middle cells were manually filled');

 const game=new Defense(()=>1);game.gold=100000;game.summon('guard',0);game.summon('melee',1);game.summon('mage',2);
 const before=json(game.units.map(u=>({id:u.id,slot:u.slot}))),beforeGold=game.gold,heroId=game.units[1].id;
 check(game.autoArrangeFormation()&&game.moveFormationUnit(heroId,20),'Defense exposes automatic and manual formation actions');
 check(json(game.units.map(u=>({id:u.id,slot:u.slot})))===before&&game.gold===beforeGold,'formation edits never change wave deployment slots or charge currency');
 const retained=game.formation.find(p=>p.unitId===heroId)!.cell;
 game.moveUnit(heroId,SLOTS.length-1);
 check(game.formationSlots().find(p=>p.unitId===heroId)!.cell===retained,'wave repositioning does not discard manual boss formation');
 const soldId=game.units.find(u=>u.kind==='guard')!.id;game.sellUnit(soldId);
 check(!game.formationSlots().some(p=>p.unitId===soldId),'selling a soldier prunes its formation assignment');
 game.devDeploySoldiers();
 check(complete(game.units,game.formationSlots()),'developer deployment also receives complete valid formation assignments');
 game.reset();check(game.formation.length===0&&game.formationSlots().length===0,'new run clears the preceding run formation');
 return passed;
}

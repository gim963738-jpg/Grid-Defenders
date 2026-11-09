import {UNITS,type UnitKind} from './defenseConfig';

// Each rank has two rows facing the twelve-o'clock advance arrow.
// These cells never replace the wave battlefield's unit slots.
export const FORMATION={columns:7,rows:6,size:42} as const;
export interface FormationUnit {id:number;kind:UnitKind;}
export interface FormationPlacement {unitId:number;cell:number;}
export type FormationRank=0|1|2;
export const formationRow=(cell:number):number=>Math.floor(cell/FORMATION.columns);
export const formationRank=(cell:number):FormationRank=>formationRow(cell)<2?0:formationRow(cell)>=4?2:1;
export const isFormationCell=(cell:unknown):cell is number=>typeof cell==='number'&&Number.isInteger(cell)&&cell>=0&&cell<FORMATION.size;
export function canPlaceFormationUnit(unit:FormationUnit,cell:number):boolean {
 return isFormationCell(cell)&&(!UNITS[unit.kind].hero||formationRank(cell)===1);
}
const centerColumns=[3,2,4,1,5,0,6];
const rowCells=(rows:number[])=>rows.flatMap(row=>centerColumns.map(column=>row*FORMATION.columns+column));
const front=rowCells([0,1]),middle=rowCells([2,3]),rear=rowCells([5,4]);
const priorityCells=(unit:FormationUnit):number[]=>UNITS[unit.kind].hero?middle:unit.kind==='guard'?rowCells([0,1,2,3,4,5]):rowCells([5,4,3,2,1,0]);
const primaryCells=(unit:FormationUnit):number[]=>UNITS[unit.kind].hero?middle:unit.kind==='guard'?front:rear;
const ordered=(units:readonly FormationUnit[])=>[...units].sort((a,b)=>Number(UNITS[b.kind].hero)-Number(UNITS[a.kind].hero)||a.id-b.id);

function fill(units:readonly FormationUnit[],placements:FormationPlacement[]):FormationPlacement[] {
 const occupied=new Set(placements.map(p=>p.cell)),assigned=new Set(placements.map(p=>p.unitId));
 const put=(unit:FormationUnit,candidates:number[])=>{
  const cell=candidates.find(cell=>!occupied.has(cell));
  if(cell===undefined)return false;
  placements.push({unitId:unit.id,cell});occupied.add(cell);assigned.add(unit.id);return true;
 };
 const pending=ordered(units).filter(u=>!assigned.has(u.id));
 // Reserve each role's own row before letting another role spill into it.
 for(const unit of pending)put(unit,primaryCells(unit));
 for(const unit of pending)if(!assigned.has(unit.id))put(unit,priorityCells(unit));
 return placements.sort((a,b)=>a.unitId-b.unitId);
}

export function autoFormation(units:readonly FormationUnit[]):FormationPlacement[] {return fill(units,[]);}

export function reconcileFormation(units:readonly FormationUnit[],saved:readonly FormationPlacement[]):FormationPlacement[] {
 const result:FormationPlacement[]=[],occupied=new Set<number>();
 // Keep valid manual positions and omit sold units, repeated IDs and collisions.
 // Existing heroes win a corrupt collision, because their valid area is smaller.
 for(const unit of ordered(units)){
  const p=saved.find(p=>p.unitId===unit.id&&canPlaceFormationUnit(unit,p.cell)&&!occupied.has(p.cell));
  if(p){result.push({unitId:unit.id,cell:p.cell});occupied.add(p.cell);}
 }
 // A newly summoned hero still belongs in the middle if soldiers occupy all
 // fourteen cells. Relocate one soldier, never move the hero outside its rows.
 for(const hero of ordered(units).filter(u=>UNITS[u.kind].hero&&!result.some(p=>p.unitId===u.id))){
  let cell=middle.find(c=>!occupied.has(c));
  if(cell===undefined){
   const displaced=result.find(p=>middle.includes(p.cell)&&!UNITS[units.find(u=>u.id===p.unitId)!.kind].hero);
   if(displaced){cell=displaced.cell;result.splice(result.indexOf(displaced),1);}
  }
  if(cell!==undefined){result.push({unitId:hero.id,cell});occupied.add(cell);}
 }
 return fill(units,result);
}

// Returns detached state, so failed moves cannot partially mutate a formation.
export function moveFormation(units:readonly FormationUnit[],saved:readonly FormationPlacement[],unitId:number,cell:number):FormationPlacement[]|null {
 const unit=units.find(u=>u.id===unitId);
 if(!unit||!canPlaceFormationUnit(unit,cell))return null;
 const placements=reconcileFormation(units,saved),current=placements.find(p=>p.unitId===unitId);
 if(!current)return null;
 const other=placements.find(p=>p.cell===cell&&p.unitId!==unitId);
 if(other&&!canPlaceFormationUnit(units.find(u=>u.id===other.unitId)!,current.cell))return null;
 if(other)other.cell=current.cell;
 current.cell=cell;
 return placements;
}

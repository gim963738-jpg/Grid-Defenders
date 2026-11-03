import { Defense } from '../src/defense';

export function checkDevPlacement():string[] {
  const passed:string[]=[];
  const check=(ok:boolean,name:string)=>{if(!ok)throw new Error(name);passed.push(name);};
  const g=new Defense(),gold=g.gold;
  g.devDeploySoldiers();
  check(g.units.length===6,'one click creates six soldiers');
  check(['guard','archer','mage'].every(kind=>g.units.filter(u=>u.kind===kind).length===2),'two of each soldier kind');
  check(g.gold===gold,'developer deployment leaves gold unchanged');
  check(new Set(g.units.map(u=>u.slot)).size===6&&new Set(g.units.map(u=>u.id)).size===6,'unique slots and ids');
  g.devDeploySoldiers();check(g.units.length===6,'repeated click does not duplicate units');
  const soldier=g.units[0];g.sellUnit(soldier.id);
  check(g.gold===gold,'free test units do not grant gold when sold');
  const occupied=new Defense();occupied.summon('ranged',0);
  const hero=occupied.units[0];occupied.devDeploySoldiers();
  check(occupied.units.find(u=>u.slot===0)===hero&&occupied.units.length===6,'existing hero is preserved and only vacant test slots fill');
  const invalid=new Defense();invalid.gold=0;
  check(!invalid.summon('guard',2)&&!invalid.units.length&&invalid.gold===0,'normal paid summons still require gold');
  invalid.summon('tank',2);
  check(!invalid.summon('tank',3)&&invalid.units.length===1,'normal hero uniqueness remains enforced');
  invalid.gold=100;const beforeOccupied=invalid.gold;
  check(!invalid.summon('guard',2)&&invalid.gold===beforeOccupied,'occupied slots do not consume gold');
  invalid.summon('melee',3);invalid.summon('ranged',4);
  check(!invalid.summon('healer',5)&&invalid.heroes().length===3,'normal hero limit remains three');
  return passed;
}

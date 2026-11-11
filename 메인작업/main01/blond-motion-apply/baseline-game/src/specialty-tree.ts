// Presentation-only scaffolding. No bonus, currency, level or combat mutation.
export interface SpecialtyNode {id:string;name:string;x:number;y:number;parents:string[];}
export interface SpecialtyTree {classId:string;nodes:SpecialtyNode[];}
export const SPECIALTY_TREE_SIZE={width:720,height:560};
const layout=[
 {x:360,y:280,parents:[]},
 {x:240,y:280,parents:[1]}, {x:120,y:280,parents:[2]},
 {x:240,y:160,parents:[2]}, {x:120,y:160,parents:[4]},
 {x:240,y:400,parents:[2]}, {x:120,y:400,parents:[6]},
 {x:360,y:160,parents:[1]}, {x:360,y:40,parents:[8]},
 {x:480,y:280,parents:[1]}, {x:600,y:280,parents:[10]},
 {x:480,y:160,parents:[10]}, {x:600,y:160,parents:[12]},
 {x:480,y:400,parents:[10]}, {x:600,y:400,parents:[14]},
 {x:360,y:400,parents:[1]}, {x:360,y:520,parents:[16]},
];
export function createSpecialtyTrees(classIds:readonly string[]):SpecialtyTree[]{
 return classIds.map(classId=>({classId,nodes:layout.map((n,index)=>({
  id:`${classId}-${index+1}`,name:index===0?'시작 특기':`특기 ${String(index).padStart(2,'0')}`,
  x:n.x,y:n.y,parents:n.parents.map(parent=>`${classId}-${parent}`),
 }))}));
}

(()=>{
const results=[];
for(let n=1;n<=18;n++){
 render(n);
 const factor=innerWidth/800;
 const base=stage.getBoundingClientRect();
 const visible=e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none'};
 const rect=e=>{const r=e.getBoundingClientRect();return {x:(r.x-base.x)/factor,y:(r.y-base.y)/factor,w:r.width/factor,h:r.height/factor}};
 const buttons=Array.from(stage.querySelectorAll('button')).filter(visible).map(e=>({text:e.getAttribute('aria-label')||e.innerText.trim(),...rect(e)}));
 const undersized=buttons.filter(b=>b.w<47.9||b.h<47.9);
 const outside=buttons.filter(b=>b.x<-.1||b.y<-.1||b.x+b.w>800.1||b.y+b.h>360.1);
 const overlap=[];
 for(let i=0;i<buttons.length;i++)for(let j=i+1;j<buttons.length;j++){
  const a=buttons[i],b=buttons[j],w=Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x),h=Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y);
  if(w>.5&&h>.5)overlap.push([a.text,b.text,w,h]);
 }
 const detail=stage.querySelector('.detail');
 const count=s=>stage.querySelectorAll(s).length;
 const info={state:n,buttons,undersized,outside,overlap,fieldCells:count('.field-cell'),candidateCards:count('.cards .card'),roster:Array.from(stage.querySelectorAll('[data-roster]')).map(e=>e.dataset.roster).filter(Boolean),stats:count('.detail dl div'),skill:count('.skill'),products:count('.product'),warehouse:count('[data-grid=storage] .cell'),inventory:count('[data-grid=hero] .cell'),units:Array.from(stage.querySelectorAll('.actor:not(.ghost):not(.origin)')).map(e=>({id:e.dataset.id,kind:e.dataset.kind,cell:e.dataset.cell})),board:stage.querySelector('.board')?rect(stage.querySelector('.board')):null,detail:detail?rect(detail):null,topHeight:stage.querySelector('.phase')?rect(stage.querySelector('.phase')).h:null,forbidden:buttons.filter(b=>/가방|진형|자동배치/.test(b.text))};
 results.push(info);
}
const rosterNames=[...new Set(results.filter(r=>[3,10].includes(r.state)).flatMap(r=>r.roster))];
const checks={allButtons:results.every(r=>!r.undersized.length&&!r.outside.length&&!r.overlap.length&&!r.forbidden.length),nineCore:results.slice(0,9).length===9,roster8:rosterNames.length>=8,heroStatsTogether:[3,10].every(n=>results[n-1].stats===10&&results[n-1].skill===1),fiveCards:[1,2,3,4,5,9,10].every(n=>results[n-1].candidateCards===5),realField:[1,2,3,4,5,9,10].every(n=>results[n-1].fieldCells===20&&Math.abs(results[n-1].board.w-290)<.1&&Math.abs(results[n-1].board.h-192)<.1),battleNoEditor:results[7].candidateCards===0&&results[7].inventory===0&&results[7].products===0&&results[7].fieldCells===0,preservedUnitLayout:JSON.stringify(results[4].units)===JSON.stringify(results[7].units)&&JSON.stringify(results[4].units)===JSON.stringify(results[8].units),sameVisibleObjects:results[2].units[0].id==='G01'&&results[4].units.find(u=>u.id==='G01').kind==='guard',equipment20:results.filter(r=>[6,7,12,13,14,15,16,17,18].includes(r.state)).every(r=>r.warehouse===10&&r.inventory===20&&r.products===5),hud48:results.filter(r=>r.topHeight!==null).every(r=>Math.abs(r.topHeight-48)<.1)};
render(1);return JSON.stringify({checks,pass:Object.values(checks).every(Boolean),rosterNames,results});
})()

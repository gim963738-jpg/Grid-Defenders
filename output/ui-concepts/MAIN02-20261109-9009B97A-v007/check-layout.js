(()=>{
const rows=[],rect=e=>{const r=e.getBoundingClientRect(),b=stage.getBoundingClientRect(),z=innerWidth/800;return{x:(r.x-b.x)/z,y:(r.y-b.y)/z,w:r.width/z,h:r.height/z}};
for(let n=1;n<=6;n++){
 render(n);const buttons=Array.from(stage.querySelectorAll('button')).filter(e=>e.getBoundingClientRect().width>0&&getComputedStyle(e).visibility!=='hidden').map(e=>({text:e.getAttribute('aria-label')||e.innerText.trim(),...rect(e)}));
 const small=buttons.filter(b=>b.w<47.9||b.h<47.9),outside=buttons.filter(b=>b.x<-.1||b.y<-.1||b.x+b.w>800.1||b.y+b.h>360.1),overlap=[];
 for(let i=0;i<buttons.length;i++)for(let j=i+1;j<buttons.length;j++){const a=buttons[i],b=buttons[j],w=Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x),h=Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y);if(w>.5&&h>.5)overlap.push([a.text,b.text,w,h])}
 rows.push({state:n,buttons,small,outside,overlap,tabs:Array.from(stage.querySelectorAll('.tabs button')).map(e=>e.innerText),grid:Array.from(stage.querySelectorAll('.grid-board')).map(e=>({kind:e.dataset.grid,...rect(e),cell:rect(e.querySelector('.cell'))})),columns:Array.from(stage.querySelectorAll('.column')).map(e=>rect(e)),text:stage.innerText});
}
const checks={sixScreens:rows.length===6,buttons48:rows.every(r=>!r.small.length),noOutside:rows.every(r=>!r.outside.length),noOverlap:rows.every(r=>!r.overlap.length),tabOrder:rows.every(r=>r.tabs.slice(0,3).join('|')==='병력·배치|장비|아이템 도감'),enemyHiddenNormal:rows.slice(0,4).every(r=>!r.tabs.includes('적 정보')&&!r.text.includes('다음 보스')),enemyOnlyPreMidboss:rows.slice(4).every(r=>r.tabs.includes('적 정보')),combineAccess:rows[0].text.includes('장비 조합')&&rows[4].text.includes('장비 조합'),same54Grids:[rows[0],rows[4]].every(r=>r.grid.length===2&&r.grid.every(g=>Math.abs(g.cell.w-54)<.1&&Math.abs(g.cell.h-54)<.1&&Math.abs(g.y-120)<.1)),sameThreeColumns:[rows[0],rows[4]].every(r=>r.columns.length===3&&[12,216,508].every((x,i)=>Math.abs(r.columns[i].x-x)<.1)),noCodexCommerce:!rows[1].buttons.some(b=>/구매|즉시 조합/.test(b.text)),noOverlappingEquipment:rows[1].grid.length===0&&rows[2].grid.length===0&&rows[5].grid.length===0};
render(1);const gearBefore=stage.querySelector('.column.hero').innerHTML+stage.querySelector('.column.storage .grid-board').innerHTML;
render(2);checks.recipeMatches=stage.querySelector('[data-material]').dataset.material==='I01'&&stage.querySelectorAll('[data-material]')[1].dataset.material==='I03'&&stage.querySelector('[data-result]').dataset.result==='I08';
codexSelection='I01';render(2);checks.basicNoCraft=stage.querySelector('.no-recipe').innerText.includes('조합법 없음')&&!stage.querySelector('.recipe-chain');
codexPage=1;codexSelection='I10';render(2);checks.fullCodex=stage.querySelectorAll('[data-codex]').length===3&&stage.querySelectorAll('.footprint-preview i:not(.empty)').length===9;
codexPage=0;codexSelection='I08';render(1);checks.codexReturnPreserves=gearBefore===stage.querySelector('.column.hero').innerHTML+stage.querySelector('.column.storage .grid-board').innerHTML;
recipeSelection='R03';render(3);checks.readyRecipe=!stage.querySelector('.craft-execute').disabled&&stage.querySelectorAll('[data-material]').length===2&&stage.querySelector('[data-result]').dataset.result==='I08';
recipeSelection='R01';render(3);checks.insufficientDisabled=stage.querySelector('.craft-execute').disabled;
recipeSelection='R03';render(3);checks.result3Cells=stage.querySelectorAll('.result-fill').length===3;
render(4);const floor=Array.from(stage.querySelectorAll('.floor-zone')).map(e=>({rank:e.dataset.rank,...rect(e),background:getComputedStyle(e).backgroundColor}));
checks.rankDirection=floor.map(r=>r.rank).join('|')==='rear|middle|front'&&floor[0].x<floor[1].x&&floor[1].x<floor[2].x;
checks.rankSizes=Math.abs(floor[0].w-136)<.1&&Math.abs(floor[1].w-68)<.1&&Math.abs(floor[2].w-136)<.1;
checks.rankLabels=stage.querySelector('.rank-labels').innerText.includes('후열')&&stage.querySelector('.rank-labels').innerText.includes('중열')&&stage.querySelector('.rank-labels').innerText.includes('전열');
render(4,{heroPage:0});const first=Array.from(stage.querySelectorAll('[data-roster]')).map(e=>e.dataset.roster).filter(Boolean);checks.heroStatsSkills=stage.querySelectorAll('.detail dl div').length===10&&!!stage.querySelector('.skill');
render(4,{heroPage:1});const second=Array.from(stage.querySelectorAll('[data-roster]')).map(e=>e.dataset.roster).filter(Boolean);checks.hero8=new Set([...first,...second]).size>=8;checks.fiveCandidates=stage.querySelectorAll('.cards .card').length===5;
render(4,{auto:true});checks.autoNoEditing=!stage.querySelector('.floor-zones')&&!stage.querySelector('.board')&&!stage.querySelector('.cards')&&!stage.innerText.includes('다음 보스');
render(1);return JSON.stringify({checks,pass:Object.values(checks).every(Boolean),floor,rows});
})()

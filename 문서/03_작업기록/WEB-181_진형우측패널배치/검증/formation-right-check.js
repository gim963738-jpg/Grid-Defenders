// Isolated QA origin only: same-origin #qa-game iframe with a deployed roster.
// Run after assets load; this exercises real UI and its separate test checkpoint.
(async()=>{
 const frame=document.querySelector('#qa-game'),w=frame.contentWindow,d=w.document,api=d.getElementById('live-landscape').liveBattle,g=api.game;
 const qa=window.dockQA={date:'2026-11-07',checks:[],failed:null},check=(ok,name)=>{qa.checks.push({name,passed:!!ok});if(!ok)throw Error(name)};
 const sleep=ms=>new Promise(r=>setTimeout(r,ms)),dialog=d.getElementById('battle-formation-dialog'),host=d.getElementById('live-landscape'),open=()=>d.querySelector('#live-actions [data-action=formation]').click(),done=()=>d.querySelector('[data-formation-close]').click(),paused=()=>d.getElementById('app').dataset.combatPaused==='true';
 const near=(a,b)=>Math.abs(a-b)<1.5,cell=i=>dialog.querySelectorAll('[data-formation-cell]')[i];
 const settle=async(width)=>{frame.style.width=width+'px';for(let i=0;i<40;i++){await sleep(50);const x=geometry();if(near(w.innerWidth,width)&&near(x.r.left-x.h.left,524))return;}};
 const geometry=()=>{
  const r=dialog.getBoundingClientRect(),h=host.getBoundingClientRect(),terrain=d.getElementById('live-terrain').getBoundingClientRect(),controls=d.getElementById('live-controls').getBoundingClientRect();
  return {r,h,terrain,controls};
 };
 try{
  if(!dialog.open)open();
  await settle(800);
  const {r,h,terrain,controls}=geometry();
  check(dialog.open&&api.formationOpen&&paused(),'right formation panel opens and pauses combat');
  check(near(r.left-h.left,524)&&near(r.top-h.top,44)&&near(r.width,272)&&near(r.height,312),'panel uses requested right region at 524,44 with 272x312 size');
  check(r.left>=terrain.right+7&&r.top>=controls.bottom+3,'panel stays clear of battlefield and upper controls');
  check(near(h.right-r.right,4)&&near(h.bottom-r.bottom,4),'right and bottom margins are 4 pixels');
  check(w.getComputedStyle(dialog,'::backdrop').backgroundColor==='rgba(0, 0, 0, 0)','battlefield backdrop is transparent');
  check(dialog.scrollHeight<=dialog.clientHeight+1&&dialog.scrollWidth<=dialog.clientWidth+1,'entire panel fits without scrolling or clipped content');
  const board=dialog.querySelector('.formation-board'),bs=w.getComputedStyle(board);
  check(board.children.length===28&&bs.gridTemplateColumns.split(' ').length===7&&bs.gridTemplateRows.split(' ').length===4,'7 by 4 formation remains intact');
  check([...board.children].every(c=>{const x=c.getBoundingClientRect();return near(x.width,30)&&near(x.height,42)&&x.left>=r.left&&x.right<=r.right&&x.bottom<r.bottom}),'all compact cells fit inside panel');
  check([...dialog.querySelectorAll('[data-formation-auto],[data-formation-close]')].every(b=>b.getBoundingClientRect().height>=47.5),'auto and done buttons retain 48-pixel height');
  check(dialog.querySelector('[data-formation-auto]').getBoundingClientRect().left>=dialog.querySelector('.formation-direction').getBoundingClientRect().right,'auto remains to right of advance direction');
  const before=g.units.map(u=>[u.id,u.slot]),gold=g.gold;
  dialog.querySelector('[data-formation-auto]').click();
  check(g.heroes().every(u=>{const c=g.formationSlots().find(p=>p.unitId===u.id).cell;return c>=7&&c<21}),'auto keeps all heroes in middle');
  const guard=g.units.find(u=>u.kind==='guard'),from=g.formationSlots().find(p=>p.unitId===guard.id).cell;
  cell(from).click();cell(0).click();
  check(g.formationSlots().some(p=>p.unitId===guard.id&&p.cell===0),'manual movement works inside right panel');
  check(JSON.stringify(before)===JSON.stringify(g.units.map(u=>[u.id,u.slot]))&&g.gold===gold,'formation editing preserves wave placement and currency');
  const saved=JSON.parse(localStorage.getItem('grid-defenders.battle-save.v1.landscape.infinite-test'));
  check(saved.defense.formation.some(p=>p.unitId===guard.id&&p.cell===0),'right panel still saves formation');
  await settle(1200);
  const wide=geometry();
  check(near(wide.r.left-wide.h.left,524)&&wide.h.left>100,'panel follows centered 800-pixel battlefield on wider screen');
  await settle(800);
  check(near(geometry().r.left-geometry().h.left,524),'panel returns to correct position after resize');
  done();await sleep(30);
  check(!dialog.open&&!api.formationOpen&&paused(),'closing preserves prior manual pause');
  check(d.activeElement===d.querySelector('#live-actions [data-action=formation]'),'keyboard focus returns to formation button');
  api.pause();open();dialog.dispatchEvent(new w.Event('cancel',{cancelable:true}));await sleep(30);
  check(!dialog.open&&!paused(),'Escape dismissal restores previously running combat');
  open();dialog.dispatchEvent(new w.MouseEvent('click',{bubbles:true,clientX:200,clientY:100}));await sleep(30);
  check(!dialog.open&&!api.formationOpen,'clicking outside right panel closes it');
  open();done();open();await sleep(30);
  check(dialog.open&&api.formationOpen,'quick reopen ignores delayed previous close event');
  d.dispatchEvent(new w.Event('freeze'));await sleep(30);
  check(!dialog.open&&paused()&&!api.formationOpen,'background suspend closes editor and keeps battle paused');
  open();dialog.querySelector('[data-formation-auto]').click();
  check(w.performance.getEntriesByType('resource').every(r=>!r.responseStatus||r.responseStatus<400),'no failed asset requests');
  qa.result='PASS';
 }catch(e){qa.result='FAIL';qa.failed=String(e);}
 return qa;
})()

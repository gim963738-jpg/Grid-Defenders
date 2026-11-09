// Isolated QA origin only; requires #qa-game same-origin iframe at 800x360.
// Fixture: 3 guards, 2 archers, 1 mage and 3 heroes deployed; no items.
// Uses actual game UI and current checkpoint. Never run against a player's save.
(async()=>{
 const w=document.querySelector('#qa-game').contentWindow,d=w.document;
 const api=d.getElementById('live-landscape').liveBattle,g=api.game;
 const qa=window.formationQA={date:'2026-11-07',scope:'isolated origin, 800x360 iframe, existing game UI',checks:[],failed:null};
 const check=(ok,name)=>{qa.checks.push({name,passed:!!ok});if(!ok)throw Error(name)};
 const sleep=ms=>new Promise(r=>setTimeout(r,ms));
 const dialog=()=>d.getElementById('battle-formation-dialog');
 const cell=i=>d.querySelectorAll('[data-formation-cell]')[i];
 const done=()=>d.querySelector('[data-formation-close]').click();
 const paused=()=>d.getElementById('app').dataset.combatPaused==='true';
 const open=()=>d.querySelector('#live-actions [data-action=formation]').click();
 const at=id=>g.formationSlots().find(p=>p.unitId===id).cell;
 try{
  if(d.getElementById('battle-resume-dialog').open)d.querySelector('[data-resume-primary]').click();
  if(api.scene!=='defense'){d.getElementById('dev-defense-scene').click();for(let i=0;i<30;i++){for(const a of d.getAnimations())a.finish();await sleep(30);if(api.scene==='defense'&&d.getElementById('app').getAttribute('aria-busy')!=='true')break;}await sleep(180);}
  if(dialog().open)done(); await sleep(30);
  if(paused())api.pause();
  const original=JSON.stringify(g.units.map(u=>[u.id,u.slot])),gold=g.gold;
  open();
  check(dialog().open&&api.formationOpen&&paused(),'formation menu opens native dialog and pauses combat');
  check(d.querySelectorAll('[data-formation-cell]').length===28,'exactly 28 cells');
  const style=w.getComputedStyle(d.querySelector('.formation-board'));
  check(style.gridTemplateColumns.split(' ').length===7&&style.gridTemplateRows.split(' ').length===4,'7 columns and 4 rows');
  const r=dialog().getBoundingClientRect(),scroll=d.querySelector('.formation-scroll');
  check(r.top>=7&&r.bottom<=w.innerHeight-7,'whole dialog fits 800x360 with edge spacing');
  check(dialog().scrollHeight<=dialog().clientHeight+1&&scroll.scrollWidth<=scroll.clientWidth+1,'no dialog or board scrolling at landscape reference size');
  check([...d.querySelectorAll('[data-formation-cell], [data-formation-auto], [data-formation-close]')].every(b=>b.getBoundingClientRect().width>=47.5&&b.getBoundingClientRect().height>=47.5),'every formation target is at least 48 CSS pixels within rounding');
  check(d.querySelector('[data-formation-auto]').getBoundingClientRect().left>=d.querySelector('.formation-direction').getBoundingClientRect().right,'automatic arrangement sits to right of upward direction icon');
  check(d.documentElement.classList.contains('formation-editing'),'page scroll locked during edit');
  d.querySelector('[data-formation-auto]').click();
  const heroes=g.heroes(),guards=g.units.filter(u=>u.kind==='guard'),ranged=g.units.filter(u=>['archer','mage'].includes(u.kind));
  check(heroes.every(u=>at(u.id)>=7&&at(u.id)<21),'all heroes automatically placed in middle rows');
  check(guards.every(u=>at(u.id)<7),'infantry automatically placed in front row');
  check(ranged.every(u=>at(u.id)>=21),'archer and mage automatically placed in rear row');
  check(g.formationSlots().length===g.units.length&&new Set(g.formationSlots().map(p=>p.cell)).size===g.units.length,'all units assigned exactly once with no overlap');
  const guard=guards[0],other=guards[1],oldOther=at(other.id);
  cell(at(guard.id)).click();cell(0).click();
  check(at(guard.id)===0,'click selected unit then empty cell moves it');
  cell(at(guard.id)).click();cell(oldOther).click();
  check(at(guard.id)===oldOther&&at(other.id)===0,'occupied destination swaps units');
  const hero=heroes[0],beforeHero=JSON.stringify(g.formationSlots());
  cell(at(hero.id)).click();cell(6).click();
  check(JSON.stringify(g.formationSlots())===beforeHero&&d.getElementById('formation-message').textContent.includes('중열'),'hero move outside middle rejected without changing placement');
  cell(17).click();
  check(at(hero.id)===17,'hero can move to second middle row');
  check(JSON.stringify(g.units.map(u=>[u.id,u.slot]))===original&&g.gold===gold,'editing leaves wave slots and currency unchanged');
  const stored=JSON.parse(localStorage.getItem('grid-defenders.battle-save.v1.landscape.infinite-test'));
  check(stored.defense.formation.some(p=>p.unitId===hero.id&&p.cell===17),'manual formation immediately saved in checkpoint');
  done(); await sleep(30);
  check(!dialog().open&&!api.formationOpen&&!paused(),'closing restores previously running combat');
  check(!d.documentElement.classList.contains('formation-editing'),'closing releases page scroll lock');
  check(d.activeElement===d.querySelector('#live-actions [data-action=formation]'),'closing returns keyboard focus to formation button');
  open();done();open();await sleep(30);
  check(dialog().open&&api.formationOpen,'rapid close and reopen ignores previous native close event');done();await sleep(30);
  api.pause();open();done();await sleep(30);
  check(paused(),'closing preserves previously paused combat');
  const units=g.units;g.units=[];api.refresh();open();
  check(d.querySelector('[data-formation-auto]').disabled&&d.querySelectorAll('.formation-cell.occupied').length===0,'empty roster keeps 28 empty cells and disables auto');
  done();g.units=units;g.autoArrangeFormation();api.refresh();
  if(paused())api.pause();open();
  d.dispatchEvent(new w.Event('freeze'));await sleep(30);
  check(!dialog().open&&!api.formationOpen&&paused(),'page freeze closes editor and keeps combat paused');
  open();d.querySelector('[data-formation-auto]').click();
  const expected=JSON.stringify(g.formationSlots());
  done();
  const save=JSON.parse(localStorage.getItem('grid-defenders.battle-save.v1.landscape.infinite-test'));
  check(JSON.stringify(save.defense.formation)===expected,'automatic arrangement persisted before boss entry');
  d.getElementById('dev-boss-scene').click();
  for(let i=0;i<20;i++){for(const a of d.getAnimations())a.finish();await sleep(60);if(api.scene==='boss'&&d.getElementById('app').getAttribute('aria-busy')!=='true')break;}
  check(api.scene==='boss','developer transition reaches actual boss scene');
  const bossSave=JSON.parse(localStorage.getItem('grid-defenders.battle-save.v1.landscape.infinite-test'));
  const allies=bossSave.boss.actors.filter(a=>a.side==='ally');
  check(allies.length===g.units.length,'actual boss receives all deployed allies');
  check(allies.every(a=>{const p=g.formationSlots().find(p=>'ally-'+p.unitId===a.id),row=Math.floor(p.cell/7),col=p.cell%7;return Math.abs(a.x-(3-row+.5)*56.25)<.01&&Math.abs(a.y-(37.5+(col+.5)*56.25))<.01&&a.rank===(row===0?0:row===3?2:1)}),'actual paused boss positions and ranks match edited north-facing formation rotated toward enemy');
  const party=d.getElementById('boss-party'),pr=party.getBoundingClientRect(),br=d.getElementById('boss-screen').getBoundingClientRect();
  check(party.children.length===28&&Math.abs(pr.width-144)<1&&Math.abs(pr.height-252)<1&&Math.abs(pr.top-br.top-24)<1,'boss preview grid uses matching 4x7 area above skill HUD');
  check(!api.beginFormation(),'formation editor does not alter an in-progress boss');
  check(w.performance.getEntriesByType('resource').every(x=>!x.responseStatus||x.responseStatus<400),'no failed runtime asset request');
  qa.bossAllies=allies.map(a=>({id:a.id,x:a.x,y:a.y,rank:a.rank}));
  qa.result='PASS';
 }catch(e){qa.failed=String(e);qa.result='FAIL';}
 return qa;
})()

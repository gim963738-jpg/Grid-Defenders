// Run only on the separate QA origin with #qa-game at 800x360.
// Fixture: 8 guards, 5 archers, 4 mages and 3 heroes, paused.
// First click auto and done through real browser input, verify success and store
// window.sixRealClickCheck={auto:true,done:true}; the first assertion requires it.
(async()=>{
 const frame=document.querySelector('#qa-game'),w=frame.contentWindow,d=w.document,api=d.getElementById('live-landscape').liveBattle,g=api.game;
 const qa=window.sixQA={date:'2026-11-07',checks:[],failed:null},check=(ok,name)=>{qa.checks.push({name,passed:!!ok});if(!ok)throw Error(name)};
 const sleep=ms=>new Promise(r=>setTimeout(r,ms)),panel=d.getElementById('battle-formation-dialog'),host=d.getElementById('live-landscape');
 const open=()=>d.querySelector('#live-actions [data-action=formation]').click(),done=()=>panel.querySelector('[data-formation-close]').click();
 const paused=()=>d.getElementById('app').dataset.combatPaused==='true',cell=i=>panel.querySelectorAll('[data-formation-cell]')[i],at=id=>g.formationSlots().find(p=>p.unitId===id).cell,near=(a,b)=>Math.abs(a-b)<1.5;
 const settle=async(width)=>{frame.style.width=width+'px';for(let i=0;i<40;i++){await sleep(50);const p=panel.getBoundingClientRect(),h=host.getBoundingClientRect(),b=panel.querySelector('[data-formation-close]').getBoundingClientRect();if(near(w.innerWidth,width)&&near(p.left-h.left,524)&&near(b.left-h.left,90))return;}};
 try{
  check(window.sixRealClickCheck?.auto&&window.sixRealClickCheck?.done,'actual browser pointer clicks activate both relocated buttons');
  if(!panel.open)open();
  check(panel.open&&api.formationOpen&&paused(),'editor opens and pauses combat');
  check(panel.querySelectorAll('[data-formation-cell]').length===42,'board has all forty-two cells');
  const bs=w.getComputedStyle(panel.querySelector('.formation-board'));
  check(bs.gridTemplateColumns.split(' ').length===7&&bs.gridTemplateRows.split(' ').length===6,'board is seven columns by six rows');
  check(['0','1','2'].every(rank=>[...panel.querySelectorAll('[data-rank]')].filter(b=>b.dataset.rank===rank).length===14),'front middle and rear each have two rows and fourteen cells');
  check(!panel.querySelector('#formation-title')&&!panel.querySelector('.formation-heading').textContent.includes('진형'),'visible formation title is removed');
  const p=panel.getBoundingClientRect(),h=host.getBoundingClientRect(),board=panel.querySelector('.formation-board').getBoundingClientRect(),controls=d.getElementById('live-controls').getBoundingClientRect();
  check(near(p.left-h.left,524)&&near(p.top-h.top,44)&&p.left>=d.getElementById('live-terrain').getBoundingClientRect().right+7&&p.top>=controls.bottom+3,'six-row right panel stays clear of battlefield and upper controls');
  check(board.bottom<p.bottom&&[...panel.querySelectorAll('[data-formation-cell]')].every(b=>{const r=b.getBoundingClientRect();return r.left>=p.left&&r.right<=p.right&&r.bottom<=p.bottom}),'all six rows fit inside panel without clipping');
  const buttons=[panel.querySelector('[data-formation-close]'),panel.querySelector('[data-formation-auto]')];
  check(buttons.every(b=>near(b.getBoundingClientRect().top-h.top,284)&&near(b.getBoundingClientRect().height,72))&&near(buttons[0].getBoundingClientRect().left-h.left,90),'done then automatic arrangement share the bottom shop card line');
  check(buttons.every(b=>{const r=b.getBoundingClientRect(),hit=d.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return b===hit||b.contains(hit)}),'moved controls receive real pointer input outside panel rectangle');
  check(buttons.every(b=>{const r=b.getBoundingClientRect();return r.bottom<=h.bottom&&r.right<p.left}),'bottom controls stay visible and clear of right board');
  check(w.getComputedStyle(panel,'::backdrop').backgroundColor==='rgba(0, 0, 0, 0)','battlefield remains undimmed');
  const original=JSON.stringify(g.units.map(u=>[u.id,u.slot])),gold=g.gold;
  buttons[1].click();
  check(g.units.filter(u=>u.kind==='guard').every(u=>at(u.id)<14)&&g.heroes().every(u=>at(u.id)>=14&&at(u.id)<28)&&g.units.filter(u=>['archer','mage'].includes(u.kind)).every(u=>at(u.id)>=28),'automatic placement uses expanded rank bands');
  const guard=g.units.find(u=>u.kind==='guard'),mage=g.units.find(u=>u.kind==='mage'),hero=g.heroes()[0];
  cell(at(guard.id)).click();cell(7).click();check(at(guard.id)===7,'front unit can move into the added front row');
  cell(at(mage.id)).click();cell(28).click();check(at(mage.id)===28,'rear unit can move within the expanded rear band');
  cell(at(hero.id)).click();cell(27).click();check(at(hero.id)===27,'hero remains movable in the second middle row');
  const before=JSON.stringify(g.formationSlots());cell(at(hero.id)).click();cell(13).click();
  check(JSON.stringify(g.formationSlots())===before&&d.getElementById('formation-message').textContent.includes('중열'),'front-row expansion does not bypass existing hero placement validation');
  check(JSON.stringify(g.units.map(u=>[u.id,u.slot]))===original&&g.gold===gold,'editing preserves wave slots and currency');
  const saved=JSON.parse(localStorage.getItem('grid-defenders.battle-save.v1.landscape.infinite-test'));
  check(saved.defense.formationRows===6&&saved.defense.formation.some(p=>p.unitId===hero.id&&p.cell===27),'six-row layout and manual positions are saved');
  await settle(1200);
  check(host.getBoundingClientRect().left>100&&near(panel.getBoundingClientRect().left-host.getBoundingClientRect().left,524)&&near(buttons[0].getBoundingClientRect().left-host.getBoundingClientRect().left,90),'board and detached controls follow centered battlefield on wider viewport');
  await settle(800);check(near(buttons[1].getBoundingClientRect().top-host.getBoundingClientRect().top,284),'controls return to correct shop line after resize');
  done();await sleep(30);check(!panel.open&&!api.formationOpen&&paused(),'done closes editor while preserving earlier manual pause');
  check(d.activeElement===d.querySelector('#live-actions [data-action=formation]'),'done restores menu focus');
  api.pause();open();done();await sleep(30);check(!paused(),'done restores earlier running state');
  open();d.dispatchEvent(new w.Event('freeze'));await sleep(30);check(!panel.open&&!api.formationOpen&&paused(),'background suspend closes editor and keeps battle paused');
  d.getElementById('dev-boss-scene').click();
  for(let i=0;i<30;i++){for(const a of d.getAnimations())a.finish();await sleep(50);if(api.scene==='boss'&&d.getElementById('app').getAttribute('aria-busy')!=='true')break;}
  check(api.scene==='boss','actual developer transition enters boss battle');
  const bossSave=JSON.parse(localStorage.getItem('grid-defenders.battle-save.v1.landscape.infinite-test')),allies=bossSave.boss.actors.filter(a=>a.side==='ally');
  check(allies.length===g.units.length&&allies.every(a=>{const c=g.formationSlots().find(p=>'ally-'+p.unitId===a.id).cell,row=Math.floor(c/7),col=c%7;return near(a.x,(5-row+.5)*56.25)&&near(a.y,37.5+(col+.5)*56.25)&&a.rank===Math.floor(row/2)}),'actual boss units use six-row formation positions and rank membership');
  const party=d.getElementById('boss-party'),pr=party.getBoundingClientRect(),ps=w.getComputedStyle(party);
  check(party.children.length===42&&near(pr.width,216)&&near(pr.height,252)&&ps.gridTemplateColumns.split(' ').length===6&&ps.gridTemplateRows.split(' ').length===7,'boss grid matches rotated six by seven formation and same-sized cells');
  check(w.performance.getEntriesByType('resource').every(r=>!r.responseStatus||r.responseStatus<400),'no failed runtime asset requests');
  qa.result='PASS';
 }catch(e){qa.result='FAIL';qa.failed=String(e);}
 return qa;
})()

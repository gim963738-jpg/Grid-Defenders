// Use only the isolated QA origin and same-origin #qa-game at 800x360.
// Fixture: ranged caster, blond warrior, mage soldier and guard; paused.
// Before running, drag the dummy with real browser pointer input from 130,150
// to 210,180 and set window.rangeRealDrag to its measured data-x/data-y.
(async()=>{
 const frame=document.querySelector('#qa-game'),w=frame.contentWindow,d=w.document,a=d.getElementById('live-landscape').liveBattle,g=a.game;
 const qa=window.rangeQA={date:'2026-11-08',checks:[],failed:null},check=(ok,name)=>{qa.checks.push({name,passed:!!ok});if(!ok)throw Error(name)},sleep=ms=>new Promise(r=>setTimeout(r,ms)),near=(x,y)=>Math.abs(x-y)<1.5;
 const toggle=d.getElementById('dev-range-dummy'),layer=()=>d.getElementById('dev-range-overlay'),handle=()=>d.querySelector('.dev-range-handle'),circles=()=>[...d.querySelectorAll('#dev-range-overlay circle[data-r]')],host=d.getElementById('live-landscape');
 const transition=async(id,scene)=>{d.getElementById(id).click();for(let i=0;i<30;i++){for(const x of d.getAnimations())x.finish();await sleep(40);if(a.scene===scene&&d.getElementById('app').getAttribute('aria-busy')!=='true')break;}};
 try{
  check(window.rangeRealDrag?.x>200&&window.rangeRealDrag?.y>200,'dummy moved through actual browser pointer drag');
  check(toggle.getAttribute('aria-pressed')==='true'&&!layer().hidden,'developer tool enables persistent measuring dummy');
  check(circles().length===6&&circles().map(c=>c.getAttribute('r')).join(',')==='65,130,195,260,325,390','six circles measure 0.5R steps through 3R');
  check(circles().map(c=>c.getAttribute('stroke')).join(',')==='#52b8ff,#ffdc55,#52b8ff,#ffdc55,#52b8ff,#ffdc55','rings alternate blue and yellow');
  check([...d.querySelectorAll('.dev-range-label')].map(n=>n.dataset.r).join(',')==='0.5,1,1.5,2,2.5,3','all distance labels identify their R multiplier');
  check([...d.querySelectorAll('.dev-range-label')].map(n=>n.dataset.distance).join(',')==='65,130,195,260,325,390','labels include actual combat-coordinate distances');
  check(near(circles()[1].getBoundingClientRect().width,260),'wave 1R diameter equals 260 logical screen pixels');
  const state=JSON.stringify({units:g.units,gear:g.gear,gold:g.gold});
  a.clearSelection();check(!layer().hidden&&circles().length===6,'measurement stays visible after clearing normal unit selection');
  const beforeX=Number(handle().dataset.x);handle().dispatchEvent(new w.KeyboardEvent('keydown',{key:'ArrowLeft',bubbles:true}));
  check(near(Number(handle().dataset.x),beforeX-8),'keyboard movement shifts the same measuring origin');
  check(circles().every(c=>near(Number(c.getAttribute('cx')),Number(handle().dataset.x))&&near(Number(c.getAttribute('cy')),Number(handle().dataset.y))),'all circles follow the dummy ground reference');
  const waveOrigin={x:Number(handle().dataset.x),y:Number(handle().dataset.y)};
  toggle.click();check(layer().hidden&&toggle.getAttribute('aria-pressed')==='false','developer toggle hides dummy and circles together');
  toggle.click();check(!layer().hidden&&near(Number(handle().dataset.x),waveOrigin.x),'toggle restores the chosen location');
  check(JSON.stringify({units:g.units,gear:g.gear,gold:g.gold})===state,'measuring tool never changes roster equipment or currency');
  const r=handle().getBoundingClientRect(),hit=d.elementFromPoint(r.left+r.width/2,r.top+r.height/2);
  check(handle().contains(hit)&&r.width>=47.5&&r.height>=71.5,'dummy has an actual 48 by 72 pointer target');
  await sleep(180);d.querySelector('#live-actions [data-action=formation]').click();
  const panel=d.getElementById('battle-formation-dialog'),base=host.getBoundingClientRect(),done=panel.querySelector('[data-formation-close]').getBoundingClientRect(),auto=panel.querySelector('[data-formation-auto]').getBoundingClientRect(),hint=d.getElementById('formation-message').getBoundingClientRect(),tiles=d.getElementById('live-tiles').getBoundingClientRect();
  check(panel.open&&near(done.left-base.left,160)&&near(done.top-base.top,260),'formation controls move to board left edge and eight pixels below placement tiles');
  check(near(done.top-tiles.bottom,8)&&near(auto.top,done.top)&&hint.right<panel.getBoundingClientRect().left,'moved controls and hint stay clear of the right panel');
  check(panel.querySelectorAll('[data-formation-cell]').length===42,'moving controls preserves all formation cells');
  panel.querySelector('[data-formation-close]').click();await sleep(30);
  check(!panel.open&&!a.formationOpen,'relocated done button still closes formation editor');
  await transition('dev-boss-scene','boss');
  check(a.scene==='boss'&&!layer().hidden&&layer().parentElement.classList.contains('boss-arena'),'same persistent dummy appears in boss battle');
  check(d.querySelector('.dev-range-circles').getAttribute('viewBox')==='0 0 1250 562.5','boss ruler uses actual boss-world coordinates');
  check(near(circles()[1].getBoundingClientRect().width,166.4)&&near(circles()[5].getBoundingClientRect().width,499.2),'boss 1R and 3R use the correct 0.64 display scale');
  check(circles().map(c=>c.getAttribute('r')).join(',')==='65,130,195,260,325,390','boss mode retains the same 130-unit R definition');
  check(!!d.querySelector('.boss-fighter.blond .boss-blond-frame'),'boss renders the original blond reference through its normal frame renderer');
  qa.bossGeometry={oneRDiameter:circles()[1].getBoundingClientRect().width,threeRDiameter:circles()[5].getBoundingClientRect().width};
  toggle.click();check(layer().hidden,'boss measuring overlay can also be turned off');toggle.click();
  await transition('dev-defense-scene','defense');
  check(a.scene==='defense'&&near(Number(handle().dataset.x),waveOrigin.x)&&near(Number(handle().dataset.y),waveOrigin.y),'scene return preserves wave-specific dummy location');
  check(w.performance.getEntriesByType('resource').every(r=>!r.responseStatus||r.responseStatus<400),'no runtime asset requests fail');
  qa.result='PASS';
 }catch(e){qa.result='FAIL';qa.failed=String(e);}
 return qa;
})()

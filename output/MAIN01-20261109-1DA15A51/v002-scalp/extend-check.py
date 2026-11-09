from pathlib import Path
p=Path.cwd()/'output/MAIN01-20261109-1DA15A51/v002-scalp/independent-browser.mjs'
s=p.read_text(encoding='utf-8')
a=s.index(" check(await evaluate(`(()=>{const img=document.querySelector('.compare-actor:nth-child(2) img')")
e=r'''
 for(let i=1;i<=4;i++){
  await hit(`.compare-actor:nth-child(${i})`);
  for(const percent of [50,100,200]){
   await evaluate(`(()=>{const n=document.querySelector('[type=number]');n.value='${percent}';n.dispatchEvent(new Event('input'));})()`);
   check(await evaluate(`(()=>{const n=document.querySelector('.compare-actor:nth-child(${i})'),img=n.querySelector('img'),a=catalog.find(a=>img.src.endsWith(a.file)),r=img.getBoundingClientRect(),b=n.getBoundingClientRect();return Math.abs(r.width/r.height-a.width/a.height)<.001&&Math.abs(r.left+a.footX*r.width/a.width-(b.left+b.width/2))<.1&&Math.abs(r.top+a.footY*r.height/a.height-b.bottom)<.1&&Math.abs(r.height*a.bodyHeight/a.height-57*${percent}/100)<.1})()`),`QA new ${i} ${percent}% source aspect measured pixel foot and body height preserved`);
  }
  await evaluate(`(()=>{const n=document.querySelector('[type=number]');n.value='150';n.dispatchEvent(new Event('input'));})()`);
  check(await evaluate(`document.querySelector('.compare-actor:nth-child(${i})').dataset.percent==='150'`),`QA new ${i} direct numeric 150 applies`);await hit('[data-action=reset]');
  const q=await box(`.compare-actor:nth-child(${i})`),xy=await evaluate(`({x:Number(document.querySelector('.compare-actor:nth-child(${i})').dataset.x),y:Number(document.querySelector('.compare-actor:nth-child(${i})').dataset.y)})`);
  await mouse('mousePressed',q.x,q.y);await mouse('mouseMoved',q.x+8,q.y+10);await mouse('mouseReleased',q.x+8,q.y+10);
  check(await evaluate(`Math.abs(Number(document.querySelector('.compare-actor:nth-child(${i})').dataset.x)-${xy.x+8})<.1&&Math.abs(Number(document.querySelector('.compare-actor:nth-child(${i})').dataset.y)-${xy.y+10})<.1`),`QA new ${i} movement after scaling`);
  await mouse('mousePressed',q.x+8,q.y+10);await mouse('mouseMoved',q.x,q.y);await mouse('mouseReleased',q.x,q.y);
 }
'''
s=s[:a]+e+s[a:]
a=s.index(" await evaluate(`window.normalizeSave=")
e=r'''
 await hit('.compare-actor:nth-child(9)');
 await evaluate(`(()=>{const n=document.querySelector('[type=number]');n.value='175';n.dispatchEvent(new Event('input'));})()`);
 check(await evaluate(`document.querySelector('[data-group=legacy]').getAttribute('aria-pressed')==='true'&&document.querySelector('select').value==='right90'&&document.querySelector('[type=number]').value==='175'`),'QA mixed legacy reselect restores legacy group right90 and own scale');
 await hit('.compare-actor:nth-child(2)');
 check(await evaluate(`document.querySelector('[data-group=scalp]').getAttribute('aria-pressed')==='true'&&document.querySelector('select').value==='front'&&document.querySelector('[type=number]').value==='100'`),'QA mixed new reselect restores new group front own scale');
 for(const dir of ['right45','right90']){
  const prev=await evaluate(`JSON.stringify([...document.querySelectorAll('.compare-actor')].map(n=>[n.dataset.x,n.dataset.y,n.dataset.percent,n.querySelector('img').src]))`);
  await evaluate(`(()=>{const n=document.querySelector('select');n.value='${dir}';n.dispatchEvent(new Event('change'));})()`);
  check(await evaluate(`document.querySelector('select').value==='front'&&JSON.stringify([...document.querySelectorAll('.compare-actor')].map(n=>[n.dataset.x,n.dataset.y,n.dataset.percent,n.querySelector('img').src]))===${JSON.stringify(prev)}`),'QA forced '+dir+' on new keeps all mixed images positions and sizes');
 }
 await hit('.compare-actor:nth-child(9)');check(await evaluate(`document.querySelector('select').value==='right90'&&document.querySelector('[type=number]').value==='175'`),'QA mixed legacy scale survives roundtrip');
 await hit('.compare-actor:nth-child(10)');
'''
s=s[:a]+e+s[a:]
a=s.index(" await evaluate(`document.querySelector('#dev-image-compare').click();document.querySelector('[data-action=clear]').click()`);")
e=r'''
 await evaluate(`api.select('blond')`);await click(247,147);check(await evaluate(`api.game.units.some(u=>u.kind==='blond')`),'QA actual hero summons with closed comparison');
'''
s=s[:a]+e+s[a:]
a=s.index(" await evaluate(`document.querySelector('#dev-boss-scene').click()`)")
e=r'''
 await cdp('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:360,y:235,id:20}]});await cdp('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 check(await evaluate(`document.querySelectorAll('.compare-actor').length===2`),'QA touch places new front on actual battlefield');
 const qCancel=await box('.compare-actor:first-child');await mouse('mousePressed',qCancel.x,qCancel.y);
 const cancelX=await evaluate(`document.querySelector('.compare-actor').dataset.x`);await evaluate(`document.querySelector('.compare-actor').dispatchEvent(new PointerEvent('pointercancel',{bubbles:true,pointerId:1}))`);await mouse('mouseMoved',qCancel.x+30,qCancel.y);await mouse('mouseReleased',qCancel.x+30,qCancel.y);
 check(await evaluate(`document.querySelector('.compare-actor').dataset.x===${JSON.stringify(cancelX)}&&!document.querySelector('.compare-actor').hasPointerCapture(1)`),'QA new actor drag cancel prevents stale movement');
'''
s=s[:a]+e+s[a:]
# Enable ordinary real summon while panel remains open but placement is disabled.
a=s.index(" await evaluate(`document.querySelector('#dev-defense-scene').click()`)")
# no additional summons at narrow viewport, already verify close recovery.
s=s.replace(" report.result=report.checks.every(c=>c.passed)?'PASS':'FAIL';"," report.result=report.checks.every(c=>c.passed)?'PASS':'FAIL';")
p.write_text(s,encoding='utf-8')

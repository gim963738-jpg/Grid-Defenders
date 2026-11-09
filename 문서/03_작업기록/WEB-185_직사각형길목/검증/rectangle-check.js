// Run only on the isolated QA page. Restore its storage even on failure.
(async()=>{
if(location.origin!=='http://127.0.0.1:5197'||location.pathname!=='/tests/browser-check.html')throw Error('Use the isolated QA page');
try {
await (async()=>{
if(!sessionStorage.getItem('rectangle-qa-storage'))sessionStorage.setItem('rectangle-qa-storage',JSON.stringify(Object.fromEntries(Object.entries(localStorage))));
const f=document.createElement('iframe');f.id='qa-game';f.title='rectangle QA';f.style.cssText='width:800px;height:360px;border:0;display:block';f.src='/battle-landscape.html?battle=infinite-test';
document.body.replaceChildren(f);document.body.style.cssText='margin:0;background:#14231d';
await new Promise(resolve=>f.onload=resolve);const w=f.contentWindow,d=w.document;
for(let i=0;i<120&&!d.getElementById('live-landscape')?.liveBattle?.ready;i++)await new Promise(r=>setTimeout(r,40));
const api=d.getElementById('live-landscape').liveBattle;
if(d.getElementById('battle-resume-dialog')?.open)d.querySelector('[data-resume-primary]').click();
d.getElementById('dev-infinite-test').click();
for(let i=0;i<50;i++){d.getAnimations().forEach(a=>{try{a.finish();}catch{}});await new Promise(r=>setTimeout(r,40));if(api.scene==='defense'&&d.getElementById('app').getAttribute('aria-busy')!=='true')break;}
await new Promise(r=>setTimeout(r,300));if(d.getElementById('battle-resume-dialog')?.open)d.querySelector('[data-resume-primary]').click();
if(d.getElementById('app').dataset.combatPaused!=='true')api.pause();d.documentElement.style.overflow='hidden';d.body.style.overflow='hidden';
const cfg=await w.eval("import('/src/defenseConfig.ts')"),def=await w.eval("import('/src/defense.ts')");
api.game.enemies=[];let distance=0;
for(let i=0;i<cfg.PATH.length;i++){api.game.spawnTestMonster('normal');const e=api.game.enemies.at(-1);e.distance=distance;Object.assign(e,def.pathPoint(distance));distance+=Math.hypot(cfg.PATH[(i+1)%cfg.PATH.length][0]-cfg.PATH[i][0],cfg.PATH[(i+1)%cfg.PATH.length][1]-cfg.PATH[i][1]);}
api.refresh();d.getElementById('live-notice').style.display='none';
return {scene:api.scene,ready:api.ready,path:cfg.PATH,enemies:api.game.enemies.map(e=>({x:e.x,y:e.y})),length:distance};
})();
return await (async()=>{
const w=document.getElementById('qa-game').contentWindow,d=w.document,api=d.getElementById('live-landscape').liveBattle,checks=[];
const check=(ok,name)=>{if(!ok)throw Error(name);checks.push(name);};
const cfg=await w.eval("import('/src/defenseConfig.ts')"),def=await w.eval("import('/src/defense.ts')"),field=await w.eval("import('/src/landscapeField.ts')");
check(api.ready&&api.scene==='defense','actual landscape field loads');
check(cfg.PATH.length===4&&cfg.PATH.every((p,i)=>{const n=cfg.PATH[(i+1)%4];return (p[0]===n[0])!==(p[1]===n[1]);}),'four straight sides and ninety-degree corners');
const grid=d.getElementById('live-tiles').getBoundingClientRect();
check(Math.abs(grid.x-160)<.1&&Math.abs(grid.y-84)<.1&&Math.abs(grid.width-290)<.1&&Math.abs(grid.height-168)<.1&&cfg.SLOTS.length===20,'existing twenty placement tiles keep their positions');
check(field.LANDSCAPE_TRAIL.width===58,'vertical road width stays one 58px tile');
check(api.game.enemies.length===4&&api.game.enemies.every((e,i)=>e.x===cfg.PATH[i][0]&&e.y===cfg.PATH[i][1]),'monsters occupy all four rectangular corners');
const svg=d.querySelector('#live-terrain>svg'),source=svg.querySelector('image'),response=await w.fetch(source.getAttribute('href'));
check(response.ok&&svg.querySelectorAll('image').length===1,'original field texture loads and is reused');
const data=await new Promise(resolve=>{const r=new w.FileReader();r.onload=()=>resolve(r.result);response.blob().then(b=>r.readAsDataURL(b));});
const clone=svg.cloneNode(true);clone.setAttribute('xmlns','http://www.w3.org/2000/svg');clone.querySelector('image').setAttribute('href',data);
const img=new w.Image();img.src=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(clone)],{type:'image/svg+xml'}));await img.decode();
const c=d.createElement('canvas');c.width=800;c.height=360;const ctx=c.getContext('2d');ctx.drawImage(img,0,0,800,360);URL.revokeObjectURL(img.src);
const pixel=(x,y)=>Array.from(ctx.getImageData(x,y,1,1).data),alpha=(x,y)=>pixel(x,y)[3]/255;
const corners=[[110,60],[500,60],[500,268],[110,268]].map(([x,y])=>({x,y,rgba:pixel(x,y)}));
check(corners.every(p=>p.rgba[3]>245),'all four road corners are filled with no rounded cutouts');
check(corners.every(p=>p.rgba[0]>p.rgba[1]*1.08&&p.rgba[0]>p.rgba[2]*1.6),'all four corners use soil without source grass patches');
check(alpha(305,168)<.01&&alpha(160,166)<.12&&alpha(160,84)<.15,'placement grid remains clear of soil');
check(alpha(90,166)<.01,'outside the rectangle retains the original field');
check(Array.from({length:10},(_,i)=>alpha(98+i,166)).some(a=>a>.05&&a<.95),'soil edges blend softly into grass');
const oldGold=api.game.gold;api.game.gold=10000;check(api.deploy('guard',0),'soldier still deploys into original first tile');api.game.gold=oldGold;api.refresh();
const finish=async scene=>{for(let i=0;i<50;i++){d.getAnimations().forEach(a=>{try{a.finish();}catch{}});await new Promise(r=>setTimeout(r,40));if(api.scene===scene&&d.getElementById('app').getAttribute('aria-busy')!=='true')break;}};
d.getElementById('dev-boss-scene').click();await finish('boss');const boss=d.querySelector('.boss-arena').getBoundingClientRect();
check(api.scene==='boss'&&Math.abs(boss.width-800)<.1&&Math.abs(boss.height-360)<.1,'boss fullscreen field remains available');
d.getElementById('dev-defense-scene').click();await finish('defense');
check(api.scene==='defense'&&d.getElementById('live-tiles').getBoundingClientRect().width>289,'returning from boss preserves rectangular field');
if(d.getElementById('battle-resume-dialog')?.open)d.querySelector('[data-resume-primary]').click();if(d.getElementById('app').dataset.combatPaused!=='true')api.pause();
api.game.units=[];api.game.speed=1;const enemy=api.game.enemies[0];enemy.distance=347.8;Object.assign(enemy,def.pathPoint(enemy.distance));api.game.tick(.01);
check(Math.abs(enemy.x-479)<1e-7&&Math.abs(enemy.y-68.23)<1e-7,'actual monster turns ninety degrees at top-right corner');
api.refresh();d.getElementById('live-notice').style.display='none';
const result={status:'PASS',checkedAt:new Date().toISOString(),checks,corners,grid:{left:160,top:84,width:290,height:168},path:cfg.PATH,perimeter:1088,origin:location.origin,conditions:'Isolated 800x360 iframe; original storage backed up; QA scrollbars and developer notice hidden for capture.'};
window.rectangleQaResult=result;return result;
})();
} finally {
document.getElementById('qa-game')?.remove();await new Promise(r=>setTimeout(r,120));
const raw=sessionStorage.getItem('rectangle-qa-storage');if(raw!==null){localStorage.clear();for(const [k,v]of Object.entries(JSON.parse(raw)))localStorage.setItem(k,v);sessionStorage.removeItem('rectangle-qa-storage');}
}
})()

import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const cli=process.env.ORCA_CLI_COMMAND,page=process.argv[2];
if(!cli||!page)throw Error('Pass the atlas browserPageId using the session ORCA_CLI_COMMAND.');
function run(args){
 const result=JSON.parse(execFileSync(cli,[...args,'--json'],{cwd:root,encoding:'utf8',maxBuffer:8*1024*1024}));
 if(result.ok===false)throw Error(JSON.stringify(result));
 return result.result;
}
function evaluate(expression){
 const result=run(['eval','--page',page,'--expression',expression]).result;
 return typeof result==='string'?JSON.parse(result):result;
}
const report={checked_at:new Date().toISOString(),page,method:'Orca embedded browser DOM and user interactions'};
try{
 run(['reload','--page',page]);
 report.desktop=evaluate(`(async()=>{
  const ensure=(value,message)=>{if(!value)throw Error(message);};
  const result={};
  await document.getElementById('world-map').decode();
  const tick=()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  await tick();
  result.mapSize=[document.getElementById('world-map').naturalWidth,document.getElementById('world-map').naturalHeight];
  result.mapVersion=world.map.version;result.mapFile=world.map.image.split('/').pop();
  ensure(decodeURIComponent(document.getElementById('world-map').currentSrc).endsWith('/'+result.mapFile),'current map image path');
  ensure(result.mapSize.join(',')===world.map.actual_native_size.join(','),'native map resolution');
  result.navigation=nav.children.length;result.pins=stage.querySelectorAll('.pin').length;result.legend=legend.children.length;
  ensure(result.navigation===world.regions.length+1+((world.landmarks||[]).length?1:0)&&result.pins===world.map.markers.length&&result.legend===world.map.markers.length,'region and marker controls');
  result.regions=[];
  for(const region of world.regions){
   nav.querySelector('[data-view="'+region.id+'"]').click();
   ensure(panel.querySelector('h2').textContent===region.name,'region title '+region.id);
   for(const section of region.sections){
    ensure([...panel.querySelectorAll('h3')].some(h=>h.textContent===section.title),'section '+section.title);
    for(const paragraph of section.paragraphs)ensure(panel.textContent.includes(paragraph),'region paragraph');
   }
   result.regions.push({id:region.id,title:region.name});
  }
  nav.querySelector('[data-view="west"]').click();
  const westFactionTable=panel.querySelector('table');
  ensure([...westFactionTable.querySelectorAll('tbody tr')].map(r=>r.cells[0].textContent).join(',')==='친왕파,반왕파','western royalist and anti-royalist factions');
  ensure(!panel.textContent.includes('황제와 그 통치권'),'western factions stay separate from central court');
  result.westFactions=['친왕파','반왕파'];
  nav.querySelector('[data-view="east"]').click();
  ensure(panel.textContent.includes('가문이 아닌 문파를 중심으로 운영'),'eastern sect-based organization');
  ensure([...panel.querySelector('table').querySelectorAll('tbody tr')].map(r=>[...r.cells].map(c=>c.textContent).join(':')).join(',')==='검법 문파:4개,도법 문파:2개','four sword and two saber sects');
  result.eastSects={sword:4,saber:2,total:6};
  ensure(panel.textContent.includes('호수 동쪽·진월국 북쪽 내륙'),'eastern minor contamination description');
  result.minorImpacts={total:world.minor_impact_sites.length,east:world.minor_impact_sites.filter(s=>s.region_id==='east').length};
  ensure(result.minorImpacts.total===4&&result.minorImpacts.east===1,'three retained minor impacts and one added eastern impact');
  nav.querySelector('[data-view="central"]').click();
  result.centralTableRows=[...panel.querySelectorAll('tbody')].map(body=>body.rows.length);
  const expectedCentralTables=world.regions.find(r=>r.id==='central').sections.filter(s=>s.table_source).map(s=>world.tables[s.table_source].rows.length);
  ensure(result.centralTableRows.join(',')===expectedCentralTables.join(','),'capitals, factions, tower, families and geographic divisions');
  ensure(panel.textContent.includes('벨사르와 중립 오르딘 가문의 마법사도 포함'),'freedom outside the two vassal families');
  ensure(panel.textContent.includes('독자 세력')&&panel.textContent.includes('마탑을 떠나 왕국'),'independent tower and separate kingdom family lineage');
  const familyRows=[...panel.querySelectorAll('tbody tr')].filter(r=>world.families.some(f=>r.cells[0].textContent===f.name));
  ensure(familyRows.length===4,'four royal mage family rows');
  for(const family of world.families){const row=familyRows.find(r=>r.cells[0].textContent===family.name);ensure(row.textContent.includes(family.magic.description),'family magic '+family.id);}
  ensure(familyRows.find(r=>r.cells[0].textContent==='오르딘 가문').cells[1].textContent==='중립','Ordin neutral without a third court faction');
  result.magicTower={independent:true,kingdomFamilies:familyRows.length,ordinNeutral:true};
  stage.querySelector('[data-marker="arkerion"]').click();
  ensure(location.hash==='#arkerion'&&panel.querySelector('.context strong').textContent.includes('아르케리온'),'small capital pin');
  ensure(panel.querySelector('.context p').textContent.includes('마탑'),'tower in magic capital context');
  ensure(panel.querySelector('h2').textContent==='아스테른 제국','small capital regional context');
  stage.querySelector('[data-marker="great_church"]').click();
  ensure(location.hash==='#great_church','church marker');
  ensure(panel.querySelector('.context p').textContent.includes('성직자')&&panel.querySelector('.context p').textContent.includes('성기사'),'church owns clergy and paladin forces');
  result.churchForce=world.institutions.find(i=>i.id==='great_church').armed_force.components;
  ensure(panel.textContent.includes('에르하온')&&panel.textContent.includes('나하르'),'two faiths');
  ensure([...panel.querySelectorAll('tbody')].map(body=>body.rows.length).join(',')==='2,'+world.tables.relations.rows.length,'deities and distinct relationships');
  ensure(panel.textContent.includes('대외적 관계')&&panel.textContent.includes('실질적 관계'),'fealty and cooperation layers');
  result.landmarks=[];
  for(const landmark of world.landmarks||[]){
   stage.querySelector('[data-marker="'+landmark.id+'"]').click();
   ensure(location.hash==='#'+landmark.id&&selectedView==='landmarks','landmark pin and hash');
   ensure(panel.textContent.includes(landmark.name)&&panel.textContent.includes(landmark.location),'landmark geography');
   for(const paragraph of landmark.paragraphs)ensure(panel.textContent.includes(paragraph),'landmark description');
   nav.querySelector('[data-view="landmarks"]').click();
   ensure(panel.textContent.includes(landmark.name),'landmark navigation');
   result.landmarks.push(landmark.name);
  }
  document.getElementById('pins-toggle').click();
  ensure(stage.classList.contains('hide-pins')&&getComputedStyle(stage.querySelector('.pin')).display==='none','hide map pins');
  document.getElementById('pins-toggle').click();
  ensure(!stage.classList.contains('hide-pins'),'restore map pins');
  legend.querySelector('[data-marker="north"]').click();
  ensure(location.hash==='#north'&&panel.textContent.includes('하르반')&&panel.textContent.includes('우르칸'),'north legend');
  ensure(panel.textContent.includes('3~4')&&panel.textContent.includes('신을 믿지 않지만'),'northern terrain and tradition');
  legend.querySelector('[data-marker="arkerion"]').click();
  result.markerNavigation=true;result.pinToggle=true;
  result.width=innerWidth;result.documentWidth=document.documentElement.scrollWidth;
  ensure(result.documentWidth<=innerWidth,'desktop horizontal overflow');
  return JSON.stringify(result);
 })()`);
 run(['reload','--page',page]);
 report.bookmark=evaluate(`(()=>{if(location.hash!=='#arkerion'||!panel.querySelector('.context strong').textContent.includes('아르케리온'))throw Error('marker bookmark restore');return JSON.stringify({hash:location.hash,restored:true});})()`);
 report.mobile=[];
 for(const width of [390,320]){
  run(['viewport','--page',page,'--width',String(width),'--height','844','--scale','1','--mobile']);
  report.mobile.push(evaluate(`(async()=>{
   await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
   nav.querySelector('[data-view="central"]').click();
   const result={width:innerWidth,documentWidth:document.documentElement.scrollWidth,minButtonHeight:Math.min(...[...document.querySelectorAll('button')].map(b=>b.getBoundingClientRect().height)),tableCount:panel.querySelectorAll('table').length};
   if(result.documentWidth>innerWidth)throw Error('mobile horizontal overflow');
   if(result.minButtonHeight<44)throw Error('mobile control height');
   if(result.tableCount!==world.regions.find(r=>r.id==='central').sections.filter(s=>s.table_source).length||getComputedStyle(panel).position!=='static')throw Error('mobile content layout');
   legend.querySelector('[data-marker="south"]').click();
   if(panel.querySelector('h2').textContent!=='사하리드 왕국')throw Error('mobile south selection');
   result.selection=true;return JSON.stringify(result);
  })()`));
 }
 report.status='passed';
}finally{
 evaluate(`(()=>{select('central',null,false);scrollTo(0,0);return JSON.stringify({restored:true});})()`);
 run(['reload','--page',page]);
}
fs.writeFileSync(path.join(root,'output/world/atlas/browser-verification.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {fileURLToPath,pathToFileURL} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8').replace(/^\uFEFF/,''));
const text=p=>fs.readFileSync(path.join(root,p),'utf8');
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex');
const world=read('자료/세계관/세계관설정.json'),current=read('output/world/current.json');
assert.equal(world.regions.length,5);assert.equal(new Set(world.regions.map(r=>r.id)).size,5);
assert.equal(world.capitals.length,2);assert.equal(world.capitals.filter(c=>c.scale==='large').length,1);assert.equal(world.capitals.filter(c=>c.scale==='small').length,1);
assert.equal(world.capitals.find(c=>c.scale==='small').name,'아르케리온');
assert.equal(world.capitals.find(c=>c.scale==='large').name,world.names.greatCapital);
assert.equal(world.rules.ruler,'황제');assert.deepEqual(world.factions.filter(f=>f.region_id==='central').map(f=>f.name),['친왕파','귀족파']);
assert.equal(new Set(world.factions.map(f=>f.id)).size,world.factions.length);
assert.deepEqual(world.factions.filter(f=>f.region_id==='west').map(f=>f.name),['친왕파','반왕파']);
assert.equal(world.rules.west_court_faction_count,2);assert.deepEqual(world.rules.west_court_faction_ids,['west_royalist','west_anti_royalist']);
assert.equal(world.families.length,4);assert.equal(world.families.filter(f=>f.direct_vassal).length,2);
assert.equal(world.families.filter(f=>f.faction_id==='nobility').length,1);
assert.ok(world.families.filter(f=>f.faction_id==='nobility').every(f=>!f.direct_vassal));
assert.deepEqual(world.rules.nobility_family_ids,['velsar']);assert.deepEqual(world.rules.neutral_family_ids,['ordin']);
assert.deepEqual(world.names.nobleHouses,['벨사르']);assert.deepEqual(world.names.neutralHouses,['오르딘']);
const tower=world.organizations.find(o=>o.id==='magic_tower');
assert.equal(tower.name,'마탑');assert.equal(tower.location_city_id,'arkerion');assert.equal(tower.independent,true);
assert.equal(world.rules.central_mage_default_affiliation_id,tower.id);assert.ok(world.rules.magic_tower_independent);
const kingdomFamilyIds=['erdian','caledor','velsar','ordin'];
assert.deepEqual(world.rules.central_mage_affiliation_exception_family_ids,kingdomFamilyIds);
assert.deepEqual(world.rules.kingdom_mage_family_ids,kingdomFamilyIds);assert.deepEqual(tower.exception_family_ids,kingdomFamilyIds);
assert.ok(world.rules.kingdom_mage_family_founders_from_tower&&world.rules.family_origin_is_not_current_tower_membership);
assert.ok(world.families.every(f=>f.affiliation_id==='central'&&f.membership_category==='kingdom_mage_family'&&f.founding_origin_organization_id===tower.id));
const families=new Map(world.families.map(f=>[f.id,f]));
assert.equal(families.get('erdian').magic.specialty,'화염마법');assert.equal(families.get('erdian').magic.element,'화염');
assert.equal(families.get('caledor').magic.specialty,'공간마법');
assert.equal(families.get('velsar').magic.specialty,'물속성 마법');assert.equal(families.get('velsar').magic.element,'물');
assert.equal(families.get('ordin').faction_id,null);assert.equal(families.get('ordin').alignment,'중립');assert.equal(families.get('ordin').magic.specialty,null);assert.equal(families.get('ordin').magic.kind,'종합마법');
assert.ok(!Object.hasOwn(world.unassigned,'mage_house_specialized_schools'));
assert.ok(world.rules.free_mages_except_vassal_families&&world.rules.nobility_family_mages_also_generally_free);
assert.equal(world.rules.central_west_status,'armistice_and_current_cooperation');assert.ok(world.rules.church_mediates_armistice);
assert.ok(world.rules.west_has_many_historical_swordmasters&&world.rules.west_has_many_aura_knight_orders&&world.rules.west_power_comparable_to_central);
assert.ok(world.rules.south_trade_active&&world.rules.south_finances_consistently_good);assert.equal(world.rules.south_hidden_military_strength,'unknown');
assert.deepEqual(world.rules.south_traditions,['고대마법','정령술','제국과 다른 검술']);assert.ok(world.rules.south_distinct_desert_deity_belief);
assert.ok(world.rules.east_south_friendly&&world.rules.east_rejects_invasion_and_interference);
assert.deepEqual(world.rules.east_independent_martial_traditions,['검술','무술','도법']);
const east=world.regions.find(r=>r.id==='east'),sects=east.martial_organization;
assert.equal(sects.basis,'문파');assert.equal(sects.family_based,false);
assert.deepEqual(sects.sect_types.map(s=>[s.discipline,s.count]),[['검법',4],['도법',2]]);
assert.equal(sects.sect_types.reduce((sum,s)=>sum+s.count,0),6);assert.ok(sects.sect_types.every(s=>s.names===null));
assert.ok(east.sections.some(s=>s.table_source==='sects_east'));
assert.equal(world.tribes.length,2);assert.deepEqual(world.tribes.map(t=>t.majority),['무투 전사','주술사']);assert.ok(world.tribes.every(t=>t.secondary));
assert.deepEqual(world.rules.north_warrior_advantage,{terrain:'북방 설산',opponents_min:3,opponents_max:4});
assert.equal(world.rules.north_worships_gods,false);assert.ok(world.rules.north_holds_traditions_sacred&&world.rules.north_low_population&&world.rules.north_non_expansionist&&world.rules.north_strict_on_external_incursion);
assert.equal(world.deities.length,2);assert.equal(world.institutions[0].deity_id,'erhaon');
const church=world.institutions.find(i=>i.id==='great_church');
assert.equal(church.armed_force.owned,true);assert.deepEqual(church.armed_force.components,['성직자','성기사']);
assert.equal(church.armed_force.size,null);assert.equal(church.armed_force.command_structure,null);
const publicRelation=world.relations.find(r=>r.id==='empire-arkerion-public'),practicalRelation=world.relations.find(r=>r.id==='empire-arkerion-practical');
assert.equal(publicRelation.status,'충의');assert.equal(practicalRelation.status,'협력·자율');
assert.equal(new Set(world.map.labels).size,world.map.labels.length);
assert.equal(world.map.labels.length,13+(world.landmarks||[]).length+(world.regional_divisions||[]).length);
for(const region of world.regions){
 const divisions=(world.regional_divisions||[]).filter(d=>d.region_id===region.id);
 if(divisions.length){assert.equal(divisions.length,4);assert.equal(new Set(divisions.map(d=>d.direction)).size,4);for(const d of divisions)assert.ok(world.map.labels.includes(d.name));}
}
if(world.minor_impact_sites){assert.equal(world.minor_impact_sites.length,world.map.minor_impact_count);assert.equal(world.minor_impact_sites.filter(s=>s.region_id==='east').length,1);for(const site of world.minor_impact_sites){assert.equal(site.name,null);assert.equal(site.map_label,false);assert.equal(site.diameter_ratio_approx,0.25);assert.ok(site.position.x>0&&site.position.x<1&&site.position.y>0&&site.position.y<1);}}
for(const landmark of world.landmarks||[]){assert.ok(world.map.labels.includes(landmark.name));assert.ok(world.map.markers.some(m=>m.id===landmark.id&&m.view_id==='landmarks'));assert.equal(landmark.political_affiliation,null);}
const book=text(current.book_markdown),bookHtml=text(current.book_html),atlas=text(current.atlas);
assert.ok(book.includes(church.armed_force.description)&&bookHtml.includes(church.armed_force.description));
const allNames=[...world.name_origin.generated_by_request,...world.name_origin.user_named];
assert.equal(new Set(allNames).size,allNames.length);
for(const name of allNames){assert.ok(book.includes(name),'Missing book name '+name);assert.ok(bookHtml.includes(name),'Missing reader name '+name);assert.ok(atlas.includes(name),'Missing atlas name '+name);}
for(const p of [current.book_markdown,current.book_html,current.atlas,current.canon]){
 assert.ok(fs.existsSync(path.join(root,p)),p);
 assert.ok(!/[\u3040-\u30ff\u4e00-\u9fff]/.test(text(p)),'Unexpected non-Korean CJK prose '+p);
}
assert.ok(!atlas.includes('__WORLD_DATA__')&&!atlas.includes('__MAP_URL__'));
const embedded=JSON.parse(atlas.match(/<script id="world-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);
assert.deepEqual(embedded.regions,world.regions);assert.deepEqual(embedded.families,world.families);assert.deepEqual(embedded.tribes,world.tribes);assert.deepEqual(embedded.deities,world.deities);assert.deepEqual(embedded.landmarks,world.landmarks);
assert.deepEqual(embedded.organizations,world.organizations);assert.deepEqual(embedded.character_links,world.character_links);
assert.deepEqual(embedded.institutions,world.institutions);
assert.deepEqual(embedded.factions,world.factions);
assert.deepEqual(embedded.tables.factions.rows.map(r=>r[0]),['친왕파','귀족파']);
assert.deepEqual(embedded.tables.factions_west.rows.map(r=>r[0]),['친왕파','반왕파']);
assert.deepEqual(embedded.tables.sects_east.rows,[['검법 문파','4개'],['도법 문파','2개']]);
assert.ok(world.regions.find(r=>r.id==='west').sections.some(s=>s.table_source==='factions_west'));
let checkedLinks=0;
for(const doc of [current.atlas,current.book_html]){
 for(const match of text(doc).matchAll(/(?:src|href)="([^"]+)"/g)){
  const value=match[1];if(/^(?:https?:|#|data:|mailto:)/.test(value))continue;
  const file=fileURLToPath(new URL(value,pathToFileURL(path.join(root,doc))));assert.ok(fs.existsSync(file),'Missing link '+value);checkedLinks++;
 }
}
for(const match of book.matchAll(/\]\(<([^>]+)>\)/g)){assert.ok(fs.existsSync(path.resolve(root,path.dirname(current.book_markdown),match[1])),'Missing book link '+match[1]);checkedLinks++;}
assert.equal(current.map,world.map.image);assert.equal(current.map_version,world.map.version);assert.ok(current.map_version>=18);assert.equal(current.map_sha256,sha(world.map.image));
const map=fs.readFileSync(path.join(root,current.map));assert.equal(map.subarray(1,4).toString(),'PNG');assert.deepEqual([map.readUInt32BE(16),map.readUInt32BE(20)],world.map.actual_native_size);
const rec=read(world.map.image.replace(/\.png$/,'.generation-records.json')),review=read(world.map.image.replace(/\.png$/,'.review.json'));
assert.equal(rec.status,'complete');assert.equal(review.status,'visually_reviewed');assert.equal(rec.output.sha256,sha(current.map));
assert.equal(rec.source_sha256,sha(world.map.source_image));assert.equal(review.labels_manually_reviewed.length,world.map.labels.length);assert.ok(review.source_unchanged??review.source_v17_unchanged);
const originalMapRecord=read('output/world/maps/continent_world_lore_v18.generation-records.json');
assert.equal(sha('output/world/maps/continent_world_final_v17.png'),originalMapRecord.source_sha256);
const mage=read('output/characters/gc9_central_light_archmage/character-brief.json');
assert.equal(mage.canonical_affiliation.status,'unassigned');assert.equal(mage.canonical_affiliation.placement_status,'deferred');
for(const key of ['city_id','city_name','country_id','country_name','organization_id','organization_name','family_id','faith_membership'])assert.equal(mage.canonical_affiliation[key],null);
assert.equal(world.character_links.length,0);
assert.equal(world.character_placement_policy.existing_materials,'deferred');assert.equal(world.character_placement_policy.references,'deferred');assert.equal(world.character_placement_policy.includes_existing_archmage,true);assert.equal(world.character_placement_policy.assign_new_characters_only,true);
assert.ok(book.includes(world.character_placement_policy.description)&&bookHtml.includes(world.character_placement_policy.description));
console.log(JSON.stringify({continents:5,capitals:2,families:4,vassalFamilies:2,nobleFamilies:1,neutralFamilies:1,organizations:world.organizations.length,tribes:2,deities:2,namesVerified:allNames.length,linksVerified:checkedLinks,mapVersion:current.map_version,mapSize:world.map.actual_native_size,sourceUnchanged:true,sourceV17Unchanged:true,activeCharacterLinks:world.character_links.length,mageAffiliation:null,status:'passed'}));

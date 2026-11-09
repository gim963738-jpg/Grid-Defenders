import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
const read=p=>JSON.parse(fs.readFileSync(path.resolve(root,p),'utf8').replace(/^\uFEFF/,''));
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(path.resolve(root,p))).digest('hex');
const catalog=read('output/characters/catalog/catalog.json'),extra=read('output/characters/catalog/approved-splash-assets.json'),metadata=read('output/characters/catalog/image-metadata.json');
const added=catalog.assets.filter(a=>extra.assets.some(e=>e.metadata.path===a.path));
assert.equal(added.length,7);assert.equal(new Set(added.map(a=>a.sha256)).size,7);
assert.deepEqual(added.filter(a=>a.character==='balor').map(a=>a.view),['front']);
for(const id of ['splash_n01','splash_n02']){
 assert.deepEqual(added.filter(a=>a.character===id).map(a=>a.angle).sort((a,b)=>a-b),[0,45,90]);
 const p=catalog.profiles.find(p=>p.id===id);assert.equal(p.origin_id,'unassigned');assert.equal(p.class_id,'unassigned');assert.deepEqual(p.affiliation_ids,[]);assert.equal(p.profession,null);
}
for(const a of added){assert.equal(a.status,'current');assert.equal(a.approval_state,'provisionally_accepted_by_user');assert.equal(a.decision_status,'selected_illustration');assert.equal(a.collection,'newCharacters');assert.ok(a.gc9_applied);assert.equal(a.future_reference_allowed,false);assert.equal(a.common_style_master_approved,false);assert.equal(a.sha256,sha(a.path));assert.ok(a.links.some(l=>l.label==='사용자 일단합격 근거'));}
assert.equal(catalog.profiles.find(p=>p.id==='balor').illustration_style_status,'provisionally_accepted_by_user');
let links=0;
const aliases=catalog.assets.flatMap(a=>a.aliases);assert.equal(aliases.length,metadata.length);
assert.equal(new Set(aliases.map(a=>a.path)).size,metadata.length);assert.equal(new Set(catalog.assets.map(a=>a.sha256)).size,catalog.assets.length);
for(const row of metadata){assert.equal(sha(row.path),row.sha256,row.path);const a=catalog.assets.find(a=>a.sha256===row.sha256);assert.ok(a);assert.ok(a.aliases.some(x=>x.path===row.path));assert.equal(a.width,row.width);assert.equal(a.height,row.height);}
for(const a of catalog.assets){assert.equal(path.posix.normalize('output/characters/char001/'+a.url),a.path);for(const l of a.links){assert.ok(fs.existsSync(path.resolve(root,l.path)),l.path);assert.equal(path.posix.normalize('output/characters/char001/'+l.url),path.posix.normalize(l.path));links++;}}
for(const old of read('output/characters/catalog/legacy-items.json'))assert.ok(aliases.some(a=>a.path===path.posix.normalize('output/characters/char001/'+old[3])));
const html=fs.readFileSync(path.resolve(root,'output/characters/char001/gallery.html'),'utf8');assert.deepEqual(JSON.parse(html.match(/<script id="catalog-data" type="application\/json">([\s\S]*?)<\/script>/)[1]),catalog);new vm.Script(html.match(/<script>([\s\S]*?)<\/script>/)[1]);
assert.equal(catalog.collections.length,8);for(const c of ['staff8','blondWarrior','gc9Final','testProcess','attachments','gc9refs','sp13refs'])assert.ok(catalog.collections.some(x=>x.id===c));
assert.ok(!added.some(a=>a.path.includes('sd')||a.path.includes('D820F076')||a.path.includes('5133411E')));
if(process.argv[2]){
 const before=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
 for(const old of before.assets)assert.deepEqual(catalog.assets.find(a=>a.id===old.id),old,'Existing asset changed '+old.id);
 assert.equal(catalog.assets.length,before.assets.length+7);assert.deepEqual(catalog.production,before.production);assert.deepEqual(catalog.classes,before.classes);assert.deepEqual(catalog.collections,before.collections);
 for(const p of before.profiles)if(p.id!=='balor')assert.deepEqual(catalog.profiles.find(x=>x.id===p.id),p);
}
console.log(JSON.stringify({approvedImages:7,characterGroups:3,newUnknownProfiles:2,totalAssets:catalog.assets.length,sourcePaths:metadata.length,linkedDocuments:links,legacyImages:83,originalHashesUnchanged:true,existingAssetsUnchanged:!!process.argv[2],embeddedCatalogMatches:true}));

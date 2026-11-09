import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {root,read,validatePlan} from './preflight.mjs';

const dir='output/gc9-style-standard-20261108';
const plan=read(dir+'/validation-fixture.json'),policy=read('자료/캐릭터그림체/GC9/작화고정기준.json');
const good=validatePlan(plan,policy);assert.equal(good.valid,true);assert.equal(good.ready_to_generate,false);
const failures=[];
function expectFailure(name,job,expected){const result=validatePlan(job,policy);assert.equal(result.valid,false,name);for(const code of expected)assert.ok(result.errors.some(e=>e.code===code),name+': '+code);failures.push({name,detected:result.errors.map(e=>e.code)});}
// Real v10 prompt and reference files, with their executed roles, reproduce the regression.
const oldCall=read('output/characters/gc9_balor/gc9_rebuild_v10/generation-records.json').calls[0];
assert.ok(fs.readFileSync(path.resolve(root,oldCall.prompt_file),'utf8').includes('Repaint ONLY its METALLIC SURFACES'));
expectFailure('historical_v10_partial_repair',{...plan,mode:'material_edit',scope:'metal_only',edit_target:oldCall.references[0],preserve_failed_face_geometry:true,references:oldCall.reference_files.map((r,i)=>({...r,role:i===0?'edit_target':i<3?'metal':'pose'}))},['FULL_STYLE_REBUILD_REQUIRED','WHOLE_STYLE_REFERENCE_REQUIRED','REJECTED_STYLE_REFERENCE','UNAPPROVED_EDIT_TARGET','FAILED_FACE_LOCK']);
const noWhole=structuredClone(plan);noWhole.references=noWhole.references.map(r=>({...r,role:'metal'}));expectFailure('whole_style_demoted_to_metal',noWhole,['WHOLE_STYLE_REFERENCE_REQUIRED']);
const badHash=structuredClone(plan);badHash.references[0].sha256='0'.repeat(64);expectFailure('changed_reference_asset',badHash,['REFERENCE_HASH_MISMATCH']);
const next=structuredClone(plan);next.followup_views=['right','back'];expectFailure('next_views_before_pass',next,['FOLLOWUP_BEFORE_STYLE_PASS']);
const before=read('output/characters/gc9_balor/style_recovery_20261108/before/original-image-hashes.json');
for(const item of before){const actual=crypto.createHash('sha256').update(fs.readFileSync(path.resolve(root,item.path))).digest('hex');assert.equal(actual,item.sha256,item.path);}
const benchmark=read(policy.benchmark_manifest),record=read(benchmark.source_record);
assert.equal(benchmark.count,8);assert.equal(benchmark.entries.length,8);
assert.deepEqual(benchmark.entries.map(e=>e.id).sort(),['c03_front','c03_threequarter','c04_front','c04_threequarter','c05_front','c05_threequarter','c06_front','c06_threequarter']);
assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.resolve(root,benchmark.source_record))).digest('hex'),benchmark.source_record_sha256);
for(const entry of benchmark.entries){
 assert.deepEqual(entry.source_entry_verbatim,record.entries.find(e=>e.id===entry.id),'Historical record changed: '+entry.id);
 assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.resolve(root,entry.path))).digest('hex'),entry.sha256,entry.path);
 for(const ref of entry.resolved_references)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.resolve(root,ref.path))).digest('hex'),ref.sha256,ref.path);
 const ref=policy.profiles[policy.default_profile].primary.find(r=>r.id===entry.id);
 assert.ok(ref,'Missing benchmark: '+entry.id);
 assert.equal(validatePlan({...plan,references:[ref]},policy).valid,true,'Any benchmark can represent the set: '+entry.id);
}
assert.equal(policy.profiles[policy.default_profile].primary.length,8);
assert.equal(policy.character_profiles.balor,undefined,'No C6-only Balor override');
const c5=benchmark.entries.find(e=>e.id==='c05_front');
assert.ok(c5.source_entry_verbatim.references_in_order[1].endsWith('A04_Bram.jfif'));
assert.ok(c5.source_entry_verbatim.references_in_order[2].endsWith('M05_Ronan.jfif'));
expectFailure('obsolete_c6_only_profile',{...plan,style_profile:'c6_male'},['UNKNOWN_STYLE_PROFILE']);
expectFailure('all_eight_attached_at_once',{...plan,references:policy.profiles[policy.default_profile].primary},['TOO_MANY_REFERENCES']);
const withoutBudget={...policy,production_state:{...policy.production_state,successful_image_calls:0}};
assert.equal(validatePlan({...plan,generation_authorized:true},withoutBudget).ready_to_generate,false,'Audit state must remain non-generating even with unused budget');
const report={status:'passed',images_preserved:before.length,all_original_hashes_unchanged:true,benchmark_images:8,verbatim_records_preserved:true,benchmark_and_reference_hashes_verified:true,all_eight_valid_as_whole_style:true,c6_exclusive_override:false,external_image_calls:0,plan_valid:true,generation_ready:false,rejected_regressions:failures,scope:'workflow/reference repair only; new style reproduction not tested'};
fs.writeFileSync(path.resolve(root,dir,'verification.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));

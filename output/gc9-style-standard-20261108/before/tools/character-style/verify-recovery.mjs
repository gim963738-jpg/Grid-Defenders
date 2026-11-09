import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {root,read,validatePlan} from './preflight.mjs';

const dir='output/characters/gc9_balor/style_recovery_20261108';
const plan=read(dir+'/recovery-plan.json'),policy=read('자료/캐릭터그림체/GC9/작화고정기준.json');
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
const before=read(dir+'/before/original-image-hashes.json');
for(const item of before){const actual=crypto.createHash('sha256').update(fs.readFileSync(path.resolve(root,item.path))).digest('hex');assert.equal(actual,item.sha256,item.path);}
const report={status:'passed',images_preserved:before.length,all_original_hashes_unchanged:true,external_image_calls:0,plan_valid:true,generation_ready:false,rejected_regressions:failures,scope:'workflow/reference repair only; new style reproduction not tested'};
fs.writeFileSync(path.resolve(root,dir,'verification.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));

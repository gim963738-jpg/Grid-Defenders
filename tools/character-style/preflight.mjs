import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';

export const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
export const read=p=>JSON.parse(fs.readFileSync(path.resolve(root,p),'utf8').replace(/^\uFEFF/,''));
const digest=p=>crypto.createHash('sha256').update(fs.readFileSync(path.resolve(root,p))).digest('hex');
export function validatePlan(plan,policy=read('자료/캐릭터그림체/GC9/작화고정기준.json')){
 const errors=[],add=(code,message)=>errors.push({code,message});
 const relative=p=>{const rel=path.relative(root,path.resolve(root,p)).split(path.sep).join('/');if(rel.startsWith('../')||path.isAbsolute(rel))throw Error('Reference outside workspace');return rel;};
 const rejected=p=>(policy.rejected_style_paths||[]).includes(p)||(policy.rejected_style_prefixes.some(prefix=>p.startsWith(prefix))&&!policy.exempt_subpaths.some(part=>p.includes(part)));
 const profile=policy.profiles[plan.style_profile];
 if(!profile)add('UNKNOWN_STYLE_PROFILE','실제 완성본을 지정한 전체 작화 프로필이 필요합니다.');
 const refs=Array.isArray(plan.references)?plan.references:[],primary=[];
 if(refs.length>(policy.max_reference_images||5))add('TOO_MANY_REFERENCES','내장 이미지 도구의 참조 제한은 최대5장입니다. 전체 작화 주 참조를 유지한 채 보조 자료를 조정합니다.');
 for(const ref of refs){
  let p;try{p=relative(ref.path);}catch{add('INVALID_REFERENCE_PATH','작업 폴더 안의 실제 참조 파일을 사용해야 합니다.');continue;}
  if(!fs.existsSync(path.resolve(root,p))){add('MISSING_REFERENCE',p);continue;}
  if(!ref.sha256||ref.sha256!==digest(p))add('REFERENCE_HASH_MISMATCH',p);
  if(rejected(p))add('REJECTED_STYLE_REFERENCE','그림체 실패본은 재구성 입력에서 제외합니다: '+p);
  if(p.includes('/sd_style_test_'))add('SD_REFERENCE_IN_GC9','SD 시험 이미지는 GC9 작화 입력이 아닙니다.');
  if(ref.role==='whole_style'){
   primary.push(p);
   if(profile&&!profile.primary.some(a=>a.path===p&&a.sha256===ref.sha256))add('UNVERIFIED_WHOLE_STYLE','선택한 프로필의 실제 완성본과 다릅니다: '+p);
  }
 }
 if(!primary.length)add('WHOLE_STYLE_REFERENCE_REQUIRED','C3~C6 8장 중 대상에 맞는 전체 작화 원본을 실제 첨부해야 합니다. 얼굴·금속·구도 전용 참조만으로 대체하지 않습니다.');
 if(plan.character_id==='balor'){
  if(plan.mode!=='style_rebuild'||plan.scope!=='whole_character')add('FULL_STYLE_REBUILD_REQUIRED','전체 작화 실패는 금속만 편집해 해결 완료 처리할 수 없습니다.');
  if(plan.preserve_failed_face_geometry!==false)add('FAILED_FACE_LOCK','설정은 유지하되 실패한 얼굴의 선·명암·형태 묘사를 고정하지 않습니다.');
  if((plan.followup_views||[]).length)add('FOLLOWUP_BEFORE_STYLE_PASS','새 시안 작화 확인 전 다음 방향을 연속 생성하지 않습니다.');
 }
 if(plan.edit_target){
  if(plan.mode==='style_rebuild')add('EDIT_TARGET_DURING_STYLE_REBUILD','전체 작화 복구는 기존 실패 렌더링을 편집 마스터로 두지 않습니다.');
  let p;try{p=relative(plan.edit_target);}catch{p='';}if(!policy.approved_edit_targets.includes(p))add('UNAPPROVED_EDIT_TARGET','전체 작화 미확인 결과를 편집 마스터로 승격하지 않습니다.');
 }
 const state=policy.production_states?.[plan.character_id]||policy.production_state,budgetExhausted=state.max_new_image_calls!=null&&(state.successful_image_calls||0)>=state.max_new_image_calls;
 return {valid:errors.length===0,errors,style_profile:plan.style_profile,whole_style_references:primary,ready_to_generate:errors.length===0&&plan.generation_authorized===true&&state.generation_permitted!==false&&!['stopped_by_user','stopped_for_style_audit'].includes(state.generation)&&!budgetExhausted,external_image_calls:0,limitation:'입력과 참조의 일관성 검사입니다. 출력 화풍 합격을 자동 판정하지 않습니다.'};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 if(!process.argv[2])throw Error('Usage: node tools/character-style/preflight.mjs <plan.json>');
 const result=validatePlan(read(process.argv[2]));console.log(JSON.stringify(result,null,2));if(!result.valid)process.exitCode=1;
}

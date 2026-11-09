import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const out=path.join(root,'output/characters/catalog');
const galleryFolder='output/characters/char001';
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8').replace(/^\uFEFF/,''));
const sdStandard=read('자료/캐릭터설정/SD_공통제작기준.json');
const stylePolicy=read('자료/캐릭터그림체/GC9/작화고정기준.json');
// Explicitly reviewed external assets; never scan or copy another workspace's images.
const supplementPath='output/characters/catalog/approved-splash-assets.json';
const supplement=fs.existsSync(path.join(root,supplementPath))?read(supplementPath):{assets:[],profiles:[],source_groups:[]};
if(!process.argv.includes('--skip-scan')){
 const scan=path.join(root,'tools/character-catalog/scan-images.ps1').replaceAll("'","''");
 process.stdout.write(execFileSync('powershell.exe',['-NoProfile','-Command',`& ([scriptblock]::Create([IO.File]::ReadAllText('${scan}',[Text.Encoding]::UTF8)))`],{cwd:root,encoding:'utf8',maxBuffer:1024*1024}));
}
const metadata=[...new Map([...read('output/characters/catalog/image-metadata.json'),...supplement.assets.map(a=>a.metadata)].map(a=>[a.path,a])).values()];
const supplementalByPath=new Map(supplement.assets.map(a=>[a.metadata.path,a.classification]));
const legacy=read('output/characters/catalog/legacy-items.json');
const oldByPath=new Map(legacy.map(([type,title,description,url])=>[path.posix.normalize(`${galleryFolder}/${url}`),{type,title,description}]));
const sourceGroups=[
 ['staff8','은발 지팡이 · 픽셀 8방향','이번 브랜치','픽셀',0],
 ['gc9six','GC9 · 6종 정면·사선','이번 브랜치','GC9',1],
 ['adventurer4','붉은 머리 모험가 · 4방향','이번 브랜치','GC9',2],
 ['test2x4','마지막 일러스트 · 2종 4방향','이번 브랜치','GC9',3],
 ['ponytail4','붉은 포니테일 · GC9 4방향','인계 자료','GC9',4],
 ['legacy003','주인공 char003','인계 자료','일러스트·인게임 시안',5],
 ['legacy002','검객 char002','인계 자료','일러스트·구조 참고',6],
 ['legacy001','캐릭터 char001 · B·C 재설계','인계 자료','일러스트·구조 참고',7],
 ['styleTests','화풍 테스트 · 궁수·바람 엘프','인계 자료','화풍 테스트',8],
 ['eyes','눈·얼굴 비율 · 5종','인계 자료','얼굴 비율 테스트',9],
 ['original8','원본 화풍 · 8종','인계 자료','원본 참조',10],
 ['gc9refs','GC9 v1.1 · 그림체 참조 16장','이번 브랜치','원본 참조',11],
 ['sp13refs','SP13 v1.0 · 스플래시 참조 13장','이번 브랜치','배경 참조',12],
 ['longswordDagger','금발 장검·단검 · GC9 캐릭터','이번 브랜치','GC9',13],
 ['longswordDaggerPixel','금발 장검·단검 · SD 픽셀 8방향','이번 브랜치','SD 픽셀',14],
 ['videoWalk60','금발 장검·단검 · 영상 추출 걷기 60프레임','이번 브랜치','SD 픽셀·영상 추출',15],
 ['centralLightArchmage','아르케리온 · 수석 빛 마법사','이번 브랜치','GC9',16],
 ['balor','발로르 · 왕국 제3 기사단장','신규 제작','GC9',17],
 ['handGripReferences','한손 무기 그립 기준','사용자 확정 기준','그립 참조',18],
 ['sdHeightGuide','SD 키 기준 표시','사용자 확정 기준','SD 키 안내',19],
 ['windElfGC9','금발 바람 엘프 · GC9 재제작','이번 브랜치','GC9',20]
,...supplement.source_groups].map(([id,label,origin,style,order])=>({id,label,origin,style,order}));
const sourceGroupMap=new Map(sourceGroups.map(c=>[c.id,c]));
const gc9Groups=new Set(['gc9six','adventurer4','test2x4','ponytail4','longswordDagger','centralLightArchmage','balor','windElfGC9']);
for(const [id,,,style] of supplement.source_groups)if(style==='GC9')gc9Groups.add(id);
const blondWarriorGroups=new Set(['longswordDagger','longswordDaggerPixel','videoWalk60']);
const collections=[
 ['newCharacters','신규 캐릭터','신규 제작','일러스트·SD',-1],
 ['staff8','은발 지팡이 · 픽셀 8방향','이번 브랜치','픽셀',0],
 ['blondWarrior','금발 전사','이번 브랜치','SD 픽셀·GC9·걷기',1],
 ['gc9Final','테스트 마무리 시안','통합','GC9',2],
 ['testProcess','테스트 과정 작업물','통합','비GC9 제작·SD 픽셀',3],
 ['attachments','첨부자료','통합','원본·구도·재질 참조',4],
 ['gc9refs','GC9 v1.1 · 그림체 참조 16장','이번 브랜치','원본 참조',5],
 ['sp13refs','SP13 v1.0 · 스플래시 참조 13장','이번 브랜치','배경 참조',6]
].map(([id,label,origin,style,order])=>({id,label,origin,style,order}));
const collectionMap=new Map(collections.map(c=>[c.id,c]));
const viewLabels={front:'정면',right:'오른쪽 정측면',left:'왼쪽 정측면',back:'후면',front_right:'오른쪽 앞 사선',front_left:'왼쪽 앞 사선',back_right:'오른쪽 뒤 사선',back_left:'왼쪽 뒤 사선',helmet_off:'투구 탈착 정면',side_reference:'측면 참고',open_arms:'팔 벌림',illustration:'일러스트',sheet:'복합 구도',reference:'참조 원본'};
const charNames={
 balor:'발로르',
 one_hand_grip:'한손 무기 그립 기준',
 sd_height_guide:'SD 키 기준',
 staff:'은발·날개 지팡이',adventurer:'붉은 머리 모험가',t14:'검보라 쌍단검',t15:'분홍 머리·검은 리본',longsword_dagger:'금발 전사 · 장검·단검',central_light_archmage:'아르케리온 수석 빛 마법사',
 c01:'C1 은발 검·방패',c02:'C2 흰 단발·별자리 망토',c03:'C3 청록·금속 활',c04:'C4 은발 포니테일·은빛 활',c05:'C5 청색 망토·투구 기사',c06:'C6 금발·흰 판금',
 char001:'캐릭터 char001',char002:'검객 char002',char003:'주인공 char003',silver_archer:'은발 궁수',teal_elf_archer:'청록 엘프 궁수',blonde_wind_elf:'금발 바람 엘프',red_ponytail:'붉은 포니테일 전사',healer:'금발 힐러',burgundy:'버건디 머리 여검사',blonde_mage:'금발 마법사',silver_mage:'은발 보랏빛 마법사',blue_warrior:'청발 갑옷 전사',lion_knight:'청사자 갑옷 기사',original8:'원본 화풍 8종',gc9refs:'GC9 그림체 참조',sp13refs:'스플래시 배경 참조'
};
for(const profile of supplement.profiles)charNames[profile.id]=profile.display_name;
const direction=p=>{
 if(/threequarter/.test(p))return 'front_right';
 if(/open_arms/.test(p))return 'open_arms';
 if(/(?:^|[_/])front(?:[_\.]|$)|c1-1/.test(p))return 'front';
 if(/(?:^|[_/])back(?:[_\.]|$)/.test(p))return 'back';
 if(/(?:^|[_/])side(?:[_\.]|$)/.test(p))return 'side_reference';
 if(/c1-2/.test(p))return 'front_right';
 return 'illustration';
};
const gc9=read('자료/캐릭터그림체/GC9/참조목록.json');
const splash=read('자료/스플래시아트/SP13/참조목록.json');
const findRef=(manifest,p)=>manifest.references.find(r=>p.endsWith(r.file));
function classify(m){
 const p=m.path,stem=path.posix.basename(p,path.posix.extname(p));
 const old=oldByPath.get(p);
 let x={...m,title:old?.title||stem,description:old?.description||'',role:'created',status:'current',view:direction(p),version:Number(stem.match(/_v(\d+)/)?.[1]||1),legacy_type:old?.type||null,review_note:'',links:[]};
 if(supplementalByPath.has(p)){
  Object.assign(x,structuredClone(supplementalByPath.get(p)));
 } else if(p.startsWith('output/characters/')){
  if(p.startsWith('output/characters/gc9_balor/')){
   const brief=read('output/characters/gc9_balor/character-brief.json');
   const sd=p.includes('/sd_style_test_'),sdFolder=sd?p.split('/inputs/')[0].split('/variants/')[0].replace(/\/[^/]+\.png$/,''):null;
   const comparison=sd&&p.includes('/front_comparison_');
   const selectedSD=sd&&p===brief.sd_output?.approved_design_path&&brief.sd_output?.selected_style==='existing_sd';
   const discardedSD=(brief.sd_output?.rejected_artifacts||[]).includes(p),inactiveSDReference=(brief.sd_output?.inactive_style_references||[]).includes(p);
   const illustrationConceptPaths=new Set([brief.artifacts?.illustration_concept?.path,...(brief.artifacts?.illustration_concepts||[]).map(a=>a.path)].filter(Boolean));
   const current=new Set([...illustrationConceptPaths,...(brief.artifacts?.illustration_views||[]).map(a=>a.path),brief.artifacts?.sd_concept?.path,...(brief.artifacts?.sd_front_comparison||[]).map(a=>a.path)].filter(Boolean));
   x.collection='balor';x.character='balor';
   x.view=stem.startsWith('helmet_off')?'helmet_off':/^right(?:_|$)/.test(stem)?'right':direction(p);
   if(sd&&!p.includes('/inputs/'))x.view=comparison?'front':'front_right';
   const setVersion=p.match(/\/illustration_3views_v(\d+)\//);
   if(setVersion)x.version=Number(setVersion[1]);
   const rebuildVersion=p.match(/\/gc9_rebuild_v(\d+)\//);
   if(rebuildVersion)x.version=Number(rebuildVersion[1]);
   if(sd)x.version=Number(p.match(/sd_style_test_v(\d+)/)?.[1]||1);
   const feedback=stem.startsWith('review_v05_'),framingGuide=stem.startsWith('framing_guide_'),shieldGuide=stem.startsWith('shield_');
   x.artifact_stage=p.includes('/inputs/')?(sd?'sd_style_reference':feedback?'review_reference':framingGuide?'framing_reference':shieldGuide?'shield_reference':'pose_reference'):comparison?'sd_comparison':sd?(p.includes('/variants/')?'sd_revision':'sd_concept'):setVersion?'direction_set':p.includes('/variants/')?'revision':stem.startsWith('helmet_off')?'face_proposal':'concept';
   if(selectedSD)x.artifact_stage='sd_concept';
   x.status=current.has(p)?'current':'history';
   if(p.includes('/inputs/')){x.role='reference';x.view='reference';x.status='reference';}
   x.series='balor:'+x.artifact_stage+':'+x.view;
   if(comparison){x.comparison_style=stem.startsWith('existing_')?'existing_sd':'new_sd';x.series+=':'+x.comparison_style;}
   x.angle=({front:0,right:90,back:180,front_right:45,helmet_off:0})[x.view];
   x.display_order=sd?4:({front:0,right:1,back:2,helmet_off:3})[x.view];
   if(comparison)x.display_order=x.comparison_style==='existing_sd'?5:6;
   if(x.role==='created')x.prompt_path=path.posix.dirname(p)+'/'+stem+(setVersion&&x.version===1?'_v02':'')+'.prompt.txt';
   const generationCall=read(sd?sdFolder+'/generation-records.json':'output/characters/gc9_balor/generation-records.json').calls.find(call=>call.output===p);
   if(generationCall?.prompt_file)x.prompt_path=generationCall.prompt_file;
   x.title='발로르 · '+viewLabels[x.view]+(x.artifact_stage==='concept'?' · 연결 끈 제거 전 시안':' v'+String(x.version).padStart(2,'0'));
   x.description='서대륙 발트레인 왕국 친왕파 · 제3 기사단장 · 청·은 판금과 청색 망토 · 오른손 검·왼손 방패';
   x.helmet_state=sd||(setVersion&&x.version>=4)||rebuildVersion||current.has(p)||x.artifact_stage==='face_proposal'||p.includes('/variants/')?'off':'on';
   x.hand_grip_preset='one_hand_grip_v1';
   x.review_note=x.status==='current'?'투구 미착용 · 대형 방패 · 측면 검 형태와 후면 손바닥 보정 · 배경 정리':'이전 제작 시안 · 원본 보관';
   if(x.role==='reference'){x.title='한손 그립 참고 · '+stem;x.description='손가락·손목·손잡이와 무기 축만 참고하며 인물의 세계관 배치는 하지 않는다';x.review_note='사용자 제공 자세·손가락 연결 참고';}
   if(feedback){x.title='발로르 수정 피드백 · '+(stem.includes('back_hand')?'후면 오른손':'배경 검은 잔여물');x.description='사용자가 지적한 수정 위치를 확인하는 자료이며 새로운 인물·화풍 참조가 아니다';x.review_note='후면 손바닥 방향·배경 잔여 픽셀 수정 요청';}
   if(framingGuide){x.title='GC9 전신 여백 · 배치 안내';x.description='인물·장비가 연결된 전체를 함께 배치하는 빈 안전 영역 안내도. 그림체 참조가 아니다';x.review_note='코드로 작성한 구도 안내 · 장비 별도 배치 금지';}
   if(shieldGuide){x.title='발로르 · 방패 각도 사용자 표시';x.description='빨강은 방패 뒤 손잡이·팔걸이, 파랑은 팔, 최신 노랑은 손 위치를 나타내는 참고';x.review_note='방패 각도만 수정하는 참고 · 팔·손·자세 변경 지시가 아님';}
   if(stem.startsWith('shield_silhouette_')){x.title='발로르 · 방패 구도·뒷면 사용자 표시';x.description='노랑은 방패 외곽 범위와 각도, 파랑은 방패 뒷면. 손잡이·팔걸이를 유지하고 둥근 윤곽으로 다듬는 참고';x.review_note='v08 최신 표시 · 노랑/파랑의 의미를 이전 팔·손 표시와 구분';}
   if(!sd&&x.status==='current'&&x.version===6){x.title='발로르 · GC9 정면 v06 · 얼굴·여백 보정';x.review_note='정면 1장 수정 · 인물과 장비 전체 여백 · GC9 얼굴선 보정 · 사용자 평가 대기';x.framing_standard_id='gc9_spacious_canvas_v1';x.approval_state='awaiting_revision_review';x.links.push({label:'정면·얼굴 비교',path:'output/characters/gc9_balor/illustration_3views_v06/review.html'});}
   if(!sd&&x.status==='current'&&x.version===7){x.title='발로르 · '+viewLabels[x.view]+' v07 · 방패 각도';x.review_note='방패 각도만 수정 · 기존 팔·손·자세·검·프레이밍 유지 기준 · 사용자 평가 대기';x.approval_state='awaiting_revision_review';x.revision_scope='shield_angle_only';x.links.push({label:'방패 각도 비교',path:'output/characters/gc9_balor/illustration_3views_v07/review.html'});}
   if(!sd&&x.status==='current'&&x.version===8){x.title='발로르 · '+viewLabels[x.view]+' v08 · 방패 구도·곡면';x.review_note='가로형 방패 · 두 구도 모두 뒷면 · 기존 손잡이·팔걸이 · 둥근 테두리 · 사용자 평가 대기';x.approval_state='awaiting_revision_review';x.revision_scope='shield_silhouette_and_reverse_surface';x.framing_standard_id='gc9_spacious_canvas_v1';x.links.push({label:'방패 구도·표시 비교',path:'output/characters/gc9_balor/illustration_3views_v08/review.html'});}
   if(rebuildVersion){x.title='발로르 · GC9 '+viewLabels[x.view]+' 재제작 v'+String(x.version).padStart(2,'0')+(x.status==='current'?' · 시안':' · 중간본');x.review_note='GC9 화풍 재제작 이력 · 원본 보관';}
   if(!sd&&x.status==='current'&&x.version===9&&p===brief.artifacts?.illustration_concept?.path){x.artifact_stage='concept';x.series='balor:concept:'+x.view;x.title='발로르 · GC9 정면 재제작 시안 v09';x.review_note='GC9 그림체 재제작 정면 시안 1장 · 사용자 승인 대기';x.approval_state='awaiting_user_approval';x.revision_scope='gc9_style_rebuild';x.framing_standard_id='gc9_spacious_canvas_v1';x.links.push({label:'GC9 재제작 검수',path:'output/characters/gc9_balor/gc9_rebuild_v09/review.html'});}
   if(!sd&&x.status==='current'&&x.version===10&&illustrationConceptPaths.has(p)){x.artifact_stage='concept';x.series='balor:concept:'+x.view;x.display_order=x.view==='front'?0:1;x.title='발로르 · GC9 '+viewLabels[x.view]+' 시안 v10 · C6 금속';x.review_note='C6 금속 표현 보정 · 정면과 C6 동일 방향 사선 시안 · 사용자 승인 대기';x.approval_state='awaiting_user_approval';x.revision_scope='c6_metal_and_threequarter';x.framing_standard_id='gc9_spacious_canvas_v1';x.links.push({label:'C6 금속·사선 검수',path:'output/characters/gc9_balor/gc9_rebuild_v10/review.html'});}
   if(sd){x.title='발로르 · SD 픽셀풍 '+(x.role==='reference'?'참조 '+stem:'오른쪽 앞 사선 시안 v'+String(x.version).padStart(2,'0'));x.description='큰 머리·짧은 팔다리·픽셀 명암·약간 높은 RPG 카메라로 재구성한 발로르';x.review_note=x.role==='reference'?'새 SD 비율·픽셀 표현 참고':x.status==='current'?'SD 시안 1장 · 사용자 확인 대기':'SD 방패 보정 전 중간본';x.approval_state=x.role==='created'?'awaiting_user_approval':null;}
   if(comparison){x.title='발로르 · '+(x.comparison_style==='existing_sd'?'기존 SD':'새 SD')+' 정면 비교';x.description='같은 발로르·장비·정면 입상으로 기존 SD와 새 SD를 비교';x.review_note='정면 비교용 · SD 스타일 선택 대기';x.approval_state='awaiting_style_selection';x.links.push({label:'SD 정면 비교',path:sdFolder+'/comparison.html'});}
   if(selectedSD){x.title='발로르 · 기존 SD 정면 · 선택본';x.decision_status='selected';x.approval_state='approved_design_scale_pending';x.review_note='기존 SD 채택 · 선택 당시 은발 기준 크기·비율 적용 예정이던 이력 · 향후 기준은 SD 공통 기준 참조';x.sizing_standard_id='sd_silver_staff_standard_v1';x.framing_alignment_pending=true;x.links.push({label:'SD 공통 크기 기준',path:'output/characters/sd-standard/index.html'});}
   if(discardedSD){x.status='history';x.decision_status='discarded';x.approval_state='rejected';x.future_reference_allowed=false;x.review_note='새 SD 폐기 · 2026-11-08 사용자 결정 · 향후 제작 참조 제외';}
   if(inactiveSDReference){x.decision_status='inactive_rejected_style';x.future_reference_allowed=false;x.review_note='폐기된 새 SD 스타일의 입력 자료 · 활성 화풍 참조 제외';}
   if(!sd&&x.role==='created'&&stylePolicy.rejected_style_paths.includes(p)){
    x.status='history';x.decision_status='style_rejected';x.approval_state='rejected_style';x.style_validation_status='rejected_by_user';x.future_reference_allowed=false;
    x.revision_scope='whole_character_style_failure';x.review_note='GC9 전체 작화 미통과 · 이전 제작 이력 · 편집·화풍 마스터 제외';
    x.title='발로르 · '+viewLabels[x.view]+' v'+String(x.version).padStart(2,'0')+' · 그림체 미통과';
    x.links.push({label:'작화 오류 점검·기준 복구',path:'output/characters/gc9_balor/style_recovery_20261108/review.html'});
   }
   if(!sd&&x.role==='created'&&p===brief.latest_unverified_candidate?.path){
    x.status='history';x.style_validation_status='unverified';x.approval_state='internal_checks_failed_style_unreviewed';x.future_reference_allowed=false;
    x.title='발로르 · 정면 재제작 v11 · 제작 조건 미충족';x.review_note='정면1장 · C6 전체 작화 참조 · 여백·방패 크기 미충족 · 그림체 사용자 검토 전 · 자동 추가 생성 중단';
    x.links.push({label:'C6 정면 비교·검수',path:'output/characters/gc9_balor/gc9_rebuild_v11/review.html'});
   }
   x.search_tags=['발로르','제3기사단장','친왕파','청은기사','팔라딘'];
   if(sd){for(const [label,file]of[['SD 제작 기준','제작기준.md'],['SD 생성 기록','generation-records.json'],['SD 참조 분석','reference-analysis.json']])x.links.push({label,path:sdFolder+'/'+file});x.links.push({label:'캐릭터 설정',path:'output/characters/gc9_balor/character-brief.json'});}
   else for(const [label,file] of [['캐릭터 설정','character-brief.json'],['제작 기준','제작기준.md'],['생성 기록','generation-records.json'],['검수 결과','visual-review.json']])x.links.push({label,path:'output/characters/gc9_balor/'+file});
   const zip='output/characters/gc9_balor/balor_illustration_3views_v'+String(x.version).padStart(2,'0')+'.zip';
   if(x.artifact_stage==='direction_set'&&fs.existsSync(path.join(root,zip)))x.links.push({label:'3방향 PNG 묶음 v'+String(x.version).padStart(2,'0'),path:zip});
  }
  else if(p.startsWith('output/characters/gc9_central_light_archmage/')){
   x.collection='centralLightArchmage';x.character='central_light_archmage';x.series='central_light_archmage:'+x.view;
   if(p.includes('/variants/'))x.status='history';
   x.title='아르케리온 수석 빛 마법사 · '+viewLabels[x.view]+' 시안 v'+String(x.version).padStart(2,'0');
   x.description='작은 마법 수도 아르케리온 소속 · 인간 남성 · 장발·안경·흰 로브';
   x.review_note='신규 GC9 전신 시안 · 최종 사용자 확인 별도';
   x.search_tags=['아르케리온','하르케리온','아르켈리온','아스테른','중앙제국','빛마법사','수석 마법사'];
   for(const [label,file] of [['제작 기준','제작기준.md'],['캐릭터 설정','character-brief.json'],['생성 기록','generation-records.json'],['검수 결과','visual-review.json']])x.links.push({label,path:'output/characters/gc9_central_light_archmage/'+file});
  }
  else if(p.startsWith('output/characters/gc9_longsword_dagger/pixel_8views_v01/')){
   x.collection='longswordDaggerPixel';x.character='longsword_dagger';
   const angle=Number(stem.match(/_(\d{3})(?:_|$)/)?.[1]);
   x.view=({0:'front',45:'front_right',90:'right',135:'back_right',180:'back',225:'back_left',270:'left',315:'front_left'})[angle];
   if(!x.view)throw Error('Missing pixel direction '+p);
   x.angle=angle;x.series='longsword_dagger:pixel8:'+x.view;
   if(p.includes('/variants/'))x.status='history';
   x.title='금발 장검·단검 · SD 픽셀 · '+viewLabels[x.view]+' v01'+(x.status==='history'?' · 초안':'');
   x.description='양발 입상 · 오른손 장검·왼손 단검 · 오른다리 판금·왼다리 청색 천';
   x.review_note='GC9 캐릭터 디자인을 짧은 SD 비율의 픽셀 표현으로 전환';
   for(const [label,file] of [['8방향 비교','비교.html'],['PNG 8장 묶음','longsword-dagger-pixel8-v01.zip'],['제작 기준','제작기준.md'],['생성 기록','generation-records.json']])x.links.push({label,path:'output/characters/gc9_longsword_dagger/pixel_8views_v01/'+file});
  }
  else if(p.startsWith('output/characters/gc9_longsword_dagger/')){
   x.collection='longswordDagger';x.character='longsword_dagger';
   if(p.includes('/inputs/')){
    x.role='reference';x.view='reference';
    x.title='장검·단검 캐릭터 · '+({outfit22:'복장 참고 22',hair23:'머리 참고 23','weapon-sketch':'무기 형태 스케치'}[stem]||stem);
    x.description='신규 GC9 캐릭터 제작용 역할별 구성 참조';
   } else {
    x.title='금발 장검·단검 · '+viewLabels[x.view]+' 시안 v'+String(x.version).padStart(2,'0');
    x.description='청색 목도리·은빛 판금·금발 · 오른손 장검·왼손 단검';
    x.review_note='신규 GC9 전신 시안';x.series='longsword_dagger:'+x.view;
    x.links.push({label:'생성 기록',path:'output/characters/gc9_longsword_dagger/generation-records.json'});
   }
   x.links.push({label:'제작 기준',path:'output/characters/gc9_longsword_dagger/제작기준.md'});
  }
  else if(p.includes('/style_references/')){x.collection='original8';x.character=['adventurer','blonde_mage','silver_mage','healer','burgundy','blue_warrior','lion_knight','red_ponytail'][Number(stem.slice(0,2))-1]||'original8';x.role='reference';x.view='sheet';}
  else if(p.includes('/style_tests/')){
   if(p.includes('/gc9_red_ponytail/')){x.collection='ponytail4';x.character='red_ponytail';if(p.includes('/four_views_v04/')){x.version=4;if(x.view==='side_reference')x.view='right';}else{x.view='sheet';x.status='history';}}
   else if(p.includes('/eye_balance_batch_v01/')){
    x.collection='eyes';x.view=/archer/.test(stem)?'front':'sheet';
    x.character=/teal_elf/.test(p)?'teal_elf_archer':/silver_archer/.test(p)?'silver_archer':/04_blonde/.test(p)?'healer':/05_burgundy/.test(p)?'burgundy':'red_ponytail';
   } else {
    x.collection='styleTests';x.character=p.split('/')[3];
    if(!['silver_archer','teal_elf_archer','blonde_wind_elf'].includes(x.character))throw Error('Unclassified style test '+p);
    if(stem.includes('original_pose'))x.view='illustration';
    if(/face_(anime|crisp)/.test(stem))x.view='front';
    x.series=`style:${x.character}:${x.view}`;
    const windElfVersion=p.match(/\/blonde_wind_elf\/gc9_concept_v(\d+)\//);
    if(windElfVersion){
     x.collection='windElfGC9';x.view='front';x.version=Number(windElfVersion[1]);x.series='blonde_wind_elf:gc9:front';x.artifact_stage='concept';
     x.title='금발 바람 엘프 · GC9 정면 시안 v'+windElfVersion[1];x.description='옅은 금발·황록색 눈·긴 귀 · 흰색·청록 겹옷 · 무기 없는 정면';
     x.approval_state='awaiting_user_approval';x.style_validation_status='unverified';x.future_reference_allowed=false;x.framing_standard_id='gc9_spacious_canvas_v1';
     x.review_note=x.version===4?'Edel 단일 주 작화 · Bram 재질·구도·C4 일관성 참조 · 그림체 사용자 검토 대기':'C3~C6 8장 기준의 정면 시안1장 · C4/C3 전체 작화·Edel 보조 · 그림체 사용자 검토 대기';
     for(const [label,file]of[['원본·C4 비교','review.html'],['생성 기록','generation-records.json'],['입력·역할','production-plan.json']])x.links.push({label,path:path.posix.dirname(p)+'/'+file});
     if(stylePolicy.rejected_style_paths.includes(p)){
      x.status='history';x.approval_state='rejected_style';x.style_validation_status='rejected_by_user';x.decision_status='style_rejected';
      x.title='금발 바람 엘프 · 정면 v'+windElfVersion[1]+' · 그림체 미통과';x.review_note='얼굴·머리·선·명암의 전체 작화 미통과 · 편집·화풍 참조 제외';
      x.links.push({label:'실패 원인 분석',path:path.posix.dirname(p)+'/failure-analysis-20261108/report.md'});
     }
     const windElfReviewPath=path.posix.dirname(p)+'/visual-review.json';
     if(fs.existsSync(path.join(root,windElfReviewPath))&&read(windElfReviewPath).user_feedback?.improved_vs_previous===true){
      x.status='current';x.approval_state='needs_refinement';x.style_validation_status='improved_below_acceptance';x.decision_status='needs_refinement';
      x.title='금발 바람 엘프 · 정면 v'+windElfVersion[1]+' · 개선됨·합격선 미달';x.review_note='v03 대비 개선 · 사용자 합격선 미달 · 수정 중 시안 · 화풍 마스터 채택 전';
      const components=read(windElfReviewPath).component_assessments;
      if(components){x.component_assessments=components;x.review_note='얼굴·머리카락 미세 조정 · 금속 거의 합격선·미세 보완 · 옷 표현 최우선 보완';}
     }
     if(!stylePolicy.rejected_style_paths.includes(p)&&fs.existsSync(path.join(root,windElfReviewPath))&&read(windElfReviewPath).internal_conditions_pass===false){
      x.status='history';x.approval_state='internal_checks_failed_style_unreviewed';x.title='금발 바람 엘프 · 정면 v'+windElfVersion[1]+' · 여백 미충족';
      x.review_note='상단·하단 여백 미충족 · 그림체 사용자 검토 전 · 자동 추가 생성 중단';
     }
    }
   }
   if(p.includes('/references/')){x.role='reference';x.view='reference';x.description='제작 과정에서 사용한 원본·화풍·구성 참조';}
   if(stem==='style_burgundy'){x.character='burgundy';x.title='화풍 참조 · 버건디 머리 여검사';}
   if(stem==='style_knight'){x.character='lion_knight';x.title='화풍 참조 · 청사자 갑옷 기사';}
  } else {
   const character=p.split('/')[2];if(!/^char00[123]$/.test(character))throw Error('Unclassified character path '+p);
   x.character=character;x.collection='legacy00'+character.at(-1);
   const kind=p.split('/')[3];
   if(!old){x.role='reference';x.view='reference';x.description='기존 제작 과정에 사용한 원본·구도·재질 참조';}
   if(kind==='illustration'){x.view=x.role==='reference'?'reference':'illustration';x.series=`${character}:illustration`;}
   if(kind==='reference_poses'){x.series=`${character}:structure:${x.view}`;if(character==='char003'&&x.view==='side_reference')x.description+=' · 정확한 90도가 아닌 측면에 가까운 사선';}
   if(kind==='style_b'||kind==='redesign_c')x.series=`${character}:${kind}:${x.view}`;
   if(kind==='ingame_concept'){
    x.view=x.role==='reference'?'reference':'illustration';
    const mode=stem.includes('chromakey')?'chromakey':stem.includes('outline')?'outline':stem.includes('transparent')?'transparent':'concept';
    x.series=`${character}:ingame:${mode}`;
   }
  }
 } else if(p.startsWith('output/character-redesign-6x2/')){
  x.collection='gc9six';x.character=p.match(/c0[1-6]/)?.[0]||(/c1-/.test(p)?'c01':'gc9refs');
  if(p.includes('/inputs/')){x.role='reference';x.view='reference';x.title=stem.startsWith('pose_')?'6종 전환 · '+(stem.includes('front')?'정면 구도 참조':'사선 구도 참조'):charNames[x.character]+' · 구성 원본';}
  else {x.version=p.includes('/revisions/')?2:1;x.title=charNames[x.character]+' · '+viewLabels[x.view]+' v'+x.version;x.series=`six:${x.character}:${x.view}`;}
  if(x.character==='c04'&&x.role==='created')x.review_note='사용자 얼굴·전체 표현 우선 기준';
  if(x.character==='c03'&&x.role==='created')x.review_note='사용자 금속 표현 우선 기준';
  if(x.character==='c01'&&x.version===2)x.review_note='얼굴·금속 수정본 · 최종 사용자 확인 별도';
  x.links.push({label:'제작·피드백',path:'output/character-redesign-6x2/제작기준.md'});
  if(x.role==='created')x.links.push({label:'생성 기록',path:p.includes('/revisions/')?'output/character-redesign-6x2/revisions/c01-v2/생성기록.json':'output/character-redesign-6x2/생성기록.json'});
 } else if(p.startsWith('output/red-haired-adventurer-4views-v1/')){
  x.collection='adventurer4';x.character='adventurer';if(p.includes('/inputs/')){x.role='reference';x.view='sheet';}
  if(x.view==='side_reference')x.view='right';
  x.title='붉은 머리 모험가 · '+viewLabels[x.view];
 } else if(p.startsWith('output/illustration-final-test-2x4-v1/')){
  x.collection='test2x4';x.character=/t14|design14/.test(p)?'t14':'t15';
  if(p.includes('/inputs/')){x.role='reference';x.view='reference';}
  if(x.view==='side_reference')x.view='right';
  if(p.includes('/variants/'))x.status='history';else if(x.character==='t15'&&x.view==='back'&&x.role==='created')x.version=2;
  x.title=charNames[x.character]+' · '+viewLabels[x.view]+(x.status==='history'?' · 수정 전':'');
 } else if(p.startsWith('output/silver-staff-8views-v1/')){
  x.collection='staff8';x.character='staff';
  const angle=Number(stem.match(/_(\d{3})(?:_|$)/)?.[1]);
  x.view=({0:'front',45:'front_right',90:'right',135:'back_right',180:'back',225:'back_left',270:'left',315:'front_left'})[angle]||'reference';
  x.angle=Number.isFinite(angle)?angle:null;
  if(p.includes('/source/')){x.role='reference';x.view='reference';}
  if(p.includes('/variants/')){x.status='history';x.description='지팡이·원통 장비 좌우 수정 전 초안';}
  else if(x.role==='created'){x.version=[0,90,180].includes(angle)?2:1;x.description='서 있는 자세 · 왼손 지팡이 · 오른쪽 허리 장비';}
  x.title='은발·날개 지팡이 · '+viewLabels[x.view]+(x.status==='history'?' · 초안':'');
 } else if(p.startsWith('output/animation/dreamina-right-walk-60-v01/')){
  x.collection='videoWalk60';x.character='longsword_dagger';x.view='sheet';x.series='longsword_dagger:walk_right_60_sheet';
  x.title='금발 장검·단검 · 오른쪽 걷기 60프레임 시트 v01';
  x.description='영상 배경 제거 · 10열×6행 · 프레임당 672×720 · 실제 알파 PNG';
  x.review_note='원본 영상의 동작 추출 · 공통 프레임 기준점';
  for(const [label,file] of [['걷기 재생·프레임 미리보기','미리보기.html'],['개별 60장·시트·JSON 묶음','walk-right-60-complete.zip'],['프레임 좌표 JSON','walk_right_60.json'],['제작 기록','제작기록.md'],['추출 원본·시각','source-and-extraction.json'],['파일 검수','verification.json']])x.links.push({label,path:'output/animation/dreamina-right-walk-60-v01/'+file});
 } else if(p.startsWith('자료/캐릭터제작/한손무기그립/원본/')){
  x.collection='handGripReferences';x.character='one_hand_grip';x.role='reference';x.view='reference';x.title='한손 무기 그립 · '+stem;x.description='사용자 확정 그립: 빨간 손가락 연결과 파란 무기 축. 인물·의상·소속은 참고하지 않는다';
 } else if(p.startsWith('자료/캐릭터제작/SD공통기준/원본/')){
  x.collection='sdHeightGuide';x.character='sd_height_guide';x.role='reference';x.view='reference';x.artifact_stage='height_guide';x.title='SD 키 기준 · 사용자 빨간 선';x.description='머리끝~발바닥의 세로 키 기준. 가로폭·체격 제한이나 원본 캔버스 좌표로 해석하지 않는다';x.links.push({label:'SD 공통 기준',path:'문서/02_세부기획/02_영웅/SD_공통제작기준.md'});
 } else if(p.includes('/GC9/')){
  x.collection='gc9refs';x.character='gc9refs';x.role='reference';x.view='reference';
  const r=findRef(gc9,p);x.title=r?`${r.id} · ${r.label||r.name||r.original_filename}`:stem;
 } else if(p.includes('/SP13/')){
  x.collection='sp13refs';x.character='sp13refs';x.role='reference';x.view='reference';
  const r=findRef(splash,p);x.title=r?`${r.id} · ${r.label}`:stem;x.description=r?.observed?.transfer_rule||'';
 } else throw Error('Unclassified image '+p);
 if(x.role==='reference')x.status='reference';
 if(!sourceGroupMap.has(x.collection)||!charNames[x.character])throw Error('Missing classification '+p+' '+x.character);
 x.character_label=charNames[x.character];x.view_label=viewLabels[x.view];x.origin=sourceGroupMap.get(x.collection).origin;x.style=sourceGroupMap.get(x.collection).style;
 if(x.character==='balor'&&x.role==='reference')x.style=x.artifact_stage==='review_reference'?'수정 참고':x.artifact_stage==='framing_reference'?'여백 안내':x.artifact_stage==='shield_reference'?'방패 각도 참고':'그립 참조';
 if(x.character==='balor'&&x.artifact_stage?.startsWith('sd_'))x.style=x.role==='created'?'SD 픽셀풍':'SD 화풍 참조';
 if(x.decision_status==='selected'&&x.comparison_style==='existing_sd')x.style='SD 픽셀 · 기존';
 if(x.artifact_stage==='sd_comparison')x.style=x.comparison_style==='existing_sd'?'SD 픽셀 · 기존':'SD 픽셀풍 · 새 시안';
 const candidates=[...(x.prompt_path?[x.prompt_path]:[]),`${path.posix.dirname(p)}/${stem}.prompt.txt`,`${path.posix.dirname(p)}/generation-prompts.txt`,`${path.posix.dirname(p)}/generation-prompts_v20.txt`,`${path.posix.dirname(p)}/generation-prompt.txt`,`${path.posix.dirname(p)}/production.txt`];
 const prompt=candidates.find(p=>fs.existsSync(path.join(root,p)));if(prompt&&x.role==='created')x.links.push({label:'프롬프트',path:prompt});
 if(x.collection==='staff8')x.links.push({label:'생성 기록',path:'output/silver-staff-8views-v1/generation-records.json'});
 if(x.collection==='test2x4')x.links.push({label:'생성 기록',path:'output/illustration-final-test-2x4-v1/생성기록.json'});
 if(x.collection==='adventurer4')x.links.push({label:'생성 기록',path:'output/red-haired-adventurer-4views-v1/생성기록.json'});
 x.source_group=x.collection;x.source_group_label=sourceGroupMap.get(x.collection).label;
 x.gc9_applied=x.role==='created'&&gc9Groups.has(x.source_group)&&!x.artifact_stage?.startsWith('sd_');
 if(x.gc9_applied&&!x.style_validation_status)x.style_validation_status=x.source_group==='gc9six'&&['c02','c03','c04','c05','c06'].includes(x.character)?'positively_reviewed_by_user':'unverified';
 if(x.role==='created'&&blondWarriorGroups.has(x.source_group)){
  x.collection='blondWarrior';x.search_tags=['금발전사','금발 전사'];
  x.display_order=x.source_group==='longswordDaggerPixel'?x.angle/45:x.source_group==='longswordDagger'?8:9;
 } else if(x.source_group==='balor'||x.source_group==='splashApproved')x.collection=x.role==='created'?'newCharacters':'attachments';
 else if(!['staff8','gc9refs','sp13refs'].includes(x.source_group))x.collection=x.role==='reference'?'attachments':x.gc9_applied?'gc9Final':'testProcess';
 x.url=path.posix.relative(galleryFolder,p);x.links=x.links.map(l=>({...l,url:path.posix.relative(galleryFolder,l.path)}));
 return x;
}
const rows=metadata.map(classify);
const newest=new Map();for(const r of rows)if(r.role==='created'&&r.series)newest.set(r.series,Math.max(newest.get(r.series)||0,r.version));
for(const r of rows)if(r.role==='created'&&r.series&&r.version<newest.get(r.series))r.status='history';
const buckets=new Map();for(const r of rows){if(!buckets.has(r.sha256))buckets.set(r.sha256,[]);buckets.get(r.sha256).push(r);}
const rank={current:0,history:1,reference:2};
const assets=[...buckets.values()].map(list=>{
 list.sort((a,b)=>rank[a.status]-rank[b.status]||collectionMap.get(a.collection).order-collectionMap.get(b.collection).order||a.path.localeCompare(b.path));
 const primary=list[0];return {...primary,id:'img_'+primary.sha256.slice(0,16),links:[...new Map(list.flatMap(r=>r.links).map(l=>[l.path,l])).values()],collections:[...new Set(list.map(r=>r.collection))],characters:[...new Set(list.map(r=>r.character))],aliases:list.map(r=>({path:r.path,url:r.url,collection:r.collection,source_group:r.source_group,character:r.character,role:r.role,status:r.status,title:r.title})),duplicate_count:list.length-1};
}).sort((a,b)=>collectionMap.get(a.collection).order-collectionMap.get(b.collection).order||a.character.localeCompare(b.character)||rank[a.status]-rank[b.status]||(a.display_order||0)-(b.display_order||0)||a.path.localeCompare(b.path));
const registry=read('자료/캐릭터설정/캐릭터목록.json');
for(const extra of supplement.profiles){
 if(registry.profiles.some(p=>p.id===extra.id))throw Error('Duplicate supplemental profile '+extra.id);
 registry.profiles.push(extra);
}
for(const [id,patch] of Object.entries(supplement.profile_updates||{})){
 const profile=registry.profiles.find(p=>p.id===id);if(!profile)throw Error('Missing supplemental update profile '+id);
 Object.assign(profile,patch);
}
const production=read('자료/캐릭터설정/제작순서.json');
if(production.sd.standard_id!==sdStandard.id)throw Error('SD production/standard ID mismatch');
if(sdStandard.reference.native_framing_is_delivery_template!==false||!sdStandard.generation.framing_canvas)throw Error('Separate native SD references from delivery framing');
const world=read('자료/세계관/세계관설정.json');
const continents=[...world.regions.map(r=>({id:r.id,label:r.continent,country:r.name})),{id:'unassigned',label:'출신 미지정',country:null}];
const affiliations=[...world.regions.map(r=>({id:r.id,label:r.name,kind:'country'})),...world.capitals.map(c=>({id:c.id,label:c.name,kind:'city'})),...world.factions.map(f=>({id:f.id,label:world.regions.find(r=>r.id===f.region_id).name+' '+f.name,kind:'faction',region_id:f.region_id})),...(world.organizations||[]).map(o=>({id:o.id,label:o.name,kind:'organization'})),...world.families.map(f=>({id:f.id,label:f.name,kind:'family'})),...world.landmarks.filter(l=>l.people_id).map(l=>({id:l.id,label:l.name,kind:'people_home'}))];
const profiles=new Map(registry.profiles.map(p=>[p.id,p])),classes=new Map(registry.classes.map(c=>[c.id,c]));
for(const a of assets){
 if(a.role!=='created')continue;
 const p=profiles.get(a.character);if(!p)throw Error('Missing character profile '+a.character);
 if(!classes.has(p.class_id)||!continents.some(c=>c.id===p.origin_id))throw Error('Unknown origin/class '+p.id);
 if(p.affiliation_ids.some(id=>!affiliations.some(f=>f.id===id)))throw Error('Unknown affiliation '+p.id);
 if(p.placement_status==='deferred'&&(p.origin_id!=='unassigned'||p.affiliation_ids.length))throw Error('Deferred character must stay unassigned '+p.id);
 a.profile_id=p.id;a.origin_id=p.origin_id;a.class_id=p.class_id;
 a.profile_tags=[
  ...(p.affiliation_ids.length?p.affiliation_ids.map(id=>({kind:'affiliation',label:affiliations.find(f=>f.id===id).label})):[{kind:'affiliation',label:'소속 미지정'}]),
  {kind:'class',label:classes.get(p.class_id).label},
  {kind:'profession',label:p.profession||'직업 미지정'},
  ...(p.weapons.length?p.weapons.map(label=>({kind:'weapon',label})):[{kind:'weapon',label:'무기 미지정'}]),
  ...(p.attack_disciplines.length?p.attack_disciplines.map(label=>({kind:'discipline',label})):[{kind:'discipline',label:'공격 계열 미지정'}])
 ];
}
const catalog={
 schema_version:3,title:'캐릭터 제작 모음',organized_on:'2026-11-07',source_image_paths:rows.length,unique_images:assets.length,duplicate_paths:rows.length-assets.length,legacy_items:legacy.length,
 continents,classes:registry.classes,affiliations,profiles:registry.profiles,production,sd_standard:sdStandard,
 collections,source_groups:sourceGroups,
 category_rules:{dedicated_created:{blondWarrior:[...blondWarriorGroups]},gc9_created:'gc9Final',non_gc9_created:'testProcess',other_references:'attachments',preserved:['staff8','gc9refs','sp13refs'],gc9_source_groups:[...gc9Groups]},
 view_labels:viewLabels,characters:Object.entries(charNames).map(([id,label])=>({id,label})),
 counts:Object.fromEntries(['current','history','reference'].map(s=>[s,assets.filter(a=>a.status===s).length])),collection_counts:Object.fromEntries(collections.map(c=>[c.id,assets.filter(a=>a.collection===c.id).length])),assets,
 notes:['주 탐색은 출신 대륙과 클래스의 교차 선택이다.','상단 전체 클래스는 대륙 조건을 해제하고 해당 클래스 전체를 연다.','기존 7개 제작 묶음은 보관 분류로 유지한다.','최근 정리본은 작업별 버전·선택 기록에 따른 분류이며 사용자 최종 승인을 뜻하지 않는다.','GC9 적용 분류는 생성 의도이며 작화 합격 판정이 아니다. style_validation_status를 별도로 확인한다.','원본 파일·프롬프트·인계 스냅샷의 크기와 바이트를 보존한다.','기존 금발 전사 보관 묶음은 SD 픽셀 8방향·GC9 일러스트·걷기 순서를 유지한다.','기존 8방향·걷기 자료는 새 4방향/3방향 제작 규칙과 구분한다.']
};
for(const [p] of oldByPath)if(!rows.some(r=>r.path===p))throw Error('Legacy gallery image lost: '+p);
for(const a of assets){if(!fs.existsSync(path.join(root,a.path)))throw Error('Missing image '+a.path);for(const l of a.links)if(!fs.existsSync(path.join(root,l.path)))throw Error('Missing linked document '+l.path);}
fs.writeFileSync(path.join(out,'image-metadata.json'),JSON.stringify(metadata,null,2)+'\n');
catalog.organized_on=supplement.updated_on||catalog.organized_on;
catalog.approval_supplement={task:supplement.task||null,source:supplementPath,note:'사용자 일단합격은 기술검수·공통스타일마스터 승인과 구분한다.'};
fs.writeFileSync(path.join(out,'catalog.json'),JSON.stringify(catalog,null,2)+'\n');
const template=fs.readFileSync(path.join(root,'tools/character-catalog/gallery.template.html'),'utf8');
if(!template.includes('__CATALOG_DATA__'))throw Error('Template placeholder missing');
fs.writeFileSync(path.join(root,galleryFolder,'gallery.html'),template.replace('__CATALOG_DATA__',JSON.stringify(catalog).replaceAll('<','\\u003c')));
console.log(JSON.stringify({sourcePaths:rows.length,uniqueImages:assets.length,duplicates:catalog.duplicate_paths,legacyItems:legacy.length,counts:catalog.counts,collections:collections.length}));

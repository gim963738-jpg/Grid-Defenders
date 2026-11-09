async function runCharacterDesktopChecks(){
 const ensure=(value,message)=>{if(!value)throw Error(message);},report={};
 const change=(id,value)=>{byId(id).value=value;byId(id).dispatchEvent(new Event('change'));};
 reset();
 ensure(records.length===characterCount(latestCreated),'one card per character');
 ensure(filtered.length===catalog.counts.current,'current image count');
 report.default={characters:records.length,images:filtered.length};
 ensure(byId('continent-list').children.length===catalog.continents.length+1,'continent navigation');
 ensure(byId('global-class-list').children.length===catalog.classes.length+1,'global classes');
 document.querySelector('[data-continent="central"]').click();
 document.querySelector('[data-class="mage"]').click();
 ensure(state.origin==='central'&&state.classId==='mage'&&records.length===0&&!byId('empty').hidden,'existing mage remains outside central placement');
 report.centralMage={characters:records.length,images:filtered.length};
 document.querySelector('[data-continent="unassigned"]').click();
 document.querySelector('[data-class="mage"]').click();
 const mage=filtered.find(a=>a.character==='central_light_archmage');
 ensure(mage&&mage.origin_id==='unassigned'&&grid.querySelector('.taxonomy-tags').textContent.includes('소속 미지정'),'existing chief mage unassigned');
 ensure([...grid.querySelectorAll('.tag.affiliation')].every(t=>t.textContent==='#소속 미지정'),'no legacy mage affiliation tags');
 for(const kind of ['class','profession','weapon','discipline'])ensure(grid.querySelector('.tag.'+kind),'profile tag '+kind);
 report.unassignedMages={characters:records.length,tags:[...grid.querySelectorAll('.tag')].map(n=>n.textContent)};
 byId('query').value='missing_character_48f';byId('query').dispatchEvent(new Event('input'));ensure(filtered.length===0&&!byId('empty').hidden,'search empty state');
 document.querySelector('[data-continent="west"]').click();
 ensure(state.query===''&&state.classId==='all','continent clears stale filters');
 document.querySelector('[data-class="swordsman"]').click();
 ensure(filtered.length===0&&!byId('empty').hidden,'new-character empty category');
 ensure(characterCreationContext.origin_id==='west'&&characterCreationContext.class_id==='swordsman','selected creation context');
 report.emptyOriginContext={...characterCreationContext};
 document.querySelector('[data-class="knight"]').click();
 ensure(records.length===1&&filtered.every(a=>a.character==='balor'),'Balor assigned to western knight category');
 ensure(grid.querySelector('.taxonomy-tags').textContent.includes('발트레인 왕국 친왕파'),'western royalist affiliation');
 const illustrationViews=filtered.filter(a=>a.artifact_stage==='concept'),sdConcepts=filtered.filter(a=>a.artifact_stage==='sd_concept');
 ensure(filtered.length===1&&illustrationViews.length===0&&filtered.every(a=>a.helmet_state==='off'),'failed GC9 illustrations excluded from current; selected SD retained');
 const styleRejected=assets.filter(a=>a.character==='balor'&&a.style_validation_status==='rejected_by_user');
 ensure(styleRejected.length>0&&styleRejected.every(a=>a.status==='history'&&a.style_validation_status==='rejected_by_user'&&a.approval_state==='rejected_style'&&a.future_reference_allowed===false),'whole-style failure cannot become an illustration master');
 ensure(grid.textContent.includes('전체 작화 미통과'),'current character card discloses illustration failure separately from SD');
 ensure(!filtered.some(a=>a.artifact_stage==='direction_set')&&assets.filter(a=>a.character==='balor'&&a.artifact_stage==='direction_set').every(a=>a.status==='history'),'previous Balor direction sets retained as history');
 ensure(sdConcepts.length===1&&sdConcepts[0].comparison_style==='existing_sd'&&sdConcepts[0].approval_state==='approved_design_scale_pending'&&!sdConcepts[0].gc9_applied,'one selected existing SD concept');
 const discardedSD=assets.filter(a=>a.character==='balor'&&a.decision_status==='discarded');ensure(discardedSD.length===3&&discardedSD.every(a=>a.status==='history'&&!filtered.includes(a)),'new SD discarded and outside current view');
 ensure(catalog.sd_standard.body_framing.body_height_px===926&&catalog.production.sd.standard_id===catalog.sd_standard.id,'silver staff SD standard');
 report.balor={characters:records.length,images:filtered.length,views:[],illustrationVersion:10,illustrationApproval:'rejected_style',rejectedIllustrations:styleRejected.length,selectedSD:'existing_sd',discardedSD:discardedSD.length,sizeStandard:catalog.sd_standard.id,helmet:'off',gripPreset:'one_hand_grip_v1'};
 document.querySelector('[data-global-class="archer"]').click();
 ensure(state.origin==='all'&&state.classId==='archer'&&records.length===classCount('archer'),'global class ignores continent');
 ensure(filtered.every(a=>a.class_id==='archer'),'global class results');
 report.globalArcher={characters:records.length,images:filtered.length};
 reset();
 for(const scope of ['current','history','reference','all']){change('scope',scope);ensure(filtered.length===scopeCount(scope),'scope '+scope);}
 ensure(state.display==='images'&&grid.children.length===24,'image pagination start');byId('more').click();ensure(grid.children.length===48,'image pagination more');
 report.scopes={...catalog.counts,all:assets.length};
 document.querySelector('[data-reference="gc9refs"]').click();
 ensure(filtered.length===16&&byId('class-tabs').hidden,'GC9 reference view');
 ensure([...grid.querySelectorAll('.taxonomy-tags')].length===0,'references do not get project affiliations');
 document.querySelector('[data-global-class="mage"]').click();ensure(state.scope==='current'&&state.collection==='all'&&state.classId==='mage','global class leaves reference view');
 report.archiveCollections=[];
 for(const c of catalog.collections){setCollection(c.id);state.scope='all';render();ensure(filtered.length===catalog.collection_counts[c.id],'archive '+c.id);report.archiveCollections.push({id:c.id,count:filtered.length});}
 setCollection('blondWarrior');
 ensure(filtered.length===10&&filtered.slice(0,8).every(a=>a.source_group==='longswordDaggerPixel'),'blond pixel eight first');
 ensure(filtered.slice(0,8).map(a=>a.angle).join(',')==='0,45,90,135,180,225,270,315','blond direction order');
 ensure(filtered[8].source_group==='longswordDagger'&&filtered[9].source_group==='videoWalk60','blond illustration and walk retained');
 report.blondWarrior={images:filtered.length,pixelViews:8};
 location.hash='staff8';restore();ensure(state.collection==='staff8'&&state.display==='images'&&filtered.length===8,'old staff bookmark');
 const staff=filtered[0];openAsset(staff,filtered);await byId('large').decode();
 report.native={naturalWidth:byId('large').naturalWidth,displayWidth:byId('large').getBoundingClientRect().width,related:byId('related-assets').children.length};
 ensure(report.native.naturalWidth===staff.width&&Math.abs(report.native.displayWidth-staff.width)<0.5,'native pixels');
 ensure(report.native.related===8,'related view strip');
 const another=byId('related-assets').children[2];another.click();await byId('large').decode();ensure(byId('viewer-path').textContent!==staff.path,'related image switch');
 byId('fit').click();ensure(byId('large').classList.contains('fit'),'fit control');byId('close').click();
 const duplicate=assets.find(a=>a.duplicate_count>0);openAsset(duplicate,[duplicate]);ensure(byId('alias-list').children.length===duplicate.aliases.length,'duplicate paths retained');byId('close').click();
 document.querySelectorAll('[data-background]')[1].click();ensure(getComputedStyle(document.documentElement).getPropertyValue('--stage').trim()==='#161e27','dark preview');document.querySelectorAll('[data-background]')[0].click();
 ensure(catalog.production.illustration.final_count===4&&catalog.production.sd.final_count===3,'production counts');
 ensure(catalog.production.illustration.approval_before_remaining_views&&catalog.production.sd.approval_before_remaining_views,'two explicit approval stages');
 ensure(catalog.production.preserve_original_image_dimensions&&catalog.production.preserve_original_image_bytes,'original storage policy');
 reset();for(const img of grid.querySelectorAll('img')){img.loading='eager';await img.decode();}
 report.width=innerWidth;report.documentWidth=document.documentElement.scrollWidth;ensure(report.documentWidth<=innerWidth,'desktop horizontal overflow');
 setContinent('unassigned');setClass('mage');
 return report;
}
function runCharacterBookmarkCheck(){
 if(state.origin!=='unassigned'||state.classId!=='mage'||records.length!==classCount('mage'))throw Error('Origin/class bookmark restore');
 return {hash:location.hash,origin:state.origin,classId:state.classId,restored:true};
}
async function runCharacterMobileChecks(){
 const ensure=(value,message)=>{if(!value)throw Error(message);};
 reset();await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
 ensure(getComputedStyle(byId('continent').parentElement).display!=='none','mobile continent picker');
 byId('continent').value='unassigned';byId('continent').dispatchEvent(new Event('change'));
 document.querySelector('[data-class="archer"]').click();ensure(state.origin==='unassigned'&&filtered.every(a=>a.class_id==='archer'),'mobile origin and class');
 document.querySelector('[data-global-class="mage"]').click();ensure(state.origin==='all'&&records.length===classCount('mage'),'mobile global class');
 byId('filter-panel').querySelector('summary').click();ensure(byId('filter-panel').open,'filter disclosure');byId('filter-panel').querySelector('summary').click();
 setCollection('staff8');openAsset(filtered[0],filtered);await byId('large').decode();
 const nativeWidth=byId('large').getBoundingClientRect().width;
 ensure(Math.abs(nativeWidth-filtered[0].width)<0.5,'mobile native image size');
 ensure(document.documentElement.scrollWidth<=innerWidth,'native viewer stays in viewport');
 byId('close').click();reset();
 const visibleButtons=[...document.querySelectorAll('button')].filter(n=>n.getClientRects().length);
 const report={width:innerWidth,documentWidth:document.documentElement.scrollWidth,minButtonHeight:Math.min(...visibleButtons.map(n=>n.getBoundingClientRect().height)),nativeWidth,originPicker:true,globalClass:true};
 ensure(report.documentWidth<=report.width,'mobile horizontal overflow');
 ensure(report.minButtonHeight>=44,'mobile touch controls '+JSON.stringify({...report,smallButtons:visibleButtons.filter(n=>n.getBoundingClientRect().height<44).map(n=>({id:n.id,text:n.textContent.trim().slice(0,30),height:n.getBoundingClientRect().height}))}));
 return report;
}

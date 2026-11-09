import { addMaterial, compositionDuration, creditsFor, emptyComposition, MATERIAL_STORAGE, parseComposition, sampleMaterial, type MaterialCatalog } from '../src/effect-workshop/materialModel';
import { drawComposition, loadMaterialImage, prepareComposition, touchesCanvasEdge } from '../src/effect-workshop/materialRender';
import { exportComposition, saveBlob } from '../src/effect-workshop/materialExport';

export async function checkEffectMaterials(){
  const passed:string[]=[],check=(value:boolean,name:string)=>{if(!value)throw Error(name);passed.push(name);};
  const catalog:MaterialCatalog=await(await fetch('/__materials/catalog.json')).json(),byId=new Map(catalog.materials.map(m=>[m.id,m]));
  const source=catalog.materials.find(m=>m.packId==='untied'&&m.primary)!,m={...source,frames:source.frames.slice(0,3).map((f,i)=>({...f,duration:[.1,.2,.3][i]}))},l=addMaterial(m);l.start=.5;l.hold=.2;
  check(sampleMaterial(l,m,.49)===null,'delayed layers remain absent until their start');
  check(sampleMaterial(l,m,.5)?.index===0&&sampleMaterial(l,m,.6)?.index===1&&sampleMaterial(l,m,.8)?.index===2,'authored variable frame durations and exact boundaries are preserved');
  check(sampleMaterial(l,m,1.2)?.index===2&&sampleMaterial(l,m,1.3)===null,'hold shows the final frame and terminates at the explicit end');
  l.reverse=true;check(sampleMaterial(l,m,.5)?.index===2&&sampleMaterial(l,m,.8)?.index===1&&sampleMaterial(l,m,1)?.index===0,'reverse playback uses each reversed frame duration');
  l.from=2;l.to=2;l.speed=2;l.reverse=false;l.fadeOut=.1;check(sampleMaterial(l,m,.55)?.index===1&&sampleMaterial(l,m,.79)!.alpha<.11,'trimmed single-frame segments honor speed, hold and fade');
  const c=emptyComposition();c.layers=[addMaterial(source)];const originalId=c.layers[0].id;
  check(parseComposition(c,byId).layers[0].id===originalId,'round trips preserve selected layer IDs');
  const unknown=structuredClone(c);unknown.layers[0].materialId='https://external.invalid/image.png';let rejected=false;try{parseComposition(unknown,byId);}catch{rejected=true;}check(rejected,'JSON cannot inject remote image paths or unknown material IDs');
  const tooLong=structuredClone(c);tooLong.layers[0].start=30;rejected=false;try{parseComposition(tooLong,byId);}catch{rejected=true;}check(rejected,'overlong animation is rejected rather than truncated');
  const duplicate=structuredClone(c);duplicate.layers.push({...duplicate.layers[0]});const fixed=parseComposition(duplicate,byId);check(fixed.layers[0].id!==fixed.layers[1].id,'duplicate imported layer IDs are made independent');
  check(creditsFor(c,catalog).includes('Super Pixel Effects Gigapack - Will Tice / unTied Games')&&!creditsFor(c,catalog).includes('CodeManu'),'export credits include precisely the used packs');
  check(compositionDuration(c,byId)>0&&new Set(catalog.materials.map(m=>m.id)).size===catalog.materials.length,'catalog and duration are usable');
  for(const author of ['untied','codemanu','craftpix-free-pixel-magic-sprite-effects-pack','oga-particle-pack-80-sprites','kenney-smoke']){
    const m=catalog.materials.find(m=>m.packId===author&&m.primary)!;const one=emptyComposition();one.layers=[addMaterial(m)];const t=m.frames[0].duration*2;
    await prepareComposition(one,byId,t,true);const canvas=document.createElement('canvas');canvas.width=canvas.height=256;drawComposition(canvas,one,byId,t,true);
    check(!touchesCanvasEdge(canvas),`${author}: padded material stays inside a centered composition`);
  }
  const retained=await prepareComposition(c,byId,.2,true),beforeCache=document.createElement('canvas');beforeCache.width=beforeCache.height=256;drawComposition(beforeCache,c,byId,.2,true,retained);const expected=beforeCache.toDataURL();
  for(const m of catalog.materials.filter(m=>m.packId==='codemanu'&&m.primary))await loadMaterialImage(m.sheets[0]);
  drawComposition(beforeCache,c,byId,.2,true,retained);check(expected===beforeCache.toDataURL(),'a prepared export frame retains every layer after atlas cache eviction');
  const before=localStorage.getItem('grid-defenders.effect-workshop.v1');
  const q=<T extends HTMLElement=HTMLElement>(s:string)=>document.querySelector<T>(s)!;
  const change=(s:string,value:string)=>{const el=q<HTMLInputElement>(s);el.value=value;el.dispatchEvent(new Event('change',{bubbles:true}));};
  const wait=(ms=100)=>new Promise(r=>setTimeout(r,ms));
  const stored=()=>JSON.parse(localStorage.getItem(MATERIAL_STORAGE)!);
  check(document.querySelectorAll('#m-grid .m-card').length===24,'gallery paginates the library into 24 animated tiles');
  const first=q<HTMLCanvasElement>('#m-grid canvas');first.scrollIntoView({block:'center'});await wait(200);const a=first.dataset.frame;const deadline=performance.now()+3000;while(first.dataset.frame===a&&performance.now()<deadline)await wait(50);check(a!==first.dataset.frame,'visible gallery animations advance without hover');
  q('#m-play').click();await wait();const held=first.dataset.frame;await wait(150);check(held===first.dataset.frame,'global pause holds a specific material frame');
  change('#m-pack','CraftPix.net');check([...document.querySelectorAll('#m-grid .m-card small')].every(el=>el.textContent!.includes('CraftPix.net')),'author filter shows actual CraftPix source materials');
  q('#m-grid [data-add]').click();check(stored().layers.length===1,'clicking a material adds it to the separate composition store');
  change('[data-field=from]','2');change('[data-field=to]','4');change('[data-field=start]','0.2');check(stored().layers[0].from===2&&stored().layers[0].to===4&&stored().layers[0].start===.2,'frame interval and timing edits reach the saved composition');
  q('[data-layer-action=duplicate]').click();check(stored().layers.length===2&&stored().layers[0].id!==stored().layers[1].id,'duplicate material can be edited independently');
  q('#m-undo').click();check(stored().layers.length===1,'undo restores the exact earlier layer stack');q('#m-redo').click();check(stored().layers.length===2,'redo restores the duplicated layer');
  q('#m-reset').click();check(stored().layers.length===0,'reset clears only the material composition');q('#m-undo').click();check(stored().layers.length===2,'reset is reversible');
  q('#m-grid [data-info]').click();check(q<HTMLDialogElement>('#m-source').open&&q<HTMLImageElement>('.m-contact').src.includes('/normalized/'),'all-frame bright contact sheet and provenance are reachable');q('[data-close=m-source]').click();
  q('[data-preset=slash]').click();check(stored().layers.length===3&&byId.get(stored().layers[0].materialId)!.packId.includes('slash'),'quick slash composition starts with an actual slash asset');
  check(localStorage.getItem('grid-defenders.effect-workshop.v1')===before,'procedural workshop library is never modified');
  for(const key of ['fire','slash','magic']){
    q(`[data-preset=${key}]`).click();const result=parseComposition(stored(),byId);const output=await exportComposition(result,catalog,()=>{});check(output.size>1000,`${key}: complete animation exports with all-frame edge validation`);if(key==='fire')saveBlob(output,'qa-material-export.zip');
  }
  return passed;
}

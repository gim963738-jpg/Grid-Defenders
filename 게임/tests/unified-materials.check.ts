import { createPreset, PRESET_INFO, STORAGE_KEY } from '../src/effect-workshop/model';
import { COMPONENT_STORAGE, recipeComponents } from '../src/effect-workshop/componentModel';
import { classifyMaterial, MATERIAL_CATEGORIES } from '../src/effect-workshop/materialClassification';
import { makeRecipeSource, parseRecipeSource, recipeMaterial } from '../src/effect-workshop/recipeMaterial';
import { unifiedMaterials, materialGroup } from '../src/effect-workshop/unifiedMaterials';
import { addMaterial, compositionDuration, compositionMaterials, creditsFor, emptyComposition, MATERIAL_STORAGE, parseComposition, type MaterialCatalog } from '../src/effect-workshop/materialModel';
import { drawComposition, materialFrameCanvas, prepareComposition, touchesCanvasEdge } from '../src/effect-workshop/materialRender';
import { renderPreviewCanvas } from '../src/effect-workshop/renderer';
import { exportComposition } from '../src/effect-workshop/materialExport';
import { createBattlePreview } from '../src/effect-workshop/battle';
import { createSkillFrame } from '../src/skillVisual';

export async function checkUnifiedMaterials() {
  const passed: string[] = [], check = (ok: unknown, name: string) => { if (!ok) throw Error(name); passed.push(name); };
  const free: MaterialCatalog = await (await fetch('/__materials/catalog.json')).json();
  const blank = {getItem: (_: string) => null}, {catalog, warnings} = unifiedMaterials(free, blank);
  check(!warnings.length, 'blank storage initializes without warnings');
  check(catalog.materials.filter(m => m.origin === 'free').length === free.materials.length, 'every collected material and variant appears in unified library');
  check(catalog.materials.every(m => MATERIAL_CATEGORIES.includes(m.category)), 'all entries have a supported effect classification');
  check(catalog.materials.filter(m => m.origin === 'preset').length === PRESET_INFO.length, 'every workshop preset is included as a complete effect');
  check(catalog.materials.some(m => materialGroup(m) === 'part' && m.name.includes('문양')), 'pattern components can be found separately');
  check(catalog.materials.filter(m => m.packId === 'oga-lasers-and-beams' && materialGroup(m) !== 'reference').length === 47, '47 individual beam and projectile shapes are usable');
  check(catalog.materials.filter(m => materialGroup(m) === 'reference').length === 3, 'terrain and whole beam layout are labeled as reference sources');
  check(new Set(catalog.materials.map(m => m.id)).size === catalog.materials.length, 'all unified material IDs are unique');
  check(classifyMaterial('Fantasy Spells/spell attack up 001/small','untied') === '회복·강화', 'spaced buff names are classified');
  check(classifyMaterial('Explosion03.png','smoke-pack') === '폭발·충격파', 'individual asset meaning precedes collection title');
  check(classifyMaterial('Symbols/symbol attack up','untied') === '문양·기호', 'symbol collections remain reusable symbols');
  const meta = {name: '시험', origin: 'preset' as const, group: 'effect' as const, parent: '공방 예제'};
  for (const preset of PRESET_INFO) {
    const a = makeRecipeSource(createPreset(preset.id), meta), b = makeRecipeSource(createPreset(preset.id), meta);
    check(a.id === b.id, `${preset.id}: generated UUIDs do not change material identity`);
    check(parseRecipeSource(a).id === a.id, `${preset.id}: source snapshot round trips`);
  }
  const partsA = recipeComponents(createPreset('summon-fire'), 'a'), partsB = recipeComponents(createPreset('summon-fire'), 'b');
  check(partsA.every((p,i) => makeRecipeSource(p.recipe,meta).id === makeRecipeSource(partsB[i].recipe,meta).id), 'extracted part identities survive fresh node creation');
  const customClass=makeRecipeSource(createPreset('heal'),{...meta,name:'회복하는 빛',category:'소환·특수'});
  check(parseRecipeSource(customClass).category==='소환·특수','saved classifications remain stable when names match another classification rule');
  const pivotRecipe=createPreset('heal');pivotRecipe.placement.pivotX=.3;pivotRecipe.placement.pivotY=.7;
  const pivotLayer=addMaterial(recipeMaterial(makeRecipeSource(pivotRecipe,meta)));
  check(pivotLayer.pivotX===.3&&pivotLayer.pivotY===.7,'recipe pivot is carried into material placement');
  const work = createPreset('summon-fire'); work.name = '테스트 내 작품';
  const library = JSON.stringify({version:1,activeId:'work-1',entries:[{id:'work-1',updatedAt:'2026-11-07',recipe:work}]});
  const saved = {getItem:(k:string)=>k===STORAGE_KEY?library:null};
  const savedCatalog = unifiedMaterials(free,saved).catalog;
  check(savedCatalog.materials.some(m => m.origin === 'work' && m.name === work.name), 'saved works join the same material catalog');
  check(savedCatalog.materials.filter(m => m.origin === 'part' && m.recipeSource?.parent === work.name).length === 4, 'a saved work exposes its four source components');
  const damaged = unifiedMaterials(free,{getItem:(k:string)=>k===STORAGE_KEY||k===COMPONENT_STORAGE?'bad-json':null});
  check(damaged.warnings.length === 2 && damaged.catalog.materials.length === catalog.materials.length, 'corrupt work and part storage do not hide free materials or presets');
  const own = catalog.materials.find(m => m.origin === 'preset' && m.name === '마법진 화염 분출')!, png = free.materials.find(m => m.packId === 'untied' && m.primary)!;
  const base = new Map(catalog.materials.map(m=>[m.id,m])), composition = emptyComposition();
  composition.layers = [addMaterial(own),addMaterial(png)];
  const parsed = parseComposition(composition,base);
  check(parsed.sources?.length === 1 && parsed.sources[0].id === own.id, 'adding a procedural source embeds its recipe exactly once');
  const withoutWorks = new Map(free.materials.map(m=>[m.id,m]));
  const restored = parseComposition(JSON.parse(JSON.stringify(parsed)),withoutWorks), byId = compositionMaterials(restored,withoutWorks);
  check(byId.has(own.id) && restored.layers.length === 2, 'mixed composition restores after original work is unavailable');
  const duplicate = structuredClone(parsed); duplicate.layers.push({...duplicate.layers[0]});
  check(parseComposition(duplicate,base).sources?.length === 1, 'duplicated layers share one immutable source snapshot');
  const removed = structuredClone(parsed); removed.layers = removed.layers.filter(l=>l.materialId!==own.id);
  check(parseComposition(removed,base).sources?.length === 0, 'unused snapshots are removed from saved composition');
  let rejected=false; const invalid=structuredClone(parsed); invalid.sources![0].recipe.palette[0]='#000000';
  try{parseComposition(invalid,base);}catch{rejected=true;}check(rejected,'a source cannot claim an ID belonging to different recipe data');
  const recipeCanvas=await materialFrameCanvas(own,25),direct=renderPreviewCanvas(own.recipeSource!.recipe,25);
  check(recipeCanvas.toDataURL()===direct.toDataURL(),'material frame preserves the full padded procedural output');
  const contact=document.createElement('canvas');contact.width=960;contact.height=960;const ctx=contact.getContext('2d')!;
  const core=document.createElement('canvas');core.width=core.height=256;
  const steps=Math.ceil(compositionDuration(restored,byId)*restored.fps-1e-8);let touched=false,visible=0;
  for(let i=0;i<steps;i++){
    const time=i/restored.fps,images=await prepareComposition(restored,byId,time,true);drawComposition(core,restored,byId,time,true,images);
    touched ||= touchesCanvasEdge(core);if(core.getContext('2d')!.getImageData(0,0,256,256).data.some((n,j)=>j%4===3&&n>0))visible++;
    if(i<64){const x=i%8*120,y=Math.floor(i/8)*120;ctx.fillStyle=i%2?'#b5d2bc':'#d5d8dc';ctx.fillRect(x,y,120,120);ctx.drawImage(core,x,y,120,120);}
  }
  check(!touched&&visible>steps/2,'all mixed animation frames are visible and remain clear of image boundaries');
  const beforeCredits=creditsFor(restored,{...free,materials:free.materials});
  check(beforeCredits.includes('unTied') && beforeCredits.includes('Local recipe:') && !beforeCredits.includes('CodeManu'),'mixed export preserves precisely its used external credits and local recipe provenance');
  const zip=await exportComposition(restored,free,()=>{}),zipText=new TextDecoder().decode(await zip.arrayBuffer());
  check(zipText.includes('CREDITS.txt')&&zipText.includes('animation.json')&&zipText.includes('composition.json')&&zipText.includes(own.id),'export ZIP contains PNG metadata, source credits and independent recipe snapshot');
  (window as any).__unifiedContact=contact.toDataURL();
  return {passed,count:passed.length,materials:catalog.materials.length,parts:catalog.stats.parts,framesChecked:steps,zipBytes:zip.size};
}

/** Only run on the isolated QA port. Restore every storage value afterward. */
export async function checkUnifiedMaterialsUI() {
  if(location.port!=='5191')throw Error('UI QA requires isolated port 5191');
  const passed:string[]=[],check=(ok:unknown,name:string)=>{if(!ok)throw Error(name);passed.push(name);};
  const q=<T extends HTMLElement=HTMLElement>(s:string)=>document.querySelector<T>(s)!;
  const pause=(ms=120)=>new Promise(r=>setTimeout(r,ms));
  const baseline=new Map([STORAGE_KEY,COMPONENT_STORAGE,MATERIAL_STORAGE].map(k=>[k,localStorage.getItem(k)]));
  try{
    q('#m-clear-filters').click();check(q<HTMLInputElement>('#m-variants').checked,'all variants are visible by default');
    check(document.querySelectorAll('.m-card').length===24,'unified grid paginates at 24 cards');
    q<HTMLButtonElement>('[data-origin=part]').click();
    check([...document.querySelectorAll('.m-group-tag')].every(e=>e.textContent==='구성 부품'),'part source filter shows reusable components only');
    const search=q<HTMLInputElement>('#m-search');search.value='솟구치는 불꽃';search.dispatchEvent(new Event('input',{bubbles:true}));
    check(document.querySelectorAll('.m-card').length>0,'component names are searchable');
    q('#m-reset').click();q<HTMLButtonElement>('[data-add]').click();await pause();
    const stored=()=>JSON.parse(localStorage.getItem(MATERIAL_STORAGE)!);
    check(stored().sources?.length===1&&stored().layers.length===1,'component card is inserted and saved with its source');
    q('#m-clear-filters').click();q<HTMLButtonElement>('[data-origin=free]').click();q<HTMLButtonElement>('[data-add]').click();await pause();
    check(stored().layers.length===2&&stored().sources.length===1,'PNG and node component coexist in one saved composition');
    q('#m-undo').click();check(stored().layers.length===1,'mixed insert can be undone');q('#m-redo').click();check(stored().layers.length===2,'mixed insert can be redone');
    q('#m-clear-filters').click();q<HTMLButtonElement>('[data-origin=preset]').click();
    check(document.querySelectorAll('.m-card').length===PRESET_INFO.length,'preset source includes all full effects');
    q<HTMLButtonElement>('[data-info]').click();await pause(400);
    check(!!q('#m-recipe-contact')&&!!q('[data-component]'),'recipe details expose all frames and node-part storage');
    const selectedSource=q<HTMLButtonElement>('[data-component]').dataset.component;
    q<HTMLButtonElement>('[data-component]').click();
    check(JSON.parse(localStorage.getItem(COMPONENT_STORAGE)!).items.some((p:any)=>p.id===selectedSource),'a library recipe can be saved into the workshop node component library');
    q<HTMLButtonElement>('[data-close=m-source]').click();
    check(localStorage.getItem(STORAGE_KEY)===baseline.get(STORAGE_KEY),'browsing, composition and explicit component save never mutate workshop works');
    return {passed,count:passed.length};
  }finally{
    for(const key of [COMPONENT_STORAGE,MATERIAL_STORAGE]){const saved=baseline.get(key);if(saved===null||saved===undefined)localStorage.removeItem(key);else localStorage.setItem(key,saved);}
    window.dispatchEvent(new StorageEvent('storage',{key:COMPONENT_STORAGE}));
  }
}

export async function captureUnifiedBattle() {
  const free:MaterialCatalog=await(await fetch('/__materials/catalog.json')).json();
  const {catalog}=unifiedMaterials(free,{getItem:()=>null}),base=new Map(catalog.materials.map(m=>[m.id,m]));
  let composition=emptyComposition();composition.layers=[addMaterial(catalog.materials.find(m=>m.origin==='preset'&&m.name==='마법진 화염 분출')!),addMaterial(free.materials.find(m=>m.packId==='untied'&&m.primary)!)];composition=parseComposition(composition,base);
  const core=document.createElement('canvas');core.width=core.height=256;
  const maps=compositionMaterials(composition,base),images=await prepareComposition(composition,maps,.65,true);drawComposition(core,composition,maps,.65,true,images);
  const host=document.createElement('div');document.body.append(host);
  const battle=await createBattlePreview(host),art=createSkillFrame(core,{x:0,y:0,width:256,height:256,pivot:{x:128,y:128},background:'transparent'}),r=createPreset('slash');r.placement.displaySize=150;
  const frame={canvas:core,art,touchesEdge:false,visible:true,index:0},canvas=host.querySelector('canvas')!;
  try {
    battle.setPosition(170,128);battle.draw(frame,r);(window as any).__unifiedBattleTop=canvas.toDataURL();
    battle.setPosition(170,255);battle.draw(frame,r);(window as any).__unifiedBattleCenter=canvas.toDataURL();
    return {width:canvas.width,height:canvas.height,dpr:devicePixelRatio,positions:['top','center'],time:.65};
  } finally {battle.destroy();art.texture.destroy(true);host.remove();}
}

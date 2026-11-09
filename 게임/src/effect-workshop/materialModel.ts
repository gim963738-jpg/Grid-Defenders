import { parseRecipeSource, recipeMaterial, LOCAL_MATERIAL_PACK, type MaterialOrigin, type RecipeMaterialSource } from './recipeMaterial';
export interface MaterialFrame { sheet:number; x:number; y:number; width:number; height:number; duration:number; source:string; sourceRect:number[] }
export interface Material { id:string; packId:string; name:string; category:string; variant:string; primary:boolean; kind:'animation'|'texture'; width:number; height:number; padding:number; fps:number; timing:string; duration:number; sheets:string[]; frames:MaterialFrame[]; contact:string; preview:string; edgeFrames:number[]; opaqueFrames:number[]; changes:string; firstVisible:number; origin?:MaterialOrigin; group?:'effect'|'part'|'texture'|'reference'; recipeSource?:RecipeMaterialSource }
export interface MaterialPack { id:string; name:string; author:string; url:string; license:string; licenseUrl:string; creditRequired:boolean; credit:string; archives:string[] }
export interface MaterialCatalog { format:'gd.material-catalog@1'; date:string; packs:MaterialPack[]; materials:Material[]; pending:{packId:string;source:string;name:string;reason:string}[]; stats:Record<string,number> }
export interface MaterialLayer { id:string; materialId:string; enabled:boolean; from:number; to:number; start:number; speed:number; hold:number; x:number; y:number; scale:number; rotation:number; spin:number; endScale:number; hue:number; opacity:number; fadeIn:number; fadeOut:number; blend:'normal'|'add'|'screen'; reverse:boolean; flipX:boolean; pivotX:number; pivotY:number }
export interface MaterialComposition { format:'gd.material-composition@1'; name:string; size:number; fps:number; displaySize:number; layers:MaterialLayer[]; sources?:RecipeMaterialSource[] }
export const MATERIAL_STORAGE='grid-defenders.material-composition.v1';
export const MAX_COMPOSITION_BYTES=2*1024*1024;
export function compositionMaterials(c:MaterialComposition, base:ReadonlyMap<string,Material>):Map<string,Material> {
  const map=new Map(base);for(const source of c.sources??[])map.set(source.id,recipeMaterial(source));return map;
}
export function keepMaterialSource(c:MaterialComposition,m:Material):void {
  if(m.recipeSource && !c.sources?.some(s=>s.id===m.id))(c.sources??=[]).push(structuredClone(m.recipeSource));
}
export const materialUrl=(path:string)=>'/__materials/'+path.split('/').map(encodeURIComponent).join('/');
export const materialName=(m:Material)=>{
  const parts=m.name.split('/').filter(x=>!['PNG','Png','png','Frames'].includes(x));
  const last=parts.at(-1)!.replace(/\.png$/i,'');
  if(m.packId==='untied')return last.replace(/ (large|small) /,' · ');
  if(m.packId.includes('pixel-magic'))return '픽셀 마법 '+last;
  if(m.packId.includes('slash-sprite'))return '카툰 참격 '+last;
  return parts.slice(-2).join(' / ').replace(/\.png$/i,'');
};
export const emptyComposition=():MaterialComposition=>({format:'gd.material-composition@1',name:'새 재료 조합',size:256,fps:30,displaySize:150,layers:[]});
export function addMaterial(m:Material):MaterialLayer { return {id:crypto.randomUUID(),materialId:m.id,enabled:true,from:1,to:m.frames.length,start:0,speed:1,hold:m.kind==='texture'?.5:0,x:.5,y:.5,scale:.65,rotation:0,spin:0,endScale:1,hue:0,opacity:1,fadeIn:0,fadeOut:m.kind==='texture'?.3:0,blend:'normal',reverse:false,flipX:false,pivotX:m.recipeSource?.recipe.placement.pivotX??.5,pivotY:m.recipeSource?.recipe.placement.pivotY??.5}; }
export const sourceDuration=(l:MaterialLayer,m:Material)=>m.frames.slice(l.from-1,l.to).reduce((s,f)=>s+f.duration,0)/l.speed;
export const layerDuration=(l:MaterialLayer,m:Material)=>sourceDuration(l,m)+l.hold;
export function compositionDuration(c:MaterialComposition,byId:Map<string,Material>):number { return Math.max(.1,...c.layers.filter(l=>l.enabled).map(l=>l.start+layerDuration(l,byId.get(l.materialId)!))); }
export function sampleMaterial(l:MaterialLayer,m:Material,time:number):{index:number;alpha:number;progress:number}|null {
  const age=time-l.start,duration=layerDuration(l,m); if(age<0 || age>=duration || !l.enabled)return null;
  let cursor=Math.min(age,sourceDuration(l,m)-1e-8)*l.speed,index=l.reverse?l.to-1:l.from-1;
  const end=l.reverse?l.from-1:l.to-1,step=l.reverse?-1:1;
  while(index!==end && cursor>=m.frames[index].duration-1e-10){cursor-=m.frames[index].duration;index+=step;}
  const alpha=l.opacity*Math.min(1,l.fadeIn>0?age/l.fadeIn:1,l.fadeOut>0?(duration-age)/l.fadeOut:1);
  return {index,alpha:Math.max(0,alpha),progress:age/duration};
}
const n=(v:unknown,min:number,max:number,fallback:number,integer=false)=>{const x=typeof v==='number'&&Number.isFinite(v)?v:fallback;return Math.max(min,Math.min(max,integer?Math.round(x):x));};
/** Explicit material IDs only: imported JSON cannot supply paths, code, URLs or shader programs. */
export function parseComposition(input:unknown,byId:Map<string,Material>):MaterialComposition {
  if(!input || typeof input!=='object')throw Error('조합 JSON을 확인하세요.');
  const o=input as Record<string,unknown>;
  if(o.format!=='gd.material-composition@1' || !Array.isArray(o.layers))throw Error('이 파일은 재료 조합 JSON이 아닙니다.');
  if(o.layers.length>12)throw Error('조합은 최대 12개 레이어입니다.');
  if(new Blob([JSON.stringify(input)]).size>MAX_COMPOSITION_BYTES)throw Error('조합 JSON은 2MB 이하만 읽습니다.');
  const c=emptyComposition();c.name=typeof o.name==='string'?o.name.slice(0,100):c.name;
  c.size=n(o.size,64,512,256,true);c.fps=n(o.fps,1,60,30,true);c.displaySize=n(o.displaySize,24,240,150);
  if(o.sources!==undefined){
    if(!Array.isArray(o.sources)||o.sources.length>12)throw Error('공방 재료 원본은 최대 12개입니다.');
    c.sources=o.sources.map(parseRecipeSource);
    if(new Set(c.sources.map(s=>s.id)).size!==c.sources.length)throw Error('중복된 공방 재료 원본입니다.');
  }
  byId=compositionMaterials(c,byId);
  const usedIds=new Set<string>();
  c.layers=o.layers.map(raw=>{
    if(!raw || typeof raw!=='object')throw Error('레이어 형식이 잘못되었습니다.');
    const v=raw as Record<string,unknown>,m=byId.get(String(v.materialId));if(!m)throw Error('현재 재료함에 없는 소재가 포함되어 있습니다. 원본 팩을 확인하세요.');
    const l=addMaterial(m);if(typeof v.id==='string' && /^[a-zA-Z0-9_-]{1,80}$/.test(v.id) && !usedIds.has(v.id))l.id=v.id;usedIds.add(l.id);
    l.from=n(v.from,1,m.frames.length,1,true);l.to=n(v.to,l.from,m.frames.length,m.frames.length,true);
    for(const [key,min,max,def] of [ ['start',0,30,0],['speed',.1,4,1],['hold',0,10,0],['x',0,1,.5],['y',0,1,.5],['scale',.05,1.5,.65],['rotation',-180,180,0],['spin',-1080,1080,0],['endScale',.05,3,1],['hue',-180,180,0],['opacity',0,1,1],['fadeIn',0,5,0],['fadeOut',0,5,0],['pivotX',0,1,.5],['pivotY',0,1,.5] ] as const)l[key]=n(v[key],min,max,def);
    l.enabled=v.enabled!==false;l.reverse=v.reverse===true;l.flipX=v.flipX===true;l.blend=v.blend==='add'||v.blend==='screen'?v.blend:'normal';return l;
  });
  for(const layer of c.layers)keepMaterialSource(c,byId.get(layer.materialId)!);
  if(c.sources)c.sources=c.sources.filter(s=>c.layers.some(l=>l.materialId===s.id));
  if(compositionDuration(c,byId)>30 || Math.ceil(compositionDuration(c,byId)*c.fps)>900)throw Error('조합은 30초·900프레임 이하로 맞춰 주세요.');
  if(new Blob([JSON.stringify(c)]).size>MAX_COMPOSITION_BYTES)throw Error('공방 레시피를 포함한 조합이 2MB를 넘습니다.');
  return c;
}
export function creditsFor(c:MaterialComposition,catalog:MaterialCatalog):string {
  const byId=compositionMaterials(c,new Map(catalog.materials.map(m=>[m.id,m])));
  const used=c.layers.filter(l=>l.enabled).map(l=>byId.get(l.materialId)!);
  const ids=new Set(used.map(m=>m.packId)),packs=new Map(catalog.packs.map(p=>[p.id,p]));packs.set(LOCAL_MATERIAL_PACK.id,LOCAL_MATERIAL_PACK);
  return ['Grid Defenders — '+c.name,'Changes: frame selection, transparent padding, timing, transforms, color adjustments and compositing.',''].concat([...packs.values()].filter(p=>ids.has(p.id)).flatMap(p=>[p.credit,p.url,'License: '+p.license,p.licenseUrl,'']),used.filter(m=>m.recipeSource).map(m=>`Local recipe: ${m.name} / ${m.recipeSource!.parent}`)).join('\n');
}

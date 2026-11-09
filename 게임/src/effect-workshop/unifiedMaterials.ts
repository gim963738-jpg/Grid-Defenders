import { createPreset, PRESET_INFO, readLibrary } from './model';
import { readComponents, recipeComponents, type EffectComponent } from './componentModel';
import { classify } from './materialClassification';
import { LOCAL_MATERIAL_PACK, makeRecipeSource, recipeMaterial, type MaterialOrigin } from './recipeMaterial';
import type { Material, MaterialCatalog } from './materialModel';

export const ORIGIN_LABELS: Record<MaterialOrigin, string> = { free: '무료 팩', preset: '공방 예제', work: '내 작품', part: '구성 부품' };
export const materialGroup = (m: Material) => m.group ?? (m.kind === 'texture' ? 'texture' : 'effect');
export const GROUP_LABELS = { effect: '완성 효과', part: '구성 부품', texture: '낱개 이미지', reference: '참고 소재' };
let presets: Material[] | undefined;
function partMaterial(part: EffectComponent): Material {
  return recipeMaterial(makeRecipeSource(part.recipe, {name: part.name, category: part.category, origin: 'part', group: 'part', parent: part.origin}));
}
export function unifiedMaterials(free: MaterialCatalog | undefined, storage: Pick<Storage, 'getItem'>): {catalog: MaterialCatalog; warnings: string[]} {
  presets ??= PRESET_INFO.flatMap(p => {
    const r = createPreset(p.id);
    return [recipeMaterial(makeRecipeSource(r, {name: p.name, origin: 'preset', group: 'effect', parent: '공방 예제', category: p.id.startsWith('run-') ? '이동·잔상' : undefined})), ...recipeComponents(r, `preset-${p.id}`).map(partMaterial)];
  });
  const warnings: string[] = [], materials: Material[] = (free?.materials ?? []).map(m => ({...classify(m), origin: 'free', group: m.category === '배경·참고' ? 'reference' : m.kind === 'texture' ? 'texture' : 'effect'}));
  materials.push(...presets);
  try {
    for (const work of readLibrary(storage).entries) {
      materials.push(recipeMaterial(makeRecipeSource(work.recipe, {name: work.recipe.name, origin: 'work', group: 'effect', parent: '내 저장 작품'})));
      try { materials.push(...recipeComponents(work.recipe, work.id).map(partMaterial)); }
      catch (e) { warnings.push(`${work.recipe.name}의 부품 분리: ${(e as Error).message}`); }
    }
  } catch (e) { warnings.push('저장 작품 원본을 보존했습니다. ' + (e as Error).message); }
  try { materials.push(...readComponents(storage).map(partMaterial)); }
  catch (e) { warnings.push('저장 부품 원본을 보존했습니다. ' + (e as Error).message); }
  // The same component may be both derived from a work and explicitly saved.
  const unique = [...new Map(materials.map(m => [m.id, m])).values()];
  return {catalog: {format: 'gd.material-catalog@1', date: free?.date ?? '', packs: [...(free?.packs ?? []), LOCAL_MATERIAL_PACK], materials: unique, pending: free?.pending ?? [], stats: {...free?.stats, total: unique.length, parts: unique.filter(m => materialGroup(m) === 'part').length, works: unique.filter(m => m.origin === 'work').length, presets: PRESET_INFO.length}}, warnings};
}

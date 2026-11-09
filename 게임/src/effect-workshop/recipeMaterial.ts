import { SKILL_FRAME_PADDING } from '../skillVisual';
import { validateRecipe, type EffectRecipe } from './model';
import { classifyMaterial, MATERIAL_CATEGORIES } from './materialClassification';
import type { Material, MaterialPack } from './materialModel';

export type MaterialOrigin = 'free' | 'preset' | 'work' | 'part';
export interface RecipeMaterialSource {
  id: string; name: string; category: string; origin: Exclude<MaterialOrigin, 'free'>;
  group: 'effect' | 'part'; parent: string; recipe: EffectRecipe;
}
export const LOCAL_MATERIAL_PACK: MaterialPack = { id: 'workshop-local', name: '개인 공방', author: '개인 공방', url: './effect-workshop.html', license: '공방 레시피', licenseUrl: './effect-workshop.html', creditRequired: false, credit: 'Grid Defenders 개인 공방 — 절차적 효과 / 저장 작품', archives: [] };

/** Normalize generated IDs and object key order, retaining every link and source reference. */
export function recipeContentKey(recipe: EffectRecipe): string {
  const ids = new Map<string, string>();
  const collect = (v: unknown): void => {
    if (!v || typeof v !== 'object') return;
    if (Array.isArray(v)) { v.forEach(collect); return; }
    const o = v as Record<string, unknown>;
    if (typeof o.id === 'string' && !ids.has(o.id)) ids.set(o.id, `@${ids.size}`);
    Object.keys(o).sort().forEach(k => collect(o[k]));
  };
  collect(recipe);
  const canonical = (v: unknown): unknown => {
    if (typeof v === 'string') return ids.get(v) ?? v;
    if (!v || typeof v !== 'object') return v;
    if (Array.isArray(v)) return v.map(canonical);
    return Object.fromEntries(Object.entries(v).sort(([a], [b]) => a.localeCompare(b)).map(([k, x]) => [k, canonical(x)]));
  };
  return JSON.stringify(canonical(recipe));
}
function fingerprint(value: string): string {
  let a = 0x811c9dc5, b = 0x9e3779b9;
  for (let i = 0; i < value.length; i++) { a = Math.imul(a ^ value.charCodeAt(i), 0x01000193); b = Math.imul(b ^ value.charCodeAt(i), 0x85ebca6b); }
  return (a >>> 0).toString(16).padStart(8, '0') + (b >>> 0).toString(16).padStart(8, '0');
}
export function makeRecipeSource(recipe: EffectRecipe, meta: Omit<RecipeMaterialSource, 'id' | 'recipe' | 'category'> & {category?: string}): RecipeMaterialSource {
  // A saved category is part of the snapshot, independent of future classification rules.
  const r = validateRecipe(recipe), category = meta.category && MATERIAL_CATEGORIES.includes(meta.category) ? meta.category : classifyMaterial(meta.name, '', meta.category);
  const source = { ...meta, category, recipe: r };
  return { ...source, id: 'recipe-' + fingerprint(JSON.stringify([meta.name, meta.origin, meta.group, meta.parent, category, recipeContentKey(r)])) };
}
export function parseRecipeSource(raw: unknown): RecipeMaterialSource {
  if (!raw || typeof raw !== 'object') throw Error('공방 재료 레시피를 확인하세요.');
  const s = raw as RecipeMaterialSource;
  if (typeof s.name !== 'string' || !s.name.trim() || s.name.length > 100 || typeof s.parent !== 'string' || s.parent.length > 100 || typeof s.category !== 'string' || s.category.length > 40 || !['preset', 'work', 'part'].includes(s.origin) || !['effect', 'part'].includes(s.group)) throw Error('공방 재료의 이름·분류가 잘못되었습니다.');
  const result = makeRecipeSource(s.recipe, s);
  if (s.id !== result.id) throw Error('공방 재료 ID와 보관된 레시피가 일치하지 않습니다.');
  return result;
}
export function recipeMaterial(source: RecipeMaterialSource): Material {
  const {size, frames, fps} = source.recipe.settings, padding = SKILL_FRAME_PADDING, side = size + 2 * padding;
  return { id: source.id, packId: LOCAL_MATERIAL_PACK.id, name: source.name, category: source.category, primary: true, variant: '', kind: 'animation', origin: source.origin, group: source.group, recipeSource: source, width: size, height: size, padding, fps, timing: `공방 설정 · ${Number(fps.toFixed(2))} FPS`, duration: frames / fps,
    sheets: [], frames: Array.from({length: frames}, () => ({sheet: 0, x: 0, y: 0, width: side, height: side, duration: 1 / fps, source: '', sourceRect: [0, 0, size, size]})), contact: '', preview: '', edgeFrames: [], opaqueFrames: [], firstVisible: Math.min(frames - 1, Math.floor(frames / 3)), changes: '공방 레시피와 연결된 구성 요소 보존, 투명 여백 추가' };
}

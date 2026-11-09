import definitions from './materialCategories.json';
import type { Material } from './materialModel';

export const MATERIAL_CATEGORIES: readonly string[] = definitions.categories;
const rules = definitions.rules.map(([pattern, category]) => [new RegExp(pattern, 'i'), category] as const);
const packs = definitions.packRules.map(([pattern, category]) => [new RegExp(pattern, 'i'), category] as const);
export function classifyMaterial(name: string, packId = '', hint = ''): string {
  // The individual asset takes precedence over a collection's marketing title.
  return definitions.overrides.find(([pack,pattern])=>pack===packId&&new RegExp(pattern,'i').test(name))?.[2]
    ?? rules.find(([pattern]) => pattern.test(name))?.[1]
    ?? packs.find(([pattern]) => pattern.test(packId))?.[1]
    ?? (MATERIAL_CATEGORIES.includes(hint) ? hint : '소환·특수');
}
export const categoryKeywords = (category: string): string => (definitions.aliases as Record<string, string>)[category] ?? category;
export const classify = (m: Material): Material => ({ ...m, category: MATERIAL_CATEGORIES.includes(m.category) ? m.category : classifyMaterial(m.name, m.packId, m.category) });

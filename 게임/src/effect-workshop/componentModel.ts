import { cloneRecipe, createPreset, PRESET_INFO, validateRecipe, type EffectRecipe, type EffectLayer } from './model';
import { createGraph, newNode, nodeOutput, nodeTitle, type EffectNode } from './graphModel';
import { strokeBehavior } from './drawingModel';

export const COMPONENT_STORAGE = 'grid-defenders.effect-components.v1';
export const COMPONENT_CATEGORIES = ['불꽃', '마법진', '문양', '참격', '입자', '폭발', '이동', '빛·레이저', '복합', '기타'] as const;
export interface EffectComponent { id: string; name: string; category: string; recipe: EffectRecipe; origin: string }
export function componentCategory(layer?: EffectLayer): string {
  if (!layer) return '복합';
  return ({ flame: '불꽃', jet: '불꽃', ring: '마법진', rune: '문양', slash: '참격', particles: '입자', burst: '폭발', dust: '이동', wind: '이동', splash: '이동' })[layer.type];
}
/** Copy the selected result and its entire upstream chain, retaining drawing timing dependencies. */
export function extractComponent(source: EffectRecipe, nodeId: string, name?: string, category?: string): EffectComponent {
  const r = cloneRecipe(source), g = r.graph ?? createGraph(r), node = g.nodes.find(n => n.id === nodeId);
  if (!node || (node.type !== 'output' && nodeOutput(node, r) !== 'image')) throw Error('이미지를 만드는 노드를 선택해 주세요. 방향선은 연결된 모양과 함께 보관할 수 있습니다.');
  const resultName = (name ?? nodeTitle(node, r)).trim().slice(0, 80);
  if (!resultName) throw Error('부품 이름을 입력해 주세요.');
  if (node.type === 'component' && node.component) return { id: crypto.randomUUID(), name: resultName, category: category ?? node.component.category, recipe: cloneRecipe(node.component.recipe), origin: source.name };
  const keep = new Set<string>();
  const visit = (id: string) => { if (keep.has(id)) return; keep.add(id); g.links.filter(e => e.to === id).forEach(e => visit(e.from)); };
  visit(nodeId);
  g.nodes = g.nodes.filter(n => keep.has(n.id)); g.links = g.links.filter(e => keep.has(e.from) && keep.has(e.to));
  if (node.type !== 'output') { const out = newNode('output', node.x + 300, node.y); g.nodes.push(out); g.links.push({ from: node.id, to: out.id, port: 'image' }); }
  g.enabled = true; g.view = { x: 32, y: 32, zoom: .7 }; r.graph = g; r.name = resultName;
  return { id: crypto.randomUUID(), name: resultName, category: category ?? (node.type === 'sequence' ? '빛·레이저' : componentCategory(r.layers.find(l => l.id === node.sourceId))), recipe: validateRecipe(r), origin: source.name };
}
export function recipeComponents(source: EffectRecipe, prefix: string): EffectComponent[] {
  const r = cloneRecipe(source); r.graph ??= createGraph(r);
  const parts = r.graph.nodes.filter(n => ['layer', 'drawing', 'sequence', 'component'].includes(n.type) && nodeOutput(n, r) === 'image' && (n.type !== 'drawing' || ['appearance', 'path'].includes(strokeBehavior(r.drawing!.strokes.find(s => s.id === n.sourceId)!)))).map(n => ({ ...extractComponent(r, n.id), id: `${prefix}:${n.id}` }));
  const sequenceNode = r.graph.nodes.find(n => n.type === 'sequence');
  if (r.sequence && sequenceNode) for (const kind of ['lights', 'beams', 'bursts'] as const) {
    if (!r.sequence[kind].length) continue;
    const part = extractComponent(r, sequenceNode.id, `${source.name} · ${kind === 'lights' ? '빛의 움직임' : kind === 'beams' ? '연결 레이저' : '폭발'}`.slice(0, 80), kind === 'bursts' ? '폭발' : '빛·레이저');
    const s = part.recipe.sequence!;
    if (kind !== 'lights') s.lights.forEach(l => { l.opacity = 0; });
    if (kind !== 'beams') s.beams = [];
    if (kind !== 'bursts') s.bursts = [];
    part.id = `${prefix}:sequence-${kind}`; parts.push(part);
  }
  return parts;
}
/** Insert above the current output; leave every existing node and source untouched. */
export function insertComponent(recipe: EffectRecipe, part: EffectComponent): string {
  recipe.graph ??= createGraph(recipe); const g = recipe.graph;
  if (g.nodes.length > 94 || g.links.length > 157) throw Error('부품을 넣을 노드 공간이 부족합니다. 사용하지 않는 노드를 정리해 주세요.');
  const out = g.nodes.find(n => n.type === 'output')!, edge = g.links.find(e => e.to === out.id && e.port === 'image');
  const node = newNode('component', out.x - 320, out.y + 260);
  node.component = { name: part.name, category: part.category, recipe: validateRecipe(part.recipe) }; g.nodes.push(node);
  if (edge) {
    const blend = newNode('blend', out.x, Math.min(12000, out.y + 130)); g.nodes.push(blend);
    g.links = g.links.filter(e => e !== edge);
    g.links.push({ from: edge.from, to: blend.id, port: 'a' }, { from: node.id, to: blend.id, port: 'b' }, { from: blend.id, to: out.id, port: 'image' });
    out.x = Math.min(12000, out.x + 320);
  } else g.links.push({ from: node.id, to: out.id, port: 'image' });
  node.x = Math.max(-12000, node.x); node.y = Math.min(12000, node.y); g.enabled = true;
  validateRecipe(recipe); return node.id;
}
export function parseComponent(raw: unknown): EffectComponent {
  if (!raw || typeof raw !== 'object') throw Error('부품 데이터를 확인해 주세요.');
  const p = raw as EffectComponent;
  if (typeof p.id !== 'string' || p.id.length > 100 || typeof p.name !== 'string' || !p.name.trim() || p.name.length > 80 || typeof p.category !== 'string' || !p.category.trim() || p.category.length > 40 || typeof p.origin !== 'string' || p.origin.length > 80) throw Error('부품 이름·분류·출처를 확인해 주세요.');
  return { id: p.id, name: p.name, category: p.category, recipe: validateRecipe(p.recipe), origin: p.origin };
}
export function readComponents(storage: Pick<Storage, 'getItem'>): EffectComponent[] {
  const raw = storage.getItem(COMPONENT_STORAGE); if (!raw) return [];
  const data = JSON.parse(raw);
  if (data.format !== 'gd.component-library@1' || !Array.isArray(data.items) || data.items.length > 60) throw Error('부품 보관함을 읽지 못했습니다. 원본은 보존됩니다.');
  const items = data.items.map(parseComponent) as EffectComponent[];
  if (new Set(items.map(p => p.id)).size !== items.length) throw Error('부품 ID가 중복됩니다. 원본은 보존됩니다.');
  return items;
}
export function writeComponents(storage: Pick<Storage, 'setItem'>, items: EffectComponent[]): void {
  if (items.length > 60) throw Error('내 부품은 60개까지 보관할 수 있습니다. JSON 백업 후 정리해 주세요.');
  const text = JSON.stringify({ format: 'gd.component-library@1', items: items.map(parseComponent) });
  if (new Blob([text]).size > 2 * 1024 * 1024) throw Error('부품 보관함이 2MB를 넘습니다. JSON 백업 후 정리해 주세요.');
  storage.setItem(COMPONENT_STORAGE, text);
}
let defaults: EffectComponent[] | undefined;
export function defaultComponents(): EffectComponent[] {
  return defaults ??= PRESET_INFO.flatMap(p => recipeComponents(createPreset(p.id), `preset-${p.id}`));
}
/** Layout and labels do not change pixels. Used to avoid rebuilding all frames on a pan/drag. */
export function visualRecipeKey(recipe: EffectRecipe): string {
  return JSON.stringify(recipe, (key, value) => {
    if (['name', 'view', 'origin', 'category'].includes(key)) return undefined;
    if (key === 'nodes') return (value as EffectNode[]).map(({ x: _x, y: _y, ...n }) => n);
    return value;
  });
}

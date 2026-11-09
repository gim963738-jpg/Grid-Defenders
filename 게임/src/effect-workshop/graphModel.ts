import type { EffectRecipe } from './model';
import { strokeBehavior, strokeLabel } from './drawingModel';

export const NODE_TYPES = ['layer', 'drawing', 'sequence', 'component', 'tint', 'opacity', 'transform', 'glow', 'fade', 'blend', 'mask', 'output'] as const;
export type NodeType = typeof NODE_TYPES[number];
export type PortType = 'image' | 'direction';
export const NODE_NAMES: Record<NodeType, string> = { layer: '기본 효과', drawing: '그린 선', sequence: '빛·레이저 연출', component: '보관한 부품', tint: '색상', opacity: '투명도', transform: '크기·회전·이동', glow: '발광', fade: '구간·페이드', blend: '합성', mask: '마스크', output: '최종 출력' };
export interface NodeParams { color: string; amount: number; scale: number; rotation: number; x: number; y: number; blur: number; mode: 'normal' | 'add' | 'screen' | 'multiply'; start: number; end: number }
export interface EffectNode { id: string; type: NodeType; x: number; y: number; sourceId?: string; params: NodeParams; component?: { name: string; category: string; recipe: EffectRecipe } }
export interface NodeLink { from: string; to: string; port: string }
export interface EffectGraph { version: 1; enabled: boolean; nodes: EffectNode[]; links: NodeLink[]; view: { x: number; y: number; zoom: number } }
export const NODE_WIDTH = 224, NODE_PORT_TOP = 140, NODE_ROW = 48;
export const newNode = (type: NodeType, x = 60, y = 60, sourceId?: string): EffectNode => ({
  id: crypto.randomUUID(), type, x, y, ...(sourceId ? { sourceId } : {}),
  params: { color: '#8cebb0', amount: 1, scale: 1, rotation: 0, x: 0, y: 0, blur: 4, mode: 'normal', start: 0, end: 1 },
});
export function nodeOutput(node: EffectNode, recipe: EffectRecipe): PortType | null {
  if (node.type === 'output') return null;
  if (node.type === 'drawing') {
    const stroke = recipe.drawing?.strokes.find(s => s.id === node.sourceId);
    if (stroke && strokeBehavior(stroke) === 'direction') return 'direction';
  }
  return 'image';
}
export function nodeInputs(node: EffectNode, recipe: EffectRecipe): { id: string; name: string; type: PortType }[] {
  if (node.type === 'sequence' || node.type === 'component') return [];
  if (node.type === 'layer') return [{ id: 'direction', name: '이동 방향', type: 'direction' }];
  if (node.type === 'drawing') {
    const stroke = recipe.drawing?.strokes.find(s => s.id === node.sourceId);
    return stroke && ['appearance', 'path'].includes(strokeBehavior(stroke)) ? [{ id: 'direction', name: '이동 방향', type: 'direction' }] : [];
  }
  if (node.type === 'blend' || node.type === 'mask') return [{ id: 'a', name: node.type === 'mask' ? '원본' : '이미지 A', type: 'image' }, { id: 'b', name: node.type === 'mask' ? '알파 마스크' : '이미지 B', type: 'image' }];
  return [{ id: 'image', name: '이미지', type: 'image' }];
}
export const nodeHeight = (node: EffectNode, recipe: EffectRecipe) => NODE_PORT_TOP + Math.max(1, nodeInputs(node, recipe).length) * NODE_ROW + 14;
export function nodeTitle(node: EffectNode, recipe: EffectRecipe): string {
  if (node.type === 'component') return node.component?.name ?? '부품';
  if (node.type === 'sequence') return recipe.sequence?.name ?? '삭제된 연출';
  if (node.type === 'layer') return recipe.layers.find(l => l.id === node.sourceId)?.name ?? '삭제된 기본 효과';
  if (node.type === 'drawing') { const stroke = recipe.drawing?.strokes.find(s => s.id === node.sourceId); return stroke ? strokeLabel(stroke) : '삭제된 선'; }
  return NODE_NAMES[node.type];
}
export function portPosition(node: EffectNode, recipe: EffectRecipe, input?: string): [number, number] {
  const index = input ? Math.max(0, nodeInputs(node, recipe).findIndex(p => p.id === input)) : 0;
  return [node.x + (input ? 0 : NODE_WIDTH), node.y + NODE_PORT_TOP + NODE_ROW * (index + .5)];
}
function assertAcyclic(graph: EffectGraph): void {
  const visiting = new Set<string>(), complete = new Set<string>();
  const visit = (id: string) => {
    if (visiting.has(id)) throw Error('순환 연결은 만들 수 없습니다. 출력이 다시 자기 입력으로 돌아가지 않게 연결해 주세요.');
    if (complete.has(id)) return;
    visiting.add(id); graph.links.filter(e => e.from === id).forEach(e => visit(e.to)); visiting.delete(id); complete.add(id);
  };
  graph.nodes.forEach(n => visit(n.id));
}
export function connectGraph(graph: EffectGraph, recipe: EffectRecipe, link: NodeLink): EffectGraph {
  const next = structuredClone(graph), from = next.nodes.find(n => n.id === link.from), to = next.nodes.find(n => n.id === link.to);
  if (!from || !to) throw Error('연결할 노드를 찾을 수 없습니다.');
  const input = nodeInputs(to, recipe).find(p => p.id === link.port);
  if (from.id === to.id) throw Error('노드를 자기 자신에게 연결할 수 없습니다.');
  if (!input || nodeOutput(from, recipe) !== input.type) throw Error('이미지는 보라색 이미지 입력에, 방향은 노란색 방향 입력에 연결해 주세요.');
  next.links = next.links.filter(e => !(e.to === link.to && e.port === link.port)); next.links.push({ ...link });
  if (next.links.length > 160) throw Error('연결은 160개까지 사용할 수 있습니다.');
  assertAcyclic(next); return next;
}
/** Keep drawing bindings visible in both authoring views, without changing image-layer data. */
export function applyDirectionLink(recipe: EffectRecipe, link: NodeLink, remove = false): void {
  if (link.port !== 'direction' || !recipe.graph) return;
  const from = recipe.graph.nodes.find(n => n.id === link.from), to = recipe.graph.nodes.find(n => n.id === link.to);
  if (to?.type !== 'drawing') return;
  const stroke = recipe.drawing?.strokes.find(s => s.id === to.sourceId);
  if (!stroke) return;
  if (remove) delete stroke.directionId;
  else if (from?.type === 'drawing') { stroke.directionId = from.sourceId; stroke.followActor = false; }
}
/** Called only for local UI edits; imported graphs must validate without silent repair. */
export function syncGraphSources(recipe: EffectRecipe): void {
  const graph = recipe.graph; if (!graph) return;
  graph.nodes = graph.nodes.filter(n => n.type !== 'layer' && n.type !== 'drawing' || n.type === 'layer' && recipe.layers.some(l => l.id === n.sourceId) || n.type === 'drawing' && !!recipe.drawing?.strokes.some(s => s.id === n.sourceId));
  graph.nodes = graph.nodes.filter(n => n.type !== 'sequence' || !!recipe.sequence);
  graph.links = graph.links.filter(e => {
    const from = graph.nodes.find(n => n.id === e.from), to = graph.nodes.find(n => n.id === e.to);
    return !!from && !!to && nodeInputs(to, recipe).some(p => p.id === e.port && p.type === nodeOutput(from, recipe));
  });
  for (const target of graph.nodes.filter(n => n.type === 'drawing')) {
    const stroke = recipe.drawing?.strokes.find(s => s.id === target.sourceId);
    graph.links = graph.links.filter(e => !(e.to === target.id && e.port === 'direction'));
    if (stroke?.directionId) {
      const source = graph.nodes.find(n => n.type === 'drawing' && n.sourceId === stroke.directionId);
      if (source) graph.links.push({ from: source.id, to: target.id, port: 'direction' });
    }
  }
}
export function createGraph(recipe: EffectRecipe): EffectGraph {
  const nodes: EffectNode[] = [], links: NodeLink[] = [];
  const visible: { node: EffectNode; mode: NodeParams['mode'] }[] = [];
  recipe.layers.forEach((layer, i) => {
    if (recipe.drawing?.enabled && !recipe.drawing.showBase) return;
    const node = newNode('layer', 40, 40 + i * 260, layer.id); nodes.push(node);
    if (!recipe.drawing?.enabled || recipe.drawing.showBase) visible.push({ node, mode: layer.blend === 'add' ? 'add' : 'normal' });
  });
  const sourceRows = nodes.length;
  recipe.drawing?.strokes.forEach((stroke, i) => {
    const node = newNode('drawing', 40, 40 + (sourceRows + i) * 260, stroke.id); nodes.push(node);
    if (recipe.drawing?.enabled && ['appearance', 'path'].includes(strokeBehavior(stroke))) visible.push({ node, mode: 'normal' });
  });
  for (const target of nodes.filter(n => n.type === 'drawing')) {
    const stroke = recipe.drawing?.strokes.find(s => s.id === target.sourceId);
    const source = stroke?.directionId ? nodes.find(n => n.type === 'drawing' && n.sourceId === stroke.directionId) : undefined;
    if (source) links.push({ from: source.id, to: target.id, port: 'direction' });
  }
  if (recipe.sequence) {
    const node = newNode('sequence', 40, 40 + nodes.length * 260); nodes.push(node);
    if (recipe.sequence.enabled) visible.push({ node, mode: 'add' });
  }
  // Rebuilding the wiring must retain sources brought in from the parts library.
  for (const original of recipe.graph?.nodes.filter(n => n.type === 'component') ?? []) {
    const node = structuredClone(original); node.x = 40; node.y = 40 + nodes.length * 260;
    nodes.push(node); visible.push({ node, mode: 'normal' });
  }
  // Preserve the original stacking order: additive and normal composites cannot be regrouped.
  let previous = visible[0]?.node, level = 1;
  for (const item of visible.slice(1)) {
    const merge = newNode('blend', 40 + level++ * 300, item.node.y);
    merge.params.mode = item.mode; nodes.push(merge);
    links.push({ from: previous!.id, to: merge.id, port: 'a' }, { from: item.node.id, to: merge.id, port: 'b' });
    previous = merge;
  }
  const output = newNode('output', 40 + level * 300, previous?.y ?? 40); nodes.push(output);
  if (previous) links.push({ from: previous.id, to: output.id, port: 'image' });
  return { version: 1, enabled: true, nodes, links, view: { x: 36, y: 36, zoom: 1 } };
}

const obj = (v: unknown): Record<string, unknown> => { if (!v || typeof v !== 'object' || Array.isArray(v)) throw Error('노드 데이터는 객체여야 합니다.'); return v as Record<string, unknown>; };
const num = (v: unknown, lo: number, hi: number, label: string): number => { if (typeof v !== 'number' || !Number.isFinite(v) || v < lo || v > hi) throw Error(`${label}: ${lo}~${hi} 범위를 확인해 주세요.`); return v; };
const id = (v: unknown): string => { if (typeof v !== 'string' || !/^[a-z\d_-]{1,80}$/i.test(v)) throw Error('노드 ID는 영문·숫자·밑줄·하이픈으로 작성해 주세요.'); return v; };
export function validateGraph(raw: unknown, recipe: EffectRecipe, validateComponent?: (raw: unknown) => EffectRecipe): EffectGraph {
  const g = obj(raw), view = obj(g.view);
  if (g.version !== 1 || typeof g.enabled !== 'boolean' || !Array.isArray(g.nodes) || g.nodes.length < 1 || g.nodes.length > 96 || !Array.isArray(g.links) || g.links.length > 160) throw Error('노드 연결도는 version 1, 노드 1~96개, 연결 160개까지 지원합니다.');
  const seen = new Set<string>(), sources = new Set<string>();
  const nodes = g.nodes.map((raw): EffectNode => {
    const n = obj(raw), key = id(n.id), p = obj(n.params);
    if (seen.has(key)) throw Error('노드 ID가 중복됩니다.'); seen.add(key);
    if (!NODE_TYPES.includes(n.type as NodeType)) throw Error('지원하지 않는 노드 종류입니다.');
    if (typeof p.color !== 'string' || !/^#[\da-f]{6}$/i.test(p.color) || !['normal', 'add', 'screen', 'multiply'].includes(p.mode as string)) throw Error('노드 색상 또는 합성 방식을 확인해 주세요.');
    const result: EffectNode = { id: key, type: n.type as NodeType, x: num(n.x, -12000, 12000, '노드 X'), y: num(n.y, -12000, 12000, '노드 Y'), params: {
      color: p.color, amount: num(p.amount, 0, 1, '강도'), scale: num(p.scale, .1, 3, '배율'), rotation: num(p.rotation, -180, 180, '회전'), x: num(p.x, -.5, .5, '가로 이동'), y: num(p.y, -.5, .5, '세로 이동'), blur: num(p.blur, 0, 16, '발광 폭'), mode: p.mode as NodeParams['mode'], start: num(p.start, 0, .99, '시작'), end: num(p.end, .01, 1, '종료'),
    } };
    if (result.params.start >= result.params.end) throw Error('노드 종료는 시작보다 뒤여야 합니다.');
    if (n.sourceId !== undefined) result.sourceId = id(n.sourceId);
    if (result.type === 'component') {
      const c = obj(n.component);
      if (!validateComponent || typeof c.name !== 'string' || !c.name.trim() || c.name.length > 80 || typeof c.category !== 'string' || !c.category.trim() || c.category.length > 40) throw Error('부품의 이름·분류·원본 데이터를 확인해 주세요.');
      result.component = { name: c.name, category: c.category, recipe: validateComponent(c.recipe) };
    }
    if (result.type === 'layer' && !recipe.layers.some(l => l.id === result.sourceId) || result.type === 'drawing' && !recipe.drawing?.strokes.some(s => s.id === result.sourceId)) throw Error('노드가 참조하는 원본 효과 또는 그림이 없습니다.');
    if (result.type === 'layer' || result.type === 'drawing') {
      const source = `${result.type}:${result.sourceId}`;
      if (sources.has(source)) throw Error('같은 원본은 하나의 노드로 사용하고 출력 포트를 여러 곳에 연결해 주세요.');
      sources.add(source);
    }
    return result;
  });
  if (nodes.filter(n => n.type === 'output').length !== 1) throw Error('최종 출력 노드는 정확히 하나여야 합니다.');
  if (nodes.some(n => n.type === 'sequence') && !recipe.sequence || nodes.filter(n => n.type === 'sequence').length > 1) throw Error('빛·레이저 연출 원본은 존재해야 하며 하나의 노드로 연결해 주세요.');
  const slots = new Set<string>();
  const graph: EffectGraph = { version: 1, enabled: g.enabled, nodes, links: [], view: { x: num(view.x, -16000, 16000, '화면 X'), y: num(view.y, -16000, 16000, '화면 Y'), zoom: num(view.zoom, .25, 2, '화면 확대') } };
  graph.links = g.links.map((raw): NodeLink => {
    const e = obj(raw), from = id(e.from), to = id(e.to);
    if (typeof e.port !== 'string') throw Error('연결할 입력 포트를 확인해 주세요.');
    const a = nodes.find(n => n.id === from), b = nodes.find(n => n.id === to), input = b ? nodeInputs(b, recipe).find(p => p.id === e.port) : undefined;
    if (!a || !b || a.id === b.id || !input || nodeOutput(a, recipe) !== input.type) throw Error('노드 연결의 방향과 포트 종류를 확인해 주세요.');
    const key = `${to}:${e.port}`; if (slots.has(key)) throw Error('한 입력 포트에는 하나의 연결만 둘 수 있습니다.'); slots.add(key);
    return { from, to, port: e.port };
  });
  for (const target of nodes.filter(n => n.type === 'drawing')) {
    const stroke = recipe.drawing?.strokes.find(s => s.id === target.sourceId);
    const edge = graph.links.find(e => e.to === target.id && e.port === 'direction');
    const source = nodes.find(n => n.id === edge?.from);
    const represented = nodes.some(n => n.type === 'drawing' && n.sourceId === stroke?.directionId);
    if (edge && source?.sourceId !== stroke?.directionId || !edge && represented)
      throw Error('그린 선의 directionId와 노드 방향 연결이 다릅니다. 두 화면의 이동 방향을 같은 선으로 지정해 주세요.');
  }
  assertAcyclic(graph); return graph;
}

import { cloneRecipe, createPreset, makeAiPrompt, makeLayer, parseRecipe, STORAGE_KEY, validateRecipe, type EffectRecipe } from '../src/effect-workshop/model';
import { applyDirectionLink, connectGraph, createGraph, newNode, syncGraphSources, validateGraph, type EffectGraph, type EffectNode, type NodeLink, type NodeType } from '../src/effect-workshop/graphModel';
import { evaluateGraph, graphCanvas } from '../src/effect-workshop/graphRender';
import { drawingDesignExample, fitDrawingTiming } from '../src/effect-workshop/drawingModel';
import { destroyFrames, renderFrame, renderFrames, renderNodeImages, sheetMetadata } from '../src/effect-workshop/renderer';

export function nodeExample(): EffectRecipe {
  const recipe = createPreset('heal'); recipe.name = '노드 연결 검증 · 생명의 빛';
  recipe.layers = [makeLayer('rune', { radius: .18, color: 1, amount: 4, thickness: .012, rotation: 0 })];
  recipe.graph = createGraph(recipe);
  const graph = recipe.graph, source = graph.nodes[0], output = graph.nodes.find(n => n.type === 'output')!;
  const tint = newNode('tint', 340, 40), glow = newNode('glow', 640, 40); tint.params.color = '#66e39a'; tint.params.amount = .7; glow.params.blur = 2.5; glow.params.amount = .6;
  output.x = 940; output.y = 40; graph.nodes.push(tint, glow); graph.links = [{ from: source.id, to: tint.id, port: 'image' }, { from: tint.id, to: glow.id, port: 'image' }, { from: glow.id, to: output.id, port: 'image' }];
  return recipe;
}
export function checkEffectNodes() {
  const passed: string[] = [], check = (ok: boolean, message: string) => { if (!ok) throw Error(message); passed.push(message); };
  const rejects = (fn: () => unknown, message: string) => { let failed = false; try { fn(); } catch { failed = true; } check(failed, message); };
  const r = nodeExample(), g = r.graph!, source = g.nodes.find(n => n.type === 'layer')!, output = g.nodes.find(n => n.type === 'output')!;
  check(JSON.stringify(parseRecipe(JSON.stringify(r)).graph) === JSON.stringify(validateGraph(g, r)), 'node types, parameters, coordinates, links and viewport round-trip through recipe JSON');
  check(makeAiPrompt(r, '빛을 더해줘').includes('한 입력당 한 연결'), 'AI handoff describes graph ports and preserves editable graph data');
  const plain = cloneRecipe(r); delete plain.graph;
  const connected = renderFrame(r, 7), original = renderFrame(plain, 7);
  check(connected.visible && connected.art.url !== original.art.url, 'connected tint and glow processors change actual exported pixels'); destroyFrames([connected, original]);
  const off = cloneRecipe(r); off.graph!.enabled = false;
  const disabled = renderFrame(off, 7), fallback = renderFrame(plain, 7);
  check(disabled.art.url === fallback.art.url, 'disabling the graph exactly restores the legacy layer renderer'); destroyFrames([disabled, fallback]);
  const empty = cloneRecipe(r); empty.graph!.links = [];
  const blank = renderFrames(empty); check(blank.every(f => !f.visible), 'unconnected output stays transparent instead of silently falling back to other effects'); destroyFrames(blank);
  const frames = renderFrames(r);
  try {
    check(frames.some(f => f.visible) && frames.every(f => !f.touchesEdge), 'all graph-example frames fit within transparent content bounds');
    check(frames.every(f => { const c = f.canvas, ctx = c.getContext('2d')!, d = ctx.getImageData(0, 0, c.width, c.height).data; return Array.from({ length: c.width }, (_, i) => [d[i * 4 + 3], d[((c.height - 1) * c.width + i) * 4 + 3], d[(i * c.width) * 4 + 3], d[(i * c.width + c.width - 1) * 4 + 3]]).flat().every(a => a === 0); }), 'every generated graph frame keeps transparent outer padding');
    check(frames[7].art.contentWidth === r.settings.size && sheetMetadata(r, 6).graph?.links.length === g.links.length, 'graph rendering keeps content size and editable metadata separate from padding');
  } finally { destroyFrames(frames); }
  const moved = cloneRecipe(r), transform = newNode('transform'); transform.params.x = .5; transform.params.scale = 2;
  moved.graph!.nodes.push(transform); moved.graph!.links = [{ from: source.id, to: transform.id, port: 'image' }, { from: transform.id, to: output.id, port: 'image' }];
  const clipped = renderFrames(moved); check(clipped.some(f => f.touchesEdge), 'graph transforms retain the existing export clipping gate'); destroyFrames(clipped);
  const a = newNode('layer'), b = newNode('layer'), result = newNode('output'), process = newNode('tint');
  const fixture = (type: NodeType, params: Partial<EffectNode['params']> = {}, second = false) => {
    process.type = type; Object.assign(process.params, { amount: 1, x: 0, y: 0, rotation: 0, scale: 1, blur: 0, start: 0, end: 1, ...params });
    const links: NodeLink[] = type === 'blend' || type === 'mask' ? [{ from: a.id, to: process.id, port: 'a' }, ...(second ? [{ from: b.id, to: process.id, port: 'b' }] : [])] : [{ from: a.id, to: process.id, port: 'image' }];
    const graph: EffectGraph = { version: 1, enabled: true, nodes: [a, b, process, result], links: [...links, { from: process.id, to: result.id, port: 'image' }], view: { x: 0, y: 0, zoom: 1 } };
    return evaluateGraph(graph, 32, .5, n => { const c = graphCanvas(32), ctx = c.getContext('2d')!; ctx.fillStyle = n.id === a.id ? '#ff0000' : '#0000ff'; ctx.fillRect(n.id === a.id ? 4 : 12, 4, 12, 12); return c; }).output;
  };
  const pixel = (c: HTMLCanvasElement, x = 8, y = 8) => [...c.getContext('2d')!.getImageData(x, y, 1, 1).data];
  check(pixel(fixture('tint', { color: '#00ff00' })).join() === '0,255,0,255', 'tint recolors image RGB while preserving alpha');
  check(Math.abs(pixel(fixture('opacity', { amount: .5 }))[3] - 128) < 2, 'opacity controls actual image alpha');
  check(pixel(fixture('transform', { x: .25 }), 8)[3] === 0 && pixel(fixture('transform'), 8)[3] === 255, 'transform moves the source rather than changing node layout');
  check(pixel(fixture('fade', { start: .6, end: .9 }))[3] === 0 && pixel(fixture('fade'))[3] === 255, 'fade uses the full animation time interval');
  check(pixel(fixture('blend', { mode: 'add' }, true), 13).slice(0, 3).join() === '255,0,255', 'additive blend merges both source colors in their overlap');
  check(pixel(fixture('mask', {}, true), 8)[3] === 0 && pixel(fixture('mask', {}, true), 13)[3] === 255, 'mask keeps only the intersection of source alpha and mask alpha');
  check(pixel(fixture('mask'))[3] === 0, 'missing mask input cannot display an unmasked source');
  const fan = structuredClone(g), blend = newNode('blend'); fan.nodes.push(blend); fan.links = [{ from: source.id, to: blend.id, port: 'a' }, { from: source.id, to: blend.id, port: 'b' }, { from: blend.id, to: output.id, port: 'image' }];
  let calls = 0; evaluateGraph(fan, 16, .5, () => { calls++; return graphCanvas(16); }); check(calls === 1, 'a branched source is rasterized once per frame');
  const next = connectGraph(g, r, { from: source.id, to: output.id, port: 'image' });
  check(next.links.filter(e => e.to === output.id && e.port === 'image').length === 1 && JSON.stringify(g) !== JSON.stringify(next), 'connecting an occupied input atomically replaces its old connection without mutating the original graph');
  const tint = g.nodes.find(n => n.type === 'tint')!, glow = g.nodes.find(n => n.type === 'glow')!;
  rejects(() => connectGraph(g, r, { from: glow.id, to: tint.id, port: 'image' }), 'cycles are rejected before rendering');
  rejects(() => connectGraph(g, r, { from: source.id, to: source.id, port: 'direction' }), 'self connections are rejected');
  rejects(() => connectGraph(g, r, { from: source.id, to: output.id, port: 'direction' }), 'nonexistent or incompatible input ports are rejected');
  rejects(() => validateGraph({ ...g, nodes: [...g.nodes, newNode('output')] }, r), 'imports reject multiple final outputs');
  rejects(() => validateGraph({ ...g, links: [...g.links, g.links[0]] }, r), 'imports reject multiple incoming links to the same slot');
  rejects(() => validateGraph({ ...g, nodes: [...g.nodes, newNode('layer', 1, 1, source.sourceId)] }, r), 'source nodes branch their output rather than duplicate an ambiguous source binding');
  rejects(() => validateGraph({ ...g, nodes: g.nodes.map(n => n.id === tint.id ? { ...n, params: { ...n.params, color: 'url(unsafe)' } } : n) }, r), 'node colors accept safe HEX values only');
  rejects(() => validateGraph({ ...g, nodes: g.nodes.map(n => n.id === source.id ? { ...n, sourceId: 'missing' } : n) }, r), 'imported dangling source references are rejected');
  const drawing = createPreset('heal'); drawing.drawing = drawingDesignExample(); fitDrawingTiming(drawing); drawing.graph = createGraph(drawing);
  const dn = drawing.graph.nodes.find(n => n.sourceId === drawing.drawing!.strokes[0].id)!, shape = drawing.graph.nodes.find(n => n.sourceId === drawing.drawing!.strokes[1].id)!;
  rejects(() => connectGraph(drawing.graph!, drawing, { from: dn.id, to: drawing.graph!.nodes.find(n => n.type === 'output')!.id, port: 'image' }), 'a direction cannot be wired into an image input');
  check(drawing.graph.links.some(e => e.from === dn.id && e.to === shape.id && e.port === 'direction'), 'creating a graph exposes existing appearance-to-direction bindings');
  const disagreement = cloneRecipe(drawing); delete disagreement.drawing!.strokes[1].directionId;
  rejects(() => validateRecipe(disagreement), 'imports cannot give the drawing and graph different direction bindings');
  const layerMotion = cloneRecipe(drawing), layer = newNode('layer', 40, 900, layerMotion.layers[0].id);
  layerMotion.graph!.nodes.push(layer); layerMotion.graph!.links = layerMotion.graph!.links.filter(e => e.to !== layerMotion.graph!.nodes.find(n => n.type === 'output')!.id);
  layerMotion.graph!.links.push({ from: layer.id, to: layerMotion.graph!.nodes.find(n => n.type === 'output')!.id, port: 'image' }, { from: dn.id, to: layer.id, port: 'direction' });
  const layerMoving = renderFrame(layerMotion, 12); layerMotion.graph!.links = layerMotion.graph!.links.filter(e => !(e.to === layer.id && e.port === 'direction'));
  const layerStill = renderFrame(layerMotion, 12); check(layerMoving.art.url !== layerStill.art.url, 'a direction can also move a procedural base-effect source'); destroyFrames([layerMoving, layerStill]);
  const linked = renderFrame(drawing, 12), unlinked = cloneRecipe(drawing); unlinked.graph!.links = unlinked.graph!.links.filter(e => e.port !== 'direction'); delete unlinked.drawing!.strokes[1].directionId;
  const stationary = renderFrame(unlinked, 12); check(linked.art.url !== stationary.art.url, 'direction edges move the real generated drawing source'); destroyFrames([linked, stationary]);
  const link = drawing.graph.links.find(e => e.port === 'direction')!; applyDirectionLink(drawing, link, true); syncGraphSources(drawing);
  check(!drawing.drawing.strokes[1].directionId && !drawing.graph.links.some(e => e.port === 'direction'), 'disconnecting a direction updates the drawing editor binding as well');
  drawing.graph = connectGraph(drawing.graph, drawing, link); applyDirectionLink(drawing, link); syncGraphSources(drawing);
  check(drawing.drawing.strokes[1].directionId === drawing.drawing.strokes[0].id, 'connecting a direction updates the original drawing binding');
  drawing.drawing.strokes.splice(0, 1); delete drawing.drawing.strokes[0].directionId; syncGraphSources(drawing);
  check(!drawing.graph.nodes.some(n => n.id === dn.id) && !drawing.graph.links.some(e => e.from === dn.id), 'removing original artwork cleans stale source nodes and their edges');
  const previews = renderNodeImages(r, 7); check(previews.size === g.nodes.length && !!previews.get(output.id)?.startsWith('data:image/png'), 'per-node thumbnails evaluate the real image pipeline');
  const mixed = createPreset('heal'); mixed.layers[1].blend = 'normal'; mixed.graph = createGraph(mixed);
  const merges = mixed.graph.nodes.filter(n => n.type === 'blend'); check(merges[0].params.mode === 'normal' && merges[1].params.mode === 'add', 'conversion preserves ordered normal/additive stacking rather than regrouping it');
  return passed;
}

/** Use a separate QA origin. The existing library is restored, then reload the page. */
export async function checkEffectNodesUI() {
  const backup = localStorage.getItem(STORAGE_KEY), passed: string[] = [];
  const check = (ok: boolean, message: string) => { if (!ok) throw Error(message); passed.push(message); };
  const get = <T extends HTMLElement = HTMLElement>(s: string) => document.querySelector<T>(s)!;
  const click = (s: string) => get(s).click(), wait = () => new Promise(resolve => setTimeout(resolve, 180));
  const change = (s: string, value: string) => { const input = get<HTMLInputElement>(s); input.value = value; input.dispatchEvent(new Event('change', { bubbles: true })); };
  const state = (): EffectRecipe => { const data = JSON.parse(localStorage.getItem(STORAGE_KEY)!); return data.entries.find((e: { id: string }) => e.id === data.activeId).recipe; };
  const connect = (from: string, to: string, port = 'image') => { change('[data-ng-from]', from); change('[data-ng-to]', `${to}:${port}`); click('[data-ng=connect]'); };
  const importWork = async (recipe: EffectRecipe) => { click('[data-action=import]'); get<HTMLTextAreaElement>('#import-text').value = JSON.stringify(recipe); click('[data-action=import-text]'); await wait(); click('[data-view=nodes]'); await wait(); };
  const select = (id: string) => click(`[data-ng-drag="${id}"]`);
  const originalCapture = HTMLElement.prototype.setPointerCapture; HTMLElement.prototype.setPointerCapture = () => {};
  try {
    await importWork(nodeExample());
    click('[data-frame="7"]'); await wait();
    check(!get('#node-preview').hidden && get('.ws-inspector').getBoundingClientRect().width === 0, 'node workspace opens with its own graph properties instead of duplicate inspectors');
    const g = state().graph!, source = g.nodes.find(n => n.type === 'layer')!, tint = g.nodes.find(n => n.type === 'tint')!, output = g.nodes.find(n => n.type === 'output')!;
    check(document.querySelectorAll('.ng-node').length === g.nodes.length && document.querySelectorAll('.ng-wire').length === g.links.length, 'cards and curved wires represent the persisted graph');
    select(tint.id); change('[data-ng-param=color]', '#00ff00'); await wait(); check(state().graph!.nodes.find(n => n.id === tint.id)!.params.color === '#00ff00', 'property editing updates the selected processor and autosaves');
    select(tint.id); const beforeImage = get<HTMLImageElement>('.ng-result img').src;
    change('[data-ng-param=amount]', '0'); await wait(); check(get<HTMLImageElement>('.ng-result img').src !== beforeImage, 'node result previews respond to real processor changes');
    click('[data-ng=undo]'); await wait(); check(state().graph!.nodes.find(n => n.id === tint.id)!.params.amount === .7, 'node toolbar undo restores a parameter change');
    click('[data-ng=redo]'); await wait(); check(state().graph!.nodes.find(n => n.id === tint.id)!.params.amount === 0, 'node toolbar redo reapplies it');
    connect(source.id, output.id); await wait(); check(state().graph!.links.some(e => e.from === source.id && e.to === output.id), 'accessible connection form replaces the final image source');
    click(`[data-ng-output="${tint.id}"]`); click(`[data-ng-input="${output.id}"]`); await wait(); check(state().graph!.links.some(e => e.from === tint.id && e.to === output.id), 'tapping an output and input connects their actual graph slots');
    select(tint.id); click('[data-ng=delete]'); await wait(); check(!state().graph!.nodes.some(n => n.id === tint.id) && state().layers.length === 1, 'deleting a processing node removes its edges and preserves original artwork');
    click('[data-ng=undo]'); await wait(); check(state().graph!.nodes.some(n => n.id === tint.id) && state().graph!.links.some(e => e.to === output.id && e.from === tint.id), 'undo restores the deleted node and its connections together');
    const node = state().graph!.nodes.find(n => n.id === source.id)!, title = get(`[data-ng-drag="${source.id}"]`), rect = title.getBoundingClientRect(), zoom = state().graph!.view.zoom;
    const pointer = (type: string, x: number, y: number) => (type === 'pointerdown' ? title : get('.ng-viewport')).dispatchEvent(new PointerEvent(type, { pointerId: 90, pointerType: 'mouse', button: 0, buttons: type === 'pointerup' ? 0 : 1, bubbles: true, clientX: x, clientY: y }));
    pointer('pointerdown', rect.left + 40, rect.top + 15); pointer('pointermove', rect.left + 90, rect.top + 45); pointer('pointerup', rect.left + 90, rect.top + 45); await wait();
    check(Math.abs(state().graph!.nodes.find(n => n.id === source.id)!.x - node.x - 50 / zoom) < .001, 'dragging a title persists node coordinates at the current zoom');
    click('[data-ng=undo]'); await wait(); check(state().graph!.nodes.find(n => n.id === source.id)!.x === node.x, 'one undo reverses the complete node drag');
    select(output.id); check(get<HTMLButtonElement>('[data-ng=delete]').disabled, 'the unique output cannot be deleted accidentally');
    const sourceCount = state().layers.length; select(source.id); click('[data-ng=delete]'); await wait(); check(state().layers.length === sourceCount && get<HTMLSelectElement>('[data-ng-source]').options.length > 1, 'removing a source node preserves its layer and makes it available to add again');
    change('[data-ng-source]', `layer:${source.sourceId}`); await wait(); check(state().graph!.nodes.some(n => n.sourceId === source.sourceId), 'a preserved layer can be returned to the graph');
    change('[data-ng-processor]', 'mask'); await wait(); check(state().graph!.nodes.some(n => n.type === 'mask'), 'the processor menu adds a real mask node');
    const enabled = get<HTMLInputElement>('[data-ng-enabled]'); enabled.checked = false; enabled.dispatchEvent(new Event('change', { bubbles: true })); await wait(); check(!state().graph!.enabled, 'graph enable switch retains the graph while restoring base rendering');
    click('[data-ng=rebuild]'); await wait(); check(state().graph!.enabled && !state().graph!.nodes.some(n => n.type === 'mask'), 'rebuilding derives the graph from current original layers and drawings');
    click('[data-ng=undo]'); await wait(); check(state().graph!.nodes.some(n => n.type === 'mask'), 'rebuilding the graph can be undone');
    click('[data-ng=help]'); check(get('#dialog-body').textContent!.includes('마스크') && get('#dialog-body').textContent!.includes('방향'), 'in-app help explains typed ports and image processing'); click('[data-action=close-dialog]');
    const drawing = createPreset('heal'); drawing.drawing = drawingDesignExample(); fitDrawingTiming(drawing); await importWork(drawing);
    click('[data-ng=undo]'); await wait(); check(!state().graph && get('[data-ng-count]').textContent === '연결도 없음', 'undoing first graph creation restores the original work without recreating the graph');
    click('[data-ng=redo]'); await wait(); check(!!state().graph, 'redo restores the complete first graph conversion');
    const dg = state().graph!, direction = dg.nodes.find(n => n.type === 'drawing' && n.sourceId === state().drawing!.strokes[0].id)!, shape = dg.nodes.find(n => n.type === 'drawing' && n.sourceId === state().drawing!.strokes[1].id)!;
    select(shape.id); const linkIndex = dg.links.findIndex(e => e.port === 'direction'); click(`[data-ng-disconnect="${linkIndex}"]`); await wait(); check(!state().drawing!.strokes[1].directionId, 'disconnecting a direction also changes the drawing editor binding');
    connect(direction.id, shape.id, 'direction'); await wait(); check(state().drawing!.strokes[1].directionId === state().drawing!.strokes[0].id, 'connecting direction-to-appearance synchronizes both authoring views');
    change('[data-ng-from]', direction.id); check([...get<HTMLSelectElement>('[data-ng-to]').options].filter(o => o.value).every(o => o.value.endsWith(':direction')), 'connection form filters incompatible image destinations for direction outputs');
    click('[data-ng=preview]'); await wait(); check(!get('#editor-preview').hidden && get('#play-button').getAttribute('aria-label') === '일시정지', 'result playback uses the same graph-generated animation in the standard preview');
    return passed;
  } finally { HTMLElement.prototype.setPointerCapture = originalCapture; if (backup === null) localStorage.removeItem(STORAGE_KEY); else localStorage.setItem(STORAGE_KEY, backup); }
}

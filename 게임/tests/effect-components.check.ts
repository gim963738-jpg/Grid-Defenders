import { cloneRecipe, createPreset, parseRecipe, validateRecipe, type EffectRecipe } from '../src/effect-workshop/model';
import { createGraph, newNode, syncGraphSources } from '../src/effect-workshop/graphModel';
import { COMPONENT_STORAGE, defaultComponents, extractComponent, insertComponent, readComponents, recipeComponents, visualRecipeKey, writeComponents } from '../src/effect-workshop/componentModel';
import { destroyFrames, renderFrames, renderNodeCanvases, renderPreviewCanvas } from '../src/effect-workshop/renderer';
import { drawingDesignExample, fitDrawingTiming } from '../src/effect-workshop/drawingModel';

export function checkEffectComponents() {
  const passed: string[] = [], check = (ok: unknown, label: string) => { if (!ok) throw Error(label); passed.push(label); };
  const rejects = (fn: () => unknown, label: string) => { let caught = false; try { fn(); } catch { caught = true; } check(caught, label); };
  const r = createPreset('summon-fire'); r.graph = createGraph(r); const original = JSON.stringify(r);
  const parts = recipeComponents(r, 'test');
  check(parts.length === 4 && ['불꽃', '마법진', '문양', '입자'].every(c => parts.some(p => p.category === c)), 'example separates flame, circle, motif and embers into reusable categories');
  const flame = r.graph.nodes.find(n => r.layers.find(l => l.id === n.sourceId)?.type === 'flame')!;
  const part = extractComponent(r, flame.id);
  for (const frame of [0, 18, 32, 49, 59]) {
    const expected = renderNodeCanvases(r, frame).get(flame.id)!;
    const actual = renderNodeCanvases(part.recipe, frame).get(part.recipe.graph!.nodes.find(n => n.type === 'output')!.id)!;
    check(expected.toDataURL() === actual.toDataURL(), `extraction preserves exact source pixels at frame ${frame + 1}`);
  }
  check(JSON.stringify(r) === original, 'extraction never changes the source work');
  const destination = createPreset('ice'); destination.settings = { ...r.settings }; destination.layers.forEach(l => l.enabled = false); destination.graph = createGraph(destination); destination.graph.links = [];
  const inserted = insertComponent(destination, part);
  check(destination.graph.nodes.find(n => n.id === inserted)?.component?.recipe.palette.join() === r.palette.join(), 'inserting into blue work retains the original fire palette');
  for (const frame of [18, 32, 49]) {
    const before = renderNodeCanvases(part.recipe, frame).get(part.recipe.graph!.nodes.find(n => n.type === 'output')!.id)!;
    const after = renderNodeCanvases(destination, frame).get(destination.graph.nodes.find(n => n.type === 'output')!.id)!;
    check(before.toDataURL() === after.toDataURL(), `inserted component preserves color and alpha at frame ${frame + 1}`);
  }
  const destinationText = JSON.stringify(destination), restored = parseRecipe(destinationText);
  check(JSON.stringify(restored) === JSON.stringify(validateRecipe(destination)), 'components survive complete recipe JSON export and import');
  const detached = cloneRecipe(destination); detached.graph!.nodes.find(n => n.id === inserted)!.component!.recipe.palette[0] = '#ffffff';
  check(part.recipe.palette[0] !== '#ffffff' && r.palette[0] !== '#ffffff', 'edits to an inserted part cannot mutate the library or source work');
  check(createGraph(destination).nodes.some(n => n.id === inserted && n.type === 'component'), 'rebuilding the graph retains imported components');
  syncGraphSources(destination); check(destination.graph.nodes.some(n => n.id === inserted), 'source synchronization retains independent components');
  const beforeMerge = destination.graph.nodes.length; insertComponent(destination, parts[0]);
  check(destination.graph.nodes.length === beforeMerge + 2 && destination.graph.links.some(e => e.port === 'b'), 'adding another part connects through a blend without replacing existing sources');
  const process = newNode('glow'); r.graph.nodes.push(process); r.graph.links.push({ from: flame.id, to: process.id, port: 'image' });
  const glowing = extractComponent(r, process.id);
  check(glowing.recipe.graph!.nodes.some(n => n.id === flame.id) && glowing.recipe.graph!.nodes.some(n => n.type === 'glow'), 'saving a processed result includes its upstream source');
  check(!glowing.recipe.graph!.nodes.some(n => n.type === 'blend'), 'unrelated rendering branches are excluded from the extracted result');
  const moved = cloneRecipe(r); moved.graph!.view.x += 100; moved.graph!.nodes[0].x += 300;
  check(visualRecipeKey(moved) === visualRecipeKey(r), 'layout and pan changes do not invalidate rendered frames');
  moved.layers[0].radius += .01; check(visualRecipeKey(moved) !== visualRecipeKey(r), 'visible shape edits invalidate frame caches');
  const painted = createPreset('slash'); painted.drawing = drawingDesignExample(); fitDrawingTiming(painted); painted.graph = createGraph(painted);
  const target = painted.graph.nodes.find(n => n.type === 'drawing' && painted.drawing!.strokes.find(s => s.id === n.sourceId)?.directionId)!;
  const drawingPart = extractComponent(painted, target.id);
  check(JSON.stringify(drawingPart.recipe.drawing) === JSON.stringify(validateRecipe(painted).drawing), 'drawing schedules, paths and actor dependencies are preserved exactly');
  check(drawingPart.recipe.graph!.links.some(e => e.port === 'direction'), 'direction input travels with the selected appearance');
  const direction = painted.graph.nodes.find(n => n.type === 'drawing' && painted.drawing!.strokes.find(s => s.id === n.sourceId)?.purpose === 'direction')!;
  rejects(() => extractComponent(painted, direction.id), 'direction-only guides cannot be saved as visible effect parts');
  const emerald = recipeComponents(createPreset('emerald'), 'emerald');
  check(emerald.some(p => p.name.endsWith('연결 레이저') && p.recipe.sequence?.lights.every(l => l.opacity === 0) && p.recipe.sequence.beams.length), 'laser components retain invisible endpoint motions without displaying light bodies');
  check(emerald.some(p => p.name.endsWith('폭발') && !p.recipe.sequence?.beams.length && p.recipe.sequence?.bursts.length), 'sequence explosions can be reused separately');
  const mem = new Map<string, string>(), storage = { getItem: (key: string) => mem.get(key) ?? null, setItem: (key: string, value: string) => { mem.set(key, value); } };
  writeComponents(storage, [part]); check(readComponents(storage)[0].name === part.name, 'part library round trips independently of the works library');
  mem.set(COMPONENT_STORAGE, 'broken'); rejects(() => readComponents(storage), 'corrupt component storage is reported'); check(mem.get(COMPONENT_STORAGE) === 'broken', 'reading corrupt storage does not overwrite it');
  const cycle = createPreset('slash'); cycle.graph = createGraph(cycle); const child = newNode('component'); child.component = { name: 'cycle', category: '기타', recipe: cycle }; cycle.graph.nodes.push(child);
  rejects(() => validateRecipe(cycle), 'nested component recursion is bounded before rendering');
  check(defaultComponents().length > 50 && defaultComponents().every(p => !!validateRecipe(p.recipe)), 'all starter components pass the complete recipe validator');
  const frames = renderFrames(createPreset('summon-fire'));
  try { check(frames.some(f => f.visible) && frames.every(f => !f.touchesEdge), 'all 60 example frames fit inside the transparent canvas'); }
  finally { destroyFrames(frames); }
  return passed;
}

export async function checkComponentUI() {
  if (location.port !== '5191') throw Error('UI checks only run in the isolated QA origin.');
  const q = <T extends HTMLElement = HTMLElement>(s: string) => document.querySelector<T>(s)!;
  const wait = (ms = 200) => new Promise(resolve => setTimeout(resolve, ms));
  const passed: string[] = [], check = (ok: unknown, label: string) => { if (!ok) throw Error(label); passed.push(label); };
  if (q<HTMLDialogElement>('.cp-dialog').open) q<HTMLDialogElement>('.cp-dialog').close();
  q<HTMLButtonElement>('[data-view=nodes]').click(); await wait();
  const name = [...document.querySelectorAll<HTMLButtonElement>('[data-ng-drag]')].find(b => b.textContent?.includes('솟구치는 불꽃'))!;
  name.click(); q<HTMLButtonElement>('[data-ng=save-part]').click();
  check(q<HTMLDialogElement>('.cp-dialog').open && !q<HTMLFormElement>('.cp-save').hidden, 'selected source opens the naming/category form');
  q<HTMLInputElement>('[name=partName]').value = 'QA reusable flame'; q<HTMLFormElement>('.cp-save').requestSubmit();
  check(q('[data-cp-source]').getAttribute('value') !== 'current' && readComponents(localStorage).some(p => p.name === 'QA reusable flame'), 'saving a selected node persists a reusable component');
  q<HTMLButtonElement>('[data-cp-add]').click(); await wait(); q<HTMLDialogElement>('.cp-dialog').close();
  check(!!document.querySelector('.ng-type-component'), 'a library part creates a visible component node');
  check(q('.ng-prop-title h3').textContent === 'QA reusable flame', 'inserted node is selected for immediate editing');
  const insertedCount = document.querySelectorAll('.ng-type-component').length;
  q<HTMLButtonElement>('[data-action=undo]').click(); await wait();
  check(document.querySelectorAll('.ng-type-component').length === insertedCount - 1, 'one undo removes the entire insertion, including its output connection');
  q<HTMLButtonElement>('[data-action=redo]').click(); await wait();
  check(document.querySelectorAll('.ng-type-component').length === insertedCount, 'redo restores the component and its output connection');
  [...document.querySelectorAll<HTMLButtonElement>('.ng-type-component [data-ng-drag]')].at(-1)!.click();
  q<HTMLSelectElement>('[data-ng-processor]').value = 'tint'; q('[data-ng-processor]').dispatchEvent(new Event('change', { bubbles: true })); await wait();
  check(q('.ng-prop-title h3').textContent === '색상', 'adding a processor selects and connects it immediately');
  q<HTMLButtonElement>('[data-ng=delete]').click(); await wait();
  const stored = JSON.parse(localStorage.getItem('grid-defenders.effect-workshop.v1')!);
  const graph = stored.entries.find((e: { id: string }) => e.id === stored.activeId).recipe.graph;
  const partId = graph.nodes.filter((n: { type: string }) => n.type === 'component').at(-1).id;
  check(graph.links.some((e: { from: string }) => e.from === partId), 'deleting a color processor reconnects the original part to the existing output chain');
  const before = q('#timeline-frames').firstElementChild;
  q<HTMLButtonElement>('[data-ng=zoom-in]').click(); await wait(400);
  check(q('#timeline-frames').firstElementChild === before, 'panning/zooming keeps the existing rendered timeline DOM');
  const scrub = q<HTMLInputElement>('#scrubber'); scrub.value = '25'; scrub.dispatchEvent(new Event('input', { bubbles: true })); await wait();
  const label = q('[data-ng-frame-label]').textContent;
  let frame = 25; const timer = setInterval(() => { scrub.value = String(++frame); scrub.dispatchEvent(new Event('input', { bubbles: true })); }, 20);
  await wait(260); const updatedWhileRunning = q('[data-ng-frame-label]').textContent !== label; clearInterval(timer);
  check(updatedWhileRunning, 'node thumbnails update while frames keep changing faster than the refresh interval');
  await wait(); const stopped = q('[data-ng-frame-label]').textContent; await wait(250);
  check(q('[data-ng-frame-label]').textContent === stopped, 'node playback pauses without changing the selected frame');
  q<HTMLButtonElement>('[data-ng=components]').click();
  const select = q<HTMLSelectElement>('[data-cp-source]'); select.value = 'saved'; select.dispatchEvent(new Event('change', { bubbles: true }));
  const count = readComponents(localStorage).length; q<HTMLButtonElement>('[data-cp-delete]').click(); check(readComponents(localStorage).length === count - 1, 'library deletion removes only the saved library item');
  q<HTMLButtonElement>('[data-cp=restore]').click(); check(readComponents(localStorage).length === count, 'library deletion has an immediate undo');
  select.value = 'preset'; select.dispatchEvent(new Event('change', { bubbles: true }));
  const cat = q<HTMLSelectElement>('[data-cp-category]'); cat.value = '불꽃'; cat.dispatchEvent(new Event('change', { bubbles: true }));
  check([...document.querySelectorAll('.cp-card-body small')].every(e => e.textContent?.startsWith('불꽃')), 'category filter shows only the requested reusable parts');
  q<HTMLDialogElement>('.cp-dialog').close();
  return passed;
}

export function renderComponentAuditSheet(): string {
  const recipe = createPreset('summon-fire'); recipe.graph = createGraph(recipe);
  const c = document.createElement('canvas'); c.width = 1280; c.height = 1850;
  const ctx = c.getContext('2d')!; ctx.fillStyle = '#152030'; ctx.fillRect(0, 0, c.width, c.height);
  for (let bg = 0; bg < 2; bg++) {
    ctx.fillStyle = '#fff'; ctx.font = '20px sans-serif'; ctx.fillText(`All 60 frames / ${bg ? 'field green' : 'light gray'} / original alpha`, 16, bg * 810 + 28);
    for (let i = 0; i < 60; i++) {
      const x = i % 10 * 128, y = Math.floor(i / 10) * 128 + bg * 810 + 40;
      ctx.fillStyle = bg ? '#72925f' : '#d4dae1'; ctx.fillRect(x, y, 126, 126);
      ctx.drawImage(renderPreviewCanvas(recipe, i), x, y, 128, 128); ctx.fillStyle = '#243044'; ctx.font = '12px sans-serif'; ctx.fillText(String(i + 1), x + 5, y + 14);
    }
  }
  recipeComponents(recipe, 'audit').forEach((part, i) => { const x = i * 320; ctx.fillStyle = '#fff'; ctx.font = '16px sans-serif'; ctx.fillText(part.name, x + 8, 1645); for (let j = 0; j < 2; j++) { ctx.fillStyle = j ? '#72925f' : '#d4dae1'; ctx.fillRect(x + j * 156, 1660, 154, 154); ctx.drawImage(renderPreviewCanvas(part.recipe, 30), x + j * 156, 1660, 154, 154); } });
  return c.toDataURL('image/png');
}

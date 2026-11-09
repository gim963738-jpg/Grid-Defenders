import { cloneRecipe, createPreset, makeAiPrompt, parseRecipe, STORAGE_KEY, validateRecipe } from '../src/effect-workshop/model';
import { beamPoints, sampleLight, sequenceEnvelope, validateSequence } from '../src/effect-workshop/sequenceModel';
import { createGraph, newNode, syncGraphSources, validateGraph } from '../src/effect-workshop/graphModel';
import { destroyFrames, renderFrame, renderFrames, sheetMetadata } from '../src/effect-workshop/renderer';

export function checkEffectSequence() {
  const passed: string[] = [], check = (ok: boolean, message: string) => { if (!ok) throw Error(message); passed.push(message); };
  const rejects = (fn: () => unknown, message: string) => { let failed = false; try { fn(); } catch { failed = true; } check(failed, message); };
  const r = createPreset('emerald'), s = r.sequence!, t = (seconds: number) => seconds / 3.2;
  check(JSON.stringify(parseRecipe(JSON.stringify(r))) === JSON.stringify(validateRecipe(r)), 'motion tracks, moving beams and explosions round-trip in the editable recipe');
  check(s.lights.filter(l => sequenceEnvelope(t(.15), l.start, l.end, l.fadeIn, l.fadeOut) > 0).every(l => { const p = sampleLight(l, t(.15)); return p.x === .5 && p.y === .5; }), 'the opening light and its two children share the exact center before separating');
  const a = s.lights.find(l => l.id === 'weave-a')!, b = s.lights.find(l => l.id === 'weave-b')!, c = s.lights.find(l => l.id === 'weave-c')!, d = s.lights.find(l => l.id === 'weave-d')!;
  const same = (x: { x: number; y: number }, y: { x: number; y: number }) => Math.hypot(x.x - y.x, x.y - y.y) < 1e-9;
  check(same(sampleLight(a, c.start), sampleLight(c, c.start)) && same(sampleLight(b, d.start), sampleLight(d, d.start)), 'each secondary split is born at the actual parent position');
  const corners = [a, b, c, d].map(l => sampleLight(l, t(1.1)));
  check(new Set(corners.map(p => `${p.x},${p.y}`)).size === 4, 'two lights separate into four distinct points');
  let attached = true;
  for (let frame = 0; frame < 64; frame++) for (const beam of s.beams) {
    const time = frame / 63; if (time < beam.start || time >= beam.end) continue;
    const points = beamPoints(s, beam, time), from = sampleLight(s.lights.find(l => l.id === beam.from)!, time), to = sampleLight(s.lights.find(l => l.id === beam.to)!, time);
    attached &&= Math.hypot(points[0][0] - from.x, points[0][1] - from.y, points.at(-1)![0] - to.x, points.at(-1)![1] - to.y) < 1e-12;
  }
  check(attached, 'every laser endpoint stays exactly attached throughout crossing, convergence and rotation');
  const beam = { ...s.beams[0], bend: .07 }, curved = beamPoints(s, beam, t(1.95)), from = curved[0], to = curved.at(-1)!;
  check(curved.some((p, i) => Math.hypot(p[0] - (from[0] + (to[0] - from[0]) * i / 40), p[1] - (from[1] + (to[1] - from[1]) * i / 40)) > .015), 'laser geometry actually twists between its endpoints instead of showing static straight lines');
  check(JSON.stringify(beamPoints(s, beam, t(1.95))) !== JSON.stringify(beamPoints(s, beam, t(2.0))), 'the braided beam changes continuously over time');
  check([a, b, c, d].every(l => Math.hypot(sampleLight(l, t(2.42)).x - .5, sampleLight(l, t(2.42)).y - .5) < .11), 'all four corners tighten toward the center before the final impact');
  check(sampleLight(a, t(2.88)).rotation >= 720 && Math.hypot(sampleLight(a, t(2.88)).x - .5, sampleLight(a, t(2.88)).y - .5) < .02, 'the final knots rotate and tighten into the center');
  check(Math.abs(s.bursts[0].start - r.placement.impactFrame / r.settings.frames) < 1e-12, 'the impact marker matches the authored burst time and remains separate from damage');
  const frames = renderFrames(r);
  try {
    check(frames.length === 64 && frames.filter(f => f.visible).length > 55 && frames.every(f => !f.touchesEdge), 'the complete 64-frame motion is visible and fits inside safe content bounds');
    check(!frames[0].visible && !frames.at(-1)!.visible, 'the clip opens and ends transparently');
    check(frames.every(f => { const w = f.canvas.width, data = f.canvas.getContext('2d')!.getImageData(0, 0, w, w).data; return Array.from({ length: w }, (_, i) => [data[i * 4 + 3], data[((w - 1) * w + i) * 4 + 3], data[(i * w) * 4 + 3], data[(i * w + w - 1) * 4 + 3]]).flat().every(a => a === 0); }), 'every motion frame has fully transparent padded outer edges');
    check(sheetMetadata(r, 8).sequence?.beams.length === 4 && sheetMetadata(r, 8).sequenceTimeSpace === 'normalized-animation-duration', 'sprite metadata preserves moving-beam authoring data and its time space');
  } finally { destroyFrames(frames); }
  const first = renderFrame(r, 38), second = renderFrame(cloneRecipe(r), 38); check(first.art.url === second.art.url, 'rendering a fixed motion frame is deterministic'); destroyFrames([first, second]);
  const disabled = cloneRecipe(r); disabled.sequence!.enabled = false; const empty = renderFrames(disabled); check(empty.every(f => !f.visible), 'the sequence visibility switch disables all lights, beams and bursts'); destroyFrames(empty);
  const graph = cloneRecipe(r); graph.graph = createGraph(graph); validateRecipe(graph); const direct = renderFrame(r, 38), connected = renderFrame(graph, 38);
  check(direct.art.url === connected.art.url, 'converting the motion to nodes preserves the actual rendered image'); destroyFrames([direct, connected]);
  const sequenceNode = graph.graph.nodes.find(n => n.type === 'sequence')!; graph.graph.links = graph.graph.links.filter(e => e.from !== sequenceNode.id); const disconnected = renderFrame(graph, 38); check(!disconnected.visible, 'a disconnected sequence node cannot bypass the final output'); destroyFrames([disconnected]);
  rejects(() => validateGraph({ ...graph.graph!, nodes: [...graph.graph!.nodes, newNode('sequence')] }, graph), 'imports reject duplicate sequence source nodes');
  delete graph.sequence; syncGraphSources(graph); check(!graph.graph.nodes.some(n => n.type === 'sequence') && !graph.graph.links.some(e => e.from === sequenceNode.id), 'removing a motion plan cleans its stale graph source and edges');
  const maximum = cloneRecipe(r); maximum.sequence!.lightScale = 2; maximum.sequence!.beamScale = 2; maximum.sequence!.glow = 2; const maxFrames = renderFrames(maximum); check(maxFrames.every(f => !f.touchesEdge), 'the exposed size, beam and glow controls remain inside the example bounds at maximum settings'); destroyFrames(maxFrames);
  rejects(() => validateSequence({ ...s, beams: [{ ...s.beams[0], from: 'missing' }] }), 'a moving beam cannot refer to a missing light');
  rejects(() => validateSequence({ ...s, beams: [{ ...s.beams[0], end: 1 }] }), 'a beam cannot outlive its endpoint lights');
  rejects(() => validateSequence({ ...s, lights: [{ ...a, keys: [...a.keys].reverse() }] }), 'unordered motion keys are rejected');
  rejects(() => validateSequence({ ...s, lights: [{ ...a, id: '<img>' }] }), 'motion identifiers cannot inject markup');
  rejects(() => validateSequence({ ...s, lights: [{ ...a, radius: Infinity }] }), 'non-finite light geometry is rejected');
  rejects(() => validateSequence({ ...s, bursts: [{ ...s.bursts[0], particles: 999 }] }), 'burst allocation is bounded');
  check(makeAiPrompt(r, '레이저를 더 굵게').includes('매 프레임 추적'), 'AI handoff describes the new actual beam-tracking capability');
  return passed;
}

export async function checkEffectSequenceUI() {
  const backup = localStorage.getItem(STORAGE_KEY), passed: string[] = [];
  const check = (ok: boolean, message: string) => { if (!ok) throw Error(message); passed.push(message); };
  const q = <T extends HTMLElement = HTMLElement>(s: string) => document.querySelector<T>(s)!;
  const click = (s: string) => q(s).click(), wait = () => new Promise(r => setTimeout(r, 150));
  const state = () => { const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)!); return saved.entries.find((e: { id: string }) => e.id === saved.activeId).recipe; };
  try {
    click('[data-view=editor]'); click('[data-library=presets]'); click('[data-preset=emerald]'); await wait();
    check(state().name === '에메랄드 매듭' && !!state().sequence, 'the requested motion opens as an editable autosaved preset');
    check(!!q('.ws-sequence-properties') && q('#scrubber').getAttribute('max') === '64', 'the workshop exposes motion controls and all 64 frames');
    const input = q<HTMLInputElement>('[data-sequence-prop=beamScale]'); input.value = '1.5'; input.dispatchEvent(new Event('input', { bubbles: true })); await wait();
    check(state().sequence.beamScale === 1.5, 'beam thickness can be edited without JSON');
    click('[data-action=undo]'); await wait(); check(state().sequence.beamScale === 1, 'undo restores the beam thickness');
    click('[data-action=redo]'); await wait(); check(state().sequence.beamScale === 1.5, 'redo reapplies motion controls');
    const enabled = q<HTMLInputElement>('[data-sequence-prop=enabled]'); enabled.checked = false; enabled.dispatchEvent(new Event('change', { bubbles: true })); await wait(); check(!state().sequence.enabled, 'the motion visibility switch persists');
    click('[data-action=undo]'); await wait(); click('[data-view=nodes]'); await wait();
    const node = state().graph.nodes.find((n: { type: string }) => n.type === 'sequence'); check(!!node, 'the moving-light plan is available as a graph image source');
    click(`[data-ng-drag="${node.id}"]`); const glow = q<HTMLInputElement>('[data-ng-sequence=glow]'); glow.value = '1.4'; glow.dispatchEvent(new Event('change', { bubbles: true })); await wait(); check(state().sequence.glow === 1.4, 'motion controls also work in the node property panel');
    click('[data-view=editor]'); click('[data-action=export]'); check(!q<HTMLButtonElement>('[data-action=export-sheet]').disabled, 'the finished motion is eligible for transparent PNG export'); click('[data-action=close-dialog]');
    click('[data-view=drawing]'); click('[data-draw-action=new]'); await wait(); check(!state().sequence, 'a new blank drawing does not accidentally retain the previous motion plan');
    return passed;
  } finally { if (backup === null) localStorage.removeItem(STORAGE_KEY); else localStorage.setItem(STORAGE_KEY, backup); }
}

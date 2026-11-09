import { createPreset, makeAiPrompt, parseRecipe, readLibrary, STORAGE_KEY, validateRecipe, writeLibrary } from '../src/effect-workshop/model';
import { applyDrawingDescription, drawingActor, drawingDuration, drawingExample, drawingSchedule, drawingTime, emptyDrawing, fitDrawingTiming, newStroke, samplePath, validateDrawing } from '../src/effect-workshop/drawingModel';
import { destroyFrames, renderFrame, renderFrames, sheetMetadata } from '../src/effect-workshop/renderer';

export function checkEffectDrawing() {
  const passed: string[] = [], check = (ok: boolean, label: string) => { if (!ok) throw Error(label); passed.push(label); };
  const rejects = (fn: () => unknown, label: string) => { let rejected = false; try { fn(); } catch { rejected = true; } check(rejected, label); };
  const recipe = createPreset('slash'); recipe.drawing = drawingExample(); fitDrawingTiming(recipe);
  const p = recipe.drawing, schedule = drawingSchedule(p), almost = (a: number, b: number) => Math.abs(a - b) < 1e-6;
  check(schedule[0].start === 0 && schedule[1].start === 0 && schedule[0].stroke.role === 'move' && schedule[1].stroke.role === 'slash', 'yellow movement and red sword path share a simultaneous stage');
  check(almost(schedule[2].start, .85) && almost(drawingDuration(p), 1.65), 'blue explosion follows the preceding stage and retains its afterglow');
  check(almost(samplePath([[0, 0], [.1, 0], [1, 0]], .5)[0], .5), 'movement speed follows arc length rather than pointer-sample density');
  check(JSON.stringify(drawingActor(p, -1)) === JSON.stringify(p.strokes[0].points[0]), 'the actor holds the first point before movement');
  check(JSON.stringify(drawingActor(p, 9)) === JSON.stringify(p.strokes[0].points.at(-1)), 'the actor holds the exact final drawn endpoint after movement');
  check(JSON.stringify(drawingActor(p, .425)) === JSON.stringify(samplePath(p.strokes[0].points, .5)), 'actor motion interpolates the actual freehand path at the requested time');
  check(recipe.settings.frames <= 64 && recipe.settings.frames / recipe.settings.fps >= drawingDuration(p) - 1e-6, 'frame timing covers the complete drawn sequence within the export frame budget');
  check(JSON.stringify(parseRecipe(JSON.stringify(recipe)).drawing) === JSON.stringify(validateDrawing(p)), 'drawing coordinates, order and annotations survive recipe JSON round trip');
  let saved = ''; const memory = { getItem: () => saved || null, setItem: (_key: string, value: string) => { saved = value; } };
  writeLibrary(memory, [{ id: 'drawing-test', updatedAt: '2026-11-06T13:00:00Z', recipe }], 'drawing-test');
  check(JSON.stringify(readLibrary(memory).entries[0].recipe.drawing) === JSON.stringify(p), 'browser saving retains every drawing coordinate and timing property');
  const frames = renderFrames(recipe);
  try {
    check(frames.some(f => f.visible) && frames.every(f => !f.touchesEdge), 'the three-color example generates visible VFX inside safe source bounds');
    let clear = true, green = false;
    for (const frame of frames) {
      const w = frame.canvas.width, d = frame.canvas.getContext('2d')!.getImageData(0, 0, w, w).data;
      for (let x = 0; x < w; x++) clear &&= d[x * 4 + 3] === 0 && d[((w - 1) * w + x) * 4 + 3] === 0 && d[x * w * 4 + 3] === 0 && d[(x * w + w - 1) * 4 + 3] === 0;
      for (let i = 0; i < d.length; i += 4) green ||= d[i + 3] > 100 && d[i + 1] > d[i] + 20 && d[i + 1] > d[i + 2] + 10;
    }
    check(clear, 'all generated drawing frames have completely transparent padded outer edges');
    check(green, 'blue guide paths can produce actual green effects rather than guide-colored pixels');
    const meta = sheetMetadata(recipe, 6);
    check(meta.includesActorPixels === false && meta.actorMotion!.length === frames.length && meta.drawing?.strokes.length === 3, 'sheet metadata includes drawing data and independent actor motion without baking actor pixels');
    check(JSON.stringify(meta.actorMotion!.at(-1)!.position) === JSON.stringify(p.strokes[0].points.at(-1)), 'exported movement reaches the exact drawn endpoint');
  } finally { destroyFrames(frames); }
  const onlyMove = structuredClone(recipe); onlyMove.drawing!.strokes = [p.strokes[0]]; fitDrawingTiming(onlyMove);
  const movingFrames = renderFrames(onlyMove); check(movingFrames.every(f => !f.visible), 'yellow guide lines and movement markers are absent from exported VFX pixels'); destroyFrames(movingFrames);
  const field = structuredClone(recipe); field.drawing!.strokes = [newStroke('effect', [[.3, .3], [.7, .3], [.7, .7], [.3, .7]], 1, '#57df94')];
  field.drawing!.strokes[0].style = 'field'; field.drawing!.strokes[0].duration = 1; fitDrawingTiming(field);
  const flat = renderFrame(field, 22); field.drawing!.strokes[0].fold = true; const folded = renderFrame(field, 22);
  check(flat.visible && folded.visible && flat.art.url !== folded.art.url, 'folding visibly deforms the drawn polygon instead of substituting a stock rune'); destroyFrames([flat, folded]);
  const reversed = structuredClone(recipe); reversed.drawing!.strokes[1].points.reverse();
  const normal = renderFrame(recipe, 9), reverse = renderFrame(reversed, 9); check(normal.art.url !== reverse.art.url, 'reversing a sword path reverses its actual progressive rendering'); destroyFrames([normal, reverse]);
  const follow = structuredClone(recipe); follow.drawing!.strokes[1].followActor = true;
  const fixed = renderFrame(recipe, 9), following = renderFrame(follow, 9); check(fixed.art.url !== following.art.url, 'follow-actor mode moves sword VFX with the actor trajectory'); destroyFrames([fixed, following]);
  const disabled = structuredClone(recipe); disabled.drawing!.enabled = false;
  const original = createPreset('slash'); original.settings = { ...disabled.settings };
  const base = renderFrame(original, 7), off = renderFrame(disabled, 7); check(base.art.url === off.art.url, 'disabling drawing restores the original procedural layers unchanged'); destroyFrames([base, off]);
  const described = emptyDrawing(); described.prompt = '노란선 돌진, 빨간선 검로, 파란선 녹색 장판이 접히며 잔상'; described.strokes = [newStroke('effect', [[.3, .3], [.7, .7]], 1)];
  const interpreted = applyDrawingDescription(described);
  check(interpreted.changed === 1 && interpreted.plan.strokes[0].color === '#65ed9a' && interpreted.plan.strokes[0].style === 'field' && interpreted.plan.strokes[0].fold, 'supported description words apply actual effect color, field and fold independently of guide colors');
  described.strokes[0].note = '파란선 끝에서 폭발';
  check(applyDrawingDescription(described).plan.strokes[0].style === 'burst', 'per-line explosion notes override a global field description');
  const unknown = emptyDrawing(); unknown.prompt = '알 수 없는 새로운 묘사'; unknown.strokes = [newStroke('effect', [[.3, .3], [.7, .7]], 1)];
  check(applyDrawingDescription(unknown).changed === 0, 'unknown prose is preserved without silently inventing a different effect');
  const overlap = structuredClone(p); overlap.strokes[0].linger = 3;
  check(almost(drawingSchedule(overlap)[2].start, .85), 'afterglow can overlap later stages without delaying their start');
  const prompt = makeAiPrompt(recipe, '더 강하게'); check(prompt.includes('points') && prompt.includes('followActor') && prompt.includes(JSON.stringify(recipe, null, 2)), 'AI handoff contains the entire drawing and its supported motion schema');
  rejects(() => validateDrawing({ ...p, strokes: [...p.strokes, { ...p.strokes[0], id: 'second-move' }] }), 'ambiguous simultaneous movements of the same actor are rejected');
  rejects(() => validateDrawing({ ...p, strokes: [{ ...p.strokes[0], points: [[-1, 0], [1, 1]] }] }), 'out-of-bounds imported drawing coordinates are rejected');
  rejects(() => validateDrawing({ ...p, strokes: [{ ...p.strokes[0], points: [[0, 0]] }] }), 'incomplete imported paths are rejected');
  rejects(() => validateDrawing({ ...p, strokes: [{ ...p.strokes[0], points: Array.from({ length: 257 }, () => [.5, .5]) }] }), 'unbounded point allocation is rejected');
  rejects(() => validateDrawing({ ...p, strokes: Array.from({ length: 25 }, () => p.strokes[0]) }), 'unbounded stroke allocation is rejected');
  rejects(() => validateDrawing({ ...p, strokes: [{ ...p.strokes[0], id: '\" onclick=alert(1)' }] }), 'markup in drawing IDs cannot enter the editor DOM');
  rejects(() => validateDrawing({ ...p, strokes: [{ ...p.strokes[0], role: '__proto__' }] }), 'unknown or inherited drawing roles are rejected');
  rejects(() => validateDrawing({ ...p, strokes: [{ ...p.strokes[0], duration: NaN }] }), 'non-finite drawing timing is rejected');
  rejects(() => validateRecipe({ ...recipe, settings: { ...recipe.settings, frames: 2, fps: 60 } }), 'an export timeline cannot silently truncate the drawn sequence');
  check(drawingTime(recipe, recipe.settings.frames - 1) >= drawingDuration(p) - 1e-6, 'the final logical frame covers the full movement sequence');
  return passed;
}

export { checkEffectPaintUI as checkEffectDrawingUI } from './effect-paint.check';

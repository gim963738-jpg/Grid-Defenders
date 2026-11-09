import { createPreset, makeAiPrompt, parseRecipe, STORAGE_KEY, validateRecipe } from '../src/effect-workshop/model';
import { actorDirection, drawingActor, drawingDesignExample, drawingDuration, drawingSchedule, emptyDrawing, fitDrawingTiming, geometryPoints, newStroke, reverseStroke, strokeBehavior, validateDrawing, type DrawPoint } from '../src/effect-workshop/drawingModel';
import { destroyFrames, renderFrame, renderFrames, sheetMetadata } from '../src/effect-workshop/renderer';

export function checkEffectPaint() {
  const passed: string[] = [], check = (ok: boolean, message: string) => { if (!ok) throw Error(message); passed.push(message); };
  const rejects = (fn: () => unknown, message: string) => { let fail = false; try { fn(); } catch { fail = true; } check(fail, message); };
  const recipe = createPreset('slash'), unassigned = newStroke('effect', [[.2, .5], [.7, .5]], 1);
  unassigned.purpose = 'unassigned'; unassigned.guideColor = '#f4ce55'; recipe.drawing = { ...emptyDrawing(), strokes: [unassigned] };
  check(strokeBehavior(unassigned) === 'reference' && drawingSchedule(recipe.drawing).length === 0, 'new unassigned lines never become effects or scheduled actions');
  check(drawingActor(recipe.drawing, .5) === null, 'a yellow guide color alone does not move the character');
  const blank = renderFrames(recipe); check(blank.every(f => !f.visible), 'unassigned sketch pixels are excluded from generated PNGs'); destroyFrames(blank);
  check(validateRecipe({ ...recipe, settings: { ...recipe.settings, frames: 2, fps: 60 }, placement: { ...recipe.placement, impactFrame: 2 } }).drawing?.strokes.length === 1, 'reference sketches do not impose an artificial export duration');
  const plan = drawingDesignExample(); recipe.drawing = plan; fitDrawingTiming(recipe);
  check(!actorDirection(plan.strokes[0]) && drawingActor(plan, .5) === null, 'a direction can control an effect rather than the actor');
  check(drawingSchedule(plan).length === 2 && drawingDuration(plan) < 2, 'custom reference notes stay outside the execution schedule');
  const anchors: DrawPoint[] = [[.35, .5], [.5, .25], [.65, .5]], curve = geometryPoints('curve', anchors);
  check(curve.length === 33 && curve[16][0] === .5 && curve[16][1] === .375, 'quadratic curves retain exact endpoints and a genuine bowed midpoint');
  check(JSON.stringify(curve[0]) === JSON.stringify(anchors[0]) && JSON.stringify(curve.at(-1)) === JSON.stringify(anchors[2]), 'curve anchors preserve the drawn start and end');
  check(geometryPoints('line', [anchors[0], anchors[2]]).length === 2, 'straight line geometry ignores intermediate pointer noise');
  const reversed = structuredClone(plan.strokes[1]); reverseStroke(reversed);
  check(JSON.stringify(reversed.anchors![1]) === JSON.stringify(anchors[1]) && JSON.stringify(reversed.points[0]) === JSON.stringify(curve.at(-1)), 'reversing a curve preserves its bend while swapping its ends');
  const roundTrip = parseRecipe(JSON.stringify(recipe));
  check(JSON.stringify(roundTrip.drawing) === JSON.stringify(validateDrawing(plan)), 'purpose, custom meaning, guide color, direction links and curve controls survive JSON import');
  const appearance = structuredClone(recipe); appearance.drawing!.strokes = [structuredClone(plan.strokes[1])]; delete appearance.drawing!.strokes[0].directionId; fitDrawingTiming(appearance);
  const path = structuredClone(appearance); path.drawing!.strokes[0].purpose = 'path';
  const full = renderFrame(appearance, 4), partial = renderFrame(path, 4), endpoint = full.canvas.getContext('2d')!.getImageData(Math.round(24 + .65 * 128), 24 + 64, 1, 1).data;
  check(endpoint[3] > 0 && full.art.url !== partial.art.url, 'finished-appearance mode shows the whole drawn shape rather than progressively tracing it'); destroyFrames([full, partial]);
  const recoloredGuide = structuredClone(appearance); recoloredGuide.drawing!.strokes[0].guideColor = '#70baff';
  const redGuide = renderFrame(appearance, 12), blueGuide = renderFrame(recoloredGuide, 12);
  check(redGuide.art.url === blueGuide.art.url, 'changing the editor guide color does not change actual effect colors'); destroyFrames([redGuide, blueGuide]);
  const fixed = renderFrame(appearance, 20), linked = renderFrame(recipe, 20);
  check(fixed.art.url !== linked.art.url, 'linking an appearance to a direction moves the actual generated shape'); destroyFrames([fixed, linked]);
  const frames = renderFrames(recipe);
  try {
    check(frames.some(f => f.visible) && frames.every(f => !f.touchesEdge), 'the direction-and-appearance example generates visible unclipped animation');
    let clear = true;
    for (const f of frames) { const w = f.canvas.width, data = f.canvas.getContext('2d')!.getImageData(0, 0, w, w).data; for (let i = 0; i < w; i++) clear &&= data[i * 4 + 3] === 0 && data[((w - 1) * w + i) * 4 + 3] === 0 && data[i * w * 4 + 3] === 0 && data[(i * w + w - 1) * 4 + 3] === 0; }
    check(clear, 'all straight/curve example frames keep fully transparent outer padding');
    const metadata = sheetMetadata(recipe, 6);
    check(metadata.drawing?.strokes[1].anchors?.length === 3 && metadata.drawing.strokes[2].meaning === '지면 높이 참고', 'export preserves editable curve controls and non-rendering reference meanings');
  } finally { destroyFrames(frames); }
  const custom = structuredClone(unassigned); custom.purpose = 'custom'; custom.meaning = '빛3의 분열 기준';
  check(strokeBehavior(custom) === 'reference', 'a custom meaning defaults to reference until its application is explicitly selected');
  custom.behavior = 'appearance'; check(strokeBehavior(custom) === 'appearance', 'custom meanings can explicitly opt into finished-appearance rendering');
  const prompt = makeAiPrompt(recipe, '의미를 보존해 다듬어줘');
  check(prompt.includes('directionId') && prompt.includes('anchors') && prompt.includes('appearance') && prompt.includes('지면 높이 참고'), 'AI handoff describes all explicit semantics and preserves reference annotations');
  rejects(() => validateDrawing({ ...plan, strokes: [{ ...plan.strokes[1], anchors: anchors.slice(0, 2) }] }), 'incomplete curve control data is rejected');
  const wrong = structuredClone(plan); wrong.strokes[1].points[4][0] += .1;
  rejects(() => validateDrawing(wrong), 'curve samples cannot silently disagree with the editable control points');
  const missing = structuredClone(plan); missing.strokes[1].directionId = 'missing';
  rejects(() => validateDrawing(missing), 'missing direction links cannot silently change the animation');
  const referenceTarget = structuredClone(plan); referenceTarget.strokes[0].purpose = 'reference';
  rejects(() => validateDrawing(referenceTarget), 'a reference line cannot secretly act as a movement direction');
  const duplicateMotion = structuredClone(plan); duplicateMotion.strokes[1].followActor = true;
  rejects(() => validateDrawing(duplicateMotion), 'direction binding and actor following cannot double-transform a shape');
  rejects(() => validateDrawing({ ...plan, strokes: [{ ...unassigned, purpose: '__proto__' }] }), 'unknown or inherited meanings are rejected');
  rejects(() => validateDrawing({ ...plan, strokes: [{ ...unassigned, guideColor: 'url(invalid)' }] }), 'guide color imports are restricted to safe HEX values');
  return passed;
}

export async function checkEffectPaintUI() {
  const backup = localStorage.getItem(STORAGE_KEY), passed: string[] = [];
  const check = (ok: boolean, label: string) => { if (!ok) throw Error(label); passed.push(label); };
  const get = <T extends HTMLElement = HTMLElement>(s: string) => document.querySelector<T>(s)!;
  const click = (s: string) => get(s).click(), wait = () => new Promise(resolve => setTimeout(resolve, 150));
  const change = (s: string, value: string) => { const input = get<HTMLInputElement>(s); input.value = value; input.dispatchEvent(new Event('change', { bubbles: true })); };
  const state = () => { const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)!); return saved.entries.find((e: { id: string }) => e.id === saved.activeId).recipe; };
  const select = (index: number) => click(`[data-draw-select="${state().drawing.strokes[index].id}"]`);
  const originalCapture = HTMLCanvasElement.prototype.setPointerCapture; HTMLCanvasElement.prototype.setPointerCapture = () => {};
  const gesture = (points: DrawPoint[], cancel = false) => {
    const canvas = get<HTMLCanvasElement>('#drawing-canvas'), rect = canvas.getBoundingClientRect();
    const send = (type: string, p: DrawPoint) => canvas.dispatchEvent(new PointerEvent(type, { pointerId: 1, isPrimary: true, pointerType: 'pen', button: 0, buttons: type === 'pointerup' ? 0 : 1, clientX: rect.left + p[0] * rect.width, clientY: rect.top + p[1] * rect.height, bubbles: true }));
    send('pointerdown', points[0]); points.slice(1).forEach(p => send('pointermove', p)); send(cancel ? 'pointercancel' : 'pointerup', points.at(-1)!);
  };
  try {
    click('[data-view=drawing]'); click('[data-draw-action=new]'); change('#draw-purpose', 'unassigned'); click('[data-draw-tool=line]');
    gesture([[.2, .5], [.4, .3], [.7, .5]]); await wait();
    check(state().drawing.strokes[0].points.length === 2 && state().drawing.strokes[0].tool === 'line', 'straight tool creates an exact two-endpoint line despite a noisy drag');
    check(state().drawing.strokes[0].purpose === 'unassigned', 'drawing alone leaves the new line unassigned');
    click('[data-draw-action=generate]'); check(!get('#drawing-preview').hidden, 'preview refuses to invent an effect for unassigned sketches');
    click('[data-guide-color="#70baff"]'); change('#draw-purpose', 'direction'); gesture([[.25, .6], [.7, .4]]); await wait();
    check(state().drawing.strokes[1].guideColor === '#70baff' && strokeBehavior(state().drawing.strokes[1]) === 'direction', 'a blue line can explicitly mean direction instead of an effect');
    change('[data-draw-prop=directionTarget]', 'effect');
    click('[data-draw-tool=curve]'); change('#draw-purpose', 'unassigned'); gesture([[.35, .5], [.65, .5]]);
    check(state().drawing.strokes.length === 2 && !get<HTMLButtonElement>('[data-draw-action=confirm-curve]').disabled, 'curve tool waits for a bend before saving a line');
    gesture([[.5, .25]]); await wait();
    check(state().drawing.strokes[2].points.length === 33 && state().drawing.strokes[2].anchors[1][1] === .25, 'the second curve gesture saves a real editable quadratic curve');
    change('[data-draw-prop=purpose]', 'appearance'); change('[data-draw-prop=directionId]', state().drawing.strokes[1].id); await wait();
    check(state().drawing.strokes[2].directionId === state().drawing.strokes[1].id && state().drawing.strokes[2].step === state().drawing.strokes[1].step, 'finished appearance can be bound to a separate direction in the same stage');
    select(2); gesture([[.5, .25], [.5, .15]]); await wait();
    check(state().drawing.strokes[2].anchors[1][1] === .15, 'select mode edits the curve bend while keeping its curve geometry');
    click('[data-draw-action=undo]'); await wait(); check(state().drawing.strokes[2].anchors[1][1] === .25, 'drawing-toolbar back restores the previous bend');
    click('[data-draw-action=redo]'); await wait(); check(state().drawing.strokes[2].anchors[1][1] === .15, 'drawing-toolbar redo restores the revised bend');
    click('[data-draw-tool=curve]'); gesture([[.3, .5], [.6, .5]]); click('[data-draw-action=undo]');
    check(state().drawing.strokes.length === 3 && get<HTMLButtonElement>('[data-draw-action=confirm-curve]').disabled, 'back cancels an unfinished curve without undoing a saved line');
    select(2); change('[data-draw-prop=purpose]', 'custom'); change('[data-draw-prop=meaning]', '완성된 빛3 모양'); change('[data-draw-prop=behavior]', 'appearance'); await wait();
    check(state().drawing.strokes[2].meaning === '완성된 빛3 모양' && strokeBehavior(state().drawing.strokes[2]) === 'appearance', 'free-form meanings have a separately selected preview behavior');
    change('[data-draw-prop=meaning]', '<img src=x onerror=alert(1)>');
    check(!get('.wd-selected').querySelector('img'), 'custom meaning markup remains inert text inside the editor');
    change('[data-draw-prop=meaning]', '완성된 빛3 모양'); change('[data-draw-prop=directionId]', state().drawing.strokes[1].id); await wait();
    select(1); click('[data-draw-action=delete]'); await wait();
    check(!state().drawing.strokes[1].directionId, 'deleting a direction safely detaches dependent appearances');
    click('[data-draw-action=undo]'); await wait(); check(!!state().drawing.strokes[2].directionId, 'undo restores the direction and its shape binding together');
    change('#drawing-prompt', '첫 선은 방향이고 곡선은 완성됐을 때의 모습');
    const before = JSON.stringify(state().drawing), countBefore = JSON.parse(localStorage.getItem(STORAGE_KEY)!).entries.length;
    click('[data-draw-action=reset]'); await wait();
    check(state().drawing.strokes.length === 0 && state().drawing.prompt === '' && get<HTMLSelectElement>('#draw-purpose').value === 'unassigned' && get('[data-draw-tool=pen]').getAttribute('aria-pressed') === 'true', 'reset clears the current drawing and description and returns to unassigned freehand drawing');
    check(JSON.parse(localStorage.getItem(STORAGE_KEY)!).entries.length === countBefore, 'reset preserves all other library works');
    click('[data-draw-action=undo]'); await wait(); check(JSON.stringify(state().drawing) === before, 'back restores the complete drawing, meanings and description after reset');
    click('[data-draw-action=redo]'); await wait(); check(state().drawing.strokes.length === 0, 'redo can reapply a reversible reset');
    click('[data-draw-action=undo]'); await wait(); click('[data-draw-action=ai]');
    const prompt = get<HTMLTextAreaElement>('#ai-prompt').value;
    check(prompt.includes('완성된 빛3 모양') && prompt.includes('anchors') && prompt.includes('directionId'), 'AI request includes custom semantics, curves and direction bindings'); click('[data-action=close-dialog]');
    click('[data-draw-action=help]'); check(get('#dialog-body').textContent!.includes('곡선') && get('#dialog-body').textContent!.includes('초기화'), 'in-app help explains the new tools and reversible reset'); click('[data-action=close-dialog]');
    click('[data-draw-action=example]'); await wait();
    check(state().drawing.strokes[1].purpose === 'appearance' && !!state().drawing.strokes[1].directionId, 'new example demonstrates a separately drawn direction and finished appearance');
    click('[data-draw-action=generate]'); await wait(); check(!get('#editor-preview').hidden, 'only explicitly configured lines enter the animation preview');
    return passed;
  } finally { HTMLCanvasElement.prototype.setPointerCapture = originalCapture; if (backup === null) localStorage.removeItem(STORAGE_KEY); else localStorage.setItem(STORAGE_KEY, backup); }
}

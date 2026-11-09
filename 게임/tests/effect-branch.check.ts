import { createPreset, makeAiPrompt, parseRecipe, STORAGE_KEY, validateRecipe, type EffectRecipe } from '../src/effect-workshop/model';
import { actorDirection, directionTarget, drawingActor, drawingSchedule, emptyDrawing, fitDrawingTiming, geometryPoints, newStroke, samplePath, type DrawPoint } from '../src/effect-workshop/drawingModel';
import { createGraph } from '../src/effect-workshop/graphModel';
import { destroyFrames, renderFrame, renderFrames } from '../src/effect-workshop/renderer';

export function branchExample(): EffectRecipe {
  const r = createPreset('heal'); r.name = '같은 점에서 동시에 갈라지는 녹색 빛'; r.drawing = emptyDrawing();
  for (const [i, end] of ([[.27, .73], [.73, .27]] as DrawPoint[]).entries()) {
    const d = newStroke('effect', [[.5, .5], end], 1); d.purpose = 'direction'; d.directionTarget = 'effect'; d.duration = 1; d.linger = .1; d.tool = 'line'; d.anchors = geometryPoints('line', d.points); d.meaning = `빛${i + 1} 이동 방향`; d.guideColor = i ? '#ff777b' : '#f4ce55';
    const shape = newStroke('effect', [[.47, .5], [.5, .47], [.53, .5], [.5, .53]], 1, i ? '#4cce8a' : '#9af4b7'); shape.purpose = 'appearance'; shape.meaning = `빛${i + 1} 모양`; shape.style = 'field'; shape.directionId = d.id; shape.duration = 1; shape.linger = .1;
    r.drawing.strokes.push(d, shape);
  }
  r.drawing.prompt = '두 빛이 중앙의 같은 점에서 동시에 출발해 왼쪽 아래와 오른쪽 위로 갈라집니다.'; fitDrawingTiming(r); return r;
}
export function checkEffectBranch() {
  const passed: string[] = [], check = (ok: boolean, message: string) => { if (!ok) throw Error(message); passed.push(message); };
  const r = branchExample(), a = r.drawing!.strokes[0], b = r.drawing!.strokes[2];
  delete a.directionTarget; delete b.directionTarget;
  check(directionTarget(a) === 'effect' && !actorDirection(a), 'a modern direction authored with the effect role defaults to an effect rather than an actor');
  const parsed = parseRecipe(JSON.stringify(r));
  check(parsed.drawing!.strokes.filter(s => s.purpose === 'direction').every(s => s.directionTarget === 'effect'), 'saved directions without a target reopen as independent VFX directions');
  check(drawingSchedule(parsed.drawing!).every(s => s.start === 0), 'multiple directions and appearances can depart in the exact same stage with zero delay');
  check(drawingActor(parsed.drawing, .5) === null, 'splitting VFX directions do not invent character movement');
  check(JSON.stringify(samplePath(a.points, 0)) === JSON.stringify(samplePath(b.points, 0)) && JSON.stringify(samplePath(a.points, .5)) !== JSON.stringify(samplePath(b.points, .5)), 'two paths keep an identical origin and different destinations');
  const legacy = newStroke('move', [[.5, .5], [.3, .7]], 1);
  check(actorDirection(legacy), 'legacy move paths retain their original actor motion');
  const explicit = structuredClone(parsed); explicit.drawing!.strokes[0].directionTarget = 'actor';
  check(!!validateRecipe(explicit).drawing && drawingActor(explicit.drawing, .5) !== null, 'an explicitly selected actor path remains supported alongside independent effect paths');
  explicit.drawing!.strokes[2].directionTarget = 'actor'; let rejected = false;
  try { validateRecipe(explicit); } catch (error) { rejected = (error as Error).message.includes('분열'); }
  check(rejected, 'ambiguous dual motion of one actor still reports how to use independent effect directions');
  const frames = renderFrames(parsed);
  try {
    check(frames.every(f => !f.touchesEdge) && frames.some(f => f.visible), 'all branch-animation frames stay visible inside transparent source bounds');
    const f = frames[Math.floor(frames.length / 2)], ctx = f.canvas.getContext('2d')!, time = Math.floor(frames.length / 2) / (frames.length - 1) * frames.length / parsed.settings.fps;
    const alpha = (p: DrawPoint) => ctx.getImageData(24 + Math.round(p[0] * parsed.settings.size), 24 + Math.round(p[1] * parsed.settings.size), 1, 1).data[3];
    check(alpha(samplePath(a.points, time)) > 20 && alpha(samplePath(b.points, time)) > 20, 'both independently linked lights are present in the same exported frame');
  } finally { destroyFrames(frames); }
  parsed.graph = createGraph(parsed); const graphFrame = renderFrame(parsed, 16); check(graphFrame.visible && parsed.graph.links.filter(e => e.port === 'direction').length === 2, 'the node graph preserves both concurrent direction-to-shape branches'); destroyFrames([graphFrame]);
  check(makeAiPrompt(parsed, '분기 유지').includes('같은 시작 좌표'), 'AI handoff includes same-origin simultaneous branch rules');
  return passed;
}

/** Run only on a separate QA origin; preserves the pre-existing library. */
export async function checkEffectBranchUI() {
  const backup = localStorage.getItem(STORAGE_KEY), passed: string[] = [];
  const check = (ok: boolean, message: string) => { if (!ok) throw Error(message); passed.push(message); };
  const get = <T extends HTMLElement = HTMLElement>(s: string) => document.querySelector<T>(s)!;
  const click = (s: string) => get(s).click(), wait = () => new Promise(resolve => setTimeout(resolve, 150));
  const change = (s: string, value: string) => { const e = get<HTMLInputElement>(s); e.value = value; e.dispatchEvent(new Event('change', { bubbles: true })); };
  const state = (): EffectRecipe => { const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)!); return saved.entries.find((e: { id: string }) => e.id === saved.activeId).recipe; };
  const originalCapture = HTMLCanvasElement.prototype.setPointerCapture; HTMLCanvasElement.prototype.setPointerCapture = () => {};
  const gesture = (points: DrawPoint[], cancelled = false, alt = false) => {
    const c = get<HTMLCanvasElement>('#drawing-canvas'), rect = c.getBoundingClientRect();
    const send = (type: string, p: DrawPoint) => c.dispatchEvent(new PointerEvent(type, { pointerId: 10, isPrimary: true, pointerType: 'pen', button: 0, buttons: type === 'pointerup' ? 0 : 1, clientX: rect.x + p[0] * rect.width, clientY: rect.y + p[1] * rect.height, altKey: alt, bubbles: true }));
    send('pointerdown', points[0]); points.slice(1).forEach(p => send('pointermove', p)); send(cancelled ? 'pointercancel' : 'pointerup', points.at(-1)!);
  };
  const select = (index: number) => click(`[data-draw-select="${state().drawing!.strokes[index].id}"]`);
  try {
    // The exact shape of the user's failing saved direction: effect role, no explicit target.
    const r = createPreset('heal'); r.drawing = emptyDrawing(); const first = newStroke('effect', [[.5013, .4974], [.7977, .201]], 1); first.purpose = 'direction'; first.tool = 'line'; first.anchors = first.points.map(p => [...p]); r.drawing.strokes.push(first); fitDrawingTiming(r);
    click('[data-action=import]'); get<HTMLTextAreaElement>('#import-text').value = JSON.stringify(r); click('[data-action=import-text]'); click('[data-view=drawing]'); await wait();
    select(0); check(get<HTMLSelectElement>('[data-draw-prop=directionTarget]').value === 'effect', 'the previously failing saved direction now opens as an effect direction');
    click('[data-draw-tool=line]'); change('#draw-purpose', 'direction'); change('#draw-together', 'same');
    gesture([[.506, .501], [.25, .75]]); await wait();
    check(state().drawing!.strokes.length === 2, 'a second same-stage direction saves instead of hitting the actor-motion restriction');
    check(JSON.stringify(state().drawing!.strokes[0].points[0]) === JSON.stringify(state().drawing!.strokes[1].points[0]), 'a nearby same-stage start snaps to the exact saved first point');
    check(state().drawing!.strokes[1].directionTarget === 'effect' && state().drawing!.strokes[1].step === 1 && state().drawing!.strokes[1].delay === 0, 'both directions have independent VFX targets and identical departure timing');
    click('[data-draw-action=undo]'); await wait(); check(state().drawing!.strokes.length === 1, 'undo removes only the newly drawn branch');
    click('[data-draw-action=redo]'); await wait(); check(state().drawing!.strokes.length === 2, 'redo restores the exact branch');
    select(1); const origin = state().drawing!.strokes[0].points[0]; gesture([origin, [.54, .53]]); await wait();
    check(JSON.stringify(state().drawing!.strokes[0].points[0]) === JSON.stringify(origin) && state().drawing!.strokes[1].points[0][0] === .54, 'editing coincident endpoints honors the selected line rather than always moving the first line');
    click('[data-draw-action=undo]'); await wait(); select(1); change('[data-draw-prop=step]', '3'); select(0);
    click('[data-draw-action=branch]'); check(get('[data-draw-tool=line]').getAttribute('aria-pressed') === 'true' && !!get('.wd-branch-note'), 'branch action switches from point editing into drawing with a fixed source origin');
    gesture([[.6, .6], [.3, .3]]); await wait();
    const third = state().drawing!.strokes[2];
    check(third.step === 1 && JSON.stringify(third.points[0]) === JSON.stringify(origin), 'explicit branch uses the selected source origin and stage rather than the latest stage or pointer-down position');
    check(third.delay === 0 && !get('.wd-branch-note'), 'a completed branch departs with zero delay and exits fixed-origin mode');
    select(0); click('[data-draw-action=branch]'); click('[data-draw-action=cancel-branch]'); check(state().drawing!.strokes.length === 3 && !get('.wd-branch-note'), 'cancelling a pending branch preserves all existing artwork');
    select(0); click('[data-draw-action=branch]'); gesture([[.5, .5], [.7, .6]], true); await wait(); check(state().drawing!.strokes.length === 3 && !get('.wd-branch-note'), 'pointer cancellation never leaves a half-created branch');
    select(0); click('[data-draw-action=branch]'); click('[data-draw-action=undo]'); await wait(); check(state().drawing!.strokes.length === 3, 'back first cancels a pending branch without undoing saved artwork');
    click('[data-draw-tool=curve]'); change('#draw-together', 'same'); gesture([[.505, .501], [.65, .55]]); gesture([[.55, .3]]); await wait();
    const curve = state().drawing!.strokes[3]; check(curve.points.length === 33 && JSON.stringify(curve.anchors![0]) === JSON.stringify(origin), 'the same-origin snap also preserves the exact start of a two-stage curve');
    click('[data-draw-tool=line]'); gesture([[.51, .505], [.7, .7]], false, true); await wait(); check(JSON.stringify(state().drawing!.strokes[4].points[0]) === JSON.stringify([.51, .505]), 'Alt permits a deliberately separate nearby origin');
    select(0); change('[data-draw-prop=delay]', '.3'); click('[data-draw-action=branch]'); gesture([[.5, .5], [.3, .5]]); await wait();
    check(state().drawing!.strokes[5].delay === .3 && drawingSchedule(state().drawing!).find(e => e.stroke.id === state().drawing!.strokes[5].id)!.start === drawingSchedule(state().drawing!).find(e => e.stroke.id === state().drawing!.strokes[0].id)!.start, 'branching a delayed source copies its delay so both paths still depart at exactly the same time');
    click('[data-draw-action=help]'); check(get('#dialog-body').textContent!.includes('같은 시작점에서 분기'), 'in-app help explains the new branch operation'); click('[data-action=close-dialog]');
    return passed;
  } finally { HTMLCanvasElement.prototype.setPointerCapture = originalCapture; if (backup === null) localStorage.removeItem(STORAGE_KEY); else localStorage.setItem(STORAGE_KEY, backup); }
}

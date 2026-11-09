import { cloneRecipe, createPreset, parseRecipe, validateRecipe } from '../src/effect-workshop/model';
import { reverseStroke, strokeFadeOpacity } from '../src/effect-workshop/drawingModel';
import { renderDrawing } from '../src/effect-workshop/drawingRender';
import { createGraph } from '../src/effect-workshop/graphModel';
import { canvas, destroyFrames, renderFrame, renderFrames } from '../src/effect-workshop/renderer';

export function checkHorizontalFade() {
  const passed: string[] = [], check = (ok: boolean, message: string) => { if (!ok) throw Error(message); passed.push(message); };
  const r = createPreset('horizontal'), plan = r.drawing!, fade = plan.strokes[0].fadeAlong!;
  check(plan.strokes.length === 2 && plan.strokes.every(s => s.purpose === 'appearance' && s.style !== 'orb'), 'the effect contains only the scar and its core, with no growing paths or moving dots');
  check(strokeFadeOpacity(fade, 0, 0) === 1 && strokeFadeOpacity(fade, 0, 1) === 1, 'the entire mark appears together before spatial fading begins');
  check(strokeFadeOpacity(fade, .5, .1) === 0 && strokeFadeOpacity(fade, .5, .9) === 1, 'fading advances from the start toward the far end');
  check(strokeFadeOpacity(fade, 1, 0) === 0 && strokeFadeOpacity(fade, 1, 1) === 0, 'the spatial fade eventually removes the full line');
  check(JSON.stringify(parseRecipe(JSON.stringify(r))) === JSON.stringify(validateRecipe(r)), 'the spatial fade axis, timing and soft edge survive editable JSON import');
  const alpha = (frame: ReturnType<typeof renderFrame>, x: number) => frame.canvas.getContext('2d')!.getImageData(24 + Math.round(x * r.settings.size), 24 + r.settings.size / 2, 1, 1).data[3];
  const frames = renderFrames(r), early = Math.ceil((frames.length - 1) * .1), middle = Math.round((frames.length - 1) * .51);
  try {
    check(alpha(frames[early], .25) > 200 && alpha(frames[early], .75) > 200, 'early frames show the complete scar strongly across its length');
    check(alpha(frames[middle], .25) === 0 && alpha(frames[middle], .75) > 100, 'actual exported pixels erase the starting side while preserving the far side');
    check(!frames[0].visible && !frames.at(-1)!.visible && frames.every(f => !f.touchesEdge), `all ${frames.length} frames preserve transparent endpoints and safe source margins`);
    check(frames.slice(early + 1).every((f, i) => alpha(f, .25) <= alpha(frames[early + i], .25) + 1), 'the erased starting side does not reappear later');
  } finally { destroyFrames(frames); }
  const background = canvas(r.settings.size), ctx = background.getContext('2d')!; ctx.fillStyle = '#ff0000'; ctx.fillRect(0, 0, 24, 24);
  renderDrawing(ctx, plan, r.settings.frames / r.settings.fps * .5, r.settings.size); const corner = ctx.getImageData(10, 10, 1, 1).data;
  check(corner[0] === 255 && corner[3] === 255, 'the per-stroke fade never erases unrelated artwork already on the canvas');
  const reverse = cloneRecipe(r); reverse.drawing!.strokes.forEach(reverseStroke); const reversedFrame = renderFrame(reverse, middle);
  check(alpha(reversedFrame, .25) > 100 && alpha(reversedFrame, .75) === 0, 'reversing the mark also reverses its fade direction'); destroyFrames([reversedFrame]);
  const graph = cloneRecipe(r); graph.graph = createGraph(graph); const nodeFrame = renderFrame(graph, middle);
  check(alpha(nodeFrame, .25) === 0 && alpha(nodeFrame, .75) > 100, 'the same spatial fade is preserved through node output'); destroyFrames([nodeFrame]);
  const bad = cloneRecipe(r); bad.drawing!.strokes[0].fadeAlong!.to = [...fade.from]; let rejected = false;
  try { validateRecipe(bad); } catch { rejected = true; } check(rejected, 'a zero-length fade axis is rejected before canvas rendering');
  return passed;
}

import { FORMAT, MAX_FILE_BYTES, PRESET_INFO, STORAGE_KEY, cloneRecipe, createPreset, makeAiPrompt, parseRecipe, readLibrary, validateRecipe, writeLibrary } from '../src/effect-workshop/model';
import { createSheet, destroyFrames, renderFrame, renderFrames, sheetMetadata } from '../src/effect-workshop/renderer';
import { SKILL_FRAME_PADDING, skillFramePlacement } from '../src/skillVisual';

export function checkEffectWorkshop() {
  const passed: string[] = [];
  const check = (ok: boolean, message: string) => { if (!ok) throw Error(message); passed.push(message); };
  const rejects = (fn: () => unknown, message: string) => { let rejected = false; try { fn(); } catch { rejected = true; } check(rejected, message); };
  for (const preset of PRESET_INFO) {
    const recipe = createPreset(preset.id), stable = JSON.stringify(recipe);
    check(JSON.stringify(parseRecipe(stable)) === JSON.stringify(validateRecipe(recipe)), `${preset.id}: editable JSON round trip preserves the recipe`);
    const frames = renderFrames(recipe);
    try {
      check(frames.length === recipe.settings.frames && frames.some(f => f.visible), `${preset.id}: every logical frame renders and the effect is visible`);
      check(frames.every(f => !f.touchesEdge), `${preset.id}: all frames stay clear of the source extraction boundary`);
      let transparent = true;
      for (const frame of frames) {
        const { width, height } = frame.canvas, pixels = frame.canvas.getContext('2d')!.getImageData(0, 0, width, height).data;
        for (let x = 0; x < width; x++) transparent &&= pixels[x * 4 + 3] === 0 && pixels[((height - 1) * width + x) * 4 + 3] === 0;
        for (let y = 0; y < height; y++) transparent &&= pixels[y * width * 4 + 3] === 0 && pixels[(y * width + width - 1) * 4 + 3] === 0;
      }
      check(transparent && frames.every(f => f.canvas.width === recipe.settings.size + SKILL_FRAME_PADDING * 2), `${preset.id}: the full 24px gutter has transparent outer edges`);
      check(!frames[0].visible && !frames.at(-1)!.visible, `${preset.id}: transparent start and end avoid a hard loop cut`);
      const sheet = createSheet(frames, 6), metadata = sheetMetadata(recipe, 6), cell = recipe.settings.size + 48;
      const last = frames.length - 1;
      check(sheet.width === cell * 6 && sheet.height === cell * Math.ceil(frames.length / 6) && metadata.frames.at(-1)!.x === cell * (last % 6) && metadata.frames.at(-1)!.y === cell * Math.floor(last / 6), `${preset.id}: exported sheet and logical frame coordinates agree`);
      check(metadata.impactTimeMs === recipe.placement.impactFrame / recipe.settings.fps * 1000 && metadata.impactSemantics === 'frame-complete-marker-only', `${preset.id}: impact timing is a one-based frame-completion marker, without combat damage`);
      const art = frames[6].art, p = skillFramePlacement(art, 170, 128, recipe.placement.displaySize), scale = recipe.placement.displaySize / recipe.settings.size;
      check(Math.abs(p.x - p.width * p.anchorX + (24 + recipe.placement.pivotX * recipe.settings.size) * scale - 170) < 1e-7 && Math.abs(p.y - p.height * p.anchorY + (24 + recipe.placement.pivotY * recipe.settings.size) * scale - 128) < 1e-7, `${preset.id}: padding preserves the exact battle pivot and uniform content scale`);
      check(JSON.stringify(recipe) === stable, `${preset.id}: rendering does not mutate the editable recipe`);
    } finally { destroyFrames(frames); }
  }
  const recipe = createPreset('slash'), first = renderFrame(recipe, 7), second = renderFrame(cloneRecipe(recipe), 7);
  check(first.canvas.toDataURL() === second.canvas.toDataURL(), 'same seed and frame reproduce identical PNG pixels');
  const different = cloneRecipe(recipe); different.layers.find(l => l.type === 'particles')!.seed++;
  const differentFrame = renderFrame(different, 7);
  check(first.canvas.toDataURL() !== differentFrame.canvas.toDataURL(), 'particle seed changes the rendered trajectory');
  destroyFrames([first, second, differentFrame]);
  const bad = createPreset('explosion'); bad.layers[0].x = .02; const edge = renderFrame(bad, 7);
  check(edge.touchesEdge, 'moving artwork beyond the source edge is reported rather than hidden by extra padding'); destroyFrames([edge]);
  const pivotRecipe = cloneRecipe(recipe); pivotRecipe.placement.pivotX = .1; pivotRecipe.placement.pivotY = .9;
  const pivot = renderFrame(pivotRecipe, 7), p = skillFramePlacement(pivot.art, 23, 41, 96);
  check(Math.abs(p.x - p.width * p.anchorX + (24 + 128 * .1) * .75 - 23) < 1e-7 && Math.abs(p.y - p.height * p.anchorY + (24 + 128 * .9) * .75 - 41) < 1e-7, 'off-center pivots survive padding and battle display-size changes'); destroyFrames([pivot]);
  for (const pixelSize of [2, 4]) {
    const pixel = cloneRecipe(recipe); pixel.settings.pixelSize = pixelSize;
    const frame = renderFrame(pixel, 7); check(frame.visible && !frame.touchesEdge && frame.canvas.width === 176, `${pixelSize}px pixel style preserves source dimensions and safe bounds`); destroyFrames([frame]);
  }
  const extras = { ...recipe, code: 'never-run', url: 'https://example.invalid' };
  check(!('code' in validateRecipe(extras)) && !('url' in validateRecipe(extras)), 'unsupported imported fields are stripped, never executed or fetched');
  rejects(() => parseRecipe('{'), 'invalid JSON reports a parsing error');
  rejects(() => parseRecipe(' '.repeat(MAX_FILE_BYTES + 1)), 'oversized pasted JSON is rejected before parsing');
  rejects(() => validateRecipe({ ...recipe, format: 'pxf.graph@1' }), 'PXF graphs are explicitly rejected rather than silently misrendered');
  rejects(() => validateRecipe({ ...recipe, settings: { ...recipe.settings, frames: 999 } }), 'unbounded frame allocation is rejected');
  rejects(() => validateRecipe({ ...recipe, settings: { ...recipe.settings, size: 255, pixelSize: 4 } }), 'incompatible pixel grid and source dimensions are rejected');
  rejects(() => validateRecipe({ ...recipe, placement: { ...recipe.placement, impactFrame: 0 } }), 'frame zero cannot be used as an impact marker');
  rejects(() => validateRecipe({ ...recipe, palette: ['red', '#ffffff', '#ffffff'] }), 'non-hex palette values are rejected');
  rejects(() => validateRecipe({ ...recipe, layers: [] }), 'an empty layer graph is rejected');
  rejects(() => validateRecipe({ ...recipe, layers: Array.from({ length: 13 }, () => recipe.layers[0]) }), 'unbounded layer allocation is rejected');
  rejects(() => validateRecipe({ ...recipe, layers: [recipe.layers[0], recipe.layers[0]] }), 'duplicate layer IDs are rejected');
  rejects(() => validateRecipe({ ...recipe, layers: [{ ...recipe.layers[0], start: .8, end: .2 }] }), 'reversed animation intervals are rejected');
  rejects(() => validateRecipe({ ...recipe, layers: [{ ...recipe.layers[0], radius: NaN }] }), 'non-finite numeric values are rejected');
  rejects(() => validateRecipe({ ...recipe, layers: [{ ...recipe.layers[0], id: '\"><img onerror=alert(1)>' }] }), 'markup in imported layer identifiers is rejected');
  let stored = ''; const memory = { getItem: (key: string) => key === STORAGE_KEY ? stored || null : null, setItem: (_key: string, value: string) => { stored = value; } };
  const entry = { id: 'test-effect', updatedAt: '2026-11-06T12:00:00Z', recipe };
  writeLibrary(memory, [entry], entry.id);
  check(readLibrary(memory).activeId === entry.id && readLibrary(memory).entries[0].recipe.format === FORMAT, 'browser persistence retains the selected editable work');
  const before = stored; const brokenStorage = { getItem: () => '{broken', setItem: () => { throw Error('must not overwrite'); } };
  rejects(() => readLibrary(brokenStorage), 'corrupt storage is surfaced without replacing original content'); check(stored === before, 'a read failure does not write to storage');
  rejects(() => writeLibrary({ setItem: () => { throw new DOMException('full', 'QuotaExceededError'); } }, [entry], entry.id), 'storage quota failures remain observable to the UI');
  const prompt = makeAiPrompt(recipe, '푸른 얼음 참격');
  check(prompt.includes('푸른 얼음 참격') && prompt.includes(FORMAT) && prompt.includes(JSON.stringify(recipe, null, 2)), 'AI handoff contains the requested edit, exact schema and complete current recipe');
  const meta = sheetMetadata(recipe, 99);
  check(meta.columns === recipe.settings.frames && meta.rows === 1 && meta.frames[0].pivot.x === 88, 'export column count is bounded and metadata includes source-space pivots');
  return passed;
}

/** Every frame of every preset, including recipes longer than 24 frames. */
export function renderWorkshopContactSheet(): string {
  const heights = PRESET_INFO.map(p => Math.ceil(createPreset(p.id).settings.frames / 12) * 136);
  const sheet = document.createElement('canvas'); sheet.width = 1536; sheet.height = heights.reduce((a, b) => a + b, 0);
  const ctx = sheet.getContext('2d')!;
  PRESET_INFO.forEach((preset, group) => {
    const frames = renderFrames(createPreset(preset.id));
    frames.forEach((frame, i) => {
      const x = i % 12 * 128, y = heights.slice(0, group).reduce((a, b) => a + b, 0) + Math.floor(i / 12) * 136;
      ctx.fillStyle = group % 2 ? '#d5d8db' : '#9acb8f'; ctx.fillRect(x, y, 128, 136);
      ctx.drawImage(frame.canvas, x + 8, y + 2, 112, 112); ctx.fillStyle = '#26382b'; ctx.font = '11px system-ui'; ctx.fillText(`${preset.id} ${i + 1}F`, x + 8, y + 128);
    });
    destroyFrames(frames);
  });
  return sheet.toDataURL();
}

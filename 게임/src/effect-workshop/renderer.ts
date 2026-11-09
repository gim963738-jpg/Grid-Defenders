import { createSkillFrame, padSkillFrameCanvas, SKILL_FRAME_PADDING, type SkillFrameArt } from '../skillVisual';
import type { EffectLayer, EffectRecipe } from './model';
import { renderDrawing } from './drawingRender';
import { drawingActor, drawingTime, drawingSchedule, samplePath, strokeBehavior } from './drawingModel';
import { evaluateGraph } from './graphRender';
import type { EffectNode } from './graphModel';
import { renderSequence } from './sequenceRender';
import { drawMovementLayer } from './movementRender';
import { drawFlameJet } from './flamethrower';

export interface EffectFrame { canvas: HTMLCanvasElement; art: SkillFrameArt; touchesEdge: boolean; visible: boolean; index: number }
export const canvas = (width: number, height = width): HTMLCanvasElement => {
  const c = document.createElement('canvas'); c.width = width; c.height = height; return c;
};
const radians = (degrees: number) => degrees * Math.PI / 180;
const easeOut = (t: number) => 1 - (1 - t) ** 3;
function random(seed: number): () => number {
  let n = seed | 0;
  return () => { n = (n + 0x6D2B79F5) | 0; let t = Math.imul(n ^ n >>> 15, 1 | n); t ^= t + Math.imul(t ^ t >>> 7, 61 | t); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
function star(ctx: CanvasRenderingContext2D, tips: number, radius: number, inner: number): void {
  ctx.beginPath();
  for (let i = 0; i < tips * 2; i++) { const a = i * Math.PI / tips, r = i % 2 ? inner : radius; if (!i) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r); else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
  ctx.closePath(); ctx.fill();
}
function drawLayer(ctx: CanvasRenderingContext2D, l: EffectLayer, recipe: EffectRecipe, time: number, size: number): void {
  if (!l.enabled || time < l.start || time > l.end) return;
  const t = (time - l.start) / (l.end - l.start), grow = easeOut(t), fade = l.type === 'jet' ? Math.max(0,Math.min(1,t*25,(1-t)*25)) : Math.min(1, t * 14) * (1 - t) ** .65;
  if (fade <= 0) return;
  const r = l.radius * size, thick = Math.max(.6, l.thickness * size), rand = random(l.seed);
  const color = recipe.palette[l.color], highlight = recipe.palette[2];
  ctx.save(); ctx.translate(l.x * size, l.y * size); ctx.rotate(radians(l.rotation));
  ctx.globalCompositeOperation = l.blend === 'add' ? 'lighter' : 'source-over';
  ctx.globalAlpha = l.opacity * fade; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = thick;
  switch (l.type) {
    case 'jet': { drawFlameJet(ctx,l,recipe.palette,t,size,rand); break; }
    case 'dust': case 'wind': case 'splash': {
      drawMovementLayer(ctx, l, recipe.palette, t, size, rand); break;
    }
    case 'slash': {
      ctx.scale(1, .65);
      const sweep = radians(l.spread), head = -sweep / 2 + sweep * Math.min(1, t * 2.2), tail = Math.max(-sweep / 2, head - sweep * (.52 - t * .22));
      for (let pass = 0; pass < 3; pass++) {
        ctx.strokeStyle = pass === 2 ? highlight : pass === 1 ? recipe.palette[1] : color;
        for (let i = 0; i < 28; i++) {
          const a = tail + (head - tail) * i / 28, b = tail + (head - tail) * (i + 1) / 28;
          ctx.lineWidth = Math.max(.5, thick * (pass === 0 ? 1.7 : pass === 1 ? 1 : .3) * ((i + 1) / 28) ** .8);
          ctx.beginPath(); ctx.arc(0, 0, r, a, b); ctx.stroke();
        }
      }
      break;
    }
    case 'burst': {
      const radius = r * (.35 + grow * .65);
      const inner = .08 + l.thickness * 3;
      ctx.rotate(t * .15); star(ctx, l.amount, radius, radius * inner);
      ctx.fillStyle = highlight; star(ctx, l.amount, radius * .72, radius * inner * .45);
      break;
    }
    case 'ring': {
      ctx.scale(1, .65);
      const radius = r * (.15 + grow * .85);
      ctx.lineWidth = thick * (1 - t * .8); ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha *= .3; ctx.lineWidth = thick * 2.5; ctx.stroke();
      break;
    }
    case 'particles': {
      for (let i = 0; i < l.amount; i++) {
        const a = (rand() - .5) * radians(l.spread), origin = rand() * r * .65;
        const speed = (.35 + rand() * .65) * l.speed, delay = rand() * .2, age = Math.max(0, (t - delay) / (1 - delay));
        const length = size * (.006 + rand() * .014) * (1 - age * .65);
        const distance = origin + age * size * .14 * speed;
        const x = Math.cos(a) * distance, y = Math.sin(a) * distance + age * age * size * .035;
        ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.globalAlpha *= (1 - age) ** .5;
        ctx.fillStyle = i % 4 === 0 ? highlight : color;
        ctx.beginPath(); ctx.moveTo(length * 2.5, 0); ctx.lineTo(0, length); ctx.lineTo(-length * 2.5, 0); ctx.lineTo(0, -length); ctx.closePath(); ctx.fill(); ctx.restore();
      }
      break;
    }
    case 'rune': {
      ctx.scale(1, .65); ctx.rotate(t * l.speed);
      const radius = r * (.8 + grow * .2), sides = l.amount;
      ctx.lineWidth = thick;
      ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, radius * .78, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath();
      for (let i = 0; i <= sides; i++) { const a = i * Math.PI * 2 / sides; if (!i) ctx.moveTo(Math.cos(a) * radius * .7, Math.sin(a) * radius * .7); else ctx.lineTo(Math.cos(a) * radius * .7, Math.sin(a) * radius * .7); }
      ctx.stroke();
      for (let i = 0; i < sides; i++) { ctx.save(); ctx.rotate(i * Math.PI * 2 / sides); ctx.fillRect(radius * .86, -thick * 1.8, thick, thick * 3.6); ctx.restore(); }
      ctx.rotate(-t * l.speed * 2); ctx.beginPath(); ctx.moveTo(-radius * .45, 0); ctx.lineTo(radius * .45, 0); ctx.moveTo(0, -radius * .45); ctx.lineTo(0, radius * .45); ctx.stroke();
      break;
    }
    case 'flame': {
      for (let i = 0; i < l.amount; i++) {
        const jitter = rand(), offset = (rand() - .5) * r * 1.3, width = r * (.16 + rand() * .2);
        const height = r * (1 + rand() * .7) * (.6 + grow * .4);
        const sway = Math.sin(t * 12 * l.speed + jitter * 8) * r * .16;
        ctx.beginPath(); ctx.moveTo(offset - width, r * .13);
        ctx.bezierCurveTo(offset - width * 1.4, -height * .25, offset + sway - width * .3, -height * .5, offset + sway, -height);
        ctx.bezierCurveTo(offset + sway + width * .25, -height * .45, offset + width * 1.3, -height * .3, offset + width, r * .13);
        ctx.closePath(); ctx.fillStyle = i % 3 === 0 ? recipe.palette[1] : color; ctx.fill();
      }
      ctx.fillStyle = highlight; ctx.beginPath(); ctx.ellipse(0, 0, r * .28, r * .16, 0, 0, Math.PI * 2); ctx.fill();
      break;
    }
  }
  ctx.restore();
}
function renderGraph(recipe: EffectRecipe, index: number, allNodes = false) {
  const graph = recipe.graph!, size = recipe.settings.size / recipe.settings.pixelSize;
  const time = Math.max(0, Math.min(recipe.settings.frames - 1, index)) / (recipe.settings.frames - 1), seconds = drawingTime(recipe, index);
  return evaluateGraph(graph, size, time, (node: EffectNode) => {
    const image = canvas(size), ctx = image.getContext('2d')!;
    const edge = graph.links.find(e => e.to === node.id && e.port === 'direction');
    const directionNode = graph.nodes.find(n => n.id === edge?.from);
    const direction = recipe.drawing?.strokes.find(s => s.id === directionNode?.sourceId && strokeBehavior(s) === 'direction');
    if (node.type === 'component' && node.component) {
      const child = node.component.recipe;
      // A self-contained source preserves its own palette, pixel size and drawing schedule.
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(renderCore(child, time * (child.settings.frames - 1)), 0, 0, size, size);
    } else if (node.type === 'sequence') renderSequence(ctx, recipe.sequence, recipe.palette, time, size);
    else if (node.type === 'layer') {
      const layer = recipe.layers.find(l => l.id === node.sourceId);
      if (layer) {
        const entry = recipe.drawing?.enabled && direction ? drawingSchedule(recipe.drawing).find(e => e.stroke.id === direction.id) : undefined;
        if (entry) {
          const point = samplePath(entry.stroke.points, Math.max(0, Math.min(1, (seconds - entry.start) / entry.stroke.duration)));
          ctx.translate((point[0] - layer.x) * size, (point[1] - layer.y) * size);
        }
        drawLayer(ctx, layer, recipe, time, size);
      }
    } else if (node.type === 'drawing' && recipe.drawing) {
      // The graph input is authoritative; preserve the full plan for scheduling and actor motion.
      const plan = { ...recipe.drawing, strokes: recipe.drawing.strokes.map(s => {
        if (s.id !== node.sourceId) return s;
        const copy = { ...s }; delete copy.directionId;
        if (direction) { copy.directionId = direction.id; copy.followActor = false; }
        return copy;
      }) };
      renderDrawing(ctx, plan, seconds, size, node.sourceId);
    }
    return image;
  }, allNodes);
}
export function renderNodeImages(recipe: EffectRecipe, index: number): Map<string, string> {
  if (!recipe.graph) return new Map();
  return new Map([...renderGraph(recipe, index, true).images].map(([id, image]) => [id, image.toDataURL()]));
}
export function renderNodeCanvases(recipe: EffectRecipe, index: number): Map<string, HTMLCanvasElement> {
  return recipe.graph ? renderGraph(recipe, index, true).images : new Map();
}
function renderCore(recipe: EffectRecipe, index: number): HTMLCanvasElement {
  const { size, frames, pixelSize } = recipe.settings, low = canvas(size / pixelSize), ctx = low.getContext('2d')!;
  const time = Math.max(0, Math.min(frames - 1, index)) / (frames - 1);
  if (recipe.graph?.enabled) ctx.drawImage(renderGraph(recipe, index).output, 0, 0);
  else {
    if (!recipe.drawing?.enabled || recipe.drawing.showBase) recipe.layers.forEach(layer => drawLayer(ctx, layer, recipe, time, low.width));
    renderDrawing(ctx, recipe.drawing, drawingTime(recipe, index), low.width);
    renderSequence(ctx, recipe.sequence, recipe.palette, time, low.width);
  }
  const core = canvas(size), coreCtx = core.getContext('2d')!; coreCtx.imageSmoothingEnabled = false; coreCtx.drawImage(low, 0, 0, size, size);
  return core;
}
/** Same pixels and safe padding, without allocating a Pixi texture or encoding PNG. */
export function renderPreviewCanvas(recipe: EffectRecipe, index: number): HTMLCanvasElement {
  return padSkillFrameCanvas(renderCore(recipe, index));
}
export function renderFrame(recipe: EffectRecipe, index: number): EffectFrame {
  const { size } = recipe.settings, core = renderCore(recipe, index), coreCtx = core.getContext('2d')!;
  const data = coreCtx.getImageData(0, 0, size, size).data;
  let touchesEdge = false, visible = false;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const alpha = data[(y * size + x) * 4 + 3]; visible ||= alpha > 2;
    if ((x < 2 || y < 2 || x >= size - 2 || y >= size - 2) && alpha > 1) touchesEdge = true;
  }
  const art = createSkillFrame(core, { x: 0, y: 0, width: size, height: size,
    pivot: { x: recipe.placement.pivotX * size, y: recipe.placement.pivotY * size }, background: 'transparent' });
  return { canvas: art.texture.source.resource as HTMLCanvasElement, art, touchesEdge, visible, index };
}
export const renderFrames = (recipe: EffectRecipe): EffectFrame[] => Array.from({ length: recipe.settings.frames }, (_, i) => renderFrame(recipe, i));
export function destroyFrames(frames: EffectFrame[]): void { frames.forEach(frame => frame.art.texture.destroy(true)); }
export function createSheet(frames: EffectFrame[], columns: number): HTMLCanvasElement {
  const cell = frames[0].canvas.width, count = Math.max(1, Math.min(frames.length, Math.floor(columns))), sheet = canvas(cell * count, cell * Math.ceil(frames.length / count));
  const ctx = sheet.getContext('2d')!; frames.forEach((frame, i) => ctx.drawImage(frame.canvas, (i % count) * cell, Math.floor(i / count) * cell)); return sheet;
}
export function sheetMetadata(recipe: EffectRecipe, columns: number) {
  const { size, frames, fps } = recipe.settings, padding = SKILL_FRAME_PADDING, cell = size + padding * 2;
  columns = Math.max(1, Math.min(frames, Math.floor(columns)));
  return { format: 'gd.effect-sheet@1', name: recipe.name, background: 'transparent', fps, loop: recipe.settings.loop,
    contentWidth: size, contentHeight: size, padding, cellWidth: cell, cellHeight: cell, columns, rows: Math.ceil(frames / columns),
    displaySize: recipe.placement.displaySize, durationMs: frames / fps * 1000,
    impactFrame: recipe.placement.impactFrame, impactTimeMs: recipe.placement.impactFrame / fps * 1000, impactSemantics: 'frame-complete-marker-only',
    ...(recipe.drawing ? { drawing: recipe.drawing, actorMotion: Array.from({ length: frames }, (_, i) => ({ frame: i + 1, position: drawingActor(recipe.drawing, drawingTime(recipe, i)) })), actorMotionSpace: 'normalized-content-relative-to-pivot', includesActorPixels: false } : {}),
    ...(recipe.graph ? { graph: recipe.graph } : {}),
    ...(recipe.sequence ? { sequence: recipe.sequence, sequencePalette: recipe.palette, sequenceTimeSpace: 'normalized-animation-duration' } : {}),
    frames: Array.from({ length: frames }, (_, i) => ({ frame: i + 1,
      x: (i % columns) * cell, y: Math.floor(i / columns) * cell, width: cell, height: cell,
      contentRect: { x: (i % columns) * cell + padding, y: Math.floor(i / columns) * cell + padding, width: size, height: size },
      pivot: { x: padding + recipe.placement.pivotX * size, y: padding + recipe.placement.pivotY * size },
      anchor: { x: (padding + recipe.placement.pivotX * size) / cell, y: (padding + recipe.placement.pivotY * size) / cell },
      durationMs: 1000 / fps })),
  };
}

import { drawingActor, drawingSchedule, samplePath, strokeBehavior, strokeFadeOpacity, type DrawingPlan, type DrawPoint, type DrawStroke } from './drawingModel';

function pointsUntil(points: DrawPoint[], progress: number): DrawPoint[] {
  const lengths = points.slice(1).map((p, i) => Math.hypot(p[0] - points[i][0], p[1] - points[i][1]));
  let remaining = lengths.reduce((sum, v) => sum + v, 0) * progress;
  const result: DrawPoint[] = [points[0]];
  for (let i = 0; i < lengths.length; i++) { if (remaining < lengths[i]) { result.push(samplePath(points, progress)); break; } result.push(points[i + 1]); remaining -= lengths[i]; }
  return result;
}
function path(ctx: CanvasRenderingContext2D, points: DrawPoint[], size: number, closed = false): void {
  ctx.beginPath(); points.forEach((p, i) => { if (i === 0) ctx.moveTo(p[0] * size, p[1] * size); else ctx.lineTo(p[0] * size, p[1] * size); }); if (closed) ctx.closePath();
}
function folded(stroke: DrawStroke, progress: number): DrawPoint[] {
  if (!stroke.fold) return stroke.points;
  const center = stroke.points.reduce((p, q) => [p[0] + q[0] / stroke.points.length, p[1] + q[1] / stroke.points.length], [0, 0]);
  const t = Math.max(0, (progress - .3) / .7), angle = t * Math.PI * 1.5;
  return stroke.points.map((p, i): DrawPoint => {
    const shrink = 1 - t * (i % 2 ? .9 : .6), dx = (p[0] - center[0]) * shrink, dy = (p[1] - center[1]) * shrink;
    return [center[0] + dx * Math.cos(angle) - dy * Math.sin(angle), center[1] + dx * Math.sin(angle) + dy * Math.cos(angle)];
  });
}
export function renderDrawing(target: CanvasRenderingContext2D, plan: DrawingPlan | undefined, time: number, size: number, onlyId?: string): void {
  if (!plan?.enabled) return;
  const schedule = drawingSchedule(plan);
  let scratch: HTMLCanvasElement | undefined;
  for (const entry of schedule) {
    const s = entry.stroke;
    if (onlyId && s.id !== onlyId) continue;
    const behavior = strokeBehavior(s);
    if (behavior === 'direction' || time <= entry.start || time >= entry.finish) continue;
    const progress = Math.min(1, (time - entry.start) / s.duration), age = time - entry.start;
    const life = age / (s.duration + s.linger);
    if (s.fadeAlong && life >= s.fadeAlong.end) continue;
    let ctx = target;
    if (s.fadeAlong) { scratch ??= document.createElement('canvas'); scratch.width = scratch.height = size; ctx = scratch.getContext('2d')!; }
    const fade = Math.min(1, age / .06, (entry.finish - time) / Math.max(.08, Math.min(.25, s.duration * .3)));
    const points = folded(s, progress), actor = s.followActor ? drawingActor(plan, time) : null;
    ctx.save(); if (actor) ctx.translate((actor[0] - .5) * size, (actor[1] - .5) * size);
    const direction = s.directionId ? schedule.find(e => e.stroke.id === s.directionId) : undefined;
    if (direction) {
      const position = samplePath(direction.stroke.points, Math.max(0, Math.min(1, (time - direction.start) / direction.stroke.duration)));
      const center = s.points.reduce((p, q) => [p[0] + q[0] / s.points.length, p[1] + q[1] / s.points.length], [0, 0]);
      ctx.translate((position[0] - center[0]) * size, (position[1] - center[1]) * size);
    }
    ctx.globalAlpha = Math.max(0, fade); ctx.strokeStyle = s.color; ctx.fillStyle = s.color; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const width = s.width * size;
    if ((s.role === 'effect' || behavior === 'appearance') && s.style === 'field') {
      path(ctx, points, size, true); ctx.globalAlpha *= .23; ctx.fill(); ctx.globalAlpha = fade; ctx.lineWidth = width; ctx.stroke();
      ctx.globalAlpha *= .3; ctx.lineWidth = width * 2; ctx.stroke();
    } else if (s.role === 'effect' && s.style === 'burst') {
      const center = points[points.length - 1], extent = Math.max(.065, Math.min(.22, Math.hypot(points[0][0] - center[0], points[0][1] - center[1])));
      const radius = extent * size * (1 - (1 - progress) ** 3), angle = progress * .4;
      ctx.translate(center[0] * size, center[1] * size); ctx.rotate(angle);
      ctx.beginPath(); for (let i = 0; i < 24; i++) { const a = i * Math.PI / 12, r = radius * (i % 2 ? .14 : 1); ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); ctx.fill();
      ctx.lineWidth = Math.max(.6, width * (1 - progress * .7)); ctx.beginPath(); ctx.arc(0, 0, radius * .8, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#edfff0'; ctx.beginPath(); ctx.arc(0, 0, Math.max(1, radius * .12), 0, Math.PI * 2); ctx.fill();
    } else {
      const visible = behavior === 'appearance' ? points : pointsUntil(points, progress);
      path(ctx, visible, size); ctx.globalAlpha *= .22; ctx.lineWidth = width * 2.2; ctx.stroke();
      ctx.globalAlpha = fade; ctx.lineWidth = width; ctx.stroke(); ctx.strokeStyle = '#f0fff5'; ctx.lineWidth = Math.max(.4, width * .25); ctx.stroke();
      if (s.role === 'effect' && s.style === 'orb') {
        const p = samplePath(points, progress); ctx.fillStyle = s.color; ctx.beginPath(); ctx.arc(p[0] * size, p[1] * size, width * 1.7, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#f0fff5'; ctx.beginPath(); ctx.arc(p[0] * size, p[1] * size, width * .65, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.restore();
    if (s.fadeAlong && scratch) {
      const f = s.fadeAlong, gradient = ctx.createLinearGradient(f.from[0] * size, f.from[1] * size, f.to[0] * size, f.to[1] * size);
      for (let i = 0; i <= 32; i++) gradient.addColorStop(i / 32, `rgba(255,255,255,${strokeFadeOpacity(f, life, i / 32)})`);
      ctx.globalCompositeOperation = 'destination-in'; ctx.fillStyle = gradient; ctx.fillRect(0, 0, size, size);
      target.save(); target.globalAlpha = 1; target.drawImage(scratch, 0, 0); target.restore();
    }
  }
}

import { beamPoints, sampleLight, sequenceEnvelope, type EffectSequence } from './sequenceModel';

const clamp = (t: number) => Math.max(0, Math.min(1, t));
const ease = (t: number) => 1 - (1 - clamp(t)) ** 3;
function glow(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string, alpha: number) {
  if (radius <= 0 || alpha <= 0) return;
  const g = ctx.createRadialGradient(x, y, 0, x, y, radius); g.addColorStop(0, color); g.addColorStop(.22, `${color}bb`); g.addColorStop(1, `${color}00`);
  ctx.save(); ctx.globalAlpha = Math.min(1, ctx.globalAlpha * alpha); ctx.fillStyle = g; ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2); ctx.restore();
}
function line(ctx: CanvasRenderingContext2D, points: [number, number][], size: number, reveal = 1) {
  ctx.beginPath(); ctx.moveTo(points[0][0] * size, points[0][1] * size);
  const last = Math.min(points.length - 1, Math.max(0, reveal) * (points.length - 1)), full = Math.floor(last);
  for (let i = 1; i <= full; i++) ctx.lineTo(points[i][0] * size, points[i][1] * size);
  if (full < points.length - 1) { const a = points[full], b = points[full + 1], t = last - full; ctx.lineTo((a[0] + (b[0] - a[0]) * t) * size, (a[1] + (b[1] - a[1]) * t) * size); }
}
function rand(seed: number) { let s = seed | 0; return () => { s = Math.imul(s ^ s >>> 16, 0x45d9f3b); s = Math.imul(s ^ s >>> 16, 0x45d9f3b); s ^= s >>> 16; return (s >>> 0) / 4294967296; }; }
export function renderSequence(ctx: CanvasRenderingContext2D, sequence: EffectSequence | undefined, palette: [string, string, string], time: number, size: number) {
  if (!sequence?.enabled) return;
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (const beam of sequence.beams) {
    const alpha = sequenceEnvelope(time, beam.start, beam.end, .012, .025) * beam.opacity;
    if (alpha <= 0) continue;
    const a = sequence.lights.find(l => l.id === beam.from)!, b = sequence.lights.find(l => l.id === beam.to)!;
    const draw = (sampleTime: number, strength: number, ghost = false) => {
      const endpointAlpha = Math.min(sequenceEnvelope(sampleTime, a.start, a.end, a.fadeIn, a.fadeOut), sequenceEnvelope(sampleTime, b.start, b.end, b.fadeIn, b.fadeOut));
      const points = beamPoints(sequence, beam, sampleTime), width = size * beam.width * sequence.beamScale, reveal = clamp((sampleTime - beam.start) / beam.reveal);
      for (const [scale, weight] of [[7, .055 * sequence.glow], [3, .23 * sequence.glow], [1, .85], [.23, .95]]) {
        ctx.globalAlpha = alpha * endpointAlpha * weight * strength; ctx.strokeStyle = scale < 1 && !ghost ? palette[2] : palette[beam.color]; ctx.lineWidth = Math.max(.35, width * scale); line(ctx, points, size, reveal); ctx.stroke();
      }
    };
    const echo = beam.afterimage;
    if (echo) {
      const visibility = sequenceEnvelope(time, echo.start, echo.end, .02, .035);
      for (let i = echo.copies; i >= 1; i--) {
        const previous = time - echo.delay * i;
        if (previous >= echo.start && visibility > 0) draw(previous, visibility * echo.opacity * (1 - i / (echo.copies + 1)) ** 1.2, true);
      }
    }
    draw(time, 1);
  }
  for (const light of sequence.lights) {
    const alpha = sequenceEnvelope(time, light.start, light.end, light.fadeIn, light.fadeOut) * light.opacity;
    if (alpha <= 0) continue;
    const p = sampleLight(light, time), radius = light.radius * size * sequence.lightScale * p.scale, color = palette[light.color]; ctx.globalAlpha = alpha;
    if (light.trail) {
      const points = Array.from({ length: 13 }, (_, i): [number, number] => { const p = sampleLight(light, Math.max(light.start, time - light.trail * (1 - i / 12))); return [p.x, p.y]; });
      for (let i = 1; i < points.length; i++) { ctx.globalAlpha = alpha * (i / points.length) ** 2 * .5; ctx.strokeStyle = color; ctx.lineWidth = Math.max(.4, radius * .9 * i / points.length); ctx.beginPath(); ctx.moveTo(points[i - 1][0] * size, points[i - 1][1] * size); ctx.lineTo(points[i][0] * size, points[i][1] * size); ctx.stroke(); }
    }
    ctx.globalAlpha = alpha; glow(ctx, p.x * size, p.y * size, radius * 5, color, .5 * sequence.glow);
    ctx.save(); ctx.translate(p.x * size, p.y * size); ctx.rotate(p.rotation * Math.PI / 180); ctx.fillStyle = color;
    ctx.beginPath(); ctx.moveTo(0, -radius * 1.8); ctx.quadraticCurveTo(radius * .3, -radius * .3, radius * 1.35, 0); ctx.quadraticCurveTo(radius * .3, radius * .3, 0, radius * 1.8); ctx.quadraticCurveTo(-radius * .3, radius * .3, -radius * 1.35, 0); ctx.quadraticCurveTo(-radius * .3, -radius * .3, 0, -radius * 1.8); ctx.fill();
    ctx.fillStyle = palette[2]; ctx.beginPath(); ctx.arc(0, 0, Math.max(.4, radius * .48), 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }
  for (const burst of sequence.bursts) {
    if (time <= burst.start || time >= burst.end) continue;
    const age = (time - burst.start) / (burst.end - burst.start), fade = (1 - age) ** 1.4, expansion = ease(age), r = burst.radius * size, random = rand(burst.seed), color = palette[burst.color];
    ctx.save(); ctx.translate(burst.x * size, burst.y * size); ctx.rotate(burst.rotation * Math.PI / 180 + age * 1.6); ctx.globalAlpha = fade;
    glow(ctx, 0, 0, r * (.22 + expansion * .6), color, .8 * sequence.glow);
    ctx.strokeStyle = color; ctx.lineWidth = Math.max(.4, size * .012 * (1 - age)); ctx.beginPath(); ctx.ellipse(0, 0, r * expansion, r * expansion * .72, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = palette[2]; ctx.lineWidth *= .38; ctx.beginPath(); ctx.arc(0, 0, r * expansion * .72, 0, Math.PI * 2); ctx.stroke();
    for (let i = 0; i < burst.rays; i++) {
      const angle = i * Math.PI * 2 / burst.rays + (random() - .5) * .2, length = r * (.5 + random() * .5) * (.35 + expansion * .65), width = r * (.015 + random() * .023) * (1 - age);
      ctx.save(); ctx.rotate(angle); ctx.fillStyle = i % 3 ? color : palette[2]; ctx.beginPath(); ctx.moveTo(r * .06, -width); ctx.lineTo(length, 0); ctx.lineTo(r * .06, width); ctx.lineTo(-r * .09, 0); ctx.closePath(); ctx.fill(); ctx.restore();
    }
    for (let i = 0; i < burst.particles; i++) {
      const a = random() * Math.PI * 2, distance = r * expansion * (.35 + random() * .72), length = size * (.006 + random() * .012) * (1 - age * .6);
      ctx.save(); ctx.translate(Math.cos(a) * distance, Math.sin(a) * distance * .86); ctx.rotate(a); ctx.fillStyle = i % 4 ? color : palette[2]; ctx.fillRect(-length, -Math.max(.4, length * .15), length * 2, Math.max(.7, length * .3)); ctx.restore();
    }
    // A brief bright core reads as impact on a bright battlefield as well as a dark preview.
    ctx.globalAlpha = Math.max(0, 1 - age * 4); ctx.fillStyle = palette[2]; ctx.beginPath(); ctx.arc(0, 0, r * (.12 + age * .1), 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }
  ctx.restore();
}

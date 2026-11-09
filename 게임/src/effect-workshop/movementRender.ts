import type { EffectLayer } from './model';

/** Draw in the layer's rotated local space; vertical lift/gravity remains world-up. */
export function drawMovementLayer(ctx: CanvasRenderingContext2D, l: EffectLayer, palette: readonly string[], t: number, size: number, random: () => number): void {
  const radius = l.radius * size, thickness = l.thickness * size, opacity = ctx.globalAlpha;
  const angle = l.rotation * Math.PI / 180, spread = l.spread * Math.PI / 180;
  const lift = (height: number): [number, number] => [-Math.sin(angle) * height, -Math.cos(angle) * height];
  for (let i = 0; i < l.amount; i++) {
    const delay = random() * .26, age = Math.max(0, Math.min(1, (t - delay) / (1 - delay)));
    const direction = (random() - .5) * spread, rate = .45 + random() * .55, width = thickness * (.55 + random() * .65), wobble = random() * Math.PI * 2;
    if (!age || age >= 1) continue;
    const grow = 1 - (1 - age) ** (1 + l.speed * .65);
    ctx.save(); ctx.globalAlpha = opacity * Math.min(1, age * 14) * (1 - age) ** .55;
    if (l.type === 'dust') {
      const rise = lift(radius * .18 * age), distance = radius * rate * grow;
      ctx.translate(Math.cos(direction) * distance + rise[0], Math.sin(direction) * distance * .62 + rise[1]); ctx.rotate(-angle);
      const r = width * (.45 + grow * 1.35), spin = wobble + age * 2.2;
      // Several overlapping lobes make billowing dust instead of glowing stars.
      for (let j = 0; j < 4; j++) {
        const a = spin + j * Math.PI * .5, x = Math.cos(a) * r * .33, y = Math.sin(a) * r * .2;
        const gradient = ctx.createRadialGradient(x - r * .18, y - r * .22, 0, x, y, r);
        gradient.addColorStop(0, `${palette[l.color]}D9`); gradient.addColorStop(.48, `${palette[l.color]}B8`); gradient.addColorStop(.8, `${palette[l.color]}58`); gradient.addColorStop(1, `${palette[l.color]}00`);
        ctx.fillStyle = gradient; ctx.save(); ctx.scale(1, .76); ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      }
    } else if (l.type === 'wind') {
      const length = radius * (.65 + rate * .35) * Math.min(1, age * (2.5 + l.speed)), shift = radius * .08 * age * l.speed;
      const bend = Math.sin(wobble) * radius * Math.min(.46, spread * .2), offset = Math.cos(wobble) * radius * Math.min(.22, spread * .09);
      const y = (u: number) => offset + Math.sin(u * Math.PI) * bend + Math.sin(u * Math.PI * 2 + age * 4 * l.speed + wobble) * radius * .035;
      ctx.fillStyle = palette[l.color]; ctx.beginPath();
      for (let j = 0; j <= 24; j++) { const u = j / 24, w = width * Math.sin(Math.PI * u) ** .7 * (1 - age * .55); if (!j) ctx.moveTo(shift, y(0)); else ctx.lineTo(shift + length * u, y(u) - w); }
      for (let j = 24; j >= 0; j--) { const u = j / 24, w = width * Math.sin(Math.PI * u) ** .7 * (1 - age * .55); ctx.lineTo(shift + length * u, y(u) + w * .4); }
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = palette[Math.min(2, l.color + 1)]; ctx.lineWidth = Math.max(.35, width * .17); ctx.globalAlpha *= .7; ctx.beginPath();
      for (let j = 1; j < 24; j++) { const u = j / 24; if (j === 1) ctx.moveTo(shift + length * u, y(u)); else ctx.lineTo(shift + length * u, y(u)); } ctx.stroke();
    } else if (l.type === 'splash') {
      const distance = radius * rate * age * l.speed, height = radius * (1.9 * age - 2.05 * age * age) * (.5 + rate * .5), rise = lift(height);
      const x = Math.cos(direction) * distance + rise[0], y = Math.sin(direction) * distance * .38 + rise[1];
      ctx.translate(x, y); ctx.rotate(-angle + (age - .4) * 1.1);
      const r = Math.max(.6, width * (.7 - age * .4));
      ctx.fillStyle = palette[l.color]; ctx.strokeStyle = palette[0]; ctx.lineWidth = Math.max(.4, r * .2);
      ctx.beginPath(); ctx.ellipse(0, 0, r * .6, r * 1.65, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = palette[2]; ctx.beginPath(); ctx.ellipse(-r * .16, -r * .42, r * .2, r * .6, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }
}

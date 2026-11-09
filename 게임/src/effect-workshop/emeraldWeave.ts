import type { EffectRecipe } from './model';
import type { BeamTrack, LightKey, LightTrack } from './sequenceModel';
import { sampleLight } from './sequenceModel';

export const EMERALD_SQUARE_START = 31 / 63, EMERALD_SQUARE_JOIN = 57 / 63;
/** Revise only the middle motion; retain the saved opening, frame-58 pose, burst and user styling. */
export function reviseEmeraldCollapse(recipe: EffectRecipe): void {
  const sequence = recipe.sequence; if (!sequence) return;
  const ids = ['weave-a', 'weave-b', 'weave-c', 'weave-d'];
  if (!ids.every(id => sequence.lights.some(l => l.id === id))) return;
  const poses = ids.map(id => { const light = sequence.lights.find(l => l.id === id)!; return { light, initial: sampleLight(light, EMERALD_SQUARE_START), join: sampleLight(light, EMERALD_SQUARE_JOIN) }; });
  const finalRadius = poses.reduce((sum, p) => sum + Math.hypot(p.join.x - .5, p.join.y - .5), 0) / poses.length;
  for (const { light, initial, join } of poses) {
    const startRadius = Math.hypot(initial.x - .5, initial.y - .5), angle = Math.atan2(initial.y - .5, initial.x - .5);
    const keys: LightKey[] = Array.from({ length: 26 }, (_, i) => {
      const u = i / 26, theta = u * Math.PI * 2.5, radius = finalRadius + (startRadius - finalRadius) * (1 - u) ** 1.15;
      return { at: (31 + i) / 63, x: .5 + Math.cos(angle + theta) * radius, y: .5 + Math.sin(angle + theta) * radius, rotation: initial.rotation + (join.rotation - initial.rotation) * u, scale: initial.scale + (join.scale - initial.scale) * u };
    });
    light.keys = [...light.keys.filter(k => k.at < EMERALD_SQUARE_START), ...keys, join, ...light.keys.filter(k => k.at > EMERALD_SQUARE_JOIN)];
  }
  sequence.beams = sequence.beams.filter(b => b.id !== 'weave-link-ab');
  for (const beam of sequence.beams) if (ids.includes(beam.from) && ids.includes(beam.to)) {
    beam.bend = 0;
    beam.afterimage = { start: EMERALD_SQUARE_START, end: beam.end, delay: .014, copies: 4, opacity: .3 };
  }
  sequence.name = '녹색빛 분열 · 사각 회전·축소·잔상 · 폭발';
  sequence.prompt = '중앙 응집과 분열·레이저 연결은 유지합니다. 32프레임의 사각형이 네 꼭짓점을 유지하며 회전하고 점점 작아집니다. 뒤에는 네 겹의 옅은 사각 잔상이 따라옵니다. 거의 다 수축했을 때 기존 58프레임 이후의 중심 빛과 폭발로 연결됩니다.';
}

const duration = 3.2, at = (seconds: number) => seconds / duration;
const key = (seconds: number, x: number, y: number, rotation = 0, scale = 1): LightKey => ({ at: at(seconds), x, y, rotation, scale });
const lastKeys = (angle: number): LightKey[] => Array.from({ length: 9 }, (_, i) => {
  const u = i / 8, a = angle + u * Math.PI * 2.2, r = .145 * (1 - u) + .013 * u;
  return key(2.54 + u * .34, .5 + Math.cos(a) * r, .5 + Math.sin(a) * r, u * 720, 1.1 + u * .45);
});
export function createEmeraldWeave(): EffectRecipe {
  const light = (id: string, name: string, start: number, keys: LightKey[]): LightTrack => ({ id, name, color: 1, start: at(start), end: at(2.96), radius: .015, opacity: 1, trail: at(.12), fadeIn: at(.055), fadeOut: at(.09), keys: [...keys, key(2.96, .5, .5, 900, .25)] });
  const lightA = light('weave-a', '첫 빛 · 왼쪽에서 위쪽 매듭으로', .12, [key(.12, .5, .5, 0, .8), key(.23, .5, .5), key(.65, .28, .72, -45), key(1.08, .22, .5, -90), key(1.62, .22, .5, -90), key(1.87, .35, .23, 40), key(2.16, .74, .42, 150), key(2.42, .40, .40, 260), ...lastKeys(-Math.PI * .75)]);
  const lightB = light('weave-b', '둘째 빛 · 오른쪽에서 아래쪽 매듭으로', .12, [key(.12, .5, .5, 180, .8), key(.23, .5, .5, 180), key(.65, .72, .28, 135), key(1.08, .78, .5, 90), key(1.62, .78, .5, 90), key(1.87, .65, .77, 220), key(2.16, .26, .58, 330), key(2.42, .60, .60, 440), ...lastKeys(Math.PI * .25)]);
  const lightC = light('weave-c', '왼쪽 빛에서 분열 · 아래쪽으로', .65, [key(.65, .28, .72), key(1.08, .5, .78, 45), key(1.62, .5, .78, 45), key(1.87, .23, .65, 175), key(2.16, .42, .26, 285), key(2.42, .40, .40, 395), ...lastKeys(-Math.PI * .75)]);
  const lightD = light('weave-d', '오른쪽 빛에서 분열 · 위쪽으로', .65, [key(.65, .72, .28, 180), key(1.08, .5, .22, 225), key(1.62, .5, .22, 225), key(1.87, .77, .35, 355), key(2.16, .58, .74, 465), key(2.42, .60, .60, 575), ...lastKeys(Math.PI * .25)]);
  const beam = (id: string, name: string, from: string, to: string, start: number, phase: number): BeamTrack => ({ id, name, from, to, color: 1, start: at(start), end: at(2.91), width: .0045, opacity: .9, reveal: at(.18), bend: .07, twistStart: at(1.62), waves: 1.5, phase });
  const recipe: EffectRecipe = {
    format: 'gd.effect@1', name: '에메랄드 매듭', settings: { size: 192, frames: 64, fps: 20, pixelSize: 1, loop: false }, palette: ['#128C50', '#43F394', '#E9FFE9'],
    placement: { pivotX: .5, pivotY: .5, displaySize: 168, impactFrame: 58 },
    layers: [{ id: 'weave-optional-ring', name: '보조 충격파', type: 'ring', enabled: false, blend: 'add', color: 1, x: .5, y: .5, start: .9, end: 1, radius: .28, thickness: .012, rotation: 0, spread: 360, amount: 12, speed: 1, opacity: .6, seed: 160 }],
    sequence: {
      version: 1, enabled: true, name: '녹색빛 분열 · 레이저 매듭 · 회전 폭발', prompt: '초록빛이 중앙에서 두 갈래, 네 갈래로 갈라집니다. 네 빛을 잇는 녹색 레이저가 서로 꼬이며 조여들고, 두 매듭으로 모인 빛이 빠르게 회전해 중심에서 폭발합니다.', lightScale: 1, beamScale: 1, glow: 1,
      lights: [{ id: 'weave-core', name: '중앙에 응집하는 빛', color: 1, start: 0, end: at(.28), radius: .024, opacity: 1, trail: 0, fadeIn: at(.06), fadeOut: at(.09), keys: [key(0, .5, .5, 0, .35), key(.13, .5, .5, 90, 1.15), key(.28, .5, .5, 180, .3)] }, lightA, lightB, lightC, lightD],
      beams: [beam('weave-link-ac', '첫 연결 · 왼쪽과 아래쪽', 'weave-a', 'weave-c', 1.1, 0), beam('weave-link-bd', '첫 연결 · 오른쪽과 위쪽', 'weave-b', 'weave-d', 1.1, Math.PI), beam('weave-link-ad', '둘째 연결 · 왼쪽과 위쪽', 'weave-a', 'weave-d', 1.32, Math.PI * .5), beam('weave-link-bc', '둘째 연결 · 오른쪽과 아래쪽', 'weave-b', 'weave-c', 1.32, -Math.PI * .5), beam('weave-link-ab', '조여드는 중심 레이저', 'weave-a', 'weave-b', 1.58, Math.PI * .25)],
      bursts: [{ id: 'weave-impact', name: '중심 회전 폭발', color: 1, x: .5, y: .5, start: at(2.9), end: 1, radius: .30, rays: 14, particles: 28, seed: 160731, rotation: -20 }],
    },
  };
  reviseEmeraldCollapse(recipe);
  return recipe;
}

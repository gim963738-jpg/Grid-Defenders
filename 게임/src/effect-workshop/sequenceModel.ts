import type { EffectRecipe } from './model';

export interface LightKey { at: number; x: number; y: number; rotation: number; scale: number }
export interface LightTrack { id: string; name: string; color: number; start: number; end: number; radius: number; opacity: number; trail: number; fadeIn: number; fadeOut: number; keys: LightKey[] }
export interface BeamAfterimage { start: number; end: number; delay: number; copies: number; opacity: number }
export interface BeamTrack { id: string; name: string; from: string; to: string; color: number; start: number; end: number; width: number; opacity: number; reveal: number; bend: number; twistStart: number; waves: number; phase: number; afterimage?: BeamAfterimage }
export interface BurstTrack { id: string; name: string; color: number; x: number; y: number; start: number; end: number; radius: number; rays: number; particles: number; seed: number; rotation: number }
/** Authoring time is normalized. Changing FPS speeds up the whole motion without truncating it. */
export interface EffectSequence { version: 1; enabled: boolean; name: string; prompt: string; lightScale: number; beamScale: number; glow: number; lights: LightTrack[]; beams: BeamTrack[]; bursts: BurstTrack[] }
export const sequenceEnvelope = (t: number, start: number, end: number, fadeIn: number, fadeOut: number) => t < start || t >= end ? 0 : Math.max(0, Math.min(1, fadeIn ? (t - start) / fadeIn : 1, fadeOut ? (end - t) / fadeOut : 1));
const clamp = (t: number) => Math.max(0, Math.min(1, t));
export function sampleLight(track: LightTrack, time: number): LightKey {
  const keys = track.keys;
  if (time <= keys[0].at) return { ...keys[0], at: time };
  for (let i = 1; i < keys.length; i++) if (time <= keys[i].at) {
    const a = keys[i - 1], b = keys[i], u = clamp((time - a.at) / (b.at - a.at)), s = u * u * (3 - 2 * u);
    return { at: time, x: a.x + (b.x - a.x) * s, y: a.y + (b.y - a.y) * s, rotation: a.rotation + (b.rotation - a.rotation) * u, scale: a.scale + (b.scale - a.scale) * s };
  }
  return { ...keys.at(-1)!, at: time };
}
/** Every beam sample is rebuilt from the actual light positions, including during a crossing. */
export function beamPoints(sequence: EffectSequence, beam: BeamTrack, time: number): [number, number][] {
  const a = sampleLight(sequence.lights.find(l => l.id === beam.from)!, time), b = sampleLight(sequence.lights.find(l => l.id === beam.to)!, time);
  const dx = b.x - a.x, dy = b.y - a.y, length = Math.hypot(dx, dy), nx = length ? -dy / length : 0, ny = length ? dx / length : 0;
  const twist = clamp((time - beam.twistStart) / .085), bend = beam.bend * twist * Math.min(1, length / .2);
  return Array.from({ length: 41 }, (_, i): [number, number] => {
    if (i === 0) return [a.x, a.y]; if (i === 40) return [b.x, b.y];
    const u = i / 40, offset = Math.sin(Math.PI * u) * bend * Math.sin(u * Math.PI * 2 * beam.waves - (time - beam.twistStart) * Math.PI * 18 + beam.phase);
    return [a.x + dx * u + nx * offset, a.y + dy * u + ny * offset];
  });
}
const obj = (value: unknown): Record<string, unknown> => { if (!value || typeof value !== 'object' || Array.isArray(value)) throw Error('연출 데이터는 객체여야 합니다.'); return value as Record<string, unknown>; };
const num = (v: unknown, min: number, max: number, name: string, integer = false) => { if (typeof v !== 'number' || !Number.isFinite(v) || v < min || v > max || integer && !Number.isInteger(v)) throw Error(`${name}: ${min}~${max} 범위를 확인해 주세요.`); return v; };
const str = (v: unknown, max: number) => { if (typeof v !== 'string' || !v.trim() || v.length > max) throw Error(`연출 이름·설명은 1~${max}자여야 합니다.`); return v; };
const identifier = (v: unknown) => { const s = str(v, 80); if (!/^[a-z\d_-]+$/i.test(s)) throw Error('연출 ID는 영문·숫자·밑줄·하이픈만 사용할 수 있습니다.'); return s; };
const list = (v: unknown, min: number, max: number) => { if (!Array.isArray(v) || v.length < min || v.length > max) throw Error(`연출 항목은 ${min}~${max}개여야 합니다.`); return v; };
export function validateSequence(raw: unknown): EffectSequence {
  const s = obj(raw); if (s.version !== 1 || typeof s.enabled !== 'boolean') throw Error('빛·레이저 연출은 version 1 형식입니다.');
  const ids = new Set<string>();
  const unique = (value: unknown) => { const id = identifier(value); if (ids.has(id)) throw Error('연출 ID가 중복됩니다.'); ids.add(id); return id; };
  const lights = list(s.lights, 1, 12).map((raw): LightTrack => {
    const l = obj(raw), start = num(l.start, 0, .99, '빛 시작'), end = num(l.end, .01, 1, '빛 종료'); if (start >= end) throw Error('빛 종료는 시작보다 뒤여야 합니다.');
    const keys = list(l.keys, 2, 64).map((raw): LightKey => { const k = obj(raw); return { at: num(k.at, 0, 1, '빛 시간'), x: num(k.x, .05, .95, '빛 X'), y: num(k.y, .05, .95, '빛 Y'), rotation: num(k.rotation, -7200, 7200, '빛 회전'), scale: num(k.scale, .1, 2, '빛 크기') }; });
    if (keys.some((k, i) => i > 0 && k.at <= keys[i - 1].at) || keys[0].at > start || keys.at(-1)!.at < end) throw Error('빛 경로의 시간은 증가해야 하며 시작~종료를 모두 포함해야 합니다.');
    return { id: unique(l.id), name: str(l.name, 80), color: num(l.color, 0, 2, '빛 색상', true), start, end, radius: num(l.radius, .006, .05, '빛 반경'), opacity: num(l.opacity, 0, 1, '빛 불투명도'), trail: num(l.trail, 0, .18, '빛 잔상'), fadeIn: num(l.fadeIn, 0, .12, '빛 등장'), fadeOut: num(l.fadeOut, 0, .12, '빛 소멸'), keys };
  });
  const beams = list(s.beams, 0, 24).map((raw): BeamTrack => {
    const b = obj(raw), start = num(b.start, 0, .99, '레이저 시작'), end = num(b.end, .01, 1, '레이저 종료'), from = identifier(b.from), to = identifier(b.to);
    const a = lights.find(l => l.id === from), c = lights.find(l => l.id === to);
    if (!a || !c || from === to || start >= end || start < Math.max(a.start, c.start) || end > Math.min(a.end, c.end)) throw Error('레이저 양 끝에는 같은 시간에 존재하는 서로 다른 빛을 지정해 주세요.');
    const result: BeamTrack = { id: unique(b.id), name: str(b.name, 80), from, to, color: num(b.color, 0, 2, '레이저 색상', true), start, end, width: num(b.width, .001, .02, '레이저 두께'), opacity: num(b.opacity, 0, 1, '레이저 불투명도'), reveal: num(b.reveal, .005, .15, '레이저 연결 시간'), bend: num(b.bend, 0, .12, '레이저 휘어짐'), twistStart: num(b.twistStart, start, end, '레이저 꼬임 시작'), waves: num(b.waves, .5, 3, '레이저 굴곡'), phase: num(b.phase, -Math.PI * 2, Math.PI * 2, '레이저 위상') };
    if (b.afterimage !== undefined) {
      const e = obj(b.afterimage), a = num(e.start, start, end, '잔상 시작'), z = num(e.end, start, end, '잔상 종료');
      if (a >= z) throw Error('잔상 종료는 시작보다 뒤여야 합니다.');
      result.afterimage = { start: a, end: z, delay: num(e.delay, .001, .08, '잔상 간격'), copies: num(e.copies, 1, 6, '잔상 개수', true), opacity: num(e.opacity, 0, .6, '잔상 불투명도') };
    }
    return result;
  });
  const bursts = list(s.bursts, 0, 8).map((raw): BurstTrack => {
    const b = obj(raw), start = num(b.start, 0, .99, '폭발 시작'), end = num(b.end, .01, 1, '폭발 종료'); if (start >= end) throw Error('폭발 종료는 시작보다 뒤여야 합니다.');
    return { id: unique(b.id), name: str(b.name, 80), color: num(b.color, 0, 2, '폭발 색상', true), x: num(b.x, .15, .85, '폭발 X'), y: num(b.y, .15, .85, '폭발 Y'), start, end, radius: num(b.radius, .02, .32, '폭발 반경'), rays: num(b.rays, 4, 32, '폭발 광선', true), particles: num(b.particles, 4, 48, '폭발 파편', true), seed: num(b.seed, 0, 999999, '폭발 시드', true), rotation: num(b.rotation, -180, 180, '폭발 회전') };
  });
  return { version: 1, enabled: s.enabled, name: str(s.name, 80), prompt: str(s.prompt, 2000), lightScale: num(s.lightScale, .5, 2, '빛 크기'), beamScale: num(s.beamScale, .5, 2, '레이저 두께'), glow: num(s.glow, .2, 2, '발광 강도'), lights, beams, bursts };
}
export function sequenceMotion(recipe: EffectRecipe, time: number) { return recipe.sequence?.lights.map(l => ({ id: l.id, visible: time >= l.start && time < l.end, ...sampleLight(l, time) })) ?? []; }

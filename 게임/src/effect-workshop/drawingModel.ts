import type { EffectRecipe } from './model';

export type DrawPoint = [number, number];
export type DrawRole = 'move' | 'slash' | 'effect';
export type DrawStyle = 'trail' | 'orb' | 'burst' | 'field';
export type DrawPurpose = 'unassigned' | 'direction' | 'appearance' | 'path' | 'reference' | 'custom';
export type DrawBehavior = 'reference' | 'direction' | 'appearance' | 'path';
export type DrawTool = 'pen' | 'line' | 'curve';
export interface StrokeFadeAlong { from: DrawPoint; to: DrawPoint; start: number; end: number; softness: number }
export const DRAW_PURPOSES: Record<DrawPurpose, string> = { unassigned: '미지정 · 나중에 부여', direction: '방향·이동 경로', appearance: '완성됐을 때의 모습', path: '선을 따라 발생하는 연출', reference: '참고·위치 표시', custom: '직접 의미 정의' };
export const DRAW_BEHAVIORS: Record<DrawBehavior, string> = { reference: '참고 자료로만 보관', direction: '이동 방향으로 적용', appearance: '그린 모양 그대로 표시', path: '선을 따라 순차 재생' };
export const DRAW_TOOLS: Record<DrawTool, string> = { pen: '자유선', line: '직선', curve: '곡선' };
export const DRAW_ROLES: Record<DrawRole, { name: string; color: string }> = {
  move: { name: '돌진·이동', color: '#f4ce55' },
  slash: { name: '검로', color: '#ff777b' },
  effect: { name: '이펙트', color: '#70baff' },
};
export const DRAW_STYLES: Record<DrawStyle, string> = { trail: '빛나는 선', orb: '빛 이동', burst: '끝점 폭발', field: '장판·외곽 연결' };
export interface DrawStroke {
  id: string; role: DrawRole; points: DrawPoint[]; step: number;
  duration: number; delay: number; linger: number;
  color: string; width: number; style: DrawStyle; followActor: boolean; fold: boolean; note: string;
  purpose?: DrawPurpose; meaning?: string; behavior?: DrawBehavior; guideColor?: string;
  directionTarget?: 'actor' | 'effect'; directionId?: string;
  tool?: DrawTool; anchors?: DrawPoint[];
  fadeAlong?: StrokeFadeAlong;
}
export interface DrawingPlan { version: 1; enabled: boolean; showBase: boolean; prompt: string; strokes: DrawStroke[] }
export const emptyDrawing = (): DrawingPlan => ({ version: 1, enabled: true, showBase: false, prompt: '', strokes: [] });
export const newStroke = (role: DrawRole, points: DrawPoint[], step: number, color = '#9be8b3'): DrawStroke => ({
  id: crypto.randomUUID(), role, points, step, duration: .6, delay: 0, linger: .2,
  color, width: role === 'slash' ? .025 : .015, style: 'trail', followActor: false, fold: false, note: '',
});
export const strokePurpose = (stroke: DrawStroke): DrawPurpose => stroke.purpose ?? (stroke.role === 'move' ? 'direction' : 'path');
export function strokeBehavior(stroke: DrawStroke): DrawBehavior {
  const purpose = strokePurpose(stroke);
  if (purpose === 'custom') return stroke.behavior ?? 'reference';
  return purpose === 'unassigned' || purpose === 'reference' ? 'reference' : purpose;
}
/** Legacy move paths retain actor motion; authored VFX directions default to independent effects. */
export const directionTarget = (stroke: DrawStroke): 'actor' | 'effect' => stroke.directionTarget ?? (stroke.role === 'move' ? 'actor' : 'effect');
export const actorDirection = (stroke: DrawStroke) => strokeBehavior(stroke) === 'direction' && directionTarget(stroke) === 'actor';
export const strokeLabel = (stroke: DrawStroke) => stroke.meaning?.trim() || DRAW_PURPOSES[strokePurpose(stroke)];
export const guideColor = (stroke: DrawStroke) => stroke.guideColor ?? DRAW_ROLES[stroke.role].color;
/** Spatial opacity along the axis; the soft front advances from the start toward the end. */
export function strokeFadeOpacity(fade: StrokeFadeAlong, life: number, position: number): number {
  if (life <= fade.start) return 1; if (life >= fade.end) return 0;
  const progress = (life - fade.start) / (fade.end - fade.start), front = progress * (1 + fade.softness) - fade.softness;
  const t = Math.max(0, Math.min(1, (position - front) / fade.softness)); return t * t * (3 - 2 * t);
}
export function geometryPoints(tool: DrawTool, anchors: DrawPoint[]): DrawPoint[] {
  if (tool !== 'curve') return anchors.map(p => [...p]);
  const [a, c, b] = anchors;
  return Array.from({ length: 33 }, (_, i): DrawPoint => { const t = i / 32, u = 1 - t; return [u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]]; });
}
export function reverseStroke(stroke: DrawStroke): void {
  if (stroke.fadeAlong) [stroke.fadeAlong.from, stroke.fadeAlong.to] = [stroke.fadeAlong.to, stroke.fadeAlong.from];
  if (stroke.tool === 'curve' && stroke.anchors) { stroke.anchors = [stroke.anchors[2], stroke.anchors[1], stroke.anchors[0]]; stroke.points = geometryPoints('curve', stroke.anchors); }
  else { stroke.points.reverse(); if (stroke.anchors) stroke.anchors.reverse(); }
}
export function drawingSchedule(plan: DrawingPlan): { stroke: DrawStroke; start: number; end: number; finish: number }[] {
  const result: { stroke: DrawStroke; start: number; end: number; finish: number }[] = [];
  let clock = 0;
  const active = plan.strokes.filter(s => strokeBehavior(s) !== 'reference');
  for (const step of [...new Set(active.map(s => s.step))].sort((a, b) => a - b)) {
    const group = active.filter(s => s.step === step);
    group.forEach(stroke => result.push({ stroke, start: clock + stroke.delay, end: clock + stroke.delay + stroke.duration, finish: clock + stroke.delay + stroke.duration + stroke.linger }));
    clock += Math.max(...group.map(s => s.delay + s.duration));
  }
  return result;
}
export const drawingDuration = (plan: DrawingPlan): number => Math.max(.1, ...drawingSchedule(plan).map(s => s.finish));
export const drawingTime = (recipe: EffectRecipe, index: number): number => index / Math.max(1, recipe.settings.frames - 1) * (recipe.settings.frames / recipe.settings.fps);

/** Arc-length interpolation makes a hand-drawn path independent of pointer sampling density. */
export function samplePath(points: DrawPoint[], progress: number): DrawPoint {
  if (!points.length) return [.5, .5];
  if (progress <= 0) return [...points[0]];
  if (progress >= 1) return [...points[points.length - 1]];
  const lengths = points.slice(1).map((p, i) => Math.hypot(p[0] - points[i][0], p[1] - points[i][1]));
  const length = lengths.reduce((sum, n) => sum + n, 0);
  if (length < 1e-8) return [...points[0]];
  let distance = length * progress;
  for (let i = 0; i < lengths.length; i++) {
    if (distance <= lengths[i] && lengths[i] > 0) { const p = distance / lengths[i]; return [points[i][0] + (points[i + 1][0] - points[i][0]) * p, points[i][1] + (points[i + 1][1] - points[i][1]) * p]; }
    distance -= lengths[i];
  }
  return [...points[points.length - 1]];
}
export function drawingActor(plan: DrawingPlan | undefined, time: number): DrawPoint | null {
  if (!plan?.enabled) return null;
  const moves = drawingSchedule(plan).filter(s => actorDirection(s.stroke));
  if (!moves.length) return null;
  let position = samplePath(moves[0].stroke.points, 0);
  for (const entry of moves) {
    if (time < entry.start) break;
    position = samplePath(entry.stroke.points, Math.min(1, (time - entry.start) / entry.stroke.duration));
  }
  return position;
}
export function fitDrawingTiming(recipe: EffectRecipe): void {
  if (!recipe.drawing?.strokes.some(s => strokeBehavior(s) !== 'reference') || !recipe.drawing.enabled) return;
  const duration = Math.round(drawingDuration(recipe.drawing) * 10000) / 10000;
  recipe.settings.frames = Math.max(2, Math.min(64, Math.ceil(duration * 30 - .000001)));
  recipe.settings.fps = Math.floor(recipe.settings.frames / duration * 1e6) / 1e6;
  recipe.placement.impactFrame = Math.min(recipe.placement.impactFrame, recipe.settings.frames);
}

const obj = (v: unknown): Record<string, unknown> => {
  if (!v || typeof v !== 'object' || Array.isArray(v)) throw Error('그리기 데이터 형식이 올바르지 않습니다.'); return v as Record<string, unknown>;
};
const num = (v: unknown, lo: number, hi: number, label: string, integer = false): number => {
  if (typeof v !== 'number' || !Number.isFinite(v) || v < lo || v > hi || integer && !Number.isInteger(v)) throw Error(`${label}: ${lo}~${hi} 범위를 확인해 주세요.`); return v;
};
const bool = (v: unknown): boolean => { if (typeof v !== 'boolean') throw Error('그리기 옵션은 true 또는 false여야 합니다.'); return v; };
const text = (v: unknown, max: number): string => { if (typeof v !== 'string' || v.length > max) throw Error(`그리기 설명은 ${max}자 이하로 적어 주세요.`); return v; };
export function validateDrawing(raw: unknown): DrawingPlan {
  const r = obj(raw);
  if (r.version !== 1 || !Array.isArray(r.strokes) || r.strokes.length > 24) throw Error('그리기는 version 1, 선 24개까지 지원합니다.');
  const ids = new Set<string>(), moveSteps = new Set<number>();
  const strokes = r.strokes.map((raw): DrawStroke => {
    const s = obj(raw), id = text(s.id, 80);
    if (!/^[a-z\d_-]+$/i.test(id) || ids.has(id)) throw Error('그린 선 ID는 중복 없는 영문·숫자·밑줄·하이픈이어야 합니다.'); ids.add(id);
    if (!Object.hasOwn(DRAW_ROLES, s.role as string) || !Object.hasOwn(DRAW_STYLES, s.style as string)) throw Error('그린 선의 역할 또는 표현을 확인해 주세요.');
    if (!Array.isArray(s.points) || s.points.length < 2 || s.points.length > 256) throw Error('선마다 좌표가 2~256개 필요합니다.');
    const points = s.points.map((p): DrawPoint => { if (!Array.isArray(p) || p.length !== 2) throw Error('선 좌표는 [x,y]입니다.'); return [num(p[0], 0, 1, '선 X'), num(p[1], 0, 1, '선 Y')]; });
    const step = num(s.step, 1, 24, '단계', true), role = s.role as DrawRole;
    const color = text(s.color, 7); if (!/^#[\da-f]{6}$/i.test(color)) throw Error('실제 효과색은 #RRGGBB 형식입니다.');
    const result: DrawStroke = { id, role, points, step, duration: num(s.duration, .1, 5, '선 재생 시간'), delay: num(s.delay, 0, 5, '선 시작 지연'), linger: num(s.linger, 0, 5, '잔상 시간'), color,
      width: num(s.width, .005, .06, '선 두께'), style: s.style as DrawStyle, followActor: bool(s.followActor), fold: bool(s.fold), note: text(s.note, 600) };
    if (s.purpose !== undefined) { if (!Object.hasOwn(DRAW_PURPOSES, s.purpose as string)) throw Error('선의 의미를 확인해 주세요.'); result.purpose = s.purpose as DrawPurpose; }
    if (s.meaning !== undefined) result.meaning = text(s.meaning, 160);
    if (s.behavior !== undefined) { if (!Object.hasOwn(DRAW_BEHAVIORS, s.behavior as string)) throw Error('미리보기 적용 방법을 확인해 주세요.'); result.behavior = s.behavior as DrawBehavior; }
    if (s.guideColor !== undefined) { const c = text(s.guideColor, 7); if (!/^#[\da-f]{6}$/i.test(c)) throw Error('편집용 선 색을 확인해 주세요.'); result.guideColor = c; }
    if (s.directionTarget !== undefined) { if (s.directionTarget !== 'actor' && s.directionTarget !== 'effect') throw Error('방향선의 이동 대상을 확인해 주세요.'); result.directionTarget = s.directionTarget; }
    else if (s.purpose !== undefined && strokeBehavior(result) === 'direction') result.directionTarget = directionTarget(result);
    if (s.directionId !== undefined) { const link = text(s.directionId, 80); if (!/^[a-z\d_-]+$/i.test(link)) throw Error('연결할 방향선 ID를 확인해 주세요.'); result.directionId = link; }
    if (s.fadeAlong !== undefined) {
      const f = obj(s.fadeAlong), point = (v: unknown): DrawPoint => { if (!Array.isArray(v) || v.length !== 2) throw Error('소멸 방향 좌표는 [x,y]입니다.'); return [num(v[0], 0, 1, '소멸 X'), num(v[1], 0, 1, '소멸 Y')]; };
      const from = point(f.from), to = point(f.to), start = num(f.start, 0, .99, '소멸 시작'), end = num(f.end, .01, 1, '소멸 종료');
      if (start >= end || Math.hypot(to[0] - from[0], to[1] - from[1]) < .00001) throw Error('소멸 방향의 두 점과 시작·종료 시간을 구분해 주세요.');
      result.fadeAlong = { from, to, start, end, softness: num(f.softness, .02, .5, '소멸 경계 부드러움') };
    }
    if (s.tool !== undefined) {
      if (!Object.hasOwn(DRAW_TOOLS, s.tool as string)) throw Error('그리기 도구를 확인해 주세요.');
      result.tool = s.tool as DrawTool;
      if (result.tool !== 'pen') {
        const count = result.tool === 'curve' ? 3 : 2;
        if (!Array.isArray(s.anchors) || s.anchors.length !== count) throw Error(`이 도구는 기준점 ${count}개가 필요합니다.`);
        result.anchors = s.anchors.map((p): DrawPoint => { if (!Array.isArray(p) || p.length !== 2) throw Error('기준점은 [x,y]입니다.'); return [num(p[0], 0, 1, '기준점 X'), num(p[1], 0, 1, '기준점 Y')]; });
        const expected = geometryPoints(result.tool, result.anchors);
        if (points.length !== expected.length || points.some((p, i) => Math.hypot(p[0] - expected[i][0], p[1] - expected[i][1]) > .00001)) throw Error('직선·곡선의 기준점과 경로 좌표가 일치하지 않습니다.');
      }
    }
    if (strokeBehavior(result) === 'appearance' && !['trail', 'field'].includes(result.style)) throw Error('완성 모습은 그린 윤곽 또는 채운 모양으로 표시해 주세요.');
    if (actorDirection(result)) { if (moveSteps.has(step)) throw Error('한 캐릭터의 동시 이동 방향은 하나입니다. 빛을 여러 갈래로 분열하려면 방향선 대상을 ‘연결할 모양·이펙트의 이동’으로 지정해 주세요.'); moveSteps.add(step); }
    return result;
  });
  for (const stroke of strokes) if (stroke.directionId) {
    const target = strokes.find(s => s.id === stroke.directionId);
    if (!target || target.id === stroke.id || strokeBehavior(target) !== 'direction') throw Error('연결할 방향선이 없거나 방향 용도가 아닙니다.');
    if (!['appearance', 'path'].includes(strokeBehavior(stroke)) || stroke.followActor) throw Error('방향선 연결은 모양·연출 경로에만 적용하며 돌진 따라가기와 중복할 수 없습니다.');
  }
  const plan: DrawingPlan = { version: 1, enabled: bool(r.enabled), showBase: bool(r.showBase), prompt: text(r.prompt, 3000), strokes };
  if (drawingDuration(plan) > 60) throw Error('그림 전체 길이는 잔상을 포함해 60초 이하로 맞춰 주세요.');
  return plan;
}
/** Explicit local keyword support; not an AI endpoint. Manual fields remain authoritative. */
export function applyDrawingDescription(plan: DrawingPlan): { plan: DrawingPlan; changed: number } {
  const result = structuredClone(plan); let changed = 0;
  for (const stroke of result.strokes) {
    if (!['appearance', 'path'].includes(strokeBehavior(stroke))) continue;
    const description = `${result.prompt} ${stroke.note}`.replace(/(?:노란|노랑|빨간|빨강|파란|파랑)\s*선/g, '');
    const old = JSON.stringify(stroke);
    const colors: [RegExp, string][] = [[/녹색|초록|green/i, '#65ed9a'], [/노란|노랑|yellow/i, '#ffe082'], [/빨간|빨강|적색|red/i, '#ff7979'], [/파란|파랑|청색|blue/i, '#7fcfff'], [/보라|purple/i, '#c09bff'], [/하얀|흰색|white/i, '#f0fff6']];
    for (const [pattern, color] of colors) if (pattern.test(description)) stroke.color = color;
    if (stroke.role === 'effect' && strokeBehavior(stroke) !== 'appearance') {
      const styleText = /장판|외곽|다각형|폭발|폭팔|빛\s*이동|구슬|빛덩이|연결|번개|빛나는\s*선/.test(stroke.note) ? stroke.note : result.prompt;
      if (/장판|외곽|다각형/.test(styleText)) stroke.style = 'field';
      else if (/폭발|폭팔/.test(styleText)) stroke.style = 'burst';
      else if (/빛\s*이동|구슬|빛덩이/.test(styleText)) stroke.style = 'orb';
      else if (/연결|번개|빛나는\s*선/.test(styleText)) stroke.style = 'trail';
    }
    if (/접히|접힘|접어|꼬이|꼬임/.test(description)) stroke.fold = true;
    if (/잔상|유지/.test(description)) stroke.linger = Math.max(stroke.linger, .6);
    if (JSON.stringify(stroke) !== old) changed++;
  }
  return { plan: result, changed };
}
export function drawingExample(): DrawingPlan {
  const move = newStroke('move', [[.22, .62], [.38, .57], [.58, .48], [.72, .4]], 1); move.duration = .85; move.note = '노란선을 따라 돌진';
  const slash = newStroke('slash', [[.3, .32], [.42, .28], [.57, .32], [.7, .46], [.69, .62]], 1, '#b5f8d0'); slash.duration = .85; slash.note = '돌진과 동시에 녹색 검격';
  const burst = newStroke('effect', [[.63, .43], [.71, .46]], 2, '#65ed9a'); burst.style = 'burst'; burst.duration = .6; burst.linger = .2; burst.width = .025; burst.note = '파란선 끝점에서 녹색 폭발';
  return { version: 1, enabled: true, showBase: false, prompt: '노란선을 따라 돌진하면서 빨간 검로로 베고, 파란선 끝에서 녹색 폭발.', strokes: [move, slash, burst] };
}
export function drawingDesignExample(): DrawingPlan {
  const direction = newStroke('move', [[.24, .6], [.7, .4]], 1); direction.purpose = 'direction'; direction.directionTarget = 'effect'; direction.meaning = '검기의 이동 방향'; direction.guideColor = '#f4ce55'; direction.tool = 'line'; direction.anchors = direction.points.map(p => [...p]); direction.duration = 1.2;
  const anchors: DrawPoint[] = [[.35, .5], [.5, .25], [.65, .5]];
  const appearance = newStroke('effect', geometryPoints('curve', anchors), 1, '#65ed9a'); appearance.purpose = 'appearance'; appearance.meaning = '완성됐을 때 보이는 검기 모양'; appearance.guideColor = '#ff777b'; appearance.tool = 'curve'; appearance.anchors = anchors; appearance.directionId = direction.id; appearance.duration = 1.2;
  const reference = newStroke('effect', [[.22, .68], [.75, .68]], 1); reference.purpose = 'custom'; reference.behavior = 'reference'; reference.meaning = '지면 높이 참고'; reference.guideColor = '#70baff'; reference.note = '이 선은 위치를 설명하는 참고선이며 화면에 표시하지 않는다.'; reference.tool = 'line'; reference.anchors = reference.points.map(p => [...p]);
  return { version: 1, enabled: true, showBase: false, prompt: '노란 직선은 이동 방향, 빨간 곡선은 구현됐을 때의 모습. 곡선 모양을 녹색으로 구현해 방향선을 따라 이동한다. 파란선은 지면 기준 참고다.', strokes: [direction, appearance, reference] };
}

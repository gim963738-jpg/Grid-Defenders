import { drawingDuration, drawingSchedule, validateDrawing, type DrawingPlan } from './drawingModel';
import { validateGraph, type EffectGraph } from './graphModel';
import { validateSequence, type EffectSequence } from './sequenceModel';
import { createEmeraldWeave } from './emeraldWeave';
import { createHorizontalSlash } from './horizontalSlash';
import { createMovementPreset, MOVEMENT_PRESETS } from './movementPresets';
import { createFlamethrower } from './flamethrower';
/** Independent, browser-local effect recipes. No combat values live in this format. */
export const FORMAT = 'gd.effect@1' as const;
export const LAYER_TYPES = ['slash', 'burst', 'ring', 'particles', 'rune', 'flame', 'dust', 'wind', 'splash', 'jet'] as const;
export type LayerType = typeof LAYER_TYPES[number];
export const LAYER_NAMES: Record<LayerType, string> = {
  slash: '참격', burst: '섬광', ring: '충격파', particles: '파티클', rune: '마법진', flame: '화염', dust: '먼지 구름', wind: '바람 띠', splash: '물보라', jet: '화염방사',
};
export interface EffectLayer {
  id: string;
  name: string;
  type: LayerType;
  enabled: boolean;
  blend: 'normal' | 'add';
  color: number;
  x: number;
  y: number;
  start: number;
  end: number;
  radius: number;
  thickness: number;
  rotation: number;
  spread: number;
  amount: number;
  speed: number;
  opacity: number;
  seed: number;
}
export interface EffectRecipe {
  format: typeof FORMAT;
  name: string;
  settings: { size: number; frames: number; fps: number; pixelSize: number; loop: boolean };
  palette: [string, string, string];
  placement: { pivotX: number; pivotY: number; displaySize: number; impactFrame: number };
  layers: EffectLayer[];
  drawing?: DrawingPlan;
  graph?: EffectGraph;
  sequence?: EffectSequence;
}
export interface SavedEffect { id: string; updatedAt: string; recipe: EffectRecipe }
export const STORAGE_KEY = 'grid-defenders.effect-workshop.v1';
export const MAX_FILE_BYTES = 512 * 1024;
export const cloneRecipe = (recipe: EffectRecipe): EffectRecipe => structuredClone(recipe);
export const uid = () => crypto.randomUUID();

export function makeLayer(type: LayerType, patch: Partial<EffectLayer> = {}): EffectLayer {
  return {
    id: uid(), name: LAYER_NAMES[type], type, enabled: true, blend: 'add', color: 0,
    x: .5, y: .5, start: 0, end: 1, radius: .28, thickness: .035,
    rotation: -30, spread: 180, amount: 16, speed: .8, opacity: 1, seed: 173,
    ...patch,
  };
}
const base = (name: string, palette: EffectRecipe['palette'], layers: EffectLayer[], impactFrame = 6): EffectRecipe => ({
  format: FORMAT, name, settings: { size: 128, frames: 24, fps: 30, pixelSize: 1, loop: false },
  palette, placement: { pivotX: .5, pivotY: .5, displaySize: 110, impactFrame }, layers,
});
export const PRESET_INFO = [
  { id: 'horizontal', name: '수평 일섬', description: '진한 검상이 시작점부터 천천히 소멸', color: '#9ae7ff' },
  { id: 'emerald', name: '에메랄드 매듭', description: '빛 분열 · 레이저 꼬임 · 회전 폭발', color: '#43f394' },
  { id: 'slash', name: '황금 참격', description: '날카로운 궤적과 흩어지는 불꽃', color: '#ffbf70' },
  { id: 'explosion', name: '화염 폭발', description: '강한 섬광, 충격파와 파편', color: '#ff9372' },
  { id: 'flame', name: '타오르는 불꽃', description: '위로 피어오르는 화염과 불씨', color: '#ffc162' },
  { id: 'summon-fire', name: '마법진 화염 분출', description: '분리 예제 · 테두리 / 문양 / 솟는 불 / 불씨', color: '#ffa557' },
  { id: 'ice', name: '서리 파편', description: '차가운 결정과 푸른 충격파', color: '#80dfff' },
  { id: 'rune', name: '비전 마법진', description: '회전하는 문양과 보랏빛 잔광', color: '#bb9aff' },
  { id: 'heal', name: '생명의 빛', description: '회복의 고리와 떠오르는 입자', color: '#8de4b8' },
  ...MOVEMENT_PRESETS,
  { id: 'flamethrower', name: '청염 화염방사', description: '영상 참고 · 주황 분사구, 흰 중심과 파란 외곽, 잔불 소멸', color: '#4C9BFF' },
] as const;
export type PresetId = typeof PRESET_INFO[number]['id'];
export function createPreset(id: PresetId): EffectRecipe {
  switch (id) {
    case 'summon-fire': {
      const r = base('마법진 화염 분출', ['#ff742e', '#ffc66a', '#fff1c4'], [
        makeLayer('ring', { name: '마법진 · 바깥 고리', y: .65, radius: .27, thickness: .012, spread: 360, rotation: 0, color: 1, end: .92, opacity: .85 }),
        makeLayer('rune', { name: '마법진 · 사각 문양', y: .65, radius: .19, thickness: .008, amount: 4, rotation: 0, color: 1, start: .04, end: .9 }),
        makeLayer('flame', { name: '솟구치는 불꽃', y: .6, radius: .2, amount: 9, thickness: .025, rotation: 0, speed: .65, start: .2, end: .85 }),
        makeLayer('particles', { name: '떠오르는 불씨', y: .58, radius: .12, amount: 16, rotation: -90, spread: 40, speed: .6, thickness: .014, color: 2, start: .25, end: 1 }),
      ], 18);
      r.settings = { size: 192, frames: 60, fps: 30, pixelSize: 1, loop: false }; return r;
    }
    case 'flamethrower': return createFlamethrower();
    case 'horizontal': return createHorizontalSlash();
    case 'emerald': return createEmeraldWeave();
    case 'slash': return base('황금 참격', ['#ff8a35', '#ffd477', '#fff7dd'], [
      makeLayer('slash', { radius: .31, thickness: .06, spread: 220, rotation: -35, end: .72 }),
      makeLayer('ring', { radius: .22, thickness: .012, start: .08, end: .5, opacity: .5, color: 1 }),
      makeLayer('particles', { radius: .18, amount: 24, speed: 1, start: .1, end: 1, rotation: -30, spread: 170 }),
      makeLayer('burst', { radius: .15, thickness: .025, amount: 4, start: .08, end: .35, color: 2 }),
    ], 5);
    case 'explosion': return base('화염 폭발', ['#ff5937', '#ffae46', '#fff3cc'], [
      makeLayer('burst', { radius: .28, amount: 10, rotation: 15, end: .7, color: 1 }),
      makeLayer('ring', { radius: .39, thickness: .04, start: .05, end: .85 }),
      makeLayer('particles', { radius: .16, amount: 32, speed: 1.4, spread: 360, start: .08 }),
      makeLayer('burst', { radius: .18, amount: 6, start: .03, end: .35, color: 2 }),
    ], 4);
    case 'flame': return base('타오르는 불꽃', ['#f34d37', '#ffb743', '#fff0b1'], [
      makeLayer('flame', { radius: .24, amount: 9, y: .62, speed: .8 }),
      makeLayer('particles', { radius: .12, amount: 25, rotation: -90, spread: 55, speed: .85, y: .58, color: 1 }),
      makeLayer('ring', { radius: .2, thickness: .025, y: .7, opacity: .55, rotation: 0 }),
    ], 9);
    case 'ice': return base('서리 파편', ['#2989e4', '#75dcff', '#eaffff'], [
      makeLayer('burst', { radius: .3, amount: 6, thickness: .03, rotation: -30, end: .8, color: 1 }),
      makeLayer('ring', { radius: .36, thickness: .024, start: .08, color: 1 }),
      makeLayer('particles', { radius: .17, amount: 22, spread: 360, speed: 1.2, start: .1, color: 1 }),
      makeLayer('burst', { radius: .13, amount: 4, end: .4, color: 2 }),
    ], 6);
    case 'rune': return base('비전 마법진', ['#7950da', '#b49aff', '#f2e5ff'], [
      makeLayer('ring', { radius: .36, thickness: .025, color: 0 }),
      makeLayer('rune', { radius: .3, thickness: .012, rotation: 0, amount: 6, color: 1 }),
      makeLayer('particles', { radius: .24, amount: 18, rotation: -90, spread: 45, speed: .55, color: 1 }),
      makeLayer('burst', { radius: .12, amount: 4, color: 2, start: .25, end: .7 }),
    ], 12);
    case 'heal': return base('생명의 빛', ['#27aa87', '#86efb3', '#f1ffcb'], [
      makeLayer('ring', { radius: .31, thickness: .03, y: .65, color: 1 }),
      makeLayer('rune', { radius: .24, thickness: .01, amount: 4, y: .65, color: 0 }),
      makeLayer('particles', { radius: .22, amount: 22, rotation: -90, spread: 30, speed: .8, y: .6, color: 1 }),
      makeLayer('burst', { radius: .12, amount: 4, y: .4, color: 2, start: .2, end: .9 }),
    ], 10);
    default: return createMovementPreset(id);
  }
}

const object = (value: unknown, label: string): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw Error(`${label}: 객체가 필요합니다.`);
  return value as Record<string, unknown>;
};
const number = (value: unknown, min: number, max: number, label: string, integer = false): number => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max || (integer && !Number.isInteger(value)))
    throw Error(`${label}: ${min}~${max}${integer ? ' 정수' : ''} 범위를 확인해 주세요.`);
  return value;
};
const string = (value: unknown, label: string, max = 80): string => {
  if (typeof value !== 'string' || !value.trim() || value.length > max) throw Error(`${label}: 1~${max}자 텍스트가 필요합니다.`);
  return value.trim();
};
const boolean = (value: unknown, label: string): boolean => {
  if (typeof value !== 'boolean') throw Error(`${label}: true 또는 false가 필요합니다.`);
  return value;
};
const identifier = (value: unknown, label: string): string => {
  const id = string(value, label);
  if (!/^[a-z\d_-]+$/i.test(id)) throw Error(`${label}: 영문, 숫자, 밑줄과 하이픈만 사용할 수 있습니다.`);
  return id;
};
/** Rebuild the allowed shape; never execute imported code or load imported URLs. */
export function validateRecipe(input: unknown, depth = 0, budget = { nodes: 0, recipes: 0 }): EffectRecipe {
  if (depth > 3 || ++budget.recipes > 24) throw Error('부품 중첩은 3단계, 포함 원본은 전체 24개까지 사용할 수 있습니다.');
  const r = object(input, '이펙트');
  if (r.format !== FORMAT) throw Error(`공방 전용 ${FORMAT} 형식이 필요합니다. 다른 사이트의 PXF JSON은 변환 없이 열 수 없습니다.`);
  const s = object(r.settings, '설정'), p = object(r.placement, '배치');
  const size = number(s.size, 32, 256, '크기', true), frames = number(s.frames, 2, 64, '프레임', true);
  const pixelSize = number(s.pixelSize, 1, 4, '픽셀 크기', true);
  if (![1, 2, 4].includes(pixelSize) || size % pixelSize) throw Error('픽셀 크기는 1·2·4 중 하나이며 이미지 크기를 나눌 수 있어야 합니다.');
  if (!Array.isArray(r.palette) || r.palette.length !== 3 || r.palette.some(c => typeof c !== 'string' || !/^#[\da-f]{6}$/i.test(c)))
    throw Error('팔레트에는 #RRGGBB 색상 3개가 필요합니다.');
  if (!Array.isArray(r.layers) || r.layers.length < 1 || r.layers.length > 12) throw Error('레이어는 1~12개까지 사용할 수 있습니다.');
  const ids = new Set<string>();
  const layers = r.layers.map((raw, i): EffectLayer => {
    const l = object(raw, `레이어 ${i + 1}`), label = `레이어 ${i + 1}`;
    const id = identifier(l.id, `${label} ID`);
    if (ids.has(id)) throw Error('레이어 ID가 중복됩니다.');
    ids.add(id);
    if (!LAYER_TYPES.includes(l.type as LayerType)) throw Error(`${label}: 지원하지 않는 종류입니다.`);
    if (l.blend !== 'normal' && l.blend !== 'add') throw Error(`${label}: 합성 방식은 normal 또는 add입니다.`);
    const start = number(l.start, 0, .99, `${label} 시작`), end = number(l.end, .01, 1, `${label} 종료`);
    if (start >= end) throw Error(`${label}: 종료는 시작보다 뒤여야 합니다.`);
    return {
      id, name: string(l.name, `${label} 이름`), type: l.type as LayerType, blend: l.blend,
      enabled: boolean(l.enabled, `${label} 표시`), color: number(l.color, 0, 2, `${label} 팔레트`, true),
      x: number(l.x, 0, 1, `${label} X`), y: number(l.y, 0, 1, `${label} Y`), start, end,
      radius: number(l.radius, .02, .45, `${label} 반경`), thickness: number(l.thickness, .005, .12, `${label} 두께`),
      rotation: number(l.rotation, -180, 180, `${label} 회전`), spread: number(l.spread, 10, 360, `${label} 퍼짐`),
      amount: number(l.amount, 3, 64, `${label} 개수`, true), speed: number(l.speed, .1, 2, `${label} 속도`),
      opacity: number(l.opacity, 0, 1, `${label} 불투명도`), seed: number(l.seed, 0, 999999, `${label} 시드`, true),
    };
  });
  const drawing = r.drawing === undefined ? undefined : validateDrawing(r.drawing);
  if (drawing?.enabled && drawingSchedule(drawing).length && drawingDuration(drawing) > frames / Number(s.fps) + .001)
    throw Error('재생 길이가 그린 단계보다 짧습니다. 그리기 화면에서 그림으로 생성을 눌러 시간에 맞춰 주세요.');
  const recipe: EffectRecipe = {
    format: FORMAT, name: string(r.name, '이펙트 이름'),
    settings: { size, frames, fps: number(s.fps, 1, 60, 'FPS'), pixelSize, loop: boolean(s.loop, '반복') },
    palette: [...r.palette] as EffectRecipe['palette'],
    placement: { pivotX: number(p.pivotX, 0, 1, '기준점 X'), pivotY: number(p.pivotY, 0, 1, '기준점 Y'),
      displaySize: number(p.displaySize, 24, 240, '전장 표시 크기'), impactFrame: number(p.impactFrame, 1, frames, '타격 표시 프레임', true) },
    layers,
    ...(drawing === undefined ? {} : { drawing }),
  };
  if (r.sequence !== undefined) recipe.sequence = validateSequence(r.sequence);
  if (r.graph !== undefined) {
    const rawGraph = object(r.graph, '연결도');
    budget.nodes += Array.isArray(rawGraph.nodes) ? rawGraph.nodes.length : 0;
    if (budget.nodes > 256) throw Error('부품 내부를 포함한 전체 노드는 256개까지 사용할 수 있습니다.');
    recipe.graph = validateGraph(r.graph, recipe, raw => validateRecipe(raw, depth + 1, budget));
  }
  if (depth === 0 && new Blob([JSON.stringify(recipe)]).size > MAX_FILE_BYTES) throw Error('작업 JSON이 512KB를 넘습니다. 부품을 별도 작품으로 나눠 주세요. 내보낸 작업을 다시 열 수 있도록 크기를 제한합니다.');
  return recipe;
}
export function parseRecipe(text: string): EffectRecipe {
  if (new Blob([text]).size > MAX_FILE_BYTES) throw Error('JSON 파일은 512KB 이하로 가져와 주세요.');
  let value: unknown;
  try { value = JSON.parse(text.replace(/^\uFEFF/, '')); } catch { throw Error('JSON 문법을 확인해 주세요. 코드 블록 기호 없이 JSON 본문만 넣어 주세요.'); }
  return validateRecipe(value);
}
export function readLibrary(storage: Pick<Storage, 'getItem'>): { entries: SavedEffect[]; activeId: string | null } {
  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) return { entries: [], activeId: null };
  const saved = object(JSON.parse(raw), '저장함');
  if (saved.version !== 1 || !Array.isArray(saved.entries) || saved.entries.length > 100) throw Error('저장함 형식을 읽을 수 없습니다.');
  const ids = new Set<string>();
  const entries = saved.entries.map((value): SavedEffect => {
    const entry = object(value, '저장 이펙트'), id = identifier(entry.id, '저장 ID');
    if (ids.has(id)) throw Error('저장 ID가 중복됩니다.');
    ids.add(id);
    return { id, updatedAt: string(entry.updatedAt, '수정 시각'), recipe: validateRecipe(entry.recipe) };
  });
  return { entries, activeId: typeof saved.activeId === 'string' && ids.has(saved.activeId) ? saved.activeId : entries[0]?.id ?? null };
}
export function writeLibrary(storage: Pick<Storage, 'setItem'>, entries: SavedEffect[], activeId: string): void {
  storage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, activeId, entries }));
}

export function makeAiPrompt(recipe: EffectRecipe, request: string): string {
  if (recipe.drawing?.strokes.some(s => s.fadeAlong)) request += '\n\nfadeAlong={from:[x,y],to:[x,y],start,end,softness}를 보존하세요. 두 점은 콘텐츠 정규화 좌표이고 start/end는 해당 선의 전체 표시 시간(duration+linger)에 대한 0~1 비율입니다. from부터 to 방향으로 부드럽게 연해져 사라지며 start<end,softness .02~.5입니다. 다른 선이나 레이어는 지우지 않습니다.';
  if (recipe.sequence) request += '\n\nsequence 연출 확장을 보존하세요. 시간 at/start/end/fadeIn/fadeOut/trail/reveal/twistStart는 전체 재생 길이에 대한0~1 비율입니다. lights는 위치·회전·크기의 시간 키프레임, beams는 from/to 빛id를 매 프레임 추적하는 레이저, bursts는 폭발입니다. 광원/레이저/폭발의 color는 palette 인덱스입니다. beams.afterimage={start,end,delay,copies,opacity}는 선택 필드이며 과거 위치의 레이저 잔상입니다. copies는1~6,opacity는0~.6,시간은0~1이며 원본 설정을 보존하세요. 레이저 끝점은 실제 광원 위치와 연결되며 bend/waves/phase와 twistStart로 꼬임을 만듭니다. 새 동작은 현재 지원 필드 안에서 작성하고 원본 연결과 키프레임을 보존하세요.';
  if (recipe.drawing) request += '\n\n분기 규칙: 새 방향선의 기본 directionTarget은 effect입니다. 같은 시작 좌표·같은 step·같은 delay(즉시 출발은0)로 여러 이펙트 방향선을 둘 수 있습니다. 기존 role=move의 대상 생략은 캐릭터로 호환하고, 명시적인 actor 이동은 같은 단계에 하나만 둡니다. 분기한 빛마다 모양 선을 각 방향선에 연결하세요.';
  if (recipe.graph?.nodes.some(n => n.type === 'component')) request += '\n\ncomponent 노드는 component={name,category,recipe:gd.effect@1} 원본을 포함합니다. 입력 없이 이미지를 출력하며 내부 팔레트·시간비율·연결을 보존합니다. 중첩3단계,원본24개,내부포함전체노드256개 제한. 외부 URL·코드 금지. 부품 이동은 노드 x/y가 아닌 transform 처리 노드로 지정합니다.';
  if (recipe.graph) request += '\n\n노드 연결도를 보존하세요. graph={version:1,enabled:boolean,nodes:1~96개,links:최대160개,view:{x,y(-16000~16000),zoom:.25~2}}. node={id:고유 영문숫자밑줄하이픈,type:layer/drawing/sequence/component/tint/opacity/transform/glow/fade/blend/mask/output,x,y(-12000~12000),sourceId:layer 또는 drawing 원본id(해당 종류 필수),params:{color:#RRGGBB,amount:0~1,scale:.1~3,rotation:-180~180,x,y:-.5~.5,blur:0~16,mode:normal/add/screen/multiply,start:0~.99,end:.01~1(start<end)}}. 모든 params 필수. 같은 원본은 하나의 노드로 표현. link={from:출력노드id,to:입력노드id,port:입력포트명}. layer와 appearance/path drawing 입력=direction, 방향 drawing 출력=direction; 일반 이미지 출력=image. blend/mask 입력=a,b, 나머지 처리·output 입력=image. output은 정확히 하나이고 출력포트 없음. 한 입력당 한 연결, 출력 분기 가능, 순환 연결 불가. graph.enabled일 때 최종 출력에 연결된 흐름만 PNG에 반영. direction 연결은 대응 drawing.directionId와 일치시킬 것. 그래프에 새 원본을 추가해도 최종 출력으로 연결해야 보임. 기존 연결·배치·의미를 임의로 지우지 마세요.';
  if (recipe.drawing) request = `${request.trim() || recipe.drawing.prompt || '그린 경로를 유지하고 연출을 다듬어 주세요.'}\n\n그리기 확장도 보존하세요: drawing={version:1,enabled:boolean,showBase:boolean,prompt:최대3000자,strokes:최대24개}. 각 stroke={id:고유 영문숫자밑줄하이픈,role:move/slash/effect,points:[[x,y],...](2~256개,각0~1),step:1~24정수,duration:.1~5초,delay:0~5초,linger:0~5초,color:#RRGGBB,width:.005~.06,style:trail/orb/burst/field,followActor:boolean,fold:boolean,note:최대600자}. 단계 번호가 같으면 동시 실행, 단계당 move는 하나. 다음 단계는 앞 단계의 최대(delay+duration) 뒤 시작. linger는 다음 단계와 겹칠 수 있음. 전체는 잔상 포함60초 이하. move는 캐릭터 위치 이동이며 PNG에 선을 그리지 않음. slash/effect는 그린 좌표대로 재생. burst는 끝점 폭발, field는 외곽을 닫아 채운 장판. fold는 선/장판을 중심으로 회전·접음. followActor는 좌표 중심(.5,.5)을 이동 중인 캐릭터 위치로 옮김. 선 색 역할은 편집용이고 color가 실제 효과색. 경로는 사용자 동의 없이 임의 대체하지 마세요. settings.frames/fps는 전체 단계 길이를 포함하도록 맞추세요. 지원되지 않는 동작은 유사 효과로 몰래 대체하지 말고 먼저 설명하세요.`;
  if (recipe.drawing) request += '\n\n최신 의미·도구 확장(아래 규칙이 과거 role 안내보다 우선): purpose=unassigned/direction/appearance/path/reference/custom. purpose가 있으면 role 색상·역할을 추론하지 마세요. 미지정/참고 선은 생성·시간에 미반영. meaning은 사용자 정의 의미 이름(160자), guideColor는 편집용 HEX이며 color와 별개. custom은 behavior=reference/direction/appearance/path로 실제 적용을 명시. directionTarget=actor/effect. appearance는 그린 모양 전체를 표시하고 style은 trail(윤곽)/field(채움)만 사용. path는 순차 연출. directionId는 연결할 direction 선의 id로, 모양 중심이 그 방향선을 따라 이동합니다. directionId와 followActor 중복 불가. tool=pen/line/curve. line의 anchors=[시작,끝], points도 같은 두 점. curve의 anchors=[시작,굽힘점,끝], points는 이차 베지어를 t=0,1/32,...,1의 33점으로 계산한 값이며 오차 0.00001 이내. 기존 그림/직접 부여한 의미/기준점/참고 설명을 보존하세요. 임의의 의미를 주거나 참고선을 효과로 대체하지 마세요.';
  return `Grid Defenders 개인 이펙트 공방에서 사용할 이펙트를 수정해 주세요.\n요청: ${request.trim() || '원하는 색상, 모양과 움직임으로 수정해 주세요.'}\n\n반드시 아래 gd.effect@1 형식의 완전한 JSON 하나만 반환하세요. PXF가 아닙니다. 코드 실행, 이미지 URL, 외부 API는 사용하지 않습니다. 피해/사거리/대상 수를 추가하지 마세요.\nsettings: size 32~256, frames 2~64, fps 1~60, pixelSize 1/2/4 (size의 약수), loop boolean. palette는 #RRGGBB 3개.\nplacement: pivotX/pivotY 0~1, displaySize 24~240, impactFrame 1~frames (1부터 시작, 프레임 완료 시각의 표시일 뿐 피해 미연결).\nlayers 1~12개. 각 필드는 생략하지 마세요. id 고유 문자열, name 문자열, type ${LAYER_TYPES.join('/')}, enabled boolean, blend normal/add, color 0~2, x/y 0~1, 0<=start<end<=1, radius .02~.45, thickness .005~.12, rotation -180~180도, spread 10~360도, amount 3~64 정수, speed .1~2, opacity 0~1, seed 0~999999 정수.\n반경과 이동량에 여유를 두고 모든 프레임이 이미지 경계에 닿지 않게 하세요. 배경은 투명합니다. 이 도구는 정해진 도형을 조합하는 절차적 렌더러입니다.\n\n현재 이펙트:\n${JSON.stringify(recipe, null, 2)}`;
}

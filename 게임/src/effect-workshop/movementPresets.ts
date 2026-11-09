import type { EffectLayer, EffectRecipe } from './model';
import type { DrawPoint, DrawStroke } from './drawingModel';

export const MOVEMENT_PRESETS = [
  { id: 'run-soft', name: '가벼운 발먼지', description: '이동 소스 · 작은 먼지가 발걸음마다 번갈아 피어남', color: '#D2B48A' },
  { id: 'run-heavy', name: '묵직한 발구름', description: '이동 소스 · 눌렸다가 터지는 흙먼지와 굵은 자갈', color: '#B89066' },
  { id: 'run-sand', name: '모래 질주', description: '이동 소스 · 뒤로 길게 흘러가는 부드러운 모래 꼬리', color: '#E6BC72' },
  { id: 'run-launch', name: '출발 먼지', description: '이동 소스 · 한 번 박차며 뒤로 부채꼴로 터지는 먼지', color: '#CFA681' },
  { id: 'run-skid', name: '급정지 스키드', description: '이동 소스 · 지면을 긁는 긴 자국과 밀려 쌓이는 먼지', color: '#C89A6C' },
  { id: 'run-snow', name: '눈가루 발걸음', description: '이동 소스 · 낮게 흩날리는 가는 눈가루와 얼음 입자', color: '#CFEBFF' },
  { id: 'run-water', name: '물웅덩이 질주', description: '이동 소스 · 발끝에서 튀어 오르는 물방울과 낮은 물결', color: '#61CBEB' },
  { id: 'run-wind', name: '바람 대시', description: '이동 소스 · 서로 감기는 가늘고 긴 곡선 바람 띠', color: '#ADE7DC' },
  { id: 'run-fire', name: '불꽃 추진', description: '이동 소스 · 뒤로 뻗는 불꽃과 짧게 튀는 금빛 불씨', color: '#FF9B48' },
  { id: 'run-lightning', name: '번개 질주', description: '이동 소스 · 지그재그 번개가 짧게 점멸하며 잔광 소멸', color: '#83BCFF' },
] as const;
export type MovementPresetId = typeof MOVEMENT_PRESETS[number]['id'];

/** All samples face right. The fixed pivot is the forward foot, not the cloud's center. */
export function createMovementPreset(id: MovementPresetId): EffectRecipe {
  let index = 0;
  const layer = (type: EffectLayer['type'], name: string, patch: Partial<EffectLayer> = {}): EffectLayer => ({
    id: `${id}-${++index}`, type, name, enabled: true, blend: 'normal', color: 0,
    x: .68, y: .65, start: 0, end: .96, radius: .25, thickness: .025,
    rotation: 180, spread: 60, amount: 12, speed: 1, opacity: .85, seed: 164 + index * 31, ...patch,
  });
  const recipe: EffectRecipe = {
    format: 'gd.effect@1', name: MOVEMENT_PRESETS.find(p => p.id === id)!.name,
    settings: { size: 192, frames: 36, fps: 40, pixelSize: 1, loop: false },
    palette: ['#9B7755', '#D1B38D', '#F3DEC0'],
    placement: { pivotX: .68, pivotY: .68, displaySize: 132, impactFrame: 5 }, layers: [],
  };
  switch (id) {
    case 'run-soft':
      recipe.settings.loop = true;
      recipe.layers = [
        layer('dust', '왼발의 작은 먼지', { x: .63, y: .64, radius: .13, thickness: .019, amount: 7, start: 0, end: .55, opacity: .65, color: 1 }),
        layer('dust', '오른발의 작은 먼지', { x: .7, y: .71, radius: .14, thickness: .021, amount: 8, start: .25, end: .8, opacity: .72, color: 1 }),
        layer('dust', '다음 걸음의 가는 잔가루', { x: .63, y: .64, radius: .11, thickness: .013, amount: 6, start: .5, end: 1, opacity: .55, color: 2 }),
      ]; break;
    case 'run-heavy':
      recipe.placement.displaySize = 148;
      recipe.layers = [
        layer('ring', '발구름 바닥 압력', { x: .66, y: .7, radius: .16, thickness: .01, rotation: 0, end: .36, opacity: .45 }),
        layer('dust', '무겁게 솟는 흙덩이', { radius: .23, thickness: .047, amount: 10, spread: 100, end: .85, opacity: .95 }),
        layer('dust', '위로 말리는 밝은 먼지', { x: .62, y: .62, radius: .16, thickness: .032, amount: 7, start: .08, color: 1, opacity: .7 }),
        layer('particles', '짧게 튀는 굵은 자갈', { radius: .035, thickness: .04, amount: 13, speed: 1.2, spread: 90, start: .04, end: .66, color: 0 }),
      ]; break;
    case 'run-sand':
      recipe.palette = ['#A6783E', '#DCB772', '#F9E4AD']; recipe.settings = { ...recipe.settings, frames: 48, fps: 40, loop: true };
      recipe.layers = [
        layer('dust', '길게 흐르는 모래 꼬리', { x: .73, radius: .36, thickness: .026, spread: 28, amount: 22, color: 1, opacity: .8 }),
        layer('dust', '꼬리 끝의 고운 가루', { x: .61, y: .64, radius: .27, thickness: .016, spread: 45, amount: 18, start: .16, end: 1, color: 2, opacity: .6 }),
        layer('wind', '바닥을 쓸고 가는 모래 결', { x: .72, y: .7, radius: .38, thickness: .005, amount: 4, spread: 14, opacity: .4, color: 0, end: .7 }),
      ]; break;
    case 'run-launch':
      recipe.palette = ['#967052', '#C9A07D', '#F2D9B9']; recipe.settings.frames = 28;
      recipe.layers = [
        layer('dust', '뒷발에서 터지는 넓은 부채꼴', { x: .7, y: .68, radius: .31, thickness: .035, spread: 110, amount: 18, speed: 1.3, end: .85, opacity: .85, color: 1 }),
        layer('wind', '박차는 순간의 짧은 속도선', { x: .73, y: .68, radius: .29, thickness: .009, spread: 30, amount: 4, end: .35, color: 2, opacity: .8 }),
        layer('particles', '뒤로 튀는 흙알', { x: .67, y: .68, radius: .04, amount: 14, spread: 110, speed: 1.4, end: .75, opacity: .9 }),
      ]; break;
    case 'run-skid':
      recipe.palette = ['#785D45', '#C39D75', '#E8D1AE']; recipe.settings.frames = 40;
      recipe.layers = [
        layer('wind', '낮고 긴 바닥 긁힘', { x: .75, y: .7, radius: .43, thickness: .006, spread: 10, amount: 4, end: .9, opacity: .8 }),
        layer('dust', '처음 밀리는 먼지', { x: .71, y: .68, radius: .16, thickness: .027, spread: 35, amount: 9, end: .58, color: 1 }),
        layer('dust', '중간에 뭉치는 먼지', { x: .53, y: .67, radius: .13, thickness: .038, spread: 70, amount: 8, start: .16, end: .85, color: 1 }),
        layer('dust', '멈춘 뒤 남는 낮은 구름', { x: .38, y: .67, radius: .09, thickness: .032, spread: 100, amount: 8, start: .36, end: 1, color: 2, opacity: .65 }),
      ]; break;
    case 'run-snow':
      recipe.palette = ['#75A9C9', '#CEE7F4', '#F5FBFF']; recipe.settings.loop = true;
      recipe.layers = [
        layer('dust', '넓게 날리는 고운 눈가루', { radius: .26, thickness: .017, amount: 24, spread: 70, color: 1, opacity: .8 }),
        layer('dust', '하얀 발끝 가루', { x: .7, y: .7, radius: .12, thickness: .025, amount: 8, start: .22, end: .82, color: 2, opacity: .85 }),
        layer('particles', '흩어지는 작은 얼음 결정', { radius: .075, amount: 26, speed: .8, spread: 110, color: 1, start: .04, end: .88, opacity: .8 }),
      ]; break;
    case 'run-water':
      recipe.palette = ['#2781A4', '#65CBE6', '#E1F9FF']; recipe.settings.loop = true;
      recipe.layers = [
        layer('ring', '첫 발끝의 낮은 물결', { x: .64, y: .7, radius: .18, thickness: .009, rotation: 0, color: 0, end: .68, opacity: .8 }),
        layer('splash', '뒤로 튀었다 떨어지는 물방울', { x: .66, y: .67, radius: .23, thickness: .018, amount: 18, spread: 75, color: 1, end: .86 }),
        layer('splash', '다음 발의 작은 물보라', { x: .72, y: .71, radius: .15, thickness: .012, amount: 12, spread: 110, start: .27, end: 1, color: 1 }),
        layer('ring', '두 번째 잔물결', { x: .72, y: .72, radius: .13, thickness: .006, rotation: 0, color: 1, start: .32, end: 1, opacity: .6 }),
      ]; break;
    case 'run-wind':
      recipe.palette = ['#438E91', '#A7DED4', '#EDFFF7']; recipe.settings.frames = 28; recipe.placement.displaySize = 166;
      recipe.layers = [
        layer('wind', '위아래로 감기는 긴 바람 띠', { x: .78, y: .58, radius: .43, thickness: .02, amount: 5, spread: 70, opacity: .9, color: 1, end: .9 }),
        layer('wind', '반대로 비끼는 가는 바람', { x: .74, y: .62, radius: .35, thickness: .007, amount: 4, spread: 100, opacity: .8, color: 0, start: .09, end: 1 }),
      ]; break;
    case 'run-fire':
      recipe.palette = ['#DB4C2D', '#FFA438', '#FFF0A8']; recipe.settings.frames = 32; recipe.placement.displaySize = 154;
      recipe.layers = [
        layer('flame', '뒤로 누운 추진 불꽃', { x: .7, y: .64, radius: .19, rotation: -90, amount: 6, end: .83, opacity: .9, blend: 'add' }),
        layer('wind', '휘어지며 끊기는 불 꼬리', { x: .7, y: .65, radius: .39, thickness: .015, spread: 40, amount: 4, color: 1, start: .08, end: .94, blend: 'add' }),
        layer('particles', '뒤에 남는 짧은 불씨', { x: .61, y: .65, radius: .08, spread: 60, amount: 21, speed: 1.1, color: 1, start: .1, end: 1, blend: 'add' }),
      ]; break;
    case 'run-lightning': {
      recipe.palette = ['#3B66B4', '#76B8FF', '#ECF7FF']; recipe.settings.frames = 28; recipe.placement.displaySize = 164;
      recipe.layers = [layer('wind', '번개 뒤의 옅은 속도 잔광', { x: .78, y: .62, radius: .44, thickness: .006, spread: 30, amount: 3, opacity: .6, color: 0 })];
      const paths: DrawPoint[][] = [
        [[.77,.61],[.64,.57],[.67,.62],[.51,.59],[.56,.65],[.37,.61],[.42,.66],[.18,.64]],
        [[.74,.68],[.61,.72],[.65,.67],[.5,.7],[.53,.64],[.32,.7],[.37,.64],[.15,.68]],
        [[.75,.6],[.61,.51],[.64,.58],[.48,.53],[.53,.59],[.3,.55],[.36,.6],[.21,.57]],
      ];
      const strokes: DrawStroke[] = paths.map((points,i) => ({
        id: `${id}-bolt-${i}`, role: 'effect', purpose: 'appearance', meaning: `점멸 번개 ${i+1}`, points, step: 1, delay: .02 + i * .13, duration: .14, linger: .12,
        color: recipe.palette[1], guideColor: '#70BAFF', width: .006 + i * .001, style: 'trail', followActor: false, fold: false, tool: 'pen', note: '짧게 켜진 뒤 꼬리부터 소멸하는 이동 번개',
        fadeAlong: { from: [.15,.65], to: [.78,.65], start: .35, end: 1, softness: .25 },
      }));
      recipe.drawing = { version: 1, enabled: true, showBase: true, prompt: '오른쪽으로 질주할 때 뒤에 남는 세 갈래 지그재그 번개. 짧은 점멸 후 꼬리부터 사라집니다. 캐릭터 이동과 피해는 포함하지 않습니다.', strokes };
      break;
    }
  }
  return recipe;
}

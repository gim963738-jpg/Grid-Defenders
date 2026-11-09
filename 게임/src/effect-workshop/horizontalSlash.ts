import type { EffectRecipe } from './model';
import type { DrawPoint, DrawStroke } from './drawingModel';

export function createHorizontalSlash(): EffectRecipe {
  const palette: EffectRecipe['palette'] = ['#2C6EB5', '#9AE7FF', '#F3FCFF'];
  const stroke = (id: string, meaning: string, points: DrawPoint[], purpose: 'path' | 'appearance', color: string, width: number, delay: number, duration: number, linger: number, style: DrawStroke['style']): DrawStroke => ({
    id, meaning, role: 'effect', points, purpose, color, guideColor: purpose === 'path' ? '#f4ce55' : '#70baff', step: 1, duration, delay, linger, width, style, followActor: false, fold: false,
    note: meaning, tool: points.length === 2 ? 'line' : 'pen', ...(points.length === 2 ? { anchors: points.map(p => [...p] as DrawPoint) } : {}),
    fadeAlong: { from: [.09, .5], to: [.91, .5], start: .12, end: .94, softness: .18 },
  });
  return {
    format: 'gd.effect@1', name: '수평 일섬', settings: { size: 256, frames: 39, fps: 60, pixelSize: 1, loop: false }, palette,
    placement: { pivotX: .5, pivotY: .5, displaySize: 220, impactFrame: 4 },
    layers: [{ id: 'horizontal-optional-flash', name: '보조 섬광', type: 'burst', enabled: false, blend: 'add', color: 2, x: .5, y: .5, start: .08, end: .25, radius: .04, thickness: .008, rotation: 0, spread: 360, amount: 4, speed: 1, opacity: .6, seed: 162 }],
    drawing: {
      version: 1, enabled: true, showBase: false, prompt: '가로 일직선의 진한 검상이 먼저 한 번에 나타납니다. 움직이는 점과 뻗어나가는 보조 선은 없습니다. 잠깐 선명하게 남았다가 왼쪽 시작점부터 오른쪽 끝을 향해 천천히 연해지며 지워집니다.',
      strokes: [
        stroke('horizontal-scar', '시작점부터 천천히 소멸하는 진한 수평 검상', [[.09, .5], [.22, .49], [.78, .494], [.91, .5], [.78, .506], [.22, .51]], 'appearance', palette[0], .014, .0075, .45, .1925, 'field'),
        stroke('horizontal-core', '검상 중앙의 가느다란 검광', [[.09, .5], [.91, .5]], 'appearance', palette[1], .005, .0075, .45, .1925, 'trail'),
      ],
    },
  };
}

/** Update the named effect in place through the workshop's normal undoable commit. */
export function applyHorizontalFade(recipe: EffectRecipe): void {
  const next = createHorizontalSlash();
  recipe.drawing = next.drawing; delete recipe.sequence;
  recipe.settings.frames = next.settings.frames; recipe.settings.fps = next.settings.fps; recipe.placement.impactFrame = next.placement.impactFrame;
  recipe.drawing!.strokes.forEach((s, i) => { s.color = recipe.palette[i === 0 ? 0 : 1]; });
}

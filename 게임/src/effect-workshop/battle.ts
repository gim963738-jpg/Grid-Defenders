import { Application, Assets, Container, Sprite, Texture } from 'pixi.js';
import { Defense } from '../defense';
import { createDefenseView } from '../defenseView';
import { loadHeroArt, heroFrame } from '../heroArt';
import { battleResolution } from '../renderQuality';
import { skillFramePlacement } from '../skillVisual';
import type { EffectFrame } from './renderer';
import type { EffectRecipe } from './model';
import { drawingActor, drawingTime } from './drawingModel';

/** Actual game renderer, isolated model: no ticks, rewards, damage or player saves. */
export async function createBattlePreview(host: HTMLElement) {
  const app = new Application();
  await app.init({ width: 390, height: 430, preference: 'webgl', resolution: battleResolution(devicePixelRatio), antialias: true, backgroundAlpha: 0 });
  try {
    const base = `${import.meta.env.BASE_URL}assets/`;
    const [, textures] = await Promise.all([loadHeroArt(), Promise.all([
      'heroes/ranged-idle.png', 'heroes/melee-idle.png', 'effects/fire-skill-sheet.png',
      'effects/sword-basic-sheet.png', 'effects/blade-skill-sheet.png', 'battlefields/forest-clearing-v1.png',
    ].map(path => Assets.load<Texture>(base + path)))]);
    const game = new Defense(() => 1);
    game.summon('assassin', 0); game.summon('tank', 1); game.summon('arcanist', 5);
    const target = game.enemies[0]; Object.assign(target, { x: 170, y: 28, hp: 900, maxHp: 1000, speed: 0 });
    game.enemies.push({ ...target, id: 990, x: 235, y: 155 });
    const view = createDefenseView(app, game, () => {}, textures[0], textures[1], textures[2], textures[3], textures[4], () => false, { top: 100, terrain: textures[5] });
    // Same unclipped frame/anchor/scale contract as live skills. Input stays on the host.
    const overlay = new Container(); overlay.eventMode = 'none'; view.effectLayer.addChild(overlay);
    const sprite = new Sprite(Texture.EMPTY); sprite.eventMode = 'none'; sprite.visible = false; overlay.addChild(sprite);
    const actor = new Sprite(heroFrame('assassin')!.texture); actor.eventMode = 'none'; actor.anchor.set(.5, 1); actor.height = 57; actor.scale.x = actor.scale.y; actor.visible = false; overlay.addChild(actor);
    const surface = app.canvas; surface.setAttribute('aria-label', '실제 전장 렌더러의 독립 이펙트 미리보기'); host.replaceChildren(surface);
    let x = 170, y = 128;
    const setPosition = (nextX: number, nextY: number) => { x = nextX; y = nextY; };
    const draw = (frame: EffectFrame | undefined, recipe: EffectRecipe) => {
      const position = frame ? drawingActor(recipe.drawing, drawingTime(recipe, frame.index)) : null;
      const originalUnits = game.units;
      if (position) game.units = originalUnits.filter(u => u.kind !== 'assassin');
      try { view.draw(null, false); } finally { game.units = originalUnits; }
      actor.visible = !!position;
      if (position) actor.position.set(x + (position[0] - recipe.placement.pivotX) * recipe.placement.displaySize, y - 100 + (position[1] - recipe.placement.pivotY) * recipe.placement.displaySize);
      if (frame) {
        const p = skillFramePlacement(frame.art, x, y, recipe.placement.displaySize);
        sprite.texture = frame.art.texture; sprite.anchor.set(p.anchorX, p.anchorY);
        sprite.position.set(p.x, p.y - 100); sprite.width = p.width; sprite.height = p.height; sprite.visible = true;
      } else sprite.visible = false;
      app.render();
    };
    return { draw, setPosition, destroy: () => app.destroy(true, { children: true }) };
  } catch (error) { app.destroy(true, { children: true }); throw error; }
}

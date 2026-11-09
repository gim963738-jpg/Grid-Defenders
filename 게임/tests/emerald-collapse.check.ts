import { cloneRecipe, createPreset, parseRecipe, STORAGE_KEY, validateRecipe, type EffectRecipe } from '../src/effect-workshop/model';
import { EMERALD_SQUARE_JOIN, EMERALD_SQUARE_START, reviseEmeraldCollapse } from '../src/effect-workshop/emeraldWeave';
import { beamPoints, sampleLight, validateSequence } from '../src/effect-workshop/sequenceModel';
import { destroyFrames, renderFrame } from '../src/effect-workshop/renderer';

export function checkEmeraldCollapse() {
  const passed: string[] = [], check = (ok: boolean, message: string) => { if (!ok) throw Error(message); passed.push(message); };
  const r = createPreset('emerald'), s = r.sequence!, tracks = s.lights.filter(l => l.id !== 'weave-core');
  const points = (frame: number) => tracks.map(l => sampleLight(l, (frame - 1) / 63));
  const radius = (frame: number) => Math.max(...points(frame).map(p => Math.hypot(p.x - .5, p.y - .5)));
  check(s.beams.length === 4 && s.beams.every(b => b.bend === 0), 'the rotating figure keeps four straight connected sides');
  let square = true;
  for (let frame = 32; frame <= 57; frame++) {
    const p = points(frame), radii = p.map(p => Math.hypot(p.x - .5, p.y - .5));
    const edges = s.beams.map(b => { const a = p[tracks.findIndex(l => l.id === b.from)], z = p[tracks.findIndex(l => l.id === b.to)]; return Math.hypot(a.x - z.x, a.y - z.y); });
    square &&= Math.max(...radii) - Math.min(...radii) < 1e-9 && Math.max(...edges) - Math.min(...edges) < 1e-9;
  }
  check(square, 'every frame from32 through57 remains an equal-sided square about the same center');
  check(Array.from({ length: 26 }, (_, i) => radius(i + 33) <= radius(i + 32) + 1e-9).every(Boolean), 'the square shrinks on every frame without expanding again');
  check(radius(57) < radius(32) * .08 && radius(58) < .02, 'the square is almost fully collapsed before frame58');
  const a = points(32)[0], b = points(40)[0]; check(Math.abs((a.x - .5) * (b.y - .5) - (a.y - .5) * (b.x - .5)) > .005, 'the figure visibly rotates while shrinking');
  check(s.beams.every(b => b.afterimage?.copies === 4 && b.afterimage.start === EMERALD_SQUARE_START && b.afterimage.opacity < .4), 'four soft delayed square afterimages start with the collapse');
  const noEcho = cloneRecipe(r); noEcho.sequence!.beams.forEach(b => delete b.afterimage);
  const ghostFrame = renderFrame(r, 43), plainFrame = renderFrame(noEcho, 43); check(ghostFrame.art.url !== plainFrame.art.url, 'whole-square afterimages are present in actual PNG pixels'); destroyFrames([ghostFrame, plainFrame]);
  const earlyEcho = renderFrame(r, 30), earlyPlain = renderFrame(noEcho, 30); check(earlyEcho.art.url === earlyPlain.art.url, 'afterimages do not alter the opening before frame32'); destroyFrames([earlyEcho, earlyPlain]);
  const customized = cloneRecipe(r); customized.palette = ['#137F7F', '#6DEBE3', '#E9FFFF']; customized.sequence!.lightScale = 1.4; customized.sequence!.glow = 1.6;
  const before = cloneRecipe(customized), beforeStart = customized.sequence!.lights.map(l => sampleLight(l, .3)), beforeJoin = customized.sequence!.lights.map(l => sampleLight(l, EMERALD_SQUARE_JOIN));
  reviseEmeraldCollapse(customized);
  check(JSON.stringify(customized.palette) === JSON.stringify(before.palette) && customized.sequence!.glow === 1.6 && customized.sequence!.lightScale === 1.4 && JSON.stringify(customized.settings) === JSON.stringify(before.settings), 'applying the motion revision preserves user colors, controls and playback settings');
  const near = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y) < 1e-9;
  check(customized.sequence!.lights.every((l, i) => near(sampleLight(l, .3), beforeStart[i]) && near(sampleLight(l, EMERALD_SQUARE_JOIN), beforeJoin[i])), 'applying or reapplying preserves the opening and exact frame58 joining pose');
  check(JSON.stringify(parseRecipe(JSON.stringify(r)).sequence) === JSON.stringify(validateSequence(s)), 'afterimage settings survive editable JSON round-trip');
  let rejected = false; try { validateRecipe({ ...r, sequence: { ...s, beams: [{ ...s.beams[0], afterimage: { ...s.beams[0].afterimage!, copies: 999 } }] } }); } catch { rejected = true; }
  check(rejected, 'imported afterimage allocation is bounded');
  return passed;
}

export async function checkEmeraldCollapseUI() {
  const backup = localStorage.getItem(STORAGE_KEY), passed: string[] = [], q = <T extends HTMLElement = HTMLElement>(s: string) => document.querySelector<T>(s)!;
  const check = (ok: boolean, message: string) => { if (!ok) throw Error(message); passed.push(message); }, wait = () => new Promise(r => setTimeout(r, 150));
  const state = (): EffectRecipe => { const d = JSON.parse(localStorage.getItem(STORAGE_KEY)!); return d.entries.find((e: { id: string }) => e.id === d.activeId).recipe; };
  try {
    q('[data-library=presets]').click(); q('[data-preset=emerald]').click(); q('[data-view=editor]').click(); await wait();
    const input = q<HTMLInputElement>('[data-sequence-prop=glow]'); input.value = '1.5'; input.dispatchEvent(new Event('input', { bubbles: true })); await wait();
    const before = JSON.stringify(state()), count = JSON.parse(localStorage.getItem(STORAGE_KEY)!).entries.length;
    q('[data-action=emerald-collapse]').click(); await wait();
    check(state().sequence!.glow === 1.5 && state().sequence!.beams.every(b => b.afterimage?.copies === 4), 'the motion button applies square afterimages while retaining user glow');
    check(JSON.parse(localStorage.getItem(STORAGE_KEY)!).entries.length === count, 'applying the revision edits the current work without duplicating the library entry');
    q('[data-action=undo]').click(); await wait(); check(JSON.stringify(state()) === before, 'undo restores the complete saved work before the motion revision');
    q('[data-action=redo]').click(); await wait(); check(!!state().sequence!.beams[0].afterimage, 'redo restores the square-collapse revision');
    return passed;
  } finally { if (backup === null) localStorage.removeItem(STORAGE_KEY); else localStorage.setItem(STORAGE_KEY, backup); }
}

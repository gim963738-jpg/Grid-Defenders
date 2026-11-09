import { PRESET_INFO, STORAGE_KEY, createPreset, type SavedEffect } from '../src/effect-workshop/model';
import { filterGallery, galleryFrameAt, galleryItems, galleryLaunch, makeConceptRequest } from '../src/effect-workshop/galleryModel';
import { destroyFrames, renderFrame, renderPreviewCanvas } from '../src/effect-workshop/renderer';

export function checkEffectGallery() {
  const passed: string[] = [], check = (ok: boolean, label: string) => { if (!ok) throw Error(label); passed.push(label); };
  const records: SavedEffect[] = ['first', 'second'].map(id => ({ id, updatedAt: '2026-11-07T00:00:00.000Z', recipe: { ...createPreset('horizontal'), name: '같은 이름' } }));
  const before = JSON.stringify(records), items = galleryItems(records), saved = filterGallery(items, 'saved', '');
  check(items.length === PRESET_INFO.length + 2 && saved.length === 2, 'the catalog includes every preset and saved work without collapsing duplicate names');
  check(saved[0].key !== saved[1].key && saved[0].href !== saved[1].href, 'saved work links address IDs rather than ambiguous display names');
  check(JSON.stringify(records) === before, 'building a gallery never changes saved artwork or selection');
  check(filterGallery(items, 'preset', '  진한 검상  ').length === 1 && filterGallery(items, 'saved', '없는 이름').length === 0, 'search uses trimmed names and descriptions within the chosen source');
  check(galleryLaunch('?preset=emerald').preset === 'emerald' && !galleryLaunch('?preset=missing').preset, 'only actual preset IDs can request a new work');
  check(galleryLaunch('?entry=first&preset=slash').entry === 'first', 'a saved-work link takes precedence and cannot accidentally duplicate a preset');
  const fast = createPreset('horizontal'), long = createPreset('emerald'), duration = fast.settings.frames / fast.settings.fps * 1000;
  check(galleryFrameAt(fast, 100) === 6 && galleryFrameAt(long, 100) === 2, 'each preview uses its own authored FPS instead of sharing a frame counter');
  check(galleryFrameAt(fast, duration + 100) === fast.settings.frames - 1 && galleryFrameAt(fast, duration + 300) === 0, 'the last frame holds briefly before a clean loop restart');
  const request = makeConceptRequest('연결·분열', '초록빛, 묵직하게', '2', saved);
  check(request.includes('완성 시안 3개') && request.includes('초록빛, 묵직하게') && request.includes('약 2초') && request.includes('같은 이름') && request.includes('기존 작업을 보존'), 'the concept request carries the chosen need, mood, duration and references while preserving source work');
  for (const item of items.filter(i => i.source === 'preset')) {
    const frameIndex = Math.floor(item.recipe.settings.frames * .4), frame = renderFrame(item.recipe, frameIndex), preview = renderPreviewCanvas(item.recipe, frameIndex);
    try { check(preview.toDataURL() === frame.canvas.toDataURL(), `${item.recipe.name}: lightweight gallery rendering preserves the exact padded workshop pixels`); }
    finally { destroyFrames([frame]); preview.width = preview.height = 0; }
  }
  return passed;
}

/** Run only in a separate gallery QA origin. Restores the exact saved library afterwards. */
export async function checkEffectGalleryUI() {
  const passed: string[] = [], backup = localStorage.getItem(STORAGE_KEY);
  const q = <T extends HTMLElement = HTMLElement>(s: string) => document.querySelector<T>(s)!;
  const check = (ok: boolean, label: string) => { if (!ok) throw Error(label); passed.push(label); };
  const wait = (ms = 160) => new Promise(r => setTimeout(r, ms));
  const refresh = () => window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY }));
  const change = (selector: string, value: string) => { const input = q<HTMLInputElement>(selector); input.value = value; input.dispatchEvent(new Event('change', { bubbles: true })); };
  const search = (value: string) => { q<HTMLInputElement>('#gallery-search').value = value; q('#gallery-search').dispatchEvent(new Event('input', { bubbles: true })); };
  const fixtures: SavedEffect[] = [
    { id: 'gallery-check-one', updatedAt: new Date().toISOString(), recipe: { ...createPreset('horizontal'), name: '같은 이름' } },
    { id: 'gallery-check-two', updatedAt: new Date().toISOString(), recipe: { ...createPreset('emerald'), name: '같은 이름' } },
    { id: 'gallery-check-text', updatedAt: new Date().toISOString(), recipe: { ...createPreset('slash'), name: '<img src=x onerror=alert(1)>' } },
  ];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, entries: fixtures, activeId: fixtures[0].id })); refresh();
    const stored = localStorage.getItem(STORAGE_KEY);
    q('[data-source="preset"]').click(); search('');
    check(document.querySelectorAll('.g-card').length === PRESET_INFO.length, 'the default page presents every registered basic effect as a card');
    search('매듭'); await wait();
    const card = q('.g-card'); card.scrollIntoView({ block: 'center' });
    const deadline = performance.now() + 5000;
    while (!card.dataset.ready && performance.now() < deadline) await wait(40);
    check(!!card.dataset.ready, 'a visible sequence effect renders into its card');
    q('#gallery-restart').click(); await wait(60);
    const a = q<HTMLCanvasElement>('.g-card canvas').dataset.frame; let b = a;
    const movingDeadline = performance.now() + 1500;
    while (a === b && performance.now() < movingDeadline) { await wait(50); b = q<HTMLCanvasElement>('.g-card canvas').dataset.frame; }
    check(a !== b, 'the gallery advances actual animation frames without hover');
    q('#gallery-play').click(); await wait();
    const c = q<HTMLCanvasElement>('.g-card canvas'), held = c.dataset.frame; await wait(180);
    check(held === c.dataset.frame, 'the global pause freezes the visible preview');
    const frame = renderFrame(createPreset('emerald'), Number(held)), expected = document.createElement('canvas'); expected.width = expected.height = 224;
    expected.getContext('2d')!.drawImage(frame.canvas, 0, 0, 224, 224); destroyFrames([frame]);
    check(expected.toDataURL() === c.toDataURL(), 'a gallery frame matches the workshop renderer including the current emerald motion');
    change('#gallery-background', 'gray'); check(q('#gallery').dataset.background === 'gray', 'bright-background inspection updates the actual preview stage');
    q('[data-source="saved"]').click(); search('같은 이름'); await wait();
    check(document.querySelectorAll('.g-card').length === 2 && new Set(Array.from(document.querySelectorAll<HTMLAnchorElement>('.g-edit')).map(a => a.href)).size === 2, 'same-named saved effects remain independently selectable for editing');
    search('');
    check(!document.querySelector('.g-card h3 img') && Array.from(document.querySelectorAll('.g-card h3')).some(n => n.textContent === '<img src=x onerror=alert(1)>'), 'saved names are displayed as text rather than executable HTML');
    q('[data-source="preset"]').click();
    const refs = document.querySelectorAll<HTMLButtonElement>('[data-reference]'); refs[0].click(); refs[1].click(); refs[2].click(); refs[3].click();
    check(document.querySelectorAll('[data-reference][aria-pressed="true"]').length === 3, 'reference selection is limited to three and does not replace the previous selection');
    q('#gallery-guide').click();
    check(q<HTMLDialogElement>('#concept-dialog').open && q<HTMLTextAreaElement>('#concept-request').value.includes('수평 일섬'), 'the concept dialog uses the actual selected references');
    q<HTMLInputElement>('#concept-mood').value = '푸른 번개, 짧고 묵직하게'; q('#concept-mood').dispatchEvent(new Event('input', { bubbles: true }));
    check(q<HTMLTextAreaElement>('#concept-request').value.includes('푸른 번개, 짧고 묵직하게'), 'editing the desired feel changes the copyable request');
    q('#concept-close').click(); search('없을만한이름');
    check(!q('#gallery-empty').hidden && !document.querySelector('.g-card'), 'a search with no matches has a clear empty state');
    check(localStorage.getItem(STORAGE_KEY) === stored, 'browsing, playback, filters and request preparation never write to the workshop library');
    localStorage.setItem(STORAGE_KEY, '{broken'); refresh();
    check(!q('#gallery-error').hidden && localStorage.getItem(STORAGE_KEY) === '{broken', 'a damaged library is reported without overwriting the saved data');
    search(''); q('[data-source="preset"]').click();
    check(document.querySelectorAll('.g-card').length === PRESET_INFO.length, 'basic effects remain available when saved work cannot be read');
    return passed;
  } finally {
    if (backup === null) localStorage.removeItem(STORAGE_KEY); else localStorage.setItem(STORAGE_KEY, backup);
    refresh();
  }
}

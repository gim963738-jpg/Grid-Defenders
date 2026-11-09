import { STORAGE_KEY, cloneRecipe, createPreset } from '../src/effect-workshop/model';

/** Run on effect-workshop.html. Restore browser data, then reload after collecting results. */
export async function checkEffectWorkshopUI() {
  const passed: string[] = [], backup = localStorage.getItem(STORAGE_KEY);
  const check = (ok: boolean, label: string) => { if (!ok) throw Error(label); passed.push(label); };
  const get = <T extends HTMLElement = HTMLElement>(selector: string) => document.querySelector<T>(selector)!;
  const click = (selector: string) => get(selector).click();
  const wait = (ms = 130) => new Promise(resolve => setTimeout(resolve, ms));
  const change = (selector: string, value: string) => { const input = get<HTMLInputElement>(selector); input.value = value; input.dispatchEvent(new Event('change', { bubbles: true })); };
  const current = () => { const data = JSON.parse(localStorage.getItem(STORAGE_KEY)!); return data.entries.find((entry: { id: string }) => entry.id === data.activeId).recipe; };
  const close = () => click('[data-action="close-dialog"]');
  try {
    click('[data-library="presets"]');
    check(!!get('#preview-canvas') && !!get('[data-action="export"]'), 'the complete workshop mounts with canvas and export controls');
    click('[data-preset="ice"]'); await wait();
    check(get('#document-name').textContent === '서리 파편' && current().name === '서리 파편', 'a preset becomes a distinct editable, autosaved work');
    change('[data-path="name"]', '공방 UI 검증'); await wait();
    check(get('#document-name').textContent === '공방 UI 검증' && current().name === '공방 UI 검증', 'renaming updates the document and persistent work together');
    click('[data-action="undo"]'); await wait(); check(get('#document-name').textContent === '서리 파편', 'undo restores the previous complete recipe');
    click('[data-action="redo"]'); await wait(); check(get('#document-name').textContent === '공방 UI 검증', 'redo restores the edited recipe');
    const layers = current().layers.length;
    change('#add-layer', 'ring'); await wait(); check(current().layers.length === layers + 1, 'adding a layer changes the saved recipe');
    click('[data-action="layer-delete"]'); await wait(); check(current().layers.length === layers, 'deleting a layer preserves the remaining composition');
    const visibility = get('[data-visible]'), id = visibility.dataset.visible;
    visibility.click(); await wait(); check(!current().layers.find((l: { id: string }) => l.id === id).enabled, 'layer visibility is persisted');
    get(`[data-visible="${id}"]`).click(); await wait();
    const palette = get<HTMLInputElement>('[data-palette="0"]'); palette.value = '#2455ff'; palette.dispatchEvent(new Event('input', { bubbles: true })); await wait();
    check(current().palette[0] === '#2455ff', 'color editing updates the saved palette');
    change('[data-path="settings.frames"]', '64'); change('[data-path="settings.fps"]', '16'); await wait();
    check(get('#timeline-frames').children.length === 64 && get<HTMLInputElement>('#scrubber').max === '64', 'frame-count editing rebuilds timeline and scrub limits');
    if (get('#loop').getAttribute('aria-pressed') === 'true') click('#loop');
    for (const speed of ['0.25', '1', '5']) {
      change('#speed', speed); click('[data-action="stop"]'); const started = performance.now(); click('[data-action="play"]');
      await wait(400); await new Promise(requestAnimationFrame);
      const elapsed = (performance.now() - started) / 1000;
      if (get('#play-button').getAttribute('aria-label') === '일시정지') click('[data-action="play"]');
      const progress = Number(get<HTMLInputElement>('#scrubber').value) - 1, expected = Math.min(63, Math.floor(elapsed * 16 * Number(speed)));
      check(progress > 0 && Math.abs(progress - expected) <= 2, `${speed}x playback advances at the selected speed (actual ${progress}, expected ${expected})`);
      const held = get('#frame-counter').textContent; await wait(120); check(get('#frame-counter').textContent === held, `${speed}x pause freezes the exact frame`);
    }
    click('[data-action="next"]'); const selected = Number(get<HTMLInputElement>('#scrubber').value);
    click('[data-action="previous"]'); check(Number(get<HTMLInputElement>('#scrubber').value) === selected - 1, 'frame stepping moves exactly one logical frame');
    click('[data-view="frames"]'); change('#background', 'green'); await wait();
    check(get('#frame-preview').children.length === 64 && get('.ws-preview-wrap').dataset.background === 'green', 'all frames can be inspected together on a bright background');
    click('[data-view="editor"]'); click('[data-action="ai"]');
    const prompt = get<HTMLTextAreaElement>('#ai-prompt').value;
    check(prompt.includes('gd.effect@1') && prompt.includes('공방 UI 검증'), 'AI handoff contains the actual current work and supported format');
    get<HTMLTextAreaElement>('#ai-request').value = '파란 얼음 파편을 늘려줘'; get('#ai-request').dispatchEvent(new Event('input', { bubbles: true }));
    check(get<HTMLTextAreaElement>('#ai-prompt').value.includes('파란 얼음 파편을 늘려줘'), 'AI request text updates the complete handoff'); close();
    click('[data-action="import"]'); get<HTMLTextAreaElement>('#import-text').value = '{'; click('[data-action="import-text"]');
    check(!!get('#import-error').textContent && get('#document-name').textContent === '공방 UI 검증', 'invalid imports show a useful error and preserve the current work');
    const imported = createPreset('explosion'); imported.name = '검증용 가져오기';
    get<HTMLTextAreaElement>('#import-text').value = JSON.stringify(imported); click('[data-action="import-text"]'); await wait();
    check(!get<HTMLDialogElement>('#workshop-dialog').open && current().name === '검증용 가져오기', 'valid JSON imports as a new, autosaved editable work');
    change('[data-layer-prop="x"]', '.02'); await wait(); click('[data-action="export"]');
    check(get<HTMLButtonElement>('[data-action="export-sheet"]').disabled && !get<HTMLButtonElement>('[data-action="export-recipe"]').disabled, 'clipped artwork blocks PNG export while editable JSON remains available'); close();
    click('[data-action="undo"]'); await wait(); click('[data-action="export"]');
    check(!get<HTMLButtonElement>('[data-action="export-sheet"]').disabled, 'fixing bounds re-enables PNG export');
    const blobs: Blob[] = [], names: string[] = [], originalCreate = URL.createObjectURL, originalClick = HTMLAnchorElement.prototype.click;
    URL.createObjectURL = value => { if (value instanceof Blob) blobs.push(value); return originalCreate(value); };
    HTMLAnchorElement.prototype.click = function () { if (this.download) names.push(this.download); else originalClick.call(this); };
    try {
      click('[data-action="export-sheet"]');
      const deadline = performance.now() + 5000;
      while (!blobs.length && performance.now() < deadline) await wait(50);
      check(blobs.length > 0, 'PNG encoding finishes before export validation');
      const png = blobs[0], bitmap = await createImageBitmap(png), columns = Number(get<HTMLSelectElement>('#export-columns').value), cell = imported.settings.size + 48;
      check(png.type === 'image/png' && bitmap.width === columns * cell && bitmap.height === Math.ceil(24 / columns) * cell, 'PNG export produces a decodable sprite sheet with the selected layout'); bitmap.close();
      click('[data-action="export-metadata"]'); const metadata = JSON.parse(await blobs[1].text());
      check(metadata.frames.length === 24 && metadata.background === 'transparent' && metadata.frames[0].pivot.x === 88 && metadata.impactTimeMs === imported.placement.impactFrame / 30 * 1000, 'metadata export includes every frame, transparent source, padded pivot and completion timing');
      click('[data-action="export-recipe"]'); const exported = JSON.parse(await blobs[2].text());
      check(JSON.stringify(exported) === JSON.stringify(current()) && names.some(name => name.endsWith('.effect.json')), 'editable export is the actual saved composition with a portable filename');
    } finally { URL.createObjectURL = originalCreate; HTMLAnchorElement.prototype.click = originalClick; }
    close();
    click('[data-action="duplicate"]'); await wait(); check(current().name === '검증용 가져오기 복사', 'duplicate creates an independent named work');
    click('[data-action="delete"]'); close(); check(current().name === '검증용 가져오기 복사', 'cancelling deletion preserves the work');
    click('[data-action="delete"]'); click('[data-action="confirm-delete"]'); await wait(); check(current().name !== '검증용 가져오기 복사', 'confirmed deletion removes only the selected work');
    const bad = cloneRecipe(imported); bad.layers[0].id = '\" onclick=alert(1)';
    click('[data-action="import"]'); get<HTMLTextAreaElement>('#import-text').value = JSON.stringify(bad); click('[data-action="import-text"]');
    check(!!get('#import-error').textContent, 'unsafe layer identifiers fail validation inside the actual import flow'); close();
    return passed;
  } finally {
    if (backup === null) localStorage.removeItem(STORAGE_KEY); else localStorage.setItem(STORAGE_KEY, backup);
  }
}

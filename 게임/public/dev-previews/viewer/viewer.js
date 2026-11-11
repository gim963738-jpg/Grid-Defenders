import { autoMode, clamp, parseSequence, validateCollection } from './core.js';
import { clearPreviews, loadImage, preview } from './render.js';

const $ = id => document.getElementById(id);
const DEFAULTS = { effect: 'original', strength: 50, resolution: 100, quality: 100, smooth: true };
const state = {
  collection: null, assetId: null, mode: 'gallery', media: 'frame', zoom: 'fit', background: 'checker',
  filters: { ...DEFAULTS }, referenceFilters: true, sequence: [], cursor: 0, fps: 12, loop: true,
  playing: false, ready: false, history: [],
};
let catalog = [], generation = 0, libraryGeneration = 0, tick = 0, accumulated = 0, lastTime = 0;
const objectUrls = new Set();
const active = () => state.collection?.assets.find(a => a.id === state.assetId);
const referenceId = () => active()?.referenceId || state.collection?.referenceId || '';
function status(message = '') { $('status').textContent = message; }
function fail(error) { status(error.message || String(error)); }
function notifyReady() { state.ready = true; document.documentElement.dataset.ready = 'true'; }
function stop() { state.playing = false; $('play').textContent = '▶'; $('play').setAttribute('aria-label', '재생'); accumulated = 0; }
function requestRender() { render().catch(fail); }

function syncControls() {
  const a = active(), sheet = a?.sheet;
  document.querySelectorAll('[data-mode]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === state.mode)));
  document.querySelector('[data-mode="compare"]').disabled = state.collection.assets.length < 2;
  document.querySelectorAll('[data-media]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.media === state.media)));
  $('media').hidden = !sheet; $('timeline').hidden = !sheet; $('sheet-settings').hidden = !sheet;
  $('is-sheet').checked = Boolean(sheet);
  $('original').href = a?.src || '#'; $('original').download = a?.label || 'original';
  $('frames').hidden = !sheet;
  if (sheet) {
    for (const [id, key] of [['columns', 'columns'], ['rows', 'rows'], ['frame-count', 'count'], ['margin-x', 'marginX'], ['margin-y', 'marginY'], ['spacing-x', 'spacingX'], ['spacing-y', 'spacingY']]) $(id).value = sheet[key] ?? 0;
    $('sequence').value = state.sequence.join(',');
  }
  $('reference').replaceChildren(new Option('없음', ''), ...state.collection.assets.filter(x => x.id !== a?.id).map(x => new Option(x.label, x.id)));
  $('reference').value = referenceId();
  for (const [id, key] of [['effect', 'effect'], ['strength', 'strength'], ['resolution', 'resolution'], ['quality', 'quality']]) $(id).value = state.filters[key];
  $('smooth').checked = state.filters.smooth; $('reference-filters').checked = state.referenceFilters;
  for (const key of ['strength', 'resolution', 'quality']) $(key + '-value').value = state.filters[key] + '%';
  $('background').value = state.background;
  $('count').textContent = state.collection.assets.filter(x => x.role !== 'reference').length + '개';
}

function assetList() {
  const query = $('search').value.trim().toLowerCase();
  $('assets').replaceChildren();
  for (const a of state.collection.assets.filter(x => x.role !== 'reference' && x.label.toLowerCase().includes(query))) {
    const button = document.createElement('button'); button.className = 'asset'; button.dataset.asset = a.id;
    button.setAttribute('aria-pressed', String(a.id === state.assetId));
    const img = document.createElement('img'); img.src = a.src; img.loading = 'lazy'; img.alt = '';
    const label = document.createElement('span'); label.textContent = a.label;
    button.append(img, label);
    if (a.sheet) { const small = document.createElement('small'); small.textContent = a.sheet.count + ' 프레임'; button.append(small); }
    button.addEventListener('click', () => selectAsset(a.id));
    $('assets').append(button);
  }
}

function chooseCollection(collection, options = {}) {
  stop(); state.ready = false; document.documentElement.dataset.ready = 'false';
  state.collection = structuredClone(validateCollection(collection));
  const a = state.collection.assets.find(x => x.id === options.asset) || state.collection.assets.find(x => x.role !== 'reference') || state.collection.assets[0];
  state.assetId = a.id; state.mode = options.mode || autoMode(state.collection, a); state.cursor = 0;
  state.sequence = a.sheet ? Array.from({ length: a.sheet.count }, (_, i) => i + 1) : [];
  $('search').value = ''; $('collection').value = collection.id;
  clearPreviews(); syncControls(); assetList(); frameList();
  const url = new URL(location.href); url.searchParams.set('collection', collection.id); url.searchParams.delete('asset'); url.searchParams.delete('mode');
  history.replaceState(null, '', url);
  render().then(notifyReady).catch(error => { fail(error); notifyReady(); });
}

function selectAsset(id) {
  stop(); const previous = referenceId(); state.assetId = id; state.cursor = 0;
  const a = active(); if (!a) return;
  state.sequence = a.sheet ? Array.from({ length: a.sheet.count }, (_, i) => i + 1) : [];
  if (referenceId() !== previous || state.mode === 'compare') state.mode = autoMode(state.collection, a) === 'compare' ? 'compare' : 'focus';
  syncControls(); assetList(); frameList(); requestRender();
}

function cards() {
  const a = active();
  if (!a) return [];
  if (state.mode === 'gallery') return state.collection.assets.filter(x => x.role !== 'reference').map(x => ({ asset: x, role: '' }));
  if (state.mode === 'compare') {
    const reference = state.collection.assets.find(x => x.id === referenceId());
    if (reference) return [{ asset: reference, role: '기준' }, { asset: a, role: '결과' }];
  }
  return [{ asset: a, role: '결과' }];
}

function frameFor(asset) {
  if (!asset.sheet || state.media === 'sheet') return null;
  return asset.id === state.assetId ? (state.sequence[state.cursor] || 1) : 1;
}

function zoomCanvas(canvas, view, nativeW, nativeH) {
  const scale = state.zoom === 'fit' ? Math.min((view.clientWidth - 24) / nativeW, (view.clientHeight - 24) / nativeH, 1) : state.zoom / 100;
  const safe = Math.max(.05, scale || .5);
  canvas.style.width = nativeW * safe + 'px'; canvas.style.height = nativeH * safe + 'px';
  canvas.style.imageRendering = state.filters.smooth ? 'auto' : 'pixelated';
  if (canvas.dataset.asset === state.assetId) $('zoom').value = Math.round(safe * 100);
}

function panHandlers(view) {
  let drag = null;
  view.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    drag = { x: event.clientX, y: event.clientY, sx: view.scrollLeft, sy: view.scrollTop };
    view.setPointerCapture(event.pointerId); view.classList.add('dragging');
  });
  view.addEventListener('pointermove', event => {
    if (!drag) return;
    view.scrollLeft = drag.sx - (event.clientX - drag.x); view.scrollTop = drag.sy - (event.clientY - drag.y);
  });
  const end = () => { drag = null; view.classList.remove('dragging'); };
  view.addEventListener('pointerup', end); view.addEventListener('pointercancel', end);
  view.addEventListener('wheel', event => {
    if (!event.ctrlKey && !event.metaKey) return;
    event.preventDefault(); setZoom(Number($('zoom').value) * (event.deltaY < 0 ? 1.15 : 1 / 1.15));
  }, { passive: false });
}

async function paintCard(record, token, existing) {
  const { asset, role } = record, frame = frameFor(asset);
  let card = existing;
  if (!card) {
    card = document.createElement('article'); card.className = 'card'; card.dataset.id = asset.id;
    const header = document.createElement('header'), label = document.createElement('span'), tag = document.createElement('span');
    label.textContent = asset.label; tag.className = 'tag'; tag.textContent = role;
    header.append(label, tag);
    const view = document.createElement('div'); view.className = 'viewport'; view.tabIndex = 0;
    const surface = document.createElement('div'); surface.className = 'surface';
    const canvas = document.createElement('canvas'); canvas.dataset.asset = asset.id; canvas.setAttribute('aria-label', asset.label);
    surface.append(canvas); view.append(surface); card.append(header, view); panHandlers(view);
    if (state.mode === 'gallery') header.addEventListener('dblclick', () => { selectAsset(asset.id); state.mode = 'focus'; syncControls(); requestRender(); });
    $('stage').append(card);
  }
  const view = card.querySelector('.viewport'), canvas = card.querySelector('canvas');
  const settings = role === '기준' && !state.referenceFilters ? DEFAULTS : state.filters;
  try {
    const result = await preview(asset, frame, settings, state.mode === 'gallery' ? 720 : 4096);
    if (token !== generation || !card.isConnected) return;
    canvas.width = result.canvas.width; canvas.height = result.canvas.height;
    canvas.getContext('2d').drawImage(result.canvas, 0, 0);
    canvas.dataset.frame = frame ?? 'sheet'; canvas.dataset.pixelWidth = result.nativeWidth;
    canvas.dataset.pixelHeight = result.nativeHeight;
    zoomCanvas(canvas, view, result.nativeWidth, result.nativeHeight);
    if (asset.id === state.assetId) $('dimensions').textContent = `${result.nativeWidth} × ${result.nativeHeight} px`;
  } catch (error) {
    if (token !== generation) return;
    view.classList.add('error'); view.textContent = error.message; status(asset.label + ' · ' + error.message);
  }
}

async function render(onlyFrame = false) {
  if (!state.collection) return;
  const token = ++generation;
  $('stage').className = state.mode + ' ' + state.background;
  if (!onlyFrame) $('stage').replaceChildren();
  const records = cards();
  if (!records.length) { $('stage').textContent = '결과물 없음'; return; }
  // Gallery images are rendered in small batches to bound CPU and decoded pixels.
  for (let i = 0; i < records.length; i += 4) {
    if (token !== generation) return;
    await Promise.all(records.slice(i, i + 4).map(record => {
      if (onlyFrame && record.asset.id !== state.assetId) return;
      return paintCard(record, token, onlyFrame ? [...$('stage').children].find(c => c.dataset.id === record.asset.id) : null);
    }));
  }
  updateFrameLabel();
}

async function frameList() {
  const token = ++libraryGeneration; $('frames').replaceChildren();
  const a = active(); if (!a?.sheet) return;
  try {
    const image = await loadImage(a.src);
    if (token !== libraryGeneration) return;
    // Numbered thumbnails are visual controls, not extra result attachments.
    const { sheetRect } = await import('./core.js');
    for (let frame = 1; frame <= a.sheet.count; frame++) {
      const button = document.createElement('button'); button.className = 'frame'; button.dataset.frame = frame;
      button.setAttribute('aria-label', `프레임 ${frame}`); button.setAttribute('aria-pressed', String(state.sequence.includes(frame)));
      const thumb = document.createElement('canvas'); thumb.width = 110; thumb.height = 92;
      const ctx = thumb.getContext('2d'), rect = sheetRect(image.naturalWidth, image.naturalHeight, a.sheet, frame);
      const scale = Math.min(110 / rect.width, 92 / rect.height);
      ctx.drawImage(image, rect.x, rect.y, rect.width, rect.height, (110 - rect.width * scale) / 2, (92 - rect.height * scale) / 2, rect.width * scale, rect.height * scale);
      const label = document.createElement('span'); label.textContent = frame; button.append(thumb, label);
      button.addEventListener('click', () => {
        stop(); state.sequence = state.sequence.includes(frame) ? state.sequence.filter(f => f !== frame) : [...state.sequence, frame];
        state.cursor = 0; $('sequence').value = state.sequence.join(','); updateFrameLabel(); requestRender();
      });
      $('frames').append(button);
    }
    updateFrameLabel();
  } catch (error) { fail(error); }
}

function updateFrameLabel() {
  const frame = state.sequence[state.cursor] || 1, count = active()?.sheet?.count || 1;
  $('frame-label').value = frame + ' / ' + count;
  $('play').disabled = !state.sequence.length;
  for (const button of $('frames').children) {
    button.classList.toggle('current', Number(button.dataset.frame) === frame);
    button.setAttribute('aria-pressed', String(state.sequence.includes(Number(button.dataset.frame))));
  }
}

function setZoom(value) { state.zoom = clamp(value, 5, 800); requestRender(); }
function sequenceChanged() {
  try { const sequence = parseSequence($('sequence').value, active()?.sheet?.count || 1); stop(); state.sequence = sequence; state.cursor = 0; status(); updateFrameLabel(); requestRender(); }
  catch (error) { fail(error); }
}

function animate(time) {
  if (state.playing && state.sequence.length) {
    accumulated += Math.min(250, time - lastTime);
    const duration = 1000 / state.fps;
    if (accumulated >= duration) {
      const steps = Math.floor(accumulated / duration); accumulated %= duration;
      let next = state.cursor + steps;
      if (!state.loop && next >= state.sequence.length) { next = state.sequence.length - 1; stop(); }
      state.cursor = next % state.sequence.length;
      state.history.push(state.sequence[state.cursor]); if (state.history.length > 120) state.history.shift();
      render(true).catch(fail);
    }
  }
  lastTime = time; tick = requestAnimationFrame(animate);
}

function sheetChanged() {
  const a = active(); if (!a?.sheet) return;
  stop();
  a.sheet = { columns: Math.trunc(clamp($('columns').value, 1, 128)), rows: Math.trunc(clamp($('rows').value, 1, 128)),
    count: Number($('frame-count').value), marginX: Number($('margin-x').value), marginY: Number($('margin-y').value),
    spacingX: Number($('spacing-x').value), spacingY: Number($('spacing-y').value) };
  a.sheet.count = Math.trunc(clamp(a.sheet.count, 1, Math.min(4096, a.sheet.columns * a.sheet.rows)));
  state.sequence = Array.from({ length: a.sheet.count }, (_, i) => i + 1); state.cursor = 0;
  clearPreviews(); syncControls(); frameList(); requestRender();
}

async function importFiles(files) {
  stop(); const added = [];
  for (const file of files) {
    if (/\.json$/i.test(file.name)) {
      const data = JSON.parse(await file.text()), collection = validateCollection(data.collection || data);
      collection.id ||= 'import-' + Date.now(); collection.title ||= file.name;
      catalog.push(collection); $('collection').add(new Option(collection.title, collection.id)); chooseCollection(collection);
      if (data.filters) { state.filters = { ...DEFAULTS, ...data.filters }; syncControls(); requestRender(); }
    } else if (/^image\/(png|jpeg|webp|gif)$/.test(file.type)) {
      const src = URL.createObjectURL(file); objectUrls.add(src);
      await loadImage(src); added.push({ id: 'local-' + crypto.randomUUID(), label: file.name, src, kind: 'image' });
    }
  }
  if (added.length) {
    const collection = { id: 'local-' + Date.now(), title: '불러온 시안', category: '내 파일', assets: added };
    catalog.push(collection); $('collection').add(new Option(collection.title, collection.id)); chooseCollection(collection);
  }
}

function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob), link = document.createElement('a'); link.href = url; link.download = filename;
  link.click(); setTimeout(() => URL.revokeObjectURL(url), 2000);
}

async function download() {
  const a = active(); if (!a) return;
  const result = await preview(a, frameFor(a), state.filters, 4096);
  const blob = await new Promise(resolve => result.canvas.toBlob(resolve));
  if (!blob) throw new Error('PNG를 만들 수 없습니다');
  saveBlob(blob, `${a.id}-${frameFor(a) || 'sheet'}-preview.png`);
}

function installEvents() {
  $('collection').addEventListener('change', () => chooseCollection(catalog.find(c => c.id === $('collection').value)));
  $('search').addEventListener('input', assetList);
  $('modes').addEventListener('click', event => {
    const mode = event.target.closest('[data-mode]')?.dataset.mode; if (!mode) return;
    if (mode === 'compare' && !referenceId()) active().referenceId = state.collection.assets.find(a => a.id !== state.assetId)?.id || '';
    state.mode = mode; syncControls(); requestRender();
  });
  $('media').addEventListener('click', event => { const media = event.target.closest('[data-media]')?.dataset.media; if (!media) return; state.media = media; if (media === 'sheet') stop(); syncControls(); requestRender(); });
  $('zoom').addEventListener('change', () => setZoom($('zoom').value));
  $('zoom-out').addEventListener('click', () => setZoom(Number($('zoom').value) / 1.25));
  $('zoom-in').addEventListener('click', () => setZoom(Number($('zoom').value) * 1.25));
  $('fit').addEventListener('click', () => { state.zoom = 'fit'; requestRender(); });
  $('actual').addEventListener('click', () => setZoom(100));
  const inspector = show => { $('inspector').hidden = !show; $('settings').setAttribute('aria-expanded', String(show)); requestRender(); };
  $('settings').addEventListener('click', () => inspector($('inspector').hidden)); $('close-settings').addEventListener('click', () => inspector(false));
  $('background').addEventListener('change', () => { state.background = $('background').value; requestRender(); });
  for (const key of ['effect', 'strength', 'resolution', 'quality', 'smooth']) $(key).addEventListener(key === 'effect' || key === 'smooth' ? 'change' : 'input', () => {
    state.filters[key] = key === 'smooth' ? $('smooth').checked : key === 'effect' ? $('effect').value : Number($(key).value);
    for (const name of ['strength', 'resolution', 'quality']) $(name + '-value').value = state.filters[name] + '%';
    clearPreviews(); requestRender();
  });
  $('reference-filters').addEventListener('change', () => { state.referenceFilters = $('reference-filters').checked; requestRender(); });
  $('reset-filters').addEventListener('click', () => { state.filters = { ...DEFAULTS }; syncControls(); clearPreviews(); requestRender(); });
  $('reference').addEventListener('change', () => {
    active().referenceId = $('reference').value;
    // An explicitly cleared reference overrides a collection-level default.
    if (!$('reference').value) delete state.collection.referenceId;
    state.mode = referenceId() ? 'compare' : 'gallery'; syncControls(); requestRender();
  });
  $('is-sheet').addEventListener('change', () => {
    stop(); const a = active();
    if ($('is-sheet').checked) a.sheet = { columns: 4, rows: 3, count: 12 };
    else delete a.sheet;
    state.sequence = a.sheet ? Array.from({ length: a.sheet.count }, (_, i) => i + 1) : []; state.cursor = 0;
    syncControls(); frameList(); requestRender();
  });
  for (const id of ['columns', 'rows', 'frame-count', 'margin-x', 'margin-y', 'spacing-x', 'spacing-y']) $(id).addEventListener('change', sheetChanged);
  $('sequence').addEventListener('change', sequenceChanged); $('sequence').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); sequenceChanged(); } });
  $('all-frames').addEventListener('click', () => { $('sequence').value = '1-' + active().sheet.count; sequenceChanged(); });
  $('no-frames').addEventListener('click', () => { $('sequence').value = ''; sequenceChanged(); });
  $('play').addEventListener('click', () => {
    if (!state.sequence.length) return;
    if (state.playing) stop();
    else { state.media = 'frame'; state.playing = true; accumulated = 0; $('play').textContent = 'Ⅱ'; $('play').setAttribute('aria-label', '일시 정지'); syncControls(); requestRender(); }
  });
  for (const [id, direction] of [['previous', -1], ['next', 1]]) $(id).addEventListener('click', () => {
    stop(); if (!state.sequence.length) return; state.cursor = (state.cursor + direction + state.sequence.length) % state.sequence.length; requestRender();
  });
  $('fps').addEventListener('change', () => { state.fps = clamp($('fps').value, 1, 60); $('fps').value = state.fps; });
  $('loop').addEventListener('change', () => { state.loop = $('loop').checked; });
  $('import').addEventListener('click', () => $('files').click());
  $('files').addEventListener('change', () => { importFiles([...$('files').files]).catch(fail); $('files').value = ''; });
  document.addEventListener('dragover', e => e.preventDefault());
  document.addEventListener('drop', e => { e.preventDefault(); importFiles([...e.dataTransfer.files]).catch(fail); });
  $('download').addEventListener('click', () => download().catch(fail));
  $('export-state').addEventListener('click', () => saveBlob(new Blob([JSON.stringify({ collection: state.collection, filters: state.filters }, null, 2)], { type: 'application/json' }), 'viewer.json'));
  document.addEventListener('keydown', event => {
    if (/^(INPUT|SELECT|TEXTAREA)$/.test(event.target.tagName)) return;
    if (event.code === 'Space' && active()?.sheet) { event.preventDefault(); $('play').click(); }
    if (event.key === '+' || event.key === '=') $('zoom-in').click();
    if (event.key === '-') $('zoom-out').click();
    if (event.key === '0') $('fit').click();
  });
  new ResizeObserver(() => {
    for (const canvas of $('stage').querySelectorAll('canvas[data-pixel-width]')) zoomCanvas(canvas, canvas.closest('.viewport'), Number(canvas.dataset.pixelWidth), Number(canvas.dataset.pixelHeight));
  }).observe($('stage'));
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
  addEventListener('beforeunload', () => { cancelAnimationFrame(tick); for (const url of objectUrls) URL.revokeObjectURL(url); });
}

async function init() {
  installEvents();
  const response = await fetch('./catalog.json'); if (!response.ok) throw new Error('결과물 목록을 불러올 수 없습니다');
  const data = await response.json(); catalog = data.collections.map(validateCollection);
  for (const c of catalog) $('collection').add(new Option(c.title, c.id));
  const query = new URL(location.href).searchParams;
  const chosen = catalog.find(c => c.id === query.get('collection')) || catalog[0];
  chooseCollection(chosen, { asset: query.get('asset'), mode: ['gallery', 'compare', 'focus'].includes(query.get('mode')) ? query.get('mode') : undefined });
  if (innerWidth > 1250) { $('inspector').hidden = false; $('settings').setAttribute('aria-expanded', 'true'); }
  tick = requestAnimationFrame(animate);
}

window.viewerQA = { state, selectAsset, chooseCollection, render, frameFor, get catalog() { return catalog; },
  snapshot: () => ({ ...state, history: [...state.history], collection: state.collection?.id }) };
init().catch(error => { fail(error); notifyReady(); });

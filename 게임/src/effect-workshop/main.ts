import '../mobile-ui.css';
import './style.css';
import {
  FORMAT, LAYER_NAMES, LAYER_TYPES, MAX_FILE_BYTES, PRESET_INFO, STORAGE_KEY, cloneRecipe, createPreset,
  makeAiPrompt, makeLayer, parseRecipe, readLibrary, uid, validateRecipe, writeLibrary,
  type EffectLayer, type EffectRecipe, type LayerType, type PresetId, type SavedEffect,
} from './model';
import { canvas, createSheet, destroyFrames, renderFrame, renderFrames, sheetMetadata, type EffectFrame } from './renderer';
import { SKILL_FRAME_PADDING } from '../skillVisual';
import { createDrawingEditor, DRAWING_HELP } from './drawingEditor';
import { drawingActor, drawingDesignExample, drawingTime, emptyDrawing, fitDrawingTiming } from './drawingModel';
import { createNodeEditor, NODE_HELP } from './nodeEditor';
import { syncGraphSources } from './graphModel';
import { reviseEmeraldCollapse } from './emeraldWeave';
import { applyHorizontalFade } from './horizontalSlash';
import { galleryLaunch } from './galleryModel';
import { visualRecipeKey } from './componentModel';

const presetRecipes = new Map(PRESET_INFO.map(p => [p.id, createPreset(p.id)]));

function $(selector: '#workshop-dialog'): HTMLDialogElement;
function $(selector: '#preview-canvas'): HTMLCanvasElement;
function $(selector: '#scrubber' | '#library-search' | '#json-file'): HTMLInputElement;
function $(selector: '#background' | '#zoom' | '#speed' | '#export-columns' | '#battle-position'): HTMLSelectElement;
function $(selector: '#import-text' | '#ai-request' | '#ai-prompt'): HTMLTextAreaElement;
function $<T extends Element = HTMLElement>(selector: string): T;
function $(selector: string): Element { return document.querySelector(selector)!; }
const escape = (value: string) => value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]!));
const icon = (name: string) => {
  const paths: Record<string, string> = {
    spark: '<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z"/><path d="M20 2v4M18 4h4"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    play: '<path d="m8 5 11 7-11 7Z"/>', pause: '<path d="M8 5v14M16 5v14"/>',
    back: '<path d="m14 6-6 6 6 6"/>', next: '<path d="m10 6 6 6-6 6"/>', stop: '<rect x="6" y="6" width="12" height="12" rx="1"/>',
    download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>', upload: '<path d="M12 17V5m-5 5 5-5 5 5M4 17v4h16v-4"/>',
    undo: '<path d="m8 4-5 5 5 5M3 9h10a7 7 0 0 1 7 7v3"/>', redo: '<path d="m16 4 5 5-5 5m5-5H11a7 7 0 0 0-7 7v3"/>',
    copy: '<rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V3H3v13h5"/>',
    trash: '<path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>', grid: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/>',
    layers: '<path d="m12 3 10 5-10 5L2 8Zm-9 10 9 5 9-5M3 18l9 5 9-5"/>',
    eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    folder: '<path d="M3 6V4h6l3 3h9v13H3Z"/>', check: '<path d="m5 12 4 4L19 6"/>',
  };
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] ?? paths.spark}</svg>`;
};

let entries: SavedEffect[] = [], activeId = '', storageHealthy = true, storageNotice = '';
try {
  const saved = readLibrary(localStorage); entries = saved.entries; activeId = saved.activeId ?? '';
} catch {
  storageHealthy = false; storageNotice = '기존 저장함을 읽을 수 없어 임시 모드로 열었습니다. 원래 데이터는 보존됩니다. 작업은 JSON으로 내려받아 주세요.';
}
const launch = galleryLaunch(location.search);
let launchNotice = '';
if (storageHealthy && launch.entry) {
  if (entries.some(e => e.id === launch.entry)) activeId = launch.entry;
  else launchNotice = '갤러리에서 선택한 작업을 찾을 수 없습니다. 현재 보관함을 확인해 주세요.';
} else if (storageHealthy && launch.preset) {
  if (entries.length >= 100) launchNotice = '저장함은 100개까지 사용할 수 있습니다. JSON 백업 후 사용하지 않는 작업을 정리해 주세요.';
  else {
    const initial = { id: uid(), updatedAt: new Date().toISOString(), recipe: validateRecipe(createPreset(launch.preset)) };
    entries.unshift(initial); activeId = initial.id;
  }
} else if (launch.requested && storageHealthy) launchNotice = '갤러리에서 선택한 기본 효과를 찾을 수 없습니다.';
if (!entries.length) {
  const initial = { id: uid(), updatedAt: new Date().toISOString(), recipe: createPreset('slash') };
  entries = [initial]; activeId = initial.id;
}
let recipe = cloneRecipe(entries.find(entry => entry.id === activeId)!.recipe);
let layerId = recipe.layers[0].id, frames: EffectFrame[] = [], frameIndex = Math.min(6, recipe.settings.frames - 1);
let view: 'editor' | 'frames' | 'battle' | 'drawing' | 'nodes' = 'editor', libraryTab = launch.requested ? 'saved' : 'presets', playing = true, playbackLoop = true, speed = 1;
let background = 'checker', zoom = 2, showGuides = true, renderTimer = 0, playhead = frameIndex, lastTime = 0;
let toastTimer = 0, lastEditKey = '', lastEditTime = 0;
const undo: EffectRecipe[] = [], redo: EffectRecipe[] = [];
let battle: Awaited<ReturnType<typeof import('./battle')['createBattlePreview']>> | null = null;
let battleLoading = false, alive = true;
const thumbnailCache = new Map<string, string>();

$('#workshop').innerHTML = `
  <header class="ws-header">
    <a class="ws-brand" href="./effect-workshop.html" aria-label="이펙트 공방 홈"><span class="ws-brand-mark">${icon('spark')}</span><span><small>GRID DEFENDERS</small><strong>이펙트 공방</strong></span></a>
    <span class="ws-local"><i></i> 개인 작업실</span>
    <div class="ws-header-actions"><button class="ws-icon" data-action="undo" aria-label="실행 취소" title="실행 취소 · Ctrl+Z">${icon('undo')}</button><button class="ws-icon" data-action="redo" aria-label="다시 실행" title="다시 실행 · Ctrl+Shift+Z">${icon('redo')}</button><button class="ws-icon ws-mobile-new" data-action="new" aria-label="새 이펙트" title="새 이펙트">${icon('plus')}</button><span class="ws-header-divider"></span><button data-action="import" aria-label="JSON 가져오기">${icon('upload')}<span>JSON 가져오기</span></button><button class="ws-primary" data-action="export" aria-label="내보내기">${icon('download')}<span>내보내기</span></button></div>
  </header>
  <main class="ws-layout">
    <aside class="ws-library" aria-label="이펙트 보관함">
      <div class="ws-section-heading"><h2>라이브러리</h2><span class="ws-count" id="library-count"></span></div>
      <button class="ws-new" data-action="new">${icon('plus')} 새 이펙트</button>
      <a class="ws-gallery-link" href="./effect-gallery.html">${icon('grid')} 공방 작품 갤러리 ↗</a>
      <button class="ws-gallery-link" data-action="components">부품 보관함 · 필요한 부분 꺼내 쓰기</button>
      <a class="ws-gallery-link" href="./effect-materials.html">${icon('grid')} 전체 이펙트 재료함 ↗</a>
      <div class="ws-library-tabs" role="tablist" aria-label="라이브러리 분류"><button role="tab" data-library="presets" aria-selected="true">기본 효과</button><button role="tab" data-library="saved" aria-selected="false">내 작업</button></div>
      <div class="ws-search"><input id="library-search" type="search" placeholder="이펙트 검색" aria-label="이펙트 검색"></div>
      <div id="library-list" class="ws-library-list"></div>
      <div class="ws-library-footer"><span>${icon('folder')} 이 브라우저에 저장</span><p>내 작업은 자동으로 보관돼요.<br>JSON을 내려받아 백업해 주세요.</p><a href="./lobby-preview.html">게임으로 돌아가기 ↗</a></div>
    </aside>
    <section class="ws-editor" aria-label="이펙트 미리보기와 타임라인">
      <div class="ws-document"><div><span class="ws-eyebrow">EFFECT WORKSPACE</span><h1 id="document-name"></h1></div><div class="ws-document-actions"><span id="save-status" role="status"></span><button class="ws-icon" data-action="duplicate" aria-label="작업 복제" title="작업 복제">${icon('copy')}</button><button class="ws-icon ws-danger-icon" data-action="delete" aria-label="작업 삭제" title="작업 삭제">${icon('trash')}</button></div></div>
      <div class="ws-viewbar"><div class="ws-view-tabs" role="tablist" aria-label="미리보기 화면"><button role="tab" data-view="drawing" aria-selected="false">그리기</button><button role="tab" data-view="nodes" aria-selected="false">노드</button><button role="tab" data-view="editor" aria-selected="true">미리보기</button><button role="tab" data-view="frames" aria-selected="false">전체 프레임</button><button role="tab" data-view="battle" aria-selected="false">실제 전장</button></div><button class="ws-ai" data-action="ai">${icon('spark')} AI 작업 요청</button></div>
      <div class="ws-stage-toolbar"><label>배경<select id="background"><option value="checker">투명 격자</option><option value="gray">밝은 회색</option><option value="green">밝은 초록</option><option value="dark">어두운 배경</option></select></label><label id="zoom-control">확대<select id="zoom"><option value="1">1×</option><option value="2" selected>2×</option><option value="3">3×</option><option value="4">4×</option></select></label><button id="guides" class="ws-guide-toggle" aria-pressed="true">${icon('grid')} 기준점</button></div>
      <div class="ws-preview-wrap" data-background="checker">
        <section id="drawing-preview" class="ws-drawing" aria-label="선으로 이펙트 만들기" hidden></section>
        <section id="node-preview" aria-label="노드로 이펙트 만들기" hidden></section>
        <section id="editor-preview" class="ws-stage" aria-label="애니메이션 미리보기"><span class="ws-stage-label">LIVE PREVIEW</span><canvas id="preview-canvas" aria-label="이펙트 재생 화면"></canvas><span class="ws-stage-corner">투명 PNG · 안전 여백 24px</span></section>
        <section id="frame-preview" class="ws-contact" aria-label="모든 프레임" hidden></section>
        <section id="battle-preview" class="ws-battle" aria-label="실제 전장 미리보기" hidden><div class="ws-battle-tools"><label>위치<select id="battle-position"><option value="top">상단 길목</option><option value="center">중앙 길목</option><option value="caster">시전자 발밑</option><option value="custom" hidden>직접 지정</option></select></label><span>전장을 누르면 기준점 이동</span></div><div id="battle-host"><p>전장을 준비하고 있습니다.</p></div><p class="ws-battle-note">실제 게임 렌더러 · 독립 시험 장면 · 피해 판정 미연결</p></section>
      </div>
      <div class="ws-render-meta"><span id="render-meta"></span><span id="bounds-status"></span></div>
      <div class="ws-timeline">
        <div class="ws-transport"><div class="ws-transport-buttons"><button class="ws-icon" data-action="previous" aria-label="이전 프레임">${icon('back')}</button><button class="ws-play" id="play-button" data-action="play" aria-label="일시정지">${icon('pause')}</button><button class="ws-icon" data-action="next" aria-label="다음 프레임">${icon('next')}</button><button class="ws-icon" data-action="stop" aria-label="처음으로 정지">${icon('stop')}</button></div><strong id="frame-counter"></strong><div class="ws-play-options"><label>배속<select id="speed"><option value="0.25">0.25×</option><option value="1" selected>1×</option><option value="5">5×</option></select></label><button id="loop" aria-pressed="true">↻ 반복</button></div></div>
        <input id="scrubber" type="range" min="1" max="24" value="7" step="1" aria-label="현재 프레임">
        <div id="timeline-frames" class="ws-filmstrip" aria-label="프레임 선택"></div>
        <div class="ws-timeline-caption"><span id="time-label"></span><span><i></i> 타격 표시 <b id="impact-label"></b> · 프레임 완료 기준</span></div>
      </div>
    </section>
    <aside class="ws-inspector" aria-label="이펙트 속성"><div id="inspector"></div></aside>
  </main>
  <footer class="ws-footer"><span><i></i> LOCAL WORKSHOP</span><span>JSON으로 이어서 만들고, PNG로 게임에 담으세요.</span><span id="footer-status">외부 서버 전송 없음</span></footer>
  <div id="toast" class="ws-toast" role="status" aria-live="polite" hidden></div>
  <dialog id="workshop-dialog" aria-labelledby="dialog-title"><div class="ws-dialog-heading"><h2 id="dialog-title"></h2><button class="ws-icon" data-action="close-dialog" aria-label="닫기">${icon('close')}</button></div><div id="dialog-body"></div></dialog>
  <input id="json-file" type="file" accept=".json,application/json" hidden>
`;

const drawingEditor = createDrawingEditor($('#drawing-preview'), {
  getRecipe: () => recipe, getEntryKey: () => activeId, commit,
  newWork: example => {
    const next = cloneRecipe(recipe); next.name = example ? '방향과 완성 모양 설계 예제' : '새 그림 이펙트';
    next.drawing = example ? drawingDesignExample() : emptyDrawing(); delete next.graph; delete next.sequence; fitDrawingTiming(next); addEntry(next);
  },
  generate: () => { flushRender(); void switchView('editor'); setFrame(0); playing = true; playbackLoop = true; lastTime = performance.now(); updatePlayControls(); },
  ai: openAi, help: () => openDialog('그리기 사용법', DRAWING_HELP + '<p class="ws-hint">같은 지점에서 동시에 출발하려면 선을 선택한 뒤 <b>같은 시작점에서 분기</b>를 누르고 끝점을 향해 끌어 주세요. 시작 좌표·단계·시작 지연을 원래 선과 맞춰 새 선을 만듭니다. 새 방향선은 기본 이펙트 이동이며 여러 갈래를 허용합니다. ‘이번 단계에 함께’로 그릴 때는 가까운 시작점에 붙고 Alt를 누르면 붙이기를 건너뜁니다.</p>', 'drawing-help'), notify,
  undo: () => $('button[data-action="undo"]').click(), redo: () => $('button[data-action="redo"]').click(), canUndo: () => undo.length > 0, canRedo: () => redo.length > 0,
});
const nodeEditor = createNodeEditor($('#node-preview'), {
  getRecipe: () => recipe, getEntryKey: () => activeId, getFrame: () => frameIndex, commit, notify,
  togglePlay: () => { $('#play-button').click(); }, isPlaying: () => playing,
  undo: () => $('button[data-action="undo"]').click(), redo: () => $('button[data-action="redo"]').click(), canUndo: () => undo.length > 0, canRedo: () => redo.length > 0,
  preview: () => { flushRender(); void switchView('editor'); setFrame(0); playing = true; lastTime = performance.now(); updatePlayControls(); },
  drawing: () => { void switchView('drawing'); }, help: () => openDialog('노드 연결 사용법', NODE_HELP, 'node-help'),
});

function notify(message: string): void {
  const toast = $('#toast'); toast.textContent = message; toast.hidden = false; clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => { toast.hidden = true; }, 4200);
}
function persist(): void {
  if (!storageHealthy) { $('#save-status').textContent = '임시 보관 · JSON 백업 필요'; $('#save-status').className = 'ws-save-warning'; return; }
  try {
    writeLibrary(localStorage, entries, activeId); $('#save-status').textContent = '자동 저장됨'; $('#save-status').className = 'ws-save-ok';
  } catch {
    $('#save-status').textContent = '저장 실패 · JSON 백업 필요'; $('#save-status').className = 'ws-save-warning';
    notify('브라우저 저장 공간이 부족하거나 저장이 차단되었습니다. JSON 내보내기로 작업을 백업해 주세요.');
  }
}
function syncEntry(): void {
  const entry = entries.find(item => item.id === activeId)!; entry.recipe = cloneRecipe(recipe); entry.updatedAt = new Date().toISOString(); persist();
}
function updateDocument(): void {
  $('#document-name').textContent = recipe.name; $('#library-count').textContent = String(entries.length);
  $('button[data-action="undo"]').toggleAttribute('disabled', !undo.length); $('button[data-action="redo"]').toggleAttribute('disabled', !redo.length);
}
function commit(edit: (next: EffectRecipe) => void, key = '', refresh = false): void {
  const next = cloneRecipe(recipe); edit(next);
  syncGraphSources(next);
  try { validateRecipe(next); } catch (error) { notify((error as Error).message); renderInspector(); return; }
  const timingChanged = next.settings.frames !== recipe.settings.frames || next.settings.fps !== recipe.settings.fps;
  const pixelsChanged = visualRecipeKey(next) !== visualRecipeKey(recipe);
  const now = performance.now();
  if (!key || key !== lastEditKey || now - lastEditTime > 700) { undo.push(cloneRecipe(recipe)); if (undo.length > 50) undo.shift(); }
  redo.length = 0; lastEditKey = key; lastEditTime = now; recipe = next;
  frameIndex = Math.min(frameIndex, recipe.settings.frames - 1); playhead = Math.min(playhead, recipe.settings.frames - 1);
  if (!recipe.layers.some(layer => layer.id === layerId)) layerId = recipe.layers[0].id;
  updateDocument(); syncEntry(); if (refresh || timingChanged) renderInspector();
  if (pixelsChanged) { clearTimeout(renderTimer); renderTimer = window.setTimeout(rebuildFrames, 65); }
  else { if (view === 'nodes') nodeEditor.refresh(); renderLibrary(); }
}
function selectEntry(id: string): void {
  const entry = entries.find(item => item.id === id); if (!entry) return;
  flushRender(); activeId = id; recipe = cloneRecipe(entry.recipe); layerId = recipe.layers[0].id;
  undo.length = redo.length = 0; lastEditKey = ''; playhead = 0; frameIndex = 0; playing = !['nodes', 'drawing', 'frames'].includes(view); playbackLoop = true;
  updateDocument(); renderInspector(); rebuildFrames(); renderLibrary(); persist(); updatePlayControls();
  if (view === 'nodes') nodeEditor.open();
}
function addEntry(next: EffectRecipe): void {
  try { next = validateRecipe(next); } catch (error) { notify((error as Error).message); return; }
  if (entries.length >= 100) { notify('저장함은 100개까지 사용할 수 있습니다. JSON 백업 후 사용하지 않는 작업을 정리해 주세요.'); return; }
  const entry = { id: uid(), updatedAt: new Date().toISOString(), recipe: cloneRecipe(next) }; entries.unshift(entry);
  libraryTab = 'saved'; selectEntry(entry.id); $('#workshop-dialog').removeAttribute('data-mode'); $('#workshop-dialog').close();
}
function previewImage(value: EffectRecipe): string {
  const key = visualRecipeKey(value); const cached = thumbnailCache.get(key); if (cached) return cached;
  const frame = renderFrame(value, Math.max(1, Math.round((value.settings.frames - 1) * (value.sequence ? .6 : .3))));
  const image = frame.canvas.toDataURL(); frame.art.texture.destroy(true);
  if (thumbnailCache.size > 150) thumbnailCache.clear(); thumbnailCache.set(key, image); return image;
}
function renderLibrary(): void {
  document.querySelectorAll<HTMLElement>('[data-library]').forEach(button => button.setAttribute('aria-selected', String(button.dataset.library === libraryTab)));
  const query = $('#library-search').value.trim().toLocaleLowerCase();
  const list = libraryTab === 'presets'
    ? PRESET_INFO.filter(p => p.name.includes(query) || p.description.includes(query)).map(p => {
      const value = presetRecipes.get(p.id)!;
      return `<button class="ws-library-card" data-preset="${p.id}" title="${p.name}으로 새 작업 만들기"><span class="ws-library-art"><img src="${previewImage(value)}" alt=""></span><span><strong>${p.name}</strong><small>${p.description}</small><em>${value.settings.size} × ${value.settings.size} · ${value.settings.frames}프레임</em></span></button>`;
    })
    : entries.filter(entry => entry.recipe.name.toLocaleLowerCase().includes(query)).map(entry => `<button class="ws-library-card ${entry.id === activeId ? 'is-active' : ''}" data-entry="${entry.id}" aria-current="${entry.id === activeId}"><span class="ws-library-art"><img src="${previewImage(entry.recipe)}" alt=""></span><span><strong>${escape(entry.recipe.name)}</strong><small>${entry.recipe.settings.size} × ${entry.recipe.settings.size} · ${entry.recipe.settings.frames}프레임</small><em>${new Date(entry.updatedAt).toLocaleDateString('ko-KR')} 수정</em></span></button>`);
  $('#library-list').innerHTML = list.join('') || '<p class="ws-empty">일치하는 작업이 없어요.</p>';
}
function numberField(label: string, path: string, value: number, min: number, max: number, step: number | string = 1): string {
  return `<label class="ws-field"><span>${label}</span><input type="number" data-path="${path}" value="${value}" min="${min}" max="${max}" step="${step}"></label>`;
}
function slider(label: string, property: keyof EffectLayer, value: number, min: number, max: number, step: number, unit = ''): string {
  return `<label class="ws-slider"><span>${label}<output>${value}${unit}</output></span><input type="range" aria-label="${label}" data-layer-prop="${property}" min="${min}" max="${max}" step="${step}" value="${value}" data-unit="${unit}"></label>`;
}
function renderInspector(): void {
  const l = recipe.layers.find(layer => layer.id === layerId) ?? recipe.layers[0]; layerId = l.id;
  $('#inspector').innerHTML = `
    <section class="ws-properties"><div class="ws-section-heading"><h2>이펙트 설정</h2><span class="ws-badge">${FORMAT}</span></div>
      ${recipe.drawing?.enabled && !recipe.drawing.showBase ? '<p class="ws-hint">그리기 연출 사용 중 · 실제 효과색과 모양은 그리기 화면에서 각 선을 선택해 수정하세요.</p>' : ''}
      ${recipe.drawing?.strokes.some(s => s.id === 'horizontal-scar') ? '<button class="ws-new" data-action="horizontal-fade">검상 시작점 소멸 적용</button>' : ''}
      <label class="ws-field"><span>작업 이름</span><input data-path="name" type="text" maxlength="80" value="${escape(recipe.name)}"></label>
      <div class="ws-field-row"><label class="ws-field"><span>이미지 크기</span><select data-path="settings.size">${[32, 64, 96, 128, 192, 256].map(n => `<option value="${n}" ${recipe.settings.size === n ? 'selected' : ''}>${n} × ${n}</option>`).join('')}${![32, 64, 96, 128, 192, 256].includes(recipe.settings.size) ? `<option selected value="${recipe.settings.size}">${recipe.settings.size} × ${recipe.settings.size}</option>` : ''}</select></label><label class="ws-field"><span>픽셀 표현</span><select data-path="settings.pixelSize">${[1, 2, 4].map(n => `<option value="${n}" ${recipe.settings.pixelSize === n ? 'selected' : ''}>${n === 1 ? '부드럽게' : `${n}px 도트`}</option>`).join('')}</select></label></div>
      <div class="ws-field-row">${numberField('프레임 수', 'settings.frames', recipe.settings.frames, 2, 64)}${numberField('재생 FPS', 'settings.fps', recipe.settings.fps, 1, 60, 'any')}</div>
      <div class="ws-palette-label">팔레트 <span>기본색 / 밝은색 / 중심색</span></div><div class="ws-palette">${recipe.palette.map((color, i) => `<label title="${['기본색', '밝은색', '중심색'][i]}"><input type="color" data-palette="${i}" value="${color}" aria-label="${['기본색', '밝은색', '중심색'][i]}"><span>${color.toUpperCase()}</span></label>`).join('')}</div>
    </section>
    ${recipe.sequence ? `<section class="ws-properties ws-sequence-properties"><div class="ws-section-heading"><h2>빛·레이저 연출</h2><span class="ws-badge">모션</span></div><p class="ws-hint">응집 → 두 갈래·네 갈래 분열 → 레이저 연결·꼬임 → 수렴·회전·폭발</p>${(['lightScale', 'beamScale', 'glow'] as const).map((key, i) => `<label class="ws-slider"><span>${['빛 크기', '레이저 두께', '발광 강도'][i]}<output>${recipe.sequence![key]}×</output></span><input type="range" aria-label="${['빛 크기', '레이저 두께', '발광 강도'][i]}" data-sequence-prop="${key}" value="${recipe.sequence![key]}" min="${key === 'glow' ? .2 : .5}" max="2" step=".1"></label>`).join('')}<label class="ws-checkbox"><input type="checkbox" data-sequence-prop="enabled" ${recipe.sequence.enabled ? 'checked' : ''}> 빛·레이저 연출 표시</label><p class="ws-hint">팔레트로 색상을 바꾸고 FPS로 전체 재생 속도를 조절하세요.</p>${recipe.sequence.lights.some(light => light.id === 'weave-a') ? '<button class="ws-new" data-action="emerald-collapse">사각 회전·잔상 모션 적용</button>' : ''}</section>` : ''}
    <section class="ws-properties"><div class="ws-section-heading"><h2>${icon('layers')} 레이어</h2><span>${recipe.layers.length} / 12</span></div>
      <div class="ws-layer-list">${recipe.layers.map((layer, i) => `<div class="ws-layer-row ${layer.id === layerId ? 'selected' : ''}"><button class="ws-layer-visibility" data-visible="${layer.id}" aria-label="${escape(layer.name)} 표시" aria-pressed="${layer.enabled}">${icon('eye')}</button><button class="ws-layer-select" data-layer="${layer.id}"><span class="ws-layer-dot" style="--layer-color:${recipe.palette[layer.color]}"></span><span>${escape(layer.name)}</span><small>${String(i + 1).padStart(2, '0')}</small></button></div>`).join('')}</div>
      <label class="ws-add-layer"><span>${icon('plus')} 레이어 추가</span><select id="add-layer" aria-label="추가할 레이어 종류" ${recipe.layers.length >= 12 ? 'disabled' : ''}><option value="">종류 선택</option>${LAYER_TYPES.map(type => `<option value="${type}">${LAYER_NAMES[type]}</option>`).join('')}</select></label>
    </section>
    <section class="ws-properties ws-selected-layer"><div class="ws-section-heading"><h2>${LAYER_NAMES[l.type]} 속성</h2><div><button class="ws-icon" data-action="layer-up" aria-label="레이어 순서 위로" ${recipe.layers[0].id === layerId ? 'disabled' : ''}>↑</button><button class="ws-icon" data-action="layer-down" aria-label="레이어 순서 아래로" ${recipe.layers.at(-1)!.id === layerId ? 'disabled' : ''}>↓</button><button class="ws-icon" data-action="layer-delete" aria-label="레이어 삭제" ${recipe.layers.length === 1 ? 'disabled' : ''}>${icon('trash')}</button></div></div>
      ${l.type === 'jet' ? '<p class="ws-hint">팔레트 순서: 외곽 불꽃 / 분사구 / 밝은 중심. 분사 길이·두께·퍼짐을 조절하고, 회전 180°는 왼쪽·0°는 오른쪽으로 사용하세요.</p>' : ''}
      <label class="ws-field"><span>레이어 이름</span><input type="text" data-layer-prop="name" value="${escape(l.name)}" maxlength="80"></label>
      <div class="ws-field-row"><label class="ws-field"><span>색상</span><select data-layer-prop="color">${recipe.palette.map((c, i) => `<option value="${i}" ${l.color === i ? 'selected' : ''}>${['기본색', '밝은색', '중심색'][i]}</option>`).join('')}</select></label><label class="ws-field"><span>합성</span><select data-layer-prop="blend"><option value="add" ${l.blend === 'add' ? 'selected' : ''}>빛 더하기</option><option value="normal" ${l.blend === 'normal' ? 'selected' : ''}>일반</option></select></label></div>
      ${slider(l.type === 'jet' ? '분사 길이' : '반경', 'radius', l.radius, .02, .45, .005)}
      ${['slash', 'ring', 'rune', 'burst', 'dust', 'wind', 'splash', 'jet'].includes(l.type) ? slider(l.type === 'dust' || l.type === 'splash' ? '입자 크기' : '두께', 'thickness', l.thickness, .005, .12, .005) : ''}
      ${slider('회전', 'rotation', l.rotation, -180, 180, 1, '°')}
      ${['slash', 'particles', 'dust', 'wind', 'splash', 'jet'].includes(l.type) ? slider('퍼지는 각도', 'spread', l.spread, 10, 360, 1, '°') : ''}
      ${['particles', 'rune', 'flame', 'dust', 'wind', 'splash', 'jet'].includes(l.type) ? slider('움직임 속도', 'speed', l.speed, .1, 2, .05) : ''}
      ${['particles', 'rune', 'flame', 'burst', 'dust', 'wind', 'splash', 'jet'].includes(l.type) ? slider('개수', 'amount', l.amount, 3, 64, 1) : ''}
      ${slider('불투명도', 'opacity', l.opacity, 0, 1, .01)}
      <div class="ws-field-row"><label class="ws-field"><span>중심 X · 0~1</span><input data-layer-prop="x" type="number" value="${l.x}" min="0" max="1" step=".01"></label><label class="ws-field"><span>중심 Y · 0~1</span><input data-layer-prop="y" type="number" value="${l.y}" min="0" max="1" step=".01"></label></div>
      <div class="ws-field-row"><label class="ws-field"><span>시작 · 0~1</span><input data-layer-prop="start" type="number" value="${l.start}" min="0" max=".99" step=".01"></label><label class="ws-field"><span>종료 · 0~1</span><input data-layer-prop="end" type="number" value="${l.end}" min=".01" max="1" step=".01"></label></div>
      ${['particles', 'flame', 'dust', 'wind', 'splash', 'jet'].includes(l.type) ? `<label class="ws-field"><span>랜덤 시드 · 같은 값은 같은 움직임</span><input data-layer-prop="seed" type="number" value="${l.seed}" min="0" max="999999" step="1"></label>` : ''}
    </section>
    <section class="ws-properties"><div class="ws-section-heading"><h2>게임 표시 정보</h2><span class="ws-badge">연출 전용</span></div>
      <div class="ws-field-row">${numberField('기준점 X · 0~1', 'placement.pivotX', recipe.placement.pivotX, 0, 1, .01)}${numberField('기준점 Y · 0~1', 'placement.pivotY', recipe.placement.pivotY, 0, 1, .01)}</div>
      <div class="ws-field-row">${numberField('전장 크기 · px', 'placement.displaySize', recipe.placement.displaySize, 24, 240)}${numberField('타격 표시 프레임', 'placement.impactFrame', recipe.placement.impactFrame, 1, recipe.settings.frames)}</div>
      <label class="ws-checkbox"><input type="checkbox" data-path="settings.loop" ${recipe.settings.loop ? 'checked' : ''}> 게임 출력 시 반복 재생</label>
      <p class="ws-hint">기준점은 전장에 놓이는 위치예요. 표시 크기·타격 표시는 실제 피해나 공격 범위를 바꾸지 않아요.</p>
    </section>`;
}
function rebuildFrames(): void {
  clearTimeout(renderTimer); renderTimer = 0;
  const previous = frames; frames = renderFrames(recipe);
  frameIndex = Math.min(frameIndex, frames.length - 1); playhead = Math.min(playhead, frames.length - 1);
  // Move the scene off old textures before freeing them.
  battle?.draw(frames[frameIndex], recipe); destroyFrames(previous);
  $('#render-meta').textContent = `${recipe.settings.size} × ${recipe.settings.size} px  /  ${recipe.settings.frames}프레임  /  ${Number(recipe.settings.fps.toFixed(2))} FPS  /  ${(recipe.settings.frames / recipe.settings.fps).toFixed(2)}초`;
  const unsafe = frames.filter(frame => frame.touchesEdge).length, visible = frames.some(frame => frame.visible);
  const bounds = $('#bounds-status'); bounds.textContent = unsafe ? `경계 닿음 ${unsafe}프레임 · 반경/위치 조정 필요` : !visible ? (drawingActor(recipe.drawing, 0) ? '이동 경로만 있음 · 이동 정보 JSON 출력 가능' : recipe.graph?.enabled ? '이미지 없음 · 최종 출력 연결과 원본 표시·재생 구간을 확인하세요' : '표시되는 레이어가 없어요') : '✓ 투명 여백 확인';
  bounds.className = unsafe || !visible ? 'ws-warning' : 'ws-ok';
  $('#scrubber').max = String(recipe.settings.frames); $('#impact-label').textContent = `${recipe.placement.impactFrame}F`;
  renderTimeline(); if (view === 'frames') renderContact(); else $('#frame-preview').replaceChildren(); renderLibrary(); drawPreview(); updateFrameLabel();
  if (view === 'drawing') drawingEditor.refresh();
  if (view === 'nodes') nodeEditor.refresh();
}
function flushRender(): void { if (renderTimer) rebuildFrames(); }
function renderTimeline(): void {
  $('#timeline-frames').innerHTML = frames.map((frame, i) => `<button class="ws-film-frame ${i + 1 === recipe.placement.impactFrame ? 'is-impact' : ''}" data-frame="${i}" aria-label="${i + 1}프레임${i + 1 === recipe.placement.impactFrame ? ' 타격 표시' : ''}" aria-pressed="${i === frameIndex}"><img src="${frame.art.url}" alt=""><span>${String(i + 1).padStart(2, '0')}</span></button>`).join('');
}
function renderContact(): void {
  $('#frame-preview').innerHTML = frames.map((frame, i) => `<button class="ws-contact-frame ${frame.touchesEdge ? 'has-edge' : ''}" data-frame="${i}" aria-label="${i + 1}프레임 선택" aria-pressed="${i === frameIndex}"><img src="${frame.art.url}" alt=""><span><b>${String(i + 1).padStart(2, '0')}</b>${i + 1 === recipe.placement.impactFrame ? '<em>타격 표시</em>' : ''}${frame.touchesEdge ? '<em>경계</em>' : ''}</span></button>`).join('');
}
function setFrame(index: number, pause = true): void {
  frameIndex = Math.max(0, Math.min(frames.length - 1, index)); playhead = frameIndex;
  if (pause) { playing = false; updatePlayControls(); }
  drawPreview(); battle?.draw(frames[frameIndex], recipe); updateFrameLabel();
}
function updateFrameLabel(): void {
  if (view === 'nodes') nodeEditor.frameChanged();
  $('#frame-counter').textContent = `${String(frameIndex + 1).padStart(2, '0')} / ${String(recipe.settings.frames).padStart(2, '0')}`;
  $('#scrubber').value = String(frameIndex + 1);
  $('#time-label').textContent = `${(frameIndex / recipe.settings.fps).toFixed(2)} / ${(recipe.settings.frames / recipe.settings.fps).toFixed(2)}s`;
  document.querySelectorAll<HTMLElement>('[data-frame][aria-pressed="true"]').forEach(button => button.setAttribute('aria-pressed', 'false'));
  document.querySelectorAll<HTMLElement>(`[data-frame="${frameIndex}"]`).forEach(button => button.setAttribute('aria-pressed', 'true'));
}
function updatePlayControls(): void {
  $('#play-button').innerHTML = icon(playing ? 'pause' : 'play'); $('#play-button').setAttribute('aria-label', playing ? '일시정지' : '재생');
  $('#loop').setAttribute('aria-pressed', String(playbackLoop));
}
function drawPreview(): void {
  if (view !== 'editor') return;
  const output = $<HTMLCanvasElement>('#preview-canvas'), host = $('#editor-preview');
  const w = host.clientWidth, h = host.clientHeight; if (!w || !h) return;
  const ratio = Math.min(devicePixelRatio || 1, 3);
  if (output.width !== Math.round(w * ratio) || output.height !== Math.round(h * ratio)) { output.width = Math.round(w * ratio); output.height = Math.round(h * ratio); }
  const ctx = output.getContext('2d')!; ctx.setTransform(ratio, 0, 0, ratio, 0, 0); ctx.clearRect(0, 0, w, h);
  const frame = frames[frameIndex]; if (!frame) return;
  const cell = frame.canvas.width, scale = Math.min(zoom, (w - 28) / cell, (h - 60) / cell), x = (w - cell * scale) / 2, y = (h - cell * scale) / 2;
  ctx.imageSmoothingEnabled = recipe.settings.pixelSize === 1; ctx.drawImage(frame.canvas, x, y, cell * scale, cell * scale);
  const actor = drawingActor(recipe.drawing, drawingTime(recipe, frameIndex));
  if (actor) {
    const px = x + SKILL_FRAME_PADDING * scale + actor[0] * recipe.settings.size * scale, py = y + SKILL_FRAME_PADDING * scale + actor[1] * recipe.settings.size * scale;
    ctx.save(); ctx.translate(px, py); ctx.strokeStyle = background === 'gray' || background === 'green' ? '#354154' : '#d8d9e8'; ctx.fillStyle = ctx.strokeStyle; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, -25, 5, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.moveTo(0, -20); ctx.lineTo(0, -8); ctx.moveTo(-8, -14); ctx.lineTo(8, -14); ctx.moveTo(0, -8); ctx.lineTo(-6, 0); ctx.moveTo(0, -8); ctx.lineTo(6, 0); ctx.stroke();
    ctx.font = '11px system-ui'; ctx.textAlign = 'center'; ctx.fillText('이동 표식', 0, 15); ctx.restore();
  }
  if (showGuides) {
    const padding = SKILL_FRAME_PADDING * scale, content = recipe.settings.size * scale;
    ctx.strokeStyle = background === 'gray' || background === 'green' ? '#3a496388' : '#a7a2c944'; ctx.lineWidth = 1; ctx.setLineDash([4, 5]);
    ctx.strokeRect(x + padding, y + padding, content, content); ctx.setLineDash([]);
    const px = x + padding + content * recipe.placement.pivotX, py = y + padding + content * recipe.placement.pivotY;
    ctx.strokeStyle = '#d7b9ff'; ctx.beginPath(); ctx.moveTo(px - 8, py); ctx.lineTo(px + 8, py); ctx.moveTo(px, py - 8); ctx.lineTo(px, py + 8); ctx.stroke();
    ctx.beginPath(); ctx.arc(px, py, 3, 0, Math.PI * 2); ctx.stroke();
  }
}
async function switchView(next: typeof view): Promise<void> {
  flushRender(); view = next;
  document.querySelectorAll<HTMLElement>('[data-view]').forEach(button => button.setAttribute('aria-selected', String(button.dataset.view === next)));
  $('#editor-preview').hidden = next !== 'editor'; $('#frame-preview').hidden = next !== 'frames'; $('#battle-preview').hidden = next !== 'battle';
  $('#drawing-preview').hidden = next !== 'drawing';
  $('#node-preview').hidden = next !== 'nodes'; $('.ws-layout').classList.toggle('is-node-mode', next === 'nodes');
  $('.ws-stage-toolbar').hidden = next === 'nodes';
  $('#zoom-control').hidden = next !== 'editor'; $('#guides').hidden = next !== 'editor';
  if (next === 'frames') { playing = false; renderContact(); updatePlayControls(); }
  if (next === 'drawing') { playing = false; updatePlayControls(); drawingEditor.refresh(); }
  if (next === 'nodes') { playing = false; updatePlayControls(); nodeEditor.open(); }
  if (next === 'battle' && !battle && !battleLoading) {
    battleLoading = true;
    try {
      const { createBattlePreview } = await import('./battle'); const created = await createBattlePreview($('#battle-host'));
      if (!alive) { created.destroy(); return; } battle = created; battle.draw(frames[frameIndex], recipe);
    } catch { $('#battle-host').innerHTML = '<p>전장을 불러오지 못했습니다.<br>브라우저의 WebGL 지원과 이미지 로딩을 확인해 주세요.</p><button data-action="retry-battle">다시 시도</button>'; }
    finally { battleLoading = false; }
  }
  drawPreview();
}
function openDialog(title: string, body: string, mode: string): void {
  $('#dialog-title').textContent = title; $('#dialog-body').innerHTML = body;
  const dialog = $<HTMLDialogElement>('#workshop-dialog'); dialog.dataset.mode = mode; dialog.showModal();
}
function openNew(): void {
  openDialog('어떤 이펙트로 시작할까요?', `<button class="ws-new" data-action="new-drawing">직선·곡선으로 그림과 의미 설계하기</button><p class="ws-dialog-intro">또는 기본 효과를 골라 나만의 작업으로 만들어 보세요.</p><div class="ws-preset-grid">${PRESET_INFO.map(p => `<button data-preset="${p.id}"><img src="${previewImage(presetRecipes.get(p.id)!)}" alt=""><strong>${p.name}</strong><span>${p.description}</span></button>`).join('')}</div>`, 'new');
}
function openImport(): void {
  openDialog('JSON 가져오기', `<p class="ws-dialog-intro">이 공방에서 내보내거나 AI에게 받은 <b>gd.effect@1</b> JSON을 넣어 주세요. 기존 작업은 유지하고 새 작업으로 추가합니다.</p><button class="ws-file-pick" data-action="choose-file">${icon('upload')} JSON 파일 선택 <small>최대 512KB</small></button><label class="ws-field"><span>또는 JSON 붙여넣기</span><textarea id="import-text" rows="12" spellcheck="false" placeholder='{"format":"gd.effect@1", …}'></textarea></label><p id="import-error" class="ws-error" role="alert"></p><div class="ws-dialog-actions"><button data-action="close-dialog">취소</button><button class="ws-primary" data-action="import-text">새 작업으로 가져오기</button></div>`, 'import');
}
function importText(text: string): void {
  try { const value = parseRecipe(text); addEntry(value); notify('이펙트를 새 작업으로 가져왔습니다.'); }
  catch (error) { $('#import-error').textContent = (error as Error).message; }
}
function openAi(): void {
  openDialog('AI에게 이펙트 작업 요청', `<p class="ws-dialog-intro">원하는 변경을 적고 요청을 복사해 이 대화에 붙여 주세요. 현재 이펙트와 공방 형식이 함께 들어갑니다.</p><label class="ws-field"><span>어떻게 바꿀까요?</span><textarea id="ai-request" rows="3" placeholder="예: 파란 참격에 얼음 파편을 더하고, 마지막 잔광을 길게 남겨줘."></textarea></label><label class="ws-field"><span>전달할 요청 · 현재 JSON 포함</span><textarea id="ai-prompt" rows="10" readonly spellcheck="false"></textarea></label><p class="ws-hint">AI가 돌려준 JSON은 ‘JSON 가져오기’로 열 수 있어요. 이 화면에는 자동 생성 API가 연결되어 있지 않습니다.</p><div class="ws-dialog-actions"><button data-action="save-prompt">TXT 내려받기</button><button class="ws-primary" data-action="copy-prompt">${icon('copy')} 요청 복사</button></div>`, 'ai');
  $('#ai-request').value = recipe.drawing?.prompt ?? ''; updateAiPrompt();
}
function updateAiPrompt(): void { $('#ai-prompt').value = makeAiPrompt(recipe, $('#ai-request').value); }
function filename(suffix: string): string { return `${recipe.name.replace(/[<>:"/\\|?*\u0000-\u001f]/g, '-').slice(0, 60) || 'effect'}${suffix}`; }
function download(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = name; document.body.append(a); a.click(); a.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 10000);
}
function downloadJson(value: unknown, name: string): void { download(new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }), name); }
function downloadCanvas(value: HTMLCanvasElement, name: string): void {
  value.toBlob(blob => { if (blob) { download(blob, name); notify('PNG를 내보냈습니다.'); } else notify('PNG를 만들지 못했습니다. 다시 시도해 주세요.'); }, 'image/png');
}
function exportAllowed(allowMotion = false): boolean {
  flushRender();
  if (frames.some(frame => frame.touchesEdge)) { notify('그림이 이미지 경계에 닿습니다. 레이어 반경을 줄이거나 중심 위치를 조정한 뒤 다시 내보내 주세요.'); return false; }
  if (!frames.some(frame => frame.visible) && !(allowMotion && drawingActor(recipe.drawing, 0))) { notify('표시할 이펙트가 없습니다. 이동선만 그렸다면 이동 정보 JSON을 받아 주세요.'); return false; }
  return true;
}
function openExport(): void {
  flushRender(); const unsafe = frames.some(frame => frame.touchesEdge), visible = frames.some(frame => frame.visible), hasMotion = !!drawingActor(recipe.drawing, 0);
  openDialog('이펙트 내보내기', `<div class="ws-export-preview"><img src="${frames[Math.max(1, Math.round((frames.length - 1) * .3))].art.url}" alt="현재 이펙트"><div><strong>${escape(recipe.name)}</strong><p>${recipe.settings.size} × ${recipe.settings.size} · ${frames.length}프레임</p><span>${unsafe ? '경계 조정 필요' : !visible ? (hasMotion ? '캐릭터 이동 정보' : '빈 이펙트') : '투명 배경 · 안전 여백 24px'}</span></div></div><label class="ws-field"><span>스프라이트 시트 가로 칸 수</span><select id="export-columns">${[1, 4, 6, 8].filter(n => n <= frames.length).map(n => `<option value="${n}" ${n === Math.min(6, frames.length) ? 'selected' : ''}>${n}칸</option>`).join('')}</select></label><p id="export-dimensions" class="ws-hint"></p>${unsafe ? '<p class="ws-error">일부 프레임이 경계에 닿아 PNG 출력이 잠겼습니다. 반경이나 위치를 조정해 주세요. JSON은 백업할 수 있습니다.</p>' : ''}<div class="ws-export-options"><button class="ws-primary" data-action="export-sheet" ${unsafe || !visible ? 'disabled' : ''}>${icon('download')} 투명 PNG 시트</button><button data-action="export-metadata" ${unsafe || (!visible && !hasMotion) ? 'disabled' : ''}>시트 배치 정보 JSON</button><button data-action="export-recipe">${icon('copy')} 수정 가능한 작업 JSON</button><button data-action="export-frame" ${unsafe || !visible ? 'disabled' : ''}>현재 프레임 PNG</button><button data-action="export-contact">${icon('grid')} 밝은 배경 검수 이미지</button></div><p class="ws-hint">게임 적용용은 PNG 시트와 배치 정보 JSON을 함께 받으세요. 작업을 이어가려면 작업 JSON을 보관하세요. 캐릭터 이동은 배치 JSON에 포함되며 PNG는 캐릭터를 제외한 이펙트 그림입니다.</p>`, 'export');
  updateExportDimensions();
}
function exportColumns(): number { return Number($('#export-columns').value); }
function updateExportDimensions(): void {
  const metadata = sheetMetadata(recipe, exportColumns());
  $('#export-dimensions').textContent = `${metadata.columns * metadata.cellWidth} × ${metadata.rows * metadata.cellHeight}px · 셀 ${metadata.cellWidth} × ${metadata.cellHeight}px (콘텐츠 ${recipe.settings.size}px + 사방 24px)`;
}
function exportContact(): void {
  flushRender(); const columns = 6, cell = recipe.settings.size + SKILL_FRAME_PADDING * 2, rows = Math.ceil(frames.length / columns);
  const sheet = canvas(cell * columns, (cell + 28) * rows), ctx = sheet.getContext('2d')!;
  frames.forEach((frame, i) => {
    const x = (i % columns) * cell, y = Math.floor(i / columns) * (cell + 28);
    ctx.fillStyle = Math.floor(i / columns) % 2 ? '#d5d8db' : '#9acb8f'; ctx.fillRect(x, y, cell, cell + 28); ctx.drawImage(frame.canvas, x, y);
    ctx.fillStyle = '#24312a'; ctx.font = '12px system-ui'; ctx.fillText(`${i + 1}F${i + 1 === recipe.placement.impactFrame ? ' · impact' : ''}${frame.touchesEdge ? ' · EDGE' : ''}`, x + 10, y + cell + 18);
  });
  downloadCanvas(sheet, filename('.검수.png'));
}

document.addEventListener('click', event => {
  const button = (event.target as Element).closest<HTMLElement>('button'); if (!button || button.hasAttribute('disabled')) return;
  if (button.dataset.preset) { addEntry(createPreset(button.dataset.preset as PresetId)); return; }
  if (button.dataset.entry) { selectEntry(button.dataset.entry); return; }
  if (button.dataset.library) { libraryTab = button.dataset.library; renderLibrary(); return; }
  if (button.dataset.view) { void switchView(button.dataset.view as typeof view); return; }
  if (button.dataset.frame !== undefined) { setFrame(Number(button.dataset.frame)); return; }
  if (button.dataset.layer) { layerId = button.dataset.layer; renderInspector(); return; }
  if (button.dataset.visible) { commit(next => { const layer = next.layers.find(l => l.id === button.dataset.visible)!; layer.enabled = !layer.enabled; }, '', true); return; }
  switch (button.dataset.action) {
    case 'components': void switchView('nodes').then(() => nodeEditor.openLibrary()); break;
    case 'new-drawing': { const next = cloneRecipe(recipe); next.name = '새 그림 이펙트'; next.drawing = emptyDrawing(); delete next.graph; delete next.sequence; addEntry(next); void switchView('drawing'); break; }
    case 'horizontal-fade': commit(applyHorizontalFade, '', true); notify('검상이 시작점부터 천천히 소멸하도록 수정했습니다.'); break;
    case 'emerald-collapse': commit(reviseEmeraldCollapse, '', true); notify('사각형 회전·축소와 잔상을 적용했습니다. 실행 취소로 이전 모션을 복원할 수 있어요.'); break;
    case 'new': openNew(); break;
    case 'import': openImport(); break;
    case 'export': openExport(); break;
    case 'ai': openAi(); break;
    case 'close-dialog': $('#workshop-dialog').close(); break;
    case 'choose-file': $('#json-file').value = ''; $('#json-file').click(); break;
    case 'import-text': importText($('#import-text').value); break;
    case 'copy-prompt': void navigator.clipboard.writeText($('#ai-prompt').value).then(() => notify('요청을 복사했습니다. 이 대화에 붙여 주세요.')).catch(() => { $('#ai-prompt').select(); notify('복사가 차단되었습니다. 선택된 요청을 직접 복사하거나 TXT로 내려받아 주세요.'); }); break;
    case 'save-prompt': download(new Blob([$('#ai-prompt').value], { type: 'text/plain;charset=utf-8' }), filename('.AI요청.txt')); break;
    case 'export-sheet': if (exportAllowed()) downloadCanvas(createSheet(frames, exportColumns()), filename('.sheet.png')); break;
    case 'export-metadata': if (exportAllowed(true)) downloadJson(sheetMetadata(recipe, exportColumns()), filename('.sheet.json')); break;
    case 'export-recipe': downloadJson(recipe, filename('.effect.json')); break;
    case 'export-frame': if (exportAllowed()) downloadCanvas(frames[frameIndex].canvas, filename(`.${frameIndex + 1}F.png`)); break;
    case 'export-contact': exportContact(); break;
    case 'play': flushRender(); if (!playing && playhead >= frames.length - 1) { playhead = 0; frameIndex = 0; } playing = !playing; lastTime = performance.now(); updatePlayControls(); break;
    case 'previous': setFrame(frameIndex - 1); break;
    case 'next': setFrame(frameIndex + 1); break;
    case 'stop': setFrame(0); break;
    case 'undo': case 'redo': {
      const source = button.dataset.action === 'undo' ? undo : redo, destination = button.dataset.action === 'undo' ? redo : undo;
      const previous = source.pop(); if (!previous) break; destination.push(cloneRecipe(recipe)); recipe = previous;
      layerId = recipe.layers.some(l => l.id === layerId) ? layerId : recipe.layers[0].id; frameIndex = Math.min(frameIndex, recipe.settings.frames - 1); playhead = frameIndex; lastEditKey = '';
      updateDocument(); renderInspector(); syncEntry(); rebuildFrames(); break;
    }
    case 'duplicate': { const next = cloneRecipe(recipe); next.name = `${next.name.slice(0, 75)} 복사`; addEntry(next); notify('작업을 복제했습니다.'); break; }
    case 'delete': openDialog('이 작업을 삭제할까요?', `<p class="ws-dialog-intro">‘${escape(recipe.name)}’을 보관함에서 삭제합니다. 필요하면 먼저 작업 JSON을 백업해 주세요.</p><div class="ws-dialog-actions"><button data-action="close-dialog">취소</button><button class="ws-danger" data-action="confirm-delete">작업 삭제</button></div>`, 'delete'); break;
    case 'confirm-delete': entries = entries.filter(entry => entry.id !== activeId); if (!entries.length) entries.push({ id: uid(), updatedAt: new Date().toISOString(), recipe: createPreset('slash') }); selectEntry(entries[0].id); $('#workshop-dialog').close(); notify('작업을 삭제했습니다.'); break;
    case 'layer-up': case 'layer-down': {
      const direction = button.dataset.action === 'layer-up' ? -1 : 1;
      commit(next => { const index = next.layers.findIndex(l => l.id === layerId), other = index + direction; if (other >= 0 && other < next.layers.length) [next.layers[index], next.layers[other]] = [next.layers[other], next.layers[index]]; }, '', true); break;
    }
    case 'layer-delete': if (recipe.layers.length > 1) commit(next => { next.layers = next.layers.filter(l => l.id !== layerId); }, '', true); break;
    case 'retry-battle': void switchView('battle'); break;
  }
});
document.addEventListener('input', event => {
  const input = event.target as HTMLInputElement;
  if (input.dataset.sequenceProp && input.type === 'range') { commit(next => { if (next.sequence) Object.assign(next.sequence, { [input.dataset.sequenceProp!]: Number(input.value) }); }, `sequence-${input.dataset.sequenceProp}`); input.parentElement!.querySelector('output')!.textContent = `${input.value}×`; return; }
  if (input.id === 'library-search') { renderLibrary(); return; }
  if (input.id === 'scrubber') { setFrame(Number(input.value) - 1); return; }
  if (input.id === 'ai-request') { updateAiPrompt(); return; }
  if (input.dataset.palette !== undefined) {
    commit(next => { next.palette[Number(input.dataset.palette)] = input.value; }, `palette-${input.dataset.palette}`);
    input.nextElementSibling!.textContent = input.value.toUpperCase(); return;
  }
  if (input.type === 'range' && input.dataset.layerProp) {
    const property = input.dataset.layerProp as keyof EffectLayer;
    commit(next => { Object.assign(next.layers.find(l => l.id === layerId)!, { [property]: Number(input.value) }); }, `${layerId}-${property}`);
    input.parentElement!.querySelector('output')!.textContent = `${input.value}${input.dataset.unit ?? ''}`;
  }
});
document.addEventListener('change', event => {
  const input = event.target as HTMLInputElement;
  if (input.dataset.sequenceProp === 'enabled') { commit(next => { if (next.sequence) next.sequence.enabled = input.checked; }); return; }
  if (input.id === 'background') { background = input.value; $('.ws-preview-wrap').dataset.background = background; drawPreview(); return; }
  if (input.id === 'zoom') { zoom = Number(input.value); drawPreview(); return; }
  if (input.id === 'speed') { speed = Number(input.value); return; }
  if (input.id === 'export-columns') { updateExportDimensions(); return; }
  if (input.id === 'battle-position') {
    const position = ({ top: [170, 128], center: [235, 255], caster: [99, 193] } as Record<string, number[]>)[input.value];
    if (position) { battle?.setPosition(position[0], position[1]); battle?.draw(frames[frameIndex], recipe); } return;
  }
  if (input.id === 'add-layer' && input.value) { const layer = makeLayer(input.value as LayerType); layerId = layer.id; commit(next => { next.layers.push(layer); }, '', true); return; }
  if (input.dataset.path) {
    if (input.type !== 'checkbox' && !input.checkValidity()) { input.reportValidity(); return; }
    const path = input.dataset.path;
    commit(next => {
      if (path === 'name') next.name = input.value.trim();
      else {
        const [group, property] = path.split('.'), value = input.type === 'checkbox' ? input.checked : Number(input.value);
        Object.assign(next[group as 'settings' | 'placement'], { [property]: value });
        if (path === 'settings.frames') next.placement.impactFrame = Math.min(next.placement.impactFrame, next.settings.frames);
        if (path === 'settings.size' && next.settings.size % next.settings.pixelSize) next.settings.pixelSize = 1;
      }
    }, '', true);
    return;
  }
  if (input.dataset.layerProp && input.type !== 'range') {
    if (!input.checkValidity()) { input.reportValidity(); return; }
    const property = input.dataset.layerProp, value = ['name', 'blend'].includes(property) ? input.value : Number(input.value);
    commit(next => { Object.assign(next.layers.find(l => l.id === layerId)!, { [property]: value }); }, '', property === 'name');
  }
});
$('#guides').addEventListener('click', () => { showGuides = !showGuides; $('#guides').setAttribute('aria-pressed', String(showGuides)); drawPreview(); });
$('#loop').addEventListener('click', () => { playbackLoop = !playbackLoop; updatePlayControls(); });
$('#json-file').addEventListener('change', async event => {
  const file = (event.target as HTMLInputElement).files?.[0]; if (!file) return;
  if (file.size > MAX_FILE_BYTES) { $('#import-error').textContent = 'JSON 파일은 512KB 이하로 가져와 주세요.'; return; }
  try { importText(await file.text()); } catch { $('#import-error').textContent = '파일을 읽을 수 없습니다. 다시 선택해 주세요.'; }
});
$('#battle-host').addEventListener('click', event => {
  if (!battle || !(event.target instanceof HTMLCanvasElement)) return;
  const bounds = event.target.getBoundingClientRect(); battle.setPosition((event.clientX - bounds.left) / bounds.width * 390, (event.clientY - bounds.top) / bounds.height * 430);
  $('#battle-position').value = 'custom'; battle.draw(frames[frameIndex], recipe);
});
document.addEventListener('keydown', event => {
  const target = event.target as HTMLElement;
  if (target.closest('input,textarea,select,[contenteditable="true"]') || document.querySelector('dialog[open]')) return;
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') { event.preventDefault(); $(`button[data-action="${event.shiftKey ? 'redo' : 'undo'}"]`).click(); }
  else if (event.code === 'Space' && !(event.target as Element).closest('button')) { event.preventDefault(); $('#play-button').click(); }
  else if (event.key === 'ArrowLeft') { event.preventDefault(); setFrame(frameIndex - 1); }
  else if (event.key === 'ArrowRight') { event.preventDefault(); setFrame(frameIndex + 1); }
});
document.addEventListener('visibilitychange', () => { lastTime = 0; });
window.addEventListener('storage', event => { if (event.key === STORAGE_KEY) notify('다른 공방 창에서 보관함이 바뀌었습니다. 이 창의 작업을 JSON으로 백업한 뒤 새로고침해 주세요.'); });
const observer = new ResizeObserver(drawPreview); observer.observe($('#editor-preview'));
window.addEventListener('pagehide', event => { if (event.persisted) return; alive = false; clearTimeout(renderTimer); observer.disconnect(); drawingEditor.destroy(); nodeEditor.destroy(); battle?.destroy(); destroyFrames(frames); });
function tick(now: number): void {
  if (!alive) return;
  if (playing && !document.hidden && !document.querySelector('dialog[open]') && frames.length) {
    if (lastTime) {
      playhead += Math.max(0, (now - lastTime) / 1000) * recipe.settings.fps * speed;
      if (playhead >= frames.length) {
        if (playbackLoop) playhead %= frames.length;
        else { playhead = frames.length - 1; playing = false; updatePlayControls(); }
      }
      const next = Math.min(frames.length - 1, Math.floor(playhead));
      if (next !== frameIndex) { frameIndex = next; drawPreview(); if (view === 'battle') battle?.draw(frames[frameIndex], recipe); updateFrameLabel(); }
    }
    lastTime = now;
  } else lastTime = 0;
  requestAnimationFrame(tick);
}
updateDocument(); renderInspector(); rebuildFrames(); updatePlayControls(); persist(); requestAnimationFrame(tick);
if (launch.requested) { const url = new URL(location.href); url.searchParams.delete('entry'); url.searchParams.delete('preset'); history.replaceState(null, '', url); }
if (location.hash === '#drawing') void switchView('drawing');
if (location.hash === '#nodes') void switchView('nodes');
if (storageNotice) { $('#footer-status').textContent = '임시 모드 · 기존 데이터 보존'; notify(storageNotice); }
else if (launchNotice) notify(launchNotice);

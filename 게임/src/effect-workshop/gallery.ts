import './gallery.css';
import { readLibrary, STORAGE_KEY } from './model';
import { renderPreviewCanvas } from './renderer';
import { filterGallery, galleryFrameAt, galleryItems, makeConceptRequest, type GalleryItem, type GallerySource } from './galleryModel';

const q = <T extends HTMLElement = HTMLElement>(selector: string) => document.querySelector<T>(selector)!;
const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const glyph = (name: 'grid' | 'bookmark' | 'back' | 'expand') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${{
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  bookmark: '<path d="M6 3h12v18l-6-4-6 4Z"/>', back: '<path d="m10 5-7 7 7 7M3 12h18"/>', expand: '<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>',
}[name]}</svg>`;

q('#gallery').innerHTML = `
  <header class="g-header"><div class="g-brand"><span class="g-mark">${glyph('grid')}</span><div><small>GRID DEFENDERS</small><h1>이펙트 갤러리</h1></div></div><nav class="g-header-actions" aria-label="페이지 이동"><a class="g-link" href="./effect-materials.html">전체 재료함 ↗</a><button id="gallery-fullscreen">${glyph('expand')} 화면 가득</button><a class="g-link" href="./effect-workshop.html">${glyph('back')} 공방으로</a></nav></header>
  <main class="g-page">
    <div class="g-intro"><p><strong>움직임을 한눈에 비교하세요.</strong><br>전체 효과를 비교하고 ‘구성 부품 보기’에서 불꽃·문양처럼 필요한 부분을 꺼내 쓰세요.</p><button class="g-primary" id="gallery-guide">선택으로 연출 구상 <span id="reference-count">0 / 3</span></button></div>
    <div id="gallery-error" class="g-error" role="alert" hidden></div>
    <section class="g-tools" aria-label="갤러리 검색과 재생 설정">
      <div class="g-filter-row"><div class="g-tabs" role="group" aria-label="이펙트 분류"><button data-source="preset" aria-pressed="true">기본 효과 <span></span></button><button data-source="saved" aria-pressed="false">내 작업 <span></span></button><button data-source="all" aria-pressed="false">전체 <span></span></button></div><label class="g-search"><input id="gallery-search" type="search" placeholder="이름이나 느낌으로 검색" aria-label="이펙트 검색"></label></div>
      <div class="g-playback-row"><button id="gallery-play" aria-pressed="false">일시정지</button><button id="gallery-restart">처음부터</button><label class="g-control">속도<select id="gallery-speed"><option value="0.5">0.5×</option><option value="1" selected>1×</option><option value="2">2×</option></select></label><label class="g-control">배경<select id="gallery-background"><option value="dark">어두운 격자</option><option value="gray">밝은 회색</option><option value="green">밝은 초록</option></select></label><label class="g-control">카드<select id="gallery-size"><option value="normal">보통</option><option value="small">작게</option><option value="large">크게</option></select></label></div>
    </section>
    <div class="g-heading"><h2 id="gallery-count" aria-live="polite"></h2><a id="movement-download" class="g-link" href="./effect-recipes/movement/movement-vfx-sources.zip" download hidden>이동 소스 10종 받기 ↓</a><span>그림을 누르면 편집 · 책갈피는 참고 선택</span></div>
    <section id="gallery-grid" class="g-grid" data-size="normal" aria-label="움직이는 이펙트 목록"></section>
    <div id="gallery-empty" class="g-empty" hidden></div>
    <footer class="g-footer"><span>기본 효과는 새 작업으로 · 내 작업은 이어서 편집</span><span>현재 브라우저의 공방 보관함과 연결됩니다.</span></footer>
  </main>
  <dialog id="concept-dialog" aria-labelledby="concept-title"><div class="g-dialog-heading"><h2 id="concept-title">하나씩 만들기 막막하다면</h2><button id="concept-close" aria-label="연출 구상 닫기">닫기</button></div>
    <p class="g-guide-note">마음에 드는 움직임을 고르고, 서로 다른 시안 세 개를 비교한 뒤 하나를 다듬어 보세요.</p>
    <div class="g-steps"><article><b>01 · 큰 움직임</b><h3>무엇을 하는 효과인지</h3><p>검격·투사체·폭발·장판 중 주동작부터 고릅니다. 참고 효과는 책갈피로 세 개까지 선택하세요.</p></article><article><b>02 · 힘을 줄 순간</b><h3>준비 → 타격 → 잔상</h3><p>준비는 작게, 타격은 짧고 밝게, 잔상은 빠르게 정리합니다. 크기와 속도의 차이를 주세요.</p></article><article><b>03 · 시안 비교</b><h3>다른 움직임 세 가지</h3><p>색만 바꾸기보다 직선·회전·분열처럼 실루엣이 다른 시안을 비교하고 좋은 부분을 고릅니다.</p></article></div>
    <div class="g-guide-fields"><label class="g-field"><span>필요한 연출</span><select id="concept-kind"><option>검격·돌진</option><option>투사체·명중</option><option>범위 폭발</option><option>장판·마법진</option><option>방어·보호막</option><option>회복·강화</option><option>연결·분열</option></select></label><label class="g-field"><span>전체 길이</span><select id="concept-duration"><option value="0.6">짧게 · 0.6초</option><option value="1.2" selected>보통 · 1.2초</option><option value="2">길게 · 2초</option><option value="3.2">단계 연출 · 3.2초</option></select></label><label class="g-field g-wide"><span>색과 느낌</span><input id="concept-mood" maxlength="500" placeholder="예: 보랏빛 번개, 날카롭고 묵직하게"></label></div>
    <p id="concept-references" class="g-guide-references"></p><label class="g-field"><span>대화에 전달할 요청 · 직접 수정해도 됩니다</span><textarea id="concept-request" class="g-request" rows="8"></textarea></label><p class="g-guide-note">요청문을 복사해 이 대화에 붙여 주세요. 여기서는 요청문을 준비합니다.</p><div class="g-guide-actions"><button id="concept-refresh">입력으로 다시 작성</button><button id="concept-copy" class="g-primary">요청문 복사</button></div>
  </dialog><div id="gallery-toast" class="g-toast" role="status" aria-live="polite" hidden></div>`;

interface Card { item: GalleryItem; element: HTMLElement; canvas: HTMLCanvasElement; lastFrame: number; failed: boolean }
let items: GalleryItem[] = [], source: GallerySource = 'all', query = new URLSearchParams(location.search).get('q')?.slice(0, 120) ?? '', cards: Card[] = [];
const references = new Set<string>(), visible = new Set<HTMLElement>();
let playing = !matchMedia('(prefers-reduced-motion: reduce)').matches, speed = 1, playTime = 200, lastTime = 0, lastDraw = 0, cursor = 0, alive = true, raf = 0, toastTimer = 0;
// Small canvases only, without PNG strings or Pixi resources. The LRU stays below 65 MiB.
const cache = new Map<string, HTMLCanvasElement>(), CACHE_LIMIT = 320;
const observer = new IntersectionObserver(entries => { for (const e of entries) { if (e.isIntersecting) visible.add(e.target as HTMLElement); else visible.delete(e.target as HTMLElement); } }, { rootMargin: '80px' });

function toast(message: string) { q('#gallery-toast').textContent = message; q('#gallery-toast').hidden = false; clearTimeout(toastTimer); toastTimer = window.setTimeout(() => q('#gallery-toast').hidden = true, 4500); }
function clearCache() { for (const c of cache.values()) c.width = c.height = 0; cache.clear(); }
function preview(item: GalleryItem, index: number): HTMLCanvasElement {
  const key = `${item.key}/${index}`, cached = cache.get(key);
  if (cached) { cache.delete(key); cache.set(key, cached); return cached; }
  const frame = renderPreviewCanvas(item.recipe, index), c = document.createElement('canvas');
  c.width = c.height = Math.min(224, frame.width); c.getContext('2d')!.drawImage(frame, 0, 0, c.width, c.height);
  frame.width = frame.height = 0;
  cache.set(key, c);
  if (cache.size > CACHE_LIMIT) { const oldest = cache.keys().next().value!; const old = cache.get(oldest)!; old.width = old.height = 0; cache.delete(oldest); }
  return c;
}
function updateReferences() {
  q('#reference-count').textContent = `${references.size} / 3`;
  for (const card of cards) { const selected = references.has(card.item.key); card.element.classList.toggle('is-reference', selected); card.element.querySelector('[data-reference]')!.setAttribute('aria-pressed', String(selected)); }
}
function renderCards() {
  observer.disconnect(); visible.clear(); cursor = 0;
  document.querySelectorAll<HTMLElement>('[data-source]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.source === source)));
  const shown = filterGallery(items, source, query), grid = q('#gallery-grid');
  q('#movement-download').hidden = !query.trim() || !shown.some(i => i.key.startsWith('preset:run-'));
  q('#gallery-count').textContent = `${({ preset: '기본 효과', saved: '내 작업', all: '전체 효과' })[source]} · ${shown.length}개`;
  grid.innerHTML = shown.map(item => {
    const r = item.recipe, seconds = Number((r.settings.frames / r.settings.fps).toFixed(2));
    const description = item.source === 'saved' ? `${new Date(item.updatedAt!).toLocaleDateString('ko-KR')} 저장 · 내 작업` : item.description;
    return `<article class="g-card" data-gallery-key="${esc(item.key)}" style="--effect-color:${r.palette[0]}"><div class="g-stage"><canvas width="224" height="224" role="img" aria-label="${esc(r.name)} 애니메이션"></canvas><a class="g-stage-link" href="${esc(item.href)}" aria-label="${esc(r.name)} ${item.source === 'saved' ? '이어서 편집' : '새 작업으로 편집'}"></a><span class="g-badge">${item.source === 'preset' ? '기본 효과' : '내 작업'}</span><button class="g-reference" data-reference="${esc(item.key)}" aria-pressed="false" aria-label="${esc(r.name)} 참고로 선택" title="참고로 선택">${glyph('bookmark')}</button><span class="g-preview-note">미리보기 준비 중</span></div><div class="g-card-body"><h3>${esc(r.name)}</h3><p>${esc(description)}</p><div class="g-card-meta"><span>${seconds}초 · ${r.settings.frames}프레임</span><span class="g-swatches" aria-label="효과 색상">${r.palette.map(c => `<i style="background:${c}"></i>`).join('')}</span></div><a class="g-link g-edit" href="${esc(item.href)}">${item.source === 'saved' ? '편집하기' : '이 효과로 시작'} ↗</a><a class="g-link g-edit" href="${esc(item.href)}#nodes">구성 부품 보기 ↗</a></div></article>`;
  }).join('');
  cards = shown.map((item, i) => ({ item, element: grid.children[i] as HTMLElement, canvas: grid.children[i].querySelector('canvas')!, lastFrame: -1, failed: false }));
  cards.forEach(c => observer.observe(c.element));
  q('#gallery-empty').hidden = !!shown.length;
  q('#gallery-empty').textContent = query ? '검색 결과가 없어요. 이름이나 검색어를 바꿔 보세요.' : '아직 저장한 작업이 없어요. 기본 효과에서 마음에 드는 것을 골라 새 작업으로 편집해 보세요.';
  updateReferences();
}
function loadCatalog() {
  let saved: ReturnType<typeof readLibrary>['entries'] = [];
  try { saved = readLibrary(localStorage).entries; q('#gallery-error').hidden = true; }
  catch { q('#gallery-error').hidden = false; q('#gallery-error').textContent = '내 작업을 읽지 못했습니다. 저장된 데이터는 그대로 두고 기본 효과를 표시합니다. 공방에서 작업 JSON을 확인해 주세요.'; }
  clearCache(); items = galleryItems(saved);
  for (const key of references) if (!items.some(i => i.key === key)) references.delete(key);
  for (const b of document.querySelectorAll<HTMLElement>('[data-source]')) b.querySelector('span')!.textContent = String(filterGallery(items, b.dataset.source as GallerySource, '').length);
  renderCards();
}
function updatePlayback() { q('#gallery-play').textContent = playing ? '일시정지' : '함께 재생'; q('#gallery-play').setAttribute('aria-pressed', String(!playing)); }
function writeRequest() {
  const selected = items.filter(i => references.has(i.key));
  q('#concept-references').textContent = selected.length ? `참고: ${selected.map(i => i.recipe.name).join(' · ')}` : '선택한 참고가 없습니다. 갤러리의 책갈피로 최대 세 개를 고를 수 있어요.';
  q<HTMLTextAreaElement>('#concept-request').value = makeConceptRequest(q<HTMLSelectElement>('#concept-kind').value, q<HTMLInputElement>('#concept-mood').value, q<HTMLSelectElement>('#concept-duration').value, selected);
}
function tick(now: number) {
  if (!alive) return;
  raf = requestAnimationFrame(tick);
  const blocked = document.hidden || q<HTMLDialogElement>('#concept-dialog').open;
  if (blocked) { lastTime = 0; return; }
  if (lastTime && playing) playTime += (now - lastTime) * speed;
  lastTime = now;
  if (now - lastDraw < 1000 / 30) return;
  lastDraw = now;
  const active = cards.filter(c => visible.has(c.element) && !c.failed), started = performance.now();
  let rendered = 0;
  for (let n = 0; n < active.length; n++) {
    const card = active[(cursor + n) % active.length], index = galleryFrameAt(card.item.recipe, playTime);
    if (card.lastFrame === index) continue;
    const key = `${card.item.key}/${index}`;
    if (!cache.has(key) && rendered && performance.now() - started > 10) continue;
    try {
      const frame = preview(card.item, index), ctx = card.canvas.getContext('2d')!;
      ctx.clearRect(0, 0, 224, 224); ctx.imageSmoothingEnabled = card.item.recipe.settings.pixelSize === 1; ctx.drawImage(frame, 0, 0, 224, 224);
      card.lastFrame = index; card.canvas.dataset.frame = String(index); card.element.dataset.ready = 'true'; card.element.querySelector<HTMLElement>('.g-preview-note')!.hidden = true; rendered++;
    } catch { card.failed = true; card.element.querySelector('.g-preview-note')!.textContent = '미리보기를 준비하지 못했어요. 공방에서 확인해 주세요.'; }
  }
  cursor = active.length ? (cursor + 1) % active.length : 0;
}
document.addEventListener('click', event => {
  const button = (event.target as Element).closest<HTMLButtonElement>('button'); if (!button) return;
  if (button.dataset.source) {
    source = button.dataset.source as GallerySource;
    document.querySelectorAll<HTMLElement>('[data-source]').forEach(b => b.setAttribute('aria-pressed', String(b === button))); renderCards(); return;
  }
  if (button.dataset.reference) {
    const key = button.dataset.reference;
    if (references.has(key)) references.delete(key);
    else if (references.size < 3) references.add(key);
    else { toast('참고 효과는 세 개까지 선택할 수 있어요. 선택한 책갈피를 눌러 해제하세요.'); return; }
    updateReferences(); return;
  }
  switch (button.id) {
    case 'gallery-play': playing = !playing; lastTime = 0; updatePlayback(); break;
    case 'gallery-restart': playTime = 0; lastTime = 0; playing = true; updatePlayback(); break;
    case 'gallery-guide': writeRequest(); q<HTMLDialogElement>('#concept-dialog').showModal(); break;
    case 'concept-close': q<HTMLDialogElement>('#concept-dialog').close(); break;
    case 'concept-refresh': writeRequest(); break;
    case 'concept-copy': {
      const text = q<HTMLTextAreaElement>('#concept-request');
      if (navigator.clipboard) void navigator.clipboard.writeText(text.value).then(() => toast('요청문을 복사했습니다. 이 대화에 붙여 주세요.')).catch(() => { text.focus(); text.select(); toast('요청문을 선택했습니다. 직접 복사해 주세요.'); });
      else { text.focus(); text.select(); toast('요청문을 선택했습니다. 직접 복사해 주세요.'); } break;
    }
    case 'gallery-fullscreen': {
      const action = document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.();
      if (action) void action.catch(() => toast('이 브라우저에서는 전체 화면 전환을 사용할 수 없어요.')); else toast('이 브라우저에서는 전체 화면 전환을 사용할 수 없어요.'); break;
    }
  }
});
q('#gallery-search').addEventListener('input', () => { query = q<HTMLInputElement>('#gallery-search').value; renderCards(); });
q('#gallery-speed').addEventListener('change', () => { speed = Number(q<HTMLSelectElement>('#gallery-speed').value); lastTime = 0; });
q('#gallery-background').addEventListener('change', () => q('#gallery').dataset.background = q<HTMLSelectElement>('#gallery-background').value);
q('#gallery-size').addEventListener('change', () => q('#gallery-grid').dataset.size = q<HTMLSelectElement>('#gallery-size').value);
for (const selector of ['#concept-kind', '#concept-mood', '#concept-duration']) q(selector).addEventListener('input', writeRequest);
document.addEventListener('fullscreenchange', () => { q('#gallery-fullscreen').innerHTML = `${glyph('expand')} ${document.fullscreenElement ? '전체 화면 나가기' : '화면 가득'}`; });
document.addEventListener('visibilitychange', () => { lastTime = 0; });
window.addEventListener('storage', event => { if (event.key === STORAGE_KEY || event.key === null) loadCatalog(); });
window.addEventListener('pageshow', event => { if (event.persisted) { loadCatalog(); lastTime = 0; } });
window.addEventListener('pagehide', event => { if (event.persisted) return; alive = false; cancelAnimationFrame(raf); observer.disconnect(); clearCache(); clearTimeout(toastTimer); });
document.addEventListener('keydown', event => { if (event.code === 'Space' && !(event.target as HTMLElement).closest('input,textarea,select,button,a') && !q<HTMLDialogElement>('#concept-dialog').open) { event.preventDefault(); q('#gallery-play').click(); } });
q<HTMLInputElement>('#gallery-search').value = query;
q('#gallery').dataset.background = 'dark'; updatePlayback(); loadCatalog(); raf = requestAnimationFrame(tick);

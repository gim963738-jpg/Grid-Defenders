import './components.css';
import { readLibrary, type EffectRecipe } from './model';
import { COMPONENT_CATEGORIES, COMPONENT_STORAGE, defaultComponents, parseComponent, readComponents, recipeComponents, writeComponents, type EffectComponent } from './componentModel';
import { renderPreviewCanvas } from './renderer';

const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
function download(name: string, data: unknown) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  const a = document.createElement('a'); a.href = url; a.download = name.replace(/[\\/:*?"<>|]/g, '_') + '.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function createComponentLibrary(hooks: { getRecipe: () => EffectRecipe; insert: (part: EffectComponent) => void; notify: (message: string) => void }) {
  const dialog = document.createElement('dialog'); dialog.className = 'cp-dialog'; dialog.setAttribute('aria-label', '이펙트 부품 보관함');
  dialog.innerHTML = `<header><div><small>REUSABLE EFFECT PARTS</small><h2>부품 보관함</h2></div><button data-cp="close">닫기 ✕</button></header>
    <p class="cp-intro">불꽃·마법진·문양을 따로 보고 현재 작품에 넣으세요. 원래 색과 모양은 보존하고, 움직임은 현재 작품의 전체 재생 길이에 맞춥니다.</p>
    <form class="cp-save" hidden><label>부품 이름<input name="partName" maxlength="80" required></label><label>노드 카테고리<input name="category" maxlength="40" required list="cp-categories"></label><datalist id="cp-categories">${COMPONENT_CATEGORIES.map(c => `<option value="${c}">`).join('')}</datalist><button class="ws-primary" type="submit">이 부품 보관</button></form>
    <div class="cp-tools"><label>보는 곳<select data-cp-source><option value="current">현재 작품의 구성</option><option value="saved">내 부품</option><option value="preset">기본 부품</option><option value="works">다른 저장 작품의 구성</option></select></label><label>카테고리<select data-cp-category></select></label><label class="cp-search">검색<input data-cp-search type="search" placeholder="불꽃, 문양, 작품 이름"></label><label>배경<select data-cp-bg><option value="gray">밝은 회색</option><option value="green">초록 전장</option><option value="dark">어두운 격자</option></select></label><button data-cp="play">일시정지</button></div>
    <div class="cp-status" role="status"></div><div class="cp-grid" data-bg="gray"></div>
    <footer><div><button data-cp="prev">이전</button><span data-cp-page></span><button data-cp="next">다음</button></div><div><button data-cp="restore" hidden>삭제 취소</button><button data-cp="backup">보관함 백업</button><button data-cp="import">부품 JSON 가져오기</button><input type="file" accept="application/json,.json" data-cp-file hidden></div></footer>
    <p class="cp-footnote">선택한 처리 노드를 보관하면 그 앞의 연결까지 함께 담습니다. 완성 PNG에 합쳐진 불과 마법진은 원래 레이어로 자동 분리되지 않습니다. PNG 재료는 <a href="./effect-materials.html">전체 재료함</a>에서 조합하세요.</p>`;
  document.body.append(dialog);
  const q = <T extends HTMLElement = HTMLElement>(s: string) => dialog.querySelector<T>(s)!;
  let saved: EffectComponent[] = [], current: EffectComponent[] = [], works: EffectComponent[] = [], filtered: EffectComponent[] = [], shown: EffectComponent[] = [];
  let pending: EffectComponent | undefined, removed: EffectComponent | undefined, healthy = true, page = 0, playing = true, raf = 0, last = 0, clock = 0, renderCursor = 0;
  const cache = new Map<string, HTMLCanvasElement>(), visible = new Set<HTMLCanvasElement>();
  const observer = new IntersectionObserver(entries => entries.forEach(e => { const c = e.target as HTMLCanvasElement; if (e.isIntersecting) visible.add(c); else visible.delete(c); }), { root: dialog });
  function message(text: string, error = false) { q('.cp-status').textContent = text; q('.cp-status').classList.toggle('is-error', error); }
  function reload() {
    try { saved = readComponents(localStorage); healthy = true; }
    catch { saved = []; healthy = false; message('기존 부품 보관함을 읽지 못했습니다. 원본은 보존했으며 백업 버튼으로 내려받을 수 있습니다.', true); }
  }
  function source() { return ({ current, saved, preset: defaultComponents(), works })[q<HTMLSelectElement>('[data-cp-source]').value] ?? []; }
  function categories() {
    const select = q<HTMLSelectElement>('[data-cp-category]'), prior = select.value, categories = [...new Set(source().map(p => p.category))];
    select.innerHTML = '<option value="">모든 카테고리</option>' + categories.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join('');
    if (categories.includes(prior)) select.value = prior;
  }
  function render() {
    const search = q<HTMLInputElement>('[data-cp-search]').value.trim().toLocaleLowerCase(), category = q<HTMLSelectElement>('[data-cp-category]').value;
    filtered = source().filter(p => (!category || p.category === category) && `${p.name} ${p.category} ${p.origin}`.toLocaleLowerCase().includes(search));
    page = Math.max(0, Math.min(page, Math.ceil(filtered.length / 20) - 1)); shown = filtered.slice(page * 20, (page + 1) * 20);
    observer.disconnect(); visible.clear(); cache.clear();
    q('.cp-grid').innerHTML = shown.map((p, i) => `<article><div class="cp-art"><canvas width="144" height="144" data-cp-canvas="${i}" aria-label="${esc(p.name)} 애니메이션"></canvas></div><div class="cp-card-body"><small>${esc(p.category)} · ${esc(p.origin)}</small><h3>${esc(p.name)}</h3><div><button class="ws-primary" data-cp-add="${i}">현재 작품에 넣기</button>${q<HTMLSelectElement>('[data-cp-source]').value !== 'saved' ? `<button data-cp-save="${i}">보관</button>` : ''}<button data-cp-export="${i}" aria-label="${esc(p.name)} 부품 JSON 저장">JSON</button>${q<HTMLSelectElement>('[data-cp-source]').value === 'saved' ? `<button data-cp-delete="${i}" aria-label="${esc(p.name)} 보관함에서 삭제">삭제</button>` : ''}</div></div></article>`).join('') || '<p class="cp-empty">해당 부품이 없습니다. 노드를 선택하고 ‘이 부분 보관’을 누르거나 기본 부품을 살펴보세요.</p>';
    q('[data-cp-page]').textContent = `${page + 1} / ${Math.max(1, Math.ceil(filtered.length / 20))} · ${filtered.length}개`;
    q<HTMLButtonElement>('[data-cp="prev"]').disabled = page === 0; q<HTMLButtonElement>('[data-cp="next"]').disabled = (page + 1) * 20 >= filtered.length;
    q<HTMLButtonElement>('[data-cp="restore"]').hidden = !removed;
    q<HTMLButtonElement>('.cp-save button').disabled = !healthy;
    q('.cp-grid').querySelectorAll<HTMLCanvasElement>('canvas').forEach(c => observer.observe(c));
  }
  function store(next: EffectComponent[]) { if (!healthy) throw Error('기존 보관함을 먼저 백업해 주세요. 읽지 못한 데이터를 덮어쓰지 않았습니다.'); writeComponents(localStorage, next); saved = next; }
  function tick(now: number) {
    if (!dialog.open) return; raf = requestAnimationFrame(tick);
    const dt = Math.min(100, now - last); last = now; if (document.hidden) return; if (playing) clock += dt;
    const until = performance.now() + 7;
    const active = [...visible];
    for (let n = 0; n < active.length; n++) {
      const c = active[(renderCursor + n) % active.length];
      const p = shown[Number(c.dataset.cpCanvas)]; if (!p) continue;
      const duration = p.recipe.settings.frames / p.recipe.settings.fps * 1000;
      const frame = Math.min(p.recipe.settings.frames - 1, Math.floor((clock % (duration + 350)) / 1000 * p.recipe.settings.fps));
      if (c.dataset.frame === String(frame)) continue;
      const key = `${p.id}:${frame}`; let image = cache.get(key);
      if (!image) {
        const original = renderPreviewCanvas(p.recipe, frame); image = document.createElement('canvas'); image.width = image.height = 144;
        image.getContext('2d')!.drawImage(original, 0, 0, 144, 144); cache.set(key, image);
        if (cache.size > 160) cache.delete(cache.keys().next().value!);
      }
      const ctx = c.getContext('2d')!; ctx.clearRect(0, 0, c.width, c.height); ctx.drawImage(image, 0, 0); c.dataset.frame = String(frame);
      if (performance.now() > until) { renderCursor = (renderCursor + n + 1) % active.length; break; }
    }
  }
  function stop() { cancelAnimationFrame(raf); observer.disconnect(); visible.clear(); cache.clear(); pending = undefined; }
  dialog.addEventListener('close', stop);
  dialog.addEventListener('submit', e => {
    e.preventDefault(); if (!pending) return;
    try {
      reload(); const form = q<HTMLFormElement>('form'), name = (form.elements.namedItem('partName') as HTMLInputElement).value.trim(), category = (form.elements.namedItem('category') as HTMLInputElement).value.trim();
      const part = parseComponent({ ...pending, id: crypto.randomUUID(), name, category }); store([part, ...saved]); pending = undefined; form.hidden = true;
      q<HTMLSelectElement>('[data-cp-source]').value = 'saved'; categories(); render(); message(`‘${part.name}’ 부품을 보관했습니다. 다른 작품에서도 꺼낼 수 있습니다.`);
    } catch (error) { message((error as Error).message, true); }
  });
  dialog.addEventListener('input', e => { if ((e.target as HTMLElement).hasAttribute('data-cp-search')) { page = 0; render(); } });
  dialog.addEventListener('change', async e => {
    const el = e.target as HTMLInputElement;
    if (el.hasAttribute('data-cp-source')) { page = 0; categories(); render(); }
    if (el.hasAttribute('data-cp-category')) { page = 0; render(); }
    if (el.hasAttribute('data-cp-bg')) q('.cp-grid').dataset.bg = el.value;
    if (el.hasAttribute('data-cp-file') && el.files?.[0]) {
      try {
        const file = el.files[0]; if (file.size > 2 * 1024 * 1024) throw Error('2MB 이하의 부품 JSON을 사용해 주세요.');
        const raw = JSON.parse(await file.text()); const list = raw.format === 'gd.component-library@1' ? raw.items : [raw];
        if (!Array.isArray(list) || list.length > 60) throw Error('부품은 60개까지 가져올 수 있습니다.');
        const parts = list.map(p => ({ ...parseComponent(p), id: crypto.randomUUID() })); reload(); store([...parts, ...saved]);
        q<HTMLSelectElement>('[data-cp-source]').value = 'saved'; categories(); render(); message(`${parts.length}개 부품을 가져왔습니다.`);
      } catch (error) { message((error as Error).message, true); } finally { el.value = ''; }
    }
  });
  dialog.addEventListener('click', e => {
    const el = (e.target as Element).closest<HTMLButtonElement>('button'); if (!el || el.disabled) return;
    try {
      if (el.dataset.cpAdd !== undefined) { hooks.insert(shown[Number(el.dataset.cpAdd)]); message('현재 작품에 연결했습니다. 닫기 후 전체 결과와 선택 부품을 함께 확인하세요.'); }
      if (el.dataset.cpSave !== undefined) { pending = shown[Number(el.dataset.cpSave)]; const form = q<HTMLFormElement>('form'); form.hidden = false; (form.elements.namedItem('partName') as HTMLInputElement).value = pending.name; (form.elements.namedItem('category') as HTMLInputElement).value = pending.category; form.scrollIntoView({ block: 'nearest' }); (form.elements.namedItem('partName') as HTMLInputElement).focus(); }
      if (el.dataset.cpExport !== undefined) { const p = shown[Number(el.dataset.cpExport)]; download(p.name + '_부품', p); }
      if (el.dataset.cpDelete !== undefined) { const p = shown[Number(el.dataset.cpDelete)]; reload(); store(saved.filter(s => s.id !== p.id)); removed = p; categories(); render(); message('보관함에서 제거했습니다. 이미 작품에 넣은 부품은 유지됩니다.'); }
      switch (el.dataset.cp) {
        case 'close': dialog.close(); break;
        case 'prev': page--; render(); break;
        case 'next': page++; render(); break;
        case 'play': playing = !playing; el.textContent = playing ? '일시정지' : '재생'; break;
        case 'import': q<HTMLInputElement>('[data-cp-file]').click(); break;
        case 'restore': if (removed) { reload(); store([removed, ...saved]); removed = undefined; categories(); render(); message('삭제한 부품을 복원했습니다.'); } break;
        case 'backup': { const raw = localStorage.getItem(COMPONENT_STORAGE); if (raw && !healthy) { const a = document.createElement('a'), url = URL.createObjectURL(new Blob([raw], { type: 'application/json' })); a.href = url; a.download = '부품보관함_원본백업.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); } else download('부품보관함', { format: 'gd.component-library@1', items: readComponents(localStorage) }); break; }
      }
    } catch (error) { message((error as Error).message, true); }
  });
  return {
    open(part?: EffectComponent) {
      pending = part; reload(); current = recipeComponents(hooks.getRecipe(), 'current');
      try { works = readLibrary(localStorage).entries.flatMap(e => recipeComponents(e.recipe, e.id)); } catch { works = []; }
      const form = q<HTMLFormElement>('form'); form.hidden = !part;
      if (part) { (form.elements.namedItem('partName') as HTMLInputElement).value = part.name; (form.elements.namedItem('category') as HTMLInputElement).value = part.category; }
      q<HTMLSelectElement>('[data-cp-source]').value = part ? 'saved' : 'current'; page = 0; q<HTMLInputElement>('[data-cp-search]').value = '';
      if (healthy) message(part ? '이름과 카테고리를 정하고 보관하세요.' : '카드를 재생하며 비교하고 필요한 부분만 꺼내 쓰세요.');
      categories(); dialog.showModal(); render(); if (part) (form.elements.namedItem('partName') as HTMLInputElement).focus(); clock = 0; playing = true; q('[data-cp=play]').textContent = '일시정지'; last = performance.now(); raf = requestAnimationFrame(tick);
    },
    destroy() { stop(); dialog.remove(); },
  };
}

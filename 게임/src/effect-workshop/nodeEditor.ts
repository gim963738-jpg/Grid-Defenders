import './nodes.css';
import { LAYER_NAMES, LAYER_TYPES, makeLayer, type EffectRecipe, type LayerType } from './model';
import { guideColor, strokeBehavior, strokeLabel } from './drawingModel';
import { applyDirectionLink, connectGraph, createGraph, newNode, nodeHeight, nodeInputs, nodeOutput, nodeTitle, portPosition, NODE_NAMES, NODE_TYPES, NODE_WIDTH, type EffectGraph, type EffectNode, type NodeLink, type NodeParams, type NodeType } from './graphModel';
import { renderNodeCanvases, renderPreviewCanvas } from './renderer';
import { extractComponent, insertComponent, visualRecipeKey } from './componentModel';
import { createComponentLibrary } from './componentLibrary';

export const NODE_HELP = `<p>불꽃·마법진·문양을 따로 다루고, 다른 작품에 재사용하는 화면입니다. <b>부품 보관함</b>에서 현재 작품·기본 부품·다른 저장 작품을 카테고리별로 비교하세요. 노드를 선택하고 <b>이 부분 보관</b>을 누르면 앞쪽 연결도 함께 담습니다. 보관한 부품을 넣으면 최종 출력에 자동 연결되며 실행 취소 한 번으로 되돌릴 수 있습니다. <b>최종 출력으로 연결된 이미지</b>가 미리보기·전체 프레임·실제 전장·PNG에 반영됩니다.</p><ol><li>처음 열면 현재 레이어와 그림을 연결도로 불러옵니다.</li><li>노드 제목을 끌어 배치하고, 빈 바닥을 끌어 화면을 이동합니다. 확대·축소 버튼 또는 Ctrl+휠을 사용하세요.</li><li>오른쪽 출력 포트를 왼쪽 입력 포트까지 끌거나, 출력과 입력을 차례로 누릅니다. 아래 ‘연결 만들기’ 선택창으로도 연결할 수 있습니다.</li><li>보라색은 이미지, 노란색은 방향입니다. 방향선 → 효과의 이동 방향, 효과 → 색상 → 발광 → 최종 출력처럼 연결해 보세요. 출력 하나를 여러 곳으로 분기할 수도 있습니다.</li><li>합성의 A는 아래 그림, B는 위 그림입니다. 마스크는 A를 B의 투명도 모양으로 잘라냅니다.</li><li>노드를 선택해 속성을 바꾸세요. ‘노드 재생’으로 전체 결과와 선택한 부품을 동시에 확인하세요. 아래 타임라인에서 프레임을 고르면 각 노드도 해당 시점으로 갱신됩니다.</li><li>연결 목록에서 끊거나, 선택한 노드를 삭제합니다. 노드 삭제는 원본 그림·레이어를 보존합니다. 실행 취소·다시 실행으로 복구할 수 있습니다.</li></ol><p>‘노드 사용’을 끄면 레이어·그리기 합성으로 돌아갑니다. ‘현재 작업으로 다시 구성’은 기존 연결도를 현재 원본 순서로 바꾸며 실행 취소할 수 있습니다. 새로 그린 선은 ‘그린 선’ 선택창에서 추가한 뒤 연결하세요. 그림의 의미와 단계·지속 시간은 그리기 화면에서 지정합니다. 미지정·참고 선은 효과로 출력되지 않습니다.</p><p>이 기능은 2D 이미지와 방향을 조합합니다. 실제 3D 모델이나 임의의 셰이더 코드를 실행하는 기능은 포함하지 않습니다. 설정은 자동 저장되며 작업 JSON으로 백업할 수 있습니다.</p>`;

interface Hooks {
  getRecipe: () => EffectRecipe; getEntryKey: () => string; getFrame: () => number;
  commit: (edit: (next: EffectRecipe) => void, key?: string, refresh?: boolean) => void;
  notify: (message: string) => void; undo: () => void; redo: () => void;
  canUndo: () => boolean; canRedo: () => boolean; preview: () => void; drawing: () => void; help: () => void;
  togglePlay: () => void; isPlaying: () => boolean;
}
const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
const kindName = (type: string | null) => type === 'direction' ? '방향' : '이미지';
const curve = (a: [number, number], b: [number, number]) => { const bend = Math.max(64, Math.abs(b[0] - a[0]) * .45); return `M${a[0]},${a[1]} C${a[0] + bend},${a[1]} ${b[0] - bend},${b[1]} ${b[0]},${b[1]}`; };

export function createNodeEditor(host: HTMLElement, hooks: Hooks) {
  host.classList.add('ng-root');
  host.innerHTML = `<div class="ng-heading"><div><span class="ws-eyebrow">NODE WORKSPACE</span><h2>연결해서 만드는 이펙트</h2></div><button data-ng="help">사용법</button></div>
    <div class="ng-tools"><label class="ng-enabled"><input type="checkbox" data-ng-enabled> 노드 사용</label><button data-ng="rebuild">현재 작업으로 다시 구성</button><button data-ng="undo">↶ 실행 취소</button><button data-ng="redo">↷ 다시 실행</button><button class="ws-primary" data-ng="preview">결과 재생 ↗</button></div>
    <div class="ng-add"><label>효과 추가<select data-ng-new-layer><option value="">기본 효과 선택</option>${LAYER_TYPES.map(t => `<option value="${t}">${LAYER_NAMES[t]}</option>`).join('')}</select></label><label>원본 추가<select data-ng-source></select></label><label>처리 노드 추가<select data-ng-processor><option value="">종류 선택</option>${NODE_TYPES.filter(t => !['layer', 'drawing', 'sequence', 'component', 'output'].includes(t)).map(t => `<option value="${t}">${NODE_NAMES[t]}</option>`).join('')}</select></label></div>
    <div class="ng-workspace"><section class="ng-board" aria-label="이펙트 노드 연결도"><div class="ng-boardbar"><span data-ng-count></span><div><button data-ng="zoom-out" aria-label="연결도 축소">−</button><output data-ng-zoom></output><button data-ng="zoom-in" aria-label="연결도 확대">＋</button><button data-ng="fit">전체 보기</button></div></div><div class="ng-viewport" tabindex="0" aria-label="노드 작업 공간. 빈 곳을 끌어 화면 이동, 제목을 끌어 노드 이동"><svg class="ng-wires" aria-hidden="true"></svg><div class="ng-world"></div><div class="ng-boardhint" data-ng-hint></div></div><div class="ng-legend"><span><i class="ng-image-dot"></i> 이미지</span><span><i class="ng-direction-dot"></i> 방향</span><span>출력 → 입력 · Ctrl+휠 확대 · 빈 곳 드래그 이동</span></div></section><aside class="ng-properties" aria-label="선택한 노드 속성"></aside></div>
    <details class="ng-connect" open><summary>연결 만들기 · 포트를 끌지 않고 연결</summary><div class="ng-connect-fields"><label>출력 노드<select data-ng-from></select></label><span aria-hidden="true">→</span><label>입력 포트<select data-ng-to></select></label><button class="ws-primary" data-ng="connect">연결하기</button><button data-ng="cancel-link">선택 취소</button></div></details>`;
  const q = <T extends HTMLElement = HTMLElement>(s: string) => host.querySelector<T>(s)!;
  const viewport = q('.ng-viewport'), world = q('.ng-world'), wires = host.querySelector<SVGSVGElement>('.ng-wires')!, properties = q('.ng-properties');
  let selected = '', pending = '', entryKey = '', imageKey = '', images = new Map<string, HTMLCanvasElement>(), local: EffectGraph | undefined;
  let dragging: { id: number; mode: 'node' | 'pan' | 'wire'; x: number; y: number; node?: string; origin: [number, number]; moved: boolean; end?: [number, number] } | undefined;
  let viewTimer = 0, destroyed = false, refreshTimer = 0, lastFrame = -1;
  const recipe = () => hooks.getRecipe();
  const graph = () => local ?? recipe().graph;
  const update = (edit: (next: EffectRecipe) => void, key = '') => { hooks.commit(edit, key, true); refresh(); };
  const library = createComponentLibrary({ getRecipe: recipe, notify: hooks.notify, insert: part => {
    const next = structuredClone(recipe()); const id = insertComponent(next, part);
    selected = id; next.graph!.view = fittedView(next.graph!); update(r => { r.graph = next.graph; }); hooks.notify(`‘${part.name}’을 최종 출력에 연결했습니다. 실행 취소로 되돌릴 수 있어요.`);
  } });
  q('.ng-tools').insertAdjacentHTML('afterbegin', '<button class="ws-primary" data-ng="components">부품 보관함</button><button data-ng="play">노드 재생</button>');
  const screenPoint = (point: [number, number]): [number, number] => { const v = graph()!.view; return [point[0] * v.zoom + v.x, point[1] * v.zoom + v.y]; };
  const worldCenter = (): [number, number] => { const v = graph()!.view; return [clamp((viewport.clientWidth / 2 - v.x) / v.zoom - NODE_WIDTH / 2, -11500, 11500), clamp((viewport.clientHeight / 2 - v.y) / v.zoom - 80, -11500, 11500)]; };
  const title = (id: string) => { const n = graph()!.nodes.find(n => n.id === id); return n ? nodeTitle(n, recipe()) : '삭제된 노드'; };
  function paintWires(end?: [number, number]) {
    const g = graph(); if (!g) return;
    wires.setAttribute('viewBox', `0 0 ${Math.max(1, viewport.clientWidth)} ${Math.max(1, viewport.clientHeight)}`);
    wires.innerHTML = g.links.map((e, i) => {
      const a = g.nodes.find(n => n.id === e.from), b = g.nodes.find(n => n.id === e.to); if (!a || !b) return '';
      return `<path class="ng-wire ${nodeOutput(a, recipe()) === 'direction' ? 'is-direction' : ''} ${selected === a.id || selected === b.id ? 'is-active' : ''}" data-ng-edge="${i}" d="${curve(screenPoint(portPosition(a, recipe())), screenPoint(portPosition(b, recipe(), e.port)))}"/>`;
    }).join('');
    if (pending) {
      const a = g.nodes.find(n => n.id === pending);
      if (a && end) wires.innerHTML += `<path class="ng-wire is-pending ${nodeOutput(a, recipe()) === 'direction' ? 'is-direction' : ''}" d="${curve(screenPoint(portPosition(a, recipe())), end)}"/>`;
    }
    world.style.transform = `translate(${g.view.x}px,${g.view.y}px) scale(${g.view.zoom})`;
    viewport.style.backgroundPosition = `${g.view.x}px ${g.view.y}px`; viewport.style.backgroundSize = `${20 * g.view.zoom}px ${20 * g.view.zoom}px`;
    q<HTMLOutputElement>('[data-ng-zoom]').value = `${Math.round(g.view.zoom * 100)}%`;
    q('[data-ng-hint]').textContent = pending ? `${title(pending)} → 같은 색 입력 포트를 누르세요 · Esc 취소` : !g.enabled ? '노드 사용이 꺼져 있습니다 · 연결도는 보존됩니다' : '제목 드래그로 배치 · 출력 포트를 입력 포트에 연결';
  }
  function renderCards() {
    const g = graph(); if (!g) return;
    world.innerHTML = g.nodes.map(n => {
      const inputs = nodeInputs(n, recipe()), output = nodeOutput(n, recipe()), stroke = n.type === 'drawing' ? recipe().drawing?.strokes.find(s => s.id === n.sourceId) : undefined;
      const isGuide = stroke && ['direction', 'reference'].includes(strokeBehavior(stroke));
      const thumbnail = isGuide ? `<svg viewBox="0 0 100 100" aria-hidden="true"><polyline points="${stroke.points.map(p => `${p[0] * 100},${p[1] * 100}`).join(' ')}" fill="none" stroke="${guideColor(stroke)}" stroke-width="2" stroke-linecap="round"/><circle cx="${stroke.points.at(-1)![0] * 100}" cy="${stroke.points.at(-1)![1] * 100}" r="3" fill="${guideColor(stroke)}"/></svg>` : `<canvas width="128" height="128" data-ng-image="${n.id}" aria-label="${esc(nodeTitle(n, recipe()))} 미리보기"></canvas>`;
      const inputsHtml = inputs.map((p, i) => `<button class="ng-port ng-input ${p.type === 'direction' ? 'is-direction' : ''}" data-ng-input="${n.id}" data-ng-port="${p.id}" style="top:${140 + i * 48}px" aria-label="${esc(nodeTitle(n, recipe()))} · ${p.name} 입력" title="${p.name} 입력"><i></i><span>${p.name}</span></button>`).join('');
      return `<article class="ng-node ng-type-${n.type} ${selected === n.id ? 'is-selected' : ''} ${pending === n.id ? 'is-pending' : ''}" data-ng-node="${n.id}" style="left:${n.x}px;top:${n.y}px;width:${NODE_WIDTH}px;height:${nodeHeight(n, recipe())}px"><button class="ng-node-title" data-ng-drag="${n.id}" aria-label="${esc(nodeTitle(n, recipe()))} 선택·이동"><span>${esc(nodeTitle(n, recipe()))}</span><small>${NODE_NAMES[n.type]}</small></button><div class="ng-node-image">${thumbnail}<span ${isGuide ? '' : 'data-ng-frame-label'}>${isGuide ? strokeBehavior(stroke) === 'direction' ? '이동 방향' : '참고 · 출력 없음' : `${hooks.getFrame() + 1}F`}</span></div>${inputsHtml}${output ? `<button class="ng-port ng-output ${output === 'direction' ? 'is-direction' : ''}" data-ng-output="${n.id}" style="top:140px" aria-label="${esc(nodeTitle(n, recipe()))} · ${kindName(output)} 출력" title="${kindName(output)} 출력"><span>${kindName(output)}</span><i></i></button>` : '<span class="ng-final-label">✓ 게임·PNG 출력</span>'}</article>`;
    }).join('');
    paintImages(); paintWires();
  }
  function paintImages() {
    host.querySelectorAll<HTMLCanvasElement>('canvas[data-ng-image]').forEach(c => {
      const image = images.get(c.dataset.ngImage!); const ctx = c.getContext('2d')!;
      ctx.clearRect(0, 0, c.width, c.height); if (image) ctx.drawImage(image, 0, 0, c.width, c.height);
    });
    const overall = host.querySelector<HTMLCanvasElement>('[data-ng-overall]');
    if (overall) { const ctx = overall.getContext('2d')!; ctx.clearRect(0, 0, overall.width, overall.height); const r = recipe(), output = r.graph?.nodes.find(n => n.type === 'output'); const image = r.graph?.enabled && output ? images.get(output.id) : renderPreviewCanvas(r, hooks.getFrame()); if (image) ctx.drawImage(image, 0, 0, overall.width, overall.height); }
    host.querySelectorAll<HTMLElement>('[data-ng-frame-label]').forEach(e => { e.textContent = `${hooks.getFrame() + 1}F`; });
    q('[data-ng="play"]').textContent = hooks.isPlaying() ? '노드 일시정지' : '노드 재생';
  }
  function renderConnect() {
    const g = graph(); if (!g) return;
    const from = q<HTMLSelectElement>('[data-ng-from]'), to = q<HTMLSelectElement>('[data-ng-to]');
    const prevFrom = pending || from.value, prevTo = to.value;
    from.innerHTML = '<option value="">출력을 선택하세요</option>' + g.nodes.filter(n => nodeOutput(n, recipe())).map(n => `<option value="${n.id}">${esc(nodeTitle(n, recipe()))} · ${kindName(nodeOutput(n, recipe()))}</option>`).join('');
    if ([...from.options].some(o => o.value === prevFrom)) from.value = prevFrom;
    const source = g.nodes.find(n => n.id === from.value), kind = source ? nodeOutput(source, recipe()) : null;
    to.innerHTML = '<option value="">입력을 선택하세요</option>' + g.nodes.filter(n => n.id !== source?.id).flatMap(n => nodeInputs(n, recipe()).filter(p => !kind || p.type === kind).map(p => `<option value="${n.id}:${p.id}">${esc(nodeTitle(n, recipe()))} · ${p.name}</option>`)).join('');
    if ([...to.options].some(o => o.value === prevTo)) to.value = prevTo;
  }
  const param = (name: string, key: keyof NodeParams, value: number, min: number, max: number, step: number) => `<label class="ws-field"><span>${name}</span><input data-ng-param="${key}" type="number" min="${min}" max="${max}" step="${step}" value="${value}"></label>`;
  function renderProperties() {
    const g = graph(), n = g?.nodes.find(n => n.id === selected);
    if (!g || !n) { properties.innerHTML = '<div class="ng-empty"><span>⤴</span><h3>노드를 선택하세요</h3><p>각 재료의 모습과 연결을 확인하고 색상·발광·합성 방식을 바꿀 수 있어요.</p><p>이미지 출력은 보라색 입력으로, 방향 출력은 노란색 입력으로 연결하세요.</p><button data-ng="help">연결도 사용법</button></div>'; return; }
    const p = n.params, layer = recipe().layers.find(l => n.type === 'layer' && l.id === n.sourceId), stroke = recipe().drawing?.strokes.find(s => n.type === 'drawing' && s.id === n.sourceId);
    let fields = '';
    if (n.type === 'component' && n.component) fields = `<p class="ws-hint">${esc(n.component.category)} · 원본 팔레트와 연결을 포함한 독립 부품입니다. 현재 작품의 전체 재생 길이에 맞춰집니다. 색상·크기·발광 처리 노드를 추가하면 이 부품에 바로 연결됩니다.</p><label class="ws-field"><span>부품 이름</span><input data-ng-component="name" maxlength="80" value="${esc(n.component.name)}"></label><label class="ws-field"><span>카테고리</span><input data-ng-component="category" maxlength="40" value="${esc(n.component.category)}"></label>`;
    if (n.type === 'sequence' && recipe().sequence) fields = `<p class="ws-hint">빛의 분열 → 레이저 연결 → 꼬임 → 수렴·회전 → 폭발</p>${(['lightScale', 'beamScale', 'glow'] as const).map((k, i) => `<label class="ws-field"><span>${['빛 크기', '레이저 두께', '발광 강도'][i]}</span><input data-ng-sequence="${k}" type="number" min="${k === 'glow' ? .2 : .5}" max="2" step=".1" value="${recipe().sequence![k]}"></label>`).join('')}`;
    if (n.type === 'tint') fields = `<label class="ws-field"><span>변경할 색상</span><input data-ng-param="color" type="color" value="${p.color}"></label>${param('색상 적용 비율', 'amount', p.amount, 0, 1, .05)}`;
    if (n.type === 'opacity') fields = param('불투명도', 'amount', p.amount, 0, 1, .05);
    if (n.type === 'transform') fields = param('크기 배율', 'scale', p.scale, .1, 3, .05) + param('회전 · 도', 'rotation', p.rotation, -180, 180, 1) + param('가로 이동 · 이미지 비율', 'x', p.x, -.5, .5, .01) + param('세로 이동 · 이미지 비율', 'y', p.y, -.5, .5, .01);
    if (n.type === 'glow') fields = param('발광 강도', 'amount', p.amount, 0, 1, .05) + param('발광 폭 · 128px 기준', 'blur', p.blur, 0, 16, .5);
    if (n.type === 'fade') fields = param('시작 · 전체 시간 비율', 'start', p.start, 0, .99, .01) + param('종료 · 전체 시간 비율', 'end', p.end, .01, 1, .01);
    if (n.type === 'blend') fields = `<label class="ws-field"><span>B 합성 방식</span><select data-ng-param="mode">${(['normal', 'add', 'screen', 'multiply'] as const).map((m, i) => `<option value="${m}" ${p.mode === m ? 'selected' : ''}>${['일반 · 위에 덮기', '빛 더하기', '스크린 · 밝게', '곱하기 · 어둡게'][i]}</option>`).join('')}</select></label>${param('B 불투명도', 'amount', p.amount, 0, 1, .05)}`;
    if (n.type === 'mask') fields = '<p class="ws-hint">원본 A의 이미지를 B의 알파(불투명한 부분) 모양으로 잘라냅니다. 두 입력을 모두 연결해야 표시됩니다.</p>';
    if (layer) fields = `<label class="ws-field"><span>원본 이름</span><input data-ng-layer="name" maxlength="80" value="${esc(layer.name)}"></label><label class="ws-checkbox"><input data-ng-layer="enabled" type="checkbox" ${layer.enabled ? 'checked' : ''}> 원본 표시</label><label class="ws-field"><span>원본 색상</span><select data-ng-layer="color">${recipe().palette.map((c, i) => `<option value="${i}" ${layer.color === i ? 'selected' : ''}>${c}</option>`).join('')}</select></label>${(['radius', 'opacity', 'rotation'] as const).map((k, i) => `<label class="ws-field"><span>${['반경 · 이미지 비율', '불투명도', '회전 · 도'][i]}</span><input data-ng-layer="${k}" type="number" min="${[.02, 0, -180][i]}" max="${[.45, 1, 180][i]}" step="${[.01, .05, 1][i]}" value="${layer[k]}"></label>`).join('')}<p class="ws-hint">시작·종료, 세부 모양은 미리보기 화면의 레이어 속성에서 수정하세요. 방향 입력을 연결하면 중심이 그 경로를 따라 이동합니다.</p>`;
    if (stroke) fields = `<p class="ws-hint"><b>${esc(strokeLabel(stroke))}</b><br>${stroke.step}단계 · ${stroke.duration}초 · ${strokeBehavior(stroke) === 'reference' ? '참고용 · 생성되지 않음' : kindName(nodeOutput(n, recipe()))}<br>${esc(stroke.note || '의미·시간·경로는 그리기 화면에서 수정할 수 있어요.')}</p><button data-ng="drawing">그리기에서 수정 ↗</button>`;
    if (n.type === 'output') fields = '<p class="ws-hint">이 입력에 연결된 이미지를 공방의 미리보기·전체 프레임·실제 전장과 PNG 내보내기에 사용합니다.</p><button data-ng="preview">결과 재생 ↗</button>';
    const connections = g.links.filter(e => e.from === n.id || e.to === n.id);
    properties.innerHTML = `<div class="ng-prop-title"><span class="ws-eyebrow">${NODE_NAMES[n.type]}</span><h3>${esc(nodeTitle(n, recipe()))}</h3></div><div class="ng-compare"><figure><figcaption>전체 결과</figcaption><canvas width="192" height="192" data-ng-overall></canvas></figure><figure><figcaption>선택한 부분 · <span data-ng-frame-label>${hooks.getFrame() + 1}F</span></figcaption><canvas width="192" height="192" data-ng-image="${n.id}"></canvas></figure></div><button class="ws-primary ng-save-part" data-ng="save-part" ${nodeOutput(n, recipe()) === 'direction' ? 'disabled' : ''}>이 부분 보관 · 다른 작품에 쓰기</button><div class="ng-param-fields">${fields}</div><div class="ng-connection-list"><h4>연결 ${connections.length}개</h4>${connections.map(e => `<div><p>${esc(title(e.from))}<b>→ ${esc(title(e.to))} · ${nodeInputs(g.nodes.find(n => n.id === e.to)!, recipe()).find(p => p.id === e.port)?.name ?? e.port}</b></p><button data-ng-disconnect="${g.links.indexOf(e)}" aria-label="${esc(title(e.from))} 연결 끊기">끊기</button></div>`).join('') || '<p class="ws-hint">연결이 없습니다. 포트 또는 아래 선택창으로 연결하세요.</p>'}</div><div class="ng-delete">${!['output', 'layer', 'drawing', 'sequence'].includes(n.type) ? '<button data-ng="duplicate">노드 복제</button>' : ''}<button data-ng="delete" class="ws-danger" ${n.type === 'output' ? 'disabled' : ''}>노드 삭제</button></div>`;
    paintImages();
  }
  function refresh(force = false) {
    if (destroyed || host.hidden || dragging) return;
    if (entryKey !== hooks.getEntryKey()) { entryKey = hooks.getEntryKey(); selected = pending = imageKey = ''; local = undefined; clearTimeout(viewTimer); }
    const r = recipe(), g = r.graph;
    if (!g) {
      local = undefined; world.innerHTML = wires.innerHTML = ''; selected = pending = '';
      q<HTMLInputElement>('[data-ng-enabled]').checked = false;
      q('[data-ng-count]').textContent = '연결도 없음'; q('[data-ng-hint]').textContent = '‘현재 작업으로 다시 구성’을 눌러 연결도를 시작하세요.';
      properties.innerHTML = '<p class="ws-hint">연결도 생성이 취소됐습니다. 현재 레이어·그리기 결과가 사용됩니다.</p>';
      host.querySelectorAll<HTMLSelectElement>('.ng-add select,.ng-connect select').forEach(s => { s.disabled = true; });
      q<HTMLButtonElement>('[data-ng=connect]').disabled = true;
      q<HTMLButtonElement>('[data-ng="undo"]').disabled = !hooks.canUndo(); q<HTMLButtonElement>('[data-ng="redo"]').disabled = !hooks.canRedo();
      return;
    }
    host.querySelectorAll<HTMLSelectElement>('.ng-add select,.ng-connect select').forEach(s => { s.disabled = false; }); q<HTMLButtonElement>('[data-ng=connect]').disabled = false;
    local = undefined; selected = g.nodes.some(n => n.id === selected) ? selected : g.nodes.find(n => n.type === 'output')!.id;
    q<HTMLInputElement>('[data-ng-enabled]').checked = g.enabled;
    q<HTMLButtonElement>('[data-ng="undo"]').disabled = !hooks.canUndo(); q<HTMLButtonElement>('[data-ng="redo"]').disabled = !hooks.canRedo();
    q<HTMLSelectElement>('[data-ng-new-layer]').disabled = r.layers.length >= 12 || g.nodes.length >= 96;
    q<HTMLSelectElement>('[data-ng-processor]').disabled = g.nodes.length >= 96;
    const represented = new Set(g.nodes.map(n => n.sourceId));
    q<HTMLSelectElement>('[data-ng-source]').innerHTML = '<option value="">그림·레이어 선택</option>' + r.layers.filter(l => !represented.has(l.id)).map(l => `<option value="layer:${l.id}">${esc(l.name)} · 기본 효과</option>`).join('') + (r.drawing?.strokes.filter(s => !represented.has(s.id)).map(s => `<option value="drawing:${s.id}">${esc(strokeLabel(s))} · 그린 선</option>`).join('') ?? '');
    if (r.sequence && !g.nodes.some(n => n.type === 'sequence')) q<HTMLSelectElement>('[data-ng-source]').innerHTML += '<option value="sequence:">빛·레이저 연출</option>';
    q('[data-ng-count]').textContent = `${g.nodes.length} 노드 · ${g.links.length} 연결`;
    // Panning and arranging do not rerasterize thumbnails.
    const signature = visualRecipeKey(r) + hooks.getFrame();
    if (force || signature !== imageKey) { images = renderNodeCanvases(r, hooks.getFrame()); imageKey = signature; }
    lastFrame = hooks.getFrame(); renderCards(); renderConnect();
    if (!properties.contains(document.activeElement) || force) renderProperties();
  }
  function select(id: string) { selected = id; world.querySelectorAll<HTMLElement>('[data-ng-node]').forEach(el => el.classList.toggle('is-selected', el.dataset.ngNode === id)); renderProperties(); paintWires(); }
  function connect(from: string, to: string, port: string) {
    try {
      const next = connectGraph(recipe().graph!, recipe(), { from, to, port });
      update(r => { r.graph = next; applyDirectionLink(r, { from, to, port }); }); pending = ''; selected = to; refresh(true); hooks.notify('노드를 연결했습니다.');
    } catch (error) { hooks.notify((error as Error).message); }
  }
  function disconnect(index: number) { const link = recipe().graph?.links[index]; if (!link) return; update(r => { applyDirectionLink(r, link, true); r.graph!.links.splice(index, 1); }); }
  function deleteSelected() {
    const n = recipe().graph?.nodes.find(n => n.id === selected); if (!n || n.type === 'output') return;
    update(r => {
      const g = r.graph!;
      if (['tint', 'opacity', 'transform', 'glow', 'fade'].includes(n.type)) {
        const input = g.links.find(e => e.to === selected && e.port === 'image');
        if (input) g.links.filter(e => e.from === selected).forEach(e => { e.from = input.from; });
      }
      g.links.filter(e => e.from === selected || e.to === selected).forEach(e => applyDirectionLink(r, e, true));
      g.links = g.links.filter(e => e.from !== selected && e.to !== selected); g.nodes = g.nodes.filter(n => n.id !== selected);
    });
  }
  function fittedView(g: EffectGraph) {
    const minX = Math.min(...g.nodes.map(n => n.x)), minY = Math.min(...g.nodes.map(n => n.y));
    const maxX = Math.max(...g.nodes.map(n => n.x + NODE_WIDTH)), maxY = Math.max(...g.nodes.map(n => n.y + nodeHeight(n, recipe())));
    const zoom = clamp(Math.min((viewport.clientWidth - 72) / (maxX - minX), (viewport.clientHeight - 72) / (maxY - minY)), .25, 1.2);
    return { zoom, x: clamp((viewport.clientWidth - (maxX - minX) * zoom) / 2 - minX * zoom, -16000, 16000), y: clamp((viewport.clientHeight - (maxY - minY) * zoom) / 2 - minY * zoom, -16000, 16000) };
  }
  function fit() { if (recipe().graph && viewport.clientWidth > 0) update(r => { r.graph!.view = fittedView(r.graph!); }, 'graph-view'); }
  function zoomAt(factor: number, x = viewport.clientWidth / 2, y = viewport.clientHeight / 2) {
    const g = graph(); if (!g) return; local = structuredClone(g); const v = local.view, z = clamp(v.zoom * factor, .25, 2), ratio = z / v.zoom;
    v.x = clamp(x - (x - v.x) * ratio, -16000, 16000); v.y = clamp(y - (y - v.y) * ratio, -16000, 16000); v.zoom = z; paintWires();
    saveViewSoon();
  }
  function saveViewSoon() { clearTimeout(viewTimer); viewTimer = window.setTimeout(() => { if (!local || dragging) return; const v = { ...local.view }; local = undefined; update(r => { if (r.graph) r.graph.view = v; }, 'graph-view'); }, 180); }
  function add(type: NodeType, sourceId?: string, newLayer?: LayerType) {
    if (recipe().graph!.nodes.length >= 96) { hooks.notify('노드는 96개까지 사용할 수 있습니다.'); return; }
    const previous = selected, [x, y] = worldCenter(), n = newNode(type, x, y, sourceId); selected = n.id;
    update(r => {
      if (newLayer) { const layer = makeLayer(newLayer); r.layers.push(layer); n.sourceId = layer.id; }
      const g = r.graph!; g.nodes.push(n);
      if (['tint', 'opacity', 'transform', 'glow', 'fade'].includes(type)) {
        const selectedNode = g.nodes.find(v => v.id === previous);
        const source = selectedNode?.type === 'output' ? g.nodes.find(v => v.id === g.links.find(e => e.to === previous && e.port === 'image')?.from) : selectedNode;
        if (source && nodeOutput(source, r) === 'image') {
          for (const edge of g.links.filter(e => e.from === source.id && e.port !== 'direction')) edge.from = n.id;
          g.links.push({ from: source.id, to: n.id, port: 'image' });
        }
      } else if (['layer', 'drawing', 'sequence'].includes(type) && nodeOutput(n, r) === 'image' && g.nodes.length < 96) {
        const out = g.nodes.find(v => v.type === 'output')!, edge = g.links.find(e => e.to === out.id);
        if (edge) { const blend = newNode('blend', Math.min(12000, n.x + 280), n.y); g.nodes.push(blend); g.links.push({ from: edge.from, to: blend.id, port: 'a' }, { from: n.id, to: blend.id, port: 'b' }); edge.from = blend.id; }
        else g.links.push({ from: n.id, to: out.id, port: 'image' });
      }
    });
  }
  function onClick(event: MouseEvent) {
    const el = (event.target as Element).closest<HTMLElement>('button'); if (!el || el.hasAttribute('disabled')) return;
    if (el.dataset.ngOutput) { pending = el.dataset.ngOutput; renderConnect(); paintWires(); return; }
    if (el.dataset.ngInput) { if (pending) connect(pending, el.dataset.ngInput, el.dataset.ngPort!); else { select(el.dataset.ngInput); hooks.notify('먼저 오른쪽 출력 포트를 선택한 뒤 이 입력을 눌러 주세요.'); } return; }
    if (el.dataset.ngDisconnect !== undefined) { disconnect(Number(el.dataset.ngDisconnect)); return; }
    if (el.dataset.ngDrag) { select(el.dataset.ngDrag); return; }
    switch (el.dataset.ng) {
      case 'components': library.open(); break;
      case 'save-part': try { library.open(extractComponent(recipe(), selected)); } catch (error) { hooks.notify((error as Error).message); } break;
      case 'play': hooks.togglePlay(); paintImages(); break;
      case 'help': hooks.help(); break;
      case 'preview': hooks.preview(); break;
      case 'drawing': hooks.drawing(); break;
      case 'undo': hooks.undo(); break;
      case 'redo': hooks.redo(); break;
      case 'rebuild': update(r => { r.graph = createGraph(r); r.graph.view = fittedView(r.graph); }); hooks.notify('현재 원본 순서로 연결도를 구성했습니다. 실행 취소로 이전 연결도를 복원할 수 있어요.'); break;
      case 'delete': deleteSelected(); break;
      case 'duplicate': { const n = graph()?.nodes.find(n => n.id === selected); if (n && !['output', 'layer', 'drawing', 'sequence'].includes(n.type)) { const copy = { ...structuredClone(n), id: crypto.randomUUID(), x: clamp(n.x + 40, -12000, 12000), y: clamp(n.y + 50, -12000, 12000) }; if (graph()!.nodes.length >= 96) break; selected = copy.id; update(r => { r.graph!.nodes.push(copy); }); } break; }
      case 'fit': fit(); break;
      case 'zoom-in': zoomAt(1.2); break;
      case 'zoom-out': zoomAt(1 / 1.2); break;
      case 'cancel-link': pending = ''; q<HTMLSelectElement>('[data-ng-from]').value = ''; renderConnect(); paintWires(); break;
      case 'connect': { const from = q<HTMLSelectElement>('[data-ng-from]').value, [to, port] = q<HTMLSelectElement>('[data-ng-to]').value.split(':'); if (!from || !to) hooks.notify('출력 노드와 입력 포트를 선택해 주세요.'); else connect(from, to, port); break; }
    }
  }
  function onChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.dataset.ngComponent) { const key = input.dataset.ngComponent, value = input.value.trim(); if (!value) { hooks.notify('이름과 카테고리를 입력해 주세요.'); return; } update(r => { const part = r.graph?.nodes.find(n => n.id === selected)?.component; if (part) Object.assign(part, { [key]: value }); }); return; }
    if (input.dataset.ngSequence) { if (!input.checkValidity()) { input.reportValidity(); return; } const key = input.dataset.ngSequence; update(r => { if (r.sequence) Object.assign(r.sequence, { [key]: Number(input.value) }); }, `sequence-${key}`); renderProperties(); return; }
    if (input.hasAttribute('data-ng-from')) { pending = input.value; renderConnect(); paintWires(); return; }
    if (input.hasAttribute('data-ng-enabled')) { update(r => { if (!r.graph) { r.graph = createGraph(r); r.graph.view = fittedView(r.graph); } r.graph.enabled = input.checked; }); return; }
    if (input.hasAttribute('data-ng-new-layer') && input.value) { add('layer', undefined, input.value as LayerType); input.value = ''; return; }
    if (input.hasAttribute('data-ng-source') && input.value) { const [type, id] = input.value.split(':'); add(type as NodeType, id); input.value = ''; return; }
    if (input.hasAttribute('data-ng-processor') && input.value) { add(input.value as NodeType); input.value = ''; return; }
    if (input.dataset.ngParam) {
      if (!input.checkValidity()) { input.reportValidity(); return; }
      const key = input.dataset.ngParam, value = ['color', 'mode'].includes(key) ? input.value : Number(input.value);
      update(r => { const n = r.graph!.nodes.find(n => n.id === selected); if (n) Object.assign(n.params, { [key]: value }); }, `${selected}-${key}`); renderProperties();
    }
    if (input.dataset.ngLayer) {
      if (!input.checkValidity()) { input.reportValidity(); return; }
      const key = input.dataset.ngLayer, value = key === 'name' ? input.value.trim() : key === 'enabled' ? input.checked : Number(input.value);
      update(r => { const node = r.graph!.nodes.find(n => n.id === selected), layer = r.layers.find(l => l.id === node?.sourceId); if (layer) Object.assign(layer, { [key]: value }); }, `${selected}-${key}`); renderProperties();
    }
  }
  let ignoreClick = false;
  function onDown(event: PointerEvent) {
    if (event.button !== 0 || !recipe().graph || dragging) return;
    const el = event.target as Element, output = el.closest<HTMLElement>('[data-ng-output]'), title = el.closest<HTMLElement>('[data-ng-drag]');
    if (el.closest('[data-ng-input]') || el.closest('button') && !output && !title) return;
    clearTimeout(viewTimer); local = structuredClone(graph()!); const g = local;
    if (output) { pending = output.dataset.ngOutput!; dragging = { id: event.pointerId, mode: 'wire', x: event.clientX, y: event.clientY, origin: [0, 0], moved: false }; }
    else if (title) { selected = title.dataset.ngDrag!; const n = g.nodes.find(n => n.id === selected)!; select(selected); dragging = { id: event.pointerId, mode: 'node', x: event.clientX, y: event.clientY, origin: [n.x, n.y], node: n.id, moved: false }; }
    else if (!el.closest('.ng-node')) dragging = { id: event.pointerId, mode: 'pan', x: event.clientX, y: event.clientY, origin: [g.view.x, g.view.y], moved: false };
    if (dragging) { viewport.setPointerCapture(event.pointerId); viewport.classList.add('is-dragging'); }
  }
  function onMove(event: PointerEvent) {
    const d = dragging, g = local; if (!d || !g || event.pointerId !== d.id) return;
    const dx = event.clientX - d.x, dy = event.clientY - d.y; d.moved ||= Math.hypot(dx, dy) > 4;
    if (d.mode === 'node') { const n = g.nodes.find(n => n.id === d.node)!; n.x = clamp(d.origin[0] + dx / g.view.zoom, -12000, 12000); n.y = clamp(d.origin[1] + dy / g.view.zoom, -12000, 12000); const card = world.querySelector<HTMLElement>(`[data-ng-node="${n.id}"]`)!; card.style.left = `${n.x}px`; card.style.top = `${n.y}px`; }
    else if (d.mode === 'pan') { g.view.x = clamp(d.origin[0] + dx, -16000, 16000); g.view.y = clamp(d.origin[1] + dy, -16000, 16000); }
    const rect = viewport.getBoundingClientRect(); d.end = [event.clientX - rect.left, event.clientY - rect.top]; paintWires(d.mode === 'wire' ? d.end : undefined);
  }
  function finish(event: PointerEvent) {
    const d = dragging, g = local; if (!d || !g || event.pointerId !== d.id) return;
    dragging = undefined; local = undefined; viewport.classList.remove('is-dragging');
    if (viewport.hasPointerCapture(event.pointerId)) viewport.releasePointerCapture(event.pointerId);
    if (d.moved) { ignoreClick = true; window.setTimeout(() => { ignoreClick = false; }, 0); }
    if (event.type === 'pointercancel') { pending = ''; refresh(true); return; }
    if (d.mode === 'wire') { const input = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>('[data-ng-input]'); if (d.moved && input && host.contains(input)) connect(pending, input.dataset.ngInput!, input.dataset.ngPort!); else { renderConnect(); paintWires(); } }
    else if (d.moved) { update(r => { if (d.mode === 'node') { const n = r.graph!.nodes.find(n => n.id === d.node), moved = g.nodes.find(n => n.id === d.node); if (n && moved) { n.x = moved.x; n.y = moved.y; } } else r.graph!.view = g.view; }, d.mode === 'pan' ? 'graph-view' : ''); }
    else { renderConnect(); paintWires(); }
  }
  function click(event: MouseEvent) { if (ignoreClick) { event.preventDefault(); return; } onClick(event); }
  function wheel(event: WheelEvent) { if (!recipe().graph) return; event.preventDefault(); if (event.ctrlKey || event.metaKey) { const r = viewport.getBoundingClientRect(); zoomAt(Math.exp(-event.deltaY * .002), event.clientX - r.left, event.clientY - r.top); } else { local = structuredClone(graph()!); local.view.x = clamp(local.view.x - event.deltaX, -16000, 16000); local.view.y = clamp(local.view.y - event.deltaY, -16000, 16000); paintWires(); saveViewSoon(); } }
  function keydown(event: KeyboardEvent) { if ((event.target as Element).closest('input,select,textarea')) return; if (event.key === 'Escape') { pending = ''; paintWires(); renderConnect(); } else if (event.key === 'Delete' || event.key === 'Backspace') { event.preventDefault(); deleteSelected(); } if (event.key === ' ') { event.preventDefault(); hooks.togglePlay(); paintImages(); } if ([' ', 'ArrowLeft', 'ArrowRight'].includes(event.key)) event.stopPropagation(); }
  host.addEventListener('click', click); host.addEventListener('change', onChange); host.addEventListener('keydown', keydown);
  viewport.addEventListener('pointerdown', onDown); viewport.addEventListener('pointermove', onMove); viewport.addEventListener('pointerup', finish); viewport.addEventListener('pointercancel', finish); viewport.addEventListener('lostpointercapture', event => { if (dragging) finish(event); }); viewport.addEventListener('wheel', wheel, { passive: false });
  const resize = new ResizeObserver(() => { if (!host.hidden) paintWires(); }); resize.observe(viewport);
  return {
    open() { if (!recipe().graph) { hooks.commit(r => { r.graph = createGraph(r); r.graph.view = fittedView(r.graph); }, '', true); refresh(true); } else refresh(true); },
    refresh,
    frameChanged() { if (host.hidden || lastFrame === hooks.getFrame() || refreshTimer) return; refreshTimer = window.setTimeout(() => { refreshTimer = 0; if (host.hidden || destroyed || dragging) return; images = renderNodeCanvases(recipe(), hooks.getFrame()); lastFrame = hooks.getFrame(); imageKey = visualRecipeKey(recipe()) + lastFrame; paintImages(); }, 65); },
    openLibrary() { library.open(); },
    destroy() { destroyed = true; library.destroy(); clearTimeout(viewTimer); clearTimeout(refreshTimer); resize.disconnect(); host.removeEventListener('click', click); host.removeEventListener('change', onChange); host.removeEventListener('keydown', keydown); viewport.removeEventListener('pointerdown', onDown); viewport.removeEventListener('pointermove', onMove); viewport.removeEventListener('pointerup', finish); viewport.removeEventListener('pointercancel', finish); viewport.removeEventListener('wheel', wheel); },
  };
}

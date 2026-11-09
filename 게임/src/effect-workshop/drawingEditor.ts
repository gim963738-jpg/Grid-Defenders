import './drawing.css';
import type { EffectRecipe } from './model';
import { applyDrawingDescription, DRAW_BEHAVIORS, DRAW_PURPOSES, DRAW_STYLES, DRAW_TOOLS, drawingDuration, drawingSchedule, emptyDrawing, fitDrawingTiming,
  directionTarget, geometryPoints, guideColor, newStroke, reverseStroke, strokeBehavior, strokeLabel, strokePurpose,
  type DrawingPlan, type DrawPoint, type DrawPurpose, type DrawStroke, type DrawTool } from './drawingModel';

export const DRAWING_HELP = `<ol class="wd-help"><li><b>자유선·직선·곡선</b> 도구로 그림을 그립니다. 선 색은 편집용이며 용도를 강제하지 않습니다.</li><li><b>직선</b>은 시작부터 끝까지 드래그합니다. <b>곡선</b>은 먼저 양 끝을 드래그하고, 휘어질 곳을 한 번 누르거나 끌어 확정합니다. 굽힘점을 옮겨 다시 수정할 수 있습니다.</li><li>새 선은 기본적으로 <b>미지정</b>입니다. 그렸다는 이유만으로 이펙트나 이동이 생기지 않습니다. 그리기 전에 새 선의 의미를 정해 둘 수도 있습니다.</li><li>목록에서 선을 선택한 뒤 <b>이 선의 의미</b>를 정하세요. 방향·이동 경로, 완성됐을 때의 모습, 선을 따라 발생하는 연출, 참고·위치 표시, 직접 의미 정의 중 선택합니다.</li><li><b>방향</b>은 캐릭터 또는 이펙트의 이동 경로입니다. <b>완성 모습</b>은 그린 모양 전체를 표시합니다. <b>참고</b>는 설명과 함께 보관하며 미리보기에는 나타나지 않습니다.</li><li><b>직접 의미 정의</b>에서 ‘빛3 분열 위치’, ‘완성 시 검날 외곽’ 등 자유롭게 이름을 적고, 미리보기 적용 방법을 따로 정하세요. 자유로운 이름 자체를 임의의 이펙트로 바꾸지는 않습니다.</li><li>모양 선의 <b>연결할 방향선</b>을 고르면 모양의 중심이 그 방향선을 따라 움직입니다. 연결 시 단계 번호도 맞춰집니다. 같은 단계는 동시에, 다음 단계는 앞 단계 뒤에 실행됩니다.</li><li><b>선택·점 수정</b>에서 끝점·굽힘점을 끌어 수정합니다. <b>뒤로가기</b>는 직전 변경을 취소하고 <b>다시하기</b>로 복원합니다. <b>초기화</b>는 현재 그림과 설명만 지우며 뒤로가기로 복원할 수 있습니다.</li><li>전체/선별 설명을 적고 <b>설명 반영</b>으로 지원 색상·잔상·폭발 등의 설정을 적용하세요. 미지정/참고 선에는 자동으로 효과를 부여하지 않습니다. 복잡한 의미와 그림은 <b>AI에 세부 요청</b>으로 함께 전달합니다.</li><li><b>설정한 선으로 미리보기</b>에서 실제로 적용할 선만 재생합니다. 작업 JSON에는 모든 그림·의미·도구·곡선 기준점을 함께 보관합니다. PNG에는 이펙트만 담고 캐릭터 이동은 배치 JSON으로 내보냅니다.</li></ol>`;
const esc = (v: string) => v.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
interface EditorHooks {
  getRecipe: () => EffectRecipe;
  getEntryKey: () => string;
  commit: (change: (recipe: EffectRecipe) => void, key?: string) => void;
  newWork: (example: boolean) => void;
  generate: () => void; ai: () => void; help: () => void; notify: (message: string) => void;
  undo: () => void; redo: () => void; canUndo: () => boolean; canRedo: () => boolean;
}
export function createDrawingEditor(host: HTMLElement, hooks: EditorHooks) {
  let tool: DrawTool | 'select' = 'pen', brushPurpose: DrawPurpose = 'unassigned', brushColor = '#f4ce55', selected = '', together = false;
  let draft: DrawPoint[] = [], pending: DrawPoint[] | null = null, editing: DrawStroke | null = null, vertex = -1, pointer = -1, disposed = false;
  let branch: { sourceId: string; point: DrawPoint; step: number; delay: number } | null = null;
  let entryKey = hooks.getEntryKey();
  const plan = () => hooks.getRecipe().drawing ?? emptyDrawing();
  const observer = new ResizeObserver(() => paint());
  const save = (next: DrawingPlan) => hooks.commit(recipe => { recipe.drawing = next; fitDrawingTiming(recipe); });
  const field = (label: string, prop: string, value: number, min: number, max: number, step: number) => `<label class="ws-field"><span>${label}</span><input type="number" data-draw-prop="${prop}" value="${value}" min="${min}" max="${max}" step="${step}"></label>`;
  const choices = (options: Record<string, string>, value: string) => Object.entries(options).map(([id, label]) => `<option value="${id}" ${value === id ? 'selected' : ''}>${label}</option>`).join('');
  const hint = () => pending ? '곡선이 휘어질 곳을 누르거나 끌어 확정하세요' : branch ? `시작점 고정 · ${branch.step}단계 동시 출발 · 새 선의 끝을 향해 끌어 주세요` : tool === 'select' ? '선을 선택한 뒤 끝점·굽힘점을 끌어 수정하세요' : tool === 'curve' ? '1. 시작부터 끝까지 드래그  2. 휘어질 곳 지정' : tool === 'line' ? '직선의 시작부터 끝까지 드래그하세요' : '자유롭게 선을 그린 뒤 의미를 부여하세요';
  function refresh(): void {
    if (entryKey !== hooks.getEntryKey()) { entryKey = hooks.getEntryKey(); pointer = -1; draft = []; pending = null; editing = null; branch = null; selected = ''; }
    if (disposed || pointer !== -1 || pending) { paint(); return; }
    if (host.contains(document.activeElement) && document.activeElement instanceof HTMLTextAreaElement) { paint(); return; }
    const current = plan(), stroke = current.strokes.find(s => s.id === selected), schedule = drawingSchedule(current);
    if (branch && !current.strokes.some(s => s.id === branch!.sourceId)) branch = null;
    if (!stroke) selected = '';
    const behavior = stroke ? strokeBehavior(stroke) : 'reference';
    const directions = current.strokes.filter(s => strokeBehavior(s) === 'direction' && s.id !== selected);
    host.innerHTML = `
      <div class="wd-heading"><div><h2>그림과 의미로 연출 설계</h2><p>먼저 그리고, 이 선이 무엇을 뜻하는지 직접 정하세요.</p></div><button data-draw-action="help">사용법</button></div>
      <div class="wd-paint-tools" role="group" aria-label="그림판 도구">${Object.entries(DRAW_TOOLS).map(([id, label]) => `<button data-draw-tool="${id}" aria-pressed="${tool === id}">${label}</button>`).join('')}<button data-draw-tool="select" aria-pressed="${tool === 'select'}">선택·점 수정</button></div>
      <div class="wd-history"><button data-draw-action="undo" ${!hooks.canUndo() ? 'disabled' : ''}>↶ 뒤로가기</button><button data-draw-action="redo" ${!hooks.canRedo() ? 'disabled' : ''}>↷ 다시하기</button><button data-draw-action="reset">초기화</button><button data-draw-action="confirm-curve" disabled>곡선 확정</button></div>
      <div class="wd-brush"><span>편집용 선 색</span>${[['#f4ce55', '노랑'], ['#ff777b', '빨강'], ['#70baff', '파랑']].map(([color, name]) => `<button data-guide-color="${color}" style="--draw-color:${color}" aria-label="${name} 선 색" aria-pressed="${brushColor === color}"><i></i>${name}</button>`).join('')}<label><input id="draw-brush-color" type="color" value="${brushColor}" aria-label="편집용 선 색 직접 선택"></label></div>
      <div class="wd-meaning-row"><label class="ws-field"><span>새 선의 의미 · 그린 뒤에도 변경 가능</span><select id="draw-purpose">${choices(DRAW_PURPOSES, brushPurpose)}</select></label><label class="ws-field"><span>새 선 순서</span><select id="draw-together"><option value="next" ${!together ? 'selected' : ''}>다음 단계에</option><option value="same" ${together ? 'selected' : ''}>이번 단계에 함께</option></select></label></div>
      ${branch ? `<div class="wd-branch-note"><p>선 ${current.strokes.findIndex(s => s.id === branch!.sourceId) + 1}의 시작점 고정 · ${branch.step}단계에 함께 출발</p><button data-draw-action="cancel-branch">분기 취소</button></div>` : '<p class="ws-hint wd-branch-hint">같은 지점에서 나누려면 선을 선택하고 ‘같은 시작점에서 분기’를 누르세요. 새 방향선은 이펙트 이동으로 생성됩니다.</p>'}
      <div class="wd-canvas-wrap"><canvas id="drawing-canvas" tabindex="0" aria-label="직선 곡선 자유선 그리기 캔버스"></canvas><span id="drawing-status">${hint()}</span></div>
      <div class="wd-summary"><span>${current.strokes.length} / 24개 선 · 미리보기 반영 ${schedule.length}개</span><span>${drawingDuration(current).toFixed(2)}초 · 색과 의미는 별도</span></div>
      <div class="wd-work-actions"><button data-draw-action="new">새 그림 작업</button><button data-draw-action="example">방향과 완성 모습 예제</button></div>
      <div class="wd-list" aria-label="그린 선 목록">${current.strokes.map((s, i) => {
        const timing = schedule.find(e => e.stroke.id === s.id);
        return `<button data-draw-select="${s.id}" aria-pressed="${s.id === selected}" style="--draw-color:${guideColor(s)}"><i></i><b>${i + 1}</b><span>${esc(strokeLabel(s))}<small>${esc(s.note || (s.tool ? DRAW_TOOLS[s.tool] : '자유선'))}</small></span><em>${timing ? `${s.step}단계 · ${timing.start.toFixed(1)}초` : '생성 미반영'}</em></button>`;
      }).join('') || '<p class="ws-hint">직선·곡선·자유선으로 그린 뒤, 목록에서 선의 의미를 정해 주세요.</p>'}</div>
      ${stroke ? `<section class="wd-selected"><div class="wd-heading"><h2>선 ${current.strokes.indexOf(stroke) + 1}의 의미와 설명</h2><div><button data-draw-action="reverse">방향 반전</button><button data-draw-action="delete">선 삭제</button></div></div>
        <button class="wd-branch-button" data-draw-action="branch" ${current.strokes.length >= 24 ? 'disabled' : ''}>같은 시작점에서 분기</button>
        <label class="ws-field"><span>이 선의 의미</span><select data-draw-prop="purpose">${choices(DRAW_PURPOSES, strokePurpose(stroke))}</select></label>
        <label class="ws-field"><span>직접 붙이는 이름·의미</span><input type="text" data-draw-prop="meaning" value="${esc(stroke.meaning ?? '')}" maxlength="160" placeholder="예: 빛3의 이동 방향 / 완성된 검날 외곽 / 지면 기준"></label>
        ${strokePurpose(stroke) === 'custom' ? `<label class="ws-field"><span>직접 정의한 선의 미리보기 적용 방법</span><select data-draw-prop="behavior">${choices(DRAW_BEHAVIORS, stroke.behavior ?? 'reference')}</select></label>` : ''}
        ${behavior === 'reference' ? '<p class="ws-hint">이 선은 그림과 설명으로 보관합니다. 이동하거나 이펙트로 표시하려면 적용할 의미를 먼저 지정하세요.</p>' : `<div class="ws-field-row">${field('실행 단계 · 같으면 동시', 'step', stroke.step, 1, 24, 1)}${field('재생 시간 · 초', 'duration', stroke.duration, .1, 5, .1)}</div><div class="ws-field-row">${field('시작 지연 · 초', 'delay', stroke.delay, 0, 5, .1)}${field('끝난 뒤 잔상 · 초', 'linger', stroke.linger, 0, 5, .1)}</div>`}
        ${behavior === 'direction' ? `<label class="ws-field"><span>무엇의 이동 방향인가요?</span><select data-draw-prop="directionTarget"><option value="effect" ${directionTarget(stroke) === 'effect' ? 'selected' : ''}>연결할 모양·이펙트의 이동</option><option value="actor" ${directionTarget(stroke) === 'actor' ? 'selected' : ''}>캐릭터 이동</option></select></label><p class="ws-hint">이펙트 방향선은 같은 지점·같은 단계에서 여러 갈래로 출발할 수 있습니다. 이 선 자체는 빛으로 표시되지 않으며 모양 선을 연결하면 해당 경로로 움직입니다.</p>` : ''}
        ${['appearance', 'path'].includes(behavior) ? `<div class="ws-field-row"><label class="ws-field"><span>실제 구현될 효과색</span><input type="color" data-draw-prop="color" value="${stroke.color}"></label>${field('구현될 선의 두께', 'width', stroke.width, .005, .06, .005)}</div>
        <label class="ws-field"><span>${behavior === 'appearance' ? '완성 모양 표시 방법' : '경로를 사용하는 연출'}</span><select data-draw-prop="style">${choices(behavior === 'appearance' ? { trail: '그린 모양의 윤곽 그대로', field: '그린 외곽을 닫아 채우기' } : DRAW_STYLES, stroke.style)}</select></label>
        <label class="ws-field"><span>연결할 방향선 · 모양 중심이 그 경로를 따라 이동</span><select data-draw-prop="directionId"><option value="">없음 · 그린 위치에 표시</option>${directions.map(s => `<option value="${s.id}" ${stroke.directionId === s.id ? 'selected' : ''}>선 ${current.strokes.indexOf(s) + 1} · ${esc(strokeLabel(s))}</option>`).join('')}</select></label>
        <label class="ws-checkbox"><input type="checkbox" data-draw-prop="followActor" ${stroke.followActor ? 'checked' : ''} ${stroke.directionId ? 'disabled' : ''}> 캐릭터 이동 따라가기 · 중심 기준</label><label class="ws-checkbox"><input type="checkbox" data-draw-prop="fold" ${stroke.fold ? 'checked' : ''}> 선택한 모양이 꼬이며 접히기</label>` : ''}
        <label class="ws-field"><span>이 선에 대한 상세 설명</span><textarea data-draw-prop="note" maxlength="600" rows="3" placeholder="예: 이 선은 구현됐을 때 보이는 칼날 모양. 방향선 1을 따라 녹색으로 이동.">${esc(stroke.note)}</textarea></label>
      </section>` : ''}
      <label class="ws-field wd-prompt"><span>그림 전체에 대한 설명</span><textarea id="drawing-prompt" maxlength="3000" rows="3" placeholder="각 선이 방향인지, 완성 모양인지, 참고 표시인지 설명해 주세요.">${esc(current.prompt)}</textarea></label>
      <div class="wd-settings"><label class="ws-checkbox"><input id="drawing-enabled" type="checkbox" ${current.enabled ? 'checked' : ''}> 지정한 의미로 미리보기</label><label class="ws-checkbox"><input id="drawing-base" type="checkbox" ${current.showBase ? 'checked' : ''}> 기존 레이어 함께 합성</label></div>
      <p class="ws-hint">미지정·참고 선은 그림과 설명으로 남습니다. 직접 정의한 의미는 선택한 적용 방법만 미리보기에 반영합니다.</p>
      <div class="wd-generate"><button data-draw-action="describe">설명 반영</button><button class="ws-primary" data-draw-action="generate">설정한 선으로 미리보기</button><button data-draw-action="ai">AI에 세부 요청</button></div>`;
    observer.disconnect(); observer.observe(host.querySelector('canvas')!);
    const c = host.querySelector('canvas')!;
    c.addEventListener('pointerdown', down); c.addEventListener('pointermove', move); c.addEventListener('pointerup', up); c.addEventListener('pointercancel', event => { cancel(event); refresh(); });
    paint();
  }
  function makeStroke(points: DrawPoint[], kind: DrawTool): DrawStroke {
    const s = newStroke('effect', points, nextStep(), hooks.getRecipe().palette[1]); s.purpose = brushPurpose; s.guideColor = brushColor; s.tool = kind;
    if (branch) s.delay = branch.delay;
    if (branch && brushPurpose === 'custom') { const source = plan().strokes.find(line => line.id === branch!.sourceId); if (source) s.behavior = source.behavior; }
    if (strokeBehavior(s) === 'direction') s.directionTarget = 'effect';
    return s;
  }
  function nextStep(): number {
    const selectedStep = plan().strokes.find(s => s.id === selected)?.step;
    return Math.min(24, branch?.step ?? (together && selectedStep !== undefined ? selectedStep : Math.max(0, ...plan().strokes.map(s => s.step)) + (together && plan().strokes.length ? 0 : 1)));
  }
  function paint(): void {
    const c = host.querySelector<HTMLCanvasElement>('canvas'); if (!c || !c.clientWidth) return;
    const w = c.clientWidth, h = c.clientHeight, ratio = Math.min(devicePixelRatio || 1, 3);
    if (c.width !== Math.round(w * ratio) || c.height !== Math.round(h * ratio)) { c.width = Math.round(w * ratio); c.height = Math.round(h * ratio); }
    const ctx = c.getContext('2d')!; ctx.setTransform(ratio, 0, 0, ratio, 0, 0); ctx.clearRect(0, 0, w, h); ctx.strokeStyle = '#8e92ac25'; ctx.lineWidth = 1;
    for (let i = 1; i < 10; i++) { ctx.beginPath(); ctx.moveTo(i / 10 * w, 0); ctx.lineTo(i / 10 * w, h); ctx.moveTo(0, i / 10 * h); ctx.lineTo(w, i / 10 * h); ctx.stroke(); }
    ctx.setLineDash([4, 5]); ctx.strokeStyle = '#d0b8ef55'; ctx.strokeRect(.08 * w, .08 * h, .84 * w, .84 * h); ctx.setLineDash([]);
    const strokes = plan().strokes.map(s => editing?.id === s.id ? editing : s);
    if (pending) { const preview = makeStroke(geometryPoints('curve', pending), 'curve'); preview.anchors = pending; strokes.push(preview); }
    else if (draft.length) strokes.push(makeStroke(draft, tool === 'select' ? 'pen' : tool));
    for (const s of strokes) {
      const behavior = strokeBehavior(s); ctx.strokeStyle = guideColor(s); ctx.fillStyle = ctx.strokeStyle; ctx.lineWidth = s.id === selected ? 3 : 2;
      ctx.lineJoin = ctx.lineCap = 'round'; ctx.setLineDash(behavior === 'reference' ? [5, 4] : []);
      ctx.beginPath(); s.points.forEach((p, i) => { if (!i) ctx.moveTo(p[0] * w, p[1] * h); else ctx.lineTo(p[0] * w, p[1] * h); }); ctx.stroke(); ctx.setLineDash([]);
      const first = s.points[0], last = s.points[s.points.length - 1];
      if (behavior === 'direction' || behavior === 'path') {
        const previous = [...s.points].reverse().find(p => Math.hypot(p[0] - last[0], p[1] - last[1]) > .005) ?? first;
        ctx.save(); ctx.translate(last[0] * w, last[1] * h); ctx.rotate(Math.atan2((last[1] - previous[1]) * h, (last[0] - previous[0]) * w));
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-10, -5); ctx.lineTo(-10, 5); ctx.closePath(); ctx.fill(); ctx.restore();
      }
      ctx.beginPath(); ctx.arc(first[0] * w, first[1] * h, 11, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#18202a'; ctx.textAlign = 'center'; ctx.font = '11px system-ui';
      ctx.fillText(String(plan().strokes.findIndex(line => line.id === s.id) + 1 || '+'), first[0] * w, first[1] * h + 4); ctx.textAlign = 'left';
      if (s.id === selected && tool === 'select') drawHandles(ctx, s.anchors ?? s.points, w, h, s.tool === 'curve');
    }
    const origins = new Map<string, { point: DrawPoint; count: number }>();
    for (const s of strokes) { const key = s.points[0].join(','); const group = origins.get(key); if (group) group.count++; else origins.set(key, { point: s.points[0], count: 1 }); }
    for (const { point: p, count } of origins.values()) if (count > 1) {
      const x = p[0] * w, y = p[1] * h; ctx.strokeStyle = '#f0e5ff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, 15, 0, Math.PI * 2); ctx.stroke();
      ctx.font = '12px system-ui'; ctx.fillStyle = '#161923'; ctx.fillRect(x + 18, y - 27, 57, 19); ctx.fillStyle = '#f0e5ff'; ctx.fillText(`${count}개 분기`, x + 21, y - 13);
    }
    if (pending) drawHandles(ctx, pending, w, h, true);
    const status = host.querySelector('#drawing-status'); if (status) status.textContent = hint();
    const confirm = host.querySelector<HTMLButtonElement>('[data-draw-action="confirm-curve"]'); if (confirm) confirm.disabled = !pending;
    const undoButton = host.querySelector<HTMLButtonElement>('[data-draw-action="undo"]'); if (undoButton) undoButton.disabled = !pending && !draft.length && !hooks.canUndo();
  }
  function drawHandles(ctx: CanvasRenderingContext2D, points: DrawPoint[], w: number, h: number, curve: boolean): void {
    if (curve) { ctx.strokeStyle = '#e6d5ff66'; ctx.lineWidth = 1; ctx.setLineDash([3, 4]); ctx.beginPath(); points.forEach((p, i) => { if (!i) ctx.moveTo(p[0] * w, p[1] * h); else ctx.lineTo(p[0] * w, p[1] * h); }); ctx.stroke(); ctx.setLineDash([]); }
    points.forEach((p, i) => { ctx.fillStyle = curve && i === 1 ? '#f1c5ff' : '#ede5ff'; ctx.beginPath(); ctx.arc(p[0] * w, p[1] * h, curve ? 6 : 4, 0, Math.PI * 2); ctx.fill(); });
  }
  function point(event: PointerEvent): DrawPoint {
    const r = (event.currentTarget as HTMLCanvasElement).getBoundingClientRect();
    return [Math.round(Math.max(.02, Math.min(.98, (event.clientX - r.left) / r.width)) * 10000) / 10000, Math.round(Math.max(.02, Math.min(.98, (event.clientY - r.top) / r.height)) * 10000) / 10000];
  }
  function down(event: PointerEvent): void {
    if (pointer !== -1 || !event.isPrimary || event.button !== 0) return; pointer = event.pointerId;
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    const p = point(event), c = event.currentTarget as HTMLCanvasElement;
    if (pending) pending[1] = p;
    else if (tool === 'select') {
      let nearest = 24, found: DrawStroke | undefined, index = -1;
      const candidates = [...plan().strokes.filter(s => s.id === selected), ...plan().strokes.filter(s => s.id !== selected)];
      for (const s of candidates) (s.anchors ?? s.points).forEach((q, i) => { const d = Math.hypot((p[0] - q[0]) * c.clientWidth, (p[1] - q[1]) * c.clientHeight); if (d < nearest) { nearest = d; found = s; index = i; } });
      if (!found) { pointer = -1; return; } selected = found.id; editing = structuredClone(found); vertex = index;
    } else {
      if (plan().strokes.length >= 24) { pointer = -1; hooks.notify('선은 24개까지 보관할 수 있습니다.'); return; }
      let start: DrawPoint = branch ? [...branch.point] : p;
      if (!branch && together && !event.altKey) {
        let nearest = 12;
        for (const s of plan().strokes.filter(s => s.step === nextStep())) {
          const q = s.points[0], d = Math.hypot((p[0] - q[0]) * c.clientWidth, (p[1] - q[1]) * c.clientHeight);
          if (d < nearest) { nearest = d; start = [...q]; }
        }
      }
      draft = [start];
    }
    event.preventDefault(); c.setPointerCapture(pointer); paint();
  }
  function move(event: PointerEvent): void {
    if (pending && pointer === -1 && event.pointerType !== 'touch') { pending[1] = point(event); paint(); return; }
    if (pointer !== event.pointerId) return; event.preventDefault(); const p = point(event);
    if (pending) pending[1] = p;
    else if (editing) { if (editing.anchors && editing.tool && editing.tool !== 'pen') { editing.anchors[vertex] = p; editing.points = geometryPoints(editing.tool, editing.anchors); } else editing.points[vertex] = p; }
    else if (draft.length) {
      if (tool === 'line' || tool === 'curve') draft = [draft[0], p];
      else if (Math.hypot(p[0] - draft[draft.length - 1][0], p[1] - draft[draft.length - 1][1]) > .003) { if (draft.length >= 255) draft = draft.filter((_, i) => i % 2 === 0 || i === draft.length - 1); draft.push(p); }
    }
    paint();
  }
  function commitCurve(): void {
    if (!pending) return; const anchors = pending; pending = null;
    const s = makeStroke(geometryPoints('curve', anchors), 'curve'); s.anchors = anchors;
    const next = structuredClone(plan()); next.strokes.push(s); selected = s.id; branch = null; save(next); refresh();
  }
  function up(event: PointerEvent): void {
    if (pointer !== event.pointerId) return; event.preventDefault(); pointer = -1;
    if (pending) { pending[1] = point(event); commitCurve(); return; }
    const next = structuredClone(plan());
    if (editing) { next.strokes = next.strokes.map(s => s.id === editing!.id ? editing! : s); editing = null; }
    else if (draft.length) {
      const last = point(event);
      if (tool === 'curve') { const first = draft[0]; draft = []; pending = [first, [(first[0] + last[0]) / 2, (first[1] + last[1]) / 2], last]; paint(); return; }
      const points: DrawPoint[] = tool === 'line' ? [draft[0], last] : draft.length === 1 || Math.hypot(last[0] - draft[draft.length - 1][0], last[1] - draft[draft.length - 1][1]) > .001 ? [...draft, last] : draft;
      const s = makeStroke(points, tool === 'line' ? 'line' : 'pen'); if (s.tool === 'line') s.anchors = points.map(p => [...p]);
      next.strokes.push(s); selected = s.id; draft = []; branch = null;
    }
    save(next); refresh();
  }
  function cancel(event?: PointerEvent): void { if (event && pointer !== event.pointerId) return; pointer = -1; draft = []; pending = null; editing = null; branch = null; paint(); }
  host.addEventListener('click', event => {
    const b = (event.target as Element).closest<HTMLButtonElement>('button'); if (!b) return;
    if (b.dataset.drawTool) { cancel(); tool = b.dataset.drawTool as typeof tool; refresh(); return; }
    if (b.dataset.guideColor) { brushColor = b.dataset.guideColor; refresh(); return; }
    if (b.dataset.drawSelect) { cancel(); selected = b.dataset.drawSelect; tool = 'select'; refresh(); return; }
    const next = structuredClone(plan()), s = next.strokes.find(line => line.id === selected);
    switch (b.dataset.drawAction) {
      case 'help': hooks.help(); break;
      case 'undo': if (pending || draft.length || branch) { cancel(); refresh(); } else { hooks.undo(); refresh(); } break;
      case 'redo': cancel(); hooks.redo(); refresh(); break;
      case 'reset': cancel(); next.strokes = []; next.prompt = ''; selected = ''; tool = 'pen'; brushPurpose = 'unassigned'; brushColor = '#f4ce55'; together = false; save(next); refresh(); hooks.notify('현재 그림과 설명을 초기화했습니다. 뒤로가기로 복원할 수 있습니다.'); break;
      case 'confirm-curve': commitCurve(); break;
      case 'branch': if (s) {
        cancel(); branch = { sourceId: s.id, point: [...s.points[0]], step: s.step, delay: s.delay }; together = true; brushPurpose = strokePurpose(s); tool = s.tool ?? 'pen';
        refresh(); host.querySelector('canvas')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      } break;
      case 'cancel-branch': cancel(); refresh(); break;
      case 'new': cancel(); selected = ''; hooks.newWork(false); refresh(); break;
      case 'example': cancel(); selected = ''; hooks.newWork(true); refresh(); break;
      case 'reverse': if (s) { reverseStroke(s); save(next); refresh(); } break;
      case 'delete': if (s) { next.strokes = next.strokes.filter(line => line.id !== s.id); next.strokes.forEach(line => { if (line.directionId === s.id) delete line.directionId; }); selected = ''; save(next); refresh(); } break;
      case 'describe': { const result = applyDrawingDescription(next); save(result.plan); refresh(); hooks.notify(`${result.changed}개 적용 대상에 지원 설명을 반영했습니다. 미지정·참고 선은 그대로 보관됩니다.`); break; }
      case 'generate': if (!drawingSchedule(next).length) hooks.notify('목록에서 선을 고르고 방향·완성 모습 등 미리보기에 적용할 의미를 먼저 정해 주세요.'); else { next.enabled = true; save(next); hooks.generate(); } break;
      case 'ai': hooks.ai(); break;
    }
  });
  host.addEventListener('change', event => {
    const input = event.target as HTMLInputElement;
    if (input.id === 'draw-together') { together = input.value === 'same'; branch = null; refresh(); return; }
    if (input.id === 'draw-purpose') { brushPurpose = input.value as DrawPurpose; return; }
    if (input.id === 'draw-brush-color') { brushColor = input.value; refresh(); return; }
    const next = structuredClone(plan());
    if (input.id === 'drawing-prompt') next.prompt = input.value;
    else if (input.id === 'drawing-base') next.showBase = input.checked;
    else if (input.id === 'drawing-enabled') next.enabled = input.checked;
    else if (input.dataset.drawProp) {
      if (!input.checkValidity()) { input.reportValidity(); return; }
      const s = next.strokes.find(line => line.id === selected); if (!s) return;
      const prop = input.dataset.drawProp, strings = ['color', 'style', 'note', 'purpose', 'meaning', 'behavior', 'directionTarget', 'directionId'];
      Object.assign(s, { [prop]: input.type === 'checkbox' ? input.checked : strings.includes(prop) ? input.value : Number(input.value) });
      if (!s.directionId) delete s.directionId;
      if (prop === 'purpose' || prop === 'behavior') {
        const behavior = strokeBehavior(s);
        if (behavior === 'direction' && s.directionTarget === undefined) s.directionTarget = directionTarget(s);
        if (behavior === 'appearance' && !['trail', 'field'].includes(s.style)) s.style = 'trail';
        if (!['appearance', 'path'].includes(behavior)) { delete s.directionId; s.followActor = false; }
        if (behavior !== 'direction') next.strokes.forEach(line => { if (line.directionId === s.id) delete line.directionId; });
      }
      if (prop === 'directionId' && s.directionId) { const direction = next.strokes.find(line => line.id === s.directionId)!; s.followActor = false; s.step = direction.step; }
    } else return;
    save(next); refresh();
  });
  return { refresh, paint, cancel, destroy: () => { disposed = true; observer.disconnect(); } };
}

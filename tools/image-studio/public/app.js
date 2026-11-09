const $ = (selector) => document.querySelector(selector);
const MAX_REFERENCES = 4;
const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;
const state = { csrfToken: '', keyConfigured: false, presets: [], references: [], selected: [], jobs: [], activeJob: null, submitting: false, uncertain: false, checking: false, pendingUploads: 0, pollTimer: null };

function message(text = '') {
  $('#form-error').textContent = text;
  $('#form-error').hidden = !text;
}

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(path, {
      cache: 'no-store',
      ...options,
      headers: { ...(options.body ? { 'Content-Type': 'application/json', 'X-Studio-Token': state.csrfToken } : {}), ...options.headers },
    });
  } catch {
    throw new Error('스튜디오에 연결하지 못했습니다. 서버 실행 상태를 확인해 주세요.');
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error?.message || `요청을 처리하지 못했습니다. (${response.status})`);
    error.code = data.error?.code;
    error.status = response.status;
    throw error;
  }
  return data;
}

function updateControls() {
  const busy = state.submitting || Boolean(state.activeJob) || state.uncertain || state.pendingUploads > 0;
  $('#generate').disabled = !state.keyConfigured || !state.csrfToken || !state.presets.length || busy;
  $('#generate').textContent = state.pendingUploads > 0 ? '참고 이미지 읽는 중' : busy ? '작업 상태 확인 중' : '이미지 생성';
  $('#check-api').disabled = !state.keyConfigured || state.checking || busy;
  $('#job-progress').hidden = !busy;
  if (state.activeJob) {
    $('#job-progress-title').textContent = `${state.activeJob.label || '이미지'} · 생성 중`;
    $('#job-progress-message').textContent = '결과를 기다리고 있습니다. 생성에는 몇 분이 걸릴 수 있습니다.';
  } else if (state.uncertain) {
    $('#job-progress-title').textContent = '요청 결과 확인 필요';
    $('#job-progress-message').textContent = '중복 생성을 막기 위해 새 요청을 잠시 멈췄습니다. 설정 새로고침으로 진행 상태를 확인하세요.';
  } else if (state.submitting) {
    $('#job-progress-title').textContent = '요청 전송 중';
    $('#job-progress-message').textContent = '참고 이미지와 작업 지시를 전달하고 있습니다.';
  } else if (state.pendingUploads > 0) {
    $('#job-progress-title').textContent = '참고 이미지 읽는 중';
    $('#job-progress-message').textContent = `${state.pendingUploads}개 파일을 준비하고 있습니다. 완료 후 이미지를 생성할 수 있습니다.`;
  }
}

function renderPresets() {
  const previous = document.querySelector('input[name="preset"]:checked')?.value;
  const container = $('#presets');
  container.replaceChildren();
  for (const [index, preset] of state.presets.entries()) {
    const label = document.createElement('label');
    label.className = 'preset';
    const input = document.createElement('input');
    input.type = 'radio'; input.name = 'preset'; input.value = preset.id;
    input.checked = previous ? previous === preset.id : index === 0;
    const title = document.createElement('strong');
    title.textContent = preset.model.includes('2.6') ? 'Sunburst 2.6' : 'Sunburst 2.5';
    const quality = document.createElement('small');
    quality.textContent = preset.quality === 'xhigh' ? 'XHIGH · 초고화질' : 'HIGH · 고화질';
    label.append(input, title, quality); container.append(label);
  }
  container.setAttribute('aria-busy', 'false');
}

async function refreshStatus({ clearNotice = false } = {}) {
  const status = await request('/api/status');
  state.csrfToken = status.csrfToken;
  state.keyConfigured = Boolean(status.keyConfigured);
  state.presets = status.presets || [];
  state.activeJob = status.activeJob || null;
  state.uncertain = false;
  const badge = $('#connection-badge');
  badge.className = `badge ${state.keyConfigured ? 'ready' : 'missing'}`;
  badge.textContent = state.keyConfigured ? '키 등록됨' : '키 미등록';
  $('#connection-message').textContent = state.keyConfigured
    ? 'API 키가 등록되어 있습니다. 모델 접근 확인으로 사용 권한을 확인할 수 있습니다.'
    : 'API 키 등록 후 세 가지 Sunburst 설정으로 이미지를 만들 수 있습니다.';
  $('#key-help').hidden = state.keyConfigured;
  if (!state.keyConfigured) $('#key-help').open = true;
  if (clearNotice) message();
  renderPresets(); updateControls();
  if (state.activeJob) { upsertJob(state.activeJob); schedulePoll(); }
  return status;
}

function removeSelected(index) {
  const [removed] = state.selected.splice(index, 1);
  if (removed?.kind === 'upload') URL.revokeObjectURL(removed.url);
  renderSelected(); renderReferences();
}

function renderSelected() {
  // The API sends project references first, followed by uploaded files.
  // Show the identical sequence to make numbered prompt references unambiguous.
  state.selected.sort((left, right) => Number(left.kind === 'upload') - Number(right.kind === 'upload'));
  const container = $('#selected-references');
  container.replaceChildren();
  $('#reference-count').textContent = `${state.selected.length} / ${MAX_REFERENCES}`;
  state.selected.forEach((item, index) => {
    const card = document.createElement('div'); card.className = 'selected-reference';
    const image = document.createElement('img'); image.src = item.url; image.alt = item.name;
    const caption = document.createElement('p'); caption.textContent = `${index + 1}. ${item.name}`;
    const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'remove-reference'; remove.textContent = '×'; remove.setAttribute('aria-label', `${item.name} 선택 해제`);
    remove.addEventListener('click', () => removeSelected(index));
    card.append(image, caption, remove); container.append(card);
  });
}

function renderReferences() {
  const query = $('#reference-search').value.trim().toLocaleLowerCase();
  const items = state.references.filter(item => `${item.name} ${item.id}`.toLocaleLowerCase().includes(query));
  $('#reference-status').textContent = items.length ? `${items.length}개 이미지 · 클릭해서 선택` : '해당하는 이미지가 없습니다.';
  const grid = $('#reference-grid'); grid.replaceChildren();
  for (const item of items) {
    const card = document.createElement('button'); card.type = 'button'; card.className = 'reference-card'; card.title = item.id;
    const selected = state.selected.some(selectedItem => selectedItem.kind === 'project' && selectedItem.id === item.id);
    card.setAttribute('aria-pressed', String(selected));
    const image = document.createElement('img'); image.src = item.url; image.alt = ''; image.loading = 'lazy';
    const title = document.createElement('span'); title.textContent = item.name;
    card.append(image, title);
    card.addEventListener('click', () => {
      const index = state.selected.findIndex(selectedItem => selectedItem.kind === 'project' && selectedItem.id === item.id);
      if (index !== -1) { removeSelected(index); return; }
      if (state.selected.length + state.pendingUploads >= MAX_REFERENCES) { message('참고 이미지는 읽는 중인 파일을 포함해 최대 4개까지 선택할 수 있습니다.'); return; }
      state.selected.push({ ...item, kind: 'project' }); message(); renderSelected(); renderReferences();
    });
    grid.append(card);
  }
}

function uploadToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1]);
    reader.onerror = () => reject(new Error(`${file.name} 파일을 읽지 못했습니다.`));
    reader.onabort = () => reject(new Error(`${file.name} 파일 읽기가 취소되었습니다.`));
    reader.readAsDataURL(file);
  });
}

$('#uploads').addEventListener('change', async (event) => {
  const files = Array.from(event.target.files || []); event.target.value = '';
  if (!files.length) return;
  if (state.selected.length + state.pendingUploads + files.length > MAX_REFERENCES) { message('참고 이미지는 읽는 중인 파일을 포함해 최대 4개입니다.'); return; }
  for (const file of files) {
    if (!/\.(png|jpe?g|webp)$/i.test(file.name) || (file.type && !['image/png', 'image/jpeg', 'image/webp'].includes(file.type))) { message('PNG, JPG, WebP 파일을 선택해 주세요.'); return; }
    if (file.size > MAX_UPLOAD_BYTES || file.size === 0) { message(`${file.name}: 0바이트보다 크고 12MB 이하인 파일을 선택해 주세요.`); return; }
  }
  state.pendingUploads += files.length;
  updateControls();
  try {
    const reads = await Promise.allSettled(files.map(async file => ({ kind: 'upload', name: file.name, data: await uploadToBase64(file), file })));
    const failed = reads.find(read => read.status === 'rejected');
    if (failed) throw failed.reason;
    const uploads = reads.map(read => read.value);
    if (state.selected.length + uploads.length > MAX_REFERENCES) { message('참고 이미지는 최대 4개입니다. 기존 선택을 줄여주세요.'); return; }
    state.selected.push(...uploads.map(item => ({ ...item, url: URL.createObjectURL(item.file) })));
    message(); renderSelected();
  } catch (error) { message(error.message); }
  finally { state.pendingUploads -= files.length; updateControls(); }
});
$('#reference-search').addEventListener('input', renderReferences);

function formatDate(date) {
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function upsertJob(job) {
  const index = state.jobs.findIndex(item => item.id === job.id);
  if (index < 0) state.jobs.unshift(job); else state.jobs[index] = job;
  renderJobs();
}

function renderJobs() {
  const container = $('#results'); container.replaceChildren();
  $('#results-empty').hidden = state.jobs.length > 0;
  for (const job of [...state.jobs].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))) {
    const card = document.createElement('article'); card.className = `result-card ${job.status === 'failed' ? 'failed' : ''}`;
    if (job.imageUrl) {
      const preview = document.createElement('button'); preview.type = 'button'; preview.className = 'result-preview'; preview.setAttribute('aria-label', `${job.label || '생성 이미지'} 확대`);
      const image = document.createElement('img'); image.src = job.imageUrl; image.alt = job.label || '생성 이미지'; image.loading = 'lazy'; preview.append(image);
      preview.addEventListener('click', () => { $('#large-image').src = job.imageUrl; $('#large-image').alt = image.alt; $('#large-caption').textContent = `${job.label || '생성 이미지'} · ${formatDate(job.createdAt)}`; $('#image-viewer').showModal(); });
      card.append(preview);
    } else if (job.status === 'running') { const pending = document.createElement('p'); pending.className = 'result-waiting'; pending.textContent = '이미지를 생성하고 있습니다…'; card.append(pending); }
    const body = document.createElement('div'); body.className = 'result-body';
    const title = document.createElement('h3'); title.textContent = job.label || `${job.model} · ${job.quality}`;
    const meta = document.createElement('p'); meta.className = 'result-meta'; meta.textContent = `${formatDate(job.createdAt)} · ${job.status === 'succeeded' ? '저장 완료' : job.status === 'failed' ? '생성 실패' : '생성 중'}`;
    body.append(title, meta);
    if (job.error) { const error = document.createElement('p'); error.className = 'result-error'; error.textContent = job.error.message || '생성하지 못했습니다.'; body.append(error); if (job.error.code || job.error.requestId) { const detail = document.createElement('p'); detail.className = 'result-meta'; detail.textContent = [job.error.code, job.error.requestId].filter(Boolean).join(' · '); body.append(detail); } }
    if (job.outputPath) { const path = document.createElement('p'); path.className = 'result-path'; path.textContent = job.outputPath; body.append(path); }
    const links = document.createElement('div'); links.className = 'result-links';
    if (job.imageUrl) { const link = document.createElement('a'); link.href = job.imageUrl; link.download = ''; link.textContent = 'PNG 저장'; links.append(link); }
    if (job.metadataUrl) { const link = document.createElement('a'); link.href = job.metadataUrl; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.textContent = '작업 설정'; links.append(link); }
    if (links.childElementCount) body.append(links);
    card.append(body); container.append(card);
  }
}

function schedulePoll(delay = 2000) {
  clearTimeout(state.pollTimer);
  if (!state.activeJob) return;
  state.pollTimer = setTimeout(pollJob, delay);
}

async function pollJob() {
  if (!state.activeJob) return;
  try {
    const { job } = await request(`/api/jobs/${encodeURIComponent(state.activeJob.id)}`);
    upsertJob(job);
    if (job.status === 'running') { state.activeJob = job; schedulePoll(); }
    else { state.activeJob = null; message(job.status === 'failed' ? job.error?.message || '이미지 생성에 실패했습니다.' : ''); }
    updateControls();
  } catch (error) {
    $('#job-progress-message').textContent = `${error.message} 진행 상태만 다시 확인하며 생성 요청은 반복하지 않습니다.`;
    schedulePoll(5000);
  }
}

$('#generation-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  if (state.submitting || state.activeJob || state.uncertain || state.pendingUploads > 0 || !state.keyConfigured) return;
  const prompt = $('#prompt').value.trim();
  const preset = document.querySelector('input[name="preset"]:checked')?.value;
  if (!prompt || !preset) { message('모델을 선택하고 작업 지시를 입력해 주세요.'); return; }
  state.submitting = true; message(); updateControls();
  const payload = { requestId: crypto.randomUUID(), preset, prompt, size: $('#size').value, background: $('#background').value, references: state.selected.filter(item => item.kind === 'project').map(item => item.id), uploads: state.selected.filter(item => item.kind === 'upload').map(({ name, data }) => ({ name, data })) };
  try {
    const { job } = await request('/api/generate', { method: 'POST', body: JSON.stringify(payload) });
    upsertJob(job);
    state.activeJob = job.status === 'running' ? job : null;
    if (state.activeJob) schedulePoll();
  } catch (error) {
    message(error.message);
    if (!error.status || error.status >= 500 || error.status === 409) {
      state.uncertain = true;
      try { await refreshStatus(); const { jobs } = await request('/api/jobs'); state.jobs = jobs || []; renderJobs(); } catch { /* Keep the action blocked until a read-only status refresh succeeds. */ }
    }
  } finally { state.submitting = false; updateControls(); }
});

$('#refresh-status').addEventListener('click', async () => {
  $('#refresh-status').disabled = true;
  try { await refreshStatus({ clearNotice: true }); const { jobs } = await request('/api/jobs'); state.jobs = jobs || []; renderJobs(); }
  catch (error) { message(error.message); }
  finally { $('#refresh-status').disabled = false; }
});

$('#check-api').addEventListener('click', async () => {
  if (state.checking) return;
  state.checking = true; updateControls();
  $('#connection-message').textContent = '모델 접근 권한을 확인하고 있습니다. 이미지는 생성하지 않습니다.';
  $('#model-access').replaceChildren(); $('#model-access').hidden = true;
  try {
    const result = await request('/api/check', { method: 'POST', body: '{}' });
    $('#connection-message').textContent = result.message || '모델 접근 확인을 완료했습니다.';
    for (const model of result.models || []) { const item = document.createElement('li'); item.textContent = `${model.model} · ${model.available ? '모델 목록에서 확인' : '모델 목록에서 확인되지 않음'}`; $('#model-access').append(item); }
    $('#model-access').hidden = !$('#model-access').childElementCount;
  } catch (error) { $('#connection-message').textContent = error.message; }
  finally { state.checking = false; updateControls(); }
});

document.querySelectorAll('[data-preview]').forEach(button => button.addEventListener('click', () => {
  document.documentElement.style.setProperty('--preview', button.dataset.preview === 'dark' ? '#25282d' : '#ececec');
  document.querySelectorAll('[data-preview]').forEach(item => { item.classList.toggle('active', item === button); item.setAttribute('aria-pressed', String(item === button)); });
}));
$('#close-viewer').addEventListener('click', () => $('#image-viewer').close());
$('#image-viewer').addEventListener('click', event => { if (event.target === $('#image-viewer')) { const box = $('#image-viewer').getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) $('#image-viewer').close(); } });

async function initialize() {
  const results = await Promise.allSettled([refreshStatus(), request('/api/references'), request('/api/jobs')]);
  if (results[0].status === 'rejected') { $('#connection-badge').textContent = '연결 확인 필요'; $('#connection-badge').className = 'badge failed'; $('#connection-message').textContent = results[0].reason.message; }
  if (results[1].status === 'fulfilled') { state.references = results[1].value.items || []; renderReferences(); }
  else $('#reference-status').textContent = results[1].reason.message;
  if (results[2].status === 'fulfilled') { state.jobs = results[2].value.jobs || []; if (state.activeJob && !state.jobs.some(job => job.id === state.activeJob.id)) state.jobs.unshift(state.activeJob); renderJobs(); }
  else message(results[2].reason.message);
  updateControls();
}
initialize();

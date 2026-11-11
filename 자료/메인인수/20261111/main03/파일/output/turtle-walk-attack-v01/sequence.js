'use strict';
const $ = id => document.getElementById(id);
const WALK_MS = 2400, ATTACK_MS = 1300, REST_MS = 600, TOTAL_MS = WALK_MS + ATTACK_MS + REST_MS;
const images = new Map();
let elapsed = 0, playing = false, loaded = false, last = null;
const routes = ['builtin', 'sunburst26'];
function sample(durations, time) {
  let boundary = 0;
  for (let i = 0; i < durations.length; i++) {
    boundary += durations[i];
    if (time < boundary) return i;
  }
  return durations.length - 1;
}
function stateAt(time) {
  const t = Math.min(Math.max(time, 0), TOTAL_MS);
  if (t < WALK_MS) return {phase:'walk', action:'walk_left', frame:Math.floor((t % 1200) / 100), x:680 - 360 * t / WALK_MS};
  if (t < WALK_MS + ATTACK_MS) return {phase:'attack', action:'slam_right_foreleg', frame:sample([120,120,100,100,80,50,90,120,100,120,120,180], t - WALK_MS), x:320};
  return {phase:'rest', action:'slam_right_foreleg', frame:11, x:320};
}
function draw() {
  if (!loaded) return;
  const state = stateAt(elapsed);
  for (const route of routes) {
    const sheet = window.sequenceSheets.find(s => s.route === route && s.action === state.action);
    const canvas = $(route), ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 1000, 370);
    const dark = $('bg').value === 'dark';
    ctx.strokeStyle = dark ? '#536454' : '#a4b19f';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(30,320); ctx.lineTo(970,320); ctx.stroke();
    // One fixed transform per action/route, never per-frame bounding-box rescaling.
    const footBaseline = route === 'builtin' ? (state.phase === 'walk' ? 266 : 296) : (state.phase === 'walk' ? 258 : 290);
    const rect = sheet.cells[state.frame].sourceRect;
    ctx.drawImage(images.get(sheet.id), ...rect, state.x - 192, 320 - footBaseline, rect[2], rect[3]);
    const label = state.phase === 'walk' ? '左 이동 · 걷기' : state.phase === 'attack' ? '내려찍기 · 이동 정지' : '복귀 완료 · 원자세';
    $(route+'-state').textContent = label.replace('左','왼쪽') + ' · 프레임 ' + (state.frame + 1) + '/12' + (state.phase === 'attack' && state.frame === 6 ? ' · 타격 기준' : '');
  }
  document.querySelectorAll('[data-phase]').forEach(el => el.classList.toggle('active', el.dataset.phase === state.phase));
  $('seek').value = elapsed;
  $('clock').textContent = (elapsed / 1000).toFixed(2) + ' / 4.30초' + (playing ? ' · 재생 중' : elapsed === TOTAL_MS ? ' · 재생 완료' : ' · 정지');
  $('pause').textContent = playing ? '일시정지' : '이어서 재생';
}
function tick(now) {
  if (last !== null && playing) {
    elapsed += (now - last) * Number($('speed').value);
    if (elapsed >= TOTAL_MS) {
      if ($('loop').checked) elapsed %= TOTAL_MS;
      else { elapsed = TOTAL_MS; playing = false; }
    }
    draw();
  }
  last = now;
  requestAnimationFrame(tick);
}
async function init() {
  await Promise.all(window.sequenceSheets.map(async sheet => {
    const image = new Image();
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = () => reject(new Error(sheet.file));
      image.src = sheet.file;
    });
    images.set(sheet.id,image);
  }));
  loaded = true;
  $('restart').disabled = $('pause').disabled = false;
  $('restart').onclick = () => { elapsed = 0; playing = true; last = null; draw(); };
  $('pause').onclick = () => { if (elapsed >= TOTAL_MS) elapsed = 0; playing = !playing; last = null; draw(); };
  $('seek').oninput = () => { elapsed = Number($('seek').value); playing = false; draw(); };
  $('speed').oninput = () => { $('speedText').textContent = $('speed').value + '×'; };
  $('bg').onchange = () => { document.body.classList.toggle('dark', $('bg').value === 'dark'); draw(); };
  document.addEventListener('visibilitychange', () => { last = null; });
  window.sequenceReview = { seek(ms) { elapsed = Math.min(TOTAL_MS,Math.max(0,ms)); playing = false; draw(); return stateAt(elapsed); }, state:() => ({elapsed,playing,loaded,images:images.size,...stateAt(elapsed)}), total:TOTAL_MS };
  draw();
  // Start once after images are ready; a one-shot preview holds the recovered pose.
  playing = true;
  requestAnimationFrame(tick);
}
init().catch(error => { $('clock').textContent = '이미지 로드 실패: ' + error.message; });

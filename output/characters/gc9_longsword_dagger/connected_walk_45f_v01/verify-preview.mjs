import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
const directory = path.dirname(fileURLToPath(import.meta.url));
const tempPrefix = path.join(os.tmpdir(), 'grid-defenders-walk-review-');
const profile = fs.mkdtempSync(tempPrefix);
const edge = spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { windowsHide: true, stdio: 'ignore' });
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
let socket;
try {
  let port;
  for (let i = 0; i < 100; i++) {
    const filename = path.join(profile, 'DevToolsActivePort');
    if (fs.existsSync(filename)) { port = fs.readFileSync(filename, 'utf8').split('\n')[0]; break; }
    await pause(100);
  }
  if (!port) throw Error('Edge debugging endpoint did not start');
  const tabs = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const tab = tabs.find(item => item.type === 'page');
  socket = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  let serial = 0;
  const pending = new Map();
  socket.onmessage = event => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id); pending.delete(message.id);
      if (message.error) reject(Error(JSON.stringify(message.error))); else resolve(message.result);
    }
  };
  function call(method, params = {}) {
    const id = ++serial;
    return new Promise((resolve, reject) => { pending.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params })); });
  }
  async function evaluate(expression) {
    const result = await call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  }
  await call('Page.enable');
  await call('Emulation.setDeviceMetricsOverride', { width: 1100, height: 850, deviceScaleFactor: 1, mobile: false });
  await call('Page.navigate', { url: pathToFileURL(path.join(directory, 'preview.html')).href });
  let ready = false;
  for (let i = 0; i < 100; i++) {
    ready = await evaluate('document.documentElement.dataset.ready === "true"');
    if (ready) break;
    await pause(100);
  }
  if (!ready) throw Error('Preview failed to load atlas');
  const report = await evaluate(`(() => {
    const player = window.spritePreview;
    player.selectFrame(0);
    document.getElementById('previous').click();
    const previousWraps = player.current === 44;
    document.getElementById('next').click();
    const nextWraps = player.current === 0;
    player.selectFrame(14); const seamBefore = document.getElementById('counter').value; document.getElementById('next').click(); const seamAfter = document.getElementById('counter').value; const seamOrderCorrect = seamBefore.includes('앞 23') && seamAfter.includes('새 01') && player.current === 15; document.getElementById('seam').click(); const seamButtonWorks = player.current === 12 && player.playing;
    const slider = document.getElementById('frame');
    slider.value = '14'; slider.dispatchEvent(new Event('input'));
    const sliderSelects = player.current === 14 && !player.playing;
    player.selectFrame(0); player.setPlaying(true);
    player.tick(10000); player.tick(10000 + 44 * 3000 / 45);
    const frameBeforeEnd = player.current;
    player.tick(13000);
    const frameAtEnd = player.current; const playingAtEnd = player.playing;
    player.setPlaying(false);
    document.querySelector('[data-background="light"]').click();
    const lightWorks = document.getElementById('stage').classList.contains('light');
    document.querySelector('[data-background="dark"]').click();
    const darkWorks = document.getElementById('stage').classList.contains('dark');
    document.querySelector('[data-background="checker"]').click();
    return { imageReady: true, seamBefore, seamAfter, seamOrderCorrect, seamButtonWorks, previousWraps, nextWraps, sliderSelects, frameBeforeEnd, frameAtEnd, stopsAfterLastFrame: frameBeforeEnd === 44 && frameAtEnd === 44 && !playingAtEnd, lightWorks, darkWorks, canvas: {w: 256, h: 256} };
  })()`);
  // The following is a compressed display copy only. Production PNGs stay full size.
  const atlasDataUrl = 'data:image/png;base64,' + fs.readFileSync(path.join(directory, 'connected-walk-45f.png')).toString('base64');
  const webp = await evaluate(`(async () => {
    const exportImage = new Image(); exportImage.src = ${JSON.stringify(atlasDataUrl)}; await exportImage.decode();
    const preview = document.createElement('canvas'); preview.width = 1152; preview.height = 640;
    const context = preview.getContext('2d'); context.imageSmoothingEnabled = false;
    context.drawImage(exportImage, 0, 0, 1152, 640);
    return preview.toDataURL('image/webp', 0.88);
  })()`);
  fs.writeFileSync(path.join(directory, 'preview-atlas.webp'), Buffer.from(webp.split(',')[1], 'base64'));
  await evaluate("document.querySelector('[data-background=light]').click(); window.spritePreview.selectFrame(0)");
  const screenshot = await call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  fs.writeFileSync(path.join(directory, 'preview-browser-light.png'), Buffer.from(screenshot.data, 'base64'));
  await evaluate("document.querySelector('[data-background=dark]').click(); window.spritePreview.selectFrame(15)");
  const darkScreenshot = await call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  fs.writeFileSync(path.join(directory, 'preview-browser-dark.png'), Buffer.from(darkScreenshot.data, 'base64'));
  await call('Emulation.setDeviceMetricsOverride', { width: 390, height: 900, deviceScaleFactor: 1, mobile: true });
  report.mobile390 = await evaluate(`({ noHorizontalOverflow: document.documentElement.scrollWidth <= innerWidth, controlMinHeight: Math.min(...Array.from(document.querySelectorAll('button,select,input')).map(item => item.getBoundingClientRect().height)) })`);
  report.webpPreviewBytes = fs.statSync(path.join(directory, 'preview-atlas.webp')).size;
  const animatedBase64 = fs.readFileSync(path.join(directory, 'connected-walk-animated.png')).toString('base64');
  report.apng = await evaluate(`(async () => {
    const encoded = Uint8Array.from(atob(${JSON.stringify(animatedBase64)}), character => character.charCodeAt(0));
    const decoder = new ImageDecoder({ data: encoded, type: 'image/png', preferAnimation: true });
    await decoder.tracks.ready;
    await decoder.completed;
    const track = decoder.tracks.selectedTrack;
    const result = { frameCount: track.frameCount, animated: track.animated, repetitionCount: String(track.repetitionCount), decodedFrames: 0, durationMs: 0, allFrames256: true };
    for (let index = 0; index < track.frameCount; index++) {
      const frame = (await decoder.decode({ frameIndex: index, completeFramesOnly: true })).image;
      result.decodedFrames++;
      result.durationMs += frame.duration / 1000;
      result.allFrames256 = result.allFrames256 && frame.displayWidth === 256 && frame.displayHeight === 256;
      frame.close();
    }
    decoder.close();
    return result;
  })()`);
  if (report.apng.decodedFrames !== 45 || !report.apng.allFrames256 || Math.abs(report.apng.durationMs - 3000) > 1) throw Error('Animated PNG decoding failed: ' + JSON.stringify(report.apng));
  fs.writeFileSync(path.join(directory, 'browser-verification.json'), JSON.stringify(report, null, 2) + '\n');
  const checks = ['seamOrderCorrect','seamButtonWorks','previousWraps','nextWraps','sliderSelects','stopsAfterLastFrame','lightWorks','darkWorks'];
  if (checks.some(key => !report[key]) || !report.mobile390.noHorizontalOverflow) throw Error(JSON.stringify(report));
  const scratch = process.env.ORCA_CHAT_SCRATCH_DIR;
  if (scratch) {
    let inline = fs.readFileSync(path.join(directory, 'preview.html'), 'utf8');
    inline = inline.replaceAll('connected-walk-45f.png', webp)
      .replace('const CELL = 256,', 'const CELL = 128,')
      .replace(/      <div class="buttons"><a href=.*?<\/div>\r?\n/, '')
      .replace('width: min(100%, 512px)', 'width: min(100%, 320px)')
      .replace('color: #e7edf7; background: #131923;', 'color: var(--foreground, #e7edf7); background: var(--background, #131923);')
      .replace('color: #afbdd0;', 'color: var(--muted-foreground, #afbdd0);')
      .replace('color: #e7edf7; background: #253147;', 'color: var(--foreground, #e7edf7); background: var(--secondary, #253147);')
      .replace('실제 알파 PNG · 기본 2배 확대 표시.', '채팅용 축소 미리보기 · 원본은 256px 투명 PNG.')
      .replace('</style>', 'button:hover { background: var(--accent, #3c506f); color: var(--accent-foreground, #fff); }\n</style>');
    // The atlas is embedded only once; the optional sheet panel reuses its URL.
    inline = inline.replace(/(<img class="atlas" src=")[^"]+(" alt=)/, '$1$2');
    inline = inline.replace("image.onload = () => { ready = true;", "image.onload = () => { document.querySelector('.atlas').src = image.src; ready = true;");
    const bytes = Buffer.byteLength(inline);
    if (bytes >= 512 * 1024) throw Error(`Inline preview too large: ${bytes}`);
    fs.mkdirSync(scratch, { recursive: true });
    fs.writeFileSync(path.join(scratch, 'blond-connected-walk-45f-v01.html'), inline);
    console.log(JSON.stringify({ inlinePreview: 'blond-connected-walk-45f-v01.html', bytes }));
  }
  console.log(JSON.stringify(report));
  await call('Emulation.setDeviceMetricsOverride', { width: 2304, height: 1344, deviceScaleFactor: 1, mobile: false });
  await call('Page.navigate', { url: pathToFileURL(path.join(directory, 'order.html')).href });
  for (let attempt = 0; attempt < 100; attempt++) {
    if (await evaluate("document.querySelector('img')?.complete && document.querySelector('img')?.naturalWidth === 2304 && document.querySelectorAll('.number').length === 45")) break;
    await pause(50);
  }
  await evaluate('document.fonts.ready');
  const orderShot = await call('Page.captureScreenshot', {format:'png', captureBeyondViewport:false});
  fs.writeFileSync(path.join(directory, 'connected-walk-45f-numbered.png'), Buffer.from(orderShot.data,'base64'));
  await call('Browser.close');
} finally {
  socket?.close();
  if (edge.exitCode === null) edge.kill();
  await pause(600);
  // Remove only the isolated browser profile created by this script.
  if (path.resolve(profile).startsWith(path.resolve(tempPrefix)) && path.dirname(profile) === path.dirname(tempPrefix)) {
    try { fs.rmSync(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 }); } catch { /* Edge may still be releasing its profile. */ }
  }
}




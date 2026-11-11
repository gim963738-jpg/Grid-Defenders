const { chromium } = require('C:/Users/user/AppData/Local/ms-playwright-go/1.57.0/package');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const BASE = 'http://127.0.0.1:5173/dev-previews/viewer/index.html';

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' });
  const checks = [], errors = [];
  const check = (condition, name) => { assert.ok(condition, name); checks.push(name); };
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, acceptDownloads: true });
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => viewerQA.state.ready && document.querySelector('#stage canvas[data-frame]'));
    check(await page.locator('#stage .card').count() === 2, 'existing reference defaults to side-by-side');
    check(await page.locator('#frames button').count() === 12, 'recorded 12-frame sheet is loaded');
    check(await page.locator('#stage p,#stage h1,#stage h2').count() === 0, 'image area has no explanatory prose');
    await page.click('#actual');
    await page.waitForFunction(() => viewerQA.state.zoom === 100 && document.querySelector('#stage canvas[data-asset="01-run-right90"]').style.width === '512px');
    await page.fill('#zoom', '200'); await page.locator('#zoom').dispatchEvent('change');
    await page.waitForFunction(() => document.querySelector('#stage canvas[data-asset="01-run-right90"]').style.width === '1024px');
    check(true, 'zoom changes actual displayed canvas size');
    await page.click('#fit');
    await page.fill('#sequence', '2,3'); await page.press('#sequence', 'Enter');
    await page.waitForFunction(() => document.querySelector('#stage canvas[data-asset="01-run-right90"]').dataset.frame === '2');
    check(JSON.stringify(await page.evaluate(() => viewerQA.state.sequence)) === '[2,3]', 'specific non-whole-sheet frame selection');
    await page.fill('#fps', '4'); await page.locator('#fps').dispatchEvent('change'); await page.click('#play');
    await page.waitForFunction(() => viewerQA.state.history.includes(2) && viewerQA.state.history.includes(3));
    await page.click('#play');
    check((await page.evaluate(() => viewerQA.state.history)).every(x => x === 2 || x === 3), 'animation only plays frames 2 and 3');
    if (await page.locator('#inspector').isHidden()) await page.click('#settings');
    const checksum = () => page.locator('#stage canvas[data-asset="01-run-right90"]').evaluate(c => {
      const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let hash = 0;
      for (let i = 0; i < d.length; i += 7) hash = (Math.imul(hash, 31) + d[i]) >>> 0;
      return hash;
    });
    // Pause on one fixed frame while testing actual pixel effects.
    await page.press('#sequence', 'Enter');
    await page.waitForFunction(() => document.querySelector('#stage canvas[data-asset="01-run-right90"]').dataset.frame === '2');
    const original = await checksum();
    for (const effect of ['clean', 'rough', 'blur', 'sketch']) {
      await page.selectOption('#effect', effect);
      await page.waitForFunction(old => {
        const c = document.querySelector('#stage canvas[data-asset="01-run-right90"]');
        const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let h = 0;
        for (let i = 0; i < d.length; i += 7) h = (Math.imul(h, 31) + d[i]) >>> 0;
        return h !== old;
      }, original);
      check(true, effect + ' modifies rendered pixels');
    }
    await page.click('#reset-filters');
    await page.waitForFunction(() => viewerQA.state.filters.effect === 'original');
    await page.locator('#resolution').evaluate(e => { e.value = '25'; e.dispatchEvent(new Event('input', { bubbles: true })); });
    await page.waitForTimeout(250);
    check(await checksum() !== original, 'resolution degradation resamples pixels');
    await page.locator('#quality').evaluate(e => { e.value = '25'; e.dispatchEvent(new Event('input', { bubbles: true })); });
    await page.waitForTimeout(350);
    const download = page.waitForEvent('download'); await page.click('#download');
    const downloaded = await download; await downloaded.saveAs(path.join(__dirname, 'filtered-frame.png'));
    check(fs.readFileSync(path.join(__dirname, 'filtered-frame.png')).subarray(1, 4).toString() === 'PNG', 'filtered frame export');
    await page.fill('#sequence', '99'); await page.press('#sequence', 'Enter');
    check((await page.locator('#status').textContent()).includes('1~12'), 'invalid frame cannot silently play');
    check(JSON.stringify(await page.evaluate(() => viewerQA.state.sequence)) === '[2,3]', 'invalid selection preserves last valid sequence');
    await page.fill('#sequence', '2,3'); await page.press('#sequence', 'Enter');
    await page.click('#reset-filters'); await page.click('#close-settings');
    await page.screenshot({ path: path.join(__dirname, 'desktop-compare.png') });
    await page.setViewportSize({ width: 780, height: 900 });
    await page.screenshot({ path: path.join(__dirname, 'right-pane.png') });
    check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), '780px pane has no document overflow');
    await page.setViewportSize({ width: 390, height: 844 });
    check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), '390px viewer has no document overflow');
    await page.click('#settings'); check(await page.locator('#effect').isVisible(), 'narrow-screen filters accessible'); await page.click('#close-settings');
    await page.screenshot({ path: path.join(__dirname, 'mobile.png') });
    await page.setViewportSize({ width: 1200, height: 900 });
    await page.selectOption('#collection', 'idle6-style1-style4');
    await page.waitForFunction(() => viewerQA.state.collection.id === 'idle6-style1-style4' && document.querySelectorAll('#stage .card').length >= 6);
    check(await page.evaluate(() => viewerQA.state.mode) === 'gallery', 'no reference defaults to collected gallery');
    await page.screenshot({ path: path.join(__dirname, 'gallery.png') });
    await page.selectOption('#collection', 'balor-sd-guard35-v003');
    await page.waitForFunction(() => viewerQA.state.collection.id === 'balor-sd-guard35-v003');
    check(await page.evaluate(() => viewerQA.state.mode) === 'compare', 'previous/current illustration auto comparison');
    const responses = await page.evaluate(async () => {
      const urls = [...new Set(viewerQA.catalog.flatMap(c => c.assets.map(a => a.src)))];
      let failures = [];
      for (let i = 0; i < urls.length; i += 8) await Promise.all(urls.slice(i, i + 8).map(async url => {
        const r = await fetch(url, { method: 'HEAD' }); if (!r.ok) failures.push([url, r.status]);
      }));
      return { count: urls.length, failures };
    });
    check(responses.failures.length === 0, 'all ' + responses.count + ' catalog image URLs load over HTTP');
    await page.setInputFiles('#files', path.join(__dirname, 'fixture.png'));
    await page.waitForFunction(() => viewerQA.state.collection.id.startsWith('local-') && document.querySelector('#stage canvas[data-frame]'));
    check(await page.evaluate(() => viewerQA.state.mode) === 'gallery', 'multiple-file importer uses the common gallery');
    if (await page.locator('#inspector').isHidden()) await page.click('#settings');
    await page.check('#is-sheet');
    for (const [id, value] of [['columns', '3'], ['rows', '1'], ['frame-count', '3']]) {
      await page.fill('#' + id, value); await page.locator('#' + id).dispatchEvent('change');
    }
    await page.fill('#sequence', '2,3'); await page.press('#sequence', 'Enter');
    await page.waitForFunction(() => document.querySelector('#stage canvas').dataset.frame === '2' && document.querySelector('#stage canvas').width === 32);
    const center = () => page.locator('#stage canvas').evaluate(c => [...c.getContext('2d').getImageData(16, 16, 1, 1).data]);
    assert.deepEqual(await center(), [0, 255, 0, 255]);
    await page.click('#next'); await page.waitForFunction(() => document.querySelector('#stage canvas').dataset.frame === '3');
    assert.deepEqual(await center(), [0, 0, 255, 255]);
    check(true, 'custom grid and selected frames crop the expected actual pixels');
    await page.fill('#zoom', '800'); await page.locator('#zoom').dispatchEvent('change');
    await page.waitForFunction(() => document.querySelector('#stage canvas').style.width === '256px');
    await page.click('#fit');
    check(true, 'imported sprites retain zoom and frame tools');
    check(errors.length === 0, 'no browser runtime errors');
    fs.writeFileSync(path.join(__dirname, 'browser-check.json'), JSON.stringify({ status: 'PASS', checks, errors, imageResponses: responses }, null, 2));
    console.log(JSON.stringify({ passed: checks.length, imageUrls: responses.count, errors }));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });

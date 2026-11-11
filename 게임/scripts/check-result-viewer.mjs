import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { autoMode, parseSequence, sheetRect, transformPixels, validateCollection } from '../public/dev-previews/viewer/core.js';

assert.deepEqual(parseSequence('2,3', 5), [2, 3]);
assert.deepEqual(parseSequence('5-3,2,2', 5), [5, 4, 3, 2, 2]);
assert.deepEqual(parseSequence('', 12), []);
for (const bad of ['0', '6', '2,no', '-1', '2.5', '2-9']) assert.throws(() => parseSequence(bad, 5));
assert.deepEqual(sheetRect(101, 21, { columns: 3, rows: 1, count: 3 }, 3), { x: 67, y: 0, width: 34, height: 21 });
assert.deepEqual(sheetRect(100, 40, { columns: 2, rows: 1, count: 2, rects: [[1, 2, 20, 30], [40, 0, 50, 20]] }, 2), { x: 40, y: 0, width: 50, height: 20 });
assert.throws(() => sheetRect(32, 32, { columns: 4, rows: 4, count: 12 }, 13));
assert.throws(() => sheetRect(32, 32, { columns: 2, rows: 1, count: 2, marginX: 40 }, 1));
const pixels = Uint8ClampedArray.from({ length: 8 * 8 * 4 }, (_, i) => i % 4 === 3 ? 255 : (i * 31) % 255);
const before = new Uint8ClampedArray(pixels);
for (const effect of ['clean', 'rough', 'sketch']) {
  const out = transformPixels(pixels, 8, 8, effect, 75);
  assert.notDeepEqual(out, pixels); assert.deepEqual(pixels, before);
  if (effect !== 'rough') for (let i = 3; i < pixels.length; i += 4) assert.equal(out[i], pixels[i]);
}
const c = { assets: [{ id: 'a', src: '/a.png' }, { id: 'b', src: '/b.png', referenceId: 'a' }] };
assert.equal(autoMode(c, c.assets[1]), 'compare'); assert.equal(autoMode(c, c.assets[0]), 'gallery');
assert.throws(() => validateCollection({ assets: [{ id: 'a', src: 'javascript:alert(1)' }] }));
assert.throws(() => validateCollection({ assets: [{ id: 'a', src: '/a.png' }], referenceId: 'missing' }));
assert.equal(validateCollection({ assets: [{ id: 'minimal', src: '/a.png' }] }).assets[0].label, 'minimal');
assert.throws(() => validateCollection({ assets: [{ id: 'a', src: '/a.png', sheet: { columns: 4, rows: 3, count: 99 } }] }));
const catalog = JSON.parse(readFileSync(new URL('../public/dev-previews/viewer/catalog.json', import.meta.url)));
for (const collection of catalog.collections) validateCollection(collection);
const sheets = catalog.collections.flatMap(c => c.assets).filter(a => a.sheet);
assert.ok(sheets.length >= 39);
console.log(JSON.stringify({ status: 'PASS', collectionCount: catalog.collections.length, spriteSheetCount: sheets.length,
  checks: 'selected ranges/order, invalid frames, exact crop bounds, immutable pixel effects, preserved alpha, automatic modes, safe manifests' }));

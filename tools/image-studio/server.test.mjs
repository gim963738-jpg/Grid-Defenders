import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { createStudio } from './server.mjs';

const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64');
const secret = 'test-secret-never-publish';

async function setup(t, options = {}) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'grid-image-test-'));
  await mkdir(path.join(root, 'output/characters/char003'), { recursive: true });
  await writeFile(path.join(root, 'output/characters/char003/hero.png'), png);
  const calls = [];
  const app = await createStudio({ root, port: 0, getKey: async () => secret,
    generate: async (args) => { calls.push(args); return { bytes: png, response: { usage: { total_tokens: 12 } }, requestId: 'mock-request' }; },
    check: async () => ({ models: [{ model: 'gpt-image-2.6-sunburst', available: true }], message: 'mock' }), ...options });
  const url = await app.listen();
  t.after(async () => { app.server.closeAllConnections(); await new Promise(resolve => app.server.close(resolve)); await rm(root, { recursive: true, force: true }); });
  const status = await (await fetch(url + '/api/status')).json();
  const post = (endpoint, body, headers = {}) => fetch(url + endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Studio-Token': status.csrfToken, ...headers }, body: JSON.stringify(body) });
  const body = { requestId: randomUUID(), preset: 'sunburst-2.5-xhigh', prompt: '원래 의상을 유지한 걷기 자세', references: ['output/characters/char003/hero.png'] };
  return { root, app, calls, url, status, post, body };
}

async function finished(url, id) {
  for (let n = 0; n < 100; n++) {
    const { job } = await (await fetch(`${url}/api/jobs/${id}`)).json();
    if (job.status !== 'running') return job;
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  throw new Error('test job did not finish');
}

test('organized gallery and world atlas serve images and reference records without an API call', async t => {
  const ctx = await setup(t);
  const files = [
    ['output/silver-staff-8views-v1/images/01_front_000.png', png, 'image/png'],
    ['output/character-redesign-6x2/images/c04_front.png', png, 'image/png'],
    ['output/characters/catalog/catalog.json', '{"assets":[]}', 'application/json'],
    ['output/characters/gc9_longsword_dagger/pixel_8views_v01/longsword-dagger-pixel8-v01.zip', Buffer.from([80,75,5,6]), 'application/zip'],
    ['output/animation/dreamina-right-walk-60-v01/walk_right_60_10x6.png', png, 'image/png'],
    ['output/animation/dreamina-right-walk-60-v01/미리보기.html', '<html lang="ko">60프레임</html>', 'text/html'],
    ['output/world/maps/continent_world_lore_v18.png', png, 'image/png'],
    ['output/world/atlas/index.html', '<html lang="ko">세계관 지도</html>', 'text/html'],
    ['자료/세계관/세계관설정.json', '{"regions":[]}', 'application/json'],
    ['문서/02_세부기획/00_세계관/세계관설정집.md', '오대륙 세계관 설정집', 'text/markdown'],
    ['자료/캐릭터설정/캐릭터목록.json', '{"profiles":[]}', 'application/json'],
    ['자료/캐릭터설정/제작순서.json', '{"illustration":{"final_count":4}}', 'application/json'],
    ['문서/02_세부기획/02_영웅/캐릭터제작규약.md', '시안 승인 후 4방향·3방향', 'text/markdown'],
    ['자료/캐릭터그림체/GC9/원본/source.jfif', Buffer.from([255,216,255,0]), 'image/jpeg'],
    ['문서/02_세부기획/02_영웅/캐릭터그림체/rules.md', '그림체 기준', 'text/markdown'],
  ];
  for (const [file, bytes, mime] of files) {
    await mkdir(path.dirname(path.join(ctx.root, file)), { recursive: true });
    await writeFile(path.join(ctx.root, file), bytes);
    const response = await fetch(ctx.url + '/' + file.split('/').map(encodeURIComponent).join('/'));
    assert.equal(response.status, 200, file);
    assert.ok(response.headers.get('content-type').startsWith(mime), file);
    assert.deepEqual(Buffer.from(await response.arrayBuffer()), Buffer.from(bytes));
  }
  assert.equal(ctx.calls.length, 0);
});

test('catalog viewing does not expose local settings or files outside collection roots', async t => {
  const ctx = await setup(t);
  await mkdir(path.join(ctx.root, 'output/characters/private'), { recursive: true });
  await writeFile(path.join(ctx.root, 'output/characters/private/.env.local'), secret);
  await writeFile(path.join(ctx.root, 'private.json'), JSON.stringify({ token: secret }));
  for (const file of ['/output/characters/private/.env.local', '/private.json', '/output/handoffs/character-design-20261106/HANDOFF.txt']) {
    const response = await fetch(ctx.url + file);
    assert.equal(response.status, 404);
    assert.ok(!(await response.text()).includes(secret));
  }
  assert.equal(ctx.calls.length, 0);
});

test('generation persists exact preset, prompt, image and optional usage without exposing the key', async t => {
  const ctx = await setup(t);
  assert.equal(ctx.status.presets.length, 3);
  assert.equal(ctx.status.keyConfigured, true);
  assert.ok(!JSON.stringify(ctx.status).includes(secret));
  const result = await ctx.post('/api/generate', ctx.body);
  assert.equal(result.status, 202);
  const job = await finished(ctx.url, ctx.body.requestId);
  assert.equal(job.status, 'succeeded');
  assert.equal(ctx.calls.length, 1);
  assert.equal(ctx.calls[0].config.preset.quality, 'xhigh');
  assert.equal(ctx.calls[0].images[0].mime, 'image/png');
  assert.deepEqual(Buffer.from(await (await fetch(ctx.url + job.imageUrl)).arrayBuffer()), png);
  const manifest = await (await fetch(ctx.url + job.metadataUrl)).json();
  assert.equal(manifest.response.usage.total_tokens, 12);
  assert.equal(manifest.prompt, ctx.body.prompt);
  assert.equal(manifest.references[0].source, ctx.body.references[0]);
  assert.ok(!JSON.stringify(manifest).includes(secret));
  assert.equal(await readFile(path.join(ctx.root, 'output/characters/char003/hero.png'), 'base64'), png.toString('base64'));
  assert.equal((await ctx.post('/api/generate', ctx.body)).status, 200);
  assert.equal(ctx.calls.length, 1);
});

test('missing key and cross-origin/token requests cannot invoke a paid operation', async t => {
  const ctx = await setup(t, { getKey: async () => '' });
  assert.equal(ctx.status.keyConfigured, false);
  assert.equal((await ctx.post('/api/generate', ctx.body)).status, 400);
  assert.equal((await ctx.post('/api/generate', ctx.body, { Origin: 'https://example.com' })).status, 403);
  assert.equal((await ctx.post('/api/generate', ctx.body, { 'X-Studio-Token': 'wrong' })).status, 403);
  const hostileHostStatus = await new Promise((resolve, reject) => {
    http.get(ctx.url + '/api/status', { headers: { Host: 'example.com' } }, res => { res.resume(); resolve(res.statusCode); }).on('error', reject);
  });
  assert.equal(hostileHostStatus, 403);
  assert.equal(ctx.calls.length, 0);
});

test('path escape, malformed input and excess reference count are rejected before the API', async t => {
  const ctx = await setup(t);
  assert.equal((await ctx.post('/api/generate', { ...ctx.body, references: ['../../../private.png'] })).status, 403);
  assert.equal((await ctx.post('/api/generate', { ...ctx.body, references: [], uploads: [{ name: 'a.png', data: Buffer.from('not png').toString('base64') }] })).status, 400);
  assert.equal((await ctx.post('/api/generate', { ...ctx.body, references: Array(5).fill(ctx.body.references[0]) })).status, 400);
  assert.equal((await ctx.post('/api/generate', { ...ctx.body, preset: 'unrequested-model' })).status, 400);
  assert.equal((await fetch(ctx.url + '/.env.local')).status, 404);
  assert.equal(ctx.calls.length, 0);
});

test('one active job blocks a second billable submission and does not retry failures', async t => {
  let reject;
  let calls = 0;
  const pending = new Promise((_, fail) => { reject = fail; });
  const ctx = await setup(t, { generate: async () => { calls++; return pending; } });
  assert.equal((await ctx.post('/api/generate', ctx.body)).status, 202);
  assert.equal((await ctx.post('/api/generate', { ...ctx.body, requestId: randomUUID() })).status, 409);
  reject(Object.assign(new Error('invalid ' + secret), { code: 'credit_balance_exhausted', status: 429 }));
  const job = await finished(ctx.url, ctx.body.requestId);
  assert.equal(job.status, 'failed');
  assert.equal(job.error.code, 'credit_balance_exhausted');
  assert.ok(!job.error.message.includes(secret));
  assert.equal(calls, 1);
  assert.equal((await ctx.post('/api/generate', ctx.body)).status, 200);
  assert.equal(calls, 1);
});

test('uploaded files are preserved as references and prior interrupted work is not reissued', async t => {
  const ctx = await setup(t);
  const result = await ctx.post('/api/generate', { ...ctx.body, references: [], uploads: [{ name: '../캐릭터.png', data: png.toString('base64') }] });
  assert.equal(result.status, 202);
  const job = await finished(ctx.url, ctx.body.requestId);
  const manifest = await (await fetch(ctx.url + job.metadataUrl)).json();
  assert.equal(manifest.references[0].name, '캐릭터.png');
  assert.deepEqual(await readFile(path.join(ctx.root, 'output/imagegen/sunburst', job.id, 'reference-1.png')), png);
  const id = randomUUID();
  await mkdir(path.join(ctx.root, 'output/imagegen/sunburst', id));
  await writeFile(path.join(ctx.root, 'output/imagegen/sunburst', id, 'metadata.json'), JSON.stringify({ id, status: 'running', createdAt: new Date().toISOString(), label: 'Interrupted' }));
  let extraCalls = 0;
  const second = await createStudio({ root: ctx.root, port: 0, getKey: async () => secret, generate: async () => { extraCalls++; } });
  const secondUrl = await second.listen();
  t.after(async () => { second.server.closeAllConnections(); await new Promise(resolve => second.server.close(resolve)); });
  const restored = await finished(secondUrl, id);
  assert.equal(restored.status, 'failed');
  assert.equal(restored.error.code, 'interrupted');
  assert.equal(extraCalls, 0);
});

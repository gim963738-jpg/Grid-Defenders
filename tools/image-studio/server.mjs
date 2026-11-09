import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';
import { parseEnv } from 'node:util';
import { readFile, writeFile, mkdir, readdir, realpath, stat, rename } from 'node:fs/promises';
import { PRESETS, validateConfig, requestImage, checkModels } from './openai.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PROJECT = path.resolve(HERE, '../..');
const OUTPUT = 'output/imagegen/sunburst';
const REFERENCE_ROOT = 'output/characters';
const MAX_FILE = 12 * 1024 * 1024;
const MAX_BODY = 70 * 1024 * 1024;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TYPES = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.jfif': 'image/jpeg', '.webp': 'image/webp' };
const CATALOG_ROOTS = [REFERENCE_ROOT, 'output/character-redesign-6x2', 'output/red-haired-adventurer-4views-v1', 'output/illustration-final-test-2x4-v1', 'output/silver-staff-8views-v1', 'output/animation/dreamina-right-walk-60-v01', 'output/world', '자료/세계관', '자료/캐릭터설정', '문서/02_세부기획/00_세계관', '자료/캐릭터그림체/GC9', '자료/스플래시아트/SP13', '문서/02_세부기획/02_영웅'];
const CATALOG_TYPES = { ...TYPES, '.json': 'application/json; charset=utf-8', '.md': 'text/markdown; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.html': 'text/html; charset=utf-8', '.zip': 'application/zip' };

function failure(message, status = 400, code = 'invalid_request') {
  return Object.assign(new Error(message), { status, code });
}

export function inside(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative !== '' && !relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative);
}

export function imageType(bytes) {
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return 'image/png';
  if (bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return 'image/jpeg';
  if (bytes.length >= 12 && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  throw failure('참고 이미지는 PNG, JPEG, WebP 파일이어야 합니다.');
}

export async function getLocalKey() {
  try {
    const values = parseEnv(await readFile(path.join(HERE, '.env.local'), 'utf8'));
    if (values.OPENAI_API_KEY?.trim()) return values.OPENAI_API_KEY.trim();
  } catch (error) {
    if (error.code !== 'ENOENT') throw failure('.env.local 설정 파일을 읽을 수 없습니다.', 500, 'config_error');
  }
  return process.env.OPENAI_API_KEY?.trim() || '';
}

async function readJson(req) {
  if (!req.headers['content-type']?.startsWith('application/json')) throw failure('JSON 요청이 필요합니다.', 415);
  const chunks = [];
  let length = 0;
  for await (const chunk of req) {
    length += chunk.length;
    if (length > MAX_BODY) throw failure('업로드 용량이 너무 큽니다.', 413);
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw failure('요청 형식을 읽을 수 없습니다.'); }
}

export async function createStudio({ root = PROJECT, port = 8788, getKey = getLocalKey, generate = requestImage, check = checkModels } = {}) {
  root = await realpath(root);
  const outputDirectory = path.join(root, OUTPUT);
  await mkdir(outputDirectory, { recursive: true });
  if (!inside(root, await realpath(outputDirectory))) throw failure('결과 폴더가 프로젝트 밖을 가리킵니다.', 500);
  const token = randomBytes(32).toString('hex');
  const jobs = new Map();
  let activeJob = null;

  function publicJob(job) {
    const { id, status, label, createdAt, model, quality, imageUrl, metadataUrl, outputPath, error } = job;
    return { id, status, label, createdAt, model, quality, imageUrl, metadataUrl, outputPath, error };
  }
  async function saveJob(job) {
    // This is our own new job folder; existing character assets are never overwritten.
    const destination = path.join(outputDirectory, job.id, 'metadata.json');
    const temporary = path.join(outputDirectory, job.id, 'metadata.pending');
    await writeFile(temporary, JSON.stringify(job, null, 2), 'utf8');
    await rename(temporary, destination);
  }
  for (const entry of await readdir(outputDirectory, { withFileTypes: true })) {
    if (!entry.isDirectory() || !UUID.test(entry.name)) continue;
    try {
      const jobPath = await realpath(path.join(outputDirectory, entry.name, 'metadata.json'));
      if (!inside(outputDirectory, jobPath)) continue;
      const job = JSON.parse(await readFile(jobPath, 'utf8'));
      if (job.id !== entry.name || !['running', 'succeeded', 'failed'].includes(job.status)) continue;
      if (job.status === 'running') {
        job.status = 'failed';
        job.error = { code: 'interrupted', message: '서버가 종료되어 처리 결과를 확인할 수 없습니다. 자동 재시도하지 않았습니다.' };
        await saveJob(job);
      }
      jobs.set(job.id, job);
    } catch { /* Ignore folders without a complete manifest. Never regenerate automatically. */ }
  }

  async function confined(relative, allowedRoot) {
    if (typeof relative !== 'string' || relative.includes('\\') || relative.includes('\0') || path.isAbsolute(relative)) throw failure('허용되지 않는 파일 경로입니다.', 403);
    const absolute = path.resolve(root, relative);
    const boundary = path.resolve(root, allowedRoot);
    if (!inside(boundary, absolute)) throw failure('허용되지 않는 파일 경로입니다.', 403);
    let resolved;
    try { resolved = await realpath(absolute); }
    catch { throw failure('파일을 찾을 수 없습니다.', 404, 'not_found'); }
    if (!inside(boundary, resolved)) throw failure('프로젝트 밖의 파일은 열 수 없습니다.', 403);
    return resolved;
  }

  async function references() {
    const items = [];
    async function walk(folder) {
      let entries;
      try { entries = await readdir(folder, { withFileTypes: true }); }
      catch (error) { if (error.code === 'ENOENT') return; throw error; }
      for (const entry of entries) {
        if (entry.isSymbolicLink()) continue;
        const absolute = path.join(folder, entry.name);
        if (entry.isDirectory()) await walk(absolute);
        else if (entry.isFile() && TYPES[path.extname(entry.name).toLowerCase()]) {
          const id = path.relative(root, absolute).split(path.sep).join('/');
          items.push({ id, name: id.slice(REFERENCE_ROOT.length + 1), url: '/' + id.split('/').map(encodeURIComponent).join('/') });
        }
      }
    }
    await walk(path.join(root, REFERENCE_ROOT));
    return items.sort((a, b) => b.id.localeCompare(a.id));
  }

  async function prepareImages(body) {
    const selected = body.references ?? [];
    const uploads = body.uploads ?? [];
    if (!Array.isArray(selected) || !Array.isArray(uploads) || selected.length + uploads.length > 4) throw failure('참고 이미지는 최대 4개까지 선택할 수 있습니다.');
    const images = [];
    for (const relative of selected) {
      const absolute = await confined(relative, REFERENCE_ROOT);
      const info = await stat(absolute);
      if (!info.isFile() || info.size > MAX_FILE) throw failure('각 참고 이미지는 12MB 이하여야 합니다.', 413);
      const bytes = await readFile(absolute);
      images.push({ name: path.basename(absolute), mime: imageType(bytes), bytes, source: relative });
    }
    for (const upload of uploads) {
      if (typeof upload?.name !== 'string' || typeof upload?.data !== 'string' || !/^[A-Za-z0-9+/]*={0,2}$/.test(upload.data)) throw failure('업로드 형식을 확인해 주세요.');
      const bytes = Buffer.from(upload.data, 'base64');
      if (!bytes.length || bytes.length > MAX_FILE) throw failure('각 참고 이미지는 12MB 이하여야 합니다.', 413);
      const name = path.basename(upload.name.replaceAll('\\', '/')).replace(/[^\p{L}\p{N}_.-]/gu, '_').slice(-100) || 'reference.png';
      images.push({ name, mime: imageType(bytes), bytes, source: 'upload' });
    }
    return images;
  }

  async function run(job, config, images, apiKey) {
    try {
      const result = await generate({ apiKey, config, images });
      const filename = `${job.id}_${job.preset}.png`;
      const relative = `${OUTPUT}/${job.id}/${filename}`;
      await writeFile(path.join(root, relative), result.bytes, { flag: 'wx' });
      job.status = 'succeeded';
      job.outputPath = relative;
      job.imageUrl = '/' + relative;
      job.metadataUrl = `/${OUTPUT}/${job.id}/metadata.json`;
      job.response = result.response;
      job.requestId = result.requestId;
      job.finishedAt = new Date().toISOString();
    } catch (error) {
      job.status = 'failed';
      job.error = {
        message: String(error.message || '이미지를 생성하지 못했습니다.').replaceAll(apiKey, '[REDACTED]'),
        code: error.code || 'generation_error',
        status: error.status,
        requestId: error.requestId,
      };
    }
    try { await saveJob(job); }
    catch { job.error = { code: 'save_failed', message: '결과 기록 저장에 실패했습니다. 결과 폴더를 확인해 주세요. 자동 재시도하지 않았습니다.' }; job.status = 'failed'; }
    finally { activeJob = null; }
  }

  const server = http.createServer(async (req, res) => {
    const address = server.address();
    const host = `127.0.0.1:${address.port}`;
    const origin = `http://${host}`;
    const json = (status, value) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(value)); };
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Content-Security-Policy', "default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
    try {
      if (req.headers.host !== host) throw failure('로컬 주소로 접속해 주세요.', 403);
      if (req.headers.origin && req.headers.origin !== origin) throw failure('다른 사이트에서 보낸 요청은 허용되지 않습니다.', 403);
      const url = new URL(req.url, origin);
      const route = decodeURIComponent(url.pathname);
      if (req.method === 'POST') {
        if (req.headers['x-studio-token'] !== token) throw failure('페이지를 새로고침한 뒤 다시 시도해 주세요.', 403, 'invalid_session');
        const body = await readJson(req);
        const apiKey = await getKey();
        if (route === '/api/check') {
          if (!apiKey) throw failure('OPENAI_API_KEY를 등록한 뒤 서버를 다시 실행해 주세요. .env.local은 자동으로 다시 읽습니다.', 400, 'missing_api_key');
          json(200, await check({ apiKey })); return;
        }
        if (route === '/api/generate') {
          if (!UUID.test(body?.requestId || '')) throw failure('유효한 요청 번호가 필요합니다.');
          if (jobs.has(body.requestId)) { json(200, { job: publicJob(jobs.get(body.requestId)) }); return; }
          if (!apiKey) throw failure('API 키를 먼저 등록해 주세요.', 400, 'missing_api_key');
          const config = validateConfig(body);
          const images = await prepareImages(body);
          if (activeJob) throw failure('진행 중인 이미지가 완료된 뒤 다시 요청해 주세요.', 409, 'busy');
          const job = {
            id: body.requestId, status: 'running', label: config.preset.label,
            createdAt: new Date().toISOString(), model: config.preset.model, quality: config.preset.quality,
            preset: config.preset.id, prompt: config.prompt, size: config.size, background: config.background,
            endpoint: images.length ? '/v1/images/edits' : '/v1/images/generations',
            references: images.map((item, index) => ({ name: item.name, source: item.source, file: `reference-${index + 1}${Object.keys(TYPES).find(ext => TYPES[ext] === item.mime)}` })),
            spec: '문서/00_개발규칙/캐릭터스프라이트제작규약.md',
          };
          activeJob = job;
          try {
            await mkdir(path.join(outputDirectory, job.id));
            for (const [index, item] of images.entries()) await writeFile(path.join(outputDirectory, job.id, job.references[index].file), item.bytes, { flag: 'wx' });
            await writeFile(path.join(outputDirectory, job.id, 'prompt.txt'), job.prompt, { flag: 'wx' });
            await saveJob(job);
          } catch (error) {
            activeJob = null;
            throw failure(error.code === 'EEXIST' ? '같은 요청의 저장 폴더가 이미 있습니다. 자동 재요청하지 않았습니다.' : '요청 기록을 저장할 수 없습니다.', 409, 'save_failed');
          }
          jobs.set(job.id, job);
          json(202, { job: publicJob(job) });
          void run(job, config, images, apiKey);
          return;
        }
        throw failure('요청 경로를 찾을 수 없습니다.', 404);
      }
      if (req.method !== 'GET') throw failure('지원하지 않는 요청입니다.', 405);
      if (route === '/api/status') { json(200, { keyConfigured: Boolean(await getKey()), csrfToken: token, presets: PRESETS, activeJob: activeJob ? publicJob(activeJob) : null }); return; }
      if (route === '/api/references') { json(200, { items: await references() }); return; }
      if (route === '/api/jobs') { json(200, { jobs: [...jobs.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(publicJob) }); return; }
      if (route.startsWith('/api/jobs/')) {
        const job = jobs.get(route.slice('/api/jobs/'.length));
        if (!job) throw failure('요청을 찾을 수 없습니다.', 404);
        json(200, { job: publicJob(job) }); return;
      }
      if (route === '/gallery') { res.writeHead(302, { Location: '/output/characters/char001/gallery.html' }); res.end(); return; }
      const staticFiles = { '/': 'index.html', '/app.js': 'app.js', '/style.css': 'style.css' };
      let absolute, contentType;
      if (staticFiles[route]) {
        absolute = path.join(HERE, 'public', staticFiles[route]);
        contentType = route.endsWith('.js') ? 'text/javascript; charset=utf-8' : route.endsWith('.css') ? 'text/css; charset=utf-8' : 'text/html; charset=utf-8';
      } else if (route === '/output/characters/char001/gallery.html') {
        absolute = await confined(route.slice(1), REFERENCE_ROOT);
        contentType = 'text/html; charset=utf-8';
      } else if (CATALOG_ROOTS.some(folder => route.startsWith('/' + folder + '/')) && CATALOG_TYPES[path.extname(route).toLowerCase()]) {
        const boundary = CATALOG_ROOTS.find(folder => route.startsWith('/' + folder + '/'));
        absolute = await confined(route.slice(1), boundary);
        contentType = CATALOG_TYPES[path.extname(route).toLowerCase()];
      } else if (route.startsWith('/' + OUTPUT + '/')) {
        const pieces = route.slice(OUTPUT.length + 2).split('/');
        if (pieces.length !== 2 || !UUID.test(pieces[0]) || (pieces[1] !== 'metadata.json' && !pieces[1].endsWith('.png'))) throw failure('결과 파일을 찾을 수 없습니다.', 404);
        absolute = await confined(route.slice(1), OUTPUT);
        contentType = route.endsWith('.json') ? 'application/json; charset=utf-8' : 'image/png';
      } else throw failure('페이지를 찾을 수 없습니다.', 404);
      const bytes = await readFile(absolute);
      res.writeHead(200, { 'Content-Type': contentType }); res.end(bytes);
    } catch (error) {
      if (!res.headersSent) json(error.status || 500, { error: { message: error.status ? error.message : '요청을 처리하지 못했습니다.', code: error.code || 'server_error', requestId: error.requestId } });
      else res.end();
    }
  });
  server.requestTimeout = 120_000;
  return { server, listen: () => new Promise((resolve, reject) => { server.once('error', reject); server.listen(port, '127.0.0.1', () => resolve(`http://127.0.0.1:${server.address().port}`)); }) };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const studio = await createStudio();
  try { console.log(`Sunburst 이미지 제작: ${await studio.listen()}`); }
  catch (error) { console.error(error.code === 'EADDRINUSE' ? '8788 포트가 사용 중입니다. 이미 실행 중인 이미지 제작 화면을 확인해 주세요.' : '이미지 제작 서버를 시작하지 못했습니다.'); process.exitCode = 1; }
}

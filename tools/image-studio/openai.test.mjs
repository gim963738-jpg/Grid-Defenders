import test from 'node:test';
import assert from 'node:assert/strict';
import { PRESETS, SIZES, validateConfig, requestImage, checkModels } from './openai.mjs';

const API_KEY = 'sk-unit-test-not-a-real-key';
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZlAAAAABJRU5ErkJggg==', 'base64');
const configFor = (preset = PRESETS[0].id) => validateConfig({ preset, prompt: '  참고 캐릭터의 걷기 자세  ' });
const success = (extra = {}) => new Response(JSON.stringify({ created: 123, data: [{ b64_json: PNG.toString('base64') }], ...extra }), {
  status: 200, headers: { 'Content-Type': 'application/json', 'x-request-id': 'req-test' },
});

test('configuration validates exact choices and trims prompt with defaults', () => {
  assert.deepEqual(validateConfig({ prompt: '  테스트  ' }), { preset: PRESETS[0], prompt: '테스트', size: '1536x1024', background: 'transparent' });
  for (const size of SIZES) assert.equal(validateConfig({ prompt: 'a', size }).size, size);
  for (const background of ['auto', 'opaque', 'transparent']) assert.equal(validateConfig({ prompt: 'a', background }).background, background);
  for (const body of [null, [], {}, { prompt: ' ' }, { prompt: 1 }, { prompt: 'a', preset: 'wrong' }, { prompt: 'a', preset: null }, { prompt: 'a', size: '1x1' }, { prompt: 'a', background: 'green' }, { prompt: 'a'.repeat(32001) }]) {
    assert.throws(() => validateConfig(body), (error) => error.status === 400 && typeof error.code === 'string');
  }
  assert.equal(validateConfig({ prompt: 'a'.repeat(32000) }).prompt.length, 32000);
});

for (const preset of PRESETS) {
  test(`${preset.id} sends one generation with its exact model and quality`, async () => {
    let calls = 0;
    const result = await requestImage({
      apiKey: API_KEY, config: configFor(preset.id),
      fetchImpl: async (url, init) => {
        calls++;
        assert.equal(url, 'https://api.openai.com/v1/images/generations');
        assert.equal(init.method, 'POST');
        assert.equal(init.redirect, 'error');
        assert.ok(init.signal instanceof AbortSignal);
        assert.equal(init.headers.Authorization, `Bearer ${API_KEY}`);
        assert.equal(init.headers['Content-Type'], 'application/json');
        assert.deepEqual(JSON.parse(init.body), {
          model: preset.model, prompt: '참고 캐릭터의 걷기 자세', quality: preset.quality,
          size: '1536x1024', background: 'transparent', output_format: 'png', n: 1,
        });
        return success();
      },
    });
    assert.equal(calls, 1);
    assert.deepEqual(result.bytes, PNG);
    assert.equal(result.requestId, 'req-test');
    assert.equal(result.response.created, 123);
    assert.equal(result.response.usage, undefined);
  });
}

test('reference images use multipart image[] with matching PNG bytes and no legacy fields', async () => {
  let calls = 0;
  await requestImage({
    apiKey: API_KEY, config: configFor('sunburst-2.5-xhigh'),
    images: [{ name: 'C:\\images\\hero.png', mime: 'image/png', bytes: PNG }],
    fetchImpl: async (url, init) => {
      calls++;
      assert.equal(url, 'https://api.openai.com/v1/images/edits');
      assert.equal(init.headers['Content-Type'], undefined);
      assert.ok(init.body instanceof FormData);
      assert.equal(init.body.get('model'), 'gpt-image-2.5-sunburst');
      assert.equal(init.body.get('quality'), 'xhigh');
      assert.equal(init.body.get('background'), 'transparent');
      assert.equal(init.body.get('output_format'), 'png');
      assert.equal(init.body.get('n'), '1');
      for (const field of ['input_fidelity', 'output_compression', 'complexity', 'reasoning', 'images']) assert.equal(init.body.has(field), false);
      const uploaded = init.body.getAll('image[]');
      assert.equal(uploaded.length, 1);
      assert.equal(uploaded[0].name, 'hero.png');
      assert.equal(uploaded[0].type, 'image/png');
      assert.deepEqual(Buffer.from(await uploaded[0].arrayBuffer()), PNG);
      return success();
    },
  });
  assert.equal(calls, 1);
});

test('quota/API failures are not retried and retain status, code and request ID', async () => {
  let calls = 0;
  await assert.rejects(requestImage({
    apiKey: API_KEY, config: configFor(),
    fetchImpl: async () => {
      calls++;
      return new Response(JSON.stringify({ error: { message: 'No credits remain', code: 'credit_balance_exhausted', type: 'insufficient_quota' } }), {
        status: 429, headers: { 'x-request-id': 'req-quota' },
      });
    },
  }), (error) => error.status === 429 && error.code === 'credit_balance_exhausted' && error.type === 'insufficient_quota' && error.requestId === 'req-quota');
  assert.equal(calls, 1);
});

test('remote error messages cannot expose the key or an Authorization header', async () => {
  await assert.rejects(requestImage({
    apiKey: API_KEY, config: configFor(),
    fetchImpl: async () => new Response(JSON.stringify({ error: {
      message: `Invalid key ${API_KEY}; Authorization: Bearer ${API_KEY}\nBearer another-secret`,
      code: `bad_${API_KEY}`, type: `Authorization=${API_KEY}`,
    } }), { status: 401, headers: { 'x-request-id': API_KEY } }),
  }), (error) => {
    const serialized = JSON.stringify({ message: error.message, code: error.code, type: error.type, requestId: error.requestId });
    assert.equal(serialized.includes(API_KEY), false);
    assert.equal(serialized.includes('another-secret'), false);
    assert.equal(serialized.includes('Authorization'), false);
    return error.status === 401;
  });
});

for (const name of ['TypeError', 'TimeoutError', 'AbortError']) {
  test(`${name} reports unknown outcome without retrying or exposing network details`, async () => {
    let calls = 0;
    await assert.rejects(requestImage({
      apiKey: API_KEY, config: configFor(),
      fetchImpl: async () => { calls++; const error = new Error(`Authorization: Bearer ${API_KEY}`); error.name = name; throw error; },
    }), (error) => {
      assert.match(error.message, /처리 결과를 확인할 수 없습니다\. 자동 재시도하지 않았습니다\./);
      assert.equal(error.message.includes(API_KEY), false);
      assert.equal(error.code, 'request_result_unknown');
      return error.status === (name === 'TypeError' ? 502 : 504);
    });
    assert.equal(calls, 1);
  });
}

test('missing, malformed, or non-PNG image data fails without retry', async () => {
  for (const data of [[], [{}], [{ b64_json: 'invalid!' }], [{ b64_json: Buffer.from('not a PNG image').toString('base64') }]]) {
    let calls = 0;
    await assert.rejects(requestImage({ apiKey: API_KEY, config: configFor(), fetchImpl: async () => { calls++; return success({ data }); } }),
      (error) => error.status === 502 && ['invalid_image_response', 'invalid_png_response'].includes(error.code) && error.requestId === 'req-test');
    assert.equal(calls, 1);
  }
});

test('available usage and selected output metadata are preserved', async () => {
  const usage = { input_tokens: 42, output_tokens: 100, total_tokens: 142, input_tokens_details: { image_tokens: 40, text_tokens: 2 } };
  const result = await requestImage({ apiKey: API_KEY, config: configFor(), fetchImpl: async () => success({
    size: '1536x1024', quality: 'high', background: 'transparent', output_format: 'png', usage,
    data: [{ b64_json: PNG.toString('base64'), revised_prompt: 'A preserved reference character' }], unexpected: 'not retained',
  }) });
  assert.deepEqual(result.response, { created: 123, size: '1536x1024', quality: 'high', background: 'transparent', output_format: 'png', usage, revised_prompt: 'A preserved reference character' });
});

test('invalid references and missing keys are rejected before any request', async () => {
  let calls = 0;
  const fetchImpl = async () => { calls++; return success(); };
  await assert.rejects(requestImage({ apiKey: '', config: configFor(), fetchImpl }), { code: 'missing_api_key' });
  for (const images of [null, [{ name: 'hero.gif', mime: 'image/gif', bytes: PNG }], [{ name: 'hero.png', mime: 'image/png', bytes: Buffer.alloc(0) }], Array(17).fill({ name: 'hero.png', mime: 'image/png', bytes: PNG })]) {
    await assert.rejects(requestImage({ apiKey: API_KEY, config: configFor(), images, fetchImpl }), (error) => error.status === 400);
  }
  assert.equal(calls, 0);
});

test('model check lists the two unique models without creating images or claiming credit verification', async () => {
  let calls = 0;
  const result = await checkModels({ apiKey: API_KEY, fetchImpl: async (url, init) => {
    calls++;
    assert.equal(url, 'https://api.openai.com/v1/models');
    assert.equal(init.method, 'GET');
    assert.equal(init.body, undefined);
    assert.equal(init.redirect, 'error');
    return new Response(JSON.stringify({ data: [{ id: 'gpt-image-2.5-sunburst' }, { id: 'unrelated' }] }), { status: 200 });
  } });
  assert.equal(calls, 1);
  assert.deepEqual(result.models, [{ model: 'gpt-image-2.6-sunburst', available: false }, { model: 'gpt-image-2.5-sunburst', available: true }]);
  assert.match(result.message, /크레딧 잔액을 확인한 결과가 아닙니다/);
});

test('malformed model-list response preserves its diagnostic request ID', async () => {
  await assert.rejects(checkModels({ apiKey: API_KEY, fetchImpl: async () => new Response('{}', {
    status: 200, headers: { 'x-request-id': 'req-models-invalid' },
  }) }), (error) => error.status === 502 && error.code === 'invalid_models_response' && error.requestId === 'req-models-invalid');
});

const API_BASE = 'https://api.openai.com/v1';
const REQUEST_TIMEOUT_MS = 10 * 60 * 1000;
const MAX_IMAGE_BYTES = 50_000_000;
const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const IMAGE_MIMES = new Set(['image/png', 'image/jpeg', 'image/webp']);

export const PRESETS = Object.freeze([
  Object.freeze({ id: 'sunburst-2.6-high', label: 'Sunburst 2.6 · High', model: 'gpt-image-2.6-sunburst', quality: 'high' }),
  Object.freeze({ id: 'sunburst-2.5-xhigh', label: 'Sunburst 2.5 · XHigh', model: 'gpt-image-2.5-sunburst', quality: 'xhigh' }),
  Object.freeze({ id: 'sunburst-2.5-high', label: 'Sunburst 2.5 · High', model: 'gpt-image-2.5-sunburst', quality: 'high' }),
]);

export const SIZES = Object.freeze(['1024x1024', '1536x1024', '1024x1536', '2048x1152']);

function failure(message, status, code, requestId = null) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  error.requestId = requestId;
  return error;
}

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function validateConfig(body) {
  if (!isRecord(body)) throw failure('생성 설정이 올바르지 않습니다.', 400, 'invalid_config');
  const presetId = body.preset === undefined ? PRESETS[0].id : body.preset;
  const preset = PRESETS.find((item) => item.id === presetId);
  if (!preset) throw failure('지원하지 않는 이미지 프리셋입니다.', 400, 'invalid_preset');
  if (typeof body.prompt !== 'string' || !body.prompt.trim()) {
    throw failure('이미지 생성 요청을 입력해 주세요.', 400, 'invalid_prompt');
  }
  const prompt = body.prompt.trim();
  if (prompt.length > 32_000) throw failure('요청은 32,000자 이내로 입력해 주세요.', 400, 'prompt_too_long');
  const size = body.size === undefined ? '1536x1024' : body.size;
  if (!SIZES.includes(size)) throw failure('지원하지 않는 이미지 크기입니다.', 400, 'invalid_size');
  const background = body.background === undefined ? 'transparent' : body.background;
  if (!['auto', 'transparent', 'opaque'].includes(background)) {
    throw failure('지원하지 않는 배경 설정입니다.', 400, 'invalid_background');
  }
  return { preset, prompt, size, background };
}

function requireApiKey(apiKey) {
  if (typeof apiKey !== 'string' || !apiKey.trim()) {
    throw failure('서버에 OpenAI API 키를 먼저 설정해 주세요.', 400, 'missing_api_key');
  }
  return apiKey.trim();
}

function redact(value, apiKey) {
  if (typeof value !== 'string') return '';
  return value
    .split(apiKey).join('[REDACTED]')
    .replace(/\bBearer\s+[^\s"',;}]+/gi, 'Bearer [REDACTED]')
    .replace(/\bAuthorization\b\s*["']?\s*[:=]\s*["']?[^\r\n,;}]+/gi, '[REDACTED HEADER]');
}

async function fetchJson({ apiKey, path, init, fetchImpl }) {
  let response;
  let payload;
  try {
    response = await fetchImpl(`${API_BASE}${path}`, {
      ...init,
      headers: { ...init.headers, Authorization: `Bearer ${apiKey}` },
      redirect: 'error',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    const text = await response.text();
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  } catch (cause) {
    const timedOut = cause?.name === 'TimeoutError' || cause?.name === 'AbortError';
    throw failure(
      `${timedOut ? '요청 시간이 초과되었습니다.' : 'OpenAI와의 통신이 중단되었습니다.'} 처리 결과를 확인할 수 없습니다. 자동 재시도하지 않았습니다.`,
      timedOut ? 504 : 502,
      'request_result_unknown',
      response ? redact(response.headers.get('x-request-id'), apiKey) || null : null,
    );
  }
  const requestId = redact(response.headers.get('x-request-id'), apiKey) || null;
  if (!response.ok) {
    const apiError = isRecord(payload?.error) ? payload.error : {};
    const message = redact(apiError.message, apiKey) || 'OpenAI 요청을 완료하지 못했습니다.';
    const code = redact(apiError.code, apiKey) || 'openai_api_error';
    const error = failure(message, response.status, code, requestId);
    if (typeof apiError.type === 'string') error.type = redact(apiError.type, apiKey);
    throw error;
  }
  if (!isRecord(payload)) {
    throw failure('OpenAI 응답을 읽을 수 없습니다. 자동 재시도하지 않았습니다.', 502, 'invalid_api_response', requestId);
  }
  return { payload, requestId };
}

function validateImages(images) {
  if (!Array.isArray(images) || images.length > 16) {
    throw failure('참고 이미지는 최대 16개까지 사용할 수 있습니다.', 400, 'invalid_images');
  }
  for (const image of images) {
    if (!isRecord(image) || typeof image.name !== 'string' || !image.name.trim() || !IMAGE_MIMES.has(image.mime)) {
      throw failure('참고 이미지는 PNG, JPEG 또는 WebP 파일이어야 합니다.', 400, 'invalid_image_type');
    }
    if (!Buffer.isBuffer(image.bytes) || image.bytes.length === 0 || image.bytes.length >= MAX_IMAGE_BYTES) {
      throw failure('각 참고 이미지 파일은 비어 있지 않아야 하며 50MB 미만이어야 합니다.', 400, 'invalid_image_size');
    }
  }
}

export async function requestImage({ apiKey, config, images = [], fetchImpl = globalThis.fetch }) {
  const key = requireApiKey(apiKey);
  const normalized = validateConfig({ ...config, preset: config?.preset?.id ?? config?.preset });
  validateImages(images);
  const fields = {
    model: normalized.preset.model,
    prompt: normalized.prompt,
    quality: normalized.preset.quality,
    size: normalized.size,
    background: normalized.background,
    output_format: 'png',
    n: 1,
  };
  let path;
  let init;
  if (images.length === 0) {
    path = '/images/generations';
    init = { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(fields) };
  } else {
    path = '/images/edits';
    const form = new FormData();
    for (const [name, value] of Object.entries(fields)) form.append(name, String(value));
    for (const image of images) {
      const name = image.name.split(/[\\/]/).pop();
      form.append('image[]', new Blob([image.bytes], { type: image.mime }), name);
    }
    init = { method: 'POST', body: form };
  }
  const { payload, requestId } = await fetchJson({ apiKey: key, path, init, fetchImpl });
  const image = payload.data?.[0];
  const encoded = image?.b64_json;
  if (typeof encoded !== 'string' || !encoded || encoded.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) {
    throw failure('OpenAI 응답에 올바른 이미지 데이터가 없습니다. 자동 재시도하지 않았습니다.', 502, 'invalid_image_response', requestId);
  }
  const bytes = Buffer.from(encoded, 'base64');
  if (bytes.length < PNG_SIGNATURE.length || !bytes.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)) {
    throw failure('OpenAI가 PNG 형식의 이미지를 반환하지 않았습니다. 자동 재시도하지 않았습니다.', 502, 'invalid_png_response', requestId);
  }
  const metadata = {};
  for (const field of ['created', 'size', 'quality', 'background', 'output_format', 'model']) {
    if (typeof payload[field] === 'string' || typeof payload[field] === 'number') metadata[field] = payload[field];
  }
  if (isRecord(payload.usage)) metadata.usage = payload.usage;
  if (typeof image.revised_prompt === 'string') metadata.revised_prompt = image.revised_prompt;
  return { bytes, response: metadata, requestId };
}

export async function checkModels({ apiKey, fetchImpl = globalThis.fetch }) {
  const key = requireApiKey(apiKey);
  const { payload, requestId } = await fetchJson({ apiKey: key, path: '/models', init: { method: 'GET' }, fetchImpl });
  if (!Array.isArray(payload.data)) {
    throw failure('OpenAI 모델 목록을 읽을 수 없습니다.', 502, 'invalid_models_response', requestId);
  }
  const listedModels = new Set(payload.data.map((item) => item?.id).filter((id) => typeof id === 'string'));
  return {
    models: [...new Set(PRESETS.map((preset) => preset.model))].map((model) => ({ model, available: listedModels.has(model) })),
    message: '모델 목록에 포함되어 있는지만 확인했습니다. 이미지 생성 성공, 과금 여부 또는 크레딧 잔액을 확인한 결과가 아닙니다.',
  };
}

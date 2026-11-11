export function clamp(value, min, max) { return Math.min(max, Math.max(min, Number(value) || min)); }

export function parseSequence(text, count) {
  if (!String(text).trim()) return [];
  const result = [];
  for (const token of String(text).split(/[,，\s]+/).filter(Boolean)) {
    const match = /^(\d+)(?:[-~](\d+))?$/.exec(token);
    if (!match) throw new Error('프레임 번호 또는 범위를 입력하세요');
    const from = Number(match[1]), to = match[2] ? Number(match[2]) : from;
    if (from < 1 || to < 1 || from > count || to > count) throw new Error(`프레임은 1~${count} 범위입니다`);
    const step = from <= to ? 1 : -1;
    for (let n = from; ; n += step) {
      result.push(n);
      if (result.length > 4096) throw new Error('재생 순서는 4096개 이내입니다');
      if (n === to) break;
    }
  }
  return result;
}

export function sheetRect(width, height, layout, frame) {
  const columns = Math.trunc(clamp(layout.columns, 1, 128)), rows = Math.trunc(clamp(layout.rows, 1, 128));
  const count = Math.trunc(clamp(layout.count || columns * rows, 1, columns * rows));
  if (!Number.isInteger(frame) || frame < 1 || frame > count) throw new Error('유효하지 않은 프레임');
  if (layout.rects?.[frame - 1]) {
    const [x, y, w, h] = layout.rects[frame - 1];
    if (![x, y, w, h].every(Number.isFinite) || x < 0 || y < 0 || w < 1 || h < 1 || x + w > width || y + h > height) throw new Error('프레임 영역이 이미지 범위를 벗어납니다');
    return { x, y, width: w, height: h };
  }
  const mx = Math.max(0, Number(layout.marginX) || 0), my = Math.max(0, Number(layout.marginY) || 0);
  const sx = Math.max(0, Number(layout.spacingX) || 0), sy = Math.max(0, Number(layout.spacingY) || 0);
  const availableW = width - mx * 2 - sx * (columns - 1), availableH = height - my * 2 - sy * (rows - 1);
  if (availableW < columns || availableH < rows) throw new Error('칸 수·여백을 확인하세요');
  const col = (frame - 1) % columns, row = Math.floor((frame - 1) / columns);
  const left = mx + Math.floor(col * availableW / columns) + col * sx;
  const top = my + Math.floor(row * availableH / rows) + row * sy;
  return { x: left, y: top, width: Math.floor((col + 1) * availableW / columns) - Math.floor(col * availableW / columns),
    height: Math.floor((row + 1) * availableH / rows) - Math.floor(row * availableH / rows) };
}

export function autoMode(collection, asset) {
  const reference = asset?.referenceId || collection.referenceId;
  return reference && collection.assets.some(a => a.id === reference && a.id !== asset.id) ? 'compare' : 'gallery';
}

export function validateCollection(input) {
  if (!input || !Array.isArray(input.assets) || !input.assets.length || input.assets.length > 2000) throw new Error('이미지가 있는 뷰어 JSON이 필요합니다');
  const ids = new Set();
  for (const a of input.assets) {
    if (!a.id || ids.has(a.id) || typeof a.src !== 'string') throw new Error('이미지 ID·경로를 확인하세요');
    ids.add(a.id);
    if (a.src.startsWith('//') || !/^(?:\.?\.?\/|\/|blob:|https?:)/.test(a.src)) throw new Error('지원하지 않는 이미지 경로');
    if (/^https?:/.test(a.src) && typeof location !== 'undefined' && new URL(a.src).origin !== location.origin) throw new Error('같은 사이트의 이미지 경로를 사용하세요');
  }
  if (input.referenceId && !ids.has(input.referenceId)) throw new Error('비교 기준 이미지를 찾을 수 없습니다');
  for (const a of input.assets) if (a.referenceId && !ids.has(a.referenceId)) throw new Error('비교 기준 이미지를 찾을 수 없습니다');
  const assets = input.assets.map(a => {
    let sheet = a.sheet;
    if (sheet) {
      const { columns, rows } = sheet, count = sheet.count || columns * rows;
      if (![columns, rows, count].every(Number.isInteger) || columns < 1 || columns > 128 || rows < 1 || rows > 128 || count < 1 || count > Math.min(4096, columns * rows)) throw new Error('시트 칸 수·프레임 수를 확인하세요');
      sheet = { ...sheet, count };
    }
    return { ...a, label: String(a.label || a.id), ...(sheet ? { sheet } : {}) };
  });
  return { ...input, assets };
}

export function transformPixels(data, width, height, effect, strength) {
  const out = new Uint8ClampedArray(data), amount = clamp(strength, 0, 100) / 100;
  if (!amount || effect === 'original' || effect === 'blur') return out;
  const index = (x, y) => (Math.min(height - 1, Math.max(0, y)) * width + Math.min(width - 1, Math.max(0, x))) * 4;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const i = (y * width + x) * 4;
    if (effect === 'rough') {
      const offset = Math.round(Math.sin(y * 1.7 + Math.floor(x / 7)) * amount * 2);
      const j = index(x + offset, y);
      for (let c = 0; c < 4; c++) out[i + c] = data[j + c];
      continue;
    }
    if (!data[i + 3]) continue;
    for (let c = 0; c < 3; c++) {
      const neighbors = [index(x - 1, y), index(x + 1, y), index(x, y - 1), index(x, y + 1)];
      const sum = neighbors.reduce((n, j) => n + (data[j + 3] ? data[j + c] : data[i + c]), 0);
      if (effect === 'clean') out[i + c] = data[i + c] * (1 + 4 * amount) - sum * amount;
      else if (effect === 'sketch') {
        const edge = Math.min(255, Math.abs(4 * data[i + c] - sum) * (1 + amount * 3));
        out[i + c] = 245 - edge;
      }
    }
  }
  return out;
}

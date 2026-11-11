import { sheetRect, transformPixels } from './core.js';

const images = new Map(), previews = new Map();
export function clearPreviews() { previews.clear(); }
export async function loadImage(src) {
  if (!images.has(src)) {
    const promise = new Promise((resolve, reject) => {
      const image = new Image(); image.decoding = 'async';
      image.onload = () => resolve(image); image.onerror = () => { images.delete(src); reject(new Error('이미지를 불러올 수 없습니다')); };
      image.src = src;
    });
    images.set(src, promise);
    if (images.size > 24) images.delete(images.keys().next().value);
  }
  return images.get(src);
}
function canvas(w, h) {
  const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c;
}

export async function preview(asset, frame, settings, cap = 2048) {
  const key = JSON.stringify([asset.src, asset.sheet, frame, settings, cap]);
  if (previews.has(key)) return previews.get(key);
  const pending = render(asset, frame, settings, cap).catch(error => { previews.delete(key); throw error; });
  previews.set(key, pending);
  if (previews.size > 48) previews.delete(previews.keys().next().value);
  return pending;
}

async function render(asset, frame, s, cap) {
  const image = await loadImage(asset.src);
  const rect = frame && asset.sheet ? sheetRect(image.naturalWidth, image.naturalHeight, asset.sheet, frame)
    : { x: 0, y: 0, width: image.naturalWidth, height: image.naturalHeight };
  const factor = Math.min(1, cap / Math.max(rect.width, rect.height));
  const w = Math.max(1, Math.round(rect.width * factor)), h = Math.max(1, Math.round(rect.height * factor));
  const base = canvas(w, h), ctx = base.getContext('2d', { willReadFrequently: true });
  ctx.imageSmoothingEnabled = s.smooth; ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(image, rect.x, rect.y, rect.width, rect.height, 0, 0, w, h);
  if (s.resolution < 100) {
    const small = canvas(w * s.resolution / 100, h * s.resolution / 100), sc = small.getContext('2d');
    sc.imageSmoothingEnabled = s.smooth; sc.imageSmoothingQuality = 'high'; sc.drawImage(base, 0, 0, small.width, small.height);
    ctx.clearRect(0, 0, w, h); ctx.drawImage(small, 0, 0, w, h);
  }
  if (s.quality < 100) {
    const original = ctx.getImageData(0, 0, w, h);
    const blob = await new Promise(resolve => base.toBlob(resolve, 'image/jpeg', s.quality / 100));
    if (!blob) throw new Error('압축 미리보기를 만들 수 없습니다');
    const bitmap = await createImageBitmap(blob);
    ctx.clearRect(0, 0, w, h); ctx.drawImage(bitmap, 0, 0); bitmap.close();
    const compressed = ctx.getImageData(0, 0, w, h);
    for (let i = 3; i < compressed.data.length; i += 4) compressed.data[i] = original.data[i];
    ctx.putImageData(compressed, 0, 0);
  }
  if (s.effect === 'blur' && s.strength) {
    const copy = canvas(w, h); copy.getContext('2d').drawImage(base, 0, 0);
    ctx.clearRect(0, 0, w, h); ctx.filter = `blur(${s.strength / 28}px)`; ctx.drawImage(copy, 0, 0); ctx.filter = 'none';
  } else if (s.effect !== 'original') {
    const pixels = ctx.getImageData(0, 0, w, h);
    pixels.data.set(transformPixels(pixels.data, w, h, s.effect, s.strength)); ctx.putImageData(pixels, 0, 0);
  }
  return { canvas: base, nativeWidth: rect.width, nativeHeight: rect.height, fullWidth: image.naturalWidth, fullHeight: image.naturalHeight };
}

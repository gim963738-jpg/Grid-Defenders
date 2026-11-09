import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const directory = path.dirname(fileURLToPath(import.meta.url));
const table = Array.from({ length: 256 }, (_, i) => {
  let value = i;
  for (let bit = 0; bit < 8; bit++) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  return value >>> 0;
});
function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) crc = table[(crc ^ byte) & 255] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const body = Buffer.concat([Buffer.from(type), data]);
  const header = Buffer.alloc(4), checksum = Buffer.alloc(4);
  header.writeUInt32BE(data.length); checksum.writeUInt32BE(crc32(body));
  return Buffer.concat([header, body, checksum]);
}
function readChunks(buffer) {
  const chunks = [];
  for (let offset = 8; offset < buffer.length;) {
    const size = buffer.readUInt32BE(offset);
    chunks.push({ type: buffer.toString('ascii', offset + 4, offset + 8), data: buffer.subarray(offset + 8, offset + 8 + size) });
    offset += size + 12;
  }
  return chunks;
}
const frames = Array.from({ length: 20 }, (_, i) => readChunks(fs.readFileSync(path.join(directory, 'frames', `connected-walk-${String(i + 1).padStart(2, '0')}.png`))));
const header = frames[0].find(c => c.type === 'IHDR').data;
if (header.readUInt32BE(0) !== 256 || header.readUInt32BE(4) !== 256) throw Error('Unexpected frame size');
if (!frames.every(frame => frame.find(c => c.type === 'IHDR').data.equals(header))) throw Error('Mismatched PNG formats');
const animationControl = Buffer.alloc(8); animationControl.writeUInt32BE(20, 0); animationControl.writeUInt32BE(1, 4);
const output = [Buffer.from([137,80,78,71,13,10,26,10]), chunk('IHDR', header), chunk('acTL', animationControl)];
for (const sourceChunk of frames[0]) if (['sRGB', 'gAMA', 'cHRM', 'pHYs'].includes(sourceChunk.type)) output.push(chunk(sourceChunk.type, sourceChunk.data));
let sequence = 0;
for (let index = 0; index < 20; index++) {
  const control = Buffer.alloc(26);
  control.writeUInt32BE(sequence++, 0); control.writeUInt32BE(256, 4); control.writeUInt32BE(256, 8);
  // Alternate 66/67ms delays so this one-shot forward stepping segment totals 1333ms (20 frames at 15fps).
  const durationMs = Math.round((index + 1) * 1000 / 15) - Math.round(index * 1000 / 15);
  control.writeUInt16BE(durationMs, 20); control.writeUInt16BE(1000, 22);
  // Full RGBA frame replaces the previous one, including transparent pixels.
  control[24] = 0; control[25] = 0;
  output.push(chunk('fcTL', control));
  for (const imageData of frames[index].filter(c => c.type === 'IDAT')) {
    if (index === 0) output.push(chunk('IDAT', imageData.data));
    else { const number = Buffer.alloc(4); number.writeUInt32BE(sequence++); output.push(chunk('fdAT', Buffer.concat([number, imageData.data]))); }
  }
}
output.push(chunk('IEND', Buffer.alloc(0)));
const encoded = Buffer.concat(output);
fs.writeFileSync(path.join(directory, 'connected-walk-animated.png'), encoded);
console.log(JSON.stringify({ file: 'connected-walk-animated.png', frameCount: 20, fps: 15, durationMs: 1333, loops: 'once', bytes: encoded.length }));





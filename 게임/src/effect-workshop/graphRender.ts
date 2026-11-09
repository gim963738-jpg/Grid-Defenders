import type { EffectGraph, EffectNode } from './graphModel';

export const graphCanvas = (size: number): HTMLCanvasElement => { const c = document.createElement('canvas'); c.width = c.height = size; return c; };
/** Image graph evaluation is memoized per frame, so branches share their source raster. */
export function evaluateGraph(graph: EffectGraph, size: number, time: number, source: (node: EffectNode) => HTMLCanvasElement, allNodes = false, targetId?: string): { output: HTMLCanvasElement; images: Map<string, HTMLCanvasElement> } {
  const images = new Map<string, HTMLCanvasElement>(), active = new Set<string>();
  const nodes = new Map(graph.nodes.map(n => [n.id, n])), inputs = new Map(graph.links.map(e => [`${e.to}:${e.port}`, e.from]));
  const render = (id: string): HTMLCanvasElement => {
    const cached = images.get(id); if (cached) return cached;
    if (active.has(id)) throw Error('순환 노드 연결을 렌더링할 수 없습니다.'); active.add(id);
    const node = nodes.get(id); if (!node) return graphCanvas(size);
    const output = ['layer', 'drawing', 'sequence', 'component'].includes(node.type) ? source(node) : graphCanvas(size);
    const ctx = output.getContext('2d')!, p = node.params;
    const input = (port: string) => { const from = inputs.get(`${node.id}:${port}`); return from ? render(from) : null; };
    const image = ['layer', 'drawing', 'sequence', 'component', 'blend', 'mask'].includes(node.type) ? null : input('image');
    if (node.type === 'blend' || node.type === 'mask') {
      const a = input('a'), b = input('b');
      if (a) ctx.drawImage(a, 0, 0);
      if (node.type === 'mask') { if (b && a) { ctx.globalCompositeOperation = 'destination-in'; ctx.drawImage(b, 0, 0); } else ctx.clearRect(0, 0, size, size); }
      else if (b) { ctx.globalCompositeOperation = p.mode === 'add' ? 'lighter' : p.mode === 'normal' ? 'source-over' : p.mode; ctx.globalAlpha = p.amount; ctx.drawImage(b, 0, 0); }
    } else if (image) {
      if (node.type === 'transform') { ctx.translate(size * (.5 + p.x), size * (.5 + p.y)); ctx.rotate(p.rotation * Math.PI / 180); ctx.scale(p.scale, p.scale); ctx.drawImage(image, -size / 2, -size / 2); }
      else if (node.type === 'glow') { ctx.filter = `blur(${p.blur * size / 128}px)`; ctx.globalAlpha = p.amount; ctx.drawImage(image, 0, 0); ctx.filter = 'none'; ctx.globalAlpha = 1; ctx.drawImage(image, 0, 0); }
      else {
        if (node.type === 'opacity') ctx.globalAlpha = p.amount;
        if (node.type === 'fade') ctx.globalAlpha = time <= p.start || time >= p.end ? 0 : Math.min(1, (time - p.start) * 12, (p.end - time) * 12);
        ctx.drawImage(image, 0, 0);
        if (node.type === 'tint') {
          const data = ctx.getImageData(0, 0, size, size), rgb = [1, 3, 5].map(i => parseInt(p.color.slice(i, i + 2), 16));
          for (let i = 0; i < data.data.length; i += 4) for (let c = 0; c < 3; c++) data.data[i + c] = data.data[i + c] * (1 - p.amount) + rgb[c] * p.amount;
          ctx.putImageData(data, 0, 0);
        }
      }
    }
    active.delete(id); images.set(id, output); return output;
  };
  const id = targetId ?? graph.nodes.find(n => n.type === 'output')!.id;
  const output = render(id); if (allNodes) graph.nodes.forEach(n => render(n.id));
  return { output, images };
}

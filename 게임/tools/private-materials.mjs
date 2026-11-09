import { createReadStream } from 'node:fs';
import { realpath, stat } from 'node:fs/promises';
import { resolve, relative, extname, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Dev-only, read-only route. Art never enters Vite's public directory or build. */
export function privateMaterials() {
  const root = fileURLToPath(new URL('../../.local/effect-materials/', import.meta.url));
  const local = h => /^(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/.test(h || '');
  return { name: 'private-effect-materials', apply: 'serve', configureServer(server) {
    server.middlewares.use('/__materials', async (req, res) => {
      try {
        if (!local(req.headers.host) || (req.headers.origin && !local(new URL(req.headers.origin).host))) { res.statusCode = 403; res.end(); return; }
        if (!['GET', 'HEAD'].includes(req.method)) { res.statusCode = 405; res.end(); return; }
        const key = decodeURIComponent((req.url || '/').split('?')[0]).replace(/^\/+/, '');
        if (!/^(catalog\.json|validation\.json|CREDITS\.txt|normalized\/[a-zA-Z0-9/_-]+\.(png|jpg)|originals\/[^\0]+\.(png|gif|txt)|archives\/[^\0]+\.(zip|png|gif|psd))$/.test(key)) { res.statusCode = 404; res.end(); return; }
        const base = await realpath(root), path = await realpath(resolve(base, key)), rel = relative(base, path);
        if (rel.startsWith('..') || isAbsolute(rel)) { res.statusCode = 403; res.end(); return; }
        const info = await stat(path); if (!info.isFile()) { res.statusCode = 404; res.end(); return; }
        res.setHeader('Content-Type', { '.json':'application/json; charset=utf-8','.txt':'text/plain; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.gif':'image/gif','.zip':'application/zip' }[extname(path)] || 'application/octet-stream');
        res.setHeader('Cache-Control', 'private, no-cache'); res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Content-Length', info.size);
        if (key.startsWith('archives/')) res.setHeader('Content-Disposition', "attachment; filename*=UTF-8''" + encodeURIComponent(key.split('/').at(-1)));
        if (req.method === 'HEAD') res.end(); else createReadStream(path).on('error', () => res.destroy()).pipe(res);
      } catch { res.statusCode = 404; res.end('Local material file not found'); }
    });
  }};
}

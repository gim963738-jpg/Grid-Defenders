import { readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

// Use the same TypeScript and import.meta.env transforms as the application.
// DOM, canvas and image assertions stay in a real browser; do not fake those APIs.
const root = fileURLToPath(new URL('../', import.meta.url));
const models = [
  'visual-spacing', 'runtime-motion', 'assassin-combat', 'battle-formation', 'battle-save', 'blade-skill', 'boss-battle', 'boss-formation',
  'boss-dps-history', 'boss-roster-ice', 'boss-skills', 'boss-test-balance',
  'boss-wave-auto', 'camp-progress', 'combat-playback', 'damage-meter',
  'defense-field-layout', 'dev-gear', 'dev-placement', 'dps-window',
  'fire-ground', 'fire-skill', 'game-run', 'hero-critical', 'ice-attack',
  'landscape-field', 'landscape-inventory', 'peak-dps', 'sword-attack', 'training',
  'wave-ranged-skill', 'wave-warning',
];
const browserOnly = [
  'actor-depth', 'assassin-visual', 'battle-continuation', 'blade-visual',
  'blond-warrior', 'boss-hero-cards', 'damage-visibility', 'fire-visual',
  'gale-art', 'hero-art', 'render-quality', 'shop-equip', 'skill-visual',
  'slime-art', 'sword-visual',
];
// This suite explicitly checks the legacy 390 x 430 field and its 100 px canopy.
const portraitOnly = new Set(['defense-field-layout']);
const known = new Set([...models, ...browserOnly].map(name => `${name}.check.ts`));
const files = (await readdir(new URL('../tests/', import.meta.url)))
  .filter(name => name.endsWith('.check.ts'));
const missing = files.filter(name => !known.has(name));
const stale = [...known].filter(name => !files.includes(name));
if (missing.length || stale.length) {
  throw Error(`Update test classification. Unclassified: ${missing.join(', ') || 'none'}; missing files: ${stale.join(', ') || 'none'}`);
}
const requested = process.argv.slice(2);
if (requested.length > 1 || requested.some(arg => !['portrait', 'landscape'].includes(arg))) {
  throw Error('Usage: npm test -- [portrait|landscape]. Omit the layout to run both.');
}
const layouts = requested.length ? requested : ['portrait', 'landscape'];
const previousLocation = Object.getOwnPropertyDescriptor(globalThis, 'location');
const previousStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
let suites = 0, assertions = 0, failures = 0;
try {
  // Model suites inject their own stores. Never touch Node's optional persistent store.
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: undefined });
  for (const layout of layouts) {
    Object.defineProperty(globalThis, 'location', {
      configurable: true,
      value: new URL(layout === 'landscape' ? 'http://test.local/battle-landscape.html' : 'http://test.local/index.html'),
    });
    // Separate module graphs ensure layout-sensitive constants are evaluated afresh.
    const server = await createServer({
      root, cacheDir:fileURLToPath(new URL('../.qa-cache/'+layout+'/',import.meta.url)), configFile: false, logLevel: 'error', appType: 'custom',
      server: { host:'127.0.0.1',port:0,watch:null,hmr:false },
    });
    await server.listen();
    try {
      for (const name of models) {
        if (layout !== 'portrait' && portraitOnly.has(name)) {
          console.log(`NOT APPLICABLE ${layout}/${name}: legacy portrait field geometry`);
          continue;
        }
        try {
          const exports = await server.ssrLoadModule(`/tests/${name}.check.ts`);
          const checks = Object.entries(exports).filter(([key, value]) => key.startsWith('check') && typeof value === 'function');
          if (checks.length !== 1) throw Error(`Expected one check function; found ${checks.length}`);
          const results = await checks[0][1]();
          if (!Array.isArray(results) || !results.length || results.some(result => typeof result !== 'string')) {
            throw Error('A suite must return its nonempty list of successful assertion names');
          }
          suites++; assertions += results.length;
          console.log(`PASS ${layout}/${name}: ${results.length}`);
        } catch (error) {
          failures++;
          console.error(`FAIL ${layout}/${name}: ${error instanceof Error ? error.stack : error}`);
        }
      }
    } finally {
      await server.close();
    }
  }
} finally {
  if (previousLocation) Object.defineProperty(globalThis, 'location', previousLocation);
  else delete globalThis.location;
  if (previousStorage) Object.defineProperty(globalThis, 'localStorage', previousStorage);
  else delete globalThis.localStorage;
}
console.log(`\nModel results: ${assertions} assertions in ${suites} passed suites; ${failures} failed suites.`);
console.log(`NOT RUN: ${browserOnly.length} browser suites need real DOM/canvas/images/WebGL:\n${browserOnly.map(name => `  tests/${name}.check.ts`).join('\n')}`);
if (failures) process.exitCode = 1;

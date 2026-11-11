/*
 * Run only in a dedicated, blank page served by the existing game Vite server.
 * Open /tests/browser-check.html on the game Vite server. These checks use the
 * legacy portrait geometry. This does not import main.ts or start a saved game.
 *
 * PowerShell / Orca example (replace the dedicated page id, not the user's tab):
 * $auditExpression = Get-Content -LiteralPath '<this file>' -Raw -Encoding utf8
 * & '<orca.exe>' eval --page '<dedicated-page-id>' --expression $auditExpression --json
 * & '<orca.exe>' eval --page '<dedicated-page-id>' --expression 'window.audit' --json
 *
 * Do not execute this in an active game tab: it replaces that page's body.
 */
(() => {
  if (location.pathname !== '/tests/browser-check.html') {
    throw new Error('Use only the dedicated /tests/browser-check.html page.');
  }
  if (window.audit?.running) throw new Error('Browser checks already running.');
  const suites = [
    'actor-depth', 'battle-continuation', 'blond-warrior', 'boss-hero-cards',
    'damage-visibility', 'gale-art', 'hero-art', 'render-quality',
    'shop-equip', 'skill-visual', 'slime-art',
  ];
  window.audit = {
    schema_version: 1,
    started_at_utc: new Date().toISOString(),
    running: true,
    done: false,
    scope: 'isolated browser page with script-free index.html DOM and real CSS; default portrait module geometry',
    application_entrypoints_imported: false,
    persistent_storage_operations: [],
    results: [],
    visual_gallery_checks_not_run: [
      'assassin-visual', 'blade-visual', 'fire-visual', 'sword-visual',
    ],
    visual_gallery_checks_not_run_reason: 'These exports generate visual galleries for human review rather than returning assertion results; they were not executed in this automated browser pass.',
  };
  void (async () => {
    // Test models use injected stores. Block accidental persistent writes in this
    // dedicated browser realm; never write, remove or clear the player's data.
    const storageMethods = new Map();
    for (const method of ['setItem', 'removeItem', 'clear']) {
      storageMethods.set(method, Object.getOwnPropertyDescriptor(Storage.prototype, method));
      Object.defineProperty(Storage.prototype, method, {
        configurable: true,
        writable: true,
        value(...args) {
          window.audit.persistent_storage_operations.push({ method, key: args[0] ?? null });
          throw new Error(`Persistent storage ${method} is blocked in the audit page.`);
        },
      });
    }
    try {
      const response = await fetch('/index.html');
      if (!response.ok) throw new Error(`Fixture HTML: HTTP ${response.status}`);
      const template = new DOMParser().parseFromString(await response.text(), 'text/html');
      template.querySelectorAll('script').forEach(script => script.remove());
      await Promise.all(['/src/style.css', '/src/mobile-ui.css'].map(href => new Promise((resolve, reject) => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        link.dataset.auditStylesheet = 'true';
        link.onload = resolve;
        link.onerror = () => reject(new Error(`Fixture stylesheet failed: ${href}`));
        document.head.append(link);
      })));
      for (const name of suites) {
        document.body.replaceChildren(...Array.from(template.body.childNodes, node => node.cloneNode(true)));
        document.body.removeAttribute('style');
        document.body.dataset.auditSuite = name;
        try {
          const module = await import(`/tests/${name}.check.ts?audit=${Date.now()}`);
          const checks = Object.entries(module).filter(([key, value]) => key.startsWith('check') && typeof value === 'function');
          if (checks.length !== 1) throw new Error(`Expected one check export, found ${checks.length}.`);
          const results = await checks[0][1]();
          if (!Array.isArray(results) || !results.length || results.some(result => typeof result !== 'string')) {
            throw new Error('A check must return its nonempty list of assertion names.');
          }
          window.audit.results.push({ name, status: 'PASS', assertions: results.length, checks: results });
        } catch (error) {
          window.audit.results.push({ name, status: 'FAIL', error: String(error), stack: error?.stack ?? null });
        }
      }
    } finally {
      for (const [method, descriptor] of storageMethods) Object.defineProperty(Storage.prototype, method, descriptor);
    }
    window.audit.passed_suites = window.audit.results.filter(result => result.status === 'PASS').length;
    window.audit.failed_suites = window.audit.results.filter(result => result.status === 'FAIL').length;
    window.audit.passed_assertions = window.audit.results.reduce((sum, result) => sum + (result.assertions ?? 0), 0);
    window.audit.finished_at_utc = new Date().toISOString();
    window.audit.running = false;
    window.audit.done = true;
  })().catch(error => {
    window.audit.infrastructure_error = { error: String(error), stack: error?.stack ?? null };
    window.audit.finished_at_utc = new Date().toISOString();
    window.audit.running = false;
    window.audit.done = true;
  });
  return { started: true, suite_count: suites.length, result: 'window.audit' };
})();

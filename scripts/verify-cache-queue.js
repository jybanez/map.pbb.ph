async page => {
  const context = await page.context().browser().newContext({ serviceWorkers: 'block' });
  const probe = await context.newPage(); await probe.goto('https://map.pbb.ph/');
  try { return await probe.evaluate(async () => {
    const { createMapCacheStore } = await import('./assets/map-cache-store.js?queue-diagnostics=1');
    const name = 'pbb-queue-probe-' + crypto.randomUUID(); let release;
    const gate = new Promise(resolve => { release = resolve; });
    const store = createMapCacheStore({ cacheName: name, databaseName: name, locks: { async request(n, fn) { await gate; return fn(); } } });
    const jobs = Array.from({ length: 32 }, (_, i) => store.write('burst' + i, new Response('tile'), 4));
    const target = 'https://mapserver.pbb.ph|pbb-mapserver-20261011-v1|https://mapserver.pbb.ph/tiles/vector/13/6914/3860.pbf';
    const duringBurst = await store.write(target, new Response('tile'), 4);
    release(); await Promise.all(jobs); await store.flush();
    const missing = !(await store.read(target));
    const retry = await store.write(target, new Response('tile'), 4); await store.flush();
    const recovered = !!(await store.read(target));
    if (duringBurst !== false || !missing || !retry || !recovered || store.diagnostics.skippedQueue !== 1) throw new Error('Queue reproduction failed');
    const result = { duringBurst, missingAfterBurst: missing, savedAfterLaterRequest: recovered, diagnostics: store.diagnostics };
    await caches.delete(name); return result;
  }); } finally { await context.close(); }
}

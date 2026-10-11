async page => {
  await page.goto('https://map.pbb.ph/');
  await page.waitForTimeout(5000);
  return await page.evaluate(async () => {
    const { createMapResourceCache } = await import('./assets/map-resource-cache.js?v=20261011-map-cache4');
    const server = 'https://mapserver.pbb.ph', url = server + '/tiles/vector/13/6914/3860.pbf', dataset = 'pbb-mapserver-20261011-v1';
    let calls = 0, offline = false, admission;
    const cache = createMapResourceCache({ server, dataset, fetcher: async (u, options) => {
      calls++; if (offline) throw new Error('MapServer blocked offline');
      const r = await fetch(u, options); admission = { status: r.status, mime: r.headers.get('content-type'), cacheControl: r.headers.get('cache-control'), cors: r.type, finalURL: r.url }; return r;
    } });
    const first = new Uint8Array((await cache.load(url)).data); await cache.store.flush();
    const db = await new Promise((resolve, reject) => { const r = indexedDB.open('pbb-map-resource-index-v1'); r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error); });
    const id = server + '|' + dataset + '|' + url;
    const row = await new Promise(resolve => { const r = db.transaction('entries').objectStore('entries').get(id); r.onsuccess = () => resolve(r.result); }); db.close();
    if (!row) throw new Error('Exact vector metadata missing after flush');
    const saved = await (await caches.open('pbb-map-resources-v1')).match(row.key);
    const storedBytes = new Uint8Array(await saved.arrayBuffer());
    const before = calls;
    let handler; cache.install({ addProtocol(name, fn) { if (name !== 'pbbcache') throw new Error('Wrong protocol'); handler = fn; } });
    const routed = cache.transformRequest(url).url;
    const repeat = new Uint8Array((await handler({ url: routed }, new AbortController())).data);
    offline = true;
    const offlineBytes = new Uint8Array((await cache.load(url)).data);
    const equal = bytes => bytes.length === first.length && bytes.every((b, i) => b === first[i]);
    if (calls !== before || !equal(storedBytes) || !equal(repeat) || !equal(offlineBytes)) throw new Error('Exact vector caching failed');
    const registrations = await navigator.serviceWorker.getRegistrations();
    const result = { url, routed, admission, bytes: first.length, metadata: row, repeatAndOfflineFetches: calls - before, bytesEqual: true, stats: cache.stats, storage: cache.store.diagnostics, runtimeScripts: [...document.scripts].map(s => s.src).filter(Boolean), shellCaches: (await caches.keys()).filter(k => k.startsWith('pbb-map-shell-')), serviceWorkers: registrations.map(r => ({ active: r.active?.scriptURL, waiting: r.waiting?.scriptURL })) };
    cache.destroy(); return result;
  });
}

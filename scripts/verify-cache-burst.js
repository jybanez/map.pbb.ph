async page => {
  const context = await page.context().browser().newContext({ serviceWorkers: 'block' });
  const probe = await context.newPage(); await probe.goto('https://map.pbb.ph/');
  try { return await probe.evaluate(async () => {
    const { createMapCacheStore } = await import('./assets/map-cache-store.js?v=20261011-map-cache4');
    const { createMapResourceCache } = await import('./assets/map-resource-cache.js?v=20261011-map-cache4');
    const name = 'pbb-burst-' + crypto.randomUUID(), server = 'https://mapserver.pbb.ph';
    const base = server + '/tiles/vector/13/6914/3860.pbf';
    const store = createMapCacheStore({ cacheName: name, databaseName: name });
    let pending = 0, peak = 0, calls = 0, offline = false;
    const delayed = { ...store, async write(...args) { pending++; peak = Math.max(peak, pending); await new Promise(resolve => setTimeout(resolve, 80)); try { return await store.write(...args); } finally { pending--; } } };
    const cache = createMapResourceCache({ server, dataset: 'burst', store: delayed, fetcher: async (url, options) => { calls++; if (offline) throw Error('offline'); return fetch(url, options); } });
    const urls = Array.from({ length: 48 }, (_, i) => base + '?burst=' + i);
    const jobs = urls.map(url => cache.load(url));
    const abort = new AbortController(), cancelled = cache.load(base + '?cancelled', { signal: abort.signal }); abort.abort();
    let cancelledOK = false; try { await cancelled; } catch (e) { cancelledOK = e.name === 'AbortError'; }
    const data = await Promise.all(jobs);
    while (pending) await new Promise(resolve => setTimeout(resolve, 50)); await store.flush();
    const saved = await Promise.all(urls.map(url => store.read(server + '|burst|' + url)));
    const before = calls; offline = true;
    const repeats = await Promise.all(urls.map(url => cache.load(url)));
    const same = repeats.every((r, i) => {
      const a = new Uint8Array(r.data), b = new Uint8Array(data[i].data);
      return a.length === b.length && a.every((v, j) => v === b[j]);
    });
    const result = { requested: urls.length, saved: saved.filter(Boolean).length, fetches: calls, offlineFetches: calls - before, peakPendingWrites: peak, cancelledOK, identical: same, bytes: data.reduce((n, r) => n + r.data.byteLength, 0), diagnostics: store.diagnostics };
    const failedBursts = {};
    for (const mode of ['denied', 'quota']) {
      let attempts = 0;
      const failName = name + '-' + mode;
      const realCache = await caches.open(failName);
      const adapter = { open: async () => ({ match: key => realCache.match(key), delete: key => realCache.delete(key), keys: () => realCache.keys(), put: async () => { attempts++; throw new DOMException('Full', 'QuotaExceededError'); } }) };
      const failedStore = createMapCacheStore({ cacheName: failName, databaseName: failName, ...(mode === 'denied' ? { indexedDB: null } : { cacheStorage: adapter }) });
      const failing = createMapResourceCache({ server, dataset: mode, store: failedStore, fetcher: async () => new Response(data[0].data.slice(0), { headers: { 'Content-Type': 'application/x-protobuf' } }) });
      const outputs = await Promise.all(urls.map(url => failing.load(url)));
      await failedStore.flush();
      failedBursts[mode] = { displayed: outputs.length, putAttempts: attempts, diagnostics: failedStore.diagnostics };
      if (outputs.length !== 48 || attempts !== (mode === 'quota' ? 2 : 0)) throw Error(JSON.stringify(failedBursts));
      failing.destroy(); await caches.delete(failName);
    }
    result.failedBursts = failedBursts;
    cache.destroy(); if (result.saved !== 48 || result.fetches !== 48 || result.offlineFetches || !same || !cancelledOK || peak > 8 || store.diagnostics.skippedQueue) throw Error(JSON.stringify(result));
    await caches.delete(name); return result;
  }); } finally { await context.close(); }
}

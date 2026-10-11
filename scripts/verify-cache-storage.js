async page => {
  return await page.evaluate(async () => {
    const { createMapCacheStore } = await import('./assets/map-cache-store.js?v=20261011-map-cache1');
    const { createMapResourceCache } = await import('./assets/map-resource-cache.js?v=20261011-map-cache1');
    const assert = (value, message) => { if (!value) throw Error(message); };
    const prefix = `pbb-test-${crypto.randomUUID()}`, server = 'https://mapserver.pbb.ph', url = `${server}/tiles/vector/12/3457/1929.pbf`;
    const options = { cacheName: prefix, databaseName: prefix, budget: 64, maxEntries: 3, storage: { estimate: async () => ({ quota: 1000000 }) } };
    const store = createMapCacheStore(options);
    const response = text => new Response(text, { headers: { 'Content-Type': 'application/x-protobuf' } });
    await store.write('a', response('old'), 3); assert(await store.read('a'), 'Original not saved');
    const realCache = await caches.open(prefix); let attempts = 0;
    const failingStorage = { open: async () => ({ match: key => realCache.match(key), delete: key => realCache.delete(key), keys: () => realCache.keys(), put: async () => { attempts++; throw new DOMException('Full', 'QuotaExceededError'); } }) };
    const failing = createMapCacheStore({ ...options, cacheStorage: failingStorage });
    assert(await failing.write('a', response('new'), 3) === false, 'Quota must fail');
    assert(attempts === 2, 'Quota must retry only once');
    assert(await (await store.read('a')).response.text() === 'old', 'Quota lost old replacement');
    await failing.write('a', response('later'), 5); assert(attempts === 2, 'Repeated quota should disable writes');
    await store.write('b', response('b'.repeat(30)), 30); await store.write('c', response('c'.repeat(30)), 30);
    await store.write('d', response('d'.repeat(30)), 30); assert(store.diagnostics.evictions > 0, 'LRU not applied');
    assert(await store.write('huge', response('huge'), 100) === false, 'Oversized cache admission');
    await realCache.put(`${location.origin}/__orphan`, response('orphan'));
    await store.reconcile(); assert(!(await realCache.match(`${location.origin}/__orphan`)), 'Orphan not reconciled');
    // Cross-tab-compatible adapters serialize writes and reconciliation under the same lock/lease.
    const peer = createMapCacheStore(options);
    await Promise.all([store.write('shared', response('first'), 5), peer.write('shared', response('second'), 6), peer.reconcile()]);
    assert(['first', 'second'].includes(await (await store.read('shared')).response.text()), 'Cross-client replacement corrupted');
    const keys = await realCache.keys(); const db = await new Promise((resolve, reject) => { const r = indexedDB.open(prefix); r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error); });
    const rows = await new Promise(resolve => { const r = db.transaction('entries').objectStore('entries').getAll(); r.onsuccess = () => resolve(r.result); });
    assert(keys.length === rows.length, 'Metadata/response mismatch after concurrency');
    assert(rows.reduce((sum, row) => sum + row.bytes, 0) <= 64, 'Budget exceeded');
    // Real storage denied => normal online transport remains available, no rejection to UI.
    const denied = createMapCacheStore({ ...options, indexedDB: null });
    const online = createMapResourceCache({ server, dataset: 'denied-test', store: denied });
    const bytes = (await online.load(url)).data.byteLength; await denied.flush(); assert(bytes > 0, 'Storage denial blocked transport');
    const oldStore = createMapCacheStore({ ...options, cacheName: `${prefix}-old`, databaseName: `${prefix}-old`, budget: 1000000, now: () => 0 });
    await oldStore.write(`${server}|old|${url}`, response('old forever'), 11);
    const old = createMapResourceCache({ server, dataset: 'old', store: oldStore, now: () => 90 * 86400000, fetcher: async () => { throw Error('Offline'); } });
    assert(new TextDecoder().decode((await old.load(url)).data) === 'old forever', '90-day-old saved tile disappeared');
    await new Promise(resolve => setTimeout(resolve, 100)); assert(await (await oldStore.read(`${server}|old|${url}`)).response.text() === 'old forever', 'Failed refresh changed saved tile');
    online.destroy(); old.destroy(); await caches.delete(prefix); await caches.delete(`${prefix}-old`); db.close();
    return { quotaAttempts: attempts, oldReplacementPreserved: true, lruEvictions: store.diagnostics.evictions, reconciled: store.diagnostics.reconciled, crossClientEntries: rows.length, deniedOnlineBytes: bytes, ninetyDayOffline: true };
  });
}

// Page-owned storage. Responses and metadata are deliberately independent of SWs.
const CACHE = 'pbb-map-resources-v1';
const DATABASE = 'pbb-map-resource-index-v1';
const LIMIT = 100 * 1024 * 1024;
const request = value => new Promise((resolve, reject) => { value.onsuccess = () => resolve(value.result); value.onerror = () => reject(value.error); });
const finished = tx => new Promise((resolve, reject) => { tx.oncomplete = resolve; tx.onabort = tx.onerror = () => reject(tx.error || new Error('Storage transaction failed')); });

export function createMapCacheStore({ cacheStorage = globalThis.caches, indexedDB = globalThis.indexedDB,
  storage = globalThis.navigator?.storage, locks = globalThis.navigator?.locks, origin = globalThis.location?.origin,
  budget = LIMIT, maxEntries = 4000, now = Date.now, cacheName = CACHE, databaseName = DATABASE } = {}) {
  let opening, db, cache, disabled = false, queue = Promise.resolve(), pending = 0;
  const diagnostics = { writes: 0, failures: 0, evictions: 0, reconciled: 0, skippedQueue: 0, skippedDisabled: 0, skippedBudget: 0 };
  async function open() {
    if (!opening) opening = (async () => {
      if (!cacheStorage || !indexedDB || !origin) throw new Error('Device storage unavailable');
      const op = indexedDB.open(databaseName, 1);
      op.onupgradeneeded = () => { op.result.createObjectStore('entries', { keyPath: 'id' }); op.result.createObjectStore('leases'); op.result.createObjectStore('datasets', { keyPath: 'id' }); };
      db = await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('Device storage did not open')), 5000);
        op.onsuccess = () => { clearTimeout(timer); resolve(op.result); };
        op.onerror = () => { clearTimeout(timer); reject(op.error); };
        op.onblocked = () => { clearTimeout(timer); reject(new Error('Device storage upgrade blocked')); };
      });
      db.onversionchange = () => { db.close(); disabled = true; };
      cache = await cacheStorage.open(cacheName);
      const estimate = await storage?.estimate?.().catch(() => null);
      if (estimate?.quota > 0) budget = Math.min(budget, Math.floor(estimate.quota * .2));
    })().catch(error => { disabled = true; diagnostics.failures++; throw error; });
    return opening;
  }
  async function all(table = 'entries') { const tx = db.transaction(table); return request(tx.objectStore(table).getAll()); }
  async function record(id) { const tx = db.transaction('entries'); return request(tx.objectStore('entries').get(id)); }
  // Web Locks on supporting browsers; IDB lease also serializes cooperating old/new tabs on Safari.
  async function exclusive(fn) {
    const run = async () => {
      const owner = crypto.randomUUID();
      let acquired = false;
      for (let i = 0; i < 100 && !acquired; i++) {
        const tx = db.transaction('leases', 'readwrite'), store = tx.objectStore('leases'), done = finished(tx);
        const lease = await request(store.get('maintenance'));
        if (!lease || lease.until < now()) { store.put({ owner, until: now() + 30000 }, 'maintenance'); acquired = true; }
        await done;
        if (!acquired) await new Promise(resolve => setTimeout(resolve, 100));
      }
      if (!acquired) throw new Error('Device storage is busy');
      let lost = false;
      async function check(renew = false) {
        const tx = db.transaction('leases', 'readwrite'), store = tx.objectStore('leases'), done = finished(tx);
        const lease = await request(store.get('maintenance'));
        if (lease?.owner !== owner || lease.until < now()) lost = true;
        else if (renew) store.put({ owner, until: now() + 30000 }, 'maintenance');
        await done;
        if (lost) throw new Error('Device storage lease expired');
      }
      const timer = setInterval(() => { void check(true).catch(() => { lost = true; }); }, 5000);
      try { return await fn(check); }
      finally {
        clearInterval(timer);
        const tx = db.transaction('leases', 'readwrite'), store = tx.objectStore('leases'), done = finished(tx);
        const lease = await request(store.get('maintenance'));
        if (lease?.owner === owner) store.delete('maintenance');
        await done;
      }
    };
    return locks?.request ? locks.request('pbb-map-resource-maintenance-v1', run) : run();
  }
  function schedule(fn) {
    if (disabled) { diagnostics.skippedDisabled++; return Promise.resolve(false); }
    if (pending >= 32) { diagnostics.skippedQueue++; return Promise.resolve(false); }
    pending++;
    const job = queue.then(async () => { await open(); if (disabled) return false; return exclusive(fn); })
      .catch(error => { diagnostics.failures++; if (['QuotaExceededError', 'SecurityError', 'InvalidStateError'].includes(error?.name)) disabled = true; return false; }).finally(() => pending--);
    queue = job.then(() => undefined); return job;
  }
  async function prune(check, incoming = 0, protect = '') {
    const rows = (await all()).sort((a, b) => a.used - b.used);
    let bytes = rows.reduce((sum, r) => sum + r.bytes, 0), count = rows.length;
    for (const row of rows) {
      if (bytes + incoming <= budget && count < maxEntries) break;
      if (row.id === protect) continue;
      await check();
      const tx = db.transaction('entries', 'readwrite'), done = finished(tx); tx.objectStore('entries').delete(row.id); await done;
      await cache.delete(row.key); bytes -= row.bytes; count--; diagnostics.evictions++;
    }
    return bytes + incoming <= budget && count < maxEntries;
  }
  return {
    diagnostics,
    async read(id) {
      try {
        await open(); const row = await record(id); if (!row) return null;
        const response = await cache.match(row.key); if (!response) return null;
        // Touch serialized against replacement; never resurrect a stale metadata pointer.
        if (pending < 4) void schedule(async check => { const current = await record(id); if (current?.key !== row.key) return; await check(); const tx = db.transaction('entries', 'readwrite'), done = finished(tx); tx.objectStore('entries').put({ ...current, used: now() }); await done; });
        return { response, saved: row.saved };
      } catch { return null; }
    },
    write(id, response, bytes) {
      return schedule(async check => {
        if (bytes > budget) { diagnostics.skippedBudget++; return false; }
        const old = await record(id);
        if (!await prune(check, Math.max(0, bytes - (old?.bytes || 0)), id)) { diagnostics.skippedBudget++; return false; }
        const key = `${origin}/__pbb_map_cache_v1__/${crypto.randomUUID()}`;
        const put = () => cache.put(key, response.clone());
        let committed = false;
        try {
          try { await put(); }
          catch (error) {
            if (error?.name !== 'QuotaExceededError') throw error;
            // One bounded prune/retry. Preserve the record being refreshed.
            await prune(check, budget, id);
            try { await put(); } catch (retryError) { disabled = true; throw retryError; }
          }
          await check();
          const tx = db.transaction('entries', 'readwrite'), done = finished(tx);
          tx.objectStore('entries').put({ id, key, bytes, saved: now(), used: now() }); await done;
          committed = true; diagnostics.writes++;
          if (old) await cache.delete(old.key);
          return true;
        } catch (error) { if (!committed) await cache.delete(key).catch(() => {}); throw error; }
      });
    },
    saveDataset(dataset) { return schedule(async check => { await check(); const tx = db.transaction('datasets', 'readwrite'), done = finished(tx); tx.objectStore('datasets').put(dataset); await done; return true; }); },
    async datasets() { try { await open(); return await all('datasets'); } catch { return []; } },
    reconcile() { return schedule(async check => {
      const rows = await all(), valid = new Set();
      for (const row of rows) {
        await check();
        if (await cache.match(row.key)) valid.add(row.key);
        else { const tx = db.transaction('entries', 'readwrite'), done = finished(tx); tx.objectStore('entries').delete(row.id); await done; diagnostics.reconciled++; }
      }
      for (const key of await cache.keys()) if (!valid.has(key.url)) { await check(); await cache.delete(key); diagnostics.reconciled++; }
      await prune(check); return true;
    }); },
    flush: () => queue,
  };
}

import { createMapCacheStore } from './map-cache-store.js?v=20261014-pin3';

const AGE = 7 * 86400000;
const MAX = 4 * 1024 * 1024;
const abortError = () => new DOMException('Map request cancelled', 'AbortError');
export function resourceKind(url, server, sprites = []) {
  const u = new URL(url), base = new URL(server);
  if (u.username || u.password || u.hash || !['https:', 'http:'].includes(u.protocol)) return null;
  if (sprites.includes(u.href)) return u.pathname.endsWith('.json') ? 'json' : 'image';
  const root = base.pathname.replace(/\/$/, '');
  if (u.origin !== base.origin || !u.pathname.startsWith(`${root}/tiles/`)) return null;
  const path = u.pathname.slice(root.length);
  if (/^\/tiles\/(vector|poi)\/\d+\/\d+\/\d+\.pbf$/.test(path) || /^\/tiles\/glyphs\/[^/]+\/\d+-\d+\.pbf$/.test(path)) return 'binary';
  if (/^\/tiles\/terrain\/\d+\/\d+\/\d+\.png$/.test(path)) return 'image';
  return null;
}
async function boundedBytes(response, limit, signal) {
  if (Number(response.headers.get('Content-Length')) > limit) throw new Error('Map resource exceeds device limit');
  if (!response.body) return new Uint8Array();
  const reader = response.body.getReader(), pieces = []; let size = 0;
  try {
    while (true) {
      if (signal?.aborted) throw abortError();
      const { value, done } = await reader.read(); if (done) break;
      size += value.byteLength; if (size > limit) throw new Error('Map resource exceeds device limit'); pieces.push(value);
    }
  } catch (error) { await reader.cancel().catch(() => {}); throw error; }
  finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const piece of pieces) { bytes.set(piece, offset); offset += piece.byteLength; }
  return bytes;
}
async function validateImage(bytes, mime) {
  if (typeof globalThis.createImageBitmap !== 'function') throw new Error('Image decoder unavailable');
  const image = await globalThis.createImageBitmap(new Blob([bytes], { type: mime }));
  try {
    if (!Number.isInteger(image.width) || !Number.isInteger(image.height) || image.width < 1 || image.height < 1 || image.width > 8192 || image.height > 8192) throw new Error('Invalid map image dimensions');
  } finally { image.close(); }
}
function validateSprite(bytes) {
  const value = JSON.parse(new TextDecoder().decode(bytes));
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid sprite atlas');
  for (const icon of Object.values(value)) {
    if (!icon || typeof icon !== 'object' || !['x', 'y', 'width', 'height'].every(k => Number.isInteger(icon[k]) && icon[k] >= 0) || icon.width < 1 || icon.height < 1 || !Number.isFinite(icon.pixelRatio) || icon.pixelRatio <= 0) throw new Error('Invalid sprite entry');
  }
}
export function createMapResourceCache({ server, dataset, sprites = [], store = createMapCacheStore(),
  fetcher = globalThis.fetch, now = Date.now, maxBytes = MAX, refreshAge = AGE, onState = () => {}, imageValidator = validateImage } = {}) {
  const flights = new Map(), refreshes = new Map(), missing = new Set();
  // At most eight bounded response bodies can await optional storage. Queued
  // transports retain URLs/controllers only, and cancel without fetching.
  let activeTransports = 0;
  const waitingTransports = [];
  function transportSlot(signal) {
    if (signal.aborted || disposed) return Promise.reject(abortError());
    if (waitingTransports.length >= 1024) return Promise.reject(new Error('Map request backlog limit reached'));
    return new Promise((resolve, reject) => {
      const entry = { signal, resolve, reject };
      entry.cancel = () => { const i = waitingTransports.indexOf(entry); if (i >= 0) waitingTransports.splice(i, 1); reject(abortError()); };
      signal.addEventListener('abort', entry.cancel, { once: true });
      waitingTransports.push(entry); drainTransports();
    });
  }
  function drainTransports() {
    while (activeTransports < 8 && waitingTransports.length) {
      const entry = waitingTransports.shift();
      entry.signal.removeEventListener('abort', entry.cancel);
      if (entry.signal.aborted || disposed) { entry.reject(abortError()); continue; }
      activeTransports++;
      let released = false;
      entry.resolve(() => { if (!released) { released = true; activeTransports--; drainTransports(); } });
    }
  }
  let disposed = false, connected = null, selected = dataset, startup = null;
  const stats = { hits: 0, network: 0, refreshes: 0, rejected: 0 };
  const kind = url => resourceKind(url, server, sprites);
  const id = url => `${server}|${selected}|${url}`;
  function notify() { try { onState({ connected, missing: missing.size }); } catch { /* Presentation never gates transport. */ } }
  function healthy(url) { const recovery = connected === false; connected = true; missing.delete(url); notify(); return recovery; }
  async function network(url, controller, key) {
    const release = await transportSlot(controller.signal);
    let writing = false;
    stats.network++;
    const transport = new AbortController(), cancel = () => transport.abort();
    controller.signal.addEventListener('abort', cancel, { once: true });
    if (controller.signal.aborted) transport.abort();
    const timer = setTimeout(() => transport.abort(), 15000);
    try {
    const response = await fetcher(url, { method: 'GET', credentials: 'omit', mode: 'cors', redirect: 'error', cache: 'no-store', signal: transport.signal });
    const mime = (response.headers.get('Content-Type') || '').split(';')[0].toLowerCase();
    const type = kind(url);
    const validType = type === 'binary' ? ['application/x-protobuf', 'application/vnd.mapbox-vector-tile', 'application/octet-stream'].includes(mime)
      : type === 'image' ? ['image/png', 'image/jpeg', 'image/webp'].includes(mime) : mime === 'application/json';
    if (response.status !== 200 || ['opaque', 'opaqueredirect'].includes(response.type) || response.redirected || (response.url && response.url !== url) || !validType) {
      stats.rejected++; throw new Error(`Map resource rejected: ${url}`);
    }
    const bytes = await boundedBytes(response, maxBytes, transport.signal);
    if (controller.signal.aborted) throw abortError();
    if (type === 'image') await imageValidator(bytes, mime);
    if (type === 'json') validateSprite(bytes);
    if (controller.signal.aborted || transport.signal.aborted) throw abortError();
    healthy(url);
    const headers = new Headers(response.headers);
    headers.delete('content-encoding'); headers.delete('content-length');
    const saved = new Response(bytes, { headers, status: 200 });
    if (!/\b(no-store|private)\b/i.test(response.headers.get('Cache-Control') || '')) {
      try {
        const job = store.write(key, saved.clone(), bytes.byteLength);
        writing = true;
        // Release storage pressure when persistence settles; render returned bytes
        // immediately rather than waiting for optional device storage.
        void Promise.resolve(job).catch(() => {}).finally(release);
      } catch {}
    }
    return saved;
    } finally { clearTimeout(timer); controller.signal.removeEventListener('abort', cancel); if (!writing) release(); }
  }
  function refresh(url, key) {
    if (refreshes.has(key) || disposed) return;
    stats.refreshes++;
    const controller = new AbortController();
    const promise = network(url, controller, key).catch(() => { if (!controller.signal.aborted) { connected = false; notify(); } }).finally(() => refreshes.delete(key));
    refreshes.set(key, { controller, promise });
  }
  async function acquire(url, controller, key, cacheOnly) {
    let cached = null;
    try { cached = await store.read(key); } catch {} // Optional adapters cannot turn a healthy network into a failed map.
    if (controller.signal.aborted) throw abortError();
    if (cached) {
      stats.hits++; missing.delete(url); notify();
      if (!cacheOnly && now() - cached.saved >= refreshAge) refresh(url, key);
      return cached.response;
    }
    try { if (cacheOnly) throw new Error('Saved dataset detail unavailable'); return await network(url, controller, key); }
    catch (error) { error.url = url; if (!controller.signal.aborted) { connected = false; if (missing.size < 256) missing.add(url); notify(); } throw error; }
  }
  async function load(url, { signal, type } = {}) {
    if (disposed || signal?.aborted) throw abortError();
    url = new URL(url).href; // Glyph templates contain spaces; compare the browser's canonical URL.
    if (!kind(url)) throw new Error('Resource is outside the configured map allowlist');
    const key = id(url);
    let flight = flights.get(key);
    if (!flight) {
      const controller = new AbortController();
      flight = { controller, users: 0, settled: false };
      flight.promise = acquire(url, controller, key, selected !== dataset).finally(() => { flight.settled = true; if (flights.get(key) === flight) flights.delete(key); });
      flights.set(key, flight);
    }
    flight.users++;
    return new Promise((resolve, reject) => {
      let done = false;
      const release = () => { if (done) return false; done = true; signal?.removeEventListener('abort', cancelled); flight.users--; if (!flight.users && !flight.settled) { flight.controller.abort(); if (flights.get(key) === flight) flights.delete(key); } return true; };
      const cancelled = () => { if (release()) reject(abortError()); };
      signal?.addEventListener('abort', cancelled, { once: true });
      flight.promise.then(async response => {
        try {
          const copy = response.clone();
          const data = type === 'json' ? await copy.json() : type === 'string' ? await copy.text() : await copy.arrayBuffer();
          if (release()) resolve({ data }); // Do not pass server expiry into MapLibre's independent tile refresh loop.
        } catch (error) { if (release()) reject(error); }
      }, error => { if (release()) reject(error); });
    });
  }
  return {
    stats, store, load,
    beginView() { missing.clear(); notify(); },
    transformRequest(url) { return { url: kind(url) ? `pbbcache://${encodeURIComponent(url)}` : url }; },
    install(maplibre) { maplibre.addProtocol('pbbcache', (params, abort) => load(decodeURIComponent(params.url.slice('pbbcache://'.length)), { signal: abort.signal, type: params.type })); },
    // Select one entire saved dataset/style when a requested startup tile proves the new dataset unavailable.
    async prepare(style, seedUrl, signal) {
      startup = { style, seedUrl: new URL(seedUrl).href };
      selected = dataset;
      try {
        await load(seedUrl, { signal });
        void store.saveDataset({ id: `${server}|${dataset}`, server, dataset, style, saved: now() });
        return style;
      } catch (error) {
        if (signal.aborted) throw error;
        const previous = (await store.datasets()).filter(row => row.server === server && row.dataset !== dataset).sort((a, b) => b.saved - a.saved);
        for (const row of previous) {
          selected = row.dataset;
          try { await load(seedUrl, { signal }); return row.style; } catch { if (signal.aborted) throw error; }
        }
        selected = dataset; return style; // Partial map can still render other saved resources.
      }
    },
    async recover() {
      if (selected !== dataset) {
        // The unversioned endpoint represents only the configured current generation.
        // Probe it directly, never through an old namespace or a cached seed.
        if (!startup) return false;
        try {
          await network(startup.seedUrl, new AbortController(), `${server}|${dataset}|${startup.seedUrl}`);
          selected = dataset;
          await store.saveDataset({ id: `${server}|${dataset}`, server, dataset, style: startup.style, saved: now() });
          missing.clear(); notify();
          return true; // Caller reconstructs the map with prepare() and current style.
        } catch { return false; }
      }
      const results = await Promise.allSettled([...missing].slice(0, 8).map(url => load(url)));
      return results.some(result => result.status === 'fulfilled');
    },
    destroy(maplibre) { disposed = true; for (const f of flights.values()) f.controller.abort(); for (const f of refreshes.values()) f.controller.abort(); flights.clear(); refreshes.clear(); maplibre?.removeProtocol('pbbcache'); },
  };
}

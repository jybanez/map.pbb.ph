import test from 'node:test';
import assert from 'node:assert/strict';
import { createMapResourceCache, resourceKind } from '../assets/map-resource-cache.js';
const server = 'https://mapserver.pbb.ph', url = `${server}/tiles/vector/12/3457/1929.pbf`;
const response = (body = 'tile', headers = {}) => new Response(body, { headers: { 'Content-Type': 'application/x-protobuf', ...headers } });
function memory() {
  const rows = new Map(), datasets = []; let clock = 0;
  return { rows, writes: 0, fail: false, clock(value) { clock = value; },
    async read(id) { const r = rows.get(id); return r && { ...r, response: r.response.clone() }; },
    async write(id, r) { if (this.fail) return false; this.writes++; rows.set(id, { response: r.clone(), saved: clock }); return true; },
    async saveDataset(r) { datasets.push(r); }, async datasets() { return datasets; },
  };
}
function loader(options = {}) { return createMapResourceCache({ server, dataset: 'a', now: () => 0, ...options }); }
test('real cache-first semantics retain meaningful URL queries and allowlist only configured paths', async () => {
  const store = memory(); let calls = 0;
  const cache = loader({ store, fetcher: async () => { calls++; return response(); } });
  await cache.load(url); await cache.load(url);
  assert.equal(calls, 1); assert.equal(cache.stats.hits, 1);
  await cache.load(`${url}?revision=2`); assert.equal(calls, 2);
  assert.equal(resourceKind('https://other.example/tiles/vector/12/1/1.pbf', server), null);
  for (const bad of ['/account.php', '/tiles/vector/12/1/1.pbf/extra', '/tiles/terrain/1/1/1.svg']) assert.equal(resourceKind(server + bad, server), null);
  await assert.rejects(cache.load('https://other.example/account'));
});
test('shared miss, one cancelled consumer, all cancelled transport and independent subsequent request', async () => {
  const store = memory(); let release, calls = 0, aborted = false;
  const cache = loader({ store, fetcher: async (u, { signal }) => { calls++; signal.addEventListener('abort', () => { aborted = true; }); await new Promise(resolve => { release = resolve; }); if (signal.aborted) throw new DOMException('Cancelled', 'AbortError'); return response(); } });
  const a = new AbortController(), b = new AbortController();
  const first = cache.load(url, { signal: a.signal }), second = cache.load(url, { signal: b.signal });
  await new Promise(resolve => setImmediate(resolve)); a.abort(); await assert.rejects(first, { name: 'AbortError' });
  assert.equal(aborted, false); release(); assert.equal(new TextDecoder().decode((await second).data), 'tile'); assert.equal(calls, 1);
  const c = new AbortController(), third = cache.load(`${url}?other`, { signal: c.signal });
  await new Promise(resolve => setImmediate(resolve)); c.abort(); await assert.rejects(third, { name: 'AbortError' }); assert.equal(aborted, true); release();
  await new Promise(resolve => setImmediate(resolve)); cache.destroy();
});
test('old saved resources never expire; failed refresh and failed replacement retain exact old bytes', async () => {
  const store = memory(); let clock = 0, mode = 'good';
  const cache = loader({ store, now: () => clock, fetcher: async () => { if (mode === 'offline') throw new Error('Disconnected'); return response(mode); } });
  await cache.load(url); clock = 90 * 86400000; mode = 'offline';
  assert.equal(new TextDecoder().decode((await cache.load(url)).data), 'good');
  await new Promise(resolve => setImmediate(resolve)); assert.equal(store.writes, 1);
  store.fail = true; mode = 'replacement';
  assert.equal(new TextDecoder().decode((await cache.load(url)).data), 'good');
  await new Promise(resolve => setImmediate(resolve)); assert.equal(store.writes, 1);
  assert.equal(new TextDecoder().decode((await cache.load(url)).data), 'good'); cache.destroy();
});
test('admission rejects failure/opaque/redirect/type/oversize and skips private/no-store writes', async () => {
  for (const r of [new Response('bad', { status: 500 }), new Response('html', { headers: { 'Content-Type': 'text/html' } }), response('too big')]) {
    const store = memory(), cache = loader({ store, maxBytes: 4, fetcher: async () => r });
    await assert.rejects(cache.load(url)); assert.equal(store.writes, 0); cache.destroy();
  }
  for (const type of ['opaque', 'opaqueredirect']) {
    const r = response(); Object.defineProperty(r, 'type', { value: type });
    const store = memory(), cache = loader({ store, fetcher: async () => r }); await assert.rejects(cache.load(url)); assert.equal(store.writes, 0);
  }
  const r = response(); Object.defineProperty(r, 'redirected', { value: true }); await assert.rejects(loader({ store: memory(), fetcher: async () => r }).load(url));
  for (const policy of ['private', 'no-store']) { const store = memory(); await loader({ store, fetcher: async () => response('tile', { 'Cache-Control': policy }) }).load(url); assert.equal(store.writes, 0); }
});
test('binary/image/JSON protocol types and throwing optional observer never gate transport', async () => {
  const store = memory(), sprite = 'https://map.pbb.ph/assets/sprite.json';
  const cache = loader({ store, imageValidator: async () => {}, sprites: [sprite], onState() { throw new Error('Broken UI'); }, fetcher: async u => u === sprite ? new Response('{"icon":{"x":0,"y":0,"width":1,"height":1,"pixelRatio":1}}', { headers: { 'Content-Type': 'application/json' } }) : u.endsWith('.png') ? new Response(new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]), { headers: { 'Content-Type': 'image/png' } }) : response() });
  assert.ok((await cache.load(url)).data instanceof ArrayBuffer);
  assert.deepEqual((await cache.load(sprite, { type: 'json' })).data, { icon: { x: 0, y: 0, width: 1, height: 1, pixelRatio: 1 } });
  assert.equal((await cache.load(`${server}/tiles/terrain/12/1/1.png`, { type: 'image' })).data.byteLength, 8);
});
test('missing requested detail recovers and coherent dataset fallback uses an entire saved style', async () => {
  const store = memory(), first = loader({ store, fetcher: async () => response() });
  await first.prepare({ name: 'old coherent style' }, url, new AbortController().signal);
  let online = false, state;
  const second = loader({ dataset: 'b', store, onState: s => { state = s; }, fetcher: async () => { if (!online) throw new Error('Disconnected'); return response(); } });
  const style = await second.prepare({ name: 'new style' }, url, new AbortController().signal);
  assert.equal(style.name, 'old coherent style');
  await assert.rejects(second.load(`${url}?uncached`)); assert.ok(state.missing > 0);
  online = true; assert.equal(await second.recover(), true); assert.equal(state.missing, 0);
  second.destroy(); first.destroy();
});

test('old generation misses and aged hits never use current transport; recovery adopts current namespace', async () => {
  const store = memory(), oldStyle = { name: 'old' }, currentStyle = { name: 'current' };
  const old = loader({ store, fetcher: async () => response('OLD') });
  await old.prepare(oldStyle, url, new AbortController().signal);
  let calls = 0, seedFails = true;
  const current = loader({ dataset: 'b', store, now: () => 90 * 86400000, fetcher: async u => { calls++; if (u === url && seedFails) throw new Error('Offline seed'); return response('NEW'); } });
  assert.deepEqual(await current.prepare(currentStyle, url, new AbortController().signal), oldStyle);
  const before = calls;
  await current.load(url); await new Promise(resolve => setImmediate(resolve));
  await assert.rejects(current.load(`${url}?other`));
  assert.equal(calls, before); assert.equal(store.rows.has(`${server}|a|${url}?other`), false);
  assert.equal(await current.recover(), false); seedFails = false;
  assert.equal(await current.recover(), true);
  assert.equal(new TextDecoder().decode((await current.load(`${url}?other`)).data), 'NEW');
  assert.equal(store.rows.has(`${server}|a|${url}?other`), false);
  assert.equal(await store.rows.get(`${server}|a|${url}`).response.clone().text(), 'OLD');
  assert.deepEqual(await current.prepare(currentStyle, url, new AbortController().signal), currentStyle);
  old.destroy(); current.destroy();
});
test('decoded image dimensions checked and decoded resource always closed', async () => {
  const saved = globalThis.createImageBitmap; let closed = 0;
  const imageUrl = `${server}/tiles/terrain/1/1/1.png`;
  try {
    globalThis.createImageBitmap = async () => ({ width: 0, height: 1, close() { closed++; } });
    const store = memory(), cache = loader({ store, fetcher: async () => new Response('bytes', { headers: { 'Content-Type': 'image/png' } }) });
    await assert.rejects(cache.load(imageUrl)); assert.equal(closed, 1); assert.equal(store.writes, 0);
    globalThis.createImageBitmap = async () => { throw new Error('Corrupt image'); };
    await assert.rejects(cache.load(imageUrl)); assert.equal(store.writes, 0); cache.destroy();
  } finally { globalThis.createImageBitmap = saved; }
});
test('malformed sprite JSON cannot replace saved atlas', async () => {
  const store = memory(), sprite = 'https://map.pbb.ph/sprite.json'; let corrupt = false;
  const valid = { icon: { x: 0, y: 0, width: 1, height: 1, pixelRatio: 1 } };
  const cache = loader({ store, sprites: [sprite], now: () => corrupt ? 90 * 86400000 : 0, fetcher: async () => new Response(corrupt ? '{"icon":1}' : JSON.stringify(valid), { headers: { 'Content-Type': 'application/json' } }) });
  await cache.load(sprite); corrupt = true;
  assert.deepEqual((await cache.load(sprite, { type: 'json' })).data, valid);
  await new Promise(resolve => setImmediate(resolve)); assert.equal(store.writes, 1);
  assert.deepEqual((await cache.load(sprite, { type: 'json' })).data, valid); cache.destroy();
});

test('tile bursts backpressure on persistence without delaying displayed bytes; queued cancellation stays fetch-free', async () => {
  const store = memory(); let held = [], outstanding = 0, maximum = 0, calls = 0;
  const original = store.write.bind(store);
  store.write = async (...args) => { outstanding++; maximum = Math.max(maximum, outstanding); await new Promise(resolve => held.push(resolve)); const result = await original(...args); outstanding--; return result; };
  const cache = loader({ store, fetcher: async () => { calls++; return response(); } });
  const jobs = Array.from({ length: 64 }, (_, i) => cache.load(`${url}?burst=${i}`));
  const cancelled = new AbortController(), pending = cache.load(`${url}?cancelled`, { signal: cancelled.signal });
  cancelled.abort(); await assert.rejects(pending, { name: 'AbortError' });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(calls, 8); assert.equal(store.writes, 0);
  assert.ok((await jobs[0]).data instanceof ArrayBuffer); // Visible before storage completes.
  for (let i = 0; i < 8; i++) { held.splice(0).forEach(resolve => resolve()); await new Promise(resolve => setImmediate(resolve)); }
  await Promise.all(jobs); held.splice(0).forEach(resolve => resolve()); await new Promise(resolve => setImmediate(resolve));
  assert.equal(maximum, 8); assert.equal(calls, 64); assert.equal(store.rows.size, 64); cache.destroy();
});

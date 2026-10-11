async page => {
  return await page.evaluate(async () => {
    const { createMapResourceCache } = await import('./assets/map-resource-cache.js?v=20261011-map-cache1');
    const cache = createMapResourceCache({ server: 'https://mapserver.pbb.ph', dataset: 'pbb-mapserver-20261011-v1' });
    try { const urls = ['https://mapserver.pbb.ph/tiles/vector/12/3457/1929.pbf', 'https://mapserver.pbb.ph/tiles/terrain/12/3457/1929.png', 'https://mapserver.pbb.ph/tiles/glyphs/Open%20Sans%20Regular,Arial%20Unicode%20MS%20Regular/0-255.pbf']; const results = []; for (const url of urls) { const raw = await fetch(url); const probe = {url,final:raw.url,mime:raw.headers.get('Content-Type'),status:raw.status,type:raw.type}; try { probe.bytes = (await cache.load(url)).data.byteLength; } catch (e) { probe.error = e.message; } results.push(probe); } await cache.store.flush(); return { results, stats: cache.stats, storage: cache.store.diagnostics, caches: await caches.keys() }; }
    catch (error) { return { error: error.message, stack: error.stack, caches: await caches.keys() }; }
  });
}

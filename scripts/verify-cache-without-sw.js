async page => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    window.__nativeSW = navigator.serviceWorker;
    Object.defineProperty(navigator, 'serviceWorker', { configurable: true, value: undefined });
    Object.defineProperty(navigator, 'geolocation', { configurable: true, value: { watchPosition() { return 1; }, clearWatch() {} } });
    let lib; Object.defineProperty(window, 'maplibregl', { get: () => lib, set(v) { lib = v; const Map = v.Map; v.Map = class extends Map { constructor(options) { super(options); window.__map = this; } }; } });
  });
  await page.goto('https://map.pbb.ph/');
  await page.waitForFunction(() => window.__map?.loaded(), null, { timeout: 60000 });
  const result = await page.evaluate(async () => {
    const { createMapResourceCache } = await import('./assets/map-resource-cache.js?v=20261011-map-cache4');
    const cache = createMapResourceCache({ server: 'https://mapserver.pbb.ph', dataset: 'pbb-mapserver-20261011-v1' });
    const url = 'https://mapserver.pbb.ph/tiles/vector/12/3457/1929.pbf';
    await cache.load(url); await cache.store.flush(); const first = cache.stats.network;
    const cached = await cache.load(url); await cache.store.flush();
    return { serviceWorkerAvailable: !!navigator.serviceWorker, registeredWorkers: (await window.__nativeSW.getRegistrations()).length, bytes: cached.data.byteLength, secondNetworkRequests: cache.stats.network - first, hits: cache.stats.hits, renderedPoi: window.__map.querySourceFeatures('pbb-poi', { sourceLayer: 'poi' }).length, terrain: window.__map.getTerrain() };
  });
  if (result.registeredWorkers || result.secondNetworkRequests || !result.hits || !result.renderedPoi || !result.terrain || errors.length) throw Error(JSON.stringify({result,errors}));
  return { ...result, errors };
}

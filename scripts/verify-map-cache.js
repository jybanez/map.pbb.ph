async page => {
  const errors = [], requests = [], failures = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => { if (request.url().startsWith('https://mapserver.pbb.ph/')) requests.push(request.url()); });
  page.on('requestfailed', request => failures.push({url:request.url(),error:request.failure()?.errorText}));
  await page.context().addInitScript(() => {
    Object.defineProperty(navigator, 'geolocation', { configurable: true, value: { watchPosition(ok) { window.__fix = ok; return 1; }, clearWatch() {} } });
    let lib; Object.defineProperty(window, 'maplibregl', { get: () => lib, set(v) { lib = v; const Map = v.Map; v.Map = class extends Map { constructor(options) { super(options); window.__map = this; setTimeout(() => { this.fire('movestart', {originalEvent:{type:'fixture-navigation'}}); window.__fix?.({coords:{latitude:10.3157,longitude:123.8854,accuracy:80},timestamp:Date.now()}); }, 0); } }; } });
  });
  await page.setViewportSize({ width: 1000, height: 740 });
  await page.context().setOffline(false); await page.goto('https://map.pbb.ph/');
  await page.waitForFunction(() => window.__map?.style && !window.__map._removed && window.__map.getLayer('pbb-accuracy-ripple-line'), null, { timeout: 60000 });
  await page.waitForFunction(() => navigator.serviceWorker?.controller, null, { timeout: 60000 });
  await page.waitForTimeout(3000);
  const warm = await page.evaluate(async () => {
    const { createMapResourceCache } = await import('./assets/map-resource-cache.js?v=20261011-map-cache1');
    const cache = createMapResourceCache({ server: 'https://mapserver.pbb.ph', dataset: 'pbb-mapserver-20261011-v1' });
    const urls = ['https://mapserver.pbb.ph/tiles/vector/12/3457/1929.pbf', 'https://mapserver.pbb.ph/tiles/terrain/12/3457/1929.png', 'https://mapserver.pbb.ph/tiles/poi/12/3457/1929.pbf', 'https://mapserver.pbb.ph/tiles/glyphs/Open Sans Regular,Arial Unicode MS Regular/0-255.pbf'];
    const bytes = []; for (const url of urls) bytes.push((await cache.load(url)).data.byteLength);
    await cache.store.flush(); for (const url of urls) await cache.load(url);
    return { bytes, stats: cache.stats, storage: cache.store.diagnostics, transform: window.__map._requestManager.transformRequest(urls[0], 'Tile'), terrain: window.__map.getTerrain(), poi: window.__map.querySourceFeatures('pbb-poi', { sourceLayer: 'poi' }).length, ripple: window.__map.getSource('pbb-accuracy-ripple')._data.features.length };
  });
  if (warm.stats.hits < 4 || !warm.terrain || !warm.poi || warm.ripple !== 3) throw Error(JSON.stringify(warm));
  let before = requests.length;
  await page.reload();
  await page.waitForFunction(() => window.__map?.style && !window.__map._removed && window.__map.getLayer('pbb-accuracy-ripple-line'), null, { timeout: 60000 });
  await page.waitForTimeout(3000);
  const firstRepeat = requests.length - before;
  // Burst writes are bounded. A second warm pass may fill resources skipped during the first burst.
  before = requests.length; await page.reload();
  await page.waitForFunction(() => window.__map?.style && !window.__map._removed && window.__map.getLayer('pbb-accuracy-ripple-line'), null, { timeout: 60000 });
  await page.waitForTimeout(3000);
  const repeat = requests.length - before;
  await page.screenshot({ path: 'output/playwright/map-cache-online.png' });
  // Close the page and reopen a new one with app and tile networks disabled: genuine cold page graph.
  const context = page.context(); await context.setOffline(true); await page.close();
  const cold = await context.newPage();
  await cold.setViewportSize({ width: 1000, height: 740 });
  await cold.goto('https://map.pbb.ph/');
  await cold.waitForFunction(() => window.__map?.style && !window.__map._removed && window.__map.getLayer('pbb-accuracy-ripple-line'), null, { timeout: 60000 });
  await cold.waitForTimeout(2000);
  const offline = await cold.evaluate(() => ({ terrain: window.__map.getTerrain(), poi: window.__map.querySourceFeatures('pbb-poi', { sourceLayer: 'poi' }).length, ripple: window.__map.getSource('pbb-accuracy-ripple')._data.features.length, controls: document.querySelectorAll('#zoom-control button').length, status: document.querySelector('#map-feedback')?.hidden }));
  await cold.screenshot({ path: 'output/playwright/map-cache-cold-offline.png' });
  if (!offline.poi || !offline.terrain || !offline.status || offline.ripple !== 3) throw Error(JSON.stringify(offline));
  await cold.evaluate(() => window.__map.jumpTo({ center: [121.03, 14.6], zoom: 16, pitch: 60, bearing: 130 }));
  await cold.getByText('Some map detail is unavailable. Reconnect to load more.', { exact: true }).waitFor({ timeout: 20000 });
  const partial = await cold.evaluate(() => ({ notices: [...document.querySelectorAll('.ui-toast-message')].filter(node => node.textContent === 'Some map detail is unavailable. Reconnect to load more.').length, controls: document.querySelectorAll('#zoom-control button').length }));
  if (partial.notices !== 1 || partial.controls < 3) throw Error(JSON.stringify(partial));
  await context.setOffline(false);
  await cold.waitForFunction(() => window.__map && !window.__map._removed && window.__map.getSource('pbb-poi') && window.__map.querySourceFeatures('pbb-poi', { sourceLayer: 'poi' }).length > 0, null, { timeout: 60000 });
  await cold.waitForTimeout(3000);
  const recovered = await cold.evaluate(() => ({ poi: window.__map.querySourceFeatures('pbb-poi', { sourceLayer: 'poi' }).length, status: document.querySelector('#map-feedback')?.hidden }));
  await cold.setViewportSize({ width: 375, height: 740 }); await cold.screenshot({ path: 'output/playwright/map-cache-mobile-recovered.png' });
  if (errors.length || repeat !== 0) throw Error(JSON.stringify({errors,repeat}));
  return { warm, firstWarmPassMisses: firstRepeat, repeatNetworkRequests: repeat, offline, partial, recovered, errors, observedNetworkRequests: requests.length, failures: failures.slice(0,3) };
}

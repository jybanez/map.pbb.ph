async (page) => {
  const out = 'output/playwright';
  const results = [], requests = [], errors = [];
  page.on('request', request => requests.push({ url: request.url(), method: request.method() }));
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    window.__fixes = [];
    Object.defineProperty(navigator, 'geolocation', { configurable: true, value: {
      getCurrentPosition(ok, bad, policy) { window.__fixes.push({ ok, bad, policy }); },
    } });
    if (location.search.includes('verify=no-geolocation')) Object.defineProperty(navigator, 'geolocation', { configurable: true, value: undefined });
    if (location.search.includes('verify=no-webgl')) {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function(kind, ...args) {
        return String(kind).includes('webgl') ? null : original.call(this, kind, ...args);
      };
    }
    let lib;
    Object.defineProperty(window, 'maplibregl', { configurable: true,
      get: () => lib,
      set(value) {
        lib = value;
        const Original = value.Map;
        value.Map = class extends Original { constructor(options) { super(options); window.__map = this; } };
      },
    });
  });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('https://map.pbb.ph/');
  await page.waitForFunction(() => window.__map?.loaded());
  const initial = await page.evaluate(() => ({
    center: window.__map.getCenter().toArray(), zoom: window.__map.getZoom(),
    policy: window.__fixes[0].policy, count: window.__fixes.length,
    pending: document.querySelector('.ui-navbar-action').disabled,
    poi: window.__map.queryRenderedFeatures({ layers: ['pbb-poi-points'] }).length,
    sources: Object.keys(window.__map.getStyle().sources),
  }));
  if (initial.zoom !== 12 || !initial.pending || initial.count !== 1 || initial.poi < 1) throw Error('Initial map/location/POI check failed');
  results.push({ check: 'fallback renders independently while one fix is pending; POIs default visible', result: initial });
  await page.screenshot({ path: `${out}/desktop-pending.png` });
  await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
  await page.waitForFunction(() => !window.__map.isMoving());
  const explored = await page.evaluate(() => window.__map.getZoom());
  await page.evaluate(() => window.__fixes[0].ok({ coords: { longitude: 123.8854, latitude: 10.3157, accuracy: 65 } }));
  await page.getByRole('img', { name: 'Your reported location', exact: true }).waitFor();
  const late = await page.evaluate(() => ({ zoom: window.__map.getZoom(), source: !!window.__map.getSource('pbb-accuracy') }));
  if (Math.abs(late.zoom - explored) > 0.01 || !late.source) throw Error('Late initial location stole the camera or missed accuracy circle');
  results.push({ check: 'late initial fix preserves exploration and displays marker/circle', result: late });
  await page.getByRole('button', { name: 'Locate', exact: true }).click();
  if (!(await page.getByRole('button', { name: 'Locating…', exact: true }).isDisabled())) throw Error('Locate must be disabled while pending');
  await page.evaluate(() => window.__fixes[1].ok({ coords: { longitude: 123.8854, latitude: 10.3157, accuracy: 40 } }));
  await page.waitForFunction(() => !window.__map.isMoving() && Math.abs(window.__map.getZoom() - 15) < 0.01);
  await page.getByRole('button', { name: 'Set pitch 60 degrees', exact: true }).click();
  await page.waitForFunction(() => window.__map.loaded() && !window.__map.isMoving());
  await page.screenshot({ path: `${out}/desktop-location-3d.png` });
  const detail = await page.evaluate(() => ({
    zoom: window.__map.getZoom(), pitch: window.__map.getPitch(), terrain: window.__map.getTerrain(),
    buildings: window.__map.queryRenderedFeatures({ layers: ['buildings-3d'] }).length,
    pois: window.__map.queryRenderedFeatures({ layers: ['pbb-poi-points', 'pbb-poi-labels'] }).length,
  }));
  if (detail.buildings < 1 || detail.pois < 1) throw Error('Detailed buildings or POIs did not render');
  results.push({ check: 'explicit Locate recenters; terrain/buildings/POIs render at detail zoom', result: detail });
  await page.getByRole('button', { name: 'Layers', exact: true }).click();
  await page.getByRole('checkbox', { name: 'Points of interest', exact: true }).uncheck();
  const visibility = await page.evaluate(() => ['pbb-poi-points', 'pbb-poi-labels'].map(id => window.__map.getLayoutProperty(id, 'visibility')));
  if (visibility.some(value => value !== 'none')) throw Error('POI toggle did not hide whole group');
  await page.getByRole('checkbox', { name: 'Points of interest', exact: true }).check();
  await page.getByRole('button', { name: 'Layers', exact: true }).click();
  results.push({ check: 'POI toggle affects complete group', result: visibility });
  await page.evaluate(() => window.__map.jumpTo({ bearing: 45 }));
  const beforeCompass = await page.evaluate(() => window.__map.getCenter().toArray());
  await page.getByRole('button', { name: 'Reset north', exact: true }).click();
  await page.waitForFunction(() => !window.__map.isMoving());
  const compass = await page.evaluate(() => ({ bearing: window.__map.getBearing(), center: window.__map.getCenter().toArray() }));
  if (Math.abs(compass.bearing) > 0.01 || compass.center.some((value, i) => Math.abs(value - beforeCompass[i]) > 0.00001)) throw Error('Compass changed position or failed to reset');
  await page.getByRole('region', { name: 'Map. Use arrow keys to pan, plus or minus to zoom, and Shift with arrow keys to rotate or pitch.', exact: true }).press('ArrowRight');
  await page.waitForFunction(() => !window.__map.isMoving());
  const panned = await page.evaluate(() => window.__map.getCenter().toArray());
  if (panned[0] === beforeCompass[0]) throw Error('Keyboard pan did not move map');
  results.push({ check: 'compass resets bearing without relocation; keyboard pan works', result: compass });
  const layouts = [];
  for (const [width, height] of [[1440, 900], [390, 844], [320, 568], [844, 390]]) {
    await page.setViewportSize({ width, height });
    const layout = await page.evaluate(() => ({ viewport: [innerWidth, innerHeight],
      scroll: [document.documentElement.scrollWidth, document.documentElement.scrollHeight],
      map: document.querySelector('canvas.maplibregl-canvas').getBoundingClientRect().toJSON(),
      controls: [...document.querySelectorAll('.ui-map-controls__button')].map(button => ({
        name: button.getAttribute('aria-label'), rect: button.getBoundingClientRect().toJSON(),
      })), attribution: document.querySelector('.maplibregl-ctrl-attrib').getBoundingClientRect().toJSON(),
    }));
    if (layout.scroll[0] !== width || layout.scroll[1] !== height) throw Error(`Page overflow at ${width}`);
    if (layout.controls.some(c => c.rect.left < 0 || c.rect.right > width || c.rect.width < 44 || c.rect.height < 44)) throw Error(`Control clipped at ${width}`);
    await page.screenshot({ path: `${out}/layout-${width}x${height}.png` });
    layouts.push(layout);
  }
  results.push({ check: 'responsive layouts, 44px controls and attribution', result: layouts });
  await page.setViewportSize({ width: 1440, height: 900 });
  // Synthetic denial, timeout, unavailable and invalid data require no real-device permission.
  for (const code of [1, 3, 2]) {
    await page.getByRole('button', { name: 'Locate', exact: true }).click();
    await page.evaluate(code => window.__fixes.at(-1).bad({ code }), code);
    if (!(await page.getByRole('button', { name: 'Locate', exact: true }).isEnabled())) throw Error('Location failure left Locate busy');
  }
  await page.getByRole('button', { name: 'Locate', exact: true }).click();
  await page.evaluate(() => window.__fixes.at(-1).ok({ coords: { longitude: 400, latitude: 10, accuracy: 10 } }));
  if (!(await page.getByRole('button', { name: 'Locate', exact: true }).isEnabled())) throw Error('Invalid location left Locate busy');
  results.push({ check: 'denied, timeout, unavailable and invalid fixes leave map and retry usable', result: 'pass' });
  let releaseTiles;
  const gate = new Promise(resolve => { releaseTiles = resolve; });
  await page.route('**/tiles/vector/**', async route => { await gate; await route.continue(); });
  await page.reload();
  await page.getByRole('button', { name: 'Layers', exact: true }).waitFor();
  await page.getByRole('button', { name: 'Layers', exact: true }).click();
  await page.getByRole('checkbox', { name: 'Points of interest', exact: true }).uncheck();
  releaseTiles();
  await page.waitForFunction(() => window.__map?.loaded());
  const earlyVisibility = await page.evaluate(() => ['pbb-poi-points', 'pbb-poi-labels'].map(id => window.__map.getLayoutProperty(id, 'visibility')));
  if (earlyVisibility.some(value => value !== 'none')) throw Error('Loading-time POI choice was lost');
  await page.unroute('**/tiles/vector/**');
  results.push({ check: 'POI choice during map loading survives readiness', result: earlyVisibility });
  await page.route('**/tiles/poi/**', route => route.abort('failed'));
  await page.reload();
  await page.waitForFunction(() => window.__map?.loaded());
  await page.getByText('Points of interest are unavailable for this area.', { exact: false }).waitFor();
  results.push({ check: 'optional POI outage preserves loaded basemap', result: 'pass' });
  await page.unroute('**/tiles/poi/**');
  await page.route('**/assets/maps/hotline-dark.json', route => route.abort('failed'));
  await page.reload();
  await page.getByRole('heading', { name: 'Map could not open', exact: true }).waitFor();
  await page.unroute('**/assets/maps/hotline-dark.json');
  await page.getByRole('button', { name: 'Retry map', exact: true }).click();
  await page.waitForFunction(() => window.__map?.loaded());
  results.push({ check: 'initialization failure offers deliberate successful retry', result: 'pass' });
  await page.goto('https://map.pbb.ph/?verify=no-webgl');
  await page.getByRole('heading', { name: 'Map could not open', exact: true }).waitFor();
  await page.getByText('WebGL is unavailable.', { exact: false }).waitFor();
  results.push({ check: 'unsupported WebGL presents actionable canonical error', result: 'pass' });
  await page.goto('https://map.pbb.ph/?verify=no-geolocation');
  await page.waitForFunction(() => window.__map?.loaded());
  await page.getByText('Location is unavailable in this browser.', { exact: false }).waitFor();
  results.push({ check: 'missing geolocation preserves loaded map and actionable feedback', result: 'pass' });
  await page.goto('https://map.pbb.ph/');
  await page.waitForFunction(() => window.__map?.loaded());
  const last = await page.evaluate(() => {
    const map = window.__map;
    window.dispatchEvent(new Event('pagehide'));
    window.__fixes.at(-1).ok({ coords: { longitude: 123, latitude: 10, accuracy: 1 } });
    return { removed: map._removed, markers: document.querySelectorAll('.ui-map-marker').length, overlays: document.querySelectorAll('.ui-busy-overlay').length };
  });
  if (!last.removed || last.markers || last.overlays) throw Error('Teardown leaked map resources');
  results.push({ check: 'teardown removes map/overlays and ignores late fix', result: last });
  const external = requests.filter(request => {
    const url = new URL(request.url);
    return ['http:', 'https:'].includes(url.protocol) && !['map.pbb.ph', 'mapserver.pbb.ph'].includes(url.hostname);
  });
  if (external.length || requests.some(request => request.method !== 'GET')) throw Error('Unexpected external runtime dependency or location mutation');
  if (errors.length) throw Error(`Uncaught browser errors: ${errors.join('; ')}`);
  const report = { date: '2026-10-10', browser: 'Chromium via Playwright CLI', syntheticLocation: true,
    externalRuntimeRequests: external, requestCount: requests.length, uncaughtErrors: errors, checks: results,
    limits: ['Physical mobile/touch and real-device geolocation not tested', 'MapServer backend upstream disconnection not tested; local-node offline acceptance remains pending'] };
  return report;
}

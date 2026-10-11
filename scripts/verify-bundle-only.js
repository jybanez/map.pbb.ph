async page => {
  const browser = page.context().browser(), allowed = ['/vendor/helpers/js/ui/ui.loader.js', '/vendor/helpers/dist/helpers.ui.bundle.min.js', '/vendor/helpers/dist/helpers.ui.bundle.min.css'];
  const result = { failures: [] };
  for (const mode of ['missing-bundle', 'missing-bundle-css', 'broken-bundle', 'missing-factory', 'missing-lazy-factory']) {
    const context = await browser.newContext({ serviceWorkers: 'block' }), requests = [];
    context.on('request', r => { if (r.url().includes('/vendor/helpers/')) requests.push(r.url()); });
    if (mode === 'missing-bundle-css') await context.route('**/helpers.ui.bundle.min.css*', route => route.abort());
    await context.route('**/helpers.ui.bundle.min.js*', async route => {
      if (mode === 'missing-bundle-css') return route.continue();
      if (mode === 'missing-bundle') return route.abort();
      if (mode === 'broken-bundle') return route.fulfill({ contentType: 'text/javascript', body: 'export const broken = ;' });
      const response = await route.fetch(), key = mode === 'missing-factory' ? './ui.navbar.js' : './ui.tree.grid.js';
      await route.fulfill({ response, body: await response.text() + '\ndelete window.__PBB_HELPER_UI_BUNDLE__[' + JSON.stringify(key) + '];' });
    });
    const tab = await context.newPage(); await tab.goto('https://map.pbb.ph/');
    if (mode === 'missing-lazy-factory') {
      await tab.getByRole('button', { name: 'Filter points of interest', exact: true }).waitFor({ timeout: 60000 });
      await tab.getByRole('button', { name: 'Filter points of interest', exact: true }).click();
      await tab.getByRole('alert').filter({ hasText: 'missing module' }).waitFor();
    } else await tab.getByText('PBB Map could not load its local application assets.', { exact: false }).waitFor();
    const individual = requests.filter(u => !allowed.includes(new URL(u).pathname));
    if (individual.length) throw Error(JSON.stringify({ mode, individual }));
    result.failures.push({ mode, visibleError: true, individualHelperRequests: individual.length });
    await context.close();
  }
  const context = await browser.newContext(), requests = [], errors = [];
  context.on('request', r => { if (r.url().includes('/vendor/helpers/')) requests.push(r.url()); });
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'geolocation', { configurable: true, value: { watchPosition(ok) { window.__fix = ok; return 1; }, clearWatch() {} } });
    let lib; Object.defineProperty(window, 'maplibregl', { get: () => lib, set(v) { lib = v; const Map = v.Map; v.Map = class extends Map { constructor(options) { super(options); window.__map = this; setTimeout(() => { this.fire('movestart', {originalEvent:{type:'fixture-navigation'}}); window.__fix?.({coords:{latitude:10.3157,longitude:123.8854,accuracy:80},timestamp:Date.now()}); }, 0); } }; } });
  });
  const warm = await context.newPage(); warm.on('pageerror', e => errors.push(e.message)); await warm.goto('https://map.pbb.ph/');
  await warm.waitForFunction(() => window.__map?.style && !window.__map._removed && window.__map.getLayer('current-location-person'), null, { timeout: 60000 });
  await warm.waitForFunction(() => navigator.serviceWorker.controller, null, { timeout: 60000 });
  await warm.waitForTimeout(2500);
  result.installed = await warm.evaluate(async () => {
    const manifestText = await (await fetch('./shell-manifest.js', {cache:'no-store'})).text();
    const version = JSON.parse(manifestText.slice(manifestText.indexOf('{'), manifestText.lastIndexOf('}')+1)).version;
    const cache = await caches.open(`pbb-map-shell-${version}`);
    const keys = await cache.keys(); return { files: keys.length, helper: keys.filter(k => k.url.includes('/vendor/helpers/')).map(k => new URL(k.url).pathname) };
  });
  await context.setOffline(true); await warm.close(); const cold = await context.newPage(); cold.on('pageerror', e => errors.push(e.message));
  await cold.goto('https://map.pbb.ph/');
  await cold.waitForFunction(() => window.__map?.style && !window.__map._removed && window.__map.getLayer('current-location-person'), null, { timeout: 60000 });
  await cold.getByRole('button', { name: 'Filter points of interest', exact: true }).click();
  await cold.getByRole('columnheader', { name: 'Locations', exact: true }).waitFor();
  result.offline = await cold.evaluate(async names => {
    const { uiLoader } = await import('./vendor/helpers/js/ui/ui.loader.js?v=0.21.290');
    for (const name of names) await uiLoader.get(name, { preferBundles: true });
    const { magneticField } = await import('./assets/declination.js');
    const field = magneticField(10.3157,123.8854,0,new Date('2026-10-11'));
    const { createDirectionOptions } = await import('./assets/direction-options.js');
    window.__directionFixture = createDirectionOptions({ createFormModal: await uiLoader.get('ui.form.modal', { preferBundles: true }), uiAlert: await uiLoader.get('ui.dialog.alert', { preferBundles: true }), getState: () => ({ eligible: true, selected: true }), apply() {} });
    window.__directionFixture.open();
    return { factories: names.length, terrain: !!window.__map.getTerrain(), person: !!window.__map.getLayer('current-location-person'), personRendered: document.querySelector('.ui-map-location-person-label')?.hidden === false, POIs: window.__map.querySourceFeatures('pbb-poi',{sourceLayer:'poi'}).length, model: Number.isFinite(field?.decl), bootError: !document.querySelector('#boot-status').hidden };
  }, ["ui.navbar", "ui.map.controls", "ui.map.markers", "ui.toast", "ui.empty.state", "ui.busy.overlay", "ui.icons", "ui.menu", "ui.modal", "ui.search", "ui.events.createEventBag", "ui.action.modal", "ui.form.modal", "ui.dialog.alert", "ui.map.location.person", "ui.signal.strength", "ui.tree.grid", "ui.checkbox", "ui.map.drawing", "ui.map.drawing.maplibre"]);
  await cold.getByRole('dialog', { name: 'Direction options', exact: true }).waitFor(); await cold.getByLabel('Direction mode', { exact: true }).waitFor();
  await cold.screenshot({ path: 'output/playwright/bundle-only-cold-offline.png' });
  result.individualHelperRequests = requests.filter(u => !allowed.includes(new URL(u).pathname));
  result.helperURLs = [...new Set(requests.map(u => new URL(u).pathname))]; result.pageErrors = errors;
  await context.setOffline(false); await context.close();
  if (result.installed.files !== 42 || result.installed.helper.length !== 3 || result.individualHelperRequests.length || errors.length || result.offline.bootError || !result.offline.person || !result.offline.terrain || !result.offline.POIs || !result.offline.model) throw Error(JSON.stringify(result));
  return result;
}

async page => {
  const context = page.context(), errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.waitForFunction(() => navigator.serviceWorker.controller, null, { timeout: 60000 });
  await page.waitForTimeout(2000);
  const installed = await page.evaluate(async () => {
    const names = (await caches.keys()).filter(n => /^pbb-map-shell-[a-f0-9]+$/.test(n));
    return Promise.all(names.map(async name => ({ name, files: (await (await caches.open(name)).keys()).length })));
  });
  if (!installed.some(c => c.files === 97)) throw Error(JSON.stringify(installed));
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'geolocation', { configurable: true, value: { watchPosition(ok) { window.__fix = ok; return 1; }, clearWatch() {} } });
    let lib; Object.defineProperty(window, 'maplibregl', { get: () => lib, set(v) { lib = v; const Map = v.Map; v.Map = class extends Map { constructor(options) { super(options); window.__map = this; setTimeout(() => { this.fire('movestart', {originalEvent:{type:'fixture-navigation'}}); window.__fix?.({coords:{latitude:10.3157,longitude:123.8854,accuracy:80},timestamp:Date.now()}); }, 0); } }; } });
  });
  await context.setOffline(true); await page.close();
  const cold = await context.newPage(); cold.on('pageerror', e => errors.push(e.message));
  await cold.goto('https://map.pbb.ph/');
  await cold.getByRole('button', { name: 'Filter points of interest', exact: true }).waitFor({ timeout: 60000 });
  await cold.getByRole('button', { name: 'Filter points of interest', exact: true }).click();
  await cold.getByRole('columnheader', { name: 'Locations', exact: true }).waitFor({ timeout: 30000 });
  const lazy = await cold.evaluate(async names => {
    const { uiLoader, createUiLoader } = await import('./vendor/helpers/js/ui/ui.loader.js?v=0.21.285');
    const bundled = []; for (const name of names) { await uiLoader.get(name, { preferBundles: true }); bundled.push(name); }
    const fallback = createUiLoader();
    const modular = []; for (const name of names) { await fallback.get(name, { preferBundles: false }); modular.push(name); }
    const { magneticField } = await import('./assets/declination.js');
    const field = magneticField(10.3157, 123.8854, 0, new Date('2026-10-11'));
    if (!Number.isFinite(field?.decl)) throw Error('Direction model missing');
    const { createDirectionOptions } = await import('./assets/direction-options.js');
    const direction = createDirectionOptions({ createFormModal: await uiLoader.get('ui.form.modal', { preferBundles: true }), uiAlert: await uiLoader.get('ui.dialog.alert', { preferBundles: true }), getState: () => ({ eligible: true, selected: true }), apply() {} });
    direction.open(); window.__directionFixture = direction;
    return { bundled: bundled.length, modular: modular.length, directionModel: true, canvas: !!document.querySelector('.maplibregl-canvas'), bootError: !document.querySelector('#boot-status').hidden, terrain: !!window.__map.getTerrain(), poi: window.__map.querySourceFeatures('pbb-poi', { sourceLayer: 'poi' }).length };
  }, ["ui.navbar", "ui.map.controls", "ui.map.markers", "ui.toast", "ui.empty.state", "ui.busy.overlay", "ui.icons", "ui.menu", "ui.modal", "ui.search", "ui.events.createEventBag", "ui.action.modal", "ui.form.modal", "ui.dialog.alert", "ui.map.location.person", "ui.signal.strength", "ui.tree.grid", "ui.checkbox"]);
  await cold.getByRole('dialog', { name: 'Direction options', exact: true }).waitFor();
  await cold.getByLabel('Direction mode', { exact: true }).waitFor();
  await cold.screenshot({ path: 'output/playwright/map-shell-lazy-offline.png' });
  await cold.evaluate(() => window.__directionFixture.destroy());
  await context.setOffline(false);
  if (errors.length || lazy.bootError || !lazy.canvas || !lazy.terrain || !lazy.poi) throw Error(JSON.stringify({ errors, lazy }));
  return { installed, coldOffline: lazy, POIGrid: true, directionModal: true, errors };
}

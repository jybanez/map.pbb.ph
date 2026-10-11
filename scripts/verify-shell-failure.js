async page => {
  const target = 'https://map.pbb.ph/output/playwright/shell-failure/';
  const version = await page.evaluate(async target => (await (await fetch(`${target}fixture.json`, {cache:'no-store'})).json()).version, target);
  const failed = await page.evaluate(async target => {
    const sw = window.__nativeSW || navigator.serviceWorker;
    const registration = await sw.getRegistration(target);
    const outcome = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(Error('Update did not settle')), 30000);
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        worker.addEventListener('statechange', () => { if (worker.state === 'redundant') { clearTimeout(timeout); resolve({ rejected: true, active: registration.active?.state, waiting: !!registration.waiting }); } });
      }, { once: true });
    });
    await registration.update(); return outcome;
  }, target);
  await page.context().setOffline(true);
  const cold = await page.context().newPage(); await cold.goto(target); await cold.getByText('Saved shell remains available').waitFor();
  await page.context().setOffline(false); await cold.close();
  const cachesState = await page.evaluate(async version => {
    const names = await caches.keys();
    return { old: names.includes(`pbb-map-shell-${version}`), failed: names.includes(`pbb-map-shell-${version}-broken`) };
  }, version);
  if (!failed.rejected || failed.active !== 'activated' || failed.waiting || !cachesState.old || cachesState.failed) throw Error(JSON.stringify({failed,cachesState}));
  await page.evaluate(async ({target,version}) => { const sw = window.__nativeSW || navigator.serviceWorker; await (await sw.getRegistration(target)).unregister(); await caches.delete(`pbb-map-shell-${version}`); }, {target,version});
  return { failed, cachesState, coldOfflineOldShell: true };
}

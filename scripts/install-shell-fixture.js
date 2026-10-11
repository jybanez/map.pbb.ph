async page => {
  await page.goto('https://map.pbb.ph/');
  return await page.evaluate(async () => {
    const target = 'https://map.pbb.ph/output/playwright/shell-failure/';
    const sw = window.__nativeSW || navigator.serviceWorker;
    const registration = await sw.register(`${target}map-shell-worker.js`, {scope:target,updateViaCache:'none'});
    await new Promise((resolve,reject) => { const wait = () => { if(registration.active?.state==='activated')return resolve();if(registration.installing?.state==='redundant')return reject(Error('Initial install failed'));setTimeout(wait,50); };wait(); });
    return {active:registration.active.state,scope:registration.scope};
  });
}

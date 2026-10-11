async page => {
  const target='https://map.pbb.ph/output/playwright/shell-failure/';
  await page.goto(target);
  await page.evaluate(async()=>{const r=await navigator.serviceWorker.register('./map-shell-worker.js',{scope:'./',updateViaCache:'none'});await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Install timeout')),30000);const poll=()=>{if(r.active?.state==='activated'){clearTimeout(timer);resolve();}else setTimeout(poll,50);};poll();});});
  await page.reload();
  await page.evaluate(()=>{window.__sessionSentinel='uninterrupted';});
  return {old:await page.locator('p').innerText()};
}

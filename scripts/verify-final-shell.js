async page => {
  await page.goto('https://map.pbb.ph/');
  await page.waitForFunction(() => navigator.serviceWorker.controller,null,{timeout:60000});
  await page.waitForTimeout(3000);
  const installed=await page.evaluate(async()=>({caches:await caches.keys(),title:document.title,controls:document.querySelectorAll('#zoom-control button').length}));
  await page.context().setOffline(true);await page.close();
  const cold=await page.context().newPage();await cold.goto('https://map.pbb.ph/');
  await cold.getByRole('button',{name:'Zoom in',exact:true}).waitFor({timeout:30000});
  const offline=await cold.evaluate(()=>({title:document.title,canvas:!!document.querySelector('.maplibregl-canvas'),bootError:!document.querySelector('#boot-status').hidden,controls:document.querySelectorAll('#zoom-control button').length}));
  await page.context().setOffline(false);
  if(!offline.canvas||offline.bootError||offline.controls<3)throw Error(JSON.stringify({installed,offline}));
  return {installed,offline};
}

async page=>{
 const context=await page.context().browser().newContext({viewport:{width:375,height:850}}),errors=[],results={};
 try{
  await context.addInitScript(()=>{Object.defineProperty(navigator,'geolocation',{configurable:true,value:{watchPosition(ok){setTimeout(()=>ok({coords:{longitude:123.8854,latitude:10.3157,accuracy:20}}),500);return 1;},clearWatch(){}}});});
  const warm=await context.newPage();warm.on('pageerror',e=>errors.push(e.message));await warm.goto(__TARGET__);await warm.waitForFunction(()=>navigator.serviceWorker.controller&&document.querySelector('.ui-map-location-person-label')?.hidden===false,null,{timeout:90000});
  await warm.waitForFunction(async()=>{for(const n of await caches.keys())if(n.startsWith('pbb-map-shell-')&&(await(await caches.open(n)).keys()).length===44)return true;return false;},null,{timeout:90000});
  results.onlineLabel=await warm.locator('.ui-map-location-person-label').getAttribute('aria-label');await context.setOffline(true);await warm.close();
  const cold=await context.newPage();cold.on('pageerror',e=>errors.push(e.message));await cold.goto(__TARGET__);await cold.waitForFunction(()=>document.querySelector('.ui-map-location-person-label')?.hidden===false,null,{timeout:90000});
  results.offlineLabel=await cold.locator('.ui-map-location-person-label').getAttribute('aria-label');results.assets=await cold.evaluate(()=>performance.getEntriesByType('resource').filter(e=>e.name.includes('/vendor/helpers/')).map(e=>new URL(e.name).pathname+new URL(e.name).search));
  if(new Set(results.assets).size!==3||!results.assets.some(u=>u.includes('bundle.min.js?v=0.21.319'))||errors.length)throw Error(JSON.stringify({results,errors}));await cold.screenshot({path:'output/playwright/person286-offline-375.png'});return {...results,offlineColdStart:true,errors};
 }finally{await context.close();}
}

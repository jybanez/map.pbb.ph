async(page)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));const cached=[];
 const cdp=await page.context().newCDPSession(page);await cdp.send('Network.enable');cdp.on('Network.responseReceived',e=>{if(e.response.url.includes('/assets/map-style.js'))cached.push({url:e.response.url,fromDiskCache:e.response.fromDiskCache,fromServiceWorker:e.response.fromServiceWorker});});
 await page.addInitScript(()=>{let lib;Object.defineProperty(window,'maplibregl',{configurable:true,get:()=>lib,set:v=>{lib=v;const M=v.Map;v.Map=class extends M{constructor(o){super(o);window.__map=this;}};}});});
 await page.goto('http://127.0.0.1:8767/');await page.waitForFunction(()=>window.__map?.loaded());
 const prior=await page.evaluate(()=>window.__map.getFilter('pbb-poi-points'));
 if(JSON.stringify(prior).includes('name:en'))throw Error('Legacy fixture not seeded');
 await page.reload();await page.waitForFunction(()=>window.__map?.loaded());
 // The origin and browser context remain identical; do not clear caches or enable routing.
 const warmLegacy=await page.evaluate(()=>window.__map.getFilter('pbb-poi-points'));
 await page.evaluate(()=>fetch('/__upgrade',{method:'POST'}));
 await page.reload();await page.waitForFunction(()=>window.__map?.loaded());
 const current=await page.evaluate(()=>window.__map.getFilter('pbb-poi-points'));
 const requests=await page.evaluate(async()=>await(await fetch('/__evidence')).json());
 const legacyRequests=requests.filter(r=>r.url==='/assets/map-style.js');
 if(legacyRequests.length!==1)throw Error('Old module not reused from cache: '+legacyRequests.length);
 if(!JSON.stringify(current).includes('name:en')||current[0]!=='all')throw Error('Stale label expression retained');
 if(!requests.some(r=>r.url==='/assets/map-style.js?v=20261011-named-pois1'&&r.upgraded))throw Error('New style URL not fetched');
 if(errors.length)throw Error(errors.join(';'));
 return {prior,warmLegacy,current,styleNetworkResponses:cached,legacyStyleServerRequests:legacyRequests.length,newStyleFetched:true,cacheCleared:false,requests:requests.filter(r=>r.url.includes('map-style')||r.url.includes('/assets/app.js')),errors,limit:'Isolated localhost fixture seeds old HTTP-cached module; same actual app source/new URL after upgrade. No production cache or server configuration changes.'};
}
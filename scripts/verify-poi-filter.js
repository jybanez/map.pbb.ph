async(page)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/assets/app.js?*',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replace('const poiFilter = createPoiFilter(','window.__retryMap=()=>initialize();const poiFilter = window.__poiFilter = createPoiFilter(')});});
 await page.addInitScript(()=>{Object.defineProperty(navigator,'geolocation',{configurable:true,value:{getCurrentPosition(ok){ok({coords:{latitude:10.3157,longitude:123.8854,accuracy:20}})}}});let lib;Object.defineProperty(window,'maplibregl',{get:()=>lib,set(v){lib=v;const M=v.Map;v.Map=class extends M{constructor(o){super(o);window.__map=this}}}})});
 await page.goto('https://map.pbb.ph/');await page.waitForFunction(()=>window.__map?.getLayer('pbb-poi-points')); 
 await page.evaluate(()=>window.__map.jumpTo({zoom:15,pitch:0}));await page.waitForTimeout(2500);
 await page.getByRole('button',{name:'Filter points of interest',exact:true}).click();await page.getByRole('columnheader',{name:'Loaded count',exact:true}).waitFor();
 const initial=await page.evaluate(()=>({rows:window.__poiFilter.state.count(window.__map.querySourceFeatures('pbb-poi',{sourceLayer:'poi'})),text:document.querySelector('[role=dialog]')?.textContent}));
 await page.screenshot({path:'output/playwright/poi-filter-desktop.png'});
 return {initial,errors};
}

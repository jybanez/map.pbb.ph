async(page)=>{
  const errors=[],queries=[],requests=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));
  const cdp=await page.context().newCDPSession(page);await cdp.send('Network.enable');await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
  await page.setViewportSize({width:1440,height:900});
  await page.addInitScript(()=>{Object.defineProperty(navigator,'geolocation',{configurable:true,value:{getCurrentPosition(ok){ok({coords:{latitude:10.3157,longitude:123.8854,accuracy:20}});}}});let lib;Object.defineProperty(window,'maplibregl',{configurable:true,get:()=>lib,set(v){lib=v;const M=v.Map;v.Map=class extends M{constructor(o){super(o);window.__map=this;}};}});});
  await page.goto('https://map.pbb.ph/');await page.waitForFunction(()=>window.__map?.loaded()&&!window.__map.isMoving());
  const input=page.getByRole('textbox',{name:'Search map'}),menu=page.getByRole('menu',{name:'Map search results'});
  for(const value of ['10.3, 123.9','90,180','-90,-180','91,20','10,181','10,','NaN,20','1e2,20','12x,30','10.3 123.9']){
    await input.fill(value);const invalid=await input.getAttribute('aria-invalid');const expected=['91,20','10,181','10,','NaN,20','1e2,20','12x,30','10.3 123.9'].includes(value);
    if(Boolean(invalid)!==expected)throw Error('Validation '+value);queries.push({value,invalid:!!invalid});
  }
  await input.fill('10.32,123.91');const markerBefore=await page.evaluate(()=>window.__map.getCenter().toArray());
  const markerLngLat=await page.evaluate(()=>JSON.stringify(window.__map.getSource('pbb-accuracy')._data));
  await input.press('Enter');await page.waitForTimeout(250);if(!await page.evaluate(()=>window.__map.isMoving()))throw Error('Search not animated');
  await page.waitForFunction(()=>!window.__map.isMoving());const center=await page.evaluate(()=>window.__map.getCenter().toArray());if(Math.abs(center[0]-123.91)>0.0003||Math.abs(center[1]-10.32)>0.0003)throw Error('Search center wrong');
  if(await page.evaluate(()=>JSON.stringify(window.__map.getSource('pbb-accuracy')._data))!==markerLngLat)throw Error('Location data changed');
  await page.waitForFunction(()=>window.__map.isSourceLoaded('pbb-poi')&&window.__map.querySourceFeatures('pbb-poi',{sourceLayer:'poi'}).some(f=>f.geometry?.type==='Point'&&(f.properties?.name||f.properties?.['name:en'])));
  const realPoi=await page.evaluate(()=>{const f=window.__map.querySourceFeatures('pbb-poi',{sourceLayer:'poi'}).find(f=>f.geometry?.type==='Point'&&(f.properties?.name||f.properties?.['name:en']));return{name:String(f.properties.name||f.properties['name:en']),coordinates:f.geometry.coordinates};});
  await input.fill(realPoi.name);await menu.waitFor();if(await input.getAttribute('aria-invalid'))throw Error('Real POI validation');
  if(!(await menu.innerText()).includes(realPoi.name))throw Error('Real POI missing');
  await page.evaluate(()=>{window.__map.querySourceFeatures=()=>['7-Eleven','3J Store'].map(name=>({geometry:{type:'Point',coordinates:[123.9,10.3]},properties:{name}}));});
  for(const name of ['7-Eleven','3J Store']){await input.fill(name);await menu.waitFor();if(await input.getAttribute('aria-invalid')||!(await menu.innerText()).includes(name))throw Error('Numeric-leading POI blocked');}
  await page.evaluate(()=>{window.__original=window.__map.querySourceFeatures;window.__map.setLayoutProperty('pbb-poi-points','visibility','none');window.__map.setLayoutProperty('pbb-poi-labels','visibility','none');const f={geometry:{type:'Point',coordinates:[123.9,10.3]},properties:{name:'Cafe <script>sample</script>'}};window.__map.querySourceFeatures=()=>[f,f];});
  await input.fill('Cafe');await menu.waitFor();if(await menu.locator('[role="menuitem"]:not([disabled])').count()!==1)throw Error('POI duplicate');
  await menu.getByText('Loaded tiles only — coverage may be incomplete.').waitFor();
  if(await page.locator('#map-search script,.pbb-search-results script').count())throw Error('Unsafe text');
  await page.setViewportSize({width:375,height:740});await input.scrollIntoViewIfNeeded();await input.fill('Caf');await menu.waitFor();await page.waitForTimeout(200);
  await page.screenshot({path:'output/playwright/search-mobile.png'});
  const layout=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,nav:document.querySelector('.ui-navbar').className,menu:document.querySelector('.pbb-search-results').getBoundingClientRect().toJSON()}));if(layout.overflow||layout.menu.right>375)throw Error('Mobile overflow');
  await page.evaluate(()=>window.__map.querySourceFeatures=()=>[]);await input.fill('No match');await page.getByText(/^No matching named POIs/).waitFor();
  await page.evaluate(()=>window.__map.querySourceFeatures=()=>{throw Error('unavailable');});await input.fill('Cafe');await page.getByText(/^Loaded POI data is unavailable/).waitFor();
  await input.fill('91,20');await input.press('Escape');if(await input.getAttribute('aria-invalid'))throw Error('Stale validation');
  await page.evaluate(()=>window.dispatchEvent(new Event('pagehide')));if(await page.locator('#map-search').count())throw Error('Search not cleaned');
  if(errors.length)throw Error(errors.join(';'));
  const external=requests.filter(u=>/^https?:/.test(u)&&!['map.pbb.ph','mapserver.pbb.ph'].includes(new URL(u).hostname));if(external.length)throw Error('External requests');
  const imports=await page.evaluate(()=>performance.getEntriesByType('resource').map(r=>r.name).filter(n=>/\/assets\/(boot|app|map-search)\.js/.test(n)));
  if(!['boot','app','map-search'].every(name=>imports.some(n=>n.includes('/'+name+'.js?v=20261010-search3'))))throw Error('Stale imports');
  return{date:'2026-10-10',queries,realPoi,numericLeadingPoiNames:['7-Eleven','3J Store'],center,animated:true,locationDataPreserved:true,syntheticPoiDedup:true,hiddenPoiSearch:true,coverageVisible:true,emptyAndUnavailable:true,escape:true,layout,cleanup:true,imports,externalRequests:external,uncaughtErrors:errors};
}




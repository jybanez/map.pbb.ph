async page=>{
const results=[];let stage="boot";
for(const width of [1200,375]){
 const context=await page.context().browser().newContext({viewport:{width,height:900},hasTouch:width===375,permissions:['geolocation'],geolocation:{latitude:10.315,longitude:123.89,accuracy:25}}),tab=await context.newPage(),errors=[];
 tab.on('pageerror',e=>errors.push(e.message));
 await context.addInitScript(()=>{if(window.__rulerCapture)return;window.__rulerCapture=true;let lib;Object.defineProperty(window,'maplibregl',{configurable:true,get:()=>lib,set(v){lib=v;const Base=v.Map;v.Map=class extends Base{constructor(o){super(o);window.__map=this;}};}});});
 const check=()=>tab.waitForFunction(()=>{const m=window.__map,s=m?.getStyle(),line=s?.layers.find(l=>/^helper-ruler-.*-line$/.test(l.id)),points=s?.layers.find(l=>/^helper-ruler-.*-points$/.test(l.id));if(!line||!points)return false;const data=m.getSource(line.source)?.serialize().data,coords=data?.features.find(f=>f.geometry.type==='LineString')?.geometry.coordinates;if(!coords||coords.length!==2)return false;return m.queryRenderedFeatures({layers:[line.id]}).length>0&&coords.every(c=>{const p=m.project(c);const rendered=m.getTerrain()?m.queryRenderedFeatures({layers:[points.id]}):m.queryRenderedFeatures([[p.x-5,p.y-5],[p.x+5,p.y+5]],{layers:[points.id]});return rendered.some(f=>f.geometry.type==='Point'&&Math.abs(f.geometry.coordinates[0]-c[0])<.00001&&Math.abs(f.geometry.coordinates[1]-c[1])<.00001);});},null,{timeout:60000});
 try{
  await tab.goto('https://map.pbb.ph/');await tab.waitForFunction(()=>navigator.serviceWorker.controller&&window.__map?.getSource('pbb-accuracy-ripple'));
  stage="warm";await tab.reload();await tab.waitForFunction(()=>window.__map?.getSource('pbb-accuracy-ripple'));
  const before=await tab.evaluate(async()=>({controller:navigator.serviceWorker.controller?.scriptURL,caches:await caches.keys(),helper:performance.getEntriesByType('resource').filter(e=>e.name.includes('/vendor/helpers/')).map(e=>e.name)}));
  if(!before.controller||!before.helper.some(u=>u.includes('helpers.ui.bundle.min.js?v=0.21.313')))throw Error('Incorrect controlled runtime '+JSON.stringify(before));
  await tab.getByRole('button',{name:'Set pitch 60 degrees',exact:true}).click();await tab.waitForFunction(()=>!__map.isMoving());
  await tab.getByRole('button',{name:'Measure straight-line distance',exact:true}).click();
  const box=await tab.locator('canvas').first().boundingBox(),a={x:box.x+box.width*.35,y:box.y+box.height*.4},b={x:box.x+box.width*.6,y:box.y+box.height*.65};
  const click=p=>width===375?tab.touchscreen.tap(p.x,p.y):tab.mouse.click(p.x,p.y);
  stage='preview';await click(a);if(width===1200){await tab.mouse.move(b.x,b.y);await check();}stage='fixed';await click(b);await check();
  const distance=await tab.locator('.ui-map-ruler__distance').textContent();
  for(const camera of [{zoom:14,pitch:0,bearing:0},{zoom:15,pitch:60,bearing:85}]){stage='camera-'+JSON.stringify(camera);await tab.evaluate(camera=>__map.jumpTo(camera),camera);await check();}
  for(const enabled of [false,true]){stage='terrain-'+enabled;await tab.evaluate(enabled=>__map.setTerrain(enabled?{source:'terrain',exaggeration:1.6}:null),enabled);await check();}
  for(const diff of [false,true]){stage='style-'+diff;await tab.evaluate(diff=>__map.setStyle(__map.getStyle(),{diff}),diff);await check();}
  await tab.screenshot({path:`output/playwright/ruler247-served-${width}.png`});
  const geometry=await tab.evaluate(()=>({layers:__map.getStyle().layers.filter(l=>l.id.startsWith('helper-ruler')).map(l=>({id:l.id,rendered:__map.queryRenderedFeatures({layers:[l.id]}).length})),ripple:!!__map.getSource('pbb-accuracy-ripple')}));
  await tab.getByRole('button',{name:'Exit ruler',exact:true}).click();
  stage='offline';await context.setOffline(true);await tab.reload();await tab.getByRole('button',{name:'Measure straight-line distance',exact:true}).waitFor();
  const offline=await tab.evaluate(()=>({bootError:!document.querySelector('#boot-status').hidden,controller:!!navigator.serviceWorker.controller,helper:performance.getEntriesByType('resource').filter(e=>e.name.includes('/vendor/helpers/')).map(e=>e.name)}));
  if(offline.bootError||!offline.controller||errors.length)throw Error(JSON.stringify({offline,errors}));results.push({width,before,distance,geometry,offline,errors});
 }catch(error){const diagnostic=await tab.evaluate(()=>({styleLoaded:__map.isStyleLoaded(),camera:{zoom:__map.getZoom(),pitch:__map.getPitch(),bearing:__map.getBearing()},ripple:!!__map.getSource('pbb-accuracy-ripple'),layers:__map.getStyle().layers.filter(l=>l.id.startsWith('helper-ruler')).map(l=>({id:l.id,data:__map.getSource(l.source)?.serialize().data,rendered:__map.queryRenderedFeatures({layers:[l.id]}).map(f=>f.geometry)}))}));await tab.screenshot({path:`output/playwright/ruler247-served-failure-${width}-${Date.now()}.png`});throw Error(JSON.stringify({width,stage,diagnostic,errors,error:error.message}));}finally{await context.close();}
}
return results;
}

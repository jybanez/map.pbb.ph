async page=>{
const results=[];let stage="boot";
for(const width of [1200,375]){
 const context=await page.context().browser().newContext({viewport:{width,height:900},hasTouch:width===375,permissions:['geolocation'],geolocation:{latitude:10.315,longitude:123.89,accuracy:25}}),tab=await context.newPage(),errors=[];
 const refresh=setInterval(()=>{void context.setGeolocation({latitude:10.315,longitude:123.89,accuracy:25}).catch(e=>errors.push('Synthetic GPS refresh: '+e.message));},20000);
 tab.on('pageerror',e=>errors.push(e.message));
 await context.addInitScript(()=>{if(window.__rulerCapture)return;window.__rulerCapture=true;let lib;Object.defineProperty(window,'maplibregl',{configurable:true,get:()=>lib,set(v){lib=v;const Base=v.Map;v.Map=class extends Base{constructor(o){super(o);window.__map=this;}};}});});
 const check=()=>tab.waitForFunction(()=>{const m=window.__map,s=m?.getStyle(),line=s?.layers.find(l=>/^helper-ruler-.*-line$/.test(l.id)),points=s?.layers.find(l=>/^helper-ruler-.*-points$/.test(l.id));if(!line||!points||m.getLayoutProperty('pbb-accuracy-ripple-line','visibility')!=='visible'||m.getSource('pbb-accuracy-ripple')?.serialize().data.features.length!==3||!m.queryRenderedFeatures({layers:['pbb-accuracy-ripple-fill']}).length)return false;const data=m.getSource(line.source)?.serialize().data,coords=data?.features.find(f=>f.geometry.type==='LineString')?.geometry.coordinates;if(!coords||coords.length!==2)return false;return m.queryRenderedFeatures({layers:[line.id]}).length>0&&coords.every(c=>{const p=m.project(c);const rendered=m.getTerrain()?m.queryRenderedFeatures({layers:[points.id]}):m.queryRenderedFeatures([[p.x-5,p.y-5],[p.x+5,p.y+5]],{layers:[points.id]});return rendered.some(f=>f.geometry.type==='Point'&&Math.abs(f.geometry.coordinates[0]-c[0])<.00001&&Math.abs(f.geometry.coordinates[1]-c[1])<.00001);});},null,{timeout:60000});
 try{
  await tab.goto('https://map.pbb.ph/');await tab.waitForFunction(()=>navigator.serviceWorker.controller&&window.__map?.getSource('pbb-accuracy-ripple'));
  stage="warm";await tab.reload();await tab.waitForFunction(()=>window.__map?.getSource('pbb-accuracy-ripple'));
  const before=await tab.evaluate(async()=>({controller:navigator.serviceWorker.controller?.scriptURL,caches:await caches.keys(),helper:performance.getEntriesByType('resource').filter(e=>e.name.includes('/vendor/helpers/')).map(e=>e.name)}));
  if(!before.controller||!before.helper.some(u=>u.includes('helpers.ui.bundle.min.js?v=0.21.314')))throw Error('Incorrect controlled runtime '+JSON.stringify(before));
  await tab.getByRole('button',{name:'Set pitch 60 degrees',exact:true}).click();await tab.waitForFunction(()=>!__map.isMoving());await tab.waitForFunction(()=>__map.isSourceLoaded('osm')&&!document.body.textContent.includes('Some map detail is unavailable. Reconnect'),null,{timeout:120000});
  await tab.getByRole('button',{name:'Measure straight-line distance',exact:true}).click();
  const box=await tab.locator('canvas').first().boundingBox(),a={x:box.x+box.width*.35,y:box.y+box.height*.4},b={x:box.x+box.width*.6,y:box.y+box.height*.65};
  const click=p=>width===375?tab.touchscreen.tap(p.x,p.y):tab.mouse.click(p.x,p.y);
  stage='preview';await click(a);if(width===1200){await tab.mouse.move(b.x,b.y);await check();}stage='fixed';await click(b);await check();
  const storageBefore=await tab.evaluate(()=>JSON.stringify({...localStorage}));
  const drags=[];const cdp=width===375?await context.newCDPSession(tab):null;
  const snapshot=()=>tab.evaluate(()=>{const m=__map,l=m.getStyle().layers.find(l=>/^helper-ruler-.*-line$/.test(l.id)),d=m.getSource(l.source).serialize().data,c=d.features.find(f=>f.geometry.type==='LineString').geometry.coordinates;return{coords:c,text:document.querySelector('.ui-map-ruler__distance').textContent,meters:new maplibregl.LngLat(...c[0]).distanceTo(new maplibregl.LngLat(...c[1])),pan:m.dragPan.isEnabled(),copyDisabled:document.querySelector('[aria-label="Copy distance"]').disabled,storage:JSON.stringify({...localStorage})};});
  for(const [i,p] of [a,b].entries()){
   stage='drag-'+i;const original=await snapshot();
   if(cdp)await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:p.x,y:p.y,id:0}]});else{await tab.mouse.move(p.x,p.y);await tab.mouse.down();}
   for(let j=1;j<=4;j++){const q={x:p.x+j*4,y:p.y+j*3};if(cdp)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{...q,id:0}]});else await tab.mouse.move(q.x,q.y);}
   await check();const mid=await snapshot();if(mid.pan||!mid.copyDisabled||JSON.stringify(mid.coords[i])===JSON.stringify(original.coords[i])||JSON.stringify(mid.coords[1-i])!==JSON.stringify(original.coords[1-i])||mid.text===original.text)throw Error('Continuous drag cues/navigation '+JSON.stringify({original,mid}));
   const expected=mid.meters>=1000?(mid.meters/1000).toFixed(2)+' km':Math.round(mid.meters)+' m';if(mid.text!==expected)throw Error('Native distance format '+JSON.stringify(mid));
   if(cdp)await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});else await tab.mouse.up();
   await check();const final=await snapshot();if(!final.pan||JSON.stringify(final.coords)!==JSON.stringify(mid.coords)||final.storage!==storageBefore)throw Error('Drag release/storage');
   await tab.screenshot({path:`output/playwright/ruler255-served-${width}-drag-${i}.png`});drags.push({original,mid,final});
  }
  stage='off-target-pan';if(cdp)await tab.waitForTimeout(400);const prior=await snapshot(),center=await tab.evaluate(()=>__map.getCenter().toArray());const q={x:box.x+box.width*.15,y:box.y+box.height*.2};
  if(cdp){await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...q,id:0}]});for(let j=1;j<=5;j++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:q.x+j*4,y:q.y+j*2,id:0}]});await tab.waitForTimeout(30);}await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}else{await tab.mouse.move(q.x,q.y);await tab.mouse.down();await tab.mouse.move(q.x+20,q.y+10,{steps:5});await tab.mouse.up();}
  await tab.waitForFunction(()=>!__map.isMoving());await tab.evaluate(()=>__map.stop());if(JSON.stringify(center)===JSON.stringify(await tab.evaluate(()=>__map.getCenter().toArray()))||JSON.stringify((await snapshot()).coords)!==JSON.stringify(prior.coords))throw Error('Off-target gesture');await check();
  const distance=await tab.locator('.ui-map-ruler__distance').textContent();
  for(const camera of [{zoom:14,pitch:0,bearing:0},{zoom:13.5,pitch:60,bearing:85}]){stage='camera-'+JSON.stringify(camera);await tab.evaluate(camera=>__map.jumpTo(camera),camera);await check();}
  for(const enabled of [false,true]){stage='terrain-'+enabled;await tab.evaluate(enabled=>__map.setTerrain(enabled?{source:'terrain',exaggeration:1.6}:null),enabled);await check();}
  for(const diff of [false,true]){stage='style-'+diff;await tab.evaluate(diff=>__map.setStyle(__map.getStyle(),{diff}),diff);await check();}
  await tab.screenshot({path:`output/playwright/ruler255-served-${width}.png`});
  const geometry=await tab.evaluate(()=>({layers:__map.getStyle().layers.filter(l=>l.id.startsWith('helper-ruler')).map(l=>({id:l.id,rendered:__map.queryRenderedFeatures({layers:[l.id]}).length})),ripple:!!__map.getSource('pbb-accuracy-ripple'),rippleVisible:__map.getLayoutProperty('pbb-accuracy-ripple-line','visibility')==='visible'}));
  await tab.getByRole('button',{name:'Exit ruler',exact:true}).click();
  stage='offline';await context.setOffline(true);await tab.reload();await tab.getByRole('button',{name:'Measure straight-line distance',exact:true}).waitFor();
  const offline=await tab.evaluate(()=>({bootError:!document.querySelector('#boot-status').hidden,controller:!!navigator.serviceWorker.controller,helper:performance.getEntriesByType('resource').filter(e=>e.name.includes('/vendor/helpers/')).map(e=>e.name)}));
  if(offline.bootError||!offline.controller||errors.length)throw Error(JSON.stringify({offline,errors}));results.push({width,before,drags,distance,geometry,offline,errors});
 }catch(error){const diagnostic=await tab.evaluate(()=>({styleLoaded:__map.isStyleLoaded(),camera:{zoom:__map.getZoom(),pitch:__map.getPitch(),bearing:__map.getBearing()},ripple:!!__map.getSource('pbb-accuracy-ripple'),rippleVisible:__map.getLayoutProperty('pbb-accuracy-ripple-line','visibility')==='visible',layers:__map.getStyle().layers.filter(l=>l.id.startsWith('helper-ruler')).map(l=>({id:l.id,data:__map.getSource(l.source)?.serialize().data,rendered:__map.queryRenderedFeatures({layers:[l.id]}).map(f=>f.geometry)}))}));await tab.screenshot({path:`output/playwright/ruler255-served-failure-${width}-${Date.now()}.png`});throw Error(JSON.stringify({width,stage,diagnostic,errors,error:error.message}));}finally{clearInterval(refresh);await context.close();}
}
return results;
}

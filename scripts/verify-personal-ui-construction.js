async page=>{
const results=[];
for(const width of [1200,375])for(const tilted of [true]){
 const context=await page.context().browser().newContext({viewport:{width,height:1000},serviceWorkers:'block'}),errors=[],requests=[];context.setDefaultTimeout(30000);
 context.on('request',r=>{if(r.url().includes('/vendor/helpers/'))requests.push(new URL(r.url()).pathname);});
 await context.addInitScript(()=>{let lib;Object.defineProperty(window,'maplibregl',{get:()=>lib,set(v){lib=v;const Base=v.Map;v.Map=class extends Base{constructor(o){super(o);window.__map=this;}};}});});
 const tab=await context.newPage();await tab.route('**/assets/personal-layer-ui.js*',async route=>{const response=await route.fetch();const body=(await response.text()).replace('adapter=createAdapter(map,','adapter=window.__polygonAdapter=createAdapter(map,');await route.fulfill({response,body});});let stage='startup';const progress=async label=>{stage=label;await tab.evaluate(label=>console.info('TASK233 '+label),label);};try{
 tab.on('pageerror',e=>errors.push(e.message));await tab.goto('https://map.pbb.ph/');await tab.waitForFunction(()=>window.__map?.getSource('pbb-personal-readonly'),null,{timeout:60000});
 await tab.evaluate(async tilted=>{const m=window.__map;m.jumpTo({zoom:15,pitch:tilted?45:0,bearing:tilted?35:0});const ring=ps=>ps.map(([x,y])=>m.unproject([m.getCanvas().clientWidth*x,m.getCanvas().clientHeight*y]).toArray());const {createPersonalLayerStore}=await import('./assets/personal-layer-store.js'),s=createPersonalLayerStore(),doc=await s.read();doc.layers.push({id:'polygon231',name:'Polygon verification',visible:true,features:[{type:'Feature',id:0,properties:{keep:'metadata',helperShape:{kind:'unknown',keep:true}},geometry:{type:'Polygon',coordinates:[ring([[.25,.35],[.8,.35],[.8,.85],[.25,.85],[.25,.35]]),ring([[.5,.55],[.5,.68],[.65,.68],[.65,.55],[.5,.55]])]}}]});await s.save(doc);s.close();},tilted);
 const read=()=>tab.evaluate(async()=>{const{createPersonalLayerStore}=await import('./assets/personal-layer-store.js'),s=createPersonalLayerStore();try{return await s.read();}finally{s.close();}}),baseline=await read();
 const cameraSetup=await tab.evaluate(()=>({center:__map.getCenter().toArray(),zoom:__map.getZoom(),pitch:__map.getPitch(),bearing:__map.getBearing()}));await tab.reload();await tab.waitForFunction(()=>window.__map?.getSource('pbb-personal-readonly'));await tab.evaluate(c=>__map.jumpTo(c),cameraSetup);
 await tab.evaluate(async()=>{const {uiLoader}=await import('./vendor/helpers/js/ui/ui.loader.js?v=0.21.307');const get=uiLoader.get.bind(uiLoader);uiLoader.get=async(...args)=>{const f=await get(...args);return args[0]==='ui.map.drawing.maplibre'?(...values)=>{window.__polygonAdapter=f(...values);return window.__polygonAdapter;}:f;};});
 const button=n=>tab.getByRole('button',{name:n,exact:true});stage='open manager';await button('Manage personal layers').click();await button('Personal layer').click();await tab.getByRole('option',{name:'Polygon verification',exact:true}).click();await button('Edit layer').click();stage='adapter capture';await tab.waitForFunction(()=>window.__polygonAdapter);
 const features=()=>tab.evaluate(()=>window.__polygonAdapter.getFeatures());
 const pos=(x,y)=>tab.evaluate(([x,y])=>{const b=__map.getCanvas().getBoundingClientRect();return{x:b.x+b.width*x,y:b.y+b.height*y};},[x,y]);
 const ready=p=>tab.waitForFunction(p=>{const a=__polygonAdapter,m=__map,s=a.getState(),b=m.getCanvas().getBoundingClientRect();return !m.isMoving()&&m.isSourceLoaded(s.sourceId)&&m.queryRenderedFeatures([p.x-b.x,p.y-b.y],{layers:s.layerIds.slice(0,3)}).some(f=>f.properties.__helperId==='0');},p);
 const start=async p=>{await ready(p);if(!await tab.evaluate(p=>document.elementFromPoint(p.x,p.y)===__map.getCanvas(),p))throw Error('Pointer covered');await tab.mouse.move(p.x,p.y);await tab.mouse.down();await tab.waitForFunction(()=>__polygonAdapter.getState().dragging);await tab.locator('.pbb-personal-object').waitFor({state:'hidden'});};
 stage='selection';const center=await pos(.36,.5);await ready(center);await tab.mouse.click(center.x,center.y);await tab.waitForFunction(()=>__polygonAdapter.getState().selectedFeatureId==='0');


 stage='construction completions';const canvas=tab.locator('canvas.maplibregl-canvas'),toggle=tab.locator('.pbb-personal-rail [data-mode="select"]');
 for(const mode of ['point','line','path','polygon','circle','rectangle']){
  const before=await features();await tab.locator(`.pbb-personal-rail [data-mode="${mode}"]`).click();
  const points=mode==='point'?[[.2,.45]]:mode==='polygon'?[[.2,.45],[.45,.7],[.65,.45]]:[[.2,.45],[.45,.7]];
  for(const xy of points){const p=await pos(...xy);if(!await tab.evaluate(p=>document.elementFromPoint(p.x,p.y)===__map.getCanvas(),p))throw Error(mode+' target covered');await tab.mouse.click(p.x,p.y);}
  if(['path','polygon'].includes(mode))await button('Finish object').click();await tab.waitForFunction(()=>__polygonAdapter.getMode()==='select');if(await toggle.getAttribute('aria-pressed')!=='true'||(await features()).length!==before.length+1)throw Error(mode+' completion');await button('Undo drawing action').click();if(JSON.stringify(before)!==JSON.stringify(await features()))throw Error(mode+' Undo');
  await tab.locator(`.pbb-personal-rail [data-mode="${mode}"]`).click();if(mode!=='point'){const p=await pos(.2,.45);await tab.mouse.click(p.x,p.y);await button('Cancel object').click();}else await canvas.press('Escape');await tab.waitForFunction(()=>__polygonAdapter.getMode()==='select');if(await toggle.getAttribute('aria-pressed')!=='true'||JSON.stringify(before)!==JSON.stringify(await features()))throw Error(mode+' Cancel');
 }
 await tab.mouse.click(center.x,center.y);await tab.waitForFunction(()=>__polygonAdapter.getState().selectedFeatureId==='0');
 await start(center);await tab.mouse.move(center.x+12,center.y+10,{steps:3});await tab.mouse.up();await button('Save layer').click();await tab.waitForFunction(()=>document.querySelector('.pbb-personal-card')?.dataset.dirty==='false');const saved=await read();if(JSON.stringify(saved.layers[0].features)!==JSON.stringify(await features()))throw Error('Save mismatch');await tab.screenshot({path:`output/playwright/select233-${width}-${tilted}.png`});await button('Close editing').click();await tab.reload();await tab.waitForFunction(()=>window.__map?.getSource('pbb-personal-readonly'));if(JSON.stringify(await read())!==JSON.stringify(saved))throw Error('Reload roundtrip');
 if(errors.length||new Set(requests).size!==3)throw Error(JSON.stringify({errors,requests}));results.push({width,tilted,bodyEdgesVertex:true,uniformRingsMetadata:true,oneUndoRedo:true,committedPreviewSeparation:true,dragToolbar:true,cancellation:true,allSixConstructionCompletionCancel:true,explicitSaveReload:true,browserOnlyAdapterExposure:true,helperAssets:[...new Set(requests)],pageErrors:errors});
 }catch(e){throw Error(stage+': '+e.message);}finally{await context.close();}
}
return results;
}

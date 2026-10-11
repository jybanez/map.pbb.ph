async(page)=>{
 const errors=[],tiles=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.url().includes('/tiles/'))tiles.push(r.url());});
 await page.addInitScript(()=>{let lib;Object.defineProperty(window,'maplibregl',{configurable:true,get:()=>lib,set:v=>{lib=v;const M=v.Map;v.Map=class extends M{constructor(o){super(o);window.__map=this;}};}});});
 await page.setViewportSize({width:1440,height:900});await page.goto('https://map.pbb.ph/');await page.waitForFunction(()=>window.__map?.loaded());
 const initial=await page.evaluate(async()=>{const {config}=await import('/assets/config.js?v=20261011-zoom24-1');return {max:window.__map.getMaxZoom(),initial:window.__map.getZoom(),locate:config.locationZoom};});
 if(initial.max!==24||initial.initial!==12||initial.locate!==15)throw Error('Camera defaults mismatch');
 await page.evaluate(()=>window.__map.jumpTo({zoom:15,pitch:0}));await page.waitForFunction(()=>window.__map.loaded());
 const target=await page.evaluate(()=>{const f=window.__map.queryRenderedFeatures({layers:['pbb-poi-points']}).find(f=>typeof f.properties.name==='string'&&f.properties.name.trim());return f?{coordinates:f.geometry.coordinates,name:f.properties.name}:null;});if(!target)throw Error('No bounded named POI');
 await page.evaluate(t=>window.__map.jumpTo({center:t.coordinates,zoom:18,pitch:0}),target);
 const steps=[];for(let z=19;z<=24;z++){await page.getByRole('button',{name:'Zoom in',exact:true}).click();await page.waitForFunction(()=>!window.__map.isMoving());const actual=await page.evaluate(()=>window.__map.getZoom());if(Math.abs(actual-z)>.01)throw Error('Control zoom mismatch '+actual);steps.push(actual);}
 await page.waitForFunction(()=>window.__map.loaded());
 const high=await page.evaluate(async()=>{const m=window.__map;const {poiName}=await import('/assets/poi-name.js?v=20261011-zoom24-1');const fs=m.queryRenderedFeatures({layers:['pbb-poi-points','pbb-poi-labels']});return {zoom:m.getZoom(),named:fs.filter(f=>poiName(f.properties)).length,unnamed:fs.filter(f=>!poiName(f.properties)).length,sourceLimits:Object.fromEntries(['osm','pbb-poi','terrain'].map(id=>[id,m.getStyle().sources[id].maxzoom])),configResources:performance.getEntriesByType('resource').filter(r=>r.name.includes('/assets/config.js')).map(r=>r.name)};});
 if(!high.named||high.unnamed||high.sourceLimits.osm!==14||high.sourceLimits['pbb-poi']!==14||high.sourceLimits.terrain!==12)throw Error('High zoom/source regression');
 await page.getByRole('button',{name:'Zoom in',exact:true}).click();await page.waitForFunction(()=>!window.__map.isMoving());if(await page.evaluate(()=>window.__map.getZoom())!==24)throw Error('Maximum not clamped');
 await page.screenshot({path:'output/playwright/zoom24-desktop.png'});
 await page.getByRole('button',{name:'Zoom out',exact:true}).click();await page.waitForFunction(()=>!window.__map.isMoving());const down=await page.evaluate(()=>window.__map.getZoom());if(down!==23)throw Error('Zoom out failed');
 if(errors.length)throw Error(errors.join(';'));return {initial,steps,high,down,errors,targetName:target.name,limit:'Bounded real POI overzoom; no new source detail or physical-device claim.'};
}
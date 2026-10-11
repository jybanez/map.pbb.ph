async(page)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/assets/app.js?*',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replace('const accuracyRipple=createAccuracyRipple(','window.__retryMap=()=>initialize();const accuracyRipple=window.__ripple=createAccuracyRipple(')});});
 await page.addInitScript(()=>{
 Object.defineProperty(navigator,'geolocation',{configurable:true,value:{watchPosition(ok,fail){window.__fix=ok;window.__geoError=fail;setTimeout(()=>ok({coords:{latitude:10.3157,longitude:123.8854,accuracy:80},timestamp:Date.now()}),0);return 1},clearWatch(){}}});
 let lib;Object.defineProperty(window,'maplibregl',{get:()=>lib,set(v){lib=v;const M=v.Map;v.Map=class extends M{constructor(o){super(o);window.__map=this}}}});
 });
 await page.emulateMedia({reducedMotion:'no-preference'});await page.goto('https://map.pbb.ph/');await page.waitForFunction(()=>window.__map?.getLayer('pbb-accuracy-ripple-line'));await page.waitForTimeout(800);
 await page.evaluate(()=>{const m=window.__map,s=m.getSource('pbb-accuracy-ripple');window.__source=s;window.__writes=0;const original=s.setData.bind(s);s.setData=d=>{window.__writes++;window.__lastRipple=d;return original(d)};});


 const results=[];for(const width of [1200,375]){
 await page.setViewportSize({width,height:740});await page.evaluate(()=>{window.__fix({coords:{latitude:10.3157,longitude:123.8854,accuracy:80},timestamp:Date.now()});window.__map.jumpTo({zoom:17,pitch:35,bearing:45})});await page.waitForTimeout(2600);
 const check=await page.evaluate(()=>{const fs=window.__map.getSource('pbb-accuracy-ripple')._data.features;const phases=fs.map(f=>1-f.properties.opacity/0.5).sort((a,b)=>a-b);return {count:fs.length,phases,spacing:phases[1]-phases[0],spacing2:phases[2]-phases[1],fill:fs.map(f=>f.properties.fillOpacity),sameSource:window.__source===window.__map.getSource('pbb-accuracy-ripple'),layers:window.__map.getStyle().layers.filter(l=>l.source==='pbb-accuracy-ripple').length}});
 if(check.count!==3||check.layers!==2||!check.sameSource||Math.abs(check.spacing-1/3)>1e-8||Math.abs(check.spacing2-1/3)>1e-8||check.fill.some(f=>f<0||f>0.07))throw Error(JSON.stringify(check));results.push({width,...check});await page.screenshot({path:`output/playwright/accuracy-ripple-three-${width}.png`});
 }
 await page.emulateMedia({reducedMotion:'reduce'});const reduced=await page.evaluate(async()=>{const n=window.__writes;await new Promise(r=>setTimeout(r,200));return n===window.__writes&&window.__map.getLayoutProperty('pbb-accuracy-ripple-fill','visibility')==='none'&&window.__map.getLayoutProperty('pbb-accuracy-ripple-line','visibility')==='none'});if(!reduced)throw Error('Reduce');
 await page.emulateMedia({reducedMotion:'no-preference'});await page.waitForTimeout(200);const resumed=await page.evaluate(()=>window.__map.getLayoutProperty('pbb-accuracy-ripple-fill','visibility')==='visible');if(!resumed)throw Error('Resume');
 await page.evaluate(()=>window.__map.setStyle(window.__map.getStyle()));await page.waitForTimeout(400);const reload=await page.evaluate(()=>window.__map.getStyle().layers.filter(l=>l.source==='pbb-accuracy-ripple').length===2);if(!reload)throw Error('Reload');
 const cleanup=await page.evaluate(()=>{window.__ripple.setMap(null);return !window.__map.getSource('pbb-accuracy-ripple')&&!window.__map.getLayer('pbb-accuracy-ripple-fill')&&!window.__map.getLayer('pbb-accuracy-ripple-line')});if(!cleanup||errors.length)throw Error(JSON.stringify({cleanup,errors}));return {results,reduced,resumed,reload,cleanup,errors};
}

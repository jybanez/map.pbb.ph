async(page)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/assets/app.js?*',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replace('const accuracyRipple=createAccuracyRipple(','window.__retryMap=()=>initialize();const accuracyRipple=window.__ripple=createAccuracyRipple(')});});
 await page.addInitScript(()=>{
 Object.defineProperty(navigator,'geolocation',{configurable:true,value:{watchPosition(ok,fail){window.__fix=ok;window.__geoError=fail;setTimeout(()=>ok({coords:{latitude:10.3157,longitude:123.8854,accuracy:80},timestamp:Date.now()}),0);return 1},clearWatch(){}}});
 let lib;Object.defineProperty(window,'maplibregl',{get:()=>lib,set(v){lib=v;const M=v.Map;v.Map=class extends M{constructor(o){super(o);window.__map=this}}}});
 });
 await page.emulateMedia({reducedMotion:'no-preference'});await page.goto('https://map.pbb.ph/');await page.waitForFunction(()=>window.__map?.getLayer('pbb-accuracy-ripple-line'));await page.waitForTimeout(800);
 await page.evaluate(()=>{const m=window.__map,s=m.getSource('pbb-accuracy-ripple');window.__source=s;window.__writes=0;const original=s.setData.bind(s);s.setData=d=>{window.__writes++;window.__lastRipple=d;return original(d)};});

 const results=[];
 for(const width of [1200,375]){
 await page.setViewportSize({width,height:740});
 const cases=[['zoom in',{zoom:17}],['zoom out',{zoom:15}],['pan',{center:[123.8862,10.3161]}],['tilt',{pitch:65}],['rotate',{bearing:135}],['combined',{zoom:16,pitch:45,bearing:-75,center:[123.8854,10.3157]}]];
 for(const [action,camera] of cases){
 await page.evaluate(()=>window.__fix({coords:{latitude:10.3157,longitude:123.8854,accuracy:80},timestamp:Date.now()}));
 const result=await page.evaluate(async({action,camera})=>{
 const m=window.__map,source=m.getSource('pbb-accuracy-ripple');const before=window.__writes;let tiles=0;const onData=e=>{if(e.sourceId!=='pbb-accuracy-ripple')tiles++};m.on('sourcedata',onData);
 await new Promise(resolve=>{m.once('moveend',resolve);m.easeTo({...camera,duration:450});});
 const during=window.__writes-before;await new Promise(r=>setTimeout(r,200));m.off('sourcedata',onData);
 const p=source._data.geometry.coordinates[0];const lngs=p.map(c=>c[0]),lats=p.map(c=>c[1]);const center=[(Math.min(...lngs)+Math.max(...lngs))/2,(Math.min(...lats)+Math.max(...lats))/2];
 const rad=Math.PI/180;const radius=Math.max(...p.map(([lng,lat])=>{const a=Math.sin((lat-10.3157)*rad/2)**2+Math.cos(lat*rad)*Math.cos(10.3157*rad)*Math.sin((lng-123.8854)*rad/2)**2;return 6371008.8*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a))}));
 return {action,during,total:window.__writes-before,tiles,sameSource:source===m.getSource('pbb-accuracy-ripple'),oneLayer:m.getStyle().layers.filter(l=>l.id==='pbb-accuracy-ripple-line').length===1,center,radius,zoom:m.getZoom(),pitch:m.getPitch(),bearing:m.getBearing()};
 },{action,camera});
 if(result.during<2||result.total<=result.during||!result.sameSource||!result.oneLayer||Math.abs(result.center[0]-123.8854)>1e-8||Math.abs(result.center[1]-10.3157)>1e-8||result.radius>80.01)throw Error(JSON.stringify(result));results.push({width,...result});
 }
 // Actual pointer pan on the map canvas as well as camera APIs.
 const canvas=page.locator('.maplibregl-canvas');const box=await canvas.boundingBox();const n=await page.evaluate(()=>window.__writes);
 await page.mouse.move(box.x+box.width*.6,box.y+box.height*.6);await page.mouse.down();await page.mouse.move(box.x+box.width*.6+45,box.y+box.height*.6+30,{steps:8});await page.mouse.up();await page.waitForTimeout(250);
 if(await page.evaluate(n=>window.__writes<=n,n))throw Error('Pointer pan stopped ripple');
 await page.screenshot({path:`output/playwright/accuracy-ripple-camera-${width}.png`});
 }
 if(errors.length)throw Error(JSON.stringify(errors));return {results,errors};
}

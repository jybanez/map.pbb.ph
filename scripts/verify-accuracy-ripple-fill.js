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
 await page.setViewportSize({width,height:740});await page.evaluate(()=>window.__map.jumpTo({center:[123.8854,10.3157],zoom:17,pitch:0,bearing:0}));
 await page.waitForTimeout(650);
 const check=await page.evaluate(()=>{const m=window.__map,l=m.getPaintProperty('pbb-accuracy-ripple-line','line-opacity'),f=m.getPaintProperty('pbb-accuracy-ripple-fill','fill-opacity');return {line:l,fill:f,ratio:f/l,sameSource:m.getLayer('pbb-accuracy-ripple-fill').source===m.getLayer('pbb-accuracy-ripple-line').source,originalAbsent:!m.getSource('pbb-accuracy')}});
 if(check.fill<=0||check.fill>0.14||Math.abs(check.ratio-0.28)>1e-8||!check.sameSource||!check.originalAbsent)throw Error(JSON.stringify(check));results.push({width,...check});await page.screenshot({path:`output/playwright/accuracy-ripple-fill-${width}.png`});
 }
 await page.emulateMedia({reducedMotion:'reduce'});const stopped=await page.evaluate(async()=>{const n=window.__writes;await new Promise(r=>setTimeout(r,150));return n===window.__writes&&window.__map.getPaintProperty('pbb-accuracy-ripple-fill','fill-opacity')===0&&window.__map.getPaintProperty('pbb-accuracy-ripple-line','line-opacity')===0});if(!stopped)throw Error('Reduced-motion fill');
 await page.emulateMedia({reducedMotion:'no-preference'});await page.waitForTimeout(150);
 const active=await page.evaluate(()=>window.__map.getPaintProperty('pbb-accuracy-ripple-fill','fill-opacity')>0);if(!active)throw Error('Resume fill');
 await page.evaluate(()=>window.__map.setStyle(window.__map.getStyle()));await page.waitForFunction(()=>window.__map.getLayer('pbb-accuracy-ripple-fill'));await page.waitForTimeout(150);
 const reload=await page.evaluate(()=>window.__map.getStyle().layers.filter(l=>l.id==='pbb-accuracy-ripple-fill').length===1);if(!reload)throw Error('Fill reload');
 const cleanup=await page.evaluate(()=>{window.__ripple.setMap(null);return !window.__map.getLayer('pbb-accuracy-ripple-fill')&&!window.__map.getLayer('pbb-accuracy-ripple-line')&&!window.__map.getSource('pbb-accuracy-ripple')});if(!cleanup||errors.length)throw Error(JSON.stringify({cleanup,errors}));return {results,stopped,active,reload,cleanup,errors};
}
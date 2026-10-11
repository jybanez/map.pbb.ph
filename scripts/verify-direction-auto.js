async(page)=>{
 page.setDefaultTimeout(15000);const errors=[];page.on('pageerror',e=>errors.push(e.message));const cdp=await page.context().newCDPSession(page);await cdp.send('Network.enable');await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
 await page.addInitScript(()=>{
  window.__hidden=false;Object.defineProperty(document,'hidden',{configurable:true,get:()=>window.__hidden});
  Object.defineProperty(navigator,'userAgent',{configurable:true,value:'Android Chrome/154.0.8037.127'});window.__calls=0;
  const mode=sessionStorage.getItem('permission-fixture')||'granted';window.DeviceOrientationEvent=mode==='no-api'?{}:{requestPermission(){window.__calls++;return Promise.resolve('granted');}};Object.defineProperty(navigator,'permissions',{configurable:true,value:{query:async()=>{if(mode==='unsupported')throw Error('unsupported');return Object.assign(new EventTarget(),{state:mode});}}});
  Object.defineProperty(screen,'orientation',{configurable:true,value:Object.assign(new EventTarget(),{angle:0})});
  for(const type of ['deviceorientation','deviceorientationabsolute'])window.addEventListener(type,e=>{if(e.isTrusted)e.stopImmediatePropagation();},true);
  Object.defineProperty(navigator,'geolocation',{configurable:true,value:{watchPosition(ok){window.__fix=ok;return 1;},clearWatch(){}}});
  let lib;Object.defineProperty(window,'maplibregl',{get:()=>lib,set(v){lib=v;const M=v.Map;v.Map=class extends M{constructor(o){super(o);window.__map=this;}}}});
 });
 await page.goto('https://map.pbb.ph/');await page.waitForFunction(()=>window.__fix&&window.__map?.loaded());
 const fix=async(altitude=null,altitudeAccuracy=null,latitude=10.3157)=>page.evaluate(({altitude,altitudeAccuracy,latitude})=>window.__fix({timestamp:Date.now(),coords:{latitude,longitude:123.8854,accuracy:20,altitude,altitudeAccuracy}}),{altitude,altitudeAccuracy,latitude});
 const sensor=()=>page.evaluate(()=>{const e=new Event('deviceorientationabsolute');Object.assign(e,{absolute:true,alpha:270,beta:0,gamma:0});window.dispatchEvent(e);});


 const enable=()=>page.locator('#zoom-control').getByRole('button',{name:'Enable direction',exact:true});
 const status=page.locator('.ui-map-location-person-label[aria-label*="approximate geographic"]');const outcomes=[];
 for(const mode of ['granted','prompt','denied','unsupported','no-api']){
  if(mode!=='granted'){await page.evaluate(mode=>sessionStorage.setItem('permission-fixture',mode),mode);await page.reload();await page.waitForFunction(()=>window.__fix&&window.__map?.loaded());}
  await fix();await page.waitForFunction(()=>document.querySelector('.ui-map-location-person-label'));await page.waitForTimeout(150);
  await page.evaluate(()=>window.__map.jumpTo({bearing:125,pitch:0}));await page.waitForTimeout(300);const camera=await page.evaluate(()=>[window.__map.getCenter().toArray(),window.__map.getBearing()]);
  if(await page.evaluate(()=>window.__calls)!==0)throw Error('Automatic permission request '+mode);
  if(mode==='prompt'||mode==='denied'){
   await enable().waitFor();await sensor();if(await status.isVisible())throw Error('Unpermitted direction '+mode);
   await enable().click();await sensor();if(await page.evaluate(()=>window.__calls)!==1)throw Error('Explicit activation '+mode);
  }else if(mode==='unsupported'){
   await enable().waitFor();await sensor();
  }else{await sensor();}
  await page.locator('.ui-map-location-person-label[aria-label*="approximate geographic"]').waitFor();if(await page.locator('#direction-mode-status').count())throw Error('Removed panel exists');
  if(await enable().isVisible())throw Error('Redundant enable control '+mode);
  if(JSON.stringify(camera)!==JSON.stringify(await page.evaluate(()=>[window.__map.getCenter().toArray(),window.__map.getBearing()])))throw Error('Enable recentered '+mode);
  outcomes.push(mode);
 }
 await page.evaluate(()=>window.dispatchEvent(new Event('pagehide')));
 if(errors.length)throw Error(errors.join(';'));return{outcomes,noAutomaticRequests:true,grantedAuto:true,passiveUnsupported:true,noApiAuto:true,explicitPromptDenied:true,enableWithoutRecenter:true,cleanup:true,errors};
}

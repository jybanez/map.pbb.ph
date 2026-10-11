async(page)=>{
 page.setDefaultTimeout(15000);const errors=[];page.on('pageerror',e=>errors.push(e.message));const cdp=await page.context().newCDPSession(page);await cdp.send('Network.enable');await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
 await page.addInitScript(()=>{
  window.__hidden=false;Object.defineProperty(document,'hidden',{configurable:true,get:()=>window.__hidden});
  Object.defineProperty(navigator,'userAgent',{configurable:true,value:'Android Chrome/154.0.8037.127'});window.__calls=0;
  const mode=sessionStorage.getItem('welcome-mode')||'prompt';window.__activated=[];window.__allow=false;window.DeviceOrientationEvent=mode==='no-api'?{}:{requestPermission(){window.__calls++;window.__activated.push(navigator.userActivation.isActive);return Promise.resolve(window.__allow?'granted':'denied');}};Object.defineProperty(navigator,'permissions',{configurable:true,value:{query:async()=>{if(mode==='unsupported')throw Error('unsupported');return Object.assign(new EventTarget(),{state:mode});}}});
  Object.defineProperty(screen,'orientation',{configurable:true,value:Object.assign(new EventTarget(),{angle:0})});
  for(const type of ['deviceorientation','deviceorientationabsolute'])window.addEventListener(type,e=>{if(e.isTrusted)e.stopImmediatePropagation();},true);
  Object.defineProperty(navigator,'geolocation',{configurable:true,value:{watchPosition(ok){window.__fix=ok;return 1;},clearWatch(){}}});
  let lib;Object.defineProperty(window,'maplibregl',{get:()=>lib,set(v){lib=v;const M=v.Map;v.Map=class extends M{constructor(o){super(o);window.__map=this;}}}});
 });
 await page.goto('https://map.pbb.ph/');await page.waitForFunction(()=>window.__fix&&window.__map?.loaded());
 const fix=async(altitude=null,altitudeAccuracy=null,latitude=10.3157)=>page.evaluate(({altitude,altitudeAccuracy,latitude})=>window.__fix({timestamp:Date.now(),coords:{latitude,longitude:123.8854,accuracy:20,altitude,altitudeAccuracy}}),{altitude,altitudeAccuracy,latitude});
 const sensor=()=>page.evaluate(()=>{const e=new Event('deviceorientationabsolute');Object.assign(e,{absolute:true,alpha:270,beta:0,gamma:0});window.dispatchEvent(e);});


 const dialog=page.getByRole('dialog',{name:'Welcome to PBB Map',exact:true});
 await dialog.waitFor();if(!(await dialog.innerText()).includes('Allow location to show where you are and direction sensors'))throw Error('Missing explanation');
 if(await page.evaluate(()=>window.__calls)!==0)throw Error('Opening requested permission');
 await dialog.getByRole('button',{name:'Continue browsing',exact:true}).click();await dialog.waitFor({state:'hidden'});
 await page.evaluate(()=>{document.dispatchEvent(new Event('visibilitychange'));});await page.waitForTimeout(200);if(await dialog.isVisible())throw Error('Dismissal revived');
 if(await page.evaluate(()=>window.__calls)!==0)throw Error('Dismiss requested permission');
 await page.reload();await dialog.waitFor();await dialog.getByRole('button',{name:'Enable location and direction',exact:true}).click();await dialog.waitFor({state:'hidden'});
 if(await page.evaluate(()=>window.__calls)!==1)throw Error('Primary action not explicit');if(!(await page.evaluate(()=>window.__activated)).every(Boolean))throw Error('No trusted activation');
 await page.evaluate(()=>window.__allow=true);await page.locator('#zoom-control').getByRole('button',{name:'Enable direction',exact:true}).click();
 if(await page.evaluate(()=>window.__calls)!==2)throw Error('Denial retry failed');await fix();await sensor();await page.locator('.ui-map-location-person-label[aria-label*="approximate geographic"]').waitFor();if(await page.locator('#direction-mode-status').count())throw Error('Removed panel exists');
 for(const mode of ['granted','no-api','denied']){await page.evaluate(mode=>sessionStorage.setItem('welcome-mode',mode),mode);await page.reload();await page.waitForFunction(()=>window.__fix&&window.__map?.loaded());await fix();await sensor();if(await dialog.isVisible())throw Error('Unnecessary welcome '+mode);if(await page.evaluate(()=>window.__calls)!==0)throw Error('Automatic request '+mode);}
 await page.evaluate(()=>sessionStorage.setItem('welcome-mode','unsupported'));await page.reload();await dialog.waitFor();await page.evaluate(()=>{window.__hidden=true;document.dispatchEvent(new Event('visibilitychange'));});await dialog.waitFor({state:'hidden'});await page.evaluate(()=>{window.__hidden=false;document.dispatchEvent(new Event('visibilitychange'));});await page.waitForTimeout(200);if(await dialog.isVisible())throw Error('Hidden duplicate');
 await page.evaluate(()=>window.dispatchEvent(new Event('pagehide')));if(errors.length)throw Error(errors.join(';'));return{canonicalWelcome:true,trustedActivation:true,noPromptOnOpenDismiss:true,continueBrowsing:true,noDuplicate:true,denialRetry:true,noWelcomeGrantedNoApi:true,hiddenCleanup:true,dispose:true,errors};
}

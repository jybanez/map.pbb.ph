async(page)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{
  Object.defineProperty(navigator,'userAgent',{configurable:true,value:'Mozilla/5.0 (Linux; Android 13) Chrome/154.0.8037.127 Mobile'});
  window.__permissionCalls=[];window.__allow=false;
  const api={requestPermission(absolute){window.__permissionCalls.push({absolute,bound:this===api,active:navigator.userActivation.isActive});return Promise.resolve(window.__allow?'granted':'denied');}};window.DeviceOrientationEvent=api;
  for(const type of ['deviceorientation','deviceorientationabsolute'])window.addEventListener(type,e=>{if(e.isTrusted)e.stopImmediatePropagation();},true);
  Object.defineProperty(screen,'orientation',{configurable:true,value:Object.assign(new EventTarget(),{angle:0})});
  Object.defineProperty(navigator,'geolocation',{configurable:true,value:{watchPosition(ok){window.__fix=ok;return 1;},clearWatch(){}}});
  let lib;Object.defineProperty(window,'maplibregl',{get:()=>lib,set(v){lib=v;const M=v.Map;v.Map=class extends M{constructor(o){super(o);window.__map=this;}}}});
 });
 await page.goto('https://map.pbb.ph/');await page.waitForFunction(()=>window.__fix&&window.__map?.loaded());
 await page.evaluate(()=>window.__fix({timestamp:Date.now(),coords:{latitude:10.3157,longitude:123.8854,accuracy:20,altitude:null,altitudeAccuracy:null}}));await page.waitForFunction(()=>document.querySelector('.ui-map-location-person-label'));
 const info=page.getByRole('button',{name:'Direction diagnostics'}),dialog=page.getByRole('dialog',{name:'Direction diagnostics'});await info.click();await dialog.getByText('tap Locate required',{exact:true}).waitFor();
 if(await page.evaluate(()=>window.__permissionCalls.length)!==0)throw Error('Automatic permission request');await dialog.getByRole('button',{name:'Close',exact:true}).click();
 const locate=page.locator('#locate-control button');await locate.click();await page.waitForTimeout(50);await info.click();await dialog.getByText('denied',{exact:true}).waitFor();await dialog.getByRole('button',{name:'Close',exact:true}).click();
 await page.evaluate(()=>window.__allow=true);await locate.click();await page.waitForTimeout(50);
 await page.evaluate(()=>{const e=new Event('deviceorientationabsolute');Object.assign(e,{absolute:true,alpha:270,beta:0,gamma:0});window.dispatchEvent(e);});
 await info.click();await dialog.getByText('granted',{exact:true}).waitFor();const text=await dialog.innerText();if(!text.includes('active')||!text.includes('ellipsoid altitude'))throw Error('Missing permission or separate altitude result');
 const calls=await page.evaluate(()=>window.__permissionCalls);if(calls.length!==2||calls.some(c=>!c.absolute||!c.bound||!c.active))throw Error('Permission not directly activated/bound');
 const label=await page.locator('.ui-map-location-person-label').getAttribute('aria-label');if(label.includes('device direction'))throw Error('Missing-altitude gate bypassed');
 if(errors.length)throw Error(errors.join(';'));return{simulatedChrome154WithPermissionAPI:true,noAutomaticPrompt:true,explicitLocateDenialRetry:true,calls,grantedListener:true,missingAltitudeStillNeutral:true,errors};
}

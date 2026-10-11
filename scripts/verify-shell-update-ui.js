async page => {
  await page.goto('https://map.pbb.ph/');
  await page.evaluate(async () => {
    const {uiLoader}=await import('./vendor/helpers/js/ui/ui.loader.js?v=0.21.285');
    const {registerMapShell}=await import('./assets/map-shell.js?v=20261011-map-cache1');
    const [createMapControls,createToastStack]=await Promise.all(['ui.map.controls','ui.toast'].map(name=>uiLoader.get(name,{preferBundles:true})));
    const native=Object.getOwnPropertyDescriptor(navigator,'serviceWorker');
    const fake={addEventListener(){},removeEventListener(){},controller:{},register:async()=>({waiting:{postMessage(message,ports){window.__updateMessage=message;ports[0].postMessage({version:1,accepted:false});}},addEventListener(){}})};
    Object.defineProperty(navigator,'serviceWorker',{configurable:true,value:fake});
    const toast=createToastStack({workspaceBridge:false});
    const shell=registerMapShell({createMapControls,toast});
    window.__restoreUpdateTest=()=>{shell.destroy();toast.destroy();if(native)Object.defineProperty(navigator,'serviceWorker',native);else delete navigator.serviceWorker;};
  });
  try {
    const button=page.getByRole('button',{name:'Update Map',exact:true}).last();await button.waitFor();await button.click();
    await page.getByText('Close other Map tabs, then choose Update Map again.',{exact:true}).waitFor();
    return {buttonVisible:true,canonicalAction:true,refusalVisible:true,message:await page.evaluate(()=>window.__updateMessage)};
  } finally {await page.evaluate(()=>window.__restoreUpdateTest());}
}

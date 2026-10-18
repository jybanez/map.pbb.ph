async page=>{
 const results=[];
 for(const width of [1200,375]){
  const context=await page.context().browser().newContext({viewport:{width,height:850},serviceWorkers:'block',reducedMotion:'reduce'}),tab=await context.newPage(),errors=[];let releaseStyle,gate=new Promise(r=>releaseStyle=r),styleReads=0;
  try{
   await context.addInitScript(()=>{window.__statusMessages=[];const d=Object.getOwnPropertyDescriptor(Node.prototype,'textContent');Object.defineProperty(Node.prototype,'textContent',{...d,set(value){if(typeof value==='string'&&/^(Loading map|Reading )/.test(value))window.__statusMessages.push(value);return d.set.call(this,value);}});Object.defineProperty(navigator,'geolocation',{configurable:true,value:{getCurrentPosition(ok,fail){fail({code:1});}}});let lib;Object.defineProperty(window,'maplibregl',{get:()=>lib,set(v){lib=v;const M=v.Map;v.Map=class extends M{constructor(o){super(o);window.__map=this;}};}});});
   await tab.route('**/assets/app.js*',async route=>{const response=await route.fetch(),body=(await response.text()).replace('  return { destroy };','  window.__statusApp={initialize,destroy};return { destroy };');await route.fulfill({response,body});});
   await tab.route('**/assets/maps/hotline-dark.json*',async route=>{styleReads++;await gate;await route.continue();});
   tab.on('pageerror',e=>errors.push(e.message));await tab.goto('https://map.pbb.ph/',{waitUntil:'domcontentloaded'});
   await tab.getByText('Loading map...',{exact:true}).waitFor();await tab.screenshot({path:`output/playwright/status335-${width}-initial.png`});releaseStyle();await tab.waitForFunction(()=>window.__map?.getStyle()&&window.__map.getSource('pbb-personal-readonly'),null,{timeout:60000});
   gate=new Promise(r=>releaseStyle=r);await tab.evaluate(()=>{void window.__statusApp.initialize();});await tab.getByText('Loading map...',{exact:true}).waitFor();await tab.screenshot({path:`output/playwright/status335-${width}-subsequent.png`});releaseStyle();await tab.waitForFunction(()=>window.__map?.getStyle()&&window.__map.getSource('pbb-personal-readonly'),null,{timeout:60000});
   if(width===375)await tab.getByRole('button',{name:'Open map search',exact:true}).click();const field=tab.getByRole('textbox',{name:'Search map',exact:true});await field.fill('Petron');await field.evaluate(input=>{input.value='Cebu';input.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertFromPaste',data:'Cebu'}));});await tab.waitForFunction(()=>window.__statusMessages.includes('Reading pasted search...')&&window.__statusMessages.includes('Reading loaded local POIs...'));await field.press('Escape');
   await tab.locator('canvas.maplibregl-canvas').click({button:'right',position:{x:Math.min(150,width*.4),y:300}});await tab.getByRole('menuitem',{name:'Get info',exact:true}).click();await tab.getByRole('dialog',{name:'Location information',exact:true}).waitFor();await tab.waitForFunction(()=>window.__statusMessages.includes('Reading nearby loaded map tiles...'));
   const messages=await tab.evaluate(()=>window.__statusMessages),body=await tab.locator('body').innerText();if(messages.some(s=>/â|�/.test(s))||/Loading mapâ|Reading[^\n]*â/.test(body)||styleReads!==2||errors.length)throw Error(JSON.stringify({messages,styleReads,errors}));results.push({width,initialAndSubsequentVisible:true,styleReads,messages:[...new Set(messages)],syntheticPasteStatus:true,nativeContextMenu:true,errors});
  }finally{releaseStyle?.();await context.close();}
 }
 return results;
}

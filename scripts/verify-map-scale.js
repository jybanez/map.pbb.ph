async page=>{
 const results=[];
 for(const width of [1200,375]){
  const context=await page.context().browser().newContext({viewport:{width,height:900},serviceWorkers:'block'}),requests=[],errors=[];
  await context.addInitScript(()=>{let lib;Object.defineProperty(window,'maplibregl',{get:()=>lib,set(v){lib=v;const Base=v.Map;v.Map=class extends Base{constructor(o){super(o);window.__map=this;}};}});});
  context.on('request',r=>{if(r.url().includes('/vendor/helpers/'))requests.push(new URL(r.url()).pathname);});
  const tab=await context.newPage();tab.on('pageerror',e=>errors.push(e.message));
  try{
   await tab.goto('https://map.pbb.ph/');const scale=tab.locator('.ui-map-scale');await scale.waitFor({timeout:60000});
   const check=async()=>{const b=await scale.boundingBox();if(!b||b.x<0||b.y<0||b.x+b.width>width||b.y+b.height>900)throw Error('Scale bounds');const label=await scale.textContent(),aria=await scale.getAttribute('aria-label');if(!/\d.*(m|km)\b/.test(label)||!aria.includes(label.replace(/\s+/g,' ').trim())||!aria.includes('halfway'))throw Error('Metric/accessibility '+JSON.stringify({label,aria}));return label;};
   await check();await tab.evaluate(()=>__map.jumpTo({zoom:16,pitch:50,bearing:31}));await check();
   const before=await check(),canvas=tab.locator('canvas.maplibregl-canvas');await canvas.hover({position:{x:width/2,y:600}});await tab.mouse.wheel(0,1000);await tab.waitForFunction(()=>!__map.isMoving());await tab.waitForFunction(value=>document.querySelector('.ui-map-scale').textContent!==value,before);
   await check();await context.pages()[0].setViewportSize({width,height:700});await tab.waitForFunction(()=>__map.getCanvas().clientHeight<700);await tab.setViewportSize({width,height:900});await check();
   const collision=await tab.evaluate(async()=>{const region=document.getElementById('map-region'),overlay=document.createElement('div');overlay.className='pbb-personal-object';overlay.style.cssText='position:absolute;left:0;bottom:0;width:180px;height:60px;top:auto';const second=overlay.cloneNode();second.className="pbb-personal-rail";second.style.bottom="70px";region.append(overlay,second);await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));const scale=document.querySelector('.ui-map-scale'),b=scale.getBoundingClientRect(),o=overlay.getBoundingClientRect(),clear=b.bottom<=second.getBoundingClientRect().top-7;overlay.remove();second.remove();await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));return{clear,reset:scale.style.getPropertyValue('--ui-map-scale-offset')==='0px'};});if(!collision.clear||!collision.reset)throw Error('Overlay offset '+JSON.stringify(collision));
   await tab.screenshot({path:`output/playwright/scale241-${width}.png`});
   await tab.evaluate(()=>{window.__oldScale=document.querySelector('.ui-map-scale');__map.remove();});await tab.waitForFunction(()=>!document.querySelector('.ui-map-scale'));if(errors.length||new Set(requests).size!==3)throw Error(JSON.stringify({errors,requests}));results.push({width,metric:true,accessibleLabel:true,nativeCamera:true,resize:true,overlayOffset:collision,mapRemoval:true,threeHelperAssets:true,errors});
  }finally{await context.close();}
 }
 return results;
}

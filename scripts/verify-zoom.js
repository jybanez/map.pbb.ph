async (page) => {
  const errors=[],checks=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(() => {
    window.__fixes=[];
    Object.defineProperty(navigator,'geolocation',{value:{getCurrentPosition(ok,fail){window.__fixes.push({ok,fail});}}});
    let lib;
    Object.defineProperty(window,'maplibregl',{get:()=>lib,set(v){lib=v;const M=v.Map;v.Map=class extends M{constructor(o){super(o);window.__map=this;}};}});
  });
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('https://map.pbb.ph/');
  await page.waitForFunction(()=>window.__map?.loaded());
  const initial=await page.evaluate(()=>window.__map.getZoom());
  await page.getByRole('button',{name:'Zoom in',exact:true}).focus();
  await page.keyboard.press('Enter');
  await page.waitForFunction(()=>!window.__map.isMoving());
  const explored=await page.evaluate(()=>window.__map.getZoom());
  if(explored<initial+0.9)throw Error('Keyboard zoom failed');
  await page.evaluate(()=>window.__fixes[0].ok({coords:{latitude:10.4,longitude:123.8,accuracy:20}}));
  if(await page.evaluate(()=>window.__map.getZoom())!==explored)throw Error('Late fix stole zoom exploration');
  await page.getByRole('button',{name:'Zoom out',exact:true}).click();
  await page.waitForFunction(()=>!window.__map.isMoving());
  if(Math.abs(await page.evaluate(()=>window.__map.getZoom())-initial)>0.1)throw Error('Zoom out failed');
  for(const width of [375,1440]){
    await page.setViewportSize({width,height:width===375?740:900});
    await page.screenshot({path:`output/playwright/zoom-${width}.png`});
    const layout=await page.evaluate(()=>{
      const r=document.getElementById('zoom-control').getBoundingClientRect(),m=document.getElementById('map-region').getBoundingClientRect();
      const buttons=[...document.querySelectorAll('#zoom-control button')].map(b=>{const r=b.getBoundingClientRect();return{label:b.getAttribute('aria-label'),width:r.width,height:r.height,y:r.y};});
      return{width:innerWidth,x:r.x,mapOffset:r.y-m.y,buttons,navbarZoom:!!document.querySelector('#navbar [data-control="zoom-in"]'),overflow:document.documentElement.scrollWidth>innerWidth};
    });
    if(layout.navbarZoom||layout.overflow||layout.mapOffset!==16||layout.buttons.some(b=>b.width<44||b.height<44)||layout.buttons[1].y<=layout.buttons[0].y)throw Error(JSON.stringify(layout));
    checks.push(layout);
    await page.evaluate(()=>{document.getElementById('map-feedback').hidden=false;});
    const overlap=await page.evaluate(()=>{const a=document.getElementById('zoom-control').getBoundingClientRect(),b=document.getElementById('map-feedback').getBoundingClientRect();return a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;});
    if(overlap)throw Error('Feedback overlaps zoom');
    await page.evaluate(()=>{document.getElementById('map-feedback').hidden=true;});
  }
  await page.evaluate(()=>window.dispatchEvent(new Event('pagehide')));
  if(await page.locator('#zoom-control').count())throw Error('Zoom overlay not cleaned up');
  if(errors.length)throw Error(errors.join(';'));
  return{date:'2026-10-10',checks,keyboardZoom:true,zoomOut:true,lateFixPreservesExploration:true,feedbackNoOverlap:true,cleanup:true,uncaughtErrors:errors};
}

async(page)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/assets/app.js?*',async route=>{const response=await route.fetch();let body=await response.text();body=body.replace('person = createPerson({','person = window.__person = createPerson({');await route.fulfill({response,body});});
 await page.addInitScript(()=>{window.__fix={latitude:10.3157,longitude:123.8854,accuracy:20};Object.defineProperty(navigator,'geolocation',{configurable:true,value:{getCurrentPosition(ok){ok({coords:window.__fix})}}});let lib;Object.defineProperty(window,'maplibregl',{get:()=>lib,set(v){lib=v;const M=v.Map;v.Map=class extends M{constructor(o){super(o);window.__map=this}}}})});
 await page.goto('https://map.pbb.ph/');await page.waitForFunction(()=>window.__person?.getState().status==='rendered');
 const rows=[];
 for(const width of [1200,375]){
 await page.setViewportSize({width,height:740});
 await page.evaluate(()=>{const m=window.__map;m.jumpTo({center:[123.8854,10.3157],zoom:17,pitch:60,bearing:0});});
 for(const [name,fraction] of [['near',.8],['far',.35]]){
 await page.evaluate(fraction=>{const m=window.__map;for(let i=0;i<4;i++){const p=m.project([123.8854,10.3157]);m.panBy([p.x-m.getCanvas().clientWidth/2,p.y-m.getCanvas().clientHeight*fraction],{duration:0});}},fraction);
 await page.waitForTimeout(500);const state=await page.evaluate(()=>({center:window.__map.getCenter(),pitch:window.__map.getPitch(),zoom:window.__map.getZoom(),...window.__person.getState()}));
 if(state.status!=='rendered'||state.scaleMode!=='perspective')throw Error('Perspective render failed');rows.push({width,name,...state});await page.screenshot({path:`output/playwright/app-perspective-${width}-${name}.png`});
 }
 const near=rows.find(r=>r.width===width&&r.name==='near'),far=rows.find(r=>r.width===width&&r.name==='far');if(!(near.projectedSizePx>far.projectedSizePx))throw Error('Near/far ordering failed');
 for(const zoom of [8,15,20]){await page.evaluate(zoom=>window.__map.jumpTo({center:[123.8854,10.3157],zoom,pitch:85,bearing:65}),zoom);await page.waitForTimeout(500);const state=await page.evaluate(()=>({pitch:window.__map.getPitch(),...window.__person.getState()}));if(state.pitch!==85||state.status!=='rendered'||state.projectedSizePx<7.99||state.projectedSizePx>64.01)throw Error('Bounds85');rows.push({width,zoom,...state});await page.screenshot({path:`output/playwright/app-perspective-${width}-85-${zoom}.png`});}
 await page.evaluate(()=>window.__map.jumpTo({center:[123.8854,10.3157],zoom:17,pitch:0,bearing:0}));await page.waitForTimeout(500);rows.push({width,name:'2D',...await page.evaluate(()=>window.__person.getState())});
 }
 const resources=await page.evaluate(()=>performance.getEntriesByType('resource').map(r=>r.name).filter(u=>u.includes('/vendor/helpers/')));if(!resources.some(u=>u.includes('helpers.ui.bundle.min.js?v=0.21.282')))throw Error('New bundle not loaded');
 if(await page.getByRole('button',{name:'Direction diagnostics',exact:true,includeHidden:true}).count()||await page.getByRole('button',{name:'Direction options',exact:true,includeHidden:true}).count())throw Error('Hidden tools restored');
 await page.evaluate(()=>{window.__person.updateHeading(90);window.__map.triggerRepaint()});await page.waitForTimeout(200);const heading=await page.evaluate(()=>window.__person.getState());if(heading.headingDegrees!==90)throw Error('Heading update');
 if(errors.length)throw Error(errors.join(';'));return {rows,resources,heading,errors,fixture:'App response modified only to expose canonical person instance; fixed synthetic position, camera moved'};
}


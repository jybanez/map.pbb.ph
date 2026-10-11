async(page)=>{
  const checks=[];
  const cdp=await page.context().newCDPSession(page);await cdp.send('Network.enable');await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
  await page.setViewportSize({width:1280,height:800});
  await page.addInitScript(()=>{
    Object.defineProperty(navigator,'geolocation',{configurable:true,value:{getCurrentPosition(ok){setTimeout(()=>ok({coords:{latitude:10.3157,longitude:123.8854,accuracy:20}}),200);}}});
    let lib;Object.defineProperty(window,'maplibregl',{configurable:true,get:()=>lib,set(v){lib=v;const M=v.Map;v.Map=class extends M{constructor(o){super(o);window.__map=this;}};}});
  });
  await page.goto('https://map.pbb.ph/');await page.waitForFunction(()=>window.__map?.loaded()&&!window.__map.isMoving());
  await page.evaluate(()=>{window.__native=[];window.addEventListener('contextmenu',e=>setTimeout(()=>window.__native.push({x:e.clientX,y:e.clientY,trusted:e.isTrusted,prevented:e.defaultPrevented,target:e.target.tagName}),0),true);});
  const menu=page.getByRole('menu',{name:'Map location actions'});
  async function clickAt(x,y,label,clamp=false){
    await page.mouse.click(x,y,{button:'right'});await menu.waitFor();await page.waitForTimeout(200);
    const result=await page.evaluate(label=>{const a=document.querySelector('.pbb-context-anchor').getBoundingClientRect(),m=document.querySelector('.pbb-context-menu').getBoundingClientRect();return{label,event:window.__native.at(-1),anchor:{x:a.x,y:a.y},menu:{x:m.x,y:m.y,width:m.width,height:m.height},coordinate:document.querySelector('.pbb-context-menu [role="menuitem"]').textContent};},label);
    checks.push(result);
    if(!result.event.trusted||!result.event.prevented)throw Error(JSON.stringify(result));
    if(label!=='portal'&&(Math.abs(result.anchor.x-x)>1||Math.abs(result.anchor.y-y)>1))throw Error('Anchor wrong '+JSON.stringify(result));
    if(!clamp&&label!=='portal'&&(Math.abs(result.menu.x-x)>1||Math.abs(result.menu.y-y)>1))throw Error('Menu wrong '+JSON.stringify(result));
    return result;
  }
  const first=await clickAt(180,180,'canvas first');
  const second=await clickAt(850,350,'canvas repeat');
  if(first.coordinate===second.coordinate)throw Error('Coordinate did not update');
  await clickAt(second.menu.x+30,second.menu.y+25,'portal');
  await page.keyboard.press('Escape');
  const marker=await page.locator('.maplibregl-marker').boundingBox();
  if(!marker)throw Error('Marker missing');
  await clickAt(marker.x+marker.width/2,marker.y+marker.height/2,'marker');
  await clickAt(1190,780,'edge',true);await page.screenshot({path:'output/playwright/repeated-context-edge.png'});
  const edge=checks.at(-1).menu;if(edge.x+edge.width>1273||edge.y+edge.height>793)throw Error('Edge unclamped');
  await page.keyboard.press('Escape');
  await page.mouse.click(100,30,{button:'right'});await page.waitForTimeout(100);
  const unrelated=await page.evaluate(()=>window.__native.at(-1));if(unrelated.prevented)throw Error('Navbar browser menu suppressed');
  await page.keyboard.press('Escape');await page.setViewportSize({width:375,height:740});
  await clickAt(80,200,'mobile first');
  await clickAt(270,400,'mobile repeat',true);
  const mobile=checks.at(-1).menu;if(mobile.x+mobile.width>368||mobile.y+mobile.height>733)throw Error('Mobile unclamped');
  await page.screenshot({path:'output/playwright/repeated-context-mobile.png'});
  return{date:'2026-10-10',checks,unrelated,method:'Trusted mouse right-button clicks on canvas at distinct points, existing portal, marker and edge.'};
}

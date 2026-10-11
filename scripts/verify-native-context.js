async (page) => {
  await page.goto('https://map.pbb.ph/');
  await page.locator('canvas.maplibregl-canvas').waitFor();
  await page.evaluate(() => {
    window.__contextEvents=[];
    // Window capture observes the same trusted event before component handling;
    // a later task reads cancellation after all native event listeners finish.
    window.addEventListener('contextmenu', e => setTimeout(() => window.__contextEvents.push({trusted:e.isTrusted,defaultPrevented:e.defaultPrevented,target:e.target.tagName}),0),true);
  });
  await page.locator('canvas.maplibregl-canvas').click({button:'right',position:{x:240,y:220}});
  const menu=page.getByRole('menu',{name:'Map location actions'});
  await menu.waitFor();
  await page.waitForTimeout(200);
  const events=await page.evaluate(()=>window.__contextEvents);
  if(!events.length||!events.every(e=>e.trusted&&e.defaultPrevented))throw Error(JSON.stringify(events));
  const items=await menu.getByRole('menuitem').allTextContents();
  if(items.length!==3||!items.includes('Get info'))throw Error('Custom menu missing');
  await page.screenshot({path:'output/playwright/native-right-click.png'});
  await menu.getByRole('menuitem',{name:'Get info'}).click();
  await page.getByRole('dialog',{name:'Location information'}).getByText(/^Latitude, longitude/).waitFor();
  await page.keyboard.press('Escape');
  return {date:'2026-10-10',method:'Playwright real mouse right-button click; trusted native contextmenu event, no dispatchEvent',events,items,customMenu:true,infoAction:true};
}

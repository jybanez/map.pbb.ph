async (page) => {
  const checks = [], errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.addInitScript(() => {
    window.__fixes = [];
    Object.defineProperty(navigator, 'geolocation', { value: { getCurrentPosition(ok, fail) { window.__fixes.push({ok, fail}); } } });
    let lib;
    Object.defineProperty(window, 'maplibregl', { get: () => lib, set(v) { lib=v; const M=v.Map; v.Map=class extends M { constructor(o) {super(o);window.__map=this;} }; } });
  });
  await page.goto('https://map.pbb.ph/');
  await page.waitForFunction(() => window.__map?.loaded());
  const locate = page.locator('#locate-control button');
  if (!(await locate.isDisabled())) throw Error('Pending location enabled');
  await page.evaluate(() => window.__fixes[0].fail({code:1}));
  await locate.click();
  await page.evaluate(() => document.querySelector('#locate-control button').click());
  if (await page.evaluate(() => window.__fixes.length) !== 2) throw Error('Duplicate location request');
  await page.screenshot({path:'output/playwright/locate-requesting.png'});
  checks.push(await page.evaluate(() => ({state:document.getElementById('locate-control').dataset.state, disabled:document.querySelector('#locate-control button').disabled, label:document.querySelector('#locate-control button').getAttribute('aria-label')})));
  await page.evaluate(() => window.__fixes[1].ok({coords:{latitude:10.3157,longitude:123.8854,accuracy:25}}));
  await page.waitForFunction(() => !window.__map.isMoving() && window.__map.getZoom() > 14.9);
  for (const width of [320,375,1440]) {
    await page.setViewportSize({width,height:width===1440?900:740});
    const layers=page.getByRole('button',{name:'Layers',exact:true});
    await layers.scrollIntoViewIfNeeded();
    await layers.click();
    const box=await page.getByRole('checkbox',{name:'Points of interest'}).boundingBox();
    if (!box || box.x<0 || box.x+box.width>width || box.y<65) throw Error('Layer dropdown clipped');
    await page.screenshot({path:`output/playwright/navbar-${width}.png`});
    const layout=await page.evaluate(() => {
      const nav=document.querySelector('.ui-navbar'), css=getComputedStyle(nav), r=nav.getBoundingClientRect();
      const b=document.querySelector('#locate-control button'), br=b.getBoundingClientRect();
      return {width:innerWidth,navbarHeight:r.height,layout:nav.className,radius:css.borderRadius,borders:[css.borderTopWidth,css.borderLeftWidth,css.borderRightWidth,css.borderBottomWidth],overflow:document.documentElement.scrollWidth>innerWidth,attribution:!!document.querySelector('.maplibregl-ctrl-attrib'),locate:{x:br.x,y:br.y,width:br.width,height:br.height,color:getComputedStyle(b).color,state:b.parentElement.parentElement.dataset.state,label:b.getAttribute('aria-label')}};
    });
    if(layout.overflow || layout.navbarHeight>80 || layout.attribution || layout.radius!=='0px' || layout.borders.slice(0,3).some(x=>x!=='0px')) throw Error(JSON.stringify(layout));
    checks.push(layout);
    await layers.click();
  }
  await locate.focus();
  await page.keyboard.press('Enter');
  await page.evaluate(() => window.__fixes[2].fail({code:2}));
  await page.screenshot({path:'output/playwright/locate-error.png'});
  checks.push(await page.evaluate(() => ({state:document.getElementById('locate-control').dataset.state,label:document.querySelector('#locate-control button').getAttribute('aria-label'),disabled:document.querySelector('#locate-control button').disabled})));
  if(errors.length) throw Error(errors.join(';'));
  return {date:'2026-10-10',checks,uncaughtErrors:errors};
}

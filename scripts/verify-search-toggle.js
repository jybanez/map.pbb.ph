async(page)=>{
 const cdp=await page.context().newCDPSession(page);await cdp.send('Network.enable');await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});await page.setViewportSize({width:375,height:740});await page.goto('https://map.pbb.ph/');
 const open=page.getByRole('button',{name:'Open map search'}),close=page.getByRole('button',{name:'Close map search'}),input=page.getByRole('textbox',{name:'Search map'});await open.waitFor();await open.click();await input.waitFor();
 if(await close.locator('svg').getAttribute('data-icon')!=='actions.close'||await close.getAttribute('aria-expanded')!=='true')throw Error('Close toggle');
 const layout=await page.evaluate(()=>{const a=document.querySelector('#zoom-control [aria-controls="map-search"]').getBoundingClientRect(),s=document.querySelector('#map-search').getBoundingClientRect();return{action:{right:a.right,top:a.top},search:{left:s.left,top:s.top,right:s.right},overflow:document.documentElement.scrollWidth>innerWidth};});if(layout.search.left<=layout.action.right||Math.abs(layout.search.top-layout.action.top)>2||layout.overflow)throw Error('Placement');
 if(await page.getByRole('button',{name:'Dismiss map search'}).count())throw Error('Extra dismiss');await page.screenshot({path:'output/playwright/search-toggle-mobile.png'});
 await close.click();await open.waitFor();if(await input.isVisible()||!await open.evaluate(e=>e===document.activeElement))throw Error('Close focus');
 await open.click();await input.fill('10.3,123.9');await input.press('Escape');await open.waitFor();if(await input.isVisible()||await open.locator('svg').getAttribute('data-icon')!=='actions.search')throw Error('Escape reset');
 await page.setViewportSize({width:320,height:740});await open.click();const narrow=await input.boundingBox();if(narrow.x+narrow.width>320)throw Error('Narrow overflow');
 return{layout,iconSwitch:true,closeFocusReturn:true,escapeReset:true,narrow};
}

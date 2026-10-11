async(page)=>{
 const cdp=await page.context().newCDPSession(page);await cdp.send('Network.enable');await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
 await page.setViewportSize({width:1440,height:900});await page.goto('https://map.pbb.ph/');
 const input=page.getByRole('textbox',{name:'Search map'}),clear=page.getByRole('button',{name:'Clear map search'}),search=page.getByRole('button',{name:'Show search results'});
 await input.waitFor();const height=await page.locator('#navbar').evaluate(e=>e.getBoundingClientRect().height);
 if(await clear.isVisible()||await search.isVisible())throw Error('Empty buttons visible');
 await input.fill('10.3,123.9');if(!await clear.isVisible()||await search.isVisible())throw Error('Desktop buttons');
 const order=await input.evaluate(e=>({left:e.previousElementSibling?.getAttribute('aria-label'),right:e.nextElementSibling?.getAttribute('aria-label')}));
 if(order.left!=='Clear map search'||order.right!=='Show search results')throw Error('Button order');
 if(await page.locator('#navbar').evaluate(e=>e.getBoundingClientRect().height)!==height)throw Error('Navbar height changed');
 await page.setViewportSize({width:375,height:740});await input.scrollIntoViewIfNeeded();if(!await search.isVisible())throw Error('Mobile search missing');
 await search.click();await page.getByRole('menu',{name:'Map search results'}).waitFor();await page.screenshot({path:'output/playwright/search-layout-mobile.png'});
 const layout=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,statusHeight:document.querySelector('#map-search-status').getBoundingClientRect().height,icons:[...document.querySelectorAll('#map-search button svg')].map(e=>e.dataset.icon)}));
 if(layout.overflow||layout.statusHeight!==1||layout.icons.join(',')!=='actions.close,actions.search')throw Error('Layout/icons');
 await clear.click();if(await clear.isVisible()||await search.isVisible()||await input.inputValue())throw Error('Clear failed');
 await input.fill('91,20');await page.getByRole('menu',{name:'Map search results'}).getByText(/^Coordinates/).waitFor();
 return{desktopHeight:height,order,layout,mobileSearchOpensResults:true,clearHidesBoth:true,visibleValidationFeedback:true};
}

async(page)=>{
 await page.route('**/assets/config.js*',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text()).replace('showDirectionTools: false','showDirectionTools: true')});});
 await page.goto('https://map.pbb.ph/');await page.getByRole('button',{name:'Direction diagnostics',exact:true}).waitFor();
 await page.evaluate(()=>window.__fixes[0]({coords:{latitude:10.3157,longitude:123.8854,accuracy:20}}));await page.getByRole('button',{name:'Direction options',exact:true}).waitFor();
 return {reversibleFlag:true,diagnostics:true,options:true,limit:'Test-only config response override; production default remains false.'};
}
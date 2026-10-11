async page=>{
 await page.goto('https://map.pbb.ph/');
 await page.getByRole('button',{name:'Filter points of interest',exact:true}).waitFor({timeout:60000});
 const result={updateButtons:await page.getByRole('button',{name:'Update Map',exact:true}).count(),updateToasts:await page.getByText('Map update available.',{exact:true}).count(),updateHosts:await page.locator('.pbb-shell-update').count()};
 if(Object.values(result).some(Boolean))throw Error(JSON.stringify(result));return result;
}

async(page)=>{
 const results=[];for(const width of [1200,375]){
 await page.setViewportSize({width,height:740});const geometry=await page.getByRole('dialog').evaluate(d=>{const b=d.querySelector('.ui-modal-body').getBoundingClientRect(),g=d.querySelector('.ui-tree-grid-table-wrap').getBoundingClientRect();return {buttons:[...d.querySelectorAll('.ui-modal-header-actions button')].map(e=>e.textContent),body:{x:b.x,y:b.y,w:b.width,h:b.height},grid:{x:g.x,y:g.y,w:g.width,h:g.height},fit:d.scrollWidth===d.clientWidth}});
 if(geometry.buttons.join('|')!=='Show all|Hide all'||!geometry.fit||Math.abs(geometry.body.h-geometry.grid.h)>2||Math.abs(geometry.body.w-geometry.grid.w)>2)throw Error(JSON.stringify(geometry));
 await page.getByRole('button',{name:'Hide all',exact:true}).click();await page.getByRole('checkbox',{name:'Visibility — class cafe',exact:true}).locator('..').locator('.ui-checkbox-box').click();await page.getByRole('button',{name:'Show all',exact:true}).click();if(!await page.getByRole('checkbox',{name:'Visibility — class cafe',exact:true}).isChecked())throw Error('Header actions failed');await page.screenshot({path:`output/playwright/poi-header-${width}.png`});results.push({width,...geometry});
 }return results;
}

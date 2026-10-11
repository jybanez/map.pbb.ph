async(page)=>{
 const results=[];
 for(const width of [1200,375,320]){
 await page.setViewportSize({width,height:740});
 const trigger=page.getByRole('button',{name:'All ▾',exact:true});
 const geometry=await page.getByRole('dialog').evaluate(d=>{const h=d.querySelector('.ui-modal-header'),t=d.querySelector('.ui-modal-title'),a=d.querySelector('.ui-modal-header-actions'),b=d.querySelector('.ui-modal-body'),g=d.querySelector('.ui-tree-grid-table-wrap');const r=e=>{const x=e.getBoundingClientRect();return {x:x.x,y:x.y,w:x.width,h:x.height}};return {header:r(h),title:r(t),actions:r(a),body:r(b),grid:r(g),fit:d.scrollWidth===d.clientWidth}});
 if(!geometry.fit||Math.abs(geometry.body.h-geometry.grid.h)>2||geometry.actions.y>geometry.header.y+geometry.header.h-20)throw Error(JSON.stringify(geometry));
 await trigger.click();await page.getByRole('menuitem',{name:'Hide all',exact:true}).click();if(await page.getByRole('checkbox',{name:'Visibility — class cafe',exact:true}).isChecked())throw Error('Hide all failed');
 await trigger.click();await page.getByRole('menuitem',{name:'Show all',exact:true}).click();if(!await page.getByRole('checkbox',{name:'Visibility — class cafe',exact:true}).isChecked())throw Error('Show all failed');
 await trigger.focus();await page.keyboard.press('Enter');await page.keyboard.press('ArrowDown');await page.keyboard.press('Escape');await page.waitForTimeout(300);if(!await page.getByRole('dialog').isVisible()||!await trigger.evaluate(e=>e===document.activeElement))throw Error('Escape/focus failed');
 await page.screenshot({path:`output/playwright/poi-menu-${width}.png`});results.push({width,...geometry});
 }
 await page.getByRole('button',{name:'All ▾',exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:'Close modal',exact:true}).click();await page.waitForTimeout(300);if(await page.getByRole('menu').count())throw Error('Orphaned menu');return results;
}

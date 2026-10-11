async(page)=>{
 const results=[];
 for(const width of [1200,375]){
 await page.setViewportSize({width,height:740});
 const alcohol=page.getByRole('row').filter({has:page.getByRole('checkbox',{name:'Visibility — class Alcohol Shop',exact:true})});
 await alcohol.getByRole('button',{name:'Expand row',exact:true}).click();
 await page.getByRole('checkbox',{name:'Visibility — subclass Beverages',exact:true}).waitFor();
 await page.getByRole('checkbox',{name:'Visibility — class Art Gallery',exact:true}).waitFor();await page.getByRole('checkbox',{name:'Visibility — class ATM',exact:true}).waitFor();
 const before=await page.evaluate(()=>JSON.stringify(window.__poiFilter.state.count(window.__map.querySourceFeatures('pbb-poi',{sourceLayer:'poi'})).map(r=>[r.id,r.group,r.count,r.color])));
 await page.getByRole('checkbox',{name:'Visibility — subclass Beverages',exact:true}).locator('..').locator('.ui-checkbox-box').click();
 const check=await page.evaluate(()=>({hidden:!window.__poiFilter.visible({name:'Fixture',class:'alcohol_shop',subclass:'beverages'}),other:window.__poiFilter.visible({name:'Fixture',class:'alcohol_shop',subclass:'alcohol'}),filter:JSON.stringify(window.__map.getFilter('pbb-poi-points'))}));
 const after=await page.evaluate(()=>JSON.stringify(window.__poiFilter.state.count(window.__map.querySourceFeatures('pbb-poi',{sourceLayer:'poi'})).map(r=>[r.id,r.group,r.count,r.color])));
 if(!check.hidden||!check.other||before!==after||!check.filter.includes('alcohol_shop')||!check.filter.includes('beverages'))throw Error('Raw filter/count/color changed');
 await page.screenshot({path:`output/playwright/poi-label-${width}.png`});
 await page.getByRole('checkbox',{name:'Visibility — subclass Beverages',exact:true}).locator('..').locator('.ui-checkbox-box').click();await alcohol.getByRole('button',{name:'Collapse row',exact:true}).click();results.push({width,...check,countsAndPaletteUnchanged:before===after});
 }
 const fixture=await page.evaluate(async()=>{const {createPoiCategories,categoryLabel}=await import('/assets/poi-categories.js?v=20261011-poi-label1');const state=createPoiCategories([]);const features=['art_gallery','art gallery','atm',''].map((group,i)=>({properties:{name:'Fixture '+i,class:group,subclass:'beverages'},geometry:{type:'Point',coordinates:[123+i,10]}}));const rows=state.count(features);state.setClass('art_gallery',false);return {labels:rows.map(r=>r.label),separate:rows.length===4&&!state.visible(features[0].properties)&&state.visible(features[1].properties),fallback:categoryLabel('')};});if(!fixture.separate||fixture.fallback!=='Unspecified')throw Error('Formatted collision merged');return {results,fixture};
}
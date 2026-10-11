async(page)=>{
 const cdp=await page.context().newCDPSession(page);await cdp.send('Network.enable');await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
 await page.setViewportSize({width:1440,height:900});await page.goto('https://map.pbb.ph/');await page.getByRole('textbox',{name:'Search map'}).waitFor();
 const measure=()=>page.evaluate(()=>{const s=document.querySelector('#map-search'),r=s.getBoundingClientRect(),n=document.querySelector('#navbar').getBoundingClientRect(),m=document.querySelector('#map-region').getBoundingClientRect(),z=document.querySelector('#zoom-control').getBoundingClientRect();return{parent:s.parentElement.id,center:r.left+r.width/2,width:innerWidth,top:r.top,bottom:r.bottom,navBottom:n.bottom,mapTop:m.top,zoomTop:z.top,overflow:document.documentElement.scrollWidth>innerWidth};});
 const desktop=await measure();if(desktop.parent!=='navbar'||Math.abs(desktop.center-desktop.width/2)>1||desktop.bottom>desktop.navBottom)throw Error('Desktop center');
 await page.getByRole('textbox',{name:'Search map'}).fill('10.3,123.9');
 await page.setViewportSize({width:375,height:740});await page.waitForTimeout(150);const mobile=await measure();if(mobile.parent!=='map-region'||Math.abs(mobile.center-mobile.width/2)>1||mobile.top<=mobile.navBottom||mobile.zoomTop<mobile.bottom||mobile.overflow)throw Error('Mobile floating placement');
 if(await page.getByRole('textbox',{name:'Search map'}).inputValue()!=='10.3,123.9')throw Error('Lost query');
 await page.screenshot({path:'output/playwright/search-position-mobile.png'});
 await page.setViewportSize({width:1440,height:900});await page.waitForTimeout(150);const restored=await measure();if(restored.parent!=='navbar'||Math.abs(restored.center-720)>1)throw Error('Desktop restoration');
 return{desktop,mobile,restored,queryPreserved:true};
}

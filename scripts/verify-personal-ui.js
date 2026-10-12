async page=>{
 const results=[];
 for(const width of [1200,375]){
  const context=await page.context().browser().newContext({viewport:{width,height:850},serviceWorkers:'block'}),errors=[],requests=[];
  context.on('request',r=>{if(r.url().includes('/vendor/helpers/'))requests.push(new URL(r.url()).pathname);});
  await context.addInitScript(()=>{let lib;Object.defineProperty(window,'maplibregl',{get:()=>lib,set(v){lib=v;const Base=v.Map;v.Map=class extends Base{constructor(o){super(o);window.__map=this;}};}});});
  const tab=await context.newPage();tab.on('pageerror',e=>errors.push(e.message));await tab.goto('https://map.pbb.ph/');await tab.waitForFunction(()=>window.__map?.getSource('pbb-personal-readonly'),null,{timeout:60000});
  const read=()=>tab.evaluate(async()=>{const {createPersonalLayerStore}=await import('./assets/personal-layer-store.js');const s=createPersonalLayerStore();try{return await s.read();}finally{s.close();}});
  await tab.getByRole('button',{name:'Manage personal layers',exact:true}).click();await tab.getByRole('button',{name:'Create layer',exact:true}).waitFor();
  if(!await tab.getByRole('button',{name:'Edit layer',exact:true}).isDisabled()||!await tab.getByRole('button',{name:'Delete layer',exact:true}).isDisabled())throw Error('No-selection actions enabled');
  const box=await tab.locator('.pbb-personal-card').boundingBox();if(box.x<0||box.x+box.width>width||box.height>160)throw Error('Card not compact/in viewport '+JSON.stringify(box));
  await tab.screenshot({path:`output/playwright/personal209-manage-${width}.png`});
  await tab.getByRole('button',{name:'Create layer',exact:true}).click();await tab.getByRole('button',{name:'Create',exact:true}).click();await tab.getByRole('heading',{name:'Check personal layer',exact:true}).waitFor();
  if(await tab.getByLabel('Layer name',{exact:true}).getAttribute('aria-invalid')!=='true'||(await read()).layers.length)throw Error('Invalid name submitted');
  await tab.getByRole('button',{name:'OK',exact:true}).click();await tab.waitForTimeout(350);await tab.getByLabel('Layer name',{exact:true}).fill('Weekend places');await tab.getByRole('button',{name:'Create',exact:true}).click();await tab.getByRole('button',{name:'Save layer',exact:true}).waitFor();
  await tab.getByRole('button',{name:'Point',exact:true}).click();const canvas=await tab.locator('canvas.maplibregl-canvas').boundingBox();await tab.mouse.click(canvas.x+canvas.width*.5,canvas.y+canvas.height*.55);await tab.waitForTimeout(200);
  const finish=tab.getByRole('button',{name:'Finish object',exact:true});if(await finish.isVisible()&&!await finish.isDisabled())await finish.click();await tab.waitForTimeout(150);
  if((await read()).layers[0].features.length)throw Error('Geometry saved before explicit layer Save');
  await tab.getByRole('button',{name:'Close editing',exact:true}).click();await tab.getByRole('heading',{name:'Unsaved personal layer',exact:true}).waitFor();await tab.getByRole('button',{name:'Keep editing',exact:true}).click();await tab.waitForTimeout(350);
  await tab.getByRole('button',{name:'Layer name: Weekend places. Edit',exact:true}).click();await tab.getByLabel('Layer name',{exact:true}).fill('');await tab.getByLabel('Layer name',{exact:true}).press('Enter');await tab.getByRole('heading',{name:'Check personal layer',exact:true}).waitFor();await tab.getByRole('button',{name:'OK',exact:true}).click();await tab.waitForTimeout(350);
  if(await tab.getByLabel('Layer name',{exact:true}).getAttribute('aria-invalid')!=='true')throw Error('Inline invalid state missing');
  await tab.getByLabel('Layer name',{exact:true}).fill('My places');await tab.getByLabel('Layer name',{exact:true}).press('Enter');await tab.getByRole('button',{name:'Layer name: My places. Edit',exact:true}).waitFor();
  await tab.getByRole('button',{name:'Save layer',exact:true}).click();await tab.waitForFunction(()=>document.querySelector('.pbb-personal-card')?.dataset.dirty==='false');const saved=await read();if(saved.layers[0].name!=='My places'||saved.layers[0].features.length!==1)throw Error('Explicit Save incomplete');
  await tab.screenshot({path:`output/playwright/personal209-edit-${width}.png`});await tab.getByRole('button',{name:'Close editing',exact:true}).click();await tab.getByRole('button',{name:'Edit layer',exact:true}).waitFor();
  await tab.getByRole('button',{name:'Edit layer',exact:true}).click();await tab.getByRole('button',{name:'Clear drawings',exact:true}).click();await tab.getByRole('button',{name:'Delete',exact:true}).click();await tab.waitForTimeout(350);await tab.getByRole('button',{name:'Close editing',exact:true}).click();await tab.getByRole('button',{name:'Discard',exact:true}).click();await tab.getByRole('button',{name:'Edit layer',exact:true}).waitFor();await tab.waitForTimeout(350);if((await read()).layers[0].features.length!==1)throw Error('Discard changed saved document');
  await tab.getByRole('button',{name:'Delete layer',exact:true}).click();await tab.getByRole('button',{name:'Cancel',exact:true}).click();await tab.waitForTimeout(350);if((await read()).layers.length!==1)throw Error('Cancel deleted layer');
  if(errors.length)throw Error(JSON.stringify(errors));const unique=[...new Set(requests)];if(unique.length!==3)throw Error(JSON.stringify(unique));results.push({width,compactCard:true,invalidCreateBlocked:true,inlineValidation:true,explicitSave:true,dirtyKeepDiscard:true,deleteCancel:true,helper:unique,pageErrors:errors});await context.close();
 }
 return results;
}

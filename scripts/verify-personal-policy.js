async page=>{
 const context=await page.context().browser().newContext({serviceWorkers:'block'});
 await context.addInitScript(()=>{let lib;Object.defineProperty(window,'maplibregl',{get:()=>lib,set(v){lib=v;const Map=v.Map;v.Map=class extends Map{constructor(o){super(o);window.__map=this;}};}});});
 const tab=await context.newPage();await tab.goto('https://map.pbb.ph/');await tab.waitForFunction(()=>window.__map?.getSource('pbb-personal-readonly'),null,{timeout:60000});
 const cancellation=await tab.evaluate(async()=>{
  const {createPersonalLayers}=await import('./assets/personal-layers.js'),{uiLoader}=await import('./vendor/helpers/js/ui/ui.loader.js');
  const [createModal,createActionModal,createFormModal,createMapControls,uiAlert,createToastStack]=await Promise.all(['ui.modal','ui.action.modal','ui.form.modal','ui.map.controls','ui.dialog.alert','ui.toast'].map(n=>uiLoader.get(n,{preferBundles:true})));
  let resolveRead,readAfterOpen=false;const toast=createToastStack({workspaceBridge:false});
  const component=createPersonalLayers({region:document.getElementById('map-region'),uiLoader,createModal,createActionModal,createFormModal,createMapControls,uiAlert,toast,idPrefix:'fixture-cancel',store:{read:()=>{readAfterOpen=!!document.querySelector('[role=dialog][aria-busy=true]');return new Promise(resolve=>resolveRead=resolve);},save(){throw Error('Unexpected save');},close(){}}});
  component.setMap(window.__map);component.open();await new Promise(resolve=>setTimeout(resolve,50));
  const dialog=document.querySelector('[role=dialog]'),busy=dialog?.getAttribute('aria-busy')==='true';dialog.querySelector('[aria-label="Close modal"]').click();
  await new Promise(resolve=>setTimeout(resolve,300));resolveRead({schema:1,revision:0,layers:[]});await new Promise(resolve=>setTimeout(resolve,100));
  const remainedClosed=!document.querySelector('[role=dialog]');component.destroy();toast.destroy();return {busy,readAfterOpen,remainedClosed,rendererRemoved:!window.__map.getSource('fixture-cancel')};
 });if(Object.values(cancellation).some(v=>!v))throw Error(JSON.stringify(cancellation));
 await tab.evaluate(async()=>{const {createPersonalLayerStore}=await import('./assets/personal-layer-store.js'),s=createPersonalLayerStore();try{const state=await s.read(),c=window.__map.getCenter();state.layers.push({id:'zero-policy',name:'Zero policy',visible:true,features:[{type:'Feature',id:0,properties:null,geometry:{type:'Point',coordinates:[c.lng,c.lat]}}]});await s.save(state);}finally{s.close();}});
 await tab.reload();await tab.waitForFunction(()=>window.__map?.getSource('pbb-personal-readonly'));await tab.getByRole('button',{name:'Manage personal layers',exact:true}).click();await tab.getByRole('button',{name:'Edit Zero policy',exact:true}).click();await tab.getByRole('button',{name:'Point',exact:true}).waitFor();
 await tab.evaluate(()=>{window.__map.setPitch(0);});await tab.waitForTimeout(350);
 const point=await tab.evaluate(()=>{const p=window.__map.project(window.__map.getCenter()),r=window.__map.getCanvas().getBoundingClientRect();return{x:p.x+r.left,y:p.y+r.top};});
 await tab.mouse.click(point.x,point.y);await tab.locator('canvas.maplibregl-canvas').press('Delete');await tab.getByRole('heading',{name:'Delete drawing',exact:true}).waitFor();
 // Duplicate keyboard requests must not stack confirmations.
 await tab.locator('canvas.maplibregl-canvas').press('Delete');if(await tab.getByRole('heading',{name:'Delete drawing',exact:true}).count()!==1)throw Error('Duplicate delete confirmation');
 await tab.getByRole('button',{name:'Cancel',exact:true}).click();await tab.waitForTimeout(350);
 await tab.mouse.click(point.x,point.y);await tab.locator('canvas.maplibregl-canvas').press('Backspace');await tab.getByRole('heading',{name:'Delete drawing',exact:true}).waitFor();
 await tab.evaluate(()=>window.__map.fire('click',{point:{x:100,y:80},lngLat:window.__map.unproject([100,80])}));await tab.getByRole('button',{name:'Delete',exact:true}).click();await tab.getByRole('alert').filter({hasText:'The drawing or layer changed.'}).waitFor();await tab.getByRole('button',{name:'Close',exact:true}).click();await tab.waitForTimeout(350);
 const read=()=>tab.evaluate(async()=>{const {createPersonalLayerStore}=await import('./assets/personal-layer-store.js'),s=createPersonalLayerStore();try{return await s.read();}finally{s.close();}});
 if((await read()).layers[0].features[0].id!==0)throw Error('Stale target deletion lost numeric0');
 await tab.mouse.click(point.x,point.y);await tab.locator('canvas.maplibregl-canvas').press('Delete');await tab.getByRole('button',{name:'Delete',exact:true}).click();await tab.waitForTimeout(500);if((await read()).layers[0].features.length)throw Error('Confirmed keyboard delete failed');
 await tab.locator('canvas.maplibregl-canvas').press('Control+z');await tab.getByRole('heading',{name:'Undo drawing action',exact:true}).waitFor();await tab.getByRole('button',{name:'Apply',exact:true}).click();await tab.waitForTimeout(500);if((await read()).layers[0].features[0].id!==0)throw Error('Undo lost numeric0');
 await tab.getByRole('button',{name:'Done editing',exact:true}).click();await tab.getByRole('button',{name:'Manage personal layers',exact:true}).click();await tab.getByRole('button',{name:'Rename Zero policy',exact:true}).click();await tab.getByRole('heading',{name:'Rename personal layer',exact:true}).waitFor();await tab.getByLabel('Layer name',{exact:true}).fill('Type here');await tab.getByLabel('Layer name',{exact:true}).press('Backspace');if(await tab.getByLabel('Layer name',{exact:true}).inputValue()!=='Type her')throw Error('Editor key handler intercepted text input');
 if(await tab.getByRole('heading',{name:'Delete drawing',exact:true}).count())throw Error('Input Backspace opened deletion');await tab.getByRole('button',{name:'Cancel',exact:true}).click();
 await context.close();return {cancellation,keyboardDeleteConfirmed:true,duplicateBlocked:true,staleSelectionRejected:true,numericZeroRetained:true,keyboardUndoConfirmed:true,editableInputsPreserved:true};
}

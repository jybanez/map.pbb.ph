async page=>{
 const context=await page.context().browser().newContext({serviceWorkers:'block'}),errors=[];
 await context.addInitScript(()=>{let lib;Object.defineProperty(window,'maplibregl',{get:()=>lib,set(v){lib=v;const Base=v.Map;v.Map=class extends Base{constructor(o){super(o);window.__map=this;}};}});});
 const tab=await context.newPage();tab.on('pageerror',e=>errors.push(e.message));await tab.goto('https://map.pbb.ph/');await tab.waitForFunction(()=>window.__map?.getSource('pbb-personal-readonly'),null,{timeout:60000});
 const loading=await tab.evaluate(async()=>{
  const {createPersonalLayers}=await import('./assets/personal-layer-ui.js'),{uiLoader}=await import('./vendor/helpers/js/ui/ui.loader.js?v=0.21.301');
  const [createActionModal,createFormModal,createMapControls,createBusyOverlay,uiAlert,createToastStack]=await Promise.all(['ui.action.modal','ui.form.modal','ui.map.controls','ui.busy.overlay','ui.dialog.alert','ui.toast'].map(n=>uiLoader.get(n,{preferBundles:true})));
  const toast=createToastStack({workspaceBridge:false});let release;
  const fixture=createPersonalLayers({region:document.getElementById('map-region'),uiLoader,createActionModal,createFormModal,createMapControls,createBusyOverlay,uiAlert,toast,idPrefix:'fixture-loading',store:{read:()=>new Promise(resolve=>release=resolve),save(){throw Error('Unexpected save');},close(){}}});
  fixture.setMap(window.__map);void fixture.open();await new Promise(resolve=>setTimeout(resolve,100));const card=[...document.querySelectorAll('.pbb-personal-card')].find(e=>!e.hidden),busy=card.getAttribute('aria-busy')==='true',shown=card.offsetHeight>0;
  card.querySelector('button').click();release({schema:1,revision:0,layers:[]});await new Promise(resolve=>setTimeout(resolve,150));const staysClosed=card.hidden;
  fixture.destroy();toast.destroy();return{busy,shown,staysClosed,removed:!window.__map.getSource('fixture-loading')};
 });if(Object.values(loading).some(v=>!v))throw Error(JSON.stringify(loading));
 await tab.evaluate(async()=>{
  const {createPersonalLayers}=await import('./assets/personal-layer-ui.js'),{uiLoader}=await import('./vendor/helpers/js/ui/ui.loader.js?v=0.21.301');
  const [createActionModal,createFormModal,createMapControls,createBusyOverlay,uiAlert,createToastStack]=await Promise.all(['ui.action.modal','ui.form.modal','ui.map.controls','ui.busy.overlay','ui.dialog.alert','ui.toast'].map(n=>uiLoader.get(n,{preferBundles:true})));
  const toast=createToastStack({workspaceBridge:false}),initial={schema:1,revision:0,layers:[]};window.__writes=0;
  const fixture=createPersonalLayers({region:document.getElementById('map-region'),uiLoader,createActionModal,createFormModal,createMapControls,createBusyOverlay,uiAlert,toast,idPrefix:'fixture-context',store:{read:async()=>initial,save:state=>{window.__writes++;return new Promise(resolve=>{window.__release=()=>{window.__saved=structuredClone({...state,revision:state.revision+1});resolve(window.__saved);};});},close(){}}});
  fixture.setMap(window.__map);void fixture.open();window.__fixture=fixture;window.__cleanup=()=>{fixture.destroy();toast.destroy();};
 });
 await tab.getByRole('button',{name:'Create layer',exact:true}).click();await tab.getByLabel('Layer name',{exact:true}).fill('Context cancelled');await tab.getByRole('button',{name:'Create',exact:true}).click();await tab.waitForFunction(()=>window.__writes===1);
 await tab.evaluate(()=>{window.__fixture.setMap(null);window.__release();});await tab.waitForTimeout(500);
 if(await tab.getByRole('button',{name:'Save layer',exact:true}).isVisible())throw Error('Late creation entered invalid map context');
 await tab.evaluate(()=>window.__fixture.setMap(window.__map));
 // Fixture card remains closed after the invalidated opening. Open it explicitly.
 await tab.evaluate(()=>window.__fixture.open());await tab.getByRole('button',{name:'Create layer',exact:true}).waitFor();
 await tab.getByRole('button',{name:'Personal layer',exact:true}).click();await tab.getByRole('option',{name:'Context cancelled',exact:true}).click();await tab.getByRole('button',{name:'Edit layer',exact:true}).click();
 await tab.getByRole('button',{name:'Layer name: Context cancelled. Edit',exact:true}).click();await tab.getByLabel('Layer name',{exact:true}).fill('Retained inline draft');
 await tab.evaluate(()=>{window.__fixture.setMap(null);window.__fixture.setMap(window.__map);});await tab.getByLabel('Layer name',{exact:true}).waitFor();if(await tab.getByLabel('Layer name',{exact:true}).inputValue()!=='Retained inline draft')throw Error('Context transition lost inline draft');
 await tab.getByRole('button',{name:'Close editing',exact:true}).click();await tab.getByRole('button',{name:'Discard',exact:true}).click();await tab.waitForTimeout(350);
 const state=await tab.evaluate(()=>({writes:window.__writes,name:window.__saved.layers[0].name}));if(state.writes!==1||state.name!=='Context cancelled')throw Error('Context cancellation wrote or replayed');
 await tab.getByRole('button',{name:'Create layer',exact:true}).click();await tab.getByLabel('Layer name',{exact:true}).fill('Disposed during save');await tab.getByRole('button',{name:'Create',exact:true}).click();await tab.waitForFunction(()=>window.__writes===2);await tab.evaluate(()=>{window.__cleanup();window.__release();});await tab.waitForTimeout(500);
 const destroyed=await tab.evaluate(()=>!window.__map.getSource('fixture-context')&&!window.__fixture.isEditing());if(!destroyed)throw Error('Late save resurrected disposed renderer/editor');
 if(errors.length)throw Error(JSON.stringify(errors));await context.close();return{loading,lateCreateCannotEnterEditing:true,inlineDraftSurvivesContext:true,lateSaveCannotResurrect:true,noReplay:true,pageErrors:errors};
}

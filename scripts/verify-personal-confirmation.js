async page=>{
 const context=await page.context().browser().newContext({serviceWorkers:'block'});
 await context.addInitScript(()=>{let lib;Object.defineProperty(window,'maplibregl',{get:()=>lib,set(v){lib=v;const Map=v.Map;v.Map=class extends Map{constructor(o){super(o);window.__map=this;}};}});});
 const tab=await context.newPage();await tab.goto('https://map.pbb.ph/');await tab.waitForFunction(()=>window.__map?.getSource('pbb-personal-readonly'),null,{timeout:60000});
 await tab.evaluate(async()=>{
  const {createPersonalLayers}=await import('./assets/personal-layers.js'),{uiLoader}=await import('./vendor/helpers/js/ui/ui.loader.js');
  const [createModal,createActionModal,createFormModal,createMapControls,uiAlert,createToastStack]=await Promise.all(['ui.modal','ui.action.modal','ui.form.modal','ui.map.controls','ui.dialog.alert','ui.toast'].map(n=>uiLoader.get(n,{preferBundles:true})));
  const c=window.__map.getCenter(),initial={schema:1,revision:0,layers:[{id:'pending',name:'Pending fixture',visible:true,features:[{type:'Feature',id:0,properties:null,geometry:{type:'Point',coordinates:[c.lng,c.lat]}}]}]},toast=createToastStack({workspaceBridge:false});window.__saveCalls=0;window.__saved=null;
  const component=createPersonalLayers({region:document.getElementById('map-region'),uiLoader,createModal,createActionModal,createFormModal,createMapControls,uiAlert,toast,idPrefix:'fixture-pending',store:{read:async()=>initial,save:state=>{window.__saveCalls++;return new Promise((resolve,reject)=>{window.__release=()=>{window.__saved=structuredClone({...state,revision:state.revision+1});resolve(window.__saved);};window.__deny=()=>reject(Error('Injected authored write failure'));});},close(){}}});
  window.__pendingFixture=component;window.__pendingCleanup=()=>{component.destroy();toast.destroy();};component.setMap(window.__map);component.open();
 });
 await tab.getByRole('button',{name:'Edit Pending fixture',exact:true}).click();await tab.getByRole('button',{name:'Point',exact:true}).waitFor();await tab.evaluate(()=>window.__map.setPitch(0));await tab.waitForTimeout(250);
 const p=await tab.evaluate(()=>{const c=window.__map.project(window.__map.getCenter()),r=window.__map.getCanvas().getBoundingClientRect();return{x:c.x+r.left,y:c.y+r.top};});await tab.mouse.click(p.x,p.y);await tab.getByRole('button',{name:'Delete selected drawing',exact:true}).click();
 if(await tab.getByRole('heading',{name:'Delete drawing',exact:true}).count())throw Error('Pending save allowed deletion confirmation');
 await tab.evaluate(()=>window.__release());await tab.getByText('Personal layers saved on this device.',{exact:true}).waitFor();
 await tab.getByRole('button',{name:'Delete selected drawing',exact:true}).click();await tab.getByRole('heading',{name:'Delete drawing',exact:true}).waitFor();await tab.getByRole('button',{name:'Delete',exact:true}).click();await tab.waitForFunction(()=>window.__saveCalls===2);
 await tab.getByRole('heading',{name:'Delete drawing',exact:true}).waitFor();if(!await tab.getByRole('button',{name:'Delete',exact:true}).isDisabled())throw Error('Confirmation not busy during save');
 await tab.evaluate(()=>window.__deny());await tab.getByRole('dialog').filter({has:tab.getByRole('heading',{name:'Delete drawing',exact:true})}).getByText(/Personal layers were not saved/).waitFor();await tab.getByRole('button',{name:'Close',exact:true}).waitFor();await tab.waitForTimeout(350);
 if(await tab.evaluate(()=>window.__saveCalls!==2||window.__saved.layers[0].features[0].id!==0))throw Error('Failed confirmation replayed or replaced saved data');await tab.evaluate(()=>window.__pendingCleanup());await context.close();return {confirmationWaitedForSave:true,failureKeptConfirmation:true,savedZeroPreserved:true,noAutomaticReplay:true};
}

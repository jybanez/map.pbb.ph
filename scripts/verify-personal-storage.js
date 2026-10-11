async page=>{
 const browser=page.context().browser(),results=[];
 for(const mode of ['denied','quota','corrupt']){
  const context=await browser.newContext({serviceWorkers:'block'});
  await context.addInitScript(mode=>{
   if(mode==='denied'){const original=IDBFactory.prototype.open;IDBFactory.prototype.open=function(name,...rest){if(name==='pbb-personal-layers-v1')throw new DOMException('Personal storage denied fixture','SecurityError');return original.call(this,name,...rest);};}
   if(mode==='quota'){const original=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(...args){if(this.transaction.db.name==='pbb-personal-layers-v1')throw new DOMException('Personal storage quota fixture','QuotaExceededError');return original.apply(this,args);};}
  },mode);
  const tab=await context.newPage();await tab.goto('https://map.pbb.ph/');await tab.getByRole('button',{name:'Manage personal layers',exact:true}).waitFor({timeout:60000});
  if(mode==='corrupt'){
   await tab.getByRole('button',{name:'Manage personal layers',exact:true}).click();await tab.getByRole('button',{name:'Create layer',exact:true}).waitFor({timeout:60000});await tab.getByRole('button',{name:'Close modal',exact:true}).click();await tab.evaluate(async()=>{const request=indexedDB.open('pbb-personal-layers-v1',1);await new Promise((resolve,reject)=>{request.onsuccess=resolve;request.onerror=reject;});const tx=request.result.transaction('documents','readwrite');tx.objectStore('documents').put({schema:99,revision:4,layers:[]},'layers');await new Promise((resolve,reject)=>{tx.oncomplete=resolve;tx.onabort=reject;});request.result.close();});await tab.reload();
  }
  await tab.getByRole('button',{name:'Manage personal layers',exact:true}).click();
  if(mode==='quota'){
   await tab.getByRole('button',{name:'Create layer',exact:true}).click();await tab.getByLabel('Layer name',{exact:true}).fill('Keep my input');await tab.getByRole('button',{name:'Create',exact:true}).click();
   await tab.getByText('Personal storage quota fixture',{exact:true}).first().waitFor();
   if(await tab.getByLabel('Layer name',{exact:true}).inputValue()!=='Keep my input')throw Error('Failed save discarded input');
   const record=await tab.evaluate(async()=>{const {createPersonalLayerStore}=await import('./assets/personal-layer-store.js');const s=createPersonalLayerStore();try{return await s.read();}finally{s.close();}});if(record.layers.length)throw Error('Failed save claimed commit');
   results.push({mode,visibleError:true,inputPreserved:true,noCommittedLayer:true,noAutomaticReplay:true});
  }else{
   await tab.getByRole('alert').filter({hasText:'Personal layers could not load.'}).waitFor();if(await tab.getByRole('button',{name:'Create layer',exact:true}).count())throw Error('Unavailable data enabled mutation');
   if(mode==='corrupt'){const value=await tab.evaluate(async()=>{const r=indexedDB.open('pbb-personal-layers-v1',1);await new Promise(resolve=>r.onsuccess=resolve);const q=r.result.transaction('documents').objectStore('documents').get('layers');const value=await new Promise(resolve=>q.onsuccess=()=>resolve(q.result));r.result.close();return value;});if(value.schema!==99)throw Error('Corrupt data silently replaced');}
   results.push({mode,visibleError:true,noEnabledCreate:true,savedDataNotReplaced:true});
  }
  await context.close();
 }
 const context=await browser.newContext({serviceWorkers:'block'}),tab=await context.newPage();await tab.goto('https://map.pbb.ph/');
 const atomic=await tab.evaluate(async()=>{
  const {createPersonalLayerStore}=await import('./assets/personal-layer-store.js'),a=createPersonalLayerStore(),b=createPersonalLayerStore();
  try{const first=await a.read(),stale=await b.read();first.layers.push({id:'zero-layer',name:'Numeric zero',visible:false,features:[{type:'Feature',id:0,properties:null,geometry:{type:'Point',coordinates:[123.8854,10.3157]}}]});await a.save(first);let rejected=false;try{await b.save(stale);}catch(error){rejected=error.message.includes('another tab');}const saved=await b.read();return {staleWriteRejected:rejected,id:saved.layers[0].features[0].id,visible:saved.layers[0].visible,revision:saved.revision};}finally{a.close();b.close();}
 });if(!atomic.staleWriteRejected||atomic.id!==0||atomic.visible!==false)throw Error(JSON.stringify(atomic));
 await tab.reload();await tab.getByRole('button',{name:'Manage personal layers',exact:true}).click();await tab.getByRole('button',{name:'Edit Numeric zero',exact:true}).waitFor({timeout:60000});results.push({atomic,numericZeroRestoredInApp:true});await context.close();return results;
}

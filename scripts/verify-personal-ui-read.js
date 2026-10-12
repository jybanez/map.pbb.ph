async page=>{
 const results=[];
 for(const mode of ['denied','corrupt']){
  const context=await page.context().browser().newContext({serviceWorkers:'block'}),errors=[];
  if(mode==='denied')await context.addInitScript(()=>{const open=IDBFactory.prototype.open;IDBFactory.prototype.open=function(name,...args){if(name==='pbb-personal-layers-v1')throw new DOMException('Personal storage denied fixture','SecurityError');return open.call(this,name,...args);};});
  const tab=await context.newPage();tab.on('pageerror',e=>errors.push(e.message));await tab.goto('https://map.pbb.ph/');await tab.getByRole('button',{name:'Manage personal layers',exact:true}).waitFor({timeout:60000});
  if(mode==='corrupt'){
   await tab.getByRole('button',{name:'Manage personal layers',exact:true}).click();await tab.getByRole('button',{name:'Create layer',exact:true}).waitFor();await tab.getByRole('button',{name:'Manage personal layers',exact:true}).click();
   await tab.evaluate(async()=>{const request=indexedDB.open('pbb-personal-layers-v1',1);await new Promise((resolve,reject)=>{request.onsuccess=resolve;request.onerror=reject;});const tx=request.result.transaction('documents','readwrite');tx.objectStore('documents').put({schema:99,revision:4,layers:[]},'layers');await new Promise((resolve,reject)=>{tx.oncomplete=resolve;tx.onabort=reject;});request.result.close();});await tab.reload();
  }
  await tab.getByRole('button',{name:'Manage personal layers',exact:true}).click();await tab.locator('.pbb-personal-card').getByText(/Personal layers could not load/).waitFor();
  if(await tab.getByRole('button',{name:'Create layer',exact:true}).count())throw Error('Read failure exposed creation');
  await tab.getByRole('button',{name:'Manage personal layers',exact:true}).click();if(await tab.locator('.pbb-personal-card').isVisible())throw Error('Read failure prevented dismissal');
  if(mode==='corrupt'){const raw=await tab.evaluate(async()=>{const request=indexedDB.open('pbb-personal-layers-v1',1);await new Promise(resolve=>request.onsuccess=resolve);const read=request.result.transaction('documents').objectStore('documents').get('layers'),value=await new Promise(resolve=>read.onsuccess=()=>resolve(read.result));request.result.close();return value;});if(raw.schema!==99||raw.revision!==4)throw Error('Corrupt record replaced');}
  if(errors.length)throw Error(JSON.stringify(errors));results.push({mode,visibleError:true,noMutation:true,dismissible:true,pageErrors:errors});await context.close();
 }
 return results;
}

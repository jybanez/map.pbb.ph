import { createPersonalLayerStore, validateLayerDocument } from './personal-layer-store.js?v=20261011-personal-layers1';
export function createPersonalLayers({region,uiLoader,createModal,createActionModal,createFormModal,createMapControls,uiAlert,toast,onChange,onEditingChange,store=createPersonalLayerStore(),idPrefix='pbb-personal-readonly'}) {
  const panel=document.createElement('div'); panel.className='pbb-personal-editor'; panel.hidden=true;region.append(panel);
  const status=document.createElement('p');status.setAttribute('role','status');
  let map=null,disposed=false,mapToken=0,openToken=0,loaded=false,loading=null,documentState={schema:1,revision:0,layers:[]},blocked=false,writing=false,dirty=false;
  let renderQueued=false,confirmation=null,editorEpoch=0,pendingWrite=null;
  let createAdapter,createTools,createGrid,adapter=null,tools=null,editorControls=null,active=null,grid=null,rowControls=[],form=null,life=null;
  const modal=createModal({title:'Personal layers',ariaLabel:'Manage personal layers',size:'lg',className:'pbb-personal-modal',workspaceBridge:false,closeWhileBusy:true,backdropCloseWhileBusy:true,escapeCloseWhileBusy:true,onBeforeClose:()=>{openToken++;clearGrid();}});
  const source=idPrefix,renderLayers=['fill','line','point'].map(x=>`${source}-${x}`);
  function fail(error){blocked=true;if(disposed)return;status.textContent=`Personal layers were not saved. ${error?.message||'Local storage failed.'} Your current edits remain in this session. Keep this page open, or export personal layers before reloading.`;toast.show(status.textContent,{type:'error',persistent:true,dismissible:true});onChange?.();}
  function clearGrid(){modal.setHeaderActions(null);grid?.destroy();grid=null;rowControls.splice(0).forEach(c=>c.destroy());}
  function render(){
    if(!map?.isStyleLoaded())return;
    const features=documentState.layers.filter(l=>l.visible&&l.id!==active).flatMap(l=>l.features.map(f=>({...structuredClone(f),id:`${l.id}:${f.id}`})));
    if(!map.getSource(source))map.addSource(source,{type:'geojson',data:{type:'FeatureCollection',features}});else map.getSource(source).setData({type:'FeatureCollection',features});
    const specs=[{id:renderLayers[0],type:'fill',filter:['==',['geometry-type'],'Polygon'],paint:{'fill-color':'#64b5f6','fill-opacity':0.18}},{id:renderLayers[1],type:'line',filter:['!=',['geometry-type'],'Point'],paint:{'line-color':'#64b5f6','line-width':3}},{id:renderLayers[2],type:'circle',filter:['==',['geometry-type'],'Point'],paint:{'circle-color':'#64b5f6','circle-radius':6,'circle-stroke-color':'#fff','circle-stroke-width':1}}];
    for(const spec of specs)if(!map.getLayer(spec.id))map.addLayer({...spec,source});
  }
  function styleData(){
    if(renderQueued||!map||map.getSource(source)&&renderLayers.every(id=>map.getLayer(id)))return;
    const context=map;renderQueued=true;queueMicrotask(()=>{renderQueued=false;if(!disposed&&context===map)render();});
  }
  async function load(){
    if(loaded)return;if(loading){await loading;if(!loaded)return load();return;}
    const context=map,id=mapToken;
    loading=(async()=>{
      if(!context)throw Error('Wait for the map to load, then reopen Personal layers.');
      [createAdapter,createTools,createGrid]=await Promise.all(['ui.map.drawing.maplibre','ui.map.drawing','ui.tree.grid'].map(name=>uiLoader.get(name,{preferBundles:true})));
      const saved=await store.read();
      if(disposed||context!==map||id!==mapToken)throw Error("Map context changed; reopen Personal layers after the map loads.");
      const validator=createAdapter(context);try{documentState=validateLayerDocument(saved,features=>validator.validateFeatures(features));}finally{validator.destroy();}
      loaded=true;blocked=false;render();onChange?.();
    })().finally(()=>{loading=null;});return loading;
  }
  async function persist(){
    if(writing)return pendingWrite;if(blocked||!dirty||disposed)return;
    pendingWrite=(async()=>{writing=true;dirty=false;const snapshot=structuredClone(documentState);status.textContent='Saving personal layers…';
    try{const saved=await store.save(snapshot);documentState.revision=saved.revision;status.textContent=dirty?'Saving personal layers…':'Personal layers saved on this device.';}
    catch(error){dirty=true;fail(error);}
    finally{writing=false;if(!disposed)onChange?.();if(dirty&&!blocked&&!disposed)queueMicrotask(()=>void persist());}
    })();return pendingWrite;
  }
  function geometryChanged(){
    // Subscribers never mutate the adapter or persist reentrantly.
    const current=adapter,layerId=active,features=current?.getFeatures();
    queueMicrotask(()=>{if(disposed||current!==adapter||!layerId)return;const layer=documentState.layers.find(l=>l.id===layerId);if(!layer)return;layer.features=features;dirty=true;render();void persist();});
  }
  function changed(){if(disposed)return;render();onChange?.();if(modal.getState().open)showRows();}
  async function commit(next){
    if(blocked||writing||dirty)throw Error(blocked?'Storage failed. Keep this page open; reload only after preserving your edits.':'Wait for current edits to finish saving.');
    writing=true;onChange?.();try{documentState=await store.save(next);changed();}catch(error){fail(error);throw error;}finally{writing=false;changed();}
  }
  function exportBackup(){const url=URL.createObjectURL(new Blob([JSON.stringify(documentState,null,2)],{type:'application/json'}));const link=document.createElement('a');link.href=url;link.download='pbb-personal-layers.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  function invalid({errors}){return uiAlert('Please address the following issues before continuing:',{title:'Check personal layer',variant:'error',items:Object.keys(errors).map(()=> 'Layer name — '+errors.name),draggable:true,workspaceBridge:false,signal:life.signal});}
  function nameForm(layer=null){
    if(form?.getState().open||blocked||writing||active)return;
    life?.abort();life=new AbortController();const context=map;
    let instance;form=instance=createFormModal({title:layer?'Rename personal layer':'Create personal layer',ariaLabel:layer?'Rename personal layer':'Create personal layer',workspaceBridge:false,columns:1,rows:[[{type:'input',name:'name',label:'Layer name',required:true,maxLength:80}]],initialValues:{name:layer?.name||''},submitLabel:layer?'Rename':'Create',cancelLabel:'Cancel',manageBusyOnSubmit:false,autoBusy:false,
      validate:values=>{const name=String(values.name||'').trim();return !name?{name:'Enter a layer name.'}:name.length>80?{name:'Use no more than 80 characters.'}:documentState.layers.some(l=>l.id!==layer?.id&&l.name.toLocaleLowerCase()===name.toLocaleLowerCase())?{name:'Choose a different name; this name already exists.'}:{};},onInvalid:invalid,
      onBeforeClose:()=>life?.abort(),onClose:()=>{if(form===instance)form=null;},
      onSubmit:async values=>{if(disposed||map!==context)return false;instance.setBusy(true,{message:'Saving personal layer…'});try{const next=structuredClone(documentState);if(layer)next.layers.find(l=>l.id===layer.id).name=values.name.trim();else next.layers.push({id:crypto.randomUUID(),name:values.name.trim(),visible:true,features:[]});await commit(next);return true;}catch(error){instance.setFormError(error.message);return false;}finally{instance.setBusy(false);}}
    });form.open();
  }
  function requestConfirmation({title,content,valid,action,label='Delete'}){
    if(confirmation||disposed||writing||dirty||blocked)return;
    let instance;confirmation=instance=createActionModal({title,content,workspaceBridge:false,autoBusy:false,closeOnBackdrop:true,closeOnEscape:true,
      onClose:()=>{if(confirmation===instance)confirmation=null;instance.destroy();},
      actions:[{id:'cancel',label:'Cancel',onClick:()=>true},{id:'confirm',label,variant:'danger',onClick:async()=>{
        if(disposed||writing||dirty||blocked||!valid()){
          const error=document.createElement('p');error.setAttribute('role','alert');error.textContent='The drawing or layer changed. Close this confirmation and choose the action again.';instance.setContent(error);instance.setActions([{id:'cancel',label:'Close',onClick:()=>true}]);return false;
        }
        instance.setBusy(true,{message:'Applying confirmed change…'});
        try{await action();return true;}catch(error){const p=document.createElement('p');p.setAttribute('role','alert');p.textContent=error.message;instance.setContent(p);instance.setActions([{id:'cancel',label:'Close',onClick:()=>true}]);return false;}finally{instance.setBusy(false);}
      }}]});instance.open();
  }
  function deleteLayer(layer){
    if(active)return;const context=map,revision=documentState.revision,snapshot=JSON.stringify(layer);
    requestConfirmation({title:'Delete personal layer',content:`Delete “${layer.name}” and all its drawings from this device?`,valid:()=>map===context&&!active&&documentState.revision===revision&&JSON.stringify(documentState.layers.find(l=>l.id===layer.id))===snapshot,
      action:()=>{const next=structuredClone(documentState);next.layers=next.layers.filter(l=>l.id!==layer.id);return commit(next);}});
  }
  function confirmedEditorAction(method){
    const current=adapter;if(!current)return;
    const context=map,layerId=active,epoch=editorEpoch,revision=documentState.revision,state=current.getState(),snapshot=JSON.stringify(state);
    if(method==='deleteSelected'&&(state.selectedFeatureId===null||state.selectedFeatureId===undefined))return;
    requestConfirmation({title:({deleteSelected:'Delete drawing',clear:'Clear layer',undo:'Undo drawing action',redo:'Redo drawing action'})[method],content:method==='deleteSelected'?'Delete the selected drawing?':method==='clear'?'Delete all drawings in this layer?':'Apply this history action? It may remove or restore personal drawings.',label:['deleteSelected','clear'].includes(method)?'Delete':'Apply',
      valid:()=>current===adapter&&context===map&&layerId===active&&epoch===editorEpoch&&revision===documentState.revision&&snapshot===JSON.stringify(current.getState()),action:async()=>{current[method]();await Promise.resolve();await persist();if(blocked||dirty)throw Error(status.textContent||'Personal layers were not saved.');}});
  }
  function deleteFeature(){confirmedEditorAction('deleteSelected');}
  function stopEditing(){
    if(!adapter)return;confirmation?.close({reason:'editor-exit'});editorEpoch++;const layer=documentState.layers.find(l=>l.id===active);if(layer){const features=adapter.getFeatures();if(JSON.stringify(features)!==JSON.stringify(layer.features)){layer.features=features;dirty=true;void persist();}}
    tools?.destroy();tools=null;adapter.destroy();adapter=null;active=null;editorControls?.destroy();editorControls=null;panel.hidden=true;panel.replaceChildren();life?.abort();onEditingChange?.(false);changed();
  }
  async function edit(layer){
    if(blocked||writing||dirty||active||!map)return;
    modal.close();active=layer.id;layer.visible=true;dirty=true;void persist();
    onEditingChange?.(true);panel.hidden=false;
    const heading=document.createElement('p');heading.textContent=`Editing ${layer.name}`;panel.append(heading,status);
    try{
      adapter=createAdapter(map,{features:layer.features,onError:error=>toast.show(error.message,{type:'error'})});
      for(const event of ['create','update','delete'])adapter.on(event,geometryChanged);
      for(const event of ['create','update','delete','select','modechange','measure'])adapter.on(event,()=>{editorEpoch++;});
      const host=document.createElement('div');panel.append(host);const boundary={...adapter,undo:()=>confirmedEditorAction('undo'),redo:()=>confirmedEditorAction('redo')};tools=createTools(host,{adapter:boundary,features:layer.features,modes:['select','pan','point','line','polygon'],actions:['finish','cancel','undo','redo'],orientation:'horizontal',labels:'always'});
      const actions=document.createElement('div');panel.append(actions);editorControls=createMapControls(actions,{controls:['delete-drawing','clear-drawings','export-layers','done'],orientation:'horizontal',actions:[{id:'clear-drawings',label:'Clear layer',icon:'actions.delete',onActivate:()=>confirmedEditorAction('clear')},{id:'export-layers',label:'Export personal layers',icon:'actions.download',onActivate:exportBackup},{id:'delete-drawing',label:'Delete selected drawing',icon:'actions.delete',onActivate:()=>void deleteFeature()},{id:'done',label:'Done editing',icon:'actions.check',onActivate:()=>{if(adapter?.getState().draft.length){toast.show('Finish or cancel the unfinished drawing before choosing Done.',{type:'warn',dismissible:true});return;}stopEditing();}}]});render();onChange?.();
    }catch(error){stopEditing();toast.show(error.message,{type:'error'});}
  }
  function showRows(){
    clearGrid();const content=document.createElement('div'),actions=document.createElement('div'),host=document.createElement('div');content.className='pbb-personal-grid';content.append(host);modal.setHeaderActions(actions);
    rowControls.push(createMapControls(actions,{controls:['new-layer',...(blocked&&loaded?['export-layers']:[])],actions:[{id:'export-layers',label:'Export personal layers',icon:'actions.download',onActivate:exportBackup},{id:'new-layer',label:'Create layer',icon:'actions.add',disabled:blocked||writing||dirty||!!active,onActivate:()=>nameForm()}]}));
    if(blocked){const feedback=document.createElement('p');feedback.setAttribute('role','alert');feedback.textContent=status.textContent||'Personal layers could not load. Close and reopen to retry reading local storage. No saved data has been replaced.';content.prepend(feedback);}
    grid=createGrid(host,{chrome:false,ariaLabel:'Personal layers',rows:documentState.layers.map(l=>({...l,count:l.features.length})),columns:[{key:'name',label:'Layer'},{key:'count',label:'Drawings'},{key:'actions',label:'Actions',renderCell:({row})=>{const cell=document.createElement('div');cell.addEventListener('click',e=>e.stopPropagation());cell.addEventListener('keydown',e=>e.stopPropagation());rowControls.push(createMapControls(cell,{controls:['edit','rename','delete'],orientation:'horizontal',actions:[{id:'edit',label:`Edit ${row.name}`,icon:'actions.edit',disabled:blocked||writing||dirty||!!active,onActivate:()=>void edit(documentState.layers.find(l=>l.id===row.id))},{id:'rename',label:`Rename ${row.name}`,icon:'actions.settings',disabled:blocked||writing||dirty||!!active,onActivate:()=>nameForm(documentState.layers.find(l=>l.id===row.id))},{id:'delete',label:`Delete ${row.name}`,icon:'actions.delete',disabled:blocked||writing||dirty||!!active,onActivate:()=>void deleteLayer(documentState.layers.find(l=>l.id===row.id))}]}));return cell;}}],emptyText:'No personal layers yet. Create a layer to add points, lines or polygons.'});modal.setContent(content);
  }
  async function open(){
    if(disposed||modal.getState().open)return;const id=++openToken,context=map;clearGrid();modal.setContent(null);modal.setBusy(true,{message:'Reading personal layers…'});modal.open();
    await new Promise(resolve=>requestAnimationFrame(()=>setTimeout(resolve,0)));
    try{await load();if(disposed||id!==openToken||context!==map||!modal.getState().open)return;showRows();modal.setBusy(false);}
    catch(error){if(disposed||id!==openToken||!modal.getState().open)return;blocked=true;const p=document.createElement('p');p.setAttribute('role','alert');p.textContent=`Personal layers could not load. ${error.message} Close and reopen to retry; saved data has not been replaced.`;modal.setContent(p);modal.setBusy(false);}
  }
  const key=event=>{
    if(!adapter||event.target!==map?.getCanvas())return;
    if(['Delete','Backspace'].includes(event.key)){event.preventDefault();event.stopImmediatePropagation();deleteFeature();}
    else if((event.ctrlKey||event.metaKey)&&['z','y'].includes(event.key.toLowerCase())){event.preventDefault();event.stopImmediatePropagation();confirmedEditorAction(event.key.toLowerCase()==='y'||event.shiftKey?'redo':'undo');}
  };
  window.addEventListener('keydown',key,true);
  const unload=event=>{if(dirty||writing){event.preventDefault();event.returnValue='';}};window.addEventListener('beforeunload',unload);
  return {open,isEditing:()=>!!active,getLayers:()=>loaded?documentState.layers.map(l=>({id:l.id,label:l.name,checked:l.visible,disabled:writing||blocked||!!active})):[],
    async setVisibility(id,visible){if(!loaded||active||writing||dirty||blocked){onChange?.();return;}const next=structuredClone(documentState);const layer=next.layers.find(l=>l.id===id);if(!layer)return;layer.visible=visible;try{await commit(next);}catch(error){toast.show(error.message,{type:'error'});onChange?.();}},
    setMap(next){confirmation?.close({reason:'context-change'});mapToken++;openToken++;modal.close();form?.close();stopEditing();if(map){map.off('style.load',render);map.off('styledata',styleData);for(const id of [...renderLayers].reverse())if(map.getLayer(id))map.removeLayer(id);if(map.getSource(source))map.removeSource(source);}map=next;if(map){map.on('style.load',render);map.on('styledata',styleData);void load().then(()=>{if(map===next)render();}).catch(error=>{if(disposed||map!==next)return;status.textContent=error.message;toast.show(`Personal layers could not load. ${error.message}`,{type:'error',persistent:true});});}},
    destroy(){disposed=true;confirmation?.destroy();confirmation=null;mapToken++;openToken++;stopEditing();life?.abort();form?.destroy();clearGrid();modal.destroy();map?.off('style.load',render);map?.off('styledata',styleData);if(map){for(const id of [...renderLayers].reverse())if(map.getLayer(id))map.removeLayer(id);if(map.getSource(source))map.removeSource(source);}panel.remove();store.close();window.removeEventListener('keydown',key,true);window.removeEventListener('beforeunload',unload);}
  };
}

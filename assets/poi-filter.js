import { createPoiCategories } from './poi-categories.js?v=20261012-personal-ui3';
import { POI_LAYERS } from './map-style.js?v=20261012-personal-ui3';

export function createPoiFilter({createModal,createMapControls,createMenu,uiLoader,excluded,sourceLayer,onChange}) {
  const state=createPoiCategories(excluded);
  let map=null,disposed=false,token=0,grid=null,controls=null,menu=null,checkboxes=[],timer=null,rows=[],signature="",pruneQueued=false;
  const modal=createModal({title:'Points of interest',ariaLabel:'POI category filter',size:'lg',className:'pbb-poi-modal',workspaceBridge:false,
    closeWhileBusy:true,backdropCloseWhileBusy:true,escapeCloseWhileBusy:true,onBeforeClose:()=>{token++;clearContent();}});
  function clearContent(){menu?.destroy();menu=null;grid?.destroy();grid=null;controls?.destroy();controls=null;modal.setHeaderActions(null);checkboxes.splice(0).forEach(c=>c.destroy());}
  function pruneDetachedCheckboxes(){
    if(pruneQueued)return;pruneQueued=true;
    queueMicrotask(()=>{pruneQueued=false;checkboxes=checkboxes.filter(checkbox=>{if(checkbox.refs.root?.isConnected)return true;checkbox.destroy();return false;});});
  }
  function collect(){return state.count(map?.querySourceFeatures('pbb-poi',{sourceLayer})||[]);}
  function apply(){
    if(!map||!map.getLayer(POI_LAYERS[0]))return;
    rows=collect();const nextSignature=JSON.stringify([rows,state.getMaster()]);if(nextSignature===signature)return;const filter=state.expression();
    POI_LAYERS.forEach(id=>{if(map.getLayer(id))map.setFilter(id,filter);});
    map.setPaintProperty(POI_LAYERS[0],'circle-color',state.colorExpression(rows));signature=nextSignature;onChange?.();return true;
  }
  function applicationFailed(error){
    signature='';token++;clearContent();
    const feedback=document.createElement('p');feedback.setAttribute('role','alert');
    feedback.textContent='POI visibility could not update. Close this dialog and reopen the filter to retry. If the map is unavailable, choose Retry map first. '+(error?.message||'');
    modal.setContent(feedback);modal.setBusy(false);if(!modal.getState().open)modal.open();
  }
  function changed(){try{apply();renderRows();}catch(error){applicationFailed(error);}}
  function renderRows(){
    if(!grid||!modal.getState().open)return;
    // Canonical setRows retains expandedRowIds; restore the focused visibility cell after its rebuild.
    const active=document.activeElement;const focused=active?.closest('[data-poi-toggle]')?.dataset.poiToggle;
    const focusedRow=active?.closest('[data-row-id]')?.dataset.rowId;const expansionButton=active?.tagName==='BUTTON';
    checkboxes.splice(0).forEach(c=>c.destroy());grid.setRows(rows);
    if(focused){for(const host of document.querySelectorAll('[data-poi-toggle]'))if(host.dataset.poiToggle===focused){host.querySelector('input')?.focus({preventScroll:true});break;}}
    else if(focusedRow){for(const row of document.querySelectorAll('[data-row-id]'))if(row.dataset.rowId===focusedRow){(expansionButton?row.querySelector('button'):row)?.focus({preventScroll:true});break;}}
  }
  async function open(){
    if(disposed||modal.getState().open)return;
    const id=++token,context=map;clearContent();modal.setContent(null);modal.setBusy(true,{message:'Reading loaded POI categories…'});modal.open();
    // Initialize only after the canonical modal is shown; closing cancels this context.
    await new Promise(resolve=>requestAnimationFrame(()=>setTimeout(resolve,0)));
    if(disposed||id!==token||context!==map||!modal.getState().open)return;
    try{
      const [createTreeGrid,createCheckbox]=await Promise.all(['ui.tree.grid','ui.checkbox'].map(name=>uiLoader.get(name,{preferBundles:true})));
      if(disposed||id!==token||context!==map||!modal.getState().open)return;
      if(!map?.getLayer(POI_LAYERS[0]))throw Error('Map data is not ready. Close this dialog, wait for the map or choose Retry map, then reopen the filter.');
      apply();rows=collect();const content=document.createElement('div');content.className='pbb-poi-filter';
      const toolbar=document.createElement('div');controls=createMapControls(toolbar,{controls:['all'],ariaLabel:'POI filter actions',orientation:'horizontal',actions:[{id:'all',label:'All ▾',title:'Show or hide all points of interest'}]});
      const trigger=toolbar.querySelector('button');
      menu=createMenu(trigger,[{id:'show-all',label:'Show all'},{id:'hide-all',label:'Hide all'}],{ariaLabel:'All points of interest',placement:'bottom-end',className:'pbb-poi-actions-menu',
        // The canonical menu portals to body; register it with the modal's focus boundary.
        onOpenChange:open=>{if(open){const portal=document.getElementById(trigger.getAttribute('aria-controls'));const owner=trigger.closest('[data-ui-modal-id]');if(portal&&owner)portal.setAttribute('data-ui-modal-portal-owner',owner.dataset.uiModalId);}},
        onSelect:item=>{state.setAll(item.id==='show-all');changed();}});
      modal.setHeaderActions(toolbar);const host=document.createElement('div');host.className='pbb-poi-grid-host';content.appendChild(host);
      grid=createTreeGrid(host,{chrome:false,ariaLabel:'Loaded POI categories',rows,defaultExpanded:false,columns:[{key:'label',label:'Category',tree:true},{key:'count',label:'Locations'},{key:'visibility',label:'Visibility',renderCell:({row})=>{
        const cell=document.createElement('div');cell.dataset.poiToggle=row.id;cell.className='pbb-poi-visibility';
        // The grid delegates row Space/click; embedded native controls own these events.
        cell.addEventListener('keydown',event=>event.stopPropagation());cell.addEventListener('click',event=>event.stopPropagation());
        const swatch=document.createElement('span');swatch.className='pbb-poi-swatch';swatch.style.backgroundColor=row.color;swatch.setAttribute('aria-hidden','true');cell.appendChild(swatch);
        const toggleHost=document.createElement('span');cell.appendChild(toggleHost);const parent=Array.isArray(row.children);
        const checkbox=createCheckbox(toggleHost,{label:'',ariaLabel:`Visibility — ${parent?'class':'subclass'} ${row.label}`,checked:row.checked,indeterminate:!!row.mixed,onChange:({checked})=>{if(parent)state.setClass(row.group,checked);else state.setChild(row.group,row.child,checked);changed();}});checkboxes.push(checkbox);pruneDetachedCheckboxes();return cell;
      }}],emptyText:'No eligible named POIs in loaded tiles. Navigate or zoom, then reopen.'});
      modal.setContent(content);modal.setBusy(false);
    }catch(error){if(disposed||id!==token||context!==map||!modal.getState().open)return;clearContent();const alert=document.createElement('p');alert.setAttribute('role','alert');alert.textContent=error.message||'POI categories could not load. Close and reopen the filter, or retry the map.';modal.setContent(alert);modal.setBusy(false);}
  }
  function data(event){if(event?.type==='style.load')signature='';if(event?.sourceId&&event.sourceId!=='pbb-poi')return;clearTimeout(timer);timer=setTimeout(()=>{if(disposed)return;try{if(apply())renderRows();}catch(error){applicationFailed(error);}},200);}
  return {open,visible:p=>state.visible(p),state,
    setMaster(value){state.setMaster(value);changed();},
    setMap(next){token++;modal.close();clearTimeout(timer);map?.off('sourcedata',data);map?.off('style.load',data);map=next;rows=[];signature="";if(map){map.on('sourcedata',data);map.on('style.load',data);data();}},
    destroy(){disposed=true;token++;clearTimeout(timer);map?.off('sourcedata',data);map?.off('style.load',data);clearContent();modal.destroy();map=null;}
  };
}

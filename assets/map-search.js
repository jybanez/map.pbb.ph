import { poiName } from './poi-name.js?v=20261013-scale1';
import { distance } from './map-context.js?v=20261013-scale1';

export function orderSearchResults(results,origin){
  return [...results].sort((a,b)=>a.name.localeCompare(b.name)
    || (origin?distance(origin,a.point)-distance(origin,b.point):0)
    || a.point.lat-b.point.lat || a.point.lng-b.point.lng).slice(0,20);
}
export function parseCoordinates(value) {
  const text=value.trim();
  // A comma or an entirely numeric expression signals coordinate intent;
  // mixed name text such as 7-Eleven and 3J Store remains a POI query.
  if (!text.includes(',') && !/^[+\-.\d\s]+$/.test(text)) return null;
  const match=text.match(/^([+-]?(?:\d+(?:\.\d*)?|\.\d+))\s*,\s*([+-]?(?:\d+(?:\.\d*)?|\.\d+))$/);
  if (!match) return { error:'Coordinates — enter two complete decimal numbers in latitude, longitude order, separated by a comma.' };
  const lat=Number(match[1]),lng=Number(match[2]);
  if(!Number.isFinite(lat)||!Number.isFinite(lng)||lat < -90||lat > 90||lng < -180||lng > 180)
    return {error:'Coordinates — latitude must be from −90 to 90 and longitude from −180 to 180. Keep latitude first.'};
  return {lat,lng};
}
export function createMapSearch({createSearchField,createMenu,createIcon,createEventBag,createMapMarker,markExploration,poiAllowed=()=>true,onDismiss,onDestinationActivate,onDestinationUnavailable,onSearchFocus}) {
  let map=null,menu=null,disposed=false,generation=0;
  let userLocation=null,displayedResults=null,allResults=null,coordinateResults=false;
  const distanceLabel=point=>{
    if(!userLocation)return 'Distance unavailable';
    const metres=distance(userLocation,point);
    return metres<1000?`${Math.round(metres)} m`:`${(metres/1000).toFixed(1)} km`;
  };
  const resultLabel=result=>`${result.name} — ${distanceLabel(result.point)}`;
  function setUserLocation(next){
    if(disposed||!next||!Number.isFinite(next.latitude)||!Number.isFinite(next.longitude)||Math.abs(next.latitude)>90||Math.abs(next.longitude)>180)return;
    userLocation={lat:next.latitude,lng:next.longitude};
    if(!displayedResults||!menu?.getState().open)return;
    const reordered=orderSearchResults(allResults,userLocation);
    const root=document.getElementById(anchor.getAttribute('aria-controls'));
    const previousItems=menu.getState().items;
    const focusedRow=root?.contains(document.activeElement)?document.activeElement.closest('[data-menu-index]'):null;
    const focusedId=focusedRow?previousItems[Number(focusedRow.dataset.menuIndex)]?.id:null;
    if(reordered.some((r,i)=>r.id!==displayedResults[i]?.id)||reordered.length!==displayedResults.length){
      displayedResults=reordered;
      const items=resultItems();
      menu.update(items);
      if(focusedId){
        const index=items.findIndex(item=>item.id===focusedId);
        if(index<0){closeResults();field.input.focus();status.textContent='The focused result is outside the top 20 matches after your location update. Search again to navigate current results.';return;}
        // Verified gap: update resets navigation; no public focus-by-ID API.
        // Restore the same destination node focus and synchronize canonical active
        // navigation through its existing hover handler, without selecting it.
        const row=root?.querySelector(`[data-menu-index="${index}"]`);
        row?.focus({preventScroll:true});row?.dispatchEvent(new MouseEvent('mouseenter'));
      }
      return;
    }
    // Canonical update rebuilds focused rows and resets activeIndex. Its current
    // API has no label-only update: retain the canonical items, nodes and handlers.
    const items=menu.getState().items;
    items.forEach((item,index)=>{
      if(item.disabled)return;
      const result=displayedResults.find(r=>r.id===item.id);if(!result)return;
      item.label=resultLabel(result);
      const label=root?.querySelector(`[data-menu-index="${index}"] .ui-menu-item-label`);
      if(label)label.textContent=item.label;
    });
  }
  function resultItems(){return [{id:'coverage',label:coordinateResults?'Approximate straight-line distance.':'Loaded tiles only — coverage may be incomplete. Approximate straight-line distances.',disabled:true},...displayedResults.map(r=>({id:r.id,label:resultLabel(r)}))];}
  let destinationMarker=null;
  let clearDestinationEvents=null, destinationReady=false;
  function availability(ready) {
    destinationReady=ready;
    const element=destinationMarker?.getElement();
    if(element){element.tabIndex=ready?0:-1;element.setAttribute('aria-disabled',String(!ready));element.setAttribute('aria-hidden',String(!ready));}
    if(!ready)onDestinationUnavailable?.();
  }
  function bindDestination(element) {
    element.setAttribute('role','button');element.setAttribute('aria-haspopup','menu');
    const bag=createEventBag();let down=null;
    const activate=()=>{
      if(!destinationReady||disposed||!map||!destinationMarker)return;
      const point=destinationMarker.getLngLat(),r=element.getBoundingClientRect();
      onDestinationActivate?.({point:{lat:point.lat,lng:point.lng},x:r.left+r.width/2,y:r.bottom,trigger:element});
    };
    bag.on(element,'pointerdown',e=>{if(e.button===0){e.stopPropagation();down={x:e.clientX,y:e.clientY};}});
    bag.on(element,'mousedown',e=>{if(e.button===0)e.stopPropagation();});
    bag.on(element,'touchstart',e=>e.stopPropagation(),{passive:true});
    bag.on(element,'pointercancel',()=>{down=null;});
    bag.on(element,'click',e=>{e.preventDefault();e.stopPropagation();const stationary=!down||Math.hypot(e.clientX-down.x,e.clientY-down.y)<=5;down=null;if(stationary)activate();});
    bag.on(element,'dblclick',e=>{e.preventDefault();e.stopPropagation();});
    bag.on(element,'keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();if(!e.repeat)activate();}});
    clearDestinationEvents=()=>bag.clear();
  }
  function removeDestination(){availability(false);clearDestinationEvents?.();clearDestinationEvents=null;destinationMarker?.getElement().destroy?.();destinationMarker?.remove();destinationMarker=null;}
  // Terrain can change its projection after moveend as DEM tiles settle.
  // Refresh through the public Marker API on rendered frames, without requesting frames.
  function syncDestination(){if(destinationMarker)destinationMarker.setLngLat(destinationMarker.getLngLat());}
  let flight=0,cleanupFlight=null;
  function cancelFlight(){
    availability(false);
    flight++;cleanupFlight?.();cleanupFlight=null;
    destinationMarker?.getElement().cancelDrop?.();
    if(destinationMarker)destinationMarker.getElement().style.visibility='hidden';
  }
  function flyToDestination(result){
    cancelFlight();const token=flight,currentMap=map,target=result.point;
    // Stop the previous camera transition before registering this flight's listeners.
    currentMap.stop();
    const label=`Search destination: ${result.label}`;
    if(!destinationMarker){destinationMarker=new window.maplibregl.Marker({element:createMapMarker({id:'search-destination',shape:'pin',tone:'warning',size:'lg',icon:'actions.search',label}),anchor:'bottom'}).setLngLat([target.lng,target.lat]).addTo(currentMap);bindDestination(destinationMarker.getElement());}
    else destinationMarker.setLngLat([target.lng,target.lat]);
    const element=destinationMarker.getElement();element.style.visibility='hidden';
    availability(false);element.setAttribute('aria-label',`${label}. Open location actions`);element.title=`${label}. Open location actions`;
    const begun=performance.now();
    const interrupt=()=>cancelFlight();
    const start=e=>{if(e.searchFlight!==token)interrupt();};
    const arrival=e=>{
      if(e.searchFlight!==token||token!==flight||disposed||map!==currentMap||currentMap.isMoving())return;
      if(performance.now()-begun<1100){interrupt();return;}
      currentMap.off('moveend',arrival);
      element.style.visibility='visible';
      element.animateDrop({essential:true,duration:650,distance:100,bounce:8}).then(()=>{
        if(token!==flight||disposed||map!==currentMap)return;
        availability(true);
        cleanupFlight?.();cleanupFlight=null;
      });
    };
    const input=e=>{if(!e.target.closest?.('#map-search'))interrupt();};
    const host=currentMap.getContainer();
    currentMap.on('movestart',start);currentMap.on('moveend',arrival);
    for(const name of ['pointerdown','wheel','keydown'])host.addEventListener(name,input,true);
    cleanupFlight=()=>{
      currentMap.off('movestart',start);currentMap.off('moveend',arrival);
      for(const name of ['pointerdown','wheel','keydown'])host.removeEventListener(name,input,true);
    };
    currentMap.flyTo({center:[target.lng,target.lat],zoom:Math.max(currentMap.getZoom(),15),pitch:currentMap.getPitch(),bearing:currentMap.getBearing(),duration:1200,essential:true},{searchFlight:token});
  }
  const events=createEventBag(),container=document.createElement('div');container.id='map-search';
  const status=document.createElement('p');status.id='map-search-status';status.setAttribute('role','status');
  const anchor=document.createElement('span');anchor.className='pbb-context-anchor';anchor.setAttribute('aria-hidden','true');document.body.appendChild(anchor);
  let composing=false,pasteTimer=null,inputKind=null;
  const field=createSearchField({placeholder:'POI or latitude, longitude',clearLabel:'Clear map search',onChange:change});field.bind(events);
  field.clearButton.classList.add('ui-button','ui-button-icon','ui-button-borderless');
  field.clearButton.replaceChildren(createIcon('actions.close'));
  field.clearButton.title='Clear map search';
  const searchButton=document.createElement('button');searchButton.type='button';
  searchButton.className='ui-button ui-button-icon ui-button-borderless pbb-search-submit';
  searchButton.setAttribute('aria-label','Show search results');searchButton.title='Show search results';
  searchButton.append(createIcon('actions.search'));searchButton.hidden=true;
  field.wrap.prepend(field.clearButton);field.wrap.append(searchButton);
  function escape(e){if(e.key==='Escape'&&window.matchMedia('(max-width:720px)').matches){e.preventDefault();e.stopImmediatePropagation();onDismiss?.();}}
  container.addEventListener('keydown',escape,true);
  events.on(searchButton,'click',()=>search(field.input.value));
  events.on(field.input,'focus',()=>onSearchFocus?.());
  events.on(field.input,'compositionstart',()=>{composing=true;invalidateResults();if(field.input.value.trim())feedback('Finish composing your search to see results.');});
  events.on(field.input,'compositionend',()=>{composing=false;change(field.input.value);});
  events.on(field.input,'input',e=>{inputKind=e.inputType;},{capture:true});
  events.on(field.input,'keydown',e=>{
    // A results menu must not interpret textbox Space/arrow/IME keys as actions.
    e.stopPropagation();
    if(e.key==='ArrowDown'&&!e.isComposing&&!composing){e.preventDefault();if(menu?.getState().open)menu.focusFirst();else search(field.input.value);return;}
    if(e.key!=='Enter'||e.isComposing||composing||e.keyCode===229)return;
    e.preventDefault();e.stopPropagation();search(field.input.value);
  });
  // The input event follows the browser's paste insertion; query its full value
  // once, after canonical change handling, and discard superseded invocations.
  events.on(field.input,'input',e=>{
    if(e.inputType!=='insertFromPaste'||e.isComposing||composing)return;
    const id=generation,value=field.input.value,currentMap=map;
    pasteTimer=setTimeout(()=>{pasteTimer=null;if(!disposed&&!composing&&id===generation&&map===currentMap&&field.input.value===value)search(value);},0);
  });
  field.input.setAttribute('aria-label','Search map');field.input.setAttribute('aria-describedby',status.id);field.input.autocomplete='off';
  container.append(field.wrap,status);
  anchor.focus=()=>{if(!disposed&&!container.hidden)field.input.focus();};
  function menuState(open){field.input.setAttribute('aria-expanded',String(open));if(open)field.input.setAttribute('aria-controls',anchor.getAttribute('aria-controls'));else field.input.removeAttribute('aria-controls');}
  function openSuggestions(keepFocus){menu.open();if(!keepFocus)menu.focusFirst();}
  function updateResults(items,onSelect=null){
    const r=field.input.getBoundingClientRect();anchor.style.left=`${r.left}px`;anchor.style.top=`${r.bottom+6}px`;
    const options={ariaLabel:'Map search results',offset:0,className:'pbb-search-results',focusOnOpen:false,onOpenChange:menuState,onSelect};
    if(menu)menu.update(items,options);else menu=createMenu(anchor,items,options);
  }
  function feedback(message){
    status.textContent=message;
    if(!field.input.value.trim())return;
    updateResults([{id:'feedback',label:message,disabled:true}]);menu.open();
  }
  function invalidateResults(){clearTimeout(pasteTimer);pasteTimer=null;generation++;displayedResults=null;allResults=null;}
  function closeResults(){invalidateResults();menu?.destroy();menu=null;}
  function change(value,live=true) {
    const pasted=inputKind==='insertFromPaste';inputKind=null;
    searchButton.hidden=!value;
    invalidateResults();
    field.input.removeAttribute('aria-invalid');field.input.classList.remove('is-invalid');
    const query=value.trim();
    if(!query){
      menu?.destroy();menu=null;
      // Canonical clear and input-change share this path. Invalidate completion
      // before destroying the pin; clearing does not change the camera.
      if(destinationMarker||cleanupFlight){cancelFlight();removeDestination();}
      status.textContent='Coordinates or POIs in loaded tiles only.';return;
    }
    status.textContent='Choose a suggestion, or press Enter to navigate results.';
    if(composing||pasted){feedback(composing?'Finish composing your search to see results.':'Reading pasted search…');return;}
    if(live&&!composing&&!pasted)search(value,{keepFocus:true});
  }
  function search(value,{keepFocus=false}={}) {
    if(disposed||composing)return;
    change(value,false);const id=generation,query=value.trim();if(!query)return;
    if(!map){feedback('Search unavailable while map loads. Try again when ready.');return;}
    const point=parseCoordinates(query);let results=[];
    if(point?.error){field.input.setAttribute('aria-invalid','true');field.input.classList.add('is-invalid');feedback(point.error);return;}
    if(point)results=[{name:'Coordinate destination',label:`Coordinates: ${point.lat}, ${point.lng}`,point}];
    else {
      status.textContent='Reading loaded local POIs…';
      try {
        const found=new Map();
        for(const f of map.querySourceFeatures('pbb-poi',{sourceLayer:'poi'})){
          if(f.geometry?.type!=='Point'||!poiAllowed(f.properties))continue;const name=poiName(f.properties);if(!name||!String(name).toLocaleLowerCase().includes(query.toLocaleLowerCase()))continue;
          const [lng,lat]=f.geometry.coordinates;if(!Number.isFinite(lat)||!Number.isFinite(lng))continue;
          const key=`${name}|${lng.toFixed(5)}|${lat.toFixed(5)}`;if(!found.has(key))found.set(key,{name:String(name),label:`${name} — ${lat.toFixed(6)}, ${lng.toFixed(6)}`,point:{lat,lng}});
        }
        results=[...found.values()];
      } catch {feedback('Loaded POI data is unavailable. Wait for tiles to load or retry the map, then search again.');return;}
    }
    status.textContent=point?'Latitude, longitude. Select to fly.':results.length?'Up to 20 matches in loaded tiles only. Coverage may be incomplete.':'No matching named POIs in loaded tiles. Navigate or zoom, then search again; this is not a barangay-wide index.';
    if(!results.length){feedback(status.textContent);return;}
    allResults=results.map(r=>({...r,id:JSON.stringify([r.name,r.point.lat,r.point.lng])}));
    coordinateResults=Boolean(point);
    displayedResults=orderSearchResults(allResults,userLocation);
    status.textContent+=' Distances are approximate straight-line distances from your latest location fix.';
    const items=resultItems();
    updateResults(items,item=>{
      if(disposed||id!==generation||!map)return;const result=displayedResults?.find(r=>r.id===item.id);if(!result)return;markExploration();
      flyToDestination(result);
      onDismiss?.();
    });
    openSuggestions(keepFocus);
  }
  return {container,setUserLocation,focus(){field.input.focus();},closeResults,setMap(next){closeResults();if(map!==next){map?.off('render',syncDestination);cancelFlight();removeDestination();next?.on('render',syncDestination);}map=next;if(!container.hidden)change(field.input.value,false);},destroy(){disposed=true;closeResults();map?.off('render',syncDestination);cancelFlight();removeDestination();events.clear();container.removeEventListener('keydown',escape,true);anchor.remove();container.remove();}};
}

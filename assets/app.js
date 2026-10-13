import { installMapRuler } from './map-ruler.js?v=20261014-pin3';
import { installScalePlacement } from './map-scale-placement.js?v=20261014-pin3';
import { createPersonalLayers } from './personal-layer-ui.js?v=20261014-pin3';
import { createAccuracyRipple } from './accuracy-ripple.js?v=20261014-pin3';
import { createPoiFilter } from './poi-filter.js?v=20261014-pin3';
import { createDirectionWelcome } from './direction-welcome.js?v=20261014-pin3';
import { uiLoader } from '../vendor/helpers/js/ui/ui.loader.js?v=0.21.317';
import { createMapResourceCache } from './map-resource-cache.js?v=20261014-pin3';
import { registerMapShell } from './map-shell.js?v=20261014-pin3';
import { config } from './config.js?v=20261014-pin3';
import { buildStyle, POI_LAYERS } from './map-style.js?v=20261014-pin3';
import { createLocationController } from './location.js?v=20261014-pin3';
import { installMapContext } from './map-context.js?v=20261014-pin3';
import { createMapSearch } from './map-search.js?v=20261014-pin3';
import { createDirectionDiagnostics } from './direction-diagnostics.js?v=20261014-pin3';
import { createDirectionOptions } from './direction-options.js?v=20261014-pin3';

export async function mountApp() {
  // Canonical loader selects the covered ui bundle and rejects failures without
  // modular fallback. Explicit get options below keep this policy for lazy flows.
  uiLoader.setPreferBundles(true);
  const [createNavbar, createMapControls, markers, createToastStack, createEmptyState, createBusyOverlay, icons, createMenu, createModal, createSearchField, createEventBag,createActionModal,createFormModal,uiAlert,createSkeleton,createMapScale,createMapRuler] = await Promise.all(
    ['ui.navbar', 'ui.map.controls', 'ui.map.markers', 'ui.toast', 'ui.empty.state', 'ui.busy.overlay', 'ui.icons', 'ui.menu', 'ui.modal', 'ui.search', 'ui.events.createEventBag','ui.action.modal','ui.form.modal','ui.dialog.alert','ui.skeleton','ui.map.scale','ui.map.ruler']
      .map(name => uiLoader.get(name, { preferBundles: true })));
  const { createIcon } = icons;
  const { createMapMarker } = markers;
  // An optional renderer must never prevent the canonical location fallback.
  const createPerson = await uiLoader.get('ui.map.location.person', { preferBundles: true }).catch(() => null);
  let person = null; let scalePlacement = null;
  let headingDegrees=null;
  let approximateActive=false;let welcome=null;
  const header = document.getElementById('navbar'), region = document.getElementById('map-region');
  const container = document.getElementById('map'), feedbackContainer = document.getElementById('map-feedback');
  const controlsContainer = document.createElement('div');
  controlsContainer.className = 'pbb-header-controls';
  const signalHost = document.createElement('span');
  signalHost.className = 'pbb-map-signal';
  const mapControlsHost = document.createElement('div');
  controlsContainer.append(signalHost, mapControlsHost);
  let signalIndicator = null;
  // Optional complete component: its absence or observer errors cannot interrupt mapping.
  void uiLoader.get('ui.signal.strength', { preferBundles: true }).then(create => {
    if (!disposed) signalIndicator = create(signalHost, { label: 'MapServer connection', showText: false, level: 0, tone: 'neutral', title: 'MapServer connection unknown', ariaLabel: 'MapServer connection unknown' });
  }).catch(() => {});
  const locateContainer = document.createElement('div');
  locateContainer.id = 'locate-control';
  region.appendChild(locateContainer);
  const zoomContainer = document.createElement('div');
  zoomContainer.id = 'zoom-control';
  region.appendChild(zoomContainer);
  let map = null, controls = null, zoomControls = null, marker = null, position = null, recenterPending = false;
  let contextActions = null; let personal = null; let ruler = null;
  const inputBlocked=()=>personal?.isEditing()||ruler?.isOwningInput();
  let disposed = false, ready = false, poiVisible = true, generation = 0, abort = null, startupTimer = null;
  let locationState = { status: 'idle' }, locationToast = null;
  const warned = new Set();
  const optionalNotices = [];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const toast = createToastStack({ className: 'pbb-location-toast', position: 'bottom-left', max: 3, workspaceBridge: false });
  let missingNotice = null, recoveryTimer = null, recovering = false;
  const resources = createMapResourceCache({ server: config.mapServerUrl, dataset: config.dataset, sprites: config.spriteUrls, onState: state => {
    if (disposed) return;
    const text = state.connected === null ? 'MapServer connection unknown' : state.connected ? 'MapServer reachable' : 'MapServer unavailable; saved map detail remains usable';
    try { signalIndicator?.update({ level: state.connected === true ? 4 : 0, tone: state.connected === null ? 'neutral' : state.connected ? 'success' : 'warn', title: text, ariaLabel: text }); } catch {}
    if (state.missing && !missingNotice) missingNotice = toast.show('Some map detail is unavailable. Reconnect to load more.', { type: 'warn', persistent: true, dismissible: true });
    if (!state.missing) { missingNotice?.close(); missingNotice = null; }
    if (state.missing && !recoveryTimer) recoveryTimer = setTimeout(recoverResources, 10000);
  } });
  void resources.store.reconcile();
  async function recoverResources() {
    clearTimeout(recoveryTimer); recoveryTimer = null;
    if (disposed || recovering || document.hidden || personal?.isEditing()) return;
    recovering = true;
    try { if (await resources.recover() && !disposed) void initialize(); }
    finally { recovering = false; }
  }
  const onConnectionHint = () => { void recoverResources(); };
  const onRecoveryVisible = () => { if (!document.hidden) void recoverResources(); };
  window.addEventListener('online', onConnectionHint);
  document.addEventListener('visibilitychange', onRecoveryVisible);
  const shell = registerMapShell();
  const directionNotice=message=>{if(!disposed){syncDirectionUI();welcome?.consider();if(message)toast.show(message,{type:'warn',duration:5000,dismissible:true});}};
  let directionModuleState='loading';
  let direction={request(explicit){if(explicit)directionNotice('Direction is unavailable or still loading. Location remains usable; choose Locate to retry direction.');return false;},setPosition(){},invalidatePosition(){},destroy(){}};
  // Optional local sensor/model code never gates map or live location startup.
  void import('./heading.js?v=20261014-pin3').then(({createHeadingController})=>{
    if(disposed)return;
    directionModuleState='ready';
    direction=createHeadingController({onHeading:(value,meta)=>{headingDegrees=value;approximateActive=meta?.approximate===true;person?.updateHeading(value);syncDirectionUI();},onState:directionNotice});
    if(position)direction.setPosition(position);
    void direction.request(false).then(()=>welcome?.consider());
  }).catch(()=>{directionModuleState='failed';});
  const diagnostics=createDirectionDiagnostics({createActionModal,getSnapshot:()=>{
    const snapshot=direction.getDiagnostics?.()||{issues:[directionModuleState==='loading'?'Direction module is still loading. Wait, then refresh diagnostics.':'Direction module could not load. Reload the app or check its local correction assets.'],fields:{'Direction module':directionModuleState}};
    const renderer=person?.getState().status||'not created';
    if(renderer!=='rendered')snapshot.issues.push('The 3D person renderer is not ready. Wait for the map to load or choose Locate to retry an errored model.');
    snapshot.fields['Person renderer']=renderer;
    snapshot.fields['Map camera']='manual bearing; no compass-follow mode';
    return snapshot;
  }});
  welcome=createDirectionWelcome({createActionModal,needsActivation:()=>direction.needsActivation?.()===true&&direction.getDiagnostics?.().fields.Permission!=='denied',enable:()=>{void direction.request(true);location.request(false);}});
  const welcomeVisible=()=>{if(document.hidden)welcome?.close();else welcome?.consider();};document.addEventListener('visibilitychange',welcomeVisible);
  const directionOptions=createDirectionOptions({createFormModal,uiAlert,getState:()=>direction.getOptionsState?.()||{selected:false,eligible:false},apply:value=>{direction.setApproximate(value);syncDirectionUI();}});
  let directionControlKey='';
  function syncDirectionUI(){
    if(disposed)return;
    const state=direction.getOptionsState?.()||{};
    const key=JSON.stringify([state.missing,state.selected,direction.needsActivation?.()]);
    if(key!==directionControlKey){directionControlKey=key;updateSearchAction();}
    // Complete person API has no label update; scope only this app's label node.
    if(approximateActive)region.querySelector('.ui-map-location-person-label')?.setAttribute('aria-label','Your location; approximate geographic direction, altitude unavailable');
  }
  const busy = createBusyOverlay(region, { text: 'Loading mapâ€¦', fullscreen: false,
    blockInteraction: false, backdrop: false, lockScroll: false });
  const feedback = createEmptyState(feedbackContainer, {}, { ariaLabel: 'Map status', onActionClick: () => { void initialize(); } });

  function showError(title, description) {
    if (disposed) return;
    busy.hide();
    feedback.update({ title, description, actions: [{ id: 'retry', label: 'Retry map' }] });
    feedbackContainer.hidden = false;
  }

  const poiFilter = createPoiFilter({createModal,createMapControls,createMenu,uiLoader,excluded:config.poi.excludedClasses,sourceLayer:config.poi.sourceLayer,onChange:()=>search.closeResults()});
  const search = createMapSearch({createSearchField,createMenu,createIcon,createEventBag,createMapMarker,markExploration,poiAllowed:p=>poiFilter.visible(p),onDismiss:()=>dismissSearch(),
    onDestinationActivate:({point,x,y,trigger})=>contextActions?.openAt(point,x,y,trigger),
    onDestinationUnavailable:()=>contextActions?.close(),onSearchFocus:()=>contextActions?.close()});
  personal=createPersonalLayers({region,uiLoader,createModal,createActionModal,createFormModal,createMapControls,createBusyOverlay,createSkeleton,uiAlert,toast,onChange:()=>syncControls(),onEditingChange:editing=>{if(editing)markExploration();else if(missingNotice)queueMicrotask(()=>{if(map&&!disposed&&!personal?.isEditing())void recoverResources();});document.body.classList.toggle('pbb-personal-editing',editing);contextActions?.close();search.closeResults();search.container.inert=!!inputBlocked();updateSearchAction();}});
  const personalHost=document.createElement('div');personalHost.className='pbb-personal-control';region.append(personalHost);
  const personalControl=createMapControls(personalHost,{controls:['personal-layers','ruler'],orientation:'vertical',actions:[{id:'personal-layers',label:'Manage personal layers',title:'Manage personal layers',icon:'map.layer',onActivate:({button})=>{ruler?.cancel();personal.setLauncher(button);void personal.open();}},{id:'ruler',label:'Measure straight-line distance',title:'Measure straight-line distance',icon:'map.ruler',pressed:false,disabled:true,onActivate:()=>ruler?.toggle()}]});
  ruler=installMapRuler({region,createMapRuler,personal,toast,onStateChange:state=>{personalControl.setActionState('ruler',{pressed:state.active,disabled:state.pending||state.destroyed});contextActions?.close();search.closeResults();search.container.inert=!!inputBlocked();updateSearchAction();}});
  function navbarOptions() {
    const brandIcon = document.createElement('img');
    brandIcon.src = new URL('./pbb-map-icon-navbar.png', import.meta.url).href;
    brandIcon.alt = '';
    brandIcon.width = 32;
    brandIcon.height = 32;
    return { brandText: 'PBB Map', brandMedia: brandIcon,
      mobileLayout: 'scroll', mobileCollapse: false, contentEnd: controlsContainer,
    };
  }
  const navbar = createNavbar(header, {}, navbarOptions());
  const searchMobile = window.matchMedia('(max-width: 720px)');
  let searchExpanded=false;
  function searchAction() {return {id:'search',label:searchExpanded?'Close map search':'Open map search',icon:searchExpanded?'actions.close':'actions.search',visible:searchMobile.matches,disabled:!!inputBlocked(),expanded:searchExpanded,ariaControls:'map-search',onActivate:()=>searchExpanded?dismissSearch():revealSearch()};}
  function enableAction(){return{id:'enable-direction',label:'Enable direction',icon:'actions.add',visible:direction.needsActivation?.()===true,onActivate:()=>{void direction.request(true);}};}
  function directionAction(){return{id:'direction-status',label:'Direction diagnostics',icon:'status.info',onActivate:()=>{ruler?.cancel();diagnostics.open();}};}
  function optionsAction(){const state=direction.getOptionsState?.()||{};return{id:'direction-options',label:'Direction options',icon:'actions.settings',visible:state.missing||state.selected,onActivate:()=>{ruler?.cancel();directionOptions.open();}};}
  function mapActions(){return [searchAction(),{id:'poi-filter',label:'Filter points of interest',icon:'data.filter',disabled:!!inputBlocked(),onActivate:()=>poiFilter.open()},enableAction(),...(config.showDirectionTools ? [directionAction(),optionsAction()] : [])];}
  function updateSearchAction(){zoomControls?.update({actions:mapActions()});}
  function dismissSearch(returnFocus=true) {
    if(!searchMobile.matches)return;
    searchExpanded=false;search.closeResults();search.container.hidden=true;
    updateSearchAction();
    if(returnFocus)zoomContainer.querySelector('[aria-controls="map-search"]')?.focus();
  }
  function revealSearch() {
    contextActions?.close();
    searchExpanded=true;search.container.hidden=false;
    updateSearchAction();search.focus();
  }
  function placeSearch() {
    search.closeResults();
    (searchMobile.matches ? region : header).appendChild(search.container);
    searchExpanded=false;search.container.hidden=searchMobile.matches;
    updateSearchAction();
  }
  searchMobile.addEventListener('change', placeSearch);
  placeSearch();
  const locateControl = createMapControls(locateContainer, { controls: ['locate'], ariaLabel: 'Your location',
    onLocate: () => { void direction.request(true); if (person?.getState().status === 'error') person.retry(); location.request(true); } });
  function syncLocate() {
    const button = locateContainer.querySelector('button');
    const status = locationState.status;
    const tone = status === 'requesting' ? 'requesting' : status === 'success' ? 'success' :
      status === 'error' || status === 'unavailable' ? 'error' : 'idle';
    locateContainer.dataset.state = tone;
    button.disabled = status === 'requesting';
    button.setAttribute('aria-busy', String(status === 'requesting'));
    const label = `Locate â€” ${tone === 'idle' ? 'show your location' : locationState.message}`;
    button.setAttribute('aria-label', label);
    button.title = label;
  }
  syncLocate();
  function syncControls() {
    if (!map || disposed) return;
    const zoomOptions = { map, controls: ['search','zoom','poi-filter','enable-direction',...(config.showDirectionTools ? ['direction-status','direction-options'] : [])], orientation: 'vertical', ariaLabel: 'Map zoom',
      actions:mapActions(),
      onZoomIn: () => { markExploration(); map.zoomIn({ duration: reducedMotion ? 0 : 300 }); },
      onZoomOut: () => { markExploration(); map.zoomOut({ duration: reducedMotion ? 0 : 300 }); } };
    if (zoomControls) zoomControls.update(zoomOptions); else zoomControls = createMapControls(zoomContainer, zoomOptions);
    const options = { map, orientation: 'horizontal', controls: ['compass', 'pitch', 'layers'],
      pitchPresets: [{ value: 0, label: '2D' }, { value: 60, label: '3D' }],
      layers: [{ id: 'pbb-poi-group', label: 'Points of interest', checked: poiVisible },...(personal?.getLayers()||[])],
      onResetNorth: () => { markExploration(); map.easeTo({ bearing: 0, duration: reducedMotion ? 0 : 300 }); },
      onPitchChange: ({ pitch }) => { markExploration(); map.easeTo({ pitch, duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 600 }); },
      onLayerToggle: ({ layerId, checked }) => {
        if(layerId!=='pbb-poi-group'){void personal?.setVisibility(layerId,checked);return;}
        poiVisible = checked;poiFilter.setMaster(checked);
        if (!ready) return;
        POI_LAYERS.forEach(id => { if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', checked ? 'visible' : 'none'); });
      },
    };
    if (controls) controls.update(options); else controls = createMapControls(mapControlsHost, options);
    // Verified canonical gap: normalizeLayers has no disabled field. Preserve its
    // native inputs and apply only this application's personal-layer lock.
    for(const layer of personal?.getLayers()||[])for(const input of mapControlsHost.querySelectorAll('input[data-layer-id]'))if(input.dataset.layerId===layer.id)input.disabled=layer.disabled;

  }

  function markExploration() {
    location.markNavigation();
    recenterPending = false;
  }

  const accuracyRipple=createAccuracyRipple({staleMs:config.location.maximumAge});

  function displayPosition() {
    if (!position || !map || !ready || disposed) return;
    const coords = [position.longitude, position.latitude];
    if (!marker) marker = new window.maplibregl.Marker({ element: createMapMarker({ id: 'current-location',
      shape: 'dot', tone: 'info', label: 'Your reported location', size: 'md' }), anchor: 'center' }).setLngLat(coords).addTo(map);
    else marker.setLngLat(coords);
    // MapLibre initializes Marker aria-label; restore the canonical user-facing label.
    marker.getElement().setAttribute('aria-label', 'Your reported location');
    if (createPerson) {
      if (!person) {
        const currentMap = map;
        try {
          person = createPerson({ map, maplibre: window.maplibregl, lngLat: coords,
            id: 'current-location-person', label: 'Your reported location', sizePx: 34,headingDegrees,
            scaleMode: 'perspective', modelHeightMeters: 12, minSizePx: 8, maxSizePx: 64,
            onStateChange: state => {
              if (disposed || map !== currentMap || !marker) return;
              marker.getElement().style.visibility = state.status === 'rendered' ? 'hidden' : 'visible';
              marker.getElement().setAttribute('aria-hidden', String(state.status === 'rendered'));
              syncDirectionUI();
            } });
        } catch { marker.getElement().style.visibility = 'visible'; }
      } else person.updateLngLat(coords);
    }
    accuracyRipple.setPosition(position);
    if (recenterPending) {
      recenterPending = false;
      map.easeTo({ center: coords, zoom: config.locationZoom, duration: reducedMotion ? 0 : 700 });
    }
  }

  const location = createLocationController({ geolocation: navigator.geolocation, secure: window.isSecureContext,
    policy: config.location,
    onState: state => {
      if (disposed) return;
      locationState = state;
      accuracyRipple.setAvailable(state.status==='success');
      if(state.status==='error'||state.status==='unavailable')direction.invalidatePosition();
      syncLocate();
      const options = { busy: state.status === 'requesting', persistent: state.status !== 'success', duration: 3200,
        type: state.status === 'error' || state.status === 'unavailable' ? 'warn' : 'info', dismissible: true };
      // A dismissed toast needs a fresh handle on the next deliberate request.
      const exists = locationToast && toast.getState().items.some(item => item.id === locationToast.id);
      if (exists) locationToast.update(state.message, options);
      else locationToast = toast.show(state.message, options);
    },
    onPosition: (next, { recenter }) => { position = {...next,timestamp:Number.isFinite(next.timestamp)?next.timestamp:Date.now()}; direction.setPosition(next); search.setUserLocation(next); recenterPending = recenter; displayPosition();syncDirectionUI(); },
  });

  function removeMap() {
    ruler?.setMap(null);
    scalePlacement?.destroy(); scalePlacement=null;
    diagnostics.close();
    welcome?.close();directionOptions.close();directionControlKey='';
    person?.destroy(); person = null;
    accuracyRipple.setMap(null);poiFilter.setMap(null);search.setMap(null);
    personal?.setMap(null);
    contextActions?.destroy(); contextActions = null;
    ready = false;
    clearTimeout(startupTimer);
    abort?.abort();
    controls?.destroy(); controls = null;
    zoomControls?.destroy(); zoomControls = null;
    marker?.remove(); marker = null;
    if(map?.getStyle())map.remove(); map = null;
  }

  async function initialize() {
    if (disposed) return;
    const id = ++generation;
    const camera = map && { center: map.getCenter().toArray(), zoom: map.getZoom(), pitch: map.getPitch(), bearing: map.getBearing() };
    removeMap();
    warned.clear();
    optionalNotices.splice(0).forEach(notice => notice?.close());
    feedbackContainer.hidden = true;
    busy.show({ text: 'Loading mapâ€¦' });
    abort = new AbortController();
    const controller = abort;
    startupTimer = setTimeout(() => {
      if (!disposed && id === generation && !ready) {
        // Slow or missing requested detail must not remove an otherwise usable map/camera.
        if (map?.style) { activateMap(id); return; }
        // A deadline ends this initialization, including MapLibre's tile work.
        // Late events must never revive it or leave a loaded map behind stale feedback.
        generation++;
        removeMap();
        showError('Map is taking too long', 'Check that this node can reach its MapServer, then choose Retry map.');
      }
    }, 20000);
    try {
      if (!window.maplibregl) throw new Error('The local map renderer did not load. Reload or verify its installed files.');
      const probe = document.createElement('canvas');
      const gl = probe.getContext('webgl2') || probe.getContext('webgl');
      if (!gl) throw new Error('WebGL is unavailable. Enable hardware acceleration or use a browser/device with WebGL support.');
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      const response = await fetch(config.styleUrl, { signal: controller.signal, credentials: 'same-origin' });
      if (!response.ok) throw new Error('The local map style is missing. Ask the node operator to verify the installation.');
      resources.install(window.maplibregl);
      resources.beginView();
      let style = buildStyle(await response.json(), config, poiVisible);
      const view = camera || config, z = Math.min(14, Math.floor(view.zoom)), scale = 2 ** z, lat = view.center[1] * Math.PI / 180;
      const x = Math.floor((view.center[0] + 180) / 360 * scale), y = Math.floor((1 - Math.asinh(Math.tan(lat)) / Math.PI) / 2 * scale);
      style = await resources.prepare(style, `${config.mapServerUrl}/tiles/vector/${z}/${x}/${y}.pbf`, controller.signal);
      if (disposed || id !== generation || controller.signal.aborted) return;
      map = new window.maplibregl.Map({ container, style, ...config, ...(camera || {}), attributionControl: false,
        keyboard: true, dragRotate: true, touchPitch: true, transformRequest: resources.transformRequest });
      map.getCanvas().setAttribute('aria-label', 'Map. Use arrow keys to pan, plus or minus to zoom, and Shift with arrow keys to rotate or pitch.');
      map.on('style.load', () => { if (!disposed && id === generation && ready) displayPosition(); });
      contextActions = installMapContext({ map, createMenu, createModal, toast, markExploration, reducedMotion,poiAllowed:p=>poiFilter.visible(p),isInteractionBlocked:()=>!!inputBlocked() });
      map.on('movestart', event => {
        if (event.originalEvent) { location.markNavigation(); recenterPending = false; }
      });
      map.on('load', () => {
        activateMap(id);
      });
      map.on('error', event => {
        if (disposed || id !== generation) return;
        // The resource controller presents one canonical partial-availability notice.
        // Keep terrain sources attached so a later successful request can recover them.
        if (String(event.error?.message || '').includes('pbbcache:') || event.error?.name === 'AbortError' || event.error?.url?.includes('/tiles/')) return;
        const source = event.sourceId || sourceFromError(event.error);
        const warningKey = source === 'terrain-hillshade' ? 'terrain' : source;
        if (warned.has(warningKey)) return;
        warned.add(warningKey);
        if (source === 'pbb-poi') {
          optionalNotices.push(toast.show('Points of interest are unavailable for this area. You can keep using the basemap. Choose Retry map in Map status to reload map data.', { type: 'warn', persistent: true }));
          showError('Some map layers are unavailable', 'Points of interest could not load. Continue exploring the basemap, or choose Retry map to reload the layers.');
        } else if (source === 'terrain' || source === 'terrain-hillshade') {
          map.setTerrain(null);
          if (map.getLayer('terrain-hillshade')) map.removeLayer('terrain-hillshade');
          optionalNotices.push(toast.show('Terrain is unavailable for this area. The flat basemap remains usable. Choose Retry map in Map status to try terrain again.', { type: 'warn', persistent: true }));
          showError('Some map layers are unavailable', 'Terrain could not load. Continue exploring the flat basemap, or choose Retry map to reload the layers.');
        } else {
          showError('Some map data could not load', 'Check the local MapServer connection and prepared cache coverage. Navigation remains available where tiles are present; choose Retry map to reload.');
        }
      });
      syncControls();
    } catch (error) {
      if (disposed || id !== generation || controller.signal.aborted) return;
      clearTimeout(startupTimer);
      showError('Map could not open', error.message || 'Check the installation and choose Retry map.');
    }
  }

  function activateMap(id) {
    if (disposed || id !== generation || ready || !map) return;
    ready = true; scalePlacement=installScalePlacement({map,region,createMapScale}); accuracyRipple.setMap(map); search.setMap(map); poiFilter.setMap(map); personal?.setMap(map);ruler?.setMap(map);
    clearTimeout(startupTimer); busy.hide();
    POI_LAYERS.forEach(layer => { if (map.getLayer(layer)) map.setLayoutProperty(layer, 'visibility', poiVisible ? 'visible' : 'none'); });
    displayPosition(); syncDirectionUI();
  }

  const resize = new ResizeObserver(() => map?.resize());
  resize.observe(region);
  const onViewportResize = () => map?.resize();
  window.visualViewport?.addEventListener('resize', onViewportResize);
  const onPageHide = () => destroy();
  const onPageShow = event => { if (event.persisted) window.location.reload(); };
  function destroy() {
    if (disposed) return;
    disposed = true; generation++;
    clearTimeout(recoveryTimer); window.removeEventListener('online', onConnectionHint); document.removeEventListener('visibilitychange', onRecoveryVisible);
    resources.destroy(window.maplibregl); signalIndicator?.destroy(); shell.destroy(); missingNotice?.close();
    document.removeEventListener('visibilitychange',welcomeVisible);welcome?.destroy();directionOptions.destroy();diagnostics.destroy();direction.destroy();location.destroy();accuracyRipple.destroy(); removeMap(); resize.disconnect();
    window.visualViewport?.removeEventListener('resize', onViewportResize);
    window.removeEventListener('pagehide', onPageHide);
    searchMobile.removeEventListener('change', placeSearch);
    ruler?.destroy();personal?.destroy();personalControl.destroy();personalHost.remove();
    poiFilter.destroy();search.destroy(); navbar.destroy(); locateControl.destroy(); locateContainer.remove(); zoomContainer.remove(); feedback.destroy(); busy.destroy(); toast.destroy();
  }
  window.addEventListener('pagehide', onPageHide);
  window.addEventListener('pageshow', onPageShow);
  // Requesting permission never delays the independent fallback map initialization.
  void initialize();
  location.request(false);
  return { destroy };
}

function sourceFromError(error) {
  const message = String(error?.message || '');
  if (message.includes('/tiles/poi/')) return 'pbb-poi';
  if (message.includes('/tiles/terrain/')) return 'terrain';
  if (message.includes('/tiles/glyphs/')) return 'glyphs';
  return 'basemap';
}









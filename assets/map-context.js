import { poiName } from './poi-name.js?v=20261012-personal-ui4';
export function installMapContext({ map, createMenu, createModal, toast, markExploration, reducedMotion,poiAllowed=()=>true,isInteractionBlocked=()=>false }) {
  const canvas = map.getCanvas();
  const pointerSurface = map.getCanvasContainer();
  const anchor = document.createElement('span');
  anchor.className = 'pbb-context-anchor';
  anchor.setAttribute('aria-hidden', 'true');
  document.body.appendChild(anchor);
  let captured, token = 0, disposed = false, hold = null, suppressUntil = 0;
  let rightGesture = null, rightTimer = null;
  function rightDown(e) {
    if(e.button!==2 || !pointerSurface.contains(e.target))return;
    clearTimeout(rightTimer);suppressUntil=0;
    rightGesture={x:e.clientX,y:e.clientY,active:true,moved:false,pending:null};
  }
  function rightMove(e) {
    if(!rightGesture?.active)return;
    if(Math.hypot(e.clientX-rightGesture.x,e.clientY-rightGesture.y)>5){
      rightGesture.moved=true;menu?.destroy();menu=null;
    }
  }
  function rightUp(e) {
    if(e.button!==2 || !rightGesture)return;
    rightMove(e);const gesture=rightGesture;gesture.active=false;
    // Press-ordered contextmenu is deferred until a stationary release. A
    // release-ordered event sees this gesture before the next event-loop turn.
    rightTimer=setTimeout(()=>{
      if(disposed||rightGesture!==gesture)return;
      if(!gesture.moved&&gesture.pending&&pointerSurface.contains(e.target))open(gesture.pending.x,gesture.pending.y);
      if(gesture.moved)suppressUntil=Date.now()+500;
      rightGesture=null;
    },0);
  }
  function cancelRight() {clearTimeout(rightTimer);if(rightGesture)suppressUntil=Date.now()+500;rightGesture=null;}
  const coordsText = point => `${point.lat.toFixed(6)}, ${point.lng.toFixed(6)}`;
  const modal = createModal({ title: 'Location information', ariaLabel: 'Location information',
    closeWhileBusy: true, backdropCloseWhileBusy: true, escapeCloseWhileBusy: true,
    workspaceBridge: false, onBeforeClose: () => { token++; } });
  function paragraph(parent, text) { const p = document.createElement('p'); p.textContent = text; parent.appendChild(p); }
  async function info(point) {
    if (modal.getState().open) return;
    const id = ++token;
    modal.setContent(null);
    modal.setBusy(true, { message: 'Reading nearby loaded map tiles…' });
    modal.open();
    // Yield a paint before initializing read-only content. Dismissal stays available.
    await new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve, 0)));
    if (disposed || id !== token || !modal.getState().open) return;
    const content = document.createElement('div');
    paragraph(content, `Latitude, longitude (WGS84): ${coordsText(point)}`);
    paragraph(content, 'Nearby POIs within 250 m, from currently loaded local tiles only. Approximate straight-line distances; results may be incomplete. No address, elevation or device accuracy is inferred.');
    try {
      const found = new Map();
      for (const f of map.querySourceFeatures('pbb-poi', { sourceLayer: 'poi' })) {
        if (f.geometry?.type !== 'Point'||!poiAllowed(f.properties)) continue;
        const name = poiName(f.properties);
        if (!name) continue;
        const [lng, lat] = f.geometry.coordinates;
        const d = distance(point, { lng, lat });
        if (!Number.isFinite(d) || d > 250) continue;
        const key = `${name}|${lng.toFixed(5)}|${lat.toFixed(5)}`;
        if (!found.has(key)) found.set(key, { name: String(name), d });
      }
      const list = document.createElement('ul');
      for (const item of [...found.values()].sort((a,b) => a.d-b.d).slice(0,30)) {
        const li = document.createElement('li'); li.textContent = `${item.name} — approximately ${Math.round(item.d)} m`; list.appendChild(li);
      }
      if (found.size) content.appendChild(list);
      else paragraph(content, 'No named POIs found within 250 m in loaded tiles. This does not establish that none exist. Zoom or navigate to load nearby tiles, then reopen Get info.');
    } catch {
      paragraph(content, 'Nearby map data could not be read. Close this dialog, wait for the map to load or use Retry map, then reopen Get info.');
    }
    if (disposed || id !== token || !modal.getState().open) return;
    modal.setContent(content); modal.setBusy(false);
  }
  let menu = null, menuInvoker = null;
  // Helper automatically toggles a menu on its trigger's click. Keep the
  // positioning anchor separate so only guarded destination activation opens it.
  anchor.focus=()=>{if(menuInvoker?.isConnected&&menuInvoker.tabIndex===0)menuInvoker.focus();};
  function close() { menu?.destroy(); menu=null;menuInvoker=null; }
  function makeMenu(items) { return createMenu(anchor, items, { ariaLabel: 'Map location actions', offset: 0, className: 'pbb-context-menu',
    onOpenChange:open=>{if(menuInvoker){menuInvoker.setAttribute('aria-expanded',String(open));if(open)menuInvoker.setAttribute('aria-controls',anchor.getAttribute('aria-controls'));else menuInvoker.removeAttribute('aria-controls');}},
    onSelect: async item => {
      const point = { ...captured };
      if (item.id === 'copy') {
        try { await navigator.clipboard.writeText(coordsText(point)); if (!disposed) toast.show('Coordinates copied.', { type: 'success', duration: 3200 }); }
        catch { if (!disposed) toast.show('Could not copy coordinates. Allow clipboard access and try again.', { type: 'error', duration: 5000 }); }
      } else if (item.id === 'center') {
        markExploration();
        map.flyTo({ center: [point.lng,point.lat], zoom: map.getZoom(), pitch: map.getPitch(),
          bearing: map.getBearing(), duration: 1200, essential: true });
      }
      else if (item.id === 'info') void info(point);
    } }); }
  function open(x,y) {
    if (disposed || modal.getState().open) return;
    const r=canvas.getBoundingClientRect();
    const p=map.unproject([x-r.left,y-r.top]);
    openAt({lat:p.lat,lng:((p.lng+180)%360+360)%360-180},x,y);
  }
  function openAt(point,x,y,trigger=anchor) {
    if(disposed || isInteractionBlocked() || modal.getState().open || !Number.isFinite(point?.lat) || !Number.isFinite(point?.lng))return;
    close();captured={lat:point.lat,lng:point.lng};menuInvoker=trigger===anchor?null:trigger;
    anchor.style.left=`${x}px`; anchor.style.top=`${y}px`;
    // Closed Helper menus retain their rendered items; recreate through the complete
    // API so coordinate labels and action context always belong to this invocation.
    menu = makeMenu([{id:'copy',label:coordsText(captured)},{id:'center',label:'Center in view'},{id:'info',label:'Get info'}]);
    menu.open();
  }
  function context(e) {
    const portal = document.getElementById(anchor.getAttribute('aria-controls'));
    if (portal?.contains(e.target)) {
      // The Helper menu is portaled outside the map. Keep its captured point
      // when right-clicking an action, while suppressing the browser menu.
      e.preventDefault(); return;
    }
    if (!pointerSurface.contains(e.target)) return;
    e.preventDefault(); if(Date.now()<suppressUntil||rightGesture?.moved)return;
    if(rightGesture?.active){rightGesture.pending={x:e.clientX,y:e.clientY};return;}
    open(e.clientX,e.clientY);
  }
  function cancel() { clearTimeout(hold?.timer); hold=null; }
  function start(e) {
    cancel(); if(e.touches.length!==1)return;
    const t=e.touches[0]; hold={x:t.clientX,y:t.clientY};
    hold.timer=setTimeout(()=>{const p=hold;hold=null;suppressUntil=Date.now()+900;open(p.x,p.y);},600);
  }
  function move(e) { if(!hold)return; const t=e.touches[0]; if(e.touches.length!==1 || Math.hypot(t.clientX-hold.x,t.clientY-hold.y)>8)cancel(); }
  function key(e) { if(e.key==='ContextMenu'||(e.shiftKey&&e.key==='F10')){e.preventDefault();const r=canvas.getBoundingClientRect();open(r.left+r.width/2,r.top+r.height/2);} }
  // Capture before MapLibre's gesture handlers can stop native event propagation.
  document.addEventListener('contextmenu',context,{capture:true});
  document.addEventListener('mousedown',rightDown,true);
  document.addEventListener('mousemove',rightMove,true);
  document.addEventListener('mouseup',rightUp,true);
  window.addEventListener('blur',cancelRight);
  document.addEventListener('pointercancel',cancelRight,true);
  canvas.addEventListener('touchstart',start,{passive:true});
  canvas.addEventListener('touchmove',move,{passive:true});
  canvas.addEventListener('touchend',cancel); canvas.addEventListener('touchcancel',cancel);
  canvas.addEventListener('keydown',key);
  map.on('movestart',close);
  return { openAt, close, destroy() { disposed=true;token++;cancel();close();modal.destroy();anchor.remove();map.off('movestart',close);
    cancelRight();document.removeEventListener('mousedown',rightDown,true);document.removeEventListener('mousemove',rightMove,true);document.removeEventListener('mouseup',rightUp,true);window.removeEventListener('blur',cancelRight);document.removeEventListener('pointercancel',cancelRight,true);
    document.removeEventListener('contextmenu',context,{capture:true});canvas.removeEventListener('touchstart',start);canvas.removeEventListener('touchmove',move);canvas.removeEventListener('touchend',cancel);canvas.removeEventListener('touchcancel',cancel);canvas.removeEventListener('keydown',key); } };
}
export function distance(a,b) {
  const rad=Math.PI/180,dlat=(b.lat-a.lat)*rad,dlng=(b.lng-a.lng)*rad;
  const h=Math.sin(dlat/2)**2+Math.cos(a.lat*rad)*Math.cos(b.lat*rad)*Math.sin(dlng/2)**2;
  return 6371008.8*2*Math.asin(Math.sqrt(Math.min(1,h)));
}

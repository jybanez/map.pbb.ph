import { createElement } from './ui.dom.js';
import { createIcon } from './ui.icons.js';

const instances = new WeakMap();
let sequence = 0;

// A transient MapLibre interaction, independent of drawing data and persistence.
export function createMapRuler(container, options = {}) {
  const { map, maplibre = globalThis.maplibregl } = options;
  if (!container || container.nodeType !== 1) throw new TypeError('Map ruler requires a result container.');
  if (!map || !['on', 'off', 'addSource', 'addLayer', 'getSource', 'getLayer', 'getCanvas'].every(key => typeof map[key] === 'function') || typeof maplibre?.LngLat !== 'function') throw new TypeError('Map ruler requires a MapLibre map and LngLat.');
  if (instances.has(map)) throw new Error('A Helper map ruler already exists on this map.');
  let settings = { ...options }, destroyed = false, active = false, pending = false;
  let start = null, end = null, preview = null, copyStatus = '', copying = false;
  let activation = null, controller = null, epoch = 0, copyEpoch = 0, originalDoubleClick = null;
  let gesture = false, hydrating = false, styleQueued = false;
  const id = `helper-ruler-${++sequence}`, lineId = `${id}-line`, pointsId = `${id}-points`;
  const root = createElement('section', { className: 'ui-map-ruler', attrs: { 'aria-label': 'Map ruler', hidden: '' } });
  const value = createElement('output', { className: 'ui-map-ruler__distance', attrs: { 'aria-label': 'Straight-line geographic distance' } });
  const feedback = createElement('span', { className: 'ui-map-ruler__feedback', attrs: { role: 'status', 'aria-live': 'polite', 'aria-atomic': 'true' } });
  function button(label, icon, handler) {
    const node = createElement('button', { className: 'ui-map-ruler__button', attrs: { type: 'button', title: label, 'aria-label': label } });
    node.appendChild(createIcon(icon, { decorative: true, size: 18 }));
    node.addEventListener('click', handler); return node;
  }
  const copy = button('Copy distance', 'actions.copy', copyDistance);
  const resetButton = button('Reset ruler', 'actions.undo', reset);
  const exit = button('Exit ruler', 'actions.close', deactivate);
  root.append(value, copy, resetButton, exit, feedback); container.appendChild(root);
  function point(position) {
    const lng = position?.lng, lat = position?.lat;
    if (!Number.isFinite(lng) || !Number.isFinite(lat) || Math.abs(lat) > 90) return null;
    return [((lng + 180) % 360 + 360) % 360 - 180, lat];
  }
  function result() {
    const target = end || preview;
    if (!start || !target) return null;
    const meters = new maplibre.LngLat(...start).distanceTo(new maplibre.LngLat(...target));
    return { distanceMeters: meters, text: meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(2)} km`, fixed: Boolean(end) };
  }
  function getState() { return { destroyed, pending, active, phase: !active ? 'inactive' : end ? 'complete' : start ? 'preview' : 'ready', start: start?.slice() || null, end: end?.slice() || null, preview: preview?.slice() || null, result: result(), copying, copyStatus }; }
  function notify() {
    root.hidden = !active;
    const measurement = result();
    value.textContent = measurement?.text || (start ? 'Choose the second point' : 'Choose the first point');
    copy.disabled = !end || copying;
    feedback.textContent = copyStatus;
    settings.onStateChange?.(getState());
  }
  function report(error) { settings.onError?.(error); }
  function data() {
    const features = [], target = end || preview;
    if (start) features.push({ type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: start } });
    if (start && target) {
      const delta = ((target[0] - start[0] + 180) % 360 + 360) % 360 - 180;
      const renderedEnd = [start[0] + delta, target[1]];
      features.push({ type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: renderedEnd } });
      features.push({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [start, renderedEnd] } });
    }
    return { type: 'FeatureCollection', features };
  }
  function draw() {
    // Style availability permits custom resources while base tiles are pending.
    // Waiting for isStyleLoaded/idle can leave a valid measurement invisible.
    if (destroyed || !active || hydrating || !map.getStyle()) return;
    hydrating = true;
    try {
      if (!map.getSource(id)) map.addSource(id, { type: 'geojson', data: data() });
      if (!map.getLayer(lineId)) map.addLayer({ id: lineId, type: 'line', source: id, filter: ['==', '$type', 'LineString'], paint: { 'line-color': '#38bdf8', 'line-width': 3, 'line-dasharray': [2, 1] } });
      if (!map.getLayer(pointsId)) map.addLayer({ id: pointsId, type: 'circle', source: id, filter: ['==', '$type', 'Point'], paint: { 'circle-color': '#38bdf8', 'circle-radius': 5, 'circle-stroke-color': '#ffffff', 'circle-stroke-width': 2 } });
      map.getSource(id).setData(data());
    } catch (error) { report(error); }
    finally { hydrating = false; }
  }
  function removeGeometry() {
    if (!map.getStyle()) return;
    for (const layer of [pointsId, lineId]) if (map.getLayer(layer)) map.removeLayer(layer);
    if (map.getSource(id)) map.removeSource(id);
  }
  function clearPair() { ++copyEpoch; start = end = preview = null; copying = false; copyStatus = ''; }
  function reset() { if (destroyed) return; clearPair(); draw(); notify(); }
  function deactivate(mapRemoved = false) {
    if (destroyed) return;
    ++epoch; controller?.abort(); controller = null; activation = null; pending = false;
    active = false; gesture = false; clearPair();
    if (mapRemoved !== true) removeGeometry();
    if (originalDoubleClick !== null) {
      if (mapRemoved !== true) { if (originalDoubleClick) map.doubleClickZoom.enable(); else map.doubleClickZoom.disable(); }
      originalDoubleClick = null;
    }
    notify();
  }
  function activate() {
    if (destroyed) return Promise.resolve(false);
    if (active) return Promise.resolve(true);
    if (activation) return activation;
    const token = ++epoch;
    controller = new AbortController(); const signal = controller.signal;
    pending = true;
    // Install promise before notifying to make reentrant activation deduplicate too.
    activation = Promise.resolve().then(async () => {
      try {
        if (destroyed || token !== epoch || signal.aborted) return false;
        const allowed = settings.beforeActivate ? await settings.beforeActivate({ signal }) : true;
        if (destroyed || token !== epoch || signal.aborted) return false;
        pending = false; activation = null; controller = null;
        if (allowed !== true) { notify(); return false; }
        originalDoubleClick = map.doubleClickZoom?.isEnabled() ?? null;
        map.doubleClickZoom?.disable(); active = true; clearPair(); draw(); notify(); return true;
      } catch (error) {
        if (destroyed || token !== epoch) return false;
        pending = false; activation = null; controller = null; report(error); notify(); return false;
      }
    });
    const promise = activation; notify(); return promise;
  }
  function click(event) {
    if (!active || destroyed || gesture || map.isMoving?.() || map.isZooming?.()) return;
    const next = point(event.lngLat); if (!next) return;
    ++copyEpoch; copying = false; copyStatus = '';
    if (!start || end) { start = next; end = preview = null; } else { end = next; preview = null; }
    draw(); notify();
  }
  function move(event) { if (active && start && !end && !gesture) { preview = point(event.lngLat); draw(); notify(); } }
  function gestureStart() { gesture = true; }
  function pointerStart() { gesture = false; }
  function key(event) {
    if (event.key !== 'Escape' || (!active && !pending)) return;
    const target = event.target;
    if (!root.contains(target) && !map.getContainer().contains(target)) return;
    event.preventDefault(); deactivate();
  }
  async function copyDistance() {
    if (destroyed || !active || !end || copying) return;
    const token = ++copyEpoch, text = result().text;
    copying = true; copyStatus = 'Copying distance…'; notify();
    try {
      const clipboard = container.ownerDocument.defaultView?.navigator.clipboard;
      if (!clipboard?.writeText) throw new Error('Clipboard unavailable');
      await clipboard.writeText(text);
      if (destroyed || token !== copyEpoch) return;
      copying = false; copyStatus = 'Distance copied.'; notify();
    } catch (error) {
      if (destroyed || token !== copyEpoch) return;
      copying = false; copyStatus = 'Could not copy. Select the distance and copy it manually.'; report(error); notify();
    }
  }
  function destroy(mapRemoved = false) {
    if (destroyed) return;
    deactivate(mapRemoved); destroyed = true;
    for (const [name, handler] of bindings) map.off(name, handler);
    map.getCanvas().removeEventListener('pointerdown', pointerStart);
    container.ownerDocument.removeEventListener('keydown', key);
    root.remove(); instances.delete(map); settings.onStateChange?.(getState());
  }
  function idle() { if (active && !map.getSource(id)) draw(); }
  function styleData() {
    if (styleQueued || destroyed || !active) return;
    styleQueued = true;
    queueMicrotask(() => {
      styleQueued = false;
      if (!destroyed && active && map.getStyle() && (!map.getSource(id) || !map.getLayer(lineId) || !map.getLayer(pointsId))) draw();
    });
  }
  function removed() { destroy(true); }
  const bindings = [['click', click], ['mousemove', move], ['dragstart', gestureStart], ['zoomstart', gestureStart], ['rotatestart', gestureStart], ['pitchstart', gestureStart], ['style.load', draw], ['styledata', styleData], ['idle', idle], ['remove', removed]];
  for (const [name, handler] of bindings) map.on(name, handler);
  map.getCanvas().addEventListener('pointerdown', pointerStart);
  container.ownerDocument.addEventListener('keydown', key);
  const api = { activate, deactivate, reset, getState, destroy, getElement: () => destroyed ? null : root,
    getSize: () => { const box = destroyed ? null : root.getBoundingClientRect(); return { width: box?.width || 0, height: box?.height || 0 }; },
    update(next = {}) {
      if (destroyed) return;
      if ((Object.hasOwn(next, 'map') && next.map !== map) || (Object.hasOwn(next, 'maplibre') && next.maplibre !== maplibre)) throw new TypeError('Map ruler update cannot change its map or engine; destroy and recreate.');
      // Callback changes also cancel any pending guard from the prior context.
      if (pending) deactivate(); settings = { ...settings, ...next }; notify();
    } };
  instances.set(map, api); return api;
}

// Distance calculation and camera updates belong to the installed map engine.
const instances = new WeakMap();

export function createMapScale({ map, maplibre = globalThis.maplibregl, offset = 0 } = {}) {
  if (!map || typeof map.addControl !== 'function' || typeof map.removeControl !== 'function' || typeof map.on !== 'function' || typeof map.off !== 'function') throw new TypeError('Map scale requires a MapLibre map.');
  if (typeof maplibre?.ScaleControl !== 'function') throw new TypeError('Map scale requires the installed MapLibre ScaleControl.');
  if (instances.has(map)) throw new Error('A Helper map scale already exists on this map.');
  const validateOffset = value => { if (!Number.isFinite(value) || value < 0) throw new TypeError('Scale offset must be a finite nonnegative pixel value.'); return value; };
  let bottomOffset = validateOffset(offset), root = null, destroyed = false, mounted = false;
  const native = new maplibre.ScaleControl({ maxWidth: 100, unit: 'metric' });
  function label() {
    if (root) root.setAttribute('aria-label', `Map scale: ${root.textContent.replace(/\s+/g, ' ').trim()}. Local reference at the left edge of the map, halfway down the viewport.`);
  }
  function resize() { if (!destroyed && mounted) { native.setUnit('metric'); label(); } }
  function cleanup() {
    if (destroyed) return;
    destroyed = true;
    map.off('move', label); map.off('resize', resize); map.off('remove', cleanup);
    instances.delete(map);
    root = null;
  }
  const control = {
    onAdd(currentMap) {
      root = native.onAdd(currentMap); mounted = true;
      root.classList.add('ui-map-scale');
      root.setAttribute('role', 'img');
      root.title = 'Local map scale at the left edge, halfway down the viewport. Perspective and terrain can vary scale across the map.';
      root.style.setProperty('--ui-map-scale-offset', `${bottomOffset}px`);
      map.on('move', label); map.on('resize', resize); map.on('remove', cleanup);
      label(); return root;
    },
    onRemove() { if (mounted) { mounted = false; native.onRemove(); } cleanup(); },
  };
  const api = {
    getElement: () => root,
    getSize: () => { const box = root?.getBoundingClientRect(); return { width: box?.width ?? 0, height: box?.height ?? 0 }; },
    update(options = {}) { if (destroyed) return; const next = options.offset === undefined ? bottomOffset : validateOffset(options.offset); bottomOffset = next; root?.style.setProperty('--ui-map-scale-offset', `${next}px`); },
    destroy() { if (destroyed) return; map.removeControl(control); },
  };
  instances.set(map, api);
  try { map.addControl(control, 'bottom-left'); } catch (error) { if (mounted) control.onRemove(); else cleanup(); throw error; }
  return api;
}

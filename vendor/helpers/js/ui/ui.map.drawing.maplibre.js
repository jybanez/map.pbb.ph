const MODES = ["select", "pan", "point", "line", "polygon"];
const clone = value => structuredClone(value);
const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
let nextAdapter = 0;

/** MapLibre 4.6 compatible, app-owned GeoJSON; no persistence or map creation. */
export function createMapLibreDrawingAdapter(map, options = {}) {
  if (!map?.on || !map?.getCanvas || !map?.addSource) throw new TypeError("A MapLibre map is required.");
  const prefix = options.idPrefix || `helper-drawing-${++nextAdapter}`;
  const sourceId = `${prefix}-data`;
  const layers = ["fill", "line", "point", "vertex"].map(name => `${prefix}-${name}`);
  if (map.getSource(sourceId) || layers.some(id => map.getLayer(id))) throw new Error("Drawing IDs already exist.");
  const canvas = map.getCanvas();
  const listeners = new Map();
  const mapOffs = [];
  const domOffs = [];
  let features = validateFeatures(options.features || []);
  let mode = "select", selected = null, draft = [], draftRedo = [];
  let undoStack = [], redoStack = [], drag = null, lock = null, destroyed = false;
  let ownedSource = false, ownedLayers = new Set(), suppressClick = null, hydrating = false, styleQueued = false;
  const oldCursor = canvas.style.cursor;
  const historyLimit = Number.isInteger(options.historyLimit) && options.historyLimit > 0 ? options.historyLimit : 100;

  function reportError(error) {
    try { options.onError ? options.onError(error) : console.error("[MapLibreDrawingAdapter]", error); }
    catch (reported) { console.error(reported); }
  }

  function emit(name, payload) {
    // Snapshot subscribers: the complete toolbar resubscribes while rendering.
    for (const callback of [...(listeners.get(name) || [])]) {
      try { callback(clone(payload)); }
      catch (error) { reportError(error); }
    }
  }
  function on(name, callback) {
    if (destroyed || typeof callback !== "function") return () => {};
    const set = listeners.get(name) || new Set(); set.add(callback); listeners.set(name, set);
    return () => set.delete(callback);
  }
  function bindMap(name, callback) { map.on(name, callback); mapOffs.push(() => map.off(name, callback)); }
  function bindDom(target, name, callback) { target.addEventListener(name, callback); domOffs.push(() => target.removeEventListener(name, callback)); }
  function lockNavigation(names) {
    restoreNavigation();
    lock = names.map(name => [map[name], map[name]?.isEnabled()]);
    lock.forEach(([handler]) => handler?.disable());
  }
  function restoreNavigation() {
    lock?.forEach(([handler, enabled]) => enabled ? handler.enable() : handler?.disable()); lock = null;
  }
  function vertices(feature) {
    if (!feature) return [];
    const { type, coordinates } = feature.geometry;
    if (type === "Point") return [{ path: [], coordinate: coordinates }];
    if (type === "LineString") return coordinates.map((coordinate, i) => ({ path: [i], coordinate }));
    return coordinates.flatMap((ring, r) => ring.slice(0, -1).map((coordinate, i) => ({ path: [r, i], coordinate })));
  }
  function renderedData() {
    const data = features.map(feature => ({ ...clone(feature), properties: { ...clone(feature.properties), __helperId: String(feature.id), __helperKind: "feature", __helperSelected: String(feature.id) === selected } }));
    draft.forEach((coordinate, i) => data.push({ type: "Feature", geometry: { type: "Point", coordinates: coordinate }, properties: { __helperKind: "draft", index: i } }));
    if (draft.length > 1) data.push({ type: "Feature", geometry: { type: "LineString", coordinates: mode === "polygon" && draft.length > 2 ? [...draft, draft[0]] : draft }, properties: { __helperKind: "draft" } });
    vertices(features.find(f => String(f.id) === selected)).forEach(({ coordinate }) => data.push({ type: "Feature", geometry: { type: "Point", coordinates: coordinate }, properties: { __helperKind: "vertex" } }));
    return { type: "FeatureCollection", features: data };
  }
  function hydrate() {
    if (destroyed || hydrating) return;
    if (!map.getStyle()) return;
    hydrating = true;
    try {
    if (!map.getSource(sourceId)) { map.addSource(sourceId, { type: "geojson", data: renderedData() }); ownedSource = true; }
    const color = ["case", ["boolean", ["get", "__helperSelected"], false], "#ffb547", "#50b8ff"];
    const specs = [
      { id: layers[0], type: "fill", filter: ["==", ["geometry-type"], "Polygon"], paint: { "fill-color": color, "fill-opacity": 0.22 } },
      { id: layers[1], type: "line", filter: ["!=", ["geometry-type"], "Point"], paint: { "line-color": color, "line-width": 3 } },
      { id: layers[2], type: "circle", filter: ["all", ["==", ["geometry-type"], "Point"], ["!=", ["get", "__helperKind"], "vertex"]], paint: { "circle-color": color, "circle-radius": 7, "circle-stroke-color": "#102035", "circle-stroke-width": 2 } },
      { id: layers[3], type: "circle", filter: ["==", ["get", "__helperKind"], "vertex"], paint: { "circle-color": "#fff", "circle-radius": 8, "circle-stroke-color": "#e79622", "circle-stroke-width": 3 } },
    ];
    for (const spec of specs) if (!map.getLayer(spec.id)) { map.addLayer({ ...spec, source: sourceId }); ownedLayers.add(spec.id); }
    render();
    } finally { hydrating = false; }
  }
  function render() { if (!destroyed && ownedSource) map.getSource(sourceId)?.setData(renderedData()); }
  function capabilities() {
    return { modes: destroyed ? ["pan"] : [...MODES], editing: "drag-existing-vertices", measurement: false,
      actions: { finish: !destroyed && (mode === "line" ? draft.length >= 2 : mode === "polygon" && draft.length >= 3), cancel: !destroyed && (mode !== "select" || !!draft.length || !!drag), undo: !destroyed && (!!draft.length || !!undoStack.length) && !drag, redo: !destroyed && (!!draftRedo.length || !!redoStack.length) && !drag, delete: !destroyed && selected !== null && !drag, clear: !destroyed && !!features.length && !drag } };
  }
  function refresh() { render(); emit("measure", null); }
  function select(id) { selected = id === null ? null : String(id); render(); emit("select", selected === null ? null : { featureId: selected, feature: features.find(f => String(f.id) === selected) }); }
  function publishChanges(before) {
    before.filter(f => !features.some(n => String(n.id) === String(f.id))).forEach(f => emit("delete", f.id));
    features.forEach(f => { const old = before.find(p => String(p.id) === String(f.id)); if (!old) emit("create", f); else if (!equal(old, f)) emit("update", f); });
    if (selected !== null && !features.some(f => String(f.id) === selected)) select(null);
    refresh();
  }
  function commit(next) {
    const validated = validateFeatures(next);
    if (equal(validated, features)) return;
    const before = clone(features); undoStack.push(before); if (undoStack.length > historyLimit) undoStack.shift(); redoStack = [];
    features = validated; render(); publishChanges(before);
  }
  function abortDrag() {
    if (!drag) return;
    const previousDrag = drag; drag = null;
    features = previousDrag.before; try { canvas.releasePointerCapture(previousDrag.pointerId); } catch (_) { /* already released */ }
    restoreNavigation(); render();
  }
  function setMode(next) {
    if (destroyed) return;
    if (!MODES.includes(next)) throw new RangeError(`Unsupported drawing mode: ${next}`);
    abortDrag(); draft = []; draftRedo = []; restoreNavigation(); mode = next;
    if (!["select", "pan"].includes(mode)) lockNavigation(["dragPan", "doubleClickZoom", "keyboard"]);
    canvas.style.cursor = mode === "pan" || mode === "select" ? oldCursor : "crosshair";
    refresh(); emit("modechange", mode);
  }
  function newFeature(type, coordinates) {
    let id; do { id = `${prefix}-${globalThis.crypto.randomUUID()}`; } while (features.some(f => String(f.id) === id));
    return { type: "Feature", id, properties: {}, geometry: { type, coordinates: clone(coordinates) } };
  }
  function finish() {
    if (destroyed || !capabilities().actions.finish) return false;
    const feature = newFeature(mode === "line" ? "LineString" : "Polygon", mode === "line" ? draft : [[...draft, draft[0]]]);
    try { validateFeatures([feature]); }
    catch (error) { reportError(error); return false; } // Invalid draft stays editable.
    draft = []; draftRedo = []; commit([...features, feature]); setMode("select"); select(feature.id); return true;
  }
  function cancel() { if (!destroyed) { abortDrag(); setMode("select"); } }
  function click(event) {
    if (destroyed || drag || mode === "pan") return;
    // Suppress only the click belonging to a completed drag, never a later click.
    const original = event.originalEvent;
    if (suppressClick && original && Math.abs(original.timeStamp - suppressClick.timeStamp) < 50 && Math.hypot(original.clientX - suppressClick.x, original.clientY - suppressClick.y) < 2) return;
    if (mode === "select") {
      const live = layers.slice(0, 3).filter(id => map.getLayer(id));
      const p = event.point;
      const hit = live.length ? map.queryRenderedFeatures([[p.x - 6, p.y - 6], [p.x + 6, p.y + 6]], { layers: live }).find(f => f.properties.__helperKind === "feature") : null;
      select(hit?.properties.__helperId ?? null); return;
    }
    const coordinate = [event.lngLat.lng, event.lngLat.lat]; validatePosition(coordinate);
    if (mode === "point") { const feature = newFeature("Point", coordinate); commit([...features, feature]); }
    else { if (!equal(draft.at(-1), coordinate)) draft.push(coordinate); draftRedo = []; refresh(); }
  }
  function pointerDown(event) {
    if (destroyed || mode !== "select" || selected === null || drag || event.button !== 0) return;
    const feature = features.find(f => String(f.id) === selected), box = canvas.getBoundingClientRect();
    const x = event.clientX - box.left, y = event.clientY - box.top;
    const vertex = vertices(feature).find(v => { const p = map.project(v.coordinate); return Math.hypot(p.x - x, p.y - y) <= 12; });
    if (!vertex) return;
    event.preventDefault(); event.stopImmediatePropagation();
    lockNavigation(["dragPan", "dragRotate", "touchZoomRotate", "doubleClickZoom"]);
    drag = { before: clone(features), path: vertex.path, pointerId: event.pointerId, moved: false };
    canvas.setPointerCapture(event.pointerId);
  }
  function pointerMove(event) {
    if (!drag || drag.pointerId !== event.pointerId) return;
    const box = canvas.getBoundingClientRect(), ll = map.unproject([event.clientX - box.left, event.clientY - box.top]);
    const coordinate = [ll.lng, ll.lat];
    try { validatePosition(coordinate); } catch (_) { return; }
    const feature = features.find(f => String(f.id) === selected);
    if (feature.geometry.type === "Point") feature.geometry.coordinates = coordinate;
    else if (feature.geometry.type === "LineString") feature.geometry.coordinates[drag.path[0]] = coordinate;
    else { const [r, i] = drag.path; feature.geometry.coordinates[r][i] = coordinate; if (i === 0) feature.geometry.coordinates[r][feature.geometry.coordinates[r].length - 1] = [...coordinate]; }
    drag.moved = true; render(); event.preventDefault();
  }
  function pointerUp(event) {
    if (!drag || drag.pointerId !== event.pointerId) return;
    const next = clone(features), before = drag.before, moved = drag.moved;
    abortDrag(); if (moved) suppressClick = { timeStamp: event.timeStamp, x: event.clientX, y: event.clientY };
    if (moved) { try { validateFeatures(next); } catch (error) { refresh(); reportError(error); return; } commit(next); }
    else features = before;
  }
  function keydown(event) {
    if (destroyed || event.target !== canvas || event.altKey) return;
    let handled = true;
    try {
      if (event.key === "Escape") cancel();
      else if (event.key === "Enter") { if (mode === "point" || mode === "line" || mode === "polygon") click({ point: map.project(map.getCenter()), lngLat: map.getCenter() }); }
      else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") event.shiftKey ? redo() : undo();
      else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "y") redo();
      else if (event.key === "Delete" || event.key === "Backspace") deleteSelected();
      else handled = false;
    } finally { if (handled) event.preventDefault(); }
  }
  function undo() {
    if (destroyed || drag) return;
    if (draft.length) { draftRedo.push(draft.pop()); refresh(); return; }
    if (!undoStack.length) return;
    const before = clone(features); redoStack.push(before); features = undoStack.pop(); publishChanges(before);
  }
  function redo() {
    if (destroyed || drag) return;
    if (draftRedo.length) { draft.push(draftRedo.pop()); refresh(); return; }
    if (draft.length || !redoStack.length) return;
    const before = clone(features); undoStack.push(before); features = redoStack.pop(); publishChanges(before);
  }
  function setFeatures(input) {
    if (destroyed) return;
    const next = validateFeatures(input); // Validate atomically before cancelling interaction.
    abortDrag(); draft = []; draftRedo = []; undoStack = []; redoStack = [];
    const before = features; features = next; publishChanges(before);
  }
  function deleteSelected() { if (!destroyed && !drag && selected !== null) commit(features.filter(f => String(f.id) !== selected)); }
  function clear() { if (!destroyed && !drag) { draft = []; draftRedo = []; commit([]); refresh(); } }
  function destroy(removed = false) {
    if (destroyed) return;
    abortDrag(); restoreNavigation(); destroyed = true;
    mapOffs.splice(0).forEach(off => off()); domOffs.splice(0).forEach(off => off()); listeners.clear();
    canvas.style.cursor = oldCursor;
    if (!removed) {
      [...ownedLayers].reverse().forEach(id => { if (map.getLayer(id)) map.removeLayer(id); });
      if (ownedSource && map.getSource(sourceId)) map.removeSource(sourceId);
    }
    ownedLayers.clear(); ownedSource = false; draft = []; draftRedo = []; undoStack = []; redoStack = [];
  }
  bindMap("click", click); bindMap("style.load", hydrate);
  // setStyle's diff path can remove custom resources without another style.load.
  bindMap("styledata", () => {
    if (styleQueued || destroyed) return;
    styleQueued = true;
    queueMicrotask(() => {
      styleQueued = false;
      if (!destroyed && map.getStyle() && (!map.getSource(sourceId) || layers.some(id => !map.getLayer(id)))) hydrate();
    });
  });
  bindMap("remove", () => destroy(true));
  bindDom(canvas, "pointerdown", pointerDown); bindDom(canvas, "pointermove", pointerMove); bindDom(canvas, "pointerup", pointerUp);
  bindDom(canvas, "pointercancel", abortDrag); bindDom(canvas, "lostpointercapture", () => { if (drag) abortDrag(); }); bindDom(canvas, "keydown", keydown);
  bindDom(globalThis, "blur", () => { if (drag) abortDrag(); });
  try { if (map.isStyleLoaded()) hydrate(); } catch (error) { destroy(); throw error; }
  return { on, setMode, setFeatures, validateFeatures, getFeatures: () => clone(features), getMode: () => mode, getCapabilities: capabilities, finish, cancel, undo, redo, deleteSelected, clear, destroy,
    getState: () => ({ mode, selectedFeatureId: selected, features: clone(features), draft: clone(draft), destroyed, sourceId, layerIds: [...layers] }) };
}

function validatePosition(position) {
  if (!Array.isArray(position) || position.length !== 2 || !position.every(Number.isFinite) || Math.abs(position[0]) > 180 || Math.abs(position[1]) > 90) throw new TypeError("Coordinates must be finite 2D longitude/latitude within [-180,180]/[-90,90].");
}
function validateFeatures(input) {
  validateJsonData(input); // Whole batch, before any cloning or adapter mutation.
  const values = input?.type === "FeatureCollection" ? input.features : input;
  if (!Array.isArray(values)) throw new TypeError("Expected a feature array or FeatureCollection.");
  const ids = new Set();
  return values.map(feature => {
    if (feature?.type !== "Feature" || !["string", "number"].includes(typeof feature.id) || String(feature.id) === "" || (typeof feature.id === "number" && !Number.isFinite(feature.id))) throw new TypeError("Every feature requires a stable nonempty string or finite numeric ID.");
    if (ids.has(String(feature.id))) throw new TypeError("Feature IDs must be unique (including string/numeric equivalents)."); ids.add(String(feature.id));
    if (feature.properties !== null && (typeof feature.properties !== "object" || Array.isArray(feature.properties))) throw new TypeError("Feature properties must be an object or null.");
    const geometry = feature.geometry;
    if (geometry?.type === "Point") validatePosition(geometry.coordinates);
    else if (geometry?.type === "LineString") validateLine(geometry.coordinates, 2);
    else if (geometry?.type === "Polygon") {
      if (!Array.isArray(geometry.coordinates) || !geometry.coordinates.length) throw new TypeError("Polygon requires at least one closed ring.");
      geometry.coordinates.forEach(ring => {
        validateLine(ring, 4);
        if (!equal(ring[0], ring.at(-1)) || new Set(ring.slice(0, -1).map(String)).size < 3) throw new TypeError("Polygon rings require three distinct vertices and exact closure.");
        const area = ring.slice(0, -1).reduce((sum, p, i) => sum + p[0] * ring[i + 1][1] - ring[i + 1][0] * p[1], 0);
        if (Math.abs(area) < 1e-12) throw new TypeError("Polygon ring must have nonzero area.");
      });
    } else throw new TypeError("Only Point, LineString and Polygon geometry are supported.");
    return clone(feature);
  });
}
function validateJsonData(value, ancestors = new Set(), path = "features") {
  if (value === null || typeof value === "string" || typeof value === "boolean") return;
  if (typeof value === "number" && Number.isFinite(value)) return;
  if (typeof value !== "object") throw new TypeError(`${path} must contain only JSON data (null, strings, booleans, finite numbers, arrays and plain objects).`);
  if (ancestors.has(value)) throw new TypeError(`${path} contains a cycle.`);
  const array = Array.isArray(value);
  const prototype = Object.getPrototypeOf(value);
  if (array ? prototype !== Array.prototype : prototype !== Object.prototype && prototype !== null) throw new TypeError(`${path} must use plain objects or ordinary arrays, not class or built-in instances.`);
  const descriptors = Object.getOwnPropertyDescriptors(value);
  const keys = Reflect.ownKeys(descriptors);
  if (keys.some(key => typeof key === "symbol")) throw new TypeError(`${path} cannot have symbol keys.`);
  if (array && (keys.length !== value.length + 1 || !keys.every(key => key === "length" || /^(0|[1-9]\d*)$/.test(key) && Number(key) < value.length))) throw new TypeError(`${path} must be a dense array without additional properties.`);
  ancestors.add(value);
  try {
    for (const key of keys) {
      if (array && key === "length") continue;
      const descriptor = descriptors[key];
      if (!descriptor.enumerable || !Object.prototype.hasOwnProperty.call(descriptor, "value")) throw new TypeError(`${path}.${key} must be an enumerable data property, not an accessor or hidden property.`);
      validateJsonData(descriptor.value, ancestors, `${path}.${key}`);
    }
  } finally { ancestors.delete(value); }
}
function validateLine(coordinates, minimum) {
  if (!Array.isArray(coordinates) || coordinates.length < minimum) throw new TypeError(`Geometry requires at least ${minimum} coordinates.`);
  coordinates.forEach(validatePosition);
  if (new Set(coordinates.map(String)).size < 2) throw new TypeError("Geometry requires distinct coordinates.");
}

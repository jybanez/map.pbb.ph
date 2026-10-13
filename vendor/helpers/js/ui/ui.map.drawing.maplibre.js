import { shapeFromPoints, recognizedShape, shapeHandles, transformShape, objectPivot, rotateObject, shapeProject } from "./ui.map.drawing.shapes.js?v=0.21.309";
import { createMapPinRenderer, isMapPin } from "./ui.map.pin.js?v=0.21.315";
const MODES = ["select", "pin", "pan", "point", "line", "path", "polygon", "rectangle", "circle"];
const clone = value => structuredClone(value);
const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
let nextAdapter = 0;

/** MapLibre 4.6 compatible, app-owned GeoJSON; no persistence or map creation. */
export function createMapLibreDrawingAdapter(map, options = {}) {
  if (!map?.on || !map?.getCanvas || !map?.addSource) throw new TypeError("A MapLibre map is required.");
  const prefix = options.idPrefix || `helper-drawing-${++nextAdapter}`;
  const sourceId = `${prefix}-data`;
  const layers = ["fill", "line", "point", "vertex"].map(name => `${prefix}-${name}`);
  if (map.getStyle() && (map.getSource(sourceId) || map.getLayer(`${prefix}-pins`) || layers.some(id => map.getLayer(id)))) throw new Error("Drawing IDs already exist.");
  const canvas = map.getCanvas();
  const lineBehavior = options.lineBehavior ?? "legacy-path";
  if (!["segment", "legacy-path"].includes(lineBehavior)) throw new RangeError("lineBehavior must be segment or legacy-path.");
  const editBehavior = options.editBehavior ?? "session";
  const selectToggle = options.selectToggle === true;
  if (!["session", "immediate"].includes(editBehavior)) throw new RangeError("editBehavior must be session or immediate.");
  let styleChange = null, nextStyleChange = 0;
  const listeners = new Map();
  const mapOffs = [];
  const domOffs = [];
  let features = validateFeatures(options.features || []);
  let mode = "select", selected = null, draft = [], draftRedo = [];
  let objectMode = "move";
  let preview = null;
  let undoStack = [], redoStack = [], drag = null, lock = null, destroyed = false;
  let ownedSource = false, ownedLayers = new Set(), suppressClick = null, hydrating = false, styleQueued = false;
  let revision = 0, requestingDelete = false, edit = null, nextEdit = 0, dispatchDepth = 0;
  const oldCursor = canvas.style.cursor;
  let pinRenderer = null;
  const historyLimit = Number.isInteger(options.historyLimit) && options.historyLimit > 0 ? options.historyLimit : 100;

  function reportError(error) {
    try { options.onError ? options.onError(error) : console.error("[MapLibreDrawingAdapter]", error); }
    catch (reported) { console.error(reported); }
  }

  function emit(name, payload) {
    // Snapshot subscribers: the complete toolbar resubscribes while rendering.
    dispatchDepth++;
    try {
      for (const callback of [...(listeners.get(name) || [])]) {
        if (destroyed) break;
        try { callback(clone(payload)); }
        catch (error) { reportError(error); }
      }
    } finally { dispatchDepth--; }
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
    const handles = shapeHandles(feature);
    if (handles) return handles;
    const { type, coordinates } = feature.geometry;
    if (type === "Point") return [{ path: [], coordinate: coordinates }];
    if (type === "LineString") return coordinates.map((coordinate, i) => ({ path: [i], coordinate }));
    return coordinates.flatMap((ring, r) => ring.slice(0, -1).map((coordinate, i) => ({ path: [r, i], coordinate })));
  }
  function renderedData() {
    const data = features.map(feature => {
      const style = feature.properties?.helperStyle;
      const paint = { __helperfillColor: null, __helperfillOpacity: null, __helperstrokeColor: null, __helperstrokeOpacity: null };
      for (const part of ["fill", "stroke"]) if (style?.[part]) {
        const { r, g, b, a } = style[part];
        paint[`__helper${part}Color`] = `rgb(${r},${g},${b})`;
        paint[`__helper${part}Opacity`] = a;
      }
      return { ...clone(feature), properties: { ...clone(feature.properties), ...paint, __helperPin: isMapPin(feature), __helperId: String(feature.id), __helperKind: "feature", __helperSelected: String(feature.id) === selected } };
    });
    draft.forEach((coordinate, i) => data.push({ type: "Feature", geometry: { type: "Point", coordinates: coordinate }, properties: { __helperKind: "draft", index: i } }));
    if (preview && draft.length && ["circle", "rectangle"].includes(mode)) {
      try { const { geometry } = shapeFromPoints(mode, draft[0], preview); data.push({ type: "Feature", geometry, properties: { __helperKind: "draft" } }); } catch (_) { /* Invalid preview never alters the model. */ }
    }
    const drawing = preview && draft.length && ["line", "path"].includes(mode) ? [...draft, preview] : draft;
    if (drawing.length > 1) data.push({ type: "Feature", geometry: { type: "LineString", coordinates: mode === "polygon" && draft.length > 2 ? [...draft, draft[0]] : drawing }, properties: { __helperKind: "draft" } });
    if (objectMode === "move" && (!selectToggle || mode === "select") && !isMapPin(features.find(f => String(f.id) === selected))) vertices(features.find(f => String(f.id) === selected)).forEach(({ coordinate }) => data.push({ type: "Feature", geometry: { type: "Point", coordinates: coordinate }, properties: { __helperKind: "vertex" } }));
    return { type: "FeatureCollection", features: data };
  }
  function hydrate() {
    if (destroyed || hydrating) return;
    if (!map.getStyle()) return;
    if (drag) abortDrag();
    hydrating = true;
    try {
    if (!map.getSource(sourceId)) { map.addSource(sourceId, { type: "geojson", data: renderedData() }); if (destroyed) return; ownedSource = true; }
    const color = ["case", ["boolean", ["get", "__helperSelected"], false], "#ffb547", "#50b8ff"];
    const specs = [
      { id: layers[0], type: "fill", filter: ["==", ["geometry-type"], "Polygon"], paint: { "fill-color": ["coalesce", ["get", "__helperfillColor"], color], "fill-opacity": ["coalesce", ["get", "__helperfillOpacity"], 0.22] } },
      { id: layers[1], type: "line", filter: ["!=", ["geometry-type"], "Point"], paint: { "line-color": ["coalesce", ["get", "__helperstrokeColor"], color], "line-opacity": ["coalesce", ["get", "__helperstrokeOpacity"], 1], "line-width": 3 } },
      { id: layers[2], type: "circle", filter: ["all", ["==", ["geometry-type"], "Point"], ["!=", ["get", "__helperKind"], "vertex"], ["!=", ["get", "__helperPin"], true]], paint: { "circle-color": ["coalesce", ["get", "__helperfillColor"], color], "circle-opacity": ["coalesce", ["get", "__helperfillOpacity"], 1], "circle-radius": 7, "circle-stroke-color": ["coalesce", ["get", "__helperstrokeColor"], "#102035"], "circle-stroke-opacity": ["coalesce", ["get", "__helperstrokeOpacity"], 1], "circle-stroke-width": 2 } },
      { id: layers[3], type: "circle", filter: ["==", ["get", "__helperKind"], "vertex"], paint: { "circle-color": "#fff", "circle-radius": 8, "circle-stroke-color": "#e79622", "circle-stroke-width": 3 } },
    ];
    for (const spec of specs) {
      if (destroyed) return;
      if (!map.getLayer(spec.id)) { map.addLayer({ ...spec, source: sourceId }); if (destroyed) return; ownedLayers.add(spec.id); }
    }
    render();
    } finally { hydrating = false; }
  }
  function render() { if (!destroyed && ownedSource) { map.getSource(sourceId)?.setData(renderedData()); if (!pinRenderer && features.some(isMapPin)) pinRenderer = createMapPinRenderer(map, { id: `${prefix}-pins`, maplibre: options.maplibre }); pinRenderer?.update(features, { selectedFeatureId: selected }); } }
  function capabilities() {
    const dirty = !!edit && !equal(edit.before, features);
    const modeTransitionReason = !selectToggle ? null : drag ? "Cancel or release the active edit before changing tools." : styleChange ? "Finish or cancel the color change before changing tools." : draft.length || draftRedo.length ? "Finish or cancel the drawing before changing tools." : dirty ? "Finish or cancel the object edit before changing tools." : null;
    const transitionBlocked = selectToggle && (!!drag || !!styleChange || !!draft.length || !!draftRedo.length);
    const editable = !destroyed && (!!edit || editBehavior === "immediate" && selected !== null && mode === "select") && !drag && !styleChange;
    const selectedFeature = features.find(f => String(f.id) === selected);
    const geometry = selectedFeature?.geometry.type;
    const objectEditable = !destroyed && mode === "select" && !!selectedFeature && !drag && !styleChange && !draft.length && !draftRedo.length;
    const objectModes = { move: objectEditable, rotate: objectEditable && canRotate(selectedFeature) };
    const actionVisibility = { fill: mode === "select" && !!geometry && geometry !== "LineString", finish: edit ? dirty : ["path", "polygon"].includes(mode) || mode === "line" && lineBehavior === "legacy-path", cancel: !!styleChange || !!drag || !!draft.length || !!draftRedo.length || (edit ? dirty : !["select", "pan"].includes(mode)) };
    return { objectMode, objectModes, objectRotationSupported: canRotate(selectedFeature), objectControlsVisible: !!selectedFeature && mode === "select", modeTransitionReason, actionVisibility, modes: destroyed ? ["pan"] : transitionBlocked ? [mode] : edit && (dirty || drag) ? ["select"] : [...MODES], selectToggle, selectionEnabled: mode === "select", editing: "drag-existing-vertices", segmentTranslation: true, lineBehavior, drawingKinds: ["line", "path"], editBehavior, editSessions: editBehavior === "session", shapes: ["circle", "rectangle"], styleTransactions: editBehavior === "immediate", featureStyles: ["fill", "stroke"], measurement: false, canPersist: !destroyed && !styleChange && !drag && !draft.length && !draftRedo.length && !dirty,
      actions: { fill: editable && geometry !== "LineString", stroke: editable, finish: !destroyed && !drag && !styleChange && (edit ? dirty : (["line", "path"].includes(mode) ? draft.length >= 2 : mode === "polygon" && draft.length >= 3)), cancel: !destroyed && (!!styleChange || (edit ? dirty : mode !== "select" || !!draft.length || !!drag)), undo: !destroyed && (!!draft.length || !!(edit?.undo || undoStack).length) && !drag && !styleChange, redo: !destroyed && (!!draftRedo.length || !!(edit?.redo || redoStack).length) && !drag && !styleChange, delete: !destroyed && (!selectToggle || mode === "select") && (!edit || !dirty) && selected !== null && !drag && !styleChange, clear: !destroyed && !edit && !!features.length && !drag && !styleChange } };
  }
  function publishState() { if (!destroyed) emit("statechange", { mode, selectedFeatureId: selected, draft: clone(draft), anchor: anchor(), dragging: !!drag, editSession: getEditState(), styleChange: getStyleChange(), revision }); }
  function refresh() { if (destroyed) return false; revision++; render(); if (destroyed) return false; emit("measure", null); publishState(); return !destroyed; }
  function canRotate(feature) {
    if (!feature || feature.geometry.type === "Point" || recognizedShape(feature)?.kind === "circle") return false;
    try { objectPivot(feature); return true; } catch (_) { return false; }
  }
  function setObjectMode(next) {
    if (!["move", "rotate"].includes(next)) throw new RangeError("Object mode must be move or rotate.");
    if (dispatchDepth || destroyed) return false;
    if (next === objectMode) return true;
    if (!capabilities().objectModes[next]) { emit("objectmoderejected", {requestedMode:next, objectMode}); return false; }
    objectMode = next; revision++; render(); emit("objectmodechange", {objectMode}); publishState(); return !destroyed;
  }
  function select(id) { if (drag) return false; if (styleChange) cancelStyleChange(styleChange.id); if (destroyed) return false; if (edit) return beginEdit(id); const next = id === null ? null : String(id); if (next !== selected) objectMode = "move"; revision++; selected = next; render(); if (destroyed) return false; emit("select", selected === null ? null : { featureId: selected, feature: features.find(f => String(f.id) === selected) }); publishState(); return !destroyed; }
  function publishChanges(before) {
    for (const f of before.filter(f => !features.some(n => String(n.id) === String(f.id)))) { if (destroyed) return; emit("delete", f.id); }
    for (const f of features) { if (destroyed) return; const old = before.find(p => String(p.id) === String(f.id)); if (!old) emit("create", f); else if (!equal(old, f)) emit("update", f); }
    if (destroyed) return;
    if (selected !== null && !features.some(f => String(f.id) === selected)) select(null);
    refresh();
  }
  function commit(next) {
    if (destroyed) return false;
    const validated = validateFeatures(next);
    if (equal(validated, features)) return true;
    const before = clone(features), stack = edit ? edit.undo : undoStack;
    stack.push(before); if (stack.length > historyLimit) stack.shift();
    if (edit) edit.redo = []; else redoStack = [];
    revision++; features = validated; render(); if (destroyed) return false; publishChanges(before); return !destroyed;
  }
  function abortDrag(notify = true) {
    if (!drag) return;
    const previousDrag = drag; drag = null;
    revision++;
    features = previousDrag.before; try { canvas.releasePointerCapture(previousDrag.pointerId); } catch (_) { /* already released */ }
    restoreNavigation(); if (notify) { render(); emit("measure", null); publishState(); }
  }
  function setMode(next) {
    if (dispatchDepth) return false;
    if (destroyed) return;
    if (!MODES.includes(next)) throw new RangeError(`Unsupported drawing mode: ${next}`);
    if (selectToggle && next === mode) return true;
    if (selectToggle && next !== mode && capabilities().modeTransitionReason) {
      emit("moderejected", { requestedMode: next, mode, reason: capabilities().modeTransitionReason });
      return false;
    }
    if (styleChange) cancelStyleChange(styleChange.id);
    if (edit && (drag || !equal(edit.before, features))) return false;
    if (edit && next === "select") return true;
    const endedEdit = edit;
    edit = null; // Explicit mode choice settles only an unchanged session, without history/persistence.
    abortDrag(); if (destroyed) return false; draft = []; draftRedo = []; preview = null; restoreNavigation(); mode = next;
    if (!["select", "pan"].includes(mode)) lockNavigation(["dragPan", "doubleClickZoom", ...(["circle", "rectangle"].includes(mode) ? [] : ["keyboard"])]);
    canvas.style.cursor = mode === "pan" || mode === "select" ? oldCursor : "crosshair";
    if (!refresh()) return false;
    if (endedEdit) emit("editchange", null);
    if (destroyed) return false;
    emit("modechange", mode); return !destroyed;
  }
  function newFeature(type, coordinates) {
    let id; do { id = `${prefix}-${globalThis.crypto.randomUUID()}`; } while (features.some(f => String(f.id) === id));
    return { type: "Feature", id, properties: {}, geometry: { type, coordinates: clone(coordinates) } };
  }
  function finish() {
    if (dispatchDepth) return false;
    if (destroyed || !capabilities().actions.finish) return false;
    if (edit) return acceptEdit();
    const isLine = ["line", "path"].includes(mode);
    const feature = newFeature(isLine ? "LineString" : "Polygon", isLine ? draft : [[...draft, draft[0]]]);
    if (isLine) feature.properties.helperDrawingKind = mode === "line" && lineBehavior === "segment" ? "line" : "path";
    try { validateFeatures([feature]); }
    catch (error) { reportError(error); return false; } // Invalid draft stays editable.
    draft = []; draftRedo = []; preview = null; if (!commit([...features, feature])) return false; setMode("select"); return select(feature.id);
  }
  function cancel() { if (dispatchDepth) return false; if (!destroyed) { if (styleChange) return cancelStyleChange(styleChange.id); if (edit) return rollbackEdit(); abortDrag(); if (selectToggle) { draft = []; draftRedo = []; preview = null; } return setMode("select"); } }
  function beginEdit(id = selected) {
    if (editBehavior === "immediate" || dispatchDepth || destroyed || drag || draft.length || draftRedo.length || mode !== "select" || id === null || id === undefined) return false;
    const feature = features.find(f => String(f.id) === String(id));
    if (!feature || (edit && !equal(edit.before, features))) return false;
    if (edit?.featureId === String(feature.id)) return true;
    // Clean switches do not touch global history or publish an intermediate close.
    edit = { id: ++nextEdit, featureId: String(feature.id), before: clone(features), undo: [], redo: [] };
    const session = edit;
    if (selected !== edit.featureId) objectMode = "move";
    selected = edit.featureId;
    emit("select", { featureId: selected, feature });
    if (destroyed || edit !== session || !refresh()) return false;
    emit("editchange", getEditState()); return !destroyed && edit === session;
  }
  function getEditState() { return edit ? { id: edit.id, featureId: edit.featureId, dirty: !equal(edit.before, features), dragging: !!drag, canUndo: !!edit.undo.length && !drag, canRedo: !!edit.redo.length && !drag } : null; }
  function acceptEdit(sessionId = edit?.id) {
    if (dispatchDepth || destroyed || !edit || edit.id !== sessionId || drag) return false;
    const before = edit.before;
    if (!equal(before, features)) { undoStack.push(before); if (undoStack.length > historyLimit) undoStack.shift(); redoStack = []; }
    edit = null; if (!refresh()) return false; emit("editchange", null); return !destroyed;
  }
  function rollbackEdit(sessionId = edit?.id) {
    if (dispatchDepth || destroyed || !edit || edit.id !== sessionId) return false;
    const session = edit;
    abortDrag(); if (destroyed || edit !== session) return false;
    const before = clone(features), original = session.before; edit = null;
    features = original; publishChanges(before); if (destroyed) return false; emit("editchange", null); return !destroyed;
  }
  function updateFeature(id, patch, { sessionId } = {}) {
    if (dispatchDepth || destroyed || drag || styleChange || draft.length || draftRedo.length || mode !== "select") return false;
    if (sessionId !== undefined && edit?.id !== sessionId) return false;
    if (id === null || id === undefined || (edit && edit.featureId !== String(id))) return false;
    const index = features.findIndex(f => String(f.id) === String(id));
    if (index < 0) return false;
    validateJsonData(patch, new Set(), "Feature update");
    if (!patch || Array.isArray(patch) || typeof patch !== "object" || Object.keys(patch).some(key => !["geometry", "properties", "style"].includes(key))) throw new TypeError("Feature update supports geometry, properties and style only.");
    const next = clone(features), feature = next[index];
    if (Object.hasOwn(patch, "geometry")) feature.geometry = clone(patch.geometry);
    if (Object.hasOwn(patch, "properties")) feature.properties = clone(patch.properties);
    if (Object.hasOwn(patch, "style")) {
      if (feature.properties === null) feature.properties = {};
      if (patch.style === null) delete feature.properties.helperStyle;
      else feature.properties.helperStyle = clone(patch.style);
    }
    return commit(next);
  }
  function getStyleChange() { return styleChange ? { id: styleChange.id, featureId: styleChange.featureId, dirty: !equal(styleChange.before, features) } : null; }
  function beginStyleChange(id = selected) {
    if (editBehavior !== "immediate" || dispatchDepth || destroyed || styleChange || drag || edit || mode !== "select" || draft.length || draftRedo.length || id === null || id === undefined || String(id) !== selected) return false;
    if (!features.some(f => String(f.id) === String(id))) return false;
    styleChange = { id: ++nextStyleChange, featureId: String(id), before: clone(features) };
    const token = styleChange.id; refresh(); return destroyed ? false : token;
  }
  function previewStyle(style, changeId) {
    if (dispatchDepth || destroyed || !styleChange || styleChange.id !== changeId) return false;
    validateJsonData(style); validateStyle(style);
    const next = clone(features), feature = next.find(f => String(f.id) === styleChange.featureId);
    if (!feature) return false;
    if (feature.properties === null) feature.properties = {};
    feature.properties.helperStyle = clone(style);
    features = validateFeatures(next); refresh(); return !destroyed;
  }
  function finishStyleChange(changeId) {
    if (dispatchDepth || destroyed || !styleChange || styleChange.id !== changeId) return false;
    const next = features, before = styleChange.before;
    styleChange = null; features = before;
    if (equal(before, next)) return refresh();
    return commit(next);
  }
  function cancelStyleChange(changeId) {
    if (dispatchDepth || destroyed || !styleChange || styleChange.id !== changeId) return false;
    features = styleChange.before; styleChange = null; return refresh();
  }
  function settleStyleChange({ commit: accept = false } = {}) {
    if (dispatchDepth || destroyed) return false;
    if (!styleChange) return true;
    return accept ? finishStyleChange(styleChange.id) : cancelStyleChange(styleChange.id);
  }
  function getFeatureStyle(id = selected) {
    const feature = features.find(f => id !== null && id !== undefined && String(f.id) === String(id));
    return feature ? clone(feature.properties?.helperStyle || {}) : null;
  }
  function getDrawingKind(id = selected) {
    const feature = features.find(f => id !== null && id !== undefined && String(f.id) === String(id));
    if (!feature) return null;
    const shape = recognizedShape(feature);
    if (shape) return shape.kind;
    if (isMapPin(feature)) return "pin";
    if (feature.geometry.type !== "LineString") return feature.geometry.type.toLowerCase();
    return feature.properties?.helperDrawingKind === "line" && feature.geometry.coordinates.length === 2 ? "line" : "path";
  }
  function anchor() {
    const coordinates = draft.length ? draft : vertices(features.find(f => String(f.id) === selected)).map(v => v.coordinate);
    if (!coordinates.length) return null;
    return [0, 1].map(axis => {
      const bounds = coordinates.reduce(([min, max], p) => [Math.min(min, p[axis]), Math.max(max, p[axis])], [Infinity, -Infinity]);
      return (bounds[0] + bounds[1]) / 2;
    });
  }
  function click(event) {
    if (dispatchDepth || destroyed || drag || styleChange && mode !== "select" || mode === "pan") return;
    // Suppress only the click belonging to a completed drag, never a later click.
    const original = event.originalEvent;
    if (suppressClick && original && Math.abs(original.timeStamp - suppressClick.timeStamp) < 50 && Math.hypot(original.clientX - suppressClick.x, original.clientY - suppressClick.y) < 2) return;
    if (mode === "select") {
      const live = layers.slice(0, 3).filter(id => map.getLayer(id));
      const p = event.point;
      const hit = live.length ? map.queryRenderedFeatures([[p.x - 6, p.y - 6], [p.x + 6, p.y + 6]], { layers: live }).find(f => f.properties.__helperKind === "feature") : null;
      select(pinRenderer?.hitTest(p, original?.pointerType === "touch" ? 12 : 6) ?? hit?.properties.__helperId ?? null); return;
    }
    if (mode === "path" && original?.detail > 1) return; // The first click of a double-click already added its endpoint.
    const coordinate = [event.lngLat.lng, event.lngLat.lat];
    try { validatePosition(coordinate); } catch (error) { reportError(error); return; }
    if (["circle", "rectangle"].includes(mode)) {
      if (!draft.length) { draft.push(coordinate); draftRedo = []; preview = null; refresh(); return; }
      try {
        const built = shapeFromPoints(mode, draft[0], coordinate), feature = newFeature("Polygon", built.geometry.coordinates);
        feature.properties.helperShape = built.shape;
        validateFeatures([feature]);
        draft = []; draftRedo = []; preview = null;
        if (commit([...features, feature])) { setMode("select"); select(feature.id); }
      } catch (error) { reportError(error); }
      return;
    }
    if (["point", "pin"].includes(mode)) { const feature = newFeature("Point", coordinate); if (mode === "pin") feature.properties.helperDrawingKind = "pin"; if (commit([...features, feature]) && selectToggle) { setMode("select"); select(feature.id); } }
    else { if (!equal(draft.at(-1), coordinate)) draft.push(coordinate); draftRedo = []; preview = null;
      if (mode === "line" && lineBehavior === "segment" && draft.length === 2) finish(); else refresh(); }
  }
  function pointerDown(event) {
    if (dispatchDepth || destroyed || mode !== "select" || selected === null || drag || styleChange || event.button !== 0) return;
    const feature = features.find(f => String(f.id) === selected), box = canvas.getBoundingClientRect();
    const x = event.clientX - box.left, y = event.clientY - box.top;
    if (objectMode === "rotate" && !canRotate(feature)) return;
    const vertex = objectMode === "move" ? isMapPin(feature) ? (pinRenderer?.hitTest({ x, y }, event.pointerType === "touch" ? 12 : 6) === selected ? vertices(feature)[0] : null) : vertices(feature).find(v => { const p = map.project(v.coordinate); return Math.hypot(p.x - x, p.y - y) <= 12; }) : null;
    let segment = false;
    if (!vertex && feature?.geometry.type === "LineString") {
      const points = feature.geometry.coordinates.map(c => map.project(c));
      segment = points.slice(1).some((b, i) => {
        const a = points[i], dx = b.x - a.x, dy = b.y - a.y, length = dx * dx + dy * dy;
        const t = length ? Math.max(0, Math.min(1, ((x - a.x) * dx + (y - a.y) * dy) / length)) : 0;
        return Math.hypot(x - a.x - t * dx, y - a.y - t * dy) <= 8;
      });
    }
    if (feature?.geometry.type === "Polygon") {
      // Match selection's topmost feature, rather than dragging through another object.
      // Rendered fill excludes holes; stroke also permits transparent-fill edge hits.
      const live = layers.slice(0, 3).filter(id => map.getLayer(id));
      const hit = live.length ? map.queryRenderedFeatures([[x - 6, y - 6], [x + 6, y + 6]], { layers: live }).find(f => f.properties.__helperKind === "feature") : null;
      if (hit?.properties.__helperId !== selected && (hit || !vertex)) return;
      if (!vertex) segment = true;
    }
    if (!vertex && !segment) return;
    if (objectMode === "rotate" && feature.geometry.type === "LineString") {
      const live = layers.slice(0,3).filter(id=>map.getLayer(id));
      const hit = live.length ? map.queryRenderedFeatures([[x-6,y-6],[x+6,y+6]],{layers:live}).find(f=>f.properties.__helperKind === "feature") : null;
      if (hit?.properties.__helperId !== selected) return;
    }
    event.preventDefault(); event.stopImmediatePropagation();
    lockNavigation(["dragPan", "dragRotate", "touchZoomRotate", "doubleClickZoom", ...(isMapPin(feature) ? ["touchPitch", "scrollZoom", "keyboard"] : [])]);
    const start = map.unproject([x, y]);
    const pivot = objectMode === "rotate" ? objectPivot(feature) : null;
    const plane = pivot ? shapeProject([start.lng, start.lat]) : null;
    // A pointer exactly at the pivot cannot define an angular gesture.
    if (pivot && Math.hypot(plane[0]-pivot[0], plane[1]-pivot[1]) < 1e-12) { restoreNavigation(); return; }
    drag = { before: clone(features), path: vertex?.path, start, pivot, objectMode, startAngle: pivot ? Math.atan2(plane[1]-pivot[1], plane[0]-pivot[0]) : null, featureId: selected, session: edit, pointerId: event.pointerId, moved: false };
    revision++;
    canvas.setPointerCapture(event.pointerId);
    emit("measure", null);
    publishState();
  }
  function pointerMove(event) {
    if (dispatchDepth || destroyed) return;
    if (!drag) {
      if (!draft.length || !["line", "path", "circle", "rectangle"].includes(mode)) return;
      const box = canvas.getBoundingClientRect(), ll = map.unproject([event.clientX - box.left, event.clientY - box.top]);
      const coordinate = [ll.lng, ll.lat];
      try { validatePosition(coordinate); } catch (_) { return; }
      preview = coordinate; render(); return;
    }
    if (drag.pointerId !== event.pointerId || drag.featureId !== selected || drag.session !== edit) return;
    const box = canvas.getBoundingClientRect(), ll = map.unproject([event.clientX - box.left, event.clientY - box.top]);
    const coordinate = [ll.lng, ll.lat];
    try { validatePosition(coordinate); } catch (_) { return; }
    const feature = features.find(f => String(f.id) === selected);
    if (!feature) { abortDrag(); return; }
    const originalShape = drag.before.find(f => String(f.id) === drag.featureId);
    if (drag.objectMode === "rotate") {
      try {
        const point = shapeProject(coordinate), pivot = drag.pivot;
        if (Math.hypot(point[0]-pivot[0], point[1]-pivot[1]) < 1e-12 || Math.abs(ll.lng-drag.start.lng) > 180) return;
        const angle = Math.atan2(point[1]-pivot[1], point[0]-pivot[0]) - drag.startAngle;
        const candidate = Math.abs(Math.sin(angle)) < 1e-12 && Math.cos(angle) > 0 ? clone(originalShape) : rotateObject(originalShape, angle, pivot);
        validateFeatures([candidate]);
        feature.geometry = candidate.geometry; feature.properties = candidate.properties;
      } catch (_) { return; }
    }
    else if (recognizedShape(originalShape)) {
      try {
        const next = transformShape(originalShape, coordinate, drag.path, [ll.lng - drag.start.lng, ll.lat - drag.start.lat]);
        validateFeatures([{ ...feature, geometry: next.geometry }]);
        feature.geometry.coordinates = next.geometry.coordinates; feature.properties.helperShape = next.shape;
      } catch (_) { return; }
    }
    else if (drag.path === undefined) {
      const original = drag.before.find(f => String(f.id) === drag.featureId);
      const delta = [ll.lng - drag.start.lng, ll.lat - drag.start.lat];
      // Stop at world/Mercator boundaries atomically; never wrap or clamp vertices independently.
      const polygon = original.geometry.type === "Polygon";
      const positions = polygon ? original.geometry.coordinates.flat() : original.geometry.coordinates;
      if (Math.abs(delta[0]) > 180 || positions.some(c => Math.abs(c[1]) > 85.0511287798066)) return;
      const translate = c => [c[0] + delta[0], c[1] + delta[1], ...c.slice(2)];
      const translated = polygon ? original.geometry.coordinates.map(ring => ring.map(translate)) : positions.map(translate);
      const candidate = polygon ? translated.flat() : translated;
      try { candidate.forEach(validatePosition); } catch (_) { return; }
      if (candidate.some(c => Math.abs(c[1]) > 85.0511287798066)) return;
      feature.geometry.coordinates = translated;
    }
    else if (isMapPin(feature)) {
      const original = drag.before.find(f => String(f.id) === drag.featureId).geometry.coordinates;
      const next = [original[0] + ll.lng - drag.start.lng, original[1] + ll.lat - drag.start.lat, ...original.slice(2)];
      try { validatePosition(next); } catch (_) { return; }
      feature.geometry.coordinates = next;
    }
    else if (feature.geometry.type === "Point") feature.geometry.coordinates = coordinate;
    else if (feature.geometry.type === "LineString") feature.geometry.coordinates[drag.path[0]] = coordinate;
    else { const [r, i] = drag.path; feature.geometry.coordinates[r][i] = coordinate; if (i === 0) feature.geometry.coordinates[r][feature.geometry.coordinates[r].length - 1] = [...coordinate]; }
    revision++; drag.moved = true; render(); publishState(); event.preventDefault();
  }
  function pointerUp(event) {
    if (dispatchDepth || !drag || drag.pointerId !== event.pointerId) return;
    const next = clone(features), before = drag.before, moved = drag.moved, session = edit, selection = selected, currentMode = mode;
    abortDrag(); if (destroyed || edit !== session || selected !== selection || mode !== currentMode) return;
    if (moved) suppressClick = { timeStamp: event.timeStamp, x: event.clientX, y: event.clientY };
    if (moved) { try { validateFeatures(next); } catch (error) { refresh(); reportError(error); return; } commit(next); }
    else features = before;
  }
  function keydown(event) {
    if (destroyed || event.target !== canvas || event.altKey) return;
    if (selectToggle && mode === "pan" && event.key !== "Escape") return;
    let handled = true;
    try {
      if (event.key === "Escape") cancel();
      else if (event.key === "Enter") { if (mode === "pin" || mode === "point" || mode === "line" || mode === "path" || mode === "polygon" || mode === "circle" || mode === "rectangle") click({ point: map.project(map.getCenter()), lngLat: map.getCenter() }); }
      else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") event.shiftKey ? redo() : undo();
      else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "y") redo();
      else if (event.key === "Delete" || event.key === "Backspace") deleteSelected();
      else handled = false;
    } finally { if (handled) event.preventDefault(); }
  }
  function undo() {
    if (dispatchDepth) return false;
    if (destroyed || drag) return;
    if (styleChange) { cancelStyleChange(styleChange.id); return; }
    if (edit) { if (edit.undo.length) { const before = clone(features); edit.redo.push(before); features = edit.undo.pop(); publishChanges(before); } return; }
    if (draft.length) { draftRedo.push(draft.pop()); preview = null; refresh(); return; }
    if (!undoStack.length) return;
    const before = clone(features); redoStack.push(before); revision++; features = undoStack.pop(); publishChanges(before);
  }
  function redo() {
    if (dispatchDepth) return false;
    if (destroyed || drag) return;
    if (styleChange) { cancelStyleChange(styleChange.id); return; }
    if (edit) { if (edit.redo.length) { const before = clone(features); edit.undo.push(before); features = edit.redo.pop(); publishChanges(before); } return; }
    if (draftRedo.length) { draft.push(draftRedo.pop()); refresh(); return; }
    if (draft.length || !redoStack.length) return;
    const before = clone(features); undoStack.push(before); revision++; features = redoStack.pop(); publishChanges(before);
  }
  function setFeatures(input) {
    if (dispatchDepth) return false;
    if (destroyed) return;
    const next = validateFeatures(input); // Validate atomically before cancelling interaction.
    if (edit) return false;
    if (styleChange) cancelStyleChange(styleChange.id);
    abortDrag(); if (destroyed) return false; draft = []; draftRedo = []; preview = null; undoStack = []; redoStack = [];
    const before = features; revision++; features = next;
    if (objectMode === "rotate" && !canRotate(features.find(f=>String(f.id)===selected))) objectMode = "move";
    publishChanges(before);
  }
  function requestDeletion(action) {
    if (selectToggle && mode === "pan" && action === "delete") return false;
    if (dispatchDepth || destroyed || drag || styleChange || requestingDelete || (edit && (action !== "delete" || !equal(edit.before, features))) || (action === "delete" && selected === null)) return false;
    // A draft-only clear retains the historical behavior but also goes through the gate.
    if (action === "clear" && !features.length && !draft.length && !draftRedo.length) return false;
    const expectedRevision = revision, expectedEdit = edit;
    const featureIds = Object.freeze(action === "delete" ? features.filter(f => String(f.id) === selected).map(f => f.id) : features.map(f => f.id));
    let consumed = false;
    const confirm = () => {
      // Calling from inside the hook cannot recursively bypass confirmation.
      if (dispatchDepth || requestingDelete) return false;
      if (consumed) return false;
      consumed = true;
      if (destroyed || drag || revision !== expectedRevision || edit !== expectedEdit || (edit && !equal(edit.before, features))) return false;
      // Only a confirmed clean-object deletion closes its session; record deletion globally.
      if (action === "delete") {
        edit = null;
        commit(features.filter(f => String(f.id) !== String(featureIds[0])));
        if (expectedEdit && !destroyed) emit("editchange", null);
      }
      else { draft = []; draftRedo = []; preview = null; commit([]); refresh(); }
      return true;
    };
    const request = Object.freeze({ action, featureIds, revision: expectedRevision, confirm,
      cancel() { if (consumed) return false; consumed = true; return true; } });
    if (typeof options.beforeDelete !== "function") return confirm();
    let allowed = false;
    requestingDelete = true;
    try {
      const result = options.beforeDelete(request);
      allowed = result === true;
      // Async hooks never authorize/replay a mutation; isolate a rejected Promise.
      if (result instanceof Promise) result.catch(error => { request.cancel(); reportError(error); });
    } catch (error) { request.cancel(); reportError(error); }
    finally { requestingDelete = false; }
    return allowed ? confirm() : false;
  }
  function deleteSelected() { return requestDeletion("delete"); }
  function clear() { return requestDeletion("clear"); }
  function destroy(removed = false) {
    if (dispatchDepth && !removed) return false;
    if (destroyed) return;
    abortDrag(false); if (styleChange) { features = styleChange.before; styleChange = null; } if (edit) { features = edit.before; edit = null; }
    restoreNavigation(); revision++; destroyed = true;
    mapOffs.splice(0).forEach(off => off()); domOffs.splice(0).forEach(off => off()); listeners.clear();
    canvas.style.cursor = oldCursor;
    pinRenderer?.destroy(removed); pinRenderer = null;
    if (!removed) {
      [...ownedLayers].reverse().forEach(id => { if (map.getLayer(id)) map.removeLayer(id); });
      if (ownedSource && map.getSource(sourceId)) map.removeSource(sourceId);
    }
    ownedLayers.clear(); ownedSource = false; draft = []; draftRedo = []; preview = null; undoStack = []; redoStack = [];
  }
  bindMap("dblclick", event => { if (mode === "path" && !destroyed && !dispatchDepth) { event.preventDefault?.(); finish(); } });
  bindMap("move", () => {
    if (!destroyed && !drag && draft.length && ["circle", "rectangle"].includes(mode)) { const center = map.getCenter(); preview = [center.lng, center.lat]; render(); }
  });
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
  bindDom(canvas, "pointercancel", () => { if (!dispatchDepth) abortDrag(); }); bindDom(canvas, "lostpointercapture", () => { if (drag && !dispatchDepth) abortDrag(); }); bindDom(canvas, "keydown", keydown);
  bindDom(globalThis, "blur", () => { if (drag && !dispatchDepth) abortDrag(); });
  // Style availability permits custom resources before base-source tiles finish.
  try { hydrate(); } catch (error) { destroy(); throw error; }
  return { on, setObjectMode, getObjectMode: () => objectMode, setMode, setFeatures, validateFeatures, beginStyleChange, previewStyle, finishStyleChange, cancelStyleChange, settleStyleChange, beginEdit, acceptEdit, rollbackEdit, updateFeature, getFeatureStyle, getDrawingKind, getFeatures: () => clone(editBehavior === "immediate" ? styleChange?.before || drag?.before || features : features), getMode: () => mode, getCapabilities: capabilities, finish, cancel, undo, redo, deleteSelected, clear, destroy: () => destroy(),
    getPinBounds: () => pinRenderer?.getBounds() || [],
    getState: () => ({ mode, objectMode, selectedFeatureId: selected, features: clone(features), draft: clone(draft), preview: clone(preview), editSession: getEditState(), styleChange: getStyleChange(), anchor: anchor(), dragging: !!drag, revision, destroyed, sourceId, layerIds: [...layers] }) };
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
    if (Object.hasOwn(feature.properties || {}, "helperStyle")) validateStyle(feature.properties.helperStyle);
    const geometry = feature.geometry;
    if (feature.properties?.helperDrawingKind === "pin" && (geometry?.type !== "Point" || Math.abs(geometry.coordinates?.[1]) > 85.0511287798066)) throw new TypeError("Pin metadata requires a Point within Mercator latitude bounds.");
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

function validateStyle(style) {
  if (!style || typeof style !== "object" || Array.isArray(style) || Object.keys(style).some(key => !["fill", "stroke"].includes(key))) throw new TypeError("helperStyle supports fill and stroke RGBA objects only.");
  for (const color of Object.values(style)) {
    if (!color || typeof color !== "object" || Array.isArray(color) || Object.keys(color).length !== 4 || Object.keys(color).some(key => !["r", "g", "b", "a"].includes(key)) || ![color.r, color.g, color.b].every(value => Number.isInteger(value) && value >= 0 && value <= 255) || !Number.isFinite(color.a) || color.a < 0 || color.a > 1) throw new TypeError("Fill and stroke require r, g, b integers from 0 to 255 and alpha a from 0 to 1.");
  }
}

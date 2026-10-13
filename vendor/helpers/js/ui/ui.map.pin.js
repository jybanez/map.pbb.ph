// Self-contained procedural 3D geometry, shared by drawing and read-only maps.
export const isMapPin = feature => feature?.geometry?.type === 'Point' && feature.properties?.helperDrawingKind === 'pin';
let sequence = 0;
const transform = (m, p) => [0, 1, 2, 3].map(i => m[i] * p[0] + m[i + 4] * p[1] + m[i + 8] * p[2] + m[i + 12] * (p[3] ?? 1));
function mesh() {
  const vertices = [], triangles = [];
  const profile = [[0, 0], [.15, .06], [.35, .20], [.52, .31], [.70, .34], [.85, .29], [.96, .16], [1, 0]];
  for (let row = 0; row < profile.length; row++) {
    const [height, radius] = profile[row];
    for (let i = 0; i <= 32; i++) {
      const angle = i / 32 * Math.PI * 2;
      vertices.push([Math.sin(angle) * radius, -height, (1 + Math.cos(angle)) * radius * .25]);
      if (row && i) { const a = row * 33 + i, b = a - 33; triangles.push([a - 1, b - 1, b, 0], [a - 1, b, a, 0]); }
    }
  }
  // Recessed circular face with a raised rim; this is mesh geometry, not a sprite.
  const center = vertices.push([0, -.70, .12]) - 1;
  for (let i = 0; i <= 32; i++) {
    const angle = i / 32 * Math.PI * 2;
    vertices.push([Math.sin(angle) * .135, -.70 + Math.cos(angle) * .135, .12]);
    if (i) triangles.push([center, center + i, center + i + 1, 1]);
  }
  const rim = vertices.length;
  for (let i = 0; i <= 32; i++) {
    const angle = i / 32 * Math.PI * 2;
    for (const [r, z] of [[.135, .12], [.17, .169]]) vertices.push([Math.sin(angle) * r, -.70 + Math.cos(angle) * r, z]);
    if (i) { const a = rim + i * 2; triangles.push([a - 2, a - 1, a, 2], [a, a - 1, a + 1, 2]); }
  }
  const data = [];
  for (const [ia, ib, ic, material] of triangles) {
    const a = vertices[ia], b = vertices[ib], c = vertices[ic], u = b.map((v, i) => v - a[i]), v = c.map((n, i) => n - a[i]);
    const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]], length = Math.hypot(...n) || 1;
    for (const p of [a, b, c]) data.push(...p, ...n.map(x => x / length), material);
  }
  return { data: new Float32Array(data), vertices };
}
const MODEL = mesh();
export function createMapPinRenderer(map, options = {}) {
  const engine = options.maplibre || globalThis.maplibregl;
  if (!map?.addLayer || !engine?.MercatorCoordinate) throw new TypeError('Map pin renderer requires MapLibre and MercatorCoordinate.');
  const id = options.id || `helper-pin-${++sequence}`;
  if (map.getStyle() && map.getLayer(id)) throw new Error('Pin renderer layer ID already exists.');
  let features = [], selected = null, visible = true, destroyed = false, owned = false, program, buffer, locations, glContext, vao, vaoApi;
  const bounds = new Map();
  const layer = { id, type: 'custom', renderingMode: '3d',
    onAdd(_, gl) {
      glContext = gl;
      const extension = gl.createVertexArray ? null : gl.getExtension('OES_vertex_array_object');
      vaoApi = gl.createVertexArray ? { create: () => gl.createVertexArray(), bind: value => gl.bindVertexArray(value), remove: value => gl.deleteVertexArray(value) } : extension ? { create: () => extension.createVertexArrayOES(), bind: value => extension.bindVertexArrayOES(value), remove: value => extension.deleteVertexArrayOES(value) } : null;
      vao = vaoApi?.create();
      if (vao) vaoApi.bind(vao);
      const compile = (kind, source) => { const shader = gl.createShader(kind); gl.shaderSource(shader, source); gl.compileShader(shader); if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) { const error = gl.getShaderInfoLog(shader); gl.deleteShader(shader); throw Error(error); } return shader; };
      const vertex = compile(gl.VERTEX_SHADER, 'attribute vec3 position; attribute vec3 normal; attribute float material; uniform mat4 matrix; uniform vec4 anchor; uniform float scale; uniform vec3 lightDirection; varying float shade; varying float face; varying vec3 modelPosition; void main(){gl_Position=anchor+matrix*vec4(position*scale,0.0); shade=.55+.45*abs(dot(normal,normalize(lightDirection)));face=material;modelPosition=position;}');
      const fragment = compile(gl.FRAGMENT_SHADER, 'precision mediump float; uniform vec4 color; uniform vec4 stroke; uniform bool selected; varying float shade; varying float face; varying vec3 modelPosition; void main(){if(face<.5&&modelPosition.z>.08&&length(vec2(modelPosition.x,modelPosition.y+.70))<.135)discard; float alpha=face>1.5?(selected?1.0:stroke.a):color.a;if(alpha<=0.0)discard;vec3 base=face>.5&&face<1.5?vec3(.07,.11,.16):face>1.5?(selected?vec3(1.0,.72,.22):stroke.rgb):color.rgb; gl_FragColor=vec4(base*shade,alpha);}');
      program = gl.createProgram(); gl.attachShader(program, vertex); gl.attachShader(program, fragment); gl.linkProgram(program); gl.deleteShader(vertex); gl.deleteShader(fragment);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw Error(gl.getProgramInfoLog(program));
      locations = Object.fromEntries(['matrix', 'anchor', 'scale', 'color', 'stroke', 'selected', 'lightDirection'].map(n => [n, gl.getUniformLocation(program, n)]));
      locations.position = gl.getAttribLocation(program, 'position'); locations.normal = gl.getAttribLocation(program, 'normal'); locations.material = gl.getAttribLocation(program, 'material');
      buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer); gl.bufferData(gl.ARRAY_BUFFER, MODEL.data, gl.STATIC_DRAW);
      if (vao) vaoApi.bind(null);
    },
    render(gl, matrix) {
      bounds.clear(); if (!visible || !features.length || !program) return;
      const canvas = map.getCanvas(), width = canvas.clientWidth, height = canvas.clientHeight;
      if (!width || !height) return;
      if (vao) vaoApi.bind(vao);
      gl.useProgram(program); gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      for (const [name, size, offset] of [['position', 3, 0], ['normal', 3, 12], ['material', 1, 24]]) { gl.enableVertexAttribArray(locations[name]); gl.vertexAttribPointer(locations[name], size, gl.FLOAT, false, 28, offset); }
      gl.enable(gl.DEPTH_TEST); gl.depthMask(true); gl.disable(gl.CULL_FACE); gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      const oriented = Array.from(matrix);
      // Follow camera heading while retaining real map-space depth and pitch.
      // This keeps a recognizable upright pin instead of a sideways, enlarged one.
      const bearing = map.getBearing() * Math.PI / 180, cosine = Math.cos(bearing), sine = Math.sin(bearing);
      for (let i = 0; i < 4; i++) { oriented[i] = matrix[i] * cosine + matrix[i + 4] * sine; oriented[i + 4] = -matrix[i] * sine + matrix[i + 4] * cosine; }
      // A partial upright response avoids near-horizon foreshortening inflation,
      // while preserving a visible change in depth/perspective as pitch changes.
      const tilt = map.getPitch() * Math.PI / 360, ct = Math.cos(tilt), st = Math.sin(tilt);
      for (let i = 0; i < 4; i++) { const y = oriented[i + 4], z = oriented[i + 8]; oriented[i + 4] = y * ct - z * st; oriented[i + 8] = y * st + z * ct; }
      const lightY = .4 * sine - .6 * cosine;
      gl.uniform3f(locations.lightDirection, -.4 * cosine - .6 * sine, lightY * ct - st, lightY * st + ct);
      for (const feature of features) {
        const coordinate = feature.geometry.coordinates;
        // MapLibre 4.6 custom-layer matrices use elevation relative to the camera target.
        const elevation = map.queryTerrainElevation?.(coordinate) || 0;
        const longitude = coordinate[0] + (map.getRenderWorldCopies?.() === false ? 0 : 360 * Math.round((map.getCenter().lng - coordinate[0]) / 360));
        const mercator = engine.MercatorCoordinate.fromLngLat([longitude, coordinate[1]], elevation);
        const anchor = transform(matrix, [mercator.x, mercator.y, mercator.z, 1]);
        if (anchor[3] <= 0) continue;
        if (Math.abs(anchor[0] / anchor[3]) > 1 + 128 / width || Math.abs(anchor[1] / anchor[3]) > 1 + 128 / height) continue;
        const screen = p => { const q = transform(oriented, [...p, 0]); return [(anchor[0] + q[0]) / (anchor[3] + q[3]) * width / 2, -(anchor[1] + q[1]) / (anchor[3] + q[3]) * height / 2]; };
        let scale = anchor[3] / (Math.hypot(matrix[4] * width, matrix[5] * height) || 1) * 64;
        // Normalize the projected mesh itself, independent of zoom and distance.
        for (let pass = 0; pass < 3; pass++) { const ys = MODEL.vertices.map(v => screen(v.map(n => n * scale))[1]); scale *= 32 / (Math.max(...ys) - Math.min(...ys) || 32); }
        const projected = MODEL.vertices.map(v => screen(v.map(n => n * scale)));
        const xs = projected.map(p => p[0] + width / 2), ys = projected.map(p => p[1] + height / 2);
        bounds.set(String(feature.id), { left: Math.min(...xs), right: Math.max(...xs), top: Math.min(...ys), bottom: Math.max(...ys), tip: { x: (anchor[0] / anchor[3] + 1) * width / 2, y: (1 - anchor[1] / anchor[3]) * height / 2 } });
        const fill = feature.properties?.helperStyle?.fill;
        const color = fill ? [fill.r / 255, fill.g / 255, fill.b / 255, fill.a] : [.20, .65, .96, 1];
        const rim = feature.properties?.helperStyle?.stroke;
        const stroke = rim ? [rim.r / 255, rim.g / 255, rim.b / 255, rim.a] : [color[0] * .65, color[1] * .65, color[2] * .65, 1];
        gl.depthMask(color[3] === 1 && stroke[3] === 1);
        gl.uniform4fv(locations.stroke, stroke);
        gl.uniformMatrix4fv(locations.matrix, false, oriented); gl.uniform4fv(locations.anchor, anchor); gl.uniform1f(locations.scale, scale); gl.uniform4fv(locations.color, color); gl.uniform1i(locations.selected, String(feature.id) === selected ? 1 : 0);
        gl.drawArrays(gl.TRIANGLES, 0, MODEL.data.length / 7);
      }
      gl.depthMask(true);
      if (vao) vaoApi.bind(null);
    },
    onRemove(_, gl) { if (buffer) gl.deleteBuffer(buffer); if (program) gl.deleteProgram(program); if (vao) vaoApi.remove(vao); buffer = program = vao = null; bounds.clear(); }
  };
  function hydrate() { if (!destroyed && features.length && map.getStyle() && !map.getLayer(id)) { map.addLayer(layer); owned = true; } }
  function style() { queueMicrotask(() => { if (!destroyed) hydrate(); }); }
  function removed() { destroy(true); }
  map.on('style.load', hydrate); map.on('styledata', style); map.on('remove', removed);
  function update(next, state = {}) {
    if (destroyed) return;
    if (!Array.isArray(next)) throw new TypeError('Pin renderer features must be an array.');
    const ids = new Set();
    for (const feature of next.filter(isMapPin)) {
      const c = feature.geometry.coordinates;
      if ((typeof feature.id !== 'string' && typeof feature.id !== 'number') || String(feature.id) === '' || (typeof feature.id === 'number' && !Number.isFinite(feature.id)) || ids.has(String(feature.id)) || !Array.isArray(c) || !Number.isFinite(c[0]) || !Number.isFinite(c[1]) || Math.abs(c[1]) > 85.0511287798066) throw new TypeError('Pins require unique IDs and finite Mercator geographic coordinates.');
      for (const color of Object.values(feature.properties?.helperStyle || {})) if (!color || ![color.r, color.g, color.b].every(n => Number.isInteger(n) && n >= 0 && n <= 255) || !Number.isFinite(color.a) || color.a < 0 || color.a > 1) throw new TypeError('Pin colors require integer RGB 0–255 and alpha 0–1.');
      ids.add(String(feature.id));
    }
    const pins = next.filter(isMapPin);
    const signature = list => JSON.stringify(list.map(f => [f.id, f.geometry.coordinates]));
    if (signature(features) !== signature(pins) || state.visible === false) bounds.clear();
    features = structuredClone(pins);
    if (Object.hasOwn(state, 'selectedFeatureId')) selected = state.selectedFeatureId == null ? null : String(state.selectedFeatureId);
    if (Object.hasOwn(state, 'visible')) visible = state.visible !== false;
    hydrate(); map.triggerRepaint();
  }
  function destroy(removed = false) { if (destroyed) return; destroyed = true; map.off('style.load', hydrate); map.off('styledata', style); map.off('remove', removedHandler); if (!removed && owned && map.getLayer(id)) map.removeLayer(id); else if (glContext && program) layer.onRemove(map, glContext); bounds.clear(); features = []; }
  const removedHandler = removed;
  try { update(options.features || [], options); } catch (error) { destroy(); throw error; }
  return { update, destroy, getBounds: () => structuredClone([...bounds].map(([featureId, box]) => ({ featureId, ...box }))), hitTest(p, radius = 0) { if (!visible || destroyed) return null; return [...bounds].reverse().find(([, b]) => p.x >= b.left - radius && p.x <= b.right + radius && p.y >= b.top - radius && p.y <= b.bottom + radius)?.[0] ?? null; } };
}

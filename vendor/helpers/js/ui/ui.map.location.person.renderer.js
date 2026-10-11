// Original procedural mesh and renderer, authored for Helper under the repository ISC license.
// Coordinates: x east, y north, z up. No face or heading indicator.
export function createPersonMesh() {
  const data = [];
  const blue = [.08, .38, .85], head = [.82, .87, .93], base = [.14, .48, .92];
  function vertex(p, n, color) { data.push(...p, ...n, ...color); }
  function ellipsoid(center, radii, color) {
    function point(a, b) {
      const n = [Math.sin(a) * Math.cos(b), Math.sin(a) * Math.sin(b), Math.cos(a)];
      const normal = n.map((v, i) => v / radii[i]), length = Math.hypot(...normal);
      return { p: n.map((v, i) => center[i] + v * radii[i]), n: normal.map((v) => v / length) };
    }
    for (let row = 0; row < 10; row++) for (let col = 0; col < 20; col++) {
      const a = row * Math.PI / 10, b = col * Math.PI / 10;
      const corners = [point(a, b), point(a + Math.PI / 10, b), point(a + Math.PI / 10, b + Math.PI / 10), point(a, b + Math.PI / 10)];
      for (const index of [0, 1, 2, 0, 2, 3]) vertex(corners[index].p, corners[index].n, color);
    }
  }
  // Low circular pedestal, bottom exactly z=0.
  for (let i = 0; i < 32; i++) {
    const a = i * Math.PI / 16, b = (i + 1) * Math.PI / 16;
    const p = [.5 * Math.cos(a), .5 * Math.sin(a)], q = [.5 * Math.cos(b), .5 * Math.sin(b)];
    for (const v of [[0, 0, .09], [...p, .09], [...q, .09]]) vertex(v, [0, 0, 1], base);
    for (const v of [[...p, 0], [...q, 0], [...q, .09], [...p, 0], [...q, .09], [...p, .09]]) vertex(v, [Math.cos(a), Math.sin(a), 0], base);
  }
  ellipsoid([0, 0, 1.57], [.23, .23, .23], head);
  ellipsoid([0, 0, 1.04], [.28, .19, .39], blue);
  for (const sign of [-1, 1]) {
    ellipsoid([sign * .34, 0, 1.03], [.10, .11, .30], blue);
    ellipsoid([sign * .13, 0, .42], [.11, .12, .34], blue);
  }
  return new Float32Array(data);
}

// Device-forward arrow: geographic north is local +Y. No borrowed assets.
export function createDirectionMesh() {
  const data = [], color = [1, .68, .08];
  // Raised slightly above the base to avoid coplanar depth fighting.
  const triangles = [
    [[-.07,.20,.105],[.07,.20,.105],[.07,.51,.105]],
    [[-.07,.20,.105],[.07,.51,.105],[-.07,.51,.105]],
    [[-.21,.48,.105],[.21,.48,.105],[0,.86,.105]],
  ];
  for (const triangle of triangles) for (const point of triangle) data.push(...point,0,0,1,...color);
  return new Float32Array(data);
}

export function createPersonRenderer(gl, mesh, directionMesh = null) {
  if (!gl || gl.isContextLost()) throw new Error("WebGL context unavailable.");
  const webgl2 = typeof gl.createVertexArray === "function";
  const ext = webgl2 ? null : gl.getExtension("OES_vertex_array_object");
  if (!webgl2 && !ext) throw new Error("Vertex array support unavailable.");
  const vaoApi = webgl2 ? { create: () => gl.createVertexArray(), bind: (v) => gl.bindVertexArray(v), remove: (v) => gl.deleteVertexArray(v), binding: gl.VERTEX_ARRAY_BINDING }
    : { create: () => ext.createVertexArrayOES(), bind: (v) => ext.bindVertexArrayOES(v), remove: (v) => ext.deleteVertexArrayOES(v), binding: ext.VERTEX_ARRAY_BINDING_OES };
  let program = null, buffer = null, vao = null, disposed = false;
  const shaders = [];
  const previousVao = gl.getParameter(vaoApi.binding), previousBuffer = gl.getParameter(gl.ARRAY_BUFFER_BINDING);
  function dispose() {
    if (disposed) return;
    disposed = true;
    if (vao) vaoApi.remove(vao);
    if (buffer) gl.deleteBuffer(buffer);
    if (program) gl.deleteProgram(program);
    shaders.splice(0).forEach((shader) => gl.deleteShader(shader));
  }
  function shader(type, source) {
    const value = gl.createShader(type);
    if (!value) throw new Error("Cannot allocate location shader.");
    shaders.push(value); gl.shaderSource(value, source); gl.compileShader(value);
    if (!gl.getShaderParameter(value, gl.COMPILE_STATUS)) throw new Error(`Location shader compilation failed: ${gl.getShaderInfoLog(value)}`);
    return value;
  }
  const prefix = webgl2 ? "#version 300 es\n" : "";
  const attribute = webgl2 ? "in" : "attribute", output = webgl2 ? "out" : "varying", input = webgl2 ? "in" : "varying";
  try {
    program = gl.createProgram(); buffer = gl.createBuffer(); vao = vaoApi.create();
    if (!program || !buffer || !vao) throw new Error("Cannot allocate location WebGL resources.");
    gl.attachShader(program, shader(gl.VERTEX_SHADER, `${prefix}
      precision highp float;
      ${attribute} vec3 a_position; ${attribute} vec3 a_normal; ${attribute} vec3 a_color;
      uniform mat4 u_matrix; ${output} vec3 v_color;
      void main() { gl_Position = u_matrix * vec4(a_position, 1.0);
        float light = .55 + .45 * max(dot(normalize(a_normal), normalize(vec3(-.3,-.5,1.0))), 0.0);
        v_color = a_color * light; }`));
    gl.attachShader(program, shader(gl.FRAGMENT_SHADER, `${prefix}
      precision mediump float; ${input} vec3 v_color;
      ${webgl2 ? "out vec4 outputColor;" : ""}
      void main() { ${webgl2 ? "outputColor" : "gl_FragColor"} = vec4(v_color, 1.0); }`));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(`Location shader link failed: ${gl.getProgramInfoLog(program)}`);
    const vertices = directionMesh ? new Float32Array(mesh.length + directionMesh.length) : mesh;
    if (directionMesh) { vertices.set(mesh); vertices.set(directionMesh, mesh.length); }
    vaoApi.bind(vao); gl.bindBuffer(gl.ARRAY_BUFFER, buffer); gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    ["a_position", "a_normal", "a_color"].forEach((name, index) => {
      const location = gl.getAttribLocation(program, name);
      if (location < 0) throw new Error("Location shader attribute missing.");
      gl.enableVertexAttribArray(location); gl.vertexAttribPointer(location, 3, gl.FLOAT, false, 36, index * 12);
    });
  } catch (error) { dispose(); throw error; }
  finally { vaoApi.bind(previousVao); gl.bindBuffer(gl.ARRAY_BUFFER, previousBuffer); }
  const uniform = gl.getUniformLocation(program, "u_matrix");
  shaders.splice(0).forEach((value) => { gl.detachShader(program, value); gl.deleteShader(value); });
  return {
    dispose,
    draw(matrix, showDirection = false) {
      if (disposed || gl.isContextLost()) throw new Error("Location WebGL resources are unavailable.");
      const old = { program: gl.getParameter(gl.CURRENT_PROGRAM), vao: gl.getParameter(vaoApi.binding),
        buffer: gl.getParameter(gl.ARRAY_BUFFER_BINDING), depth: gl.isEnabled(gl.DEPTH_TEST),
        cull: gl.isEnabled(gl.CULL_FACE), blend: gl.isEnabled(gl.BLEND), mask: gl.getParameter(gl.DEPTH_WRITEMASK) };
      try {
        gl.useProgram(program); vaoApi.bind(vao); gl.enable(gl.DEPTH_TEST); gl.depthMask(true);
        gl.disable(gl.CULL_FACE); gl.disable(gl.BLEND);
        gl.uniformMatrix4fv(uniform, false, matrix);
        gl.drawArrays(gl.TRIANGLES, 0, (mesh.length + (showDirection ? directionMesh?.length || 0 : 0)) / 9);
        if (gl.getError() !== gl.NO_ERROR) throw new Error("Location WebGL draw failed.");
      } finally {
        gl.useProgram(old.program); vaoApi.bind(old.vao); gl.bindBuffer(gl.ARRAY_BUFFER, old.buffer);
        for (const [capability, enabled] of [[gl.DEPTH_TEST, old.depth], [gl.CULL_FACE, old.cull], [gl.BLEND, old.blend]]) {
          if (enabled) gl.enable(capability); else gl.disable(capability);
        }
        gl.depthMask(old.mask);
      }
    },
  };
}

// Geographic construction shared by previews, resize handles and committed shapes.
const EARTH_RADIUS = 6371008.8;
const LIMIT = 85.0511287798066;
const radians = value => value * Math.PI / 180;
const degrees = value => value * 180 / Math.PI;
// Normalized Web Mercator plane: x increases east, y increases north.
export const shapeProject = p => [p[0] / 360, Math.log(Math.tan(Math.PI / 4 + radians(p[1]) / 2)) / (2 * Math.PI)];
export const shapeUnproject = p => [p[0] * 360, degrees(2 * Math.atan(Math.exp(p[1] * 2 * Math.PI)) - Math.PI / 2)];
const turn = (p, angle) => [p[0] * Math.cos(angle) - p[1] * Math.sin(angle), p[0] * Math.sin(angle) + p[1] * Math.cos(angle)];
function position(value) {
  if (!Array.isArray(value) || value.length !== 2 || !value.every(Number.isFinite) || Math.abs(value[0]) > 180 || Math.abs(value[1]) > LIMIT) throw new RangeError("Shape exceeds longitude or Mercator latitude bounds.");
}
export function shapeDistance(a, b) {
  const latitude = radians(b[1] - a[1]), longitude = radians(b[0] - a[0]);
  const h = Math.sin(latitude / 2) ** 2 + Math.cos(radians(a[1])) * Math.cos(radians(b[1])) * Math.sin(longitude / 2) ** 2;
  return 2 * EARTH_RADIUS * Math.asin(Math.sqrt(Math.min(1, Math.max(0, h))));
}
export function shapeGeometry(shape) {
  if (!shape || typeof shape !== "object" || Array.isArray(shape) || Object.keys(shape).some(key => !(shape.kind === "circle" ? ["kind", "center", "radiusMeters"] : shape.projection === "mercator" ? ["kind", "projection", "center", "width", "height", "angleDegrees"] : ["kind", "bounds"]).includes(key))) throw new TypeError("Invalid shape metadata schema.");
  let ring;
  if (shape?.kind === "circle") {
    position(shape.center);
    const { center, radiusMeters } = shape;
    if (!Number.isFinite(radiusMeters) || radiusMeters <= 0 || radiusMeters >= Math.PI * EARTH_RADIUS / 2) throw new RangeError("Circle radius must be positive and smaller than a hemisphere.");
    const latitude = radians(center[1]), longitude = radians(center[0]), distance = radiusMeters / EARTH_RADIUS;
    ring = Array.from({ length: 64 }, (_, i) => {
      const bearing = i * Math.PI / 32;
      const lat = Math.asin(Math.sin(latitude) * Math.cos(distance) + Math.cos(latitude) * Math.sin(distance) * Math.cos(bearing));
      const lng = longitude + Math.atan2(Math.sin(bearing) * Math.sin(distance) * Math.cos(latitude), Math.cos(distance) - Math.sin(latitude) * Math.sin(lat));
      return [degrees(lng), degrees(lat)];
    });
    // Check extrema as well as sampled vertices; circles cannot cross the map boundary.
    if (Math.abs(center[1]) + degrees(distance) > LIMIT) throw new RangeError("Circle crosses the Mercator latitude boundary.");
    const extent = degrees(Math.asin(Math.sin(distance) / Math.cos(latitude)));
    if (!Number.isFinite(extent) || Math.abs(center[0]) + extent > 180) throw new RangeError("Circle crosses the longitude boundary.");
  } else if (shape?.kind === "rectangle") {
    if (shape.projection === "mercator") {
      position(shape.center);
      if (![shape.width, shape.height, shape.angleDegrees].every(Number.isFinite) || shape.width <= 0 || shape.height <= 0) throw new RangeError("Oriented rectangle requires positive finite Mercator width and height and a finite angle.");
      const center = shapeProject(shape.center);
      ring = [[-1,-1],[1,-1],[1,1],[-1,1]].map(([x,y]) => {
        const offset = turn([x * shape.width / 2, y * shape.height / 2], radians(shape.angleDegrees));
        return shapeUnproject(center.map((n,i) => n + offset[i]));
      });
    } else {
    const { bounds } = shape;
    if (!Array.isArray(bounds) || bounds.length !== 2) throw new TypeError("Rectangle requires southwest and northeast bounds.");
    bounds.forEach(position);
    const [[west, south], [east, north]] = bounds;
    if (!(west < east && south < north)) throw new RangeError("Rectangle bounds must have positive width and height.");
    ring = [[west, south], [east, south], [east, north], [west, north]];
    }
  } else throw new TypeError("Unknown shape kind.");
  ring.forEach(position);
  return { type: "Polygon", coordinates: [[...ring, [...ring[0]]]] };
}
export function shapeFromPoints(kind, first, second) {
  position(first); position(second);
  if (Math.abs(second[0] - first[0]) > 180) throw new RangeError("Shape cannot cross a wrapped world copy.");
  const shape = kind === "circle" ? { kind, center: [...first], radiusMeters: shapeDistance(first, second) } : { kind, bounds: [[Math.min(first[0], second[0]), Math.min(first[1], second[1])], [Math.max(first[0], second[0]), Math.max(first[1], second[1])]] };
  return { shape, geometry: shapeGeometry(shape) };
}
export function recognizedShape(feature) {
  const shape = feature?.properties?.helperShape;
  if (feature?.geometry?.type !== "Polygon" || !shape) return null;
  try {
    const expected = shapeGeometry(shape).coordinates;
    const actual = feature.geometry.coordinates;
    if (actual.length !== 1 || actual[0].length !== expected[0].length || !actual[0].every((p, i) => p.length === 2 && p.every((n, axis) => Math.abs(n - expected[0][i][axis]) <= 1e-10))) return null;
    return structuredClone(shape);
  } catch (_) { return null; } // Preserve imports as generic Polygon; never rewrite unknown metadata.
}
export function shapeHandles(feature) {
  const shape = recognizedShape(feature);
  if (!shape) return null;
  const ring = feature.geometry.coordinates[0];
  return (shape.kind === "circle" ? [0, 16, 32, 48] : [0, 1, 2, 3]).map(i => ({ path: [0, i], coordinate: ring[i] }));
}
export function transformShape(feature, coordinate, path, delta) {
  let shape = recognizedShape(feature);
  if (!shape) return null;
  if (!path) {
    if (Math.abs(delta[0]) > 180) throw new RangeError("Shape movement crosses a wrapped world copy.");
    if (shape.kind === "circle") shape.center = shape.center.map((n, i) => n + delta[i]);
    else if (shape.projection === "mercator") shape.center = shape.center.map((n,i) => n + delta[i]);
    else shape.bounds = shape.bounds.map(p => p.map((n, i) => n + delta[i]));
  } else if (shape.kind === "circle") shape.radiusMeters = shapeDistance(shape.center, coordinate);
  else if (shape.projection === "mercator") {
    const opposite = shapeProject(feature.geometry.coordinates[0][(path[1] + 2) % 4]);
    const point = shapeProject(coordinate);
    const local = turn(point.map((n,i) => n - opposite[i]), -radians(shape.angleDegrees));
    // Keep corner order and orientation: crossing the opposite corner is rejected.
    const signs = [[-1,-1],[1,-1],[1,1],[-1,1]][path[1]];
    if (local.some((n,i) => n * signs[i] <= 0)) throw new RangeError("Rectangle corner cannot cross its opposite corner.");
    shape.center = shapeUnproject(point.map((n,i) => (n + opposite[i]) / 2));
    shape.width = Math.abs(local[0]); shape.height = Math.abs(local[1]);
  }
  else {
    const opposite = feature.geometry.coordinates[0][(path[1] + 2) % 4];
    shape = shapeFromPoints("rectangle", opposite, coordinate).shape;
  }
  return { shape, geometry: shapeGeometry(shape) };
}

export function objectPivot(feature) {
  const shape = recognizedShape(feature);
  if (shape?.center) return shapeProject(shape.center);
  const coords = feature.geometry.type === "Polygon" ? feature.geometry.coordinates[0].slice(0,-1) : feature.geometry.coordinates;
  const all = feature.geometry.type === "Polygon" ? feature.geometry.coordinates.flat() : coords;
  all.forEach(position);
  if (Math.max(...all.map(p=>p[0])) - Math.min(...all.map(p=>p[0])) > 180) throw new RangeError("Rotation cannot span a wrapped world copy.");
  const points = coords.map(shapeProject);
  if (Math.max(...coords.map(p=>p[0])) - Math.min(...coords.map(p=>p[0])) > 180) throw new RangeError("Rotation cannot span a wrapped world copy.");
  return [0,1].map(i => points.reduce((sum,p)=>sum+p[i],0) / points.length);
}
export function rotateObject(feature, angle, pivot = objectPivot(feature)) {
  if (!Number.isFinite(angle) || !pivot.every(Number.isFinite)) throw new RangeError("Rotation requires a finite angle and pivot.");
  const shape = recognizedShape(feature);
  if (feature.geometry.type === "Point" || shape?.kind === "circle") throw new RangeError("This object has no meaningful rotation.");
  if (Math.abs(Math.sin(angle)) < 1e-12 && Math.cos(angle) > 0) return structuredClone(feature);
  const next = structuredClone(feature);
  if (shape?.kind === "rectangle") {
    let oriented = shape;
    if (!shape.projection) {
      const sw = shapeProject(shape.bounds[0]), ne = shapeProject(shape.bounds[1]);
      oriented = {kind:"rectangle", projection:"mercator", center:shapeUnproject(pivot), width:ne[0]-sw[0], height:ne[1]-sw[1], angleDegrees:0};
    }
    oriented.angleDegrees = ((oriented.angleDegrees + degrees(angle)) % 360 + 360) % 360;
    next.properties.helperShape = oriented; next.geometry = {...next.geometry, ...shapeGeometry(oriented)};
  } else {
    const rotate = p => {
      position(p);
      const point = shapeProject(p), offset = turn(point.map((n,i)=>n-pivot[i]), angle);
      const result = shapeUnproject(pivot.map((n,i)=>n+offset[i])); position(result); return result;
    };
    next.geometry.coordinates = feature.geometry.type === "Polygon" ? feature.geometry.coordinates.map(ring=>ring.map(rotate)) : feature.geometry.coordinates.map(rotate);
  }
  return next;
}

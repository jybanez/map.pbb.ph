// Public deployment settings only. The local node must resolve this host to its MapServer.
export const config = Object.freeze({
  showDirectionTools: false, // Retained diagnostics/options entry points; opt in for future use.
  dataset: 'pbb-mapserver-20261011-v1', // Bump only for incompatible provider datasets/style, not shell releases.
  spriteUrls: [], // Explicit JSON/PNG (including retina) URLs if a future approved style uses sprites.
  mapServerUrl: 'https://mapserver.pbb.ph',
  styleUrl: new URL('./maps/hotline-dark.json', import.meta.url).href,
  center: [123.8854, 10.3157],
  zoom: 12, minZoom: 0, maxZoom: 24,
  pitch: 35, maxPitch: 85, bearing: 0, locationZoom: 15,
  location: { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
  poi: { sourceLayer: 'poi', excludedClasses: [
    'gate', 'parking', 'parking_entrance', 'car_parking', 'bicycle_parking',
    'motorcycle_parking', 'lift_gate', 'pitch', 'post', 'swimming_pool', 'office',
    'shelter', 'bench', 'toilets', 'waste_basket', 'recycling', 'drinking_water', 'vending_machine',
  ] },
});

export function tileUrls(base = config.mapServerUrl) {
  const url = new URL(base);
  if (url.username || url.password || url.search || url.hash || !['https:', 'http:'].includes(url.protocol)) {
    throw new Error('MapServer must be a public HTTP(S) base URL without credentials or query parameters.');
  }
  const root = url.href.replace(/\/$/, '');
  return {
    vector: `${root}/tiles/vector/{z}/{x}/{y}.pbf`,
    terrain: `${root}/tiles/terrain/{z}/{x}/{y}.png`,
    glyphs: `${root}/tiles/glyphs/{fontstack}/{range}.pbf`,
    poi: `${root}/tiles/poi/{z}/{x}/{y}.pbf`,
  };
}

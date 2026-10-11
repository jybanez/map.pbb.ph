import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { config, tileUrls } from '../assets/config.js';
import { buildStyle, POI_LAYERS } from '../assets/map-style.js';

test('style keeps Hotline terrain, separate POIs and attribution with configurable endpoints', () => {
  const original = JSON.parse(readFileSync(new URL('../assets/maps/hotline-dark.json', import.meta.url)));
  const style = buildStyle(original, { ...config, mapServerUrl: 'https://local.test/maps' }, false);
  assert.equal(style.sources.osm.tiles[0], 'https://local.test/maps/tiles/vector/{z}/{x}/{y}.pbf');
  assert.equal(style.sources.terrain.tileSize, 512); assert.equal(style.sources.terrain.encoding, 'mapbox');
  assert.match(style.sources.osm.attribution, /OpenStreetMap contributors/);
  assert.deepEqual(style.layers.filter(l => l['source-layer'] === 'poi').map(l => l.id), POI_LAYERS);
  for (const id of POI_LAYERS) assert.equal(style.layers.find(l => l.id === id).layout.visibility, 'none');
  assert.equal(style.layers.some(l => l.type === 'fill-extrusion'), true);
  assert.equal(JSON.stringify(style).includes('incidents'), false);
  assert.notDeepEqual(original, style);
});
test('public MapServer configuration rejects credentials and query tokens', () => {
  for (const url of ['https://user:pass@local.test', 'https://local.test?key=secret', 'file:///tmp', 'https://local.test/#key']) {
    assert.throws(() => tileUrls(url));
  }
});
test('every pinned public runtime asset matches the snapshot inventory', () => {
  const manifest = JSON.parse(readFileSync(new URL('../vendor/manifest.json', import.meta.url)));
  for (const [file, sha] of Object.entries(manifest.files)) {
    const url = new URL(`../${file}`, import.meta.url);
    assert.ok(existsSync(url), file);
    assert.equal(createHash('sha256').update(readFileSync(url)).digest('hex'), sha, file);
  }
});

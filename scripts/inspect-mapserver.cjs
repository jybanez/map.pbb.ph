const fs = require('node:fs');
const path = require('node:path');
const { VectorTile } = require('C:/wamp64/www/pbb/hotline/node_modules/@mapbox/vector-tile');
const PbfModule = require('C:/wamp64/www/pbb/hotline/node_modules/pbf');
const Protobuf = PbfModule.default || PbfModule;
const z = 14, lng = 123.8854, lat = 10.3157;
const x = Math.floor((lng + 180) / 360 * 2 ** z);
const y = Math.floor((1 - Math.asinh(Math.tan(lat * Math.PI / 180)) / Math.PI) / 2 * 2 ** z);
const report = { date: '2026-10-10', area: 'Cebu City', tiles: [] };
async function inspect(kind, zoom, tx, ty) {
  const ext = kind === 'terrain' ? 'png' : 'pbf';
  const url = `https://mapserver.pbb.ph/tiles/${kind}/${zoom}/${tx}/${ty}.${ext}`;
  const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length > 10000000) throw Error('Unexpected tile size');
  const row = { url, status: response.status, bytes: bytes.length, cache: response.headers.get('x-cache'), cors: response.headers.get('access-control-allow-origin') };
  if (!response.ok) { row.error = bytes.toString().slice(0, 120); }
  else if (kind === 'terrain') {
    row.dimensions = [bytes.readUInt32BE(16), bytes.readUInt32BE(20)];
  } else {
    const tile = new VectorTile(new Protobuf(bytes));
    row.layers = Object.fromEntries(Object.entries(tile.layers).map(([name, layer]) => [name, {
      count: layer.length,
      properties: layer.length ? layer.feature(0).properties : {},
    }]));
  }
  report.tiles.push(row);
}
(async () => {
  for (const kind of ['vector', 'poi']) await inspect(kind, z, x, y);
  await inspect('terrain', 12, x >> 2, y >> 2);
  const glyph = await fetch('https://mapserver.pbb.ph/tiles/glyphs/Open%20Sans%20Regular,Arial%20Unicode%20MS%20Regular/0-255.pbf', { signal: AbortSignal.timeout(30000) });
  report.glyphs = { status: glyph.status, bytes: (await glyph.arrayBuffer()).byteLength };
  fs.mkdirSync(path.join(__dirname, '../docs/evidence'), { recursive: true });
  fs.writeFileSync(path.join(__dirname, '../docs/evidence/mapserver-schema.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
})().catch(error => { console.error(error.message); process.exitCode = 1; });

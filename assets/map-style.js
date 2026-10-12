import { poiNameExpression } from './poi-name.js?v=20261012-personal-ui4';
import { eligibilityExpression } from './poi-categories.js?v=20261012-personal-ui4';
import { tileUrls } from './config.js?v=20261012-personal-ui4';

export const POI_LAYERS = ['pbb-poi-points', 'pbb-poi-labels'];
export const ATTRIBUTION = '© <a href="https://stadiamaps.com/attribution/" target="_blank" rel="noopener">Stadia Maps</a> · © <a href="https://openmaptiles.org/" target="_blank" rel="noopener">OpenMapTiles</a> · © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap contributors</a> · © <a href="https://www.maptiler.com/copyright/" target="_blank" rel="noopener">MapTiler</a>';

export function buildStyle(original, config, poiVisible = true) {
  const style = structuredClone(original), urls = tileUrls(config.mapServerUrl);
  style.name = 'PBB Map — Hotline Dark';
  style.glyphs = urls.glyphs;
  style.sources.osm.tiles = [urls.vector];
  style.sources.osm.attribution = ATTRIBUTION;
  for (const id of ['terrain', 'terrain-hillshade']) {
    style.sources[id].tiles = [urls.terrain];
  }
  // Render only the verified separate POI source, even if the basemap style evolves.
  style.layers = style.layers.filter(layer => layer['source-layer'] !== 'poi');
  style.sources['pbb-poi'] = { type: 'vector', tiles: [urls.poi], minzoom: 0, maxzoom: 14 };
  const filter = eligibilityExpression(config.poi.excludedClasses);
  const visibility = poiVisible ? 'visible' : 'none';
  style.layers.push({ id: POI_LAYERS[0], type: 'circle', source: 'pbb-poi',
    'source-layer': config.poi.sourceLayer, minzoom: 11, filter,
    layout: { visibility }, paint: { 'circle-radius': ['interpolate', ['linear'], ['zoom'], 11, 2.2, 15, 4],
      'circle-color': '#f4b43d', 'circle-opacity': 0.75, 'circle-stroke-color': '#0b141b', 'circle-stroke-width': 0.7 } });
  style.layers.push({ id: POI_LAYERS[1], type: 'symbol', source: 'pbb-poi',
    'source-layer': config.poi.sourceLayer, minzoom: 13, filter,
    layout: { visibility, 'text-field': poiNameExpression(),
      'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
      'text-size': ['interpolate', ['linear'], ['zoom'], 13, 10, 16, 12], 'text-offset': [0, 0.9], 'text-anchor': 'top' },
    paint: { 'text-color': '#e8d8b0', 'text-halo-color': '#06121b', 'text-halo-width': 1 } });
  return style;
}

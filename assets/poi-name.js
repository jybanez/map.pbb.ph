// Local name first, then explicit English, then the tile's generated English field.
export const POI_NAME_FIELDS = ['name', 'name:en', 'name_en'];
export function poiName(properties = {}) {
  for (const key of POI_NAME_FIELDS) {
    const value = properties[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}
// MapLibre 4.6 has no trim/regex expression. Number conversion trims whitespace:
// both "1" + value and value + "1" equal 1 only for an empty/whitespace value.
// Checking both preserves genuine numeric names, including "0" and "01".
export function poiNameExpression() {
  return ['case', ...POI_NAME_FIELDS.flatMap(key => {
    const value = ['string', ['get', key], ''];
    const blank = ['all',
      ['==', ['to-number', ['concat', '1', value], -1], 1],
      ['==', ['to-number', ['concat', value, '1'], -1], 1]];
    return [['!', blank], value];
  }), ''];
}

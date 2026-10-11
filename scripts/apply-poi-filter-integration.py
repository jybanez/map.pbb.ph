# Apply only AFTER Alfred accepts the mixed-state Helper runtime and it is pinned.
from pathlib import Path

def edit(path, changes):
 p=Path(path);s=p.read_text(encoding='utf-8')
 for old,new in changes:
  if old not in s:raise RuntimeError('Missing reviewed integration seam: '+old[:70])
  s=s.replace(old,new)
 p.write_text(s,encoding='utf-8')

edit('assets/app.js',[
 ("import { createDirectionWelcome }", "import { createPoiFilter } from './poi-filter.js?v=20261011-smooth-tilt1';\nimport { createDirectionWelcome }"),
 ("  const search = createMapSearch(", "  const poiFilter = createPoiFilter({createModal,createMapControls,uiLoader,excluded:config.poi.excludedClasses,sourceLayer:config.poi.sourceLayer,onChange:()=>search.closeResults()});\n  const search = createMapSearch("),
 ("createMapMarker,markExploration,onDismiss:", "createMapMarker,markExploration,poiAllowed:p=>poiFilter.visible(p),onDismiss:"),
 ("return [searchAction(),enableAction(),", "return [searchAction(),{id:'poi-filter',label:'Filter points of interest',icon:'actions.settings',onActivate:()=>poiFilter.open()},enableAction(),"),
 ("controls: ['search','zoom','enable-direction',", "controls: ['search','zoom','poi-filter','enable-direction',"),
 ("        poiVisible = checked;", "        poiVisible = checked;poiFilter.setMaster(checked);"),
 ("    search.setMap(null);", "    poiFilter.setMap(null);search.setMap(null);"),
 ("toast, markExploration, reducedMotion });", "toast, markExploration, reducedMotion,poiAllowed:p=>poiFilter.visible(p) });"),
 ("        search.setMap(map);", "        search.setMap(map);poiFilter.setMap(map);"),
 ("    search.destroy(); navbar.destroy();", "    poiFilter.destroy();search.destroy(); navbar.destroy();")
])
edit('assets/map-search.js',[
 ("markExploration,onDismiss,", "markExploration,poiAllowed=()=>true,onDismiss,"),
 ("if(f.geometry?.type!=='Point')continue;const name", "if(f.geometry?.type!=='Point'||!poiAllowed(f.properties))continue;const name")
])
edit('assets/map-context.js',[
 ("markExploration, reducedMotion })", "markExploration, reducedMotion,poiAllowed=()=>true })"),
 ("if (f.geometry?.type !== 'Point') continue;", "if (f.geometry?.type !== 'Point'||!poiAllowed(f.properties)) continue;")
])
edit('assets/map-style.js',[
 ("import { poiNameExpression }", "import { eligibilityExpression } from './poi-categories.js?v=20261011-smooth-tilt1';\nimport { poiNameExpression }"),
 ("const filter = ['all', ['!=', poiNameExpression(), ''], ...['class', 'type', 'subclass'].map(key =>\n    ['!', ['in', ['downcase', ['coalesce', ['get', key], '']], ['literal', config.poi.excludedClasses]]])];", "const filter = eligibilityExpression(config.poi.excludedClasses);")
])
print('Integration seams applied; now bump full entry/import graph, verify runtime hashes and run browser regressions before review.')

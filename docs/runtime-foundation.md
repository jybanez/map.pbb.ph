# V1 runtime foundation

> Documentation status (2026-10-18): the current accepted runtime is Task286, app `b7cfe13`, runtime `20261018-person34`, Helper main/person319 and Pin/adapter318 (independent acceptance11243). See [current project status](current-project-status.md) for current behavior and evidence limits. The dated implementation/review records below are historical; older versions, loading modes, inventories and pending decisions are preserved as evidence, not current instructions. GitHub publication does not establish deployment.

## Current runtime

MapLibre JS/CSS remain 4.6.0. The canonical Helper loader now prefers the pinned production UI bundle with exactly three Helper requests and no modular fallback; main/loader/adapter/Pin are 318. Map resources use a page-owned cache protocol, Cache Storage and IndexedDB; the separate shell service worker supports disconnected startup with available coverage. Camera zoom is 0–24 and pitch up to 85 degrees. Complete deployment includes shell-manifest.js, map-shell-worker.js and map.webmanifest as well as HTML/assets/vendor. Hashes and provenance are in vendor/manifest.json; no provider credentials or account integration are included.

## Historical task 148 foundation

Prepared 2026-10-10 for task 148 / deliverable 36. The application shell is a separate increment.

- MapLibre **4.6.0**, matching Hotline's active vendored renderer, with its matching CSS and BSD license under `vendor/maplibre/4.6.0/`. No npm 5.19.0 runtime assets are mixed in.
- Helper source snapshot **18d94309bbe214ac3c81a43a52458c93f236e6d8**, copied as public JS/CSS only under `vendor/helpers/`. SHA-256 inventory: `vendor/manifest.json`. Source mode through `uiLoader` avoids mixing the loader's historical bundle revision labels with a differently built bundle. Source/bundle equivalence is not claimed; the prebuilt bundle is not used.
- Styles are owned under `assets/maps/hotline-dark.json`, initially copied from Hotline's active operator style. Endpoints are constructed by `tileUrls()` in `assets/config.js`.
- Public MapServer base: `https://mapserver.pbb.ph`; vector, terrain, glyphs and POI paths follow MapServer's GET endpoint contract. No provider credentials are included.
- Camera: Cebu `[123.8854,10.3157]`, zoom 12, pitch 35°, north-up; allowed zoom 0–18; location zoom 15. Location policy: high accuracy, 10 seconds, cached age at most 60 seconds.
- Real Cebu samples: vector and POI `14/13830/7719`, terrain `12/3457/1929`; HTTP 200, CORS `*`, cache HIT. Decoded vector/POI schema and 512×512 terrain dimensions are recorded in `evidence/mapserver-schema.json`. POIs use source-layer `poi`, `name_en/name/class/subclass/rank`; basemap already contains POI data but the active style does not render that layer. Glyph font stack returned HTTP 200.

## Canonical component inspection

The complete navbar supports `contentEnd`, `contentEndMobile`, mobile stack/scroll/collapse, actions and action callbacks, update and destroy. Map controls support horizontal/compact layouts, zoom/compass/pitch/layers callbacks, sync and destroy. Marker supports a labeled dot and info tone. Empty state supports actionable errors; toast supports busy/update/resolve and persistence; busy overlay supports nonblocking scoped loading and destruction.

Verified gap: map controls have no disabled/busy API and cannot represent a requesting Locate state through supported options. Use the navbar's supported disabled action with a busy canonical toast for Locate; keep camera/layer controls composed through the navbar slot. A shared map-control disabled/busy API is a proposed library improvement, not an application fork. A geographic accuracy polygon belongs to the application.

## Attribution and operation

Keep visible linked credits for Stadia Maps, OpenMapTiles, OpenStreetMap contributors and MapTiler. Preserve data-provider credits regardless of which local cache supplies the assets. References: [Stadia required attribution](https://docs.stadiamaps.com/attribution/), [MapTiler attribution](https://docs.maptiler.com/guides/map-design/attribution/add-attribution/), [MapTiler terrain RGB](https://docs.maptiler.com/guides/map-tiling-hosting/data-hosting/rgb-terrain-by-maptiler/). MapTiler Free plans also require a linked MapTiler logo; the deployment operator must confirm the provider plan and redistribution/cache permissions. Do not infer those from successful requests.

All startup JS/CSS is local. Offline acceptance additionally requires local DNS/TLS routing for the configured MapServer and prepared geographic/zoom cache coverage. A cached sample and successful online startup do not establish offline acceptance. No service worker, SSO, database, or privileged backend is added.

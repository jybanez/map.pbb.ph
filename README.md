# PBB Map

PBB Map is the public mapping application of the PBB Ecosystem. It uses locally bundled MapLibre and Helper components and receives geographic resources from the configured PBB MapServer.

- Application: https://map.pbb.ph/
- Repository: https://github.com/jybanez/map.pbb.ph
- Current accepted behavior, provenance and limits: [Project status](docs/current-project-status.md)

## Current development — October 18, 2026

The latest independently accepted application implementation is `b7cfe13ca74bce950354b507c8e15ade57ed508f` (Task 286), tree `abdb40bd86276e794f52930aae278eda252cae6f`, runtime `20261018-person34`. Alfred independently accepted the runtime in message11243; Task335 status-text correction is included. Helper main/person use revision319, Pin/adapter318 and icons/game315. Exact adopted bytes and provenance are recorded in [vendor/manifest.json](vendor/manifest.json). Documentation commits follow the accepted runtime. GitHub publication does not establish deployment or physical-device certification.

## Features

- Dark map with terrain, 3D buildings, compass/north reset, 2D/3D controls, zoom and Locate. Camera zoom is 0–24 and pitch 0–85 degrees; initial zoom/pitch are 12/35 degrees, Locate zoom is 15, and 2D/3D presets are 0/60 degrees. Native vector/POI detail ends at zoom 14 and terrain at zoom 12.
- Current location uses a procedural blue 3D person rendered in the map canvas, an accessible DOM label and a dot fallback when the model is unavailable. The person retains natural perspective, heading and tilt with an approximately 34 CSS-pixel largest projected model dimension, using canonical min/max34 and a 12m sizing reference. See [consistent person size](docs/person-consistent-size.md).
- Three expanding accuracy ripples visualize the reported horizontal uncertainty. Fresh location updates preserve a manually explored camera; explicit Locate recenters it. Location and sensor samples stay in memory.
- Search accepts decimal `latitude, longitude` or names from loaded POI tiles. Named results respect visibility filters, display distance from the current valid location, and sort by name ascending, then numeric distance ascending. Loaded results are not a complete regional index.
- Selecting a result flies to its coordinates, then reveals an amber destination marker. Clearing the query removes it; closing the search field alone retains it. Its keyboard-accessible menu offers Copy coordinates, Center in view and Get info. Destination markers are separate from the user person and authored Pins.
- POI filtering provides loaded named counts, normalized category labels, class colors, mixed visibility states and an All menu.
- Personal layers support Point, upright 3D Pin, two-endpoint Line, multi-segment Path, Polygon, Circle and Rectangle. Pin sits between Select and Point. Its largest projected dimension stays approximately 32 CSS pixels: circular from above, tapered near 85 degrees. Fill/Stroke, dragging, Undo/Redo, explicit Save and reload are supported. Delete/Clear retain confirmation; Undo/Redo do not. Dirty exits retain confirmation. See [Pin integration](docs/map-pin-integration.md) and [personal layers](docs/personal-layers-status.md).
- The transient ruler measures straight-line distance with draggable endpoints. The metric scale is a local geographic reference, not terrain-surface distance.
- Supported fresh device direction affects the person cue, not camera bearing. Direction diagnostics/options are hidden by default. First-use permission is requested only through explicit activation. See [direction behavior](docs/direction-automatic-start.md) and [compass limits](docs/compass.md).

## Automatic caching and offline use

Caching is managed by the app, without an Offline maps menu or manual download workflow. A page-owned MapLibre protocol loader caches approved map resources using Cache Storage and IndexedDB. It operates independently of the service worker; the separate worker caches a validated application shell for cold startup.

After resources have been saved, disconnected devices can reopen the shell and use available map coverage. Previously unseen areas, zooms, glyphs or layers may be unavailable. Age alone does not expire usable cached tiles; failed refresh keeps prior bytes. Storage quota, eviction, cleared site data and incomplete coverage remain limits. Offline startup/reload has been checked in isolated Chromium desktop/mobile-emulation contexts; this does not guarantee every outage, browser or native wrapper. See [cache implementation](docs/map-resource-cache-implementation.md) and [design history](docs/device-offline-cache-design.md).

## Run and configure

Serve the repository through a trusted HTTPS web server. Ship the complete tracked runtime, including `index.html`, `assets/`, `vendor/`, `map-shell-worker.js`, `shell-manifest.js` and `map.webmanifest`; copying only HTML/assets/vendor omits offline startup resources. Runtime requires no npm install, PHP, login or backend database. Opening `index.html` as a file is unsupported.

Configure public MapServer, camera and location settings in [assets/config.js](assets/config.js). Provider credentials belong on MapServer, never in this frontend. Local DNS/TLS and readable MapServer responses must be configured for the node. Tile requests disclose the viewed area to that server. MapLibre 4.6.0 and Helper licenses are bundled under `vendor/`.

The strict canonical Helper loader loads three Helper resources: loader, production UI JavaScript bundle and production UI CSS bundle. Bundle failures reject without modular fallback. No UI/model/texture CDN is required. Source files remain vendored for provenance and development.

## Verification

With Node 22:

```sh
npm test
node scripts/build-shell-manifest.mjs --check
```

The accepted implementation passed 55 tests, vendor inventory verification and shell integrity checks. Independent Task286 checks passed120 camera samples across desktop/mobile, near/far depth, location/Locate, terrain/style changes, renderer fallback/retry, map replacement, stale callbacks/cleanup and cold offline startup, with exactly three Helper resources and no page errors. Independent desktop and fresh mobile touch-emulation checks cover Pin perspective, editing/history, terrain alignment, save/reload, lifecycle and ordinary service-worker offline reload. Physical Safari/mobile hardware, assistive technologies, WebGL1, native wrappers, complete geographic coverage and visual occlusion are not certified.

Older proposals, checklists and verification reports retain their original evidence and pending decisions as historical records. Their dated claims do not override the [current status](docs/current-project-status.md). Provider attribution/redistribution obligations remain an operator follow-up; the owner-requested removal of visible attribution is not evidence of compliance.

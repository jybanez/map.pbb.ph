# PBB Map current project status

Updated 2026-10-11 (Asia/Manila), following owner message 9268. This summary supersedes older design/default statements in historical verification notes.

Public application: https://map.pbb.ph/ · Current application revision: `20261011-location-ripple4`.

Official repository: https://github.com/jybanez/map.pbb.ph (owner message 9275). The existing project directory is the primary Git checkout, initialized on `main` with this repository as `origin`. The remote was empty at setup; existing application files are preserved and await an initial commit/push.

## Current experience

- Fixed, square-edged Helper navbar with project identity, north reset, 2D/3D and menu; zoom floats at the map's upper left and the state-colored icon-only Locate control at the lower right.
- Hotline-style dark MapLibre map, terrain and 3D buildings. Camera zoom 0–24, maximum pitch 85°, initial Cebu camera zoom 12/pitch 35°, Locate zoom 15. Native vector/POI zoom 14 and terrain zoom 12 remain unchanged.
- Latest valid browser location updates the procedural 3D person, direction cue and search distances without moving an explored camera. Initial location and explicit Locate may recenter. One location watcher pauses while hidden and clears on teardown; fallback one-shot operation remains available where watch support is absent. Location and sensor data stay in memory.
- The person responds to map perspective, tilt and bearing, with a 12 m visual height bounded to 8–64 CSS pixels. Dot fallback remains available when the renderer is unavailable.
- Three geographic accuracy ripples start one second apart, each expanding/fading over three seconds to the reported accuracy radius. Shared source and two layers; blue fill maximum 0.07 per wave, outline maximum 0.5. Original static accuracy circle is removed. Animation pauses for reduced motion, hidden pages, unavailable location or stale fixes (60 seconds); teardown removes layers/source. This is a visual uncertainty cue, not a new measurement.
- Search supports coordinates or loaded named POIs. Results display distance from a valid current location and sort by name ascending, then distance ascending. Coverage is loaded tiles, not a complete regional index. Destination pins and context actions remain separate from the user marker.
- POI filter opens a canonical busy modal immediately, then populates the Helper tree grid with class/subclass, Locations and visibility. Counts include eligible loaded named locations even when hidden. Parent mixed state, All menu and stable class colors share map/search/nearby eligibility. Display labels replace underscores with spaces and capitalize words/acronyms; raw category keys remain unchanged.
- Direction diagnostics/options are hidden by default (`showDirectionTools: false`); retained for future use. Automatic supported direction and first-use welcome remain. Camera bearing is manual; compass-follow camera mode is deferred.
- Visible map attribution was removed at the owner's request. Provider/data attribution obligations remain an operator follow-up; removal does not establish permission compliance.

## Dependencies and review

MapLibre JS/CSS 4.6.0. Helper uses locally pinned canonical bundle/loader artifacts, with accepted incremental person perspective, mixed checkbox and checkbox containment updates. The latest checkbox containment adoption uses UI bundle/CSS revision 0.21.284; checkbox JavaScript remains 0.21.283. Exact artifact provenance is recorded in `vendor/manifest.json` and the runtime evidence manifests; do not interpret the historical base snapshot as the sole current Helper revision.

Alfred independently passed 37/37 Node tests during POI filter acceptance and reviewed subsequent bounded UI/ripple changes. Developer reports desktop/mobile browser verification for three-wave phase spacing, shared source/layers, reduced-motion pause/resume, style reload and detach cleanup without page errors. Earlier camera-interaction evidence covers zoom/pan/tilt/bearing with the one-wave implementation; it is not a separate three-wave physical-device certification. Alfred reviewed source, scripts and screenshots; no independent app browser rerun is claimed for the latest ripple changes.

Implementation milestones 17–19 are complete; review/handoff milestone 20 and final owner acceptance remain open. Owner's positive feedback in 9268 is recorded without inferring closure of every outstanding check. Tile/cache outage verification was removed from PBB Map scope by owner 9104; deliverable 43 is cancelled. Task 155's blocked cancellation is an administrative authorization follow-up, not a runtime blocker. No actual outage test success or fully disconnected-device support is claimed.

Physical touch/safe-area, real-phone direction calibration/reference behavior, and final owner acceptance remain explicit follow-ups. Emulated viewports and synthetic locations do not certify physical hardware.

## Documentation map

[Proposal](pbb-map-v1-development-proposal.md) · [Checklist](pbb-map-v1-implementation-checklist.md) · [Historical verification](v1-verification.md) · [POI filter](poi-category-filter.md) · [Accuracy ripple](accuracy-ripple.md) · [Perspective scaling](person-perspective-scaling.md) · [Direction visibility](direction-tools-visibility.md) · [Runtime foundation](runtime-foundation.md).

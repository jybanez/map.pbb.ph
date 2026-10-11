# PBB Map V1


Current status (2026-10-11): [Current project status](docs/current-project-status.md) is the authoritative documentation summary for the accepted controls, location tracking, POI filtering and three-wave accuracy ripple. Older revision-specific statements below remain historical where superseded. Physical-device validation and final owner acceptance are not inferred from automated checks.

Public static map: https://map.pbb.ph/

A selected search result flies to the destination, then drops an amber pin with a small bounce at its exact coordinates. The pin stays hidden during flight; interrupted flights cancel the reveal. It remains when search closes, moves to the next selected result, and clears when the map restarts. It is separate from your reported location and accuracy circle; camera terrain adjustment does not change the destination coordinates. The explicitly requested sequence uses essential motion for both the flight and drop.

Your reported location uses an original blue 3D person on a circular base, with three sequential expanding accuracy ripples. The original static circle is removed. See [accuracy ripple](docs/accuracy-ripple.md). A canonical blue dot remains visible until the model renders and returns if the renderer fails or loses its context. Locate explicitly retries a failed model while requesting location. The locally bundled Helper renderer and procedural geometry use the Helper ISC license; MapLibre 4.6.0 uses its bundled BSD license. No model, texture or renderer CDN is required. Perspective and building occlusion follow the map; the optional gold base cue shows corrected device direction when supported and fresh. Choose Locate to allow direction where a permission tap is required. Unknown, stale or unreliable readings retain a neutral person. [Compass inputs and limits](docs/compass.md) document local WMM2025 correction, supported sensor paths and remaining real-phone checks.

Click or tap a settled destination pin to open its location actions: copy coordinates, Center in view, or Get info. Keyboard users can focus the pin and press Enter or Space; Escape dismisses the menu and returns focus. Actions use the exact selected destination coordinates. Pins are unavailable during flight/drop, and new selections clear stale menus.

Clearing the search or deleting its text to empty removes the destination pin and closes its menu. Pending drop effects are cancelled; current location and accuracy stay available. Closing the search field alone retains the destination. Clearing leaves the current camera transition alone.

Helper runtime prefers the locally pinned production UI JS/CSS bundle through its canonical loader. Runtime provenance includes accepted perspective and checkbox updates; latest UI bundle/CSS revision is `0.21.284` (checkbox JS `0.21.283`). Exact hashes and incremental provenance are in `vendor/manifest.json` and the runtime evidence manifests. Search uses canonical focus-preserving menu opening and deliberate keyboard entry. No CDN is needed for UI startup.

Search accepts decimal `latitude, longitude` (latitude first) or a POI name. Typing shows live suggestions and keeps focus in the field; Space edits the query. Click/tap a result, or use Arrow Down or Enter to enter the results and then select with the keyboard, to animate to the destination. Pasting a completed query or the mobile Search button also enters result navigation. Editing replaces stale suggestions without activating a destination. Named results come only from currently loaded local POI tiles and respect the shared POI visibility filters; navigate/zoom and search again to change coverage. This is not a complete barangay index. No external search service is used.

Serve this directory through the local node's HTTPS web server. Copy `index.html`, `assets/` and `vendor/` together; no PHP, database, npm install or build is required for runtime. Opening the HTML directly as a file does not support this deployment's module/geolocation requirements.

Configure the public MapServer URL and camera/location defaults in `assets/config.js`. The node's DNS and trusted HTTPS certificate must make MapServer reachable. Provider keys stay on MapServer; never put them in this frontend. Vector, terrain, glyph and POI requests use GET. All renderer and Helper startup assets are local.

Use Zoom, north reset, 2D/3D pitch, Layers → Points of interest, and Locate. Location tracking starts on startup using browser permission. Valid movement fixes update the person/dot, accuracy area and search distances while preserving the explored camera; Locate centers the latest fix. One watcher pauses when the page is hidden, resumes when visible, and clears on teardown. Denial requires allowing location in site settings and choosing Locate; visibility changes do not retry denied permission. Browsers without watch support retain one-shot Locate behavior. Location is displayed only in memory; reported accuracy is an estimate. Pan with arrow keys, zoom with plus/minus, and use Shift with arrows for supported rotation/pitch. Map tile requests reveal the viewed area to the configured MapServer.

Offline V1 means the local PBB node remains reachable while upstream internet is unavailable. Each connected barangay node serves its prepared local tiles/fonts through the configured MapServer. Automatic node discovery or network switching is outside V1. Fully disconnected devices are not supported. Owner scope removal (messages9104/9105) places tile/cache outage verification outside PBB Map; it is no longer a project blocker. Historical preparation evidence remains, with no actual outage-test success claimed.

[Dependency/configuration details](docs/runtime-foundation.md) · [Verification and outstanding checks](docs/v1-verification.md) · [Approved scope](docs/pbb-map-v1-development-proposal.md) · [Checklist](docs/pbb-map-v1-implementation-checklist.md)

Development checks: `npm test` (Node 22). SHA-256 manifest: `vendor/manifest.json`. Optional reference pinning script copies only public Helper JS/CSS/licenses and Hotline renderer/style assets; never copy another application's secrets or change reference projects.

Direction diagnostics/options entry buttons are temporarily hidden by default. Set `showDirectionTools: true` in `assets/config.js` and bump config/entry revisions to restore them for future troubleshooting; underlying components and automatic direction remain active. See [diagnostics](docs/direction-diagnostics.md). The map camera retains its chosen bearing; compass-follow is separate.

When altitude is unavailable, direction automatically uses the supported Philippines ground-use approximation and identifies approximation in the marker accessible description and Direction diagnostics. No ground confirmation or session enable step is required. Valid measured altitude takes priority. Locate still requests direction permission when required. Direction options offers an optional strict mode for the current session; reload restores automatic approximation. See [implementation and evidence](docs/approximate-direction.md).

Direction starts automatically when browser authorization or permitted sensor delivery is available. If a first-use tap is required, use **Enable direction** in the map controls; green Locate remains available for recenter/retry. No automatic direction permission prompt is opened. [Browser limits and verification](docs/direction-automatic-start.md).

When direction needs first-use activation, a welcome alert offers **Enable location and direction** or **Continue browsing**. Only the Enable click requests browser permission; dismissing keeps map browsing available.

POI labels use actual nonblank local/English name fields; unnamed POIs render neither dots nor labels (owner9120 supersedes earlier dot retention). Search/context share that name precedence. See [POI name verification](docs/poi-names.md).

Camera zoom range is0–24; initial zoom12 and Locate zoom15. Vector/POI source maximum14 and terrain maximum12 remain unchanged: higher camera zoom enlarges existing detail.

Maximum camera pitch is85 degrees; initial pitch35 and 2D/3D presets0/60 remain. Near-horizon views may expose source/label and device performance limits.

The current-location person uses reviewed Helper perspective scaling (12m visual model height; 8–64 CSS pixel envelope). Far camera views shrink the marker; visibility bounds plateau at extremes. See docs/person-perspective-scaling.md for provenance and bounded verification.

POI category filtering uses the canonical Helper modal/tree grid/checkbox with loaded named counts, stable class colors and shared map/search/nearby predicates. See docs/poi-category-filter.md for behavior, runtime provenance, evidence and coverage limits.

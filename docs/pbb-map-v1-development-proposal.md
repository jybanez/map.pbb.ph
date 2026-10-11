# PBB Map V1 Development Proposal


Current status (2026-10-11): [Current project status](current-project-status.md) is the authoritative documentation summary for the accepted controls, location tracking, POI filtering and three-wave accuracy ripple. Older revision-specific statements below remain historical where superseded. Physical-device validation and final owner acceptance are not inferred from automated checks.

Owner9104 removes tile/cache outage verification from PBB Map scope; Alfred9105 confirms deliverable43 cancelled and directs task155 cancellation. It is no longer a PBB Map blocker. Both agents’ protected API cancellation attempts were rejected403 despite Developer being recorded giver/supervisor; Alfred9107 confirms the precise authorization restriction is unresolved. Task155 remains blockedv5 pending owner cancellation in the Syndicatum task UI. No identical API retries or alternate identity use. Historical kit and evidence are retained; no actual WAN outage test was performed or passed. No MapServer configuration change or new task is implied.

Date: 2026-10-10 (Asia/Manila)
Status: Approved V1 scope — Syndicatum project-plan proposal #14
Project: PBB Map

Implementation update (2026-10-10): static V1 is available at https://map.pbb.ph/ for independent review. Final defaults remain the documented Cebu/zoom 12/pitch 35° and location zoom 15/10-second policy. The complete Helper map-control API lacks busy/disabled and target-size options; Locate uses the supported navbar action and busy toast, with scoped 44-pixel camera targets and layer-overlay positioning. No modal or local replacement component was added. See [implementation verification](v1-verification.md) for evidence, deployment limitations and remaining independent review/owner acceptance. Upstream-loss certification and exhaustive cache inventories are deployment follow-ups and do not block the owner's personal V1 test, per messages 8691/8693.

## Objective

Build a simple, public map application that opens into a fullscreen mapping experience and locates the user when browser permission allows. Match PBB Hotline's map appearance and navigation using MapLibre, PBB MapServer, and the official PBB Helpers UX/UI library.

This proposal documents the agreed V1 direction. It does not register external services or authorize changes to the reference projects.

## V1 Scope

- A fixed top Helper navbar showing the project icon/name and mapping controls.
- A fixed map occupying all remaining viewport space below the navbar.
- Hotline's dark vector basemap, terrain, hillshade, and 3D buildings.
- Pan, zoom, rotation, and pitch navigation through pointer, touch, and supported keyboard interactions.
- POIs enabled by default, with labels appearing at appropriate zoom levels.
- A perspective-aware 3D user marker/dot fallback and three sequential geographic accuracy ripples.
- Location requested on opening and again through a Locate control.
- Clear loading, location-denied, location-unavailable, and map-error feedback.
- Responsive operation on desktop and mobile without page scrolling.

## Layout and Controls

Use the canonical Helper navbar for the fixed header. Show a project map icon and the name PBB Map. Place the canonical Helper map controls in the navbar through its supported composition API; inspect that API before implementation.

Current controls place Zoom In/Out above the map at upper left and icon-only Locate at lower right; Compass/Reset North, 2D/3D and the menu remain in the compact navbar. A POI filter below zoom opens the canonical class/subclass modal. Use Helper control labels and accessible names. Fit-to-incidents is not relevant to this application. The compass resets bearing to north without unexpectedly relocating the user.

The map fills the viewport below the navbar. Account for dynamic mobile viewport height, device safe areas, and navbar size changes. Call MapLibre resize when the available map dimensions change. If all controls cannot fit on a small screen, use supported Helper compact or overflow presentation without reducing the map to a scrollable page.

Owner requested removal of visible map attribution; that presentation is implemented. Verify the applicable provider attribution and usage requirements during implementation.

## Mapping Experience

Use Hotline's active operator style as the initial reference:

`C:/wamp64/www/pbb/hotline/public/maps/operator-vector-style.json`

Its style includes landcover, landuse, water, waterways, roads, administrative lines, building fills/outlines, building extrusions, road labels, place labels, terrain, and hillshade. It uses vector tiles through native zoom 14 and allows the map to zoom to 18. Its terrain sources declare Mapbox RGB encoding, 512-pixel tiles, native zoom 12, and terrain exaggeration 1.6.

Verify actual terrain dimensions/encoding and vector source-layer names before adopting these settings. Select one consistent MapLibre version: Hotline loads vendored 4.6.0 while its npm lockfile resolves 5.19.0. Do not accidentally mix runtime assets and CSS from different versions.

Start with a modest pitch, provisionally 35 degrees, and north-up bearing. Tune the pitch through visual verification. Default fallback camera is Hotline's Cebu City center `[123.8854, 10.3157]` at zoom 12; after a successful location fix, use a closer view, provisionally zoom 15. These are implementation defaults rather than permanent geographic restrictions.

POIs are a separate source/layer group enabled by default. Adopt Hotline's useful exclusion/filter pattern, but verify the real source-layer and property schema instead of assuming that successful layer creation establishes data compatibility. Avoid duplicate labels if the base style already includes POIs.

## Location Workflow

1. Render the application shell and initialize the map immediately. Location permission must not block the fallback map.
2. Start one browser location watcher, falling back to one-shot requests when watch support is absent, with a finite timeout. A starting policy is high accuracy enabled, a 10-second timeout, and up to 60 seconds of cached position age.
3. On success, validate finite coordinates and accuracy, render the location marker and accuracy circle, and center on the user.
4. If the user has already moved the camera while the initial fix was pending, show their location without overriding that exploration. A subsequent explicit Locate action may recenter.
5. On denial, explain that location permission is needed and keep the fallback map usable. On timeout/unavailability, offer Locate to retry. Do not repeatedly prompt automatically.
6. If geolocation or a secure context is unavailable, show actionable feedback and preserve map navigation.

Use the canonical Helper marker where its existing API supports the location presentation. Render the accuracy circle as application-owned GeoJSON with distances in meters; validate the conversion to geographic coordinates. Explain that the circle reflects reported browser accuracy rather than guaranteed precision.

Prevent duplicate in-flight location requests. Ignore late callbacks after teardown or a superseding location request; `getCurrentPosition` does not provide a general abort API. Distinguish requesting a fix, a successful fix, and a failed fix in visible state.

Owner-approved live tracking updates the marker and search distances while preserving the explored camera; pause on hidden pages and clear the watcher on teardown. Do not transmit or persist location merely to display it. Map tile requests still reveal the viewed map area to the configured tile service. Use HTTPS for deployment and browser geolocation.

## Architecture and Integration

| Layer | Responsibility |
| --- | --- |
| PBB Helpers | Navbar, map controls, markers, icons, feedback, loading and empty/error components |
| MapLibre | Rendering, camera, gestures, sources, layers, terrain and attribution |
| MapServer | Vector tiles, terrain, glyphs and POI tiles |
| PBB Map | Configuration, initialization, location handling, layer policy and lifecycle |

Use configurable MapServer base URL `https://mapserver.pbb.ph` and construct:

- `/tiles/vector/{z}/{x}/{y}.pbf`
- `/tiles/terrain/{z}/{x}/{y}.png`
- `/tiles/glyphs/{fontstack}/{range}.pbf`
- `/tiles/poi/{z}/{x}/{y}.pbf`

Use GET for tile requests; MapServer rejects HEAD. Public responses allow cross-origin access, but browser scripts cannot read `X-Cache` cross-origin without exposed response headers. Health metadata is not proof that uncached provider requests will succeed.

Use a static HTML/CSS/JavaScript application. Keep styles, renderer assets, Helper assets and their runtime dependencies available on the local PBB node, with provider credentials held by MapServer. Use a consistent Helper source/bundle snapshot and the loader's supported dependency/CSS handling.

Offline V1 operation means upstream internet is unavailable while the local PBB node and MapServer remain reachable. It depends on prepared geographic and zoom coverage for vector tiles, terrain, glyphs and POIs. Verify cold-browser startup without public CDN requests, cached-region navigation and explicit feedback for uncached assets. Record coverage limits and device geolocation limitations. Fully disconnected-device operation is not a V1 acceptance claim; MapServer cache-population tooling remains infrastructure work.

Serving readiness was verified on 2026-10-10: https://map.pbb.ph/ serves the project with successful certificate validation, and HTTP redirects to HTTPS. The implemented static application is available for owner testing.

Reuse the structure of Hotline's `resources/js/maps/dashboardMap.js`, including tile configuration and layer lifecycle, while removing incident-specific behavior. Load the basemap independently of optional overlays. Update source data rather than rebuilding the map for each location fix or toggle.

Inspect complete Helper components before adding custom UI. Use supported update, busy, disabled, error and destruction APIs. If a repeated capability is missing, document the verified gap and propose a shared-library improvement instead of silently forking the library.

Any future modal must open before initialization requests, show its canonical loading state, allow cancellation during read-only loading, and ignore stale responses. Form submissions must validate applicable fields before busy state or requests. Preserve field-associated accessible errors and the draggable canonical error alert. Multiple validation issues use the summary "Please address the following issues before continuing:" followed by ordered, deduplicated user-facing bullets. Disable automatic busy-on-submit when application validation needs to run first.

## Failure and Lifecycle Behavior

- Show map loading feedback until rendering is ready, with actionable failure feedback if initialization fails.
- Handle unsupported WebGL through the canonical empty/error presentation.
- Differentiate optional POI/terrain failures from a basemap failure where possible; keep working navigation available.
- Do not recreate the map or replay actions automatically because a request outcome is uncertain.
- Destroy controls, markers, listeners, resize observers and map instances on teardown.
- Avoid global selectors or state that would interfere with other PBB applications.

## Deferred Scope

Owner clarification (Syndicatum message 8691): a citizen can cross a barangay boundary and connect to the next barangay's PBB node, which serves its own prepared map tiles. V1 uses the configured local MapServer address on the connected node; automatic network switching is not implemented by this app. Keep verification proportional: review the core mapping/location experience and the requested recovery fixes. Isolated-node outage certification and exhaustive cache inventories are deployment follow-ups, not blockers for the owner's V1 personal test. Record untested behavior accurately.

Account login, app roles, Realtime subscriptions, administrative boundary overlays, saved places, external geocoding, routing, drawing/editing, shared data, compass-follow camera mode, and offline tile population are deferred. Loaded-tile POI/coordinate search and ephemeral live location are now implemented. Account and Realtime are established future integrations, but neither is required for this public V1 map.

## Acceptance Criteria

The app opens with a fixed Helper navbar and a map filling the remaining viewport. With location permission granted, it displays the user marker and accuracy circle and centers appropriately. Denied, timed-out, unsupported and unavailable location states leave the map usable. Zoom, pan, bearing and pitch controls work with the Hotline-style basemap, 3D buildings and terrain. POIs start visible and can be toggled. Attribution remains available. Desktop/mobile layouts have no unintended page scroll or clipped controls. No location is persisted by V1. See the implementation checklist for verification scenarios.

## Reference Sources

- Hotline: `C:/wamp64/www/pbb/hotline/resources/js/maps/dashboardMap.js`
- Hotline style: `C:/wamp64/www/pbb/hotline/public/maps/operator-vector-style.json`
- Hotline map configuration: `C:/wamp64/www/pbb/hotline/app/Http/Controllers/Web/HotlineMapConfigController.php`
- Helpers: `C:/wamp64/www/hotline-helpers/js/ui/ui.loader.js`
- Helper contracts: `C:/wamp64/www/hotline-helpers/README.md`
- Helper integration guidance: `C:/wamp64/www/hotline-helpers/docs/pbb-refactor-playbook.md`
- MapServer: https://mapserver.pbb.ph/README.md
- Future Account integration: `C:/wamp64/www/pbb/account/docs/PBB_ACCOUNT_APP_INTEGRATION_LESSONS.md`
- Future Realtime integration: `C:/wamp64/www/pbb/realtime/docs/pbb-realtime-sdk-integration-guide.md`

Local reference paths document the inspected sources; they are not runtime dependencies. Syndicatum proposal #14 is approved: milestones 17–20 and deliverables 35–45 track V1. Developer owns implementation; Alfred owns scope reconciliation and independent review. Jonathan performs personal acceptance after the reviewed handoff.

## Owner-authorized personal layers (task206)

Owner9407 and Alfred9409 authorize named local personal layers with reviewed merged Helper290/adapter290/core288/icon287 with canonical beforeDelete per final9416/9426/9427/9439. Implementation and reproducible desktop/mobile-width/offline/storage-failure evidence are submitted for Alfred review; see [personal-layer status and verification](personal-layers-status.md). Authored IndexedDB is independent of disposable map cache; canonical management/forms/drawing and confirmed destructive history preserve validation, cancellation and stale-target protection. No account upload or automatic GPS trail. Physical Safari/native/touch/full-process restart and independent acceptance remain pending.

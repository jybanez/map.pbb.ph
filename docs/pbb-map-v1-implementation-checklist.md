# PBB Map V1 Implementation Checklist


Current status (2026-10-11): [Current project status](current-project-status.md) is the authoritative documentation summary for the accepted controls, location tracking, POI filtering and three-wave accuracy ripple. Older revision-specific statements below remain historical where superseded. Physical-device validation and final owner acceptance are not inferred from automated checks.

Owner9104 removes tile/cache outage verification from PBB Map scope; Alfred9105 confirms deliverable43 cancelled and directs task155 cancellation. It is no longer a PBB Map blocker. Both agents’ protected API cancellation attempts were rejected403 despite Developer being recorded giver/supervisor; Alfred9107 confirms the precise authorization restriction is unresolved. Task155 remains blockedv5 pending owner cancellation in the Syndicatum task UI. No identical API retries or alternate identity use. Historical kit and evidence are retained; no actual WAN outage test was performed or passed. No MapServer configuration change or new task is implied.

Date: 2026-10-11 (Asia/Manila)
Status: Implementation submitted for review; upstream-loss verification remains a deployment follow-up and does not block the owner's personal V1 test (messages 8691/8693). Physical-device checks remain unverified.
Proposal: [PBB Map V1 Development Proposal](pbb-map-v1-development-proposal.md)

Mark items complete only after implementation and the applicable verification. Record any scope change or verified library gap in the proposal before extending the design.

## 1. Establish the Application Foundation

- [x] Confirm serving URL, HTTPS and document root: https://map.pbb.ph/ verified 2026-10-10, certificate validation succeeds, HTTP redirects to HTTPS. Static HTML/CSS/JavaScript architecture agreed.
- [x] Select and pin a consistent MapLibre JavaScript/CSS version, resolving Hotline's vendored/npm mismatch.
- [x] Pin canonical local Helper bundle/loader and accepted incremental components with exact artifact manifests.
- [x] Inspect canonical navbar composition and map-control APIs before writing layout adapters.
- [x] Configure MapServer base URL, fallback camera, user-location zoom, pitch and location timeout policy.
- [x] Keep provider keys and other server secrets out of frontend configuration.
- [ ] Verify provider attribution and applicable tile-service usage requirements.

## 2. Implement the Fixed Layout

- [x] Mount the canonical Helper navbar with the project map icon and PBB Map name.
- [x] Compose canonical mapping controls into the navbar using supported APIs.
- [x] Fix the map below the navbar to fill the remaining viewport.
- [ ] Handle mobile dynamic viewport height, safe areas, and responsive navbar dimensions.
- [x] Resize MapLibre when map dimensions change.
- [ ] Provide a compact/overflow control arrangement on narrow screens.
- [x] Preserve accessible labels, visible keyboard focus and usable touch targets.
- [x] Apply owner-requested removal of visible map attribution; operator obligations remain unverified.

## 3. Implement the Hotline Mapping Experience

- [x] Adapt the active Hotline operator vector style into project-owned assets.
- [x] Rewrite vector, terrain, hillshade and glyph URLs from MapServer configuration.
- [x] Verify actual vector source-layer names and font availability.
- [x] Verify terrain dimensions and Mapbox RGB encoding before fixing source settings.
- [x] Render the dark basemap, roads, water, land use, building outlines/extrusions and labels.
- [x] Enable terrain and hillshade with verified settings.
- [x] Configure initial north-up bearing and modest pitch; verify label readability.
- [ ] Support zoom, pan, rotation and pitch gestures plus supported keyboard navigation.
- [x] Connect Helper zoom, compass and pitch controls to the map.
- [x] Avoid incident-specific sources, pulse animation and fit behavior from Hotline.

## 4. Implement POIs

- [x] Inspect representative POI tiles and establish the real source-layer/property schema.
- [x] Add a separate POI source and point/label layers at suitable zoom levels.
- [x] Apply the adopted class exclusions and prevent duplicate POI labeling.
- [x] Enable POIs by default.
- [x] Connect the navbar POI toggle to the complete layer group.
- [x] Preserve layer visibility state through map initialization.
- [x] Handle optional POI failures without making the basemap unusable.

## 5. Implement Location

- [x] Initialize the fallback map without waiting for geolocation.
- [x] Start a single location watcher with finite timeout/cache settings and one-shot fallback; pause/resume and teardown are verified with synthetic fixes.
- [x] Validate coordinate ranges, finite values and nonnegative accuracy.
- [x] Show the canonical 3D person/dot fallback and geographic three-wave accuracy ripple; static circle removed by owner request.
- [x] Center on a successful initial fix unless the user already navigated the camera.
- [x] Make explicit Locate requests recenter on successful fixes.
- [x] Prevent concurrent duplicate location requests and show a requesting state.
- [x] Handle permission denial, timeout, unavailable location, missing API and insecure context with actionable feedback.
- [x] Retain map usability and offer a manual retry without repeated automatic prompts.
- [x] Ignore callbacks after teardown or request supersession.
- [x] Keep live location ephemeral: no storage/uploads; tracking updates preserve the explored camera.

## 6. Handle Initialization and Cleanup

- [x] Use canonical Helper loading and error feedback.
- [x] Detect unsupported WebGL and display a clear fallback state.
- [ ] Handle style, basemap, glyph and terrain failures without uncaught initialization errors.
- [x] Provide a deliberate retry path for recoverable initialization failures.
- [x] Remove listeners, observers, controls, markers and map resources on teardown.
- [x] Prevent duplicate map initialization and stale asynchronous updates.
- [x] Verify tile requests use GET and frontend configuration contains no credentials.

## 7. Verify the V1 Experience

- [x] Verify layout on desktop, a narrow mobile viewport, and mobile landscape; no unintended document scroll or clipped controls.
- [ ] Verify navbar/map resizing and device safe-area behavior.
- [ ] Verify zoom, pan, compass reset, rotation, pitch and touch gestures.
- [ ] Verify terrain and 3D building rendering in a representative populated area.
- [x] Verify POIs visible by default, readable labels and complete toggle behavior.
- [x] Verify owner-requested attribution presentation; provider obligations are a separate follow-up.
- [ ] Verify an allowed mocked location and a real-device location fix where available.
- [x] Verify marker position and accuracy-circle scale at multiple latitudes/zooms.
- [ ] Verify denied, timed-out, unavailable, unsupported and insecure-context location cases.
- [x] Verify initial late location does not override user camera navigation.
- [x] Verify Locate retry, duplicate-click protection and ignored late callbacks after teardown.
- [x] Verify basemap remains usable during location failure and optional POI failure.
- [x] Verify map initialization failure and unsupported WebGL feedback.
- [ ] Verify keyboard navigation, control labels/focus and touch targets.
- [x] Inspect browser console/network for actionable errors and confirm no location persistence requests.
- [x] Use focused automated checks for location state/races and lifecycle behavior where practical; complete browser visual verification for layout and rendering.
- [x] Record actual checks, results, browser/device coverage and remaining limitations.

## 8. Deliver and Coordinate

Removed from PBB Map acceptance by owner9104: upstream-outage verification and prepared tile/cache coverage belong to MapServer infrastructure. Historical kit/evidence remain unverified for actual outage operation; fully disconnected-device support is not claimed.

- [x] Document local startup, configuration, dependency versions and HTTPS requirements.
- [x] Update proposal/checklist with the final defaults and any accepted scope changes.
- [ ] Provide the working application URL and a concise validation handoff.
- [x] Associate scope with approved Syndicatum proposal #14, milestones 17–20 and deliverables 35–45.

## Completion Evidence

Implementation reference: `index.html`, `assets/app.js`, `assets/location.js`, `assets/map-style.js`; tasks 148–156 linked to deliverables 36–43 and 45. Task 148 accepted by Alfred; tasks 149–154 have Alfred's independent implementation/evidence acceptance in message 8696. Their lifecycle status remains in review. Task 156 awaits final owner acceptance. See [Alfred's review](alfred-v1-review.md).

Application URL: https://map.pbb.ph/ (working implementation; final acceptance pending)

Selected Helper/MapLibre versions: MapLibre 4.6.0 matching official JS/CSS; local canonical Helper bundle/loader with accepted incremental updates; current UI bundle/CSS 0.21.284, checkbox JS 0.21.283; exact SHA-256 provenance in runtime manifests.

Verification results: [Verification report](v1-verification.md), [browser evidence](evidence/browser-verification.json), [clean-browser startup](evidence/cold-start.json); 9/9 Node checks. Detailed checkbox completion must stay limited to the evidence below; physical touch/safe-area/device location and genuine upstream-loss acceptance are pending.

Known limitations: Actual offline local-node cache geography/zoom coverage and upstream disconnection unverified; no fully disconnected-device support. Physical device testing, provider-plan permissions, independent review and owner acceptance pending. Helper capability gaps documented in the verification report.

## Accepted incremental scope through 2026-10-11

- [x] Floating zoom/Locate, compact navbar, search distance and name/distance sorting.
- [x] 3D person perspective scaling and hidden direction troubleshooting tools.
- [x] Named POI class/subclass filter, mixed checkboxes, stable colors and normalized display labels; shared map/search/nearby filtering.
- [x] Three sequential geographic accuracy ripples with synchronized translucent fill and reduced-motion/lifecycle handling; accepted review 9267.
- [ ] Physical-device validation and final owner acceptance. Automated checks do not complete these items.

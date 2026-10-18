# PBB Landing launcher integration study

Date: 2026-10-11. Requested by Jonathan in Syndicatum message 9279. Read-only study of the local Landing implementation; no Landing registry, token, deployment or source changes were made.

## Local testing handoff — 9300

Owner confirmation 9312: Jonathan sees Map in the launcher and confirms it is working. The local launcher availability/navigation scope is owner-confirmed. This does not close unrelated physical-device, outage, packaging or whole-V1 acceptance checks.

Landing has now installed the Map record at sort 45 (after Chat, before Games) and supplied app-owned PNG/WebP assets. The earlier draft below is historical; use `integration/landing/pbb-map.json` for the installed record. Open https://pbb.ph/, use Landing's existing sign-in workflow, then choose Map. Landing reports actual tile activation, HTTPS/MIME checks and online health passed. Alfred reviewed validation notes and screenshots, confirmed the installed record, exact preservation of all 11 existing app records against the backup, and byte-identical PNG branding. This supports local owner testing; no independent browser replay, legacy non-WebP browser, saved-layout reorder, packaged release or outage certification is claimed. Registration used the validated local store with backup/audit because this node has no registry token configured; HTTP authentication was unchanged.

## Integration path

User entry point is **https://pbb.ph/**, confirmed by Jonathan in message 9281. Users open the local PBB launcher there and select Map, which navigates to **https://map.pbb.ph/**. The internal registry API is an installation/administration interface, separate from this user flow.

Owner clarification 9288: **PBB Map V1 does not need Account integration.** Map remains a public application without an Account SDK, login requirement or session dependency. Landing's existing login behavior is separate; this clarification does not request changes to Landing authentication.

Landing is a lightweight PHP application. Its local `pbb.ph` surface reads private `storage/registry.json`; enabled records with launcher visibility populate `PbbLanding_Renderer::launcher`. The renderer sorts by `launcher.sort`, then display name, and emits launch URLs, app-owned image URLs and health metadata. Frontend `renderLauncherGrid` uses canonical Helper `ui.icon.grid` and navigates to the item URL on activation. No PBB Map SDK, embedding or launcher UI modification is required.

Register a `pbb-map` app through the existing Kit-owned authenticated `PUT https://pbb.ph/internal/registry/apps/pbb-map` contract. Route ID and record ID must match. This is a create-or-replace operation: use a complete reviewed payload and preserve unrelated app records. Read current registration before replacing an existing Map record. Registry writes are validated, atomically stored and audited by Landing. Never put the Kit registry token in the Map frontend or documentation.

## Proposed record

This is an integration draft, not an installed record. Icon paths below must first be created and served. Sort 40 is already used by Chat in the inspected registry (Landing message 9286); the draft value is not a recommendation and must be reconciled with node ordering. No pbb-map record currently exists. Application version 1.0.0 matches current package metadata, not a claim of release approval.

```json
{
  "id": "pbb-map",
  "name": "PBB Map",
  "display_name": "Map",
  "version": "1.0.0",
  "enabled": true,
  "install_scope": "local",
  "local_url": "https://map.pbb.ph/",
  "launch_url": "https://map.pbb.ph/",
  "health_url": "https://map.pbb.ph/",
  "audience": ["citizen"],
  "launcher": {
    "visible": true,
    "sort": 40,
    "logo_webp_url": "https://map.pbb.ph/assets/launcher/app-icon.webp",
    "logo_url": "https://map.pbb.ph/assets/launcher/app-icon.png",
    "logo_kind": "mark"
  },
  "public_gateway": { "enabled": false }
}
```

Landing requires both absolute HTTPS image URLs for visible records: WebP primary and PNG fallback. Existing Map PNG branding provides a source asset, but no matching launcher directory/WebP pair currently exists. Use the existing original Map mark, square, text-free, transparent where possible and legible at 44 pixels. Map's static document root is the project root; the assets belong under `assets/launcher`, even though Landing's generic app convention describes `public/assets/launcher`.

Landing health checks run server-side through `/api/launcher/health`; they use HEAD with TLS verification and a GET fallback for HTTP 405 or no HTTP response. Any 2xx is online; 3xx/4xx warning; remaining failures offline; absent/invalid URL is unknown. The static Map root can provide advisory application reachability without adding PHP. This does not certify MapServer tile availability, geographic cache coverage, geolocation or WebGL. Confirm HEAD/GET response and trusted local certificate on the actual node before registration. No browser CORS API is needed for this health flow.

Current Landing opens a required login modal after successfully hydrating an unauthenticated Account identity (`initializeAccountIntegration` calls `openLoginModal({ required: true })`). Login-independent launcher access is therefore not guaranteed. Registering Map does not require adding Account or Realtime to Map; preserve Landing's existing access behavior during integration. `audience` is display metadata, not authorization. Keep public gateway disabled: Map is a citizen browser application, with no machine API namespace to proxy. An enabled registry record also appears as an available service in the public projection, while public endpoint publication depends on gateway configuration; account for that metadata effect.

## Implementation checklist

- [ ] Produce app-owned WebP/PNG launcher marks from existing Map branding and verify both served with correct MIME types and transparent/cropped appearance.
- [ ] Confirm local node DNS/TLS resolves `map.pbb.ph` and its configured MapServer; launch URL opens the existing full-screen app.
- [ ] Validate a complete `pbb-map` record against Landing's current registry validator; reconcile sort position and existing registration.
- [ ] Include launcher metadata/assets in the eventual Map release/installer and Kit registration flow; this study does not establish a Map installer contract.
- [ ] Register through authorized Kit/local registry administration, preserving token secrecy and other records; do not make Map self-register from the browser.
- [ ] Verify canonical launcher tile label/images, WebP detection and PNG fallback, activation URL, reorder/layout retention, health states and public metadata projection.
- [ ] Confirm hidden/disabled records disappear as expected and existing Launcher apps remain unchanged.
- [ ] Record actual browser/node evidence; do not substitute an online root response for upstream-outage certification.

## Inspected sources and limits

Landing `README.md`, `docs/pbb-landing-design-contract.md`, implementation checklist, `src/App.php`, `src/RegistryStore.php`, `src/Renderer.php`, `src/HubProjection.php`, frontend launcher logic and release metadata were inspected. Actual validator/source takes precedence where historical contract examples differ (for example the older SVG-only sample cannot satisfy current visible-app PNG/WebP requirements). No live registry request, credential inspection, mutation, browser integration test or installer execution was performed. Implementation is the next step for Developer under the existing integration direction.

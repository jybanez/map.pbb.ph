# Device offline cache design and UX

2026-10-11 · Owner request 9319, following cache-first discussion 9317. Design for review; no runtime implementation or project-plan structural change is made by this document.

## Intended behavior

Save map resources automatically as users browse. A repeat request uses the device copy first. A miss fetches from the configured MapServer and stores a copy of a successful response without delaying its display. No region download, location-history log, Account dependency or background geographic prefetch is introduced. This works in a controlled browser tab as well as an installed PWA; installation alone does not populate offline coverage.

The device can reopen Map and explore saved resources after losing the node. New areas, zoom levels or fonts may be unavailable. Saving a viewed location is not a promise that every zoom or layer there is saved. GPS and direction availability remain browser/device dependent and are separate from offline tile availability.

## Resource architecture

Owner-approved refinement: tile caching is a first-class PBB Map capability and must not depend on a service worker. Use MapLibre GL JS 4.6.0 `addProtocol` as the shared asynchronous resource-loading entry point. A PBB Map cache controller owns lookup, admission, refresh, deduplication, budgeting and recovery behind a storage adapter. `transformRequest` may synchronously route approved URLs to the custom protocol; it is not an asynchronous cache lookup. Preserve cancellation through the protocol's abort controller and verify each resource type's expected return format, including terrain, glyphs and sprites.

| Runtime | Storage and startup |
| --- | --- |
| Browser / installed PWA | Cache Storage for responses, IndexedDB for metadata; a separate service worker supports offline app-shell startup |
| Packaged Capacitor / Cordova Android or iOS | Prefer the same Cache Storage/IndexedDB adapter where validated under the actual WebView origin; use native persistent files/database if availability or durability requirements demand it. App-shell assets ship in the package |

Both environments share the cache-first policy. Cache Storage is available to page scripts independently of service workers; absence of service-worker support does not establish absence of Cache Storage. Prefer one web-storage adapter when it passes actual wrapper-origin read/write and cold-restart tests. API exposure alone is insufficient: validate binary responses, metadata, quota failures and persistence under the selected WebView configuration on real devices. A native adapter is conditional, not automatically required for Android/iOS. If needed, native resources use persistent app storage rather than an OS-purgeable temporary cache directory; uninstall, explicit app-data removal and storage failures remain limitations. Native packaging is a future target, not an existing feature.

| Resource | Proposed policy |
| --- | --- |
| HTML, JS modules, Helper/MapLibre assets, CSS, original icons, style | Versioned app-shell precache; activate only a complete validated shell |
| Vector and POI tiles, terrain images, glyph ranges, style-dependent sprites | On-demand cache-first, scoped to explicit configured URLs and dataset version |
| Account, Landing registry, sensors, location fixes, external APIs | Never stored by this feature |

The shared protocol loader handles approved MapServer resources without service-worker interception. The web service worker owns app-shell availability only; it must not introduce a second tile cache or competing refresh/eviction policy. Only approved GET resources and successful readable responses are admitted; browser requests must satisfy CORS. Reject HTTP failures, unexpected redirects/hosts, opaque responses and invalid resource types. Native transport preserves the same host, status and content validation. Verify actual CORS/cache headers and provider caching terms before implementation; existing server cache permission does not establish device redistribution rights.

Keys retain origin, resource path, meaningful query/version and tile zoom/x/y. Include configured server and dataset/style generation so different nodes or datasets are not silently conflated. Do not remove query parameters generically. File resources keep exact deployed revisions. Changing app-shell version must not discard compatible tiles unnecessarily; dataset changes must not reuse incompatible tiles.

Return fetched resources promptly; clone browser responses or retain native binary data for bounded storage writes. Writes are best effort across process termination; restart reconciliation repairs incomplete metadata. Concurrent identical misses share one fetch where safe; canceling one consumer must not abort other active consumers. Cache/metadata failures must not break a successful online response. If storage is unavailable, preserve online mapping and record classified diagnostics internally; show user feedback only when map availability is affected. Reconcile orphan metadata/cache entries after crashes; do not treat estimated accounting as guaranteed disk usage.

Use a proposed 100 MiB map-resource budget, additionally bounded to 20% of reported origin quota where available; reserve the shell separately. These are initial engineering defaults, requiring device validation. Evict least recently used map entries first, serialize accounting/pruning and enforce both byte and entry ceilings. Stream/type-specific response-size caps prevent oversized admission. On quota failure prune once, retry the cache write once, then disable further writes for that context and record the problem internally; never loop or lose the online response. Browser storage estimates are approximate and storage can be evicted externally.

Cache-first uses a refresh trigger, never an offline expiry: proposed seven-day refresh age for tile resources, with bounded request-driven refresh while connected. Saved readable tiles remain available offline regardless of age. Failed refreshes must preserve the existing copy; replace it only after a successful validated response has been stored. Age alone must never delete, reject or hide a saved tile. Honor server no-store/private restrictions at admission. Dataset updates must preserve a coherent previously saved offline dataset until its replacement is usable; never delete the only saved coverage solely because a new version exists. Refresh is managed automatically; no manual refresh or cache-management action is exposed. The first version avoids downloading everything in the background. Cache admission and eviction do not save a GPS trail, but tile URLs reveal viewed areas and must be covered by the local-data explanation.

## UX changes

Owner-approved connectivity indicator: compose canonical Helper `ui.signal.strength` in compact bars-only mode immediately before the navbar compass/map controls. Label it “MapServer connection” through its tooltip and accessible description. It represents observed server connectivity, not Wi-Fi strength or saved-map completeness; zero bars must not disable cached mapping. Use neutral state when unknown, and avoid inventing graded quality until an explicit measured mapping is defined. This indicator is informational, with no cache-management workflow.

Request a supported `onStateChange` callback from Helper, delivering previous/current normalized state only when state changes. Inspect existing component conventions before adding it; preserve current rendering, update/getState/destroy APIs and existing consumers. PBB Map's connection adapter owns observations, recovery and caching independently of indicator callbacks. Callback delivery must not create feedback loops, duplicate recovery or break component updates if a consumer callback fails.

Owner refinement: caching is a first-class, automatic part of PBB Map, unmanaged by the user. Preserve the existing navbar, menu and floating controls. No Offline maps entry, storage modal, cache settings, Clear saved map data action, saving notice, progress counter or storage-permission prompt is added. Saving, refresh, budgeting, recovery and lifecycle decisions belong to the app.

| State | User-facing behavior |
| --- | --- |
| Connected browsing or successful cached rendering | Normal map experience; no cache status or toast |
| Requested detail unavailable after network/cache miss | “Some map detail is unavailable. Reconnect to load more.” Keep available map and controls usable |
| Cache write/quota failure while the map still renders | No interruption; bounded internal recovery and diagnostics |
| Connection recovers | Automatically retry currently needed missing resources through normal bounded map recovery; clear feedback after observed recovery |

Use existing canonical Helper feedback for actual map availability failures, accessible and deduplicated rather than per-tile messages. Do not infer MapServer reachability solely from navigator.onLine. Distinguish optional terrain/POI gaps from a wholly unavailable basemap. No blank substitute tile may be cached as valid data. Search remains loaded-tile POI search; caching does not introduce an all-cache search index.

Describe automatic local map storage in project/help/privacy documentation, without requiring a caching workflow. Tile URLs can reveal viewed areas; GPS fixes and sensor samples remain ephemeral. Browser/site-data controls remain available outside the app. Any developer reset utility must be separate from the product UI and coordinate in-flight writes so a reset is reliable.

PWA installation uses a manifest and local icons with native browser affordances where supported; guidance is available only on request. No compulsory install prompt or “Keep saved maps” action. Storage persistence may be used only where supported without introducing a user-managed permission workflow; record actual outcomes internally and retain the browser-eviction limitation.

## Updates and lifecycle

Precache the complete recursive runtime graph, including renderer worker dependencies and direction imports; verify actual requests, not just top-level HTML. Use a stable worker URL and coherent shell manifest. Failed shell updates retain the old working version. A waiting worker offers a canonical “Update available” action; avoid forcibly taking over an active old page with incompatible assets. Clean obsolete shell caches only when safe for active clients. Disconnected cold startup uses a cached navigation response, not an online-only HTML redirect.

Tile caching survives Map recreation and works when service workers are unavailable or disabled. Map teardown releases loader consumers and listeners, without deleting saved resources. Native bridge and web shell-worker contracts validate action/version and scoped caller identity; return classified state, not credentials or sensor data. No service worker is registered for Landing or sibling origins. Private/incognito or unsupported storage gets an honest online-only fallback. Native startup uses the bundled recursive runtime graph and package update lifecycle rather than a cached navigation response.

## Implementation and acceptance checklist

- [ ] Inspect existing complete Helper feedback capabilities before availability-status integration; preserve the current controls/menu.
- [ ] Verify MapServer/provider device-cache permission, CORS, status/MIME behavior, bounded resource sizes and dataset key policy.
- [ ] Implement and validate coherent shell precache, manifest, stable worker/update behavior and optional browser fallback.
- [ ] Implement response cache, admission rules, concurrent misses, metadata reconciliation, LRU budget and quota recovery.
- [ ] Implement the shared `addProtocol` loader and browser storage adapter; verify typed resource results, cancellation, shared misses and operation without a service worker.
- [ ] Before native packaging, validate Cache Storage/IndexedDB under actual Android/iOS wrapper origins, binary read/write, restart durability and bundled offline startup; implement a persistent native adapter only for a verified capability or durability gap.
- [ ] Implement fully automatic saving/recovery across tabs, with feedback only for unavailable requested map detail; no cache-management UI.
- [ ] Online browse warms actual vector/terrain/POI/glyph assets; cache-hit tests prove repeat requests do not fetch tiles still within the refresh interval; older saved tiles remain usable.
- [ ] Block MapServer and app origin, close/reopen installed app and ordinary controlled tab: shell plus saved view loads without network.
- [ ] Pan/zoom into uncached coverage: clear partial feedback, no false tiles, map controls remain usable; reconnect loads missing detail.
- [ ] Verify original person, ripple, search, POI filters, Locate and direction do not acquire storage/upload side effects.
- [ ] Verify saved tiles remain usable beyond refresh age during prolonged disconnection; failed refresh and failed replacement writes preserve the old copy. Age alone never removes coverage.
- [ ] Verify dataset/server changes preserve a coherent saved offline fallback, failed shell update, multiple clients and old-client compatibility.
- [ ] Verify quota/denied storage, oversized/error/opaque responses, browser eviction, metadata reset/maintenance during in-flight fetch and generation safety.
- [ ] Verify no cache menu/modal/settings or saving prompts appear; availability feedback is accessible, deduplicated and clears on recovery.
- [ ] Test Chromium plus actual Safari/iPhone installed behavior; record unsupported features and actual device limits.

Initial scope excludes bulk region downloads, saved-area coverage polygons, full-cache POI indexing, routing, Account integration and guaranteed permanent storage. Owner review of this design precedes implementation handoff; pending permission/provider findings are technical prerequisites, not a claim that the feature exists.

## Sources

[MapLibre 4.6.0 protocol API](https://github.com/maplibre/maplibre-gl-js/blob/v4.6.0/src/source/protocol_crud.ts) provides the asynchronous custom loader. [Capacitor configuration](https://capacitorjs.com/docs/config) documents different Android/iOS local schemes; [WebKit's service-worker discussion](https://bugs.webkit.org/show_bug.cgi?id=206741) describes the HTTP/HTTPS requirement and custom-scheme limitation. These constraints motivate a shared cache controller independent of service workers.

[MDN PWA caching](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Caching) documents cache-first interception, cloned responses, cache refresh and shell caching. [Storage estimates](https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/estimate) are approximate origin-level usage/quota. [Persistence requests](https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/persist) are browser-dependent. Numerical budgets and freshness age above are proposed application policies, not browser guarantees.

# Personal-layer UI sequence — task209

Implementation is in progress under owner9461/9463 and Alfred9462/9465. This document supersedes the task206 modal workflow description for the current application; task206's acceptance record and historical browser fixtures remain unchanged. No task209 implementation acceptance, push or deployment is claimed.

## Component ownership

The Layer launcher opens a compact card immediately with the complete Helper busy overlay while initialization is pending. Its complete navigation stack has chrome disabled. Page1 uses complete map-control actions and a personal-layer select; Page2 uses complete inline text for the layer name and complete map-control actions for Save/Close/history/deletion. A complete drawing toolbar sits beneath the launcher. The app positions a complete object-action toolbar using the canonical adapter's geographic anchor and clamps it to the map viewport, reserving the tool rail's space.

The application now mounts `assets/personal-layer-ui.js`. The previous `assets/personal-layers.js` controller remains a historical implementation and is no longer imported by the application or included in the current shell dependency graph. The separate authored store remains unchanged.

The single-field name prompt uses the complete declarative form modal. This is the verified convenience-prompt gap recorded in9468 and independently confirmed in9473: reviewed294's convenience prompt hardcodes automatic busy, lacks associated field errors and exposes no managed lifecycle. Required, max80 and case-insensitive unique-name validation precedes busy or writes. Inline-name validation retains values and accessible field errors, with a canonical draggable structured alert. The complete action modal supplies context-aware deletion and three-way dirty Close.

The original drawing adapter has no object checkpoint/rollback or style-update API; gap9467 is tracked by Helper task210. Proposed object-session runtimes remain subject to Alfred's exact-head review before adoption. The integration code uses supported captured-session APIs, schedules selection-driven session entry after read-only adapter callbacks, and does not implement an application drawing engine or replacement-import rollback.

## Draft and persistence boundaries

Creating a layer commits its empty named record once and enters editing only on confirmed success in the same map context. Geometry, object styling and inline name changes stay in the layer draft until explicit Save. Save validates the name, explicitly accepts an active completed-object session, persists the complete layer through the existing revision/CAS transaction and remains on Page2. Unfinished line/polygon drafts require explicit Finish or Cancel before Save.

Clean Close returns to Page1. Dirty Close offers Save and close / Discard / Keep editing. Failed Save keeps editing and the modal open, retains recoverable values, disables further storage mutations and offers explicit JSON export. There is no automatic replay after an uncertain write. Discard rolls back the supported object session and drops the layer draft without replacing saved data. Object Finish/Cancel operate within the layer draft and are separate from durable layer Save.

Canonical beforeDelete veto/one-shot confirmation remains the deletion boundary for the toolbar, public adapter API and keyboard Delete/Backspace. App snapshots additionally guard map, layer, adapter, epoch, saved revision and editor state. Undo/Redo also require the retained authored-removal confirmation. Canvas Ctrl/Cmd-Z/Y interception is narrow; text inputs remain native. Personal-layer navbar visibility is locked during editing/writing/failure while unrelated layers remain independently available.

The authored database remains `pbb-personal-layers-v1`, version1, store `documents`, schema1. Cache clearing cannot delete it. The inactive-layer renderer uses source-only paint properties derived from canonical `properties.helperStyle`, retaining explicit alpha0; stored/exported features contain no paint bookkeeping. Active editing uses the canonical renderer. Map style reconciliation restores both renderers. Map replacement retains accepted layer changes and inline drafts; object previews are restored through supported begin/update APIs. A forced replacement during an unfinished shape cannot restore its vertex-input history with the current canonical API; the UI reports that the unfinished shape needs redrawing. Automatic resource recovery is already deferred while editing.

## Verification record

Current checks completed on Chromium desktop1200/mobile375:

- `verify-personal-ui.js`: compact card, disabled no-selection actions, create and inline validation, explicit Save, dirty Keep/Discard, cancelled layer deletion, exactly three Helper requests, no page errors. Mobile screenshots inspected.
- `verify-personal-ui-drawing.js`: actual point/line/polygon creation, explicit Save boundary, history cancellation and confirmed canvas keyboard undo/redo, Pan gesture, unfinished-drawing Save guard, native inline Backspace/Escape and Clear cancellation; navigation restored at both widths, no page errors.
- `verify-personal-ui-storage.js`: injected quota failure in actual IndexedDB write; failed Save-and-close stays editing, prior saved record remains intact, one failed write/no replay, exported backup contains the unsaved feature, explicit Discard returns to management.
- `verify-personal-ui-context.js`: visible immediate busy loading and dismissal, late creation cannot enter an invalid map context, inline draft survives map replacement, a late save cannot resurrect a destroyed renderer/editor, no replay/page errors.
- `verify-personal-ui-read.js`: denied and corrupt authored storage stay visible/dismissible; no creation action or overwrite, corrupt record remains intact.
- `verify-bundle-only.js`: six missing/broken bundle/factory cases, including the personal-layer select, show an error without modular fallback; cold offline page serves all24 required factories,42 shell files and exactly three Helper assets, no page errors.
- `npm test`:55/55 passed, including pinned asset integrity and existing authored-store/CAS contracts.

`verify-personal-ui-objects.js` is prepared for the reviewed object-session runtime and has not yet been run. It checks actual pointer rollback/Finish, complete picker alpha0, one coherent undo unit, Save settlement, numeric0, viewport positioning, style rehydration and offline storage round trip. Final runtime pin, shell version, exact integration commit and independent review are pending.

Physical touch, Safari/native and assistive-technology acceptance, a full browser-process restart, deployment and indefinite browser storage durability remain unverified.

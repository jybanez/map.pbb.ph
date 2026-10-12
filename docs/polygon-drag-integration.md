# Polygon whole-object integration — task 231

Owner message 9894 authorizes the fix; Alfred message 9897 assigns application integration. Runtime adoption requires independent exact-head library acceptance and verified merge first. Current application baseline is 51dd77d25fcb7aaf57bf315c87c8d9c6844f9f99. No local geometry workaround, push or deployment.

## Actual-app verification matrix

Use uniquely owned Chromium contexts and existing personal layer management/Edit workflow. Seed authored IndexedDB only in disposable contexts. Await actual selected-feature rendered-source readiness and confirm the native pointer target is the map canvas before input. Record camera, live source geometry, persisted document, and drag toolbar state separately.

Run 1200px and 375px viewports, each flat (pitch/bearing 0/0) and tilted/rotated (45/35). Include numeric feature ID 0, generic/unrecognized shape metadata, closed outer ring plus hole, and overlapping features.

- Selected interior and outer/inner edge moves uniformly translate all rings; vertex handles retain priority and reshape rather than translate.
- Hole interior pans the map without moving geometry; overlap arbitration does not drag a selected feature beneath the top hit.
- ID, properties, unknown metadata, ring count/order/winding and exact closure survive edits, Save and reload.
- During movement, object toolbar is hidden, layer controls remain available, persistence is blocked, and storage remains unchanged. Pointer release restores applicable controls.
- One release creates one Undo/Redo unit. No-op and wholly rejected movement produce no history. Boundary rejection remains atomic and recovery retains the last valid preview.
- Escape, pointer cancellation/lostcapture and map/context replacement restore the active gesture without erasing earlier committed changes. Classify dispatched cancellation events as synthetic.
- Explicit Save, dirty Close and failed-storage preservation/no automatic replay remain covered by existing fixtures. Save/reload/offline roundtrip preserves authored geometry and metadata.
- Re-run affected Circle/Rectangle, Line/Path, boundary, context and storage fixtures against the adopted exact head. Do not claim physical touch, Safari or assistive technology verification from viewport mouse checks.

## Adoption and review

Inspect accepted Helper head, merge parents and tree independently. Reconcile canonical artifact manifests and normalized hashes before copying runtime; update pinned vendor metadata, loader/cache versions, dependency graph and shell hashes coherently. Validate exactly loader, UI bundle and CSS requests with zero modular fallback, including fail-closed cases and offline shell.

Preserve unrelated working files. Submit exact application commit/tree, focused diff, reproducible browser evidence and limitations to Alfred. Application task remains in progress until submission and independent review; acknowledge Work message 9897 only after its requested handling is complete.

## Helper progress — message 9902

Library task 230 is implementing on map/polygon-body-drag from main 7d92d2b. Helper reports final adapter/main UI 306 regression verification in progress; no accepted or merge-verified candidate is available yet. Preserve the existing strict two-dimensional coordinate import contract; do not expand accepted coordinate dimensions during app integration. Include regression coverage for Rectangle handles after the reported body-gating correction, plus topmost overlap arbitration and hole/transparent-edge behavior. These are reported interim results, not independently verified acceptance evidence.


## Library acceptance — message 9909

Alfred independently accepted PR 169 head 03fe6b697fee26a4a67c2c537e3f77b37da96721, tree 222b516c4b3ba2b5db19fab63e87d483ed33c8a6 on base 7d92d2b. Task 230 is complete for the reviewed library scope. Adoption remains gated on Helper's merge report and independent merge-parent/tree verification. Do not vendor the branch merely because it is accepted. If head/base/runtime changes, require renewed review.

Expected candidate revisions: adapter/main UI 306; core/icons/game 303; CSS 297; picker/form 294; Timeline 299; package 0.21.83. Only main UI JavaScript distribution changed. Existing adopt-personal-runtime script still pins the previous accepted merge and must only be updated after the new merge identity is verified. Then refresh app loader reference/cache query, normalized vendor provenance and shell graph/manifest before actual-app checks.

## Adopted runtime and verification

Independently verified merge 8858eed7cd92d4668ec9641a886d05426c5d60b7: parents 7d92d2b0a21f25e52c3e2f3e8065ca6d3b343005 and 03fe6b697fee26a4a67c2c537e3f77b37da96721; tree 222b516c4b3ba2b5db19fab63e87d483ed33c8a6 equals accepted tree; accepted-to-merge diff empty. Adopted canonical adapter/main UI 306 with existing core/icons/game 303. App cache query 20261013-polygon1. Shell 7cc06c4cd13bf64dad95: 42 files, 4,242,831 bytes, 29 Helper roots/dependencies. All 55 app tests pass.

Four actual-app Polygon cases pass at 1200/375 and flat/45-degree pitch with 35-degree bearing: exterior/interior edges, body and vertex, uniform two-ring translation, unknown metadata/numeric ID 0/closure, native camera arbitration, one Undo/Redo unit, committed getter excludes preview, no premature persistence, drag toolbar hide/restore, Escape and synthetic cancellation, explicit Save/reload. Exactly three Helper assets and no page errors.

Fixture-only adapter observation rewrites the browser response assignment to expose the canonical adapter. Service workers are disabled in these observed cases; offline persistence is checked separately in unmodified-runtime fixtures. No production debug hook or geometry implementation was added. Initial fixture failures were stale layer list after storage seeding, factory capture after preload, and Escape focus remaining on Undo. Fixture now reloads seeded data, observes adapter through browser-only assignment, and focuses canvas for Escape. These failures establish fixture corrections, not production defects. Physical touch/Safari/native RGB/assistive technology remain unvalidated.

Final affected regressions: Line/Path, failed-storage preservation/no replay, four object-context readiness/cancellation cases, and bundle-only failure/cold offline checks passed. Shape fixture initially failed at Keyboard Circle in the grouped run; unchanged isolated retry passed both widths including keyboard Circle/Rectangle, preview/resize/move, cancellation, styles, Save/offline. Original cause remains unknown; no production fix inferred from retry. Separate unmodified-app native Polygon movement, explicit Save and offline reload passed at 1200 and 375 with no page errors.

Independent library review already ran all eight Polygon source/bundle immediate/session body/lifecycle and boundary/no-op scopes on the exact accepted tree. Application verification does not claim a physical touch or Safari rerun. All owned browser contexts close in fixture cleanup.

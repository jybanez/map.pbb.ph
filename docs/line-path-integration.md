# Line and Path integration — task218

Task214 was independently accepted at `2dc3cc0ae5c32a45f4b036086146dd3013cd77c3`; acceptance documentation is `c13a4db`. Task218 is separate. Helper task219 owns the canonical implementation. The contract recorded below was proposed before canonical review. The runtime adoption and actual-app evidence section supersedes those historical status statements.

Use the complete drawing adapter with explicit `lineBehavior:'segment'` and the complete toolbar's distinct `path` mode/icon. Line anchors on first click, previews to the pointer and completes exactly two vertices on second click. Path adds segments until Finish or double-click, without duplicate endpoint or map zoom. Omitted option preserves legacy consumers. Newly authored LineStrings use `properties.helperDrawingKind:'line'|'path'`; metadata-free imports remain unchanged and are interpreted as paths. Preserve existing properties, helperStyle, numeric-zero IDs and alpha-zero styles through save/export/offline reload.

Segment gestures translate all vertices by one geographic delta from the original snapshot; vertex handles take hit priority and reshape individual vertices. Consume canonical edit-session, dirty, Finish/Cancel, reversible history, navigation and removal/reentrancy guards. Preserve application draft/Save/close validation-before-busy, storage failure retention and no automatic replay. Verify desktop/mobile widths and rotated/tilted cameras, including the added Path rail, using exactly three Helper assets without modular fallback.

## Proposed boundary policy and evidence

Helper9679 specifies the primary projected copy, atomic candidate rejection beyond longitude[-180,180] or Mercator latitude ±85.0511287798066, an original outside Mercator limits, or a longitude delta exceeding180°. Retain the last valid preview. Do not clamp vertices, wrap individually, split seams or migrate imported geometry. App constraints must not duplicate the canonical geometry policy.

Alfred9681 adds these required cases:

- Rejected movement followed by return to valid movement.
- A wholly rejected/no-op gesture creates no history change.
- Valid preview followed by rejected release commits only that valid preview as one Undo unit.
- Cancel or removal restores the original snapshot and navigation.
- Imported out-of-range coordinates remain intact when segment translation is unavailable.
- Document and test canonical vertex-editing behavior separately from segment restrictions.

Adopt only an independently reviewed, merged exact runtime after tree/hash verification. Submit the final task218 application head and actual evidence to Alfred; no self-completion, push or deployment is implied.

## Proposed implementation9691

Helper submitted PR166 exact7c95a391b8a402c742adf66724992a6ee0d562c7 for Alfred review; main remains d782a75 pending acceptance/merge. Proposed runtime302 adapter/core/icons/main/game, CSS297/picker294. Canonical Path icon map.path; getDrawingKind(id) identifies untouched metadata-free imports as paths. Vertex editing retains canonical longitude±180/latitude±90 validation, distinct from segment Mercator restrictions. Helper reports expanded boundary, legacy/new drawing and removal-mid-drag evidence; these are Helper-reported results, not app verification or acceptance. No runtime adopted.

## Runtime adopted for application verification

Helper9697 confirms Alfred9695 accepted head 7c95a391b8a402c742adf66724992a6ee0d562c7, merged as cfc1d4e7ef327983c710036fd8e4b43e7b0cc3dc with identical tree 4b03f4d4dbf623160a3863a0dd6487cf86511fdc. The adopter independently checked tree equality and all 43 normalized hashes before copying runtime302. Application enables segment Line and distinct canonical Path through the complete adapter/toolbar.

Actual-app testing exposed cleanup after external map removal: the accuracy ripple queried absent style layers, and page teardown removed the map again. Guards now skip those operations after style disposal; personal-layer cleanup also avoids disposed style access. No canonical geometry policy is duplicated.

The app Line/Path fixture uses rendered hit readiness, settles clean selected-object sessions with canonical Pan before testing global history, and places drawing clicks clear of mobile controls. Boundary fixture uses zoom7 at high latitudes because zoom4 constrains the camera and places geometry behind the mobile toolbar; zoom6 still overlaps the expanded manager card. These were fixture corrections, not geometry changes.

## Actual application verification

Passed npm test: 55/55. Syntax checks and shell integrity --check passed. Shell929ce4c800fa81fd076b contains42 assets,4,235,934bytes and29 Helper roots/dependencies.

Passed actual-app Line/Path tests at1200/375: first-anchor live preview, second-click exactly-two-point Line, canonical Path icon and three-point double-click finish without zoom/duplication, two-point explicit Finish, whole-segment translation at bearing30/pitch40, vertex priority, one gesture Undo/Redo, Escape rollback during drag, unchanged legacy ID0/alpha0, explicit Save and offline reload. An inactive metadata-free latitude86 import remains byte-identical through saving another layer and offline reload; this checks preservation, not pointer dragging an unrenderable import.

Passed actual-app longitude/latitude boundary fixtures at1200/375: atomic rejection, invalid-to-valid recovery, wholly rejected no-op without history, last-valid release with one Undo/Redo, Cancel restoration and external map removal during drag with navigation restoration and no persistence. Latitude vertex editing above Mercator but below90 retains the distinct canonical contract. No page errors including context teardown.

Passed regression scripts: drawing, selected, objects, layout, launcher-close, save-close, storage, context and bundle-only. Layout320/375/390/850landscape/1200: rails/card do not intersect; single action row and no horizontal overflow. Storage failure keeps edits/prior saved state without automatic replay. Context tests reject late create/save, retain inline draft and loading cancellation. Bundle failures show actionable feedback with zero modular requests; offline cold startup resolves24 factories, terrain/location-person/POIs/model. Exactly3 Helper asset URLs.

Fresh desktop/mobile Line/Path and320layout screenshots uploaded to the project. Browser tests use Chromium pointer automation at mobile widths; physical touch, Safari and assistive technology remain unvalidated. Task218 requires independent final-head acceptance; no push/deployment or self-completion.

## Independent review status — Alfred9722/9729

Alfred independently passed npm55/55 and the unchanged f926f2f boundary suite at1200/375 for longitude/latitude, including rejection/recovery/history/Cancel/vertex latitude/external removal and error-free teardown. This does not resolve his separate tilted vertex sequence failure9722. Task218 is reopened in_progress; application acceptance is withheld pending mechanism diagnosis and exact-head resubmission. An instrumented diagnostic retry passed locally but is not evidence that the failing mechanism has been fixed.

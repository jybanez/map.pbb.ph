# Line and Path integration — task218

Task214 was independently accepted at `2dc3cc0ae5c32a45f4b036086146dd3013cd77c3`; acceptance documentation is `c13a4db`. Task218 is separate. Helper task219 owns the canonical implementation. The following contract remains proposed, pending exact-head review and verified merged provenance; no runtime adoption or passing task218 implementation evidence is claimed.

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

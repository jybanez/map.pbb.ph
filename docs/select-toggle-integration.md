# Select toggle — task 233

Owner approval 9928 and Alfred assignment 9930 authorize replacing the visible Select/Pan pair with the complete canonical Select toggle. Alfred accepted Helper candidate 35d2eea59fd6220529e6addebf054f3a911750ba, tree 7cfd2421ae350c967fa16eca4edd28bd33831af7 in message 9977. Independently verified merge 8842c65cdf5937a15e535a7be65b93b5c342f4e4 has parents 8858eed7cd92d4668ec9641a886d05426c5d60b7 and that candidate, with identical tree and empty candidate-to-merge diff.

The app opts into `selectToggle:true` on both canonical adapter and toolbar. The toolbar owns button visibility, keyboard focus, pressed state, accepted mode synchronization and visible pending-work reasons. The adapter owns selection retention, hidden handles, navigation-only pointer/keyboard behavior and construction completion. No application geometry or control replacement is introduced. Existing mode/capability-driven object actions already disappear in Pan. The app's capture-phase Undo/Redo handler also respects Pan, so it cannot bypass the adapter's navigation-only keyboard guard. Explicit layer actions remain available.

Pending draft, redo-only draft, style transaction and active drag reject mode transitions. Explicit Finish/Cancel remain the supported way to settle work. Same-mode requests do not add history; all completed constructions return to Select. Save, dirty Close, lifecycle and storage protections remain separate from mode changes.

Pinned canonical adapter/core/main UI revision 307; icons/game 303 and CSS 297 retained. Runtime adoption checks normalized artifact hashes and copies committed bytes. App cache query is `20261013-select1`; shell manifest must be rebuilt from final files. Production still requests exactly loader, UI JavaScript bundle and CSS with fail-closed bundle loading.

Browser verification uses disposable owned contexts and browser-only adapter exposure, never a product diagnostic hook. Native mouse/keyboard at 1200/375 widths do not validate physical touch, Safari or assistive technology. The first off-pan fixture failure targeted a persistent warning toast at mobile fractional position .9/.9; captured target/camera/navigation evidence confirmed the canvas was covered. Fixture corrected to .9/.5 and asserts canvas hit before input; no pan runtime fix inferred. Helper's separately captured baseline rendered-handle race motivated its canonical fixture readiness correction; Alfred's original uncaptured failure remains causally unproven.


## Verification and limits

All 55 app tests pass; source syntax and scoped diff checks pass. All 206 vendored file hashes match. Final LF-byte shell `2a1c98cc1b6e24257ab6` includes 42 files / 4,247,036 bytes and 30 Helper roots/dependencies.

Native mouse/keyboard checks passed at 1200 and 375 pixels. Initial flat and tilted matrix verified default/keyboard toggle, hidden handles/toolbar, retained numeric ID 0, off pan, restored body/edge/vertex edits, prior Undo/Redo, pending draft rejection/status, Point completion, explicit Save/reload and exactly three Helper assets without page errors. Final tilted matrix additionally verifies selected and separate unselected object pan, wheel zoom, right-button tilt/rotation, existing-history keyboard guards while off, ring/hole metadata and transient cancellation. All six construction tools independently passed native completion and explicit Cancel at both widths. Cancel events for lost capture/pointer cancel are synthetic; keyboard Escape is native.

Existing context, failed-storage, Save/Close, launcher-close and object/context regression scopes pass. Final offline run passes all six fail-closed bundle configurations and cold offline loading of 25 factories, terrain, POIs and person rendering; no modular requests or page errors.

Additional unselected-object fixture development found an out-of-viewport mobile release path after consecutive pans. The target is now placed inward and endpoints checked against viewport bounds. The first immediate zoom assertion and subsequent timeout runs are retained in ignored logs; their uncaptured exact failure locations are not claimed as production defects. The final fixture waits for the wheel camera transition before asserting settled state. An earlier offline timeout occurred while the working-tree handler and shell manifest were being updated; final stable manifests passed twice, including normalized LF bytes. No production pan/zoom fix is claimed for fixture failures.

Source/bundle default compatibility and draft-redo/style/direct-transition rejection are covered by Alfred's independent exact-head canonical library review; the app tests above cover its integration. Physical touch, Safari and assistive technology remain unvalidated. No push or deployment.

# Person perspective scaling — accepted

> Current implementation note (2026-10-18): Task286 uses accepted canonical perspective min/max34 with actual mesh extents; Alfred independently accepted the application runtime in11243. See [consistent person size](person-consistent-size.md). The prior accepted app used a12m reference with8–64px bounds. This report preserves the earlier renderer acceptance; see [current status](current-project-status.md) for the current complete application.

Task193 integrates exact accepted Helper23b421eca5f91f92e11d714c08e8f93a54080f60/runtime0.21.282 at application revision20261011-person-perspective1. Canonical createPerson receives scaleMode:perspective, modelHeightMeters12, minSizePx8/maxSizePx64; no renderer override. All six handoff artifacts copied from Git objects and checked against Helper manifest; vendor inventory updated. Loader/main JS/CSS resource queries use0.21.282, complete app import graph gets a new revision. showDirectionTools=false and independent Enable direction retained.

34/34 tests pass including all asset hashes (docs/evidence/person-perspective-unit.txt). Actual app browser app-perspective-terrain-browser.txt moves the camera around fixed synthetic coordinates: zoom17/pitch60 envelope near31.61px/far17.73px desktop1200; mobile375 ordering also passes. Actual85-degree pitch at zoom8/15/20 stays8–64px; ordinary2D renders. Heading90 update passes. Resource URLs confirm reviewed loader/bundle; no uncaught page errors. Test-only response capture exposes the canonical instance without changing behavior. Desktop near/far screenshots inspected; marker visibly smaller farther away. Some later mobile/high-pitch views use flat fallback after real MapServer terrain CORS error; these do not prove unrestricted terrain coverage.

app-perspective-horizon-visible.txt records85-degree visible near-horizon marker13.00px. An attempt above the geometric horizon correctly records not-visible/projected0 (app-perspective-horizon.txt). Full-model envelope differs from painted pixels, bounds deliberately plateau. No guarantee of offscreen/terrain occlusion or physical-phone performance.

perspective-lifecycle-browser-final.txt passes location movement, accuracy polygon, terrain disable, invalid elevation fallback, retry, style reattachment, coordinate destination and teardown, errors[]/external[]. Earlier lifecycle fixture failures are retained: Enter opened the result menu rather than selecting its item; final script uses explicit canonical menuitem selection and waits for attachment. No search implementation change was needed.

Historical preparation/handoff follows; pending wording below is superseded by this submission. Alfred accepted task193 in message9181 after independently checking all six artifact hashes, running34 tests and reviewing application source and submitted evidence. Task193, deliverable40 and milestone19 completed. Tilt task195 remains separate; terrain coverage/device/performance limitations remain.

# Person marker perspective scaling — pending Helper review

Alfred9149 records owner approval for opt-in camera-distance/perspective scaling in the complete Helper person component. Helper is the directly addressed implementer; Developer is mentioned for integration awareness. Library behavior must remain unchanged by default for other consumers. The requested correction targets oversized far/horizon person markers using actual camera projection/depth, with sensible visibility bounds, rather than distance from map center.

Developer integration is pending Helper's versioned source/runtime/bundle handoff and Alfred's library review. Near/far/high-pitch evidence and complete component APIs must be inspected before adoption. Existing accepted application runtime remains in use; no local substitute or vendor modification was made for this notice. Alfred will review app integration separately. No scaling implementation or physical-device verification is claimed.

## Task193 integration preparation — Alfred9151

Current integration uses the canonical loader `ui.map.location.person` with preferBundles, sizePx34 and headingDegrees. Creation occurs in displayPosition after a validated location; updates use updateLngLat, heading controller uses updateHeading, state callbacks hide the fallback dot only when status is rendered, map removal destroys the person. These are the supported integration seams. Preserve fallback aria-hidden/visibility and accuracy polygon independently. The new API name/default bounds must come from Helper, not a guessed option.

Dependency task192 is assigned to Helper and was open at this preparation read. Message9153 requests exact reviewed commit, API/options/bounds, JS/CSS/loader cache revision and projection/terrain limits. Production runtime0.21.281 remains unchanged pending Alfred acceptance. Do not run the broad snapshot copier against a dirty library checkout; adopt exact accepted runtime artifacts, update per-file hashes and verify manifest/runtime resource coherence.

Prepared validation sequence once reviewed API arrives:

1. Use existing synthetic geolocation and MapLibre constructor capture pattern in scripts/verify-live-location.js and verify-location-person.js, avoiding real user coordinates. Read the complete component's supported scaling/diagnostic APIs to select measurements; rendered model image/geometry measurements must distinguish true model size from accessible label bounds.
2. At the same zoom/bearing/pitch move the camera so the fixed synthetic person lies near and far in camera depth. Record center/projection/terrain/scale state and screenshots. Assert finite projected sizes and distant smaller than near under declared bounds; keep the exact person anchor fixed. Repeat ordinary0/60 and85-degree horizon, and agreed zoom extremes. Verify clamp continuity using the documented API, not invented geodesic-distance math.
3. Verify heading update/neutral stale cue, movement fixes, visibility pause/resume, model/terrain invalid fallback+retry, map/style replacement and pagehide destruction using existing browser regressions. Accuracy polygon and search/location camera preservation remain independent.
4. Pin exact reviewed source/bundle/loader provenance and cache graph; manifest hash check, runtime-resource URLs and returning-client version check. Submit bounded app evidence and state physical-phone/performance limitations separately.

No new renderer, guessed scale option, unreviewed bundle or production sizing change is introduced by preparation. Task193 final handling and originating9151 acknowledgement await the reviewed dependency and actual integration evidence.

Alfred9154 confirms the task192 review gate: exact source/runtime provenance, supported opt-in API/bounds and projection/terrain near/far high-pitch evidence must be accepted before task193 adoption. Independent integration preparation above is complete for the currently known API; accepted runtime retained. Task193 remains pending dependency review, not completed.

Alfred9157 reviewed and accepted the integration preparation as handled. Final task193 integration remains pending Helper supported API/runtime and library review; current production runtime is retained. Preparation acceptance is not completed scaling or app acceptance.

Alfred9160/task194 simplifies production controls: showDirectionTools defaults false, with diagnostics/options retained but omitted from action/control lists. Task193 adoption must preserve this setting and hidden entry points; automatic sensor/heading/location and permission controls remain.

## Helper9163 handoff received

Helper submitted PR149 at exact commit23b421eca5f91f92e11d714c08e8f93a54080f60. Supported opt-in creation options: scaleMode:'perspective', modelHeightMeters:12, minSizePx:8, maxSizePx:64. setScaleMode updates policy without recreating resources; default screen behavior is retained. Perspective uses actual camera projection/depth, with bounded full-model envelope; bounds intentionally plateau, and painted pixels may be smaller than the envelope. Behind-camera/near-plane anchors are not visible. No offscreen/terrain occlusion or physical-device guarantee is supplied.

Handoff runtime: component/main bundle0.21.282, unchanged component CSS0.21.278; coherent LF-normalized SHA256 manifest docs/map-person-perspective-runtime.json and guide docs/map-location-person.md in Helper repository. Submitted desktop/mobile evidence covers same-zoom/pitch near/far ordering, actual85-degree pitch and zoom8/15/20, lifecycle and rendered pixels. These are Helper's reported results, not an independent PBB Map integration test.

Latest authoritative task192 is completedv5: Alfred accepted the exact commit and runtime hashes; timeline9165/9171 permits task193 adoption separately subject to application review. Helper9173 reports merge into main c7f64a396522b829faaba6230866cd264c2add71. This handoff handling records the supported API/provenance and resolved review dependency. Task193 integration and its browser evidence remain outstanding; production runtime has not been changed by this handoff record. Preserve showDirectionTools=false and independent Enable direction during adoption.

Alfred9177 confirms merged provenance c7f64a396522b829faaba6230866cd264c2add71. Developer independently checked accepted23b421eca5f91f92e11d714c08e8f93a54080f60 is an ancestor and there is no diff for person/renderer/loader/main JS/runtime manifest between those commits. Adoption remains pinned to exact reviewed artifacts; merge confirmation does not change separate app acceptance or device/publication evidence.

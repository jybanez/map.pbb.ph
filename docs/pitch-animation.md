# 2D/3D tilt — owner-confirmed resolution

Owner9195 confirms: turning on animation in Windows settings worked. Alfred9197 reported completion on that confirmation, then corrected the administrative status in9198: his submission transition was denied403. Developer submitted follow-up196; Alfred9202 confirms acceptance and successful completion of task196, deliverable38 and milestone18. The observed jumping is consistent with application/MapLibre reduced-motion policy when Windows animation effects are disabled; no accessibility override or further duration change is needed. This is owner-reported resolution, not an independently captured motion-preference value or physical-device frame trace. Existing600ms normal-motion/0ms reduced-motion behavior remains.

Historical implementation and investigation below preserve their original evidence and limits. Pending owner-clarification wording is superseded by this confirmation.

# Smooth 2D/3D tilt — task195

Application revision20261011-smooth-tilt1 retains reviewed Helper0.21.282 perspective scaling and simplified direction controls. Canonical onPitchChange uses MapLibre easeTo for600ms with ordinary motion,0ms for current prefers-reduced-motion. Preference is read on each invocation. Targets remain0/60; no other camera fields supplied. Existing MapLibre interruption semantics retained.

Diagnosis: actual pre-change runtime already animated. pitch-animation-baseline.txt records intermediate pitches across about330ms upward and314ms downward; reduced-motion yields only exact targets. No canonical-control bypass or forced jump reproduced with normal motion. Short300ms duration is a plausible reason for perceived jumping, not proof of owner-device root cause. Extend to600ms for a more visible transition.

scripts/verify-pitch-animation.js actual browser canonical clicks records timed intermediate samples both directions (pitch-animation-final.txt), exact endpoints0/60, and latest3D target after60/0/60 selections90ms apart in page time. Center is retained within1e-7degree floating-point tolerance; zoom15/bearing27 unchanged. Normal observed frame span approximately619/615ms; baseline samples include automation click delay before first frame, so absolute start timestamps are not animation duration. Reduced-motion samples contain only exact target, no intermediate pitches. Earlier strict equality fixture failure was floating-point center normalization; tolerance correction is retained in baseline evidence. Synthetic no-geolocation fixture; no physical-device/frame-rate guarantee.

Proportionate browser verification completed; no new unit test for a duration change. Cache entry and full import graph bumped coherently from task193 revision; accepted perspective options, bundle hashes and showDirectionTools=false remain.

Alfred accepted smooth-tilt1 in message9186 after source/versioning and submitted timed evidence review. Task195, deliverable38 and milestone18 completed. Acceptance preserves the stated owner-device root-cause and physical/frame-rate limitations; perspective marker and hidden tools remain.

## Reopened owner report — Alfred9188

Previous acceptance does not establish resolution on Jonathan's browser. Fresh non-emulated Windows HeadlessChrome155 has reduced-motion=false and loads smooth-tilt1/Helper0.21.282. scripts/diagnose-default-pitch.js records camera methods, pitch events and requestAnimationFrame samples without preference override or synthetic GPS. pitch-default-diagnosis.txt records35 downward/32 upward intermediate pitch events; only canonical easeTo duration600 and normal completion stop calls, no competing camera mutation. This fresh automation browser is not the owner's open tab.

Bundled MapLibre4.6 easeTo also suppresses nonessential animations when prefersReducedMotion matches, independently of the application's explicit0ms policy. Current evidence does not confirm reduced motion on the owner's browser, stale cached runtime or another cause. In-app browser access attempt failed because its privileged bridge was unavailable. No further duration increase, accessibility override or production change applied.

Message9191 asks Alfred to obtain failing-tab reduced-motion match, app.js revision/resource URL, browser/version and Windows animation-effects setting; if current/false, exact-tab camera/frame trace is needed. Task195 still reads completedv5 despite reopening notice; requested canonical lifecycle reconciliation.9188 remains unacknowledged while owner-specific clarification is pending. Do not claim issue fixed from these fresh-session results.

Alfred9190 corrects lifecycle: completed195 cannot reopen (409); follow-up196 tracks unresolved owner report. Deliverable38/milestone18 reopened. Existing default-runtime investigation/evidence and owner-specific question9191 now belong to196, blocked awaiting those facts.195 acceptance covers only the prior increment. Routing correction handled;9188 investigation remains pending owner clarification.

Alfred9192 confirms the fresh-browser evidence does not resolve Jonathan's tab and requests the minimal read-only reduced-motion/app-module URLs/user-agent expression plus Windows animation-effects setting directly from Jonathan. Task196 remains the active unresolved follow-up (blocked awaiting this input). No motion override authorized. If current runtime and reduced-motion=false are confirmed, next step is competing camera-call and rendered-frame capture in that exact failing tab; do not repeat forced no-preference verification as resolution.

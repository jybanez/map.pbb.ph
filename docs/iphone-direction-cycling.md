# Intermittent iPhone direction investigation

Alfred9054 accepted revision20261010-approximate2 and completed tasks182/183 for their bounded implementation/investigation scope. Independent 30/30 unit tests passed; source and submitted synthetic browser evidence reviewed. Physical Android approximate-mode and iPhone measured-mode checks remain pending. Earlier review-pending states below are historical; the original physical cycling cause remains unproven.

Task183 responds to owner9036 and Alfred9038. The owner physically observed the cue and person turning, then disappearing and reappearing. That establishes intermittent direction output, but does not identify a rejection reason. Device/browser, cadence and diagnostics at disappearance are still needed. No physical resolution is claimed.

Alfred9044 relays a physical active-phase snapshot: Safari, Software Update showing iOS27.0.1, with phone model/Safari version absent. Permission granted, listener active, recent deviceorientation/relative delivery, magnetic reference accepted, supported screen angle, fresh location, altitude and altitude accuracy supported, measured correction available, approximate selection off, geographic cue active and person rendered. Absolute event absent is expected for the Apple adapter; this snapshot does not show missing altitude or explain disappearance. Browser and reported OS are established by that relay; cadence, model and disappearance-time fields remain pending.

The current shared controller (`assets/heading.js`, revision20261010-approximate1) and pinned Helper person renderer were inspected. The controller deliberately outputs null for invalid/stale input; the renderer draws the gold cue only with a non-null heading. No renderer timer independently cycles that cue. Renderer failure/context loss can instead remove the person and activate the dot fallback; check Renderer in diagnostics to distinguish this.

Reproduced paths and the corresponding local diagnostic evidence:

| Transition | Diagnostic distinction |
| --- | --- |
| Valid Apple event, then no accepted sample for 2000ms | Sensor delivery stale; no valid direction sample in the last two seconds. A new valid event restores output. This can reproduce cycling with sparse stationary events, but actual phone cadence is unknown. |
| Apple accuracy absent, negative or above 20 | Compass accuracy is missing or unreliable; event delivery can remain recent. |
| Invalid/missing north reference or attitude; tilt beyond 60° | Unsupported north reference, missing tilt, or too upright/tilted reason. |
| Altitude/altitude accuracy becomes unavailable or invalid | Local correction rejected with altitude reason; approved opt-in applies only to eligible missing inputs. |
| No location fix within 60 seconds | Location missing/stale. Fresh location and a fresh valid sensor event restore output. |
| Fresh location callback | Shared task182 controller clears previous output until the next valid sensor event. A short neutral interval can occur even with fresh location and recent sensor delivery; diagnostics can show neutral output with otherwise valid fields during this interval. No gate is relaxed without observing actual cadence. |
| Hidden page or screen rotation | Paused/inactive listener or waiting after screen rotation; fresh event required after resuming. |

`tests/iphone-cadence.test.js` uses a deterministic clock, Apple vendor events, real local correction and synthetic positions. It verifies the exact 1999ms/2001ms stale transition, restoration, negative accuracy, tilt rejection, fresh-fix neutral interval, altitude loss, 60-second location expiry, hidden/resume, screen rotation and teardown. `npm test` passes 28 tests, including task182 regressions. Evidence: `docs/evidence/iphone-cadence-unit.txt`.

Next physical observation: while the cue is absent, open Direction diagnostics and Refresh; report Reasons plus Sensor delivery, Relative event delivery, Location freshness, Local correction, Direction output and Renderer. Also report iPhone model/browser, approximate disappearance interval and whether stationary or moving. Only classified fields are needed; do not send raw coordinates or sensor samples. A snapshot after the cue returns may miss a brief fresh-fix or rejected-event transition.

Alfred9041 independently identified fresh-fix blanking as an application defect. Task182 revision20261010-approximate2 corrects that shared controller path: valid location updates preserve a still-fresh accepted sensor cue and recompute correction/metadata, without renewing sensor freshness. Updated Apple regression and all30 tests pass. The fresh-fix row above describes the earlier reproduced defect; it is now corrected. Physical resolution still requires observation. No separate production source change is made by task183. Several protected transitions reproduce the symptom; choosing one as the actual physical cause or increasing the timeout would exceed the available evidence. Shared task182 implementation remains intact and its tests pass.

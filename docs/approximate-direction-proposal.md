# Owner decision: approximate direction when altitude is unavailable

Alfred9085 accepted revision20261010-direction-panel-removed1 and completed task186 version4. Independent source review and33/33 tests passed; submitted mobile screenshot and browser regression evidence were reviewed without an independent browser rerun. Physical phone confirmation remains unclaimed. Earlier panel-removal review-pending statements are historical.

Owner9079 and Alfred9081 authorize removal of the lower-left Direction options/status panel. Revision20261010-direction-panel-removed1 removes that overlay and its CSS/lifecycle wiring. Automatic correction remains unchanged; approximation provenance stays in the marker accessible description and read-only diagnostics, with upper-left options retained. Earlier persistent-panel requirements below are historical.

Alfred9062 accepted revision20261010-ground-default1 and completed task184 version4. Independent30/30 tests passed; source and submitted synthetic browser evidence reviewed. Automatic eligible missing-altitude approximation is the accepted default, with no mandatory ground confirmation or enable step. Physical Android/iPhone observations remain pending; earlier review-pending states below are historical.

Owner9055, recorded by Alfred9057, supersedes the former strict-default/session-opt-in/required-ground-confirmation policy. Revision20261010-ground-default1 automatically uses eligible ground-use approximation when altitude is unavailable. Measured correction remains preferred; known-invalid, region, date, accuracy, sampled guard, freshness and permission gates remain. Optional strict choice is session-only; reload restores automatic policy. Physical verification remains pending. Earlier descriptions of strict default/mandatory opt-in below are historical.

Proposal `PH-region-reference0-v1`, task181. Prepared only; application behavior remains `20261010-direction-delivery1` with strict correction. No runtime fallback or selection control is enabled.

## Observed problem

Owner message9021 is authoritative post-Locate physical evidence: granted direction permission, active listener, recent relative and absolute events, accepted magnetic adapter/screen angle, fresh horizontal location and rendered person. Missing ellipsoid altitude is the sole listed rejection; altitudeAccuracy is also missing. This identifies the current suppression policy. It does not establish magnetic calibration accuracy or successful geographic direction rendering. Further permission retries are not needed to identify this blocker. Earlier permission-pending observations9008/9019 are historical.

## Proposed contract

| Decision | Exact proposal |
| --- | --- |
| Supported operating region | Latitude4°–22°N, longitude116°–127°E, inclusive. This operational rectangle covers the Philippines region and adjacent water/land; it is not a political-boundary polygon or territorial claim. Label it “Philippines region”. No automatic extension beyond these numeric bounds. |
| Intended use and assumption | Ordinary handheld ground use; exclude aircraft, underground/mining and precision navigation. Sensitivity study assumes WGS84 ellipsoid height within−1km to10km. This is a declared use assumption, not a measured height or proven phone bound. |
| Model evaluation | Evaluate the pinned WMM2025 at the actual fresh horizontal position/date, with an explicit0m WGS84 ellipsoid **model reference surface**. This surface is not sea level, terrain height or reported device altitude. Geographic estimate = accepted magnetic heading + this modeled declination. |
| Data integrity | Keep location.altitude and altitudeAccuracy null when unavailable. Never insert reference height into location data, geolocation UI, accuracy geometry or logs. Correction provenance is separate: mode=approximate-reference-height, policy=PH-region-reference0-v1, model=WMM2025, modelReferenceHeightMetresWGS84=0, assumedHeightIntervalMetres=[−1000,10000], altitudeMeasured=false. No uploaded/stored location or sensor samples. |
| Entry condition | Eligible only when altitude or altitudeAccuracy is null/unavailable. Finite but invalid, negative accuracy, out-of-range altitude or reported altitudeAccuracy>100m still rejects under existing policy; approximation must not hide a known bad fix. Measured valid altitude continues the existing correction path. |
| Preserved checks | Supported north-reference adapter; permission and valid events; existing sensor quality/attitude/screen projection; sensor freshness2s and location freshness60s; horizontal accuracy0–1000m; model date2025≤UTC<2030; finite correction and H≥6000nT; renderer lifecycle. No relative-to-heading substitution or camera-follow change. |
| Point-specific guard | At each fresh fix/date, compare0m declination with the12 tested model heights−1,0,1,…,10km. Reject approximate output if any field is invalid/H<6000nT or any circular difference exceeds0.05°. Cache until position/date changes. This is a sampled sensitivity guard, not a mathematical bound for every intermediate height. |
| Outside scope | If origin is outside the rectangle, assumptions are declined, model expired, sampled guard fails or any retained gate fails: neutral cue with a specific reason. Never extrapolate or switch to an unlabeled magnetic arrow. Region eligibility uses the unrounded location; boundary with unsupported accuracy still follows retained horizontal gate. |
| Default and persistence | Default remains strict “Measured altitude required”. Approximation is off until explicit selection in the current app session; no saved preference. Reload returns strict. Outside scope/gate failure hides the cue immediately but preserves the session's explicit selection; return to eligible inputs resumes visibly labeled approximation. User can switch off at any time. |
| Valid altitude resumes | If valid measured altitude arrives, use measured correction and remove the approximate label; session selection stays available only for subsequent missing altitude. Do not let measured/approximate transitions invent accuracy claims. |

This replaces the present rule that every magnetic-to-geographic correction requires a measured altitude/altitudeAccuracy. It does not replace the sensor-reference contract. Proposed support is limited ordinary map orientation, not a certified compass/navigation product.

Implementation detail requiring care: the current location normalizer omits altitude inputs when either field is unsupported. An approved implementation must preserve separate classified input provenance (missing versus provided-invalid) before that omission, and keep any real finite altitude distinct from the reference parameter. This is necessary to enforce the null-only eligibility rule above; omission alone must not enable fallback. No normalizer or runtime change is included in this proposal.

## Exact proposed UI

Use the complete canonical Helper modal for the selection workflow, with immediate busy opening for local status and cancellable loading. A declarative form modal validates the applicable use acknowledgement before a local selection changes mode. No server mutation or automatic sensor permission request accompanies selection. The existing diagnostics remains read-only.

Entry action, shown only for missing-altitude eligibility: **“Direction options”**. Modal title: **“Use approximate direction?”**.

Body: **“Your browser has not supplied altitude. PBB can estimate geographic direction using a reference-height magnetic model in the Philippines region. Use this only while on the ground. Magnetic interference can affect the result.”**

Default selected option: **“Keep direction off until altitude is available”**. Alternate option: **“Use approximate direction for this session”**. When alternate is selected, show the required acknowledgement **“I am using the map on the ground.”** Failure: **“Confirm ground use to enable approximate direction.”** Field error and summary follow canonical form validation before busy/selection.

Actions: **“Apply”**, **“Cancel”**. Cancel/Escape/backdrop makes no change. Apply with default keeps strict behavior; valid explicit alternate sets only the local session mode. No implicit selection from opening diagnostics, Locate or granting sensor permission.

While the approximate cue is active, show a persistent visible status **“Approximate direction · altitude unavailable”**, accessible marker description **“Your location; approximate geographic direction, altitude unavailable”**, and an adjacent **“Direction options”** action. Use canonical status/action components rather than a transient toast for this persistent distinction. No numeric ±accuracy label or total-error claim. If inactive outside region, show **“Approximate direction is unavailable outside the Philippines region.”** If sampled guard fails, **“Approximate direction is unavailable here. Keep direction off until altitude is available.”** Other retained reasons remain specific in diagnostics. Public UI need not expose model coefficients, exact position or raw samples; diagnostics can report correction mode/reference-height provenance without device altitude substitution.

## Reproducible evidence and error budget

Run `node scripts/validate-altitude-proposal.js`. It uses only the existing local pinned model and writes docs/evidence/altitude-proposal-region.json.851 grid positions at0.5° spacing plus250 deterministically seeded off-grid positions;21 dates covering quarterly2025–2029 plus the final valid instant;12 heights−1km through10km. Including reference evaluations,300,573 field calculations. Coefficients/runtime provenance hash recorded. No owner coordinates or samples are used.

Maximum sampled additional height difference is0.0228341°, below the proposed0.05° sensitivity allowance. All sampled horizontal fields exceed36,596nT, well above the existing caution gate. NOAA's surface-model standard-deviation formula evaluated across these fields reaches approximately0.299°; it is context, not a phone accuracy bound. Exact extremum location/date and counts are in the JSON. The engine already passes all12 NOAA reference fields in the24-test suite.

The proposed budget is **≤0.05° sampled height sensitivity**, leaving margin above this sample maximum. It is not a continuous bound between spatial/date/height samples, not a95% interval, and not a total compass error budget. Unknown physical height can violate the use assumption. Sensor calibration/interference and local field anomalies can dominate; no claim of sub-degree phone accuracy follows. Owner approval accepts a visibly approximate consumer-map cue under these limits. A guaranteed global or precision-navigation bound would require a different validation contract and is outside this proposal.

Primary bases: [W3C Geolocation](https://www.w3.org/TR/geolocation/) permits unavailable altitude/altitudeAccuracy. [NOAA WMM](https://www.ncei.noaa.gov/products/world-magnetic-model) defines WGS84 model evaluation; [NOAA limitations/error model](https://www.ncei.noaa.gov/products/world-magnetic-model/accuracy-limitations-error-model) supplies caution thresholds, surface uncertainty and anomaly limitations. Local implementation is pinned in vendor/geomagnetism/provenance.json; its tested source hash is also in the study output. Null-altitude policy and numeric regional bounds are this proposal's product choices, not NOAA certification.

## Owner decision and implementation acceptance

Recommended decision: approve this explicit session opt-in approximate policy for the stated Philippines operational region, leaving strict behavior as default. Alternative: retain strict altitude requirement with no approximate mode. Approval of this document authorizes implementation of exactly this scope; changes to region, assumptions, default or error threshold need another owner decision.

After approval, implementation must verify eligibility/null-vs-invalid distinction, default/acknowledgement validation, session-only selection, persistent labeling, all region boundaries, sampled guard failure, measured/approximate transitions, unchanged coordinate/altitude data, permission denial/stale/hidden/context cleanup and manual camera behavior. Perform a physical owner check for the newly enabled approximate cue; current9021 proves why the old cue is suppressed, not that a future fallback works. No further phone tests are requested to rediscover the already observed altitude gate.


Approval: owner9032 approved the explicit request9031; Alfred9034 recorded implementation authorization for exactly PH-region-reference0-v1. Task182 implements this policy at revision20261010-approximate1, submitted for review with 27 passing tests and browser evidence. Physical cue observation remains pending. The regional study does not certify phone accuracy.

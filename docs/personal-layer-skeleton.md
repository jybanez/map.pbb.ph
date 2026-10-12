# Personal layers read skeleton — task 232

Owner screenshot/message 9914 and Alfred assignment 9918 request the canonical Helper skeleton in place of the initial personal-layer read spinner. This is the existing personal-layer management card workflow, not a new modal or replacement form component.

Inspected complete Helper skeleton (lines/card/grid, update/getState/destroy), navigation stack and modal busy APIs. The existing bundle already exports the skeleton; no verified library capability gap. App startup preloads its factory through strict bundled loading. Two canonical skeleton lines are sized to the layer picker and action row; the existing card opens immediately with a Close action, named loading status and aria-busy. No data-dependent controls are available until loaded. Cached reads open management directly.

Read presentation is separate from mutation busy state. Creation/Save/confirmation form workflows and their validation-before-busy behavior remain unchanged. Canonical map controls provide Close and Retry. Error feedback identifies the failure and preserves saved data. Read generation invalidates pending results after dismissal/context changes; cancelled reads cannot publish data. Existing single loading promise prevents overlapping store requests and retries after cancellation. Store does not expose request abort, so late completions are ignored. Existing automatic background read for visible authored layers remains; opening during that read shows skeleton while sharing the pending request.

Factory resolution failure remains fail-closed with actionable read feedback; no modular fallback. The shell graph adds the bundled skeleton root; runtime vendor version remains the independently accepted 306.

Verification: 55 app tests pass. Delayed-store canonical UI fixture at 1200/375 checks immediate skeleton/logical busy/no spinner, unavailable actions absent, Close ignores late read, reopen starts one new read, failure clears loading and offers Retry, success replaces skeleton, and map-context cancellation ignores late data. Exactly three Helper asset paths and no page errors. Screenshots inspected. Synthetic delayed reads/errors/context change are classified explicitly; physical device/Safari/assistive technology remain unvalidated.

App cache query 20261013-skeleton1. Shell 13f9c30c1fb5fc4cf08e: 42 files, 4,246,625 bytes, 30 Helper roots/dependencies. No push or deployment.

Affected context, storage, Save-close and launcher dirty-close regressions passed; bundle failure/cold offline checks passed. Final context replacement hides read-only card and ignores the earlier pending response; final skeleton checks pass both widths. The cold offline factory check now explicitly includes ui.skeleton.

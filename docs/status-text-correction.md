# Loading and status text correction

Task335 fixes literal mojibake in both initial and subsequent map loading messages and related search/context statuses. All five corrupted ellipses in these three modules now use ASCII `...`. Nearby corrupted em dashes are restored as UTF-8 em dashes; malformed negative signs in coordinate guidance use ASCII minus signs. This changes displayed wording only, preserving complete Helper components and existing behavior.

The cache tag is `20261018-status1`; the shell manifest is regenerated from the changed runtime bytes. The focused browser fixture holds actual style requests to inspect both canonical busy overlays, exercises search text and synthetic paste statuses, and opens Location information through the native context menu. A response-only hook exposes the existing initialization function and observes DOM text assignments, including transient statuses; production receives no test globals or replacement controls.

At this text correction's submission, Task286 person sizing remained separate and required a reviewed canonical correction. This text-only commit did not alter person sizing or vendor code. The subsequent Task286 runtime adopted reviewed PR185; see [consistent person size](person-consistent-size.md). Service deployment remains outside scope.

Alfred independently accepted Task335 at `385d20d7346e319257b3c7157a46239fae205f5a` in11235. Its correction is included in the accepted Task286 runtime and final GitHub development handoff.

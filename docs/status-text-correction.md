# Loading and status text correction

Task335 fixes literal mojibake in both initial and subsequent map loading messages and related search/context statuses. All five corrupted ellipses in these three modules now use ASCII `...`. Nearby corrupted em dashes are restored as UTF-8 em dashes; malformed negative signs in coordinate guidance use ASCII minus signs. This changes displayed wording only, preserving complete Helper components and existing behavior.

The cache tag is `20261018-status1`; the shell manifest is regenerated from the changed runtime bytes. The focused browser fixture holds actual style requests to inspect both canonical busy overlays, exercises search text and synthetic paste statuses, and opens Location information through the native context menu. A response-only hook exposes the existing initialization function and observes DOM text assignments, including transient statuses; production receives no test globals or replacement controls.

Task286 person sizing remains separate and requires a reviewed canonical correction. This text change does not alter person sizing or vendor code. Publication requires Alfred's independent review; service deployment is outside scope.

# PBB Landing registration

`pbb-map.json` is the complete local launcher record for this Map checkout. Its
URLs assume the node serves this project's root at `https://map.pbb.ph/`.

Map uses sort 45, between Chat (40) and Games (50) on the verified node. Reconcile
ordering with the destination node before installation. Existing saved launcher
layouts can retain a user's arrangement.

The app-owned launcher PNG is an unchanged copy of
`assets/pbb-map-icon-v1.png`. The WebP is a lossless format conversion of that
same mark. Both are 1254 by 1254 pixels and preserve transparency. Include
`assets/launcher/` with the other static assets when deploying Map.

Kit or authorized node administration should register the complete record with
`PUT https://pbb.ph/internal/registry/apps/pbb-map`, using the Kit-held registry
token. Read and reconcile an existing Map record before replacement. Never put
that token in Map files or browser code. This file is registration metadata;
it does not introduce a Map installer or release contract.

The verified development node currently has no Landing registry token hash
configured. Its owner-authorized local registration used Landing's
`PbbLanding_RegistryStore::putApp` with a local CLI audit source, a registry
backup, and an exact before/after comparison of all other app records. That is
local administration, not a new HTTP route or a change to API authorization.
Kit-managed deployments should use their authenticated registry sync.

Map's root health URL checks static application reachability only. It does not
certify MapServer, tile coverage, geolocation, sensors, WebGL, or offline data.
Map V1 has no Account SDK or login/session dependency. Landing's existing sign-in
workflow is separate and unchanged. The public gateway stays disabled.

Node validation on 2026-10-11: Map root and both image URLs returned HTTPS 200;
images used `image/png` and `image/webp`. Landing showed Map online and activated
it successfully after an owner-provided test-account sign-in. Broader integration
evidence and limits are in Landing's
`docs/pbb-map-launcher-integration-validation.md`.

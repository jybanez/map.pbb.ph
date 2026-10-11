// Shell-only. Version and immutable hashes are generated from the complete local graph.
importScripts('./shell-manifest.js');
const manifest = self.PBB_MAP_SHELL;
const name = `pbb-map-shell-${manifest.version}`;
const root = new URL('./', self.location.href);
const bindingName = `pbb-map-shell-clients-${encodeURIComponent(root.pathname)}`;
const bindingKey = id => new URL(`__shell_client__/${id}`, root).href;
async function bind(id, shell = name) {
  if (!id) return;
  const bindings = await caches.open(bindingName);
  await bindings.put(bindingKey(id), new Response(shell));
}
const hex = bytes => [...new Uint8Array(bytes)].map(v => v.toString(16).padStart(2, '0')).join('');
self.addEventListener('install', event => event.waitUntil((async () => {
  // A harmless re-install of the identical graph must never destroy its active cache.
  if ((await caches.keys()).includes(name)) {
    const existing = await caches.open(name);
    if ((await Promise.all(manifest.files.map(file => existing.match(new URL(file.url, root).href)))).every(Boolean)) return;
  }
  const cache = await caches.open(name);
  try {
    let cursor = 0, failure = null;
    const stop = new AbortController();
    await Promise.allSettled(Array.from({ length: 6 }, async () => {
      try { while (cursor < manifest.files.length && !stop.signal.aborted) {
        const file = manifest.files[cursor++], url = new URL(file.url, root).href;
        const response = await fetch(url, { cache: 'no-store', credentials: 'same-origin', redirect: 'error', signal: AbortSignal.any([stop.signal, AbortSignal.timeout(20000)]) });
        if (!response.ok || response.type === 'opaque') throw new Error('Incomplete Map shell');
        const bytes = await response.arrayBuffer();
        if (hex(await crypto.subtle.digest('SHA-256', bytes)) !== file.sha256) throw new Error('Map shell revision mismatch');
        if (stop.signal.aborted) return;
        const headers = new Headers(response.headers); headers.delete('content-encoding'); headers.delete('content-length');
        await cache.put(url, new Response(bytes, { status: 200, headers }));
      } } catch (error) { failure ||= error; stop.abort(); }
    }));
    if (failure) throw failure;
    // No skipWaiting: old clients keep their complete graph until an explicit safe update.
  } catch (error) { await caches.delete(name); throw error; }
})()));
self.addEventListener('activate', event => event.waitUntil((async () => {
  const bindings = await caches.open(bindingName);
  const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  const living = new Set(clients.filter(client => new URL(client.url).pathname.startsWith(root.pathname)).map(client => bindingKey(client.id)));
  for (const key of await bindings.keys()) if (!living.has(key.url)) await bindings.delete(key);
  for (const client of clients) if (living.has(bindingKey(client.id)) && !await bindings.match(bindingKey(client.id))) await bind(client.id);
  await self.clients.claim();
  // Old shell caches retained: never delete resources still needed by older clients.
})()));
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== root.origin || !url.pathname.startsWith(root.pathname)) return;
  const navigation = event.request.mode === 'navigate' && [root.pathname, `${root.pathname}index.html`].includes(url.pathname);
  event.respondWith((async () => {
    // Client bindings survive worker takeover. An already-open page keeps its old graph
    // until it navigates/reloads, including a tab created during the update handshake.
    const bindings = await caches.open(bindingName);
    let shell = name;
    if (navigation) await bind(event.resultingClientId || event.clientId);
    else if (event.clientId) {
      const binding = await bindings.match(bindingKey(event.clientId));
      if (binding) { const value = await binding.text(); if (value.startsWith('pbb-map-shell-')) shell = value; }
      else await bind(event.clientId);
    }
    const cache = await caches.open(shell);
    const cacheUrl = navigation ? new URL('index.html', root).href : `${url.origin}${url.pathname}`;
    const response = await cache.match(cacheUrl);
    return response || fetch(event.request); // Evicted shell honestly falls back to network.
  })().catch(() => fetch(event.request)));
});
self.addEventListener('message', event => {
  if (event.data?.action !== 'activate-shell' || event.data?.version !== 1 || !event.ports[0] || !event.source?.url) return;
  const url = new URL(event.source.url);
  if (url.origin !== root.origin || !url.pathname.startsWith(root.pathname)) return;
  event.waitUntil((async () => {
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const accepted = clients.filter(client => new URL(client.url).pathname.startsWith(root.pathname)).length <= 1;
    event.ports[0].postMessage({ version: 1, accepted });
    if (accepted) await self.skipWaiting();
  })());
});

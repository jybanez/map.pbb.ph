// The shell worker owns only verified application assets, never map-resource caching.
// Updates activate themselves; controller changes do not reload an active map session.
export function registerMapShell() {
  const sw = navigator.serviceWorker;
  if (sw && window.isSecureContext) {
    void sw.register(new URL('../map-shell-worker.js', import.meta.url), {
      scope: new URL('../', import.meta.url).pathname, updateViaCache: 'none'
    }).catch(() => {}); // Unsupported/failed shell caching leaves the normal loader usable.
  }
  return { destroy() {} };
}

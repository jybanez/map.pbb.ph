// The shell worker never owns map-resource caching. Unsupported SW => normal page loader.
export function registerMapShell({ createMapControls, toast }) {
  let registration, updateAction, notice, disposed = false, switching = false;
  const host = document.createElement('div'); host.className = 'pbb-shell-update';
  function offer() {
    if (disposed || !registration?.waiting) return;
    notice?.close();
    notice = toast.show('Map update available.', { type: 'info', persistent: true });
    if (!host.isConnected) document.body.append(host);
    updateAction?.destroy();
    updateAction = createMapControls(host, { controls: ['update-map'], orientation: 'horizontal', actions: [{ id: 'update-map', label: 'Update Map', onActivate() {
      switching = true;
      const channel = new MessageChannel();
      channel.port1.onmessage = event => {
        channel.port1.close();
        if (event.data?.version !== 1) return;
        if (!event.data.accepted) { switching = false; toast.show('Close other Map tabs, then choose Update Map again.', { type: 'info' }); }
      };
      registration.waiting?.postMessage({ action: 'activate-shell', version: 1 }, [channel.port2]);
    } }] });
  }
  const changed = () => { if (switching) window.location.reload(); };
  const sw = navigator.serviceWorker;
  if (sw && window.isSecureContext) {
    sw.addEventListener('controllerchange', changed);
    void sw.register(new URL('../map-shell-worker.js', import.meta.url), { scope: new URL('../', import.meta.url).pathname, updateViaCache: 'none' }).then(value => {
      if (disposed) return;
      registration = value; offer();
      value.addEventListener('updatefound', () => {
        const worker = value.installing;
        worker?.addEventListener('statechange', () => { if (worker.state === 'installed' && sw.controller) offer(); });
      });
    }).catch(() => {});
  }
  return { destroy() { disposed = true; sw?.removeEventListener('controllerchange', changed); updateAction?.destroy(); host.remove(); notice?.close(); } };
}

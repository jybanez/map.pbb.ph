async page => {
  await page.goto('https://map.pbb.ph/');
  return await page.evaluate(async () => {
    const { createMapResourceCache } = await import('./assets/map-resource-cache.js?review-fixes=2');
    const rows = new Map(); let writes = 0, clock = 0, corrupt = false;
    const store = { async read(id) { const row = rows.get(id); return row && { saved: row.saved, response: row.response.clone() }; }, async write(id, response) { writes++; rows.set(id, { saved: clock, response: response.clone() }); }, async datasets() { return []; }, async saveDataset() {} };
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 2;
    canvas.getContext('2d').fillRect(0, 0, 2, 2);
    const valid = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    const server = 'https://mapserver.pbb.ph', url = server + '/tiles/terrain/1/1/1.png';
    const cache = createMapResourceCache({ server, dataset: 'review', store, now: () => clock, fetcher: async () => new Response(corrupt ? new Uint8Array([137,80,78,71,13,10,26,10]) : valid, { headers: { 'Content-Type': 'image/png' } }) });
    const first = new Uint8Array((await cache.load(url)).data);
    corrupt = true; clock = 90 * 86400000;
    await cache.load(url); await new Promise(resolve => setTimeout(resolve, 300));
    const retained = new Uint8Array((await cache.load(url)).data);
    const preserved = first.length === retained.length && first.every((b, i) => b === retained[i]);
    if (!preserved || writes !== 1) throw new Error('Corrupt replacement saved');
    cache.destroy();
    const fresh = createMapResourceCache({ server, dataset: 'reject', store, fetcher: async () => new Response(new Uint8Array([137,80,78,71,13,10,26,10]), { headers: { 'Content-Type': 'image/png' } }) });
    let rejected = false; try { await fresh.load(url); } catch { rejected = true; } fresh.destroy();
    if (!rejected) throw new Error('Truncated image admitted');
    return { validPNGBytes: first.length, corruptReplacementPreserved: preserved, writes, truncatedMissRejected: rejected };
  });
}

async (page) => {
  const context = await page.context().browser().newContext({ viewport: { width: 1280, height: 720 } });
  const cold = await context.newPage(), requests = [], responses = [];
  const blocked = [];
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    if (['http:', 'https:'].includes(url.protocol) && !['map.pbb.ph', 'mapserver.pbb.ph'].includes(url.hostname)) {
      blocked.push(url.href); return route.abort();
    }
    return route.continue();
  });
  cold.on('request', request => requests.push(request.url()));
  cold.on('response', response => responses.push({ url: response.url(), status: response.status() }));
  await cold.goto('https://map.pbb.ph/');
  await cold.getByRole('button', { name: 'Layers', exact: true }).waitFor();
  await cold.waitForFunction(() => !document.querySelector('.ui-busy-overlay:not([hidden])'));
  await cold.screenshot({ path: 'output/playwright/cold-start.png' });
  const report = { date: '2026-10-10', cleanBrowserContext: true, blockedExternalRequests: blocked,
    requestedOrigins: [...new Set(requests.filter(url => /^https?:/.test(url)).map(url => new URL(url).origin))],
    requestCount: requests.length, failedResponses: responses.filter(response => response.status >= 400),
    limitations: ['This blocks browser public CDN requests only. MapServer backend upstream access was not disabled; this does not satisfy genuine local-node offline acceptance.'] };
  await context.close();
  if (blocked.length || report.failedResponses.length) throw Error(JSON.stringify(report));
  return report;
}

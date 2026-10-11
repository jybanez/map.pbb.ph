async page => {
  const target = 'https://map.pbb.ph/output/playwright/shell-failure/';
  const a = await page.context().newPage(), b = await page.context().newPage();
  await a.goto(target); await b.goto(target);
  return {clients:2,first:await a.locator('p').innerText(),second:await b.locator('p').innerText()};
}

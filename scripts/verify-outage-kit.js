async (page) => {
 const html=await page.evaluate(()=>{const d=document.documentElement.cloneNode(true);d.querySelector('#checks').replaceChildren();return '<!doctype html>'+d.outerHTML;});
 page=await page.context().newPage();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://map.pbb.ph/tools/outage-kit/recorder.html',r=>r.fulfill({status:200,contentType:'text/html',body:html}));
 await page.context().setOffline(true);
 await page.goto('https://map.pbb.ph/tools/outage-kit/recorder.html'); // Local HTML supplied; all network disabled.
 await page.locator('[name=device]').fill('Synthetic desktop dry run');
 await page.locator('[name=check0]').selectOption('Pass');
 await page.locator('#save').click();
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('pbb-outage-kit-v1')));
 if(saved.values.device!=='Synthetic desktop dry run')throw Error('save failed');
 const downloadPromise=page.waitForEvent('download');await page.locator('#export').click();const download=await downloadPromise;
 await download.saveAs('docs/evidence/outage-recorder-dry-run.json');
 await page.locator('[name=device]').fill('Changed');
 await page.locator('#import').setInputFiles('docs/evidence/outage-recorder-dry-run.json');
 await page.waitForFunction(()=>document.querySelector('[name=device]').value==='Synthetic desktop dry run');
 await page.screenshot({path:'output/playwright/outage-recorder.png',fullPage:true});
 await page.context().setOffline(false);
 if(errors.length)throw Error(errors.join(';'));
 return {offlineColdInitialization:true,localSave:true,jsonExport:true,jsonImport:true,checks:await page.locator('fieldset').count(),errors,limit:'Browser network disabled only; no WAN outage or actual file protocol verification. CLI file navigation blocked.'};
}
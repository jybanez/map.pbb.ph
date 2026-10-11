async(page)=>{
 page.setDefaultTimeout(15000);const errors=[];page.on('pageerror',e=>errors.push(e.message));const cdp=await page.context().newCDPSession(page);await cdp.send('Network.enable');await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
 await page.addInitScript(()=>{Object.defineProperty(navigator,'geolocation',{configurable:true,value:{getCurrentPosition(ok){ok({coords:{latitude:10.3157,longitude:123.8854,accuracy:20}})}}});let lib;window.__queries=0;Object.defineProperty(window,'maplibregl',{get:()=>lib,set(v){lib=v;const M=v.Map;v.Map=class extends M{constructor(o){super(o);window.__map=this}querySourceFeatures(id,o){if(id==='pbb-poi')window.__queries++;return super.querySourceFeatures(id,o)}}}})});
 await page.setViewportSize({width:1200,height:800});await page.goto('https://map.pbb.ph/');await page.waitForFunction(()=>window.__map?.loaded());
 const input=page.getByRole('textbox',{name:'Search map'}),results=page.getByRole('menu',{name:'Map search results'}),pin=page.locator('[data-marker-id="search-destination"]');
 const focused=()=>input.evaluate(e=>e===document.activeElement);
 const queries=()=>page.evaluate(()=>window.__queries);
 const initial=await queries();await input.focus();await input.pressSequentially('Bradford  United Church',{delay:20});
 if(await input.inputValue()!=='Bradford  United Church'||!await focused()||await queries()!==initial||await results.count())throw Error('Desktop typing/Space queries or focus lost');
 await input.press('Enter');if(await queries()!==initial+1||await results.count()!==1)throw Error('Enter submission');
 await input.focus();await input.press('Space');if(!await focused()||await results.count()||await queries()!==initial+1)throw Error('Textbox Space activates old results');
 await input.fill('10.32,123.91');await input.press('Enter');await results.waitFor({state:'visible'});
 await page.evaluate(()=>window.__oldResult=document.querySelector('.pbb-search-results [role="menuitem"]'));
 await input.fill('Changed query');await page.evaluate(()=>window.__oldResult.click());if(await pin.count()||await results.count())throw Error('Stale result acted');
 await input.evaluate(e=>{e.dispatchEvent(new CompositionEvent('compositionstart',{bubbles:true}));e.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',isComposing:true,bubbles:true,cancelable:true}));});
 if(await results.count())throw Error('IME Enter submits');await input.evaluate(e=>e.dispatchEvent(new CompositionEvent('compositionend',{bubbles:true})));if(await results.count())throw Error('Composition end submits');
 // Simulate the browser's completed paste insertion/input event without changing
 // the user's OS clipboard. Inspect the full value after default insertion.
 await input.evaluate(e=>{e.value='10.3157,123.8854';e.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertFromPaste',data:e.value}));});
 await results.waitFor({state:'visible'});if(await results.count()!==1||!(await results.innerText()).includes('10.3157, 123.8854'))throw Error('Completed paste value');
 await input.evaluate(e=>{e.value='10.33,123.92';e.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertFromPaste',data:e.value}));e.value='Changed before paste timer';e.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertText',data:'x'}));});await page.waitForTimeout(100);if(await results.count())throw Error('Stale paste submits');
 await input.fill('10.3157,123.8854');await input.press('Enter');await page.keyboard.press('Enter');await page.waitForFunction(()=>document.querySelector('[data-marker-id="search-destination"]')?.getAttribute('aria-disabled')==='false');
 await pin.click();const context=page.getByRole('menu',{name:'Map location actions'});await context.waitFor({state:'visible'});if(!(await context.innerText()).includes('10.315700, 123.885400'))throw Error('Context coordinates');await page.keyboard.press('Escape');await page.waitForTimeout(300);
 await page.setViewportSize({width:375,height:740});await page.getByRole('button',{name:'Open map search'}).click();if(await results.count())throw Error('Focus/reveal searches');
 const mobileInitial=await queries();await input.fill('');await input.pressSequentially('Bradford  United Church',{delay:20});if(!await focused()||await queries()!==mobileInitial||await results.count())throw Error('Mobile Space queries/focus');
 await page.getByRole('button',{name:'Show search results'}).click();if(await queries()!==mobileInitial+1||await results.count()!==1)throw Error('Mobile button submit');
 await input.fill('10.3157,123.8854');await input.press('Enter');await page.waitForTimeout(300);await page.screenshot({path:'output/playwright/explicit-search-mobile.png'});
 await page.keyboard.press('Enter');await page.waitForFunction(()=>document.querySelector('[data-marker-id="search-destination"]')?.getAttribute('aria-disabled')==='false');
 await page.getByRole('button',{name:'Open map search'}).click();await page.getByRole('button',{name:'Clear map search'}).click();if(await pin.count())throw Error('Clear regression');
 await input.fill('10.32,123.91');await input.press('Enter');await page.keyboard.press('Enter');await page.waitForFunction(()=>document.querySelector('[data-marker-id="search-destination"]')?.getAttribute('aria-disabled')==='false');
 await page.getByRole('button',{name:'Open map search'}).click();await input.press('Control+a');await input.press('Backspace');if(await pin.count())throw Error('Delete regression');
 await input.evaluate(e=>{e.value='10.33,123.92';e.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertFromPaste'}));window.dispatchEvent(new Event('pagehide'));});await page.waitForTimeout(100);if(await results.count())throw Error('Disposed paste callback');if(errors.length)throw Error(errors.join(';'));
 return{desktopMultiword:true,mobileMultiword:true,textboxSpaceGuard:true,enter:true,completedPasteSimulated:true,stalePasteCancelled:true,mobileButton:true,imeSimulatedGuard:true,focusRevealNoQuery:true,staleSelectionGuard:true,destinationContext:true,clearAndDelete:true,disposedPasteGuard:true,errors};
}

async page => {
  const target = 'https://map.pbb.ph/output/playwright/shell-failure/';
  const [a,b] = page.context().pages().filter(item => item.url() === target);
  if (!a || !b) throw Error('Open the two fixture clients before preparing the update.');
  await a.evaluate(async () => {const r=await navigator.serviceWorker.getRegistration();await r.update();await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('No waiting update')),30000);const poll=()=>{if(r.waiting){clearTimeout(timer);resolve();}else setTimeout(poll,100);};poll();});});
  const action = async tab => tab.evaluate(async () => {const r=await navigator.serviceWorker.getRegistration();const channel=new MessageChannel();const reply=new Promise(resolve=>{channel.port1.onmessage=e=>{channel.port1.close();resolve(e.data);};});r.waiting.postMessage({action:'activate-shell',version:1},[channel.port2]);return reply;});
  const refused = await action(a); if (refused.accepted) throw Error('Multi-tab activation was not refused');
  await b.close(); const accepted = await action(a); if (!accepted.accepted) throw Error('Single-tab activation refused');
  await a.evaluate(async () => {await new Promise(resolve=>{const poll=async()=>{const r=await navigator.serviceWorker.getRegistration();if(!r.waiting&&r.active?.state==='activated')resolve();else setTimeout(poll,50);};poll();});});
  const old = await a.evaluate(async () => (await (await fetch('./data.json',{cache:'no-store'})).json()).generation);
  const c = await a.context().newPage();await c.goto(target);
  const next = await c.evaluate(async () => (await (await fetch('./data.json',{cache:'no-store'})).json()).generation);
  if(old!=='old'||next!=='new')throw Error(JSON.stringify({old,next}));
  const text=await c.locator('p').innerText();
  await a.close(); await c.evaluate(async()=>{await(await navigator.serviceWorker.getRegistration()).unregister();});await c.close();
  return {multiTabRefused:!refused.accepted,singleTabAccepted:accepted.accepted,oldClientGeneration:old,newClientGeneration:next,newNavigation:text};
}

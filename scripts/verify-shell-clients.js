async page => {
  const target='https://map.pbb.ph/output/playwright/shell-failure/';
  const tabs=page.context().pages().filter(p=>p.url()===target);
  const a=tabs[0];
  await a.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration();const changed=new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Automatic takeover timeout')),30000);navigator.serviceWorker.addEventListener('controllerchange',()=>{clearTimeout(timer);resolve();},{once:true});});await r.update();await changed;});
  const old=[];
  for(const tab of tabs)old.push(await tab.evaluate(async()=>({generation:(await(await fetch('./data.json',{cache:'no-store'})).json()).generation,sentinel:window.__sessionSentinel,text:document.querySelector('p').textContent})));
  if(old.some(v=>v.generation!=='old'||v.sentinel!=='uninterrupted'||v.text!=='Saved shell remains available'))throw Error(JSON.stringify(old));
  await a.context().setOffline(true);
  const cold=await a.context().newPage();await cold.goto(target);
  const next=await cold.evaluate(async()=>({generation:(await(await fetch('./data.json')).json()).generation,text:document.querySelector('p').textContent}));
  if(next.generation!=='new'||next.text!=='Updated shell ready')throw Error(JSON.stringify(next));
  await a.context().setOffline(false);
  await cold.evaluate(async()=>{await(await navigator.serviceWorker.getRegistration()).unregister();});await cold.close();
  return {liveClients:tabs.length,oldClients:old,newOfflineNavigation:next,automatic:true,forcedReload:false};
}

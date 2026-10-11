import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHeadingController} from '../assets/heading.js';
function fixture(states,queryFailure=false){
 const host=new EventTarget(),visibility=new EventTarget(),values=[],statuses=['accelerometer','gyroscope','magnetometer'].map((name,i)=>Object.assign(new EventTarget(),{name,state:states?.[i]||'prompt'}));let calls=0;
 host.isSecureContext=true;host.navigator={userAgent:'iPhone Safari',permissions:{query:async({name})=>{if(queryFailure)throw Error('unsupported');return statuses.find(x=>x.name===name);}}};host.screen={orientation:Object.assign(new EventTarget(),{angle:0})};host.DeviceOrientationEvent={requestPermission:async()=>{calls++;return 'granted';}};visibility.hidden=false;
 const c=createHeadingController({host,visibility,onHeading:v=>values.push(v)});
 const reading=()=>{const e=new Event('deviceorientation');Object.assign(e,{webkitCompassHeading:90,webkitCompassAccuracy:5,beta:0,gamma:0});host.dispatchEvent(e);};
 c.setPosition({latitude:10.3157,longitude:123.8854,accuracy:20,altitude:40,altitudeAccuracy:10,timestamp:Date.now()});
 return{host,visibility,c,reading,statuses,values,calls:()=>calls};
}
test('already granted sensor queries auto-start, resume, revoke and grant without request prompts',async()=>{
 const h=fixture(['granted','granted','granted']);assert.equal(await h.c.request(false),true);assert.equal(h.calls(),0);h.reading();assert.ok(Number.isFinite(h.values.at(-1)));assert.equal(h.c.needsActivation(),false);
 h.visibility.hidden=true;h.visibility.dispatchEvent(new Event('visibilitychange'));assert.equal(h.values.at(-1),null);h.visibility.hidden=false;h.visibility.dispatchEvent(new Event('visibilitychange'));h.reading();assert.ok(Number.isFinite(h.values.at(-1)));
 h.statuses[2].state='denied';h.statuses[2].dispatchEvent(new Event('change'));await new Promise(r=>setImmediate(r));h.reading();assert.equal(h.values.at(-1),null);assert.equal(h.c.getDiagnostics().fields.Permission,'denied');
 h.statuses[2].state='granted';h.statuses[2].dispatchEvent(new Event('change'));await new Promise(r=>setImmediate(r));h.reading();assert.ok(Number.isFinite(h.values.at(-1)));assert.equal(h.calls(),0);h.c.destroy();
});
test('prompt and denied queries require explicit activation; unsupported query passively receives without fake grant',async()=>{
 for(const state of ['prompt','denied']){const h=fixture(['granted','granted',state]);await h.c.request(false);h.reading();assert.equal(h.c.getDiagnostics().fields.Listener,'inactive');assert.equal(h.calls(),0);assert.equal(h.c.needsActivation(),true);await h.c.request(true);h.reading();assert.ok(Number.isFinite(h.values.at(-1)));assert.equal(h.calls(),1);h.c.destroy();}
 const h=fixture(null,true);await h.c.request(false);assert.equal(h.calls(),0);assert.equal(h.c.needsActivation(),true);h.reading();assert.ok(Number.isFinite(h.values.at(-1)));assert.match(h.c.getDiagnostics().fields.Permission,/query unsupported/);assert.equal(h.c.needsActivation(),false);h.c.destroy();
});
test('late read-only query cannot override explicit grant or revive destroyed controller',async()=>{
 for(const destroy of [false,true]){const h=fixture();let resolve;const delayed=new Promise(r=>{resolve=r;});h.host.navigator.permissions.query=()=>delayed;const pending=h.c.request(false);if(destroy)h.c.destroy();else await h.c.request(true);resolve({state:'denied'});await pending;
 // A completed stale query cannot override the later explicit decision.
 assert.equal(h.calls(),destroy?0:1);if(!destroy){h.reading();assert.ok(Number.isFinite(h.values.at(-1)));h.c.destroy();}void pending;
 }
});

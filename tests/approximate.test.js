import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validatePosition} from '../assets/location.js';
import {directionCorrection,missingAltitudeEligible} from '../assets/declination.js';
import {createHeadingController} from '../assets/heading.js';
const date=new Date('2026-10-10T00:00:00Z'),base={latitude:10.3157,longitude:123.8854,accuracy:20};
const normalize=(altitude,altitudeAccuracy)=>validatePosition({coords:{...base,altitude,altitudeAccuracy}});

test('bounded guard cache reuses a UTC day and exact position, invalidates changes and never bypasses eligibility',()=>{
 let calls=0;const field=()=>{calls++;return{decl:2,h:40000};},p=normalize(null,null);
 assert.equal(directionCorrection(p,date,true,field).value,2);assert.equal(calls,13);
 for(let i=0;i<100;i++)directionCorrection({...p},new Date(date.valueOf()+i*1000),true,field);
 assert.equal(calls,13);
 assert.equal(directionCorrection({...p,accuracy:1001},date,true,field).value,null);assert.equal(calls,13);
 assert.equal(directionCorrection({...p,altitudeAccuracy:-1,altitudeAccuracyInput:'invalid'},date,true,field).value,null);assert.equal(calls,13);
 directionCorrection({...p,latitude:p.latitude+.001},date,true,field);assert.equal(calls,26);
 directionCorrection(p,date,true,field);assert.equal(calls,39); // One-entry eviction.
 directionCorrection(p,new Date('2026-10-11'),true,field);assert.equal(calls,52);
 assert.equal(directionCorrection(p,new Date('2030-01-01'),true,field).value,null);assert.equal(calls,52);
});

test('frequent location fixes preserve a fresh cue and transitions without renewing sparse sensor freshness',async()=>{
 const host=new EventTarget(),visibility=new EventTarget(),values=[],timers=new Map();let time=date.valueOf(),id=0;
 host.isSecureContext=true;host.navigator={userAgent:'iPhone Safari'};host.DeviceOrientationEvent={};host.screen={orientation:Object.assign(new EventTarget(),{angle:0})};visibility.hidden=false;
 const c=createHeadingController({host,visibility,now:()=>time,onHeading:(value,meta)=>values.push({value,...meta}),setTimer:(f,ms)=>{timers.set(++id,{f,at:time+ms});return id;},clearTimer:i=>timers.delete(i)});
 const tick=ms=>{time+=ms;for(const [i,t] of [...timers])if(t.at<=time){timers.delete(i);t.f();}};
 const fix=(missing=false)=>c.setPosition({...base,altitude:missing?null:40,altitudeAccuracy:missing?null:10,timestamp:time});
 const event=()=>{const e=new Event('deviceorientation');Object.assign(e,{webkitCompassHeading:90,webkitCompassAccuracy:5,beta:0,gamma:0});host.dispatchEvent(e);};
 await c.request();c.setApproximate(true);fix(true);event();assert.equal(values.at(-1).approximate,true);
 for(let i=0;i<9;i++){tick(200);fix(i%2===0);assert.ok(Number.isFinite(values.at(-1).value));assert.equal(values.at(-1).approximate,i%2===0);}
 tick(200);fix();assert.equal(values.at(-1).value,null); // Original sample expires at two seconds despite nine fresh fixes.
 event();assert.ok(Number.isFinite(values.at(-1).value));fix(true);assert.equal(values.at(-1).approximate,true);
 c.setPosition({...base,altitude:null,altitudeAccuracy:-1,timestamp:time});assert.equal(values.at(-1).value,null);
 fix();assert.equal(values.at(-1).value,null);event();assert.ok(Number.isFinite(values.at(-1).value));c.destroy();
});
test('missing vs partly present invalid altitude provenance never enables invalid fallback',()=>{
 for(const [a,b,eligible] of [[null,null,true],[40,null,true],[null,10,true],[null,-1,false],[null,101,false],[100001,null,false],[NaN,null,false],[null,NaN,false],['40',null,false],[40,10,false]]){
  const p=normalize(a,b);assert.equal(missingAltitudeEligible(p),eligible,`${a},${b}`);
  assert.ok(Object.is(p.altitude,a));assert.ok(Object.is(p.altitudeAccuracy,b));
  if(!eligible&&!(a===40&&b===10))assert.equal(directionCorrection(p,date,true).value,null);
 }
});
test('strict default, rectangle boundaries, date and sampled field guards; reference does not mutate measured fields',()=>{
 const p=normalize(null,null),before=JSON.stringify(p);assert.equal(directionCorrection(p,date).value,null);
 const a=directionCorrection(p,date,true);assert.equal(a.mode,'approximate');assert.equal(a.provenance.modelReferenceHeightMetresWGS84,0);assert.equal(JSON.stringify(p),before);
 for(const latitude of [4,22])for(const longitude of [116,127])assert.ok(Number.isFinite(directionCorrection({...p,latitude,longitude},date,true).value));
 for(const q of [{...p,latitude:3.999},{...p,latitude:22.001},{...p,longitude:115.999},{...p,longitude:127.001},{...p,accuracy:1001}])assert.equal(directionCorrection(q,date,true).value,null);
 assert.equal(directionCorrection(p,new Date('2030-01-01'),true).value,null);
 for(const field of [()=>null,()=>({decl:0,h:5999}),(_a,_b,height)=>({decl:height===0?0:1,h:40000})])assert.equal(directionCorrection(p,date,true,field).value,null);
 assert.equal(directionCorrection(normalize(40,10),date,true).mode,'measured');
});
test('session selection lifecycle, measured transitions, hidden/stale neutrality and new controller automatic default',async()=>{
 const host=new EventTarget(),visibility=new EventTarget(),values=[];let now=date.valueOf();host.isSecureContext=true;host.navigator={userAgent:'Android Chrome/154.0.0.0'};host.DeviceOrientationEvent={};host.screen={orientation:Object.assign(new EventTarget(),{angle:0})};visibility.hidden=false;
 const make=()=>createHeadingController({host,visibility,now:()=>now,onHeading:(value,meta)=>values.push({value,...meta})});const c=make();assert.equal(c.getOptionsState().selected,true);c.setApproximate(false);await c.request();
 const event=()=>{const e=new Event('deviceorientationabsolute');Object.assign(e,{alpha:270,beta:0,gamma:0,absolute:true});host.dispatchEvent(e);};
 c.setPosition(normalize(null,null));event();assert.equal(values.at(-1).value,null);c.setApproximate(true);event();assert.equal(values.at(-1).approximate,true);
 c.setPosition(normalize(40,10));assert.ok(Number.isFinite(values.at(-1).value));assert.equal(values.at(-1).approximate,false);event();assert.equal(values.at(-1).approximate,false);assert.ok(Number.isFinite(values.at(-1).value));
 c.setPosition({...normalize(null,null),latitude:23});event();assert.equal(values.at(-1).value,null);assert.equal(c.getOptionsState().selected,true);
 c.setPosition(normalize(null,null));event();visibility.hidden=true;visibility.dispatchEvent(new Event('visibilitychange'));assert.equal(values.at(-1).value,null);event();assert.equal(values.at(-1).value,null);visibility.hidden=false;visibility.dispatchEvent(new Event('visibilitychange'));event();assert.equal(values.at(-1).approximate,true);
 now+=60001;event();assert.equal(values.at(-1).value,null);c.destroy();const fresh=make();assert.equal(fresh.getOptionsState().selected,true);fresh.destroy();
});

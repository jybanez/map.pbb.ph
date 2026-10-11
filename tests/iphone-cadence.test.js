import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHeadingController} from '../assets/heading.js';

test('Apple-like cadence, invalid accuracy/tilt and location transitions classify neutral cycles without fabricating direction',async()=>{
 const host=new EventTarget(),visibility=new EventTarget(),values=[],timers=new Map();let time=Date.UTC(2026,9,10),id=0;
 host.isSecureContext=true;host.navigator={userAgent:'iPhone Safari'};host.screen={orientation:Object.assign(new EventTarget(),{angle:0})};host.DeviceOrientationEvent={requestPermission:async()=> 'granted'};visibility.hidden=false;
 const c=createHeadingController({host,visibility,now:()=>time,onHeading:v=>values.push(v),setTimer:(f,ms)=>{timers.set(++id,{f,at:time+ms});return id;},clearTimer:i=>timers.delete(i)});
 const advance=ms=>{time+=ms;for(const [i,t] of [...timers])if(t.at<=time){timers.delete(i);t.f();}};
 const fix=(extra={})=>c.setPosition({latitude:10.3157,longitude:123.8854,accuracy:20,altitude:40,altitudeAccuracy:10,timestamp:time,...extra});
 const reading=(extra={})=>{const e=new Event('deviceorientation');Object.assign(e,{webkitCompassHeading:90,webkitCompassAccuracy:5,beta:0,gamma:0,...extra});host.dispatchEvent(e);};
 await c.request(true);fix();reading();assert.ok(Number.isFinite(values.at(-1)));
 advance(1999);assert.ok(Number.isFinite(values.at(-1)));advance(2);assert.equal(values.at(-1),null);assert.match(c.getDiagnostics().issues.join(' '),/last two seconds/);
 reading();assert.ok(Number.isFinite(values.at(-1)));
 reading({webkitCompassAccuracy:-1});assert.equal(values.at(-1),null);assert.match(c.getDiagnostics().issues.join(' '),/accuracy is missing or unreliable/);
 reading();reading({beta:61});assert.equal(values.at(-1),null);assert.match(c.getDiagnostics().issues.join(' '),/too upright or tilted/);reading();
 fix();assert.ok(Number.isFinite(values.at(-1)));assert.equal(c.getDiagnostics().fields['Location freshness'],'fresh');reading();assert.ok(Number.isFinite(values.at(-1)));
 fix({altitude:null,altitudeAccuracy:-1});reading();assert.equal(values.at(-1),null);assert.match(c.getDiagnostics().issues.join(' '),/altitude/i);fix();reading();
 advance(60001);reading();assert.equal(values.at(-1),null);assert.match(c.getDiagnostics().issues.join(' '),/Location is missing or stale/);
 fix();reading();visibility.hidden=true;visibility.dispatchEvent(new Event('visibilitychange'));assert.equal(values.at(-1),null);assert.match(c.getDiagnostics().issues.join(' '),/paused/);
 visibility.hidden=false;visibility.dispatchEvent(new Event('visibilitychange'));reading();assert.ok(Number.isFinite(values.at(-1)));
 host.screen.orientation.dispatchEvent(new Event('change'));assert.equal(values.at(-1),null);reading();assert.ok(Number.isFinite(values.at(-1)));
 c.destroy();const count=values.length;reading();assert.equal(values.length,count);
});

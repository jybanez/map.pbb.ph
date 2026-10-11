import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {magneticField,declination,correctionAssessment} from '../assets/declination.js';
import {geographicHeading,orientationReading,circularHeading,createHeadingController} from '../assets/heading.js';
test('pinned local correction runtime and notices match provenance inventory',()=>{
 const base=new URL('../vendor/geomagnetism/',import.meta.url),manifest=JSON.parse(readFileSync(new URL('provenance.json',base),'utf8'));
 for(const [path,hash] of Object.entries(manifest.runtimeSHA256))assert.equal(createHash('sha256').update(readFileSync(new URL(path,base))).digest('hex'),hash,path);
});
test('WMM2025 matches every NOAA published reference field at epoch and2027.5, surface and100km',()=>{
 const rows=readFileSync(new URL('../vendor/geomagnetism/WMM2025_TEST_VALUES.txt',import.meta.url),'utf8').split('\n').filter(r=>r.trim()&&!r.startsWith('#'));
 for(const row of rows){const v=row.trim().split(/\s+/).map(Number);const y=Math.floor(v[0]);const d=new Date(Date.UTC(y,0,1)+(v[0]-y)*(Date.UTC(y+1,0,1)-Date.UTC(y,0,1)));
 const field=magneticField(v[2],((v[3]+180)%360)-180,v[1]*1000,d);assert.ok(field);
 for(const [key,index,tol] of [['x',4,.11],['y',5,.11],['z',6,.11],['h',7,.11],['f',8,.11],['incl',9,.011],['decl',10,.011]])assert.ok(Math.abs(field[key]-v[index])<tol,`${v.slice(0,4)} ${key}: ${field[key]} vs ${v[index]}`);
 }
 assert.equal(rows.length,12);
});
test('model rejects date/location/altitude failures, altitude missing and magnetic caution; leapyear UTC fraction',()=>{
 const p={latitude:10.3157,longitude:123.8854,accuracy:20,altitude:40,altitudeAccuracy:10};const d=new Date('2026-10-10T00:00:00Z');assert.ok(Number.isFinite(declination(p,d)));
 for(const position of [{...p,altitude:null},{...p,altitudeAccuracy:101},{...p,longitude:181},{...p,accuracy:1001},{...p,altitude:-1001},{...p,latitude:90}])assert.equal(declination(position,d),null);
 for(const date of [new Date(NaN),new Date('2024-12-31'),new Date('2030-01-01')])assert.equal(magneticField(0,120,0,date),null);
 assert.ok(magneticField(0,120,0,new Date('2029-12-31T23:59:59Z')));
 const a=magneticField(0,120,0,new Date('2028-01-01'));const b=magneticField(0,120,0,new Date('2029-01-01'));const mid=magneticField(0,120,0,new Date(Date.UTC(2028,0,1)+366/2*86400000));assert.ok(Math.abs(mid.x-(a.x+b.x)/2)<1e-6);
});
const vendor=(heading=0,extra={})=>({type:'deviceorientation',webkitCompassHeading:heading,webkitCompassAccuracy:5,beta:0,gamma:0,...extra});
test('diagnostics identify rejected altitude and omit raw position and sensor values',async()=>{
 const p={latitude:10.315712345,longitude:123.885412345,accuracy:20,altitude:null,altitudeAccuracy:10};
 assert.match(correctionAssessment(p,new Date('2026-10-10')).reason,/altitude/i);
 assert.equal(correctionAssessment({...p,altitude:40,accuracy:undefined},new Date('2026-10-10')).value,null);
 const h=harness();h.controller.setApproximate(false);await h.controller.request();h.controller.setPosition(p);h.reading(123.456789,{beta:90});
 const snapshot=h.controller.getDiagnostics();assert.match(snapshot.issues.join(' '),/altitude/i);assert.match(snapshot.issues.join(' '),/face-up/i);
 const output=JSON.stringify(snapshot);for(const raw of ['10.315712345','123.885412345','123.456789'])assert.equal(output.includes(raw),false);
 assert.equal(snapshot.fields['Ellipsoid altitude'],'missing');h.controller.destroy();
});
test('north reference correction signs and screen/attitude projection, wrap smoothing and unknown source gates',()=>{
 assert.equal(geographicHeading({heading:359,reference:'magnetic'},2),1);assert.equal(geographicHeading({heading:1,reference:'magnetic'},-2),359);
 assert.equal(geographicHeading({heading:10,reference:'geographic'},30),10);assert.equal(geographicHeading({heading:10,reference:'unknown'},30),null);
 for(const s of [0,90,180,270])assert.ok(Math.abs(orientationReading(vendor(),s).heading-s)<1e-8);
 assert.equal(orientationReading(vendor(0,{beta:90}),0),null);assert.equal(orientationReading(vendor(0,{webkitCompassAccuracy:-1}),0),null);
 const e={type:'deviceorientationabsolute',absolute:true,alpha:270,beta:20,gamma:10};assert.equal(orientationReading(e,0),null);assert.equal(orientationReading(e,0,'chromium-android').heading,90);
 assert.equal(orientationReading({...e,absolute:false},0,'chromium-android'),null);assert.equal(circularHeading(359,1,.5),0);
});
function harness(permission){
 const host=new EventTarget(),visibility=new EventTarget(),values=[],states=[],timers=new Map();let time=Date.UTC(2026,9,10),id=0,calls=0;
 host.isSecureContext=true;host.navigator={userAgent:'Test'};host.screen={orientation:Object.assign(new EventTarget(),{angle:0})};host.DeviceOrientationEvent=permission?{requestPermission:()=>{calls++;return permission();}}:{};
 visibility.hidden=false;
 const controller=createHeadingController({host,visibility,onHeading:x=>values.push(x),onState:x=>states.push(x),now:()=>time,correct:()=>2,setTimer:(f,ms)=>{timers.set(++id,{f,ms});return id;},clearTimer:id=>timers.delete(id)});
 // Event.type is read-only; copy only sensor properties.
 const reading=(heading=359,extra={})=>{const ev=new Event('deviceorientation');const {type,...fields}=vendor(heading,extra);Object.assign(ev,fields);host.dispatchEvent(ev);};
 const hide=h=>{visibility.hidden=h;visibility.dispatchEvent(new Event('visibilitychange'));};
 return{host,controller,values,states,timers,reading,hide,calls:()=>calls,advance:ms=>time+=ms};
}
test('relative Android delivery is diagnostic only, stale and cleaned with listener lifecycle',async()=>{
 const h=harness();h.controller.destroy();h.host.navigator.userAgent='Android Chrome/154.0.0.0';
 let time=Date.UTC(2026,9,10);const visibility=new EventTarget();visibility.hidden=false;
 const c=createHeadingController({host:h.host,visibility,onHeading:x=>h.values.push(x),correct:()=>2,now:()=>time});
 await c.request();c.setPosition({latitude:10.3157,longitude:123.8854,accuracy:20,altitude:40,altitudeAccuracy:10});
 const relative=new Event('deviceorientation');Object.assign(relative,{alpha:270,beta:0,gamma:0});h.host.dispatchEvent(relative);
 let d=c.getDiagnostics();assert.equal(d.fields['Relative event delivery'],'recent event received');assert.equal(d.fields['Absolute event delivery'],'not received');assert.match(d.issues.join(' '),/Relative orientation events arrive/);assert.equal(d.fields['Direction output'],'neutral');
 time+=2001;assert.equal(c.getDiagnostics().fields['Relative event delivery'],'stale');
 const absolute=new Event('deviceorientationabsolute');Object.assign(absolute,{alpha:270,beta:0,gamma:0,absolute:true});h.host.dispatchEvent(absolute);
 d=c.getDiagnostics();assert.equal(d.fields['Absolute event delivery'],'recent event received');assert.equal(d.fields['Direction output'],'geographic cue active');
 visibility.hidden=true;visibility.dispatchEvent(new Event('visibilitychange'));h.host.dispatchEvent(relative);assert.equal(c.getDiagnostics().fields['Relative event delivery'],'not received');visibility.hidden=false;visibility.dispatchEvent(new Event('visibilitychange'));
 c.destroy();h.host.dispatchEvent(relative);assert.equal(c.getDiagnostics().fields['Relative event delivery'],'not received');
});
test('sensor permission is explicit/single, lifecycle discards late permission and stops hidden/destroyed events',async()=>{
 let resolve;const h=harness(()=>new Promise(r=>resolve=r));assert.equal(await h.controller.request(false),false);assert.equal(h.calls(),0);
 const promise=h.controller.request(true);assert.equal(h.calls(),1);assert.equal(await h.controller.request(true),false);h.controller.setPosition({});resolve('granted');assert.equal(await promise,true);
 h.reading();assert.equal(h.values.at(-1),1);h.advance(100);h.reading(1);assert.ok(h.values.at(-1)>1&&h.values.at(-1)<3);
 h.hide(true);assert.equal(h.values.at(-1),null);h.reading();assert.equal(h.values.at(-1),null);h.hide(false);h.reading();assert.equal(h.values.at(-1),1);
 h.host.screen.orientation.angle=90;h.host.screen.orientation.dispatchEvent(new Event('change'));assert.equal(h.values.at(-1),null);h.reading();assert.equal(h.values.at(-1),91);
 const stale=[...h.timers.values()].find(t=>t.ms===2000);stale.f();assert.equal(h.values.at(-1),null);h.reading();assert.equal(h.values.at(-1),91);
 h.advance(60001);h.reading();assert.equal(h.values.at(-1),null);h.controller.destroy();const len=h.values.length;h.reading();h.hide(false);assert.equal(h.values.length,len);assert.equal(h.timers.size,0);
 const late=harness(()=>new Promise(r=>resolve=r));const pending=late.controller.request(true);late.controller.destroy();resolve('granted');assert.equal(await pending,false);
});
test('denied/rejected permission retry and invalid readings retain neutral fallback',async()=>{
 let allowed=false;const h=harness(()=>Promise.resolve(allowed?'granted':'denied'));assert.equal(await h.controller.request(true),false);assert.equal(h.states.length,1);allowed=true;assert.equal(await h.controller.request(true),true);h.controller.setPosition({});h.reading();assert.equal(h.values.at(-1),1);h.reading(10,{webkitCompassAccuracy:40});assert.equal(h.values.at(-1),null);h.controller.invalidatePosition();h.reading();assert.equal(h.values.at(-1),null);h.controller.destroy();
 const rejected=harness(()=>Promise.reject(Error('no')));assert.equal(await rejected.controller.request(true),false);assert.equal(rejected.states.length,1);rejected.controller.destroy();
});
test('old cached fix and future timestamp cannot refresh direction validity on Locate',async()=>{
 const h=harness();await h.controller.request();h.controller.setPosition({timestamp:Date.UTC(2026,9,10)-60001});h.reading();assert.equal(h.values.at(-1),null);
 h.controller.setPosition({timestamp:Date.UTC(2026,9,10)+1001});h.reading();assert.equal(h.values.at(-1),null);
 const fix={timestamp:Date.UTC(2026,9,10)};h.controller.setPosition(fix);h.reading();assert.equal(h.values.at(-1),1);h.advance(60001);h.controller.setPosition(fix);h.reading();assert.equal(h.values.at(-1),null);h.controller.destroy();
});

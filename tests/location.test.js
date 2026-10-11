import { test } from 'node:test';
import assert from 'node:assert/strict';
import { accuracyPolygon, createLocationController, validatePosition } from '../assets/location.js';

const fix = (longitude = 123.8854, latitude = 10.3157, accuracy = 40) => ({ coords: { longitude, latitude, accuracy } });
function watchHarness(hidden=false){
  const visibility=new EventTarget();visibility.hidden=hidden;
  const calls=[],cleared=[],positions=[],states=[],timers=new Map();let id=0;
  const controller=createLocationController({visibility,geolocation:{watchPosition:(...args)=>{calls.push(args);return calls.length;},clearWatch:id=>cleared.push(id)},policy:{timeout:10000},onPosition:(...p)=>positions.push(p),onState:s=>states.push(s),setTimer:fn=>{timers.set(++id,fn);return id;},clearTimer:id=>timers.delete(id)});
  const hide=value=>{visibility.hidden=value;visibility.dispatchEvent(new Event('visibilitychange'));};
  return{controller,calls,cleared,positions,states,timers,hide};
}
test('one watcher updates movement without ongoing camera following; Locate uses latest fix',()=>{
  const h=watchHarness();h.controller.request();h.controller.request();assert.equal(h.calls.length,1);
  h.controller.markNavigation();h.calls[0][0](fix());h.calls[0][0](fix(123.9,10.32,12));
  assert.deepEqual(h.positions.map(p=>p[1].recenter),[false,false]);assert.equal(h.positions[1][0].longitude,123.9);
  h.controller.request(true);assert.equal(h.positions.at(-1)[1].recenter,true);assert.equal(h.calls.length,1);
  h.calls[0][0](fix(123.91));assert.equal(h.positions.at(-1)[1].recenter,false);assert.equal(h.states.filter(s=>s.status==='success').length,1);h.controller.destroy();
});
test('watch visibility, stale callbacks, denial/retry and teardown preserve one active watcher',()=>{
  const h=watchHarness();h.controller.request();h.calls[0][0](fix());h.hide(true);assert.deepEqual(h.cleared,[1]);
  h.calls[0][0](fix(124));assert.equal(h.positions.length,1);h.hide(false);h.hide(false);assert.equal(h.calls.length,2);
  h.calls[1][1]({code:1});assert.deepEqual(h.cleared,[1,2]);h.hide(true);h.hide(false);assert.equal(h.calls.length,2);
  h.controller.request(true);h.calls[1][0](fix(124));assert.equal(h.positions.length,1);h.calls[2][0](fix(123.92));assert.equal(h.positions.at(-1)[1].recenter,true);
  h.controller.destroy();h.hide(false);h.calls[2][0](fix(124));assert.equal(h.positions.length,2);assert.deepEqual(h.cleared,[1,2,3]);assert.equal(h.timers.size,0);
});
test('watch transient errors and invalid fixes recover; hidden startup starts only on resume',()=>{
  const h=watchHarness(true);h.controller.request();assert.equal(h.calls.length,0);h.hide(false);
  h.calls[0][0](fix(NaN));assert.equal(h.positions.length,0);assert.equal(h.controller.isPending(),false);
  h.calls[0][1]({code:3});assert.equal(h.cleared.length,0);h.calls[0][0](fix());assert.equal(h.positions[0][1].recenter,true);
  h.calls[0][1]({code:2});h.calls[0][0](fix(123.9));assert.equal(h.positions[1][1].recenter,false);assert.equal(h.states.at(-1).status,'success');h.controller.destroy();
});
function harness() {
  const calls = [], states = [], positions = [], timers = new Map();
  let clock = 0;
  const controller = createLocationController({
    geolocation: { getCurrentPosition: (...args) => calls.push(args) },
    policy: { timeout: 10000, maximumAge: 60000, enableHighAccuracy: true },
    onState: state => states.push(state), onPosition: (...args) => positions.push(args),
    setTimer: fn => { timers.set(++clock, fn); return clock; }, clearTimer: id => timers.delete(id),
  });
  return { controller, calls, states, positions, timers };
}
test('pending permission never permits duplicate fixes; initial fix respects user camera navigation', () => {
  const h = harness();
  assert.equal(h.controller.request(), true);
  assert.equal(h.controller.request(true), false);
  h.controller.markNavigation();
  h.calls[0][0](fix());
  assert.equal(h.positions[0][1].recenter, false);
  assert.equal(h.states.at(-1).status, 'success');
  assert.equal(h.timers.size, 0);
  assert.equal(h.controller.request(true), true);
  h.calls[1][0](fix());
  assert.equal(h.positions[1][1].recenter, true);
});
test('denial and timeout clear pending; stale callbacks cannot overwrite retry', () => {
  const h = harness(); h.controller.request();
  h.calls[0][1]({ code: 1 });
  assert.match(h.states.at(-1).message, /site settings/);
  h.controller.request(true);
  h.calls[0][0](fix());
  assert.equal(h.positions.length, 0);
  [...h.timers.values()][0]();
  assert.match(h.states.at(-1).message, /timed out/);
  assert.equal(h.controller.isPending(), false);
  h.calls[1][0](fix());
  assert.equal(h.positions.length, 0);
});
test('teardown invalidates callbacks and removes the finite watchdog', () => {
  const h = harness(); h.controller.request(); h.controller.destroy();
  h.calls[0][0](fix()); h.calls[0][1]({ code: 2 });
  assert.equal(h.positions.length, 0); assert.equal(h.states.length, 1);
  assert.equal(h.timers.size, 0); assert.equal(h.controller.request(), false);
});
test('invalid device values are rejected without leaving busy state', () => {
  for (const position of [fix(NaN), fix(181), fix(0, 91), fix(0, 0, -1), fix(0, 0, Infinity), fix('123')]) {
    assert.throws(() => validatePosition(position));
    const h = harness(); h.controller.request(); h.calls[0][0](position);
    assert.equal(h.controller.isPending(), false); assert.equal(h.positions.length, 0);
    assert.match(h.states.at(-1).message, /invalid location/);
  }
});
test('missing geolocation and insecure context are actionable and never request', () => {
  for (const secure of [true, false]) {
    const states = [];
    const c = createLocationController({ secure, geolocation: null, policy: {}, onState: state => states.push(state) });
    assert.equal(c.request(), false); assert.equal(c.isPending(), false);
    assert.equal(states[0].status, 'unavailable');
  }
});
test('accuracy polygon uses meters at equator, Cebu, high latitude and antimeridian', () => {
  for (const [longitude, latitude] of [[0, 0], [123.8854, 10.3157], [10, 65], [179.9999, 10], [0, 89.999]]) {
    const feature = accuracyPolygon({ longitude, latitude, accuracy: 100 });
    const ring = feature.geometry.coordinates[0];
    assert.deepEqual(ring[0], ring.at(-1));
    for (const [lng, lat] of ring) {
      const rad = d => d * Math.PI / 180;
      const a = Math.sin(rad(lat - latitude) / 2) ** 2 + Math.cos(rad(latitude)) * Math.cos(rad(lat)) * Math.sin(rad(lng - longitude) / 2) ** 2;
      const distance = 6371008.8 * 2 * Math.asin(Math.min(1, Math.sqrt(a)));
      assert.ok(Math.abs(distance - 100) < 0.01, `${latitude}: ${distance}`);
    }
  }
});

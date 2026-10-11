const EARTH_RADIUS = 6371008.8;
const radians = value => value * Math.PI / 180;
const degrees = value => value * 180 / Math.PI;

export function validatePosition(position) {
  const { longitude, latitude, accuracy } = position?.coords || {};
  if (![longitude, latitude, accuracy].every(Number.isFinite)
    || longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90 || accuracy < 0) {
    throw new Error('The device returned an invalid location. Choose Locate to try again.');
  }
  const result={ longitude, latitude, accuracy };
  // Geolocation altitude is WGS84 ellipsoid metres. Keep optional invalid/missing
  // altitude out of correction inputs without discarding a usable horizontal fix.
  const {altitude,altitudeAccuracy}=position.coords;
  result.altitude=altitude??null;result.altitudeAccuracy=altitudeAccuracy??null;
  result.altitudeInput=altitude==null?'missing':Number.isFinite(altitude)&&altitude>=-1000&&altitude<=100000?'valid':'invalid';
  result.altitudeAccuracyInput=altitudeAccuracy==null?'missing':Number.isFinite(altitudeAccuracy)&&altitudeAccuracy>=0&&altitudeAccuracy<=100?'valid':'invalid';
  if(Number.isFinite(position.timestamp))result.timestamp=position.timestamp;
  return result;
}

export function accuracyPolygon({ longitude, latitude, accuracy }, segments = 64) {
  const lat = radians(latitude), lng = radians(longitude), radius = Math.min(accuracy / EARTH_RADIUS, Math.PI);
  const points = [];
  for (let i = 0; i < segments; i++) {
    const bearing = 2 * Math.PI * i / segments;
    const phi = Math.asin(Math.max(-1, Math.min(1,
      Math.sin(lat) * Math.cos(radius) + Math.cos(lat) * Math.sin(radius) * Math.cos(bearing))));
    const lambda = lng + Math.atan2(Math.sin(bearing) * Math.sin(radius) * Math.cos(lat),
      Math.cos(radius) - Math.sin(lat) * Math.sin(phi));
    // Keep longitudes continuous around the center to avoid antimeridian-spanning edges.
    const delta = ((degrees(lambda) - longitude + 540) % 360) - 180;
    points.push([longitude + delta, degrees(phi)]);
  }
  points.push([...points[0]]);
  return { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [points] } };
}

export function createLocationController({ geolocation, secure = true, policy,
  onState, onPosition, visibility = globalThis.document, setTimer = setTimeout, clearTimer = clearTimeout }) {
  let pending = false, disposed = false, generation = 0, timer = null, userNavigated = false;
  let watch=null,watchGeneration=0,latest=null,started=false,denied=false,recenterNext=false,lastStatus=null;
  const canWatch=typeof geolocation?.watchPosition==='function'&&typeof geolocation?.clearWatch==='function';
  function state(next){lastStatus=next.status;onState(next);}
  function stopWatch(){
    watchGeneration++;if(watch!==null)geolocation.clearWatch(watch);watch=null;
    clearTimer(timer);timer=null;pending=false;recenterNext=false;
  }
  function startWatch(explicit=false){
    if(disposed||visibility?.hidden||watch!==null)return false;
    if(!secure){state({status:'unavailable',message:'Location needs HTTPS. Open this app using its secure address.'});return false;}
    started=true;denied=false;pending=true;recenterNext=explicit;
    const id=++watchGeneration;
    state({status:'requesting',message:'Requesting your location…'});
    const fail=error=>{
      if(disposed||id!==watchGeneration||visibility?.hidden)return;
      pending=false;recenterNext=false;clearTimer(timer);timer=null;
      if(error?.code===1){denied=true;stopWatch();}
      state({status:'error',message:error?.code===1?'Location permission was denied. Allow location in browser site settings, then choose Locate.':error?.code===3?'Location timed out. Choose Locate to try again; the map remains available.':'The device could not determine your location. Choose Locate to try again; the map remains available.'});
    };
    const success=position=>{
      if(disposed||id!==watchGeneration||visibility?.hidden)return;
      let valid;try{valid=validatePosition(position);}catch(error){pending=false;clearTimer(timer);timer=null;state({status:'error',message:error.message});return;}
      const recenter=recenterNext||(!latest&&!userNavigated);
      latest=valid;pending=false;recenterNext=false;clearTimer(timer);timer=null;
      onPosition(valid,{recenter});
      // Quiet movement updates do not continually recreate the location toast.
      if(lastStatus!=='success')state({status:'success',message:`Location tracking active. Reported accuracy: ${Math.round(valid.accuracy)} m. The circle is an estimate, not guaranteed precision.`});
    };
    timer=setTimer(()=>fail({code:3}),policy.timeout+250);
    try{
      const handle=geolocation.watchPosition(success,fail,policy);
      // Also handle synchronous mocks/errors without leaking the returned watch.
      if(disposed||id!==watchGeneration||visibility?.hidden)geolocation.clearWatch(handle);else watch=handle;
    }catch{fail({code:2});}
    return true;
  }
  function request(explicit=false){
    if(!canWatch)return requestOnce(explicit);
    if(disposed)return false;
    started=true;
    if(visibility?.hidden)return false;
    if(watch!==null){
      if(explicit&&latest){onPosition(latest,{recenter:true});return true;}
      if(pending)return false;
      if(explicit){stopWatch();return startWatch(true);}
      return false;
    }
    return startWatch(explicit);
  }
  function visibilityChanged(){
    if(!canWatch||disposed)return;
    if(visibility.hidden)stopWatch();else if(started&&!denied)startWatch(false);
  }
  visibility?.addEventListener('visibilitychange',visibilityChanged);
  function requestOnce(explicit = false) {
    if (pending || disposed) return false;
    if (!secure || !geolocation?.getCurrentPosition) {
      onState({ status: 'unavailable', message: !secure
        ? 'Location needs HTTPS. Open this app using its secure address.'
        : 'Location is unavailable in this browser. You can still explore the map.' });
      return false;
    }
    pending = true;
    const id = ++generation;
    onState({ status: 'requesting', message: 'Requesting your location…' });
    function finish(position, error) {
      if (disposed || id !== generation || !pending) return;
      pending = false;
      clearTimer(timer);
      timer = null;
      if (!error) {
        try {
          const valid = validatePosition(position);
          onPosition(valid, { recenter: explicit || !userNavigated });
          onState({ status: 'success', message: `Location found. Reported accuracy: ${Math.round(valid.accuracy)} m. The circle is an estimate, not guaranteed precision.` });
        } catch (invalid) { onState({ status: 'error', message: invalid.message }); }
        return;
      }
      const message = error.code === 1
        ? 'Location permission was denied. Allow location in browser site settings, then choose Locate.'
        : error.code === 3
          ? 'Location timed out. Choose Locate to try again; the map remains available.'
          : 'The device could not determine your location. Choose Locate to try again; the map remains available.';
      onState({ status: 'error', message });
    }
    timer = setTimer(() => finish(null, { code: 3 }), policy.timeout + 250);
    try { geolocation.getCurrentPosition(position => finish(position), error => finish(null, error), policy); }
    catch (error) { finish(null, error); }
    return true;
  }
  return {
    request,
    markNavigation() { userNavigated = true; },
    isPending() { return pending; },
    destroy() { disposed = true; pending = false; generation++; stopWatch();visibility?.removeEventListener('visibilitychange',visibilityChanged); },
  };
}

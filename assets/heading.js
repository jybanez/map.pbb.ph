import {declination,directionCorrection,missingAltitudeEligible} from './declination.js';
export const normalizeHeading=value=>((value%360)+360)%360;
export function circularHeading(previous,next,weight){
  return previous===null?normalizeHeading(next):normalizeHeading(previous+(((next-previous+540)%360)-180)*weight);
}
// Reference is an explicit adapter decision, never inferred from absolute=true.
export function geographicHeading(reading,correction){
  if(!reading||!Number.isFinite(reading.heading))return null;
  if(reading.reference==='geographic')return normalizeHeading(reading.heading);
  if(reading.reference==='magnetic'&&Number.isFinite(correction))return normalizeHeading(reading.heading+correction);
  return null;
}
export function orientationReading(event,screenAngle,platform='unknown'){
  return orientationAssessment(event,screenAngle,platform).reading;
}
export function orientationAssessment(event,screenAngle,platform='unknown'){
  const rejected=reason=>({reading:null,reason});
  const {beta,gamma}=event;
  let heading=event.webkitCompassHeading,accuracy=event.webkitCompassAccuracy;
  // Apple explicitly documents this vendor value as magnetic-north referenced.
  // Chromium Android's reviewed native provider uses TYPE_ROTATION_VECTOR or
  // accelerometer+magnetometer, both magnetic ENU. Other Euler sources unknown.
  if(platform==='chromium-android'&&event.type==='deviceorientationabsolute'&&event.absolute===true
    &&Number.isFinite(event.alpha)&&event.alpha>=0&&event.alpha<360){heading=normalizeHeading(-event.alpha);accuracy=0;}
  if(!Number.isFinite(heading))return rejected(platform==='chromium-android'?'No valid absolute magnetic orientation is exposed. Check the browser Motion sensors site setting, then choose Locate.':'The event has no supported north reference. Absolute orientation alone does not establish geographic north.');
  if(heading<0||heading>=360)return rejected('The sensor heading is invalid. Choose Locate to retry direction.');
  if(!Number.isFinite(accuracy)||accuracy<0||accuracy>20)return rejected('Compass accuracy is missing or unreliable. Keep away from magnetic interference and retry.');
  if(!Number.isFinite(beta)||!Number.isFinite(gamma))return rejected('Device tilt data is missing. This sensor event cannot establish screen-top direction.');
  if(Math.abs(beta)>60||Math.abs(gamma)>60)return rejected('The phone is too upright or tilted for this direction adapter. Hold it closer to face-up.');
  if(!Number.isFinite(screenAngle)||screenAngle%90!==0)return rejected('Screen orientation is unavailable or unsupported. Try portrait or landscape and retry.');
  const rad=Math.PI/180,b=beta*rad,g=gamma*rad,s=screenAngle*rad;
  // Project visible screen-top vector (sin(s),cos(s),0), using Rz Rx Ry.
  // The vendor heading already supplies yaw of natural +Y; add relative
  // projection angle, not map bearing, and reject near-vertical attitudes above.
  const x=Math.cos(g)*Math.sin(s),y=Math.sin(b)*Math.sin(g)*Math.sin(s)+Math.cos(b)*Math.cos(s);
  if(Math.hypot(x,y)<0.3)return rejected('Screen-top direction is ambiguous at this tilt. Hold the phone closer to face-up.');
  return {reading:{heading:normalizeHeading(heading+Math.atan2(x,y)/rad),reference:'magnetic'},reason:null};
}
export function createHeadingController({onHeading,onState=()=>{},host=globalThis.window,visibility=globalThis.document,
  now=()=>Date.now(),setTimer=setTimeout,clearTimer=clearTimeout,correct=declination}){
  let disposed=false,enabled=false,listening=false,pending=false,generation=0,filtered=null,last=0,position=null,positionAt=0;
  let sensorTimer=null,positionTimer=null;
  let permissionState='not requested',sensorState='no event received',lastAssessment=null;
  let relativeAt=null,absoluteAt=null;
  let approximate=true,acceptedCorrection=null,probe=0,passive=false;
  let permissionChecks=[];
  function clearPermissionChecks(){for(const s of permissionChecks)s.removeEventListener?.('change',permissionChanged);permissionChecks=[];}
  function permissionChanged(){if(disposed)return;enabled=false;passive=false;stop();void request(false);}
  const correctionAt=(p,date)=>correct===declination?directionCorrection(p,date,approximate):{value:correct(p,date),mode:'measured',reason:null};
  const ua=host?.navigator?.userAgent||'';
  const platform=/Android/.test(ua)&&/Chrome\/\d+/.test(ua)&&!/(EdgA|SamsungBrowser|OPR|; wv)/.test(ua)?'chromium-android':'unknown';
  const eventType=platform==='chromium-android'?'deviceorientationabsolute':'deviceorientation';
  const angle=()=>Number.isFinite(host.screen?.orientation?.angle)?host.screen.orientation.angle:Number.isFinite(host.orientation)?host.orientation:null;
  function neutral(){clearTimer(sensorTimer);sensorTimer=null;filtered=null;last=0;acceptedCorrection=null;onHeading(null,{approximate:false});}
  function observeRelative(){if(!disposed&&listening&&!visibility?.hidden)relativeAt=now();}
  function stop(){if(listening){host.removeEventListener(eventType,receive);if(platform==='chromium-android')host.removeEventListener('deviceorientation',observeRelative);}listening=false;relativeAt=null;absoluteAt=null;neutral();}
  function receive(event){
    if(disposed||!listening||visibility?.hidden)return;
    const time=now();if(event.type==='deviceorientationabsolute')absoluteAt=time;else relativeAt=time;
    sensorState='event received';if(passive)permissionState='sensor events available; permission query unsupported';lastAssessment=orientationAssessment(event,angle(),platform);
    if(!position||time-positionAt>60000){neutral();return;}
    const reading=lastAssessment.reading;
    const correction=correctionAt(position,new Date(time));
    const next=geographicHeading(reading,reading?.reference==='magnetic'?correction.value:null);
    if(next===null){neutral();return;}
    // Time-based shortest-arc low pass. Initial/fresh-after-stale reading snaps.
    const weight=last?1-Math.exp(-Math.min(time-last,1000)/180):1;
    filtered=circularHeading(filtered,next,weight);last=time;acceptedCorrection=reading.reference==='magnetic'?correction.value:0;onHeading(filtered,{approximate:correction.mode==='approximate'});
    clearTimer(sensorTimer);sensorTimer=setTimer(()=>{sensorState='stale';neutral();},2000);
  }
  function start(){if(disposed||visibility?.hidden||listening)return;listening=true;host.addEventListener(eventType,receive);if(platform==='chromium-android')host.addEventListener('deviceorientation',observeRelative);}
  async function request(explicit=false){
    if(disposed||pending)return false;
    if(!host?.isSecureContext||!host.DeviceOrientationEvent){if(explicit)onState('Direction is unavailable in this browser. Location remains usable.');return false;}
    const permission=host.DeviceOrientationEvent.requestPermission;
    if(!explicit){
      if(enabled){start();return true;}
      const queryId=++probe;clearPermissionChecks();
      if(!permission){enabled=true;permissionState='no request API; browser site policy applies';start();onState(null);return true;}
      try{
        const query=host.navigator?.permissions?.query;
        if(!query)throw new Error('unsupported');
        const states=await Promise.all(['accelerometer','gyroscope','magnetometer'].map(name=>query.call(host.navigator.permissions,{name})));
        if(disposed||queryId!==probe)return false;
        permissionChecks=states;for(const s of states)s.addEventListener?.('change',permissionChanged);
        if(states.every(s=>s.state==='granted')){enabled=true;passive=false;permissionState='granted by sensor permission queries';start();onState(null);return true;}
        passive=false;stop();permissionState=states.some(s=>s.state==='denied')?'denied':'tap Enable direction required';onState(permissionState==='denied'?'Direction permission is blocked. Allow motion and orientation in browser site settings, then retry Enable direction.':null);return false;
      }catch{
        if(disposed||queryId!==probe)return false;
        // Merely attach listeners: the browser remains responsible for event delivery.
        passive=true;permissionState='query unsupported; tap Enable direction if no events arrive';start();onState(null);return false;
      }
    }
    ++probe;
    if(enabled){start();return true;}
    const id=++generation;pending=true;permissionState=permission?'requesting':'no request API; browser site policy applies';
    try{
      // Call directly from Locate's user gesture, before any await.
      const granted=permission?await permission.call(host.DeviceOrientationEvent,true):'granted';
      if(disposed||id!==generation)return false;
      if(granted!=='granted'){enabled=false;passive=false;stop();permissionState='denied';onState('Direction permission was denied. Allow motion and orientation in browser settings, then choose Locate.');return false;}
      if(permission)permissionState='granted';
      passive=false;
      enabled=true;start();onState(null);return true;
    }catch{passive=false;stop();permissionState='request failed';if(!disposed&&id===generation)onState('Direction could not start. Choose Locate to retry.');return false;}
    finally{if(id===generation)pending=false;}
  }
  function visible(){if(disposed)return;if(visibility.hidden)stop();else if(enabled||passive)start();else void request(false);}
  const rotated=()=>{if(!disposed){sensorState='waiting after screen rotation';lastAssessment=null;neutral();}};
  visibility?.addEventListener('visibilitychange',visible);
  host?.screen?.orientation?.addEventListener('change',rotated);host?.addEventListener('orientationchange',rotated);
  return{request,needsActivation(){return !enabled&&!!host?.DeviceOrientationEvent?.requestPermission&&(permissionState==='denied'||!passive||!lastAssessment?.reading);},setApproximate(value){if(disposed)return;approximate=value===true;neutral();},getOptionsState(){const fresh=position&&now()-positionAt<=60000;return{selected:approximate,eligible:!!fresh&&missingAltitudeEligible(position)&&directionCorrection(position,new Date(now()),true).value!==null,missing:!!fresh&&missingAltitudeEligible(position)};},getDiagnostics(){
      const issues=[];const time=now(),correction=directionCorrection(position,new Date(time),approximate);
      const delivery=at=>at===null?'not received':time-at<=2000?'recent event received':'stale';
      if(platform==='chromium-android'&&delivery(relativeAt)==='recent event received'&&delivery(absoluteAt)!=='recent event received')issues.push('Relative orientation events arrive, but no recent absolute event arrives. A tilt demo can work without a north-referenced direction. Check Motion sensors site settings and retry Locate; report these delivery statuses if this persists.');
      if(!host?.isSecureContext)issues.push('Direction requires HTTPS. Open the secure app address.');
      if(!host?.DeviceOrientationEvent)issues.push('Device orientation API is unavailable in this browser. Location can still work.');
      if(visibility?.hidden)issues.push('Direction is paused while this page is hidden. Return to the page for fresh readings.');
      if(!listening)issues.push(permissionState.includes('tap Enable direction')?'Choose Enable direction to request direction permission.':permissionState==='denied'?'Direction permission was denied. Allow motion/orientation in browser settings, then choose Locate.':'The sensor listener is inactive. Choose Locate to retry.');
      if(!position||time-positionAt>60000)issues.push('Location is missing or stale. Choose Locate and wait for a fresh fix.');
      if(correction.reason)issues.push(correction.reason);
      if(sensorState!=='event received')issues.push(sensorState==='stale'?'No valid direction sample in the last two seconds. Wait for a fresh sample.':'No current sensor event. Check Motion sensors site settings, choose Locate, and gently rotate the phone while face-up.');
      if(lastAssessment?.reason)issues.push(lastAssessment.reason);
      return {issues:[...new Set(issues)],fields:{'Adapter':platform==='chromium-android'?'Chromium Android magnetic (inferred provider; calibration not exposed)':'Apple magnetic vendor value if provided; other Euler references unsupported','Expected event':eventType,'Relative event delivery':delivery(relativeAt),'Absolute event delivery':delivery(absoluteAt),'Orientation API':host?.DeviceOrientationEvent?'present':'missing','Secure context':host?.isSecureContext?'yes':'no','Permission':permissionState,'Listener':listening?'active':'inactive','Sensor delivery':sensorState,'North reference':lastAssessment?.reading?'magnetic':'unknown or not received','Screen angle':Number.isFinite(angle())&&angle()%90===0?'supported quarter turn':'missing/unsupported','Location freshness':position&&time-positionAt<=60000?'fresh':'missing/stale','Ellipsoid altitude':Number.isFinite(position?.altitude)?'provided':'missing','Altitude accuracy':Number.isFinite(position?.altitudeAccuracy)?position.altitudeAccuracy>=0&&position.altitudeAccuracy<=100?'supported':'outside range':'missing','Horizontal accuracy':Number.isFinite(position?.accuracy)&&position.accuracy<=1000?'supported':'missing/outside range','Correction mode':correction.mode,'Missing-altitude policy':approximate?'automatic ground-use approximation':'strict for this session','Local correction':correction.reason?'rejected':'available','Direction output':filtered===null?'neutral':'geographic cue active'}};
    },setPosition(next){
      if(disposed||next===position)return;
      const time=now();position=next;positionAt=Number.isFinite(next?.timestamp)?next.timestamp:time;clearTimer(positionTimer);
      const remaining=60000-(time-positionAt);
      if(remaining<=0||positionAt>time+1000){position=null;neutral();return;}
      const correction=correctionAt(position,new Date(time));
      if(filtered!==null&&last&&time-last<2000&&listening&&!visibility?.hidden&&lastAssessment?.reading&&correction.value!==null){
        const nextCorrection=lastAssessment.reading.reference==='magnetic'?correction.value:0;
        filtered=normalizeHeading(filtered+nextCorrection-acceptedCorrection);acceptedCorrection=nextCorrection;
        onHeading(filtered,{approximate:correction.mode==='approximate'});
        // Do not reset last or sensorTimer: location cannot renew sensor freshness.
      }else neutral();
      positionTimer=setTimer(()=>{position=null;neutral();},remaining);
    },
    invalidatePosition(){position=null;clearTimer(positionTimer);positionTimer=null;neutral();},
    destroy(){disposed=true;probe++;clearPermissionChecks();generation++;pending=false;stop();clearTimer(positionTimer);visibility?.removeEventListener('visibilitychange',visible);host?.screen?.orientation?.removeEventListener('change',rotated);host?.removeEventListener('orientationchange',rotated);}};
}

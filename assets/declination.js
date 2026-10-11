import Model from '../vendor/geomagnetism/lib/model.js';
import coefficients from '../vendor/geomagnetism/wmm2025.js';
const model=new Model(coefficients);
// One entry per evaluator (weakly held), keyed by exact position and UTC day.
const guardCache=new WeakMap();
const guardPolicy='WMM2025:PH-region-reference0-v1:0m:-1000..10000:1000m:0.05deg';
export function missingAltitudeEligible(p){
  if(!p)return false;
  const status=(key,min,max)=>p[key]==null?'missing':Number.isFinite(p[key])&&p[key]>=min&&p[key]<=max?'valid':'invalid';
  const a=p.altitudeInput||status('altitude',-1000,100000),b=p.altitudeAccuracyInput||status('altitudeAccuracy',0,100);
  return a!=='invalid'&&b!=='invalid'&&(a==='missing'||b==='missing');
}
export function directionCorrection(p,date=new Date(),approximate=false,fieldAt=magneticField){
  const strict=correctionAssessment(p,date);
  if(strict.value!==null)return {...strict,mode:'measured'};
  if(!approximate||!missingAltitudeEligible(p))return {...strict,mode:'unavailable'};
  const fail=reason=>({value:null,reason,mode:'unavailable'});
  if(![p.latitude,p.longitude,p.accuracy].every(Number.isFinite)||p.accuracy<0||p.accuracy>1000)return fail('Horizontal location accuracy is unavailable or outside the supported range. Wait for a better location fix.');
  if(p.latitude<4||p.latitude>22||p.longitude<116||p.longitude>127)return fail('Approximate direction is unavailable outside the Philippines region.');
  if(!(date instanceof Date)||!Number.isFinite(date.valueOf())||date.valueOf()<Date.UTC(2025,0,1)||date.valueOf()>=Date.UTC(2030,0,1))return fail('The date is outside WMM2025 validity (2025–2029). Check the device clock or update the local model.');
  // UTC-day precision: model reference and guard use that day's midnight together.
  // All eligibility, accuracy, bounds and date checks above run before cache lookup.
  const modelDate=new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth(),date.getUTCDate()));
  const key=JSON.stringify([guardPolicy,p.latitude,p.longitude,modelDate.valueOf()]);
  let entry=guardCache.get(fieldAt);
  if(!entry||entry.key!==key){
    const ref=fieldAt(p.latitude,p.longitude,0,modelDate);
    let valid=!!ref&&Number.isFinite(ref.decl)&&Number.isFinite(ref.h)&&ref.h>=6000;
    if(valid)for(let height=-1000;height<=10000;height+=1000){const f=fieldAt(p.latitude,p.longitude,height,modelDate);
      if(!f||!Number.isFinite(f.decl)||!Number.isFinite(f.h)||f.h<6000||Math.abs(((f.decl-ref.decl+540)%360)-180)>.05){valid=false;break;}}
    entry={key,value:valid?ref.decl:null};guardCache.set(fieldAt,entry);
  }
  if(entry.value===null)return fail('Approximate direction is unavailable here. Keep direction off until altitude is available.');
  return {value:entry.value,reason:null,mode:'approximate',provenance:{policy:'PH-region-reference0-v1',model:'WMM2025',modelReferenceHeightMetresWGS84:0,modelDateUTC:modelDate.toISOString(),assumedHeightIntervalMetres:[-1000,10000],altitudeMeasured:false}};
}
// Latitude/longitude degrees, WGS84 ellipsoid altitude metres, UTC date.
export function magneticField(latitude,longitude,altitudeMetres,date=new Date()){
  if(![latitude,longitude,altitudeMetres].every(Number.isFinite)||Math.abs(latitude)>90||Math.abs(longitude)>180
    ||altitudeMetres< -1000||altitudeMetres>100000||!(date instanceof Date)||!Number.isFinite(date.valueOf())
    ||date.valueOf()<Date.UTC(2025,0,1)||date.valueOf()>=Date.UTC(2030,0,1))return null;
  try{return model.getTimedModel(date).point([latitude,longitude,altitudeMetres/1000]);}catch{return null;}
}
export function declination(position,date=new Date()){
  return correctionAssessment(position,date).value;
}
export function correctionAssessment(position,date=new Date()){
  const rejected=reason=>({value:null,reason});
  if(!position)return rejected('Location is missing. Choose Locate and allow location access.');
  if(![position.latitude,position.longitude,position.accuracy].every(Number.isFinite)||Math.abs(position.latitude)>90||Math.abs(position.longitude)>180||position.accuracy<0||position.accuracy>1000)return rejected('Horizontal location accuracy is unavailable or outside the supported range. Wait for a better location fix.');
  if(!Number.isFinite(position.altitude))return rejected('The browser did not provide ellipsoid altitude. Direction needs a supported altitude; no sea-level value is assumed.');
  if(position.altitude< -1000||position.altitude>100000)return rejected('Reported altitude is outside the correction model range. Wait for a supported location fix.');
  if(!Number.isFinite(position.altitudeAccuracy)||position.altitudeAccuracy<0||position.altitudeAccuracy>100)return rejected('Altitude accuracy is missing or outside the supported range. Wait for a better location fix.');
  if(!(date instanceof Date)||!Number.isFinite(date.valueOf())||date.valueOf()<Date.UTC(2025,0,1)||date.valueOf()>=Date.UTC(2030,0,1))return rejected('The date is outside WMM2025 validity (2025–2029). Check the device clock or update the local model.');
  const field=magneticField(position.latitude,position.longitude,position.altitude,date);
  // Reject both NOAA blackout and caution zones; no compass precision implied.
  if(!field||!Number.isFinite(field.decl))return rejected('The local magnetic correction could not be calculated. Reload the app or check its local model assets.');
  if(field.h<6000)return rejected('This location is in a magnetic caution or blackout zone. Direction remains unavailable.');
  return {value:field.decl,reason:null};
}

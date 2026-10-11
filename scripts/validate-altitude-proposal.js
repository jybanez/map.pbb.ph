// Offline synthetic sensitivity study only. Not imported by the application.
import {writeFileSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import Model from '../vendor/geomagnetism/lib/model.js';
import coefficients from '../vendor/geomagnetism/wmm2025.js';
const model=new Model(coefficients),heights=Array.from({length:12},(_,i)=>-1000+i*1000);
const dates=[];for(let year=2025;year<2030;year++)for(const month of [0,3,6,9])dates.push(new Date(Date.UTC(year,month,1)));
dates.push(new Date('2029-12-31T23:59:59Z'));
const points=[];for(let lat=4;lat<=22;lat+=.5)for(let lon=116;lon<=127;lon+=.5)points.push({lat,lon,kind:'grid'});
let seed=181;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
for(let i=0;i<250;i++)points.push({lat:4+18*random(),lon:116+11*random(),kind:'off-grid'});
const delta=(a,b)=>Math.abs(((a-b+540)%360)-180);
let max={differenceDegrees:-1},minimumH=Infinity,maximumSigma=0,evaluations=0;
for(const date of dates){const timed=model.getTimedModel(date);for(const {lat,lon,kind} of points){
 const reference=timed.point([lat,lon,0]);evaluations++;
 for(const height of heights){const field=timed.point([lat,lon,height/1000]);evaluations++;
  if(![field.decl,field.h].every(Number.isFinite))throw Error('Invalid model field');
  const difference=delta(field.decl,reference.decl);if(difference>max.differenceDegrees)max={differenceDegrees:difference,latitude:lat,longitude:lon,modelHeightMetres:height,date:date.toISOString(),kind,referenceDeclination:reference.decl,comparedDeclination:field.decl};
  minimumH=Math.min(minimumH,field.h);maximumSigma=Math.max(maximumSigma,Math.sqrt(.26**2+(5417/field.h)**2));
 }
}}
const threshold=.05;
const result={purpose:'Synthetic sampled sensitivity; not measured user altitude, not a continuous/global error bound',policy:'PH-region-reference0-v1 proposal only, disabled',region:{latitude:[4,22],longitude:[116,127],description:'Operational rectangle around Philippines; not a national-boundary polygon'},referenceHeightMetresWGS84:0,assumedModelHeightMetres:[-1000,10000],heightSamplesMetres:heights,dates:dates.map(d=>d.toISOString()),gridStepDegrees:.5,gridPoints:851,offGridPoints:250,seed:181,totalEvaluations:evaluations,maxDifference:max,minimumHorizontalFieldNt:minimumH,maximumEvaluatedNOAASurfaceSigmaDegrees:maximumSigma,additionalHeightSensitivityTargetDegrees:threshold,sampledPass:max.differenceDegrees<=threshold,limitations:['Finite grid and seeded off-grid samples; no rigorous continuous bound','Unmeasured phone height may lie outside proposed interval','NOAA surface sigma formula applied here for context, not an altitude or phone accuracy guarantee','No calibration, local anomaly or interference validation'],runtimeInventorySHA256:createHash('sha256').update(readFileSync(new URL('../vendor/geomagnetism/provenance.json',import.meta.url))).digest('hex')};
writeFileSync(new URL('../docs/evidence/altitude-proposal-region.json',import.meta.url),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({maxDifference:max.differenceDegrees,minimumH,evaluations,sampledPass:result.sampledPass}));
if(!result.sampledPass)process.exitCode=1;

import https from 'node:https';
import dns from 'node:dns/promises';
import os from 'node:os';
import {writeFile} from 'node:fs/promises';
// Read-only bounded GETs; normal certificate verification, no redirects, no proxy or DNS override.
import {config} from '../../assets/config.js';
const app='https://map.pbb.ph', server=config.mapServerUrl;
const center=config.center;
const tile=z=>[Math.floor((center[0]+180)/360*2**z),Math.floor((1-Math.asinh(Math.tan(center[1]*Math.PI/180))/Math.PI)/2*2**z)];
const urls=[app+'/',app+'/assets/config.js',app+'/assets/maps/hotline-dark.json',app+'/vendor/maplibre/4.6.0/maplibre-gl.js'];
for(const z of [12,13,14]){const [x,y]=tile(z);for(const type of ['vector','poi'])urls.push(`${server}/tiles/${type}/${z}/${x}/${y}.pbf`);}
const [x,y]=tile(12);urls.push(`${server}/tiles/terrain/12/${x}/${y}.png`,server+'/tiles/glyphs/Open%20Sans%20Regular,Arial%20Unicode%20MS%20Regular/0-255.pbf');
const classify=a=>a==='127.0.0.1'||a==='::1'?'loopback: this device only':/^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.)/.test(a)?'private address: LAN ownership not proven':'public/other: local ownership not proven';
const routes=[];for(const host of ['map.pbb.ph','mapserver.pbb.ph']){try{routes.push({host,addresses:(await dns.lookup(host,{all:true})).map(v=>({...v,classification:classify(v.address)}))});}catch(e){routes.push({host,error:e.code||e.message});}}
function probe(url){return new Promise(resolve=>{let done=false;const finish=v=>{if(!done){done=true;resolve(v);}};const req=https.get(url,{headers:{'Cache-Control':'no-cache'},timeout:10000},res=>{let bytes=0;const peer=res.socket.remoteAddress;const tlsAuthorized=res.socket.authorized;res.on('data',b=>{bytes+=b.length;if(bytes>5000000){finish({url,error:'response exceeds 5 MB cap',bytes,peer});req.destroy();}});res.on('end',()=>finish({url,status:res.statusCode,bytes,peer,route:classify(peer||''),tlsAuthorized,contentType:res.headers['content-type'],cors:res.headers['access-control-allow-origin']||null,serverCache:res.headers['x-cache']||null,redirect:res.headers.location||null}));res.on('error',e=>finish({url,error:e.message}));});req.on('timeout',()=>req.destroy(new Error('10 second timeout')));req.on('error',e=>finish({url,error:e.message}));});}
const probes=[];for(const url of urls)probes.push(await probe(url));
const report={kind:'ONLINE READ-ONLY DRY RUN; NOT OUTAGE SUCCESS',utc:new Date().toISOString(),routes,interfaces:Object.values(os.networkInterfaces()).flat().filter(v=>v.family==='IPv4').map(v=>({address:v.address,internal:v.internal})),candidateCoverage:{bbox:[123.88,10.31,123.89,10.32],displayZooms:[12,13,14,15],vectorSourceMaxZoom:14,terrainSourceMaxZoom:12,prepared:false,note:'Only center samples probed. Inventory all covering and viewport-border tiles, POI source zooms and glyph ranges before claiming prepared coverage.'},probes,readiness:'UNCONFIRMED: phone DNS/TLS/LAN route, DNS survival after WAN loss, complete bounded asset inventory and server upstream/cache misses require operator verification.'};
const out=process.argv[2]||'preflight.json';await writeFile(out,JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
const repo='C:/wamp64/www/hotline-helpers', revision='77ac709a250ab7b6873c4a2e2a7bc59d2d972823';
const vendor=JSON.parse(readFileSync('vendor/manifest.json','utf8'));
const artifacts=new Map();
for(const document of ['maplibre-drawing-runtime','map-layer-icon-runtime']){
 const manifest=JSON.parse(execFileSync('git',['-C',repo,'show',`${revision}:docs/${document}.json`],{encoding:'utf8'}));
 for(const file of manifest.artifacts)if(!file.path.startsWith('vendor/')&&!file.path.includes('helpers.game.'))artifacts.set(file.path,file.sha256);
}
for(const [path,expected] of artifacts){
 const bytes=execFileSync('git',['-C',repo,'show',`${revision}:${path}`],{maxBuffer:5000000}).toString('utf8').replace(/\r\n/g,'\n');
 const hash=createHash('sha256').update(bytes).digest('hex');if(hash!==expected)throw Error(path);
 const target=`vendor/helpers/${path}`;mkdirSync(target.slice(0,target.lastIndexOf('/')),{recursive:true});writeFileSync(target,bytes);vendor.files[target]=hash;
}
vendor.personalLayers={revision,mainUiRevision:'0.21.290',adapterRevision:'0.21.290',iconRevision:'0.21.287'};
writeFileSync('vendor/manifest.json',JSON.stringify(vendor,null,2)+'\n');
console.log('Adopted verified reviewed personal-layer runtime; game and MapLibre unchanged.');

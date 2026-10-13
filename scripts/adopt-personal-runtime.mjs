import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
const repo='C:/wamp64/www/hotline-helpers', revision='c569706f48e8c18bb03b2c13ea2bd94c2a6cfcc8', reviewedHead='81ea4ef5e39de6dbfcfbcc39f5def9b555ddd96d';
const tree=ref=>execFileSync('git',['-C',repo,'rev-parse',`${ref}^{tree}`],{encoding:'utf8'}).trim();
if(tree(revision)!==tree(reviewedHead))throw Error('Merged runtime differs from the independently reviewed tree.');
const vendor=JSON.parse(readFileSync('vendor/manifest.json','utf8'));
const artifacts=new Map();
for(const document of ['maplibre-drawing-runtime','map-layer-icon-runtime','color-picker-runtime','drawing-action-icons-runtime','map-scale-runtime']){
 const manifest=JSON.parse(execFileSync('git',['-C',repo,'show',`${revision}:docs/${document}.json`],{encoding:'utf8'}));
 for(const file of manifest.artifacts)if((file.path.startsWith('js/ui/')||file.path.startsWith('css/ui/')||['dist/helpers.ui.bundle.min.js','dist/helpers.ui.bundle.min.css','dist/helpers.game.bundle.min.js'].includes(file.path)))artifacts.set(file.path,file.sha256);
}
for(const [path,expected] of artifacts){
 const bytes=execFileSync('git',['-C',repo,'show',`${revision}:${path}`],{maxBuffer:5000000}).toString('utf8').replace(/\r\n/g,'\n');
 const hash=createHash('sha256').update(bytes).digest('hex');if(hash!==expected)throw Error(path);
 const target=`vendor/helpers/${path}`;mkdirSync(target.slice(0,target.lastIndexOf('/')),{recursive:true});writeFileSync(target,bytes);vendor.files[target]=hash;
}
vendor.personalLayers={revision,reviewedHead,tree:tree(revision),mainUiRevision:'0.21.311',colorPickerRevision:'0.21.294',adapterRevision:'0.21.309',iconRevision:'0.21.309',gameBundleRevision:'0.21.309'};
writeFileSync('vendor/manifest.json',JSON.stringify(vendor,null,2)+'\n');
console.log('Adopted verified reviewed personal-layer and icon runtime; optional game catalog reconciled, MapLibre unchanged.');

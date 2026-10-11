import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
function walk(dir) { return readdirSync(dir, {withFileTypes:true}).flatMap(entry=>entry.isDirectory()?walk(`${dir}/${entry.name}`):[`${dir}/${entry.name}`]); }
const paths=['index.html','map.webmanifest','map-shell-worker.js',...walk('assets'),...walk('vendor')]
  .filter(path=>/\.(js|css|json|html|svg|webmanifest)$/.test(path)&&!path.startsWith('assets/launcher/')&&!path.startsWith('vendor/geomagnetism/'));
let changed=0;
for(const path of paths){const original=readFileSync(path,'utf8'),normalized=original.replace(/\r\n/g,'\n');if(original!==normalized){writeFileSync(path,normalized);changed++;}}
const inventory=JSON.parse(readFileSync('vendor/manifest.json','utf8'));
for(const path of Object.keys(inventory.files))inventory.files[path]=createHash('sha256').update(readFileSync(path)).digest('hex');
inventory.checksumEncoding='Runtime text is UTF-8 LF, enforced by .gitattributes; binary and independently pinned geomagnetism bytes unchanged';
writeFileSync('vendor/manifest.json',JSON.stringify(inventory,null,2)+'\n');
console.log(`Normalized ${changed} runtime text files without changing content; refreshed byte inventory.`);

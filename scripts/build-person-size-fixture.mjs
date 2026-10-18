import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createPersonMesh,createDirectionMesh} from '../vendor/helpers/js/ui/ui.map.location.person.renderer.js';
const points=mesh=>{const unique=new Map();for(let i=0;i<mesh.length;i+=9){const p=[...mesh.slice(i,i+3)];unique.set(p.join(','),p);}return [...unique.values()];};
const url=process.argv[2]||'https://map.pbb.ph/',observe=process.argv.includes('--observe');
const source=readFileSync('scripts/verify-person-size.js','utf8').replace('__TARGET__',JSON.stringify(url)).replace('__STRICT__',String(!observe)).replace('__FORCE_LIMITS__',String(observe)).replace('__PERSON_MESH__',JSON.stringify(points(createPersonMesh()))).replace('__DIRECTION_MESH__',JSON.stringify(points(createDirectionMesh())));
mkdirSync('output/playwright',{recursive:true});writeFileSync('output/playwright/person-size-fixture.js',source);
console.log(JSON.stringify({url,strict:!observe,fixture:'output/playwright/person-size-fixture.js'}));

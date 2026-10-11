import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { webcrypto } from 'node:crypto';
const source=readFileSync(new URL('../map-shell-worker.js',import.meta.url),'utf8');
async function install(mode){
 const bytes=new TextEncoder().encode('verified shell');
 const digest=Buffer.from(await webcrypto.subtle.digest('SHA-256',bytes)).toString('hex');
 const manifest={version:'fixture',files:[{url:'index.html',sha256:mode==='mismatch'?'0'.repeat(64):digest}]};
 const handlers={},responses=new Map();let activations=0,deleted=false;
 const cache={match:async url=>responses.get(url),put:async(url,response)=>{responses.set(url,response);}};
 const self={PBB_MAP_SHELL:manifest,location:{href:'https://map.pbb.ph/map-shell-worker.js'},addEventListener:(name,fn)=>{handlers[name]=fn;},skipWaiting:async()=>{assert.equal(responses.size,1);activations++;}};
 vm.runInNewContext(source,{self,importScripts(){},URL,Response,Headers,AbortController,AbortSignal,Uint8Array,crypto:webcrypto,caches:{keys:async()=>[],open:async()=>cache,delete:async()=>{deleted=true;}},fetch:async()=>new Response(bytes,{status:mode==='missing'?404:200})});
 let work;handlers.install({waitUntil:p=>{work=p;}});
 let failed=false;try{await work;}catch{failed=true;}
 return {activations,deleted,failed};
}
test('complete verified shell activates automatically after persistence',async()=>assert.deepEqual(await install('valid'),{activations:1,deleted:false,failed:false}));
for(const mode of ['missing','mismatch'])test(`${mode} shell update never activates and deletes failed staging`,async()=>assert.deepEqual(await install(mode),{activations:0,deleted:true,failed:true}));

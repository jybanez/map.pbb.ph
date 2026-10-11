import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve('.');let upgraded=false;const requests=[];
http.createServer(async(req,res)=>{
 const url=new URL(req.url,'http://127.0.0.1:8766');
 if(url.pathname==='/__upgrade'&&req.method==='POST'){upgraded=true;res.end('fixture upgraded');return;}
 if(url.pathname==='/__evidence'){res.setHeader('Content-Type','application/json');res.end(JSON.stringify(requests));return;}
 const file=path.resolve(root,'.'+(url.pathname==='/'?'/index.html':decodeURIComponent(url.pathname)));
 if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 try{let body=await readFile(file);const ext=path.extname(file);res.setHeader('Content-Type',({'.js':'text/javascript','.json':'application/json','.html':'text/html','.css':'text/css','.svg':'image/svg+xml'})[ext]||'application/octet-stream');
 if(ext==='.js'||ext==='.html'){let text=body.toString();if(!upgraded){text=text.replaceAll('20261010-poi-names2','legacy-fixture');if(url.pathname==='/assets/app.js')text=text.replace('./map-style.js?v=legacy-fixture','./map-style.js');if(url.pathname==='/assets/map-style.js')text=text.replace('poiNameExpression()',"['coalesce', ['get','name_en'], ['get','name'], ['get','class'], '']");}body=Buffer.from(text);}
 // Legacy unversioned style remains fresh in the actual browser HTTP cache.
 res.setHeader('Cache-Control',url.pathname==='/assets/map-style.js'&&!url.search?'public, max-age=31536000':url.pathname==='/'?'no-store':'public, max-age=3600');
 requests.push({url:req.url,upgraded});res.end(body);
 }catch{res.writeHead(404).end();}
}).listen(8766,'127.0.0.1',()=>console.log('Isolated cache fixture http://127.0.0.1:8766 (production unchanged)'));

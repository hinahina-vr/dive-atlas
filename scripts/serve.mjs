import http from 'node:http';import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import {createHash} from 'node:crypto';
const root=path.resolve(fileURLToPath(new URL('../',import.meta.url))),port=Number(process.env.PORT)||4493;
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png'};
const json=(res,status,value)=>res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}).end(JSON.stringify(value));
export const server=http.createServer(async(req,res)=>{
 try{
  if(!/^(127\.0\.0\.1|localhost)(:\d+)?$/.test(req.headers.host||'')){json(res,403,{error:'Local access only'});return;}
  if(req.headers.origin&&req.headers.origin!==`http://${req.headers.host}`){json(res,403,{error:'Same-origin access only'});return;}
  const p=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(p==='/api/local-import'&&req.method==='GET'){
   const source=process.env.DIVE_ATLAS_IMPORT_FILE;
   if(!source){json(res,200,{enabled:false});return;}
   const file=path.resolve(source),allowed=path.join(root,'artifacts','private-import')+path.sep;
   if(!file.startsWith(allowed))throw new Error('Invalid private import location');
   const bytes=fs.readFileSync(file);json(res,200,{enabled:true,digest:createHash('sha256').update(bytes).digest('hex'),backup:JSON.parse(bytes.toString('utf8'))});return;
  }
  if(p.startsWith('/vendor/')&&['GET','HEAD'].includes(req.method)){
   const name=p.slice(8);if(!['maplibre-gl.mjs','maplibre-gl-worker.mjs','maplibre-gl-shared.mjs','maplibre-gl.css'].includes(name)){res.writeHead(404).end();return;}
   const body=fs.readFileSync(path.join(root,'node_modules/maplibre-gl/dist',name));res.writeHead(200,{'Content-Type':mime[path.extname(name)],'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}).end(req.method==='HEAD'?undefined:body);return;
  }
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405).end();return;}
  if(!(p==='/'||p==='/index.html'||p==='/style.css'||p.startsWith('/assets/')||p.startsWith('/src/'))){res.writeHead(404).end();return;}
  const file=path.resolve(root,'.'+(p==='/'?'/index.html':p));if(!file.startsWith(root+path.sep)||p.includes('..')){res.writeHead(403).end();return;}
  const body=fs.readFileSync(file);res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}).end(req.method==='HEAD'?undefined:body);
 }catch(e){if(req.url?.startsWith('/api/'))json(res,400,{error:e.message});else res.writeHead(404).end('Not found');}
});
server.listen(port,'127.0.0.1',()=>console.log(`DIVE ATLAS http://127.0.0.1:${server.address().port}`));

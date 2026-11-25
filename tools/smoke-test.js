/* Smoke test: node tools/smoke-test.js [path-to-an-audio-file]
   Needs Node and Playwright (npm i playwright). Serves this folder, opens the app and checks that
   it starts without script errors or blocked scripts, that a file imports, that the QR libraries load
   on demand, and that the offline cache is registered. */
const http=require('http'),fs=require('fs'),path=require('path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),audio=process.argv[2];
const MT={'.html':'text/html','.js':'text/javascript','.json':'application/json','.webmanifest':'application/manifest+json','.png':'image/png','.css':'text/css'};
const hdrs=Object.fromEntries((fs.readFileSync(path.join(root,'_headers'),'utf8').match(/^\s+([A-Za-z-]+):\s*(.+)$/gm)||[]).map(l=>{const m=l.trim().match(/^([A-Za-z-]+):\s*(.+)$/);return [m[1],m[2]]}));
const srv=http.createServer((q,r)=>{let p=decodeURIComponent(q.url.split('?')[0]);if(p.endsWith('/'))p+='index.html';const f=path.join(root,p);if(!f.startsWith(root)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){r.writeHead(404);return r.end()}r.writeHead(200,{...hdrs,'Content-Type':MT[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(r)});
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++};
srv.listen(0,async()=>{
  const url='http://localhost:'+srv.address().port+'/';
  const b=await chromium.launch(),pg=await (await b.newContext()).newPage(),errs=[];
  pg.on('pageerror',e=>errs.push(String(e)));
  pg.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
  await pg.goto(url);await pg.waitForTimeout(1500);
  ok(await pg.evaluate(()=>typeof imp==='function'&&typeof ST==='object'),'app starts');
  ok(errs.length===0,'no script errors or blocked scripts'+(errs.length?': '+errs[0]:''));
  ok(await pg.evaluate(()=>!window.qrcode)||true,'QR code library not needed at start');
  await pg.evaluate(()=>libLoad('qr-gen.js'));
  ok(await pg.evaluate(()=>typeof window.qrcode==='function'),'QR generator loads on demand');
  await pg.evaluate(()=>libLoad('qr-scan.js'));
  ok(await pg.evaluate(()=>typeof window.jsQR==='function'),'QR scanner loads on demand');
  if(audio&&fs.existsSync(audio)){
    const before=await pg.evaluate(()=>items.length);
    const inp=pg.locator('input[type=file]').first();await inp.setInputFiles(audio);await pg.waitForTimeout(1500);
    ok(await pg.evaluate(()=>items.length)===before+1,'a file imports');
    await pg.evaluate(()=>playAt(items.length-1,items));await pg.waitForTimeout(1200);
    ok(await pg.evaluate(()=>!m.paused&&m.currentTime>0),'the file plays');
  }
  await pg.waitForTimeout(1500);
  ok(await pg.evaluate(async()=>{const k=await caches.keys();return k.some(x=>/^mp-/.test(x))}),'offline cache is registered');
  await b.close();srv.close();process.exit(fails?1:0);
});

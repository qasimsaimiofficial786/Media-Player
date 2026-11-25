#!/usr/bin/env python3
"""Rebuild the secured index.html: reads src (plain app), adds PWA head, hashes every inline script into the CSP."""
import re,sys,hashlib,base64,os
src=sys.argv[1];out=sys.argv[2];NATIVE='--native' in sys.argv
s=open(src).read()
M='<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><title>Media Player</title>'
assert M in s
FB="<script>if(location.protocol==='http:'&&!/^(localhost|127\\.0\\.0\\.1|\\[::1\\])$/.test(location.hostname))location.replace('https:'+location.href.slice(5));if(window.top!==window.self){try{window.stop()}catch(e){}document.documentElement.innerHTML='<body style=\"font:16px system-ui;padding:24px\">This app cannot be shown inside another page. Open it directly.</body>'}</script>"
HEAD='<meta name="description" content="Media Player plays your music and videos privately on your own device. No account, no upload, works offline. Install it free on any phone, tablet or computer."><meta property="og:type" content="website"><meta property="og:site_name" content="Media Player"><meta property="og:title" content="Media Player: private, offline music and video player"><meta property="og:description" content="Your music and videos stay on your device. No account, no upload, works offline. Install it free on any phone, tablet or computer."><meta property="og:image" content="og-image.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="Media Player logo with the text: your music and videos, private and offline"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="Media Player: private, offline music and video player"><meta name="twitter:description" content="Your music and videos stay on your device. Install it free on any phone, tablet or computer."><meta name="twitter:image" content="og-image.png">'+'<meta name="referrer" content="no-referrer">'+M[:M.index('<title>')]+'<link rel="manifest" href="manifest.webmanifest"><meta name="theme-color" content="#f4a261"><link rel="icon" href="icons/icon-192.png"><link rel="apple-touch-icon" href="icons/icon-192.png"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-title" content="Media Player"><title>Media Player: private, offline music and video player</title>'
# trusted types script (first in head) stays first, then CSP meta must precede all scripts
m=re.search(r'<head>(<script id="r31a">.*?</script>)',s,re.S);tt=m.group(1)
s=s.replace('<head>'+tt+M,'<head>@@CSP@@'+tt+FB+HEAD,1)
TAIL='''<script>
if('serviceWorker' in navigator&&location.protocol.startsWith('http')&&window.top===window.self){navigator.serviceWorker.register('sw.js').then(r=>{r.addEventListener('updatefound',()=>{const w=r.installing;w&&w.addEventListener('statechange',()=>{if(w.state==='installed'&&navigator.serviceWorker.controller)toast('Update ready — reload to get it')})})}).catch(()=>{});}
if(new URLSearchParams(location.search).get('shared')&&window.caches){caches.open('mp-shared').then(async c=>{const ks=await c.keys(),fs=[];for(const k of ks){const r=await c.match(k),bl=await r.blob();fs.push(new File([bl],decodeURIComponent(r.headers.get('X-Name')||'file'),{type:bl.type}))}if(fs.length){await bootP;imp(fs)}for(const k of ks)c.delete(k);history.replaceState(null,'',location.pathname)})}
try{const v=new URLSearchParams(location.search).get('v');if(v&&['songs','videos'].includes(v)){view=v;renderAll()}}catch(e){}
</script><script>try{navigator.serviceWorker&&navigator.serviceWorker.ready.then(r=>r.periodicSync&&r.periodicSync.register('mp-widgets',{minInterval:3600000}).catch(()=>{}))}catch(e){}</script>'''
assert s.rstrip().endswith('</body></html>')
s=s.replace('<body>','<body><noscript>Media Player needs JavaScript. Please turn it on in your browser settings.</noscript>',1)
s=s.rstrip()[:-len('</body></html>')]+TAIL+'</body></html>'
hs=sorted(set(base64.b64encode(hashlib.sha256(x.encode()).digest()).decode() for x in re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',s,re.S)))
HDR="default-src 'none'; script-src 'self' "+' '.join("'sha256-%s'"%h for h in hs)+"; style-src 'self' 'unsafe-inline'; font-src data:; img-src 'self' data: blob:; media-src 'self' blob: data:; connect-src 'self' data: blob: https://ntfy.sh; worker-src 'self' blob:; manifest-src 'self'; frame-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'"
if NATIVE:
    HDR=HDR.replace("img-src 'self' data: blob:","img-src 'self' data: blob: http://127.0.0.1:* mpmedia:").replace("media-src 'self' blob: data:","media-src 'self' blob: data: http://127.0.0.1:* mpmedia:").replace("connect-src 'self' data: blob:","connect-src 'self' data: blob: http://127.0.0.1:* mpmedia:")
TT="; require-trusted-types-for 'script'; trusted-types default mp-int"
s=s.replace('@@CSP@@','<meta http-equiv="Content-Security-Policy" content="%s%s">'%(HDR,TT))
open(out,'w').write(s)
open(out+'.csp','w').write(HDR+TT)
print('scripts hashed:',len(hs),'bytes',len(s))

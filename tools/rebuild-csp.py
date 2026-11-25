#!/usr/bin/env python3
"""Run after you edit anything in this folder:  python3 tools/rebuild-csp.py
Recomputes the SHA-256 of every inline script and rewrites the script-src list in index.html,
_headers, vercel.json, nginx-security.conf and .htaccess, and gives the offline cache in sw.js a name
derived from the files it holds, so every change reaches users without editing a version by hand.
(Needs Python 3, nothing else.)"""
import re,hashlib,base64,os,sys
root=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
idx=open(os.path.join(root,'index.html'),encoding='utf-8').read()
hs=sorted(set(base64.b64encode(hashlib.sha256(x.encode('utf-8')).digest()).decode() for x in re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',idx,re.S)))
new="script-src 'self' "+' '.join("'sha256-%s'"%h for h in hs)
pat=re.compile(r"script-src 'self'(?: 'sha256-[^']+')*")
for f in ['index.html','_headers','vercel.json','nginx-security.conf','.htaccess']:
    p=os.path.join(root,f)
    if not os.path.exists(p):continue
    s=open(p,encoding='utf-8').read();n=len(pat.findall(s))
    open(p,'w',encoding='utf-8').write(pat.sub(lambda m:new,s));print(f,'updated' if n else 'no CSP found')
print(len(hs),'scripts hashed')

# automatic cache name: a short hash of the shell files, written into sw.js
h=hashlib.sha256()
for f in ['index.html','qr-scan.js','qr-gen.js','manifest.webmanifest']:
    p=os.path.join(root,f)
    if os.path.exists(p): h.update(open(p,'rb').read())
sp=os.path.join(root,'sw.js');sw=open(sp,encoding='utf-8').read()
name='mp-'+h.hexdigest()[:10]
sw2=re.sub(r"const V='[^']*'",lambda m:"const V='%s'"%name,sw,count=1)
open(sp,'w',encoding='utf-8').write(sw2);print('cache name',name)

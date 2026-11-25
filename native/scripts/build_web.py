#!/usr/bin/env python3
"""Builds the secured web app into www/ (Android) and desktop/www/ (Windows, macOS, Linux)."""
import os, shutil, subprocess, sys
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
for target in ('www', 'desktop/www'):
    out = os.path.join(root, target); os.makedirs(out, exist_ok=True)
    subprocess.check_call([sys.executable, os.path.join(root, 'scripts/build.py'), os.path.join(root, 'www-src/index.html'), os.path.join(out, 'index.html'), '--native'])
    for f in ('manifest.webmanifest', 'sw.js', 'qr-scan.js', 'qr-gen.js'): shutil.copyfile(os.path.join(root, 'www-src', f), os.path.join(out, f))
    # the offline cache name follows the content, so every change reaches users automatically
    import hashlib, re
    h = hashlib.sha256()
    for f in ('index.html', 'qr-scan.js', 'qr-gen.js', 'manifest.webmanifest'): h.update(open(os.path.join(out, f), 'rb').read())
    sp = os.path.join(out, 'sw.js'); sw = open(sp, encoding='utf-8').read()
    open(sp, 'w', encoding='utf-8').write(re.sub(r"const V='[^']*'", "const V='mp-" + h.hexdigest()[:10] + "'", sw, count=1))
    shutil.rmtree(os.path.join(out, 'icons'), ignore_errors=True); shutil.copytree(os.path.join(root, 'www-src/icons'), os.path.join(out, 'icons'))
    try: os.remove(os.path.join(out, 'index.html.csp'))
    except OSError: pass
print('Built www/ and desktop/www/')

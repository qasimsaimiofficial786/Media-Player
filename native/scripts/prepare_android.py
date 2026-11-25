#!/usr/bin/env python3
"""Run once after `npx cap add android`: copies the MediaStore plugin in and adds the permissions."""
import re, shutil, os, sys
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = os.path.join(root, 'android-overlay'); dst = os.path.join(root, 'android')
if not os.path.isdir(dst): sys.exit('Run "npx cap add android" first')
for d, _, files in os.walk(src):
    for f in files:
        s = os.path.join(d, f); t = os.path.join(dst, os.path.relpath(s, src))
        os.makedirs(os.path.dirname(t), exist_ok=True); shutil.copyfile(s, t)
mf = os.path.join(dst, 'app/src/main/AndroidManifest.xml'); x = open(mf, encoding='utf-8').read()
perms = ('    <uses-permission android:name="android.permission.READ_MEDIA_AUDIO" />\n'
         '    <uses-permission android:name="android.permission.READ_MEDIA_VIDEO" />\n'
         '    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />\n')
if 'READ_MEDIA_AUDIO' not in x: x = x.replace('</manifest>', perms + '</manifest>')
if 'networkSecurityConfig' not in x: x = x.replace('<application', '<application android:networkSecurityConfig="@xml/network_security_config"', 1)
open(mf, 'w', encoding='utf-8').write(x)
print('Android project prepared: MediaLibrary plugin, permissions and network config added.')

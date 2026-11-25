PROFESSIONAL MEDIA PLAYER - PWA PACKAGE
=======================================
Files: index.html (the app), qr-scan.js and qr-gen.js (QR libraries, loaded when needed), manifest.webmanifest, sw.js (offline), icons/, tools/

1. HOST IT (PWAs need HTTPS; localhost works for testing)
   - Netlify: drag this whole folder onto app.netlify.com/drop
   - Vercel:  run "vercel" inside this folder (or import it as a static project)
   - GitHub Pages: push the folder, enable Pages
   - Quick local test: python3 -m http.server 8000  ->  http://localhost:8000

2. INSTALL
   - Every browser tab shows an Install button (download arrow) at the top of the app, and Settings has an Install app row. It installs with one tap where the browser allows it and otherwise shows the exact steps for the device in use. The link ending in ?install=1 opens that guide directly, so you can share it.
   - To also offer the Android app or desktop installers, put them in downloads/ and list them in downloads/index.json (see downloads/README.txt).
   - Android (Chrome): menu -> Install app. Opens full screen with its own icon.
   - iPhone/iPad (Safari): Share -> Add to Home Screen.
   - Windows/macOS/Linux (Chrome or Edge): install icon in the address bar.
   After the first visit the app starts offline.

3. FINDING YOUR MEDIA
   Browsers and installed web apps cannot scan a phone or PC on their own.
   What this app does instead:
   - Settings -> Library folders -> Add folder (Chrome/Edge, installed or in its own tab).
     The folder is remembered and re-scanned every time the app opens.
   - Installed on desktop Chrome/Edge: right-click a song or video -> Open with -> Media Player.
   - Android: in any app choose Share -> Media Player to send audio or video files straight in.
   - Add files or drag and drop anywhere (all browsers). Files are linked or copied locally.
   To list every file on an Android phone automatically you need a native wrapper
   (for example Capacitor with a MediaStore plugin) around this same app.

Your files never leave your device.

VAULT, SHARING AND TRANSFER
- Vault: files are encrypted on the device with AES-256 (key protected by your PIN). Keep the recovery code safe.
- Share files (like SHAREit / MX Share / PLAYit): Home -> Share files -> Send or Receive. Connect by scanning a QR code on the other device (or paste the code / open the shared link). Files go straight from device to device.
- Invite friends: Home -> Invite shares the hosted link of this app.


WIDGETS AND SHORTCUTS
- Windows 11 (Microsoft Edge): install the app, open the Widgets board, press +, and add "Continue", "Recently played" or "Quick actions". These come from the manifest "widgets" list and widgets/*.json templates. The service worker (sw.js) reads your library on this device to fill them, and buttons control the app.
- Android and iOS do not let web apps create home-screen widgets. Press and hold the app icon for shortcuts (Continue, Shuffle, Videos, Music, Share) and use the lock-screen player controls.
- Inside the app, Home has its own widgets: Settings > Theme and colours is not needed, press "Customize Home" at the bottom of Home.
- Widgets only ever show items from your normal library, never from the Vault.


SECURITY
- index.html carries a strict Content-Security-Policy (only this app's own scripts may run, no outside connections except the optional 6-digit-code relay ntfy.sh and Google Fonts). Every inline script is listed by hash, so if you edit the code inside index.html the browser will block it. Rebuild the hashes after changes.
- The files _headers (Netlify, Cloudflare Pages), vercel.json (Vercel), nginx-security.conf and .htaccess add the same policy as real HTTP headers plus HSTS, no-framing, no-sniffing, no-referrer and a restrictive Permissions-Policy. Use the one that matches your host. Serve everything over https.
- Receiving files needs the user's approval; the Vault uses AES-256-GCM with a key stretched with PBKDF2 (600,000 rounds); Settings > Security and privacy shows the status and has Safe mode and Erase all app data.


MORE PROTECTION (APP LOCK, CHECKUP, SAFER SHARING)
- Settings > Security and privacy has an app lock (PIN or password with a long key stretch and growing waits after 5 wrong tries), a Security checkup with one-tap fixes, Safe mode, Erase all app data and a default sharing route (Same Wi-Fi only hides your public address).
- New PINs that are easy to guess (1234, 0000, 1111, counting up or down) are refused, and PINs under 6 digits ask for confirmation.
- Received files need approval, are size-limited, must be media, subtitles or lyrics, and big transfers are held in disk-backed pieces rather than in memory.
- The page refuses to be shown inside another site. Replace the contact in .well-known/security.txt with your own address before hosting.


NEW IN THIS VERSION (round 31)
- Laptop / PC gestures: scroll = volume (video, and music over the volume bar or mini player), Alt+scroll = brightness (can go above 100% to brighten dark videos), Shift or sideways scroll = seek, Ctrl+scroll or pinch = zoom, scroll over the seek bar = skip. Press-and-drag on the video also works. Browsers cannot change real screen brightness, so brightness works on the picture inside the app.
- Right-click menus for videos, files and folders.
- Quick actions: Ctrl+K (or the keyboard button at the top) searches every command, song, video, folder and playlist.
- Customize shortcuts: Settings > Keyboard > Customize. Clashes are flagged; browser-reserved keys are refused.
- Folders: Ctrl+Z / Ctrl+Shift+Z undo and redo, sorting and drag-to-reorder, Ctrl/Shift+click selection, Copy folder to, Merge into, Pin, Save as playlist, Add a playlist, recent folders in the picker, "In folders" in the info window.
- Security: Trusted Types (all generated markup is filtered), safer JSON, dialog text escaped (a hole where file titles and a sending device's name were inserted as raw markup is closed), hidden text-direction characters removed, setting values validated, commands and ids whitelisted, folder/backup/library rate limits, stronger headers.

ROUND 33 FIXES
- Vault, app lock and recovery PIN/password setup: one dialog with two boxes. Mistakes (empty, too short, letters in a PIN, boxes not matching, easy PINs like 1234) are explained in the dialog and nothing restarts. Urdu / Arabic digits are accepted in PINs. Setting an app lock no longer changes the Vault's PIN type.
- Folder names: hidden or control characters removed; an empty name now says so instead of silently doing nothing.

AFTER YOU EDIT index.html
Run:  python3 tools/rebuild-csp.py
It re-hashes every inline script and updates index.html, _headers, vercel.json, nginx-security.conf and .htaccess.
Bump the version in sw.js (const V='mp-v26', raise it by one each time) so installed copies update.

DEVICE MEDIA (native apps)
The browser version cannot scan a phone or PC. The separate "media-player-26-native.zip" wraps this same app as an Android app and as a Windows/macOS/Linux program that find music and videos by themselves. See README_NATIVE.md inside it.


MAINTENANCE TOOLS
- python3 tools/rebuild-csp.py   Run after any edit. Re-hashes every inline script into the security policy of index.html and all header files, and renames the offline cache in sw.js from the files it holds, so users always receive the new files.
- node tools/smoke-test.js some-song.mp3   Needs Node and Playwright. Opens the app and checks start-up, blocked scripts, file import, playback, the on-demand QR libraries and the offline cache.

# Media Player — native apps (finds your music and videos automatically)

A browser app is not allowed to look through a phone or computer on its own. These two small "shells" put the same Media Player inside a real app that is allowed to:

| Platform | What it uses | What you get |
|---|---|---|
| **Android** | Capacitor + a MediaStore plugin (`android-overlay/…/MediaLibraryPlugin.java`) | On first start it asks Android for permission to see audio and video, lists **every song and video on the phone and SD card**, reads title/artist/album/length/folder, shows thumbnails, updates when files change, and plays them from where they are (nothing is copied). |
| **Windows / macOS / Linux** | Electron (`desktop/`) | Scans your **Music** and **Videos** folders at start, lets you add more folders, watches them for changes, and plays files from where they are. |

Inside the app: **Settings → Device media** (Scan now, automatic scan on/off, add/remove folders on desktop, show hidden files again). Folders found on the device also appear under *Music → By folder* and *Videos → By folder*. Files you remove from the library stay hidden until you choose "Show".

## Easiest way: build in the cloud (no software to install)
1. Create a free GitHub account, make a new repository and upload everything in this folder.
2. Open the **Actions** tab.
   - **Build Android APK** → Run workflow → download `MediaPlayer-debug-apk` → send it to your phone and install (allow "install unknown apps").
   - **Build desktop installers** → Run workflow → download the installer for your system.
3. Done. The workflows are in `.github/workflows/`.

## Build on your own computer
Android (needs Node 20, Java 21 and Android Studio's SDK): `npm install`, then `npm run build:web`, `npm run android:prepare`, `npm run android:apk`. The APK is in `android/app/build/outputs/apk/debug/`.
Desktop: `python3 scripts/build_web.py`, then in `desktop/`: `npm install`, `npm start` (try it) or `npm run dist` (installer).

## Honest notes
- **Not yet compiled by me.** I could not run Android's or Electron's build tools in my workspace. The web side (scan, import, playback from a device address, rescan, thumbnails, hidden files, settings) was tested in a real browser with a simulated device. The Java and Electron files were written carefully against the official docs and syntax-checked (Electron files), but the first cloud build is the real test. If a build fails, send me the log and I will fix it.
- The APK is a **debug** build for your own use. For Google Play you need a signed release build and Play's media-permission declaration.
- Android 13+ asks for "Music and audio" and "Photos and videos" access; older versions ask for "Files and media".
- Music keeps playing with the screen off in most cases, but Android can stop a web view in the background. A background-playback service would be the next step.
- Desktop titles/artist/art come from the file tags (read from the start of each file) and the file name.

## Security in the native apps
- The page keeps its strict Content-Security-Policy and Trusted Types; the only additions are `127.0.0.1` (Android's on-device media server) and `mpmedia:` (desktop).
- Android media server: listens on 127.0.0.1 only, random 128-bit token per run, checks the `Host` header (blocks DNS-rebinding), GET/HEAD only, numeric ids only, CORS limited to the app's own origin, cleartext allowed only for 127.0.0.1.
- Desktop: `contextIsolation`, sandbox, no Node in the page, only 3 scan functions exposed, files served by number from the scanner's own list (never by path), external links open in the browser, navigation locked to the app.
- Everything coming from the native side is validated and cleaned again by the web app (types, lengths, hidden characters).

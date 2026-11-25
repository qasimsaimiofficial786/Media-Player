MEDIA PLAYER - ONE PACKAGE FOR EVERY DEVICE
===========================================

WHAT PEOPLE GET
- Everyone: open your web address, press the Install button (download arrow) at the top. The app installs and works offline on Android, iPhone and iPad, Windows, Mac, Linux and Chromebook.
- The web install shows no security warning on any device, because it is not a downloaded file. This is what the public sees.
- Real app files (.apk, .exe, .dmg, AppImage) are built too and kept on your repository's Releases page for your own use. They are NOT shown to the public by default, because Windows, Mac and Android warn about any app file that is not signed with a paid developer certificate, however safe it is.

PUBLISH - BEST WAY (GitHub, free, everything automatic)
1. Make a free GitHub account and a new public repository.
2. Upload everything from this zip (keep the folders, including the hidden .github folder). Branch name: main.
3. In the repository open Settings > Pages and set Source to "GitHub Actions".
4. Open the Actions tab and wait for "Publish Media Player" to finish.
5. Your app is at https://YOUR-NAME.github.io/YOUR-REPOSITORY/ . Share that address. Done.

PUBLISH - SIMPLE WAY (Netlify, Vercel or any web host)
Upload the files at the top level of this zip (index.html, sw.js, manifest.webmanifest, icons, widgets, qr-*.js, the header files) and ignore the native and .github folders. Everyone can still install it from the browser. Real app installers need the GitHub way above.

BEFORE GOING PUBLIC
- Replace the contact in .well-known/security.txt.
- After any edit run:  python3 tools/rebuild-csp.py   (updates security hashes and the offline cache name)  then  node tools/smoke-test.js some-song.mp3

WANT THE APP FILES ON THE PUBLIC INSTALL DIALOG TOO?
Settings > Secrets and variables > Actions > Variables > New variable: SHOW_INSTALLERS = true, then run the workflow again. To remove the system warnings for those files you need code signing (Windows certificate, Apple Developer account) or a store listing (Google Play, Microsoft Store, App Store). The web install needs none of that.

NOTES
- iPhone and iPad have no installer file outside the App Store, so the web install (Share > Add to Home Screen) is the way, and it works fully.
- The Android and desktop builds compile on GitHub for the first time on your first run. If one fails, the website still publishes; send me the log of the failed step and I will fix it.

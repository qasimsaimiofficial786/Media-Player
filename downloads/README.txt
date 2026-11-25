DOWNLOADS FOLDER (optional)
Put the installers you want to offer here and list them in index.json. The Install dialog of the app then shows a download button for each one on every device.

Example index.json:
[
  {"file": "media-player.apk", "label": "Android app (APK)"},
  {"file": "media-player-setup.exe", "label": "Windows installer"},
  {"file": "media-player.dmg", "label": "Mac app"}
]
File names may contain letters, digits, dots, dashes and underscores only. Leave the list empty ([]) to offer the browser install only.

# Media Player Complete

This repository contains a simple static media player website with a lightweight Node.js backend that serves the files and provides a download endpoint.

## Prerequisites
- **Node.js** (v14 or newer) installed on the target machine. You can download it from https://nodejs.org/.
- No additional npm packages are required – the server uses only built‑in Node modules (`http`, `fs`, `path`).

## How to run locally
```powershell
# In the project root (d:\Download\Media-Player-Complete)
node server.js
```
The server will start on port **8080** (or the port defined in the `PORT` environment variable).
Open a browser and visit:
```
http://localhost:8080
```
You should see the `index.html` page.

## Download any file
The backend exposes a download endpoint:
```
http://localhost:8080/download/<filename>
```
Replace `<filename>` with the exact name of a file in the project root (e.g., `index.html`). The file will be served as an attachment for easy downloading on any device.

## Packaging for distribution
To distribute the whole application to other devices, simply zip the folder:
```powershell
Compress-Archive -Path . -DestinationPath MediaPlayerComplete.zip
```
Send the `MediaPlayerComplete.zip` file to the target device, unzip it, install Node.js if not already present, and run `node server.js` as described above.

## Project structure
```
Media-Player-Complete/
├─ index.html            # main page (already in repo)
├─ server.js            # lightweight Node.js server
├─ README.md            # this file
└─ (other static assets like .png, .js, etc.)
```

Feel free to modify `server.js` to add more routes or integrate a database if you need advanced features.


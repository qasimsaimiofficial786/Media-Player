'use strict';
const { contextBridge, ipcRenderer } = require('electron');
// The only things the web app can ask the shell to do. Files are served by number through mpmedia://, never by path.
contextBridge.exposeInMainWorld('mpDesktop', {
  scan: () => ipcRenderer.invoke('mp:scan'),
  folders: () => ipcRenderer.invoke('mp:folders'),
  addFolder: () => ipcRenderer.invoke('mp:addFolder'),
  removeFolder: p => ipcRenderer.invoke('mp:removeFolder', String(p)),
  onChange: cb => { ipcRenderer.on('mp:changed', () => cb()); }
});

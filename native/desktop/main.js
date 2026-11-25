'use strict';
// Media Player desktop shell. Finds music and videos in Music, Videos and any folder you add,
// keeps the list fresh, and serves files to the app through a private mpmedia:// address.
const { app, BrowserWindow, protocol, net, dialog, ipcMain, shell, session } = require('electron');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');

const WWW = path.join(__dirname, 'www');
const AUDIO = new Set(['.mp3', '.m4a', '.aac', '.wav', '.flac', '.ogg', '.oga', '.opus', '.wma', '.mka', '.aiff', '.aif']);
const VIDEO = new Set(['.mp4', '.m4v', '.mkv', '.webm', '.mov', '.avi', '.3gp', '.mpg', '.mpeg', '.ts']);
const MIME = { '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4', '.aac': 'audio/aac', '.wav': 'audio/wav', '.flac': 'audio/flac', '.ogg': 'audio/ogg', '.oga': 'audio/ogg', '.opus': 'audio/ogg', '.mka': 'audio/x-matroska', '.mp4': 'video/mp4', '.m4v': 'video/mp4', '.mkv': 'video/x-matroska', '.webm': 'video/webm', '.mov': 'video/quicktime', '.mpg': 'video/mpeg', '.mpeg': 'video/mpeg' };
const MAX_FILES = 60000, MAX_DEPTH = 12;

protocol.registerSchemesAsPrivileged([
  { scheme: 'mpapp', privileges: { standard: true, secure: true, supportFetchAPI: true } },
  { scheme: 'mpmedia', privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true } }
]);

let win = null;
const registry = new Map();            // id -> absolute file path (only files found by the scanner can ever be served)
let cfg = { folders: [], ids: {}, next: 1 };
const cfgPath = () => path.join(app.getPath('userData'), 'library.json');
function loadCfg() { try { const j = JSON.parse(fs.readFileSync(cfgPath(), 'utf8')); if (j && Array.isArray(j.folders)) cfg = { folders: j.folders.filter(f => typeof f === 'string').slice(0, 50), ids: j.ids && typeof j.ids === 'object' ? j.ids : {}, next: Number(j.next) || 1 }; } catch (e) { /* first run */ } }
function saveCfg() { try { fs.writeFileSync(cfgPath(), JSON.stringify(cfg)); } catch (e) { /* ignore */ } }
const roots = () => { const r = []; for (const k of ['music', 'videos']) { try { r.push(app.getPath(k)); } catch (e) { /* missing */ } } return [...new Set([...r, ...cfg.folders])]; };
const idFor = p => { const k = process.platform === 'win32' ? p.toLowerCase() : p; if (!cfg.ids[k]) cfg.ids[k] = cfg.next++; return cfg.ids[k]; };

async function walk(root, out, counts) {
  const stack = [[root, 0]];
  while (stack.length && out.length < MAX_FILES) {
    const [dir, depth] = stack.pop();
    let d; try { d = await fs.promises.opendir(dir); } catch (e) { continue; }
    for await (const ent of d) {
      if (ent.name.startsWith('.') || ent.isSymbolicLink()) continue;
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) { if (depth < MAX_DEPTH) stack.push([full, depth + 1]); continue; }
      if (!ent.isFile()) continue;
      const ext = path.extname(ent.name).toLowerCase();
      const kind = AUDIO.has(ext) ? 'audio' : VIDEO.has(ext) ? 'video' : null;
      if (!kind) continue;
      let st; try { st = await fs.promises.stat(full); } catch (e) { continue; }
      if (!st.size) continue;
      const nid = idFor(full); registry.set(nid, { path: full, kind, ext });
      const rel = path.relative(root, dir).split(path.sep).filter(Boolean);
      out.push({ nid, kind, name: ent.name, title: path.basename(ent.name, ext).replace(/_+/g, ' '), size: st.size, added: Math.round(st.birthtimeMs || st.mtimeMs), mime: MIME[ext] || '', dir: [path.basename(root) || root].concat(rel).join('/') });
      counts[root] = (counts[root] || 0) + 1;
    }
  }
}
let lastCounts = {};
async function scan() {
  registry.clear(); const out = [], counts = {};
  for (const r of roots()) { if (fs.existsSync(r)) await walk(r, out, counts); }
  lastCounts = counts; saveCfg();
  return { ok: true, complete: out.length < MAX_FILES, items: out };
}
const folderList = () => roots().map(p => ({ path: p, count: lastCounts[p] || 0, builtin: !cfg.folders.includes(p) }));

// ---- watch folders and tell the app when something changes ----
let watchers = [], debounce = null;
function watch() {
  watchers.forEach(w => { try { w.close(); } catch (e) { /* ignore */ } }); watchers = [];
  for (const r of roots()) { try { if (!fs.existsSync(r)) continue; watchers.push(fs.watch(r, { recursive: process.platform !== 'linux' }, () => { clearTimeout(debounce); debounce = setTimeout(() => { if (win && !win.isDestroyed()) win.webContents.send('mp:changed'); }, 2500); })); } catch (e) { /* not supported here */ } }
}

// ---- protocols ----
function serveApp(req) {
  const u = new URL(req.url); let rel = decodeURIComponent(u.pathname); if (rel === '/' || rel === '') rel = '/index.html';
  const full = path.normalize(path.join(WWW, rel)); const within = path.relative(WWW, full);
  if (within.startsWith('..') || path.isAbsolute(within)) return new Response('Forbidden', { status: 403 });
  return net.fetch(pathToFileURL(full).toString());
}
function serveMedia(req) {
  const m = /^mpmedia:\/\/m\/(audio|video)\/(\d{1,9})\/?$/.exec(req.url);
  if (!m) return new Response('Not found', { status: 404 });
  const e = registry.get(Number(m[2]));
  if (!e || e.kind !== m[1]) return new Response('Not found', { status: 404 });
  const headers = {}; const r = req.headers.get('range'); if (r) headers.range = r;
  return net.fetch(pathToFileURL(e.path).toString(), { headers, method: req.method === 'HEAD' ? 'HEAD' : 'GET' });
}

function createWindow() {
  win = new BrowserWindow({ width: 1280, height: 820, minWidth: 900, minHeight: 600, backgroundColor: '#f6eee7', autoHideMenuBar: true,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true, webSecurity: true, spellcheck: false } });
  win.webContents.setWindowOpenHandler(({ url }) => { if (/^https:\/\//i.test(url)) shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.on('will-navigate', (e, url) => { if (!/^mpapp:\/\//.test(url)) e.preventDefault(); });
  win.loadURL('mpapp://app/index.html');
}

app.whenReady().then(() => {
  loadCfg();
  protocol.handle('mpapp', serveApp); protocol.handle('mpmedia', serveMedia);
  session.defaultSession.setPermissionRequestHandler((wc, perm, cb) => cb(['fullscreen', 'media'].includes(perm) && wc.getURL().startsWith('mpapp://')));
  ipcMain.handle('mp:scan', () => scan());
  ipcMain.handle('mp:folders', () => folderList());
  ipcMain.handle('mp:addFolder', async () => { const r = await dialog.showOpenDialog(win, { properties: ['openDirectory'] }); if (!r.canceled && r.filePaths[0] && !roots().includes(r.filePaths[0]) && cfg.folders.length < 50) { cfg.folders.push(r.filePaths[0]); saveCfg(); watch(); } return true; });
  ipcMain.handle('mp:removeFolder', (e, p) => { if (typeof p === 'string') { cfg.folders = cfg.folders.filter(f => f !== p); saveCfg(); watch(); } return true; });
  createWindow(); watch();
  app.on('activate', () => { if (!BrowserWindow.getAllWindows().length) createWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

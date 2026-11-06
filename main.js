'use strict';
const { app, BrowserWindow, protocol, net, dialog, shell, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');

// The portable launcher supplies this variable even though it extracts the app
// to a temporary directory. Keep the Chromium profile alongside the launcher.
const portableDir = process.env.PORTABLE_EXECUTABLE_DIR || (app.isPackaged ? path.dirname(process.execPath) : __dirname);
const dataDir = path.join(portableDir, 'GIP-Panel-Data');
try {
  fs.mkdirSync(dataDir, { recursive: true });
  fs.accessSync(dataDir, fs.constants.W_OK);
  app.setPath('userData', dataDir);
} catch (error) {
  dialog.showErrorBox('Панель ГИП', `Не удалось открыть папку данных:\n${dataDir}\n\nПереместите программу в папку с правом записи.\n${error.message}`);
  app.exit(1);
}

protocol.registerSchemesAsPrivileged([{ scheme: 'gip', privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true } }]);
const onlyInstance = app.requestSingleInstanceLock();
if (!onlyInstance) app.quit();
let window;
app.on('second-instance', () => { if (window) { if (window.isMinimized()) window.restore(); window.focus(); } });
app.whenReady().then(() => {
  const files = {
    '/index.html': 'index.html',
    '/vendor/mammoth.browser.min.js': 'vendor/mammoth.browser.min.js',
    '/vendor/jszip.min.js': 'vendor/jszip.min.js',
    '/vendor/pdf.min.js': 'vendor/pdf.min.js',
    '/vendor/pdf.worker.min.js': 'vendor/pdf.worker.min.js',
    '/vendor/docx-templates.browser.js': 'vendor/docx-templates.browser.js'
  };
  protocol.handle('gip', request => {
    const url = new URL(request.url);
    const file = url.host === 'app' && files[url.pathname];
    return file ? net.fetch(pathToFileURL(path.join(__dirname, 'app', file)).href) : new Response('Not found', { status: 404 });
  });
  ipcMain.handle('pick-folder', async () => { const result = await dialog.showOpenDialog(window, { properties: ['openDirectory'] }); if (result.canceled || !result.filePaths[0]) return null; const entries = await fs.promises.readdir(result.filePaths[0], { withFileTypes: true }); return entries.filter(e => e.isFile()).map(e => e.name); });
  window = new BrowserWindow({ width: 1360, height: 880, minWidth: 900, minHeight: 600, title: 'Панель ГИП', webPreferences: { nodeIntegration: false, contextIsolation: true, sandbox: true, preload: path.join(__dirname, 'preload.js') } });
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  window.webContents.on('will-navigate', (event, url) => { if (!url.startsWith('gip://app/')) event.preventDefault(); });
  window.loadURL('gip://app/index.html');
});
app.on('window-all-closed', () => app.quit());

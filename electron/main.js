import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import Store from 'electron-store';
import { NexusAPI } from './api/nexusMods.js';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;
const store = new Store({ name: 'seamless-mod-swiper' });

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    backgroundColor: '#0a0a0a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  const devServerUrl = process.env.VITE_DEV_SERVER_URL;
  if (devServerUrl) {
    mainWindow.loadURL(devServerUrl);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(process.cwd(), 'dist/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Settings / Store IPC
ipcMain.handle('store:get', (_e, key) => store.get(key));
ipcMain.handle('store:set', (_e, key, value) => store.set(key, value));
ipcMain.handle('store:delete', (_e, key) => store.delete(key));

ipcMain.handle('shell:openExternal', (_e, url) => shell.openExternal(url));

// Export helpers
ipcMain.handle('export:saveFile', async (_e, { defaultPath, filters, content }) => {
  const { filePath, canceled } = await dialog.showSaveDialog(mainWindow, {
    defaultPath,
    filters
  });
  if (!canceled && filePath) {
    const fs = require('fs');
    fs.writeFileSync(filePath, content, 'utf-8');
    return { saved: true, filePath };
  }
  return { saved: false };
});

// Nexus API IPC
const nexus = new NexusAPI({
  getApiKey: () => store.get('nexus.apiKey') || ''
});

ipcMain.handle('nexus:setApiKey', (_e, key) => {
  store.set('nexus.apiKey', key);
  return true;
});
ipcMain.handle('nexus:getApiKey', () => store.get('nexus.apiKey') || '');

ipcMain.handle('nexus:fetchLatestMods', async (_e, { page = 1, size = 100 } = {}) => {
  return await nexus.fetchLatestMods({ page, size });
});

ipcMain.handle('nexus:getModDetails', async (_e, id) => {
  return await nexus.getModDetails(id);
});

ipcMain.handle('nexus:getChangelogs', async (_e, id) => {
  return await nexus.getChangelogs(id);
});

ipcMain.handle('nexus:scrapeComments', async (_e, id, { limit = 40 } = {}) => {
  return await nexus.scrapeComments(id, { limit });
});

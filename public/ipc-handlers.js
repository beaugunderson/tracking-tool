const { ipcMain, dialog, clipboard, shell, app, BrowserWindow } = require('electron');
const ElectronStore = require('electron-store');
const DataStore = require('nedb');
const fs = require('fs');
const os = require('os');
const path = require('path');
const log = require('electron-log');
const reportingService = require('./reporting-service');

const store = new ElectronStore();

let encountersDb = null;
let fixesDb = null;

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// --- App info ---

ipcMain.handle('app:getVersion', () => app.getVersion());
ipcMain.handle('app:getAppPath', () => app.getAppPath());
ipcMain.handle('app:getOsName', () => `${os.type()} ${os.release()}`);
ipcMain.handle('app:getStorePath', () => store.path);

// --- Config ---

ipcMain.handle('config:get', (_event, key) => store.get(key));
ipcMain.handle('config:set', (_event, key, value) => store.set(key, value));

// --- Filesystem ---

ipcMain.handle('fs:exists', (_event, filePath) => fs.existsSync(filePath));
ipcMain.handle('fs:mkdir', (_event, dirPath) => fs.mkdirSync(dirPath));
ipcMain.handle('fs:copyFile', (_event, src, dest) => fs.copyFileSync(src, dest));

// --- Path ---

ipcMain.handle('path:join', (_event, ...segments) => path.join(...segments));

// --- Dialog ---

ipcMain.handle('dialog:showOpen', async (event, options) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  return dialog.showOpenDialog(win, options);
});

// --- Clipboard ---

ipcMain.handle('clipboard:write', (_event, text) => clipboard.writeText(text));

// --- Database ---

ipcMain.handle('db:open', async (_event, username) => {
  const rootPath = store.get('root-path');
  const filename = path.join(rootPath, username, 'encounters.json');

  log.debug(`db:open: opening "${filename}"`);

  encountersDb = reportingService.openDataStore(filename);
  await reportingService.applyMigrations(encountersDb);

  log.debug('db:open: migrations complete');
});

ipcMain.handle('db:search', async (_event, params) => {
  if (!encountersDb) throw new Error('Database not opened');

  const { encounterType, patientNamePattern, encounterDate } = params;
  const criteria = { encounterType: { $exists: true } };

  if (encounterType && encounterType !== 'All') {
    criteria.encounterType = encounterType.toLowerCase();
  }

  if (patientNamePattern) {
    criteria.patientName = new RegExp(escapeRegExp(patientNamePattern), 'i');
  }

  if (encounterDate) {
    criteria.encounterDate = encounterDate;
  }

  return new Promise((resolve, reject) => {
    encountersDb.find(criteria).exec((err, docs) => {
      if (err) reject(err);
      else resolve(docs);
    });
  });
});

ipcMain.handle('db:findAll', async () => {
  if (!encountersDb) throw new Error('Database not opened');

  return new Promise((resolve, reject) => {
    encountersDb.find({}, (err, docs) => {
      if (err) reject(err);
      else resolve(docs);
    });
  });
});

ipcMain.handle('db:insert', async (_event, doc) => {
  if (!encountersDb) throw new Error('Database not opened');

  return new Promise((resolve, reject) => {
    encountersDb.insert(doc, (err, newDoc) => {
      if (err) reject(err);
      else resolve(newDoc);
    });
  });
});

ipcMain.handle('db:update', async (_event, query, doc) => {
  if (!encountersDb) throw new Error('Database not opened');

  return new Promise((resolve, reject) => {
    encountersDb.update(query, doc, {}, (err, numberOfUpdated) => {
      if (err) reject(err);
      else resolve(numberOfUpdated);
    });
  });
});

ipcMain.handle('db:remove', async (_event, query) => {
  if (!encountersDb) throw new Error('Database not opened');

  return new Promise((resolve, reject) => {
    encountersDb.remove(query, {}, (err, numberOfRemoved) => {
      if (err) reject(err);
      else resolve(numberOfRemoved);
    });
  });
});

// --- Fixes ---

ipcMain.handle('fixes:open', async () => {
  const rootPath = store.get('root-path');
  const fixesDir = path.join(rootPath, 'fixes');
  const backupDir = path.join(fixesDir, 'backups');
  const fixesFile = path.join(fixesDir, 'fixes.json');

  if (!fs.existsSync(fixesDir)) fs.mkdirSync(fixesDir);
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir);
  if (fs.existsSync(fixesFile)) {
    fs.copyFileSync(fixesFile, path.join(backupDir, `${Date.now()}.json`));
  }

  fixesDb = new DataStore({
    autoload: true,
    compareStrings: (a, b) => a.toLowerCase().localeCompare(b.toLowerCase()),
    filename: fixesFile,
    timestampData: true,
  });
});

ipcMain.handle('fixes:insert', async (_event, doc) => {
  if (!fixesDb) throw new Error('Fixes database not opened');

  return new Promise((resolve, reject) => {
    fixesDb.insert(doc, (err, newDoc) => {
      if (err) reject(err);
      else resolve(newDoc);
    });
  });
});

ipcMain.handle('fixes:getAll', async () => {
  const rootPath = store.get('root-path');
  const fixesFile = path.join(rootPath, 'fixes', 'fixes.json');

  if (!fs.existsSync(fixesFile)) return [];

  // Use fixesDb if already open, otherwise open a temporary instance
  if (fixesDb) {
    return new Promise((resolve, reject) => {
      fixesDb
        .find({})
        .sort({ createdAt: 1 })
        .exec((err, docs) => {
          if (err) reject(err);
          else resolve(docs);
        });
    });
  }

  return reportingService.getFixes(fixesFile);
});

// --- Reporting ---

ipcMain.handle('reporting:transform', async (_event, options) => {
  const rootPath = store.get('root-path');
  return reportingService.transform({ ...options, rootPath });
});

// --- Find in page ---

ipcMain.handle('find:findInPage', (event, text, options) => {
  if (text) {
    event.sender.findInPage(text, options || {});
  }
});

ipcMain.handle('find:stop', (event) => {
  event.sender.stopFindInPage('clearSelection');
});

// --- Logging ---

ipcMain.on('log:debug', (_event, ...args) => log.debug(...args));
ipcMain.on('log:error', (_event, ...args) => log.error(...args));

// --- Shell ---

ipcMain.handle('shell:openExternal', (_event, url) => shell.openExternal(url));

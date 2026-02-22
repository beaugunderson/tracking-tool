import ElectronStore from 'electron-store';
import DataStore from '@seald-io/nedb';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import log from 'electron-log';
import { ipcMain, dialog, clipboard, shell, app, BrowserWindow } from 'electron';

import * as reportingService from './reporting-service';

const store = new ElectronStore();

let encountersDb: DataStore | null = null;
let fixesDb: DataStore | null = null;

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// --- App info ---

ipcMain.handle('app:getVersion', () => app.getVersion());
ipcMain.handle('app:getAppPath', () => app.getAppPath());
ipcMain.handle('app:getOsName', () => `${os.type()} ${os.release()}`);
ipcMain.handle('app:getStorePath', () => store.path);

// --- Config ---

ipcMain.handle('config:get', (_event, key: string) => store.get(key));
ipcMain.handle('config:set', (_event, key: string, value: unknown) => store.set(key, value));

// --- Filesystem ---

ipcMain.handle('fs:exists', (_event, filePath: string) => fs.existsSync(filePath));
ipcMain.handle('fs:mkdir', (_event, dirPath: string) => fs.mkdirSync(dirPath));
ipcMain.handle('fs:copyFile', (_event, src: string, dest: string) => fs.copyFileSync(src, dest));

// --- Path ---

ipcMain.handle('path:join', (_event, ...segments: string[]) => path.join(...segments));

// --- Dialog ---

ipcMain.handle('dialog:showOpen', async (event, options: Electron.OpenDialogOptions) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  return dialog.showOpenDialog(win!, options);
});

// --- Clipboard ---

ipcMain.handle('clipboard:write', (_event, text: string) => clipboard.writeText(text));

// --- Database ---

ipcMain.handle('db:open', async (_event, username: string) => {
  const rootPath = store.get('root-path') as string;
  const filename = path.join(rootPath, username, 'encounters.json');

  log.debug(`db:open: opening "${filename}"`);

  encountersDb = reportingService.openDataStore(filename);
  await reportingService.applyMigrations(encountersDb);

  log.debug('db:open: migrations complete');
});

ipcMain.handle('db:search', async (_event, params: {
  encounterType?: string;
  patientNamePattern?: string;
  encounterDate?: string;
}) => {
  if (!encountersDb) throw new Error('Database not opened');

  const { encounterType, patientNamePattern, encounterDate } = params;
  const criteria: Record<string, unknown> = { encounterType: { $exists: true } };

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
    encountersDb!.find(criteria).exec((err: Error | null, docs: unknown[]) => {
      if (err) reject(err);
      else resolve(docs);
    });
  });
});

ipcMain.handle('db:findAll', async () => {
  if (!encountersDb) throw new Error('Database not opened');

  return new Promise((resolve, reject) => {
    encountersDb!.find({}, (err: Error | null, docs: unknown[]) => {
      if (err) reject(err);
      else resolve(docs);
    });
  });
});

ipcMain.handle('db:insert', async (_event, doc: object) => {
  if (!encountersDb) throw new Error('Database not opened');

  return new Promise((resolve, reject) => {
    encountersDb!.insert(doc, (err: Error | null, newDoc: unknown) => {
      if (err) reject(err);
      else resolve(newDoc);
    });
  });
});

ipcMain.handle('db:update', async (_event, query: object, doc: object) => {
  if (!encountersDb) throw new Error('Database not opened');

  return new Promise((resolve, reject) => {
    encountersDb!.update(query, doc, {}, (err: Error | null, numberOfUpdated: number) => {
      if (err) reject(err);
      else resolve(numberOfUpdated);
    });
  });
});

ipcMain.handle('db:remove', async (_event, query: object) => {
  if (!encountersDb) throw new Error('Database not opened');

  return new Promise((resolve, reject) => {
    encountersDb!.remove(query, {}, (err: Error | null, numberOfRemoved: number) => {
      if (err) reject(err);
      else resolve(numberOfRemoved);
    });
  });
});

// --- Fixes ---

ipcMain.handle('fixes:open', async () => {
  const rootPath = store.get('root-path') as string;
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
    compareStrings: (a: string, b: string) => a.toLowerCase().localeCompare(b.toLowerCase()),
    filename: fixesFile,
    timestampData: true,
  });
});

ipcMain.handle('fixes:insert', async (_event, doc: object) => {
  if (!fixesDb) throw new Error('Fixes database not opened');

  return new Promise((resolve, reject) => {
    fixesDb!.insert(doc, (err: Error | null, newDoc: unknown) => {
      if (err) reject(err);
      else resolve(newDoc);
    });
  });
});

ipcMain.handle('fixes:getAll', async () => {
  const rootPath = store.get('root-path') as string;
  const fixesFile = path.join(rootPath, 'fixes', 'fixes.json');

  if (!fs.existsSync(fixesFile)) return [];

  // Use fixesDb if already open, otherwise open a temporary instance
  if (fixesDb) {
    return new Promise((resolve, reject) => {
      fixesDb!
        .find({})
        .sort({ createdAt: 1 })
        .exec((err: Error | null, docs: unknown[]) => {
          if (err) reject(err);
          else resolve(docs);
        });
    });
  }

  return reportingService.getFixes(fixesFile);
});

// --- Reporting ---

ipcMain.handle('reporting:transform', async (_event, options: { mapMrns?: boolean; fixMrns?: boolean }) => {
  const rootPath = store.get('root-path') as string;
  return reportingService.transform({ ...options, rootPath });
});

// --- Find in page ---

ipcMain.handle('find:findInPage', (event, text: string, options?: Electron.FindInPageOptions) => {
  if (text) {
    event.sender.findInPage(text, options || {});
  }
});

ipcMain.handle('find:stop', (event) => {
  event.sender.stopFindInPage('clearSelection');
});

// --- Logging ---

ipcMain.on('log:debug', (_event, ...args: unknown[]) => log.debug(...args));
ipcMain.on('log:error', (_event, ...args: unknown[]) => log.error(...args));

// --- Shell ---

ipcMain.handle('shell:openExternal', (_event, url: string) => shell.openExternal(url));

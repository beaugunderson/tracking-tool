import defaultMenu from 'electron-default-menu';
import { app, BrowserWindow, dialog, globalShortcut, Menu, shell } from 'electron';
import { join } from 'node:path';

import 'electron-context-menu';
import './ipc-handlers';

let mainWindow: BrowserWindow | null = null;
let showExitPrompt = true;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    backgroundColor: '#F7F7F7',
    minWidth: 400,
    show: false,
    title: `Tracking Tool v${app.getVersion()}`,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      preload: join(__dirname, '../preload/index.js'),
    },
    height: 860,
    width: 1280,
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(join(__dirname, '../../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow!.show();
  });

  // Forward find-in-page results to the renderer
  mainWindow.webContents.on('found-in-page', (_event, result) => {
    mainWindow!.webContents.send('find:result', result);
  });

  mainWindow.on('focus', () => {
    globalShortcut.register('CommandOrControl+F', () => {
      if (mainWindow?.webContents) {
        mainWindow.webContents.send('on-find', '');
      }
    });
  });

  mainWindow.on('blur', () => {
    globalShortcut.unregister('CommandOrControl+F');
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.on('close', async (e) => {
    if (!showExitPrompt) {
      return;
    }

    e.preventDefault();

    const response = await dialog.showMessageBox(mainWindow!, {
      type: 'question',
      buttons: ['&Yes', '&No'],
      normalizeAccessKeys: true,
      cancelId: 1,
      defaultId: 0,
      title: 'Confirm',
      message: 'Are you sure you want to quit?',
    });

    if (response.response === 0) {
      showExitPrompt = false;
      mainWindow!.close();
    }
  });
};

const generateMenu = () => {
  if (process.platform === 'darwin') {
    Menu.setApplicationMenu(Menu.buildFromTemplate(defaultMenu(app, shell)));
  } else {
    Menu.setApplicationMenu(null);
  }
};

app.on('ready', () => {
  showExitPrompt = true;

  createWindow();
  generateMenu();
});

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) {
    showExitPrompt = true;
    createWindow();
  }
});

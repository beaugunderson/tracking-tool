const isDev = require('electron-is-dev');
const path = require('path');
const { app, BrowserWindow, dialog, ipcMain, Menu, shell } = require('electron');
const defaultMenu = require('electron-default-menu');

app.allowRendererProcessReuse = true;

require('electron-context-menu')({ showSaveImageAs: true });

let mainWindow;
let showExitPrompt = true;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    backgroundColor: '#F7F7F7',
    minWidth: 400,
    show: false,
    webPreferences: {
      nodeIntegration: true,
    },
    height: 860,
    width: 1280,
  });

  mainWindow.loadURL(
    isDev ? 'http://localhost:3000' : `file://${path.join(__dirname, '../build/index.html')}`
  );

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();

    ipcMain.on('open-external-window', (event, arg) => {
      shell.openExternal(arg);
    });
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.on('close', async (e) => {
    if (!showExitPrompt) {
      return;
    }

    e.preventDefault();

    const response = await dialog.showMessageBox(mainWindow, {
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
      mainWindow.close();
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

ipcMain.on('load-page', (event, arg) => {
  mainWindow.loadURL(arg);
});

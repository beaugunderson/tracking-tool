const defaultMenu = require('electron-default-menu');
const isDev = require('electron-is-dev');
const path = require('path');
const { app, BrowserWindow, ipcMain, Menu, shell } = require('electron');

require('electron-context-menu')();

let mainWindow;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    backgroundColor: '#F7F7F7',
    minWidth: 400,
    show: false,
    webPreferences: {
      nodeIntegration: true
    },
    height: 860,
    width: 1280
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
};

const generateMenu = () => {
  if (process.platform === 'darwin') {
    Menu.setApplicationMenu(Menu.buildFromTemplate(defaultMenu(app, shell)));
  } else {
    Menu.setApplicationMenu(null);
  }
};

app.on('ready', () => {
  createWindow();
  generateMenu();
});

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

ipcMain.on('load-page', (event, arg) => {
  mainWindow.loadURL(arg);
});

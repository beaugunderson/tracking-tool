const isDev = require('electron-is-dev');
const path = require('path');
const { app, BrowserWindow, shell, ipcMain, Menu } = require('electron');

let mainWindow;

createWindow = () => {
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

  if (isDev) {
    const {
      default: installExtension,
      REACT_DEVELOPER_TOOLS
    } = require('electron-devtools-installer');

    installExtension(REACT_DEVELOPER_TOOLS)
      .then(name => {
        console.log(`Added Extension: ${name}`);
      })
      .catch(err => {
        console.log('An error occurred: ', err);
      });
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();

    ipcMain.on('open-external-window', (event, arg) => {
      shell.openExternal(arg);
    });
  });
};

generateMenu = () => {
  Menu.setApplicationMenu(null);
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

const isDev = require('electron-is-dev');
const path = require('path');
const { app, BrowserWindow, dialog, ipcMain, Menu, shell } = require('electron');
const defaultMenu = require('electron-default-menu');

require('electron-context-menu')({ showSaveImageAs: true });

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

  // if (isDev) {
  //   const {
  //     default: installExtension,
  //     REACT_DEVELOPER_TOOLS
  //   } = require('electron-devtools-installer');

  //   installExtension(REACT_DEVELOPER_TOOLS)
  //     .then(name => {
  //       console.log(`Added Extension: ${name}`);
  //     })
  //     .catch(err => {
  //       console.log(`An error occurred: ${err}`);
  //     });

  //   require('devtron').install();
  // }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();

    ipcMain.on('open-external-window', (event, arg) => {
      shell.openExternal(arg);
    });
  });

  mainWindow.on('close', e => {
    if (app.showExitPrompt) {
      e.preventDefault();

      dialog.showMessageBox(
        {
          type: 'question',
          buttons: ['Yes', 'No'],
          title: 'Confirm',
          message: 'Are you sure you want to quit?'
        },

        response => {
          if (response === 0) {
            app.showExitPrompt = false;

            mainWindow.close();
          }
        }
      );
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
  app.showExitPrompt = true;

  createWindow();
  generateMenu();
});

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) {
    app.showExitPrompt = true;

    createWindow();
  }
});

ipcMain.on('load-page', (event, arg) => {
  mainWindow.loadURL(arg);
});

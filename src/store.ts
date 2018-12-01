const Store = window.require('electron-store');
const username = window.require('username');

const electron = window.require('electron');
const fs = electron.remote.require('fs');
const path = electron.remote.require('path');

export const DEFAULT_PATH =
  'S:\\PublicWorkGroups\\Social Workers\\Staff\\Tracking tool and Instructions\\2019';

export const store = new Store();

export const rootPath = () => store.get('root-path');
export const setRootPath = (value: string) => store.set('root-path', value);

export const rootPathExists = () => rootPath() && fs.existsSync(rootPath());

export const userDirectoryPath = () => path.join(rootPath(), username.sync());

export const userDirectoryExists = () => {
  return fs.existsSync(userDirectoryPath());
};

export const backupPath = () => userFilePath('backups');

export const userFilePath = (...args: string[]) => path.join(userDirectoryPath(), ...args);

export const ensureUserDirectoryExists = () => {
  if (!userDirectoryExists()) {
    fs.mkdirSync(userDirectoryPath());
  }

  if (!fs.existsSync(backupPath())) {
    fs.mkdirSync(backupPath());
  }

  if (fs.existsSync(userFilePath('encounters.json'))) {
    fs.copyFileSync(
      userFilePath('encounters.json'),
      userFilePath('backups', `${new Date().valueOf()}.json`)
    );
  }
};

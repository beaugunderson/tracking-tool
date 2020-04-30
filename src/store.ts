const Store = window.require('electron-store');
const username = window.require('username');

const electron = window.require('electron');
const fs = electron.remote.require('fs');
const path = electron.remote.require('path');

export const DEFAULT_PATHS = [
  'S:\\PublicWorkGroups\\Social Workers\\Staff\\Tracking tool and Instructions\\2019',
  'G:\\SCI\\PublicWorkGroups\\Social Workers\\Staff\\Tracking tool and Instructions\\2019',
];

export const store = new Store();

export const rootPath = (): string => store.get('root-path');
export const setRootPath = (value: string) => store.set('root-path', value);

export const rootPathExists = (): boolean => rootPath() && fs.existsSync(rootPath());

export const userDirectoryPath = (): string => path.join(rootPath(), username.sync());
export const userDirectoryExists = (): boolean => fs.existsSync(userDirectoryPath());
export const userFilePath = (...args: string[]): string => path.join(userDirectoryPath(), ...args);
export const userBackupPath = (): string => userFilePath('backups');

export const fixesDirectoryPath = (): string => path.join(rootPath(), 'fixes');
export const fixesDirectoryExists = (): boolean => fs.existsSync(fixesDirectoryPath());
export const fixesFilePath = (...args: string[]): string =>
  path.join(fixesDirectoryPath(), ...args);
export const fixesBackupPath = (): string => fixesFilePath('backups');

export const ensureFixesDirectoryExists = () => {
  if (!fixesDirectoryExists()) {
    fs.mkdirSync(fixesDirectoryPath());
  }

  if (!fs.existsSync(fixesBackupPath())) {
    fs.mkdirSync(fixesBackupPath());
  }

  if (fs.existsSync(fixesFilePath('fixes.json'))) {
    fs.copyFileSync(
      fixesFilePath('fixes.json'),
      fixesFilePath('backups', `${new Date().valueOf()}.json`)
    );
  }
};

export const ensureUserDirectoryExists = () => {
  if (!userDirectoryExists()) {
    fs.mkdirSync(userDirectoryPath());
  }

  if (!fs.existsSync(userBackupPath())) {
    fs.mkdirSync(userBackupPath());
  }

  if (fs.existsSync(userFilePath('encounters.json'))) {
    fs.copyFileSync(
      userFilePath('encounters.json'),
      userFilePath('backups', `${new Date().valueOf()}.json`)
    );
  }
};

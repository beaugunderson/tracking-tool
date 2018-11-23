// @flow

const Store = window.require('electron-store');
const username = window.require('username');

const electron = window.require('electron');
const fs = electron.remote.require('fs');
const path = electron.remote.require('path');

export const store = new Store();

export const rootPath = () => store.get('root-path');
export const setRootPath = (value: string) => store.set('root-path', value);

export const rootPathExists = () => rootPath() && fs.existsSync(rootPath());

export const userDirectoryPath = () => path.join(rootPath(), username.sync());

export const userDirectoryExists = () => {
  return fs.existsSync(userDirectoryPath());
};

export const ensureUserDirectoryExists = () => {
  if (!userDirectoryExists()) {
    fs.mkdirSync(userDirectoryPath());
  }
};

export const userFilePath = (fileName: string) => path.join(userDirectoryPath(), fileName);

// export const readUserFile = (fileName: string) => {
//   return fs.readFileSync(userFilePath(fileName), 'utf8');
// };

// export const appendUserFile = (fileName: string, data: string) => {
//   return fs.appendFileSync(userFilePath(fileName), data, 'utf8');
// };

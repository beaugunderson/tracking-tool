const Store = window.require('electron-store');

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

export const userDirectoryPath = (name: string): string => path.join(rootPath(), name);
export const userDirectoryExists = (name: string): boolean =>
  fs.existsSync(userDirectoryPath(name));
export const userFilePath = (name: string, ...args: string[]): string =>
  path.join(userDirectoryPath(name), ...args);
export const userBackupPath = (name: string): string => userFilePath(name, 'backups');

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

export const ensureUserDirectoryExists = (
  name: string,
  // eslint-disable-next-line no-console
  statusCb = (line: string) => console.log(line)
) => {
  statusCb(`Checking that "${userDirectoryPath(name)}" exists`);
  if (!userDirectoryExists(name)) {
    statusCb(`Creating "${userDirectoryPath(name)}"`);
    fs.mkdirSync(userDirectoryPath(name));
  }

  statusCb(`Checking that "${userBackupPath(name)}" exists`);
  if (!fs.existsSync(userBackupPath(name))) {
    statusCb(`Creating "${userBackupPath(name)}"`);
    fs.mkdirSync(userBackupPath(name));
  }

  statusCb(`Checking that "${userFilePath(name, 'encounters.json')}" exists`);
  if (fs.existsSync(userFilePath(name, 'encounters.json'))) {
    const filename = `${new Date().valueOf()}.json`;

    statusCb(`Backing up encounters.json to "${filename}"`);
    fs.copyFileSync(
      userFilePath(name, 'encounters.json'),
      userFilePath(name, 'backups', filename)
    );
  }
};

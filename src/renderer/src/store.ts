export const DEFAULT_PATHS = [
  'S:\\PublicWorkGroups\\Social Workers\\Staff\\Tracking tool and Instructions\\2019',
  'G:\\SCI\\PublicWorkGroups\\Social Workers\\Staff\\Tracking tool and Instructions\\2019',
];

function pathJoin(...segments: string[]): string {
  return segments.join(window.trackingTool.pathSep);
}

// Cached root path — set once by initStore(), then synchronous reads
let cachedRootPath = '';

export async function initStore(): Promise<void> {
  cachedRootPath = (await window.trackingTool.configGet('root-path')) || '';
}

export const rootPath = (): string => cachedRootPath;

export const setRootPath = async (value: string): Promise<void> => {
  await window.trackingTool.configSet('root-path', value);
  cachedRootPath = value;
};

export const rootPathExists = (): boolean => !!cachedRootPath;

export const userDirectoryPath = (name: string): string => pathJoin(rootPath(), name);
export const userFilePath = (name: string, ...args: string[]): string =>
  pathJoin(userDirectoryPath(name), ...args);
export const userBackupPath = (name: string): string => userFilePath(name, 'backups');

export const ensureUserDirectoryExists = async (
  name: string,
  // eslint-disable-next-line no-console
  statusCb = (line: string) => console.log(line),
) => {
  statusCb(`Checking that "${userDirectoryPath(name)}" exists`);
  if (!(await window.trackingTool.fsExists(userDirectoryPath(name)))) {
    statusCb(`Creating "${userDirectoryPath(name)}"`);
    await window.trackingTool.fsMkdir(userDirectoryPath(name));
  }

  statusCb(`Checking that "${userBackupPath(name)}" exists`);
  if (!(await window.trackingTool.fsExists(userBackupPath(name)))) {
    statusCb(`Creating "${userBackupPath(name)}"`);
    await window.trackingTool.fsMkdir(userBackupPath(name));
  }

  statusCb(`Checking that "${userFilePath(name, 'encounters.json')}" exists`);
  if (await window.trackingTool.fsExists(userFilePath(name, 'encounters.json'))) {
    const filename = `${new Date().valueOf()}.json`;

    statusCb(`Backing up encounters.json to "${filename}"`);
    await window.trackingTool.fsCopyFile(
      userFilePath(name, 'encounters.json'),
      userFilePath(name, 'backups', filename),
    );
  }
};

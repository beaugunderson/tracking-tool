// Minimal mock for window.trackingTool so tests that transitively import
// modules using the Electron IPC bridge don't crash at import time.
(window as any).trackingTool = {
  username: 'testuser',
  platform: 'darwin',
  pathSep: '/',

  configGet: jest.fn().mockResolvedValue(''),
  configSet: jest.fn().mockResolvedValue(undefined),

  fsExists: jest.fn().mockResolvedValue(false),
  fsMkdir: jest.fn().mockResolvedValue(undefined),
  fsCopyFile: jest.fn().mockResolvedValue(undefined),

  showOpenDialog: jest.fn().mockResolvedValue({ canceled: true, filePaths: [] }),
  writeClipboard: jest.fn(),

  getAppVersion: jest.fn().mockResolvedValue('0.0.0-test'),
  getAppPath: jest.fn().mockResolvedValue('/tmp'),
  getOsName: jest.fn().mockResolvedValue('test'),
  getStorePath: jest.fn().mockResolvedValue('/tmp'),

  dbOpen: jest.fn().mockResolvedValue(undefined),
  dbSearch: jest.fn().mockResolvedValue([]),
  dbFindAll: jest.fn().mockResolvedValue([]),
  dbInsert: jest.fn().mockResolvedValue({}),
  dbUpdate: jest.fn().mockResolvedValue(0),
  dbRemove: jest.fn().mockResolvedValue(0),

  fixesOpen: jest.fn().mockResolvedValue(undefined),
  fixesInsert: jest.fn().mockResolvedValue({}),
  fixesGetAll: jest.fn().mockResolvedValue([]),

  reportTransform: jest.fn().mockResolvedValue([]),

  findInPage: jest.fn(),
  stopFindInPage: jest.fn(),
  onFindResult: jest.fn().mockReturnValue(() => {}),
  onFindRequested: jest.fn().mockReturnValue(() => {}),

  logDebug: jest.fn(),
  logError: jest.fn(),

  openExternal: jest.fn(),
};

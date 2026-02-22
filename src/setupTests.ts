import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Minimal mock for window.trackingTool so tests that transitively import
// modules using the Electron IPC bridge don't crash at import time.
(window as any).trackingTool = {
  username: 'testuser',
  platform: 'darwin',
  pathSep: '/',

  configGet: vi.fn().mockResolvedValue(''),
  configSet: vi.fn().mockResolvedValue(undefined),

  fsExists: vi.fn().mockResolvedValue(false),
  fsMkdir: vi.fn().mockResolvedValue(undefined),
  fsCopyFile: vi.fn().mockResolvedValue(undefined),

  showOpenDialog: vi.fn().mockResolvedValue({ canceled: true, filePaths: [] }),
  writeClipboard: vi.fn(),

  getAppVersion: vi.fn().mockResolvedValue('0.0.0-test'),
  getAppPath: vi.fn().mockResolvedValue('/tmp'),
  getOsName: vi.fn().mockResolvedValue('test'),
  getStorePath: vi.fn().mockResolvedValue('/tmp'),

  dbOpen: vi.fn().mockResolvedValue(undefined),
  dbSearch: vi.fn().mockResolvedValue([]),
  dbFindAll: vi.fn().mockResolvedValue([]),
  dbInsert: vi.fn().mockResolvedValue({}),
  dbUpdate: vi.fn().mockResolvedValue(0),
  dbRemove: vi.fn().mockResolvedValue(0),

  fixesOpen: vi.fn().mockResolvedValue(undefined),
  fixesInsert: vi.fn().mockResolvedValue({}),
  fixesGetAll: vi.fn().mockResolvedValue([]),

  reportTransform: vi.fn().mockResolvedValue([]),

  findInPage: vi.fn(),
  stopFindInPage: vi.fn(),
  onFindResult: vi.fn().mockReturnValue(() => {}),
  onFindRequested: vi.fn().mockReturnValue(() => {}),

  logDebug: vi.fn(),
  logError: vi.fn(),

  openExternal: vi.fn(),
};

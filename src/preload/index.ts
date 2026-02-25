import os from 'node:os';
import path from 'node:path';
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('trackingTool', {
  // Sync constants (available immediately, no IPC needed)
  username: os.userInfo().username.toLowerCase(),
  platform: process.platform,
  pathSep: path.sep,

  // App info
  getAppVersion: () => ipcRenderer.invoke('app:getVersion'),
  getAppPath: () => ipcRenderer.invoke('app:getAppPath'),
  getOsName: () => ipcRenderer.invoke('app:getOsName'),
  getStorePath: () => ipcRenderer.invoke('app:getStorePath'),

  // Config (electron-store)
  configGet: (key: string) => ipcRenderer.invoke('config:get', key),
  configSet: (key: string, value: unknown) => ipcRenderer.invoke('config:set', key, value),

  // Filesystem
  fsExists: (filePath: string) => ipcRenderer.invoke('fs:exists', filePath),
  fsMkdir: (dirPath: string) => ipcRenderer.invoke('fs:mkdir', dirPath),
  fsCopyFile: (src: string, dest: string) => ipcRenderer.invoke('fs:copyFile', src, dest),

  // Dialog
  showOpenDialog: (options: Electron.OpenDialogOptions) =>
    ipcRenderer.invoke('dialog:showOpen', options),

  // Clipboard
  writeClipboard: (text: string) => ipcRenderer.invoke('clipboard:write', text),

  // Database
  dbOpen: (username: string) => ipcRenderer.invoke('db:open', username),
  dbSearch: (params: object) => ipcRenderer.invoke('db:search', params),
  dbFindAll: () => ipcRenderer.invoke('db:findAll'),
  dbInsert: (doc: object) => ipcRenderer.invoke('db:insert', doc),
  dbUpdate: (query: object, doc: object) => ipcRenderer.invoke('db:update', query, doc),
  dbRemove: (query: object) => ipcRenderer.invoke('db:remove', query),

  // Fixes
  fixesOpen: () => ipcRenderer.invoke('fixes:open'),
  fixesInsert: (doc: object) => ipcRenderer.invoke('fixes:insert', doc),
  fixesGetAll: () => ipcRenderer.invoke('fixes:getAll'),

  // Reporting
  reportTransform: (options: object) => ipcRenderer.invoke('reporting:transform', options),
  onReportProgress: (
    callback: (progress: { phase: string; current: number; total: number }) => void,
  ) => {
    const handler = (
      _event: Electron.IpcRendererEvent,
      progress: { phase: string; current: number; total: number },
    ) => callback(progress);
    ipcRenderer.on('reporting:progress', handler);
    return () => ipcRenderer.removeListener('reporting:progress', handler);
  },

  // Find in page
  findInPage: (text: string, options?: object) =>
    ipcRenderer.invoke('find:findInPage', text, options),
  stopFindInPage: () => ipcRenderer.invoke('find:stop'),
  onFindResult: (callback: (result: object) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, result: object) => callback(result);
    ipcRenderer.on('find:result', handler);
    return () => ipcRenderer.removeListener('find:result', handler);
  },
  onFindRequested: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer.on('on-find', handler);
    return () => ipcRenderer.removeListener('on-find', handler);
  },

  // Logging (fire-and-forget)
  logDebug: (...args: unknown[]) => ipcRenderer.send('log:debug', ...args),
  logError: (...args: unknown[]) => ipcRenderer.send('log:error', ...args),

  // Shell
  openExternal: (url: string) => ipcRenderer.invoke('shell:openExternal', url),
});

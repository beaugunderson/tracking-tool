const { contextBridge, ipcRenderer } = require('electron');
const os = require('os');
const path = require('path');

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
  configGet: (key) => ipcRenderer.invoke('config:get', key),
  configSet: (key, value) => ipcRenderer.invoke('config:set', key, value),

  // Filesystem
  fsExists: (filePath) => ipcRenderer.invoke('fs:exists', filePath),
  fsMkdir: (dirPath) => ipcRenderer.invoke('fs:mkdir', dirPath),
  fsCopyFile: (src, dest) => ipcRenderer.invoke('fs:copyFile', src, dest),

  // Dialog
  showOpenDialog: (options) => ipcRenderer.invoke('dialog:showOpen', options),

  // Clipboard
  writeClipboard: (text) => ipcRenderer.invoke('clipboard:write', text),

  // Database
  dbOpen: (username) => ipcRenderer.invoke('db:open', username),
  dbSearch: (params) => ipcRenderer.invoke('db:search', params),
  dbFindAll: () => ipcRenderer.invoke('db:findAll'),
  dbInsert: (doc) => ipcRenderer.invoke('db:insert', doc),
  dbUpdate: (query, doc) => ipcRenderer.invoke('db:update', query, doc),
  dbRemove: (query) => ipcRenderer.invoke('db:remove', query),

  // Fixes
  fixesOpen: () => ipcRenderer.invoke('fixes:open'),
  fixesInsert: (doc) => ipcRenderer.invoke('fixes:insert', doc),
  fixesGetAll: () => ipcRenderer.invoke('fixes:getAll'),

  // Reporting
  reportTransform: (options) => ipcRenderer.invoke('reporting:transform', options),

  // Find in page
  findInPage: (text, options) => ipcRenderer.invoke('find:findInPage', text, options),
  stopFindInPage: () => ipcRenderer.invoke('find:stop'),
  onFindResult: (callback) => {
    const handler = (_event, result) => callback(result);
    ipcRenderer.on('find:result', handler);
    return () => ipcRenderer.removeListener('find:result', handler);
  },
  onFindRequested: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('on-find', handler);
    return () => ipcRenderer.removeListener('on-find', handler);
  },

  // Logging (fire-and-forget)
  logDebug: (...args) => ipcRenderer.send('log:debug', ...args),
  logError: (...args) => ipcRenderer.send('log:error', ...args),

  // Shell
  openExternal: (url) => ipcRenderer.invoke('shell:openExternal', url),
});

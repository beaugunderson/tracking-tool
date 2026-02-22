interface TrackingToolAPI {
  // Sync constants
  readonly username: string;
  readonly platform: string;
  readonly pathSep: string;

  // App info
  getAppVersion(): Promise<string>;
  getAppPath(): Promise<string>;
  getOsName(): Promise<string>;
  getStorePath(): Promise<string>;

  // Config
  configGet(key: string): Promise<any>;
  configSet(key: string, value: any): Promise<void>;

  // Filesystem
  fsExists(filePath: string): Promise<boolean>;
  fsMkdir(dirPath: string): Promise<void>;
  fsCopyFile(src: string, dest: string): Promise<void>;

  // Dialog
  showOpenDialog(options: {
    buttonLabel?: string;
    defaultPath?: string;
    properties?: string[];
  }): Promise<{ canceled: boolean; filePaths: string[] }>;

  // Clipboard
  writeClipboard(text: string): Promise<void>;

  // Database
  dbOpen(username: string): Promise<void>;
  dbSearch(params: {
    encounterType?: string;
    patientNamePattern?: string;
    encounterDate?: string;
  }): Promise<any[]>;
  dbFindAll(): Promise<any[]>;
  dbInsert(doc: any): Promise<any>;
  dbUpdate(query: any, doc: any): Promise<number>;
  dbRemove(query: any): Promise<number>;

  // Fixes
  fixesOpen(): Promise<void>;
  fixesInsert(doc: any): Promise<any>;
  fixesGetAll(): Promise<any[]>;

  // Reporting
  reportTransform(options: { mapMrns?: boolean; fixMrns?: boolean }): Promise<any[]>;

  // Find in page
  findInPage(text: string, options?: { forward?: boolean; findNext?: boolean }): Promise<void>;
  stopFindInPage(): Promise<void>;
  onFindResult(
    callback: (result: { activeMatchOrdinal: number; matches: number }) => void,
  ): () => void;
  onFindRequested(callback: () => void): () => void;

  // Logging (fire-and-forget)
  logDebug(...args: any[]): void;
  logError(...args: any[]): void;

  // Shell
  openExternal(url: string): Promise<void>;
}

declare global {
  interface Window {
    trackingTool: TrackingToolAPI;
  }
}

export {};

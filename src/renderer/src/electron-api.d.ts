import type { Encounter } from './types';
import type { Fix } from '../../shared/fix';

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
  configGet(key: string): Promise<unknown>;
  configSet(key: string, value: unknown): Promise<void>;

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
  }): Promise<Encounter[]>;
  dbFindAll(): Promise<Encounter[]>;
  dbInsert(doc: Encounter): Promise<Encounter>;
  dbUpdate(query: { _id: string }, doc: Encounter): Promise<number>;
  dbRemove(query: { _id: string }): Promise<number>;

  // Fixes
  fixesOpen(): Promise<void>;
  fixesInsert(doc: Fix): Promise<Fix>;
  fixesGetAll(): Promise<Fix[]>;

  // Reporting
  reportTransform(options: { mapMrns?: boolean; fixMrns?: boolean }): Promise<Encounter[]>;
  onReportProgress(
    callback: (progress: { phase: string; current: number; total: number }) => void,
  ): () => void;

  // Find in page
  findInPage(text: string, options?: { forward?: boolean; findNext?: boolean }): Promise<void>;
  stopFindInPage(): Promise<void>;
  onFindResult(
    callback: (result: { activeMatchOrdinal: number; matches: number }) => void,
  ): () => void;
  onFindRequested(callback: () => void): () => void;

  // Logging (fire-and-forget)
  logDebug(...args: unknown[]): void;
  logError(...args: unknown[]): void;

  // Shell
  openExternal(url: string): Promise<void>;
}

declare global {
  interface Window {
    trackingTool: TrackingToolAPI;
  }
}

export {};

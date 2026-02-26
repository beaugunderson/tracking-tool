import async from 'async';
import DataStore from '@seald-io/nedb';
import fs from 'node:fs';
import log from 'electron-log';
import os from 'node:os';
import path from 'node:path';
import { findLast, isEqual, pick } from 'lodash';
import { formatDatabase, parseDate } from '../shared/date-utils';
import { glob } from 'glob';
import { isAfter, subYears } from 'date-fns';
import { type RawEncounter, type ReportProgress, transformEncounters } from '../shared/transform';

// --- Data migrations (moved from src/data.ts) ---

interface Migration {
  id: string;
  query: object;
  transform: (encounter: RawEncounter) => RawEncounter;
}

const migrations: Migration[] = [
  {
    id: '0b0ac661-956b-43e4-a130-7fba4425651f',
    query: { encounterType: 'patient' },
    transform: (encounter) => ({
      ...encounter,
      goalsOfCare:
        encounter.facilitation ||
        encounter.valuesAssessment ||
        encounter.advancedIllness ||
        encounter.formCompletion ||
        false,
    }),
  },
  {
    id: 'c1823bb1-1509-4684-8c3c-f0cad40b24e9',
    query: { encounterType: 'patient' },
    transform: (encounter) => {
      const dateOfBirth = parseDate(encounter.dateOfBirth);
      if (dateOfBirth && isAfter(dateOfBirth, new Date())) {
        return {
          ...encounter,
          dateOfBirth: formatDatabase(subYears(dateOfBirth, 100)),
        };
      }
      return encounter;
    },
  },
  {
    id: 'c8656182-2424-11ea-b2c2-3bd0ed5f017c',
    query: { encounterType: 'patient' },
    transform: (encounter) => {
      if (encounter.externalSupportiveCare && !encounter.otherCommunityResources) {
        return { ...encounter, otherCommunityResources: true };
      }
      return encounter;
    },
  },
  {
    id: '998a042a-2425-11ea-a6cf-6b377a9d7b45',
    query: { encounterType: 'community' },
    transform: (encounter) => {
      if (encounter.externalSupportiveCare && !encounter.otherCommunityResources) {
        return { ...encounter, otherCommunityResources: true };
      }
      return encounter;
    },
  },
];

export function applyMigrations(dataStore: DataStore): Promise<DataStore> {
  return new Promise((resolve, reject) => {
    async.eachSeries(
      migrations,
      (migration: Migration, cbMigration: (err?: Error | null) => void) => {
        dataStore.findOne({ migration: migration.id }, {}, (findErr: Error | null, found: any) => {
          if (findErr) return cbMigration(findErr);
          if (found) return cbMigration();

          dataStore.find(migration.query, {}, (queryErr: Error | null, results: any[]) => {
            if (queryErr) return cbMigration(queryErr);

            async.eachSeries(
              results,
              (result: any, cbEncounter: (err?: Error | null) => void) => {
                const transformed = migration.transform(result);
                if (!isEqual(result, transformed)) {
                  dataStore.update(
                    { _id: transformed._id },
                    transformed,
                    {},
                    (updateErr: Error | null, n: number) => {
                      if (updateErr || n !== 1) {
                        cbEncounter(
                          updateErr || new Error(`Update failed for _id "${transformed._id}"`),
                        );
                      } else {
                        cbEncounter();
                      }
                    },
                  );
                } else {
                  cbEncounter();
                }
              },
              (encounterErr?: Error | null) => {
                if (encounterErr) return cbMigration(encounterErr);
                dataStore.insert({ migration: migration.id }, cbMigration as any);
              },
            );
          });
        });
      },
      (err?: Error | null) => {
        if (err) reject(err);
        else resolve(dataStore);
      },
    );
  });
}

// --- I/O functions ---

export function openDataStore(filename: string): DataStore {
  return new DataStore({
    autoload: true,
    compareStrings: (a: string, b: string) => a.toLowerCase().localeCompare(b.toLowerCase()),
    filename,
    timestampData: true,
  });
}

type ProgressCallback = (progress: ReportProgress) => void;

/** Normalize a glob pattern for cross-platform use (glob v10+ treats backslashes as escapes). */
export function normalizeGlobPattern(pattern: string): string {
  return pattern.replaceAll('\\', '/');
}

/** Extract username from an encounter file path (works with both / and \ separators). */
export function usernameFromEncounterPath(filePath: string): string {
  return path.basename(path.dirname(filePath));
}

async function getEncounterFiles(rootPath: string): Promise<string[]> {
  const pattern = normalizeGlobPattern(path.join(rootPath, '*', 'encounters.json'));
  return glob(pattern);
}

async function copyEncounterFiles(rootPath: string, onProgress?: ProgressCallback) {
  const copyPath = fs.mkdtempSync(path.join(os.tmpdir(), 'reporting-'));
  const encounterFiles = await getEncounterFiles(rootPath);
  const copiedFiles: { username: string; filename: string }[] = [];
  const total = encounterFiles.length;

  for (let i = 0; i < total; i++) {
    const file = encounterFiles[i];
    const username = usernameFromEncounterPath(file);
    onProgress?.({ phase: `Copying data for ${username}`, current: i + 1, total });
    log.debug(`copyEncounterFiles: copying "${file}"`);
    const destination = path.join(copyPath, `${username}.json`);
    fs.copyFileSync(file, destination);
    copiedFiles.push({ username, filename: destination });
  }

  return { files: copiedFiles, temporaryDirectory: copyPath };
}

async function copyFixFile(fixesFilePath: string) {
  const copyPath = fs.mkdtempSync(path.join(os.tmpdir(), 'fixes-'));
  const destination = path.join(copyPath, 'fixes.json');

  if (fs.existsSync(fixesFilePath)) {
    log.debug(`copyFixFile: copying "${fixesFilePath}"`);
    fs.copyFileSync(fixesFilePath, destination);
  }

  return { file: destination, temporaryDirectory: copyPath };
}

async function getAllEncounters(filename: string): Promise<any[]> {
  log.debug(`getAllEncounters: "${filename}"`);
  const dataStore = openDataStore(filename);
  const migratedStore = await applyMigrations(dataStore);

  return new Promise((resolve, reject) => {
    migratedStore.find(
      { encounterType: { $exists: true } },
      (err: Error | null, results: any[]) => {
        if (err) {
          log.debug(`getAllEncounters: error "${err}"`);
          reject(err);
        } else {
          resolve(results);
        }
      },
    );
  });
}

export async function getFixes(filename: string): Promise<any[]> {
  log.debug(`getFixes: "${filename}"`);
  if (!fs.existsSync(filename)) return [];

  const dataStore = new DataStore({
    autoload: true,
    filename,
    timestampData: true,
  });

  return new Promise((resolve, reject) => {
    dataStore
      .find({})
      .sort({ createdAt: 1 })
      .exec((err: Error | null, results: any[]) => {
        if (err) reject(err);
        else resolve(results);
      });
  });
}

/**
 * Main reporting pipeline. Copies encounter files to temp, opens NeDB,
 * runs migrations, applies fixes, transforms encounters, and returns
 * the transformed result (with Date fields that survive IPC structured clone).
 */
export async function transform({
  rootPath,
  mapMrns = true,
  fixMrns = true,
  onProgress,
}: {
  rootPath: string;
  mapMrns?: boolean;
  fixMrns?: boolean;
  onProgress?: ProgressCallback;
}) {
  log.debug('transform: copying encounter files');

  const fixesFilePath = path.join(rootPath, 'fixes', 'fixes.json');

  let fixes: any[] = [];
  if (fixMrns) {
    onProgress?.({ phase: 'Loading fixes', current: 0, total: 0 });
    const fixFile = await copyFixFile(fixesFilePath);
    fixes = await getFixes(fixFile.file);
    log.debug(`transform: removing temp "${fixFile.temporaryDirectory}"`);
    fs.rmSync(fixFile.temporaryDirectory, { recursive: true, force: true });
  }

  const copiedUserEncounters = await copyEncounterFiles(rootPath, onProgress);
  const allEncounters: any[] = [];
  const total = copiedUserEncounters.files.length;

  for (let i = 0; i < total; i++) {
    const copiedUserEncounter = copiedUserEncounters.files[i];
    onProgress?.({
      phase: `Loading encounters for ${copiedUserEncounter.username}`,
      current: i + 1,
      total,
    });
    log.debug(`transform: getting encounters for "${copiedUserEncounter.filename}"`);
    const encounters = await getAllEncounters(copiedUserEncounter.filename);
    log.debug(
      `transform: got ${encounters.length} encounters for "${copiedUserEncounter.filename}"`,
    );

    for (const encounter of encounters) {
      if (fixMrns && encounter.encounterType === 'patient') {
        const uniqueId = `${copiedUserEncounter.username}-${encounter._id}`;
        const fix = pick(
          findLast(fixes, { uniqueId }) || { uniqueId },
          'dateOfBirth',
          'mrn',
          'providenceMrn',
          'uniqueId',
        );
        allEncounters.push({ ...encounter, ...fix, username: copiedUserEncounter.username });
      } else {
        allEncounters.push({ ...encounter, username: copiedUserEncounter.username });
      }
    }
  }

  log.debug(`transform: removing temp "${copiedUserEncounters.temporaryDirectory}"`);
  fs.rmSync(copiedUserEncounters.temporaryDirectory, { recursive: true, force: true });

  onProgress?.({ phase: 'Processing encounters', current: total, total });

  log.debug(`transform: transforming ${allEncounters.length} encounters`);
  const transformed = transformEncounters(allEncounters, mapMrns);
  log.debug(`transform: returning ${transformed.length} transformed encounters`);
  return transformed;
}

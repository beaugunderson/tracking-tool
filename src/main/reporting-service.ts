import async from 'async';
import DataStore from '@seald-io/nedb';
import fs from 'node:fs';
import log from 'electron-log';
import path from 'node:path';
import { type Fix } from '../shared/fix';
import { formatDatabase, parseDate } from '../shared/date-utils';
import { glob } from 'glob';
import { isAfter, subYears } from 'date-fns';
import { isEqual, pick } from 'lodash';
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
        dataStore.findOne(
          { migration: migration.id },
          {},
          (findErr: Error | null, found: unknown) => {
            if (findErr) return cbMigration(findErr);
            if (found) return cbMigration();

            dataStore.find<RawEncounter>(
              migration.query,
              {},
              (queryErr: Error | null, results) => {
                if (queryErr) return cbMigration(queryErr);

                async.eachSeries(
                  results,
                  (result: RawEncounter, cbEncounter: (err?: Error | null) => void) => {
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
                    dataStore.insert({ migration: migration.id }, (insertErr) =>
                      cbMigration(insertErr),
                    );
                  },
                );
              },
            );
          },
        );
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

export async function getFixes(filename: string): Promise<Fix[]> {
  log.debug(`getFixes: "${filename}"`);
  if (!fs.existsSync(filename)) return [];

  const dataStore = new DataStore({
    autoload: true,
    filename,
    timestampData: true,
  });

  return new Promise((resolve, reject) => {
    dataStore
      .find<Fix>({})
      .sort({ createdAt: 1 })
      .exec((err: Error | null, results) => {
        if (err) reject(err);
        else resolve(results);
      });
  });
}

// --- Fast reporting pipeline (bypasses NeDB for read-only bulk access) ---

/**
 * Read a NeDB file directly, bypassing the NeDB engine. NeDB files are
 * newline-delimited JSON (append-only): later entries for the same _id
 * override earlier ones, and $$deleted entries remove docs.
 */
function readNedbFileDirect<T extends { _id?: string }>(filename: string): T[] {
  if (!fs.existsSync(filename)) return [];

  const content = fs.readFileSync(filename, 'utf-8');
  const byId = new Map<string, T>();

  for (const line of content.split('\n')) {
    if (!line) continue;
    try {
      const doc = JSON.parse(line);
      if (doc.$$deleted && doc._id) {
        byId.delete(doc._id);
      } else if (doc._id) {
        byId.set(doc._id, doc);
      }
    } catch {
      // Skip malformed lines (partial writes, corruption)
    }
  }

  return Array.from(byId.values());
}

/** Apply data migrations in memory (no NeDB queries needed). Idempotent. */
function applyMigrationsInMemory(encounters: RawEncounter[]): RawEncounter[] {
  return encounters.map((encounter) => {
    let result = encounter;

    if (result.encounterType === 'patient') {
      const goalsOfCare =
        result.facilitation ||
        result.valuesAssessment ||
        result.advancedIllness ||
        result.formCompletion ||
        false;
      if (result.goalsOfCare !== goalsOfCare) {
        result = { ...result, goalsOfCare };
      }

      const dateOfBirth = parseDate(result.dateOfBirth);
      if (dateOfBirth && isAfter(dateOfBirth, new Date())) {
        result = { ...result, dateOfBirth: formatDatabase(subYears(dateOfBirth, 100)) };
      }
    }

    if (
      (result.encounterType === 'patient' || result.encounterType === 'community') &&
      result.externalSupportiveCare &&
      !result.otherCommunityResources
    ) {
      result = { ...result, otherCommunityResources: true };
    }

    return result;
  });
}

/**
 * Main reporting pipeline. Reads encounter files directly (bypassing NeDB
 * engine overhead), applies migrations in memory, uses indexed fix lookups,
 * and transforms encounters.
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
  const t0 = performance.now();

  // Build fix index for O(1) lookups (replaces O(n) findLast per encounter)
  let fixesByUniqueId: Map<string, Fix> | undefined;
  if (fixMrns) {
    onProgress?.({ phase: 'Loading fixes', current: 0, total: 0 });
    const fixesFilePath = path.join(rootPath, 'fixes', 'fixes.json');
    const fixes = readNedbFileDirect<Fix>(fixesFilePath);
    fixesByUniqueId = new Map();
    for (const fix of fixes) {
      if (fix.uniqueId) {
        fixesByUniqueId.set(fix.uniqueId, fix);
      }
    }
    log.debug(`transform: indexed ${fixesByUniqueId.size} fixes`);
  }

  const encounterFiles = await getEncounterFiles(rootPath);
  const allEncounters: RawEncounter[] = [];
  const total = encounterFiles.length;

  for (let i = 0; i < total; i++) {
    const file = encounterFiles[i];
    const username = usernameFromEncounterPath(file);
    onProgress?.({ phase: `Processing ${username}`, current: i + 1, total });

    const rawDocs = readNedbFileDirect<RawEncounter>(file);
    const rawEncounters = rawDocs.filter((doc) => doc.encounterType);
    const encounters = applyMigrationsInMemory(rawEncounters);

    for (const encounter of encounters) {
      if (fixMrns && fixesByUniqueId && encounter.encounterType === 'patient') {
        const uniqueId = `${username}-${encounter._id}`;
        const fix = fixesByUniqueId.get(uniqueId);
        const fixData = pick(
          fix || { uniqueId },
          'dateOfBirth',
          'mrn',
          'providenceMrn',
          'uniqueId',
        );
        allEncounters.push({ ...encounter, ...fixData, username });
      } else {
        allEncounters.push({ ...encounter, username });
      }
    }
  }

  const t1 = performance.now();
  onProgress?.({ phase: 'Transforming encounters', current: total, total });

  log.debug(`transform: loaded ${allEncounters.length} encounters in ${Math.round(t1 - t0)}ms`);
  const transformed = transformEncounters(allEncounters, mapMrns);
  const t2 = performance.now();
  log.debug(
    `transform: transformed ${transformed.length} encounters in ${Math.round(t2 - t1)}ms (total ${Math.round(t2 - t0)}ms)`,
  );
  return transformed;
}

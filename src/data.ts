import async from 'async';
import Debug from 'debug';
import moment from 'moment';
import { CommunityEncounter } from './forms/CommunityEncounterForm';
import { DATE_FORMAT_DATABASE } from './constants';
import { fixesFilePath, userFilePath } from './store';
import { isEqual } from 'lodash';
import { parseDate } from './reporting/data';
import { PatientEncounter } from './forms/PatientEncounterForm';
import type Nedb from 'nedb';

const DataStore = window.require('nedb');
const debug = Debug('tracking-tool:data');
const log = window.require('electron-log');

export type Fix = {
  createdAt?: Date;
  modifiedAt?: Date;

  uniqueId: string;

  mrn?: string;
  providenceMrn?: string;

  dateOfBirth?: string;
};

type CommunityTransform = (encounter: CommunityEncounter) => CommunityEncounter;
type PatientTransform = (encounter: PatientEncounter) => PatientEncounter;

type CommunityMigration = {
  id: string;
  query: { encounterType: 'community' };
  transform: CommunityTransform;
};

type PatientMigration = {
  id: string;
  query: { encounterType: 'patient' };
  transform: PatientTransform;
};

type Migration = CommunityMigration | PatientMigration;

const migrations: Migration[] = [
  {
    id: '0b0ac661-956b-43e4-a130-7fba4425651f',
    query: { encounterType: 'patient' },
    transform: (encounter: PatientEncounter): PatientEncounter => {
      return {
        ...encounter,

        goalsOfCare:
          encounter.facilitation ||
          encounter.valuesAssessment ||
          encounter.advancedIllness ||
          encounter.formCompletion ||
          false,
      };
    },
  },

  {
    id: 'c1823bb1-1509-4684-8c3c-f0cad40b24e9',
    query: { encounterType: 'patient' },
    transform: (encounter: PatientEncounter): PatientEncounter => {
      const dateOfBirth = parseDate(encounter.dateOfBirth);

      // if date of birth is in the future...
      if (dateOfBirth.isValid() && dateOfBirth.isAfter(moment())) {
        return {
          ...encounter,

          // then subtract 100 years, as it was likely specified in ambiguous two-digit format
          dateOfBirth: dateOfBirth.subtract(100, 'years').format(DATE_FORMAT_DATABASE),
        };
      }

      return encounter;
    },
  },

  {
    id: 'c8656182-2424-11ea-b2c2-3bd0ed5f017c',
    query: { encounterType: 'patient' },
    transform: (encounter: PatientEncounter): PatientEncounter => {
      // @ts-ignore: externalSupportiveCare was removed but we need to migrate the data
      if (encounter.externalSupportiveCare && !encounter.otherCommunityResources) {
        return {
          ...encounter,
          otherCommunityResources: true,
        };
      }

      return encounter;
    },
  },

  {
    id: '998a042a-2425-11ea-a6cf-6b377a9d7b45',
    query: { encounterType: 'community' },
    transform: (encounter: CommunityEncounter): CommunityEncounter => {
      // @ts-ignore: externalSupportiveCare was removed but we need to migrate the data
      if (encounter.externalSupportiveCare && !encounter.otherCommunityResources) {
        return {
          ...encounter,
          otherCommunityResources: true,
        };
      }

      return encounter;
    },
  },
];

export const openEncounters = (
  username: string,
  cb: (err: Error | null | undefined, dataStore: Nedb) => void,
  statusCb: (line: string) => void
): void => {
  const filename = userFilePath(username, 'encounters.json');

  statusCb(`Opening "${filename}"`);

  const dataStore: Nedb = new DataStore({
    autoload: true,
    compareStrings: (a: string, b: string) => {
      return a.toLowerCase().localeCompare(b.toLowerCase());
    },
    filename,
    timestampData: true,
  });

  applyMigrations(dataStore, cb, statusCb);

  statusCb('Completed opening encounters');
};

export const openFixes = () => {
  return new DataStore({
    autoload: true,
    compareStrings: (a: string, b: string) => {
      return a.toLowerCase().localeCompare(b.toLowerCase());
    },
    filename: fixesFilePath('fixes.json'),
    timestampData: true,
  });
};

export async function getFixes(filename: string): Promise<Fix[]> {
  log.debug(`getFixes: "${filename}"`);

  const dataStore: Nedb = new DataStore({
    autoload: true,
    filename,
    timestampData: true,
  });

  return new Promise((resolve, reject) => {
    log.debug(`getFixes: calling dataStore.find for "${filename}`);

    dataStore
      .find({})
      .sort({ createdAt: 1 })
      .exec((err: Error | null, results: Fix[]) => {
        if (err) {
          log.debug(`getFixes: error in dataStore.find "${err}"`);
          reject(err);
        } else {
          resolve(results);
        }
      });
  });
}

function applyMigration(
  results: CommunityEncounter[] | PatientEncounter[],
  migration: Migration,
  dataStore: Nedb,
  cbEachMigration: async.ErrorCallback<Error>
) {
  async.eachSeries(
    // @ts-ignore
    results,
    (result, cbEachEncounter) => {
      // @ts-ignore
      const transformed = migration.transform(result);

      if (!isEqual(result, transformed)) {
        dataStore.update(
          { _id: transformed._id },
          transformed,
          {},
          (updateError, numberOfUpdated) => {
            if (updateError || numberOfUpdated !== 1) {
              cbEachEncounter(
                updateError || new Error(`Unable to update _id "${transformed._id}"`)
              );
            } else {
              cbEachEncounter();
            }
          }
        );
      } else {
        cbEachEncounter();
      }
    },
    (encounterError) => {
      if (encounterError) {
        return cbEachMigration(encounterError);
      }

      dataStore.insert({ migration: migration.id }, cbEachMigration);
    }
  );
}

type MigrationCallback = (err: Error | null | undefined, dataStore: Nedb) => void;

export function applyMigrations(
  dataStore: Nedb,
  cb: MigrationCallback,
  // eslint-disable-next-line no-console
  statusCb = (line: string) => console.log(line)
) {
  statusCb(`Applying ${migrations.length} data migrations`);

  async.eachSeries(
    migrations,
    (migration, cbEachMigration) => {
      statusCb(`Applying migration "${migration.id}"`);
      debug('Applying migration "%s"', migration.id);

      dataStore.findOne({ migration: migration.id }, {}, (findMigrationError, foundMigration) => {
        if (findMigrationError) {
          return cbEachMigration(findMigrationError);
        }

        if (foundMigration) {
          statusCb(`Skipping migration "${migration.id}", already applied`);
          debug('Skipping migration "%s", already applied', migration.id);

          return cbEachMigration();
        }

        dataStore.find(
          migration.query,
          {} as PatientEncounter,
          (findError: Error | null, results: CommunityEncounter[] | PatientEncounter[]) => {
            if (findError) {
              return cbEachMigration(findError);
            }

            applyMigration(results, migration, dataStore, cbEachMigration);
          }
        );
      });
    },
    (migrationError) => {
      statusCb(`Migrations complete`);
      cb(migrationError, dataStore);
    }
  );
}

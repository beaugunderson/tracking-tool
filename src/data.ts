import async from 'async';
import Debug from 'debug';
import moment from 'moment';
import { isEqual } from 'lodash';
import { parseDate } from './reporting/data';
import { PatientEncounter } from './forms/PatientEncounterForm';
import { userFilePath } from './store';

const DataStore = window.require('nedb');
const debug = Debug('tracking-tool:data');

type Migration = {
  id: string;
  query: { encounterType: string };
  transform: (encounter: PatientEncounter) => PatientEncounter;
};

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
          false
      };
    }
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
          dateOfBirth: dateOfBirth.subtract(100, 'years').format('YYYY-MM-DD')
        };
      }

      return encounter;
    }
  }
];

export const openEncounters = (cb: (err: Error, dataStore: Nedb) => void): void => {
  const dataStore: Nedb = new DataStore({
    autoload: true,
    compareStrings: (a: string, b: string) => {
      return a.toLowerCase().localeCompare(b.toLowerCase());
    },
    filename: userFilePath('encounters.json'),
    timestampData: true
  });

  async.eachSeries(
    migrations,
    (migration, cbEachMigration) => {
      debug('Applying migration "%s"', migration.id);

      dataStore.findOne({ migration: migration.id }, {}, (findMigrationError, foundMigration) => {
        if (findMigrationError) {
          return cbEachMigration(findMigrationError);
        }

        if (foundMigration) {
          debug('Skipping migration "%s", already applied', migration.id);
          return cbEachMigration();
        }

        dataStore.find(migration.query, {}, (findError: Error, results: PatientEncounter[]) => {
          if (findError) {
            return cbEachMigration(findError);
          }

          applyMigration(results, migration, dataStore, cbEachMigration);
        });
      });
    },
    migrationError => {
      cb(migrationError, dataStore);
    }
  );
};

function applyMigration(
  results: PatientEncounter[],
  migration: Migration,
  dataStore: Nedb,
  cbEachMigration: async.ErrorCallback<Error>
) {
  async.eachSeries(
    results,
    (result, cbEachEncounter) => {
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
    encounterError => {
      if (encounterError) {
        return cbEachMigration(encounterError);
      }

      dataStore.insert({ migration: migration.id }, cbEachMigration);
    }
  );
}

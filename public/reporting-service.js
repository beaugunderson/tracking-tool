const DataStore = require('nedb');
const fs = require('fs');
const os = require('os');
const path = require('path');
const glob = require('glob');
const rimraf = require('rimraf');
const log = require('electron-log');
const moment = require('moment');
const async = require('async');
const { isEqual, pick, findLast } = require('lodash');

const DATE_FORMAT_DATABASE = 'YYYY-MM-DD';

// Match the renderer's two-digit year parsing
moment.parseTwoDigitYear = function parseTwoDigitYear(yearString) {
  const currentYear = moment().year() - 2000;
  const year = parseInt(yearString, 10);
  if (year <= currentYear) return 2000 + year;
  return 1900 + year;
};

function parseDate(date) {
  return moment(
    date ? date.trim() : '',
    ['MM/DD/YYYY', 'M/D/YYYY', 'M/D/YY', 'MM-DD-YYYY', 'M-D-YYYY', 'M-D-YY', 'YYYY-MM-DD'],
    true
  );
}

// --- Data migrations (moved from src/data.ts) ---

const migrations = [
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
      if (dateOfBirth.isValid() && dateOfBirth.isAfter(moment())) {
        return {
          ...encounter,
          dateOfBirth: dateOfBirth.subtract(100, 'years').format(DATE_FORMAT_DATABASE),
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

function applyMigrations(dataStore) {
  return new Promise((resolve, reject) => {
    async.eachSeries(
      migrations,
      (migration, cbMigration) => {
        dataStore.findOne({ migration: migration.id }, {}, (findErr, found) => {
          if (findErr) return cbMigration(findErr);
          if (found) return cbMigration();

          dataStore.find(migration.query, {}, (queryErr, results) => {
            if (queryErr) return cbMigration(queryErr);

            async.eachSeries(
              results,
              (result, cbEncounter) => {
                const transformed = migration.transform(result);
                if (!isEqual(result, transformed)) {
                  dataStore.update(
                    { _id: transformed._id },
                    transformed,
                    {},
                    (updateErr, n) => {
                      if (updateErr || n !== 1) {
                        cbEncounter(updateErr || new Error(`Update failed for _id "${transformed._id}"`));
                      } else {
                        cbEncounter();
                      }
                    }
                  );
                } else {
                  cbEncounter();
                }
              },
              (encounterErr) => {
                if (encounterErr) return cbMigration(encounterErr);
                dataStore.insert({ migration: migration.id }, cbMigration);
              }
            );
          });
        });
      },
      (err) => {
        if (err) reject(err);
        else resolve(dataStore);
      }
    );
  });
}

// --- I/O functions ---

function openDataStore(filename) {
  return new DataStore({
    autoload: true,
    compareStrings: (a, b) => a.toLowerCase().localeCompare(b.toLowerCase()),
    filename,
    timestampData: true,
  });
}

async function getEncounterFiles(rootPath) {
  return new Promise((resolve, reject) => {
    glob(path.join(rootPath, '*', 'encounters.json'), (err, files) => {
      if (err) reject(err);
      else resolve(files);
    });
  });
}

async function copyEncounterFiles(rootPath) {
  const copyPath = fs.mkdtempSync(path.join(os.tmpdir(), 'reporting-'));
  const encounterFiles = await getEncounterFiles(rootPath);
  const copiedFiles = [];

  for (const file of encounterFiles) {
    log.debug(`copyEncounterFiles: copying "${file}"`);
    const parts = path.dirname(file).split(path.sep);
    const username = parts[parts.length - 1];
    const destination = path.join(copyPath, `${username}.json`);
    fs.copyFileSync(file, destination);
    copiedFiles.push({ username, filename: destination });
  }

  return { files: copiedFiles, temporaryDirectory: copyPath };
}

async function copyFixFile(fixesFilePath) {
  const copyPath = fs.mkdtempSync(path.join(os.tmpdir(), 'fixes-'));
  const destination = path.join(copyPath, 'fixes.json');

  if (fs.existsSync(fixesFilePath)) {
    log.debug(`copyFixFile: copying "${fixesFilePath}"`);
    fs.copyFileSync(fixesFilePath, destination);
  }

  return { file: destination, temporaryDirectory: copyPath };
}

async function getAllEncounters(filename) {
  log.debug(`getAllEncounters: "${filename}"`);
  const dataStore = openDataStore(filename);
  const migratedStore = await applyMigrations(dataStore);

  return new Promise((resolve, reject) => {
    migratedStore.find(
      { encounterType: { $exists: true } },
      (err, results) => {
        if (err) {
          log.debug(`getAllEncounters: error "${err}"`);
          reject(err);
        } else {
          resolve(results);
        }
      }
    );
  });
}

async function getFixes(filename) {
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
      .exec((err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
  });
}

/**
 * Main reporting pipeline. Copies encounter files to temp, opens NeDB,
 * runs migrations, applies fixes, and returns raw (non-transformed) encounters.
 * The renderer calls transformEncounters() on the result.
 */
async function transform({ rootPath, mapMrns = true, fixMrns = true }) {
  log.debug('transform: copying encounter files');

  const fixesFilePath = path.join(rootPath, 'fixes', 'fixes.json');

  let fixes = [];
  if (fixMrns) {
    const fixFile = await copyFixFile(fixesFilePath);
    fixes = await getFixes(fixFile.file);
    log.debug(`transform: removing temp "${fixFile.temporaryDirectory}"`);
    rimraf.sync(fixFile.temporaryDirectory, { glob: false });
  }

  const copiedUserEncounters = await copyEncounterFiles(rootPath);
  const allEncounters = [];

  for (const copiedUserEncounter of copiedUserEncounters.files) {
    log.debug(`transform: getting encounters for "${copiedUserEncounter.filename}"`);
    const encounters = await getAllEncounters(copiedUserEncounter.filename);
    log.debug(`transform: got ${encounters.length} encounters for "${copiedUserEncounter.filename}"`);

    for (const encounter of encounters) {
      if (fixMrns && encounter.encounterType === 'patient') {
        const uniqueId = `${copiedUserEncounter.username}-${encounter._id}`;
        const fix = pick(
          findLast(fixes, { uniqueId }) || { uniqueId },
          'dateOfBirth',
          'mrn',
          'providenceMrn',
          'uniqueId'
        );
        allEncounters.push({ ...encounter, ...fix, username: copiedUserEncounter.username });
      } else {
        allEncounters.push({ ...encounter, username: copiedUserEncounter.username });
      }
    }
  }

  log.debug(`transform: removing temp "${copiedUserEncounters.temporaryDirectory}"`);
  rimraf.sync(copiedUserEncounters.temporaryDirectory, { glob: false });

  log.debug(`transform: returning ${allEncounters.length} raw encounters`);
  return allEncounters;
}

module.exports = { applyMigrations, openDataStore, transform, getFixes };

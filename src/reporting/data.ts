import moment from 'moment';
import path from 'path';
import { interventions } from '../patient-interventions';
import { PatientEncounter } from '../forms/PatientEncounterForm';
import { rootPath } from '../store';

const DataStore = window.require('nedb');
const fs = window.require('fs');
const glob = window.require('glob');
const os = window.require('os');
const rimraf = window.require('rimraf');

export interface TransformedPatientEncounter extends PatientEncounter {
  age: number;
  ageBucket: '<= 39 years' | '40 to 64 years' | '>= 65 years';

  encounterDate: string;

  doctorPrimary: string;
  doctorSecondary?: string;

  numberOfInterventions: number;
}

interface CopiedFile {
  username: string;
  filename: string;
}

interface CopyFilesResult {
  files: CopiedFile[];
  temporaryDirectory: string;
}

function ageBucket(age: number): '<= 39 years' | '40 to 64 years' | '>= 65 years' {
  if (age <= 39) {
    return '<= 39 years';
  }

  if (age <= 64) {
    return '40 to 64 years';
  }

  return '>= 65 years';
}

async function getEncounterFiles(): Promise<string[]> {
  return new Promise((resolve, reject) => {
    glob(path.join(rootPath(), '*', 'encounters.json'), (err: Error, files: string[]) => {
      if (err) {
        reject(err);
      } else {
        resolve(files);
      }
    });
  });
}

async function copyEncounterFiles(): Promise<CopyFilesResult> {
  const copiedFiles = [];
  const copyPath = fs.mkdtempSync(path.join(os.tmpdir(), 'reporting-'));
  const encounterFiles = await getEncounterFiles();

  for (const file of encounterFiles) {
    const parts = path.dirname(file).split(path.sep);
    const username = parts[parts.length - 1];
    const destination = path.join(copyPath, `${username}.json`);

    fs.copyFileSync(file, destination);

    copiedFiles.push({ username, filename: destination });
  }

  return {
    files: copiedFiles,
    temporaryDirectory: copyPath
  };
}

async function getPatientEncounters(filename: string): Promise<PatientEncounter[]> {
  const dataStore: Nedb = new DataStore({
    autoload: true,
    filename,
    timestampData: true
  });

  return new Promise((resolve, reject) => {
    dataStore.find({ encounterType: 'patient' }, (err: Error, results: PatientEncounter[]) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
}

export async function transform(): Promise<TransformedPatientEncounter[]> {
  const userEncounters = await copyEncounterFiles();
  const allEncounters = [];

  for (const userEncounter of userEncounters.files) {
    // eslint-disable-next-line no-await-in-loop
    const encounters = await getPatientEncounters(userEncounter.filename);

    for (const encounter of encounters) {
      allEncounters.push({ ...encounter, username: userEncounter.username });
    }
  }

  rimraf.sync(userEncounters.temporaryDirectory, { glob: false });

  const transformed = allEncounters.map((encounter: PatientEncounter) => {
    const age = moment().diff(moment(encounter.dateOfBirth), 'years');

    return {
      ...encounter,

      age,
      ageBucket: ageBucket(age),

      doctorPrimary: encounter.md[0],
      doctorSecondary: encounter.md[1],

      numberOfInterventions: interventions.reduce(
        (accumulator, intervention) => accumulator + (encounter[intervention.fieldName] ? 1 : 0),
        0
      )
    };
  });

  return transformed;
}

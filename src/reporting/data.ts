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

export type AgeBucket = '<= 39 years' | '40 to 64 years' | '>= 65 years';

export const EXCLUDE_NUMBER_VALUE = -666;
export const EXCLUDE_STRING_VALUE = '__EXCLUDE__';

// TODO update this to not extend PatientEncounter and encompass all optional fields correctly
export interface TransformedPatientEncounter extends PatientEncounter {
  age?: number;
  ageBucket?: AgeBucket;

  encounterDate: string;
  formattedEncounterType: string;

  doctorPrimary: string;

  interventions: string[];

  numberOfInterventions: number;
  parsedNumberOfTasks: number;

  tests: string[];
}

interface CopiedFile {
  username: string;
  filename: string;
}

interface CopyFilesResult {
  files: CopiedFile[];
  temporaryDirectory: string;
}

function ageBucket(age?: number): AgeBucket {
  if (!age) {
    return;
  }

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

async function getAllEncounters(filename: string): Promise<PatientEncounter[]> {
  const dataStore: Nedb = new DataStore({
    autoload: true,
    filename,
    timestampData: true
  });

  return new Promise((resolve, reject) => {
    dataStore.find({}, (err: Error, results: PatientEncounter[]) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
}

function transformEncounter(encounter: PatientEncounter): TransformedPatientEncounter {
  const age = moment().diff(moment(encounter.dateOfBirth), 'years');

  const tests = [];

  if (encounter.phq) {
    tests.push('GAD');
  }

  if (encounter.moca) {
    tests.push('MoCA');
  }

  if (encounter.phq) {
    tests.push('PHQ');
  }

  return {
    ...encounter,

    age,
    ageBucket: ageBucket(age),

    formattedEncounterType:
      encounter.encounterType[0].toUpperCase() + encounter.encounterType.slice(1),

    tests,

    doctorPrimary: (encounter.md && encounter.md[0]) || EXCLUDE_STRING_VALUE,

    interventions: interventions.reduce(
      (accumulator, intervention) =>
        encounter[intervention.fieldName] ? accumulator.concat([intervention.name]) : accumulator,
      []
    ),

    mrn: encounter.mrn || EXCLUDE_STRING_VALUE,

    parsedNumberOfTasks: parseInt(encounter.numberOfTasks, 10),

    numberOfInterventions: ['patient', 'community'].includes(encounter.encounterType)
      ? interventions.reduce(
          (accumulator, intervention) => accumulator + (encounter[intervention.fieldName] ? 1 : 0),
          0
        )
      : EXCLUDE_NUMBER_VALUE
  };
}

export function transformEncounters(encounters: PatientEncounter[]) {
  return encounters
    .filter(encounter => ['community', 'patient', 'staff'].includes(encounter.encounterType))
    .map(transformEncounter);
}

export async function transform(): Promise<TransformedPatientEncounter[]> {
  const userEncounters = await copyEncounterFiles();
  const allEncounters: PatientEncounter[] = [];

  for (const userEncounter of userEncounters.files) {
    // eslint-disable-next-line no-await-in-loop
    const encounters = await getAllEncounters(userEncounter.filename);

    for (const encounter of encounters) {
      allEncounters.push({ ...encounter, username: userEncounter.username });
    }
  }

  rimraf.sync(userEncounters.temporaryDirectory, { glob: false });

  return transformEncounters(allEncounters);
}

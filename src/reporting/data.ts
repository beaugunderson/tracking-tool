import moment from 'moment';
import path from 'path';
import { INTERVENTIONS } from '../patient-interventions';
import { isNaN, isNumber } from 'lodash';
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

const RE_SCORE = /\d+|n\/a/i;

moment.parseTwoDigitYear = function parseTwoDigitYear(yearString) {
  const currentYear = moment().year() - 2000;
  const year = parseInt(yearString, 10);

  // 18 <= 19; return 2018
  if (year <= currentYear) {
    return 2000 + year;
  }

  // 20 > 19; return 1920
  return 1900 + year;
};

export function parseDate(date: string) {
  return moment(
    date.trim(),
    [
      'MM/DD/YYYY',
      'M/D/YYYY',
      'MM/DD/YYYY',
      'M/D/YY',

      'MM-DD-YYYY',
      'M-D-YYYY',
      'MM-DD-YYYY',
      'M-D-YY',

      'YYYY-MM-DD'
    ],
    // strict mode
    true
  );
}

export function ageYears(dateString: string): number {
  return moment().diff(parseDate(dateString), 'years');
}

// TODO update this to not extend PatientEncounter and encompass all optional fields correctly
export interface TransformedEncounter extends PatientEncounter {
  // from Other encounter
  activity?: string;

  age?: number;
  ageBucket?: AgeBucket;

  encounterDate: string;
  parsedEncounterDate: moment.Moment;
  formattedEncounterType: string;

  doctorPrimary: string;

  interventions: string[];

  numberOfInterventions: number;

  parsedNumberOfTasks: number;
  parsedNumberOfTasksMinusDocumentation: number;

  gadScoreLabel?: string;
  mocaScoreLabel?: string;
  phqScoreLabel?: string;

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

function bucketAge(age?: number): AgeBucket | undefined {
  if (isNaN(age) || !isNumber(age)) {
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
    dataStore.find(
      { encounterType: { $exists: true } },
      (err: Error, results: PatientEncounter[]) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      }
    );
  });
}

export const SCORE_DECLINED = 'Declined';
export const SCORE_SEVERE = 'Severe';
export const SCORE_MODERATE = 'Moderate';
export const SCORE_MODERATELY_SEVERE = 'Moderately severe';
export const SCORE_MILD_MINIMAL_OR_NONE = 'Mild, minimal, or none';

export const SCORE_NORMAL = 'Normal';
export const SCORE_MAY_INDICATE_COGNITIVE_IMPAIRMENT = 'May indicate cognitive impairment';

function scoreGad(scoreString: string) {
  if (scoreString.toLowerCase() === 'n/a') {
    return SCORE_DECLINED;
  }

  const score = parseInt(scoreString, 10);

  if (score >= 15) {
    return SCORE_SEVERE;
  }

  if (score >= 10) {
    return SCORE_MODERATE;
  }

  return SCORE_MILD_MINIMAL_OR_NONE;
}

function scoreMoca(scoreString: string) {
  if (scoreString.toLowerCase() === 'n/a') {
    return SCORE_DECLINED;
  }

  const score = parseInt(scoreString, 10);

  if (score >= 26) {
    return SCORE_NORMAL;
  }

  return SCORE_MAY_INDICATE_COGNITIVE_IMPAIRMENT;
}

function scorePhq(scoreString: string) {
  if (scoreString.toLowerCase() === 'n/a') {
    return SCORE_DECLINED;
  }

  const score = parseInt(scoreString, 10);

  if (score >= 20) {
    return SCORE_SEVERE;
  }

  if (score >= 15) {
    return SCORE_MODERATELY_SEVERE;
  }

  if (score >= 10) {
    return SCORE_MODERATE;
  }

  return SCORE_MILD_MINIMAL_OR_NONE;
}

export function transformEncounter(encounter: PatientEncounter): TransformedEncounter {
  let age: number | undefined;
  let ageBucket: AgeBucket | undefined;

  if (encounter.encounterType === 'patient') {
    age = ageYears(encounter.dateOfBirth);
    ageBucket = bucketAge(age);
  }

  const tests = [];

  if (encounter.gad) {
    tests.push('GAD');
  }

  if (encounter.moca) {
    tests.push('MoCA');
  }

  if (encounter.phq) {
    tests.push('PHQ');
  }

  const parsedNumberOfTasks = parseInt(encounter.numberOfTasks, 10) || 0;

  const parsedNumberOfTasksMinusDocumentation = encounter.documentation
    ? Math.max(parsedNumberOfTasks - 1, 0)
    : parsedNumberOfTasks;

  let gadScoreLabel: string;
  let mocaScoreLabel: string;
  let phqScoreLabel: string;

  if (encounter.gad && RE_SCORE.test(encounter.gadScore)) {
    gadScoreLabel = scoreGad(encounter.gadScore);
  }

  if (encounter.moca && RE_SCORE.test(encounter.mocaScore)) {
    mocaScoreLabel = scoreMoca(encounter.mocaScore);
  }

  if (encounter.phq && RE_SCORE.test(encounter.phqScore)) {
    phqScoreLabel = scorePhq(encounter.phqScore);
  }

  return {
    ...encounter,

    age,
    ageBucket,

    parsedEncounterDate: moment(encounter.encounterDate, 'YYYY-MM-DD'),

    formattedEncounterType:
      encounter.encounterType[0].toUpperCase() + encounter.encounterType.slice(1),

    tests,

    doctorPrimary: (encounter.md && encounter.md[0]) || EXCLUDE_STRING_VALUE,

    interventions: INTERVENTIONS.reduce(
      (accumulator: string[], intervention) =>
        encounter[intervention.fieldName] ? accumulator.concat([intervention.name]) : accumulator,
      []
    ),

    mrn: encounter.mrn || EXCLUDE_STRING_VALUE,

    parsedNumberOfTasks,

    parsedNumberOfTasksMinusDocumentation,

    phqScoreLabel,
    gadScoreLabel,
    mocaScoreLabel,

    numberOfInterventions: ['patient', 'community'].includes(encounter.encounterType)
      ? INTERVENTIONS.reduce(
          (accumulator, intervention) => accumulator + (encounter[intervention.fieldName] ? 1 : 0),
          0
        )
      : EXCLUDE_NUMBER_VALUE
  };
}

export function transformEncounters(encounters: PatientEncounter[]) {
  return encounters
    .filter(encounter =>
      ['community', 'patient', 'other', 'staff'].includes(encounter.encounterType)
    )
    .map(transformEncounter);
}

export async function transform(): Promise<TransformedEncounter[]> {
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

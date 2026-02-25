import moment from 'moment';
import { clone, isEqual, isNaN, isNumber } from 'lodash';
import { DATE_FORMAT_DATABASE, DATE_FORMAT_DISPLAY } from '../constants';
import { INTERVENTIONS } from '../patient-interventions';
import { PatientEncounter } from '../forms/PatientEncounterForm';

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

export function parseDate(date: string): moment.Moment {
  return moment(
    date ? date.trim() : '',
    [
      // slashes
      'MM/DD/YYYY',
      'M/D/YYYY',
      'M/D/YY',

      // dashes
      'MM-DD-YYYY',
      'M-D-YYYY',
      'M-D-YY',

      // database format
      'YYYY-MM-DD',
    ],
    // strict mode
    true,
  );
}

export function ageYears(encounterDate: moment.Moment, dateOfBirth: moment.Moment): number {
  return encounterDate.diff(dateOfBirth, 'years');
}

// TODO update this to not extend PatientEncounter and encompass all optional fields correctly
export interface TransformedEncounter extends PatientEncounter {
  // from Other encounter
  activity?: string;

  ageBucket?: AgeBucket;

  formattedDateOfBirth?: string;
  parsedDateOfBirth?: moment.Moment;

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

  providenceOrSwedishMrn: string;

  tests: string[];

  timeSpentHours: number;

  uniqueId: string;
}

function bucketAge(age?: number): AgeBucket | null {
  if (isNaN(age) || !isNumber(age)) {
    return null;
  }

  if (age <= 39) {
    return '<= 39 years';
  }

  if (age <= 64) {
    return '40 to 64 years';
  }

  return '>= 65 years';
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

const TYPES_WITH_INTERVENTIONS = ['patient', 'community'];

export function transformEncounter(
  encounter: PatientEncounter,
  providenceMapping = null,
  swedishMapping = null,
): TransformedEncounter {
  let ageBucket: AgeBucket | undefined;
  let parsedDateOfBirth: moment.Moment | undefined;

  const parsedEncounterDate = moment(encounter.encounterDate, DATE_FORMAT_DATABASE);

  if (encounter.encounterType === 'patient') {
    parsedDateOfBirth = parseDate(encounter.dateOfBirth);
    ageBucket = bucketAge(ageYears(parsedEncounterDate, parsedDateOfBirth));
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

  let { providenceMrn } = encounter;
  let swedishMrn = encounter.mrn;

  if (
    swedishMapping &&
    swedishMrn &&
    !providenceMrn &&
    swedishMapping[swedishMrn] &&
    swedishMapping[swedishMrn] !== EXCLUDE_STRING_VALUE
  ) {
    providenceMrn = swedishMapping[swedishMrn];
  }

  if (
    providenceMapping &&
    providenceMrn &&
    !swedishMrn &&
    providenceMapping[providenceMrn] &&
    providenceMapping[providenceMrn] !== EXCLUDE_STRING_VALUE
  ) {
    swedishMrn = providenceMapping[providenceMrn];
  }

  const interventions: string[] = [];

  if (TYPES_WITH_INTERVENTIONS.includes(encounter.encounterType)) {
    for (const intervention of INTERVENTIONS) {
      if (encounter[intervention.fieldName]) {
        interventions.push(intervention.name);
      }
    }
  }

  return {
    ...encounter,

    ageBucket,
    formattedDateOfBirth: parsedDateOfBirth && parsedDateOfBirth.format(DATE_FORMAT_DISPLAY),
    parsedDateOfBirth,

    parsedEncounterDate,

    formattedEncounterType:
      encounter.encounterType[0].toUpperCase() + encounter.encounterType.slice(1),

    tests,

    doctorPrimary: (encounter.md && encounter.md[0]) || EXCLUDE_STRING_VALUE,

    interventions,

    mrn: swedishMrn || EXCLUDE_STRING_VALUE,
    providenceMrn: providenceMrn || EXCLUDE_STRING_VALUE,

    providenceOrSwedishMrn: providenceMrn || swedishMrn || EXCLUDE_STRING_VALUE,

    parsedNumberOfTasks,

    parsedNumberOfTasksMinusDocumentation,

    phqScoreLabel,
    gadScoreLabel,
    mocaScoreLabel,

    numberOfInterventions: TYPES_WITH_INTERVENTIONS.includes(encounter.encounterType)
      ? interventions.length
      : EXCLUDE_NUMBER_VALUE,

    timeSpentHours: parseInt(encounter.timeSpent, 10) / 60,

    uniqueId: `${encounter.username}-${encounter._id}`,
  };
}

type MrnMapping = { [mrn: string]: string } | undefined;

export function inferMrns(encounters: PatientEncounter[]): [MrnMapping, MrnMapping] {
  const providenceMapping: MrnMapping = {};
  const swedishMapping: MrnMapping = {};

  let lastProvidenceMapping: MrnMapping;
  let lastSwedishMapping: MrnMapping;

  while (
    !isEqual(lastProvidenceMapping, providenceMapping) ||
    !isEqual(lastSwedishMapping, swedishMapping)
  ) {
    lastProvidenceMapping = clone(providenceMapping);
    lastSwedishMapping = clone(swedishMapping);

    for (const encounter of encounters) {
      if (!encounter.mrn || !encounter.providenceMrn) {
        continue;
      }

      const currentProvidenceMapping = providenceMapping[encounter.providenceMrn];
      const currentSwedishMapping = swedishMapping[encounter.mrn];

      if (
        currentProvidenceMapping === EXCLUDE_STRING_VALUE ||
        currentSwedishMapping === EXCLUDE_STRING_VALUE
      ) {
        continue;
      }

      if (!currentProvidenceMapping && !currentSwedishMapping) {
        providenceMapping[encounter.providenceMrn] = encounter.mrn;
        swedishMapping[encounter.mrn] = encounter.providenceMrn;
      }

      if (
        (currentProvidenceMapping && currentProvidenceMapping !== encounter.mrn) ||
        (currentSwedishMapping && currentSwedishMapping !== encounter.providenceMrn)
      ) {
        providenceMapping[encounter.providenceMrn] = EXCLUDE_STRING_VALUE;
        swedishMapping[encounter.mrn] = EXCLUDE_STRING_VALUE;
      }
    }
  }

  for (const providence of Object.keys(providenceMapping)) {
    if (providenceMapping[providence] === EXCLUDE_STRING_VALUE) {
      continue;
    }

    if (swedishMapping[providenceMapping[providence]] === EXCLUDE_STRING_VALUE) {
      providenceMapping[providence] = EXCLUDE_STRING_VALUE;
    }
  }

  for (const swedish of Object.keys(swedishMapping)) {
    if (swedishMapping[swedish] === EXCLUDE_STRING_VALUE) {
      continue;
    }

    if (providenceMapping[swedishMapping[swedish]] === EXCLUDE_STRING_VALUE) {
      swedishMapping[swedish] = EXCLUDE_STRING_VALUE;
    }
  }

  return [providenceMapping, swedishMapping];
}

export function transformEncounters(encounters: PatientEncounter[], mapMrns = true) {
  let providenceMapping: MrnMapping;
  let swedishMapping: MrnMapping;

  if (mapMrns) {
    [providenceMapping, swedishMapping] = inferMrns(
      encounters.filter((encounter) => encounter.encounterType === 'patient'),
    );
  }

  return encounters
    .filter((encounter) =>
      ['community', 'patient', 'other', 'staff'].includes(encounter.encounterType),
    )
    .map((encounter) => transformEncounter(encounter, providenceMapping, swedishMapping));
}

export interface ReportProgress {
  phase: string;
  current: number;
  total: number;
}

/**
 * Full reporting pipeline. The main process handles I/O (file copying, NeDB,
 * migrations, fixes), then we run transformEncounters on the raw results.
 */
export async function transform(
  mapMrns: boolean = true,
  fixMrns: boolean = true,
  onProgress?: (progress: ReportProgress) => void,
): Promise<TransformedEncounter[]> {
  let cleanup: (() => void) | undefined;
  if (onProgress) {
    cleanup = window.trackingTool.onReportProgress(onProgress);
  }
  try {
    const rawEncounters = await window.trackingTool.reportTransform({ mapMrns, fixMrns });
    onProgress?.({ phase: 'Transforming encounters', current: 0, total: 0 });
    return transformEncounters(rawEncounters as PatientEncounter[], mapMrns);
  } finally {
    cleanup?.();
  }
}

/**
 * Pure data transformation logic for encounters. No Node, Electron, or React dependencies.
 * Can run in both main process and renderer.
 */
import { ageInYears, formatDisplay, parseDate } from './date-utils';
import { INTERVENTION_FIELDS } from './intervention-fields';
import { isNaN, isNumber } from 'lodash';
import { parse } from 'date-fns';

const DATE_FORMAT_DATABASE = 'yyyy-MM-dd';

export type AgeBucket = '<= 39 years' | '40 to 64 years' | '>= 65 years';

export const EXCLUDE_NUMBER_VALUE = -666;
export const EXCLUDE_STRING_VALUE = '__EXCLUDE__';

const RE_SCORE = /\d+|n\/a/i;

export function bucketAge(age?: number): AgeBucket | null {
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

export function scoreGad(scoreString: string) {
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

export function scoreMoca(scoreString: string) {
  if (scoreString.toLowerCase() === 'n/a') {
    return SCORE_DECLINED;
  }

  const score = parseInt(scoreString, 10);

  if (score >= 26) {
    return SCORE_NORMAL;
  }

  return SCORE_MAY_INDICATE_COGNITIVE_IMPAIRMENT;
}

export function scorePhq(scoreString: string) {
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

type MrnMapping = { [mrn: string]: string } | undefined;

export function transformEncounter(
  encounter: any,
  providenceMapping: MrnMapping = undefined,
  swedishMapping: MrnMapping = undefined,
): any {
  let ageBucket: AgeBucket | undefined;
  let parsedDateOfBirth: Date | undefined;

  const parsedEncounterDate = parse(encounter.encounterDate, DATE_FORMAT_DATABASE, new Date());

  if (encounter.encounterType === 'patient') {
    parsedDateOfBirth = parseDate(encounter.dateOfBirth) ?? undefined;
    ageBucket = parsedDateOfBirth
      ? bucketAge(ageInYears(parsedEncounterDate, parsedDateOfBirth))
      : null;
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
    for (const intervention of INTERVENTION_FIELDS) {
      if (encounter[intervention.fieldName]) {
        interventions.push(intervention.name);
      }
    }
  }

  return {
    ...encounter,

    ageBucket,
    formattedDateOfBirth: parsedDateOfBirth && formatDisplay(parsedDateOfBirth),
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

export function inferMrns(encounters: any[]): [MrnMapping, MrnMapping] {
  const providenceMapping: MrnMapping = {};
  const swedishMapping: MrnMapping = {};

  let changed = true;

  while (changed) {
    changed = false;

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
        changed = true;
      }

      if (
        (currentProvidenceMapping && currentProvidenceMapping !== encounter.mrn) ||
        (currentSwedishMapping && currentSwedishMapping !== encounter.providenceMrn)
      ) {
        providenceMapping[encounter.providenceMrn] = EXCLUDE_STRING_VALUE;
        swedishMapping[encounter.mrn] = EXCLUDE_STRING_VALUE;
        changed = true;
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

export function transformEncounters(encounters: any[], mapMrns = true) {
  let providenceMapping: MrnMapping;
  let swedishMapping: MrnMapping;

  if (mapMrns) {
    [providenceMapping, swedishMapping] = inferMrns(
      encounters.filter((encounter: any) => encounter.encounterType === 'patient'),
    );
  }

  return encounters
    .filter((encounter: any) =>
      ['community', 'patient', 'other', 'staff'].includes(encounter.encounterType),
    )
    .map((encounter: any) => transformEncounter(encounter, providenceMapping, swedishMapping));
}

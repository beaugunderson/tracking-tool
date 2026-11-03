import type { TransformedEncounter } from './transform';

// Patient interventions that put an encounter on the Intervention Report, with the label shown
// in its Crises column.
export const REPORTED_INTERVENTIONS: readonly [keyof TransformedEncounter & string, string][] = [
  ['adultProtection', 'APS'],
  ['behavioralSafetyPlan', 'Behavioral/Safety Plan'],
  ['childProtection', 'CPS'],
  ['mandmMortalityAndMorbidity', 'M&M'],
  ['psychotherapy', 'Psychotherapy'],
  ['sciRxAssistance', 'SCI RX Assistance'],
  ['suicidehomicide', 'Suicide/homicide'],
];

export function reportedInterventions(encounter: TransformedEncounter): string[] {
  if (encounter.encounterType !== 'patient') {
    return [];
  }

  return REPORTED_INTERVENTIONS.filter(([field]) => encounter[field]).map(([, label]) => label);
}

/** Fields needed by reports — everything else is stripped before IPC to reduce payload. */
export const REPORT_FIELDS = new Set<string>([
  // Computed by transformEncounter
  '_id',
  'ageBucket',
  'doctorPrimary',
  'formattedDateOfBirth',
  'formattedEncounterType',
  'gadScoreLabel',
  'interventions',
  'mocaScoreLabel',
  'mrn',
  'numberOfInterventions',
  'parsedDateOfBirth',
  'parsedEncounterDate',
  'parsedNumberOfTasks',
  'parsedNumberOfTasksMinusDocumentation',
  'parsedTimeSpent',
  'phqScoreLabel',
  'providenceMrn',
  'providenceOrSwedishMrn',
  'tests',
  'timeSpentHours',
  'uniqueId',
  // Raw fields still needed by reports
  'activity',
  'clinic',
  'dateOfBirth',
  'diagnosisStage',
  'diagnosisType',
  'encounterDate',
  'encounterType',
  'limitedEnglishProficiency',
  'location',
  'numberOfTasks',
  'patientName',
  'timeSpent',
  'transplant',
  'username',
  ...REPORTED_INTERVENTIONS.map(([field]) => field),
]);

export function projectEncounter(encounter: Record<string, unknown>): Record<string, unknown> {
  const projected: Record<string, unknown> = {};
  for (const key of REPORT_FIELDS) {
    if (key in encounter) {
      projected[key] = encounter[key];
    }
  }
  return projected;
}

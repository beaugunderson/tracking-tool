import { ageInYears, parseDate as sharedParseDate } from '../../../shared/date-utils';
import { PatientEncounter } from '../forms/PatientEncounterForm';

// Re-export everything from shared/transform so existing consumers don't need to change imports
export type { AgeBucket } from '../../../shared/transform';
export {
  bucketAge,
  EXCLUDE_NUMBER_VALUE,
  EXCLUDE_STRING_VALUE,
  inferMrns,
  SCORE_DECLINED,
  SCORE_MAY_INDICATE_COGNITIVE_IMPAIRMENT,
  SCORE_MILD_MINIMAL_OR_NONE,
  SCORE_MODERATE,
  SCORE_MODERATELY_SEVERE,
  SCORE_NORMAL,
  SCORE_SEVERE,
  transformEncounter,
  transformEncounters,
} from '../../../shared/transform';

export function parseDate(date: string): Date | null {
  return sharedParseDate(date);
}

export function ageYears(encounterDate: Date, dateOfBirth: Date): number {
  return ageInYears(encounterDate, dateOfBirth);
}

// TODO update this to not extend PatientEncounter and encompass all optional fields correctly
export interface TransformedEncounter extends PatientEncounter {
  // from Other encounter
  activity?: string;

  ageBucket?: import('../../../shared/transform').AgeBucket;

  formattedDateOfBirth?: string;
  parsedDateOfBirth?: Date;

  encounterDate: string;
  parsedEncounterDate: Date;
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

export interface ReportProgress {
  phase: string;
  current: number;
  total: number;
}

/**
 * Full reporting pipeline. The main process handles I/O (file copying, NeDB,
 * migrations, fixes) and runs transformEncounters, returning the result via IPC.
 * Date objects survive structured clone.
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
    return (await window.trackingTool.reportTransform({
      mapMrns,
      fixMrns,
    })) as TransformedEncounter[];
  } finally {
    cleanup?.();
  }
}

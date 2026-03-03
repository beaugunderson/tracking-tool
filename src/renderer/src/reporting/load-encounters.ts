import type { ReportProgress, TransformedEncounter } from '../../../shared/transform';

/**
 * Full reporting pipeline. The main process handles I/O (file reading,
 * migrations, fixes) and runs transformEncounters, returning JSON via IPC.
 * We parse and reconvert Date fields here (JSON transfer is much faster
 * than structured clone for large arrays).
 */
export async function transform(
  mapMrns = true,
  fixMrns = true,
  onProgress?: (progress: ReportProgress) => void,
): Promise<TransformedEncounter[]> {
  let cleanup: (() => void) | undefined;
  if (onProgress) {
    cleanup = window.trackingTool.onReportProgress(onProgress);
  }
  try {
    const tIpc0 = performance.now();
    const json = (await window.trackingTool.reportTransform({
      mapMrns,
      fixMrns,
    })) as string;
    const tIpc1 = performance.now();

    const encounters = JSON.parse(json) as TransformedEncounter[];
    const tParse = performance.now();

    // Reconvert date fields (JSON serialized them as ISO strings)
    for (const encounter of encounters) {
      encounter.parsedEncounterDate = new Date(encounter.parsedEncounterDate);
      if (encounter.parsedDateOfBirth) {
        encounter.parsedDateOfBirth = new Date(encounter.parsedDateOfBirth);
      }
    }
    const tDates = performance.now();

    window.trackingTool.logDebug(
      `load-encounters: ipc=${Math.round(tIpc1 - tIpc0)}ms, JSON.parse=${Math.round(tParse - tIpc1)}ms (${(json.length / 1024 / 1024).toFixed(1)}MB), dates=${Math.round(tDates - tParse)}ms (${encounters.length} encounters)`,
    );

    return encounters;
  } finally {
    cleanup?.();
  }
}

import type { ReportProgress, TransformedEncounter } from '../../../shared/transform';

/**
 * Full reporting pipeline. The main process handles I/O (file copying, NeDB,
 * migrations, fixes) and runs transformEncounters, returning the result via IPC.
 * Date objects survive structured clone.
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
    return (await window.trackingTool.reportTransform({
      mapMrns,
      fixMrns,
    })) as TransformedEncounter[];
  } finally {
    cleanup?.();
  }
}

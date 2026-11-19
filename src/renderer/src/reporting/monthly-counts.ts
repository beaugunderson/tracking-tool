import { type TransformedEncounter } from '../../../shared/transform';

export interface MonthlyCounts {
  interns: number[];
  nonInterns: number[];
  staff: number[];
}

/**
 * Encounters per month for one Monthly Report location/clinic row group. `monthKeys` are
 * 'yyyy-MM'. Community encounters land in the location's 'Community' clinic row.
 */
export function monthlyCounts(
  encounters: readonly TransformedEncounter[],
  clinic: string,
  location: string,
  monthKeys: readonly string[],
  excludeDocumentationOnly: boolean,
  isIntern: (username: string | null, encounterDate: string) => boolean,
): MonthlyCounts {
  const counts: MonthlyCounts = {
    interns: monthKeys.map(() => 0),
    nonInterns: monthKeys.map(() => 0),
    staff: monthKeys.map(() => 0),
  };

  for (const encounter of encounters) {
    if (
      encounter.encounterType !== 'community' &&
      encounter.encounterType !== 'patient' &&
      encounter.encounterType !== 'staff'
    ) {
      continue;
    }

    if (excludeDocumentationOnly && encounter.documentationOnly) {
      continue;
    }

    const matchesRow =
      (encounter.clinic === clinic && encounter.location === location) ||
      (encounter.encounterType === 'community' &&
        encounter.location === location &&
        clinic === 'Community');

    if (!matchesRow) {
      continue;
    }

    const i = monthKeys.indexOf(encounter.encounterDate.slice(0, 7));

    if (i === -1) {
      continue;
    }

    if (encounter.encounterType === 'staff') {
      counts.staff[i] += 1;
    } else if (isIntern(encounter.username ?? null, encounter.encounterDate)) {
      counts.interns[i] += 1;
    } else {
      counts.nonInterns[i] += 1;
    }
  }

  return counts;
}

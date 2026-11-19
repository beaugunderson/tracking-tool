import { monthlyCounts } from './monthly-counts';
import { type RawEncounter, transformEncounter } from '../../../shared/transform';

function encounter(raw: Partial<RawEncounter>) {
  return transformEncounter({
    _id: 'abc',
    clinic: 'Medical Oncology',
    encounterDate: '2026-10-15',
    encounterType: 'patient',
    location: 'First Hill',
    numberOfTasks: '7',
    timeSpent: '30',
    username: 'osw',
    careCoordination: true,
    ...raw,
  } as RawEncounter);
}

const MONTHS = ['2026-11', '2026-10'];
const notIntern = () => false;

it('counts one per encounter regardless of the stored number of tasks', () => {
  const counts = monthlyCounts(
    [encounter({}), encounter({ numberOfTasks: '0' }), encounter({ numberOfTasks: undefined })],
    'Medical Oncology',
    'First Hill',
    MONTHS,
    false,
    notIntern,
  );

  expect(counts.nonInterns).toEqual([0, 3]);
});

it('splits staff, interns, and everyone else', () => {
  const counts = monthlyCounts(
    [
      encounter({ encounterType: 'staff' }),
      encounter({ username: 'intern', encounterDate: '2026-11-03' }),
      encounter({}),
    ],
    'Medical Oncology',
    'First Hill',
    MONTHS,
    false,
    (username) => username === 'intern',
  );

  expect(counts).toEqual({ interns: [1, 0], nonInterns: [0, 1], staff: [0, 1] });
});

it('puts community encounters in the location Community row', () => {
  const counts = monthlyCounts(
    [encounter({ encounterType: 'community', clinic: undefined })],
    'Community',
    'First Hill',
    MONTHS,
    false,
    notIntern,
  );

  expect(counts.nonInterns).toEqual([0, 1]);
});

it('skips other encounters and other rows', () => {
  const counts = monthlyCounts(
    [encounter({ encounterType: 'other' }), encounter({ location: 'Ballard' })],
    'Medical Oncology',
    'First Hill',
    MONTHS,
    false,
    notIntern,
  );

  expect(counts.nonInterns).toEqual([0, 0]);
});

it('excludes documentation-only encounters only when asked', () => {
  const encounters = [
    encounter({ careCoordination: false, documentation: true }),
    encounter({ documentation: true }),
  ];

  const args = ['Medical Oncology', 'First Hill', MONTHS] as const;

  expect(monthlyCounts(encounters, ...args, false, notIntern).nonInterns).toEqual([0, 2]);
  expect(monthlyCounts(encounters, ...args, true, notIntern).nonInterns).toEqual([0, 1]);
});

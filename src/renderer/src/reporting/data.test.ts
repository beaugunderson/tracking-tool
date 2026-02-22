import { EXCLUDE_STRING_VALUE, inferMrns } from './data';
import { PatientEncounter } from '../forms/PatientEncounterForm';

describe('inferMrns', () => {
  it('should infer MRNSs', () => {
    const encounters = [
      { mrn: 's1', providenceMrn: null },
      { mrn: 's1', providenceMrn: 'p1' },
      { mrn: 's1', providenceMrn: null },
      { mrn: 's1', providenceMrn: null },
      { mrn: 's1', providenceMrn: null },

      { mrn: 's2', providenceMrn: 'p2' },

      { mrn: 's3', providenceMrn: 'p3' },
      { mrn: 's3', providenceMrn: 'p4' },

      { mrn: 's5', providenceMrn: 'p5' },
      { mrn: 's6', providenceMrn: 'p5' },
    ] as PatientEncounter[];

    const [providenceMapping, swedishMapping] = inferMrns(encounters);

    expect(providenceMapping).toStrictEqual({
      p1: 's1',
      p2: 's2',
      p3: EXCLUDE_STRING_VALUE,
      p4: EXCLUDE_STRING_VALUE,
      p5: EXCLUDE_STRING_VALUE,
    });

    expect(swedishMapping).toStrictEqual({
      s1: 'p1',
      s2: 'p2',
      s3: EXCLUDE_STRING_VALUE,
      s5: EXCLUDE_STRING_VALUE,
      s6: EXCLUDE_STRING_VALUE,
    });
  });
});

import {
  ageYears,
  EXCLUDE_NUMBER_VALUE,
  EXCLUDE_STRING_VALUE,
  parseDate,
  SCORE_DECLINED,
  SCORE_MAY_INDICATE_COGNITIVE_IMPAIRMENT,
  SCORE_MILD_MINIMAL_OR_NONE,
  SCORE_MODERATE,
  SCORE_MODERATELY_SEVERE,
  SCORE_NORMAL,
  SCORE_SEVERE,
  transformEncounter,
  transformEncounters,
} from './data';
import { formatDatabase } from '../../../shared/date-utils';
import { PatientEncounter } from '../forms/PatientEncounterForm';

function makeEncounter(overrides: Partial<PatientEncounter> = {}): PatientEncounter {
  return {
    _id: 'abc123',
    username: 'testuser',
    clinic: 'Medical Oncology',
    dateOfBirth: '',
    diagnosisFreeText: '',
    diagnosisStage: '',
    diagnosisType: '',
    encounterDate: '2023-06-15',
    encounterType: 'patient',
    limitedEnglishProficiency: false,
    location: 'First Hill',
    md: [],
    mrn: '',
    numberOfTasks: '',
    patientName: '',
    providenceMrn: '',
    timeSpent: '60',
    transplant: false,
    accessingAccurateMedicalInformation: false,
    act: false,
    adultProtection: false,
    assessmentReferral: false,
    assessmentUnderstandingTreatmentOptionsDiagnosis: false,
    assistingTalkingToHealthcareTeam: false,
    behavioralSafetyPlan: false,
    careCoordination: false,
    caregiverSupportiveCounselingEducation: false,
    cbt: false,
    childProtection: false,
    communityGrantFunds: false,
    customerService: false,
    dbt: false,
    deathWithDignity: false,
    distressScreen: false,
    documentation: false,
    employment: false,
    familyMeeting: false,
    food: false,
    gad: false,
    gadScore: '',
    goalsOfCare: false,
    grief: false,
    holidayFamilies: false,
    homeCareFacility: false,
    homelessness: false,
    insuranceAccessAssistance: false,
    interpersonalViolence: false,
    legal: false,
    lodgingHousingShelter: false,
    managingWorkHomeLifeIllness: false,
    mandmMortalityAndMorbidity: false,
    meaningCenteredPsychotherapy: false,
    mindfullness: false,
    moca: false,
    mocaScore: '',
    motivationalInterviewing: false,
    narrative: false,
    neuroCognitiveTesting: false,
    newDiagnosis: false,
    otherCommunityResources: false,
    otherMedicalBills: false,
    otherMentalHealthIntervention: false,
    palliativeCareHospice: false,
    patientSupportiveCounselingEducation: false,
    phq: false,
    phqScore: '',
    psychiatryPsychotherapy: false,
    psychoEducation: false,
    psychotherapy: false,
    respiteCare: false,
    sciGrantFunds: false,
    sciRxAssistance: false,
    sciSupportiveCare: false,
    severeMentalIllness: false,
    sexualityIntimacyFertility: false,
    smart: false,
    solutionFocused: false,
    spiritualExistential: false,
    statefederalIncome: false,
    substanceUse: false,
    suicidehomicide: false,
    supportForChildren: false,
    survivorship: false,
    swedishFinancialAssistance: false,
    transplantAssessment: false,
    transportation: false,
    ...overrides,
  } as PatientEncounter;
}

describe('parseDate', () => {
  it('parses MM/DD/YYYY', () => {
    const d = parseDate('01/15/2023');
    expect(d).not.toBeNull();
    expect(formatDatabase(d!)).toBe('2023-01-15');
  });

  it('parses M/D/YYYY', () => {
    const d = parseDate('1/5/2023');
    expect(d).not.toBeNull();
    expect(formatDatabase(d!)).toBe('2023-01-05');
  });

  it('parses M/D/YY with two-digit year <= current year → 2000s', () => {
    const d = parseDate('1/1/18');
    expect(d).not.toBeNull();
    expect(d!.getFullYear()).toBe(2018);
  });

  it('parses M/D/YY with two-digit year > current year → 1900s', () => {
    const d = parseDate('1/1/99');
    expect(d).not.toBeNull();
    expect(d!.getFullYear()).toBe(1999);
  });

  it('two-digit year boundary: current year suffix → 2000s', () => {
    const currentYearSuffix = new Date().getFullYear() - 2000;
    const d = parseDate(`1/1/${currentYearSuffix}`);
    expect(d).not.toBeNull();
    expect(d!.getFullYear()).toBe(2000 + currentYearSuffix);
  });

  it('two-digit year boundary: current year + 1 suffix → 1900s', () => {
    const nextYearSuffix = new Date().getFullYear() - 2000 + 1;
    const d = parseDate(`1/1/${nextYearSuffix}`);
    expect(d).not.toBeNull();
    expect(d!.getFullYear()).toBe(1900 + nextYearSuffix);
  });

  it('parses MM-DD-YYYY', () => {
    const d = parseDate('01-15-2023');
    expect(d).not.toBeNull();
    expect(formatDatabase(d!)).toBe('2023-01-15');
  });

  it('parses M-D-YYYY', () => {
    const d = parseDate('1-5-2023');
    expect(d).not.toBeNull();
    expect(formatDatabase(d!)).toBe('2023-01-05');
  });

  it('parses M-D-YY', () => {
    const d = parseDate('1-5-23');
    expect(d).not.toBeNull();
    expect(formatDatabase(d!)).toBe('2023-01-05');
  });

  it('parses database format YYYY-MM-DD', () => {
    const d = parseDate('2023-01-15');
    expect(d).not.toBeNull();
    expect(formatDatabase(d!)).toBe('2023-01-15');
  });

  it('returns null for empty string', () => {
    expect(parseDate('')).toBeNull();
  });

  it('returns null for garbage input', () => {
    expect(parseDate('not a date')).toBeNull();
  });

  it('trims whitespace', () => {
    const d = parseDate('  01/15/2023  ');
    expect(d).not.toBeNull();
    expect(formatDatabase(d!)).toBe('2023-01-15');
  });
});

describe('ageYears', () => {
  it('calculates age in whole years', () => {
    const encounter = new Date(2023, 5, 15);
    const dob = new Date(1980, 0, 1);
    expect(ageYears(encounter, dob)).toBe(43);
  });

  it('returns age before birthday in the encounter year', () => {
    const encounter = new Date(2023, 5, 15);
    const dob = new Date(1980, 6, 1);
    expect(ageYears(encounter, dob)).toBe(42);
  });

  it('returns age on birthday', () => {
    const encounter = new Date(2023, 5, 15);
    const dob = new Date(1980, 5, 15);
    expect(ageYears(encounter, dob)).toBe(43);
  });
});

describe('bucketAge (via transformEncounter)', () => {
  it('returns null for NaN age (no dateOfBirth)', () => {
    const enc = makeEncounter({ encounterType: 'patient', dateOfBirth: '' });
    expect(transformEncounter(enc).ageBucket).toBeNull();
  });

  it('boundary: 39 → <= 39 years', () => {
    const enc = makeEncounter({ dateOfBirth: '06/15/1984', encounterDate: '2023-06-15' });
    expect(transformEncounter(enc).ageBucket).toBe('<= 39 years');
  });

  it('boundary: 40 → 40 to 64 years', () => {
    const enc = makeEncounter({ dateOfBirth: '06/14/1983', encounterDate: '2023-06-15' });
    expect(transformEncounter(enc).ageBucket).toBe('40 to 64 years');
  });

  it('boundary: 64 → 40 to 64 years', () => {
    const enc = makeEncounter({ dateOfBirth: '06/16/1958', encounterDate: '2023-06-15' });
    expect(transformEncounter(enc).ageBucket).toBe('40 to 64 years');
  });

  it('boundary: 65 → >= 65 years', () => {
    const enc = makeEncounter({ dateOfBirth: '06/15/1958', encounterDate: '2023-06-15' });
    expect(transformEncounter(enc).ageBucket).toBe('>= 65 years');
  });
});

describe('transformEncounter', () => {
  describe('parsedEncounterDate and formattedDateOfBirth', () => {
    it('produces a parsedEncounterDate from encounterDate', () => {
      const enc = makeEncounter({ encounterDate: '2023-06-15' });
      const result = transformEncounter(enc);
      expect(formatDatabase(result.parsedEncounterDate)).toBe('2023-06-15');
    });

    it('produces formattedDateOfBirth from dateOfBirth', () => {
      const enc = makeEncounter({ dateOfBirth: '1990-03-25', encounterDate: '2023-06-15' });
      const result = transformEncounter(enc);
      expect(result.formattedDateOfBirth).toBe('03/25/1990');
    });

    it('produces formattedDateOfBirth from MM/DD/YYYY input', () => {
      const enc = makeEncounter({ dateOfBirth: '03/25/1990', encounterDate: '2023-06-15' });
      const result = transformEncounter(enc);
      expect(result.formattedDateOfBirth).toBe('03/25/1990');
    });
  });

  describe('age bucketing', () => {
    it('buckets age <= 39', () => {
      const enc = makeEncounter({ dateOfBirth: '01/01/2000', encounterDate: '2023-06-15' });
      const result = transformEncounter(enc);
      expect(result.ageBucket).toBe('<= 39 years');
    });

    it('buckets age 40-64', () => {
      const enc = makeEncounter({ dateOfBirth: '01/01/1970', encounterDate: '2023-06-15' });
      const result = transformEncounter(enc);
      expect(result.ageBucket).toBe('40 to 64 years');
    });

    it('buckets age >= 65', () => {
      const enc = makeEncounter({ dateOfBirth: '01/01/1950', encounterDate: '2023-06-15' });
      const result = transformEncounter(enc);
      expect(result.ageBucket).toBe('>= 65 years');
    });

    it('boundary: age exactly 39', () => {
      const enc = makeEncounter({ dateOfBirth: '06/15/1984', encounterDate: '2023-06-15' });
      const result = transformEncounter(enc);
      expect(result.ageBucket).toBe('<= 39 years');
    });

    it('boundary: age exactly 40', () => {
      const enc = makeEncounter({ dateOfBirth: '06/15/1983', encounterDate: '2023-06-15' });
      const result = transformEncounter(enc);
      expect(result.ageBucket).toBe('40 to 64 years');
    });

    it('boundary: age exactly 64', () => {
      const enc = makeEncounter({ dateOfBirth: '06/15/1959', encounterDate: '2023-06-15' });
      const result = transformEncounter(enc);
      expect(result.ageBucket).toBe('40 to 64 years');
    });

    it('boundary: age exactly 65', () => {
      const enc = makeEncounter({ dateOfBirth: '06/15/1958', encounterDate: '2023-06-15' });
      const result = transformEncounter(enc);
      expect(result.ageBucket).toBe('>= 65 years');
    });

    it('does not bucket non-patient encounters', () => {
      const enc = makeEncounter({ encounterType: 'community' });
      const result = transformEncounter(enc);
      expect(result.ageBucket).toBeUndefined();
    });
  });

  describe('date parsing and formatted type', () => {
    it('parses encounterDate', () => {
      const enc = makeEncounter({ encounterDate: '2023-06-15' });
      const result = transformEncounter(enc);
      expect(formatDatabase(result.parsedEncounterDate)).toBe('2023-06-15');
    });

    it('capitalizes encounter type', () => {
      expect(
        transformEncounter(makeEncounter({ encounterType: 'patient' })).formattedEncounterType,
      ).toBe('Patient');
      expect(
        transformEncounter(makeEncounter({ encounterType: 'community' })).formattedEncounterType,
      ).toBe('Community');
      expect(
        transformEncounter(makeEncounter({ encounterType: 'staff' })).formattedEncounterType,
      ).toBe('Staff');
      expect(
        transformEncounter(makeEncounter({ encounterType: 'other' })).formattedEncounterType,
      ).toBe('Other');
    });
  });

  describe('GAD scoring', () => {
    it('scores n/a as Declined', () => {
      const enc = makeEncounter({ gad: true, gadScore: 'n/a' });
      expect(transformEncounter(enc).gadScoreLabel).toBe(SCORE_DECLINED);
    });

    it('scores 0-9 as mild', () => {
      const enc = makeEncounter({ gad: true, gadScore: '5' });
      expect(transformEncounter(enc).gadScoreLabel).toBe(SCORE_MILD_MINIMAL_OR_NONE);
    });

    it('scores 9 as mild', () => {
      const enc = makeEncounter({ gad: true, gadScore: '9' });
      expect(transformEncounter(enc).gadScoreLabel).toBe(SCORE_MILD_MINIMAL_OR_NONE);
    });

    it('scores 10-14 as moderate', () => {
      const enc = makeEncounter({ gad: true, gadScore: '10' });
      expect(transformEncounter(enc).gadScoreLabel).toBe(SCORE_MODERATE);
    });

    it('scores 14 as moderate', () => {
      const enc = makeEncounter({ gad: true, gadScore: '14' });
      expect(transformEncounter(enc).gadScoreLabel).toBe(SCORE_MODERATE);
    });

    it('scores 15+ as severe', () => {
      const enc = makeEncounter({ gad: true, gadScore: '15' });
      expect(transformEncounter(enc).gadScoreLabel).toBe(SCORE_SEVERE);
    });

    it('scores 21 as severe', () => {
      const enc = makeEncounter({ gad: true, gadScore: '21' });
      expect(transformEncounter(enc).gadScoreLabel).toBe(SCORE_SEVERE);
    });

    it('no label when gad is false', () => {
      const enc = makeEncounter({ gad: false, gadScore: '10' });
      expect(transformEncounter(enc).gadScoreLabel).toBeUndefined();
    });
  });

  describe('PHQ scoring', () => {
    it('scores n/a as Declined', () => {
      const enc = makeEncounter({ phq: true, phqScore: 'n/a' });
      expect(transformEncounter(enc).phqScoreLabel).toBe(SCORE_DECLINED);
    });

    it('scores 0-9 as mild', () => {
      const enc = makeEncounter({ phq: true, phqScore: '5' });
      expect(transformEncounter(enc).phqScoreLabel).toBe(SCORE_MILD_MINIMAL_OR_NONE);
    });

    it('scores 10-14 as moderate', () => {
      const enc = makeEncounter({ phq: true, phqScore: '12' });
      expect(transformEncounter(enc).phqScoreLabel).toBe(SCORE_MODERATE);
    });

    it('scores 15-19 as moderately severe', () => {
      const enc = makeEncounter({ phq: true, phqScore: '17' });
      expect(transformEncounter(enc).phqScoreLabel).toBe(SCORE_MODERATELY_SEVERE);
    });

    it('scores 20+ as severe', () => {
      const enc = makeEncounter({ phq: true, phqScore: '22' });
      expect(transformEncounter(enc).phqScoreLabel).toBe(SCORE_SEVERE);
    });

    it('boundary: 9 is mild, 10 is moderate', () => {
      expect(transformEncounter(makeEncounter({ phq: true, phqScore: '9' })).phqScoreLabel).toBe(
        SCORE_MILD_MINIMAL_OR_NONE,
      );
      expect(transformEncounter(makeEncounter({ phq: true, phqScore: '10' })).phqScoreLabel).toBe(
        SCORE_MODERATE,
      );
    });

    it('boundary: 14 is moderate, 15 is moderately severe', () => {
      expect(transformEncounter(makeEncounter({ phq: true, phqScore: '14' })).phqScoreLabel).toBe(
        SCORE_MODERATE,
      );
      expect(transformEncounter(makeEncounter({ phq: true, phqScore: '15' })).phqScoreLabel).toBe(
        SCORE_MODERATELY_SEVERE,
      );
    });

    it('boundary: 19 is moderately severe, 20 is severe', () => {
      expect(transformEncounter(makeEncounter({ phq: true, phqScore: '19' })).phqScoreLabel).toBe(
        SCORE_MODERATELY_SEVERE,
      );
      expect(transformEncounter(makeEncounter({ phq: true, phqScore: '20' })).phqScoreLabel).toBe(
        SCORE_SEVERE,
      );
    });
  });

  describe('MoCA scoring', () => {
    it('scores n/a as Declined', () => {
      const enc = makeEncounter({ moca: true, mocaScore: 'n/a' });
      expect(transformEncounter(enc).mocaScoreLabel).toBe(SCORE_DECLINED);
    });

    it('scores 26+ as normal', () => {
      const enc = makeEncounter({ moca: true, mocaScore: '28' });
      expect(transformEncounter(enc).mocaScoreLabel).toBe(SCORE_NORMAL);
    });

    it('scores <26 as may indicate cognitive impairment', () => {
      const enc = makeEncounter({ moca: true, mocaScore: '22' });
      expect(transformEncounter(enc).mocaScoreLabel).toBe(SCORE_MAY_INDICATE_COGNITIVE_IMPAIRMENT);
    });

    it('boundary: 25 is impairment, 26 is normal', () => {
      expect(
        transformEncounter(makeEncounter({ moca: true, mocaScore: '25' })).mocaScoreLabel,
      ).toBe(SCORE_MAY_INDICATE_COGNITIVE_IMPAIRMENT);
      expect(
        transformEncounter(makeEncounter({ moca: true, mocaScore: '26' })).mocaScoreLabel,
      ).toBe(SCORE_NORMAL);
    });
  });

  describe('tests array', () => {
    it('returns empty array when no tests', () => {
      const enc = makeEncounter({ gad: false, moca: false, phq: false });
      expect(transformEncounter(enc).tests).toEqual([]);
    });

    it('includes GAD when flagged', () => {
      const enc = makeEncounter({ gad: true, gadScore: '5' });
      expect(transformEncounter(enc).tests).toContain('GAD');
    });

    it('includes MoCA when flagged', () => {
      const enc = makeEncounter({ moca: true, mocaScore: '26' });
      expect(transformEncounter(enc).tests).toContain('MoCA');
    });

    it('includes PHQ when flagged', () => {
      const enc = makeEncounter({ phq: true, phqScore: '5' });
      expect(transformEncounter(enc).tests).toContain('PHQ');
    });

    it('includes multiple tests', () => {
      const enc = makeEncounter({
        phq: true,
        phqScore: '5',
        moca: true,
        mocaScore: '26',
      });
      const result = transformEncounter(enc);
      expect(result.tests).toEqual(['MoCA', 'PHQ']);
    });
  });

  describe('interventions', () => {
    it('counts patient interventions', () => {
      const enc = makeEncounter({
        encounterType: 'patient',
        distressScreen: true,
        food: true,
        careCoordination: true,
      });
      const result = transformEncounter(enc);
      expect(result.interventions).toContain('Distress Screen');
      expect(result.interventions).toContain('Food');
      expect(result.interventions).toContain('Care Coordination');
      expect(result.numberOfInterventions).toBe(3);
    });

    it('counts community interventions', () => {
      const enc = makeEncounter({
        encounterType: 'community',
        food: true,
        transportation: true,
      });
      const result = transformEncounter(enc);
      expect(result.interventions).toContain('Food');
      expect(result.interventions).toContain('Transportation');
      expect(result.numberOfInterventions).toBe(2);
    });

    it('excludes interventions for staff encounters', () => {
      const enc = makeEncounter({
        encounterType: 'staff',
        food: true,
      });
      const result = transformEncounter(enc);
      expect(result.interventions).toEqual([]);
      expect(result.numberOfInterventions).toBe(EXCLUDE_NUMBER_VALUE);
    });

    it('excludes interventions for other encounters', () => {
      const enc = makeEncounter({
        encounterType: 'other',
        food: true,
      });
      const result = transformEncounter(enc);
      expect(result.interventions).toEqual([]);
      expect(result.numberOfInterventions).toBe(EXCLUDE_NUMBER_VALUE);
    });
  });

  describe('MRN mapping passthrough', () => {
    it('infers providence MRN from swedish mapping', () => {
      const enc = makeEncounter({ mrn: 's1', providenceMrn: '' });
      const result = transformEncounter(enc, null, { s1: 'p1' });
      expect(result.providenceMrn).toBe('p1');
    });

    it('infers swedish MRN from providence mapping', () => {
      const enc = makeEncounter({ mrn: '', providenceMrn: 'p1' });
      const result = transformEncounter(enc, { p1: 's1' }, null);
      expect(result.mrn).toBe('s1');
    });

    it('does not overwrite existing MRNs', () => {
      const enc = makeEncounter({ mrn: 's1', providenceMrn: 'p1' });
      const result = transformEncounter(enc, { p1: 's2' }, { s1: 'p2' });
      expect(result.mrn).toBe('s1');
      expect(result.providenceMrn).toBe('p1');
    });

    it('uses EXCLUDE_STRING_VALUE when no MRN', () => {
      const enc = makeEncounter({ mrn: '', providenceMrn: '' });
      const result = transformEncounter(enc);
      expect(result.mrn).toBe(EXCLUDE_STRING_VALUE);
      expect(result.providenceMrn).toBe(EXCLUDE_STRING_VALUE);
      expect(result.providenceOrSwedishMrn).toBe(EXCLUDE_STRING_VALUE);
    });

    it('does not apply excluded mappings', () => {
      const enc = makeEncounter({ mrn: 's1', providenceMrn: '' });
      const result = transformEncounter(enc, null, { s1: EXCLUDE_STRING_VALUE });
      expect(result.providenceMrn).toBe(EXCLUDE_STRING_VALUE);
    });
  });

  describe('numberOfTasks parsing', () => {
    it('parses string to int', () => {
      const enc = makeEncounter({ numberOfTasks: '5' });
      expect(transformEncounter(enc).parsedNumberOfTasks).toBe(5);
    });

    it('defaults to 0 for non-numeric', () => {
      const enc = makeEncounter({ numberOfTasks: '' });
      expect(transformEncounter(enc).parsedNumberOfTasks).toBe(0);
    });

    it('subtracts 1 when documentation is true', () => {
      const enc = makeEncounter({ numberOfTasks: '5', documentation: true });
      const result = transformEncounter(enc);
      expect(result.parsedNumberOfTasks).toBe(5);
      expect(result.parsedNumberOfTasksMinusDocumentation).toBe(4);
    });

    it('does not go below 0 when subtracting documentation', () => {
      const enc = makeEncounter({ numberOfTasks: '0', documentation: true });
      expect(transformEncounter(enc).parsedNumberOfTasksMinusDocumentation).toBe(0);
    });

    it('no subtraction when documentation is false', () => {
      const enc = makeEncounter({ numberOfTasks: '5', documentation: false });
      expect(transformEncounter(enc).parsedNumberOfTasksMinusDocumentation).toBe(5);
    });
  });

  describe('timeSpentHours', () => {
    it('converts minutes to hours', () => {
      const enc = makeEncounter({ timeSpent: '60' });
      expect(transformEncounter(enc).timeSpentHours).toBe(1);
    });

    it('handles fractional hours', () => {
      const enc = makeEncounter({ timeSpent: '90' });
      expect(transformEncounter(enc).timeSpentHours).toBe(1.5);
    });

    it('handles 0 minutes', () => {
      const enc = makeEncounter({ timeSpent: '0' });
      expect(transformEncounter(enc).timeSpentHours).toBe(0);
    });
  });

  describe('uniqueId', () => {
    it('formats as username-_id', () => {
      const enc = makeEncounter({ _id: 'xyz', username: 'jsmith' });
      expect(transformEncounter(enc).uniqueId).toBe('jsmith-xyz');
    });
  });

  describe('doctorPrimary', () => {
    it('uses first doctor from md array', () => {
      const enc = makeEncounter({ md: ['Smith, John', 'Doe, Jane'] });
      expect(transformEncounter(enc).doctorPrimary).toBe('Smith, John');
    });

    it('uses EXCLUDE_STRING_VALUE when no doctors', () => {
      const enc = makeEncounter({ md: [] });
      expect(transformEncounter(enc).doctorPrimary).toBe(EXCLUDE_STRING_VALUE);
    });
  });
});

describe('transformEncounters', () => {
  it('filters to valid encounter types', () => {
    const encounters = [
      makeEncounter({ encounterType: 'patient', _id: '1' }),
      makeEncounter({ encounterType: 'community', _id: '2' }),
      makeEncounter({ encounterType: 'staff', _id: '3' }),
      makeEncounter({ encounterType: 'other', _id: '4' }),
      { ...makeEncounter({ _id: '5' }), encounterType: 'invalid' } as unknown as PatientEncounter,
    ];
    const result = transformEncounters(encounters, false);
    expect(result).toHaveLength(4);
  });

  it('applies MRN inference when mapMrns=true', () => {
    const encounters = [
      makeEncounter({ encounterType: 'patient', mrn: 's1', providenceMrn: 'p1', _id: '1' }),
      makeEncounter({ encounterType: 'patient', mrn: 's1', providenceMrn: '', _id: '2' }),
    ];
    const result = transformEncounters(encounters, true);
    const second = result.find((e) => e._id === '2');
    expect(second.providenceMrn).toBe('p1');
  });

  it('skips MRN inference when mapMrns=false', () => {
    const encounters = [
      makeEncounter({ encounterType: 'patient', mrn: 's1', providenceMrn: 'p1', _id: '1' }),
      makeEncounter({ encounterType: 'patient', mrn: 's1', providenceMrn: '', _id: '2' }),
    ];
    const result = transformEncounters(encounters, false);
    const second = result.find((e) => e._id === '2');
    expect(second.providenceMrn).toBe(EXCLUDE_STRING_VALUE);
  });
});

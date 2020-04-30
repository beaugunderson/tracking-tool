import { nameToFieldName } from './patient-interventions';

const testCases = [
  {
    name: 'Distress Screen',
    fieldName: 'distressScreen',
  },
  {
    name: 'Documentation',
    fieldName: 'documentation',
  },
  {
    name: 'Transplant Assessment',
    fieldName: 'transplantAssessment',
  },
  {
    name: 'Severe Mental Illness',
    fieldName: 'severeMentalIllness',
  },
  {
    name: 'Suicide/Homicide',
    fieldName: 'suicidehomicide',
  },
  {
    name: 'Substance Use',
    fieldName: 'substanceUse',
  },
  {
    name: 'Homelessness',
    fieldName: 'homelessness',
  },
  {
    name: 'Adult Protection',
    fieldName: 'adultProtection',
  },
  {
    name: 'Child Protection',
    fieldName: 'childProtection',
  },
  {
    name: 'Interpersonal Violence',
    fieldName: 'interpersonalViolence',
  },
  {
    name: 'M&M (Mortality and Morbidity)',
    fieldName: 'mandmMortalityAndMorbidity',
  },
  {
    name: 'Assessment, Referral',
    fieldName: 'assessmentReferral',
  },
  {
    name: 'Food',
    fieldName: 'food',
  },
  {
    name: 'Transportation',
    fieldName: 'transportation',
  },
  {
    name: 'Lodging, Housing, Shelter',
    fieldName: 'lodgingHousingShelter',
  },
  {
    name: 'Managing Work, Home Life, Illness',
    fieldName: 'managingWorkHomeLifeIllness',
  },
  {
    name: 'Holiday Families',
    fieldName: 'holidayFamilies',
  },
  {
    name: 'Other Community Resources',
    fieldName: 'otherCommunityResources',
  },
  {
    name: 'Goals of Care',
    fieldName: 'goalsOfCare',
  },
  {
    name: 'Death with Dignity',
    fieldName: 'deathWithDignity',
  },
  {
    name: 'Caregiver: Supportive Counseling, Education',
    fieldName: 'caregiverSupportiveCounselingEducation',
  },
  {
    name: 'Family Meeting',
    fieldName: 'familyMeeting',
  },
  {
    name: 'Respite Care',
    fieldName: 'respiteCare',
  },
  {
    name: 'Support for Children',
    fieldName: 'supportForChildren',
  },
  {
    name: 'New Diagnosis',
    fieldName: 'newDiagnosis',
  },
  {
    name: 'Patient: Supportive Counseling, Education',
    fieldName: 'patientSupportiveCounselingEducation',
  },
  {
    name: 'Sexuality, Intimacy, Fertility',
    fieldName: 'sexualityIntimacyFertility',
  },
  {
    name: 'Spiritual, Existential',
    fieldName: 'spiritualExistential',
  },
  {
    name: 'Survivorship',
    fieldName: 'survivorship',
  },
  {
    name: 'PHQ',
    fieldName: 'phq',
  },
  {
    name: 'GAD',
    fieldName: 'gad',
  },
  {
    name: 'MoCA',
    fieldName: 'moca',
  },
  {
    name: 'ACT',
    fieldName: 'act',
  },
  {
    name: 'CBT',
    fieldName: 'cbt',
  },
  {
    name: 'Grief',
    fieldName: 'grief',
  },
  {
    name: 'Mindfulness',
    fieldName: 'mindfulness',
  },
  {
    name: 'Motivational Interviewing',
    fieldName: 'motivationalInterviewing',
  },
  {
    name: 'Narrative',
    fieldName: 'narrative',
  },
  {
    name: 'Psycho-Education',
    fieldName: 'psychoEducation',
  },
  {
    name: 'SMART',
    fieldName: 'smart',
  },
  {
    name: 'Solution-Focused',
    fieldName: 'solutionFocused',
  },
  // These two specify manual fieldNames
  // {
  //   name: 'Other Psychotherapy Techniques',
  //   fieldName: 'otherMentalHealthIntervention',
  // },
  // {
  //   name: 'Patient Relations',
  //   fieldName: 'customerService',
  // },
  {
    name: 'Care Coordination',
    fieldName: 'careCoordination',
  },
  {
    name: 'Home Care, Facility',
    fieldName: 'homeCareFacility',
  },
  {
    name: 'Palliative Care, Hospice',
    fieldName: 'palliativeCareHospice',
  },
  {
    name: 'Neuro-Cognitive Testing',
    fieldName: 'neuroCognitiveTesting',
  },
  {
    name: 'Psychiatry, Psychotherapy',
    fieldName: 'psychiatryPsychotherapy',
  },
  {
    name: 'Behavioral, Safety Plan',
    fieldName: 'behavioralSafetyPlan',
  },
  {
    name: 'SCI Supportive Care',
    fieldName: 'sciSupportiveCare',
  },
  {
    name: 'SCI Grant Funds',
    fieldName: 'sciGrantFunds',
  },
  {
    name: 'SCI Rx Assistance',
    fieldName: 'sciRxAssistance',
  },
  {
    name: 'Community Grant Funds',
    fieldName: 'communityGrantFunds',
  },
  {
    name: 'Insurance Access, Assistance',
    fieldName: 'insuranceAccessAssistance',
  },
  {
    name: 'Swedish Financial Assistance',
    fieldName: 'swedishFinancialAssistance',
  },
  {
    name: 'Other Medical Bills',
    fieldName: 'otherMedicalBills',
  },
  {
    name: 'Employment',
    fieldName: 'employment',
  },
  {
    name: 'State/Federal Income',
    fieldName: 'statefederalIncome',
  },
  {
    name: 'Legal',
    fieldName: 'legal',
  },
  {
    name: 'Accessing Accurate Medical Information',
    fieldName: 'accessingAccurateMedicalInformation',
  },
  {
    name: 'Assessment: Understanding Treatment Options, Diagnosis',
    fieldName: 'assessmentUnderstandingTreatmentOptionsDiagnosis',
  },
  {
    name: 'Assisting: Talking to Healthcare Team',
    fieldName: 'assistingTalkingToHealthcareTeam',
  },
];

describe('nameToFieldName', () => {
  it('should not change field names', () => {
    for (const testCase of testCases) {
      expect(nameToFieldName(testCase.name)).toBe(testCase.fieldName);
    }
  });
});

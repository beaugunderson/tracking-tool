/**
 * Intervention field names and display names, extracted from patient-interventions.tsx.
 * This file has no JSX or React dependencies so it can be used in the main process.
 *
 * A test in the renderer verifies this list stays in sync with the full INTERVENTIONS array.
 */

export interface InterventionField {
  fieldName: string;
  name: string;
}

// Listed in the same group order as patient-interventions.tsx
export const INTERVENTION_FIELDS: InterventionField[] = [
  // Encounter Type
  { fieldName: 'distressScreen', name: 'Distress Screen' },
  { fieldName: 'documentation', name: 'Documentation' },
  { fieldName: 'transplantAssessment', name: 'Transplant Assessment' },

  // Crisis
  { fieldName: 'severeMentalIllness', name: 'Severe Mental Illness' },
  { fieldName: 'suicidehomicide', name: 'Suicide/Homicide' },
  { fieldName: 'substanceUse', name: 'Substance Use' },
  { fieldName: 'homelessness', name: 'Homelessness' },
  { fieldName: 'adultProtection', name: 'Adult Protection' },
  { fieldName: 'childProtection', name: 'Child Protection' },
  { fieldName: 'interpersonalViolence', name: 'Interpersonal Violence' },
  { fieldName: 'mandmMortalityAndMorbidity', name: 'M&M (Mortality and Morbidity)' },

  // Support Group Screening
  { fieldName: 'assessmentReferral', name: 'Assessment, Referral' },

  // Social, Practical
  { fieldName: 'food', name: 'Food' },
  { fieldName: 'transportation', name: 'Transportation' },
  { fieldName: 'lodgingHousingShelter', name: 'Lodging, Housing, Shelter' },
  { fieldName: 'managingWorkHomeLifeIllness', name: 'Managing Work, Home Life, Illness' },
  { fieldName: 'holidayFamilies', name: 'Holiday Families' },
  { fieldName: 'otherCommunityResources', name: 'Other Community Resources' },

  // Advanced Care Planning
  { fieldName: 'goalsOfCare', name: 'Goals of Care' },
  { fieldName: 'deathWithDignity', name: 'Death with Dignity' },

  // Family, Caregiver
  {
    fieldName: 'caregiverSupportiveCounselingEducation',
    name: 'Caregiver: Supportive Counseling, Education',
  },
  { fieldName: 'familyMeeting', name: 'Family Meeting' },
  { fieldName: 'respiteCare', name: 'Respite Care' },
  { fieldName: 'supportForChildren', name: 'Support for Children' },

  // Psychological, Emotional
  { fieldName: 'newDiagnosis', name: 'New Diagnosis' },
  {
    fieldName: 'patientSupportiveCounselingEducation',
    name: 'Patient: Supportive Counseling, Education',
  },
  { fieldName: 'psychotherapy', name: 'Psychotherapy' },
  { fieldName: 'sexualityIntimacyFertility', name: 'Sexuality, Intimacy, Fertility' },
  { fieldName: 'spiritualExistential', name: 'Spiritual, Existential' },
  { fieldName: 'survivorship', name: 'Survivorship' },
  { fieldName: 'phq', name: 'PHQ' },
  { fieldName: 'gad', name: 'GAD' },
  { fieldName: 'moca', name: 'MoCA' },

  // Care Coordination
  { fieldName: 'customerService', name: 'Patient Relations' },
  { fieldName: 'careCoordination', name: 'Care Coordination' },
  { fieldName: 'homeCareFacility', name: 'Home Care, Facility' },
  { fieldName: 'palliativeCareHospice', name: 'Palliative Care, Hospice' },
  { fieldName: 'neuroCognitiveTesting', name: 'Neuro-Cognitive Testing' },
  { fieldName: 'psychiatryPsychotherapy', name: 'Psychiatry, Psychotherapy' },
  { fieldName: 'behavioralSafetyPlan', name: 'Behavioral, Safety Plan' },
  { fieldName: 'sciSupportiveCare', name: 'SCI Supportive Care' },

  // Financial, Legal
  { fieldName: 'sciGrantFunds', name: 'SCI Grant Funds' },
  { fieldName: 'sciRxAssistance', name: 'SCI Rx Assistance' },
  { fieldName: 'communityGrantFunds', name: 'Community Grant Funds' },
  { fieldName: 'insuranceAccessAssistance', name: 'Insurance Access, Assistance' },
  { fieldName: 'swedishFinancialAssistance', name: 'Swedish Financial Assistance' },
  { fieldName: 'otherMedicalBills', name: 'Other Medical Bills' },
  { fieldName: 'employment', name: 'Employment' },
  { fieldName: 'statefederalIncome', name: 'State/Federal Income' },
  { fieldName: 'legal', name: 'Legal' },

  // Health Literacy
  {
    fieldName: 'accessingAccurateMedicalInformation',
    name: 'Accessing Accurate Medical Information',
  },
  {
    fieldName: 'assessmentUnderstandingTreatmentOptionsDiagnosis',
    name: 'Assessment: Understanding Treatment Options, Diagnosis',
  },
  { fieldName: 'assistingTalkingToHealthcareTeam', name: 'Assisting: Talking to Healthcare Team' },

  // Intervention Techniques
  { fieldName: 'act', name: 'ACT' },
  { fieldName: 'cbt', name: 'CBT' },
  { fieldName: 'dbt', name: 'DBT' },
  { fieldName: 'grief', name: 'Grief' },
  { fieldName: 'meaningCenteredPsychotherapy', name: 'Meaning-Centered Psychotherapy' },
  { fieldName: 'mindfulness', name: 'Mindfulness' },
  { fieldName: 'motivationalInterviewing', name: 'Motivational Interviewing' },
  { fieldName: 'narrative', name: 'Narrative' },
  { fieldName: 'psychoEducation', name: 'Psycho-Education' },
  { fieldName: 'smart', name: 'SMART' },
  { fieldName: 'solutionFocused', name: 'Solution-Focused' },
  { fieldName: 'otherMentalHealthIntervention', name: 'Other Psychotherapy Techniques' },
];

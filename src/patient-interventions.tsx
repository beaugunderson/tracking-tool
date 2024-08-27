import camelcase from 'camelcase';
import React from 'react';
import slugify from 'slugify';
import { Header } from 'semantic-ui-react';
import { Intervention } from './types';
import { sortBy } from 'lodash';

type InterventionOption = {
  content: React.ReactNode;
  text: string;
  value: string;
};

type UnprocessedIntervention = {
  community?: true;
  description: React.ReactNode;
  fieldName?: string;
  name: string;
  scored?: true;
};

type InterventionGroup = {
  label: string;
  interventions: Intervention[];
};

export function nameToFieldName(name: string) {
  return camelcase(slugify(name, { lower: true, remove: /[^a-zA-Z0-9 -]/, strict: true }));
}

function withFieldNames(interventions: UnprocessedIntervention[]): Intervention[] {
  return interventions.map((intervention) => ({
    ...intervention,
    fieldName: intervention.fieldName || nameToFieldName(intervention.name),
  }));
}

const ENCOUNTER_TYPE = {
  label: 'Encounter Type',
  interventions: withFieldNames([
    {
      name: 'Distress Screen',
      description:
        'Initial contact on DS (1st/2nd call, letter, letter only, clinic visit), not for subsequent follow-up',
    },
    {
      name: 'Documentation',
      description:
        'When tracking an encounter where time/tasks includes documentation mark all categories that apply including Documentation. If completing documentation on the following day, enter a new encounter, mark Documentation only',
    },
    {
      name: 'Transplant Assessment',
      description:
        'Coordination, assessment for consideration for transplant, including coordination with solid organ transplant team in support of their assessment',
    },
  ]),
};

const CRISIS = {
  label: 'Crisis',
  interventions: withFieldNames([
    {
      name: 'Severe Mental Illness',
      description:
        'Schizophrenia, bipolar, major depression, anxiety, etc. Any mental health issue severe enough to need social work to support patient through treatment',
      community: true,
    },
    {
      name: 'Suicide/Homicide',
      description: 'Assessment for suicidal, homicidal ideation',
      community: true,
    },
    {
      name: 'Substance Use',
      description:
        'Assessment, support, referral for patient with SUD, including smoking cessation, AA',
      community: true,
    },
    {
      name: 'Homelessness',
      description: 'Imminent/chronic homelessness assessment, referral, coordination',
      community: true,
    },
    {
      name: 'Adult Protection',
      description: 'Referral to, coordination with APS',
      community: true,
    },
    {
      name: 'Child Protection',
      description: 'Referral to, coordination with CPS',
      community: true,
    },
    {
      name: 'Interpersonal Violence',
      description: 'Assessment, support, referral related to domestic violence',
      community: true,
    },
    {
      name: 'M&M (Mortality and Morbidity)',
      description:
        'Create encounter, mark M&M upon patient’s death in cases where severe MH, SUD, homelessness are thought to have contributed to patient’s death regardless of if you actually had an encounter that would typically be tracked',
    },
  ]),
};

const SUPPORT_GROUP = {
  label: 'Support Group Screening',
  interventions: withFieldNames([
    {
      name: 'Assessment, Referral',
      description: 'Research, discussion of, referral to support groups',
      community: true,
    },
  ]),
};

const SOCIAL_PRACTICAL = {
  label: 'Social, Practical',
  interventions: withFieldNames([
    {
      name: 'Food',
      description: 'Food banks, Meals on Wheels, Chicken Soup Brigade',
      community: true,
    },
    {
      name: 'Transportation',
      description: (
        <>
          ACS Road to Recovery, Hopelink, Paratransit, Access, Angel Flight, Disability Placards
          and Ferry Passes.{' '}
          <strong>
            Excludes SCI Parking Assistance, which should be tracked under SCI Grant Funds
          </strong>
        </>
      ),
      community: true,
    },
    {
      name: 'Lodging, Housing, Shelter',
      description: 'Information, referrals related to short-, long-term housing',
      community: true,
    },
    {
      name: 'Managing Work, Home Life, Illness',
      description: 'Cleaning for a Reason, home care, chore services, Caring Bridge, childcare',
      community: true,
    },
    {
      name: 'Holiday Families',
      description:
        'Communication, coordination with, or about patients for Holiday Families Program',
    },
    {
      name: 'Other Community Resources',
      description: 'Choose if referrals do not match other more specific categories',
      community: true,
    },
  ]),
};

const ADVANCED_CARE_PLANNING = {
  label: 'Advanced Care Planning',
  interventions: withFieldNames([
    {
      name: 'Goals of Care',
      description:
        'End of life discussions, including hospice/palliative care, Death with Dignity, activity related to advance directives; ' +
        'Assessment of patient values to aid in treatment, end of life planning; ' +
        'Emotional, educational counseling related to advanced stage disease; ' +
        'Providing patient with advance directives, or related education and assistance',
    },
    {
      name: 'Death with Dignity',
      description:
        'Discussion, education, referrals, coordination with physicians, related to Death with Dignity',
    },
  ]),
};

const FAMILY = {
  label: 'Family, Caregiver',
  interventions: withFieldNames([
    {
      name: 'Caregiver: Supportive Counseling, Education',
      description:
        'Meeting with caregiver (with or without patient) for emotional, psychological support, information re caregiver role, resources',
      community: true,
    },
    {
      name: 'Family Meeting',
      description:
        'Facilitate communication amongst patient and two or more family, caregivers, and healthcare providers where discussion is focused on issues related to treatment, care, decision-making',
    },
    {
      name: 'Respite Care',
      description:
        'When caregiver is in need of services (if patient, use other categories), including in-home help with short-term custodial care placement, short-term assisted living placement, day program',
      community: true,
    },
    {
      name: 'Support for Children',
      description:
        'Coaching, support for patient around communication with and resources for children under 18 years old. Choose this instead of "Support Groups - Assessment, Referral" when talking with patients about CLIMB. CLIMB Facilitators should track under "Other" encounter category when screening, preparing, and facilitating',
      community: true,
    },
  ]),
};

const PSYCHOLOGICAL = {
  label: 'Psychological, Emotional',
  interventions: withFieldNames([
    {
      name: 'New Diagnosis',
      description: 'Interventions surrounding a new diagnosis, acute',
    },
    {
      name: 'Patient: Supportive Counseling, Education',
      description: (
        <>
          Interactions involving supportive listening, validation, encouragement, other therapeutic
          interventions. <strong>Excludes survivorship, caregiver support</strong>
        </>
      ),
    },
    {
      name: 'Psychotherapy',
      description:
        'Formal psychotherapy program, with intentional, goal-directed therapeutic services and interventions.',
    },
    {
      name: 'Sexuality, Intimacy, Fertility',
      description: 'Assessment, information, referral related to sexuality, intimacy, fertility',
    },
    {
      name: 'Spiritual, Existential',
      description:
        'Spiritual assessment, including spirituality, belief systems, faith, religion, existential issues related to meaning/purpose, referrals to chaplain, spiritual leader, faith community',
    },
    {
      name: 'Survivorship',
      description:
        'Supportive counseling, education, referrals for programs focused on survivorship issues, primarily for post-treatment, maintenance',
    },

    {
      name: 'PHQ',
      description:
        'Mark when you have completed a PHQ with the patient in the encounter you are tracking, input the score',
      scored: true,
    },

    {
      name: 'GAD',
      description:
        'Mark when you have completed a GAD with the patient in the encounter you are tracking, input the score',
      scored: true,
    },

    {
      name: 'MoCA',
      description:
        'Mark when you have completed a MoCA with the patient in the encounter you are tracking, input the score',
      scored: true,
    },
  ]),
};

const CARE_COORDINATION = {
  label: 'Care Coordination',
  interventions: withFieldNames([
    {
      name: 'Patient Relations',
      // NOTE: "Customer Service" was renamed to "Patient Relations" but we kept the field name for backwards compatibility
      fieldName: 'customerService',
      description:
        'Introducing support services, quick check-ins, service recovery, patient relations',
      community: true,
    },
    {
      name: 'Care Coordination',
      description: (
        <>
          Can include chart review on a single case, coordination or communication with patient,
          internal or external care team members (SW/CM, MD, PA/NP, RN, MA, PSC), etc.{' '}
          <strong>
            Excludes Home Care, Facility; Palliative Care, Hospice; Psychiatry, Psychotherapy
            (including case presentations) - these should be tracked using the more specific
            categories. Chart review for multiple cases should be tracked under the Other-encounter
            type using Rounding/Tumor Board
          </strong>
        </>
      ),
      community: true,
    },
    {
      name: 'Home Care, Facility',
      description:
        'Referrals, coordination, communication with home health, private duty caregiving, and facility, includes pre-discharge planning',
      community: true,
    },
    {
      name: 'Palliative Care, Hospice',
      description:
        'Referral, coordination with palliative care/hospice agency, including internal care coordination with Swedish Palliative Care team',
      community: true,
    },
    {
      name: 'Neuro-Cognitive Testing',
      description: (
        <>
          Referral, coordination for neurological/cognitive assessment, treatment.
          <strong>
            Excludes completion of MoCA, which should be tracked using the more specific category
          </strong>
        </>
      ),
    },
    {
      name: 'Psychiatry, Psychotherapy',
      description: (
        <>
          Research, referrals, coordination with psychiatry/psychotherapy resources, including
          preparation for case presentations given in Psych Rounds or Team Meeting.
          <strong>Excludes quick resource/patient questions</strong>
        </>
      ),
    },
    {
      name: 'Behavioral, Safety Plan',
      description:
        'Patient behavior challenges, including consult with staff, patient, family member, drafting behavioral agreement',
    },
    {
      name: 'SCI Supportive Care',
      description:
        'SCI Nutrition Counseling, Northwest Natural Health, Monroe Massage at SCI, Cancer Rehabilitation, Art & Music Therapy',
      community: true,
    },
  ]),
};

const FINANCIAL = {
  label: 'Financial, Legal',
  interventions: withFieldNames([
    {
      name: 'SCI Grant Funds',
      description:
        'Discussion, facilitation of SCI grant funds, including SCI Parking Assistance and SCI Rx Assistance',
      community: true,
    },
    {
      name: 'SCI Rx Assistance',
      description:
        'For person who is approving/denying Rx Assistance, not for the OSW requesting it. Can be selected whenever discussing Rx Assistance with an OSW about a specific patient',
    },
    {
      name: 'Community Grant Funds',
      description:
        'Cancer Lifeline, LLS, other organizations providing direct funding to patients',
      community: true,
    },
    {
      name: 'Insurance Access, Assistance',
      description:
        'Education, advocacy, referral on Medicare, Medicaid, Medicare Savings, COBRA, Healthcare Exchange, referral to PFA, SHIBA',
      community: true,
    },
    {
      name: 'Swedish Financial Assistance',
      description:
        'Information re financial assistance, providing application, coordination, advocacy',
    },
    {
      name: 'Other Medical Bills',
      description:
        'Helping patients with financial assistance and medical bills outside the Swedish system',
    },
    {
      name: 'Employment',
      description:
        'Employment concerns, FMLA, talking with HR, work accommodations, referrals to Cancer & Careers, Bureau of Labor, career or job assistance, scholarships',
      community: true,
    },
    {
      name: 'State/Federal Income',
      description: 'Benefits consultation, assistance with SSI, SSDI, Food Stamps, LIHEAP, TANF',
      community: true,
    },
    {
      name: 'Legal',
      description:
        'For discussions, referrals related to legal concerns, including estate planning, immigration letters, coordination with legal systems, etc.',
      community: true,
    },
  ]),
};

const HEALTH_LITERACY = {
  label: 'Health Literacy',
  interventions: withFieldNames([
    {
      name: 'Accessing Accurate Medical Information',
      description:
        'Talking to patient re where to find reputable resources for medical information',
    },
    {
      name: 'Assessment: Understanding Treatment Options, Diagnosis',
      description:
        'Understanding of illness, if it is a values assessment track under ACP instead',
    },
    {
      name: 'Assisting: Talking to Healthcare Team',
      description:
        'Communication assistance between patient and MD, RN, MA, PSC, etc. to clarify treatment plan or other needs, including coaching, informing, strategizing communication with clinical team, helping patient to formulate questions',
    },
  ]),
};

const MENTAL_HEALTH = {
  label: 'Intervention Techniques',
  interventions: withFieldNames([
    {
      name: 'ACT',
      description:
        'Metaphors, reflective listening, identifying feelings and feelings are not defining, "and" not "but," mindfulness techniques for noticing feelings',
    },
    {
      name: 'CBT',
      description:
        'Worksheets, behavioral activation, connecting thought/emotion and behaviors, education regarding cognitive distortions, insomnia/pain/relaxation techniques, cognitive reframing',
    },
    {
      name: 'DBT',
      description:
        'Skills based techniques looking at change and acceptance skills: Distress tolerance, emotion regulation, mindfulness, interpersonal effectiveness',
    },
    {
      name: 'Grief',
      description:
        'Validation of feelings/loss, reflective listening, coping/adapting, rituals, narrative, many types of loss, can be anticipatory, legacy work, meaning making, remembering, holding space',
    },
    {
      name: 'Meaning-Centered Psychotherapy',
      description:
        'Structured sessions utilizing homework assignments to explore historical, attitudinal, creative, and experiential sources of meaning, focusing on creating, experiencing, and keeping a sense of meaning and purpose in life',
    },
    {
      name: 'Mindfulness',
      description:
        'Skill building, guided imagery, relaxation response, body scan, breathing techniques, meditation, noticing/acknowledging, non-judgmental awareness, present-based, anxiety reduction',
    },
    {
      name: 'Motivational Interviewing',
      description:
        'Reflections, scaling, change, SMART goals, patient-led, Listening for Change: Desire for change, Ability to change, Reasons to change, Needing to change, Commitment to change, Activation re willingness to change, Taking steps toward change, identifying barriers and strengths',
    },
    {
      name: 'Narrative',
      description:
        'Meaning/value/purpose, life review, acknowledge rich history, telling cancer story, understanding of illness, palliative, goals of care, exploration of values, cultural context, reframing the story and offering alternative narrative via externalizing',
    },
    {
      name: 'Psycho-Education',
      description:
        'Educational information, grief versus depression, inflammatory process, parenting and aging developmental stages, sleep hygiene, practical, pain, normalizing, support groups/counseling, social work intro, suicide awareness, PHQ/GAD review, evaluating understanding',
    },
    {
      name: 'SMART',
      description:
        'SMART facilitators should mark when using SMART techniques one on one with a patient',
    },
    {
      name: 'Solution-Focused',
      description:
        'Present/future focused, goal oriented, identifying strengths/barriers to goals, scaling, miracle question, brief, prioritizing, problem-solving, specific to identified problem, measurable outcomes',
    },
    {
      name: 'Other Psychotherapy Techniques',
      description: '',
      fieldName: 'otherMentalHealthIntervention',
    },
  ]),
};

export const MENTAL_HEALTH_INTERVENTION_NAMES = MENTAL_HEALTH.interventions.map(
  (intervention) => intervention.name
);

export const MENTAL_HEALTH_FIELD_NAMES = MENTAL_HEALTH.interventions.map(
  (intervention) => intervention.fieldName
);

export const interventionGroups: Array<Array<InterventionGroup>> = [
  [ENCOUNTER_TYPE, CRISIS, SUPPORT_GROUP, SOCIAL_PRACTICAL],

  [ADVANCED_CARE_PLANNING, FAMILY, PSYCHOLOGICAL, MENTAL_HEALTH],

  [CARE_COORDINATION, FINANCIAL, HEALTH_LITERACY],
];

export const _communityInterventionGroups: Array<Array<InterventionGroup>> = [
  [CRISIS, SUPPORT_GROUP],

  [SOCIAL_PRACTICAL, FAMILY],

  [CARE_COORDINATION, FINANCIAL],
];

export const communityInterventionGroups = _communityInterventionGroups.map((column) =>
  column.map((group) => ({
    ...group,
    interventions: group.interventions.filter((intervention) => intervention.community),
  }))
);

const _interventions: Intervention[] = [];

const _communityInterventions: Intervention[] = [];

export const interventionOptions: InterventionOption[] = [];

export const communityInterventionOptions: InterventionOption[] = [];

interventionGroups.forEach((column) => {
  column.forEach((group) => {
    group.interventions.forEach((intervention) => {
      const option = {
        content: (
          <>
            <Header as="h4" content={intervention.name} subheader={group.label} />
            {intervention.description}
          </>
        ),
        text: `${intervention.name} ${intervention.description}`,
        value: intervention.fieldName,
      };

      _interventions.push(intervention);
      interventionOptions.push(option);

      if (intervention.community) {
        _communityInterventions.push(intervention);
        communityInterventionOptions.push(option);
      }
    });
  });
});

export const INTERVENTIONS = sortBy(_interventions, ['name']);

export const COMMUNITY_INTERVENTIONS = sortBy(_communityInterventions, ['name']);

export type InitialInterventionValues = {
  accessingAccurateMedicalInformation: boolean;
  act: boolean;
  adultProtection: boolean;
  assessmentReferral: boolean;
  assessmentUnderstandingTreatmentOptionsDiagnosis: boolean;
  assistingTalkingToHealthcareTeam: boolean;
  behavioralSafetyPlan: boolean;
  careCoordination: boolean;
  caregiverSupportiveCounselingEducation: boolean;
  cbt: boolean;
  childProtection: boolean;
  communityGrantFunds: boolean;
  customerService: boolean;
  deathWithDignity: boolean;
  distressScreen: boolean;
  documentation: boolean;
  employment: boolean;
  familyMeeting: boolean;
  food: boolean;
  gad: boolean;
  gadScore: string;
  goalsOfCare: boolean;
  grief: boolean;
  holidayFamilies: boolean;
  homeCareFacility: boolean;
  homelessness: boolean;
  insuranceAccessAssistance: boolean;
  interpersonalViolence: boolean;
  lodgingHousingShelter: boolean;
  managingWorkHomeLifeIllness: boolean;
  mandmMortalityAndMorbidity: boolean;
  mindfullness: boolean;
  moca: boolean;
  mocaScore: string;
  motivationalInterviewing: boolean;
  narrative: boolean;
  neuroCognitiveTesting: boolean;
  newDiagnosis: boolean;
  otherCommunityResources: boolean;
  otherMedicalBills: boolean;
  otherMentalHealthIntervention: boolean;
  palliativeCareHospice: boolean;
  patientSupportiveCounselingEducation: boolean;
  phq: boolean;
  phqScore: string;
  psychiatryPsychotherapy: boolean;
  psychotherapy: boolean;
  respiteCare: boolean;
  sciGrantFunds: boolean;
  sciRxAssistance: boolean;
  sciSupportiveCare: boolean;
  severeMentalIllness: boolean;
  sexualityIntimacyFertility: boolean;
  solutionFocused: boolean;
  spiritualExistential: boolean;
  statefederalIncome: boolean;
  substanceUse: boolean;
  suicidehomicide: boolean;
  supportForChildren: boolean;
  survivorship: boolean;
  swedishFinancialAssistance: boolean;
  transplantAssessment: boolean;
  transportation: boolean;

  // old fields
  advancedIllness?: boolean;
  facilitation?: boolean;
  formCompletion?: boolean;
  valuesAssessment?: boolean;
};

export type InitialCommunityInterventionValues = {
  adultProtection: boolean;
  assessmentReferral: boolean;
  careCoordination: boolean;
  caregiverSupportiveCounselingEducation: boolean;
  childProtection: boolean;
  communityGrantFunds: boolean;
  customerService: boolean;
  employment: boolean;
  food: boolean;
  homeCareFacility: boolean;
  homelessness: boolean;
  insuranceAccessAssistance: boolean;
  interpersonalViolence: boolean;
  lodgingHousingShelter: boolean;
  managingWorkHomeLifeIllness: boolean;
  otherCommunityResources: boolean;
  palliativeCareHospice: boolean;
  respiteCare: boolean;
  sciGrantFunds: boolean;
  sciSupportiveCare: boolean;
  severeMentalIllness: boolean;
  statefederalIncome: boolean;
  substanceUse: boolean;
  suicidehomicide: boolean;
  supportForChildren: boolean;
  transportation: boolean;
};

export const initialInterventionValues: InitialInterventionValues =
  {} as InitialInterventionValues;

export const communityInitialInterventionValues: InitialCommunityInterventionValues =
  {} as InitialCommunityInterventionValues;

INTERVENTIONS.forEach((intervention) => {
  if (intervention.scored) {
    initialInterventionValues[`${intervention.fieldName}Score`] = '';
  }

  initialInterventionValues[intervention.fieldName] = false;

  if (intervention.community) {
    communityInitialInterventionValues[intervention.fieldName] = false;
  }
});

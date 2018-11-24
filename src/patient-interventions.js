import camelcase from 'camelcase';
import React from 'react';
import slugify from 'slugify';
import { Header } from 'semantic-ui-react';
import { sortBy } from 'lodash';

export const interventionGroups = [
  [
    {
      label: 'Encounter Type',
      interventions: [
        {
          name: 'Distress Screen',
          description:
            'Initial contact on DS (1st/2nd call, letter, letter only, clinic visit), not for subsequent follow-up'
        },
        {
          name: 'Documentation',
          description:
            'When tracking an encounter where time/tasks includes documentation mark all categories that apply including Documentation. If completing documentation on the following day, enter a new encounter, mark Documentation only'
        },
        {
          name: 'Transplant Assessment',
          description:
            'Coordination, assessment for consideration for transplant, including coordination with solid organ transplant team in support of their assessment'
        }
      ]
    },

    {
      label: 'Crisis',
      interventions: [
        {
          name: 'Severe Mental Illness',
          description:
            'Schizophrenia, bipolar, major depression, anxiety, etc. Any mental health issue severe enough to need social work to support patient through treatment'
        },
        {
          name: 'Suicide/Homicide',
          description: 'Assessment for suicidal, homicidal ideation'
        },
        {
          name: 'Substance Use',
          description:
            'Assessment, support, referral for patient with SUD, including smoking cessation, AA'
        },
        {
          name: 'Homelessness',
          description: 'Imminent/chronic homelessness assessment, referral, coordination'
        },
        {
          name: 'Adult Protection',
          description: 'Referral to, coordination with APS'
        },
        {
          name: 'Child Protection',
          description: 'Referral to, coordination with CPS'
        },
        {
          name: 'Interpersonal Violence',
          description: 'Assessment, support, referral related to domestic violence'
        },
        {
          name: 'M&M (Mortality and Morbidity)',
          description:
            'Create encounter, mark M&M upon patient’s death in cases where severe MH, SUD, homelessness are thought to have contributed to patient’s death regardless of if you actually had an encounter that would typically be tracked'
        }
      ]
    },

    {
      label: 'Support Group Screening',
      interventions: [
        {
          name: 'Assessment, Referral',
          description: 'Research, discussion of, referral to support groups'
        }
      ]
    },

    {
      label: 'Social, Practical',
      interventions: [
        {
          name: 'Food',
          description: 'Food banks, Meals on Wheels, Chicken Soup Brigade'
        },
        {
          name: 'Transportation',
          description: 'ACS Road to Recovery, Hopelink, Paratransit, Access, Angel Flight'
        },
        {
          name: 'Lodging, Housing, Shelter',
          description: 'Information, referrals related to short-, long-term housing'
        },
        {
          name: 'Managing Work, Home Life, Illness',
          description: 'Cleaning for a Reason, home care, chore services, Caring Bridge, childcare'
        },
        {
          name: 'Holiday Families',
          description:
            'Communication, coordination with, or about patients for Holiday Families Program'
        },
        {
          name: 'Other Community Resources',
          description: 'Choose if referrals do not match other more specific categories'
        }
      ]
    }
  ],
  [
    {
      label: 'Advanced Care Planning',
      interventions: [
        {
          name: 'Facilitation',
          description:
            'End of life discussions, including hospice/palliative care, Death with Dignity, activity related to advance directives'
        },
        {
          name: 'Values Assessment',
          description: 'Assessment of patient values to aid in treatment, end of life planning'
        },
        {
          name: 'Advanced Illness',
          description: 'Emotional, educational counseling related to advanced stage disease'
        },
        {
          name: 'Death with Dignity',
          description:
            'Discussion, education, referrals, coordination with physicians, related to Death with Dignity'
        },
        {
          name: 'Form Completion',
          description: 'Helping patient complete advance directives'
        }
      ]
    },

    {
      label: 'Family, Caregiver',
      interventions: [
        {
          name: 'Caregiver: Supportive Counseling, Education',
          description:
            'Meeting with caregiver (with or without patient) for emotional, psychological support, information re caregiver role, resources'
        },
        {
          name: 'Family Meeting',
          description:
            'Facilitate communication amongst patient and two or more family, caregivers, and healthcare providers where discussion is focused on issues related to treatment, care, decision-making'
        },
        {
          name: 'Respite Care',
          description:
            'When caregiver is in need of services (if patient, use other categories), including in-home help with short-term custodial care placement, short-term assisted living placement, day program'
        }
      ]
    },

    {
      label: 'Psychological, Emotional',
      interventions: [
        {
          name: 'New Diagnosis',
          description: 'Interventions surrounding a new diagnosis, acute'
        },
        {
          name: 'Patient: Supportive Counseling, Education',
          description:
            'Interactions involving supportive listening, validation, encouragement, other therapeutic interventions. Excludes survivorship, caregiver support'
        },
        {
          name: 'Sexuality, Intimacy, Fertility',
          description:
            'Assessment, information, referral related to sexuality, intimacy, fertility'
        },
        {
          name: 'Spiritual, Existential',
          description:
            'Spiritual assessment, including spirituality, belief systems, faith, religion, existential issues related to meaning/purpose, referrals to chaplain, spiritual leader, faith community'
        },
        {
          name: 'Survivorship',
          description:
            'Supportive counseling, education, referrals for programs focused on survivorship issues, primarily for post-treatment, maintenance'
        },

        {
          name: 'PHQ',
          description:
            'Mark when you have completed a PHQ with the patient in the encounter you are tracking, input the score',
          scored: true
        },

        {
          name: 'GAD',
          description:
            'Mark when you have completed a GAD with the patient in the encounter you are tracking, input the score',
          scored: true
        },

        {
          name: 'MoCA',
          description:
            'Mark when you have completed a MoCA with the patient in the encounter you are tracking, input the score',
          scored: true
        }
      ]
    }
  ],
  [
    {
      label: 'Care Coordination',
      interventions: [
        {
          name: 'Customer Service',
          description:
            'Introducing support services, quick check-ins, service recovery, patient relations'
        },
        {
          name: 'Care Coordination',
          description:
            'Communication with healthcare team to include MD, RN, MA, PSC, outside care team members, case managers, other social workers. Excludes Palliative Care, Hospice, Psychiatry, Psychotherapy, Home Health, which should be tracked using the more specific categories'
        },
        {
          name: 'Home Care, Facility',
          description:
            'Referrals, coordination, communication with home health, private duty caregiving, and facility, includes pre-discharge planning'
        },
        {
          name: 'Palliative Care, Hospice',
          description:
            'Referral, coordination with palliative care/hospice agency, including internal care coordination with Swedish Palliative Care team'
        },
        {
          name: 'Neuro-Cognitive Testing',
          description:
            'Referral, coordination for neurological/cognitive assessment, treatment; excludes completion of MoCA, which should be tracked using the more specific category'
        },
        {
          name: 'Psychiatry, Psychotherapy',
          description: 'Research, referrals, coordination with psychiatry/psychotherapy resources'
        },
        {
          name: 'Behavioral, Safety Plan',
          description:
            'Patient behavior challenges, including consult with staff, patient, family member, drafting behavioral agreement'
        },
        {
          name: 'External Supportive Care',
          description:
            'Complementary, alternative medicine outside of SCI, including Swedish resources not associated with the Cancer Institute (e.g. acupuncture through the pain clinic), plus community resources'
        },
        {
          name: 'SCI Supportive Care',
          description:
            'SCI Nutrition Counseling, Northwest Natural Health, Monroe Massage at SCI, Cancer Rehabilitation, Art & Music Therapy'
        }
      ]
    },

    {
      label: 'Financial, Legal',
      interventions: [
        {
          name: 'SCI Grant Funds',
          description: 'Discussion, facilitation of SCI grant funds'
        },
        {
          name: 'Community Grant Funds',
          description:
            'Cancer Lifeline, LLS, other organizations providing direct funding to patients'
        },
        {
          name: 'Insurance Access, Assistance',
          description:
            'Education, advocacy, referral on Medicare, Medicaid, Medicare Savings, COBRA, Healthcare Exchange, referral to PFA, SHIBA'
        },
        {
          name: 'Swedish Financial Assistance',
          description:
            'Information re financial assistance, providing application, coordination, advocacy'
        },
        {
          name: 'Employment',
          description:
            'Employment concerns, FMLA, talking with HR, work accommodations, referrals to Cancer & Careers, Bureau of Labor, career or job assistance, scholarships'
        },
        {
          name: 'State/Federal Income',
          description:
            'Benefits consultation, assistance with SSI, SSDI, Food Stamps, LIHEAP, TANF'
        }
      ]
    },

    {
      label: 'Health Literacy',
      interventions: [
        {
          name: 'Accessing Accurate Medical Information',
          description:
            'Talking to patient re where to find reputable resources for medical information'
        },
        {
          name: 'Assessment: Understanding Treatment Options, Diagnosis',
          description:
            'Understanding of illness, if it is a values assessment track under ACP instead'
        },
        {
          name: 'Assisting: Talking to Healthcare Team',
          description:
            'Communication assistance between patient and MD, RN, MA, PSC, etc. to clarify treatment plan or other needs, including coaching, informing, strategizing communication with clinical team, helping patient to formulate questions'
        }
      ]
    }
  ]
];

const _interventions = [];

export const interventionOptions = [];

interventionGroups.forEach(column => {
  column.forEach(group => {
    group.interventions.forEach(intervention => {
      // eslint-disable-next-line
      intervention.fieldName = camelcase(
        slugify(intervention.name, { lower: true, remove: /[^a-zA-Z0-9 -]/ })
      );

      _interventions.push(intervention);

      interventionOptions.push({
        content: (
          <React.Fragment>
            <Header as="h4" content={intervention.name} subheader={group.label} />
            {intervention.description}
          </React.Fragment>
        ),
        key: intervention.fieldName,
        text: intervention.name,
        value: intervention.fieldName
      });
    });
  });
});

export const interventions = sortBy(_interventions, ['name']);

export const initialInterventionValues = {};

interventions.forEach(intervention => {
  if (intervention.scored) {
    initialInterventionValues[`${intervention.fieldName}-scored`] = '';
  }

  initialInterventionValues[intervention.fieldName] = false;
});

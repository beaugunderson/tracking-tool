import slugify from 'slugify';
import { sortBy } from 'lodash';

export const interventionGroups = [
  [
    {
      label: 'Encounter Type',
      interventions: [
        {
          name: 'Distress Screen',
          description: ''
        },
        {
          name: 'Documentation',
          description: ''
        },
        {
          name: 'Transplant Assessment',
          description: ''
        }
      ]
    },

    {
      label: 'Crisis',
      interventions: [
        {
          name: 'Severe Mental Illness',
          description: ''
        },
        {
          name: 'Suicide/Homicide',
          description: ''
        },
        {
          name: 'Substance Use',
          description: ''
        },
        {
          name: 'Homelessness',
          description: ''
        },
        {
          name: 'Adult Protection',
          description: ''
        },
        {
          name: 'Child Protection',
          description: ''
        },
        {
          name: 'Interpersonal Violence',
          description: ''
        },
        {
          name: 'M&M (Mortality and Morbidity)',
          description: ''
        }
      ]
    },

    {
      label: 'Support Group Screening',
      interventions: [
        {
          name: 'Assessment, Referral',
          description: ''
        }
      ]
    },

    {
      label: 'Social, Practical',
      interventions: [
        {
          name: 'Food',
          description: ''
        },
        {
          name: 'Transportation',
          description: ''
        },
        {
          name: 'Lodging, Housing, Shelter',
          description: ''
        },
        {
          name: 'Managing Work, Home Life, Illness',
          description: ''
        },
        {
          name: 'Holiday Families',
          description: ''
        },
        {
          name: 'Other Community Resources',
          description: ''
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
          description: ''
        },
        {
          name: 'Values Assessment',
          description: ''
        },
        {
          name: 'Advanced Illness',
          description: ''
        },
        {
          name: 'Death with Dignity',
          description: ''
        },
        {
          name: 'Form Completion',
          description: ''
        }
      ]
    },

    {
      label: 'Family, Caregiver',
      interventions: [
        {
          name: 'Caregiver: Supportive Counseling, Education',
          description: ''
        },
        {
          name: 'Family Meeting',
          description: ''
        },
        {
          name: 'Respite Care',
          description: ''
        }
      ]
    },

    {
      label: 'Psychological, Emotional',
      interventions: [
        {
          name: 'New Diagnosis',
          description: ''
        },
        {
          name: 'Patient: Supportive Counseling, Education',
          description: ''
        },
        {
          name: 'Sexuality, Intimacy, Fertility',
          description: ''
        },
        {
          name: 'Spiritual, Existential',
          description: ''
        },
        {
          name: 'Survivorship',
          description: ''
        },

        {
          name: 'PHQ',
          description: '',
          scored: true
        },

        {
          name: 'GAD',
          description: '',
          scored: true
        },

        {
          name: 'MoCA',
          description: '',
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
          description: ''
        },
        {
          name: 'Care Coordination',
          description: ''
        },
        {
          name: 'Home Health, Private Duty',
          description: ''
        },
        {
          name: 'Palliative Care, Hospice',
          description: ''
        },
        {
          name: 'Neuro-Cognitive Testing',
          description: ''
        },
        {
          name: 'Psychiatry, Psychotherapy',
          description: ''
        },
        {
          name: 'Behavioral, Safety Plan',
          description: ''
        },
        {
          name: 'External Supportive Care',
          description: ''
        },
        {
          name: 'SCI Supportive Care',
          description: ''
        }
      ]
    },

    {
      label: 'Financial, Legal',
      interventions: [
        {
          name: 'SCI Grant Funds',
          description: ''
        },
        {
          name: 'Community Grant Funds',
          description: ''
        },
        {
          name: 'Insurance Access, Assistance',
          description: ''
        },
        {
          name: 'Swedish Financial Assistance',
          description: ''
        },
        {
          name: 'Employment',
          description: ''
        },
        {
          name: 'State/Federal Income',
          description: ''
        },
        {
          name: 'VA Benefits',
          description: ''
        }
      ]
    },

    {
      label: 'Health Literacy',
      interventions: [
        {
          name: 'Accessing Accurate Medical Information',
          description: ''
        },
        {
          name: 'Assessment: Understanding Treatment Options, Diagnosis',
          description: ''
        },
        {
          name: 'Assisting: Talking to Healthcare Team',
          description: ''
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
      intervention.fieldName = slugify(intervention.name, { lower: true });

      _interventions.push(intervention);

      interventionOptions.push({
        key: intervention.fieldName,
        value: intervention.fieldName,
        text: intervention.name
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

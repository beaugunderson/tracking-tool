export type option = {
  value: string;
  text: string;
};

import { mapValues } from 'lodash';
import { DOCTORS as RAW_DOCTORS } from './doctors';

function makeOptions(options: string[]): option[] {
  return options.map(option => ({ value: option, text: option }));
}

const BREAST_SURGERY = 'Breast Surgery';
const COLORECTAL_SURGERY = 'Colorectal Surgery';
const GYN_ONC = 'Gyn Onc';
const HEAD_NECK_SURGERY = 'Head/Neck Surgery';
const HEMATOLOGY = 'Hematology';
const INPATIENT = 'Inpatient';
const IVY = 'Ivy';
const MEDICAL_ONCOLOGY = 'Medical Oncology';
const NON_SCI_MD = 'Non-SCI MD';
const PALLIATIVE_CARE = 'Palliative Care';
const RADIATION_ONCOLOGY = 'Radiation Oncology';
const RADIOSURGERY = 'Radiosurgery';
const THORACIC_SURGERY = 'Thoracic Surgery';

// Only used for Staff encounters
export const TREATMENT_CENTER = 'Treatment Center';

export const CLINICS = [
  BREAST_SURGERY,
  COLORECTAL_SURGERY,
  GYN_ONC,
  HEAD_NECK_SURGERY,
  HEMATOLOGY,
  INPATIENT,
  IVY,
  MEDICAL_ONCOLOGY,
  NON_SCI_MD,
  PALLIATIVE_CARE,
  RADIATION_ONCOLOGY,
  RADIOSURGERY,
  THORACIC_SURGERY
];

export const CLINIC_OPTIONS = makeOptions(CLINICS);

export const STAFF_CLINIC_OPTIONS = makeOptions(CLINICS.concat([TREATMENT_CENTER]).sort());

export const DIAGNOSES = makeOptions(['Malignant', 'Benign/Other', 'Unknown']);

export const DOCTORS = makeOptions(RAW_DOCTORS);

export const ENCOUNTER_TYPES = makeOptions(['All', 'Patient', 'Community', 'Staff', 'Other']);

type EncounterTypeNames = { [key: string]: any };

export const ENCOUNTER_TYPE_NAMES: EncounterTypeNames = {
  patient: 'Patient',
  community: 'Community',
  staff: 'Staff',
  other: 'Other'
};

const BALLARD = 'Ballard';
const CHERRY_HILL = 'Cherry Hill';
const EDMONDS = 'Edmonds';
const ISSAQUAH = 'Issaquah';
const FIRST_HILL = 'First Hill';
const TRUE_CANCER_CENTER = 'True Cancer Center';

export const LOCATIONS = [BALLARD, CHERRY_HILL, EDMONDS, ISSAQUAH, FIRST_HILL, TRUE_CANCER_CENTER];

export const LOCATION_OPTIONS = makeOptions(LOCATIONS);

export const COMMUNITY_LOCATION_OPTIONS = makeOptions(
  LOCATIONS.filter(location => location !== TRUE_CANCER_CENTER)
);

export const STAGES = makeOptions(['Unknown', 'Early', 'Advanced']);

export const CLINIC_LOCATIONS = {
  [BALLARD]: [INPATIENT, MEDICAL_ONCOLOGY, NON_SCI_MD],

  [CHERRY_HILL]: [INPATIENT, IVY, RADIOSURGERY],

  [EDMONDS]: [
    COLORECTAL_SURGERY,
    HEAD_NECK_SURGERY,
    INPATIENT,
    MEDICAL_ONCOLOGY,
    NON_SCI_MD,
    PALLIATIVE_CARE,
    RADIATION_ONCOLOGY
  ],

  [ISSAQUAH]: [
    BREAST_SURGERY,
    COLORECTAL_SURGERY,
    INPATIENT,
    MEDICAL_ONCOLOGY,
    NON_SCI_MD,
    RADIATION_ONCOLOGY,
    THORACIC_SURGERY
  ],

  [FIRST_HILL]: [
    BREAST_SURGERY,
    COLORECTAL_SURGERY,
    GYN_ONC,
    HEAD_NECK_SURGERY,
    HEMATOLOGY,
    INPATIENT,
    MEDICAL_ONCOLOGY,
    NON_SCI_MD,
    PALLIATIVE_CARE,
    RADIATION_ONCOLOGY,
    THORACIC_SURGERY
  ],

  [TRUE_CANCER_CENTER]: [
    BREAST_SURGERY,
    INPATIENT,
    MEDICAL_ONCOLOGY,
    NON_SCI_MD,
    PALLIATIVE_CARE,
    RADIATION_ONCOLOGY
  ]
};

export const CLINIC_LOCATION_OPTIONS = mapValues(CLINIC_LOCATIONS, locations =>
  makeOptions(locations)
);

export const CLINIC_LOCATION_STAFF_OPTIONS = mapValues(CLINIC_LOCATIONS, (locations, clinic) =>
  makeOptions(clinic !== CHERRY_HILL ? locations.concat([TREATMENT_CENTER]) : locations)
);

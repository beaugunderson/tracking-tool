import { mapValues } from 'lodash';

export type Option = {
  value: string;
  text: string;
};

function makeOptions(options: readonly string[]): Option[] {
  return options.map((option) => ({ value: option, text: option }));
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
  THORACIC_SURGERY,
] as const;

export const CLINIC_OPTIONS = makeOptions(CLINICS);

export const STAFF_CLINIC_OPTIONS = makeOptions([...CLINICS, TREATMENT_CENTER]).sort();

export const DIAGNOSES = makeOptions(['Malignant', 'Benign/Other', 'Unknown']);

export const ENCOUNTER_TYPES = makeOptions(['All', 'Patient', 'Community', 'Staff', 'Other']);

type EncounterTypeNames = { [key: string]: any };

export const ENCOUNTER_TYPE_NAMES: EncounterTypeNames = {
  patient: 'Patient',
  community: 'Community',
  staff: 'Staff',
  other: 'Other',
} as const;

const BALLARD = 'Ballard';
const CHERRY_HILL = 'Cherry Hill';
const EDMONDS = 'Edmonds';
const ISSAQUAH = 'Issaquah';
const FIRST_HILL = 'First Hill';
const TRUE_CANCER_CENTER = 'True Cancer Center';

export const LOCATIONS = [
  BALLARD,
  CHERRY_HILL,
  EDMONDS,
  ISSAQUAH,
  FIRST_HILL,
  TRUE_CANCER_CENTER,
] as const;

export const LOCATION_OPTIONS = makeOptions(LOCATIONS);

export const COMMUNITY_LOCATION_OPTIONS = makeOptions(
  LOCATIONS.filter((location) => location !== TRUE_CANCER_CENTER)
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
    RADIATION_ONCOLOGY,
  ],

  [ISSAQUAH]: [
    BREAST_SURGERY,
    COLORECTAL_SURGERY,
    INPATIENT,
    MEDICAL_ONCOLOGY,
    NON_SCI_MD,
    RADIATION_ONCOLOGY,
    THORACIC_SURGERY,
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
    THORACIC_SURGERY,
  ],

  [TRUE_CANCER_CENTER]: [
    BREAST_SURGERY,
    INPATIENT,
    MEDICAL_ONCOLOGY,
    NON_SCI_MD,
    PALLIATIVE_CARE,
    RADIATION_ONCOLOGY,
  ],
} as const;

export const CLINIC_LOCATION_OPTIONS = mapValues(CLINIC_LOCATIONS, (locations) =>
  makeOptions(locations)
);

export const CLINIC_LOCATION_STAFF_OPTIONS = mapValues(CLINIC_LOCATIONS, (locations, clinic) =>
  makeOptions(
    clinic !== CHERRY_HILL && clinic !== TRUE_CANCER_CENTER
      ? [...locations, TREATMENT_CENTER]
      : locations
  )
);

export const COMMUNITY = 'Community';

// TODO: remove this when we upgrade react-scripts to stable
// eslint-disable-next-line no-shadow
export enum ROW_TYPE {
  OSW = 'OSW',
  INTERNS = 'Interns',
  STAFF_SUPPORT = 'Staff Support',
}

export const MONTHLY_REPORT_OPTIONS = [
  [BALLARD, INPATIENT, [ROW_TYPE.OSW, ROW_TYPE.INTERNS, ROW_TYPE.STAFF_SUPPORT]],
  [BALLARD, MEDICAL_ONCOLOGY, [ROW_TYPE.OSW, ROW_TYPE.INTERNS, ROW_TYPE.STAFF_SUPPORT]],
  [BALLARD, NON_SCI_MD, [ROW_TYPE.OSW, ROW_TYPE.INTERNS, ROW_TYPE.STAFF_SUPPORT]],
  [BALLARD, TREATMENT_CENTER, [ROW_TYPE.STAFF_SUPPORT]],
  [BALLARD, COMMUNITY, [ROW_TYPE.OSW, ROW_TYPE.INTERNS]],

  [CHERRY_HILL, INPATIENT, [ROW_TYPE.OSW, ROW_TYPE.INTERNS, ROW_TYPE.STAFF_SUPPORT]],
  [CHERRY_HILL, IVY, [ROW_TYPE.OSW, ROW_TYPE.INTERNS, ROW_TYPE.STAFF_SUPPORT]],
  [CHERRY_HILL, RADIOSURGERY, [ROW_TYPE.OSW, ROW_TYPE.INTERNS, ROW_TYPE.STAFF_SUPPORT]],
  [CHERRY_HILL, COMMUNITY, [ROW_TYPE.OSW, ROW_TYPE.INTERNS]],

  [EDMONDS, COLORECTAL_SURGERY, [ROW_TYPE.OSW, ROW_TYPE.INTERNS, ROW_TYPE.STAFF_SUPPORT]],
  [EDMONDS, HEAD_NECK_SURGERY, [ROW_TYPE.OSW, ROW_TYPE.INTERNS, ROW_TYPE.STAFF_SUPPORT]],
  [EDMONDS, INPATIENT, [ROW_TYPE.OSW, ROW_TYPE.INTERNS, ROW_TYPE.STAFF_SUPPORT]],
  [EDMONDS, MEDICAL_ONCOLOGY, [ROW_TYPE.OSW, ROW_TYPE.INTERNS, ROW_TYPE.STAFF_SUPPORT]],
  [EDMONDS, NON_SCI_MD, [ROW_TYPE.OSW, ROW_TYPE.INTERNS, ROW_TYPE.STAFF_SUPPORT]],
  [EDMONDS, PALLIATIVE_CARE, [ROW_TYPE.OSW, ROW_TYPE.INTERNS, ROW_TYPE.STAFF_SUPPORT]],
  [EDMONDS, RADIATION_ONCOLOGY, [ROW_TYPE.OSW, ROW_TYPE.INTERNS, ROW_TYPE.STAFF_SUPPORT]],
  [EDMONDS, TREATMENT_CENTER, [ROW_TYPE.STAFF_SUPPORT]],
  [EDMONDS, COMMUNITY, [ROW_TYPE.OSW, ROW_TYPE.INTERNS]],

  [ISSAQUAH, BREAST_SURGERY, [ROW_TYPE.OSW, ROW_TYPE.INTERNS, ROW_TYPE.STAFF_SUPPORT]],
  [ISSAQUAH, COLORECTAL_SURGERY, [ROW_TYPE.OSW, ROW_TYPE.INTERNS, ROW_TYPE.STAFF_SUPPORT]],
  [ISSAQUAH, INPATIENT, [ROW_TYPE.OSW, ROW_TYPE.INTERNS, ROW_TYPE.STAFF_SUPPORT]],
  [ISSAQUAH, MEDICAL_ONCOLOGY, [ROW_TYPE.OSW, ROW_TYPE.INTERNS, ROW_TYPE.STAFF_SUPPORT]],
  [ISSAQUAH, NON_SCI_MD, [ROW_TYPE.OSW, ROW_TYPE.INTERNS, ROW_TYPE.STAFF_SUPPORT]],
  [ISSAQUAH, RADIATION_ONCOLOGY, [ROW_TYPE.OSW, ROW_TYPE.INTERNS, ROW_TYPE.STAFF_SUPPORT]],
  [ISSAQUAH, THORACIC_SURGERY, [ROW_TYPE.OSW, ROW_TYPE.INTERNS, ROW_TYPE.STAFF_SUPPORT]],
  [ISSAQUAH, TREATMENT_CENTER, [ROW_TYPE.STAFF_SUPPORT]],
  [ISSAQUAH, COMMUNITY, [ROW_TYPE.OSW, ROW_TYPE.INTERNS]],

  [FIRST_HILL, BREAST_SURGERY, [ROW_TYPE.OSW, ROW_TYPE.INTERNS, ROW_TYPE.STAFF_SUPPORT]],
  [FIRST_HILL, COLORECTAL_SURGERY, [ROW_TYPE.OSW, ROW_TYPE.INTERNS, ROW_TYPE.STAFF_SUPPORT]],
  [FIRST_HILL, GYN_ONC, [ROW_TYPE.OSW, ROW_TYPE.INTERNS, ROW_TYPE.STAFF_SUPPORT]],
  [FIRST_HILL, HEAD_NECK_SURGERY, [ROW_TYPE.OSW, ROW_TYPE.INTERNS, ROW_TYPE.STAFF_SUPPORT]],
  [FIRST_HILL, HEMATOLOGY, [ROW_TYPE.OSW, ROW_TYPE.INTERNS, ROW_TYPE.STAFF_SUPPORT]],
  [FIRST_HILL, INPATIENT, [ROW_TYPE.OSW, ROW_TYPE.INTERNS, ROW_TYPE.STAFF_SUPPORT]],
  [FIRST_HILL, MEDICAL_ONCOLOGY, [ROW_TYPE.OSW, ROW_TYPE.INTERNS, ROW_TYPE.STAFF_SUPPORT]],
  [FIRST_HILL, NON_SCI_MD, [ROW_TYPE.OSW, ROW_TYPE.INTERNS, ROW_TYPE.STAFF_SUPPORT]],
  [FIRST_HILL, PALLIATIVE_CARE, [ROW_TYPE.OSW, ROW_TYPE.INTERNS, ROW_TYPE.STAFF_SUPPORT]],
  [FIRST_HILL, RADIATION_ONCOLOGY, [ROW_TYPE.OSW, ROW_TYPE.INTERNS, ROW_TYPE.STAFF_SUPPORT]],
  [FIRST_HILL, THORACIC_SURGERY, [ROW_TYPE.OSW, ROW_TYPE.INTERNS, ROW_TYPE.STAFF_SUPPORT]],
  [FIRST_HILL, TREATMENT_CENTER, [ROW_TYPE.STAFF_SUPPORT]],
  [FIRST_HILL, COMMUNITY, [ROW_TYPE.OSW, ROW_TYPE.INTERNS]],

  [TRUE_CANCER_CENTER, BREAST_SURGERY, [ROW_TYPE.OSW, ROW_TYPE.INTERNS, ROW_TYPE.STAFF_SUPPORT]],
  [TRUE_CANCER_CENTER, INPATIENT, [ROW_TYPE.OSW, ROW_TYPE.INTERNS, ROW_TYPE.STAFF_SUPPORT]],
  [TRUE_CANCER_CENTER, MEDICAL_ONCOLOGY, [ROW_TYPE.OSW, ROW_TYPE.INTERNS, ROW_TYPE.STAFF_SUPPORT]],
  [TRUE_CANCER_CENTER, NON_SCI_MD, [ROW_TYPE.OSW, ROW_TYPE.INTERNS, ROW_TYPE.STAFF_SUPPORT]],
  [TRUE_CANCER_CENTER, PALLIATIVE_CARE, [ROW_TYPE.OSW, ROW_TYPE.INTERNS, ROW_TYPE.STAFF_SUPPORT]],
  [
    TRUE_CANCER_CENTER,
    RADIATION_ONCOLOGY,
    [ROW_TYPE.OSW, ROW_TYPE.INTERNS, ROW_TYPE.STAFF_SUPPORT],
  ],
] as const;

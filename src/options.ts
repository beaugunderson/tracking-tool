import { DOCTORS as RAW_DOCTORS } from './doctors';

function makeOptions(options: string[]) {
  return options.map(option => ({ value: option, text: option }));
}

export const CLINICS = makeOptions([
  'Breast Surgery',
  'Colorectal Surgery',
  'Gyn Onc',
  'Head/Neck Surgery',
  'Hematology',
  'Inpatient',
  'Ivy',
  'Medical Oncology',
  'Non-SCI MD',
  'Palliative Care',
  'Radiation Oncology',
  'Radiosurgery',
  'Thoracic Surgery'
]);

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

export const LOCATIONS = makeOptions([
  'Ballard',
  'Cherry Hill',
  'Edmonds',
  'Issaquah',
  'First Hill',
  'True Cancer Center'
]);

export const STAGES = makeOptions(['Unknown', 'Early', 'Advanced']);

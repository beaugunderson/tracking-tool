import { DOCTORS as RAW_DOCTORS } from './doctors';

function makeOptions(options) {
  return options.map(option => ({ value: option, text: option }));
}

export const DOCTORS = makeOptions(RAW_DOCTORS);

export const LOCATIONS = makeOptions([
  'Ballard',
  'Cherry Hill',
  'Edmonds',
  'Issaquah',
  'First Hill',
  'True Cancer Center'
]);

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

export const STAGES = makeOptions(['Unknown', 'Early', 'Advanced']);

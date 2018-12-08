import faker from 'faker';
import moment from 'moment';
import { DOCTORS } from './doctors';
import { INITIAL_VALUES, PatientEncounter } from './forms/PatientEncounterForm';
import { interventions } from './patient-interventions';
import { sample, sampleSize, times } from 'lodash';

export function insertExamples(encounters: Nedb) {
  function insertExample() {
    const sampledInterventions = sampleSize(interventions, 1 + Math.floor(Math.random() * 5));
    const interventionValues = {};

    for (const intervention of sampledInterventions) {
      interventionValues[intervention.fieldName] = true;
    }

    const doc: PatientEncounter = {
      ...INITIAL_VALUES,
      ...interventionValues,
      patientName: faker.fake('{{name.lastName}}, {{name.firstName}} {{name.firstName}}'),
      dateOfBirth: moment(faker.date.past()).format('YYYY-MM-DD'),
      diagnosisType: sample(['Malignant', 'Benign/Other', 'Unknown']),
      diagnosisFreeText: sample(['Colon cancer', 'Breast cancer', 'Finger cancer']),
      diagnosisStage: sample(['Early', 'Advanced']),
      encounterType: 'patient',
      location: sample([
        'Ballard',
        'Cherry Hill',
        'Edmonds',
        'Issaquah',
        'First Hill',
        'True Cancer Center'
      ]),
      clinic: sample([
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
      ]),
      encounterDate: moment(faker.date.recent(30)).format('YYYY-MM-DD'),
      md: sampleSize(DOCTORS, Math.random() > 0.75 ? 2 : 1),
      mrn: `100${Math.random()
        .toString()
        .slice(2, 9)}`,
      numberOfTasks: `${1 + Math.floor(Math.random() * 5)}`,
      research: sample([false, true]),
      timeSpent: `${Math.ceil((Math.random() * 60) / 5) * 5}`
    };

    encounters.insert(doc);
  }

  times(150, insertExample);
}

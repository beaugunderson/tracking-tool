import faker from 'faker';
import moment from 'moment';
import { INITIAL_VALUES, PatientEncounter } from './forms/PatientEncounterForm';
import { sample, times } from 'lodash';

export function insertExamples(encounters: Nedb) {
  function insertExample() {
    const doc: PatientEncounter = {
      ...INITIAL_VALUES,
      patientName: faker.fake('{{name.lastName}}, {{name.firstName}}'),
      dateOfBirth: moment(faker.date.past()).format('YYYY-MM-DD'),
      diagnosisFreeText: sample(['Colon cancer', 'Breast cancer', 'Finger cancer']) || '',
      diagnosisStage: sample(['Early', 'Advanced']) || '',
      encounterType: 'patient',
      location:
        sample(
          ['Ballard', 'Cherry Hill', 'Edmonds', 'Issaquah', 'First Hill', 'True Cancer Center']
        ) || '',
      clinic:
        sample(
          [
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
          ]
        ) || '',
      encounterDate: moment(faker.date.past()).format('YYYY-MM-DD'),
      md: [sample(['Dr. A', 'Dr. B']) || ''],
      mrn: `100${Math.floor(Math.random() * 100000)}`,
      numberOfTasks: `${Math.floor(Math.random() * 5)}`,
      research: sample([false, true]) || false,
      timeSpent: `${Math.floor(Math.random() * 60)}`
    };

    encounters.insert(doc);
  }

  times(150, insertExample);
}

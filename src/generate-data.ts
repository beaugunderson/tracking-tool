import faker from 'faker';
import moment from 'moment';
import { CLINICS, LOCATIONS } from './options';
import { DOCTORS } from './doctors';
import { INITIAL_VALUES, PatientEncounter } from './forms/PatientEncounterForm';
import { INTERVENTIONS } from './patient-interventions';
import { sample, sampleSize, times } from 'lodash';

function doctors() {
  return sampleSize(DOCTORS, Math.random() > 0.75 ? 2 : 1);
}

function location() {
  return sample(LOCATIONS);
}

function clinic() {
  return sample(CLINICS);
}

function diagnosis() {
  const diagnosisType = sample(['Malignant', 'Benign/Other', 'Unknown']);

  if (diagnosisType !== 'Malignant') {
    return { diagnosisType };
  }

  return {
    diagnosisType,
    diagnosisFreeText: sample([
      'Colon',
      'Breast',
      'Sarcoma',
      'Lung',
      'Tongue',
      'Hepatocellular',
      'CLL',
      'ALL'
    ]),
    diagnosisStage: sample(['Unknown', 'Early', 'Advanced'])
  };
}

function fakePatient() {
  return {
    patientName: faker.fake('{{name.lastName}}, {{name.firstName}} {{name.firstName}}'),

    dateOfBirth: moment(faker.date.past(115)).format('YYYY-MM-DD'),

    diagnosis: diagnosis(),

    location: location(),

    clinic: clinic(),

    md: doctors(),

    mrn: `100${Math.random()
      .toString()
      .slice(2, 9)}`,

    providenceMrn: `600${Math.random()
      .toString()
      .slice(2, 10)}`,

    limitedEnglishProficiency: sample([false, true]),
    research: sample([false, true])
  };
}

export function insertExamples(encounters: Nedb) {
  const records = Math.floor(Math.random() * 150);

  // pre-generate fake patients so we can have multiple encounters per patient
  const patients = times(records, fakePatient);

  function insertExample() {
    const patient = sample(patients) as any;

    const sampledInterventions = sampleSize(INTERVENTIONS, 1 + Math.floor(Math.random() * 5));
    const interventionValues: { [key: string]: boolean | string } = {};

    for (const intervention of sampledInterventions) {
      interventionValues[intervention.fieldName] = true;
    }

    if (sampledInterventions.some(i => i.fieldName === 'gad')) {
      interventionValues.gadScore = sample([`${Math.floor(Math.random() * 20)}`, 'n/a']);
    }

    if (sampledInterventions.some(i => i.fieldName === 'moca')) {
      interventionValues.mocaScore = sample([`${Math.floor(Math.random() * 50)}`, 'n/a']);
    }

    if (sampledInterventions.some(i => i.fieldName === 'phq')) {
      interventionValues.phqScore = sample([`${Math.floor(Math.random() * 25)}`, 'n/a']);
    }

    // 10% of the time generate a new diagnosis
    const patientDiagnosis = Math.random() > 0.1 ? patient.diagnosis : diagnosis();

    const doc: PatientEncounter = {
      ...INITIAL_VALUES(),

      ...interventionValues,

      ...patient,

      ...patientDiagnosis,

      encounterDate: moment(faker.date.recent(30)).format('YYYY-MM-DD'),
      encounterType: 'patient',

      // 20% of the time generate new location for a given patient
      location: Math.random() > 0.2 ? patient.location : location(),

      // 40% of the time generate new clinic for a given patient
      clinic: Math.random() > 0.4 ? patient.clinic : clinic(),

      // 20% of the time generate new MDs for a given patient
      md: Math.random() > 0.2 ? patient.md : doctors(),

      // 10% of the time flip the research flag
      research: Math.random() > 0.1 ? patient.research : !patient.research,

      numberOfTasks: `${1 + Math.floor(sampledInterventions.length * Math.random())}`,

      timeSpent: `${Math.ceil((Math.random() * sampledInterventions.length * 10) / 5) * 5}`
    };

    encounters.insert(doc);
  }

  times(records, insertExample);
}

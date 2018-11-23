// @flow

import './App.css';

import React from 'react';
import { Checkbox, Divider, Dropdown, Grid, Header, Input, Form, Popup } from 'semantic-ui-react';
import { DOCTORS } from './doctors';
import { openEncounters } from './data';
import { Formik } from 'formik';
import { InfoButton } from './InfoButton';
import {
  initialInterventionValues,
  interventionGroups,
  interventionOptions
} from './patient-interventions';
import { isEmpty, sortBy } from 'lodash';

function makeOptions(options) {
  return options.map(option => ({ value: option, text: option }));
}

const DOCTOR_OPTIONS = makeOptions(DOCTORS);

const LOCATIONS = makeOptions([
  'Ballard',
  'Cherry Hill',
  'Edmonds',
  'Issaquah',
  'First Hill',
  'True Cancer Center'
]);

const CLINICS = makeOptions([
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

const DIAGNOSES = makeOptions(['Malignant', 'Benign', 'Unknown']);

const STAGES = makeOptions(['Unknown', 'Early', 'Advanced']);

function today() {
  const date = new Date();

  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());

  return date.toJSON().slice(0, 10);
}

const INITIAL_VALUES = {
  clinic: '',
  dateOfBirth: '',
  diagnosisFreeText: '',
  diagnosisStage: '',
  diagnosisType: '',
  encounterDate: today(),
  location: '',
  md: [],
  mrn: '',
  numberOfTasks: '',
  patientName: '',
  research: false,
  timeSpent: '',
  ...initialInterventionValues
};

const REQUIRED_FIELDS = [
  'clinic',
  'dateOfBirth',
  'diagnosisType',
  'encounterDate',
  'location',
  'md',
  'patientName'
];

const NUMERIC_FIELDS = ['mrn', 'numberOfTasks', 'timeSpent'];

type PatientEncounterFormProps = {
  onCancel: () => void,
  onComplete: () => void,
  onError: Error => void
};

type PatientEncounterFormState = {
  patientOptions: { key: string, text: string, value: string, encounter: ?{} }[],
  show: ?string
};

export class PatientEncounterForm extends React.Component<
  PatientEncounterFormProps,
  PatientEncounterFormState
> {
  encounters: *;

  state = {
    patientOptions: [],
    show: null
  };

  componentDidMount() {
    this.encounters = openEncounters();
  }

  handlePatientSearchChange = (e: *, value: string) => {
    this.encounters.find({ patientName: new RegExp(value, 'i') }, (err, docs) => {
      // TODO add context like last visit data
      const patientOptions = sortBy(docs, ['patientName']).map(doc => ({
        key: doc.patientName,
        value: doc.patientName,
        text: doc.patientName,
        encounter: doc
      }));

      this.setState({ patientOptions });
    });
  };

  render() {
    const { patientOptions, show } = this.state;

    return (
      <Formik
        initialValues={INITIAL_VALUES}
        validate={values => {
          const errors = {};

          if (values.diagnosisType === 'Malignant') {
            if (!values.diagnosisFreeText) {
              errors.diagnosisFreeText = true;
            }

            if (!values.diagnosisStage) {
              errors.diagnosisStage = true;
            }
          }

          NUMERIC_FIELDS.forEach(field => {
            if (!/^\d+$/.test(values[field])) {
              errors[field] = true;
            }
          });

          REQUIRED_FIELDS.forEach(field => {
            if (isEmpty(values[field])) {
              errors[field] = true;
            }
          });

          return errors;
        }}
        onSubmit={(values, { setSubmitting }) => {
          this.encounters.insert(values, err => {
            setSubmitting(false);

            if (err) {
              this.props.onError(err);
            } else {
              this.props.onComplete();
            }
          });
        }}
      >
        {({
          errors,
          isSubmitting,
          setFieldTouched,
          setFieldValue,
          submitForm,
          touched,
          values
        }) => {
          const handleBlur = (e, data) =>
            setFieldTouched((data && data.name) || e.target.name, true);

          const handleChange = (e, { name, value, checked }) =>
            setFieldValue(name, value !== undefined ? value : checked);

          const handlePatientAddition = (e, { value }) => {
            this.setState(state => ({
              patientOptions: [
                {
                  key: value,
                  text: value,
                  value,
                  encounter: null
                },
                ...state.patientOptions
              ]
            }));
          };

          const handlePatientChange = (e, { name, value, options }) => {
            setFieldValue(name, value);

            const selectedOption = options.find(option => option.value === value);

            let encounter = selectedOption && selectedOption.encounter;

            if (!encounter) {
              encounter = INITIAL_VALUES;
            }

            setFieldValue('mrn', encounter.mrn);
            setFieldValue('dateOfBirth', encounter.dateOfBirth);
            setFieldValue('clinic', encounter.clinic);
            setFieldValue('location', encounter.location);
            setFieldValue('md', encounter.md);
            setFieldValue('diagnosisType', encounter.diagnosisType);
            setFieldValue('diagnosisFreeText', encounter.diagnosisFreeText);
            setFieldValue('diagnosisStage', encounter.diagnosisStage);
            setFieldValue('research', encounter.research);
          };

          const renderField = intervention => (
            <Form.Field
              checked={values[intervention.fieldName]}
              control={Checkbox}
              key={intervention.fieldName}
              label={
                <label>
                  {intervention.name}{' '}
                  {show === intervention.fieldName && (
                    <InfoButton content={intervention.description} on="hover" />
                  )}
                </label>
              }
              name={intervention.fieldName}
              onBlur={handleBlur}
              onChange={handleChange}
              onMouseEnter={() => this.setState({ show: intervention.fieldName })}
              onMouseLeave={() =>
                this.setState(state => {
                  if (state.show === intervention.fieldName) {
                    return { show: null };
                  }
                })
              }
            />
          );

          const renderScoredField = intervention => (
            <div className="score-field-wrapper" key={intervention.fieldName}>
              <Form.Field
                checked={values[intervention.fieldName]}
                control={Checkbox}
                inline
                label={intervention.name}
                name={intervention.fieldName}
                onBlur={handleBlur}
                onChange={handleChange}
              />

              {values[intervention.fieldName] && (
                <Input
                  className="score-field"
                  name={`${intervention.fieldName}-score`}
                  onBlur={handleBlur}
                  onChange={handleChange}
                  placeholder="Score"
                  transparent
                  value={values[`${intervention.fieldName}-score`]}
                />
              )}
            </div>
          );

          const columns = interventionGroups.map((column, i) => {
            return (
              <Grid.Column key={i}>
                {column.map((group, j) => {
                  return (
                    <Form.Group grouped key={`${i}-${j}`}>
                      <label>{group.label}</label>

                      {group.interventions.map(intervention => {
                        return intervention.scored
                          ? renderScoredField(intervention)
                          : renderField(intervention);
                      })}
                    </Form.Group>
                  );
                })}
              </Grid.Column>
            );
          });

          return (
            <Form size="large">
              <Header>New Patient Encounter</Header>

              <Form.Field
                control={Input}
                error={touched.encounterDate && errors.encounterDate}
                id="input-encounter-date"
                label="Encounter Date"
                name="encounterDate"
                onBlur={handleBlur}
                onChange={handleChange}
                type="date"
                value={values.encounterDate}
              />

              <Form.Group widths="equal">
                <Form.Field
                  allowAdditions
                  control={Dropdown}
                  error={touched.patientName && errors.patientName}
                  id="input-patient-name"
                  label="Patient Name"
                  name="patientName"
                  onAddItem={handlePatientAddition}
                  onBlur={handleBlur}
                  onChange={handlePatientChange}
                  options={patientOptions}
                  onSearchChange={this.handlePatientSearchChange}
                  placeholder="Last, First Middle"
                  search
                  selection
                  value={values.patientName}
                />

                <Form.Field
                  control={Input}
                  error={touched.mrn && errors.mrn}
                  id="input-mrn"
                  label="MRN"
                  name="mrn"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  value={values.mrn}
                />

                <Form.Field
                  control={Input}
                  error={touched.dateOfBirth && errors.dateOfBirth}
                  id="input-date-of-birth"
                  label="Date of Birth"
                  name="dateOfBirth"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  type="date"
                  value={values.dateOfBirth}
                />
              </Form.Group>

              <Form.Field
                control={Dropdown}
                deburr
                error={touched.md && errors.md}
                id="input-md"
                label="MD"
                multiple
                name="md"
                onBlur={handleBlur}
                onChange={handleChange}
                onClose={handleBlur}
                options={DOCTOR_OPTIONS}
                search
                selection
                value={values.md}
              />

              <Form.Group widths="equal">
                <Form.Field
                  control={Dropdown}
                  error={touched.location && errors.location}
                  id="input-location"
                  label="Location"
                  name="location"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  onClose={handleBlur}
                  options={LOCATIONS}
                  search
                  selection
                  selectOnBlur={false}
                  value={values.location}
                />

                <Form.Field
                  control={Dropdown}
                  error={touched.clinic && errors.clinic}
                  id="input-clinic"
                  label="Clinic"
                  name="clinic"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  onClose={handleBlur}
                  options={CLINICS}
                  search
                  selection
                  selectOnBlur={false}
                  value={values.clinic}
                />
              </Form.Group>

              <Form.Group widths="equal">
                <Form.Field
                  control={Dropdown}
                  error={touched.diagnosisType && errors.diagnosisType}
                  id="input-diagnosis-type"
                  label="Diagnosis Type"
                  name="diagnosisType"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  onClose={handleBlur}
                  options={DIAGNOSES}
                  search
                  selection
                  selectOnBlur={false}
                  value={values.diagnosisType}
                />

                <Form.Field
                  control={Input}
                  disabled={values.diagnosisType !== 'Malignant'}
                  error={touched.diagnosisFreeText && errors.diagnosisFreeText}
                  id="input-diagnosis-free-text"
                  label="Diagnosis"
                  name="diagnosisFreeText"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  value={values.diagnosisType === 'Malignant' ? values.diagnosisFreeText : ''}
                />

                <Form.Field
                  control={Dropdown}
                  disabled={values.diagnosisType !== 'Malignant'}
                  error={touched.diagnosisStage && errors.diagnosisStage}
                  id="input-diagnosis-stage"
                  label="Stage"
                  name="diagnosisStage"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  onClose={handleBlur}
                  options={STAGES}
                  search
                  selection
                  selectOnBlur={false}
                  value={values.diagnosisType === 'Malignant' ? values.diagnosisStage : ''}
                />
              </Form.Group>

              <Form.Group widths="equal">
                {/* could require a multiple of 5, could round up automatically */}
                <Form.Field
                  control={Input}
                  error={touched.timeSpent && errors.timeSpent}
                  label={
                    <label>
                      Time Spent{' '}
                      <InfoButton content="The number of total minutes spent rounded up to the nearest 5, e.g. 75, including documentation." />
                    </label>
                  }
                  name="timeSpent"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  value={values.timeSpent}
                />

                <Form.Field
                  control={Input}
                  error={touched.numberOfTasks && errors.numberOfTasks}
                  label="Number of Tasks"
                  name="numberOfTasks"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  value={values.numberOfTasks}
                />
              </Form.Group>

              <Form.Field
                control={Checkbox}
                id="input-research"
                label={
                  <label>
                    Is patient involved in research?{' '}
                    <InfoButton
                      content="Mark this if you were referred by or coordinated with the research team, or are aware that the patient is on a research protocol, being considered for one, or is coming off of one."
                      on="hover"
                    />
                  </label>
                }
                name="research"
                onBlur={handleBlur}
                onChange={handleChange}
                checked={values.research}
              />

              <Divider hidden />

              <Form.Field
                control={Dropdown}
                fluid
                onChange={(e, data) => {
                  if (!data) {
                    return;
                  }

                  setFieldValue(data.value, true);
                }}
                openOnFocus={false}
                options={interventionOptions}
                placeholder="Search for an intervention"
                search
                selection
                selectOnBlur={false}
                selectOnNavigation={false}
                upward
                value=""
              />

              <Divider hidden />

              <Grid columns={interventionGroups.length} divided>
                <Grid.Row>{columns}</Grid.Row>
              </Grid>

              <Divider hidden />

              <Form.Group>
                <Form.Button disabled={isSubmitting} onClick={submitForm} primary size="big">
                  Save Encounter
                </Form.Button>

                <Popup
                  trigger={
                    <Form.Button content="Cancel" disabled={isSubmitting} negative size="big" />
                  }
                  content={<Form.Button content="Confirm?" onClick={this.props.onCancel} />}
                  on="click"
                />
              </Form.Group>
            </Form>
          );
        }}
      </Formik>
    );
  }
}

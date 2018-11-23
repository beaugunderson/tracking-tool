// @flow

import 'semantic-ui-css/semantic.min.css';
import './App.css';

import React, { Component } from 'react';
import {
  Button,
  Checkbox,
  Container,
  Divider,
  Dropdown,
  Grid,
  Header,
  Icon,
  Input,
  Form,
  Popup
} from 'semantic-ui-react';
import { DOCTORS } from './doctors';
import { Formik } from 'formik';
import {
  initialInterventionValues,
  interventionGroups,
  interventionOptions
} from './interventions';
import { isEmpty } from 'lodash';

const electron = window.require('electron');
const fs = electron.remote.require('fs');

fs.readdir('.', (err, files) => {
  console.log({ err, files });
});

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
  'mrn',
  'patientName',
  'timeSpent'
];

const HELP_ICON = <Icon color="grey" name="help circle" />;

class InfoButton extends Component<*> {
  render() {
    const { content, on, ...rest } = this.props;

    return (
      <Popup
        {...rest}
        content={content}
        horizontalOffset={12}
        on={on || 'click'}
        trigger={HELP_ICON}
      />
    );
  }
}

type PatientEncounterFormProps = {
  onCancel: () => void
};

type PatientEncounterFormState = {
  show: ?string
};

class PatientEncounterForm extends Component<
  PatientEncounterFormProps,
  PatientEncounterFormState
> {
  state = {
    show: null
  };

  handleCancel = () => this.props.onCancel();

  render() {
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

          if (!/^\d+$/.test(values.numberOfTasks)) {
            errors.numberOfTasks = true;
          }

          if (!/^\d+$/.test(values.timeSpent)) {
            errors.timeSpent = true;
          }

          REQUIRED_FIELDS.forEach(field => {
            if (isEmpty(values[field])) {
              errors[field] = true;
            }
          });

          return errors;
        }}
        onSubmit={(values, { setSubmitting }) => {
          setTimeout(() => {
            alert(JSON.stringify(values, null, 2));
            setSubmitting(false);
          }, 400);
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

          const renderField = intervention => (
            <Form.Field
              checked={values[intervention.fieldName]}
              control={Checkbox}
              key={intervention.fieldName}
              label={
                <label>
                  {intervention.name}{' '}
                  {this.state.show === intervention.fieldName && (
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

              <Input
                className="score-field"
                name={`${intervention.fieldName}-score`}
                onBlur={handleBlur}
                onChange={handleChange}
                placeholder="Score"
                transparent
                value={values[`${intervention.fieldName}-score`]}
              />
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
                  error={touched.patientName && errors.patientName}
                  id="input-patient-name"
                  label="Patient Name"
                  name="patientName"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  placeholder="Last, First Middle"
                  value={values.patientName}
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
                  content={<Form.Button content="Confirm?" onClick={this.handleCancel} />}
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

type AppState = {
  encounter: ?string
};

class App extends Component<{}, AppState> {
  state = {
    encounter: null
  };

  render() {
    const { encounter } = this.state;

    if (encounter === 'patient') {
      return <PatientEncounterForm onCancel={() => this.setState({ encounter: null })} />;
    }

    return (
      <div>
        <Header size="huge">Create a new encounter:</Header>

        <Divider hidden />

        <Container textAlign="center">
          <Button
            icon
            labelPosition="left"
            onClick={() => this.setState({ encounter: 'patient' })}
            size="big"
          >
            <Icon name="user" />
            Patient
          </Button>

          <Button
            icon
            labelPosition="left"
            onClick={() => this.setState({ encounter: 'staff' })}
            size="big"
          >
            <Icon name="user md" />
            Staff
          </Button>

          <Button
            icon
            labelPosition="left"
            onClick={() => this.setState({ encounter: 'community' })}
            size="big"
          >
            <Icon name="phone" />
            Community
          </Button>

          <Button
            icon
            labelPosition="left"
            onClick={() => this.setState({ encounter: 'other' })}
            size="big"
          >
            <Icon name="clock" />
            Other
          </Button>
        </Container>
      </div>
    );
  }
}

export default App;

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

const STAGES = makeOptions(['Unknown', 'Early', 'Advanced', 'N/A']);

const INTERVENTIONS = makeOptions(['blah blah', 'bleh blah', 'etc.']);

type PatientEncounterFormProps = {
  onCancel: () => void
};

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
  timeSpent: ''
};

const HELP_ICON = <Icon color="grey" name="help circle" />;

class InfoButton extends Component<*> {
  render() {
    return (
      <Popup
        content={this.props.content}
        horizontalOffset={12}
        on={this.props.on || 'click'}
        trigger={HELP_ICON}
      />
    );
  }
}

class PatientEncounterForm extends Component<PatientEncounterFormProps> {
  handleCancel = () => this.props.onCancel();

  render() {
    return (
      <Formik
        initialValues={INITIAL_VALUES}
        validate={values => {
          const errors = {};

          if (values.diagnosisType === 'Malignant' && !values.diagnosisStage) {
            errors.diagnosisStage = true;
          }

          if (!/^\d+$/.test(values.timeSpent)) {
            errors.timeSpent = true;
          }

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

          return (
            <Form size="large">
              <Header>New Patient Encounter</Header>

              <Form.Field
                control={Input}
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
                  id="input-mrn"
                  label="MRN"
                  name="mrn"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  value={values.mrn}
                />

                <Form.Field
                  control={Input}
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
                openOnFocus={false}
                options={INTERVENTIONS}
                placeholder="Search for an intervention"
                search
                selection
                selectOnBlur={false}
                selectOnNavigation={false}
                upward
              />

              <Divider hidden />

              <Grid columns={3} divided>
                <Grid.Row>
                  <Grid.Column>
                    <Form.Group grouped>
                      <label>Encounter Type</label>

                      <Form.Field label="Distress Screen" control={Checkbox} />
                      <Form.Field label="Documentation" control={Checkbox} />
                      <Form.Field label="Transplant Assessment" control={Checkbox} />
                    </Form.Group>

                    <Form.Group grouped>
                      <label>Crisis</label>

                      <Form.Field label="Severe Mental Illness" control={Checkbox} />
                      <Form.Field label="Suicide/Homicide" control={Checkbox} />
                      <Form.Field label="Substance Use" control={Checkbox} />
                      <Form.Field label="Homelessness" control={Checkbox} />
                      <Form.Field label="Adult Protection" control={Checkbox} />
                      <Form.Field label="Child Protection" control={Checkbox} />
                      <Form.Field label="Interpersonal Violence" control={Checkbox} />
                      <Form.Field label="M&M (Mortality and Morbidity)" control={Checkbox} />
                    </Form.Group>

                    <Form.Group grouped>
                      <label>Support Group Screening</label>

                      <Form.Field label="Assessment, Referral" control={Checkbox} />
                    </Form.Group>

                    <Form.Group grouped>
                      <label>Social, Practical</label>

                      <Form.Field label="Food" control={Checkbox} />
                      <Form.Field label="Transportation" control={Checkbox} />
                      <Form.Field label="Lodging, Housing, Shelter" control={Checkbox} />
                      <Form.Field label="Managing Work, Home Life, Illness" control={Checkbox} />
                      <Form.Field label="Holiday Families" control={Checkbox} />
                      <Form.Field label="Other Community Resources" control={Checkbox} />
                    </Form.Group>
                  </Grid.Column>
                  <Grid.Column>
                    <Form.Group grouped>
                      <label>Advanced Care Planning</label>

                      <Form.Field label="Facilitation" control={Checkbox} />
                      <Form.Field label="Values Assessment" control={Checkbox} />
                      <Form.Field label="Advanced Illness" control={Checkbox} />
                      <Form.Field label="Death with Dignity" control={Checkbox} />
                      <Form.Field label="Form Completion" control={Checkbox} />
                    </Form.Group>

                    <Form.Group grouped>
                      <label>Family, Caregiver</label>

                      <Form.Field
                        label="Caregiver: Supportive Counseling, Education"
                        control={Checkbox}
                      />
                      <Form.Field label="Family Meeting" control={Checkbox} />
                      <Form.Field label="Respite Care" control={Checkbox} />
                    </Form.Group>

                    <Form.Group grouped>
                      <label>Psychological, Emotional</label>
                      <Form.Field label="New Diagnosis" control={Checkbox} />
                      <Form.Field
                        label="Patient: Supportive Counseling, Education"
                        control={Checkbox}
                      />
                      <Form.Field label="Sexuality, Intimacy, Fertility" control={Checkbox} />
                      <Form.Field label="Spiritual, Existential" control={Checkbox} />
                      <Form.Field label="Survivorship" control={Checkbox} />
                      <Divider hidden />
                      <div className="hack">
                        <Form.Field label="PHQ" control={Checkbox} inline />
                        <Input
                          transparent
                          placeholder="Score"
                          style={{ borderBottom: '1px solid black', width: '50px' }}
                        />
                      </div>
                      <div className="hack">
                        <Form.Field label="GAD" control={Checkbox} inline />
                        <Input
                          transparent
                          placeholder="Score"
                          style={{ borderBottom: '1px solid black', width: '50px' }}
                        />
                      </div>
                      <div className="hack">
                        <Form.Field label="MoCA" control={Checkbox} inline />
                        <Input
                          transparent
                          placeholder="Score"
                          style={{ borderBottom: '1px solid black', width: '50px' }}
                        />
                      </div>
                    </Form.Group>
                  </Grid.Column>

                  <Grid.Column>
                    <Form.Group grouped>
                      <label>Care Coordination</label>

                      <Form.Field label="Customer Service" control={Checkbox} />
                      <Form.Field label="Care Coordination" control={Checkbox} />
                      <Form.Field label="Home Health, Private Duty" control={Checkbox} />
                      <Form.Field label="Palliative Care, Hospice" control={Checkbox} />
                      <Form.Field label="Neuro-Cognitive Testing" control={Checkbox} />
                      <Form.Field label="Psychiatry, Psychotherapy" control={Checkbox} />
                      <Form.Field label="Behavioral, Safety Plan" control={Checkbox} />
                      <Form.Field label="External Supportive Care" control={Checkbox} />
                      <Form.Field label="SCI Supportive Care" control={Checkbox} />
                    </Form.Group>

                    <Form.Group grouped>
                      <label>Financial, Legal</label>

                      <Form.Field label="SCI Grant Funds" control={Checkbox} />
                      <Form.Field label="Community Grant Funds" control={Checkbox} />
                      <Form.Field label="Insurance Access, Assistance" control={Checkbox} />
                      <Form.Field label="Swedish Financial Assistance" control={Checkbox} />
                      <Form.Field label="Employment" control={Checkbox} />
                      <Form.Field label="State/Federal Income" control={Checkbox} />
                      <Form.Field label="VA Benefits" control={Checkbox} />
                    </Form.Group>

                    <Form.Group grouped>
                      <label>Health Literacy</label>

                      <Form.Field
                        label="Accessing Accurate Medical Information"
                        control={Checkbox}
                      />
                      <Form.Field
                        label="Assessment: Understanding Treatment Options, Diagnosis"
                        control={Checkbox}
                      />
                      <Form.Field
                        label="Assisting: Talking to Healthcare Team"
                        control={Checkbox}
                      />
                    </Form.Group>
                  </Grid.Column>
                </Grid.Row>
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

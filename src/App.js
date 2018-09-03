// @flow

import 'semantic-ui-css/semantic.min.css';
import './App.css';

import React, { Component } from 'react';
import {
  Button,
  Container,
  Divider,
  Dropdown,
  Header,
  Icon,
  Input,
  Form,
  Popup
} from 'semantic-ui-react';

const DOCTORS = [
  { value: 'Dr. Soma', text: 'Dr. Soma' },
  { value: 'Dr. Pants', text: 'Dr. Pants' }
];

function makeOptions(options) {
  return options.map(option => ({ value: option, text: option }));
}

const CLINICS = makeOptions([
  'Ballard Medical Oncology',
  'Edmonds Medical Oncology',
  'Edmonds Palliative Care',
  'First Hill Medical Oncology (FHMO)',
  'First Hill Palliative Care',
  'Gyn Onc',
  'Heme',
  'Inpatient',
  'Issaquah Medical Oncology',
  'Ivy',
  'TCC Medical Oncology'
]);

const DIAGNOSES = makeOptions(['Malignant', 'Benign', 'Unknown']);

const STAGES = makeOptions(['', '0', 'I', 'II', 'III', 'IV']);

type PatientEncounterFormProps = {
  onCancel: () => void
};

type PatientEncounterFormState = {
  form: {
    clinic?: ?string,
    dateOfBirth?: string,
    diagnosisFreeText?: string,
    diagnosisStage?: string,
    diagnosisType?: string,
    encounterDate?: string,
    md?: string[],
    mrn?: string,
    patientName?: string,
    timeSpent?: string
  }
};

function today() {
  const date = new Date();

  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());

  return date.toJSON().slice(0, 10);
}

class PatientEncounterForm extends Component<
  PatientEncounterFormProps,
  PatientEncounterFormState
> {
  state = {
    form: {
      clinic: '',
      dateOfBirth: '',
      diagnosisFreeText: '',
      diagnosisStage: '',
      diagnosisType: '',
      encounterDate: today(),
      md: [],
      mrn: '',
      patientName: '',
      timeSpent: ''
    }
  };

  static getDerivedStateFromProps(props, state) {
    console.log({ state });

    if (state.form.diagnosisType !== 'Malignant') {
      return { form: { ...state.form, diagnosisStage: '' } };
    }

    return null;
  }

  handleCancel = () => this.props.onCancel();

  handleChange = (e, { name, value }) => {
    this.setState(state => ({ form: { ...state.form, [name]: value } }));
  };

  handleSubmit = () => {
    console.log(this.state.form);
  };

  render() {
    const {
      clinic,
      dateOfBirth,
      diagnosisFreeText,
      diagnosisStage,
      diagnosisType,
      encounterDate,
      md,
      mrn,
      patientName,
      timeSpent
    } = this.state.form;

    return (
      <Form onSubmit={this.handleSubmit} size="large">
        <Header>New Patient Encounter</Header>

        <Form.Field
          control={Input}
          id="input-encounter-date"
          label="Encounter Date"
          name="encounterDate"
          onChange={this.handleChange}
          type="date"
          value={encounterDate}
        />

        <Form.Field
          control={Input}
          id="input-patient-name"
          label="Patient Name"
          name="patientName"
          onChange={this.handleChange}
          placeholder="Last, First Middle"
          value={patientName}
        />

        <Form.Field
          control={Input}
          id="input-date-of-birth"
          label="Date of Birth"
          name="dateOfBirth"
          onChange={this.handleChange}
          type="date"
          value={dateOfBirth}
        />

        <Form.Field
          control={Input}
          id="input-mrn"
          label="MRN"
          name="mrn"
          onChange={this.handleChange}
          value={mrn}
        />

        <Form.Field
          control={Dropdown}
          id="input-md"
          label="MD"
          multiple
          name="md"
          onChange={this.handleChange}
          options={DOCTORS}
          search
          selection
          value={md}
        />

        <Form.Field
          control={Dropdown}
          id="input-clinic"
          label="Clinic"
          name="clinic"
          onChange={this.handleChange}
          options={CLINICS}
          search
          selection
          value={clinic}
        />

        <Form.Group widths="equal">
          <Form.Field
            control={Dropdown}
            id="input-diagnosis-type"
            label="Diagnosis Type"
            name="diagnosisType"
            onChange={this.handleChange}
            options={DIAGNOSES}
            search
            selection
            value={diagnosisType}
          />

          <Form.Field
            control={Input}
            id="input-diagnosis-free-text"
            label="Diagnosis"
            name="diagnosisFreeText"
            onChange={this.handleChange}
            value={diagnosisFreeText}
          />

          <Form.Field
            control={Dropdown}
            disabled={diagnosisType !== 'Malignant'}
            id="input-diagnosis-stage"
            label="Stage"
            name="diagnosisStage"
            options={STAGES}
            onChange={this.handleChange}
            selection
            value={diagnosisStage}
          />
        </Form.Group>

        <Form.Field
          control={Input}
          label="Time spent"
          name="timeSpent"
          onChange={this.handleChange}
          value={timeSpent}
        />

        <Form.Group>
          <Form.Button primary size="big">
            Save Encounter
          </Form.Button>

          <Popup
            trigger={<Form.Button content="Cancel" negative size="big" />}
            content={<Form.Button content="Confirm?" onClick={this.handleCancel} />}
            on="click"
          />
        </Form.Group>
      </Form>
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
        </Container>
      </div>
    );
  }
}

export default App;

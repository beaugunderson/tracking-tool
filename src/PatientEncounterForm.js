// @flow

import './App.css';

import React from 'react';
import {
  Checkbox,
  Divider,
  Dropdown,
  Grid,
  Header,
  Input,
  Form,
  Popup,
  Ref
} from 'semantic-ui-react';
import { debug as Debug } from 'debug';
import { DOCTORS } from './doctors';
import { InfoButton } from './InfoButton';
import {
  initialInterventionValues,
  interventionGroups,
  interventionOptions
} from './patient-interventions';
import { chain, isEmpty } from 'lodash';
import { withFormik } from 'formik';

const debug = Debug('tracking-tool:patient-encounter-form');

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

const DIAGNOSES = makeOptions(['Malignant', 'Benign/Other', 'Unknown']);

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

const SCORED_FIELDS = ['phq', 'gad', 'moca'];

const docToOption = doc => ({
  content: (
    <React.Fragment>
      <strong>{doc.patientName}</strong> &mdash; {doc.encounterDate}
    </React.Fragment>
  ),
  key: doc.patientName,
  value: doc.patientName,
  text: doc.patientName,
  encounter: doc
});

const NUMBER_OF_TASKS_LABEL = (
  <label>
    Number of Tasks{' '}
    <InfoButton
      content="The number of tasks associated with the encounter, equal to the number of lines you would have completed in the old spreadsheet format.  For example, discussion with MD, seeing patient, and coordinating with PFA would equal 3 tasks"
      on="hover"
    />
  </label>
);

const TIME_SPENT_LABEL = (
  <label>
    Time Spent{' '}
    <InfoButton
      content="The number of total minutes on all encounters for this patient on this day, rounded up to the nearest 5, e.g. 75 minutes, including full representation of time spent documenting"
      on="hover"
    />
  </label>
);

const STAGE_LABEL_CONTENT = (
  <React.Fragment>
    Select <strong>Unknown</strong> if cancer has not yet been staged, then change your selection
    on the next encounter after staging is complete. Select <strong>Early</strong> if cancer is
    Stage 0-2. Select <strong>Advanced</strong> if cancer is Stage 3-4, has metastases, is
    described as locally advanced or end-stage, or if the cancer remains of unknown primary after
    staging is complete. Do not change your selection if cancer progresses or recurs, instead
    select the box below
  </React.Fragment>
);

const STAGE_LABEL = (
  <label>
    Initial Stage <InfoButton content={STAGE_LABEL_CONTENT} on="hover" />
  </label>
);

const MD_LABEL = (
  <label>
    MD{' '}
    <InfoButton
      content="Input multiple providers as appropriate, first MD listed should be primary MD associated with that day's encounter"
      on="hover"
    />
  </label>
);

const RESEARCH_LABEL = (
  <label>
    Is patient involved in research?{' '}
    <InfoButton
      content="Mark this if you were referred by or coordinated with the research team, or are aware that the patient is on a research protocol, being considered for one, or is coming off of one"
      on="hover"
    />
  </label>
);

type PatientEncounterFormProps = {
  encounters: *,
  errors: { [string]: boolean },
  isSubmitting: boolean,
  onCancel: () => void,
  onComplete: () => void,
  onError: Error => void,
  setFieldTouched: (string, boolean) => void,
  setFieldValue: (string, string | boolean | Array<*>) => void,
  submitForm: () => void,
  touched: { [string]: boolean },
  values: { [string]: string | boolean | Array<*> }
};

type PatientEncounterFormState = {
  patientOptions: { key: string, text: string, value: string, encounter: ?{} }[],
  show: ?string
};

class UnwrappedPatientEncounterForm extends React.Component<
  PatientEncounterFormProps,
  PatientEncounterFormState
> {
  patientNameRef: React$ElementRef<typeof HTMLInputElement> | null;

  state = {
    patientOptions: [],
    show: null
  };

  componentDidMount() {
    this.props.encounters
      .find({})
      .sort({ encounterDate: -1, patientName: 1 })
      .limit(25)
      .exec((err, docs) => {
        const patientOptions = chain(docs)
          .sortBy(doc => doc.patientName.toLowerCase())
          .uniqBy('patientName')
          .map(docToOption)
          .slice(0, 5)
          .value();

        this.setState({ patientOptions });
      });

    if (this.patientNameRef) {
      const input = this.patientNameRef.querySelector('input');

      if (input) {
        input.focus();
      }
    }
  }

  handlePatientSearchChange = (e: *, { searchQuery }) => {
    this.props.encounters
      .find({ patientName: new RegExp(searchQuery, 'i') })
      .sort({ patientName: 1 })
      .exec((err, docs) => {
        const patientOptions = chain(docs)
          .uniqBy('patientName')
          .map(docToOption)
          .value();

        this.setState({ patientOptions });
      });
  };

  componentDidUpdate() {
    debug('componentDidUpdate %o', { props: this.props, state: this.state });
  }

  handleBlur = (e, data) => this.props.setFieldTouched((data && data.name) || e.target.name, true);

  handleChange = (e, { name, value, checked }) =>
    this.props.setFieldValue(name, value !== undefined ? value : checked);

  handlePatientAddition = (e, { value }) => {
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

  handlePatientChange = (e, { name, value, options }) => {
    const { setFieldValue } = this.props;

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

  handleInterventionChange = (e, data) => {
    if (!data) {
      return;
    }

    this.props.setFieldValue(data.value, true);
  };

  renderField = intervention => (
    <Form.Field
      checked={this.props.values[intervention.fieldName]}
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
      onBlur={this.handleBlur}
      onChange={this.handleChange}
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

  renderScoredField = intervention => {
    const scoreFieldName = `${intervention.fieldName}Score`;
    const { errors, touched, values } = this.props;

    return (
      <div className="score-field-wrapper" key={intervention.fieldName}>
        <Form.Field
          checked={values[intervention.fieldName]}
          control={Checkbox}
          inline
          label={intervention.name}
          name={intervention.fieldName}
          onBlur={this.handleBlur}
          onChange={this.handleChange}
        />

        {this.props.values[intervention.fieldName] && (
          <Input
            className="score-field"
            error={touched[scoreFieldName] && errors[scoreFieldName]}
            name={scoreFieldName}
            onBlur={this.handleBlur}
            onChange={this.handleChange}
            placeholder="Score"
            transparent
            value={values[scoreFieldName]}
          />
        )}
      </div>
    );
  };

  render() {
    const { patientOptions } = this.state;
    const { errors, isSubmitting, submitForm, touched, values } = this.props;

    const columns = interventionGroups.map((column, i) => {
      return (
        <Grid.Column key={i}>
          {column.map((group, j) => {
            return (
              <Form.Group grouped key={`${i}-${j}`}>
                <label>{group.label}</label>

                {group.interventions.map(intervention => {
                  return intervention.scored
                    ? this.renderScoredField(intervention)
                    : this.renderField(intervention);
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
          onBlur={this.handleBlur}
          onChange={this.handleChange}
          type="date"
          value={values.encounterDate}
        />

        <Form.Group widths="equal">
          <Ref innerRef={ref => (this.patientNameRef = ref)}>
            <Form.Field
              allowAdditions
              control={Dropdown}
              defaultOpen
              error={touched.patientName && errors.patientName}
              id="input-patient-name"
              label="Patient Name"
              name="patientName"
              onAddItem={this.handlePatientAddition}
              onBlur={this.handleBlur}
              onChange={this.handlePatientChange}
              onClose={this.handleBlur}
              options={patientOptions}
              onSearchChange={this.handlePatientSearchChange}
              placeholder="Last, First Middle"
              search
              selectOnBlur={false}
              selection
              value={values.patientName}
            />
          </Ref>

          <Form.Field
            control={Input}
            error={touched.mrn && errors.mrn}
            id="input-mrn"
            label="MRN"
            name="mrn"
            onBlur={this.handleBlur}
            onChange={this.handleChange}
            value={values.mrn}
          />

          <Form.Field
            control={Input}
            error={touched.dateOfBirth && errors.dateOfBirth}
            id="input-date-of-birth"
            label="Date of Birth"
            name="dateOfBirth"
            onBlur={this.handleBlur}
            onChange={this.handleChange}
            type="date"
            value={values.dateOfBirth}
          />
        </Form.Group>

        <Form.Field
          control={Dropdown}
          deburr
          error={touched.md && errors.md}
          id="input-md"
          label={MD_LABEL}
          multiple
          name="md"
          onBlur={this.handleBlur}
          onChange={this.handleChange}
          onClose={this.handleBlur}
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
            onBlur={this.handleBlur}
            onChange={this.handleChange}
            onClose={this.handleBlur}
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
            onBlur={this.handleBlur}
            onChange={this.handleChange}
            onClose={this.handleBlur}
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
            onBlur={this.handleBlur}
            onChange={this.handleChange}
            onClose={this.handleBlur}
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
            onBlur={this.handleBlur}
            onChange={this.handleChange}
            value={values.diagnosisType === 'Malignant' ? values.diagnosisFreeText : ''}
          />

          <Form.Field
            control={Dropdown}
            disabled={values.diagnosisType !== 'Malignant'}
            error={touched.diagnosisStage && errors.diagnosisStage}
            id="input-diagnosis-stage"
            label={STAGE_LABEL}
            name="diagnosisStage"
            onBlur={this.handleBlur}
            onChange={this.handleChange}
            onClose={this.handleBlur}
            options={STAGES}
            search
            selection
            selectOnBlur={false}
            value={values.diagnosisType === 'Malignant' ? values.diagnosisStage : ''}
          />
        </Form.Group>

        <Form.Field
          control={Checkbox}
          id="input-research"
          label={RESEARCH_LABEL}
          name="research"
          onBlur={this.handleBlur}
          onChange={this.handleChange}
          checked={values.research}
        />

        <Divider hidden />

        <Form.Field
          control={Dropdown}
          fluid
          onChange={this.handleInterventionChange}
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

        <Form.Group widths="equal">
          {/* could require a multiple of 5, could round up automatically */}
          <Form.Field
            control={Input}
            error={touched.timeSpent && errors.timeSpent}
            label={TIME_SPENT_LABEL}
            name="timeSpent"
            onBlur={this.handleBlur}
            onChange={this.handleChange}
            value={values.timeSpent}
          />

          <Form.Field
            control={Input}
            error={touched.numberOfTasks && errors.numberOfTasks}
            label={NUMBER_OF_TASKS_LABEL}
            name="numberOfTasks"
            onBlur={this.handleBlur}
            onChange={this.handleChange}
            value={values.numberOfTasks}
          />
        </Form.Group>

        <Divider hidden />

        <Form.Group>
          <Form.Button disabled={isSubmitting} onClick={submitForm} primary size="big">
            Save Encounter
          </Form.Button>

          <Popup
            trigger={<Form.Button content="Cancel" disabled={isSubmitting} negative size="big" />}
            content={<Form.Button content="Confirm?" onClick={this.props.onCancel} />}
            on="click"
          />
        </Form.Group>
      </Form>
    );
  }
}

export const PatientEncounterForm = withFormik({
  mapPropsToValues: () => INITIAL_VALUES,

  validate: values => {
    const errors = {};

    if (values.diagnosisType === 'Malignant') {
      if (!values.diagnosisFreeText) {
        errors.diagnosisFreeText = true;
      }

      if (!values.diagnosisStage) {
        errors.diagnosisStage = true;
      }
    }

    SCORED_FIELDS.forEach(field => {
      const scoredFieldName = `${field}Score`;

      if (values[field] && !/^\d+$/.test(values[scoredFieldName])) {
        errors[scoredFieldName] = true;
      }
    });

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
  },

  handleSubmit: (values, { props, setSubmitting }) => {
    props.encounters.insert({ ...values, encounterType: 'patient' }, err => {
      setSubmitting(false);

      if (err) {
        props.onError(err);
      } else {
        props.onComplete();
      }
    });
  }
})(UnwrappedPatientEncounterForm);

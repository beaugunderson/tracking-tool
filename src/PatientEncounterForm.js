// @flow

import './App.css';

import moment from 'moment';
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
import { CLINICS, DIAGNOSES, DOCTORS, LOCATIONS, STAGES } from './options';
import { InfoButton } from './InfoButton';
import {
  initialInterventionValues,
  interventionGroups,
  interventionOptions
} from './patient-interventions';
import { chain, deburr, escapeRegExp, isEmpty } from 'lodash';
import { withFormik } from 'formik';

const debug = Debug('tracking-tool:patient-encounter-form');

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

const NUMERIC_FIELDS = ['numberOfTasks', 'timeSpent'];

const REQUIRED_FIELDS = [
  'clinic',
  'dateOfBirth',
  'diagnosisType',
  'encounterDate',
  'location',
  'md',
  'patientName'
];

const SCORED_FIELDS = ['phq', 'gad', 'moca'];

const docToOption = doc => {
  const _today = moment()
    .hour(0)
    .minute(0)
    .second(0)
    .millisecond(0);
  const dateOfBirth = moment(doc.dateOfBirth);

  let relativeTime = moment(doc.encounterDate).from(_today);

  if (doc.encounterDate === _today.format('YYYY-MM-DD')) {
    relativeTime = 'today';
  } else if (doc.encounterDate === _today.subtract(1, 'day').format('YYYY-MM-DD')) {
    relativeTime = 'yesterday';
  }

  const formattedDateOfBirth = dateOfBirth.format('M/D/YYYY');

  return {
    // displayed in the search results as a row
    content: (
      <React.Fragment>
        <strong>{doc.patientName}</strong>{' '}
        <span style={{ color: '#666' }}>{formattedDateOfBirth}</span>{' '}
        <span style={{ color: '#aaa' }}>{relativeTime}</span>
      </React.Fragment>
    ),

    // the doc itself, so we can auto-fill
    'data-encounter': doc,

    // store the patient name separately for easy access in the onChange handler
    'data-patient-name': doc.patientName,

    // specify a key since Semantic uses the value otherwise and it may not be unique
    key: `${doc.patientName}-${doc.mrn}-${doc.dateOfBirth}`,

    // the text that's searched by the Dropdown as we type; we add DOB so we can add patients with
    // duplicate names; this is also what's displayed in the Dropdown on change
    text: (
      <React.Fragment>
        {doc.patientName} <input type="hidden" value={doc.dateOfBirth} />
      </React.Fragment>
    )

    // note: the value is handled by indexValues and becomes the array index of the option
  };
};

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
    staging is complete
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

function indexValues(values) {
  return values.map((value, i) => ({ ...value, value: `${i}` }));
}

type PatientEncounterFormProps = {
  encounters: *,
  errors: { [string]: boolean },
  isSubmitting: boolean,
  onCancel: () => void,
  onComplete: () => void,
  onError: Error => void,
  setFieldTouched: (string, boolean) => void,
  setFieldValue: (string, string | boolean | Array<*>) => void,
  setValues: ({ [string]: string | boolean | Array<*> }) => void,
  submitForm: () => void,
  touched: { [string]: boolean },
  values: { [string]: string | boolean | Array<*> }
};

type PatientEncounterFormState = {
  activeInfoButton: ?string,
  patientNameIndex: string,
  patientOptions: { content: *, encounter: ?{}, text: string, value: string }[]
};

class UnwrappedPatientEncounterForm extends React.Component<
  PatientEncounterFormProps,
  PatientEncounterFormState
> {
  patientNameRef: React$ElementRef<typeof HTMLInputElement> | null;

  state = {
    activeInfoButton: null,
    patientNameIndex: '',
    patientOptions: []
  };

  setInitialEncounterList = () => {
    this.props.encounters
      .find({})
      .sort({ encounterDate: -1, patientName: 1 })
      .limit(25)
      .exec((err, docs) => {
        const patientOptions = chain(docs)
          .sortBy(['encounterDate', 'createdAt'])
          .reverse()
          .uniqBy('mrn')
          .map(docToOption)
          .slice(0, 5)
          .value();

        this.setState({ patientOptions: indexValues(patientOptions) });
      });
  };

  setSearchEncounterList = searchQuery => {
    this.props.encounters
      .find({ patientName: new RegExp(escapeRegExp(searchQuery), 'i') })
      .sort({ patientName: 1 })
      .exec((err, docs) => {
        // get the most recent encounter for each patient matching the query,
        // sorted by patient name
        const patientOptions = chain(docs)
          .sortBy('encounterDate')
          .reverse()
          .uniqBy('mrn')
          .sortBy('patientName')
          .map(docToOption)
          .value();

        this.setState({ patientOptions: indexValues(patientOptions) });
      });
  };

  componentDidMount() {
    this.setInitialEncounterList();

    if (this.patientNameRef) {
      const input = this.patientNameRef.querySelector('input');

      if (input) {
        input.focus();
      }
    }
  }

  componentDidUpdate() {
    debug('componentDidUpdate %o', { props: this.props, state: this.state });
  }

  handleBlur = (e, data) => this.props.setFieldTouched((data && data.name) || e.target.name, true);

  handleChange = (e, { name, value, checked }) =>
    this.props.setFieldValue(name, value !== undefined ? value : checked);

  handlePatientAddition = (e, { value }) => {
    this.setState(
      state => ({
        patientOptions: indexValues([
          {
            content: value,
            'data-encounter': null,
            'data-patient-name': value,
            text: value
          },
          ...state.patientOptions
        ])
      }),
      () => {
        this.updatePatientIndexAndValue('0', INITIAL_VALUES, value);
      }
    );
  };

  updatePatientIndexAndValue = (patientNameIndex, encounter, patientName) => {
    const { setValues, values } = this.props;

    // this is faster than calling setFieldValue multiple times
    setValues({
      ...values,
      patientName,
      mrn: encounter.mrn,
      dateOfBirth: encounter.dateOfBirth,
      clinic: encounter.clinic,
      location: encounter.location,
      md: encounter.md,
      diagnosisType: encounter.diagnosisType,
      diagnosisFreeText: encounter.diagnosisFreeText,
      diagnosisStage: encounter.diagnosisStage,
      research: encounter.research
    });

    this.setState({ patientNameIndex });
  };

  handlePatientChange = (e, { value, options }) => {
    const selectedOption = options.find(option => option.value === value);

    if (!selectedOption) {
      return this.updatePatientIndexAndValue('', INITIAL_VALUES, '');
    }

    const encounter = (selectedOption && selectedOption['data-encounter']) || INITIAL_VALUES;
    const patientName = selectedOption && selectedOption['data-patient-name'];

    this.updatePatientIndexAndValue(selectedOption.value, encounter, patientName);
  };

  handlePatientNameSearch = (options, searchQuery) => {
    const strippedQuery = deburr(searchQuery);
    const re = new RegExp(escapeRegExp(strippedQuery), 'i');

    return options.filter(option => re.test(deburr(option['data-patient-name'])));
  };

  handlePatientSearchChange = (e: *, { searchQuery }) => {
    if (searchQuery) {
      this.setSearchEncounterList(searchQuery);
    } else {
      this.setInitialEncounterList();
    }
  };

  handleInterventionChange = (e, data) => {
    if (!data) {
      return;
    }

    this.props.setFieldValue(data.value, true);
  };

  handleInterventionOnMouseEnter = e => {
    e.persist();
    this.setState({ activeInfoButton: e.target.parentElement.firstChild.name });
  };

  handleInterventionOnMouseLeave = e => {
    e.persist();
    this.setState(state => {
      if (state.activeInfoButton === e.target.parentElement.firstChild.name) {
        return { activeInfoButton: null };
      }
    });
  };

  renderField = intervention => (
    <Form.Field
      checked={this.props.values[intervention.fieldName]}
      control={Checkbox}
      key={intervention.fieldName}
      label={
        <label>
          {intervention.name}{' '}
          {this.state.activeInfoButton === intervention.fieldName && (
            <InfoButton content={intervention.description} on="hover" />
          )}
        </label>
      }
      name={intervention.fieldName}
      onBlur={this.handleBlur}
      onChange={this.handleChange}
      onMouseEnter={this.handleInterventionOnMouseEnter}
      onMouseLeave={this.handleInterventionOnMouseLeave}
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
              additionLabel="Add new patient "
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
              search={this.handlePatientNameSearch}
              selectOnBlur={false}
              selection
              value={this.state.patientNameIndex}
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
          options={DOCTORS}
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

    if (!/^100\d{7}$/.test(values.mrn)) {
      errors.mrn = true;
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

import * as Mousetrap from 'mousetrap';
import moment from 'moment';
import React from 'react';
import { Checkbox, Divider, Dropdown, Grid, Header, Input, Form, Ref } from 'semantic-ui-react';
import Debug from 'debug';
import { DIAGNOSES, DOCTORS, STAGES } from '../options';
import {
  EncounterClinicField,
  EncounterDateField,
  EncounterLocationField,
  EncounterNumberOfTasksField,
  EncounterTimeSpentField,
  SubmitButtons,
  today
} from '../shared-fields';
import { InfoButton } from '../InfoButton';
import {
  initialInterventionValues,
  interventionGroups,
  interventionOptions
} from '../patient-interventions';
import { chain, deburr, escapeRegExp, isEmpty } from 'lodash';

// eslint-disable-next-line no-unused-vars
import { withFormik, FormikErrors, FormikProps } from 'formik';
// eslint-disable-next-line no-unused-vars
import { EncounterFormProps, Intervention } from '../types';

const debug = Debug('tracking-tool:patient-encounter-form');

export type PatientEncounter = {
  [key: string]: any;

  _id?: string;
  clinic: string;
  dateOfBirth: string;
  diagnosisFreeText: string;
  diagnosisStage: string;
  diagnosisType: string;
  encounterDate: string;
  encounterType: 'patient';
  limitedEnglishProficiency: boolean;
  location: string;
  md: string[];
  mrn: string;
  numberOfTasks: string;
  patientName: string;
  research: boolean;
  timeSpent: string;
};

export const INITIAL_VALUES = (): PatientEncounter => ({
  clinic: '',
  dateOfBirth: '',
  diagnosisFreeText: '',
  diagnosisStage: '',
  diagnosisType: '',
  encounterDate: today(),
  encounterType: 'patient',
  limitedEnglishProficiency: false,
  location: '',
  md: [],
  mrn: '',
  numberOfTasks: '',
  patientName: '',
  research: false,
  timeSpent: '',
  ...initialInterventionValues
});

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

function parseDate(date: string) {
  return moment(date.trim(), [
    'MM/DD/YYYY',
    'M/D/YYYY',
    'MM/DD/YYYY',
    'M/D/YY',

    'MM-DD-YYYY',
    'M-D-YYYY',
    'MM-DD-YYYY',
    'M-D-YY',

    'YYYY-MM-DD'
  ]);
}

const docToOption = (doc: PatientEncounter) => {
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
    Initial Stage <InfoButton content={STAGE_LABEL_CONTENT} />
  </label>
);

const MD_LABEL = (
  <label>
    Provider{' '}
    <InfoButton
      content="Input multiple providers as appropriate. The first provider listed should be the primary provider associated with that day's encounter, which will most often be the medical oncologist. If responding to a radiation distress screen or seeing a patient in Palliative Care, list the radiation oncologist or palliative care provider as primary, and list the medical oncologist (if there is one) as secondary. Be sure to update the provider as needed for subsequent visits. &ldquo;Unassigned&rdquo; is an option that should be selected only on rare occasions&mdash;consider whether a radiation oncologist or &ldquo;Community&rdquo; encounter are more appropriate"
      wide="very"
    />
  </label>
);

const LIMITED_ENGLISH_PROFICIENCY_LABEL = (
  <label>
    Limited-English proficiency (LEP){' '}
    <InfoButton content="Mark this for patients with limited-English proficiency that require use of an interpreter" />
  </label>
);

const RESEARCH_LABEL = (
  <label>
    Is patient involved in research?{' '}
    <InfoButton content="Mark this if you were referred by or coordinated with the research team, or are aware that the patient is on a research protocol, being considered for one, or is coming off of one" />
  </label>
);

function indexValues(values: any) {
  return values.map((value: any, i: number) => ({ ...value, value: `${i}` }));
}

type PatientEncounterFormProps = {
  encounter: PatientEncounter | null;
} & EncounterFormProps;

type PatientEncounterFormState = {
  activeInfoButton: string | null;
  patientNameIndex: string;
  patientOptions: {
    content: any;
    encounter: {} | null;
    text: string;
    value: string;
  }[];
};

class UnwrappedPatientEncounterForm extends React.Component<
  PatientEncounterFormProps & FormikProps<PatientEncounter>,
  PatientEncounterFormState
> {
  patientNameRef: HTMLElement | undefined;
  dateOfBirthRef: HTMLElement | undefined;

  state = {
    activeInfoButton: null,
    patientNameIndex: '',
    patientOptions: []
  };

  setInitialEncounterList = () => {
    const { encounter, encounters } = this.props;

    // if we're editing an encounter then set the state to contain only the encounter's patient
    if (encounter) {
      return this.setState({
        patientOptions: [
          {
            content: encounter.patientName,
            encounter: null,
            text: encounter.patientName,
            value: '0'
          }
        ],
        patientNameIndex: '0'
      });
    }

    if (encounters) {
      this.setSearchEncounterList('');
    }
  };

  setSearchEncounterList = (searchQuery: string) => {
    this.props.encounters
      .find({ encounterType: 'patient', patientName: new RegExp(escapeRegExp(searchQuery), 'i') })
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

  clearForm = () => {
    this.props.setValues(INITIAL_VALUES());
    this.setState({ patientNameIndex: '' });
  };

  componentDidMount() {
    Mousetrap.bind('ctrl+backspace', this.clearForm);

    if (!this.props.encounter && this.patientNameRef) {
      const input = this.patientNameRef.querySelector('input');

      if (input) {
        input.focus();
      }
    }

    if (this.dateOfBirthRef) {
      const input = this.dateOfBirthRef.querySelector('input');
      const body = document.querySelector('body');

      if (!input || !body) {
        return;
      }

      // pasting into a date field requires a global handler as a workaround
      body.addEventListener('paste', (e: ClipboardEvent) => {
        if (document.activeElement !== input) {
          return;
        }

        e.preventDefault();
        e.stopPropagation();

        const value = e.clipboardData && e.clipboardData.getData('text');

        if (!value) {
          return;
        }

        const date = parseDate(value);

        if (!date.isValid()) {
          return;
        }

        this.props.setFieldValue('dateOfBirth', date.format('MM/DD/YYYY'));
      });
    }
  }

  componentWillUnmount() {
    Mousetrap.unbind('ctrl+backspace');
  }

  componentDidUpdate() {
    debug('componentDidUpdate %o', { props: this.props, state: this.state });
  }

  handleBlur = (e: any, data: any) =>
    this.props.setFieldTouched((data && data.name) || e.target.name, true);

  handleChange = (e: any, { name, value, checked }: any) =>
    this.props.setFieldValue(name, value !== undefined ? value : checked);

  handleChangeTrimmed = (e: any, { name, value }: any) =>
    this.props.setFieldValue(name, (value || '').trim());

  handlePatientAddition = (e: any, { value }: any) => {
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
        this.updatePatientIndexAndValue('0', INITIAL_VALUES(), value);
      }
    );
  };

  updatePatientIndexAndValue = (
    patientNameIndex: string,
    encounter: PatientEncounter,
    patientName: string
  ) => {
    const { setValues, values } = this.props;

    // this is faster than calling setFieldValue multiple times
    setValues({
      ...values,
      patientName,
      mrn: encounter.mrn,
      dateOfBirth: encounter.dateOfBirth,
      clinic: encounter.clinic,
      limitedEnglishProficiency: encounter.limitedEnglishProficiency,
      location: encounter.location,
      md: encounter.md,
      diagnosisType: encounter.diagnosisType,
      diagnosisFreeText: encounter.diagnosisFreeText,
      diagnosisStage: encounter.diagnosisStage,
      research: encounter.research
    });

    this.setState({ patientNameIndex });
  };

  handlePatientChange = (e: any, { value, options }: any) => {
    const selectedOption = options.find((option: any) => option.value === value);

    if (!selectedOption) {
      return this.updatePatientIndexAndValue('', INITIAL_VALUES(), '');
    }

    const encounter = (selectedOption && selectedOption['data-encounter']) || INITIAL_VALUES();
    const patientName = selectedOption && selectedOption['data-patient-name'];

    this.updatePatientIndexAndValue(selectedOption.value, encounter, patientName);
  };

  handlePatientNameSearch = (options: any, searchQuery: string) => {
    const strippedQuery = deburr(searchQuery);
    const re = new RegExp(escapeRegExp(strippedQuery), 'i');

    return options.filter((option: any) => re.test(deburr(option['data-patient-name'])));
  };

  handlePatientSearchChange = (e: any, { searchQuery }: { searchQuery: string }) => {
    if (searchQuery) {
      this.setSearchEncounterList(searchQuery);
    } else {
      this.setInitialEncounterList();
    }
  };

  handleInterventionChange = (e: any, data: { value: string } | undefined) => {
    if (!data) {
      return;
    }

    this.props.setFieldValue(data.value, true);
  };

  handleInterventionOnMouseEnter = (e: any) => {
    e.persist();

    this.setState({ activeInfoButton: e.target.parentElement.firstChild.name });
  };

  handleInterventionOnMouseLeave = (e: any) => {
    e.persist();

    this.setState(state => {
      if (state.activeInfoButton === e.target.parentElement.firstChild.name) {
        return { activeInfoButton: null } as PatientEncounterFormState;
      }
    });
  };

  renderField = (intervention: Intervention) => (
    <Form.Field
      checked={this.props.values[intervention.fieldName]}
      control={Checkbox}
      key={intervention.fieldName}
      label={
        <label>
          {intervention.name}{' '}
          {this.state.activeInfoButton === intervention.fieldName && (
            <InfoButton content={intervention.description} />
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

  renderScoredField = (intervention: Intervention) => {
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
            error={!!(touched[scoreFieldName] && errors[scoreFieldName])}
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
    const {
      dirty,
      encounter,
      errors,
      isSubmitting,
      onCancel,
      submitForm,
      touched,
      values
    } = this.props;

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

        <EncounterDateField
          error={!!(touched.encounterDate && errors.encounterDate)}
          onBlur={this.handleBlur}
          onChange={this.handleChange}
          value={values.encounterDate}
        />

        <Form.Group widths="equal">
          {encounter ? (
            <Form.Field
              control={Input}
              id="input-patient-name"
              label="Patient Name"
              name="patientName"
              onBlur={this.handleBlur}
              onChange={this.handleChange}
              onClose={this.handleBlur}
              placeholder="Last, First Middle"
              value={values.patientName}
            />
          ) : (
            <Ref innerRef={ref => (this.patientNameRef = ref)}>
              <Form.Field
                additionLabel="Add new patient "
                allowAdditions
                control={Dropdown}
                error={!!(touched.patientName && errors.patientName)}
                id="input-patient-name"
                label="Patient Name"
                name="patientName"
                noResultsMessage="Last, First Middle"
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
          )}

          <Form.Field
            control={Input}
            error={!!(touched.mrn && errors.mrn)}
            id="input-mrn"
            label="MRN"
            name="mrn"
            onBlur={this.handleBlur}
            onChange={this.handleChangeTrimmed}
            value={values.mrn}
          />

          <Ref innerRef={ref => (this.dateOfBirthRef = ref)}>
            <Form.Field
              control={Input}
              error={!!(touched.dateOfBirth && errors.dateOfBirth)}
              id="input-date-of-birth"
              label="Date of Birth"
              name="dateOfBirth"
              onBlur={this.handleBlur}
              onChange={this.handleChange}
              value={values.dateOfBirth}
            />
          </Ref>
        </Form.Group>

        <Form.Field
          control={Dropdown}
          deburr
          error={!!(touched.md && errors.md)}
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
          <EncounterLocationField
            error={!!(touched.location && errors.location)}
            onBlur={this.handleBlur}
            onChange={this.handleChange}
            value={values.location}
          />

          <EncounterClinicField
            error={!!(touched.clinic && errors.clinic)}
            onBlur={this.handleBlur}
            onChange={this.handleChange}
            value={values.clinic}
          />
        </Form.Group>

        <Form.Group widths="equal">
          <Form.Field
            control={Dropdown}
            error={!!(touched.diagnosisType && errors.diagnosisType)}
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
            error={!!(touched.diagnosisFreeText && errors.diagnosisFreeText)}
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
            error={!!(touched.diagnosisStage && errors.diagnosisStage)}
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

        <Form.Group>
          <Form.Field
            control={Checkbox}
            id="input-research"
            label={RESEARCH_LABEL}
            name="research"
            onBlur={this.handleBlur}
            onChange={this.handleChange}
            checked={values.research}
          />

          <Form.Field
            control={Checkbox}
            id="input-limited-english-proficiency"
            label={LIMITED_ENGLISH_PROFICIENCY_LABEL}
            name="limitedEnglishProficiency"
            onBlur={this.handleBlur}
            onChange={this.handleChange}
            checked={values.limitedEnglishProficiency}
          />
        </Form.Group>

        <Divider hidden />

        <Form.Field
          control={Dropdown}
          deburr
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

        <Grid columns={3} divided>
          <Grid.Row>{columns}</Grid.Row>
        </Grid>

        <Divider hidden />

        <Form.Group widths="equal">
          <EncounterTimeSpentField
            error={!!(touched.timeSpent && errors.timeSpent)}
            onBlur={this.handleBlur}
            onChange={this.handleChange}
            patient
            value={values.timeSpent}
          />

          <EncounterNumberOfTasksField
            error={!!(touched.numberOfTasks && errors.numberOfTasks)}
            onBlur={this.handleBlur}
            onChange={this.handleChange}
            patient
            value={values.numberOfTasks}
          />
        </Form.Group>

        <Divider hidden />

        <SubmitButtons
          isClean={!dirty}
          isSubmitting={isSubmitting}
          onCancel={onCancel}
          submitForm={submitForm}
        />
      </Form>
    );
  }
}

const RE_NUMERIC = /^\d+$/;
const isNumeric = (string: string) => RE_NUMERIC.test(string);

export const PatientEncounterForm = withFormik<PatientEncounterFormProps, PatientEncounter>({
  mapPropsToValues: props => {
    if (props.encounter) {
      return {
        ...props.encounter,

        dateOfBirth: parseDate(props.encounter.dateOfBirth).format('MM/DD/YYYY')
      };
    }

    return INITIAL_VALUES();
  },

  validate: values => {
    const errors: FormikErrors<PatientEncounter> = {};

    if (values.diagnosisType === 'Malignant') {
      if (!values.diagnosisFreeText) {
        errors.diagnosisFreeText = 'Diagnosis is required';
      }

      if (!values.diagnosisStage) {
        errors.diagnosisStage = 'Diagnosis stage is required';
      }
    }

    SCORED_FIELDS.forEach(field => {
      const scoredFieldName = `${field}Score`;

      if (
        values[field] &&
        !isNumeric(values[scoredFieldName]) &&
        values[scoredFieldName].toLowerCase() !== 'n/a'
      ) {
        errors[scoredFieldName] = 'Score is required';
      }
    });

    if (!/^100\d{7}$/.test(values.mrn)) {
      errors.mrn = 'MRN is required and must start with 100 followed by 7 digits';
    }

    NUMERIC_FIELDS.forEach(field => {
      if (!isNumeric(values[field])) {
        errors[field] = 'Must be a valid number';
      }
    });

    REQUIRED_FIELDS.forEach(field => {
      if (isEmpty(values[field])) {
        errors[field] = 'This field is required';
      }
    });

    if (!parseDate(values.dateOfBirth).isValid()) {
      errors.dateOfBirth = 'Must be a valid date';
    }

    if (!/(0|5)$/.test(values.timeSpent)) {
      errors.timeSpent = 'Must be rounded to the nearest multiple of 5';
    }

    return errors;
  },

  handleSubmit: (values, { props, setSubmitting }) => {
    const { encounters, encounter, onComplete } = props;

    if (encounter) {
      return encounters.update(
        { _id: encounter._id },
        values,
        {},
        (err: Error, numAffected: number) => {
          if (err || numAffected !== 1) {
            onComplete(err || new Error('Failed to update encounter'));
          } else {
            onComplete();
          }
        }
      );
    }

    encounters.insert(
      {
        ...values,

        dateOfBirth: parseDate(values.dateOfBirth).format('YYYY-MM-DD'),
        patientName: values.patientName.trim()
      },

      err => {
        setSubmitting(false);
        onComplete(err);
      }
    );
  }
})(UnwrappedPatientEncounterForm);

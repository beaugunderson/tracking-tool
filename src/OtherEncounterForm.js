// @flow

import camelcase from 'camelcase';
import React from 'react';
import slugify from 'slugify';
import { Checkbox, Divider, Form, Header } from 'semantic-ui-react';
import {
  EncounterDateField,
  EncounterNumberOfTasksField,
  EncounterTimeSpentField,
  SubmitButtons,
  today
} from './shared-fields';
import { InfoButton } from './InfoButton';
import { isEmpty } from 'lodash';
import { withFormik } from 'formik';

function addFieldNames(options) {
  return options.map(option => {
    const fieldName = camelcase(slugify(option.name, { lower: true, remove: /[^a-zA-Z0-9 -]/ }));

    return { ...option, fieldName, key: fieldName };
  });
}

const OPTIONS = addFieldNames([
  {
    name: 'Rounding/Tumor Board',
    description:
      'Rounding with provider(s), when not specific to any one patient; attending tumor board'
  },

  { name: 'Presentation', description: 'Include time spent in preparation' },

  {
    name: 'Committee Work',
    description:
      'Schedules, Share Drive, Meetings on Meetings, Distress Screening, Epic/Documentation, Safety'
  },

  { name: 'Project', description: 'Holiday Families, Intern Orientation' },

  {
    name: 'Support Group Facilitation',
    description:
      'Includes time in preparation for and participation in Living with Cancer, Caregiver, ' +
      'diagnosis specific groups, CLIMB, Tea for the Soul. Do not include external support ' +
      'groups unless you facilitate them as part of your job at SCI'
  },

  {
    name: 'Community Event/Fundraiser',
    description: 'Only those you attend as a representative of SCI'
  }
]);

function toInitialValues(options) {
  const values = {};

  options.forEach(option => (values[option.fieldName] = false));

  return values;
}

const initialValues = toInitialValues(OPTIONS);

const INITIAL_VALUES = {
  encounterDate: today(),
  location: '',
  numberOfTasks: '',
  timeSpent: '',
  ...initialValues
};

const NUMERIC_FIELDS = ['numberOfTasks', 'timeSpent'];

const REQUIRED_FIELDS = ['encounterDate'];

type OtherEncounterFormProps = {
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

type OtherEncounterFormState = {
  activeInfoButton: ?string
};

class UnwrappedOtherEncounterForm extends React.Component<
  OtherEncounterFormProps,
  OtherEncounterFormState
> {
  state = {
    activeInfoButton: null
  };

  handleBlur = (e, data) => this.props.setFieldTouched((data && data.name) || e.target.name, true);

  handleChange = (e, { name, value, checked }) =>
    this.props.setFieldValue(name, value !== undefined ? value : checked);

  handleOptionChange = (e, data) => {
    if (!data) {
      return;
    }

    this.props.setFieldValue(data.value, true);
  };

  handleOptionOnMouseEnter = e => {
    e.persist();
    this.setState({ activeInfoButton: e.target.parentElement.firstChild.name });
  };

  handleOptionOnMouseLeave = e => {
    e.persist();
    this.setState(state => {
      if (state.activeInfoButton === e.target.parentElement.firstChild.name) {
        return { activeInfoButton: null };
      }
    });
  };

  // TODO put this somewhere else
  renderField = option => (
    <Form.Field
      checked={this.props.values[option.fieldName]}
      control={Checkbox}
      key={option.fieldName}
      label={
        <label>
          {option.name}{' '}
          {this.state.activeInfoButton === option.fieldName && (
            <InfoButton content={option.description} on="hover" />
          )}
        </label>
      }
      name={option.fieldName}
      onBlur={this.handleBlur}
      onChange={this.handleChange}
      onMouseEnter={this.handleOptionOnMouseEnter}
      onMouseLeave={this.handleOptionOnMouseLeave}
    />
  );

  render() {
    const { errors, isSubmitting, onCancel, submitForm, touched, values } = this.props;
    const options = OPTIONS.map(option => this.renderField(option));

    return (
      <Form size="large">
        <Header>New Other Encounter</Header>

        <EncounterDateField
          error={touched.encounterDate && errors.encounterDate}
          onBlur={this.handleBlur}
          onChange={this.handleChange}
          value={values.encounterDate}
        />

        <Divider hidden />

        <Form.Group grouped>{options}</Form.Group>

        <Divider hidden />

        <Form.Group widths="equal">
          <EncounterTimeSpentField
            error={touched.timeSpent && errors.timeSpent}
            onBlur={this.handleBlur}
            onChange={this.handleChange}
            value={values.timeSpent}
          />

          <EncounterNumberOfTasksField
            error={touched.numberOfTasks && errors.numberOfTasks}
            onBlur={this.handleBlur}
            onChange={this.handleChange}
            value={values.numberOfTasks}
          />
        </Form.Group>

        <Divider hidden />

        <SubmitButtons isSubmitting={isSubmitting} onCancel={onCancel} submitForm={submitForm} />
      </Form>
    );
  }
}

export const OtherEncounterForm = withFormik({
  mapPropsToValues: () => INITIAL_VALUES,

  validate: values => {
    const errors = {};

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
    props.encounters.insert({ ...values, encounterType: 'other' }, err => {
      setSubmitting(false);

      if (err) {
        props.onError(err);
      } else {
        props.onComplete();
      }
    });
  }
})(UnwrappedOtherEncounterForm);

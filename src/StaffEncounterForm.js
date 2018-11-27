// @flow

import React from 'react';
import { Divider, Header, Form } from 'semantic-ui-react';
import {
  EncounterClinicField,
  EncounterDateField,
  EncounterLocationField,
  EncounterNumberOfTasksField,
  EncounterTimeSpentField,
  SubmitButtons,
  today
} from './shared-fields';
import { isEmpty } from 'lodash';
import { withFormik } from 'formik';

const INITIAL_VALUES = {
  clinic: '',
  encounterDate: today(),
  location: '',
  numberOfTasks: '',
  timeSpent: ''
};

const NUMERIC_FIELDS = ['numberOfTasks', 'timeSpent'];

const REQUIRED_FIELDS = ['clinic', 'encounterDate', 'location'];

type StaffEncounterFormProps = {
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

class UnwrappedStaffEncounterForm extends React.Component<StaffEncounterFormProps> {
  handleBlur = (e, data) => this.props.setFieldTouched((data && data.name) || e.target.name, true);

  handleChange = (e, { name, value, checked }) =>
    this.props.setFieldValue(name, value !== undefined ? value : checked);

  render() {
    const { errors, isSubmitting, onCancel, submitForm, touched, values } = this.props;

    return (
      <Form size="large">
        <Header>New Staff Encounter</Header>

        <EncounterDateField
          error={touched.encounterDate && errors.encounterDate}
          onBlur={this.handleBlur}
          onChange={this.handleChange}
          value={values.encounterDate}
        />

        <Form.Group widths="equal">
          <EncounterLocationField
            error={touched.location && errors.location}
            onBlur={this.handleBlur}
            onChange={this.handleChange}
            value={values.location}
          />

          <EncounterClinicField
            error={touched.clinic && errors.clinic}
            onBlur={this.handleBlur}
            onChange={this.handleChange}
            value={values.clinic}
          />
        </Form.Group>

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

export const StaffEncounterForm = withFormik({
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
    props.encounters.insert({ ...values, encounterType: 'staff' }, err => {
      setSubmitting(false);

      if (err) {
        props.onError(err);
      } else {
        props.onComplete();
      }
    });
  }
})(UnwrappedStaffEncounterForm);

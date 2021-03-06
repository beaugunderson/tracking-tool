import React from 'react';
import { Divider, Form, Header } from 'semantic-ui-react';
import {
  EncounterClinicField,
  EncounterDateField,
  EncounterLocationField,
  EncounterNumberOfTasksField,
  EncounterTimeSpentField,
  SubmitButtons,
  today,
} from '../shared-fields';
import { EncounterFormProps } from '../types';
import { FormikErrors, FormikProps, withFormik } from 'formik';
import { isEmpty } from 'lodash';

type StaffEncounter = {
  [key: string]: any;

  _id?: string;
  username?: string;

  clinic: string;
  encounterDate: string;
  encounterType: 'staff';
  location: string;
  numberOfTasks: string;
  timeSpent: string;
};

const INITIAL_VALUES = (): StaffEncounter => ({
  clinic: '',
  encounterDate: today(),
  encounterType: 'staff',
  location: '',
  numberOfTasks: '',
  timeSpent: '',
});

const NUMERIC_FIELDS = ['numberOfTasks', 'timeSpent'];

const REQUIRED_FIELDS = ['clinic', 'encounterDate', 'location'];

type StaffEncounterFormProps = {
  encounter: StaffEncounter | null;
} & EncounterFormProps;

class UnwrappedStaffEncounterForm extends React.Component<
  StaffEncounterFormProps & FormikProps<StaffEncounter>
> {
  handleBlur = (e, data) => this.props.setFieldTouched((data && data.name) || e.target.name, true);

  handleChange = (e, { name, value, checked }) =>
    this.props.setFieldValue(name, value !== undefined ? value : checked);

  handleLocationChange = (e, { value }) => {
    this.props.setFieldValue('location', value);
    this.props.setFieldValue('clinic', '');
  };

  render() {
    const { dirty, errors, isSubmitting, onCancel, submitForm, touched, values } = this.props;

    return (
      <Form size="large">
        <Header>New Staff Encounter</Header>

        <EncounterDateField
          error={!!(touched.encounterDate && errors.encounterDate)}
          onBlur={this.handleBlur}
          onChange={this.handleChange}
          value={values.encounterDate}
        />

        <Form.Group widths="equal">
          <EncounterLocationField
            error={!!(touched.location && errors.location)}
            onBlur={this.handleBlur}
            onChange={this.handleLocationChange}
            value={values.location}
          />

          <EncounterClinicField
            error={!!(touched.clinic && errors.clinic)}
            location={values.location}
            onBlur={this.handleBlur}
            onChange={this.handleChange}
            staff
            value={values.clinic}
          />
        </Form.Group>

        <Form.Group widths="equal">
          <EncounterTimeSpentField
            error={!!(touched.timeSpent && errors.timeSpent)}
            onBlur={this.handleBlur}
            onChange={this.handleChange}
            value={values.timeSpent}
          />

          <EncounterNumberOfTasksField
            error={!!(touched.numberOfTasks && errors.numberOfTasks)}
            onBlur={this.handleBlur}
            onChange={this.handleChange}
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

export const StaffEncounterForm = withFormik<StaffEncounterFormProps, StaffEncounter>({
  mapPropsToValues: (props) => {
    if (props.encounter) {
      return props.encounter;
    }

    return INITIAL_VALUES();
  },

  validate: (values) => {
    const errors: FormikErrors<StaffEncounter> = {};

    NUMERIC_FIELDS.forEach((field) => {
      if (!/^\d+$/.test(values[field])) {
        errors[field] = 'Field must be a number';
      }
    });

    REQUIRED_FIELDS.forEach((field) => {
      if (isEmpty(values[field])) {
        errors[field] = 'Field is required';
      }
    });

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

    encounters.insert(values, (err) => {
      setSubmitting(false);
      onComplete(err);
    });
  },
})(UnwrappedStaffEncounterForm);

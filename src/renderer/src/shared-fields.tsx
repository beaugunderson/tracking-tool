/* eslint-disable max-classes-per-file */

import moment from 'moment';
import React from 'react';
import {
  CLINIC_LOCATION_OPTIONS,
  CLINIC_LOCATION_STAFF_OPTIONS,
  LOCATION_OPTIONS,
  Option,
} from './options';
import { DATE_FORMAT_DATABASE } from './constants';
import { Dropdown, Form, Input, Popup } from 'semantic-ui-react';
import { InfoButton } from './InfoButton';

const EMPTY_ARRAY: never[] = [] as never[];

type FieldProps = {
  disabled?: boolean;
  error: boolean;
  value: string | string[];
  onBlur: (e: React.FocusEvent, data?: { name: string }) => void;
  onChange: (
    e: React.SyntheticEvent,
    data: { name?: string; value?: string | string[] | boolean; checked?: boolean },
  ) => void;
};

export const today = () => moment().format(DATE_FORMAT_DATABASE);

export class EncounterDateField extends React.Component<FieldProps> {
  render() {
    const { error, onBlur, onChange, value } = this.props;

    return (
      <Form.Field
        control={Input}
        error={error}
        id="input-encounter-date"
        label="Encounter Date"
        name="encounterDate"
        onBlur={onBlur}
        onChange={onChange}
        type="date"
        value={value}
      />
    );
  }
}

type EncounterLocationFieldProps = FieldProps & {
  locations?: Option[];
};

export class EncounterLocationField extends React.Component<EncounterLocationFieldProps> {
  // eslint-disable-next-line react/static-property-placement
  static defaultProps = {
    locations: LOCATION_OPTIONS,
  };

  render() {
    const { disabled, error, locations, onBlur, onChange, value } = this.props;

    return (
      <Form.Field
        control={Dropdown}
        disabled={!!disabled}
        error={error}
        id="input-location"
        label="Location"
        name="location"
        onBlur={onBlur}
        onChange={onChange}
        onClose={onBlur}
        options={locations}
        search
        selection
        selectOnBlur={false}
        value={value}
      />
    );
  }
}

type EncounterClinicFieldProps = FieldProps & {
  community?: boolean;
  location: string;
  staff?: boolean;
};

// Used in Patient and Staff encounters
export class EncounterClinicField extends React.Component<EncounterClinicFieldProps> {
  render() {
    const { disabled, error, location, onBlur, onChange, staff, value } = this.props;

    return (
      <Form.Field
        control={Dropdown}
        disabled={!!disabled}
        error={error}
        id="input-clinic"
        label="Clinic"
        name="clinic"
        onBlur={onBlur}
        onChange={onChange}
        onClose={onBlur}
        options={
          (staff ? CLINIC_LOCATION_STAFF_OPTIONS[location] : CLINIC_LOCATION_OPTIONS[location]) ||
          EMPTY_ARRAY
        }
        search
        selection
        selectOnBlur={false}
        value={value}
      />
    );
  }
}

const TIME_SPENT_PATIENT_LABEL = (
  <label>
    Time Spent{' '}
    <InfoButton content="The number of total minutes on all encounters for this patient on this day, rounded up to the nearest 5 (e.g. 75 minutes), including full representation of time spent documenting, can also include travel time (5-10 minutes) and time spent waiting to see the patient" />
  </label>
);

const TIME_SPENT_OTHER_LABEL = (
  <label>
    Time Spent{' '}
    <InfoButton content="The number of total minutes on all encounters for this entry on this day, rounded up to the nearest 5 (e.g. 75 minutes)" />
  </label>
);

const NUMBER_OF_TASKS_PATIENT_LABEL = (
  <label>
    Number of Tasks{' '}
    <InfoButton
      content="The number of tasks associated with the encounter, equal to the number of lines you would have completed in the old spreadsheet format. Include 1 task for documentation. For example, discussion with MD, seeing patient, coordinating with PFA, and starting documentation would equal 4 tasks. If completing documentation on another day without a patient encounter, enter 1 task"
      wide
    />
  </label>
);

const NUMBER_OF_TASKS_OTHER_LABEL = (
  <label>
    Number of Tasks{' '}
    <InfoButton
      content="The number of tasks associated with the encounter, equal to the number of lines you would have completed in the old spreadsheet format"
      wide
    />
  </label>
);

type EncounterTimeSpentFieldProps = FieldProps & {
  patient?: boolean;
};

export class EncounterTimeSpentField extends React.Component<EncounterTimeSpentFieldProps> {
  render() {
    const { error, onBlur, onChange, patient, value } = this.props;

    // could require a multiple of 5, could round up automatically
    return (
      <Form.Field
        control={Input}
        error={error}
        label={patient ? TIME_SPENT_PATIENT_LABEL : TIME_SPENT_OTHER_LABEL}
        name="timeSpent"
        onBlur={onBlur}
        onChange={onChange}
        value={value}
      />
    );
  }
}

type EncounterNumberOfTasksFieldProps = FieldProps & {
  patient?: boolean;
};

export class EncounterNumberOfTasksField extends React.Component<EncounterNumberOfTasksFieldProps> {
  render() {
    const { error, onBlur, onChange, patient, value } = this.props;

    return (
      <Form.Field
        control={Input}
        error={error}
        label={patient ? NUMBER_OF_TASKS_PATIENT_LABEL : NUMBER_OF_TASKS_OTHER_LABEL}
        name="numberOfTasks"
        onBlur={onBlur}
        onChange={onChange}
        value={value}
      />
    );
  }
}

type SubmitButtonsProps = {
  isClean?: boolean;
  isSubmitting: boolean;
  onCancel: () => void;
  submitForm: () => void;
};

export class SubmitButtons extends React.Component<SubmitButtonsProps> {
  render() {
    const { isClean, isSubmitting, onCancel, submitForm } = this.props;

    return (
      <Form.Group>
        <Form.Button disabled={isSubmitting} onClick={submitForm} primary size="big">
          Save Encounter
        </Form.Button>

        {isClean ? (
          <Form.Button
            content="Cancel"
            disabled={isSubmitting}
            negative
            onClick={onCancel}
            size="big"
          />
        ) : (
          <Popup
            // eslint-disable-next-line react-perf/jsx-no-jsx-as-prop
            trigger={<Form.Button content="Cancel" disabled={isSubmitting} negative size="big" />}
            // eslint-disable-next-line react-perf/jsx-no-jsx-as-prop
            content={<Form.Button content="Confirm?" onClick={onCancel} />}
            on="click"
          />
        )}
      </Form.Group>
    );
  }
}

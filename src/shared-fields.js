// @flow

import moment from 'moment';
import React from 'react';
import { CLINICS, LOCATIONS } from './options';
import { Dropdown, Form, Input, Popup } from 'semantic-ui-react';
import { InfoButton } from './InfoButton';

type FieldProps = {
  error: boolean,
  value: string | boolean | Array<*>,
  onBlur: *,
  onChange: *
};

export const today = () => moment().format('YYYY-MM-DD');

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

export class EncounterLocationField extends React.Component<FieldProps> {
  render() {
    const { error, onBlur, onChange, value } = this.props;

    return (
      <Form.Field
        control={Dropdown}
        error={error}
        id="input-location"
        label="Location"
        name="location"
        onBlur={onBlur}
        onChange={onChange}
        onClose={onBlur}
        options={LOCATIONS}
        search
        selection
        selectOnBlur={false}
        value={value}
      />
    );
  }
}

export class EncounterClinicField extends React.Component<FieldProps> {
  render() {
    const { error, onBlur, onChange, value } = this.props;

    return (
      <Form.Field
        control={Dropdown}
        error={error}
        id="input-clinic"
        label="Clinic"
        name="clinic"
        onBlur={onBlur}
        onChange={onChange}
        onClose={onBlur}
        options={CLINICS}
        search
        selection
        selectOnBlur={false}
        value={value}
      />
    );
  }
}

export class EncounterTimeSpentField extends React.Component<FieldProps> {
  label = (
    <label>
      Time Spent{' '}
      <InfoButton
        content="The number of total minutes on all encounters for this patient on this day, rounded up to the nearest 5, e.g. 75 minutes, including full representation of time spent documenting"
        on="hover"
      />
    </label>
  );

  render() {
    const { error, onBlur, onChange, value } = this.props;

    // could require a multiple of 5, could round up automatically
    return (
      <Form.Field
        control={Input}
        error={error}
        label={this.label}
        name="timeSpent"
        onBlur={onBlur}
        onChange={onChange}
        value={value}
      />
    );
  }
}

export class EncounterNumberOfTasksField extends React.Component<FieldProps> {
  label = (
    <label>
      Number of Tasks{' '}
      <InfoButton
        content="The number of tasks associated with the encounter, equal to the number of lines you would have completed in the old spreadsheet format. For example, discussion with MD, seeing patient, and coordinating with PFA would equal 3 tasks"
        on="hover"
      />
    </label>
  );

  render() {
    const { error, onBlur, onChange, value } = this.props;

    return (
      <Form.Field
        control={Input}
        error={error}
        label={this.label}
        name="numberOfTasks"
        onBlur={onBlur}
        onChange={onChange}
        value={value}
      />
    );
  }
}

type SubmitButtonsProps = {
  isSubmitting: boolean,
  onCancel: *,
  submitForm: *
};

export class SubmitButtons extends React.Component<SubmitButtonsProps> {
  render() {
    const { isSubmitting, onCancel, submitForm } = this.props;

    return (
      <Form.Group>
        <Form.Button disabled={isSubmitting} onClick={submitForm} primary size="big">
          Save Encounter
        </Form.Button>

        <Popup
          trigger={<Form.Button content="Cancel" disabled={isSubmitting} negative size="big" />}
          content={<Form.Button content="Confirm?" onClick={onCancel} />}
          on="click"
        />
      </Form.Group>
    );
  }
}

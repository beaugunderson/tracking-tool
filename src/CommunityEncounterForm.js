// @flow

import React from 'react';
import {
  communityInitialInterventionValues,
  communityInterventionGroups,
  communityInterventionOptions
} from './patient-interventions';
import { Checkbox, Divider, Dropdown, Form, Grid, Header } from 'semantic-ui-react';
import {
  EncounterDateField,
  EncounterLocationField,
  EncounterNumberOfTasksField,
  EncounterTimeSpentField,
  SubmitButtons,
  today
} from './shared-fields';
import { InfoButton } from './InfoButton';
import { isEmpty } from 'lodash';
import { withFormik } from 'formik';

const INITIAL_VALUES = {
  encounterDate: today(),
  location: '',
  numberOfTasks: '',
  timeSpent: '',
  ...communityInitialInterventionValues
};

const NUMERIC_FIELDS = ['numberOfTasks', 'timeSpent'];

const REQUIRED_FIELDS = ['encounterDate', 'location'];

type CommunityEncounterFormProps = {
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

type CommunityEncounterFormState = {
  activeInfoButton: ?string
};

class UnwrappedCommunityEncounterForm extends React.Component<
  CommunityEncounterFormProps,
  CommunityEncounterFormState
> {
  state = {
    activeInfoButton: null
  };

  handleBlur = (e, data) => this.props.setFieldTouched((data && data.name) || e.target.name, true);

  handleChange = (e, { name, value, checked }) =>
    this.props.setFieldValue(name, value !== undefined ? value : checked);

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

  // TODO put this somewhere else
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

  render() {
    const { errors, isSubmitting, onCancel, submitForm, touched, values } = this.props;

    const columns = communityInterventionGroups.map((column, i) => {
      return (
        <Grid.Column key={i}>
          {column.map((group, j) => {
            return (
              <Form.Group grouped key={`${i}-${j}`}>
                <label>{group.label}</label>

                {group.interventions.map(intervention => this.renderField(intervention))}
              </Form.Group>
            );
          })}
        </Grid.Column>
      );
    });

    return (
      <Form size="large">
        <Header>New Community Encounter</Header>

        <EncounterDateField
          error={touched.encounterDate && errors.encounterDate}
          onBlur={this.handleBlur}
          onChange={this.handleChange}
          value={values.encounterDate}
        />

        <EncounterLocationField
          error={touched.location && errors.location}
          onBlur={this.handleBlur}
          onChange={this.handleChange}
          value={values.location}
        />

        <Divider hidden />

        <Form.Field
          control={Dropdown}
          fluid
          onChange={this.handleInterventionChange}
          openOnFocus={false}
          options={communityInterventionOptions}
          placeholder="Search for an intervention"
          search
          selection
          selectOnBlur={false}
          selectOnNavigation={false}
          upward
          value=""
        />

        <Divider hidden />

        <Grid columns={communityInterventionGroups.length} divided>
          <Grid.Row>{columns}</Grid.Row>
        </Grid>

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

export const CommunityEncounterForm = withFormik({
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
    props.encounters.insert({ ...values, encounterType: 'community' }, err => {
      setSubmitting(false);

      if (err) {
        props.onError(err);
      } else {
        props.onComplete();
      }
    });
  }
})(UnwrappedCommunityEncounterForm);

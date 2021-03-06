import React from 'react';
import { Checkbox, Divider, Dropdown, Form, Grid, Header } from 'semantic-ui-react';
import { COMMUNITY_LOCATION_OPTIONS } from '../options';
import {
  communityInitialInterventionValues,
  communityInterventionGroups,
  communityInterventionOptions,
  InitialCommunityInterventionValues,
} from '../patient-interventions';
import {
  EncounterDateField,
  EncounterLocationField,
  EncounterNumberOfTasksField,
  EncounterTimeSpentField,
  SubmitButtons,
  today,
} from '../shared-fields';
import { EncounterFormProps, Intervention } from '../types';
import { FormikErrors, FormikProps, withFormik } from 'formik';
import { InfoButtonLabel } from '../InfoButtonLabel';
import { isEmpty } from 'lodash';

export type CommunityEncounter = InitialCommunityInterventionValues & {
  _id?: string;
  username?: string;

  encounterDate: string;
  encounterType: 'community';
  location: string;
  numberOfTasks: string;
  timeSpent: string;
};

const INITIAL_VALUES = (): CommunityEncounter => ({
  encounterDate: today(),
  encounterType: 'community',
  location: '',
  numberOfTasks: '',
  timeSpent: '',
  ...communityInitialInterventionValues,
});

const NUMERIC_FIELDS = ['numberOfTasks', 'timeSpent'];

const REQUIRED_FIELDS = ['encounterDate', 'location'];

type CommunityEncounterFormProps = {
  encounter: CommunityEncounter | null;
} & EncounterFormProps;

type CommunityEncounterFormState = {
  activeInfoButton: string | null;
};

class UnwrappedCommunityEncounterForm extends React.Component<
  CommunityEncounterFormProps & FormikProps<CommunityEncounter>,
  CommunityEncounterFormState
> {
  state = {
    activeInfoButton: null,
  };

  handleBlur = (e, data) => this.props.setFieldTouched((data && data.name) || e.target.name, true);

  handleChange = (e, { name, value, checked }) =>
    this.props.setFieldValue(name, value !== undefined ? value : checked);

  handleInterventionChange = (e: React.FormEvent<HTMLInputElement>, data) => {
    if (!data) {
      return;
    }

    this.props.setFieldValue(data.value, true);
  };

  handleInterventionOnMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    e.persist();
    this.setState({
      activeInfoButton: ((e.target as HTMLDivElement).parentElement.firstChild as HTMLInputElement)
        .name,
    });
  };

  handleInterventionOnMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    e.persist();
    this.setState((state) => {
      if (
        state.activeInfoButton ===
        ((e.target as HTMLDivElement).parentElement.firstChild as HTMLInputElement).name
      ) {
        return { activeInfoButton: null } as CommunityEncounterFormState;
      }

      return null;
    });
  };

  // TODO put this somewhere else
  renderField = (intervention: Intervention) => (
    <Form.Field
      checked={this.props.values[intervention.fieldName]}
      control={Checkbox}
      key={intervention.fieldName}
      label={
        <InfoButtonLabel
          description={intervention.description}
          name={intervention.name}
          show={this.state.activeInfoButton === intervention.fieldName}
        />
      }
      name={intervention.fieldName}
      onBlur={this.handleBlur}
      onChange={this.handleChange}
      onMouseEnter={this.handleInterventionOnMouseEnter}
      onMouseLeave={this.handleInterventionOnMouseLeave}
    />
  );

  render() {
    const { dirty, errors, isSubmitting, onCancel, submitForm, touched, values } = this.props;

    const columns = communityInterventionGroups.map((column, i) => {
      return (
        <Grid.Column key={i}>
          {column.map((group, j) => {
            return (
              <Form.Group grouped key={`${i}-${j}`}>
                <label>{group.label}</label>

                {group.interventions.map((intervention) => this.renderField(intervention))}
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
          error={!!(touched.encounterDate && errors.encounterDate)}
          onBlur={this.handleBlur}
          onChange={this.handleChange}
          value={values.encounterDate}
        />

        <EncounterLocationField
          error={!!(touched.location && errors.location)}
          locations={COMMUNITY_LOCATION_OPTIONS}
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

        <Grid columns={3} divided>
          <Grid.Row>{columns}</Grid.Row>
        </Grid>

        <Divider hidden />

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

export const CommunityEncounterForm = withFormik<CommunityEncounterFormProps, CommunityEncounter>({
  mapPropsToValues: (props) => {
    if (props.encounter) {
      return props.encounter;
    }

    return INITIAL_VALUES();
  },

  validate: (values) => {
    const errors: FormikErrors<CommunityEncounter> = {};

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
})(UnwrappedCommunityEncounterForm);

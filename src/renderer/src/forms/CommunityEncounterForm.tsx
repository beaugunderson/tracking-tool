import React, { useCallback, useState } from 'react';
import { COMMUNITY_LOCATION_OPTIONS } from '../options';
import {
  communityInitialInterventionValues,
  communityInterventionGroups,
  communityInterventionOptions,
  InitialCommunityInterventionValues,
} from '../patient-interventions';
import { Divider, Dropdown, Form, Grid, Header } from 'semantic-ui-react';
import {
  EncounterDateField,
  EncounterLocationField,
  EncounterNumberOfTasksField,
  EncounterTimeSpentField,
  SubmitButtons,
  today,
} from '../shared-fields';
import { EncounterFormProps } from '../types';
import { FormikErrors, useFormik } from 'formik';
import { InterventionField } from '../components/InterventionField';
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

function UnwrappedCommunityEncounterForm({
  encounter,
  onCancel,
  onComplete,
}: CommunityEncounterFormProps) {
  const [activeInfoButton, setActiveInfoButton] = useState<string | null>(null);

  const formik = useFormik<CommunityEncounter>({
    initialValues: encounter || INITIAL_VALUES(),

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

    onSubmit: async (values, { setSubmitting }) => {
      try {
        if (encounter) {
          const numAffected = await window.trackingTool.dbUpdate({ _id: encounter._id }, values);
          if (numAffected !== 1) {
            return onComplete(new Error('Failed to update encounter'));
          }
          return onComplete();
        }

        await window.trackingTool.dbInsert(values);
        setSubmitting(false);
        onComplete();
      } catch (err) {
        onComplete(err as Error);
      }
    },
  });

  const {
    dirty,
    errors,
    isSubmitting,
    setFieldTouched,
    setFieldValue,
    submitForm,
    touched,
    values,
  } = formik;

  const handleBlur = useCallback(
    (e: React.FocusEvent, data?: { name: string }) =>
      setFieldTouched((data && data.name) || (e.target as HTMLInputElement).name, true),
    [setFieldTouched],
  );

  const handleChange = useCallback(
    (
      _e: React.SyntheticEvent,
      data: { name?: string; value?: string | string[] | boolean; checked?: boolean },
    ) => setFieldValue(data.name!, data.value !== undefined ? data.value : data.checked),
    [setFieldValue],
  );

  const handleInterventionChange = useCallback(
    (_e: React.SyntheticEvent, data: { value: string } | undefined) => {
      if (!data) {
        return;
      }

      setFieldValue(data.value, true);
    },
    [setFieldValue],
  );

  const handleInterventionOnMouseEnter = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    setActiveInfoButton(
      ((e.target as HTMLDivElement).parentElement!.firstChild as HTMLInputElement).name,
    );
  }, []);

  const handleInterventionOnMouseLeave = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const { name } = (e.target as HTMLDivElement).parentElement!.firstChild as HTMLInputElement;
    setActiveInfoButton((prev) => (prev === name ? null : prev));
  }, []);

  const columns = communityInterventionGroups.map((column, i) => {
    return (
      <Grid.Column key={i}>
        {column.map((group, j) => {
          return (
            <Form.Group grouped key={`${i}-${j}`}>
              <label>{group.label}</label>

              {group.interventions.map((intervention) => (
                <InterventionField
                  activeInfoButton={activeInfoButton}
                  checked={values[intervention.fieldName]}
                  description={intervention.description}
                  fieldName={intervention.fieldName}
                  key={intervention.fieldName}
                  name={intervention.name}
                  onBlur={handleBlur}
                  onChange={handleChange}
                  onMouseEnter={handleInterventionOnMouseEnter}
                  onMouseLeave={handleInterventionOnMouseLeave}
                />
              ))}
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
        onBlur={handleBlur}
        onChange={handleChange}
        value={values.encounterDate}
      />

      <EncounterLocationField
        error={!!(touched.location && errors.location)}
        locations={COMMUNITY_LOCATION_OPTIONS}
        onBlur={handleBlur}
        onChange={handleChange}
        value={values.location}
      />

      <Divider hidden />

      <Form.Field
        control={Dropdown}
        fluid
        onChange={handleInterventionChange}
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
          onBlur={handleBlur}
          onChange={handleChange}
          value={values.timeSpent}
        />

        <EncounterNumberOfTasksField
          error={!!(touched.numberOfTasks && errors.numberOfTasks)}
          onBlur={handleBlur}
          onChange={handleChange}
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

export const CommunityEncounterForm = UnwrappedCommunityEncounterForm;

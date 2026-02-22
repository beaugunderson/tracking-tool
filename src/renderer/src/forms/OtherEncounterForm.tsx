import React, { useCallback, useMemo, useState } from 'react';
import { Divider, Form, Header, Radio } from 'semantic-ui-react';
import {
  EncounterDateField,
  EncounterTimeSpentField,
  SubmitButtons,
  today,
} from '../shared-fields';
import { EncounterFormProps } from '../types';
import { find, isEmpty } from 'lodash';
import { FormikErrors, useFormik } from 'formik';
import { InfoButtonLabel } from '../InfoButtonLabel';
import { nameToFieldName } from '../patient-interventions';

function addFieldNames(options: { name: string; description: string }[]) {
  return options.map((option) => {
    const fieldName = nameToFieldName(option.name);

    return { ...option, fieldName, key: fieldName };
  });
}

type Option = {
  name: string;
  description: string;
  fieldName: string;
};

export const OTHER_ENCOUNTER_OPTIONS: Option[] = addFieldNames([
  {
    name: 'Rounding/Tumor Board',
    description:
      'Rounding with provider(s) when not specific to any one patient; attending tumor board; chart review on multiple patients as part of rounding. If you round with your clinics and later with your pod, or attend tumor board and later round with your clinics, these should be two separate entries',
  },

  {
    name: 'Distress Audit',
    description:
      'Use for auditing distress screens for radiation, radiosurgery, or when covering for ' +
      'another clinician if you are dispersing them without following up on any of them. Do not ' +
      'track this for your own audit',
  },

  {
    name: 'Presentation',
    description:
      'When giving a presentation or training related to your role as an oncology social worker at SCI ' +
      '(versus your work on a board), track time spent in preparation for, giving, and in ' +
      'wrap-up of your presentation. This could include presentations for Swedish symposiums, ' +
      'donor groups like Harvey Marine or MI Rotary, at AOSW or SSWLHC conferences, or on a ' +
      'panel for organizations like PanCan and LLS',
  },

  {
    name: 'Committee Work',
    description:
      'Schedules, Share Drive, Meetings on Meetings, Distress Screening, Epic/Documentation, Safety',
  },

  { name: 'Project', description: 'Holiday Families, Intern Orientation' },

  {
    name: 'SMART Group Facilitation',
    description: 'To be used for the direct facilitation of a SMART Group',
  },

  {
    name: 'SMART Planning/Development',
    description:
      'To be used for program planning and development related to SMART; excludes SMART training',
  },

  {
    name: 'Support Group Facilitation',
    description:
      'Includes time in preparation for and participation in Living with Cancer, Caregiver, ' +
      'diagnosis specific groups, CLIMB, Tea for the Soul. Do not include external support ' +
      'groups unless you facilitate them as part of your job at SCI',
  },

  {
    name: 'Community Event/Fundraiser',
    description: 'Only those you attend as a representative of SCI',
  },
]);

export function fieldNameToName(fieldName: string) {
  const option = find(OTHER_ENCOUNTER_OPTIONS, { fieldName });

  return (option && option.name) || '';
}

export type OtherEncounter = {
  _id?: string;
  username?: string;

  activity: string;
  encounterDate: string;
  encounterType: 'other';
  location: string;
  timeSpent: string;
};

const INITIAL_VALUES = (): OtherEncounter => ({
  encounterDate: today(),
  encounterType: 'other',
  location: '',
  timeSpent: '',
  activity: '',
});

const NUMERIC_FIELDS = ['timeSpent'];

const REQUIRED_FIELDS = ['encounterDate'];

type OtherEncounterFormProps = {
  encounter: OtherEncounter | null;
} & EncounterFormProps;

function OtherActivityField({
  activeInfoButton,
  activity,
  onBlur,
  onMouseEnter,
  onMouseLeave,
  option,
  setFieldValue,
}: {
  activeInfoButton: string | null;
  activity: string;
  onBlur: (e: React.FocusEvent, data?: { name: string }) => void;
  onMouseEnter: (e: React.MouseEvent<HTMLDivElement>) => void;
  onMouseLeave: (e: React.MouseEvent<HTMLDivElement>) => void;
  option: Option;
  setFieldValue: (field: string, value: unknown) => void;
}) {
  const label = useMemo(
    () => (
      <InfoButtonLabel
        description={option.description}
        name={option.name}
        show={activeInfoButton === option.fieldName}
      />
    ),
    [option.description, option.name, activeInfoButton, option.fieldName],
  );

  const handleChange = useCallback(
    () => setFieldValue('activity', option.fieldName),
    [setFieldValue, option.fieldName],
  );

  return (
    <Form.Field
      checked={activity === option.fieldName}
      control={Radio}
      label={label}
      name={option.fieldName}
      onBlur={onBlur}
      onChange={handleChange}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    />
  );
}

function UnwrappedOtherEncounterForm({
  encounter,
  onCancel,
  onComplete,
}: OtherEncounterFormProps) {
  const [activeInfoButton, setActiveInfoButton] = useState<string | null>(null);

  const formik = useFormik<OtherEncounter>({
    initialValues: encounter || INITIAL_VALUES(),

    validate: (values) => {
      const errors: FormikErrors<OtherEncounter> = {};

      NUMERIC_FIELDS.forEach((field) => {
        if (!/^\d+$/.test(values[field])) {
          errors[field] = 'Field must be a valid number';
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

  const handleOptionOnMouseEnter = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    setActiveInfoButton(
      ((e.target as HTMLDivElement).parentElement!.firstChild as HTMLInputElement).name,
    );
  }, []);

  const handleOptionOnMouseLeave = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const { name } = (e.target as HTMLDivElement).parentElement!.firstChild as HTMLInputElement;
    setActiveInfoButton((prev) => (prev === name ? null : prev));
  }, []);

  const options = OTHER_ENCOUNTER_OPTIONS.map((option) => (
    <OtherActivityField
      activeInfoButton={activeInfoButton}
      activity={values.activity}
      key={option.fieldName}
      onBlur={handleBlur}
      onMouseEnter={handleOptionOnMouseEnter}
      onMouseLeave={handleOptionOnMouseLeave}
      option={option}
      setFieldValue={setFieldValue}
    />
  ));

  return (
    <Form size="large">
      <Header>New Other Encounter</Header>

      <Form.Group widths="equal">
        <EncounterDateField
          error={!!(touched.encounterDate && errors.encounterDate)}
          onBlur={handleBlur}
          onChange={handleChange}
          value={values.encounterDate}
        />

        <EncounterTimeSpentField
          error={!!(touched.timeSpent && errors.timeSpent)}
          onBlur={handleBlur}
          onChange={handleChange}
          value={values.timeSpent}
        />
      </Form.Group>

      <Form.Group grouped>{options}</Form.Group>

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

export const OtherEncounterForm = UnwrappedOtherEncounterForm;

import './form.css';
import Debug from 'debug';
import moment from 'moment';
import Mousetrap from 'mousetrap';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ageYears, parseDate } from '../reporting/data';
import { chain, isEmpty, isNaN, pick } from 'lodash';
import {
  Checkbox,
  Confirm,
  Divider,
  Dropdown,
  Form,
  Grid,
  Header,
  Input,
  Ref,
} from 'semantic-ui-react';
import {
  DATE_FORMAT_DATABASE,
  DATE_FORMAT_DISPLAY,
  FIRST_TRACKING_DATE,
  OLDEST_POSSIBLE_AGE,
} from '../constants';
import { DIAGNOSES, STAGES } from '../options';
import { DOCTORS, isInactive } from '../doctors';
import {
  EncounterClinicField,
  EncounterDateField,
  EncounterLocationField,
  EncounterNumberOfTasksField,
  EncounterTimeSpentField,
  SubmitButtons,
  today,
} from '../shared-fields';
import { EncounterFormProps, Intervention } from '../types';
import { FormikErrors, useFormik } from 'formik';
import { InfoButton } from '../InfoButton';
import {
  initialInterventionValues,
  InitialInterventionValues,
  interventionGroups,
  interventionOptions,
} from '../patient-interventions';
import { InterventionField, ScoredInterventionField } from '../components/InterventionField';

const debug = Debug('tracking-tool:patient-encounter-form');

const DOCTOR_OPTIONS = DOCTORS.map((doctor) => pick(doctor, ['text', 'value']));

export type PatientEncounter = InitialInterventionValues & {
  _id?: string;
  username?: string;

  clinic: string;
  dateOfBirth: string;
  diagnosisFreeText: string;
  diagnosisStage: string;
  diagnosisType: string;
  encounterDate: string;
  encounterType: 'community' | 'patient' | 'other' | 'staff';
  limitedEnglishProficiency: boolean;
  location: string;
  md: string[];
  mrn: string;
  numberOfTasks: string;
  patientName: string;
  providenceMrn: string;
  timeSpent: string;
  transplant: boolean;
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
  providenceMrn: '',
  timeSpent: '',
  transplant: false,

  ...initialInterventionValues,
});

const NUMERIC_FIELDS = ['numberOfTasks', 'timeSpent'];

const REQUIRED_FIELDS = [
  'clinic',
  'dateOfBirth',
  'diagnosisType',
  'encounterDate',
  'location',
  'md',
  'patientName',
];

const SCORED_FIELDS = ['phq', 'gad', 'moca'];

const docToOption = (doc: PatientEncounter) => {
  const _today = moment().hour(0).minute(0).second(0).millisecond(0);

  let relativeTime = moment(doc.encounterDate).from(_today);

  if (doc.encounterDate === _today.format(DATE_FORMAT_DATABASE)) {
    relativeTime = 'today';
  } else if (doc.encounterDate === _today.subtract(1, 'day').format(DATE_FORMAT_DATABASE)) {
    relativeTime = 'yesterday';
  }

  const dateOfBirth = parseDate(doc.dateOfBirth);
  const formattedDateOfBirth = dateOfBirth.format('M/D/YYYY');

  return {
    // displayed in the search results as a row
    content: (
      <>
        <strong>{doc.patientName}</strong>{' '}
        <span className="date-of-birth">{formattedDateOfBirth}</span>{' '}
        <span className="relative-time">{relativeTime}</span>
      </>
    ),

    // the doc itself, so we can auto-fill
    'data-encounter': doc,

    // store the patient name separately for easy access in the onChange handler
    'data-patient-name': doc.patientName,

    // specify a key since Semantic uses the value otherwise and it may not be unique
    key:
      doc._id ||
      `${doc.patientName}-${doc.mrn || 'none'}-${doc.providenceMrn || 'none'}-${doc.dateOfBirth}`,

    // the text that's searched by the Dropdown as we type; we add DOB so we can add patients with
    // duplicate names; this is also what's displayed in the Dropdown on change
    text: (
      <>
        {doc.patientName} <input type="hidden" value={doc.dateOfBirth} />
      </>
    ),

    // note: the value is handled by indexValues and becomes the array index of the option
  };
};

const STAGE_LABEL_CONTENT = (
  <>
    Select <strong>Unknown</strong> if cancer has not yet been staged, then change your selection
    on the next encounter after staging is complete. Select <strong>Early</strong> if cancer is
    Stage 0-2. Select <strong>Advanced</strong> if cancer is Stage 3-4, has metastases, is
    described as locally advanced or end-stage, or if the cancer remains of unknown primary after
    staging is complete
  </>
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

const TRANSPLANT_LABEL = (
  <label>
    Transplant patient{' '}
    <InfoButton content="Mark this for patients who have been referred to the BMT coordinator for consideration of transplant or CAR-T" />
  </label>
);

function indexValues<T extends Record<string, unknown>>(values: T[]) {
  return values.map((value, i) => ({ ...value, value: `${i}` }));
}

type PatientEncounterFormProps = {
  encounter?: PatientEncounter;
  username: string;
} & EncounterFormProps;

type PatientOption = Record<string, unknown> & {
  value: string;
};

const RE_NUMERIC = /^\d+$/;
const isNumeric = (string: string) => RE_NUMERIC.test(string);

function UnwrappedPatientEncounterForm({
  encounter,
  onCancel,
  onComplete,
  username,
}: PatientEncounterFormProps) {
  const patientNameRef = useRef<HTMLElement | null>(null);
  const dateOfBirthRef = useRef<HTMLElement | null>(null);

  const [activeInfoButton, setActiveInfoButton] = useState<string | null>(null);
  const [confirmingInactiveMd, setConfirmingInactiveMd] = useState(false);
  const [patientNameIndex, setPatientNameIndex] = useState('');
  const [loadingSearchOptions, setLoadingSearchOptions] = useState(false);
  const [patientOptions, setPatientOptions] = useState<PatientOption[]>([]);

  const formik = useFormik<PatientEncounter>({
    initialValues: encounter
      ? {
          ...encounter,
          dateOfBirth: parseDate(encounter.dateOfBirth).format(DATE_FORMAT_DISPLAY),
        }
      : INITIAL_VALUES(),

    validate: (values) => {
      const errors: FormikErrors<PatientEncounter> = {};

      if (values.diagnosisType === 'Malignant') {
        if (!values.diagnosisStage) {
          errors.diagnosisStage = 'Diagnosis stage is required';
        }
      }

      SCORED_FIELDS.forEach((field) => {
        const scoredFieldName = `${field}Score`;

        if (
          values[field] &&
          !isNumeric(values[scoredFieldName]) &&
          values[scoredFieldName].toLowerCase() !== 'n/a'
        ) {
          errors[scoredFieldName] = 'Score is required';
        }
      });

      if (values.mrn && !/^100\d{7}$/.test(values.mrn)) {
        errors.mrn = 'If Swedish MRN is provided it must start with 100 followed by 7 digits';
      }

      if (!/^600\d{8}$/.test(values.providenceMrn)) {
        errors.providenceMrn =
          'Providence MRN is required and must start with 600 followed by 8 digits';
      }

      NUMERIC_FIELDS.forEach((field) => {
        if (!isNumeric(values[field])) {
          errors[field] = 'Must be a valid number';
        }
      });

      REQUIRED_FIELDS.forEach((field) => {
        if (isEmpty(values[field])) {
          errors[field] = 'This field is required';
        }
      });

      const parsedEncounterDate = parseDate(values.encounterDate);

      if (!parsedEncounterDate.isValid()) {
        errors.encounterDate = 'Must be a valid date';
      } else if (parsedEncounterDate.isAfter(moment())) {
        errors.encounterDate = 'Must be today or before';
      } else if (parsedEncounterDate.isBefore(FIRST_TRACKING_DATE)) {
        errors.encounterDate = 'Must be on or newer than 12/01/2018';
      }

      const parsedDateOfBirth = parseDate(values.dateOfBirth);

      if (!parsedDateOfBirth.isValid()) {
        errors.dateOfBirth = 'Must be a valid date';
      } else if (parsedDateOfBirth.isAfter(moment())) {
        errors.dateOfBirth = 'Must be in the past';
      } else if (
        values.encounterDate &&
        parsedDateOfBirth.isBefore(
          parsedEncounterDate.clone().subtract(OLDEST_POSSIBLE_AGE, 'years'),
        )
      ) {
        errors.dateOfBirth = 'Must be younger than 117 years old';
      }

      if (!/(0|5)$/.test(values.timeSpent)) {
        errors.timeSpent = 'Must be rounded to the nearest multiple of 5';
      }

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

        await window.trackingTool.dbInsert({
          ...values,
          dateOfBirth: parseDate(values.dateOfBirth).format(DATE_FORMAT_DATABASE),
          patientName: values.patientName.trim(),
        });
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
    isValid,
    setFieldTouched,
    setFieldValue,
    setValues,
    submitForm,
    touched,
    validateForm,
    values,
  } = formik;

  const setSearchEncounterList = useCallback(async (searchQuery: string) => {
    setLoadingSearchOptions(true);

    const docs = (await window.trackingTool.dbSearch({
      encounterType: 'Patient',
      patientNamePattern: searchQuery || undefined,
    })) as PatientEncounter[];

    // get the most recent encounter for each patient matching the query,
    // sorted by patient name
    const options = chain(docs)
      .sortBy('encounterDate')
      .reverse()
      .uniqBy((doc) => doc.providenceMrn || doc.mrn)
      .sortBy('patientName')
      .map(docToOption)
      .value();

    setLoadingSearchOptions(false);
    setPatientOptions(indexValues(options));
  }, []);

  const setInitialEncounterList = useCallback(() => {
    // if we're editing an encounter then set the state to contain only the encounter's patient
    if (encounter) {
      setPatientOptions([
        {
          content: encounter.patientName,
          encounter: null,
          text: encounter.patientName,
          value: '0',
        },
      ]);
      setPatientNameIndex('0');
      return;
    }

    setSearchEncounterList('');
  }, [encounter, setSearchEncounterList]);

  const updatePatientIndexAndValue = useCallback(
    (index: string, enc: PatientEncounter, patientName: string) => {
      // this is faster than calling setFieldValue multiple times
      setValues({
        ...values,
        patientName,
        mrn: enc.mrn || '',
        providenceMrn: enc.providenceMrn || '',
        dateOfBirth: enc.dateOfBirth,
        clinic: enc.clinic,
        limitedEnglishProficiency: !!enc.limitedEnglishProficiency,
        location: enc.location,
        md: enc.md,
        diagnosisType: enc.diagnosisType,
        diagnosisFreeText: enc.diagnosisFreeText,
        diagnosisStage: enc.diagnosisStage,
        transplant: !!enc.transplant,
      });

      // HACK: validateForm does run automatically after setValues but for some reason it doesn't
      // contain the newest values at that point, so this is a hack to run it again the next time
      // through the event loop... it does result in a brief flash of red on the Patient field.
      setTimeout(() => validateForm());

      setPatientNameIndex(index);
    },
    [setValues, values, validateForm],
  );

  const clearForm = useCallback(() => {
    setValues(INITIAL_VALUES());
    setPatientNameIndex('');
  }, [setValues]);

  useEffect(() => {
    Mousetrap.bind('ctrl+backspace', clearForm);

    if (!encounter && patientNameRef.current) {
      const input = patientNameRef.current.querySelector('input');

      if (input) {
        input.focus();
      }
    }

    if (dateOfBirthRef.current) {
      const input = dateOfBirthRef.current.querySelector('input');
      const body = document.querySelector('body');

      if (!input || !body) {
        return () => Mousetrap.unbind('ctrl+backspace');
      }

      // pasting into a date field requires a global handler as a workaround
      const pasteHandler = (e: ClipboardEvent) => {
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

        setFieldValue('dateOfBirth', date.format(DATE_FORMAT_DISPLAY));
      };

      body.addEventListener('paste', pasteHandler);

      return () => {
        Mousetrap.unbind('ctrl+backspace');
        body.removeEventListener('paste', pasteHandler);
      };
    }

    return () => Mousetrap.unbind('ctrl+backspace');
    // Run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    debug('render %o', { values, patientNameIndex, activeInfoButton });
  });

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

  const handleChangeTrimmed = useCallback(
    (_e: React.SyntheticEvent, data: { name?: string; value?: string }) =>
      setFieldValue(data.name!, (data.value || '').trim()),
    [setFieldValue],
  );

  const handleLocationChange = useCallback(
    (_e: React.SyntheticEvent, data: { value?: string | string[] | boolean }) => {
      setFieldValue('location', data.value);
      setFieldValue('clinic', '');
    },
    [setFieldValue],
  );

  const handlePatientAddition = useCallback(
    (_e: React.SyntheticEvent, { value }: { value: string }) => {
      setPatientOptions((prev) =>
        indexValues([
          {
            content: value,
            'data-encounter': null,
            'data-patient-name': value,
            text: value,
          },
          ...prev,
        ]),
      );

      updatePatientIndexAndValue('0', INITIAL_VALUES(), value);
    },
    [updatePatientIndexAndValue],
  );

  const handlePatientChange = useCallback(
    (
      _e: React.SyntheticEvent,
      { value, options }: { value: string; options: Array<Record<string, unknown>> },
    ) => {
      const selectedOption = options.find((option) => option.value === value);

      if (!selectedOption) {
        return updatePatientIndexAndValue('', INITIAL_VALUES(), '');
      }

      const enc = (selectedOption['data-encounter'] as PatientEncounter) || INITIAL_VALUES();
      const patientName = selectedOption['data-patient-name'] as string;

      updatePatientIndexAndValue(selectedOption.value as string, enc, patientName);
    },
    [updatePatientIndexAndValue],
  );

  // HACK: without creating a new options array here we end up with duplicate additionLabels
  const handlePatientNameSearch = useCallback(
    (options: Record<string, unknown>[]) => [...options],
    [],
  );

  const handlePatientSearchChange = useCallback(
    (_e: React.SyntheticEvent, { searchQuery }: { searchQuery: string }) => {
      if (searchQuery) {
        setSearchEncounterList(searchQuery);
      } else {
        setInitialEncounterList();
      }
    },
    [setSearchEncounterList, setInitialEncounterList],
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

  const handleDateOfBirthRef = useCallback((ref: HTMLElement) => {
    dateOfBirthRef.current = ref;
  }, []);

  const handlePatientRef = useCallback((ref: HTMLElement) => {
    patientNameRef.current = ref;
  }, []);

  const cancelConfirmation = useCallback(() => setConfirmingInactiveMd(false), []);

  const submit = useCallback(() => {
    if (values.md.some(isInactive) && isValid) {
      setConfirmingInactiveMd(true);
    } else {
      submitForm();
    }
  }, [values.md, isValid, submitForm]);

  const columns = interventionGroups.map((column, i) => {
    return (
      <Grid.Column key={i}>
        {column.map((group, j) => {
          return (
            <Form.Group grouped key={`${i}-${j}`}>
              <label>{group.label}</label>

              {group.interventions.map((intervention: Intervention) => {
                const disabled = intervention.editableBy
                  ? !intervention.editableBy.includes(username)
                  : false;

                return intervention.scored ? (
                  <ScoredInterventionField
                    checked={values[intervention.fieldName]}
                    disabled={disabled}
                    fieldName={intervention.fieldName}
                    key={intervention.fieldName}
                    name={intervention.name}
                    onBlur={handleBlur}
                    onChange={handleChange}
                    scoreError={
                      !!(
                        touched[`${intervention.fieldName}Score`] &&
                        errors[`${intervention.fieldName}Score`]
                      )
                    }
                    scoreValue={values[`${intervention.fieldName}Score`]}
                  />
                ) : (
                  <InterventionField
                    activeInfoButton={activeInfoButton}
                    checked={values[intervention.fieldName]}
                    description={intervention.description}
                    disabled={disabled}
                    fieldName={intervention.fieldName}
                    key={intervention.fieldName}
                    name={intervention.name}
                    onBlur={handleBlur}
                    onChange={handleChange}
                    onMouseEnter={handleInterventionOnMouseEnter}
                    onMouseLeave={handleInterventionOnMouseLeave}
                  />
                );
              })}
            </Form.Group>
          );
        })}
      </Grid.Column>
    );
  });

  let dateOfBirthLabel = 'Date of Birth';

  if (values.dateOfBirth) {
    const age = ageYears(parseDate(values.encounterDate), parseDate(values.dateOfBirth));

    if (!isNaN(age)) {
      dateOfBirthLabel = `Date of Birth (${age} years old)`;
    }
  }

  return (
    <Form size="large">
      <Header>New Patient Encounter</Header>

      <EncounterDateField
        error={!!(touched.encounterDate && errors.encounterDate)}
        onBlur={handleBlur}
        onChange={handleChange}
        value={values.encounterDate}
      />

      <Form.Group widths="equal">
        {encounter ? (
          <Form.Field
            control={Input}
            id="input-patient-name"
            label="Patient Name"
            name="patientName"
            onBlur={handleBlur}
            onChange={handleChange}
            onClose={handleBlur}
            placeholder="Last, First Middle"
            value={values.patientName}
          />
        ) : (
          <Ref innerRef={handlePatientRef}>
            <Form.Field
              additionLabel="Add new patient "
              allowAdditions
              control={Dropdown}
              error={!!(touched.patientName && errors.patientName)}
              id="input-patient-name"
              label="Patient Name"
              loading={loadingSearchOptions}
              name="patientName"
              noResultsMessage="Last, First Middle"
              onAddItem={handlePatientAddition}
              onBlur={handleBlur}
              onChange={handlePatientChange}
              onClose={handleBlur}
              options={patientOptions}
              onSearchChange={handlePatientSearchChange}
              placeholder="Last, First Middle"
              search={handlePatientNameSearch}
              selectOnBlur={false}
              selection
              value={patientNameIndex}
            />
          </Ref>
        )}

        <Form.Field
          control={Input}
          disabled={!values.patientName}
          error={!!(touched.providenceMrn && errors.providenceMrn)}
          id="input-providence-mrn"
          label="Providence MRN"
          name="providenceMrn"
          onBlur={handleBlur}
          onChange={handleChangeTrimmed}
          value={values.providenceMrn}
        />

        <Form.Field
          control={Input}
          disabled={!values.patientName}
          error={!!(touched.mrn && errors.mrn)}
          id="input-mrn"
          label="MRN"
          name="mrn"
          onBlur={handleBlur}
          onChange={handleChangeTrimmed}
          value={values.mrn}
        />

        <Ref innerRef={handleDateOfBirthRef}>
          <Form.Field
            control={Input}
            disabled={!values.patientName}
            error={!!(touched.dateOfBirth && errors.dateOfBirth)}
            id="input-date-of-birth"
            label={dateOfBirthLabel}
            name="dateOfBirth"
            onBlur={handleBlur}
            onChange={handleChange}
            value={values.dateOfBirth}
          />
        </Ref>
      </Form.Group>

      <Form.Field
        control={Dropdown}
        disabled={!values.patientName}
        error={!!(touched.md && errors.md)}
        id="input-md"
        label={MD_LABEL}
        multiple
        name="md"
        onBlur={handleBlur}
        onChange={handleChange}
        onClose={handleBlur}
        options={DOCTOR_OPTIONS}
        search
        selection
        value={values.md}
      />

      <Form.Group widths="equal">
        <EncounterLocationField
          disabled={!values.patientName}
          error={!!(touched.location && errors.location)}
          onBlur={handleBlur}
          onChange={handleLocationChange}
          value={values.location}
        />

        <EncounterClinicField
          disabled={!values.patientName}
          error={!!(touched.clinic && errors.clinic)}
          location={values.location}
          onBlur={handleBlur}
          onChange={handleChange}
          value={values.clinic}
        />
      </Form.Group>

      <Form.Group widths="equal">
        <Form.Field
          control={Dropdown}
          disabled={!values.patientName}
          error={!!(touched.diagnosisType && errors.diagnosisType)}
          id="input-diagnosis-type"
          label="Diagnosis Type"
          name="diagnosisType"
          onBlur={handleBlur}
          onChange={handleChange}
          onClose={handleBlur}
          options={DIAGNOSES}
          search
          selection
          selectOnBlur={false}
          value={values.diagnosisType}
        />

        <Form.Field
          control={Input}
          disabled
          error={!!(touched.diagnosisFreeText && errors.diagnosisFreeText)}
          id="input-diagnosis-free-text"
          label="Diagnosis"
          name="diagnosisFreeText"
          value={values.diagnosisType === 'Malignant' ? values.diagnosisFreeText : ''}
        />

        <Form.Field
          control={Dropdown}
          disabled={!values.patientName || values.diagnosisType !== 'Malignant'}
          error={!!(touched.diagnosisStage && errors.diagnosisStage)}
          id="input-diagnosis-stage"
          label={STAGE_LABEL}
          name="diagnosisStage"
          onBlur={handleBlur}
          onChange={handleChange}
          onClose={handleBlur}
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
          disabled={!values.patientName}
          id="input-transplant"
          label={TRANSPLANT_LABEL}
          name="transplant"
          onBlur={handleBlur}
          onChange={handleChange}
          checked={values.transplant}
        />

        <Form.Field
          control={Checkbox}
          disabled={!values.patientName}
          id="input-limited-english-proficiency"
          label={LIMITED_ENGLISH_PROFICIENCY_LABEL}
          name="limitedEnglishProficiency"
          onBlur={handleBlur}
          onChange={handleChange}
          checked={values.limitedEnglishProficiency}
        />
      </Form.Group>

      <Divider hidden />

      <Form.Field
        control={Dropdown}
        fluid
        onChange={handleInterventionChange}
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
          onBlur={handleBlur}
          onChange={handleChange}
          patient
          value={values.timeSpent}
        />

        <EncounterNumberOfTasksField
          error={!!(touched.numberOfTasks && errors.numberOfTasks)}
          onBlur={handleBlur}
          onChange={handleChange}
          patient
          value={values.numberOfTasks}
        />
      </Form.Group>

      <Divider hidden />

      <Confirm
        cancelButton="Change"
        confirmButton="Continue"
        content="This provider has been marked as inactive. Do you want to continue or change providers?"
        onCancel={cancelConfirmation}
        onConfirm={submitForm}
        open={confirmingInactiveMd}
      />

      <SubmitButtons
        isClean={!dirty}
        isSubmitting={isSubmitting}
        onCancel={onCancel}
        submitForm={submit}
      />
    </Form>
  );
}

export const PatientEncounterForm = UnwrappedPatientEncounterForm;

import React from 'react';
import { Divider, Form, Header, Radio } from 'semantic-ui-react';
import {
  EncounterDateField,
  EncounterTimeSpentField,
  SubmitButtons,
  today,
} from '../shared-fields';
import { EncounterFormProps } from '../types';
import { find, isEmpty } from 'lodash';
import { FormikErrors, FormikProps, withFormik } from 'formik';
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

type OtherEncounterFormState = {
  activeInfoButton: string | null;
};

class UnwrappedOtherEncounterForm extends React.Component<
  OtherEncounterFormProps & FormikProps<OtherEncounter>,
  OtherEncounterFormState
> {
  state = {
    activeInfoButton: null,
  };

  handleBlur = (e: React.FocusEvent, data?: { name: string }) =>
    this.props.setFieldTouched((data && data.name) || (e.target as HTMLInputElement).name, true);

  handleChange = (
    _e: React.SyntheticEvent,
    data: { name?: string; value?: string | string[] | boolean; checked?: boolean },
  ) => this.props.setFieldValue(data.name!, data.value !== undefined ? data.value : data.checked);

  handleOptionOnMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    e.persist();
    this.setState({
      activeInfoButton: (
        (e.target as HTMLDivElement).parentElement!.firstChild as HTMLInputElement
      ).name,
    });
  };

  handleOptionOnMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    e.persist();
    this.setState((state) => {
      if (
        state.activeInfoButton ===
        ((e.target as HTMLDivElement).parentElement!.firstChild as HTMLInputElement).name
      ) {
        return { activeInfoButton: null } as OtherEncounterFormState;
      }

      return null;
    });
  };

  // TODO put this somewhere else
  renderField = (option: Option) => (
    <Form.Field
      checked={this.props.values.activity === option.fieldName}
      control={Radio}
      key={option.fieldName}
      label={
        // eslint-disable-next-line react-perf/jsx-no-jsx-as-prop
        <InfoButtonLabel
          description={option.description}
          name={option.name}
          show={this.state.activeInfoButton === option.fieldName}
        />
      }
      name={option.fieldName}
      onBlur={this.handleBlur}
      // eslint-disable-next-line react-perf/jsx-no-new-function-as-prop
      onChange={() => this.props.setFieldValue('activity', option.fieldName)}
      onMouseEnter={this.handleOptionOnMouseEnter}
      onMouseLeave={this.handleOptionOnMouseLeave}
    />
  );

  render() {
    const { dirty, errors, isSubmitting, onCancel, submitForm, touched, values } = this.props;
    const options = OTHER_ENCOUNTER_OPTIONS.map((option) => this.renderField(option));

    return (
      <Form size="large">
        <Header>New Other Encounter</Header>

        <Form.Group widths="equal">
          <EncounterDateField
            error={!!(touched.encounterDate && errors.encounterDate)}
            onBlur={this.handleBlur}
            onChange={this.handleChange}
            value={values.encounterDate}
          />

          <EncounterTimeSpentField
            error={!!(touched.timeSpent && errors.timeSpent)}
            onBlur={this.handleBlur}
            onChange={this.handleChange}
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
}

export const OtherEncounterForm = withFormik<OtherEncounterFormProps, OtherEncounter>({
  mapPropsToValues: (props) => {
    if (props.encounter) {
      return props.encounter;
    }

    return INITIAL_VALUES();
  },

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

  handleSubmit: async (values, { props, setSubmitting }) => {
    const { encounter, onComplete } = props;

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
})(UnwrappedOtherEncounterForm);

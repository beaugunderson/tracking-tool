import camelcase from 'camelcase';
import React from 'react';
import slugify from 'slugify';
import { Divider, Form, Header, Radio } from 'semantic-ui-react';
import {
  EncounterDateField,
  EncounterTimeSpentField,
  SubmitButtons,
  today
} from '../shared-fields';
import { InfoButton } from '../InfoButton';
import { find, isEmpty } from 'lodash';

// eslint-disable-next-line no-unused-vars
import { withFormik, FormikProps, FormikErrors } from 'formik';
// eslint-disable-next-line no-unused-vars
import { EncounterFormProps, Intervention } from '../types';

function addFieldNames(options: any) {
  return options.map((option: any) => {
    const fieldName = camelcase(slugify(option.name, { lower: true, remove: /[^a-zA-Z0-9 -]/ }));

    return { ...option, fieldName, key: fieldName };
  });
}

type Option = {
  name: string;
  description: string;
  fieldName: string;
};

const OPTIONS: Option[] = addFieldNames([
  {
    name: 'Rounding/Tumor Board',
    description:
      'Rounding with provider(s) when not specific to any one patient; attending tumor board; chart review on multiple patients as part of rounding. If you round with your clinics and later with your pod, or attend tumor board and later round with your clinics, these should be two separate entries'
  },

  {
    name: 'Distress Audit',
    description:
      'Use for auditing distress screens for radiation, radiosurgery, or when covering for ' +
      'another clinician if you are dispersing them without following up on any of them. Do not ' +
      'track this for your own audit'
  },

  {
    name: 'Presentation',
    description:
      'When giving a presentation or training related to your role as an oncology social worker at SCI ' +
      '(versus your work on a board), track time spent in preparation for, giving, and in ' +
      'wrap-up of your presentation. This could include presentations for Swedish symposiums, ' +
      'donor groups like Harvey Marine or MI Rotary, at AOSW or SSWLHC conferences, or on a ' +
      'panel for organizations like PanCan and LLS'
  },

  {
    name: 'Committee Work',
    description:
      'Schedules, Share Drive, Meetings on Meetings, Distress Screening, Epic/Documentation, Safety'
  },

  { name: 'Project', description: 'Holiday Families, Intern Orientation' },

  {
    name: 'Support Group Facilitation',
    description:
      'Includes time in preparation for and participation in Living with Cancer, Caregiver, ' +
      'diagnosis specific groups, CLIMB, Tea for the Soul. Do not include external support ' +
      'groups unless you facilitate them as part of your job at SCI'
  },

  {
    name: 'Community Event/Fundraiser',
    description: 'Only those you attend as a representative of SCI'
  }
]);

export function fieldNameToName(fieldName: string) {
  const option = find(OPTIONS, { fieldName });

  return (option && option.name) || '';
}

type OtherEncounter = {
  [key: string]: any;

  _id?: string;
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
  activity: ''
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
    activeInfoButton: null
  };

  handleBlur = (e, data) => this.props.setFieldTouched((data && data.name) || e.target.name, true);

  handleChange = (e, { name, value, checked }) =>
    this.props.setFieldValue(name, value !== undefined ? value : checked);

  handleOptionChange = (e, data) => {
    if (!data) {
      return;
    }

    this.props.setFieldValue('activity', data.value);
  };

  handleOptionOnMouseEnter = e => {
    e.persist();
    this.setState({ activeInfoButton: e.target.parentElement.firstChild.name });
  };

  handleOptionOnMouseLeave = e => {
    e.persist();
    this.setState(state => {
      if (state.activeInfoButton === e.target.parentElement.firstChild.name) {
        return { activeInfoButton: null } as OtherEncounterFormState;
      }
    });
  };

  // TODO put this somewhere else
  renderField = (option: Option) => (
    <Form.Field
      checked={this.props.values.activity === option.fieldName}
      control={Radio}
      key={option.fieldName}
      label={
        <label>
          {option.name}{' '}
          {this.state.activeInfoButton === option.fieldName && (
            <InfoButton content={option.description} wide />
          )}
        </label>
      }
      name={option.fieldName}
      onBlur={this.handleBlur}
      onChange={() => this.props.setFieldValue('activity', option.fieldName)}
      onMouseEnter={this.handleOptionOnMouseEnter}
      onMouseLeave={this.handleOptionOnMouseLeave}
    />
  );

  render() {
    const { dirty, errors, isSubmitting, onCancel, submitForm, touched, values } = this.props;
    const options = OPTIONS.map(option => this.renderField(option));

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
  mapPropsToValues: props => {
    if (props.encounter) {
      return props.encounter;
    }

    return INITIAL_VALUES();
  },

  validate: values => {
    const errors: FormikErrors<OtherEncounter> = {};

    NUMERIC_FIELDS.forEach(field => {
      if (!/^\d+$/.test(values[field])) {
        errors[field] = 'Field must be a valid number';
      }
    });

    REQUIRED_FIELDS.forEach(field => {
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

    encounters.insert(values, err => {
      setSubmitting(false);
      onComplete(err);
    });
  }
})(UnwrappedOtherEncounterForm);

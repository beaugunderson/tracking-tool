import React, { useMemo } from 'react';
import { Checkbox, Form, Input } from 'semantic-ui-react';
import { InfoButtonLabel } from '../InfoButtonLabel';

type InterventionFieldProps = {
  activeInfoButton: string | null;
  checked: boolean;
  description: React.ReactNode;
  disabled?: boolean;
  fieldName: string;
  name: string;
  onBlur: (e: React.FocusEvent, data?: { name: string }) => void;
  onChange: (
    e: React.SyntheticEvent,
    data: { name?: string; value?: string | string[] | boolean; checked?: boolean },
  ) => void;
  onMouseEnter: (e: React.MouseEvent<HTMLDivElement>) => void;
  onMouseLeave: (e: React.MouseEvent<HTMLDivElement>) => void;
};

export function InterventionField({
  activeInfoButton,
  checked,
  description,
  disabled,
  fieldName,
  name,
  onBlur,
  onChange,
  onMouseEnter,
  onMouseLeave,
}: InterventionFieldProps) {
  const label = useMemo(
    () => (
      <InfoButtonLabel
        description={description}
        name={name}
        show={activeInfoButton === fieldName}
      />
    ),
    [description, name, activeInfoButton, fieldName],
  );

  return (
    <Form.Field
      checked={checked}
      control={Checkbox}
      disabled={disabled}
      label={label}
      name={fieldName}
      onBlur={onBlur}
      onChange={onChange}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    />
  );
}

type ScoredInterventionFieldProps = {
  checked: boolean;
  disabled?: boolean;
  fieldName: string;
  name: string;
  onBlur: (e: React.FocusEvent, data?: { name: string }) => void;
  onChange: (
    e: React.SyntheticEvent,
    data: { name?: string; value?: string | string[] | boolean; checked?: boolean },
  ) => void;
  scoreError: boolean;
  scoreValue: string;
};

export function ScoredInterventionField({
  checked,
  disabled,
  fieldName,
  name,
  onBlur,
  onChange,
  scoreError,
  scoreValue,
}: ScoredInterventionFieldProps) {
  const scoreFieldName = `${fieldName}Score`;

  return (
    <div className="score-field-wrapper">
      <Form.Field
        checked={checked}
        control={Checkbox}
        disabled={disabled}
        inline
        label={name}
        name={fieldName}
        onBlur={onBlur}
        onChange={onChange}
      />

      {checked && (
        <Input
          className="score-field"
          error={scoreError}
          name={scoreFieldName}
          onBlur={onBlur}
          onChange={onChange}
          placeholder="Score"
          transparent
          value={scoreValue}
        />
      )}
    </div>
  );
}

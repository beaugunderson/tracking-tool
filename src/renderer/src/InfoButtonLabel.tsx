import React from 'react';
import { InfoButton } from './InfoButton';

type InfoButtonLabelProps = {
  description: React.ReactNode;
  name: string;
  show: boolean;
};

export function InfoButtonLabel({ description, name, show }: InfoButtonLabelProps) {
  return (
    <label>
      {name} {show && <InfoButton content={description} />}
    </label>
  );
}

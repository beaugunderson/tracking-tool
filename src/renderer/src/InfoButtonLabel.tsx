import React from 'react';
import { InfoButton } from './InfoButton';

type InfoButtonLabelProps = {
  description: React.ReactNode;
  name: string;
  show: boolean;
};

export class InfoButtonLabel extends React.Component<InfoButtonLabelProps> {
  render() {
    const { description, name, show } = this.props;

    return (
      <label>
        {name} {show && <InfoButton content={description} />}
      </label>
    );
  }
}

import React from 'react';
import { Icon, Popup } from 'semantic-ui-react';

const HELP_ICON = <Icon color="grey" name="help circle" />;

type InfoButtonProps = {
  content: React.ReactNode;
  wide?: boolean | 'very';
};

export class InfoButton extends React.Component<InfoButtonProps> {
  render() {
    const { content, ...rest } = this.props;

    if (!content) {
      return null;
    }

    return (
      <Popup {...rest} content={content} horizontalOffset={12} on="hover" trigger={HELP_ICON} />
    );
  }
}

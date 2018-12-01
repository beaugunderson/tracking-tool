import React from 'react';
import { Icon, Popup } from 'semantic-ui-react';

const HELP_ICON = <Icon color="grey" name="help circle" />;

export class InfoButton extends React.Component<any> {
  render() {
    const { content, on, ...rest } = this.props;

    return (
      <Popup
        {...rest}
        content={content}
        horizontalOffset={12}
        on={on || 'click'}
        trigger={HELP_ICON}
      />
    );
  }
}

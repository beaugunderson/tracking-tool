import React from 'react';
import { Icon, Popup } from 'semantic-ui-react';

const HELP_ICON = <Icon color="grey" name="help circle" />;

type InfoButtonProps = {
  content: React.ReactNode;
  wide?: boolean | 'very';
};

export function InfoButton({ content, ...rest }: InfoButtonProps) {
  if (!content) {
    return null;
  }

  return (
    <Popup
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...rest}
      content={content}
      horizontalOffset={12}
      hoverable
      on="hover"
      trigger={HELP_ICON}
    />
  );
}

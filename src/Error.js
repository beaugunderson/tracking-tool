// @flow

import React from 'react';

export class Error extends React.Component<*> {
  render() {
    const { error } = this.props;

    return (
      <div>
        Tracking Tool encountered an error:
        <p>{error}</p>
      </div>
    );
  }
}

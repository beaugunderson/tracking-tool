import React from 'react';
import { Error } from './Error';

export class ErrorBoundary extends React.Component<*> {
  state = {
    error: null
  };

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return <Error error={this.state.error.message} />;
    }

    return this.props.children;
  }
}

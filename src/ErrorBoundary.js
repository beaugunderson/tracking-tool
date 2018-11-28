import React from 'react';
import { ErrorMessage } from './ErrorMessage';

export class ErrorBoundary extends React.Component<*> {
  state = {
    error: null
  };

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return <ErrorMessage error={this.state.error} />;
    }

    return this.props.children;
  }
}

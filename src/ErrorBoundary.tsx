import React from 'react';
import { ErrorMessage } from './ErrorMessage';

interface ErrorBoundaryState {
  error?: Error;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  state = {
    error: null,
  };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return <ErrorMessage error={this.state.error} />;
    }

    return this.props.children;
  }
}

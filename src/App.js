// @flow

import 'semantic-ui-css/semantic.min.css';

import React from 'react';
import { Button, Container, Divider, Header, Icon } from 'semantic-ui-react';
import { ensureUserDirectoryExists, rootPathExists } from './store';
import { Error } from './Error';
import { FirstTimeSetup } from './FirstTimeSetup';
import { PatientEncounterForm } from './PatientEncounterForm';

function isFirstTime() {
  return !rootPathExists();
}

type AppState = {
  encounter: ?string,
  error: ?string,
  firstTimeSetup: boolean
};

class App extends React.Component<{}, AppState> {
  state = {
    encounter: null,
    error: null,
    firstTimeSetup: isFirstTime()
  };

  render() {
    const { encounter, error, firstTimeSetup } = this.state;

    if (error) {
      return <Error error={error} />;
    }

    if (firstTimeSetup) {
      return <FirstTimeSetup onComplete={() => this.setState({ firstTimeSetup: false })} />;
    }

    try {
      ensureUserDirectoryExists();
    } catch (err) {
      this.setState({ error: err });
    }

    if (encounter === 'patient') {
      return (
        <PatientEncounterForm
          onCancel={() => this.setState({ encounter: null })}
          onComplete={() => this.setState({ encounter: null })}
          onError={err => this.setState({ error: err.message })}
        />
      );
    }

    return (
      <div>
        <Header size="huge">Create a new encounter:</Header>

        <Divider hidden />

        <Container textAlign="center">
          <Button
            icon
            labelPosition="left"
            onClick={() => this.setState({ encounter: 'patient' })}
            size="big"
          >
            <Icon name="user" />
            Patient
          </Button>

          <Button
            icon
            labelPosition="left"
            onClick={() => this.setState({ encounter: 'staff' })}
            size="big"
          >
            <Icon name="user md" />
            Staff
          </Button>

          <Button
            icon
            labelPosition="left"
            onClick={() => this.setState({ encounter: 'community' })}
            size="big"
          >
            <Icon name="phone" />
            Community
          </Button>

          <Button
            icon
            labelPosition="left"
            onClick={() => this.setState({ encounter: 'other' })}
            size="big"
          >
            <Icon name="clock" />
            Other
          </Button>
        </Container>
      </div>
    );
  }
}

export default App;

// @flow

import 'semantic-ui-css/semantic.min.css';

import React from 'react';
import { Button, Container, Divider, Header, Icon } from 'semantic-ui-react';
import { PatientEncounterForm } from './PatientEncounterForm';
import { FirstTimeSetup } from './FirstTimeSetup';

function isFirstTime() {
  return true;
}

type AppState = {
  encounter: ?string
};

class App extends React.Component<{}, AppState> {
  state = {
    encounter: null
  };

  render() {
    const { encounter } = this.state;

    if (isFirstTime()) {
      return <FirstTimeSetup />;
    }

    if (encounter === 'patient') {
      return <PatientEncounterForm onCancel={() => this.setState({ encounter: null })} />;
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

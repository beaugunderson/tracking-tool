// @flow

import 'semantic-ui-css/semantic.min.css';

import React from 'react';
import { Button, Divider, Dropdown, Header, Icon, Input, Segment, Table } from 'semantic-ui-react';
import { ENCOUNTER_TYPES } from './options';
import { ensureUserDirectoryExists, rootPathExists } from './store';
import { Error } from './Error';
import { chain, escapeRegExp } from 'lodash';
import { FirstTimeSetup } from './FirstTimeSetup';
import { openEncounters } from './data';
import { PatientEncounterForm } from './PatientEncounterForm';

function isFirstTime() {
  return !rootPathExists();
}

type AppState = {
  edit: *,
  encounter: ?string,
  encounters: *,
  error: ?string,
  firstTimeSetup: boolean
};

class App extends React.Component<{}, AppState> {
  encounters: *;

  state = {
    edit: null,
    encounter: null,
    encounters: [],
    error: null,
    firstTimeSetup: isFirstTime()
  };

  editEncounter = (encounter: *) => {
    this.setState({ edit: encounter });
  };

  searchPatients = (value: string) => {
    this.encounters
      .find({ patientName: new RegExp(escapeRegExp(value), 'i') })
      .exec((err, docs) => {
        const encounters = chain(docs)
          .sortBy('patientName')
          .reverse()
          .sortBy('encounterDate')
          .reverse()
          .value();

        this.setState({ encounters });
      });
  };

  handlePatientSearchChange = (e: *, { value }: *) => {
    this.searchPatients(value);
  };

  componentDidMount() {
    if (this.state.firstTimeSetup) {
      return;
    }

    try {
      ensureUserDirectoryExists();
    } catch (err) {
      this.setState({ error: err });
    }

    this.encounters = openEncounters();

    this.searchPatients('');
  }

  render() {
    const { encounter, error, firstTimeSetup } = this.state;

    if (error) {
      return <Error error={error} />;
    }

    if (firstTimeSetup) {
      return <FirstTimeSetup onComplete={() => this.setState({ firstTimeSetup: false })} />;
    }

    if (encounter === 'patient') {
      return (
        <PatientEncounterForm
          encounters={this.encounters}
          onCancel={() => this.setState({ encounter: null })}
          onComplete={() => this.setState({ encounter: null })}
          onError={err => this.setState({ error: err.message })}
        />
      );
    }

    return (
      <React.Fragment>
        <Segment inverted style={{ paddingTop: '4em', paddingBottom: '4em' }} textAlign="center">
          <Header as="h1" style={{ fontSize: '3em' }}>
            Create an Encounter
          </Header>

          <Divider hidden />

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
            onClick={() => this.setState({ encounter: 'community' })}
            size="big"
          >
            <Icon name="phone" />
            Community
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
            onClick={() => this.setState({ encounter: 'other' })}
            size="big"
          >
            <Icon name="clock" />
            Other
          </Button>
        </Segment>

        <Segment inverted style={{ paddingTop: '4em', paddingBottom: '4em' }} textAlign="center">
          <Header as="h1" style={{ fontSize: '3em' }}>
            Edit an Encounter
          </Header>

          <Divider hidden />

          <Table selectable>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell width={3}>
                  <Dropdown options={ENCOUNTER_TYPES} placeholder="Encounter Type" selection />
                </Table.HeaderCell>
                <Table.HeaderCell width={3}>Encounter Date</Table.HeaderCell>
                <Table.HeaderCell width={12}>
                  <Input onChange={this.handlePatientSearchChange} placeholder="Search..." />
                </Table.HeaderCell>
              </Table.Row>
            </Table.Header>

            <Table.Body>
              {this.state.encounters.map((doc, i) => (
                <Table.Row key={i} onClick={() => this.editEncounter(doc)}>
                  <Table.Cell>{doc.encounterType}</Table.Cell>
                  <Table.Cell>{doc.encounterDate}</Table.Cell>
                  <Table.Cell>{doc.patientName}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </Segment>
      </React.Fragment>
    );
  }
}

export default App;

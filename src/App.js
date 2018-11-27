// @flow

import 'semantic-ui-css/semantic.min.css';

import React from 'react';
import { Button, Divider, Dropdown, Header, Icon, Input, Segment, Table } from 'semantic-ui-react';
import { ENCOUNTER_TYPES, ENCOUNTER_TYPE_NAMES } from './options';
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
  encounterSearchPatientName: string,
  encounterSearchType: string,
  error: ?string,
  firstTimeSetup: boolean
};

class App extends React.Component<{}, AppState> {
  encounters: *;

  state = {
    edit: null,
    encounter: null,
    encounters: [],
    encounterSearchPatientName: '',
    encounterSearchType: 'All',
    error: null,
    firstTimeSetup: isFirstTime()
  };

  editEncounter = (encounter: *) => {
    this.setState({ edit: encounter });
  };

  searchPatients = () => {
    const criteria = {
      patientName: new RegExp(escapeRegExp(this.state.encounterSearchPatientName), 'i')
    };

    if (this.state.encounterSearchType !== 'All') {
      criteria.encounterType = this.state.encounterSearchType.toLowerCase();
    }

    this.encounters.find(criteria).exec((err, docs) => {
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
    this.setState({ encounterSearchPatientName: value });
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

    this.searchPatients();
  }

  componentDidUpdate() {
    this.searchPatients();
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
        <Segment className="big-section" inverted textAlign="center">
          <Header as="h1">Create an Encounter</Header>

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

        <Segment className="big-section" inverted textAlign="center">
          <Header as="h1">Edit an Encounter</Header>

          <Divider hidden />

          <Table selectable>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell width={3}>Encounter Date</Table.HeaderCell>
                <Table.HeaderCell width={3}>
                  <Dropdown
                    id="encounter-type-dropdown"
                    onChange={(e, { value }) => this.setState({ encounterSearchType: value })}
                    options={ENCOUNTER_TYPES}
                    placeholder="Encounter Type"
                    selection
                    value={this.state.encounterSearchType}
                  />
                </Table.HeaderCell>
                <Table.HeaderCell width={12}>
                  <Input
                    id="encounter-patient-input"
                    onChange={(e, { value }) =>
                      this.setState({ encounterSearchPatientName: value })
                    }
                    placeholder="Search..."
                  />
                </Table.HeaderCell>
              </Table.Row>
            </Table.Header>

            <Table.Body>
              {this.state.encounters.map((doc, i) => (
                <Table.Row key={i} onClick={() => this.editEncounter(doc)}>
                  <Table.Cell>{doc.encounterDate}</Table.Cell>
                  <Table.Cell>{ENCOUNTER_TYPE_NAMES[doc.encounterType] || 'Patient'}</Table.Cell>
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

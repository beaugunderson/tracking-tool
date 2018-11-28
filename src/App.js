// @flow

import moment from 'moment';
import React from 'react';
import { Button, Divider, Dropdown, Header, Icon, Input, Segment, Table } from 'semantic-ui-react';
import { chain, escapeRegExp } from 'lodash';
import { CommunityEncounterForm } from './CommunityEncounterForm';
import { ENCOUNTER_TYPES, ENCOUNTER_TYPE_NAMES } from './options';
import { ensureUserDirectoryExists, rootPathExists } from './store';
import { Error } from './Error';
import { FirstTimeSetup } from './FirstTimeSetup';
import { openEncounters } from './data';
import { fieldNameToName, OtherEncounterForm } from './OtherEncounterForm';
import { PatientEncounterForm } from './PatientEncounterForm';
import { StaffEncounterForm } from './StaffEncounterForm';

type AppState = {
  encounter: *,
  encounterForm: ?string,
  encounters: *,
  encounterSearchPatientName: string,
  encounterSearchType: string,
  error: ?string,
  firstTimeSetup: boolean
};

export class App extends React.Component<{}, AppState> {
  encounters: *;

  state = {
    encounter: null,
    encounterForm: null,
    encounters: [],
    encounterSearchPatientName: '',
    encounterSearchType: 'All',
    error: null,
    firstTimeSetup: !rootPathExists()
  };

  editEncounter = (encounter: *) => {
    this.setState({ encounterForm: encounter.encounterType, encounter });
  };

  searchPatients = () => {
    const criteria = {};

    if (this.state.encounterSearchType !== 'All') {
      criteria.encounterType = this.state.encounterSearchType.toLowerCase();
    }

    if (
      (this.state.encounterSearchType === 'All' || this.state.encounterSearchType === 'Patient') &&
      this.state.encounterSearchPatientName
    ) {
      criteria.patientName = new RegExp(escapeRegExp(this.state.encounterSearchPatientName), 'i');
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

  componentDidMount() {
    if (this.state.firstTimeSetup) {
      return;
    }

    try {
      ensureUserDirectoryExists();
    } catch (error) {
      return this.setState({ error: error.toString() });
    }

    this.encounters = openEncounters();

    this.searchPatients();
  }

  componentDidUpdate(prevProps: *, prevState: AppState) {
    if (
      this.state.encounter !== prevState.encounter ||
      this.state.encounterForm !== prevState.encounterForm ||
      this.state.encounterSearchPatientName !== prevState.encounterSearchPatientName ||
      this.state.encounterSearchType !== prevState.encounterSearchType
    ) {
      this.searchPatients();
    }
  }

  handleCancel = () => this.setState({ encounter: null, encounterForm: null });
  handleComplete = () => this.setState({ encounter: null, encounterForm: null });

  render() {
    const { encounter, encounterForm, error, firstTimeSetup } = this.state;

    if (error) {
      return <Error error={error} />;
    }

    if (firstTimeSetup) {
      return <FirstTimeSetup onComplete={() => this.setState({ firstTimeSetup: false })} />;
    }

    if (encounterForm === 'patient') {
      return (
        <PatientEncounterForm
          encounter={encounter}
          encounters={this.encounters}
          onCancel={this.handleCancel}
          onComplete={this.handleComplete}
          onError={err => this.setState({ error: err.message })}
        />
      );
    }

    if (encounterForm === 'community') {
      return (
        <CommunityEncounterForm
          encounter={encounter}
          encounters={this.encounters}
          onCancel={this.handleCancel}
          onComplete={this.handleComplete}
          onError={err => this.setState({ error: err.message })}
        />
      );
    }

    if (encounterForm === 'staff') {
      return (
        <StaffEncounterForm
          encounter={encounter}
          encounters={this.encounters}
          onCancel={this.handleCancel}
          onComplete={this.handleComplete}
          onError={err => this.setState({ error: err.message })}
        />
      );
    }

    if (encounterForm === 'other') {
      return (
        <OtherEncounterForm
          encounter={encounter}
          encounters={this.encounters}
          onCancel={this.handleCancel}
          onComplete={this.handleComplete}
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
            onClick={() => this.setState({ encounterForm: 'patient' })}
            size="big"
          >
            <Icon name="user" />
            Patient
          </Button>

          <Button
            icon
            labelPosition="left"
            onClick={() => this.setState({ encounterForm: 'community' })}
            size="big"
          >
            <Icon name="phone" />
            Community
          </Button>

          <Button
            icon
            labelPosition="left"
            onClick={() => this.setState({ encounterForm: 'staff' })}
            size="big"
          >
            <Icon name="user md" />
            Staff
          </Button>

          <Button
            icon
            labelPosition="left"
            onClick={() => this.setState({ encounterForm: 'other' })}
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
                <Table.HeaderCell width={2}>Encounter Date</Table.HeaderCell>
                <Table.HeaderCell width={2}>
                  <Dropdown
                    id="encounter-type-dropdown"
                    fluid
                    onChange={(e, { value }) => this.setState({ encounterSearchType: value })}
                    options={ENCOUNTER_TYPES}
                    placeholder="Encounter Type"
                    selection
                    value={this.state.encounterSearchType}
                  />
                </Table.HeaderCell>
                <Table.HeaderCell width={3}>
                  <Input
                    id="encounter-patient-input"
                    fluid
                    onChange={(e, { value }) =>
                      this.setState({ encounterSearchPatientName: value })
                    }
                    placeholder="Search..."
                  />
                </Table.HeaderCell>
                <Table.HeaderCell width={2}>Clinic</Table.HeaderCell>
                <Table.HeaderCell width={2}>Activity</Table.HeaderCell>
                <Table.HeaderCell width={2}>Time / Tasks</Table.HeaderCell>
              </Table.Row>
            </Table.Header>

            <Table.Body>
              {this.state.encounters.map((doc, i) => (
                <Table.Row key={i} onClick={() => this.editEncounter(doc)}>
                  <Table.Cell>{moment(doc.encounterDate).format('M/D/YYYY')}</Table.Cell>
                  <Table.Cell>{ENCOUNTER_TYPE_NAMES[doc.encounterType] || 'Patient'}</Table.Cell>
                  <Table.Cell>{doc.patientName}</Table.Cell>
                  <Table.Cell>{doc.clinic}</Table.Cell>
                  <Table.Cell>{fieldNameToName(doc.activity)}</Table.Cell>
                  <Table.Cell>
                    {doc.timeSpent} {doc.numberOfTasks && `/ ${doc.numberOfTasks}`}
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </Segment>
      </React.Fragment>
    );
  }
}

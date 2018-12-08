import './App.css';

import moment from 'moment';
import React from 'react';
import { Button, Divider, Dropdown, Header, Icon, Input, Segment, Table } from 'semantic-ui-react';
import { chain, escapeRegExp } from 'lodash';
import { CommunityEncounterForm } from './forms/CommunityEncounterForm';
import { ENCOUNTER_TYPES, ENCOUNTER_TYPE_NAMES } from './options';
import { ensureUserDirectoryExists, rootPathExists } from './store';
import { ErrorMessage } from './ErrorMessage';
import { FirstTimeSetup } from './FirstTimeSetup';
import { insertExamples } from './generate-data';
import { openEncounters } from './data';
import { fieldNameToName, OtherEncounterForm } from './forms/OtherEncounterForm';
import { PatientEncounterForm } from './forms/PatientEncounterForm';
import { StaffEncounterForm } from './forms/StaffEncounterForm';

const isDev = window.require('electron-is-dev');

type AppState = {
  encounter: any;
  encounterForm: string | null;
  encounters: any[];
  encounterSearchPatientName: string;
  encounterSearchType: string;
  error: string | Error | null;
  firstTimeSetup: boolean;
};

export class App extends React.Component<{}, AppState> {
  encounters?: Nedb;

  state = {
    encounter: null,
    encounterForm: null,
    encounters: [],
    encounterSearchPatientName: '',
    encounterSearchType: 'All',
    error: null,
    firstTimeSetup: !rootPathExists()
  };

  editEncounter = (encounter: any) =>
    this.setState({ encounterForm: encounter.encounterType, encounter });

  searchPatients = () => {
    if (!this.encounters) {
      return;
    }

    const criteria: any = {};

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

    ensureUserDirectoryExists();

    this.encounters = openEncounters();

    this.searchPatients();
  }

  componentDidUpdate(prevProps: any, prevState: AppState) {
    // scroll to top when we come back
    if (this.state.encounterForm !== prevState.encounterForm) {
      window.scroll({
        top: 0,
        left: 0
      });
    }

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
  handleError = (error: Error | string) => this.setState({ error });

  render() {
    const { encounter, encounterForm, error, firstTimeSetup } = this.state;

    if (error) {
      return <ErrorMessage error={error} />;
    }

    if (firstTimeSetup) {
      return <FirstTimeSetup onComplete={() => this.setState({ firstTimeSetup: false })} />;
    }

    if (!this.encounters) {
      return null;
    }

    if (encounterForm === 'patient') {
      return (
        <PatientEncounterForm
          encounter={encounter}
          encounters={this.encounters}
          onCancel={this.handleCancel}
          onComplete={this.handleComplete}
          onError={this.handleError}
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
          onError={this.handleError}
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
          onError={this.handleError}
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
          onError={this.handleError}
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

          {isDev && (
            <Button
              icon
              labelPosition="left"
              onClick={() => insertExamples(this.encounters)}
              size="big"
            >
              <Icon name="plus circle" />
              Add fake encounters
            </Button>
          )}
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
                    onChange={(e, { value }) =>
                      this.setState({ encounterSearchType: value as string })
                    }
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
                <Table.HeaderCell width={2}>Clinic or Activity</Table.HeaderCell>
                <Table.HeaderCell width={2}>Time / Tasks</Table.HeaderCell>
              </Table.Row>
            </Table.Header>

            <Table.Body>
              {this.state.encounters.map((doc: any, i: number) => (
                <Table.Row key={i} onClick={() => this.editEncounter(doc)}>
                  <Table.Cell>{moment(doc.encounterDate).format('M/D/YYYY')}</Table.Cell>
                  <Table.Cell>{ENCOUNTER_TYPE_NAMES[doc.encounterType] || 'Patient'}</Table.Cell>
                  <Table.Cell>{doc.patientName}</Table.Cell>
                  <Table.Cell>{doc.clinic || fieldNameToName(doc.activity)}</Table.Cell>
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
import './App.css';

import moment from 'moment';
import React from 'react';
import {
  Button,
  Confirm,
  Divider,
  Dropdown,
  Header,
  Icon,
  Input,
  Segment,
  Table
} from 'semantic-ui-react';
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
import { Report } from './reporting/Report';
import { StaffEncounterForm } from './forms/StaffEncounterForm';

const isDev = window.require('electron-is-dev');
const username = window.require('username');

function canSeeReporting() {
  return (
    ['beau', 'carynstewart', 'lindce2', 'valejd1'].indexOf(username.sync().toLowerCase()) !== -1
  );
}

const DELETE_BUTTON = <Button negative>Delete</Button>;

type AppState = {
  confirmDeletion: string | null;
  encounter: any;
  encounterForm: string | null;
  encounters: any[];
  encounterSearchDate: string;
  encounterSearchPatientName: string;
  encounterSearchType: string;
  error: string | Error | null;
  firstTimeSetup: boolean;
  reporting: boolean;
};

export class App extends React.Component<{}, AppState> {
  encounters?: Nedb;

  state = {
    confirmDeletion: null,
    encounter: null,
    encounterForm: null,
    encounters: [],
    encounterSearchDate: '',
    encounterSearchPatientName: '',
    encounterSearchType: 'All',
    error: null,
    firstTimeSetup: !rootPathExists(),
    reporting: false
  };

  editEncounter = (encounter: any) =>
    this.setState({ encounterForm: encounter.encounterType, encounter });

  searchPatients = () => {
    if (!this.encounters) {
      return;
    }

    const { encounterSearchDate, encounterSearchPatientName, encounterSearchType } = this.state;

    const criteria: any = {};

    if (encounterSearchType !== 'All') {
      criteria.encounterType = this.state.encounterSearchType.toLowerCase();
    }

    if (
      (encounterSearchType === 'All' || encounterSearchType === 'Patient') &&
      encounterSearchPatientName
    ) {
      criteria.patientName = new RegExp(escapeRegExp(this.state.encounterSearchPatientName), 'i');
    }

    const encounterSearchMoment = moment(encounterSearchDate);

    if (encounterSearchMoment.isValid()) {
      criteria.encounterDate = encounterSearchMoment.format('YYYY-MM-DD');
    }

    this.encounters.find(criteria).exec((err, docs) => {
      const encounters = chain(docs)
        .sortBy('patientName')
        .reverse()
        .sortBy(['encounterDate', 'createdAt'])
        .reverse()
        .slice(0, 50)
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
      this.state.encounterSearchDate !== prevState.encounterSearchDate ||
      this.state.encounterSearchPatientName !== prevState.encounterSearchPatientName ||
      this.state.encounterSearchType !== prevState.encounterSearchType
    ) {
      this.searchPatients();
    }
  }

  handleCancel = () => this.setState({ encounter: null, encounterForm: null });
  handleComplete = () => this.setState({ encounter: null, encounterForm: null });

  handleDeleteClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>, doc: any) => {
    e.preventDefault();
    e.stopPropagation();

    this.setState({ confirmDeletion: doc._id });
  };

  handleError = (error: Error | string) => this.setState({ error });

  render() {
    const {
      confirmDeletion,
      encounter,
      encounterForm,
      error,
      firstTimeSetup,
      reporting
    } = this.state;

    if (error) {
      return <ErrorMessage error={error} />;
    }

    if (firstTimeSetup) {
      return <FirstTimeSetup onComplete={() => this.setState({ firstTimeSetup: false })} />;
    }

    if (!this.encounters) {
      return null;
    }

    if (reporting) {
      return <Report onComplete={() => this.setState({ reporting: false })} />;
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

          {canSeeReporting() && (
            <Button onClick={() => this.setState({ reporting: true })} size="big">
              Reporting
            </Button>
          )}

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

          <Table id="encounter-table" selectable unstackable>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell width={1} />
                <Table.HeaderCell width={1}>
                  <Input
                    id="encounter-date-input"
                    onChange={(e, { value }) =>
                      this.setState({ encounterSearchDate: value as string })
                    }
                    type="date"
                    value={this.state.encounterSearchDate}
                  />
                </Table.HeaderCell>
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
                  <Table.Cell className="delete-cell" textAlign="center">
                    <Button
                      size="mini"
                      color="red"
                      onClick={(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) =>
                        this.handleDeleteClick(e, doc)
                      }
                    >
                      Delete
                    </Button>
                  </Table.Cell>
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

        <Confirm
          confirmButton={DELETE_BUTTON}
          content="Are you sure you want to delete this encounter?"
          onCancel={() => this.setState({ confirmDeletion: null })}
          onConfirm={() => {
            if (this.encounters) {
              this.encounters.remove({ _id: this.state.confirmDeletion }, {}, (err: Error) => {
                if (err) {
                  return this.setState({ error: err });
                }

                this.searchPatients();
                this.setState({ confirmDeletion: null });
              });
            }
          }}
          open={confirmDeletion !== null}
          size="large"
        />
      </React.Fragment>
    );
  }
}

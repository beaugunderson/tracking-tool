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
  Statistic,
  Table
} from 'semantic-ui-react';
import { chain, escapeRegExp } from 'lodash';
import { CommunityEncounterForm } from './forms/CommunityEncounterForm';
import { CrisisReport } from './reporting/CrisisReport';
import { DataAuditReport } from './reporting/DataAuditReport';
import { ENCOUNTER_TYPE_NAMES, ENCOUNTER_TYPES } from './options';
import { ensureUserDirectoryExists, rootPathExists } from './store';
import { ErrorMessage } from './ErrorMessage';
import { fieldNameToName, OtherEncounterForm } from './forms/OtherEncounterForm';
import { FirstTimeSetup } from './FirstTimeSetup';
import { GridReport } from './reporting/GridReport';
import { insertExamples } from './generate-data';
import { openEncounters } from './data';
import { PatientEncounter, PatientEncounterForm } from './forms/PatientEncounterForm';
import { Report } from './reporting/Report';
import { StaffEncounterForm } from './forms/StaffEncounterForm';
import { transformEncounter, transformEncounters } from './reporting/data';

const username = window.require('username');

function currentUserIn(users: string[]) {
  return users.indexOf(username.sync().toLowerCase()) !== -1;
}

const canSeeFakeEncounters = () => currentUserIn(['beau', 'carynstewart']);
const canSeeAuditReport = () => currentUserIn(['beau', 'carynstewart', 'lindce2']);
const canSeeReporting = () =>
  currentUserIn(['beau', 'carynstewart', 'johnss1', 'lindce2', 'nejash1', 'valejd1']);

const DELETE_BUTTON = <Button negative>Delete</Button>;

type AppState = {
  confirmDeletion: string | null;
  crisisReporting: boolean;
  dataAuditReporting: boolean;
  encounter: any;
  encounterForm: string | null;
  encounters: any[];
  encounterSearchDate: string;
  encounterSearchPatientName: string;
  encounterSearchType: string;
  error?: string | Error;
  firstTimeSetup: boolean;
  gads: number;
  gridReporting: boolean;
  mocas: number;
  phqs: number;
  reporting: boolean;
};

export class App extends React.Component<{}, AppState> {
  encounters?: Nedb;

  state: AppState = {
    confirmDeletion: null,
    crisisReporting: false,
    dataAuditReporting: false,
    encounter: null,
    encounterForm: null,
    encounters: [],
    encounterSearchDate: '',
    encounterSearchPatientName: '',
    encounterSearchType: 'All',
    firstTimeSetup: !rootPathExists(),
    gridReporting: false,
    gads: 0,
    mocas: 0,
    phqs: 0,
    reporting: false
  };

  editEncounter = (encounter: any) =>
    this.setState({ encounterForm: encounter.encounterType, encounter });

  searchPatients = () => {
    if (!this.encounters) {
      return;
    }

    const { encounterSearchDate, encounterSearchPatientName, encounterSearchType } = this.state;

    const criteria: any = {
      encounterType: { $exists: true }
    };

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

  updateAssessments() {
    this.encounters.find({}, (err: Error, results: PatientEncounter[]) => {
      if (err) {
        return;
      }

      const monthStart = moment().startOf('month');
      const monthEnd = moment().endOf('month');

      const monthEncounters = transformEncounters(results).filter(encounter => {
        return moment(encounter.encounterDate, 'YYYY-MM-DD').isBetween(
          monthStart,
          monthEnd,
          undefined,
          '[]'
        );
      });

      const gads = monthEncounters.filter(encounter => !!encounter.gad).length;
      const mocas = monthEncounters.filter(encounter => !!encounter.moca).length;
      const phqs = monthEncounters.filter(encounter => !!encounter.phq).length;

      this.setState({ gads, mocas, phqs });
    });
  }

  initialize() {
    ensureUserDirectoryExists();

    openEncounters((error, dataStore) => {
      if (error) {
        return this.setState({ error });
      }

      this.encounters = dataStore;

      this.searchPatients();
      this.updateAssessments();
    });
  }

  componentDidMount() {
    if (this.state.firstTimeSetup) {
      return;
    }

    this.initialize();
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
      this.updateAssessments();
    }
  }

  handleCancel = () => this.setState({ encounter: null, encounterForm: null });

  handleComplete = (error?: Error | string) => {
    this.setState({ encounter: null, encounterForm: null, error });
  };

  handleDeleteClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>, doc: any) => {
    e.preventDefault();
    e.stopPropagation();

    this.setState({ confirmDeletion: doc._id });
  };

  render() {
    const {
      confirmDeletion,
      crisisReporting,
      dataAuditReporting,
      encounter,
      encounterForm,
      error,
      firstTimeSetup,
      gads,
      gridReporting,
      mocas,
      phqs,
      reporting
    } = this.state;

    if (error) {
      return <ErrorMessage error={error} />;
    }

    if (firstTimeSetup) {
      return (
        <FirstTimeSetup
          onComplete={() => this.setState({ firstTimeSetup: false }, () => this.initialize())}
        />
      );
    }

    if (!this.encounters) {
      return null;
    }

    if (crisisReporting) {
      return <CrisisReport onComplete={() => this.setState({ crisisReporting: false })} />;
    }

    if (dataAuditReporting) {
      return <DataAuditReport onComplete={() => this.setState({ dataAuditReporting: false })} />;
    }

    if (gridReporting) {
      return (
        <GridReport onComplete={err => this.setState({ error: err, gridReporting: false })} />
      );
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
            <React.Fragment>
              <Divider hidden />

              <Button onClick={() => this.setState({ reporting: true })} size="big">
                Interactive Report
              </Button>

              <Button onClick={() => this.setState({ crisisReporting: true })} size="big">
                Crisis Report
              </Button>

              {canSeeAuditReport() && (
                <Button onClick={() => this.setState({ dataAuditReporting: true })} size="big">
                  Data Audit Report
                </Button>
              )}

              <Button onClick={() => this.setState({ gridReporting: true })} size="big">
                Monthly Report
              </Button>

              {canSeeFakeEncounters() && (
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
            </React.Fragment>
          )}
        </Segment>

        <Statistic.Group widths="3">
          <Statistic>
            <Statistic.Value>{phqs}</Statistic.Value>
            <Statistic.Label>PHQ assessments</Statistic.Label>
          </Statistic>

          <Statistic>
            <Statistic.Value>{gads}</Statistic.Value>
            <Statistic.Label>GAD assessments</Statistic.Label>
          </Statistic>

          <Statistic>
            <Statistic.Value>{mocas}</Statistic.Value>
            <Statistic.Label>MoCA assessments</Statistic.Label>
          </Statistic>
        </Statistic.Group>

        <Segment className="big-section last-section" inverted textAlign="center">
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
                    icon={
                      <Icon
                        link
                        name="delete"
                        onClick={() => this.setState({ encounterSearchPatientName: '' })}
                      />
                    }
                    id="encounter-patient-input"
                    fluid
                    onChange={(e, { value }) =>
                      this.setState({ encounterSearchPatientName: value })
                    }
                    placeholder="Search..."
                    value={this.state.encounterSearchPatientName}
                  />
                </Table.HeaderCell>
                <Table.HeaderCell width={2}>Clinic or Activity</Table.HeaderCell>
                <Table.HeaderCell width={2}>Time / Tasks</Table.HeaderCell>
              </Table.Row>
            </Table.Header>

            <Table.Body>
              {this.state.encounters.map((doc: any, i: number) => {
                const transformed = transformEncounter(doc);

                return (
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
                    <Table.Cell>
                      {ENCOUNTER_TYPE_NAMES[doc.encounterType] || 'Patient'}
                      &nbsp;&nbsp;&nbsp;
                      {(doc.encounterType === 'patient' || doc.encounterType === 'community') &&
                        !transformed.numberOfInterventions && (
                          <Icon color="orange" name="warning sign" />
                        )}
                      {(doc.gad || doc.phq || doc.moca) && <Icon name="clipboard check" />}
                    </Table.Cell>
                    <Table.Cell>{doc.patientName}</Table.Cell>
                    <Table.Cell>{doc.clinic || fieldNameToName(doc.activity)}</Table.Cell>
                    <Table.Cell>
                      {doc.timeSpent} {doc.numberOfTasks && `/ ${doc.numberOfTasks}`}
                    </Table.Cell>
                  </Table.Row>
                );
              })}
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

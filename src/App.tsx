import './App.scss';

import className from 'classnames';
import moment from 'moment';
import React from 'react';
import { Button, Confirm, Dropdown, Icon, Input, Statistic, Table } from 'semantic-ui-react';
import { chain, escapeRegExp, isEqual, sumBy } from 'lodash';
import { CommunityEncounterForm } from './forms/CommunityEncounterForm';
import { CrisisReport } from './reporting/CrisisReport';
import { DataAuditReport } from './reporting/DataAuditReport';
import { DATE_FORMAT_DATABASE, DATE_FORMAT_DISPLAY } from './constants';
import { ENCOUNTER_TYPE_NAMES, ENCOUNTER_TYPES } from './options';
import { ensureUserDirectoryExists, rootPathExists } from './store';
import { ErrorMessage } from './ErrorMessage';
import { fieldNameToName, OtherEncounterForm } from './forms/OtherEncounterForm';
import { FirstTimeSetup } from './FirstTimeSetup';
import { GridReport } from './reporting/GridReport';
import { insertExamples } from './generate-data';
import { InteractiveReport, ReportAudience } from './reporting/InteractiveReport';
import { LinkMrnReport } from './reporting/LinkMrnReport';
import { MENTAL_HEALTH_FIELD_NAMES } from './patient-interventions';
import { openEncounters } from './data';
import { PageLoader } from './components/PageLoader';
import { PatientEncounter, PatientEncounterForm } from './forms/PatientEncounterForm';
import { StaffEncounterForm } from './forms/StaffEncounterForm';
import { transformEncounter, transformEncounters } from './reporting/data';
import type Nedb from 'nedb';

const username = window.require('username');

function currentUserIn(users: string[]) {
  return users.indexOf(username.sync().toLowerCase()) !== -1;
}

const canSeeAuditReport = () => currentUserIn(['beau', 'carynstewart', 'lindce2']);
const canSeeReporting = () =>
  currentUserIn(['beau', 'carynstewart', 'johnss1', 'lindce2', 'nejash1', 'valejd1']);

const DELETE_BUTTON = <Button negative>Delete</Button>;

const DEFAULT_SEARCH_CRITERIA = {
  encounterType: { $exists: true },
};

enum Page {
  Encounters = 0,
  EncounterFormPatient,
  EncounterFormCommunity,
  EncounterFormStaff,
  EncounterFormOther,
  FirstTimeSetupPage,
  ReportAudit,
  ReportCrisis,
  ReportGrid,
  ReportInteractive,
  ReportLink,
}

// const FORM_PAGES = [
//   Page.EncounterFormCommunity,
//   Page.EncounterFormOther,
//   Page.EncounterFormPatient,
//   Page.EncounterFormStaff,
// ];

const REPORT_PAGES = [
  Page.ReportAudit,
  Page.ReportCrisis,
  Page.ReportGrid,
  Page.ReportInteractive,
  Page.ReportLink,
];

type AppState = {
  confirmDeletion: string | null;
  encounter: any;
  encounters: any[];
  encounterSearchDate: string;
  encounterSearchPatientName: string;
  encounterSearchType: string;
  error?: string | Error;
  gads: number;
  interventions?: number;
  mocas: number;
  page: Page;
  phqs: number;
  // showFormNavigation: boolean;
  showReportNavigation: boolean;
  status: string[];
};

export class App extends React.Component<{}, AppState> {
  encounters?: Nedb;

  state: AppState = {
    confirmDeletion: null,
    encounter: null,
    encounters: [],
    encounterSearchDate: '',
    encounterSearchPatientName: '',
    encounterSearchType: 'All',
    page: rootPathExists() ? Page.Encounters : Page.FirstTimeSetupPage,
    interventions: 0,
    gads: 0,
    mocas: 0,
    phqs: 0,
    // showFormNavigation: false,
    showReportNavigation: false,
    status: [],
  };

  handleReportsClick = () =>
    this.setState((state) => ({ showReportNavigation: !state.showReportNavigation }));

  encounterToPage(encounter: any): Page {
    switch (encounter.encounterType) {
      case 'patient':
        return Page.EncounterFormPatient;

      case 'community':
        return Page.EncounterFormCommunity;

      case 'staff':
        return Page.EncounterFormStaff;

      case 'other':
        return Page.EncounterFormOther;

      default:
        throw new Error(`Unknown encounter type: ${encounter.encounterType}`);
    }
  }

  editEncounter = (encounter: any) =>
    this.setState({ page: this.encounterToPage(encounter), encounter });

  searchPatients = () => {
    if (!this.encounters) {
      return;
    }

    const { encounterSearchDate, encounterSearchPatientName, encounterSearchType } = this.state;

    const criteria: {
      encounterType?: string | { $exists: boolean };
      patientName?: RegExp;
      encounterDate?: string;
    } = {
      ...DEFAULT_SEARCH_CRITERIA,
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
      criteria.encounterDate = encounterSearchMoment.format(DATE_FORMAT_DATABASE);
    }

    const resultsToReturn = isEqual(DEFAULT_SEARCH_CRITERIA, criteria) ? 50 : 500;

    this.encounters.find(criteria).exec((err, docs) => {
      const encounters = chain(docs)
        .sortBy('patientName')
        .reverse()
        .sortBy(['encounterDate', 'createdAt'])
        .reverse()
        .slice(0, resultsToReturn)
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

      const monthEncounters = transformEncounters(results).filter((encounter) => {
        return encounter.parsedEncounterDate.isBetween(monthStart, monthEnd, undefined, '[]');
      });

      const gads = monthEncounters.filter((encounter) => !!encounter.gad).length;
      const mocas = monthEncounters.filter((encounter) => !!encounter.moca).length;
      const phqs = monthEncounters.filter((encounter) => !!encounter.phq).length;

      const interventions = sumBy(monthEncounters, (encounter) =>
        sumBy(MENTAL_HEALTH_FIELD_NAMES, (field) => (encounter[field] ? 1 : 0))
      );

      this.setState({ gads, mocas, phqs, interventions });
    });
  }

  appendStatus = (line: string) =>
    this.setState((state) => ({
      status: [...state.status, line],
    }));

  initialize(cb = () => {}) {
    ensureUserDirectoryExists(this.appendStatus);

    openEncounters((error, dataStore) => {
      if (error) {
        return this.setState({ error });
      }

      this.appendStatus('Setting encounters');

      this.encounters = dataStore;

      // @ts-ignore
      window.createFakeEncounters = () => insertExamples(this.encounters);

      this.appendStatus('Initializing search state');
      this.searchPatients();

      this.appendStatus('Updating assessments');
      this.updateAssessments();

      cb();
    }, this.appendStatus);
  }

  componentDidMount() {
    if (this.state.page === Page.FirstTimeSetupPage) {
      return;
    }

    this.initialize();
  }

  componentDidUpdate(prevProps: any, prevState: AppState) {
    // scroll to top when we come back
    if (this.state.page !== prevState.page) {
      window.scroll({
        top: 0,
        left: 0,
      });
    }

    if (
      (this.state.page === Page.Encounters && prevState.page !== Page.Encounters) ||
      this.state.encounterSearchDate !== prevState.encounterSearchDate ||
      this.state.encounterSearchPatientName !== prevState.encounterSearchPatientName ||
      this.state.encounterSearchType !== prevState.encounterSearchType
    ) {
      this.searchPatients();
      this.updateAssessments();
    }
  }

  handleCancel = () => this.setState({ encounter: null, page: Page.Encounters });

  handleComplete = (error?: Error | string) => {
    this.setState({ encounter: null, page: Page.Encounters, error });
  };

  handleDeleteClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>, doc: any) => {
    e.preventDefault();
    e.stopPropagation();

    this.setState({ confirmDeletion: doc._id });
  };

  handleFirstTimeSetupComplete = () =>
    this.initialize(() => this.setState({ page: Page.Encounters }));

  renderPage() {
    const { encounter, page, error, status } = this.state;

    if (error) {
      return <ErrorMessage error={error} />;
    }

    if (!this.encounters) {
      return <PageLoader status={status} />;
    }

    switch (page) {
      case Page.ReportCrisis:
        return <CrisisReport />;

      case Page.ReportAudit:
        return <DataAuditReport />;

      case Page.ReportGrid:
        return <GridReport />;

      case Page.ReportLink:
        return <LinkMrnReport />;

      case Page.ReportInteractive:
        return (
          <InteractiveReport
            audience={canSeeReporting() ? ReportAudience.ADMINISTRATOR : ReportAudience.INDIVIDUAL}
            username={username.sync().toLowerCase()}
          />
        );

      case Page.EncounterFormPatient:
        return (
          <PatientEncounterForm
            encounter={encounter}
            encounters={this.encounters}
            onCancel={this.handleCancel}
            onComplete={this.handleComplete}
          />
        );

      case Page.EncounterFormCommunity:
        return (
          <CommunityEncounterForm
            encounter={encounter}
            encounters={this.encounters}
            onCancel={this.handleCancel}
            onComplete={this.handleComplete}
          />
        );

      case Page.EncounterFormStaff:
        return (
          <StaffEncounterForm
            encounter={encounter}
            encounters={this.encounters}
            onCancel={this.handleCancel}
            onComplete={this.handleComplete}
          />
        );

      case Page.EncounterFormOther:
        return (
          <OtherEncounterForm
            encounter={encounter}
            encounters={this.encounters}
            onCancel={this.handleCancel}
            onComplete={this.handleComplete}
          />
        );

      default:
        return this.renderEncounters();
    }
  }

  // TODO: add switching logic here (e.g. if form has been touched require confirmation)
  handlePageChange = (page: Page) => {
    this.setState({
      page,
      // showFormNavigation: FORM_PAGES.includes(page),
      showReportNavigation: REPORT_PAGES.includes(page),
    });
  };

  handlePatientEncounterFormClick = () => this.handlePageChange(Page.EncounterFormPatient);
  handleCommunityEncounterFormClick = () => this.handlePageChange(Page.EncounterFormCommunity);
  handleStaffEncounterFormClick = () => this.handlePageChange(Page.EncounterFormStaff);
  handleOtherEncounterFormClick = () => this.handlePageChange(Page.EncounterFormOther);

  handleEncountersClick = () => this.handlePageChange(Page.Encounters);

  handleAuditReportClick = () => this.handlePageChange(Page.ReportAudit);
  handleCrisisReportClick = () => this.handlePageChange(Page.ReportCrisis);
  handleGridReportClick = () => this.handlePageChange(Page.ReportGrid);
  handleInteracticeReportClick = () => this.handlePageChange(Page.ReportInteractive);
  handleLinkMrnReportClick = () => this.handlePageChange(Page.ReportLink);

  render() {
    const { page, showReportNavigation } = this.state;

    if (page === Page.FirstTimeSetupPage) {
      return <FirstTimeSetup onComplete={this.handleFirstTimeSetupComplete} />;
    }

    return (
      <>
        <div
          className={className({
            // 'show-sub-navigation': showFormNavigation || showReportNavigation,
            'show-sub-navigation': showReportNavigation,
          })}
          key="page-body"
          id="page-body"
        >
          {this.renderPage()}
        </div>

        <div id="navigation-wrapper" key="navigation-wrapper">
          <div id="navigation">
            <div
              className={className('navigation-button', {
                active: page === Page.Encounters,
              })}
              onClick={this.handleEncountersClick}
            >
              <Icon name="calendar alternate outline" />
              Encounters
            </div>

            <div className="spacer" />

            <div
              className={className('navigation-button', {
                active: page === Page.EncounterFormPatient,
              })}
              onClick={this.handlePatientEncounterFormClick}
            >
              <Icon name="user" />
              Patient
            </div>

            <div
              className={className('navigation-button', {
                active: page === Page.EncounterFormCommunity,
              })}
              onClick={this.handleCommunityEncounterFormClick}
            >
              <Icon name="phone" />
              Community
            </div>

            <div
              className={className('navigation-button', {
                active: page === Page.EncounterFormStaff,
              })}
              onClick={this.handleStaffEncounterFormClick}
            >
              <Icon name="user md" />
              Staff
            </div>

            <div
              className={className('navigation-button', {
                active: page === Page.EncounterFormOther,
              })}
              onClick={this.handleOtherEncounterFormClick}
            >
              <Icon name="clock" />
              Other
            </div>

            <div className="spacer" />

            <div
              className={className('navigation-button', { active: showReportNavigation })}
              onClick={this.handleReportsClick}
            >
              <Icon name="paperclip" />
              Reports
            </div>
          </div>

          {/* TODO: is this preferable to the buttons at the bottom? */}
          {/* {showFormNavigation && !showReportNavigation && (
            <div id="form-navigation">
              <div className="spacer" />

              <div className="navigation-button save" onClick={() => null}>
                Save Encounter
              </div>

              <div className="navigation-button reset" onClick={() => null}>
                Reset
              </div>

              <div className="spacer" />
            </div>
          )} */}

          {showReportNavigation && (
            <div id="report-navigation">
              <div className="spacer" />

              <div
                className={className('navigation-button', {
                  active: page === Page.ReportInteractive,
                })}
                onClick={this.handleInteracticeReportClick}
              >
                Interactive Report
              </div>

              {canSeeReporting() && (
                <>
                  <div
                    className={className('navigation-button', {
                      active: page === Page.ReportCrisis,
                    })}
                    onClick={this.handleCrisisReportClick}
                  >
                    Crisis Report
                  </div>

                  {canSeeAuditReport() && (
                    <div
                      className={className('navigation-button', {
                        active: page === Page.ReportAudit,
                      })}
                      onClick={this.handleAuditReportClick}
                    >
                      Data Audit Report
                    </div>
                  )}

                  <div
                    className={className('navigation-button', {
                      active: page === Page.ReportGrid,
                    })}
                    onClick={this.handleGridReportClick}
                  >
                    Monthly Report
                  </div>

                  <div
                    className={className('navigation-button', {
                      active: page === Page.ReportLink,
                    })}
                    onClick={this.handleLinkMrnReportClick}
                  >
                    Link MRN Report
                  </div>
                </>
              )}

              <div className="spacer" />
            </div>
          )}
        </div>
      </>
    );
  }

  renderEncounters() {
    const { confirmDeletion, gads, interventions, mocas, phqs } = this.state;

    return (
      <>
        <Statistic.Group widths="4">
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

          <Statistic>
            <Statistic.Value>{interventions}</Statistic.Value>
            <Statistic.Label>Intervention Techniques</Statistic.Label>
          </Statistic>
        </Statistic.Group>

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
                  onChange={(e, { value }) => this.setState({ encounterSearchPatientName: value })}
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
                      color="red"
                      icon
                      onClick={(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) =>
                        this.handleDeleteClick(e, doc)
                      }
                      size="mini"
                    >
                      <Icon name="delete" />
                    </Button>
                  </Table.Cell>
                  <Table.Cell>
                    {transformed.parsedEncounterDate.format(DATE_FORMAT_DISPLAY)}
                  </Table.Cell>
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

        <Confirm
          confirmButton={DELETE_BUTTON}
          content="Are you sure you want to delete this encounter?"
          onCancel={() => this.setState({ confirmDeletion: null })}
          onConfirm={() => {
            if (this.encounters) {
              this.encounters.remove(
                { _id: this.state.confirmDeletion },
                {},
                (err: Error | null) => {
                  if (err) {
                    return this.setState({ error: err });
                  }

                  this.searchPatients();
                  this.setState({ confirmDeletion: null });
                }
              );
            }
          }}
          open={confirmDeletion !== null}
          size="large"
        />
      </>
    );
  }
}

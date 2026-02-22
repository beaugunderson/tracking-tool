import './App.scss';

import className from 'classnames';
import moment from 'moment';
import React from 'react';
import { Button, Confirm, Dropdown, Icon, Input, Statistic, Table } from 'semantic-ui-react';
import { chain, sumBy } from 'lodash';
import { ChooseUserForm } from './ChooseUserForm';
import { CommunityEncounterForm } from './forms/CommunityEncounterForm';
import { CrisisReport } from './reporting/CrisisReport';
import { DataAuditReport } from './reporting/DataAuditReport';
import { DATE_FORMAT_DATABASE, DATE_FORMAT_DISPLAY } from './constants';
import { ENCOUNTER_TYPE_NAMES, ENCOUNTER_TYPES } from './options';
import { ensureUserDirectoryExists, initStore, rootPathExists } from './store';
import { ErrorMessage } from './ErrorMessage';
import { fieldNameToName, OtherEncounterForm } from './forms/OtherEncounterForm';
import { FindBar } from './components/FindBar';
import { FirstTimeSetup } from './FirstTimeSetup';
import { GridReport } from './reporting/GridReport';
import { InteractiveReport, ReportAudience } from './reporting/InteractiveReport';
import { LinkMrnReport } from './reporting/LinkMrnReport';
import { MENTAL_HEALTH_FIELD_NAMES } from './patient-interventions';
import { PageLoader } from './components/PageLoader';
import { PatientEncounter, PatientEncounterForm } from './forms/PatientEncounterForm';
import { StaffEncounterForm } from './forms/StaffEncounterForm';
import { transformEncounter, transformEncounters } from './reporting/data';

function currentUserIn(users: string[]) {
  return users.indexOf(window.trackingTool.username) !== -1;
}

const canSeeAuditReport = () => currentUserIn(['beau', 'carynstewart', 'lindce2']);

const canSeeReporting = () =>
  currentUserIn([
    'beau',
    'carynstewart',
    'johnss1',
    'lindce2',
    'nejash1',
    'nordje1',
    'steven.robinson',
    'valejd1',
  ]);

const DELETE_BUTTON = <Button negative>Delete</Button>;

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
  ChooseUser,
}

const REPORT_PAGES = [
  Page.ReportAudit,
  Page.ReportCrisis,
  Page.ReportGrid,
  Page.ReportInteractive,
  Page.ReportLink,
];

type AppState = {
  confirmDeletion: string | null;
  dbReady: boolean;
  encounter: any;
  encounters: any[];
  encounterSearchDate: string;
  encounterSearchPatientName: string;
  encounterSearchType: string;
  error?: string | Error;
  gads: number;
  interventions?: number;
  loading: boolean;
  mocas: number;
  page: Page;
  phqs: number;
  showReportNavigation: boolean;
  status: string[];
  username: string;
};

function firstPage(): Page {
  if (!rootPathExists()) {
    return Page.FirstTimeSetupPage;
  }

  if (currentUserIn(['beau', 'carynstewart', 'lindce2'])) {
    return Page.ChooseUser;
  }

  return Page.Encounters;
}

export class App extends React.Component<{}, AppState> {
  state: AppState = {
    confirmDeletion: null,
    dbReady: false,
    encounter: null,
    encounters: [],
    encounterSearchDate: '',
    encounterSearchPatientName: '',
    encounterSearchType: 'All',
    loading: true,
    page: Page.Encounters,
    interventions: 0,
    gads: 0,
    mocas: 0,
    phqs: 0,
    showReportNavigation: false,
    status: [],
    username: window.trackingTool.username,
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

  searchPatients = async () => {
    const { encounterSearchDate, encounterSearchPatientName, encounterSearchType } = this.state;

    const encounterSearchMoment = moment(encounterSearchDate);

    const isDefaultCriteria =
      encounterSearchType === 'All' &&
      !encounterSearchPatientName &&
      !encounterSearchMoment.isValid();

    try {
      const docs = await window.trackingTool.dbSearch({
        encounterType: encounterSearchType,
        patientNamePattern:
          encounterSearchType === 'All' || encounterSearchType === 'Patient'
            ? encounterSearchPatientName
            : undefined,
        encounterDate: encounterSearchMoment.isValid()
          ? encounterSearchMoment.format(DATE_FORMAT_DATABASE)
          : undefined,
      });

      const resultsToReturn = isDefaultCriteria ? 50 : 500;

      const encounters = chain(docs)
        .sortBy('patientName')
        .reverse()
        .sortBy(['encounterDate', 'createdAt'])
        .reverse()
        .slice(0, resultsToReturn)
        .value();

      this.setState({ encounters });
    } catch (err) {
      this.setState({ error: err as Error });
    }
  };

  async updateAssessments() {
    try {
      const results: PatientEncounter[] = await window.trackingTool.dbFindAll();

      const monthStart = moment().startOf('month');
      const monthEnd = moment().endOf('month');

      const monthEncounters = transformEncounters(results).filter((encounter) => {
        return encounter.parsedEncounterDate.isBetween(monthStart, monthEnd, undefined, '[]');
      });

      const gads = monthEncounters.filter((encounter) => !!encounter.gad).length;
      const mocas = monthEncounters.filter((encounter) => !!encounter.moca).length;
      const phqs = monthEncounters.filter((encounter) => !!encounter.phq).length;

      const interventions = sumBy(monthEncounters, (encounter) =>
        sumBy(MENTAL_HEALTH_FIELD_NAMES, (field) => (encounter[field] ? 1 : 0)),
      );

      this.setState({ gads, mocas, phqs, interventions });
    } catch {
      // ignore errors in assessment update
    }
  }

  appendStatus = (line: string) =>
    this.setState((state) => ({
      status: [...state.status, line],
    }));

  async initialize() {
    try {
      await ensureUserDirectoryExists(this.state.username, this.appendStatus);

      this.appendStatus('Opening encounters database');
      await window.trackingTool.dbOpen(this.state.username);

      if (this.state.username === 'beau') {
        // @ts-ignore
        window.createFakeEncounters = async () =>
          (await import('./generate-data')).insertExamples();
      }

      this.appendStatus('Initializing search state');
      await this.searchPatients();

      this.appendStatus('Updating assessments');
      await this.updateAssessments();

      this.setState({ dbReady: true });
    } catch (error) {
      this.setState({ error: error as Error });
    }
  }

  async componentDidMount() {
    await initStore();

    const page = firstPage();

    if (page === Page.FirstTimeSetupPage || page === Page.ChooseUser) {
      this.setState({ page, loading: false });
      return;
    }

    this.setState({ page, loading: false });
    await this.initialize();
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
    this.initialize().then(() => this.setState({ page: Page.Encounters }));

  handleChooseUserComplete = (name: string) =>
    this.setState({ username: name }, () =>
      this.initialize().then(() => this.setState({ page: Page.Encounters, username: name })),
    );

  renderPage() {
    const { encounter, page, error, status, dbReady } = this.state;

    if (error) {
      return <ErrorMessage error={error} />;
    }

    if (!dbReady) {
      return <PageLoader status={status} />;
    }

    const userName = window.trackingTool.username;

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
            username={userName}
          />
        );

      case Page.EncounterFormPatient:
        return (
          <PatientEncounterForm
            encounter={encounter}
            onCancel={this.handleCancel}
            onComplete={this.handleComplete}
            username={userName}
          />
        );

      case Page.EncounterFormCommunity:
        return (
          <CommunityEncounterForm
            encounter={encounter}
            onCancel={this.handleCancel}
            onComplete={this.handleComplete}
          />
        );

      case Page.EncounterFormStaff:
        return (
          <StaffEncounterForm
            encounter={encounter}
            onCancel={this.handleCancel}
            onComplete={this.handleComplete}
          />
        );

      case Page.EncounterFormOther:
        return (
          <OtherEncounterForm
            encounter={encounter}
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
    const { page, loading, showReportNavigation } = this.state;

    if (loading) {
      return <PageLoader />;
    }

    if (page === Page.FirstTimeSetupPage) {
      return <FirstTimeSetup onComplete={this.handleFirstTimeSetupComplete} />;
    }

    if (page === Page.ChooseUser) {
      return <ChooseUserForm onComplete={this.handleChooseUserComplete} />;
    }

    return (
      <>
        <FindBar />

        <div
          className={className({
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
                    Intervention Report
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

                  {canSeeAuditReport() && (
                    <div
                      className={className('navigation-button', {
                        active: page === Page.ReportLink,
                      })}
                      onClick={this.handleLinkMrnReportClick}
                    >
                      Link MRN Report
                    </div>
                  )}
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
          onConfirm={async () => {
            try {
              await window.trackingTool.dbRemove({ _id: this.state.confirmDeletion });
              await this.searchPatients();
              this.setState({ confirmDeletion: null });
            } catch (err) {
              this.setState({ error: err as Error });
            }
          }}
          open={confirmDeletion !== null}
          size="large"
        />
      </>
    );
  }
}

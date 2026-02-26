import React from 'react';
import { ENCOUNTER_TYPE_NAMES } from '../options';
import {
  EXCLUDE_STRING_VALUE,
  type ReportProgress,
  type TransformedEncounter,
} from '../../../shared/transform';
import { FIRST_TRACKING_DATE, OLDEST_POSSIBLE_AGE } from '../constants';
import { formatDisplay } from '../../../shared/date-utils';
import { Icon, Table } from 'semantic-ui-react';
import { isAfter, isBefore, subYears } from 'date-fns';
import { PageLoader } from '../components/PageLoader';
import { sortBy } from 'lodash';
import { transform } from './load-encounters';
import { usernameToName } from '../usernames';

interface DataAuditReportProps {}

interface DataAuditReportState {
  encounters: TransformedEncounter[] | null;
  loadError?: string | null;
  loadProgress?: ReportProgress | null;
  loadStartTime?: number;
}

export class DataAuditReport extends React.Component<DataAuditReportProps, DataAuditReportState> {
  state: DataAuditReportState = {
    encounters: null,
  };

  handleCopyClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    window.trackingTool.writeClipboard(e.currentTarget.dataset.text!);
  };

  async componentDidMount() {
    this.setState({ loadStartTime: Date.now() });
    try {
      const encounters = await transform(true, true, (loadProgress) =>
        this.setState({ loadProgress }),
      );
      this.setState({ encounters, loadProgress: null });
    } catch (err) {
      this.setState({ loadError: err instanceof Error ? err.message : String(err) });
    }
  }

  render() {
    const { encounters } = this.state;

    if (!encounters) {
      return (
        <PageLoader
          error={this.state.loadError}
          progress={this.state.loadProgress}
          startTime={this.state.loadStartTime}
        />
      );
    }

    const now = new Date();

    function abnormalDateOfBirth(encounter: TransformedEncounter) {
      if (encounter.encounterType !== 'patient') {
        return false;
      }

      return (
        (encounter.parsedDateOfBirth &&
          isAfter(
            subYears(encounter.parsedEncounterDate, OLDEST_POSSIBLE_AGE),
            encounter.parsedDateOfBirth,
          )) ||
        isAfter(encounter.parsedEncounterDate, now)
      );
    }

    function abnormalEncounterDate(encounter: TransformedEncounter) {
      return (
        isAfter(encounter.parsedEncounterDate, now) ||
        isBefore(encounter.parsedEncounterDate, FIRST_TRACKING_DATE)
      );
    }

    function abnormalInterventions(encounter: TransformedEncounter) {
      return encounter.numberOfInterventions === 0;
    }

    function abnormalNumberOfTasks(encounter: TransformedEncounter) {
      return encounter.parsedNumberOfTasks >= 10;
    }

    function abnormalTimeSpent(encounter: TransformedEncounter) {
      return encounter.timeSpentHours > 200 / 60;
    }

    const abnormalEncounters = sortBy(
      encounters.filter((encounter) => {
        if (encounter.encounterType !== 'patient' && encounter.encounterType !== 'other') {
          return false;
        }

        return (
          abnormalDateOfBirth(encounter) ||
          abnormalEncounterDate(encounter) ||
          abnormalInterventions(encounter) ||
          abnormalNumberOfTasks(encounter) ||
          abnormalTimeSpent(encounter)
        );
      }),
      'parsedEncounterDate',
    ).reverse();

    return (
      <>
        <h2>{abnormalEncounters.length} abnormal entries</h2>

        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Type</Table.HeaderCell>
              <Table.HeaderCell>Social Worker</Table.HeaderCell>
              <Table.HeaderCell>Encounter Date</Table.HeaderCell>
              <Table.HeaderCell>Date of Birth</Table.HeaderCell>
              <Table.HeaderCell>Providence MRN</Table.HeaderCell>
              <Table.HeaderCell>MRN</Table.HeaderCell>
              <Table.HeaderCell>Location</Table.HeaderCell>
              <Table.HeaderCell>Clinic</Table.HeaderCell>
              <Table.HeaderCell>Interventions</Table.HeaderCell>
              <Table.HeaderCell>Tasks</Table.HeaderCell>
              <Table.HeaderCell>Time Spent</Table.HeaderCell>
            </Table.Row>
          </Table.Header>

          <Table.Body>
            {abnormalEncounters.map((encounter, index) => (
              <Table.Row key={index}>
                <Table.Cell>{ENCOUNTER_TYPE_NAMES[encounter.encounterType]}</Table.Cell>
                <Table.Cell>{usernameToName(encounter.username)}</Table.Cell>
                <Table.Cell negative={abnormalEncounterDate(encounter)}>
                  {formatDisplay(encounter.parsedEncounterDate)}
                </Table.Cell>
                <Table.Cell negative={abnormalDateOfBirth(encounter)}>
                  {encounter.formattedDateOfBirth}
                </Table.Cell>
                <Table.Cell>
                  {encounter.encounterType === 'patient' && (
                    <button
                      className="button-link"
                      data-text={encounter.providenceMrn}
                      onClick={this.handleCopyClick}
                      type="button"
                    >
                      {encounter.providenceMrn === EXCLUDE_STRING_VALUE
                        ? ''
                        : encounter.providenceMrn}{' '}
                      <Icon name="copy" />
                    </button>
                  )}
                </Table.Cell>
                <Table.Cell>
                  {encounter.encounterType === 'patient' && (
                    <button
                      className="button-link"
                      data-text={encounter.mrn}
                      onClick={this.handleCopyClick}
                      type="button"
                    >
                      {encounter.mrn === EXCLUDE_STRING_VALUE ? '' : encounter.mrn}{' '}
                      <Icon name="copy" />
                    </button>
                  )}
                </Table.Cell>
                <Table.Cell>{encounter.location}</Table.Cell>
                <Table.Cell>{encounter.clinic}</Table.Cell>
                <Table.Cell negative={abnormalInterventions(encounter)}>
                  {encounter.encounterType === 'patient' && encounter.numberOfInterventions}
                </Table.Cell>
                <Table.Cell negative={abnormalNumberOfTasks(encounter)}>
                  {encounter.numberOfTasks}
                </Table.Cell>
                <Table.Cell negative={abnormalTimeSpent(encounter)}>
                  {encounter.timeSpent}
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </>
    );
  }
}

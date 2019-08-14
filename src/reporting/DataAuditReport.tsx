import moment from 'moment';
import React from 'react';
import { Button, Icon, Table } from 'semantic-ui-react';
import { DATE_FORMAT_DISPLAY, FIRST_TRACKING_DATE, OLDEST_POSSIBLE_AGE } from '../constants';
import { ENCOUNTER_TYPE_NAMES } from '../options';
import { EXCLUDE_STRING_VALUE, transform, TransformedEncounter } from './data';
import { sortBy } from 'lodash';
import { usernameToName } from '../usernames';

const { clipboard } = window.require('electron');

interface DataAuditReportProps {
  onComplete: () => void;
}

interface DataAuditReportState {
  encounters: TransformedEncounter[] | null;
}

export class DataAuditReport extends React.Component<DataAuditReportProps, DataAuditReportState> {
  state: DataAuditReportState = {
    encounters: null
  };

  async componentDidMount() {
    this.setState({ encounters: await transform() });
  }

  render() {
    const { encounters } = this.state;

    if (!encounters) {
      return null;
    }

    const now = moment();

    function abnormalDateOfBirth(encounter: TransformedEncounter) {
      if (encounter.encounterType !== 'patient') {
        return false;
      }

      return encounter.parsedEncounterDate
        .clone()
        .subtract(OLDEST_POSSIBLE_AGE, 'years')
        .isAfter(encounter.parsedDateOfBirth);
    }

    function abnormalEncounterDate(encounter: TransformedEncounter) {
      return (
        encounter.parsedEncounterDate.isAfter(now) ||
        encounter.parsedEncounterDate.isBefore(FIRST_TRACKING_DATE)
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
      encounters.filter(encounter => {
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
      'parsedEncounterDate'
    ).reverse();

    return (
      <>
        <div>
          <Button onClick={() => this.props.onComplete()}>Back</Button>
        </div>

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
                  {encounter.parsedEncounterDate.format(DATE_FORMAT_DISPLAY)}
                </Table.Cell>
                <Table.Cell negative={abnormalDateOfBirth(encounter)}>
                  {encounter.formattedDateOfBirth}
                </Table.Cell>
                <Table.Cell>
                  {encounter.encounterType === 'patient' && (
                    <button
                      className="button-link"
                      onClick={() => clipboard.writeText(encounter.providenceMrn)}
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
                      onClick={() => clipboard.writeText(encounter.mrn)}
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
